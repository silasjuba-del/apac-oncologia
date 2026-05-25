// ─────────────────────────────────────────────────────────────────────────────
// RecepcaoPage.jsx — Módulo de Recepção Oncológica
// Extraído de App.jsx — importa constants.js + primitives.jsx + storage/db diretamente
// Deps ainda em App.jsx passados via props: extrairCamposIA, extrairEvolucaoIA,
//   extrairExamesRealizadosTexto, criarDossieInicial, orquestrarDossieAtendimento,
//   apiUrl, ListaEsperaPrioridade, AgendamentoComp
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from "react";
import { N, T, G, VE, AM, VM, BG, AUTOR, AUTOR2, HOSP, EQUIPE, abrirDrive, PAC0, genPacID, getCIDPorSede } from "../../utils/constants";
import { sc_, Btn, H2, H3, Fld, Bge, ResumoBullets, TopBar, Footer, PrintModal, ChatAba, limparMarkdown, NOW } from "../../components/ui/primitives";
import { savePacAtual } from "../../utils/storage.js";
import { dbSalvarPaciente } from "../../utils/db.js";
import PacienteDemograficoForm from "../../pages/PacienteDemograficoForm";
import AgendamentoComp from "../../components/shared/AgendamentoComp";
import ListaEsperaPrioridade from "../../components/shared/ListaEsperaPrioridade";

