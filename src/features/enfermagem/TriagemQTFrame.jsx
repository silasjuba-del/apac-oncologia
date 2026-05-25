// ─────────────────────────────────────────────────────────────────────────────
// TriagemQTFrame.jsx — Wrapper do iframe triagem-qt-v17.html
// Extraído de App.jsx — importa triagem-utils + primitives + constants
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef } from "react";
import { N, T, VE } from "../../utils/constants";
import { sc_, Btn, TODAY } from "../../components/ui/primitives";
import { condutasDeResumoTriagem, textoPrescricaoTriagem, refsCondutas } from "./triagem-utils";

export default function TriagemQTv17Frame({pac,addMsg,onEnviar}){
  const iframeRef=useRef(null);
  const [status,setStatus]=useState("");
  const getDoc=()=>{try{return iframeRef.current?.contentWindow?.document||null;}catch(e){return null;}};
  const syncPaciente=()=>{
    const d=getDoc(); const w=iframeRef.current?.contentWindow; if(!d||!w)return;
    const set=(id,val)=>{const el=d.getElementById(id); if(el&&val!==undefined&&val!==null&&String(val).trim()){el.value=String(val); el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true}));}};
    set("nome",pac?.nome||""); set("idade",pac?.idade||""); set("ciclo",pac?.ciclo||"");
    const proto=(pac?.trat||pac?.protocolo||pac?.proto||"").trim();
    if(proto){
      const row=d.getElementById("protoInputRow"); if(row)row.style.display="flex";
      set("protoCustom",proto);
      try{w.protoVal=proto; w.protoIsPoly=/\+|FOLFOX|FOLFIRI|FLOT|XELOX|DCF|AC|Carbo|Cisplatina/i.test(proto); w.buildResumo&&w.buildResumo(); w.autoConduta&&w.autoConduta();}catch(e){}
    }
    setStatus("Paciente carregado na triagem v17.");
  };
  const readResumo=()=>{
    const d=getDoc(); const w=iframeRef.current?.contentWindow; if(!d)return "";
    try{w?.buildResumo&&w.buildResumo();}catch(e){}
    return (d.getElementById("resBody")?.textContent||"").trim();
  };
  const readAlarmesSelecionados=()=>{
    const w=iframeRef.current?.contentWindow;
    try{
      const sel=w?.getSelectedAlarmes?.()||[];
      return sel.map(a=>a?.k).filter(Boolean);
    }catch(e){return [];}
  };
  const enviarResumo=()=>{
    const resumo=readResumo();
    if(!resumo||/Preencha as/i.test(resumo)){alert("Preencha a triagem e gere o resumo antes de enviar ao medico.");return;}
    const alarmeIds=readAlarmesSelecionados();
    const condutas=condutasDeResumoTriagem(resumo,alarmeIds);
    const nome=(resumo.match(/Nome\s*:\s*([^\n]+)/)||[])[1]?.trim()||pac?.nome||"Paciente";
    const ciclo=(resumo.match(/Ciclo\s*:\s*([^\n]+)/)||[])[1]?.trim()||"-";
    const conclusao=resumo.includes("ADIAR")?"ADIAR QUIMIOTERAPIA":resumo.includes("REFER")?"REFERIR AO MEDICO":resumo.includes("APTO")?"APTO PARA QT":"TRIAGEM RECEBIDA";
    const item={id:Date.now(),nome,ciclo,conclusao,data:TODAY(),hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),resumo,origem:"Triagem QT v17",alarmes:alarmeIds,condutas,prescricaoModelo:textoPrescricaoTriagem(condutas),referencias:refsCondutas(condutas),alertas:condutas.length?condutas.map(c=>c.titulo):(conclusao.includes("ADIAR")||conclusao.includes("REFER")?[conclusao]:[])};
    onEnviar&&onEnviar(item);
    addMsg&&addMsg("Enfermagem","Médico",`Triagem QT v17 enviada: ${nome} - ${conclusao}${condutas.length?` - ${condutas.length} conduta(s) vinculada(s)`:""}`,"triagem");
    setStatus(`Resumo enviado ao médico: ${nome} - ${conclusao}${condutas.length?` · ${condutas.length} conduta(s)`:""}`);
  };
  return <div style={{display:"grid",gap:10}}>
    <div style={sc_.card({display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:10,border:`2px solid ${T}33`})}>
      <div><strong style={{color:N,fontSize:13}}>Triagem QT v17 - Enfermagem</strong><div style={{fontSize:11,color:"#64748B"}}>Mesmo formato do app original. Ao enviar, os alarmes geram conduta e prescrição-modelo para validação médica.</div></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}><Btn v="ghost" ch="Carregar paciente" s={{fontSize:11}} onClick={syncPaciente}/><Btn v="gold" ch="Enviar resumo ao medico" s={{fontSize:11}} onClick={enviarResumo}/></div>
    </div>
    {status&&<div style={{fontSize:11,color:VE,fontWeight:800,background:"#EAF7EE",border:`1px solid ${VE}44`,borderRadius:9,padding:"7px 10px"}}>{status}</div>}
    <iframe ref={iframeRef} src="/triagem-qt-v17.html" title="Triagem QT v17" onLoad={syncPaciente} style={{width:"100%",height:"calc(100vh - 230px)",minHeight:760,border:"none",borderRadius:16,background:"#F1F5F9",boxShadow:"0 2px 12px rgba(15,23,42,.08)"}} allow="clipboard-read; clipboard-write; camera; microphone"/>
  </div>;
}
