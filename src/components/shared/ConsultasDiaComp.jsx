// ─────────────────────────────────────────────────────────────────────────────
// ConsultasDiaComp.jsx — Painel de consultas do dia para médico
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { N, T, G, VE, AM } from "../../utils/constants";
import { sc_, H2, Btn } from "../../components/ui/primitives";

export default function ConsultasDiaComp({consultasDia,setConsultasDia,onAbrirPac}){
  const STATUS={aguardando:{c:AM,bg:"#FFF7E6"},em_consulta:{c:T,bg:"#EFF9FF"},concluido:{c:VE,bg:"#EAF7EE"}};
  const upStatus=(i,s)=>setConsultasDia(x=>x.map((p,j)=>j===i?{...p,status:s}:p));
  return <div style={{display:"grid",gap:14}}>
    <div style={{...sc_.card({background:`linear-gradient(135deg,${N},#0d2347)`,padding:16})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div><H2 ch="📅 Consultas de Hoje" s={{color:"#fff",margin:0}}/><p style={{color:G,fontSize:11,margin:"2px 0 0"}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</p></div>
        <div style={{color:G,fontSize:24,fontWeight:900}}>{consultasDia.length}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {["D","S","T","Q","Q","S","S"].map((d,i)=>{const hj=new Date().getDay();const dt=new Date(Date.now()+(i-hj)*86400000);return <div key={i} style={{textAlign:"center",padding:"4px 0",borderRadius:8,background:i===hj?"rgba(184,134,11,.5)":"rgba(255,255,255,.07)"}}>
          <div style={{color:i===hj?G:"rgba(255,255,255,.4)",fontSize:8,fontWeight:700}}>{d}</div>
          <div style={{color:i===hj?"#fff":"rgba(255,255,255,.5)",fontSize:12,fontWeight:i===hj?900:400}}>{dt.getDate()}</div>
        </div>;})}
      </div>
    </div>
    {consultasDia.length===0
      ?<div style={sc_.card({textAlign:"center",padding:28,color:"#94A3B8"})}><div style={{fontSize:36,marginBottom:8}}>📋</div><p>Aguardando check-ins da Recepção.</p></div>
      :<div style={{display:"grid",gap:9}}>
        {consultasDia.map((p,i)=>{const st=STATUS[p.status]||STATUS.aguardando;return <div key={i} style={{border:`2px solid ${st.c}`,borderRadius:14,padding:"10px 13px",background:st.bg}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:36,height:36,background:N,borderRadius:"50%",display:"grid",placeItems:"center",flexShrink:0}}><span style={{color:G,fontWeight:900,fontSize:12}}>#{p.num}</span></div>
            <div style={{flex:1}}><strong style={{color:N,display:"block",fontSize:14}}>{p.nome}</strong><div style={{fontSize:11,color:"#64748B"}}>{p.proto||"—"} · {p.checkin}</div></div>
            <select value={p.status||"aguardando"} onChange={e=>upStatus(i,e.target.value)} style={{...sc_.inp,fontSize:11,padding:"3px 7px",width:130}}>
              <option value="aguardando">⏳ Aguardando</option>
              <option value="em_consulta">🩺 Em consulta</option>
              <option value="concluido">✅ Concluído</option>
            </select>
          </div>
          <Btn v="teal" ch="📋 Abrir Prontuário" s={{marginTop:7,fontSize:11,width:"100%"}} onClick={onAbrirPac&&(()=>onAbrirPac(p))}/>
        </div>;})}
      </div>}
  </div>;
}
