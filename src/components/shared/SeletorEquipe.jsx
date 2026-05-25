// ─────────────────────────────────────────────────────────────────────────────
// SeletorEquipe.jsx — Dropdown de seleção do membro da equipe logado
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, EQUIPE } from "../../utils/constants";

export default function SeletorEquipe({funcLogado,setFuncLogado}){
  const [open,setOpen]=useState(false);
  return <div style={{position:"relative"}}>
    <button onClick={()=>setOpen(x=>!x)} style={{background:"rgba(255,255,255,.12)",border:"none",color:"#fff",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>
      {(funcLogado?.nome||"Equipe").split(" ")[0]} ▾
    </button>
    {open&&<div style={{position:"absolute",top:"110%",right:0,background:"#fff",borderRadius:11,boxShadow:"0 8px 32px rgba(0,0,0,.18)",padding:8,minWidth:210,zIndex:9999}}>
      {EQUIPE.map(e=><button key={e.id} onClick={()=>{setFuncLogado(e);setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",background:funcLogado?.id===e.id?"#EFF9FF":"transparent",border:"none",cursor:"pointer",padding:"7px 10px",borderRadius:7,marginBottom:2}}>
        <div style={{fontWeight:800,color:N,fontSize:12}}>{e.nome}</div>
        <div style={{color:"#64748B",fontSize:10}}>{e.cargo}</div>
      </button>)}
    </div>}
  </div>;
}
