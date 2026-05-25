// ─────────────────────────────────────────────────────────────────────────────
// PrimConsultaPaciente.jsx — Cadastro em 4 passos + dossiê de 1ª consulta
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from "react";
import { N, G, T, VE, VM, AM } from "../../utils/constants";
import { getCIDPorSede } from "../../utils/constants";
import { sc_, H2, Btn, CampoCadastro, CampoLinhaCadastro, TODAY } from "../../components/ui/primitives";
import { limparMarkdown } from "../../components/ui/primitives";
import { chamarClaude } from "../../utils/api";
import { extrairCamposIA } from "../../utils/parse";

async function IA_resumirDados(dadosRecepcao,dadosPaciente){
  const dados={...dadosRecepcao,...dadosPaciente};
  const prompt=`Você é assistente oncológico do Dr. Silas Negrão, Hospital do Bem, Patos-PB.
Com base nos dados abaixo, gere UM ÚNICO resumo para prontuário. Sem markdown, sem asteriscos, sem traços decorativos.
Retorne EXATAMENTE neste formato:

DADOS CLÍNICOS:
Queixa: ${dados.queixa||"—"}
Antecedentes patológicos: ${dados.antecedentes||dados.antec||"—"}
Medicações de uso contínuo: ${dados.meds||"—"}
Alergias: ${dados.alerg||"—"}
Cirurgias prévias: ${dados.cirurgia||dados.anam_cirurgia||"—"}
Calendário vacinal: ${dados.vacinas||"—"}
Histórico familiar: ${dados.hf||dados.anam_hist_fam||"—"}

DADOS ONCOLÓGICOS:
Tipo de tumor: [diagnóstico histológico ou local do câncer informado]
Sede tumoral: ${dados.local_cancer||"—"}
Estadiamento/TNM: [se informado]
Estágio: [se informado]
Subtipo: [se informado]
Biomarcadores: [se informado]
CID-10: [código CID se identificável, ex: C53.9 para colo uterino]
ECOG: [se informado]

LAUDOS EM CRONOLOGIA:
• DD/MM/AA - TIPO DO EXAME - resumo com foco oncológico em uma linha.

Dados recebidos: Local do câncer: ${dados.local_cancer||"—"} · Cidade: ${dados.cidade||"—"} · Sexo: ${dados.sexo||"—"}`;
  const raw=await chamarClaude(prompt,800);
  return limparMarkdown(raw||"");
}

