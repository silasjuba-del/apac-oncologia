// ─────────────────────────────────────────────────────────────────────────────
// ListaEsperaPrioridade.jsx — Lista de espera com triagem por prioridade
// Extraído de App.jsx — usado em RecepcaoPage e MedicoView
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { N, VM, AM, VE } from "../../utils/constants";
import { sc_, Btn } from "../../components/ui/primitives";

const PRIO_COR={alta:{c:VM,bg:"#FFF0F0"},media:{c:AM,bg:"#FFF7E6"},baixa:{c:VE,bg:"#EAF7EE"}};

export default function ListaEsperaPrioridade({listaEspera,setListaEspera,onAbrirConsulta}){
  const sorted=[...listaEspera].sort((a,b)=>({alta:0,media:1,baixa:2}[a.prioridade]||1)-({alta:0,media:1,baixa:2}[b.prioridade]||1));
  if(!sorted.length)return <p style={{color:"#94A3B8",textAlign:"center",padding:16,fontSize:12}}>Lista vazia.</p>;
  return <div style={{display:"grid",gap:7}}>
    {sorted.map((p,i)=>{const pr=PRIO_COR[p.prioridade]||PRIO_COR.media;return <div key={i} style={{border:`2px solid ${pr.c}44`,borderRadius:12,padding:"9px 12px",background:pr.bg}}>
      <div style={{display:"flex",gap:9,alignItems:"center"}}>
        <div style={{width:32,height:32,background:pr.c,borderRadius:"50%",display:"grid",placeItems:"center",flexShrink:0,color:"#fff",fontWeight:900,fontSize:11}}>#{p.num}</div>
        <div style={{flex:1}}><strong style={{color:N,display:"block",fontSize:13}}>{p.nome}</strong><div style={{fontSize:10,color:"#64748B"}}>{p.proto||"—"} · {p.chegada}</div></div>
        <select value={p.prioridade||"media"} onChange={e=>setListaEspera(x=>x.map((el,j)=>j===i?{...el,prioridade:e.target.value}:el))} style={{...sc_.inp,fontSize:10,padding:"2px 5px",width:88}}>
          <option value="alta">🔴 Alta</option><option value="media">🟡 Média</option><option value="baixa">🟢 Baixa</option>
        </select>
      </div>
      <div style={{display:"flex",gap:6,marginTop:7}}>
        <Btn v="teal" ch="▶ Iniciar" s={{fontSize:10,flex:1}} onClick={()=>onAbrirConsulta&&onAbrirConsulta(p)}/>
        <Btn v="ghost" ch="✅" s={{fontSize:10}} onClick={()=>setListaEspera(x=>x.filter((_,j)=>j!==i))}/>
      </div>
    </div>;})}
  </div>;
}
