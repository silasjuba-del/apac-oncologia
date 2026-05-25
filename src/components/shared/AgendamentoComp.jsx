// ─────────────────────────────────────────────────────────────────────────────
// AgendamentoComp.jsx — Componente compartilhado de agendamento
// Extraído de App.jsx — usado em RecepcaoPage e MedicoView
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, T, VE, VM } from "../../utils/constants";
import { sc_, H2, H3, Fld, Btn } from "../../components/ui/primitives";

export default function AgendamentoComp({agendamentos,addAgendamento,ismedico}){
  const [form,setForm]=useState({pac:"",data:"",hora:"",tipo:"Consulta oncológica"});
  const [busca,setBusca]=useState("");
  const hoje=new Date().toLocaleDateString("pt-BR");
  const TIPOS=["Consulta oncológica","QT — mFOLFOX6","QT — AC","QT — FOLFIRI","QT — CarboTaxol","Retorno","Exames laboratoriais","TC/PET avaliação","Outro"];
  const STATUS_COR={agendado:{c:T},confirmado:{c:VE},cancelado:{c:VM},realizado:{c:"#64748B"}};
  const agFiltrados=(agendamentos||[]).filter(a=>!busca||a.pac?.toLowerCase().includes(busca.toLowerCase())||a.data?.includes(busca));
  const agHoje=agFiltrados.filter(a=>a.data===hoje);
  const agFuturos=agFiltrados.filter(a=>a.data!==hoje);
  return <div style={{display:"grid",gap:12}}>
    {!ismedico&&<div style={sc_.card()}>
      <H2 ch="➕ Novo Agendamento"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
        <Fld l="Nome do paciente" val={form.pac} set={v=>setForm(x=>({...x,pac:v}))}/>
        <Fld l="Data (DD/MM/AAAA)" val={form.data} set={v=>setForm(x=>({...x,data:v}))}/>
        <Fld l="Hora (HH:MM)" val={form.hora} set={v=>setForm(x=>({...x,hora:v}))}/>
        <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Tipo</label><select value={form.tipo} onChange={e=>setForm(x=>({...x,tipo:e.target.value}))} style={{...sc_.inp,fontSize:12}}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
      </div>
      <Btn v="gold" ch="📅 Confirmar" s={{width:"100%",marginTop:9,fontSize:13,padding:10}} dis={!form.pac||!form.data} onClick={()=>{addAgendamento({...form,status:"agendado"});setForm({pac:"",data:"",hora:"",tipo:"Consulta oncológica"});}}/>
    </div>}
    <div style={sc_.card()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><H2 ch="🗓 Agenda" s={{margin:0}}/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." style={{...sc_.inp,width:160,fontSize:11}}/></div>
      {agHoje.length>0&&<><H3 ch={`📌 Hoje — ${hoje}`} s={{color:T}}/>{agHoje.map((a,i)=>{const st=STATUS_COR[a.status]||STATUS_COR.agendado;return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${st.c}44`,borderRadius:10,padding:"8px 11px",marginBottom:6,background:st.c+"11"}}><div><strong style={{color:N,fontSize:12}}>{a.pac}</strong><div style={{color:"#64748B",fontSize:10}}>{a.hora} · {a.tipo}</div></div><span style={{background:st.c,color:"#fff",padding:"2px 8px",borderRadius:999,fontSize:9,fontWeight:900}}>{a.status}</span></div>;})}
      </>}
      {agFuturos.slice(0,8).map((a,i)=>{const st=STATUS_COR[a.status]||STATUS_COR.agendado;return <div key={i} style={{display:"flex",gap:9,alignItems:"center",border:"1px solid #CBD5E1",borderRadius:10,padding:"7px 11px",marginBottom:5,background:"#F8FAFC"}}>
        <div style={{minWidth:40,textAlign:"center"}}><div style={{color:N,fontSize:11,fontWeight:900}}>{a.data?.split("/")[0]}</div><div style={{color:"#94A3B8",fontSize:9}}>{a.data?.split("/").slice(1).join("/")}</div></div>
        <div style={{flex:1}}><strong style={{color:N,fontSize:12}}>{a.pac}</strong><div style={{color:"#64748B",fontSize:10}}>{a.hora} · {a.tipo}</div></div>
        <span style={{background:st.c,color:"#fff",padding:"2px 7px",borderRadius:999,fontSize:9,fontWeight:900}}>{a.status}</span>
      </div>;})}
      {agFiltrados.length===0&&<p style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:16}}>Sem agendamentos.</p>}
    </div>
  </div>;
}
