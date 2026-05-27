// ─────────────────────────────────────────────────────────────────────────────
// PrescricaoQT.jsx — Prescrição de quimioterapia inteligente
// Inclui: PrescricaoQT, DetalheProtocolo, MudancaProtocolo, HistoricoCiclos
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from "react";
import { N, T, G, VE, AM, VM, BG, PROTOS, PROTOCOLOS_DB, detectarTumor, calcSC } from "../../utils/constants";
import { sc_, sc, Btn, H2, H3, Fld, PrintModal, abrirDoc } from "../../components/ui/primitives";
import { agentCallText, AGENT_INTENTS } from "../../utils/agentGateway";

async function IA_sugerirProtocolo(diag,estadio,bio,ecog,pac){
  const prompt=`Oncologista clínico: liste os 3 protocolos de quimioterapia mais adequados para este paciente, com justificativa breve. Responda em JSON puro sem markdown:\n{"sugestoes":[{"protocolo":"nome","justificativa":"1 frase","linha":"1ª/2ª linha","evidencia":"estudo nome","prioridade":1},...]}.\n\nDiagnóstico: ${diag} | Estádio: ${estadio} | Bio: ${bio} | ECOG: ${ecog}`;
  try{const txt=await agentCallText({prompt,maxTokens:500,intent:AGENT_INTENTS.SUGERIR_PROTOCOLO,pac});const clean=txt.replace(/```json|```/g,"").trim();return JSON.parse(clean);}
  catch{return{sugestoes:[]};}
}

