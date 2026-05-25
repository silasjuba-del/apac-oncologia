// ─────────────────────────────────────────────────────────────────────────────
// DossieBarComponents.jsx — StatusDossieBar, AtendimentosStandbyBar,
//   RecepcaoDossiePanel, DocumentosPosEvolucao
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useCallback } from "react";
import { N, G, T, VE, VM, AM } from "../../utils/constants";
import { sc_, H2, Fld, Btn, NOW, abrirDoc, copiarTexto } from "../../components/ui/primitives";
import {
  criarDossieInicial, orquestrarDossieAtendimento,
  validarAPAC, gerarDocumentosSelecionados,
} from "../../utils/dossie";
import { criarDocumentoClinico, integrarDocumentosNoDossie } from "../../utils/pipeline";

const STATUS_DOSSIE=[
  {id:"pre_consulta",label:"Pré-consulta iniciada",cor:T},
  {id:"aguardando_recepcao",label:"Aguardando recepção",cor:AM},
  {id:"recepcao_conferencia",label:"Recepção em conferência",cor:G},
  {id:"documentos_anexados",label:"Documentos anexados",cor:T},
  {id:"claude_processando",label:"Claude processando",cor:AM},
  {id:"pronto_medico",label:"Pronto para médico",cor:VE},
  {id:"em_consulta",label:"Em consulta",cor:N},
  {id:"evolucao_salva",label:"Evolução salva",cor:VE},
  {id:"apac_validacao",label:"APAC em validação",cor:AM},
  {id:"apac_pronta",label:"APAC pronta",cor:VE},
  {id:"pendencia_administrativa",label:"Pendência administrativa",cor:VM},
];
const statusDossieMeta=id=>STATUS_DOSSIE.find(s=>s.id===id)||STATUS_DOSSIE[0];
export { statusDossieMeta };

