// ─────────────────────────────────────────────────────────────────────────────
// EnfermagemPage.jsx — Módulo de Enfermagem Oncológica
// Extraído de App.jsx — usa constants.js + primitives.jsx + TriagemQTFrame
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, G, T, BG, MOCK_CADEIRAS, calcProxCiclo } from "../../utils/constants";
import { sc_, Btn, Bge, TopBar, Footer, PrintModal, ChatAba } from "../../components/ui/primitives";
import TriagemQTv17Frame from "./TriagemQTFrame";

export default function EnfermagemPage({pac,mensagens,addMsg,addHistQT,back,alertCount,onAlert,onNovaTriagem}){
  const [abaEnf,setAbaEnf]=useState("salao");
  const [cadeiras,setCadeiras]=useState(MOCK_CADEIRAS.map(c=>({...c})));
  const [print,setPrint]=useState(null);
  const hoje2=new Date().toLocaleDateString("pt-BR");

  const iniciar=(id)=>{
    const cad=cadeiras.find(c=>c.id===id);
    if(cad?.pac){addHistQT&&addHistQT({data:hoje2,protocolo:cad.proto,ciclo:"C"+(Math.floor(Math.random()*3)+1)+"D1",pacID:pac.pacID||"",proxCiclo:calcProxCiclo(cad.proto,new Date())});}
    setCadeiras(x=>x.map(c=>c.id===id?{...c,st:"ocup"}:c));
    if(addMsg)addMsg("Enfermagem","Médico",`Infusão iniciada: Cadeira ${id} — ${cad?.pac||"—"} · ${cad?.proto||"—"}`,"ciclo");
  };

  return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <TopBar title="Enfermagem — Salão" back={back} alertCount={alertCount} onAlert={onAlert}/>
    <div style={{background:N,display:"flex",borderBottom:`3px solid ${G}`,flexShrink:0}}>
      {[{id:"salao",l:"🛋️ Salão"},{id:"triagem",l:"🩺 Triagem"}].map(a=><button key={a.id} onClick={()=>setAbaEnf(a.id)} style={{border:"none",cursor:"pointer",padding:"9px 16px",fontSize:13,fontWeight:800,flex:1,background:abaEnf===a.id?G:N,color:abaEnf===a.id?"#fff":"rgba(255,255,255,.5)"}}>{a.l}</button>)}
    </div>
    <div style={{flex:1,padding:16,overflowY:"auto"}}>
      {abaEnf==="salao"&&<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {cadeiras.map(cad=>{const ocup=cad.st==="ocup",prep=cad.st==="prep";return <div key={cad.id} style={sc_.card({border:`2px solid ${ocup?T:prep?G:"#CBD5E1"}`,background:ocup?"#EFF9FF":prep?"#FFFBEB":"#F8FAFC"})}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><strong style={{color:N,fontSize:13}}>{cad.id}</strong><Bge t={ocup?"ok":prep?"gold":"muted"} ch={ocup?"Ocupada":prep?"Preparo":"Livre"}/></div>
          <p style={{color:ocup?N:"#94A3B8",fontWeight:ocup?700:400,fontSize:13,margin:"0 0 2px"}}>{cad.pac}</p>
          <p style={{color:"#64748B",fontSize:11,margin:"0 0 8px"}}>{cad.proto}</p>
          {!ocup&&!prep&&<Btn v="teal" ch="▶ Iniciar" s={{width:"100%",fontSize:11}} onClick={()=>iniciar(cad.id)}/>}
          {(ocup||prep)&&<Btn v="red" ch="⏹ Concluir" s={{width:"100%",fontSize:11}} onClick={()=>setCadeiras(x=>x.map(c=>c.id===cad.id?{...c,st:"livre",pac:"—",proto:"—"}:c))}/>}
        </div>;})}
      </div>}
      {abaEnf==="triagem"&&<TriagemQTv17Frame pac={pac} addMsg={addMsg} onEnviar={t=>{onNovaTriagem&&onNovaTriagem(t);}}/>}
      <ChatAba mensagens={mensagens} addMsg={addMsg} de="Enfermagem"/>
    </div>
    <Footer/>
  </div>;
}