// ── PRESCRIÇÃO QT INTELIGENTE ─────────────────────────────────────────────────
export default function PrescricaoQT({pac,up,addMsg,ciclosHistorico,setCiclosHistorico,onSalvoCiclos}){
  const [tela,setTela]=useState("busca");
  const [protoSel,setProtoSel]=useState(null);
  const [busca,setBusca]=useState("");
  const [sugestoesIA,setSugestoesIA]=useState(null);
  const [loadingIA,setLoadingIA]=useState(false);
  const [tumorDetectado,setTumorDetectado]=useState(null);
  useEffect(()=>{if(pac?.diag){const t=detectarTumor(pac.diag);setTumorDetectado(t);}},[pac?.diag]);
  const buscarSugestoesIA=async()=>{setLoadingIA(true);const r=await IA_sugerirProtocolo(pac?.diag,pac?.estadio,pac?.bio,pac?.ecog,pac);setSugestoesIA(r.sugestoes||[]);setLoadingIA(false);};
  const todosProtos=Object.values(PROTOCOLOS_DB).flatMap(t=>t.grupos.flatMap(g=>g.protos.map(p=>({...p,tumor:t.label}))));
  const protosFiltrados=busca.length>1?todosProtos.filter(p=>p.nome.toLowerCase().includes(busca.toLowerCase())||p.tumor.toLowerCase().includes(busca.toLowerCase())):[];
  if(tela==="detalhe"&&protoSel)return <DetalheProtocolo proto={protoSel} pac={pac} up={up} addMsg={addMsg} historico={ciclosHistorico} setHistorico={setCiclosHistorico} onSalvoCiclos={onSalvoCiclos} onVoltar={()=>setTela("busca")} onSalvo={()=>setTela("historico")}/>;
  if(tela==="historico")return <HistoricoCiclos historico={ciclosHistorico} setHistorico={setCiclosHistorico} pac={pac} onVoltar={()=>setTela("busca")}/>;
  return(<div style={{display:"grid",gap:12}}>
    <div style={{background:`linear-gradient(135deg,${N},#0d2347)`,borderRadius:13,padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{color:G,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Oncologia Integrada</div>
        <h2 style={{color:"#fff",margin:0,fontSize:15,fontWeight:900}}>💉 Prescrição de Quimioterapia</h2>
        {pac?.diag&&<div style={{color:"rgba(255,255,255,.5)",fontSize:11,marginTop:2}}>{pac.diag}</div>}
      </div>
      <Btn v="ghost" ch={`📋 Histórico (${(ciclosHistorico||[]).length})`} s={{fontSize:11}} onClick={()=>setTela("historico")}/>
    </div>
    {tumorDetectado&&<div style={sc.card({border:"1px solid "+G+"44",background:"#FFFBEB"})}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:22}}>{tumorDetectado.emoji}</span>
          <div>
            <strong style={{color:N,fontSize:13}}>{tumorDetectado.label}</strong>
            <div style={{color:"#64748B",fontSize:10}}>Protocolos específicos detectados pelo diagnóstico</div>
          </div>
        </div>
        <Btn v="navy" ch={loadingIA?"⏳":"🤖 Sugestão IA"} s={{fontSize:11}} dis={loadingIA} onClick={buscarSugestoesIA}/>
      </div>
      {sugestoesIA&&sugestoesIA.length>0&&<div style={{background:"#F0FDF4",border:"1px solid "+VE+"44",borderRadius:10,padding:10,marginBottom:10}}>
        <div style={{color:VE,fontWeight:800,fontSize:11,marginBottom:6}}>🤖 Sugerido pelo Claude para este paciente:</div>
        {sugestoesIA.map((s,i)=>(
          <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"5px 0",borderBottom:i<sugestoesIA.length-1?"1px solid #E2E8F0":"none"}}>
            <span style={{background:[G,T,N][i]||N,color:"#fff",borderRadius:999,padding:"1px 7px",fontSize:9,fontWeight:900,flexShrink:0}}>#{i+1}</span>
            <div style={{flex:1}}>
              <strong style={{color:N,fontSize:12}}>{s.protocolo}</strong>
              <span style={{color:"#64748B",fontSize:10,marginLeft:6}}>{s.linha}</span>
              <div style={{color:"#64748B",fontSize:10,marginTop:1}}>{s.justificativa}</div>
              {s.evidencia&&<div style={{color:T,fontSize:9,marginTop:1}}>📚 {s.evidencia}</div>}
            </div>
            <Btn v="teal" ch="Selecionar" s={{fontSize:10,padding:"4px 8px"}} onClick={()=>{const p=todosProtos.find(tp=>tp.nome===s.protocolo||tp.id===s.protocolo)||todosProtos.find(tp=>tp.nome.toLowerCase().includes(s.protocolo.toLowerCase()));if(p){setProtoSel(p);setTela("detalhe");}}}/>
          </div>
        ))}
      </div>}
      {tumorDetectado.grupos.map(grupo=>(
        <div key={grupo.nome} style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:900,color:N,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6,paddingBottom:4,borderBottom:"1px solid #E2E8F0"}}>{grupo.nome}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {grupo.protos.map(p=>(
              <button key={p.id} onClick={()=>{setProtoSel(p);setTela("detalhe");}} style={{background:p.cor+"15",border:`2px solid ${p.cor}44`,borderRadius:10,padding:"7px 14px",cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                <div style={{fontWeight:900,color:p.cor,fontSize:12}}>{p.nome}</div>
                <div style={{color:"#64748B",fontSize:9,marginTop:1}}>{p.ciclo} · {p.drugs.length} fármaco{p.drugs.length>1?"s":""}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>}
    <div style={sc.card()}>
      <strong style={{color:N,fontSize:12,display:"block",marginBottom:8}}>🔍 Busca livre por protocolo</strong>
      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Digite o nome do protocolo (ex: FOLFOX, Paclitaxel, TCHP...)" style={{...sc.inp,fontSize:13,marginBottom:8}}/>
      {busca.length>1&&protosFiltrados.length===0&&<p style={{color:"#94A3B8",fontSize:12}}>Nenhum protocolo encontrado para "{busca}".</p>}
      {protosFiltrados.map(p=>(
        <div key={p.id} onClick={()=>{setProtoSel(p);setTela("detalhe");setBusca("");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderRadius:10,border:"1px solid #CBD5E1",marginBottom:5,cursor:"pointer",background:"#F8FAFC"}}>
          <div><strong style={{color:N,fontSize:12}}>{p.nome}</strong><span style={{color:"#64748B",fontSize:10,marginLeft:8}}>{p.tumor} · {p.ciclo}</span></div>
          <span style={{color:T,fontSize:11}}>→</span>
        </div>
      ))}
    </div>
  </div>);
}

function DetalheProtocolo({proto,pac,up,addMsg,historico,setHistorico,onSalvoCiclos,onVoltar,onSalvo}){
  const [reducao,setReducao]=useState(0);
  const [periodo,setPeriodo]=useState(proto.ciclo||"q21d");
  const [periodoCustom,setPeriodoCustom]=useState("");
  const [drugs,setDrugs]=useState(proto.drugs.map(d=>({...d,ativo:true})));
  const [numCiclos,setNumCiclos]=useState(6);
  const [dataInicio,setDataInicio]=useState(TODAY());
  const [obs,setObs]=useState("");
  const [abaSel,setAbaSel]=useState("doses");
  const [novoDrug,setNovoDrug]=useState({n:"",d:"",u:"mg/m²"});
  const [showAddDrug,setShowAddDrug]=useState(false);
  const scPac=pac?.peso&&pac?.altura?(0.016667*Math.pow(Number(pac.peso),0.5)*Math.pow(Number(pac.altura),0.5)).toFixed(2):"1.73";
  const calcDose=(dose,scv=1.73)=>{const base=Number(dose)||0;return(base*(1-reducao/100)*scv).toFixed(0);};
  const calcProximas=()=>{
    const datas=[];const d=new Date(dataInicio.split("/").reverse().join("-"));
    if(isNaN(d.getTime()))return[];
    const intervalos={q21d:21,q14d:14,semanal:7,d1d8q21:21,d1d8d15q28:28,diario:1};
    const dias=intervalos[periodo]||21;
    for(let i=0;i<numCiclos;i++){const data=new Date(d.getTime()+i*dias*86400000);datas.push({ciclo:`C${i+1}D1`,data:data.toLocaleDateString("pt-BR")});}
    return datas;
  };
  const liberarCiclos=()=>{
    const proximas=calcProximas();
    const ciclosNovos=proximas.map(p=>({id:Date.now()+Math.random(),ciclo:p.ciclo,data:p.data,protocolo:proto.nome,status:"agendado",pacID:pac?.pacID||"",pacNome:pac?.nome||"",drugs:drugs.filter(d=>d.ativo).map(d=>({...d,doseCalc:d.u==="mg/m²"?calcDose(d.d,scPac):d.d})),reducao,periodo,obs}));
    const novos=[...(historico||[]),...ciclosNovos];
    setHistorico(novos);up&&up("ciclos_qt",novos);
    // Salva prescrição no dossiê oncológico
    onSalvoCiclos&&onSalvoCiclos(proto,ciclosNovos);
    addMsg&&addMsg("Médico","Farmácia",`QT liberada: ${proto.nome} · ${numCiclos} ciclos · início ${dataInicio} · SC ${scPac} m²`,"ciclo");
    alert(`✅ ${numCiclos} ciclos de ${proto.nome} liberados!\nFarmácia e Enfermagem notificadas.`);
    onSalvo&&onSalvo();
  };
  const excluirProtocolo=()=>{
    if(!window.confirm(`⚠️ Excluir protocolo ${proto.nome}?\n\nTODOS os ciclos futuros serão removidos!`))return;
    const novos=(historico||[]).filter(c=>c.status!=="agendado"||c.protocolo!==proto.nome);
    setHistorico(novos);up&&up("ciclos_qt",novos);
    addMsg&&addMsg("Médico","Farmácia",`⚠️ Protocolo ${proto.nome} excluído. Ciclos futuros cancelados.`,"alerta");
    onVoltar();
  };
  return(<div>
    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
      <button onClick={onVoltar} style={{background:"#F1F5F9",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,display:"grid",placeItems:"center"}}>←</button>
      <div style={{flex:1}}>
        <h2 style={{color:N,fontSize:16,fontWeight:900,margin:0}}>{proto.nome}</h2>
        <span style={{background:proto.cor+"22",color:proto.cor,padding:"1px 8px",borderRadius:999,fontSize:10,fontWeight:900}}>{proto.ciclo}</span>
        {pac?.nome&&<span style={{color:"#64748B",fontSize:11,marginLeft:8}}>· {pac.nome}</span>}
      </div>
      <button onClick={excluirProtocolo} style={{background:"#FFF5F5",border:"1px solid "+VM+"44",color:VM,borderRadius:9,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>🗑 Excluir</button>
    </div>
    <div style={{display:"flex",gap:0,background:N,borderRadius:11,overflow:"hidden",marginBottom:14}}>
      {[["doses","💊 Doses"],["periodo","📅 Período"],["ciclos","🔄 Ciclos"],["mudanca","✏️ Alterações"]].map(([id,l])=>(
        <button key={id} onClick={()=>setAbaSel(id)} style={{border:"none",cursor:"pointer",padding:"9px",fontSize:11,fontWeight:800,flex:1,fontFamily:"inherit",background:abaSel===id?G:N,color:abaSel===id?"#fff":"rgba(255,255,255,.5)"}}>
          {l}
        </button>
      ))}
    </div>
    {abaSel==="doses"&&<div style={sc.card()}>
      <div style={{marginBottom:14}}>
        <strong style={{color:N,fontSize:12,display:"block",marginBottom:8}}>Redução de Dose</strong>
        <div style={{display:"flex",gap:6}}>
          {REDUCOES.map(r=>(
            <button key={r.pct} onClick={()=>setReducao(r.pct)} style={{flex:1,border:`2px solid ${reducao===r.pct?r.cor:"#CBD5E1"}`,background:reducao===r.pct?r.cor+"15":"#F8FAFC",color:reducao===r.pct?r.cor:"#64748B",borderRadius:9,padding:"8px 4px",cursor:"pointer",fontSize:10,fontWeight:800,fontFamily:"inherit"}}>
              {r.pct===0?"✅ Plena":`-${r.pct}%`}<div style={{fontSize:9,marginTop:2,opacity:0.7}}>{100-r.pct}%</div>
            </button>
          ))}
        </div>
      </div>
      {pac?.peso&&pac?.altura&&<div style={{background:"#EAF7EE",borderRadius:9,padding:"6px 10px",marginBottom:10,fontSize:11,color:VE,fontWeight:700}}>
        SC (Mosteller): {scPac} m² · Peso: {pac.peso}kg · Altura: {pac.altura}cm
      </div>}
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:10}}>
        <thead><tr style={{background:"#F8FAFC"}}>
          {["Fármaco","Dose padrão","Dia(s)","SC m²",`Dose calculada${reducao>0?` (−${reducao}%)`:""}","Via","Editar","Ativo`].map(h=>(
            <th key={h} style={{padding:"7px 8px",textAlign:"left",fontWeight:800,color:N,fontSize:10,borderBottom:"2px solid #E2E8F0"}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {drugs.map((d,i)=>{
            const doseCalcBase=d.u==="mg/m²"?calcDose(d.d,scPac):d.u==="AUC"?`${d.d} AUC`:`${d.d}`;
            const doseEdit=d.doseEdit!==undefined?d.doseEdit:doseCalcBase;
            return(<tr key={i} style={{borderBottom:"1px solid #F1F5F9",opacity:d.ativo?1:0.4}}>
              <td style={{padding:"7px 8px",fontWeight:700,color:d.ativo?N:"#94A3B8"}}>{d.n}</td>
              <td style={{padding:"7px 8px"}}>{d.d} {d.u}</td>
              <td style={{padding:"7px 8px"}}><span style={{background:T+"22",color:T,borderRadius:6,padding:"2px 7px",fontSize:10,fontWeight:900}}>{d.dia||proto.ciclo||"D1"}</span></td>
              <td style={{padding:"7px 8px",color:"#64748B"}}>{d.u==="mg/m²"?scPac:"—"}</td>
              <td style={{padding:"7px 8px",fontWeight:900,color:reducao>0?VM:VE}}>
                {d.editando?<input value={doseEdit} onChange={e=>setDrugs(x=>x.map((dd,j)=>j===i?{...dd,doseEdit:e.target.value}:dd))} style={{...sc.inp,width:80,padding:"3px 6px",fontSize:11}} onBlur={()=>setDrugs(x=>x.map((dd,j)=>j===i?{...dd,editando:false}:dd))} autoFocus/>
                  :<span>{d.doseEdit!==undefined?d.doseEdit+" mg":(d.u==="mg/m²"?`${doseCalcBase} mg`:d.u==="AUC"?`${d.d} AUC`:`${d.d} ${d.u}`)}{reducao>0&&<span style={{fontSize:9,color:VM,marginLeft:4}}>↓{reducao}%</span>}</span>}
              </td>
              <td style={{padding:"7px 8px",color:"#64748B",fontSize:11}}>{d.via||"IV"}</td>
              <td style={{padding:"7px 8px"}}>
                <button onClick={()=>setDrugs(x=>x.map((dd,j)=>j===i?{...dd,editando:!dd.editando,doseEdit:doseEdit}:dd))} style={{background:T+"22",border:"none",color:T,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"inherit"}}>✏️</button>
              </td>
              <td style={{padding:"7px 8px"}}>
                <button onClick={()=>setDrugs(x=>x.map((dd,j)=>j===i?{...dd,ativo:!dd.ativo}:dd))} style={{background:d.ativo?VE+"22":VM+"22",border:"none",color:d.ativo?VE:VM,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"inherit"}}>
                  {d.ativo?"✓":"✕"}
                </button>
              </td>
            </tr>);
          })}
        </tbody>
      </table>
      <button onClick={()=>setShowAddDrug(!showAddDrug)} style={{background:"none",border:`1px dashed ${T}`,color:T,borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit",marginBottom:showAddDrug?8:0}}>
        + Adicionar medicação
      </button>
      {showAddDrug&&<div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:6,marginBottom:8}}>
        <input placeholder="Nome do fármaco" value={novoDrug.n} onChange={e=>setNovoDrug(x=>({...x,n:e.target.value}))} style={{...sc.inp,fontSize:11}}/>
        <input placeholder="Dose" value={novoDrug.d} onChange={e=>setNovoDrug(x=>({...x,d:e.target.value}))} style={{...sc.inp,fontSize:11}}/>
        <select value={novoDrug.u} onChange={e=>setNovoDrug(x=>({...x,u:e.target.value}))} style={{...sc.inp,fontSize:11}}>
          {["mg/m²","mg/kg","mg fixo","AUC","mg VO","mcg"].map(u=><option key={u}>{u}</option>)}
        </select>
        <Btn v="teal" ch="+" s={{padding:"6px 12px"}} dis={!novoDrug.n||!novoDrug.d} onClick={()=>{setDrugs(x=>[...x,{...novoDrug,ativo:true}]);setNovoDrug({n:"",d:"",u:"mg/m²"});setShowAddDrug(false);}}/>
      </div>}
    </div>}
    {abaSel==="periodo"&&<div style={sc.card()}>
      <strong style={{color:N,fontSize:12,display:"block",marginBottom:10}}>Selecione o Intervalo entre Ciclos</strong>
      {PERIODOS.map(p=>(
        <label key={p.id} style={{display:"flex",gap:10,alignItems:"center",border:`1.5px solid ${periodo===p.id?T:"#CBD5E1"}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",background:periodo===p.id?"#EFF9FF":"#F8FAFC",marginBottom:6}}>
          <input type="radio" checked={periodo===p.id} onChange={()=>setPeriodo(p.id)} style={{accentColor:T,width:15,height:15}}/>
          <span style={{fontSize:12,fontWeight:periodo===p.id?700:400,color:periodo===p.id?N:"#374151"}}>{p.label}</span>
        </label>
      ))}
      {periodo==="custom"&&<Fld l="Especificar período" val={periodoCustom} set={setPeriodoCustom} ph="Ex: D1, D4, D8 a cada 21 dias..."/>}
    </div>}
    {abaSel==="ciclos"&&<div style={sc.card()}>
      <strong style={{color:N,fontSize:12,display:"block",marginBottom:12}}>Liberar Ciclos de Quimioterapia</strong>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px",marginBottom:12}}>
        <Fld l="Data do 1º Ciclo (D1C1)" val={dataInicio} set={setDataInicio}/>
        <div>
          <label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Número de Ciclos a Liberar</label>
          <div style={{display:"flex",gap:5}}>
            {[1,2,3,4,6,8,12].map(n=>(
              <button key={n} onClick={()=>setNumCiclos(n)} style={{flex:1,border:`2px solid ${numCiclos===n?N:"#CBD5E1"}`,background:numCiclos===n?N:"#F8FAFC",color:numCiclos===n?"#fff":N,borderRadius:8,padding:"7px 2px",cursor:"pointer",fontSize:11,fontWeight:900,fontFamily:"inherit"}}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:10,marginBottom:12}}>
        <strong style={{fontSize:11,color:N,display:"block",marginBottom:6}}>📅 Preview dos ciclos:</strong>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>
          {calcProximas().map((c,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:7,padding:"5px 7px",textAlign:"center"}}>
              <div style={{fontWeight:900,color:T,fontSize:10}}>{c.ciclo}</div>
              <div style={{color:"#64748B",fontSize:9}}>{c.data}</div>
            </div>
          ))}
        </div>
      </div>
      <Fld l="Observações / Justificativa" val={obs} set={setObs} ta rows={2} ph="Ex: ECOG 1, bom PS, iniciar protocolo padrão..."/>
      <Btn v="gold" ch={`✅ Liberar ${numCiclos} ciclo${numCiclos>1?"s":""} de ${proto.nome}`} s={{width:"100%",padding:12,fontSize:13,fontWeight:900}} onClick={liberarCiclos}/>
    </div>}
    {abaSel==="mudanca"&&<div style={sc.card()}>
      <H2 ch="✏️ Registrar Mudança de Protocolo" s={{fontSize:13}}/>
      <MudancaProtocolo proto={proto} historico={historico} setHistorico={setHistorico} up={up} addMsg={addMsg}/>
    </div>}
  </div>);
}

function MudancaProtocolo({proto,historico,setHistorico,up,addMsg}){
  const [form,setForm]=useState({tipo:"",motivo:"",data:TODAY(),cicloRef:"",obs:""});
  const upF=(k,v)=>setForm(x=>({...x,[k]:v}));
  const TIPOS=["Redução de dose","Troca de protocolo","Suspensão temporária","Suspensão definitiva","Adiamento de ciclo","Adição de medicação","Remoção de medicação","Outro"];
  const registrar=()=>{
    if(!form.tipo||!form.motivo)return alert("Preencha tipo e motivo.");
    const nova={...form,id:Date.now(),protocolo:proto.nome};
    const novos=[nova,...(historico||[]).map(c=>({...c,mudancas:[...(c.mudancas||[]),nova]}))];
    setHistorico(novos);up&&up("ciclos_qt",novos);
    addMsg&&addMsg("Médico","Farmácia",`⚠️ Mudança em ${proto.nome}: ${form.tipo}. Motivo: ${form.motivo}`,"alerta");
    setForm({tipo:"",motivo:"",data:TODAY(),cicloRef:"",obs:""});
    alert("✅ Mudança registrada no prontuário.");
  };
  return(<div>
    <div style={{marginBottom:8}}>
      <label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Tipo de Mudança *</label>
      <select value={form.tipo} onChange={e=>upF("tipo",e.target.value)} style={{...sc.inp,fontSize:12}}>
        <option value="">Selecionar...</option>{TIPOS.map(t=><option key={t}>{t}</option>)}
      </select>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
      <Fld l="Data" val={form.data} set={v=>upF("data",v)}/>
      <Fld l="Ciclo de referência" val={form.cicloRef} set={v=>upF("cicloRef",v)} ph="Ex: C3D1"/>
    </div>
    <Fld l="Motivo / Justificativa *" val={form.motivo} set={v=>upF("motivo",v)} ta rows={3} ph="Ex: Neuropatia G2 persistente, reduzindo Oxaliplatina 20%..."/>
    <Fld l="Observações adicionais" val={form.obs} set={v=>upF("obs",v)} ta rows={2}/>
    <Btn v="warn" ch="📝 Registrar Mudança" s={{...sc.btn("warn"),width:"100%",padding:11}} dis={!form.tipo||!form.motivo} onClick={registrar}/>
  </div>);
}

function HistoricoCiclos({historico,setHistorico,pac,onVoltar}){
  const todos=historico||[];
  const agendados=todos.filter(c=>c.status==="agendado");
  const realizados=todos.filter(c=>c.status==="realizado");
  const [aba,setAba]=useState("todos");
  const marcarRealizado=(id)=>{const novos=todos.map(c=>c.id===id?{...c,status:"realizado",dataReal:TODAY()}:c);setHistorico(novos);};
  const cancelar=(id)=>{if(!window.confirm("Cancelar este ciclo?"))return;setHistorico(todos.filter(c=>c.id!==id));};
  const lista=aba==="agendados"?agendados:aba==="realizados"?realizados:todos;
  return(<div>
    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
      <button onClick={onVoltar} style={{background:"#F1F5F9",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,display:"grid",placeItems:"center"}}>←</button>
      <h2 style={{color:N,fontSize:15,fontWeight:900,margin:0,flex:1}}>📋 Histórico de Ciclos QT</h2>
      <div style={{display:"flex",gap:6,fontSize:11}}>
        <span style={{background:VE+"22",color:VE,padding:"2px 8px",borderRadius:999,fontWeight:700}}>✅ {realizados.length}</span>
        <span style={{background:T+"22",color:T,padding:"2px 8px",borderRadius:999,fontWeight:700}}>📅 {agendados.length}</span>
      </div>
    </div>
    <div style={{display:"flex",gap:0,background:"#F1F5F9",borderRadius:10,overflow:"hidden",marginBottom:12}}>
      {[["todos","Todos"],["agendados","📅 Agendados"],["realizados","✅ Realizados"]].map(([id,l])=>(
        <button key={id} onClick={()=>setAba(id)} style={{flex:1,border:"none",cursor:"pointer",padding:"8px",fontSize:11,fontWeight:700,fontFamily:"inherit",background:aba===id?N:"transparent",color:aba===id?"#fff":"#64748B"}}>{l}</button>
      ))}
    </div>
    {lista.length===0?(
      <div style={{textAlign:"center",padding:24,color:"#94A3B8"}}><div style={{fontSize:28,marginBottom:6}}>💉</div><p style={{fontSize:12}}>Nenhum ciclo nesta categoria.</p></div>
    ):(
      <div style={{display:"grid",gap:8}}>
        {lista.map((c,i)=>(
          <div key={c.id||i} style={sc.card({border:`2px solid ${c.status==="realizado"?VE:T}33`})}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <strong style={{color:N,fontSize:13}}>{c.ciclo}</strong>
                  <span style={{background:(c.status==="realizado"?VE:T)+"22",color:c.status==="realizado"?VE:T,padding:"1px 7px",borderRadius:999,fontSize:9,fontWeight:900}}>
                    {c.status==="realizado"?"✅ Realizado":"📅 Agendado"}
                  </span>
                  {c.reducao>0&&<span style={{background:VM+"22",color:VM,padding:"1px 7px",borderRadius:999,fontSize:9,fontWeight:900}}>−{c.reducao}%</span>}
                </div>
                <div style={{color:"#64748B",fontSize:10,marginTop:2}}>📅 {c.data} · {c.protocolo}</div>
                {c.dataReal&&<div style={{color:VE,fontSize:9,marginTop:1}}>Realizado em: {c.dataReal}</div>}
              </div>
              <div style={{display:"flex",gap:5}}>
                {c.status==="agendado"&&<>
                  <button onClick={()=>marcarRealizado(c.id)} style={{background:VE+"22",color:VE,border:"none",borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit"}}>✅ Realizado</button>
                  <button onClick={()=>cancelar(c.id)} style={{background:VM+"11",color:VM,border:"none",borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit"}}>✕</button>
                </>}
              </div>
            </div>
            {c.drugs&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {c.drugs.filter(d=>d.ativo!==false).map((d,j)=>(
                <span key={j} style={{background:"#F1F5F9",color:N,padding:"2px 8px",borderRadius:999,fontSize:9,fontWeight:700}}>{d.n} {d.doseCalc||d.d} {d.u==="mg/m²"?"mg":d.u}</span>
              ))}
            </div>}
            {c.obs&&<div style={{color:"#64748B",fontSize:10,marginTop:5,fontStyle:"italic"}}>{c.obs}</div>}
          </div>
        ))}
      </div>
    )}
  </div>);
}

// ── TRIAGEM DE ENFERMAGEM ─────────────────────────────────────────────────────

