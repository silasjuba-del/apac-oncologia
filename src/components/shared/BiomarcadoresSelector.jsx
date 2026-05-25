// ─────────────────────────────────────────────────────────────────────────────
// BiomarcadoresSelector.jsx — Seletor de biomarcadores por tipo de tumor
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, BIOM } from "../../utils/constants";
import { sc_ } from "../../components/ui/primitives";

export default function BiomarcadoresSelector({pac,up}){
  const [tumorSel,setTumorSel]=useState(null);
  const TUMORES=Object.entries(BIOM).map(([k,v])=>({k,t:v.t}));
  const dados=tumorSel?BIOM[tumorSel]:null;
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
      {TUMORES.map(x=><button key={x.k} onClick={()=>setTumorSel(tumorSel===x.k?null:x.k)} style={{...sc_.btn(tumorSel===x.k?"navy":"ghost",{fontSize:10,padding:"6px 4px",textAlign:"center",lineHeight:1.3})}}>
        {x.t.substring(0,20)}{x.t.length>20?"...":""}
      </button>)}
    </div>
    {dados&&<div style={{background:"#F8FAFC",borderRadius:12,padding:12,border:"1px solid #CBD5E1"}}>
      <strong style={{color:N,display:"block",marginBottom:8,fontSize:13}}>{dados.t}</strong>
      <div style={{display:"grid",gap:5,marginBottom:10}}>
        {dados.cat.map((x,i)=><div key={i} onClick={()=>up("bio",x.n+" — "+x.def)} style={{display:"flex",gap:9,alignItems:"center",border:`1px solid ${x.c}44`,borderRadius:9,padding:"6px 10px",cursor:"pointer",background:pac.bio?.includes(x.n)?"#FFFBEB":"#fff"}}>
          <div style={{width:8,height:8,background:x.c,borderRadius:"50%",flexShrink:0}}/>
          <div style={{flex:1}}><strong style={{color:N,fontSize:11}}>{x.n}</strong> <span style={{color:"#64748B",fontSize:9}}>{x.def}</span></div>
          <span style={{color:x.c,fontSize:9,fontWeight:700}}>{x.tx.substring(0,20)}</span>
        </div>)}
      </div>
      <div style={{borderTop:"1px solid #E2E8F0",paddingTop:8}}>
        <small style={{color:"#64748B",fontWeight:700,display:"block",marginBottom:4}}>Marcadores relevantes:</small>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {dados.mk.map((m,i)=><span key={i} style={{background:N,color:"#fff",padding:"2px 7px",borderRadius:999,fontSize:9,fontWeight:700}}>{m}</span>)}
        </div>
      </div>
    </div>}
  </div>;
}
