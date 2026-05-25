// ─────────────────────────────────────────────────────────────────────────────
// GraficoProducao.jsx — Dashboard de produção mensal de sessões QT
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, T, G, VE, VM } from "../../utils/constants";
import { sc_, H3 } from "../../components/ui/primitives";

const DADOS_PRODUCAO=[
  {mes:"Jan",sessoes:72,meta:90,valor:192600},{mes:"Fev",sessoes:68,meta:90,valor:181700},
  {mes:"Mar",sessoes:84,meta:90,valor:224900},{mes:"Abr",sessoes:91,meta:90,valor:243600},
  {mes:"Mai",sessoes:88,meta:90,valor:235300},{mes:"Jun",sessoes:76,meta:90,valor:203200},
];
export default function GraficoProducao(){
  const maxSes=Math.max(...DADOS_PRODUCAO.map(d=>d.sessoes),90);
  const [hovIdx,setHovIdx]=useState(null);
  return <div style={{display:"grid",gap:12}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      {[{l:"Sessões no mês",v:"88",sub:"Meta: 90",c:T},{l:"Faturamento SUS",v:"R$ 235.300",sub:"Maio/2026",c:G},{l:"Margem Líquida",v:"R$ 42.600",sub:"18,1% ↑",c:VE}].map(x=><div key={x.l} style={{...sc_.card({borderTop:`3px solid ${x.c}`,textAlign:"center",padding:12})}}>
        <div style={{fontSize:18,fontWeight:900,color:x.c}}>{x.v}</div>
        <div style={{fontSize:11,fontWeight:700,color:N,marginTop:2}}>{x.l}</div>
        <div style={{fontSize:9,color:"#94A3B8"}}>{x.sub}</div>
      </div>)}
    </div>
    <div style={sc_.card()}>
      <H3 ch="📊 Sessões de QT — Produção Mensal"/>
      <div style={{display:"flex",alignItems:"flex-end",gap:8,height:140,padding:"0 4px",position:"relative"}}>
        <div style={{position:"absolute",left:0,right:0,bottom:`${(90/maxSes)*140}px`,borderTop:`2px dashed ${VM}44`,display:"flex",alignItems:"center"}}>
          <span style={{fontSize:8,color:VM,marginLeft:4,background:"#fff",padding:"0 3px",fontWeight:700}}>Meta 90</span>
        </div>
        {DADOS_PRODUCAO.map((d,i)=>{const h=(d.sessoes/maxSes)*120;const atingiu=d.sessoes>=d.meta;return <div key={i} onMouseEnter={()=>setHovIdx(i)} onMouseLeave={()=>setHovIdx(null)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer"}}>
          {hovIdx===i&&<div style={{position:"absolute",bottom:h+16,background:N,color:"#fff",borderRadius:7,padding:"4px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap",zIndex:10,pointerEvents:"none"}}>{d.sessoes} sessões · R$ {d.valor.toLocaleString("pt-BR")}</div>}
          <div style={{width:"100%",height:h,background:atingiu?VE:T,borderRadius:"5px 5px 0 0",transition:"height .3s",opacity:hovIdx===i?1:.85}}/>
        </div>;})}
      </div>
      <div style={{display:"flex",gap:8,padding:"0 4px",marginTop:4}}>
        {DADOS_PRODUCAO.map((d,i)=><div key={i} style={{flex:1,textAlign:"center"}}><div style={{fontSize:9,fontWeight:900,color:N}}>{d.mes}</div><div style={{fontSize:8,color:d.sessoes>=d.meta?VE:"#94A3B8",fontWeight:700}}>{d.sessoes}</div></div>)}
      </div>
      <div style={{display:"flex",gap:12,marginTop:10,fontSize:10,color:"#64748B"}}><span>🟢 Meta atingida (≥90)</span><span>🔵 Abaixo da meta</span></div>
    </div>
    <div style={sc_.card()}>
      <H3 ch="📦 Estoque EV — Alertas"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
        {[["Oxaliplatina 100mg",12,8],["Bevacizumabe 400mg",2,4],["Carboplatina 450mg",6,8],["Paclitaxel 300mg",9,6]].map(([n,qt,min])=><div key={n} style={{display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${qt<=min?VM:"#E2E8F0"}44`,background:qt<=min?"#FFF5F5":"#F8FAFC",borderRadius:8,padding:"5px 9px",fontSize:11}}>
          <span style={{color:N,fontWeight:qt<=min?700:400}}>{n}</span>
          <div style={{display:"flex",gap:5,alignItems:"center"}}><strong style={{color:qt<=min?VM:VE}}>{qt}</strong>{qt<=min&&<span style={{background:VM,color:"#fff",borderRadius:999,padding:"0 5px",fontSize:8,fontWeight:900}}>⚠</span>}</div>
        </div>)}
      </div>
    </div>
  </div>;
}

// 7. TRIAGEM ENFERMAGEM EMITE
