// ─────────────────────────────────────────────────────────────────────────────
// ComunicacaoPage.jsx — Página de comunicação entre setores
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, T, VE, AM, VM, BG } from "../../utils/constants";
import { sc_, H2, Btn, TopBar, Footer } from "../../components/ui/primitives";

export default function ComunicacaoPage({mensagens,addMsg,back,alertCount,onAlert}){
  const [de,setDe]=useState("Médico");const [para,setPara]=useState("Farmácia");const [txt,setTxt]=useState("");const [filtro,setFiltro]=useState("Todos");
  const enviar=()=>{if(!txt.trim())return;addMsg(de,para,txt);setTxt("");};
  const msgs=(mensagens||[]).filter(m=>filtro==="Todos"||(m.de===filtro||m.para===filtro));
  const tipoIcon={ciclo:"💉",alerta:"⚠️",msg:"💬",emergencia:"🚨",triagem:"🩺"};
  const MEMBROS=["Médico","Farmácia","Enfermagem","Recepção","Assistência Social","Todos"];
  return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
    <TopBar title="Comunicação" back={back} alertCount={alertCount} onAlert={onAlert}/>
    <div style={{flex:1,padding:16,overflowY:"auto",display:"grid",gap:12}}>
      <div style={sc_.card()}>
        <H2 ch="📤 Enviar Mensagem"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px",marginBottom:10}}>
          <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>De</label><select value={de} onChange={e=>setDe(e.target.value)} style={{...sc_.inp,fontSize:13}}>{MEMBROS.slice(0,-1).map(m=><option key={m}>{m}</option>)}</select></div>
          <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Para</label><select value={para} onChange={e=>setPara(e.target.value)} style={{...sc_.inp,fontSize:13}}>{MEMBROS.map(m=><option key={m}>{m}</option>)}</select></div>
        </div>
        <textarea value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),enviar())} placeholder="Digite a mensagem (Enter para enviar)..." rows={3} style={{...sc_.inp,width:"100%",resize:"none",marginBottom:8,fontSize:13}}/>
        <Btn v="teal" ch="📤 Enviar" s={{width:"100%",fontSize:13}} onClick={enviar}/>
      </div>
      <div style={sc_.card()}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><H2 ch="📨 Mensagens" s={{margin:0}}/><select value={filtro} onChange={e=>setFiltro(e.target.value)} style={{...sc_.inp,width:130,fontSize:11}}>{MEMBROS.map(m=><option key={m}>{m}</option>)}</select></div>
        {msgs.length===0&&<p style={{color:"#94A3B8",textAlign:"center",padding:16,fontSize:12}}>Sem mensagens.</p>}
        {msgs.slice(0,20).map((m,i)=><div key={i} style={{border:`1px solid ${m.tipo==="emergencia"?VM:m.tipo==="alerta"?AM:T}33`,borderRadius:11,padding:"8px 12px",marginBottom:7,background:m.tipo==="emergencia"?"#FFF5F5":"#F8FAFC"}}>
          <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:5}}>
            <span style={{fontSize:16}}>{tipoIcon[m.tipo]||"💬"}</span>
            <strong style={{color:N,fontSize:12,flex:1}}>{m.de} → {m.para}</strong>
            <span style={{color:"#94A3B8",fontSize:10}}>{m.dt}</span>
          </div>
          <p style={{fontSize:12,color:"#374151",margin:0,lineHeight:1.5}}>{m.txt}</p>
        </div>)}
      </div>
    </div>
    <Footer/>
  </div>;
}
