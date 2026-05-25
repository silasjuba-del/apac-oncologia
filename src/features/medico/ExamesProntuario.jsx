// ─────────────────────────────────────────────────────────────────────────────
// ExamesProntuario.jsx — Tabela de laboratório, anatomopatológico e imagem
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, G, T, VE, AM, VM } from "../../utils/constants";
import { sc_, Fld } from "../../components/ui/primitives";

export default function ExamesProntuario({pac,up}){
  const [aba,setAba]=useState("lab");
  const [labRows,setLabRows]=useState(pac?.exames_lab_prontuario||[{data:"",neutro:"",plt:"",hgb:"",creat:"",tgo:"",tgp:"",obs:""}]);
  const upLab=(i,k,v)=>{const n=labRows.map((r,j)=>j===i?{...r,[k]:v}:r);setLabRows(n);up("exames_lab_prontuario",n);};
  const addLab=()=>{const n=[...labRows,{data:new Date().toLocaleDateString("pt-BR"),neutro:"",plt:"",hgb:"",creat:"",tgo:"",tgp:"",obs:""}];setLabRows(n);up("exames_lab_prontuario",n);};
  const [anatom,setAnatom]=useState(pac?.anatom||"");
  const [imagen,setImagen]=useState(pac?.imagen||"");
  const corVal=(k,v)=>{const n=+v;if(!v||isNaN(n))return N;const lim={neutro:[1500,500],plt:[100000,50000],hgb:[10,8]};if(lim[k])return n<lim[k][1]?VM:n<lim[k][0]?AM:VE;return N;};
  return <div style={{...sc_.card({background:"#F8FAFC",border:`1px solid ${T}44`}),marginBottom:8}}>
    <div style={{display:"flex",gap:0,background:N,borderRadius:9,overflow:"hidden",marginBottom:10}}>
      {[["lab","🧪 Lab"],["anatom","🔬 Anatom"],["imagem","🖼️ Imagem"]].map(([id,l])=><button key={id} onClick={()=>setAba(id)} style={{border:"none",cursor:"pointer",padding:"6px 8px",fontSize:10,fontWeight:800,flex:1,fontFamily:"inherit",background:aba===id?G:N,color:aba===id?"#fff":"rgba(255,255,255,.45)"}}>{l}</button>)}
    </div>
    {aba==="lab"&&<div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead><tr style={{background:N}}>{["Data","Neutro","PLT","Hgb","Creat","TGO","TGP","Obs",""].map(h=><th key={h} style={{color:G,padding:"4px 6px",textAlign:"left",fontSize:9,fontWeight:900,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{labRows.map((r,i)=><tr key={i} style={{borderBottom:"1px solid #E2E8F0"}}>
            {["data","neutro","plt","hgb","creat","tgo","tgp","obs"].map(k=><td key={k} style={{padding:"3px 4px"}}>
              <input value={r[k]||""} onChange={e=>upLab(i,k,e.target.value)} placeholder={k==="data"?new Date().toLocaleDateString("pt-BR"):"—"} style={{...sc_.inp,fontSize:10,padding:"3px 6px",width:k==="obs"?80:k==="data"?70:50,color:["neutro","plt","hgb"].includes(k)?corVal(k,r[k]):"#1E293B",fontWeight:["neutro","plt","hgb"].includes(k)&&r[k]?900:400}}/>
            </td>)}
            <td style={{padding:"3px 4px"}}><button onClick={()=>{const n=labRows.filter((_,j)=>j!==i);setLabRows(n);up("exames_lab_prontuario",n);}} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:12}}>✕</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div style={{display:"flex",gap:7,marginTop:7}}>
        <button onClick={addLab} style={{...sc_.btn("ghost",{fontSize:10,padding:"4px 10px"})}}>+ Linha</button>
        <div style={{fontSize:9,color:"#64748B",alignSelf:"center"}}><span style={{color:VM,fontWeight:700}}>■ Crítico</span>  <span style={{color:AM}}>■ Atenção</span>  <span style={{color:VE}}>■ Normal</span></div>
      </div>
    </div>}
    {aba==="anatom"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px",marginBottom:8}}>
        {[["Tipo histológico","histotipo"],["Grau","grau"],["Ki-67 (%)","ki67"],["Margens","margens"],["IHQ — ER/PR/HER2","ihq"],["Status linfonodal","linfonodos"]].map(([l,k])=><Fld key={k} l={l} val={pac?.[k]||""} set={v=>up(k,v)}/>)}
      </div>
      <Fld l="Laudo completo (resumo)" val={anatom} set={v=>{setAnatom(v);up("anatom",v);}} ta rows={3} ph="Ex: Adenocarcinoma ductal invasivo G2. Ki-67 35%. ER+ PR+ HER2−. Margens livres."/>
    </div>}
    {aba==="imagem"&&<div>
      <Fld l="Síntese dos exames de imagem (foco oncológico)" val={imagen} set={v=>{setImagen(v);up("imagen",v);}} ta rows={4} ph="TC 10/05/2026: massa hepática D 3,2cm (seg VI), adenopatia retroperitoneal 1,8cm. Resposta parcial (−30%)."/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 8px"}}>
        {[["Último exame de imagem","ultimo_exame_img"],["Data","data_img"],["Resposta","resp_img"]].map(([l,k])=><Fld key={k} l={l} val={pac?.[k]||""} set={v=>up(k,v)} ph={k==="resp_img"?"RC/RP/DE/DP":""}/>)}
      </div>
    </div>}
  </div>;
}
