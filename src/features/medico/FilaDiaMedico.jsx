// ─────────────────────────────────────────────────────────────────────────────
// FilaDiaMedico.jsx — Fila de atendimentos do dia para o médico
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, T, G, VE, VM } from "../../utils/constants";
import { sc_ } from "../../components/ui/primitives";

export default function FilaDiaMedico({consultasDia,alertas,onAbrirAtendimento,setMedTab}){
  const [visao,setVisao]=useState("espera");
  const aguardando=consultasDia.filter(p=>p.status==="aguardando");
  const emConsulta=consultasDia.filter(p=>p.status==="em_consulta");
  const atendidos=consultasDia.filter(p=>p.status==="atendido");
  const emEspera=[...aguardando,...emConsulta];
  const listaAtual=visao==="atendidos"?atendidos:emEspera;
  const stats=[
    {ico:"⏳",label:"Em espera",n:emEspera.length,cor:T,bg:"#EBF2FF"},
    {ico:"🩺",label:"Em consulta",n:emConsulta.length,cor:G,bg:"#FDF8EE"},
    {ico:"✅",label:"Atendidos",n:atendidos.length,cor:VE,bg:"#ECFDF5"},
    {ico:"🚨",label:"Alertas",n:alertas.length,cor:VM,bg:"#FCE8EF"},
  ];
  return <div style={{display:"grid",gap:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
      <div><h2 style={{margin:0,color:N,fontSize:24,fontWeight:950}}>Atendimentos</h2><p style={{margin:"4px 0 0",color:"#64748B",fontWeight:750,fontSize:13}}>Pacientes em espera e atendidos no fluxo do dia.</p></div>
      <button onClick={()=>setMedTab("dashboard")} style={{...sc_.btn("gold",{padding:"10px 14px"})}}>Voltar ao Dashboard</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
      {stats.map(s=><div key={s.label} style={{background:s.bg,border:"1px solid "+s.cor+"44",borderRadius:16,padding:16,display:"flex",gap:12,alignItems:"center"}}><span style={{fontSize:25}}>{s.ico}</span><div><div style={{fontSize:28,fontWeight:950,color:s.cor,lineHeight:1}}>{s.n}</div><div style={{fontSize:11,color:"#64748B",fontWeight:900}}>{s.label}</div></div></div>)}
    </div>
    <div style={{background:"#fff",border:"1px solid #DDE3EC",borderRadius:18,padding:18}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <button onClick={()=>setVisao("espera")} style={{border:"1px solid "+(visao==="espera"?T:"#CBD5E1"),background:visao==="espera"?"#EBF2FF":"#F8FAFC",color:visao==="espera"?T:N,borderRadius:12,padding:"10px 12px",fontWeight:950,cursor:"pointer",fontFamily:"inherit"}}>⏳ Em espera ({emEspera.length})</button>
        <button onClick={()=>setVisao("atendidos")} style={{border:"1px solid "+(visao==="atendidos"?VE:"#CBD5E1"),background:visao==="atendidos"?"#ECFDF5":"#F8FAFC",color:visao==="atendidos"?VE:N,borderRadius:12,padding:"10px 12px",fontWeight:950,cursor:"pointer",fontFamily:"inherit"}}>✅ Atendidos ({atendidos.length})</button>
      </div>
      {listaAtual.length===0&&<div style={{textAlign:"center",padding:"26px",color:"#94A3B8",fontWeight:800}}>{visao==="atendidos"?"Nenhum paciente atendido ainda.":"Nenhum paciente em espera."}</div>}
      {listaAtual.map((p,i)=>{const cor=p.status==="em_consulta"?G:p.status==="atendido"?VE:T;return <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 0",borderBottom:i<listaAtual.length-1?"1px solid #EEF2F8":"none"}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:cor,color:"#fff",display:"grid",placeItems:"center",fontWeight:950,fontSize:11}}>#{p.num||i+1}</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,color:N,fontWeight:950,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.nome}</div><div style={{fontSize:11,color:"#64748B",fontWeight:750}}>{p.proto||p.trat||"Aguardando avaliação"} {p.checkin?"· "+p.checkin:""}</div></div>
        <button onClick={()=>onAbrirAtendimento(p)} style={{...sc_.btn("navy",{fontSize:11,padding:"7px 12px"})}}>Abrir</button>
      </div>;})}
    </div>
  </div>;
}
