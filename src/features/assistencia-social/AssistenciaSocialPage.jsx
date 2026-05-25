// ─────────────────────────────────────────────────────────────────────────────
// AssistenciaSocialPage.jsx — Página de Assistência Social
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, T, VE, AM, VM, BG } from "../../utils/constants";
import { AUTOR, AUTOR2 } from "../../utils/constants";
import { sc_, H2, Fld, Btn, PrintModal, TopBar } from "../../components/ui/primitives";

export default function AssistenciaSocialPage({pac,up,back,laudoLiberado,setLaudoLiberado,alertCount,onAlert}){
  const [evolucao,setEvolucao]=useState("");const [evolucoes,setEvolucoes]=useState([{dt:"15/05/2026",txt:"Paciente orientada sobre FGTS e INSS. Encaminhada ao CRAS.",autor:"Serv. Social"}]);
  const [print,setPrint]=useState(null);
  const hoje=new Date().toLocaleDateString("pt-BR");
  const cab=`HOSPITAL DO BEM — Assistência Social\n${hoje}\nNome: ${pac.nome||"___"} · CID: ${pac.cid||"___"}\n${"─".repeat(50)}\n\n`;
  const LAUDOS=[
    {n:"Declaração Oncológica",c:cab+`DECLARAÇÃO MÉDICA ONCOLÓGICA\n\nAtesto que o(a) paciente está em tratamento oncológico ativo com quimioterapia no Hospital do Bem, Patos/PB, necessitando afastamento por 6 meses.\n\n${AUTOR} · ${AUTOR2}`},
    {n:"Laudo INSS/Benefício",c:cab+`LAUDO PARA FINS PERICIAIS — INSS\n\nPaciente em tratamento oncológico. Afastamento recomendado por 6 meses.\nDireitos: INSS · FGTS · PIS/PASEP · IR Isento · Passe Livre\n\n${AUTOR} · ${AUTOR2}`},
    {n:"Relatório TFD",c:cab+`RELATÓRIO — TRATAMENTO FORA DO DOMICÍLIO\n\nO(a) paciente necessita de deslocamento para tratamento oncológico, solicitando TFD conforme legislação SUS.\n\n${AUTOR} · ${AUTOR2}`},
  ];
  return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <TopBar title="Assistência Social" back={back} alertCount={alertCount} onAlert={onAlert}/>
    <div style={{flex:1,padding:14,overflowY:"auto",display:"grid",gap:11}}>
      <div style={sc_.card()}>
        <H2 ch="Dados"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 9px"}}>
          {[["Nome","nome"],["Nascimento","nasc"],["CPF","cpf"],["CID-10","cid"],["Cidade","cidade"]].map(([l,k])=><Fld key={k} l={l} val={pac[k]||""} set={v=>up(k,v)}/>)}
        </div>
      </div>
      <div style={sc_.card()}>
        <H2 ch="Laudos Sociais"/>
        <div style={{background:laudoLiberado?"#EAF7EE":"#FFF7E6",border:`1px solid ${laudoLiberado?VE:AM}`,borderRadius:10,padding:10,marginBottom:10,display:"flex",gap:9,alignItems:"center"}}>
          <span style={{fontSize:18}}>{laudoLiberado?"✅":"🔒"}</span>
          <div style={{flex:1}}><strong style={{color:N,display:"block",fontSize:12}}>Laudo Pericial</strong><small style={{color:"#64748B",fontSize:10}}>{laudoLiberado?"LIBERADO":"Pendente de avaliação"}</small></div>
          <Btn v={laudoLiberado?"ghost":"gold"} ch={laudoLiberado?"Revogar":"✅ Liberar"} s={{fontSize:10}} onClick={()=>{if(laudoLiberado){if(window.confirm("Revogar?"))setLaudoLiberado&&setLaudoLiberado(false);}else setLaudoLiberado&&setLaudoLiberado(true);}}/>
        </div>
        {LAUDOS.map((l,i)=><div key={i} style={{border:"1px solid #CBD5E1",borderRadius:9,padding:"8px 11px",marginBottom:7}}>
          <strong style={{color:N,display:"block",marginBottom:5,fontSize:12}}>{l.n}</strong>
          <div style={{display:"flex",gap:5}}><Btn v="gold" ch="🖨" s={{fontSize:11}} onClick={()=>setPrint({t:l.n,c:l.c})}/><Btn v="ghost" ch="📋" s={{fontSize:10}} onClick={()=>navigator.clipboard?.writeText(l.c)}/></div>
        </div>)}
      </div>
      <div style={sc_.card()}>
        <H2 ch="Evolução Social"/>
        <textarea rows={2} value={evolucao} onChange={e=>setEvolucao(e.target.value)} style={{...sc_.inp,resize:"none",marginBottom:7}} placeholder="Registro de evolução..."/>
        <Btn v="gold" ch="💾 Gravar" s={{width:"100%"}} onClick={()=>{if(!evolucao.trim())return;setEvolucoes(x=>[{dt:hoje,txt:evolucao,autor:"Serv. Social"},...x]);setEvolucao("");}}/>
        <div style={{marginTop:8}}>{evolucoes.map((e,i)=><div key={i} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:7,padding:"5px 9px",marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}><span style={{fontSize:10,fontWeight:800,color:T}}>{e.autor}</span><span style={{fontSize:9,color:"#94A3B8"}}>{e.dt}</span></div><p style={{fontSize:11,color:"#374151",margin:0}}>{e.txt}</p></div>)}</div>
      </div>
    </div>
  </div>;
}
