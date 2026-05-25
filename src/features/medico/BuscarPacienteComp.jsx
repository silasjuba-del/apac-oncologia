// ─────────────────────────────────────────────────────────────────────────────
// BuscarPacienteComp.jsx — Busca paciente por nome/protocolo/ID entre filas
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, G, T, VE, VM, AM } from "../../utils/constants";
import { sc_, H2 } from "../../components/ui/primitives";

export default function BuscarPacienteComp({pac,up,setPac,listaEspera=[],agendamentos=[],consultasDia=[],setMedTab,setPronTab,onAbrirPaciente}){
  const [q,setQ]=useState("");
  const [filtro,setFiltro]=useState("todos");
  const todos=[
    ...(listaEspera||[]).map(p=>({...p,origem:"Fila",ico:"🧾"})),
    ...(agendamentos||[]).map(p=>({...p,nome:p.pac||p.nome,origem:"Agenda",ico:"🗓"})),
    ...(consultasDia||[]).map(p=>({...p,origem:"Hoje",ico:"📅"})),
  ];
  const uniq=todos.reduce((acc,p)=>{if(p.nome&&!acc.find(x=>x.nome===p.nome))acc.push(p);return acc;},[]);
  const filtrado=uniq.filter(p=>{
    const match=!q||p.nome?.toLowerCase().includes(q.toLowerCase())||p.proto?.toLowerCase().includes(q.toLowerCase())||p.pacID?.toLowerCase().includes(q.toLowerCase());
    const orig=filtro==="todos"||p.origem?.toLowerCase()===filtro;
    return match&&orig;
  });
  const selecionar=(p)=>{
    if(p.nome)up("nome",p.nome);
    if(p.proto)up("trat",p.proto);
    if(p.pacID)up("pacID",p.pacID);
    if(setPronTab)setPronTab("consulta");
    if(setMedTab)setMedTab("prontuario");
  };
  return <div>
    <H2 ch="🔍 Buscar Paciente"/>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nome, protocolo, ID..." autoFocus style={{...sc_.inp,flex:1,minWidth:180,fontSize:13}}/>
      {["todos","fila","agenda","hoje"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...sc_.btn(filtro===f?"gold":"ghost",{fontSize:10,padding:"6px 11px"})}}>{f==="todos"?"Todos":f==="fila"?"🧾 Fila":f==="agenda"?"🗓 Agenda":"📅 Hoje"}</button>)}
    </div>
    {filtrado.length===0&&<div style={sc_.card({textAlign:"center",padding:32,color:"#94A3B8"})}><div style={{fontSize:40,marginBottom:8}}>🔍</div><p>Nenhum paciente encontrado.</p></div>}
    <div style={{display:"grid",gap:8}}>
      {filtrado.map((p,i)=><div key={i} style={sc_.card({display:"flex",gap:12,alignItems:"center",cursor:"pointer",transition:"box-shadow .15s"})} onClick={()=>selecionar(p)} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 0 0 2px "+G} onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
        <div style={{width:38,height:38,background:G+"22",borderRadius:10,display:"grid",placeItems:"center",fontSize:18,flexShrink:0}}>{p.ico}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,color:N,fontSize:13}}>{p.nome||"—"}</div>
          <div style={{fontSize:11,color:"#64748B"}}>{p.proto||p.tipo||"—"}{p.ciclo?" · "+p.ciclo:""}{p.pacID?" · "+p.pacID:""}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <span style={{background:p.origem==="Fila"?G+"33":p.origem==="Agenda"?T+"33":"#EAF7EE",color:p.origem==="Fila"?G:p.origem==="Agenda"?T:VE,padding:"2px 8px",borderRadius:999,fontSize:10,fontWeight:900}}>{p.origem}</span>
          {p.prioridade&&<div style={{fontSize:9,color:p.prioridade==="alta"?VM:p.prioridade==="media"?AM:VE,fontWeight:900,marginTop:3}}>{p.prioridade?.toUpperCase()}</div>}
        </div>
        <div style={{background:N,color:"#fff",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:900,flexShrink:0}}>Abrir →</div>
      </div>)}
    </div>
    {filtrado.length>0&&<p style={{color:"#94A3B8",fontSize:10,textAlign:"center",marginTop:10}}>{filtrado.length} paciente{filtrado.length>1?"s":""} encontrado{filtrado.length>1?"s":""} · Clique para abrir no prontuário</p>}
  </div>;
}