export default function RecepcaoPage({
  pac,up,setPac,setPg,
  listaEspera=[],setListaEspera,addFila,
  agendamentos=[],addAgendamento,
  funcLogado,mensagens,addMsg,
  alertCount,onAlert,onEnviar,dossie,setDossie,
  // Deps ainda em App.jsx:
  extrairCamposIA,extrairEvolucaoIA,extrairExamesRealizadosTexto,
  criarDossieInicial,orquestrarDossieAtendimento,
  apiUrl,
}){
  const [abaRec,setAbaRec]=useState("cadastro");
  const [abaAg,setAbaAg]=useState("retorno");
  const [abaExames,setAbaExames]=useState("lab");
  const [labSel,setLabSel]=useState({});
  const [imgSel,setImgSel]=useState({});
  const togLab=k=>setLabSel(x=>({...x,[k]:!x[k]}));
  const togImg=k=>setImgSel(x=>({...x,[k]:!x[k]}));
  const labSelecionados=Object.keys(labSel).filter(k=>labSel[k]);
  const imgSelecionados=Object.keys(imgSel).filter(k=>imgSel[k]);
  const [print,setPrint]=useState(null);
  const [retSel,setRetSel]=useState(null);
  const [chkNome,setChkNome]=useState("");
  const [chkProto,setChkProto]=useState("");
  const [upFiles,setUpFiles]=useState([]);
  const refCam=useRef(null);const refArq=useRef(null);
  const onCamRec=e=>{const f=Array.from(e.target.files||[]);setUpFiles(x=>[...x,...f.map(fl=>({ico:"📸",n:fl.name,tp:"Foto",obj:fl}))]);e.target.value="";};
  const onArqRec=e=>{const f=Array.from(e.target.files||[]);setUpFiles(x=>[...x,...f.map(fl=>({ico:"📄",n:fl.name,tp:"Doc",obj:fl}))]);e.target.value="";};
  const [pacRecSel,setPacRecSel]=useState(null);
  const [driveAbertoRec,setDriveAbertoRec]=useState(false);
  const [loadingIA,setLoadingIA]=useState(false);
  const [resultadoIA,setResultadoIA]=useState(null);
  const [agentesAtivos,setAgentesAtivos]=useState([]);
  const cidSugeridoRecepcao=getCIDPorSede(pac?.local_cancer);
  useEffect(()=>{
    if(pacRecSel!==null)return;
    if(pac?.nome&&pac?.status==="aguardando_recepcao")setPacRecSel(pac);
  },[pacRecSel,pac?.pacID,pac?.nome,pac?.status]);
  const ativarAgentesRecepcao=(origem="upload")=>{
    const agentes=[
      {nome:"Prontuário IA",txt:"resumo clínico em preparo"},
      {nome:"Anti-glosa APAC",txt:"checando documentos obrigatórios"},
      {nome:"Médico",txt:"notificado para validar CID/conduta"},
      {nome:"Farmácia",txt:"em espera para prescrição validada"},
      {nome:"Enfermagem",txt:"pré-triagem sinalizada"},
      {nome:"Secretaria",txt:"dossiê organizado"},
    ];
    setAgentesAtivos(agentes);
    addMsg&&addMsg("Secretaria","Todos",`Upload recebido (${origem}) para ${pac?.nome||"paciente"}. Agentes ativados: ${agentes.map(a=>a.nome).join(", ")}.`,"msg");
  };
  useEffect(()=>{if(upFiles.length>0)ativarAgentesRecepcao("upload da secretaria");},[upFiles.length]);
  const processarIA=async()=>{
    if(!pac.nome&&upFiles.length===0){alert("Preencha o nome do paciente ou adicione arquivos.");return;}
    setLoadingIA(true);setResultadoIA(null);
    const arquivoBase64=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||"").split(",")[1]||"");r.onerror=reject;r.readAsDataURL(file);});
    const filesPayload=[];
    for(const a of upFiles){if(a.obj){const mimeType=a.obj.type||(/\.pdf$/i.test(a.n)?"application/pdf":"application/octet-stream");if(["application/pdf","image/jpeg","image/png","image/webp"].includes(mimeType)){filesPayload.push({name:a.n,mimeType,base64:await arquivoBase64(a.obj)});}}}
    const prompt=`Você é assistente clínico oncológico do Dr. Silas Negrão, Hospital do Bem, Patos-PB.
Analise os documentos e retorne UM ÚNICO resumo no padrão abaixo, sem markdown, sem asteriscos e sem parágrafos longos. Não misture identificação com exames e não invente dados.

DADOS CLÍNICOS:
Antecedentes patológicos:
Medicações de uso contínuo:
Alergias:
Cirurgias prévias:
Calendário vacinal:
Histórico familiar:

DADOS ONCOLÓGICOS:
Tipo de tumor:
Sede tumoral:
Estadiamento/TNM:
Estágio:
Subtipo:
Biomarcadores:
CID-10:
ECOG:

LAUDOS EM CRONOLOGIA:
• DD/MM/AA - TIPO DO EXAME - resumo com foco oncológico em uma linha. Exemplo: 03/03/26 - TC TÓRAX - Massa pulmonar em segmento inferior medindo 8,2 cm, linfonodo mediastinal direito 2,3 cm (outros achados: nefrolitíase direita, colelitíase).

PENDÊNCIAS:
• Uma pendência objetiva por linha.

Paciente: ${pac.nome||"—"} Nasc: ${pac.nasc||"—"} CPF: ${pac.cpf||"—"} CNS: ${pac.cns||"—"}
Cidade: ${pac.cidade||"—"} Queixa: ${pac.queixa||"—"}
Arquivos: ${upFiles.map(a=>a.n).join(", ")||"nenhum"}`;
    let res="";
    let backendOk=false;
    const _url=apiUrl?apiUrl():import.meta.env.VITE_API_URL||"http://127.0.0.1:3001";
    try{
      const fd=new FormData();
      fd.set("paciente_json",JSON.stringify(pac||{}));
      fd.set("recepcao_json",JSON.stringify({origem:"recepcao"}));
      fd.set("prompt_modelo",prompt);
      upFiles.forEach(a=>{if(a.obj&&["application/pdf","image/jpeg","image/png","image/webp"].includes(a.obj.type||(/\.pdf$/i.test(a.n)?"application/pdf":""))){fd.append("laudos",a.obj,a.n);fd.append("tipos",a.tp||"Documento");fd.append("datas",new Date().toISOString().slice(0,10));}});
      if(filesPayload.length){
        const r=await fetch(_url+"/api/dossie/gerar",{method:"POST",body:fd});
        const d=await r.json().catch(()=>({}));
        if(r.ok&&d.ok){res=d.resumo||d.text||"";backendOk=!!res;}
      }
    }catch(_){}
    if(!backendOk){
      try{const r=await fetch(_url+"/api/claude/resumo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,maxTokens:1400,files:filesPayload})});const d=await r.json().catch(()=>({}));if(r.ok&&d.ok)res=d.text||"";else res="⚠ "+(d.message||("Erro HTTP "+r.status));}catch(e){res="⚠ Backend indisponível: "+e.message;}
    }
    if(!res)res=`DADOS CLÍNICOS:
Antecedentes patológicos:
Medicações de uso contínuo:
Alergias:
Cirurgias prévias:
Calendário vacinal:
Histórico familiar:

DADOS ONCOLÓGICOS:
Tipo de tumor:
Sede tumoral: ${pac.local_cancer||""}
Estadiamento/TNM:
Estágio:
Subtipo:
Biomarcadores:
CID-10:
ECOG:

LAUDOS EM CRONOLOGIA:

PENDÊNCIAS:
• Definir diagnóstico e CID-10
• Anexar laudo comprobatório`;
    res=limparMarkdown(res);
    const camposIA=extrairCamposIA?extrairCamposIA(res):{};
    if(up&&Object.keys(camposIA).length){Object.entries(camposIA).forEach(([k,v])=>{if(v&&!pac[k])up(k,v);});}
    setResultadoIA(res);
    if(up)up("docs_ia_resumo",(pac?.docs_ia_resumo||"")+"\n---\n"+res);
    const pacMescladoIA={...pac,...Object.fromEntries(Object.entries(camposIA).filter(([k,v])=>v&&!pac[k]))};
    if(setDossie)setDossie(d=>{
      const base=criarDossieInicial?d||criarDossieInicial(pacMescladoIA):d||{paciente:pacMescladoIA,documentos:[],status:"novo"};
      const evolucaoClaude=extrairEvolucaoIA?extrairEvolucaoIA(res):"";
      const doc={id:Date.now(),tipo:"Análise IA Recepção",nome:upFiles[0]?.n||"Análise clínica IA",resumo:res,origem:"recepcao_ia",criadoEm:NOW(),exames:extrairExamesRealizadosTexto?extrairExamesRealizadosTexto(res):{},evolucaoClaude};
      const novo={...base,paciente:{...(base.paciente||{}),...pacMescladoIA},documentos:[doc,...(base.documentos||[])],resumoClaude:[base.resumoClaude,res].filter(Boolean).join("\n\n"),evolucao:{...(base.evolucao||{}),rascunho:evolucaoClaude||base.evolucao?.rascunho||""},status:"documentos_anexados",updatedAt:NOW()};
      return orquestrarDossieAtendimento?orquestrarDossieAtendimento(novo,"secretaria_upload_ia"):novo;
    });
    ativarAgentesRecepcao("IA da secretaria");
    setLoadingIA(false);
  };
  const hj=new Date().toLocaleDateString("pt-BR");
  const assLocal=funcLogado||EQUIPE[0];
  const assFmt=`${assLocal.nome}
${assLocal.cargo} ${assLocal.reg}`;
  const recSintVo=`RECEITA MÉDICA — SINTOMÁTICOS (VO)
Data: ${hj}
Nome: ${pac.nome||"___"} · Nasc: ${pac.nasc||"___"} · CPF: ${pac.cpf||"___"}

1. Pantoprazol 20 mg — 1 cp jejum
2. Ondansetrona 8 mg — 1 cp 8/8h×2d pós-QT
3. Metoclopramida 10 mg — 1 cp 8/8h×2d
4. Dexametasona 4 mg — noite anterior + dia seguinte
5. Loperamida 2 mg — 2 cp início, 1cp/2h se diarreia
6. Lactulose — 30 mL 12/12h se obstipação
7. Simeticona 125 mg — 1 cp 8/8h após refeições

${assFmt}
${HOSP}`;
  const recSintEv=`RECEITA — SINTOMÁTICOS EV (UBS/UPA)
Data: ${hj}
Nome: ${pac.nome||"___"}

1. Complexo B — IV em SF 500 mL, 3h
2. Ondansetrona 8 mg — IV em SF 100 mL, 15min
3. Metoclopramida 10 mg — IV em SF 100 mL
4. Noripurum — IV em SF 250 mL, 30min
5. Buscopan — IV em SF 250 mL
6. Dexametasona 10 mg — IV lento

${assFmt}
${HOSP}`;
  const recExames=`REQUISIÇÃO DE EXAMES
Data: ${hj}
Nome: ${pac.nome||"___"}

CICLO 1 / CICLO 2 / CICLO 3:
Hemograma completo · Ureia · Creatinina · TGO · TGP

Favor realizar 2 dias ANTES do próximo ciclo.

${assFmt}
${HOSP}`;
  const RETORNOS=["7 dias","14 dias","21 dias","30 dias","3 meses","6 meses"];
  const dataRetorno=dias=>{const d=new Date();const mp={"7 dias":7,"14 dias":14,"21 dias":21,"30 dias":30,"3 meses":90,"6 meses":180};d.setDate(d.getDate()+(mp[dias]||7));return d.toLocaleDateString("pt-BR");};
  const txtRetorno=retSel?`AGENDAMENTO DE RETORNO
Data: ${dataRetorno(retSel)}

Paciente: ${pac.nome||"___"} · Nasc: ${pac.nasc||"___"}
Retorno em: ${retSel} → ${dataRetorno(retSel)}

Chegue 30 min antes. Traga exames.
${assFmt}
${HOSP}`:"";

  const ABAS_REC=[
    {id:"cadastro",l:"📋 Cadastro"},
    {id:"primeira_consulta",l:"📝 1ª Consulta"},
    {id:"pacientes",l:"👥 Pacientes"},
    {id:"agendamento",l:"🗓 Agendamento"},
    {id:"exames",l:"🧪 Exames"},
    {id:"receitas",l:"💊 Receitas e 2ª Vias"},
  ];

  return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <TopBar title="Recepção" back={()=>setPg("landing")} alertCount={alertCount} onAlert={onAlert}/>
    <div style={{background:N,display:"flex",overflowX:"auto",borderBottom:`3px solid ${G}`,flexShrink:0}}>
      {ABAS_REC.map(a=><button key={a.id} onClick={()=>setAbaRec(a.id)} style={{border:"none",cursor:"pointer",padding:"9px 13px",fontSize:12,fontWeight:800,whiteSpace:"nowrap",background:abaRec===a.id?G:N,color:abaRec===a.id?"#fff":"rgba(255,255,255,.5)",flexShrink:0}}>{a.l}</button>)}
    </div>
    <div style={{flex:1,padding:16,overflowY:"auto"}}><div style={{maxWidth:900,margin:"0 auto"}}>

      {/* ── ABA: CADASTRO ────────────────────────────────────── */}
      {abaRec==="cadastro"&&<div style={{display:"grid",gap:14}}>

        {/* ── PASSO 1: Lista de pacientes aguardando ───────── */}
        {pacRecSel===null&&<>
          {/* Header row */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:900,color:N}}>Pacientes Aguardando</div>
              <div style={{fontSize:11,color:"#94A3B8"}}>Selecione um paciente para acessar o cadastro completo</div>
            </div>
            <button onClick={()=>{if(window.confirm("Iniciar cadastro de novo paciente? Dados atuais serão perdidos.")){const novoPac={...PAC0,pacID:genPacID()};setPac(novoPac);savePacAtual(novoPac);dbSalvarPaciente(novoPac);setUpFiles([]);setResultadoIA(null);setPacRecSel("novo");}}} style={{background:VE,color:"#fff",border:"none",borderRadius:10,padding:"9px 16px",fontWeight:900,fontSize:12,cursor:"pointer",flexShrink:0,boxShadow:"0 2px 8px rgba(21,128,61,.25)"}}>➕ Novo Paciente</button>
          </div>

          {/* Patient cards */}
          {(listaEspera||[]).length===0
            ? <div style={{textAlign:"center",padding:"40px 24px",background:"#fff",borderRadius:16,border:"1px dashed #CBD5E1"}}>
                <div style={{fontSize:36,marginBottom:10}}>🪑</div>
                <div style={{fontSize:14,fontWeight:800,color:N,marginBottom:6}}>Nenhum paciente aguardando</div>
                <div style={{fontSize:12,color:"#9CA3AF"}}>Use "➕ Novo Paciente" para registrar um novo cadastro.</div>
              </div>
            : <div style={{display:"grid",gap:8}}>
                {(listaEspera||[]).map((p,i)=>{
                  const statusColor={aguardando:AM,aguardando_recepcao:AM,em_consulta:T,pronto_medico:VE,atendido:VE}[p.status||"aguardando"]||AM;
                  const statusLabel={aguardando:"Aguardando",aguardando_recepcao:"Conferir recepção",em_consulta:"Em consulta",pronto_medico:"Pronto p/ médico",atendido:"Atendido"}[p.status||"aguardando"]||"Aguardando";
                  return <div key={i} onClick={()=>{
                    const mesmoAtivo=(p.pacID&&pac?.pacID&&p.pacID===pac.pacID)||(!p.pacID&&p.nome&&p.nome===pac?.nome);
                    const selecionado=mesmoAtivo?{...pac,...p}:{...PAC0,...p,pacID:p.pacID||genPacID()};
                    if(setPac)setPac(selecionado);
                    setPacRecSel(selecionado);
                  }} style={{background:"#fff",borderRadius:13,border:`1px solid #E2E8F0`,borderLeft:`5px solid ${statusColor}`,padding:"13px 16px",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.05)",display:"flex",alignItems:"center",gap:12,transition:"box-shadow .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)"}
                    onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.05)"}>
                    <div style={{width:42,height:42,borderRadius:"50%",background:statusColor+"18",border:`2px solid ${statusColor}`,display:"grid",placeItems:"center",fontSize:20,flexShrink:0}}>🧑‍⚕️</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:900,color:N,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.nome||"Paciente sem nome"}</div>
                      <div style={{fontSize:11,color:"#64748B",marginTop:2}}>
                        {p.proto&&<span style={{marginRight:8}}>📋 {p.proto}</span>}
                        {p.chegada&&<span>⏰ {p.chegada}</span>}
                      </div>
                    </div>
                    <span style={{background:statusColor+"22",color:statusColor,border:`1px solid ${statusColor}55`,borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:800,flexShrink:0}}>{statusLabel}</span>
                    <span style={{color:"#CBD5E1",fontSize:18}}>›</span>
                  </div>;
                })}
              </div>
          }
        </>}

        {/* ── PASSO 2: Paciente selecionado ────────────────── */}
        {pacRecSel!==null&&<>
          {/* Header com botão voltar */}
          <div style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:13,border:"1px solid #E2E8F0",padding:"12px 16px",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
            <button onClick={()=>{setPacRecSel(null);setResultadoIA(null);setDriveAbertoRec(false);}} style={{background:"#F1F5F9",border:"none",borderRadius:9,padding:"7px 13px",fontWeight:800,fontSize:12,cursor:"pointer",color:N,flexShrink:0}}>← Voltar à lista</button>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:900,color:N}}>{pac.nome||<span style={{color:"#94A3B8"}}>Novo Paciente</span>}</div>
              <div style={{fontSize:10,color:"#94A3B8"}}>{pac.pacID||""}{pac.nasc?` · Nasc. ${pac.nasc}`:""}</div>
            </div>
          </div>

          {/* Card: Dados Demográficos */}
          <div style={sc_.card()}>
            <H2 ch="👤 Dados Demográficos"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
              <Fld l="Nome Completo *" val={pac.nome||""} set={v=>up("nome",v)} ph="Nome do paciente"/>
              <Fld l="Data de Nasc." val={pac.nasc||""} set={v=>up("nasc",v)} ph="DD/MM/AAAA"/>
              <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Sexo</label><select value={pac.sexo||""} onChange={e=>up("sexo",e.target.value)} style={{...sc_.inp,fontSize:12,marginBottom:8}}><option value="">Selecionar...</option><option>Feminino</option><option>Masculino</option><option>Outro</option></select></div>
              <Fld l="CPF" val={pac.cpf||""} set={v=>up("cpf",v)} ph="000.000.000-00"/>
              <Fld l="CNS (Cartão SUS)" val={pac.cns||""} set={v=>up("cns",v)} ph="000 0000 0000 0000"/>
              <Fld l="Telefone" val={pac.tel||""} set={v=>up("tel",v)} ph="(00) 90000-0000"/>
              <Fld l="Naturalidade" val={pac.naturalidade||""} set={v=>up("naturalidade",v)} ph="Cidade / UF de nascimento"/>
              <Fld l="Nome da Mãe" val={pac.mae||""} set={v=>up("mae",v)} ph="Nome completo da mãe"/>
              <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Convênio</label><select value={pac.convenio||""} onChange={e=>up("convenio",e.target.value)} style={{...sc_.inp,fontSize:12,marginBottom:8}}><option value="">Selecionar...</option><option>SUS</option><option>Unimed</option><option>Bradesco Saúde</option><option>Hapvida</option><option>Particular</option></select></div>
              <div style={{gridColumn:"1/-1"}}>
                <Fld l="Sede tumoral / local do câncer" val={pac.local_cancer||""} set={v=>up("local_cancer",v)} ph="Ex: mama, pulmão, intestino, próstata, colo do útero"/>
                {pac.local_cancer&&<div style={{background:cidSugeridoRecepcao?"#EAF7EE":"#F8FAFC",border:"1px solid "+(cidSugeridoRecepcao?VE:"#CBD5E1"),borderRadius:9,padding:"7px 10px",fontSize:11,color:cidSugeridoRecepcao?VE:"#64748B",fontWeight:800,marginTop:-4,marginBottom:8}}>
                  {cidSugeridoRecepcao?`CID sugerido: ${cidSugeridoRecepcao.cid} — ${cidSugeridoRecepcao.sede}. Médico confirma no atendimento.`:"CID automático não identificado para esta sede. Médico define no atendimento."}
                  {cidSugeridoRecepcao&&<button type="button" onClick={()=>up("cid_sugerido",cidSugeridoRecepcao.cid)} style={{marginLeft:8,border:"none",background:T,color:"#fff",borderRadius:7,padding:"4px 8px",fontSize:10,fontWeight:900,cursor:"pointer"}}>salvar sugestão</button>}
                </div>}
              </div>
              <Fld l="Queixa principal" val={pac.queixa||""} set={v=>up("queixa",v)} ph="Ex: nódulo mamário, dor abdominal..."/>
            </div>
          </div>

          {/* Card: Laudos / Upload simplificado */}
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"16px 18px"}}>
            <div style={{fontSize:12,fontWeight:900,color:N,textTransform:"uppercase",letterSpacing:.6,marginBottom:10}}>📎 Laudos e Documentos</div>
            <input ref={refCam} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={onCamRec}/>
            <input ref={refArq} type="file" accept=".pdf,.doc,.docx,image/*" multiple style={{display:"none"}} onChange={onArqRec}/>
            {/* Text paste */}
            <textarea
              placeholder="Cole o texto do laudo aqui (AP, imagem, resultado)..."
              value={pac.docs_ia_resumo&&pac.docs_ia_resumo.startsWith("TEXTO:")?(pac.docs_ia_resumo.slice(6)||""):""}
              onChange={e=>{if(e.target.value)up("docs_ia_resumo","TEXTO:"+e.target.value);}}
              style={{width:"100%",minHeight:90,border:"1.5px solid #CBD5E1",borderRadius:9,padding:"9px 11px",fontSize:12,fontFamily:"monospace",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:8}}
            />
            {/* File buttons row */}
            <div style={{display:"flex",gap:7,marginBottom:8}}>
              <button onClick={()=>refArq.current?.click()} style={{flex:1,border:`1.5px solid ${G}55`,borderRadius:9,padding:"9px 6px",background:"#FFFBEB",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:800,color:G}}>📁 Arquivo</button>
              <button onClick={()=>refCam.current?.click()} style={{flex:1,border:`1.5px solid ${T}55`,borderRadius:9,padding:"9px 6px",background:"#F0F9FF",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:800,color:T}}>📷 Câmera</button>
              <button onClick={()=>{abrirDrive();setDriveAbertoRec(true);}} style={{flex:1,border:"1.5px solid #1a73e8",borderRadius:9,padding:"9px 6px",background:"#EEF4FF",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:800,color:"#1a73e8"}}>☁️ Drive</button>
            </div>
            {driveAbertoRec&&<div style={{background:"#EAF7EE",border:`1px solid ${VE}55`,borderRadius:8,padding:"6px 10px",fontSize:11,color:VE,fontWeight:700,marginBottom:6}}>✓ Pasta Drive aberta — baixe e arraste aqui</div>}
            {/* File list */}
            {upFiles.length>0&&<div style={{marginBottom:6}}>
              {upFiles.map((a,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",border:"1px solid #CBD5E1",borderRadius:7,padding:"5px 8px",marginBottom:3,background:"#F8FAFC"}}>
                <span style={{fontSize:14}}>{a.ico}</span>
                <span style={{flex:1,fontSize:11,fontWeight:700,color:N,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.n}</span>
                <button style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:13}} onClick={()=>setUpFiles(x=>x.filter((_,j)=>j!==i))}>✕</button>
              </div>)}
            </div>}
            {/* Drag zone */}
            <div
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=T;}}
              onDragLeave={e=>{e.currentTarget.style.borderColor="#CBD5E1";}}
              onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor="#CBD5E1";const f=Array.from(e.dataTransfer.files||[]);setUpFiles(x=>[...x,...f.map(fl=>({ico:fl.type?.includes("image")?"📸":"📄",n:fl.name,tp:fl.type?.includes("image")?"Foto":"Doc",obj:fl}))]);}}
              style={{border:"2px dashed #CBD5E1",borderRadius:9,padding:"10px",textAlign:"center",background:"#F8FAFC",fontSize:11,color:"#94A3B8"}}>
              Arraste PDF ou imagem aqui
            </div>
          </div>

          {/* Card: Agentes IA */}
          {(upFiles.length>0||pac.nome)&&<div style={{background:"#fff",borderRadius:14,boxShadow:"0 2px 10px rgba(0,0,0,.07)",border:`1px solid ${G}44`,overflow:"hidden"}}>
            <div style={{background:`linear-gradient(135deg,${N},${T})`,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{background:"rgba(255,255,255,.15)",borderRadius:10,width:42,height:42,display:"grid",placeItems:"center",fontSize:22,flexShrink:0}}>🤖</div>
              <div>
                <div style={{color:"#fff",fontWeight:900,fontSize:14}}>Gerar com Agentes IA</div>
                <div style={{color:"rgba(255,255,255,.75)",fontSize:11}}>Dados demográficos + arquivos → Claude gera evolução, receita e APAC</div>
              </div>
            </div>
            <div style={{padding:"14px 16px",display:"grid",gap:10}}>
              <button onClick={processarIA} disabled={loadingIA} style={{background:loadingIA?"#94A3B8":G,color:"#fff",border:"none",borderRadius:10,padding:"12px 20px",fontWeight:900,fontSize:13,cursor:loadingIA?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:loadingIA?"none":"0 2px 10px rgba(184,134,11,.3)"}}>
                {loadingIA?<><span style={{display:"inline-block",animation:"spin 1s linear infinite",fontSize:16}}>⏳</span> Processando...</>:<>▶ Gerar Prontuário Completo</>}
              </button>
              {agentesAtivos.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:7}}>
                {agentesAtivos.map(a=><div key={a.nome} style={{background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:10,padding:"8px 10px"}}>
                  <div style={{fontSize:11,fontWeight:950,color:N}}>✅ {a.nome}</div>
                  <div style={{fontSize:10,color:"#64748B",marginTop:2}}>{a.txt}</div>
                </div>)}
              </div>}
              {resultadoIA&&<div>
                <div style={{fontSize:11,fontWeight:800,color:N,marginBottom:6,textTransform:"uppercase"}}>Resultado da IA</div>
                <ResumoBullets texto={resultadoIA} maxH={280}/>
              </div>}
            </div>
          </div>}

          {/* Confirm buttons */}
          <div style={{display:"grid",gap:8}}>
            <Btn v="gold" ch="✅ Confirmar e Enviar ao Médico" s={{width:"100%",fontSize:14,padding:13}} onClick={()=>{if(!pac.nome){alert("Informe o nome do paciente.");return;}if(onEnviar)onEnviar("prontuario");else alert("Paciente registrado com sucesso!");}}/>
            <Btn v="ghost" ch="🔬 Rota 2: Módulo v1.1" s={{width:"100%",fontSize:12,padding:10}} onClick={()=>{if(!pac.nome){alert("Informe o nome do paciente.");return;}if(onEnviar)onEnviar("modulos_v11");else alert("Paciente registrado com sucesso!");}}/>
          </div>
        </>}

      </div>}

      {/* ── ABA: 1ª CONSULTA ────────────────────────────────── */}
      {abaRec==="primeira_consulta"&&<div style={{display:"grid",gap:14}}>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #DDE3EC",padding:"14px 18px"}}>
          <div style={{fontSize:12,fontWeight:900,color:N,textTransform:"uppercase",letterSpacing:.6}}>Primeiro Contato</div>
          <h2 style={{fontSize:18,fontWeight:900,color:"#0A0F1E",margin:"4px 0"}}>Formulário — 1ª Consulta</h2>
          <p style={{fontSize:12,color:"#64748B",margin:"0 0 10px"}}>Preencha com o paciente. Dados enviados diretamente ao prontuário médico.</p>
        </div>
        <PacienteDemograficoForm
          initialData={{
            nomeCompleto:pac.nome||"",
            nomeSocial:pac.nome_social||"",
            numeroProntuario:pac.prontuario||pac.pacID||"",
            cns:pac.cns||"",
            cpf:pac.cpf||"",
            rg:pac.rg||"",
            dataNascimento:pac.nasc&&/^\d{2}\/\d{2}\/\d{4}$/.test(pac.nasc)?pac.nasc.split("/").reverse().join("-"):(pac.nasc||""),
            nomeMae:pac.mae||"",
            sexo:(pac.sexo==="Feminino"?"F":pac.sexo==="Masculino"?"M":""),
            racaCor:pac.raca||"",
            etnia:pac.etnia||"",
            acompanhanteNome:pac.acompanhante_nome||"",
            responsavelNome:pac.responsavel_nome||"",
            responsavelParentesco:pac.responsavel_parentesco||"",
            responsavelTelefone:pac.responsavel_telefone||"",
            telefonePrincipal:pac.tel||"",
            telefoneCelular:pac.telefone_celular||"",
            telefoneAlternativo:pac.telefone_alternativo||"",
            whatsapp:pac.whatsapp||"",
            cep:pac.cep||"",
            tipoLogradouro:pac.tipo_logradouro||"",
            logradouro:pac.logradouro||pac.endereco||"",
            numero:pac.numero||"",
            complemento:pac.complemento||"",
            bairro:pac.bairro||"",
            municipio:pac.cidade||"",
            codigoIbgeMunicipio:pac.municipio_cod||"",
            uf:pac.uf||"PB",
            zona:pac.zona||"",
          }}
          onEnviar={(d)=>{
            const nascBR=d.dataNascimento?d.dataNascimento.split("-").reverse().join("/"):"";
            const sexoLabel=d.sexo==="F"?"Feminino":d.sexo==="M"?"Masculino":"";
            up("nome",d.nomeCompleto||pac.nome||"");
            up("nome_social",d.nomeSocial||pac.nome_social||"");
            up("prontuario",d.numeroProntuario||pac.prontuario||pac.pacID||"");
            up("nasc",nascBR||pac.nasc||"");
            up("cpf",d.cpf||pac.cpf||"");
            up("cns",d.cns||pac.cns||"");
            up("rg",d.rg||pac.rg||"");
            up("mae",d.nomeMae||pac.mae||"");
            up("sexo",sexoLabel||pac.sexo||"");
            up("tel",d.contato?.telefonePrincipal||pac.tel||"");
            up("telefone_celular",d.contato?.telefoneCelular||pac.telefone_celular||"");
            up("telefone_alternativo",d.contato?.telefoneAlternativo||pac.telefone_alternativo||"");
            up("whatsapp",d.contato?.whatsapp||pac.whatsapp||"");
            up("cep",d.endereco?.cep||pac.cep||"");
            up("cidade",d.endereco?.municipio||pac.cidade||"");
            up("municipio_cod",d.endereco?.codigoIbgeMunicipio||d.endereco?.codigoIBGEMunicipio||pac.municipio_cod||"");
            up("uf",d.endereco?.uf||pac.uf||"PB");
            up("tipo_logradouro",d.endereco?.tipoLogradouro||pac.tipo_logradouro||"");
            up("logradouro",d.endereco?.logradouro||pac.logradouro||"");
            up("numero",d.endereco?.numero||pac.numero||"");
            up("complemento",d.endereco?.complemento||pac.complemento||"");
            up("bairro",d.endereco?.bairro||pac.bairro||"");
            up("zona",d.endereco?.zona||pac.zona||"");
            up("endereco",d.endereco?.enderecoCompleto||pac.endereco||"");
            up("naturalidade",(d.naturalidade?.municipio||"")+(d.naturalidade?.uf?" / "+d.naturalidade.uf:""));
            up("raca",d.racaCor||"");
            up("etnia",d.etnia||"");
            up("responsavel_nome",d.responsavel?.nome||"");
            up("responsavel_parentesco",d.responsavel?.parentesco||"");
            up("responsavel_telefone",d.responsavel?.telefone||"");
            up("acompanhante_nome",d.responsavel?.acompanhanteNome||"");
            up("estado_civil",d.estadoCivil||pac.estado_civil||"");
            up("profissao",d.profissao||pac.profissao||"");
            addMsg&&addMsg("Recepção","Médico",`Dados demográficos atualizados: ${d.nomeCompleto||pac.nome||"paciente"}.`,"msg");
            setAbaRec("cadastro");
            if(onEnviar)onEnviar("prontuario");
          }}
        />
      </div>}

      {/* ── ABA: PACIENTES / CHECK-IN ─────────────────────────── */}
      {abaRec==="pacientes"&&<div style={{display:"grid",gap:14}}>
        <div style={sc_.card()}>
          <H2 ch="📲 Check-in Rápido"/>
          <p style={{color:"#64748B",fontSize:12,marginBottom:10}}>Paciente já cadastrado chega para atendimento.</p>

          {/* Check-in do paciente atual */}
          {pac.nome&&<div onClick={()=>{if(addFila){addFila({nome:pac.nome,proto:pac.trat||"",ciclo:"C1D1",chegada:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),status:"aguardando",pacID:pac.pacID||""});alert(`✅ Check-in: ${pac.nome}`);}}} style={{background:"#EAF7EE",border:`2px solid ${VE}`,borderRadius:13,padding:"14px 16px",cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:30}}>📲</div>
            <div>
              <div style={{fontWeight:900,color:VE,fontSize:14}}>Check-in: {pac.nome}</div>
              <div style={{color:"#64748B",fontSize:11}}>{pac.trat||"Sem protocolo"} · Clique para registrar chegada</div>
            </div>
          </div>}

          {/* Check-in por nome avulso */}
          <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:11,padding:"12px 14px"}}>
            <div style={{fontSize:12,fontWeight:800,color:N,marginBottom:8}}>Ou registre por nome:</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
              <Fld l="Nome do paciente" val={chkNome} set={setChkNome}/>
              <Fld l="Protocolo (opcional)" val={chkProto} set={setChkProto}/>
            </div>
            <Btn v="gold" ch="✅ Fazer Check-in" s={{width:"100%",fontSize:13,padding:10,marginTop:4}} dis={!chkNome} onClick={()=>{if(!chkNome.trim())return;if(addFila)addFila({nome:chkNome,proto:chkProto,chegada:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),status:"aguardando"});setChkNome("");setChkProto("");}}/>
          </div>
        </div>

        <ListaEsperaPrioridade listaEspera={listaEspera} setListaEspera={setListaEspera} onAbrirConsulta={()=>{}}/>
      </div>}

      {/* ── ABA: AGENDAMENTO ──────────────────────────────────── */}
      {abaRec==="agendamento"&&<div style={{display:"grid",gap:12}}>
        {/* Sub-abas internas */}
        <div style={{display:"flex",gap:6,background:"#F1F5F9",borderRadius:11,padding:4}}>
          {[{id:"retorno",l:"📅 Retorno"},{id:"marcacao",l:"🗓 Marcação de Consulta"}].map(a=>(
            <button key={a.id} onClick={()=>setAbaAg(a.id)} style={{flex:1,border:"none",cursor:"pointer",padding:"8px 12px",fontSize:12,fontWeight:800,borderRadius:8,background:abaAg===a.id?"#fff":"transparent",color:abaAg===a.id?N:"#94A3B8",boxShadow:abaAg===a.id?"0 1px 4px rgba(0,0,0,.1)":"none",fontFamily:"inherit"}}>{a.l}</button>
          ))}
        </div>

        {abaAg==="retorno"&&<div style={sc_.card()}>
          <H2 ch="📅 Agendamento de Retorno"/>
          <p style={{color:"#64748B",fontSize:12,marginBottom:12}}>Paciente: <strong style={{color:N}}>{pac.nome||"não informado"}</strong></p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
            {RETORNOS.map(r=><button key={r} onClick={()=>setRetSel(r)} style={{...sc_.btn(retSel===r?"navy":"ghost",{fontSize:12,padding:"10px 4px",textAlign:"center"})}}>{r}</button>)}
          </div>
          {retSel&&<>
            <div style={{background:"#EAF7EE",borderRadius:12,padding:"10px 14px",marginBottom:10,border:`1px solid ${VE}`}}>
              <div style={{fontWeight:900,color:N,fontSize:14}}>{retSel} → {dataRetorno(retSel)}</div>
              <div style={{color:"#64748B",fontSize:11,marginTop:2}}>{pac.nome||"Paciente"} · {HOSP}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn v="gold" ch="🖨 Imprimir Retorno" s={{flex:1}} onClick={()=>setPrint({t:"Retorno — "+(pac.nome||"Paciente"),c:txtRetorno})}/>
              <Btn v="ghost" ch="📋 Copiar" onClick={()=>navigator.clipboard?.writeText(txtRetorno)}/>
            </div>
          </>}
          {!retSel&&<p style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:"16px 0"}}>Selecione o período de retorno acima.</p>}
        </div>}

        {abaAg==="marcacao"&&<AgendamentoComp agendamentos={agendamentos||[]} addAgendamento={addAgendamento||((a)=>{})} ismedico={false}/>}
      </div>}

      {/* ── ABA: EXAMES ──────────────────────────────────────── */}
      {abaRec==="exames"&&(()=>{
        const LAB_ROTINA=["Hemograma completo","Ureia","Creatinina","TGO (AST)","TGP (ALT)"];
        const LAB_GRUPOS=[
          {g:"⚗️ Bioquímica",itens:["Sódio","Potássio","Magnésio","Cálcio total","Glicemia","Ácido úrico","Albumina","Proteínas totais e frações"]},
          {g:"🫀 Hepatograma",itens:["GGT","Fosfatase Alcalina","Bilirrubina total","Bilirrubina direta","Bilirrubina indireta"]},
          {g:"🔥 Inflamação",itens:["PCR","VHS","DHL","Ferritina","Amilase","Lipase","Fibrinogênio"]},
          {g:"🩹 Coagulograma",itens:["TAP/INR","KTTP","Tempo de sangramento"]},
          {g:"🦠 Marcadores Tumorais",itens:["CEA","CA 19-9","CA 125","AFP","PSA total","PSA livre","CA 15-3","Beta-HCG","CA 72-4","NSE","Cromogranina A","CA 50"]},
          {g:"🧬 Hormônios",itens:["TSH","T4 livre","T3 livre","Prolactina","Testosterona total","Cortisol basal","ACTH"]},
          {g:"🦠 Sorologias",itens:["HIV Ag/Ac","HBsAg","Anti-HBs","Anti-HCV","VDRL","CMV IgG/IgM","EBV IgG/IgM","HTLV I/II"]},
          {g:"🔬 Outros",itens:["Hemoglobina glicada (HbA1c)","Colesterol total e frações","Triglicerídeos","Ácido fólico","B12","Vitamina D","Magnésio sérico"]},
        ];
        const IMG_GRUPOS=[
          {g:"🔬 Tomografia (TC)",cor:T,itens:[
            "TC de tórax s/ contraste","TC de tórax c/ contraste","TC de tórax protocolo oncológico",
            "TC de crânio s/ contraste","TC de crânio c/ contraste",
            "TC de pescoço c/ contraste",
            "TC de abdome s/ contraste","TC de abdome c/ contraste",
            "TC de abdome + pelve s/ contraste","TC de abdome + pelve c/ contraste",
            "TC de tórax + abdome + pelve (corpo total)","TC de coluna","TC de MMI",
          ]},
          {g:"🫧 Ultrassom (USG)",cor:"#7C3AED",itens:[
            "USG abdominal total","USG pélvica","USG transvaginal",
            "USG mamária bilateral","USG tireoide e cervical","USG testicular",
            "USG renal bilateral","Doppler venoso MMII","Doppler arterial MMII",
          ]},
          {g:"🧲 Ressonância (RM)",cor:"#0EA5E9",itens:[
            "RM de crânio s/ contraste","RM de crânio c/ contraste",
            "RM de coluna cervical","RM de coluna dorsal","RM de coluna lombar",
            "RM de abdome c/ contraste","RM de pelve c/ contraste",
            "RM de mama bilateral c/ contraste","RM musculoesquelético",
          ]},
          {g:"☢️ PET-CT / Medicina Nuclear",cor:"#DC2626",itens:[
            "PET-CT (18F-FDG) corpo total",
            "Cintilografia óssea corpo total","Cintilografia de tireoide",
            "Pesquisa de corpo inteiro c/ I-131","SPECT cerebral",
            "Cintilografia renal","Cintilografia de perfusão miocárdica",
          ]},
          {g:"📷 Radiografia (RX)",cor:"#64748B",itens:[
            "RX de tórax PA + Perfil","RX de coluna cervical","RX de coluna dorsal",
            "RX de coluna lombar","RX de bacia","RX de ossos longos",
            "RX de mão / pé","RX de crânio",
          ]},
          {g:"🎥 Especiais / Endoscopia",cor:G,itens:[
            "Mamografia bilateral","Ecocardiograma transtorácico",
            "Endoscopia digestiva alta (EDA)","Colonoscopia",
            "Broncoscopia c/ lavado broncoalveolar","Ecocardiograma de estresse",
            "MAPA 24h","Holter 24h",
          ]},
        ];
        const totalSel=labSelecionados.length+imgSelecionados.length;
        const txtRequisicao=`REQUISIÇÃO DE EXAMES — ${hj}
${"─".repeat(50)}
Paciente : ${pac.nome||"_______________"}
Nasc.    : ${pac.nasc||"_______________"} · CPF: ${pac.cpf||"_______________"}
CNS      : ${pac.cns||"_______________"}
Diagnóstico: ${pac.diag||"_______________"}
─────────────────────────────────────────────────────
${labSelecionados.length?`LABORATORIAIS:\n${labSelecionados.map(e=>"• "+e).join("\n")}\n\n`:""}${imgSelecionados.length?`IMAGENS / RADIOLOGIA:\n${imgSelecionados.map(e=>"• "+e).join("\n")}\n`:""}
─────────────────────────────────────────────────────
Médico: ${AUTOR} · ${AUTOR2}
${HOSP}
Data: ${hj}`;
        const txtAPACExames=`LAUDO PARA APAC — EXAMES DE ALTA COMPLEXIDADE
${"═".repeat(50)}
Estabelecimento: ${HOSP}

Paciente  : ${pac.nome||"___"}
CNS       : ${pac.cns||"___"}
CPF       : ${pac.cpf||"___"}
Nasc.     : ${pac.nasc||"___"}
Nome Mãe  : ${pac.mae||"___"}
Município : ${pac.cidade||"___"}
Diagnóstico: ${pac.diag||"___"} · CID-10: ${pac.cid||"___"}
Estadiamento: ${pac.estadio||"___"} · Protocolo: ${pac.trat||"___"}
Biomarcadores: ${pac.bio||"___"}
Justificativa: Necessário estadiamento/reestadimento para definição de conduta oncológica.

EXAMES SOLICITADOS:
${[...labSelecionados,...imgSelecionados].map((e,i)=>`${i+1}. ${e}`).join("\n")||"(nenhum selecionado)"}

Médico Solicitante: ${AUTOR}
${AUTOR2}
Data: ${hj}
${"═".repeat(51)}`;
        return <div style={{display:"grid",gap:12}}>
          {/* Header paciente */}
          <div style={{background:`linear-gradient(135deg,${N},#0d2347)`,borderRadius:13,padding:"10px 16px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>🧪</span>
            <div style={{flex:1}}>
              <div style={{color:"#fff",fontWeight:900,fontSize:14}}>{pac.nome||"Nenhum paciente"}</div>
              <div style={{color:"rgba(255,255,255,.5)",fontSize:11}}>{pac.diag||"Diagnóstico não informado"} · {pac.cid||""}</div>
            </div>
            {totalSel>0&&<div style={{background:G,color:"#fff",borderRadius:20,padding:"4px 12px",fontWeight:900,fontSize:13}}>{totalSel} exame{totalSel>1?"s":""}</div>}
          </div>

          {/* Sub-abas Lab / Imagens / APAC */}
          <div style={{display:"flex",gap:4,background:"#F1F5F9",borderRadius:11,padding:4}}>
            {[{id:"lab",l:"🔬 Laboratório"},{id:"img",l:"📷 Imagens/Rad"},{id:"apac",l:"📋 Requisição/APAC"}].map(a=>(
              <button key={a.id} onClick={()=>setAbaExames(a.id)} style={{flex:1,border:"none",cursor:"pointer",padding:"8px 6px",fontSize:11,fontWeight:800,borderRadius:8,background:abaExames===a.id?"#fff":"transparent",color:abaExames===a.id?N:"#94A3B8",boxShadow:abaExames===a.id?"0 1px 4px rgba(0,0,0,.1)":"none",fontFamily:"inherit"}}>{a.l}</button>
            ))}
          </div>

          {/* ABA LAB */}
          {abaExames==="lab"&&<div style={{display:"grid",gap:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,color:"#64748B"}}>{labSelecionados.length} selecionado(s)</div>
              <button onClick={()=>setLabSel({})} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94A3B8",fontFamily:"inherit"}}>Limpar seleção</button>
            </div>
            {/* ROTINA — caixa em destaque */}
            <div style={{...sc_.card({padding:"10px 14px"}),border:`2px solid ${VE}66`,background:"#F0FDF4"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontWeight:900,color:VE,fontSize:12}}>⚡ Rotina</div>
                <button onClick={()=>setLabSel(x=>{const n={...x};LAB_ROTINA.forEach(i=>{n[i]=true;});return n;})} style={{background:VE,color:"#fff",border:"none",cursor:"pointer",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,fontFamily:"inherit"}}>✅ Selecionar Rotina</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
                {LAB_ROTINA.map(item=>(
                  <label key={item} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",padding:"4px 6px",borderRadius:6,background:labSel[item]?"#DCFCE7":"transparent",border:labSel[item]?`1px solid ${VE}55`:"1px solid transparent"}}>
                    <input type="checkbox" checked={!!labSel[item]} onChange={()=>togLab(item)} style={{accentColor:VE,width:14,height:14,flexShrink:0}}/>
                    <span style={{fontSize:11,color:labSel[item]?VE:N,fontWeight:labSel[item]?700:400}}>{item}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Demais grupos em 2 colunas */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {LAB_GRUPOS.map(grupo=>(
                <div key={grupo.g} style={sc_.card({padding:"8px 12px"})}>
                  <div style={{fontWeight:900,color:N,fontSize:11,marginBottom:6,borderBottom:"1px solid #F1F5F9",paddingBottom:3}}>{grupo.g}</div>
                  <div style={{display:"grid",gap:2}}>
                    {grupo.itens.map(item=>(
                      <label key={item} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:"3px 4px",borderRadius:5,background:labSel[item]?"#EAF7EE":"transparent",border:labSel[item]?`1px solid ${VE}44`:"1px solid transparent"}}>
                        <input type="checkbox" checked={!!labSel[item]} onChange={()=>togLab(item)} style={{accentColor:VE,width:13,height:13,flexShrink:0}}/>
                        <span style={{fontSize:10.5,color:labSel[item]?VE:N,fontWeight:labSel[item]?700:400,lineHeight:1.3}}>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>}

          {/* ABA IMAGENS */}
          {abaExames==="img"&&<div style={{display:"grid",gap:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,color:"#64748B"}}>{imgSelecionados.length} selecionado(s)</div>
              <button onClick={()=>setImgSel({})} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94A3B8",fontFamily:"inherit"}}>Limpar seleção</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {IMG_GRUPOS.map(grupo=>{
                const cor=grupo.cor||T;
                return(
                <div key={grupo.g} style={{...sc_.card({padding:"8px 12px"}),borderTop:`3px solid ${cor}`}}>
                  <div style={{fontWeight:900,color:cor,fontSize:11,marginBottom:6,paddingBottom:3,borderBottom:`1px solid ${cor}22`}}>{grupo.g}</div>
                  <div style={{display:"grid",gap:2}}>
                    {grupo.itens.map(item=>(
                      <label key={item} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:"3px 4px",borderRadius:5,background:imgSel[item]?cor+"18":"transparent",border:imgSel[item]?`1px solid ${cor}44`:"1px solid transparent"}}>
                        <input type="checkbox" checked={!!imgSel[item]} onChange={()=>togImg(item)} style={{accentColor:cor,width:13,height:13,flexShrink:0}}/>
                        <span style={{fontSize:10.5,color:imgSel[item]?cor:N,fontWeight:imgSel[item]?700:400,lineHeight:1.3}}>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );})}
            </div>
          </div>}

          {/* ABA REQUISIÇÃO / APAC */}
          {abaExames==="apac"&&<div style={{display:"grid",gap:10}}>
            {totalSel===0&&<div style={{textAlign:"center",padding:"32px 20px",color:"#94A3B8",background:"#F8FAFC",borderRadius:12,border:"1px dashed #CBD5E1"}}>
              <div style={{fontSize:36,marginBottom:8}}>🧪</div>
              <div style={{fontWeight:700}}>Nenhum exame selecionado</div>
              <div style={{fontSize:12,marginTop:4}}>Selecione nas abas Laboratório ou Imagens</div>
            </div>}
            {totalSel>0&&<>
              {/* Resumo selecionados */}
              <div style={sc_.card({padding:"12px 16px"})}>
                <H3 ch={`📋 ${totalSel} exame${totalSel>1?"s":""} selecionado${totalSel>1?"s":""}`} s={{margin:"0 0 8px",fontSize:13}}/>
                {labSelecionados.length>0&&<div style={{marginBottom:6}}>
                  <div style={{fontSize:10,fontWeight:800,color:VE,textTransform:"uppercase",marginBottom:3}}>Laboratório ({labSelecionados.length})</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{labSelecionados.map(e=><span key={e} style={{background:"#EAF7EE",color:VE,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>{e}</span>)}</div>
                </div>}
                {imgSelecionados.length>0&&<div>
                  <div style={{fontSize:10,fontWeight:800,color:T,textTransform:"uppercase",marginBottom:3}}>Imagens ({imgSelecionados.length})</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{imgSelecionados.map(e=><span key={e} style={{background:"#F0F9FF",color:T,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>{e}</span>)}</div>
                </div>}
              </div>
              {/* Dados do paciente */}
              <div style={sc_.card()}>
                <H3 ch="👤 Dados do Paciente para a Requisição" s={{margin:"0 0 8px",fontSize:12}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
                  <Fld l="Nome" val={pac.nome||""} set={v=>up("nome",v)}/>
                  <Fld l="Data de Nasc." val={pac.nasc||""} set={v=>up("nasc",v)}/>
                  <Fld l="CPF" val={pac.cpf||""} set={v=>up("cpf",v)}/>
                  <Fld l="CNS" val={pac.cns||""} set={v=>up("cns",v)}/>
                  <Fld l="Diagnóstico / CID-10" val={pac.diag||""} set={v=>up("diag",v)}/>
                  <Fld l="Protocolo" val={pac.trat||""} set={v=>up("trat",v)}/>
                </div>
              </div>
              {/* Botões ação */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <Btn v="gold" ch="🖨 Imprimir Requisição" s={{padding:12,fontSize:12}} onClick={()=>setPrint({t:"Requisição de Exames — "+(pac.nome||"Paciente"),c:txtRequisicao})}/>
                <Btn v="navy" ch="📋 Gerar APAC Exames" s={{padding:12,fontSize:12}} onClick={()=>setPrint({t:"APAC — Exames — "+(pac.nome||"Paciente"),c:txtAPACExames})}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn v="ghost" ch="📋 Copiar Requisição" s={{flex:1,fontSize:11}} onClick={()=>navigator.clipboard?.writeText(txtRequisicao)}/>
                <Btn v="ghost" ch="📋 Copiar APAC" s={{flex:1,fontSize:11}} onClick={()=>navigator.clipboard?.writeText(txtAPACExames)}/>
              </div>
            </>}
          </div>}
        </div>;
      })()}

      {/* ── ABA: RECEITAS E 2ª VIAS ──────────────────────────── */}
      {abaRec==="receitas"&&<div style={{display:"grid",gap:10}}>
        <div style={sc_.card({padding:"10px 16px",background:`linear-gradient(135deg,${N},#0d2347)`})}>
          <div style={{color:"rgba(255,255,255,.5)",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Receitas e Documentos</div>
          <div style={{color:G,fontWeight:900,fontSize:15}}>{pac.nome||"Nenhum paciente"}</div>
          <div style={{color:"rgba(255,255,255,.5)",fontSize:11}}>{hj}</div>
        </div>
        {[{t:"💊 Sintomáticos VO",c:recSintVo},{t:"💉 Sintomáticos EV",c:recSintEv},{t:"🧪 Requisição de Exames",c:recExames}].map((r,i)=>(
          <div key={i} style={sc_.card()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <H3 ch={r.t} s={{margin:0,fontSize:13}}/>
              <div style={{display:"flex",gap:6}}>
                <Btn v="gold" ch="🖨 Imprimir" s={{fontSize:11,padding:"6px 12px"}} onClick={()=>setPrint({t:r.t,c:r.c})}/>
                <Btn v="ghost" ch="📋 Copiar" s={{fontSize:11,padding:"6px 10px"}} onClick={()=>navigator.clipboard?.writeText(r.c)}/>
              </div>
            </div>
            <pre style={{fontSize:10,color:"#64748B",background:"#F8FAFC",borderRadius:8,padding:"8px 10px",whiteSpace:"pre-wrap",margin:0,fontFamily:"Georgia,serif",lineHeight:1.6,maxHeight:120,overflow:"auto"}}>{r.c.split("\n").slice(0,6).join("\n")}…</pre>
          </div>
        ))}
      </div>}

      <ChatAba mensagens={mensagens} addMsg={addMsg} de="Recepção"/>
    </div></div>
    <Footer/>
  </div>;
}
