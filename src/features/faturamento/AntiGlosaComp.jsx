// ─────────────────────────────────────────────────────────────────────────────
// AntiGlosaComp.jsx — Mecanismo anti-glosa: score de completude do prontuário
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, VE, AM, VM, DOCS_OBR } from "../../utils/constants";
import { sc_, H2, H3 } from "../../components/ui/primitives";

export default function AntiGlosaComp({pac,up}){
  const [docs,setDocs]=useState([]);
  const [editando,setEditando]=useState("");
  const campos=[
    {k:"nome",l:"Nome Completo"},
    {k:"cpf",l:"CPF"},
    {k:"cns",l:"CNS (Cartão SUS)"},
    {k:"diag",l:"Diagnóstico"},
    {k:"cid",l:"CID-10"},
    {k:"trat",l:"Protocolo de Tratamento",opts:["AC","AC-T","TCHP","FOLFOX","FOLFIRI","CAPOX/XELOX","Carboplatina + Paclitaxel","Carboplatina + Pemetrexede","Cisplatina + RT","Docetaxel","Hormonioterapia"]},
    {k:"estadio",l:"Estadiamento"},
    {k:"ecog",l:"ECOG",opts:["0","1","2","3","4"]},
    {k:"linha",l:"Linha de Tratamento",opts:["Adjuvante","Neoadjuvante","1ª linha","2ª linha","3ª linha","Manutenção","Concomitante à radioterapia"]},
    {k:"intencao",l:"Intenção Terapêutica",opts:["Curativa","Paliativa","Adjuvante","Neoadjuvante","Perioperatória","Controle de sintomas"]},
  ];
  const salvarCampo=(k,v)=>{up&&up(k,v);setEditando("");};
  const preenchidos=campos.filter(c=>pac?.[c.k]&&String(pac[c.k]).trim()!=="");
  const pct=Math.round((preenchidos.length/campos.length)*70+(docs.length>0?30:0));
  const cor=pct>=85?VE:pct>=60?AM:VM;
  const nivel=pct>=85?"BAIXO RISCO DE GLOSA":pct>=60?"RISCO MODERADO":"ALTO RISCO DE GLOSA";
  return <div style={{display:"grid",gap:12}}>
    <H2 ch="🛡 Mecanismo Anti-Glosa"/>
    <div style={{...sc_.card({background:pct>=85?"#EAF7EE":pct>=60?"#FFF7E6":"#FFF0F0",border:`2px solid ${cor}`})}}>
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:cor,display:"grid",placeItems:"center",color:"#fff",fontSize:20,fontWeight:900,flexShrink:0}}>{pct}%</div>
        <div><div style={{fontWeight:900,color:cor,fontSize:15}}>{nivel}</div><div style={{fontSize:11,color:"#64748B",marginTop:2}}>Score baseado em campos e documentos obrigatórios APAC</div></div>
      </div>
      <div style={{background:"#fff",borderRadius:10,overflow:"hidden",height:8,marginBottom:10}}>
        <div style={{width:pct+"%",height:"100%",background:cor,transition:"width .5s"}}/>
      </div>
    </div>
    <div style={sc_.card()}>
      <H3 ch="📋 Campos Obrigatórios"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {campos.map(c=>{const ok=pac?.[c.k]&&String(pac[c.k]).trim()!=="";const edit=editando===c.k;return <div key={c.k} onClick={()=>setEditando(c.k)} style={{display:"grid",gridTemplateColumns:"auto 150px 1fr",gap:8,alignItems:"center",padding:"7px 9px",borderRadius:9,background:ok?"#EAF7EE":"#FFF5F5",border:`1px solid ${ok?VE:VM}33`,cursor:"pointer"}}>
          <span style={{fontSize:14}}>{ok?"✅":"❌"}</span>
          <span style={{fontSize:11,color:ok?VE:VM,fontWeight:700}}>{c.l}</span>
          {edit?(
            <div onClick={e=>e.stopPropagation()} style={{display:"grid",gridTemplateColumns:c.opts?"1fr 1fr auto":"1fr auto",gap:5}}>
              {c.opts&&<select value={pac?.[c.k]||""} onChange={e=>salvarCampo(c.k,e.target.value)} style={{...sc_.inp,fontSize:11,padding:"6px 8px"}}>
                <option value="">Selecionar...</option>{c.opts.map(o=><option key={o}>{o}</option>)}
              </select>}
              <input autoFocus defaultValue={pac?.[c.k]||""} placeholder="Digitar livremente" onKeyDown={e=>{if(e.key==="Enter")salvarCampo(c.k,e.currentTarget.value);if(e.key==="Escape")setEditando("");}} onBlur={e=>{if(e.currentTarget.value!==String(pac?.[c.k]||""))salvarCampo(c.k,e.currentTarget.value);else setEditando("");}} style={{...sc_.inp,fontSize:11,padding:"6px 8px"}}/>
              <button type="button" onClick={e=>{e.stopPropagation();setEditando("");}} style={{border:"none",background:"#F1F5F9",borderRadius:7,padding:"4px 8px",fontSize:10,cursor:"pointer"}}>Fechar</button>
            </div>
          ):(
            <span style={{fontSize:10,color:ok?"#64748B":VM,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ok?String(pac[c.k]).substring(0,70):"Clique para preencher"}</span>
          )}
        </div>;})}
      </div>
    </div>
    <div style={sc_.card()}>
      <H3 ch="📎 Documentos Anexados"/>
      <div style={{display:"grid",gap:5,marginBottom:10}}>
        {DOCS_OBR.slice(0,6).map(d=>{const ok=docs.includes(d.id);return <label key={d.id} style={{display:"flex",gap:9,alignItems:"center",padding:"6px 10px",borderRadius:9,cursor:"pointer",background:ok?"#EAF7EE":"#F8FAFC",border:`1px solid ${ok?VE:"#CBD5E1"}`}}>
          <input type="checkbox" checked={ok} onChange={()=>setDocs(x=>ok?x.filter(i=>i!==d.id):[...x,d.id])} style={{accentColor:VE}}/>
          <span style={{fontSize:11,color:ok?VE:N,fontWeight:ok?700:400}}>{d.n}</span>
          <span style={{marginLeft:"auto",fontSize:9,color:"#94A3B8",flexShrink:0}}>peso {d.peso}</span>
        </label>;})}
      </div>
      {pct<85&&<div style={{background:"#FFF7E6",borderRadius:9,padding:"9px 12px",border:`1px solid ${AM}44`}}>
        <strong style={{color:AM,fontSize:11,display:"block",marginBottom:5}}>⚠️ Pontos críticos para evitar glosa:</strong>
        {campos.filter(c=>!(pac?.[c.k]&&String(pac[c.k]).trim()!=="")).slice(0,4).map(c=><div key={c.k} style={{fontSize:10,color:"#92400E",marginBottom:2}}>• Preencher: {c.l}</div>)}
        {docs.length===0&&<div style={{fontSize:10,color:"#92400E",marginBottom:2}}>• Anexar: Anatomopatológico, Imagem, CID documentado</div>}
      </div>}
    </div>
  </div>;
}
