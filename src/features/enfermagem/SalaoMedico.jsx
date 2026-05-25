// ─────────────────────────────────────────────────────────────────────────────
// SalaoMedico.jsx — Salão de quimioterapia com cadeiras e emergências
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, T, G, VE, AM, VM, MOCK_CADEIRAS } from "../../utils/constants";
import { sc_, Btn, Bge } from "../../components/ui/primitives";

// playAlertSound: referência a função de alerta sonoro (pre-existing, definida no host)
function playAlertSound(){try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.setValueAtTime(800,ctx.currentTime);o.frequency.setValueAtTime(400,ctx.currentTime+0.1);g.gain.setValueAtTime(0.3,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.5);o.start(ctx.currentTime);o.stop(ctx.currentTime+0.5);}catch(_){}}

export default function SalaoMedico({addMsg,setEmergenciaAtiva}){
  const [aba,setAba]=useState("cadeiras");
  const [emMsg,setEmMsg]=useState("");const [emCad,setEmCad]=useState("");
  const dispararEmergencia=()=>{
    const txt=`🚨 EMERGÊNCIA — Cadeira ${emCad||"?"}: ${emMsg||"Intercorrência urgente!"}`;
    playAlertSound();
    setEmergenciaAtiva&&setEmergenciaAtiva({de:"Salão",txt,hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})});
    addMsg&&addMsg("Salão","Médico",txt,"emergencia");
  };
  return <div style={{display:"grid",gap:12}}>
    <div style={{background:N,display:"flex",borderRadius:11,overflow:"hidden"}}>
      {[{id:"cadeiras",l:"🛋️ Cadeiras"},{id:"emergencia",l:"🚨 Emergência"}].map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{border:"none",cursor:"pointer",padding:"9px",fontSize:12,fontWeight:800,flex:1,background:aba===a.id?(a.id==="emergencia"?VM:G):N,color:aba===a.id?"#fff":"rgba(255,255,255,.5)"}}>{a.l}</button>)}
    </div>
    {aba==="cadeiras"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
      {MOCK_CADEIRAS.map(cad=>{const ocup=cad.st==="ocup",prep=cad.st==="prep";return <div key={cad.id} style={sc_.card({border:`2px solid ${ocup?T:prep?G:"#CBD5E1"}`,background:ocup?"#EFF9FF":prep?"#FFFBEB":"#F8FAFC",padding:10})}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><strong style={{color:N,fontSize:12}}>{cad.id}</strong><Bge t={ocup?"ok":prep?"gold":"muted"} ch={ocup?"Em uso":prep?"Preparo":"Livre"}/></div>
        <p style={{color:ocup?N:"#94A3B8",fontWeight:ocup?700:400,fontSize:12,margin:"0 0 2px"}}>{cad.pac}</p>
        <p style={{color:"#64748B",fontSize:10,margin:"0 0 6px"}}>{cad.proto}</p>
        {ocup&&<Btn v="red" ch="🚨" s={{width:"100%",fontSize:10}} onClick={()=>{setEmCad(cad.id);setEmMsg("Intercorrência em "+cad.pac);setAba("emergencia");}}/>}
      </div>;})}
    </div>}
    {aba==="emergencia"&&<div style={sc_.card({background:"#FEF2F2",border:`3px solid ${VM}`})}>
      <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:44,marginBottom:5}}>🚨</div><h2 style={{color:VM,fontSize:17,fontWeight:900,margin:"0 0 3px"}}>EMERGÊNCIA — SALÃO</h2><p style={{color:"#7F1D1D",fontSize:11,margin:0}}>Alerta invade a tela do médico com som</p></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px",marginBottom:10}}>
        <div><label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Cadeira</label>
          <select value={emCad} onChange={e=>setEmCad(e.target.value)} style={{...sc_.inp,fontSize:12}}>
            <option value="">Selecionar...</option>{MOCK_CADEIRAS.map(c=><option key={c.id} value={c.id}>{c.id} — {c.pac}</option>)}
          </select></div>
        <div><label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Ocorrência</label>
          <select onChange={e=>setEmMsg(e.target.value)} style={{...sc_.inp,fontSize:12}}>
            <option value="">Selecionar...</option>{["Queda de pressão","Reação alérgica","Extravasamento QT","Dificuldade respiratória","Dor torácica","Crise convulsiva"].map(o=><option key={o}>{o}</option>)}
          </select></div>
      </div>
      <textarea value={emMsg} onChange={e=>setEmMsg(e.target.value)} rows={2} placeholder="Descreva a emergência..." style={{...sc_.inp,width:"100%",resize:"none",marginBottom:10}}/>
      <button onClick={dispararEmergencia} style={{width:"100%",background:VM,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>🚨 DISPARAR EMERGÊNCIA</button>
    </div>}
  </div>;
}
