// ─────────────────────────────────────────────────────────────────────────────
// ProntuarioDossieUnico.jsx — Prontuário em página única com editor rich-text
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from "react";
import { N, G, T, VE, VM } from "../../utils/constants";
import { sc_, Btn, NOW, TODAY, limparMarkdown } from "../../components/ui/primitives";
import { _apiUrl } from "../../utils/api";
import { mesmoPacienteDossie, executarProntuarioSecurity } from "../../utils/security";
import {
  criarDossieInicial, validarAPAC, gerarDossieClaude,
} from "../../utils/dossie";
import {
  limparPlaceholderConsulta, extrairCamposIA, extrairValorResumo,
  extrairSecaoIA, extrairEvolucaoIA, extrairExamesRealizadosTexto,
} from "../../utils/parse";
import { criarDocumentoClinico, integrarDocumentoNoDossie } from "../../utils/pipeline";
import UploadSimples from "../../components/UploadSimples.jsx";
import { DocumentosPosEvolucao } from "./DossieBarComponents";

export default function ProntuarioDossieUnico({pac,dossie,setDossie,up,addMsg,onSalvarEvolucao,onAbrirAPAC}){
  const editorRef=useRef(null);
  const [processando,setProcessando]=useState(false);
  const [salvo,setSalvo]=useState(!!dossie?.evolucao?.textoFinal);
  const dossieAtual=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
  const [pagina,setPagina]=useState(()=>montarPaginaProntuario(dossieAtual,pac).html);
  const [texto,setTexto]=useState(()=>montarPaginaProntuario(dossieAtual,pac).texto);
  const [resumoExterno,setResumoExterno]=useState("");

  function esc(v=""){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
  function valor(v){
    const t=limparPlaceholderConsulta(v).trim();
    if(!t)return "";
    if(/^(—|-|nao informado|não informado|aguarda avaliação|aguarda avaliacao|sem dados)$/i.test(t))return "";
    return t;
  }
  function limpar(txt=""){
    return limparPlaceholderConsulta(txt)
      .replace(/[•*_\`>#|]+/g,"")
      .replace(/[📋📄📎📥🧾🧬🧪🩺⚠️✅❌⏳💾📝☁️🤖]/g,"")
      .split("\n")
      .map(l=>l.replace(/^\s*[-–—]+\s*/,"").replace(/^\s*\d+[\.)]\s*/,"").replace(/\s+/g," ").trim())
      .filter(Boolean)
      .join("\n")
      .replace(/\n{3,}/g,"\n\n")
      .trim();
  }
  function curta(txt="",max=230){
    const t=limpar(txt).replace(/^(tipo de documento|achados principais|conclus[aã]o|impress[aã]o|resumo|exames?)\s*:?\s*/i,"");
    if(t.length<=max)return t;
    return t.slice(0,max).replace(/\s+\S*$/,"").trim()+".";
  }
  function dataDoc(doc={}){
    const raw=doc.data||doc.dataExame||doc.criadoEm||doc.createdAt||TODAY();
    return String(raw).split(",")[0].trim();
  }
  function nomeExame(doc={}){
    return curta(doc.tipo||doc.nome||doc.exame||"Exame",80);
  }
  function resumoExame(doc={}){
    const raw=doc.resumo||doc.conteudo||doc.texto||"";
    // Remove identification headers injected by Claude
    const limpo=raw
      .replace(/^(para prontu[aá]rio oncol[oó]gico|identifica[cç][aã]o|===.*?===|---.*?---)\s*/gim,"")
      .replace(/\b(Nome|CPF|CNS|Nascimento|Data de nascimento|Idade|Sexo|Naturalidade|Resid[eê]ncia|Endere[cç]o)\s*:\s*[^\n]+\n?/gi,"")
      .replace(/^\s*\n/gm,"")
      .trim();
    return curta(limpo||raw,200);
  }
  // Verifica se documento é um exame médico real (não dump de identificação)
  function isExameReal(doc={}){
    const tipo=String(doc.tipo||doc.nome||"").toLowerCase();
    const origem=String(doc.origem||"").toLowerCase();
    // Rejeitar uploads de identificação/resumo geral
    if(/^upload\s*(recep|pac|geral)/i.test(tipo))return false;
    if(origem==="paciente"&&!(/biop|tomo|pet|resson|lab|imag|mamog|eco|rx|rx|cintil|patolog/i.test(tipo)))return false;
    // Aceitar qualquer doc com keyword de exame
    if(/biop|tomo|pet|resson|mamog|lab|hemograma|anatomopat|imagem|eco|cintil|rx|patolog|resona/i.test(tipo))return true;
    // Aceitar docs de origem médica/drive
    if(/medico|drive|ia_disc|ia_triag|enferm|prontuario/i.test(origem))return true;
    // Aceitar prescrição QT
    if(/prescri|ciclo|qt/i.test(tipo))return true;
    return true; // default: mostrar
  }
  function textoDoPacienteAtual(txt="",p=pac){
    const t=normalizaPacienteValor(txt);
    if(!t)return true;
    const nome=normalizaPacienteValor(p?.nome||p?.pac);
    if(!nome)return false;
    const partes=nome.split(" ").filter(x=>x.length>2);
    const primeiro=partes[0]||"";
    const ultimo=partes.length>1?partes[partes.length-1]:"";
    const citaAtual=t.includes(nome)||(primeiro&&ultimo&&t.includes(primeiro)&&t.includes(ultimo));
    if(citaAtual)return true;
    const pareceIdentificado=/\b(paciente|identificacao|identificação|nascimento|cpf|cns|idade|sexo)\b/.test(t);
    return !pareceIdentificado;
  }
  function docPacienteAtual(doc={}){
    return textoDoPacienteAtual([doc.nome,doc.tipo,doc.resumo,doc.conteudo,doc.texto].filter(Boolean).join(" "),pac);
  }
  function htmlParaTexto(html=""){
    const div=document.createElement("div");
    div.innerHTML=html;
    return limpar(div.innerText||div.textContent||"");
  }
  function linhasClaude(resumo=""){
    return limpar(resumo)
      .split("\n")
      .map(l=>l.trim())
      .filter(l=>l&&!EXAME_REAL_RE.test(l)&&!/^evolu[cç][aã]o/i.test(l)&&!/^conduta/i.test(l)&&!/^observa/i.test(l)&&!/^prontu[aá]rio/i.test(l)&&!/^para prontu[aá]rio/i.test(l)&&!/^data\s*:/i.test(l)&&!/^paciente\s*:/i.test(l)&&!/^identifica/i.test(l)&&!/^diagn[oó]stico$/i.test(l)&&!/^dados/i.test(l)&&!/^exames?$/i.test(l)&&!/^oncol[oó]gico$/i.test(l))
      .slice(0,6)
      .map(l=>curta(l,210));
  }
  function montarPaginaProntuario(d=dossieAtual,p=pac){
    const valido=mesmoPacienteDossie(d,p);
    const base=valido?d:criarDossieInicial(p);
    const px={...(base?.paciente||{}),...(p||{})};
    const textoPadrao=gerarTextoEvolucao({...base,paciente:px});
    const secStyle="font-size:27px;font-weight:950;color:"+N+";text-transform:uppercase;letter-spacing:.5px;margin:30px 0 14px;border-bottom:3px solid "+G+";padding-bottom:8px;";
    const secStyleMaior="font-size:32px;font-weight:950;color:"+N+";text-transform:uppercase;letter-spacing:.6px;margin:34px 0 16px;border-bottom:4px solid "+G+";padding-bottom:9px;";
    const linhaStyle="font-size:17px;line-height:1.72;font-weight:500;color:#1E293B;margin:4px 0;";
    const campoStyle="font-size:17px;line-height:1.72;color:#24364f;margin:4px 0;font-weight:500;";
    const exameStyle="font-size:16px;line-height:1.62;color:#24364f;margin:7px 0;padding:10px 12px;background:#FFFFFF;border:1px solid #E2E8F0;border-left:4px solid "+T+";border-radius:0 8px 8px 0;";
    const folhaStyle="background:#fff;border:1px solid #E2E8F0;border-radius:4px;padding:34px 42px;box-shadow:0 10px 28px rgba(15,23,42,.07);";
    const titulosBase=["DADOS ANAGRÁFICOS","RESUMO CLÍNICO","DADOS CLÍNICOS","DADOS ONCOLÓGICOS","LAUDOS EM CRONOLOGIA","CONDUTA","OBSERVAÇÕES"];
    const limparTituloLinha=l=>limparPlaceholderConsulta(l).replace(/^[=\s]+/g,"").replace(/[=\s:]+$/g,"").replace(/\s+/g," ").trim();
    const tituloDaLinha=l=>{
      const clean=limparTituloLinha(l).toUpperCase();
      return titulosBase.find(t=>clean.startsWith(t));
    };
    const linhas=textoPadrao.split("\n");
    const partes=[
      "<div style='"+folhaStyle+"'>",
      "<div style='font-size:28px;font-weight:900;color:"+N+";text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;'>Evolução Médica</div>",
      "<div style='font-size:14px;font-weight:800;color:#64748B;margin-bottom:22px;'>"+esc(px.nome||"Paciente não selecionado")+"</div>",
    ];
    let secAtual="";
    linhas.forEach((raw)=>{
      const linha=limparPlaceholderConsulta(raw).trim();
      const tituloSecao=tituloDaLinha(linha);
      if(tituloSecao){
        secAtual=tituloSecao;
        const tituloLimpo=limparTituloLinha(linha).toUpperCase();
        const estiloSecao=(tituloSecao==="DADOS CLÍNICOS"||tituloSecao==="DADOS ONCOLÓGICOS")?secStyleMaior:secStyle;
        partes.push("<div style='"+estiloSecao+"'>"+esc(tituloLimpo||tituloSecao)+"</div>");
        if(secAtual==="CONDUTA")partes.push("<div style='min-height:86px;border:1px dashed #CBD5E1;border-radius:8px;background:#FAFBFC;margin:8px 0 4px;'></div>");
        return;
      }
      if(!linha){
        partes.push("<div style='height:10px;'></div>");
        return;
      }
      const semBullet=linha.replace(/^•\s*/,"");
      if(secAtual==="LAUDOS EM CRONOLOGIA"&&/\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\s+-/.test(semBullet)){
        const [data,exame,...rest]=semBullet.split(/\s+-\s+/);
        partes.push("<div style='"+exameStyle+"'><strong style='color:"+N+";'>"+esc(data)+" - "+esc(exame||"Exame")+"</strong><div style='font-weight:500;color:#334155;'>"+esc(rest.join(" - "))+"</div></div>");
        return;
      }
      if(/^[A-Za-zÀ-ÿ0-9 /()-]+:\s*/.test(linha)){
        const idx=linha.indexOf(":");
        const label=linha.slice(0,idx+1);
        const valorCampo=limparPlaceholderConsulta(linha.slice(idx+1)).trim();
        const labelMaior=(secAtual==="DADOS CLÍNICOS"||secAtual==="DADOS ONCOLÓGICOS");
        const labelStyle="color:"+N+";font-weight:950;text-transform:uppercase;font-size:"+(labelMaior?"20px":"18px")+";";
        const valorStyle="font-size:"+(labelMaior?"18px":"17px")+";font-weight:500;color:#24364f;";
        partes.push("<div style='"+campoStyle+"'><span style='"+labelStyle+"'>"+esc(label.toUpperCase())+"</span>"+(valorCampo?" <span style='"+valorStyle+"'>"+esc(valorCampo)+"</span>":"")+"</div>");
        return;
      }
      partes.push("<div style='"+linhaStyle+"'>"+esc(linha.replace(/^•\s*/,""))+"</div>");
    });
    partes.push("</div>");
    const html=partes.join("");
    return {html,texto:htmlParaTexto(html)};
  }
  function aplicarPagina(d=dossieAtual,p=pac){
    const pg=montarPaginaProntuario(d,p);
    setPagina(pg.html);
    setTexto(pg.texto);
    setSalvo(!!d?.evolucao?.textoFinal);
    setTimeout(()=>{if(editorRef.current)editorRef.current.innerHTML=pg.html;},0);
  }
  useEffect(()=>{aplicarPagina(dossieAtual,pac);},[
    dossie?.id,dossie?.resumoClaude,dossie?.documentos?.length,dossie?.paciente?.diag,dossie?.paciente?.queixa,
    pac?.pacID,pac?.nome,pac?.cpf,pac?.cns,pac?.nasc,
    pac?.diag,pac?.cid,pac?.local_cancer,pac?.queixa,pac?.antec,pac?.meds,pac?.alerg,
    pac?.anam_cirurgia,pac?.anam_hist_fam,pac?.sintomas_atuais,pac?.trat,pac?.bio,pac?.estadio,pac?.ecog,
  ]);
  useEffect(()=>{
    if(!dossie||!setDossie||!mesmoPacienteDossie(dossie,pac))return;
    const docsOrig=dossie.documentos||[];
    const docsOk=docsOrig.filter(docPacienteAtual);
    const resumoOk=textoDoPacienteAtual(dossie.resumoClaude,pac)?(dossie.resumoClaude||""):"";
    if(docsOk.length!==docsOrig.length||resumoOk!==(dossie.resumoClaude||"")){
      setDossie({...dossie,documentos:docsOk,resumoClaude:resumoOk,evolucao:{...(dossie.evolucao||{}),rascunho:"",textoFinal:"",html:""},updatedAt:NOW()});
    }
  },[dossie?.id,dossie?.documentos?.length,dossie?.resumoClaude,pac?.pacID,pac?.nome,pac?.cpf,pac?.cns,pac?.nasc]);

  const organizar=async()=>{
    setProcessando(true);
    try{
      const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
      setDossie&&setDossie({...base,paciente:{...(base.paciente||{}),...pac},status:"claude_processando",updatedAt:NOW()});
      const novo=await gerarDossieClaude({...base,paciente:{...(base.paciente||{}),...pac}});
      const limpo={...novo,paciente:{...(novo.paciente||{}),...pac},status:"pronto_medico",updatedAt:NOW()};
      limpo.evolucao={...(limpo.evolucao||{}),rascunho:montarPaginaProntuario(limpo,pac).texto,textoFinal:""};
      limpo.apac=validarAPAC(limpo);
      if(!executarProntuarioSecurity({pac,texto:[limpo.resumoClaude,limpo.evolucao?.rascunho].filter(Boolean).join("\n\n"),dossie:limpo,origem:"Dossiê Claude"},addMsg))return;
      setDossie&&setDossie(limpo);
      aplicarPagina(limpo,pac);
      setSalvo(false);
    }finally{setProcessando(false);}
  };
  const adicionarResumoDocumento=(res,meta={})=>{
    const dossieBase=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
    const doc=criarDocumentoClinico({
      tipo:meta.tipo||"Documento",
      nome:meta.arquivos?.[0]?.n||"Documento analisado",
      resumo:limpar(res),
      origem:"prontuario_dragdrop",
      extra:{exames:extrairExamesRealizadosTexto(res),evolucaoClaude:extrairEvolucaoIA(res)},
    });
    const novoDossie=integrarDocumentoNoDossie(doc,{pac,dossie:dossieBase,setDossie,up,addMsg});
    if(novoDossie){aplicarPagina(novoDossie,pac);setSalvo(false);}
  };
  const aplicarResumoExterno=()=>{
    const res=limparMarkdown(resumoExterno||"").trim();
    if(!res){alert("Cole primeiro o resumo gerado no GPT/Claude.");return;}
    if(!executarProntuarioSecurity({pac,texto:res,dossie,origem:"Resumo externo colado"},addMsg))return;
    const camposIA=extrairCamposIA(res);
    const camposClinicos={
      antec:extrairValorResumo(res,["antecedentes patológicos","antecedentes patologicos","antecedentes"]),
      meds:extrairValorResumo(res,["medicações de uso contínuo","medicacoes de uso continuo","medicações","medicacoes"]),
      alerg:extrairValorResumo(res,["alergias","alergia"]),
      anam_cirurgia:extrairValorResumo(res,["cirurgias prévias","cirurgias previas","cirurgias"]),
      anam_hist_fam:extrairValorResumo(res,["histórico familiar","historico familiar","histórico familiar oncológico","historico familiar oncologico"]),
      vacinas:extrairValorResumo(res,["calendário vacinal","calendario vacinal","vacinas"]),
      exFisico:extrairValorResumo(res,["exame físico","exame fisico"]),
      exames_resumo:extrairSecaoIA(res,/^LAUDOS?\s+EM\s+CRONOLOGIA\s*:?\s*/i),
      justif_apac:extrairSecaoIA(res,/^DADOS\s+ONCOL[ÓO]GICOS\s*:?\s*/i)||extrairValorResumo(res,["justificativa"]),
    };
    const sigtap=res.match(/\b03\.?\d{2}\.?\d{2}\.?\d{3}[-.]?\d\b/)?.[0]?.replace(/\D/g,"")||"";
    const protocolo=extrairValorResumo(res,["protocolo","esquema","tratamento","nome do procedimento"]);
    const pacienteAtualizado={
      ...pac,
      ...Object.fromEntries(Object.entries({...camposIA,...camposClinicos}).filter(([,v])=>v&&String(v).trim())),
      cod_proc:sigtap||pac.cod_proc||"",
      trat:protocolo||camposIA.trat||pac.trat||"",
    };
    Object.entries(pacienteAtualizado).forEach(([k,v])=>{if(v&&pac?.[k]!==v)up&&up(k,v);});
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pacienteAtualizado)):criarDossieInicial(pacienteAtualizado);
    const doc={id:Date.now(),tipo:"Resumo externo GPT/Claude",nome:"Resumo completo colado pelo médico",resumo:res,origem:"medico_resumo_externo",criadoEm:NOW(),exames:extrairExamesRealizadosTexto(res),evolucaoClaude:extrairEvolucaoIA(res)};
    const novo={...base,paciente:{...(base.paciente||{}),...pacienteAtualizado},documentos:[doc,...(base.documentos||[])],resumoClaude:res,status:"pronto_medico",updatedAt:NOW()};
    novo.evolucao={...(novo.evolucao||{}),rascunho:montarPaginaProntuario(novo,pacienteAtualizado).texto,textoFinal:""};
    novo.apac=validarAPAC(novo);
    setDossie&&setDossie(novo);
    aplicarPagina(novo,pacienteAtualizado);
    setResumoExterno("");
    setSalvo(false);
    addMsg&&addMsg("Médico","APAC","Resumo externo inserido: campos clínicos, evolução e APAC foram atualizados para revisão.","msg");
  };
  const arquivoBase64Simples=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||"").split(",")[1]||"");r.onerror=reject;r.readAsDataURL(file);});
  const analisarUploadSimples=async(formData,payload={})=>{
    setProcessando(true);
    try{
      const arquivos=payload.arquivos||[];
      const textoLivre=payload.textoLivre||"";
      const apiKeyLocal=localStorage.getItem("anthropic_key")||"";
      const filesBase64=[];
      for(const file of arquivos){
        const mimeType=file.type||(/\.pdf$/i.test(file.name)?"application/pdf":"application/octet-stream");
        if(["application/pdf","image/jpeg","image/png","image/webp"].includes(mimeType))filesBase64.push({name:file.name,mimeType,base64:await arquivoBase64Simples(file)});
      }
      const sysPrompt=[
        "Você é assistente oncológico do Dr. Silas Negrão, Hospital do Bem, Patos-PB.",
        "Leia os documentos e retorne UM ÚNICO resumo no padrão abaixo. Sem asteriscos, sem markdown, sem traços decorativos, sem parágrafos longos.",
        "Não invente dados. Se não encontrar o dado, deixe o campo em branco.",
        "",
        "DADOS CLÍNICOS:",
        "Antecedentes patológicos:",
        "Medicações de uso contínuo:",
        "Alergias:",
        "Cirurgias prévias:",
        "Calendário vacinal:",
        "Histórico familiar:",
        "",
        "DADOS ONCOLÓGICOS:",
        "Tipo de tumor:",
        "Sede tumoral:",
        "Estadiamento/TNM:",
        "Estágio:",
        "Subtipo:",
        "Biomarcadores:",
        "CID-10:",
        "ECOG:",
        "",
        "LAUDOS EM CRONOLOGIA:",
        "• DD/MM/AA - TIPO DO EXAME - resumo com foco oncológico em uma linha. Exemplo: 03/03/26 - TC TÓRAX - Massa pulmonar em segmento inferior medindo 8,2 cm, linfonodo mediastinal direito 2,3 cm (outros achados: nefrolitíase direita, colelitíase).",
        "",
        "PENDÊNCIAS:",
        "• Uma pendência objetiva por linha.",
        "Paciente atual: "+(pac?.nome||"")+" · Nasc: "+(pac?.nasc||"")+" · Diagnóstico: "+(pac?.diag||"—"),
        "Arquivos: "+(arquivos.map(f=>f.name).join(", ")||"nenhum"),
        textoLivre?"Texto colado: "+textoLivre:"",
      ].filter(Boolean).join("\n");
      let resumo="";
      let backendOk=false;
      try{
        formData.set("paciente_json",JSON.stringify(pac||{}));
        formData.set("recepcao_json",JSON.stringify({}));
        formData.set("prompt_modelo",sysPrompt);
        const r=await fetch(_apiUrl()+"/api/dossie/gerar",{method:"POST",body:formData});
        const data=await r.json().catch(()=>({}));
        if(r.ok&&data.ok&&data.status==="concluido"){
          resumo=data.resumo||data.text||"";
          backendOk=!!resumo;
        }else if(r.ok&&data.ok&&data.dossieId){
          for(let tent=0;tent<30;tent++){
            await new Promise(resolve=>setTimeout(resolve,2000));
            const s=await fetch(_apiUrl()+"/api/dossie/status/"+data.dossieId).then(x=>x.json()).catch(()=>({}));
            if(s.status_analise==="concluido"){resumo=s.resumo_claude||"";backendOk=!!resumo;break;}
            if(s.status_analise==="erro")throw new Error(s.erro_analise||"Falha na análise do backend.");
          }
        }else if(r.status!==400){
          throw new Error(data.message||("Backend HTTP "+r.status));
        }
      }catch(_){}
      if(!backendOk&&!apiKeyLocal){
        try{
          const r=await fetch(_apiUrl()+"/api/claude/resumo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:sysPrompt,maxTokens:900,files:filesBase64})});
          const data=await r.json().catch(()=>({}));
          if(r.ok&&data.ok){resumo=data.text||"";backendOk=true;}
        }catch(_){}
      }
      if(!backendOk){
        if(!apiKeyLocal)throw new Error("Backend Claude indisponível.");
        const content=filesBase64.map(f=>f.mimeType==="application/pdf"?{type:"document",source:{type:"base64",media_type:f.mimeType,data:f.base64}}:{type:"image",source:{type:"base64",media_type:f.mimeType,data:f.base64}});
        content.push({type:"text",text:textoLivre||"Analise os arquivos acima."});
        const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":apiKeyLocal,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-5",max_tokens:900,system:sysPrompt,messages:[{role:"user",content}]})});
        const data=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(data.error?.message||("Erro Claude "+r.status));
        resumo=data.content?.[0]?.text||"";
      }
      if(!resumo.trim())throw new Error("Claude não retornou resumo.");
      resumo=limparMarkdown(resumo);
      if(!executarProntuarioSecurity({pac,texto:resumo,dossie,origem:"Upload/análise IA"},addMsg))return;
      // Extrair campos e popular pac via up()
      const camposDoc=extrairCamposIA(resumo);
      if(up&&Object.keys(camposDoc).length){Object.entries(camposDoc).forEach(([k,v])=>{if(v&&!pac?.[k])up(k,v);});}
      adicionarResumoDocumento(resumo,{arquivos:arquivos.map(f=>({n:f.name,tipo:f.type})),texto:textoLivre,destino:"prontuario",origem:"Médico",tipo:"Upload simples"});
    }finally{setProcessando(false);}
  };
  const salvar=()=>{
    const htmlAtual=editorRef.current?.innerHTML||pagina;
    const textoFinal=htmlParaTexto(htmlAtual);
    if(!executarProntuarioSecurity({pac,texto:textoFinal,dossie,origem:"Salvar evolução médica"},addMsg))return;
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
    const novo={...base,paciente:{...(base.paciente||{}),...pac},status:"evolucao_salva",evolucao:{...(base.evolucao||{}),html:htmlAtual,rascunho:textoFinal,textoFinal,salvaEm:NOW()},updatedAt:NOW()};
    novo.apac=validarAPAC(novo);
    const okCallback=onSalvarEvolucao?onSalvarEvolucao(textoFinal):true;
    if(okCallback===false)return;
    setDossie&&setDossie(novo);
    up&&up("obs_ultima_evolucao",textoFinal);
    setTexto(textoFinal);
    setPagina(htmlAtual);
    setSalvo(true);
  };
  const limparPagina=()=>{
    const pg=montarPaginaProntuario({paciente:{...pac},documentos:[],resumoClaude:"",evolucao:{textoFinal:"",rascunho:""}},pac);
    setPagina(pg.html);setTexto(pg.texto);setSalvo(false);
    setTimeout(()=>{if(editorRef.current)editorRef.current.innerHTML=pg.html;},0);
  };
  const documentosDossie=(dossieAtual?.documentos||[]).filter(docPacienteAtual);
  const apagarDocumentoDossie=(doc)=>{
    if(!doc?.id)return;
    if(!window.confirm("Apagar este documento/resumo do dossiê deste atendimento?"))return;
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):dossieAtual;
    const docs=(base.documentos||[]).filter(x=>String(x.id)!==String(doc.id));
    const novo={
      ...base,
      documentos:docs,
      resumoClaude:docs.map(x=>x?.resumo||x?.conteudo||x?.texto||"").filter(Boolean).join("\n\n"),
      updatedAt:NOW(),
    };
    novo.evolucao={...(novo.evolucao||{}),rascunho:montarPaginaProntuario(novo,pac).texto,textoFinal:""};
    novo.apac=validarAPAC(novo);
    setDossie&&setDossie(novo);
    aplicarPagina(novo,pac);
    setSalvo(false);
  };
  return <div style={{display:"grid",gap:14,maxWidth:1180,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{flex:1}}>
        <div style={{fontSize:12,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:1}}>Dossiê Oncológico Inteligente</div>
        <div style={{fontSize:24,fontWeight:900,color:N}}>Prontuário em página única</div>
        <div style={{fontSize:14,fontWeight:800,color:"#475569"}}>{pac?.nome||"Paciente não selecionado"}</div>
      </div>
      <Btn v="navy" ch={processando?"Claude resumindo":"Resumir com Claude"} dis={processando} onClick={organizar}/>
      <Btn v="ghost" ch="Limpar página" onClick={limparPagina}/>
      <Btn v="green" ch="Salvar evolução" s={{padding:"10px 18px",fontSize:14}} onClick={salvar}/>
      <Btn v="gold" ch="APAC anti-glosa" s={{padding:"10px 18px",fontSize:14}} onClick={()=>{setDossie&&setDossie(d=>({...d,apac:validarAPAC(d),status:"apac_validacao"}));onAbrirAPAC&&onAbrirAPAC();}}/>
    </div>
    <details style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,padding:12}}>
      <summary style={{cursor:"pointer",fontSize:15,fontWeight:900,color:N}}>Entrada de documento para resumo pelo Claude</summary>
      <div style={{marginTop:12}}><UploadSimples pacienteId={Number(pac?.id||pac?.paciente_id)||""} onAnalisar={analisarUploadSimples}/></div>
    </details>
    <details open style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,padding:12}}>
      <summary style={{cursor:"pointer",fontSize:15,fontWeight:900,color:N}}>Colar resumo externo GPT/Claude e preencher prontuário/APAC</summary>
      <p style={{fontSize:12,color:"#64748B",margin:"8px 0"}}>Cole o resumo completo já gerado em outro site. O app extrai diagnóstico, CID, estadiamento, laudos em cronologia, dados clínicos e alimenta a evolução para revisão.</p>
      <textarea value={resumoExterno} onChange={e=>setResumoExterno(e.target.value)} rows={8} placeholder={"Cole aqui o resumo externo no padrão:\nDADOS CLÍNICOS...\nDADOS ONCOLÓGICOS...\nLAUDOS EM CRONOLOGIA..."} style={{...sc_.inp,width:"100%",resize:"vertical",fontFamily:"Segoe UI, Arial, sans-serif",fontSize:13,lineHeight:1.55}}/>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <Btn v="gold" ch="Inserir no prontuário e APAC" dis={!resumoExterno.trim()} s={{padding:"10px 14px"}} onClick={aplicarResumoExterno}/>
        <Btn v="ghost" ch="Limpar texto" s={{padding:"10px 14px"}} onClick={()=>setResumoExterno("")}/>
      </div>
    </details>
    {documentosDossie.length>0&&<details style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,padding:12}}>
      <summary style={{cursor:"pointer",fontSize:15,fontWeight:900,color:N}}>Documentos usados nesta evolução</summary>
      <div style={{display:"grid",gap:8,marginTop:10}}>
        {documentosDossie.map(doc=><div key={doc.id} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,alignItems:"center",background:"#F8FAFC",border:"1px solid #DDE3EC",borderRadius:9,padding:"9px 11px"}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:950,color:N,textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.tipo||"Documento"}{doc.nome?" - "+doc.nome:""}</div>
            <div style={{fontSize:11,color:"#64748B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.criadoEm||doc.data||""}</div>
          </div>
          <button type="button" onClick={()=>apagarDocumentoDossie(doc)} style={{border:"1px solid "+VM+"55",background:"#FFF5F5",color:VM,borderRadius:8,padding:"7px 12px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>Apagar</button>
        </div>)}
      </div>
    </details>}
    <div
      ref={editorRef}
      key={(pac?.pacID||pac?.cpf||pac?.nome||"sem_paciente")+"_"+(dossieAtual?.updatedAt||"")}
      contentEditable
      suppressContentEditableWarning
      onInput={e=>{setTexto(htmlParaTexto(e.currentTarget.innerHTML));setSalvo(false);}}
      dangerouslySetInnerHTML={{__html:pagina}}
      style={{
        background:"#fff",
        border:"1px solid #E2E8F0",
        borderRadius:3,
        minHeight:760,
        padding:"46px 58px",
        fontFamily:"Segoe UI, Arial, sans-serif",
        boxShadow:"0 10px 28px rgba(15,23,42,.08)",
        outline:"none",
      }}
    />
    {salvo&&<DocumentosPosEvolucao dossie={dossie} setDossie={setDossie} addMsg={addMsg} onAbrirAPAC={onAbrirAPAC}/>}
  </div>;
}
