// ─────────────────────────────────────────────────────────────────────────────
// EstatisticasComp.jsx — Componente de estatísticas do painel médico
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { N, T, G, VE, AM, VM, PROTOS } from "../../utils/constants";
import { sc_, H3 } from "../../components/ui/primitives";

export default function EstatisticasComp({consultasDia}){
  const bars=[{l:"Adenoca. cólon",n:18,c:T},{l:"Ca pulmão",n:14,c:N},{l:"Ca mama RH+",n:12,c:"#EC4899"},{l:"Ca próstata",n:9,c:G},{l:"Ca pâncreas",n:6,c:AM},{l:"Ca gástrico",n:5,c:VM}];
  return <div style={{display:"grid",gap:11}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
      {[{l:"Pacientes Ativos",v:47,ico:"👥",c:T},{l:"Ciclos/mês",v:124,ico:"💉",c:G},{l:"Consultas hoje",v:consultasDia.length||3,ico:"📅",c:VE},{l:"Protocolos",v:PROTOS.length,ico:"📋",c:N}].map(x=><div key={x.l} style={sc_.card({borderTop:`3px solid ${x.c}`,padding:10,textAlign:"center"})}>
        <div style={{fontSize:18,marginBottom:2}}>{x.ico}</div><div style={{fontSize:22,fontWeight:900,color:x.c}}>{x.v}</div><div style={{fontSize:9,color:"#64748B",fontWeight:700}}>{x.l}</div>
      </div>)}
    </div>
    <div style={sc_.card({padding:12})}>
      <H3 ch="🎯 Diagnósticos"/>
      {bars.map((b,i)=><div key={i} style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:11,color:N,fontWeight:600}}>{b.l}</span><span style={{fontSize:11,fontWeight:900,color:b.c}}>{b.n}</span></div><div style={{height:5,background:"#E2E8F0",borderRadius:999,overflow:"hidden"}}><div style={{height:"100%",background:b.c,width:(b.n/18*100)+"%",borderRadius:999}}/></div></div>)}
    </div>
    <div style={sc_.card({padding:12})}>
      <H3 ch="⚡ ECOG"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
        {[{e:"0",n:12,c:VE},{e:"1",n:22,c:T},{e:"2",n:9,c:G},{e:"3",n:3,c:AM},{e:"4",n:1,c:VM}].map(x=><div key={x.e} style={{textAlign:"center",padding:"7px 4px",background:x.c+"11",borderRadius:9,border:`1px solid ${x.c}44`}}><div style={{fontSize:18,fontWeight:900,color:x.c}}>{x.n}</div><div style={{fontSize:9,color:"#64748B",fontWeight:700}}>ECOG {x.e}</div></div>)}
      </div>
    </div>
  </div>;
}
