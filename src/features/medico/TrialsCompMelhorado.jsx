// ─────────────────────────────────────────────────────────────────────────────
// TrialsCompMelhorado.jsx — Ensaios clínicos e elegibilidade por paciente
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef } from "react";
import { N, T, G, VE, AM, VM, TRIALS } from "../../utils/constants";
import { sc_, Btn, H2, H3 } from "../../components/ui/primitives";

export default function TrialsCompMelhorado({pac,addMsg}){
  const [aba,setAba]=useState("estudos");const [sel,setSel]=useState(null);const [incluidos,setIncluidos]=useState([]);
  const refUp=useRef(null);const [arqUp,setArqUp]=useState([]);const [analise,setAnalise]=useState(null);
  const verificar=t=>{const fail=[];t.inc.forEach(c=>{if(c.toLowerCase().includes("ecog 0–2")&&Number(pac.ecog||"3")>2)fail.push(c);});return{fail,elegivel:fail.length===0};};
  return <div style={{display:"grid",gap:11}}>
    <div style={{background:N,display:"flex",borderRadius:10,overflow:"hidden"}}>
      {[{id:"estudos",l:"📋 Estudos"},{id:"upload",l:"📤 Upload"},{id:"incluidos",l:`👥 Incluídos (${incluidos.length})`}].map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{border:"none",cursor:"pointer",padding:"9px",fontSize:11,fontWeight:800,flex:1,background:aba===a.id?G:N,color:aba===a.id?"#fff":"rgba(255,255,255,.5)"}}>{a.l}</button>)}
    </div>
    {aba==="estudos"&&TRIALS.map(t=>{const el=pac.diag?verificar(t):{fail:[],elegivel:false};const isOpen=sel?.id===t.id;return <div key={t.id} style={sc_.card({border:`2px solid ${el.elegivel&&pac.diag?VE:isOpen?G:"#E2E8F0"}`})}>
      <div onClick={()=>setSel(isOpen?null:t)} style={{cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}><div><strong style={{color:N,fontSize:13}}>{t.n}</strong> <span style={{color:"#64748B",fontSize:10}}>Fase {t.fase} · {t.tumor}</span></div><div style={{display:"flex",gap:4,flexShrink:0}}><span style={{background:t.status==="ativo"?VE:T,color:"#fff",padding:"1px 5px",borderRadius:999,fontSize:8,fontWeight:900}}>{t.status?.toUpperCase()}</span>{el.elegivel&&pac.diag&&<span style={{background:G,color:"#fff",padding:"1px 5px",borderRadius:999,fontSize:8,fontWeight:900}}>✓ ELEGÍVEL</span>}</div></div>
        <div style={{fontSize:10,marginTop:2}}><strong style={{color:N}}>SG:</strong> {t.sg} {t.slp&&<span> · <strong style={{color:T}}>SLP:</strong> {t.slp}</span>}</div>
      </div>
      {isOpen&&<div style={{marginTop:9,paddingTop:8,borderTop:"1px solid #E2E8F0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:7}}>
          <div style={{background:"#EAF7EE",borderRadius:7,padding:8}}><strong style={{color:VE,fontSize:10,display:"block",marginBottom:3}}>✅ Inclusão</strong>{t.inc.map((c,i)=><div key={i} style={{fontSize:9,marginBottom:1}}>• {c}</div>)}</div>
          <div style={{background:"#FFF5F5",borderRadius:7,padding:8}}><strong style={{color:VM,fontSize:10,display:"block",marginBottom:3}}>❌ Exclusão</strong>{t.exc.map((c,i)=><div key={i} style={{fontSize:9,marginBottom:1}}>• {c}</div>)}</div>
        </div>
        <div style={{display:"flex",gap:5}}>
          {el.elegivel&&pac.diag&&<Btn v="gold" ch="✅ Incluir" s={{flex:1,fontSize:10}} onClick={()=>{if(!pac.nome)return alert("Cadastre o paciente.");setIncluidos(x=>[{pac:pac.nome,trial:t.n,data:new Date().toLocaleDateString("pt-BR")},...x]);setAba("incluidos");addMsg&&addMsg("Médico","Todos",`${pac.nome} incluído em ${t.n}.`,"msg");}}/>}
          <Btn v="teal" ch="📤 Sponsor" s={{fontSize:10}} onClick={()=>alert(`Dados enviados ao sponsor: ${t.n}`)}/>
        </div>
      </div>}
    </div>;})}
    {aba==="upload"&&<div style={sc_.card()}>
      <H2 ch="📤 Upload de Protocolo"/>
      <input ref={refUp} type="file" accept=".pdf,.doc,.docx" style={{display:"none"}} onChange={e=>{setArqUp(Array.from(e.target.files||[]).map(f=>({n:f.name})));e.target.value="";}}/>
      <div onClick={()=>refUp.current?.click()} style={{border:"2px dashed "+T,borderRadius:10,padding:"20px",textAlign:"center",cursor:"pointer",background:"#F0F9FF",marginBottom:8}}><div style={{fontSize:30,marginBottom:5}}>📄</div><strong style={{color:T,fontSize:12}}>Upload PDF ou Word</strong></div>
      {arqUp.length>0&&!analise&&<Btn v="gold" ch="📤 Extrair Critérios" s={{width:"100%"}} onClick={()=>{setAnalise({loading:true});setTimeout(()=>setAnalise({ok:["Histologia confirmada","ECOG 0–2","Sem anti-PD-1 prévio"],exc:["Autoimune ativa","SNC não tratadas"],titulo:arqUp[0].n}),2000);}}/>}
      {analise?.loading&&<p style={{textAlign:"center",color:T,padding:12}}>⏳ Extraindo critérios...</p>}
      {analise&&!analise.loading&&<div style={{marginTop:9,background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:9,padding:10}}><H3 ch={"✅ "+analise.titulo} s={{color:VE}}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}><div style={{background:"#EAF7EE",borderRadius:7,padding:8}}><strong style={{color:VE,fontSize:10,display:"block",marginBottom:3}}>✅ Inclusão</strong>{analise.ok.map((c,i)=><div key={i} style={{fontSize:9,marginBottom:1}}>• {c}</div>)}</div><div style={{background:"#FFF5F5",borderRadius:7,padding:8}}><strong style={{color:VM,fontSize:10,display:"block",marginBottom:3}}>❌ Exclusão</strong>{analise.exc.map((c,i)=><div key={i} style={{fontSize:9,marginBottom:1}}>• {c}</div>)}</div></div></div>}
    </div>}
    {aba==="incluidos"&&<div style={sc_.card()}><H2 ch="👥 Pacientes Incluídos"/>{incluidos.length===0?<p style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:14}}>Nenhum incluído.</p>:incluidos.map((p,i)=><div key={i} style={{display:"flex",gap:9,alignItems:"center",border:"1px solid "+VE+"44",borderRadius:8,padding:"7px 10px",marginBottom:6,background:"#EAF7EE"}}><span style={{fontSize:16}}>🧬</span><div style={{flex:1}}><strong style={{color:N}}>{p.pac}</strong><div style={{color:"#64748B",fontSize:10}}>{p.trial} · {p.data}</div></div></div>)}</div>}
  </div>;
}