function StatusDossieBar({dossie}){
  const meta=statusDossieMeta(dossie?.status);
  const docs=dossie?.documentos?.length||0;
  const apac=dossie?.apac||validarAPAC(dossie||{});
  const agentes=dossie?.agentes||dossie?.orquestracao?.agentes||[];
  return <div style={{display:"grid",gap:8,marginBottom:12}}>
    <div style={{display:"grid",gridTemplateColumns:"1.1fr .7fr .7fr .9fr",gap:8}}>
      <div style={sc_.card({padding:"10px 12px",borderLeft:"5px solid "+meta.cor})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>Status do dossiê</div><div style={{fontSize:13,color:meta.cor,fontWeight:900}}>{meta.label}</div></div>
      <div style={sc_.card({padding:"10px 12px"})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>Documentos</div><div style={{fontSize:18,color:N,fontWeight:900}}>{docs}</div></div>
      <div style={sc_.card({padding:"10px 12px"})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>APAC</div><div style={{fontSize:13,color:apac.riscoGlosa==="alto"?VM:apac.riscoGlosa==="moderado"?AM:VE,fontWeight:900}}>{apac.riscoGlosa==="baixo"?"Baixo risco":apac.riscoGlosa==="moderado"?"Risco moderado":"Alto risco"}</div></div>
      <div style={sc_.card({padding:"10px 12px",background:"#FFFBEB",borderColor:G+"55"})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>Orquestração</div><div style={{fontSize:12,color:G,fontWeight:900}}>{agentes.length?`${agentes.length} agentes ativos`:"aguardando upload"}</div></div>
    </div>
    {agentes.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:6}}>
      {agentes.map(a=><div key={a.id||a.nome} style={{background:a.status==="pendente"?"#FFF7E6":a.status==="standby"?"#F8FAFC":"#EAF7EE",border:"1px solid "+(a.status==="pendente"?AM:a.status==="standby"?"#CBD5E1":VE)+"55",borderRadius:9,padding:"7px 9px"}}>
        <div style={{fontSize:10,fontWeight:950,color:a.status==="pendente"?AM:a.status==="standby"?"#64748B":VE}}>{a.status==="standby"?"⏳":"✅"} {a.nome}</div>
        <div style={{fontSize:9,color:"#64748B",marginTop:2}}>{a.acao}</div>
      </div>)}
    </div>}
  </div>;
}

function AtendimentosStandbyBar({pacientes=[],ativo,onAbrir,onNovo}){
  const uniq=useMemo(()=>{
    const itens=[];
    (pacientes||[]).forEach(p=>{
      const nome=p?.nome||p?.pac||"";
      if(!nome)return;
      const key=p.pacID||p.cpf||nome;
      if(!itens.find(x=>(x.pacID||x.cpf||x.nome)===key))itens.push({...p,nome});
    });
    return itens;
  },[pacientes]);
  const primeiro=uniq[0]||null;
  const visiveis=useMemo(()=>uniq.slice(0,12),[uniq]);
  const handleAtender=useCallback((p=primeiro)=>{
    if(!p)return;
    onAbrir&&onAbrir(p);
  },[primeiro,onAbrir]);
  const handleNovo=useCallback(()=>{
    onNovo&&onNovo();
  },[onNovo]);
  return <div style={{background:"#F8FAFC",borderBottom:"1px solid #CBD5E1",padding:"7px 12px",display:"flex",gap:8,alignItems:"center",overflowX:"auto",flexShrink:0}}>
    <span style={{fontSize:10,color:G,fontWeight:900,textTransform:"uppercase",whiteSpace:"nowrap"}}>Standby / atendimentos</span>
    {uniq.length===0&&<span style={{fontSize:11,color:"#94A3B8",whiteSpace:"nowrap"}}>Aguardando check-in da recepção.</span>}
    {visiveis.map(p=>{const active=(ativo?.pacID&&p.pacID===ativo.pacID)||(!ativo?.pacID&&ativo?.nome&&p.nome===ativo.nome);return <button type="button" key={p.pacID||p.cpf||p.nome} onClick={()=>handleAtender(p)} style={{border:"1px solid "+(active?G:"#CBD5E1"),background:active?G:"#fff",color:active?"#fff":N,borderRadius:999,padding:"6px 10px",fontSize:11,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"Segoe UI, Arial, sans-serif"}}>
      {p.status==="aguardando"?"⏳ ":p.status==="em_consulta"?"🩺 ":""}{p.nome}{p.checkin?" · "+p.checkin:""}
    </button>;})}
    <button type="button" aria-label="Novo atendimento" onClick={handleNovo} style={{marginLeft:"auto",border:"1px solid "+G,background:"#FFFBEB",color:G,borderRadius:999,padding:"6px 10px",fontSize:11,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>+ Novo atendimento</button>
  </div>;
}
function RecepcaoDossiePanel({pac,dossie,setDossie,upFiles,addMsg,onEnviar}) {
  const [drive,setDrive]=useState("");
  const [desc,setDesc]=useState("");
  const [agentes,setAgentes]=useState([]);
  const vincular=()=>{
    const docs=[
      ...(upFiles||[]).map(f=>criarDocumentoClinico({tipo:f.tp||"Upload",nome:f.n,resumo:"",origem:"recepcao_upload"})),
    ];
    if(drive.trim()||desc.trim())docs.push(criarDocumentoClinico({tipo:"Google Drive",nome:drive||"Pasta Drive",resumo:desc,origem:"recepcao_drive",link:drive||null}));
    if(!docs.length){alert("Anexe arquivo, cole link do Drive ou descreva os documentos.");return;}
    // Pipeline canônico — integra todos os docs de uma vez
    // Para recepção usamos setDossie com orquestração após integrar
    const dossieBase=dossie||criarDossieInicial(pac);
    const dossieComRecepcao={...dossieBase,paciente:{...(dossieBase.paciente||{}),...pac},recepcao:{...(dossieBase.recepcao||{}),conferido:true,conferidoEm:NOW(),observacoes:desc}};
    const novoDossie=integrarDocumentosNoDossie(docs,{pac,dossie:dossieComRecepcao,setDossie,up:null,addMsg});
    if(novoDossie){
      // Orquestra agentes após integração
      setDossie&&setDossie(()=>orquestrarDossieAtendimento(novoDossie,"secretaria_vinculo"));
    }
    const ativados=["Prontuário IA","Anti-glosa APAC","Médico","Farmácia","Enfermagem","Secretaria"];
    setAgentes(ativados);
    addMsg&&addMsg("Secretaria","Todos","Dossiê atualizado: upload/documentos vinculados para "+(pac?.nome||"paciente")+". Agentes ativados: "+ativados.join(", ")+".","laudo");
    alert("Documentos vinculados ao dossiê.");
  };
  return <div style={sc_.card({border:"2px solid "+G+"55"})}>
    <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:8}}>
      <H2 ch="Dossiê Oncológico — Recepção" s={{margin:0,fontSize:14}}/>
      <span style={{fontSize:10,fontWeight:900,color:statusDossieMeta(dossie?.status).cor}}>{statusDossieMeta(dossie?.status).label}</span>
    </div>
    <p style={{fontSize:12,color:"#64748B",margin:"0 0 10px"}}>A recepção confirma dados demográficos e agrega laudos. Campos clínicos ficam com paciente/médico.</p>
    <Fld l="Pasta ou link do Google Drive" val={drive} set={setDrive} ph="https://drive.google.com/... ou nome da pasta"/>
    <Fld l="Descrição dos documentos" val={desc} set={setDesc} ph="Ex: biópsia, IHQ, TC, laboratório..." ta rows={3}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
      <Btn v="navy" ch="Vincular documentos ao dossiê" s={{padding:11}} onClick={vincular}/>
      <Btn v="gold" ch="Enviar dossiê ao médico" s={{padding:11}} onClick={()=>{vincular();onEnviar&&onEnviar();}}/>
    </div>
    {agentes.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginTop:10}}>
      {agentes.map(a=><div key={a} style={{background:"#EAF7EE",border:"1px solid "+VE+"44",borderRadius:8,padding:"7px 9px",fontSize:10,fontWeight:900,color:VE}}>✅ {a}</div>)}
    </div>}
  </div>;
}

