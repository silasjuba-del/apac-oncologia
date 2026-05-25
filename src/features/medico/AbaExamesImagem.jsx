// ─────────────────────────────────────────────────────────────────────────────
// AbaExamesImagem.jsx — Exames de imagem com resumo IA oncológico
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, T, VE, TIPOS_IMAGEM } from "../../utils/constants";
import { sc_, sc, H2, Fld, Btn, TODAY } from "../../components/ui/primitives";
import { chamarClaude } from "../../utils/api";

async function IA_resumirExame(textoOuDescricao,tipoExame,pac){
  const prompt=`Você é um oncologista assistente. Analise este ${tipoExame} e forneça um resumo EXCLUSIVAMENTE com foco oncológico para o prontuário. Destaque: localização/tamanho tumoral, invasão local, linfonodos, metástases, resposta ao tratamento (se aplicável). Mencione achados não-oncológicos APENAS em 1 linha separada. Seja conciso e objetivo.\n\nPACIENTE: ${pac?.nome||"—"} | DIAGNÓSTICO: ${pac?.diag||"—"}\nCONTEÚDO DO EXAME: ${textoOuDescricao}`;
  return await chamarClaude(prompt,600);
}
export default function AbaExamesImagem({pac,up}){
  const [exames,setExames]=useState(pac?.exames_imagem||[]);
  const [modo,setModo]=useState("lista");
  const [form,setForm]=useState({data:TODAY(),tipo:"",local:"",descricao:"",resumo_ia:""});
  const [loadingIA,setLoadingIA]=useState(false);
  const upF=(k,v)=>setForm(x=>({...x,[k]:v}));
  const gerarResumoIA=async()=>{
    if(!form.descricao)return;setLoadingIA(true);
    const r=await IA_resumirExame(form.descricao,form.tipo||"exame de imagem",pac);
    upF("resumo_ia",r);setLoadingIA(false);
  };
  const salvar=()=>{
    const novo={...form,id:Date.now()};const novos=[novo,...exames];
    setExames(novos);up("exames_imagem",novos);
    setForm({data:TODAY(),tipo:"",local:"",descricao:"",resumo_ia:""});setModo("lista");
  };
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <H2 ch="🖼️ Exames de Imagem" s={{margin:0,fontSize:15}}/>
      <Btn v="teal" ch={modo==="lista"?"+ Novo Exame":"✕ Cancelar"} s={{fontSize:11}} onClick={()=>setModo(modo==="lista"?"novo":"lista")}/>
    </div>
    {modo==="novo"&&<div style={{...sc.card({background:"#EFF9FF",border:"1px solid "+T+"44"}),marginBottom:14}}>
      <H2 ch="Inserir Exame de Imagem" s={{fontSize:13}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
        <Fld l="Data do Exame" val={form.data} set={v=>upF("data",v)}/>
        <div style={{marginBottom:8}}>
          <label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Tipo de Exame</label>
          <select value={form.tipo} onChange={e=>upF("tipo",e.target.value)} style={{...sc.inp,fontSize:12}}>
            <option value="">Selecionar...</option>{TIPOS_IMAGEM.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <Fld l="Local / Topografia avaliada" val={form.local} set={v=>upF("local",v)} ph="Ex: Abdome total com pelve · Tórax · Crânio + coluna..."/>
      <Fld l="Texto completo do laudo (cole aqui para análise IA)" val={form.descricao} set={v=>upF("descricao",v)} ta rows={5} ph="Cole o texto do laudo aqui..."/>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <Btn v="navy" ch={loadingIA?"⏳ Analisando...":"🤖 Resumir com IA (foco oncológico)"} s={{flex:1,fontSize:11}} dis={!form.descricao||loadingIA} onClick={gerarResumoIA}/>
      </div>
      {form.resumo_ia&&<div style={{background:"#EAF7EE",border:"1px solid "+VE+"44",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
        <div style={{color:VE,fontWeight:800,fontSize:11,marginBottom:5}}>🤖 Resumo IA — Foco Oncológico:</div>
        <textarea value={form.resumo_ia} onChange={e=>upF("resumo_ia",e.target.value)} rows={4} style={{...sc.inp,resize:"vertical",fontSize:11,fontFamily:"Georgia,serif",lineHeight:1.6}}/>
      </div>}
      <Btn v="gold" ch="💾 Salvar Exame" s={{width:"100%"}} dis={!form.tipo} onClick={salvar}/>
    </div>}
    {exames.length===0?(
      <div style={{textAlign:"center",padding:24,color:"#94A3B8"}}><div style={{fontSize:28,marginBottom:6}}>🖼️</div><p style={{fontSize:12}}>Nenhum exame de imagem inserido.</p></div>
    ):(
      <div style={{display:"grid",gap:10}}>
        {exames.map((ex,i)=>(
          <div key={ex.id} style={sc.card({border:"1px solid "+T+"33"})}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <strong style={{color:N,fontSize:13}}>{ex.tipo}</strong>
                {ex.local&&<span style={{color:"#64748B",fontSize:11}}> · {ex.local}</span>}
                <div style={{color:"#94A3B8",fontSize:10,marginTop:2}}>📅 {ex.data}</div>
              </div>
              <button onClick={()=>{const novos=exames.filter((_,j)=>j!==i);setExames(novos);up("exames_imagem",novos);}} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:14}}>✕</button>
            </div>
            {ex.resumo_ia?(
              <div style={{background:"#EAF7EE",borderRadius:8,padding:"8px 10px"}}>
                <div style={{color:VE,fontSize:9,fontWeight:900,textTransform:"uppercase",marginBottom:3}}>🤖 Resumo IA</div>
                <p style={{fontSize:11,color:"#374151",lineHeight:1.6,margin:0}}>{ex.resumo_ia}</p>
              </div>
            ):ex.descricao?(
              <p style={{fontSize:11,color:"#64748B",lineHeight:1.5,margin:0}}>{ex.descricao.slice(0,200)}...</p>
            ):null}
          </div>
        ))}
      </div>
    )}
  </div>);
}
