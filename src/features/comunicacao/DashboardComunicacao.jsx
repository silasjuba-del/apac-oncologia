// ─────────────────────────────────────────────────────────────────────────────
// DashboardComunicacao.jsx — Iframe de comunicação (Gmail, WhatsApp, etc.)
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N } from "../../utils/constants";

const COMUN_APPS=[
  {id:"gmail",name:"Gmail",url:"https://mail.google.com",emoji:"📧",cor:"#EA4335"},
  {id:"outlook",name:"Outlook",url:"https://outlook.live.com",emoji:"📮",cor:"#0078D4"},
  {id:"whatsapp",name:"WhatsApp Web",url:"https://web.whatsapp.com",emoji:"💬",cor:"#25D366"},
  {id:"telegram",name:"Telegram Web",url:"https://web.telegram.org",emoji:"✈️",cor:"#0088CC"},
];
export default function DashboardComunicacao(){
  const [sel,setSel]=useState("gmail");
  const app=COMUN_APPS.find(a=>a.id===sel);
  return <div style={{display:"grid",gap:0,height:"calc(100vh - 120px)"}}>
    <div style={{display:"flex",background:N,borderRadius:"11px 11px 0 0",overflow:"hidden",flexShrink:0}}>
      {COMUN_APPS.map(a=><button key={a.id} onClick={()=>setSel(a.id)} style={{border:"none",cursor:"pointer",padding:"9px 12px",fontSize:11,fontWeight:800,flex:1,fontFamily:"inherit",background:sel===a.id?a.cor:N,color:sel===a.id?"#fff":"rgba(255,255,255,.45)",transition:"all .2s"}}><span style={{marginRight:4}}>{a.emoji}</span>{a.name}</button>)}
    </div>
    <div style={{flex:1,position:"relative",background:"#F8FAFC",borderRadius:"0 0 11px 11px",overflow:"hidden",border:`2px solid ${app.cor}33`,borderTop:"none"}}>
      <iframe key={sel} src={app.url} title={app.name} style={{width:"100%",height:"100%",border:"none"}} allow="clipboard-read; clipboard-write; microphone; camera"/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:`${app.cor}EE`,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:"#fff",fontSize:11,fontWeight:700}}>{app.emoji} {app.name}</span>
        <a href={app.url} target="_blank" rel="noreferrer" style={{background:"rgba(255,255,255,.9)",color:app.cor,padding:"3px 10px",borderRadius:9,fontSize:10,fontWeight:800,textDecoration:"none"}}>↗ Abrir em nova aba</a>
      </div>
    </div>
  </div>;
}