function DocumentosPosEvolucao({dossie,setDossie,addMsg,onAbrirAPAC}){
  const [sel,setSel]=useState({sintomaticos:true,antiemeticos:true,analgesia:false,medicacao_ev:false,exames:true,dieta:false,alarme:true,termo:false,apac:true});
  const [docs,setDocs]=useState(dossie?.documentosGerados||[]);
  const opts=[
    ["sintomaticos","Receita sintomáticos"],["antiemeticos","Receita antieméticos"],["analgesia","Receita analgesia"],["medicacao_ev","Medicação EV"],["exames","Solicitação de exames"],["dieta","Orientações dietéticas"],["alarme","Sinais de alarme"],["termo","Termo de consentimento"],["apac","APAC"],
  ];
  const gerar=()=>{
    const novos=gerarDocumentosSelecionados(dossie,sel);
    setDocs(novos);
    const apac=validarAPAC(dossie);
    setDossie&&setDossie(d=>({...d,documentosGerados:novos,apac,status:sel.apac?"apac_validacao":"evolucao_salva",updatedAt:NOW()}));
    addMsg&&addMsg("Médico","Equipe","Evolução salva e documentos gerados para "+(dossie?.paciente?.nome||"paciente")+".","msg");
  };
  const editarDoc=(id,texto)=>setDocs(x=>x.map(doc=>doc.id===id?{...doc,texto}:doc));
  const imprimirTodos=()=>abrirDoc("Documentos do atendimento — "+(dossie?.paciente?.nome||"paciente"),
    docs.map((doc,i)=>`${i+1}. ${doc.titulo}\n\n${doc.texto}`).join("\n\n"+"=".repeat(72)+"\n\n"));
  return <div style={sc_.card({border:"2px solid "+VE+"55"})}>
    <H2 ch="Gerar documentos após salvar" s={{fontSize:14}}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
      {opts.map(([k,l])=><label key={k} style={{display:"flex",gap:7,alignItems:"center",fontSize:11,fontWeight:800,color:N,background:sel[k]?"#EAF7EE":"#F8FAFC",border:"1px solid "+(sel[k]?VE:"#CBD5E1"),borderRadius:8,padding:"7px 9px",cursor:"pointer"}}><input type="checkbox" checked={!!sel[k]} onChange={()=>setSel(x=>({...x,[k]:!x[k]}))} style={{accentColor:VE}}/>{l}</label>)}
    </div>
    <div style={{display:"flex",gap:8}}>
      <Btn v="green" ch="Gerar selecionados" s={{flex:1,padding:11}} onClick={gerar}/>
      <Btn v="navy" ch="Imprimir todos" s={{flex:1,padding:11}} dis={!docs.length} onClick={imprimirTodos}/>
      <Btn v="teal" ch="Imprimir separados" s={{flex:1,padding:11}} dis={!docs.length} onClick={()=>docs.forEach((doc,i)=>setTimeout(()=>abrirDoc(doc.titulo,doc.texto),i*350))}/>
      <Btn v="gold" ch="Abrir APAC anti-glosa" s={{flex:1,padding:11}} onClick={()=>{setDossie&&setDossie(d=>({...d,apac:validarAPAC(d),status:"apac_validacao"}));onAbrirAPAC&&onAbrirAPAC();}}/>
    </div>
    {docs.length>0&&<div style={{display:"grid",gap:8,marginTop:12}}>{docs.map(doc=><div key={doc.id} style={{background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:10,padding:10}}>
      <strong style={{fontSize:12,color:N}}>{doc.titulo}</strong>
      <textarea value={doc.texto||""} onChange={e=>editarDoc(doc.id,e.target.value)} rows={6} style={{...sc_.inp,width:"100%",resize:"vertical",fontFamily:"Georgia, serif",fontSize:12,lineHeight:1.7,marginTop:7}}/>
      <div style={{display:"flex",gap:6,marginTop:6}}>
        <Btn v="ghost" ch="Imprimir" s={{fontSize:10}} onClick={()=>abrirDoc(doc.titulo,doc.texto)}/>
        <Btn v="teal" ch="Copiar" s={{fontSize:10}} onClick={()=>copiarTexto(doc.texto||"")}/>
      </div>
    </div>)}</div>}
  </div>;
}
export { StatusDossieBar, AtendimentosStandbyBar, RecepcaoDossiePanel, DocumentosPosEvolucao };
