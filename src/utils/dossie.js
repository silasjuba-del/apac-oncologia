// ─────────────────────────────────────────────────────────────────────────────
// dossie.js — Lógica de dossiê: criação, texto evolução, APAC, agentes e IA
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { NOW, TODAY, limparMarkdown } from '../components/ui/primitives';
import { getCIDPorSede, getCID, AUTOR, HOSP } from '../utils/constants';
import {
  coletarExamesRealizados, formatarLinhaExameRealizado, ordemDataExame,
  primeiraMaiuscula, limparPlaceholderConsulta, extrairValorResumo,
  extrairEvolucaoIA, extrairCamposIA,
} from './parse';
import { chamarClaude } from './api';

const criarDossieInicial=pac=>({
  id:"DOS-"+Date.now(),
  status:"pre_consulta",
  paciente:{...(pac||{})},
  recepcao:{conferido:false,conferidoEm:null,observacoes:""},
  documentos:[],
  resumoClaude:"",
  evolucao:{rascunho:"",textoFinal:"",salvaEm:null},
  documentosGerados:[],
  apac:{campos:{},pendencias:[],riscoGlosa:"alto"},
  createdAt:NOW(),
  updatedAt:NOW(),
});
function gerarTextoEvolucao(dossie){
  const p=dossie?.paciente||{};
  const v=x=>{
    const t=limparPlaceholderConsulta(x).trim();
    if(!t)return "";
    if(/^(—|-|nao informado|não informado|não identificado|nao identificado|a definir|adefinir|sem dados)$/i.test(t))return "";
    if(/:\s*(—|-|nao informado|não informado|não identificado|nao identificado)\s*$/i.test(t))return "";
    if(/^(sintomas marcados|pessoais\/patol[oó]gicos|cirurgias pr[eé]vias|vacinas?|hist[oó]rico familiar|medica[cç][oõ]es.*|alergias?)\s*[:\-]?\s*(—|-|nao informado|não informado|não identificado|nao identificado)?$/i.test(t))return "";
    return t;
  };
  const linha=(label,value)=>`${label}: ${v(value)}`;
  const fonteResumo=[dossie?.resumoClaude,p.docs_ia_resumo,p.obs_ia,...((dossie?.documentos||[]).map(x=>x?.resumo||""))].filter(Boolean).join("\n\n");
  const campo=(valor,rotulos=[])=>v(valor)||v(extrairValorResumo(fonteResumo,rotulos));
  const sedeCID=getCIDPorSede(p.local_cancer||"");
  const diag=campo(p.diag,["diagnóstico","diagnostico","histologia","tipo de tumor"])||(v(p.local_cancer)?(sedeCID?.sede?"Neoplasia de "+sedeCID.sede:p.local_cancer):"");
  const cid=campo(p.cid||p.cid_sugerido,["cid-10","cid"])||sedeCID?.cid||getCID(diag)||"";
  const estadio=campo(p.estadio,["estágio","estagio","estadiamento"]);
  const tnm=campo(p.tnm,["tnm"]);
  const subtipo=campo(p.subtipo||p.grau_hist,["subtipo","subtipo molecular","histologia","grau histológico","grau histologico"]);
  const ecog=campo(p.ecog,["ecog"]);
  const biomarcadores=[
    v(p.re)&&`RE ${v(p.re)}`,
    v(p.rp)&&`RP ${v(p.rp)}`,
    v(p.her2)&&`HER2 ${v(p.her2)}`,
    v(p.ki67)&&`Ki-67 ${v(p.ki67)}`,
    campo(p.bio,["biomarcadores","biomarcador"]),
  ].filter(Boolean).join(" | ");
  const examesRealizados=coletarExamesRealizados(dossie,p);
  const exLinhas=examesRealizados
    .sort((a,b)=>ordemDataExame(a.data)-ordemDataExame(b.data))
    .map(formatarLinhaExameRealizado)
    .filter(l=>!/(DADOS DEMOGR|ANTECEDENTES E MEDICA|RESUMO IA|PRIMEIRA CONSULTA|IDENTIFICA|M[ée]dico Respons[aá]vel|CRM-PB)/i.test(l));
  const labs=(p.exames_lab||[])[0]?.valores||{};
  const labStr=[
    (labs.Hgb||labs.hgb||labs.HB)&&"Hb "+(labs.Hgb||labs.hgb||labs.HB),
    (labs.Neutro||labs.neutro)&&"Neut. "+(labs.Neutro||labs.neutro),
    (labs.PLT||labs.plt)&&"Plt "+(labs.PLT||labs.plt),
    (labs.Creat||labs.creat)&&"Creat. "+(labs.Creat||labs.creat),
    (labs.TGO||labs.tgo)&&"TGO "+(labs.TGO||labs.tgo),
    (labs.TGP||labs.tgp)&&"TGP "+(labs.TGP||labs.tgp),
  ].filter(Boolean).join(" · ");
  if(labStr) exLinhas.push("LABORATÓRIO - Rotina - "+labStr);
  const tituloOnco=["DADOS ONCOLÓGICOS",diag&&diag.toUpperCase(),subtipo&&subtipo.toUpperCase(),estadio&&("ESTÁGIO "+estadio.toUpperCase())].filter(Boolean).join(" - ");
  const pendencias=[
    !v(cid)&&"Confirmar CID-10",
    !v(estadio||tnm)&&"Confirmar estadiamento",
    !exLinhas.length&&"Anexar laudos/exames",
    ...(dossie?.apac?.pendencias||[]).slice(0,4),
  ].filter(Boolean);
  const sugestoes=[
    v(diag)&&`Revisar aderência da conduta ao diagnóstico ${diag}`,
    v(p.trat)&&`Conferir protocolo ${p.trat}`,
    v(ecog)&&`Considerar ECOG ${ecog} na decisão terapêutica`,
  ].filter(Boolean);

  return limparPlaceholderConsulta([
    "DADOS ANAGRÁFICOS",
    linha("Nome",p.nome),
    linha("Data de nascimento",p.nasc),
    linha("CPF",p.cpf),
    linha("CNS",p.cns),
    linha("Nome da mãe",p.mae),
    linha("Sexo",p.sexo),
    linha("Raça/cor",p.raca),
    linha("Naturalidade",p.naturalidade||p.cidade||p.municipio),
    linha("Telefone",p.whatsapp||p.tel||p.telefone),
    "",
    "RESUMO CLÍNICO",
    "",
    "DADOS CLÍNICOS",
    linha("Queixa",campo(p.queixa,["queixa","queixa principal"])),
    linha("Antecedentes patológicos",campo(p.antec,["antecedentes","antecedentes patológicos","antecedentes patologicos","pessoais/patológicos","pessoais/patologicos"])),
    linha("Medicações de uso contínuo",campo(p.meds,["medicações","medicacoes","medicações em uso","medicacoes em uso","medicações de uso contínuo","medicacoes de uso continuo"])),
    linha("Alergias",campo(p.alerg,["alergias","alergia"])),
    linha("Cirurgias prévias",campo(p.anam_cirurgia,["cirurgias","cirurgias prévias","cirurgias previas","cirúrgicos","cirurgicos"])),
    linha("Calendário vacinal",campo(p.vacinas,["vacinação","vacinacao","calendário vacinal","calendario vacinal"])),
    linha("Histórico familiar",campo(p.anam_hist_fam,["histórico familiar","historico familiar","história familiar","historia familiar"])),
    linha("Exame físico",p.exFisico),
    "",
    tituloOnco,
    linha("Tipo de tumor",diag),
    linha("Sede tumoral",p.local_cancer),
    linha("Estadiamento/TNM",[estadio,tnm].map(v).filter(Boolean).join(" / ")),
    linha("Estágio",estadio),
    linha("Subtipo",subtipo),
    linha("Biomarcadores",biomarcadores),
    linha("CID-10",cid),
    linha("ECOG",ecog),
    "",
    "LAUDOS EM CRONOLOGIA",
    ...(exLinhas.length?exLinhas.map(l=>"• "+primeiraMaiuscula(l)):[""]),
    "",
    "CONDUTA",
    "",
    "",
    "OBSERVAÇÕES",
    "Pendências: "+(pendencias.length?pendencias.join("; "):""),
    "Sugestões: "+(sugestoes.length?sugestoes.join("; "):""),
  ].join("\n"));
}
function validarAPAC(dossie){
  const p=dossie?.paciente||{};
  const final=dossie?.evolucao?.textoFinal||dossie?.evolucao?.rascunho||"";
  const cidAuto=p.cid||p.cid_sugerido||getCIDPorSede(p.local_cancer)?.cid||getCID(p.diag);
  const justificativaAuto=final||[
    `Paciente ${p.nome||"—"}, ${p.nasc||"nascimento não informado"}, com suspeita/diagnóstico oncológico em investigação ou acompanhamento.`,
    `Sede tumoral referida: ${p.local_cancer||"não informada"}. Diagnóstico: ${p.diag||"a confirmar pelo médico"}.`,
    `Solicita-se autorização conforme protocolo oncológico após validação médica, com conferência de laudos, estadiamento, ECOG, função renal/hepática e plano terapêutico.`
  ].join(" ");
  const campos={
    nome:p.nome,cpf:p.cpf,cns:p.cns,mae:p.mae,municipio:p.cidade||p.municipio,cid:cidAuto,
    diagnostico_histologico:p.diag,data_biopsia:p.data_biopsia,estadiamento:p.estadio||p.tnm,
    procedimento_sigtap:p.cod_proc,linha_protocolo:p.linha||p.trat,justificativa:p.justif_apac||justificativaAuto,
    laudos:(dossie?.documentos||[]).length>0,peso_altura:p.peso&&p.altura,funcao_renal_hepatica:p.exames_resumo||p.exames_lab?.length,
  };
  const req=[
    ["nome","Nome"],["cpf","CPF"],["cns","CNS"],["mae","Nome da mãe"],["municipio","Município"],
    ["cid","CID-10"],["diagnostico_histologico","Diagnóstico histológico"],["data_biopsia","Data da biópsia"],
    ["estadiamento","Estadiamento"],["procedimento_sigtap","Procedimento SIGTAP"],["linha_protocolo","Linha/protocolo"],
    ["justificativa","Justificativa clínica"],["laudos","Laudos comprobatórios"],["peso_altura","Peso/altura/SC"],
    ["funcao_renal_hepatica","Função renal/hepática"],
  ];
  const pendencias=req.filter(([k])=>!campos[k]||String(campos[k]).trim()==="").map(([,l])=>l);
  const criticas=["Nome","CPF","CNS","CID-10","Diagnóstico histológico","Estadiamento","Procedimento SIGTAP","Justificativa clínica"].filter(x=>pendencias.includes(x));
  const riscoGlosa=criticas.length?"alto":pendencias.length?"moderado":"baixo";
  return {campos,pendencias,criticas,riscoGlosa,completa:pendencias.length===0};
}
// ── Auto-preenchimento de campos clínicos a partir do texto de laudos/AP ─────
// Extrai diagnóstico, data biópsia, estadiamento, biomarcadores e CID
// diretamente do texto livre de pac.anatom e pac.imagen.
// Chama up() SOMENTE para campos ainda vazios (nunca sobrescreve dado confirmado).
function autoPreencherCamposLaudos(pac,up){
  if(!pac||!up)return;
  const v=x=>x&&String(x).trim()&&String(x).trim()!=="—";
  const ap=String(pac?.anatom||"");
  const img=String(pac?.imagen||"");
  const comb=ap+" "+img;
  // 1) Diagnóstico histológico → pac.diag
  let _diagExtraido="";
  if(!v(pac?.diag)&&v(ap)){
    const mConcl=ap.match(/(?:diagnóstico|conclusão|laudo final|resultado)[\s:*]+([^\n.]{10,130})/i);
    const mTipo=ap.match(/\b(Adenocarcinoma|Carcinoma|GIST|Linfoma|Sarcoma|Melanoma|Mesothelioma|Leio|Rabdo|Ewing|Mieloma|Leucemia|Neuroblastoma|Hepatocarcinoma|Colangiocarcinoma)[a-zA-ZÀ-ú\s,\-]{4,100}/i);
    const diag=(mConcl?.[1]||mTipo?.[0]||"").trim();
    if(diag.length>6){up("diag",diag);_diagExtraido=diag;}
  }
  // 2) Data da biópsia → pac.data_biopsia
  if(!v(pac?.data_biopsia)&&v(ap)){
    const mData=ap.match(/(?:data|realiz|coleta|biópsia|biopsia|procedimento)[\s:]+(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/i)
              ||ap.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
    if(mData?.[1])up("data_biopsia",mData[1]);
  }
  // 3) Estadiamento → pac.estadio
  if(!v(pac?.estadio)){
    const mEst=comb.match(/(?:estádio|estadio|stage)\s*:?\s*([IV]{1,4}[A-C]?)\b/i)
              ||comb.match(/\b(pT[0-4][a-d]?N[0-3][a-c]?M[01][a-c]?)\b/i);
    if(mEst?.[1])up("estadio",mEst[1]);
  }
  // 4) TNM → pac.tnm (complementar ao estadio)
  if(!v(pac?.tnm)){
    const mTNM=comb.match(/\b([cpyr]?T[0-4][a-d]?N[0-3][a-c]?M[01][a-c]?)\b/i);
    if(mTNM?.[1])up("tnm",mTNM[1]);
  }
  // 5) Biomarcadores de mama/outros (só se vazio)
  if(v(ap)){
    if(!v(pac?.re)){
      const m=ap.match(/\bRE\b[\s:=]+([^\s,;.\n()]{1,20})/i)||ap.match(/receptor\s+estrog[eê]nio[\s:=]+([^\s,;.\n()]{1,20})/i);
      if(m?.[1])up("re",m[1].trim());
    }
    if(!v(pac?.rp)){
      const m=ap.match(/\bRP\b[\s:=]+([^\s,;.\n()]{1,20})/i)||ap.match(/receptor\s+progest[eê]rona[\s:=]+([^\s,;.\n()]{1,20})/i);
      if(m?.[1])up("rp",m[1].trim());
    }
    if(!v(pac?.her2)){
      const m=ap.match(/\bHER[\s-]?2\b[\s:=]+([^\s,;.\n()]{1,20})/i);
      if(m?.[1])up("her2",m[1].trim());
    }
    if(!v(pac?.ki67)){
      const m=ap.match(/\bKi[\s-]?67\b[\s:=]+([0-9.,\s%]{1,15}%?)/i);
      if(m?.[1])up("ki67",m[1].trim());
    }
    if(!v(pac?.grau_hist)){
      const m=ap.match(/grau\s+histol[oó]gico[\s:=]+(G?[123]|[I]{1,3}V?|baixo|m[eé]dio|alto)/i)
             ||ap.match(/(?:grau|grad)\s*:?\s*(G?[123]|[I]{1,3}V?|baixo|m[eé]dio|alto)\b/i);
      if(m?.[1])up("grau_hist",m[1].trim());
    }
    if(!v(pac?.margens)){
      const m=ap.match(/margens?\s*(?:cir[uú]rgicas?)?[\s:=]+([^\n,;]{4,60})/i);
      if(m?.[1])up("margens",m[1].trim());
    }
  }
  // 6) CID — tenta 3 estratégias em cascata
  if(!v(pac?.cid)){
    // 6a) getCID com o diag completo (funciona quando o órgão está no texto do diag)
    const diagAtual=pac?.diag||_diagExtraido;
    let cid=v(diagAtual)?getCID(diagAtual):"";
    // 6b) Extrai sede tumoral do texto AP + imagem e usa getCIDPorSede
    if(!cid){
      const sedeMatch=comb.match(/(?:sig\w{0,6}|cólon|colon|reto|mama|pulmão|pulmao|estômago|estomago|gástric|gastric|pâncrea|pancrea|ovário|ovario|próstata|prostata|bexiga|rim\b|esôfago|esofago|colo\s+do?\s+[uú]tero|endométrio|endometrio|tireoid|fígado|figado|hepato|biliar|colang|hematol|linfom|leucem|mielom)/i);
      if(sedeMatch){
        const s=getCIDPorSede(sedeMatch[0]);
        cid=s?.cid||"";
        // também preenche local_cancer se vazio
        if(!v(pac?.local_cancer)&&s?.sede)up("local_cancer",s.sede);
      }
    }
    // 6c) getCID com texto combinado
    if(!cid) cid=getCID(comb.substring(0,300));
    if(cid)up("cid",cid);
  }
  // 7) Preenche cid_sugerido + local_cancer se ainda vazios
  if(!v(pac?.cid_sugerido)&&v(pac?.local_cancer)){
    const s=getCIDPorSede(pac.local_cancer);
    if(s?.cid)up("cid_sugerido",s.cid);
  }
}
function agenteResumoClinico(dossie){
  const p=dossie?.paciente||{};
  const exames=coletarExamesRealizados(dossie,p).map(formatarLinhaExameRealizado);
  const cid=p.cid||p.cid_sugerido||getCIDPorSede(p.local_cancer)?.cid||getCID(p.diag)||"—";
  return [
    "RESUMO CLÍNICO ORQUESTRADO — validar em consulta",
    "Data: "+TODAY(),
    "",
    "Identificação: "+(p.nome||"—")+" · Nasc.: "+(p.nasc||"—")+" · CNS: "+(p.cns||"—")+" · CPF: "+(p.cpf||"—"),
    "Naturalidade: "+(p.naturalidade||"—")+" · Mãe: "+(p.mae||"—")+" · Telefone: "+(p.tel||"—"),
    "",
    "Sede tumoral informada: "+(p.local_cancer||"—")+" · CID sugerido: "+cid+" (confirmar pelo médico)",
    "Queixa principal: "+(p.queixa||"—"),
    "Antecedentes: "+(p.antec||"—"),
    "Medicações em uso: "+(p.meds||"—"),
    "Alergias: "+(p.alerg||"—"),
    "",
    "Exames realizados:",
    exames.length?exames.join("\n"):"Sem exames/laudos estruturados até o momento.",
    "",
    "Pendências para consulta: confirmar diagnóstico histológico, CID definitivo, estadiamento/TNM, biomarcadores, ECOG, linha terapêutica e protocolo.",
    "",
    "CONDUTA MÉDICA:",
    ""
  ].join("\n");
}
function agenteAPACPreenche(dossie){
  const p=dossie?.paciente||{};
  const cid=p.cid||p.cid_sugerido||getCIDPorSede(p.local_cancer)?.cid||getCID(p.diag)||"";
  const camposBase={
    nome:p.nome||"",
    cpf:p.cpf||"",
    cns:p.cns||"",
    nasc:p.nasc||"",
    mae:p.mae||"",
    municipio:p.cidade||p.municipio||"",
    naturalidade:p.naturalidade||"",
    cid,
    diag:p.diag||"",
    diagnostico_histologico:p.diag||"",
    estadio:p.estadio||"",
    tnm:p.tnm||"",
    ecog:p.ecog||"",
    trat:p.trat||"",
    linha:p.linha||"",
    cod_proc:p.cod_proc||"0304010072",
    procedimento_sigtap:p.cod_proc||"0304010072",
    data_sol:p.data_sol||TODAY(),
    justif_apac:p.justif_apac||agenteResumoClinico(dossie).slice(0,1800),
  };
  return {...validarAPAC({...dossie,paciente:{...p,...camposBase}}),campos:{...camposBase,...validarAPAC({...dossie,paciente:{...p,...camposBase}}).campos}};
}
function orquestrarDossieAtendimento(dossie,origem="secretaria"){
  const base=dossie||criarDossieInicial({});
  const resumo=agenteResumoClinico(base);
  const apac=agenteAPACPreenche({...base,evolucao:{...(base.evolucao||{}),rascunho:resumo}});
  const evolucaoClaude=extrairEvolucaoIA(base.resumoClaude||"")||extrairEvolucaoIA((base.documentos||[]).map(x=>x.resumo||"").join("\n\n"));
  const agentes=[
    {id:"orquestrador",nome:"Orquestrador",status:"ok",acao:"recebeu dados do paciente/secretaria e delegou tarefas"},
    {id:"prontuario",nome:"Agente Prontuário",status:"ok",acao:"gerou resumo clínico para evolução"},
    {id:"apac",nome:"Agente APAC",status:apac.completa?"ok":"pendente",acao:"preencheu campos disponíveis e listou pendências"},
    {id:"documentos",nome:"Agente Documentos",status:"ok",acao:"preparou base para receitas, exames e orientações"},
    {id:"farmacia",nome:"Agente Farmácia",status:"standby",acao:"aguarda prescrição validada pelo médico"},
    {id:"enfermagem",nome:"Agente Enfermagem",status:"standby",acao:"aguarda triagem/liberação"},
  ];
  const docResumo={id:Date.now()+7,tipo:"Resumo clínico orquestrado",nome:"Resumo para evolução — "+(base.paciente?.nome||"paciente"),resumo,origem:"orquestrador_"+origem,criadoEm:NOW()};
  const documentosBase=(base.documentos||[]).filter(d=>!(/^Resumo clínico orquestrado$/i.test(d?.tipo||"")||String(d?.origem||"").startsWith("orquestrador_")));
  return {
    ...base,
    status:apac.completa?"apac_pronta":"pronto_medico",
    documentos:[docResumo,...documentosBase],
    resumoClaude:[base.resumoClaude,resumo].filter(Boolean).join("\n\n---\n"),
    evolucao:{...(base.evolucao||{}),rascunho:evolucaoClaude||resumo,textoFinal:base.evolucao?.textoFinal||"",salvaEm:base.evolucao?.salvaEm||null},
    apac,
    agentes,
    orquestracao:{origem,executadoEm:NOW(),agentes},
    updatedAt:NOW(),
  };
}
function gerarDocumentosSelecionados(dossie,selecao){
  const p=dossie?.paciente||{};
  const ev=dossie?.evolucao?.textoFinal||dossie?.evolucao?.rascunho||"";
  const cab="Paciente: "+(p.nome||"—")+" · CPF: "+(p.cpf||"—")+" · Data: "+TODAY()+"\n"+AUTOR+" · "+HOSP;
  const map={
    sintomaticos:"RECEITA DE SINTOMÁTICOS\n\n"+cab+"\n\n1. Ondansetrona 8 mg — usar conforme náuseas.\n2. Dipirona 500 mg — se dor ou febre, conforme orientação médica.\n3. Pantoprazol 40 mg — se dispepsia/uso de corticoide.",
    antiemeticos:"RECEITA DE ANTIEMÉTICOS\n\n"+cab+"\n\nOndansetrona 8 mg, Metoclopramida 10 mg e Dexametasona conforme protocolo e avaliação médica.",
    analgesia:"RECEITA DE ANALGESIA\n\n"+cab+"\n\nEscalonar analgesia conforme dor, função renal/hepática e tolerância.",
    medicacao_ev:"MEDICAÇÃO ENDOVENOSA\n\n"+cab+"\n\nPrescrição EV deve ser validada pelo médico antes da administração.",
    exames:"SOLICITAÇÃO DE EXAMES\n\n"+cab+"\n\nHemograma, ureia, creatinina, TGO, TGP, bilirrubinas e exames dirigidos conforme evolução.",
    dieta:"ORIENTAÇÕES DIETÉTICAS\n\n"+cab+"\n\nHidratação, fracionamento alimentar e retorno se sinais de alarme.",
    alarme:"SINAIS DE ALARME\n\n"+cab+"\n\nFebre, falta de ar, sangramento, vômitos persistentes, diarreia intensa ou piora do estado geral: procurar urgência.",
    termo:"TERMO DE CONSENTIMENTO\n\n"+cab+"\n\nTratamento proposto: "+(p.trat||"—")+". Riscos, benefícios e alternativas discutidos em consulta.",
    apac:"APAC — RASCUNHO CLÍNICO\n\n"+cab+"\n\nBaseado na evolução salva:\n"+ev.slice(0,1800),
  };
  return Object.entries(selecao||{}).filter(([,v])=>v).map(([k])=>({id:k,titulo:k.replace(/_/g," ").toUpperCase(),texto:map[k]||""}));
}
function resumoDocDossie(dossie){
  const p=dossie?.paciente||{};
  const docs=dossie?.documentos||[];
  return [
    p.nome?"Paciente: "+p.nome:"",
    p.diag?"Diagnóstico: "+p.diag:"",
    p.cid?"CID: "+p.cid:"",
    p.trat?"Tratamento: "+p.trat:"",
    p.estadio?"Estádio: "+p.estadio:"",
    p.bio?"Biomarcadores: "+p.bio:"",
    docs.length?"Documentos: "+docs.map(d=>d.tipo||d.nome||"Doc").join(", "):"",
    dossie?.evolucao?.rascunho?dossie.evolucao.rascunho.slice(0,600):"",
  ].filter(Boolean).join("\n")||"Dados insuficientes no dossiê.";
}
async function gerarDossieClaude(dossie){
  const base=gerarTextoEvolucao(dossie);
  const prompt=[
    "Você é assistente de organização clínica oncológica do Dr. Silas Negrão.",
    "Organize os dados do dossiê abaixo em resumo objetivo. Sem markdown, sem asteriscos, sem traços decorativos.",
    "Se identificar diagnóstico, CID, estadiamento, protocolo ou biomarcadores nos dados, retorne nas primeiras linhas:",
    "DIAGNÓSTICO: [valor]",
    "CID-10: [código]",
    "ESTADIAMENTO: [valor]",
    "BIOMARCADORES: [valor]",
    "PROTOCOLO: [valor]",
    "Em seguida faça resumo clínico. Não decida conduta (deixe em branco). Aponte pendências para APAC.",
    "",
    base
  ].join("\n");
  let resumo="";
  try{resumo=await chamarClaude(prompt,1100);}catch(_){}
  const avisoClaude=String(resumo||"").startsWith("⚠")?String(resumo):"";
  if(!resumo||avisoClaude)resumo=[
    avisoClaude,
    avisoClaude?"":"",
    "Resumo local do dossiê:",
    resumoDocDossie(dossie),
    "",
    "Pendências possíveis: conferir CID, estadiamento, biomarcadores, laudos comprobatórios e dados APAC.",
    "Conduta permanece em branco para validação médica."
  ].filter(Boolean).join("\n");
  resumo=limparMarkdown(resumo);
  // Extrair campos estruturados e mesclar no paciente
  const camposIA=extrairCamposIA(resumo);
  const pacAtualizado={...(dossie.paciente||{})};
  Object.entries(camposIA).forEach(([k,v])=>{if(v&&!pacAtualizado[k])pacAtualizado[k]=v;});
  const novo={...dossie,paciente:pacAtualizado,resumoClaude:resumo,status:"pronto_medico",updatedAt:NOW()};
  novo.evolucao={...(dossie.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};
  novo.apac=validarAPAC(novo);
  return novo;
}
export {
  criarDossieInicial, gerarTextoEvolucao, validarAPAC, autoPreencherCamposLaudos,
  agenteResumoClinico, agenteAPACPreenche, orquestrarDossieAtendimento,
  gerarDocumentosSelecionados, gerarDossieClaude,
};