// ─── PRIMEIRA CONSULTA (PORTAL PACIENTE) ─────────────────────────────────────
function PrimConsultaPaciente({pac,up,addMsg,addCaixa,addFila,onDossieCriado,onConcluido,back,alertCount,onAlert}){
  const [passo,setPasso]=useState(0);
  const [form,setForm]=useState(()=>({...pac}));
  const [arqs,setArqs]=useState([]);
  const [sintomas,setSintomas]=useState([]);
  const [enviando,setEnviando]=useState(false);
  const [resumoEditavel,setResumoEditavel]=useState("");
  const [textoCadastroTeste,setTextoCadastroTeste]=useState("");
  const [driveAbertoPac,setDriveAbertoPac]=useState(false);
  const refC=useRef(null);
  const refA=useRef(null);

  // 4 passos: Dados · Saúde · Documentos · Revisão
  const PASSOS=[
    {id:0,l:"Dados",ico:"👤"},
    {id:1,l:"Saúde",ico:"🩺"},
    {id:2,l:"Documentos",ico:"📎"},
    {id:3,l:"Revisão",ico:"✅"},
  ];

  useEffect(()=>{setForm(x=>({...pac,...x}));},[pac?.pacID]);

  const setCampo=(k,v)=>{
    setForm(prev=>({...prev,[k]:v}));
  };

  const extrairCampoTexto=(texto,rotulos)=>{
    const linhas=String(texto||"").split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    for(const rotulo of rotulos){
      const re=new RegExp("^\\s*(?:[*•\\-]\\s*)?(?:\\*\\*)?"+rotulo+"(?:\\*\\*)?\\s*[:\\-–]\\s*(.+)$","i");
      const achou=linhas.find(l=>re.test(l));
      if(achou)return achou.replace(re,"$1").replace(/\*\*/g,"").replace(/[.;]\s*$/,"").trim();
    }
    return "";
  };
  const formatarCEPcad=v=>String(v||"").replace(/\D/g,"").slice(0,8).replace(/^(\d{5})(\d)/,"$1-$2");
  const formatarTelCad=v=>{const d=String(v||"").replace(/\D/g,"").slice(0,11);return d.length<=10?d.replace(/^(\d{2})(\d{4})(\d)/,"($1) $2-$3"):d.replace(/^(\d{2})(\d{5})(\d)/,"($1) $2-$3");};
  const parseEnderecoCadastro=endereco=>{
    const bruto=String(endereco||"").replace(/\*\*/g,"").replace(/[.;]\s*$/,"").trim();
    const cep=(bruto.match(/\b\d{5}-?\d{3}\b/)||[])[0]||"";
    const uf=(bruto.match(/[-/]\s*([A-Z]{2})\b/i)||[])[1]||"";
    const cidade=(bruto.match(/,\s*([^,]+?)\s*[-/]\s*[A-Z]{2}\b/i)||[])[1]||"";
    const bairro=(bruto.match(/\bbairro\s+([^,()]+)/i)||[])[1]||"";
    const numero=(bruto.match(/\bn[uú]mero\s+([^,()]+)/i)||bruto.match(/\bn[ºo.]?\s*([^,()]+)/i)||[])[1]||"";
    const logradouro=(bruto.split(/,\s*(?:n[uú]mero|n[ºo.]?)/i)[0]||bruto).trim();
    const tipo=(logradouro.match(/^(rua|avenida|travessa|s[íi]tio|fazenda|rodovia|estrada)\b/i)||[])[1]||"";
    return {cep:formatarCEPcad(cep),uf:uf.toUpperCase(),cidade:cidade.trim(),bairro:bairro.trim(),numero:numero.trim(),logradouro,tipo_logradouro:tipo?tipo.charAt(0).toUpperCase()+tipo.slice(1).toLowerCase():""};
  };
  const aplicarCadastroTeste=()=>{
    const txt=textoCadastroTeste;
    if(!txt.trim())return;
    const cpf=(txt.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/)||[])[0]||"";
    const nasc=(txt.match(/\b\d{2}\/\d{2}\/\d{4}\b/)||txt.match(/\b\d{2}-\d{2}-\d{4}\b/)||[])[0]||"";
    const tel=(txt.match(/\(?\d{2}\)?\s?9?\d{4,5}-?\d{4}/)||[])[0]||"";
    const cns=extrairCampoTexto(txt,["cns","cart[aã]o sus","cartao sus","sus"]) || ((txt.match(/\b\d{15}\b/)||[])[0]||"");
    const endTxt=extrairCampoTexto(txt,["endere[cç]o"])||"";
    const end=parseEnderecoCadastro(endTxt);
    const zonaTxt=extrairCampoTexto(txt,["zona urbana/rural","zona"]);
    const novo={
      nome:extrairCampoTexto(txt,["nome completo","nome","paciente"]) || form.nome || "",
      nome_social:extrairCampoTexto(txt,["nome social","apelido"]) || form.nome_social || "",
      prontuario:extrairCampoTexto(txt,["n[uú]mero do prontu[aá]rio","prontu[aá]rio"]) || form.prontuario || "",
      nasc:extrairCampoTexto(txt,["data de nascimento","nascimento","nasc"]) || nasc || form.nasc || "",
      idade:extrairCampoTexto(txt,["idade"]) || form.idade || "",
      cpf:extrairCampoTexto(txt,["cpf"]) || cpf || form.cpf || "",
      rg:extrairCampoTexto(txt,["rg","documento de identidade"]) || form.rg || "",
      cns:extrairCampoTexto(txt,["cart[aã]o nacional de sa[uú]de \\(cns\\)","cart[aã]o nacional de sa[uú]de","cns","cart[aã]o sus","cartao sus","sus"]) || cns || form.cns || "",
      mae:extrairCampoTexto(txt,["filia[cç][aã]o \\(m[aã]e\\)","nome da m[aã]e","m[aã]e"]) || form.mae || "",
      sexo:extrairCampoTexto(txt,["sexo"]) || form.sexo || "",
      raca_cor:extrairCampoTexto(txt,["ra[cç]a/cor","ra[cç]a","cor"]) || form.raca_cor || "",
      etnia:extrairCampoTexto(txt,["etnia"]) || form.etnia || "",
      nacionalidade:extrairCampoTexto(txt,["nacionalidade"]) || form.nacionalidade || "",
      naturalidade:extrairCampoTexto(txt,["naturalidade"]) || form.naturalidade || "",
      endereco:endTxt || form.endereco || "",
      tel:formatarTelCad(extrairCampoTexto(txt,["telefone principal","telefone de contato","telefone","whatsapp","celular","tel"]) || tel || form.tel || ""),
      telefone_celular:formatarTelCad(extrairCampoTexto(txt,["telefone celular","celular","whatsapp"]) || form.telefone_celular || ""),
      telefone_alternativo:formatarTelCad(extrairCampoTexto(txt,["telefone alternativo","telefone secund[aá]rio"]) || form.telefone_alternativo || ""),
      acompanhante_nome:extrairCampoTexto(txt,["nome acompanhante","acompanhante"]) || form.acompanhante_nome || "",
      responsavel_nome:extrairCampoTexto(txt,["nome do respons[aá]vel","respons[aá]vel"]) || form.responsavel_nome || "",
      responsavel_parentesco:extrairCampoTexto(txt,["parentesco do respons[aá]vel","parentesco"]) || form.responsavel_parentesco || "",
      responsavel_telefone:formatarTelCad(extrairCampoTexto(txt,["telefone do respons[aá]vel"]) || form.responsavel_telefone || ""),
      cep:extrairCampoTexto(txt,["cep"]) || end.cep || form.cep || "",
      tipo_logradouro:extrairCampoTexto(txt,["tipo de logradouro"]) || end.tipo_logradouro || form.tipo_logradouro || "",
      logradouro:extrairCampoTexto(txt,["logradouro","rua"]) || end.logradouro || form.logradouro || "",
      numero:extrairCampoTexto(txt,["n[uú]mero","numero"]) || end.numero || form.numero || "",
      complemento:extrairCampoTexto(txt,["complemento"]) || form.complemento || "",
      bairro:extrairCampoTexto(txt,["bairro"]) || end.bairro || form.bairro || "",
      cidade:extrairCampoTexto(txt,["cidade onde mora","munic[ií]pio de resid[eê]ncia","cidade","cidade / uf","munic[ií]pio","municipio"]) || end.cidade || form.cidade || "",
      municipio_cod:extrairCampoTexto(txt,["c[oó]digo ibge","codigo ibge","cod ibge"]) || form.municipio_cod || "",
      uf:(extrairCampoTexto(txt,["uf","estado"]) || end.uf || form.uf || "PB").toUpperCase(),
      zona:/rural/i.test(zonaTxt)?"rural":/urbana/i.test(zonaTxt)?"urbana":form.zona||"",
      local_cancer:extrairCampoTexto(txt,["local do c[aâ]ncer","c[aâ]ncer","tumor","diagn[oó]stico","diagnostico","local"]) || form.local_cancer || "",
    };
    setForm(prev=>({...prev,...novo}));
  };

  const onCam=e=>{setArqs(x=>[...x,...Array.from(e.target.files||[]).map(f=>({ico:"📷",n:f.name,tipo:"Foto",obj:f}))]);e.target.value="";};
  const onArq=e=>{setArqs(x=>[...x,...Array.from(e.target.files||[]).map(f=>({ico:f.type?.includes("image")?"📷":"📄",n:f.name,tipo:f.name.toLowerCase().endsWith(".pdf")?"PDF":"Documento",obj:f}))]);e.target.value="";};
  const sintomasTexto=()=>TODOS_SINTOMAS_ONCOLOGICOS.filter(s=>sintomas.includes(s.id)).map(s=>s.txt).join("; ")||"Não informado";
  const cpfOKcad=cpf=>{const c=String(cpf||"").replace(/\D/g,"");if(c.length!==11||/^(\d)\1+$/.test(c))return false;let s=0;for(let i=0;i<9;i++)s+=Number(c[i])*(10-i);let d=11-(s%11);if(d>=10)d=0;if(d!==Number(c[9]))return false;s=0;for(let i=0;i<10;i++)s+=Number(c[i])*(11-i);d=11-(s%11);if(d>=10)d=0;return d===Number(c[10]);};
  const camposPendentesAPAC=[
    [!(form.nome||"").trim(),"Nome completo"],
    [String(form.cns||"").replace(/\D/g,"").length!==15,"CNS / Cartão SUS"],
    [!cpfOKcad(form.cpf),"CPF válido"],
    [!(form.nasc||"").trim(),"Data de nascimento"],
    [!(form.sexo||"").trim(),"Sexo"],
    [!(form.raca_cor||form.raca||"").trim(),"Raça/cor"],
    [!(form.mae||"").trim(),"Nome da mãe"],
    [String(form.tel||"").replace(/\D/g,"").length<10,"Telefone principal"],
    [String(form.cep||"").replace(/\D/g,"").length!==8,"CEP"],
    [!(form.logradouro||"").trim(),"Logradouro"],
    [!(form.numero||"").trim(),"Número ou S/N"],
    [!(form.bairro||"").trim(),"Bairro"],
    [!(form.cidade||"").trim(),"Município de residência"],
    [!(form.uf||"").trim(),"UF"],
  ].filter(x=>x[0]).map(x=>x[1]);
  const dadosCompletos=camposPendentesAPAC.length===0;
  const cadastroIdentificado=!!String(form.nome||form.cpf||form.cns||form.tel||"").trim();
  const cidSugeridoSede=getCIDPorSede(form.local_cancer);

  const montarResumo=()=>[
    "PRIMEIRA CONSULTA — Dossiê do Paciente",
    "Data: "+TODAY(),
    "",
    "DADOS DEMOGRÁFICOS",
    "Paciente: "+(form.nome||"—"),
    "Nome social/apelido: "+(form.nome_social||"—")+" · Prontuário: "+(form.prontuario||form.pacID||"—"),
    "Nascimento: "+(form.nasc||"—")+" · Idade: "+(form.idade||"—")+" · Sexo: "+(form.sexo||"—"),
    "CPF: "+(form.cpf||"—")+" · CNS: "+(form.cns||"—")+" · RG: "+(form.rg||"—"),
    "Raça/Cor: "+(form.raca_cor||form.raca||"—")+" · Etnia: "+(form.etnia||"—"),
    "Mãe: "+(form.mae||"—"),
    "Acompanhante: "+(form.acompanhante_nome||"—"),
    "Responsável: "+(form.responsavel_nome||"—")+" · Parentesco: "+(form.responsavel_parentesco||"—")+" · Telefone responsável: "+(form.responsavel_telefone||"—"),
    "Telefone principal: "+(form.tel||"—")+" · Celular/WhatsApp: "+(form.telefone_celular||"—")+" · Alternativo: "+(form.telefone_alternativo||"—"),
    "Endereço: "+(form.endereco||[form.tipo_logradouro,form.logradouro,form.numero?`nº ${form.numero}`:"",form.complemento,form.bairro?`Bairro ${form.bairro}`:"",[form.cidade,form.uf].filter(Boolean).join(" / "),form.cep?`CEP ${form.cep}`:""].filter(Boolean).join(", ")||"—"),
    "Município residência: "+(form.cidade||"—")+" · Código IBGE: "+(form.municipio_cod||"—")+" · UF: "+(form.uf||"—")+" · Zona: "+(form.zona||"—"),
    "Naturalidade: "+(form.naturalidade||"—"),
    "Local do câncer informado pelo paciente: "+(form.local_cancer||"—"),
    "CID sugerido pela sede: "+(form.cid_sugerido||cidSugeridoSede?.cid||"—")+" "+(cidSugeridoSede?.sede?`(${cidSugeridoSede.sede})`:"")+" — confirmar pelo médico",
    "",
    "QUEIXA PRINCIPAL",
    "Motivo da consulta: "+(form.queixa||"—"),
    "Sintomas marcados: "+sintomasTexto(),
    "",
    "ANTECEDENTES E MEDICAÇÕES",
    "Doenças anteriores: "+(form.antec||"—"),
    "Medicações de uso contínuo: "+(form.meds||"—"),
    "Alergias: "+(form.alerg||"—"),
    "Cirurgias prévias: "+(form.anam_cirurgia||"—"),
    "Vacinas: "+(form.vacinas||"—"),
    "Histórico familiar oncológico: "+(form.anam_hist_fam||"—"),
    "",
    "DOCUMENTOS",
    arqs.length?arqs.map(a=>a.tipo+": "+a.n).join("\n"):"Sem documentos enviados.",
  ].join("\n");

  // Ao entrar na revisão, preenche o textarea editável
  const irParaRevisao=()=>{
    setResumoEditavel(montarResumo());
    setPasso(3);
  };

  const enviar=async()=>{
    if(!cadastroIdentificado){alert("Informe pelo menos nome, CPF, CNS ou telefone antes de enviar para a recepção.");return;}
    setEnviando(true);
    const formEnv={...form,cid_sugerido:form.cid_sugerido||cidSugeridoSede?.cid||""};
    Object.entries(formEnv).forEach(([k,v])=>up&&up(k,v));
    const resumo=resumoEditavel||montarResumo();
    const pacienteEntrada={...pac,...formEnv,sintomas_atuais:sintomasTexto(),pre_consulta_em:NOW()};
    const documentos=arqs.map(a=>({id:Date.now()+Math.random(),tipo:a.tipo||"Upload",nome:a.n,origem:"paciente",criadoEm:NOW()}));
    let resumoFinal=resumo;
    try{
      const iaResumo=await IA_resumirDados({
        local_cancer:form.local_cancer,queixa:form.queixa,sintomas:sintomasTexto(),antecedentes:form.antec,
        meds:form.meds,alerg:form.alerg,cirurgia:form.anam_cirurgia,
        vacinas:form.vacinas,hf:form.anam_hist_fam,
      },{nome:form.nome,nasc:form.nasc,idade:form.idade,cidade:form.cidade,cpf:form.cpf,tel:form.tel,sexo:form.sexo});
      if(iaResumo&&!iaResumo.startsWith("⚠")){
        resumoFinal=resumo+"\n\nRESUMO IA\n"+iaResumo;
        up&&up("obs_ia",iaResumo);
        // Extrair campos estruturados gerados pela IA e popular pacienteEntrada
        const camposIA=extrairCamposIA(iaResumo);
        Object.entries(camposIA).forEach(([k,v])=>{
          if(v&&!pacienteEntrada[k]){pacienteEntrada[k]=v;up&&up(k,v);}
        });
      }
    }catch(_){}
    onDossieCriado&&onDossieCriado({paciente:pacienteEntrada,status:"aguardando_recepcao",resumoEntrada:resumoFinal,documentos});
    addCaixa&&addCaixa({de:form.nome||"Paciente",titulo:"Primeira Consulta — "+(form.nome||"—"),conteudo:resumoFinal,tipo:"primeira_consulta"});
    addMsg&&addMsg("Paciente","Recepção","Primeira consulta enviada: "+(form.nome||"—")+". Dossiê aguardando conferência.","msg");
    addMsg&&addMsg("Paciente","Médico","Nova pré-consulta: "+(form.nome||"—")+". Aguardando recepção.","standby");
    if(addFila&&form.nome)addFila({nome:form.nome,proto:"Primeira consulta",chegada:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),status:"aguardando",origem:"paciente",pacID:pac?.pacID});
    setEnviando(false);
    setPasso(4);
  };

  const avancar=()=>{
    try{ savePacAtual({...pac,...form}); }catch(_){}
    if(passo===2) irParaRevisao(); else setPasso(p=>Math.min(3,p+1));
  };
  const voltar=()=>setPasso(p=>Math.max(0,p-1));
  const irPara=(id)=>{ if(id===3) irParaRevisao(); else setPasso(id); };

  const Nav=({final=false})=><div style={{display:"flex",gap:8,marginTop:16}}>
    {passo>0&&<Btn v="ghost" ch="← Voltar" s={{fontSize:12,padding:"11px 16px"}} onClick={voltar}/>}
    {!final&&<Btn v="gold" ch="Continuar →" s={{flex:1,fontSize:14,padding:12}} dis={passo===0&&!cadastroIdentificado} onClick={avancar}/>}
    {final&&<Btn v="gold" ch={enviando?"Enviando...":"✉️ Enviar pré-consulta"} s={{flex:1,fontSize:14,padding:12}} dis={enviando||!cadastroIdentificado} onClick={enviar}/>}
  </div>;

  return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Segoe UI, Arial, sans-serif"}}>
    <input ref={refC} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={onCam}/>
    <input ref={refA} type="file" accept=".pdf,.doc,.docx,image/*" multiple style={{display:"none"}} onChange={onArq}/>
    <TopBar title="Primeira Consulta" back={back} alertCount={alertCount} onAlert={onAlert}/>
    <div style={{flex:1,padding:16,overflowY:"auto"}}>
      <div style={{maxWidth:720,margin:"0 auto",display:"grid",gap:14}}>

        {/* ── HEADER PASSOS ── */}
        {passo<4&&<div style={sc_.card({padding:"12px 16px"})}>
          <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontSize:11,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:.7}}>Dossiê Oncológico Inteligente</div>
              <h1 style={{margin:"2px 0 0",fontSize:18,color:N}}>Fluxo do paciente, passo a passo</h1>
            </div>
            <span style={{fontSize:12,color:"#64748B",fontWeight:800,whiteSpace:"nowrap"}}>Passo {passo+1} de 4</span>
          </div>
          {/* Abas clicáveis — qualquer passo visitado ou futuro */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {PASSOS.map(p=>{
              const concluido=p.id<passo;
              const ativo=passo===p.id;
              return <button key={p.id} type="button"
                onClick={()=>irPara(p.id)}
                style={{
                  border:"none",borderRadius:10,padding:"9px 4px",
                  background:ativo?G:concluido?VE+"22":"#F1F5F9",
                  color:ativo?"#fff":concluido?VE:"#64748B",
                  fontWeight:900,fontSize:11,cursor:"pointer",
                  fontFamily:"inherit",display:"flex",flexDirection:"column",
                  alignItems:"center",gap:3,transition:".15s ease",
                }}>
                <span style={{fontSize:15}}>{p.ico}</span>
                <span>{concluido?"✓ Feito":p.l}</span>
              </button>;
            })}
          </div>
        </div>}

        {/* ── PASSO 0: DADOS DEMOGRÁFICOS ── */}
        {passo===0&&<div style={sc_.card({padding:18})}>
          <H2 ch="👤 Dados demográficos" s={{fontSize:18}}/>
          <p style={{margin:"-4px 0 14px",color:"#64748B",fontSize:13}}>Preencha o núcleo APAC/PB. A recepção revisa e o agente leva para prontuário e APAC.</p>
          <div style={{border:"1.5px dashed "+T,borderRadius:12,background:"#F0F9FF",padding:12,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:8}}>
              <div>
                <div style={{fontSize:12,color:T,fontWeight:950,textTransform:"uppercase"}}>Teste: colar dados</div>
                <div style={{fontSize:11,color:"#64748B"}}>Cole identificação, contato e endereço. O app distribui nos campos abaixo.</div>
              </div>
              <button type="button" onClick={aplicarCadastroTeste} style={{background:T,color:"#fff",border:"none",borderRadius:9,padding:"8px 12px",fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Preencher campos</button>
            </div>
            <textarea value={textoCadastroTeste} onChange={e=>setTextoCadastroTeste(e.target.value)} rows={5}
              placeholder={"Exemplo:\n* **Nome completo:** Hagamenon Barboza da Silva.\n* **Data de nascimento:** 01/01/1951.\n* **Idade:** 75 anos.\n* **CPF:** 478.440.004-49.\n* **Cartão Nacional de Saúde (CNS):** 702809628289962.\n* **Filiação (Mãe):** Antonia Maria da Conceição.\n* **Sexo:** Masculino.\n* **Raça/Cor:** Parda.\n* **Nacionalidade:** Brasileira.\n* **Naturalidade:** Nova Olinda - PB.\n* **Endereço:** Rua Jose Teotonio, número 786, Pedra Branca - PB.\n* **Telefone:** (83) 9942-0675."}
              style={{...sc_.inp,resize:"vertical",fontSize:13,background:"#fff",fontFamily:"Segoe UI, Arial, sans-serif"}}/>
          </div>
          <div style={{fontSize:11,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:.6,margin:"2px 0 8px"}}>Identificação do paciente</div>
          <CampoLinhaCadastro>
            <CampoCadastro form={form} setCampo={setCampo} l="Nome completo *" k="nome" ph="Nome completo"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Nome social / apelido" k="nome_social" ph="Se houver"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Número do prontuário" k="prontuario" ph="Se já existir"/>
            <CampoCadastro form={form} setCampo={setCampo} l="CNS / Cartão SUS *" k="cns" ph="15 dígitos"/>
            <CampoCadastro form={form} setCampo={setCampo} l="CPF *" k="cpf" ph="000.000.000-00"/>
            <CampoCadastro form={form} setCampo={setCampo} l="RG / documento" k="rg" ph="Opcional"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Data de nascimento *" k="nasc" ph="DD/MM/AAAA"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Sexo *" k="sexo" ph="Masculino / Feminino"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Raça/Cor *" k="raca_cor" ph="Parda, branca, preta..."/>
            <CampoCadastro form={form} setCampo={setCampo} l="Etnia, se aplicável" k="etnia" ph="Opcional"/>
          </CampoLinhaCadastro>
          <CampoCadastro form={form} setCampo={setCampo} l="Nome da mãe *" k="mae" ph="Nome completo da mãe"/>

          <div style={{fontSize:11,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:.6,margin:"10px 0 8px"}}>Responsável / acompanhante</div>
          <CampoLinhaCadastro>
            <CampoCadastro form={form} setCampo={setCampo} l="Nome do acompanhante" k="acompanhante_nome" ph="Quem veio com o paciente"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Nome do responsável" k="responsavel_nome" ph="Se houver"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Parentesco do responsável" k="responsavel_parentesco" ph="Filho(a), cônjuge..."/>
            <CampoCadastro form={form} setCampo={setCampo} l="Telefone do responsável" k="responsavel_telefone" ph="(83) 99999-9999"/>
          </CampoLinhaCadastro>

          <div style={{fontSize:11,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:.6,margin:"10px 0 8px"}}>Contatos telefônicos</div>
          <CampoLinhaCadastro>
            <CampoCadastro form={form} setCampo={setCampo} l="Telefone principal do paciente *" k="tel" ph="(83) 99999-9999"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Telefone celular / WhatsApp" k="telefone_celular" ph="(83) 99999-9999"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Telefone alternativo" k="telefone_alternativo" ph="Opcional"/>
          </CampoLinhaCadastro>

          <div style={{fontSize:11,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:.6,margin:"10px 0 8px"}}>Endereço residencial</div>
          <CampoLinhaCadastro>
            <CampoCadastro form={form} setCampo={setCampo} l="CEP *" k="cep" ph="58700-000"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Tipo de logradouro" k="tipo_logradouro" ph="Rua, avenida, sítio..."/>
            <CampoCadastro form={form} setCampo={setCampo} l="Logradouro *" k="logradouro" ph="Nome da rua/sítio/fazenda"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Número ou S/N *" k="numero" ph="S/N"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Complemento" k="complemento" ph="Casa, apto..."/>
            <CampoCadastro form={form} setCampo={setCampo} l="Bairro *" k="bairro" ph="Bairro"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Cidade onde mora atualmente *" k="cidade" ph="Município de residência"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Código IBGE do município" k="municipio_cod" ph="Opcional; recepção completa se faltar"/>
            <CampoCadastro form={form} setCampo={setCampo} l="UF *" k="uf" ph="PB"/>
            <CampoCadastro form={form} setCampo={setCampo} l="Zona urbana/rural" k="zona" ph="Urbana ou rural"/>
          </CampoLinhaCadastro>
          <CampoCadastro form={form} setCampo={setCampo} l="Endereço completo" k="endereco" ph="Rua, número, bairro, cidade, UF, CEP"/>
          {camposPendentesAPAC.length>0&&<div style={{background:"#FFFBEB",border:"1.5px solid #FCD34D",borderRadius:12,padding:"10px 12px",marginTop:8}}>
            <div style={{fontSize:12,fontWeight:900,color:AM,marginBottom:5}}>Pendências para a recepção completar na APAC</div>
            <div style={{fontSize:11,color:"#78350F",marginBottom:6}}>Essas pendências não bloqueiam a progressão do paciente.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 10px"}}>
              {camposPendentesAPAC.map(p=><span key={p} style={{fontSize:11,color:"#78350F"}}>• {p}</span>)}
            </div>
          </div>}
          <Nav/>
        </div>}

        {/* ── PASSO 1: SAÚDE (queixa + sintomas + antecedentes) ── */}
        {passo===1&&<div style={sc_.card({padding:18})}>
          <H2 ch="🩺 Saúde e sintomas" s={{fontSize:18}}/>
          <p style={{margin:"-4px 0 14px",color:"#64748B",fontSize:13}}>Esses dados ajudam o médico a montar a evolução inicial.</p>

          <CampoCadastro form={form} setCampo={setCampo} l="Qual lugar do seu corpo é o câncer?" k="local_cancer" ph="Ex: mama, pulmão, intestino, próstata, colo do útero. Se não souber, escreva não sei."/>
          {form.local_cancer&&<div style={{background:cidSugeridoSede?"#EAF7EE":"#F8FAFC",border:"1.5px solid "+(cidSugeridoSede?VE:"#CBD5E1"),borderRadius:11,padding:"9px 12px",margin:"-2px 0 12px",display:"flex",gap:10,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
            <div style={{fontSize:12,color:cidSugeridoSede?VE:"#64748B",fontWeight:850}}>
              {cidSugeridoSede?`CID sugerido pela sede: ${cidSugeridoSede.cid} — ${cidSugeridoSede.sede}`:"Sede informada. CID ainda sem correspondência automática."}
              <span style={{display:"block",fontSize:10,color:"#64748B",fontWeight:700,marginTop:2}}>Sugestão para triagem. O médico confirma ou altera no atendimento.</span>
            </div>
            {cidSugeridoSede&&<button type="button" onClick={()=>setCampo("cid_sugerido",cidSugeridoSede.cid)} style={{background:form.cid_sugerido===cidSugeridoSede.cid?VE:T,color:"#fff",border:"none",borderRadius:9,padding:"7px 11px",fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>
              {form.cid_sugerido===cidSugeridoSede.cid?"CID sugerido salvo":"Salvar CID sugerido"}
            </button>}
          </div>}

          {/* Queixa principal */}
          <CampoCadastro form={form} setCampo={setCampo} l="Motivo principal da consulta" k="queixa" ph="Conte em poucas palavras o principal problema." ta rows={3}/>

          {/* Sintomas */}
          <div style={{fontSize:11,color:N,fontWeight:900,textTransform:"uppercase",margin:"14px 0 8px",letterSpacing:.5}}>Marque os sintomas que você percebeu</div>
          <div style={{display:"grid",gap:10,marginBottom:16}}>
            {SINTOMAS_ONCOLOGICOS.map(grupo=><div key={grupo.grupo} style={{border:"1px solid #E2E8F0",borderRadius:12,background:"#F8FAFC",padding:10}}>
              <div style={{fontSize:12,color:G,fontWeight:950,marginBottom:8}}>{grupo.grupo}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:6}}>
                {grupo.itens.map(s=>{
                  const ativo=sintomas.includes(s.id);
                  return <button key={s.id} type="button"
                    onClick={()=>setSintomas(x=>x.includes(s.id)?x.filter(i=>i!==s.id):[...x,s.id])}
                    style={{border:"1.5px solid "+(ativo?T:"#CBD5E1"),background:ativo?"#EAF7FA":"#fff",color:ativo?T:N,borderRadius:10,padding:"9px 10px",fontSize:12,fontWeight:800,textAlign:"left",cursor:"pointer",fontFamily:"inherit",transition:".13s",lineHeight:1.25}}>
                    {ativo?"✓ ":""}{s.txt}
                  </button>;
                })}
              </div>
            </div>)}
          </div>

          {/* Antecedentes e medicações */}
          <div style={{borderTop:"1.5px solid #E2E8F0",paddingTop:14,marginTop:4}}>
            <div style={{fontSize:11,color:N,fontWeight:900,textTransform:"uppercase",marginBottom:10,letterSpacing:.5}}>Antecedentes e medicações</div>
            <CampoCadastro form={form} setCampo={setCampo} l="Doenças anteriores ou atuais" k="antec" ph="Hipertensão, diabetes, cardiopatia..." ta rows={2}/>
            <CampoCadastro form={form} setCampo={setCampo} l="Medicações de uso contínuo" k="meds" ph="Nome dos remédios e doses, se souber." ta rows={2}/>
            <CampoCadastro form={form} setCampo={setCampo} l="Alergias" k="alerg" ph="Alergia a remédio, contraste, alimento. Se não tiver, escreva nega." ta rows={2}/>
            <CampoLinhaCadastro>
              <CampoCadastro form={form} setCampo={setCampo} l="Cirurgias prévias" k="anam_cirurgia" ph="Quais cirurgias e quando." ta rows={2}/>
              <CampoCadastro form={form} setCampo={setCampo} l="Vacinas relevantes" k="vacinas" ph="COVID, influenza, hepatite..." ta rows={2}/>
            </CampoLinhaCadastro>
            <CampoCadastro form={form} setCampo={setCampo} l="Histórico familiar de câncer" k="anam_hist_fam" ph="Quem teve câncer na família e qual tipo." ta rows={2}/>
          </div>
          <Nav/>
        </div>}

        {/* ── PASSO 2: DOCUMENTOS ── */}
        {passo===2&&<div style={sc_.card({padding:18})}>
          <H2 ch="📎 Exames e documentos" s={{fontSize:18}}/>
          <p style={{margin:"-4px 0 12px",color:"#64748B",fontSize:13}}>Fotografe laudos, receitas, exames. Se não tiver, pode continuar.</p>
          {/* Atalho Drive — aparece sempre como destaque */}
          <div
            onClick={()=>{abrirDrive();setDriveAbertoPac(true);}}
            style={{background:"linear-gradient(135deg,#1a73e8,#0d5db7)",borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",marginBottom:10,boxShadow:"0 4px 16px rgba(26,115,232,.3)"}}>
            <div style={{background:"rgba(255,255,255,.2)",borderRadius:10,width:44,height:44,display:"grid",placeItems:"center",fontSize:24,flexShrink:0}}>☁️</div>
            <div style={{flex:1}}>
              <div style={{color:"#fff",fontWeight:900,fontSize:14}}>📂 Pasta Drive — Laudos e Exames</div>
              <div style={{color:"rgba(255,255,255,.8)",fontSize:11,marginTop:2}}>Toque aqui → pasta abre → baixe → arraste abaixo ou selecione arquivo</div>
            </div>
            <div style={{color:"#fff",fontSize:22,fontWeight:900}}>→</div>
          </div>
          {driveAbertoPac&&<div style={{background:"#EAF7EE",border:`1.5px solid ${VE}`,borderRadius:10,padding:"9px 14px",fontSize:12,color:VE,fontWeight:800,marginBottom:10}}>
            ✓ Pasta Drive aberta! Baixe os arquivos e selecione-os abaixo.
          </div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}
            onDragOver={e=>{e.preventDefault();e.currentTarget.style.outline=`2px dashed ${VE}`;}}
            onDragLeave={e=>{e.currentTarget.style.outline="none";}}
            onDrop={e=>{e.preventDefault();e.currentTarget.style.outline="none";const files=Array.from(e.dataTransfer.files||[]);setArqs(x=>[...x,...files.map(f=>({ico:f.type?.includes("image")?"📷":"📄",n:f.name,tipo:f.type?.includes("image")?"Foto":"PDF",obj:f}))]);setDriveAbertoPac(false);}}>
            <button type="button" onClick={()=>refC.current?.click()} style={{border:"2px dashed "+T,borderRadius:14,padding:"20px 8px",background:"#F0F9FF",color:T,fontWeight:900,cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <span style={{fontSize:26}}>📷</span>Câmera
            </button>
            <button type="button" onClick={()=>refA.current?.click()} style={{border:"2px dashed "+G,borderRadius:14,padding:"20px 8px",background:"#FFFBEB",color:G,fontWeight:900,cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <span style={{fontSize:26}}>📁</span>Arquivo Local
            </button>
            <button type="button"
              onClick={()=>{abrirDrive();setDriveAbertoPac(true);}}
              style={{border:"2px solid #1a73e8",borderRadius:14,padding:"20px 8px",background:"#EEF4FF",color:"#1a73e8",fontWeight:900,cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <span style={{fontSize:26}}>☁️</span>Drive
            </button>
          </div>
          <p style={{fontSize:11,color:"#94A3B8",textAlign:"center",margin:"4px 0 10px"}}>💡 Arraste arquivos da pasta Drive diretamente sobre os botões acima</p>
          {arqs.length>0&&<div style={{marginTop:12,display:"grid",gap:6}}>
            {arqs.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,border:"1px solid #CBD5E1",borderRadius:10,padding:"8px 10px",background:"#F8FAFC"}}>
              <span style={{fontSize:18}}>{a.tipo==="Foto"?"📷":"📄"}</span>
              <strong style={{fontSize:12,color:N,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.n}</strong>
              <span style={{fontSize:10,color:"#64748B",fontWeight:800,flexShrink:0}}>{a.tipo}</span>
              <button type="button" onClick={()=>setArqs(x=>x.filter((_,j)=>j!==i))} style={{border:"none",background:"#FFF5F5",color:VM,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontWeight:900,fontSize:11,fontFamily:"inherit",flexShrink:0}}>✕</button>
            </div>)}
          </div>}
          {arqs.length===0&&<p style={{color:"#94A3B8",fontSize:12,textAlign:"center",marginTop:12}}>Nenhum documento — tudo bem, pode continuar.</p>}
          <Nav/>
        </div>}

        {/* ── PASSO 3: REVISÃO EDITÁVEL ── */}
        {passo===3&&<div style={sc_.card({padding:18})}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <H2 ch="✅ Revisão antes de enviar" s={{fontSize:18,margin:0}}/>
            <span style={{fontSize:11,color:G,fontWeight:800,background:G+"18",border:`1px solid ${G}44`,borderRadius:999,padding:"3px 10px"}}>✏️ Editável</span>
          </div>
          <p style={{margin:"0 0 10px",color:"#64748B",fontSize:12}}>Clique no texto abaixo para corrigir qualquer campo antes de enviar.</p>
          <textarea
            value={resumoEditavel}
            onChange={e=>setResumoEditavel(e.target.value)}
            rows={22}
            style={{
              width:"100%",border:`2px solid ${G}55`,borderRadius:12,
              padding:"14px 16px",fontSize:13,lineHeight:1.75,
              color:N,fontWeight:700,fontFamily:"Georgia,serif",
              background:"#FFFBEB",resize:"vertical",outline:"none",
              boxSizing:"border-box",
            }}
          />
          <p style={{fontSize:11,color:"#94A3B8",margin:"8px 0 0"}}>Ao enviar, o sistema cria um dossiê provisório e sinaliza a recepção.</p>
          <Nav final/>
        </div>}

        {/* ── PASSO 4: CONCLUÍDO ── */}
        {passo===4&&<div style={sc_.card({padding:28,textAlign:"center"})}>
          <div style={{fontSize:48,marginBottom:8}}>🎉</div>
          <div style={{fontSize:12,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:.8}}>Dossiê criado</div>
          <h1 style={{fontSize:22,color:VE,margin:"8px 0 12px"}}>Envio concluído com sucesso</h1>
          <p style={{fontSize:14,color:"#475569",lineHeight:1.6,margin:"0 auto 16px",maxWidth:460}}>Seus dados ficaram em standby para a recepção conferir. O médico verá o resumo quando o atendimento for aberto.</p>
          <div style={{display:"grid",gap:6,background:"#F0FDF4",border:`1.5px solid ${VE}44`,borderRadius:14,padding:14,marginBottom:16,textAlign:"left"}}>
            <strong style={{fontSize:14,color:N}}>{form.nome||"Paciente"}</strong>
            <span style={{fontSize:12,color:"#64748B"}}>✅ Status: aguardando recepção</span>
            <span style={{fontSize:12,color:"#64748B"}}>📎 {arqs.length} documento(s) anexado(s)</span>
          </div>
          <Btn v="gold" ch="← Voltar ao portal" s={{width:"100%",fontSize:14,padding:12}} onClick={onConcluido}/>
        </div>}

      </div>
    </div>
  </div>;
}
export default PrimConsultaPaciente;
