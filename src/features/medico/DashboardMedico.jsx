// ─────────────────────────────────────────────────────────────────────────────
// DashboardMedico.jsx — Dashboard principal do médico oncologista
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { N, T, G, VE, AM, VM } from "../../utils/constants";
import { sc_, sc, Btn } from "../../components/ui/primitives";

export default function DashboardMedico({pac,consultasDia,alertas,mensagens,setMedTab,caixaEntrada,agendamentos,onAbrirAtendimento}){
  const [trialOpen,setTrialOpen]=useState(null);
  const [slideIdx,setSlideIdx]=useState(0);
  const [paused,setPaused]=useState(false);
  const now=new Date();
  const hora=now.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  const data=now.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
  const saudacao=now.getHours()<12?"Bom dia":now.getHours()<18?"Boa tarde":"Boa noite";
  const frases=[
    "Cuidar é transformar dados em decisão clara.",
    "Menos ruído, mais visão clínica.",
    "A IA organiza; o médico valida.",
    "O essencial primeiro: paciente, risco, exames e conduta.",
  ];
  const fila=consultasDia||[];
  const prioStyle={alta:{label:"Alta",c:VM,bg:"#FFF0F0"},media:{label:"Média",c:G,bg:"#FFFBEB"},baixa:{label:"Baixa",c:VE,bg:"#ECFDF5"}};
  const metrics=[
    {ico:"🚨",v:alertas?.length||3,c:VM,l:"Alertas",action:"fila"},
    {ico:"📄",v:3,c:G,l:"APAC",action:"apac"},
    {ico:"📬",v:(mensagens||[]).filter(m=>!m.lida).length||2,c:AM,l:"Msgs",action:"ia_hub"},
    {ico:"🩺",v:fila.length,c:T,l:"Fila",action:"fila"},
  ];
  // Slides: só bom-dia e seções
  const slides=[
    {id:"home",bg:`linear-gradient(135deg,${N} 0%,#0B2545 60%,#163A6B 100%)`,accent:G},
    {id:"prontuario",bg:"linear-gradient(135deg,#0F3460 0%,#1A4A8A 100%)",accent:T,action:"prontuario",
      ico:"📋",title:"Prontuário Oncológico",sub:"Evolução médica · Dossiê IA · Documentos vinculados"},
    {id:"apac",bg:"linear-gradient(135deg,#052e16 0%,#166534 100%)",accent:VE,action:"apac",
      ico:"🛡️",title:"APAC / Anti-glosa",sub:"Checklist anti-glosa · Campos críticos · Faturamento SUS"},
    {id:"enfermagem",bg:"linear-gradient(135deg,#450a0a 0%,#991b1b 100%)",accent:"#FCA5A5",action:"enfermagem_triagem",
      ico:"🩺",title:"Enfermagem",sub:"Triagem · Sinais vitais · Salão de quimioterapia"},
    {id:"drive",bg:"linear-gradient(135deg,#172554 0%,#1d4ed8 100%)",accent:"#93C5FD",action:"drive_ia",
      ico:"☁️",title:"Drive → IA",sub:"Laudos e PDFs resumidos por Claude antes do prontuário"},
    {id:"exames",bg:"linear-gradient(135deg,#2e1065 0%,#6d28d9 100%)",accent:"#C4B5FD",action:"exames_med",
      ico:"🧪",title:"Exames",sub:"Requisição de laboratório e imagens · APAC de exames"},
  ];
  const curSlide=slides[slideIdx%slides.length];
  useEffect(()=>{
    if(paused)return;
    const id=setInterval(()=>setSlideIdx(i=>(i+1)%slides.length),6000);
    return()=>clearInterval(id);
  },[paused,slides.length]);
  const APP_ICONS=[
    {ico:"📋",label:"Prontuário",   action:"prontuario",   bg:"linear-gradient(135deg,#EFF6FF,#DBEAFE)",border:"#93C5FD",c:"#1D4ED8"},
    {ico:"🛡️",label:"APAC",         action:"apac",         bg:"linear-gradient(135deg,#F0FDF4,#DCFCE7)",border:"#86EFAC",c:"#15803D"},
    {ico:"👥",label:"Pacientes",    action:"pacientes",    bg:"linear-gradient(135deg,#FFF7ED,#FED7AA)",border:"#FB923C",c:"#C2410C"},
    {ico:"🩺",label:"Enfermagem",   action:"enfermagem_triagem",bg:"linear-gradient(135deg,#FFF1F2,#FFE4E6)",border:"#FDA4AF",c:"#BE123C"},
    {ico:"🧪",label:"Exames",       action:"exames_med",   bg:"linear-gradient(135deg,#F5F3FF,#EDE9FE)",border:"#A78BFA",c:"#7C3AED"},
    {ico:"☁️",label:"Drive IA",     action:"drive_ia",     bg:"linear-gradient(135deg,#F0F9FF,#E0F2FE)",border:"#7DD3FC",c:"#0369A1"},
    {ico:"🤖",label:"IA Hub",       action:"ia_hub",       bg:"linear-gradient(135deg,#FFFBEB,#FEF3C7)",border:"#FCD34D",c:"#B45309"},
    {ico:"📅",label:"Agenda",       action:"agendamento",  bg:"linear-gradient(135deg,#F0FDF4,#CCFBF1)",border:"#6EE7B7",c:"#065F46"},
    {ico:"💊",label:"Receitas",     action:"receitas",     bg:"linear-gradient(135deg,#FDF4FF,#FAE8FF)",border:"#D8B4FE",c:"#7E22CE"},
    {ico:"📈",label:"Produção",     action:"fila",         bg:"linear-gradient(135deg,#FEFCE8,#FEF9C3)",border:"#FDE047",c:"#854D0E"},
  ];
  // contexto: "Adjuvante" | "Neoadjuvante" | "Perioperatório" | "Metastático" | "Localmente avançado"
  // ctxCor: cor do badge de contexto
  // ganhoLabel: texto do ganho absoluto de sobrevida
  // ganhoVal: valor numérico do ganho
  // barCor: cor da barra experimental
  const TRIALS=[
    {icon:"🌸",title:"SHAPE",protocolo:"Aceleração QRT",contexto:"Localmente avançado",ctxCor:"#7C3AED",ctxBg:"#F5F3FF",
      tag:"Colo uterino · FIGO IB-IVA",conclusion:"Aceleração QRT melhora a SLP sem aumentar toxicidade.",
      drug:"Aceleração QRT vs QRT padrão",subtitle:"Carcinoma colo uterino FIGO IB-IVA",endpoint:"SLP 5 anos",
      exp:75,ctrl:64,unit:"%",hr:"0,68",risk:"32%",ganhoVal:11,ganhoLabel:"+11 p.p. SLP",barCor:"#7C3AED",
      armA:"Aceleração QRT",armB:"QRT padrão",source:"SHAPE Trial",url:""},
    {icon:"🧬",title:"ADAURA",protocolo:"Osimertinibe",contexto:"Adjuvante",ctxCor:"#15803D",ctxBg:"#F0FDF4",
      tag:"CPNPC EGFR+ · IB–IIIA pós-ressecção",conclusion:"Osimertinibe adjuvante reduz recorrência em 77% e é padrão pós-ressecção.",
      drug:"Osimertinibe 80mg/dia vs placebo",subtitle:"CPNPC estádios IB-IIIA EGFR+ ressecado",endpoint:"SLD mediana (meses)",
      exp:65.8,ctrl:21.9,unit:"m",hr:"0,23",risk:"77%",ganhoVal:43.9,ganhoLabel:"+43,9m SLD",barCor:"#15803D",
      armA:"Osimertinibe",armB:"Placebo",source:"NEJM 2020/2023",url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2027071"},
    {icon:"🫘",title:"KEYNOTE-564",protocolo:"Pembrolizumabe",contexto:"Adjuvante",ctxCor:"#15803D",ctxBg:"#F0FDF4",
      tag:"RCC células claras · alto risco",conclusion:"Pembrolizumabe adjuvante: novo padrão em RCC claro alto risco.",
      drug:"Pembrolizumabe 200mg Q3W × 17 ciclos vs placebo",subtitle:"RCC claro ressecado com alto risco de recorrência",endpoint:"SG 24 meses (%)",
      exp:91.2,ctrl:86.0,unit:"%",hr:"0,66",risk:"34%",ganhoVal:5.2,ganhoLabel:"+5,2 p.p. SG",barCor:"#15803D",
      armA:"Pembrolizumabe",armB:"Placebo",source:"NEJM 2024",url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2312695"},
    {icon:"🫁",title:"KEYNOTE-671",protocolo:"Pembrolizumabe perioperatório",contexto:"Perioperatório",ctxCor:"#B45309",ctxBg:"#FFFBEB",
      tag:"CPNPC ressecável · QT perioperatória",conclusion:"Benefício relevante em sobrevida livre de eventos no cenário ressecável.",
      drug:"QT neoadjuvante + pembro → cirurgia → pembro manutenção vs placebo",subtitle:"CPNPC ressecável estádios II-IIIB",endpoint:"EFS 24 meses (%)",
      exp:62.4,ctrl:40.6,unit:"%",hr:"0,58",risk:"42%",ganhoVal:21.8,ganhoLabel:"+21,8 p.p. EFS",barCor:"#B45309",
      armA:"QT + Pembrolizumabe",armB:"QT + Placebo",source:"NEJM 2023",url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2302983"},
    {icon:"💧",title:"EV-302",protocolo:"Enfortumabe vedotina + Pembrolizumabe",contexto:"Metastático",ctxCor:"#0369A1",ctxBg:"#F0F9FF",
      tag:"Urotelial · avançado/metastático · 1ª linha",conclusion:"Dobro de SG mediana frente à quimioterapia com platina.",
      drug:"Enfortumabe vedotina + pembrolizumabe vs quimioterapia com platina",subtitle:"Carcinoma urotelial localmente avançado ou metastático 1L",endpoint:"SG mediana (meses)",
      exp:31.5,ctrl:16.1,unit:"m",hr:"0,47",risk:"53%",ganhoVal:15.4,ganhoLabel:"+15,4m SG",barCor:"#0369A1",
      armA:"EV + Pembrolizumabe",armB:"Quimioterapia",source:"NEJM 2024",url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2312117"},
    {icon:"🎀",title:"DESTINY-Breast04",protocolo:"Trastuzumabe deruxtecana (T-DXd)",contexto:"Metastático",ctxCor:"#BE123C",ctxBg:"#FFF1F2",
      tag:"Mama HER2-low · metastático",conclusion:"T-DXd supera quimioterapia e cria nova categoria terapêutica HER2-low.",
      drug:"T-DXd 5,4mg/kg Q3W vs quimioterapia à escolha do médico",subtitle:"Mama HER2-low metastático (IHC 1+ ou 2+/ISH-)",endpoint:"SG mediana (meses)",
      exp:23.4,ctrl:16.8,unit:"m",hr:"0,64",risk:"36%",ganhoVal:6.6,ganhoLabel:"+6,6m SG",barCor:"#BE123C",
      armA:"T-DXd",armB:"Quimioterapia",source:"NEJM 2022",url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2203690"},
    {icon:"🧬",title:"RUBY",protocolo:"Dostarlimabe + carboplatina/paclitaxel",contexto:"Metastático",ctxCor:"#0369A1",ctxBg:"#F0F9FF",
      tag:"Endométrio · dMMR/MSI-H · 1ª linha",conclusion:"Imunoterapia integrada: ganho expressivo de 45,7 p.p. em SLP.",
      drug:"Dostarlimabe 500mg Q3W × 6 + QT → dostarlimabe manutenção vs placebo + QT",subtitle:"Endométrio avançado/recorrente 1L dMMR/MSI-H",endpoint:"SLP 24 meses (%)",
      exp:61.4,ctrl:15.7,unit:"%",hr:"0,28",risk:"72%",ganhoVal:45.7,ganhoLabel:"+45,7 p.p. SLP",barCor:"#0369A1",
      armA:"Dostarlimabe + QT",armB:"Placebo + QT",source:"NEJM 2023",url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2216334"},
  ];
  const fmt=v=>String(v).replace(".",",");
  function BarChart({a,b,unit,armA,armB,corA="#15803D"}){
    const mx=Math.max(a,b,1);
    const wa=Math.round((a/mx)*210);
    const wb=Math.round((b/mx)*210);
    const lighter=corA+"99";
    return <svg viewBox="0 0 270 96" style={{width:"100%",display:"block"}}>
      <defs>
        <linearGradient id={`barGrad${corA.replace("#","")}`} x1="0" x2="1">
          <stop offset="0" stopColor={corA}/><stop offset="1" stopColor={corA+"cc"}/>
        </linearGradient>
      </defs>
      <text x="0" y="13" fontSize="10" fontWeight="900" fill={N}>{armA||"Experimental"}</text>
      <rect x="0" y="17" width={wa} height="20" rx="6" fill={`url(#barGrad${corA.replace("#","")})`}/>
      <rect x={wa} y="17" width={Math.max(0,210-wa)} height="20" rx="6" fill="#F1F5F9"/>
      <text x={wa+6} y="32" fontSize="13" fontWeight="950" fill={corA}>{fmt(a)}{unit}</text>
      <text x="0" y="61" fontSize="10" fontWeight="900" fill="#64748B">{armB||"Controle"}</text>
      <rect x="0" y="65" width={wb} height="20" rx="6" fill="#94A3B8"/>
      <rect x={wb} y="65" width={Math.max(0,210-wb)} height="20" rx="6" fill="#F1F5F9"/>
      <text x={wb+6} y="80" fontSize="13" fontWeight="950" fill="#64748B">{fmt(b)}{unit}</text>
    </svg>;
  }
  function SurvCurve({a,b,corA="#15803D"}){
    const ya=108-Math.min(90,Math.max(6,a));
    const yb=108-Math.min(90,Math.max(6,b));
    return <svg viewBox="0 0 300 130" style={{width:"100%",display:"block"}}>
      <defs>
        <linearGradient id={`sGrad${corA.replace("#","")}`} x1="0" x2="1">
          <stop offset="0" stopColor={corA}/><stop offset="1" stopColor={corA+"bb"}/>
        </linearGradient>
        <linearGradient id={`sFill${corA.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={corA} stopOpacity=".15"/><stop offset="1" stopColor={corA} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[18,46,74,102].map(y=><line key={y} x1="16" y1={y} x2="284" y2={y} stroke="#EEF2F8" strokeWidth="1.2"/>)}
      <path d={`M20 14 C76 16,116 ${ya-14},164 ${ya} S240 ${ya+2},278 ${ya}`} fill={`url(#sFill${corA.replace("#","")})`}/>
      <path d={`M20 14 C76 16,116 ${ya-14},164 ${ya} S240 ${ya+2},278 ${ya}`} fill="none" stroke={`url(#sGrad${corA.replace("#","")})`} strokeWidth="4.5" strokeLinecap="round"/>
      <path d={`M20 16 C76 26,116 ${yb-8},164 ${yb} S240 ${yb+2},278 ${yb}`} fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="9 5" strokeLinecap="round"/>
      <circle cx="278" cy={ya} r="7" fill={corA} stroke="#fff" strokeWidth="2.5"/>
      <circle cx="278" cy={yb} r="6" fill="#94A3B8" stroke="#fff" strokeWidth="2"/>
      <text x="18" y="124" fill="#94A3B8" fontSize="10" fontWeight="700">0</text>
      <text x="146" y="124" fill="#94A3B8" fontSize="10" fontWeight="700">36m</text>
      <text x="258" y="124" fill="#94A3B8" fontSize="10" fontWeight="700">72m</text>
    </svg>;
  }
  function TrialCard({t,onClose}){
    const cor=t.barCor||VE;
    return <div style={{background:"#F8FAFC",borderRadius:24,overflow:"hidden",boxShadow:"0 36px 80px rgba(13,31,60,.30)",width:"min(900px,97vw)",maxHeight:"93vh",overflowY:"auto",position:"relative"}}>
      <button onClick={onClose} style={{position:"absolute",right:18,top:18,zIndex:6,width:40,height:40,borderRadius:12,border:"1px solid rgba(255,255,255,.28)",background:"rgba(0,0,0,.32)",backdropFilter:"blur(8px)",color:"#fff",fontSize:22,cursor:"pointer",fontFamily:"inherit",display:"grid",placeItems:"center"}}>×</button>

      {/* ── HEADER ── */}
      <div style={{background:`linear-gradient(135deg,${N} 0%,#0B2545 52%,#163A6B 100%)`,padding:"26px 30px 22px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-40,top:-40,width:240,height:240,borderRadius:"50%",background:"rgba(255,255,255,.04)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",right:80,bottom:-80,width:300,height:300,borderRadius:"50%",background:`${cor}18`,pointerEvents:"none"}}/>
        {/* Eyebrow */}
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap",position:"relative",zIndex:2}}>
          <span style={{background:t.ctxBg||"#F0FDF4",color:t.ctxCor||VE,border:`1.5px solid ${t.ctxCor||VE}55`,borderRadius:999,padding:"3px 12px",fontSize:11,fontWeight:900}}>{t.contexto}</span>
          <span style={{background:"rgba(255,255,255,.12)",color:"rgba(255,255,255,.8)",border:"1px solid rgba(255,255,255,.18)",borderRadius:999,padding:"3px 12px",fontSize:11,fontWeight:800}}>{t.source}</span>
          <span style={{background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.65)",border:"1px solid rgba(255,255,255,.12)",borderRadius:999,padding:"3px 12px",fontSize:10,fontWeight:700}}>Fase III · ECR</span>
        </div>
        {/* Title row */}
        <div style={{display:"flex",gap:16,alignItems:"flex-start",position:"relative",zIndex:2}}>
          <div style={{width:62,height:62,borderRadius:16,background:"rgba(255,255,255,.1)",border:`1.5px solid ${cor}55`,display:"grid",placeItems:"center",fontSize:34,flexShrink:0}}>{t.icon}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"baseline",gap:12,flexWrap:"wrap"}}>
              <h2 style={{margin:0,fontSize:34,fontWeight:950,color:"#fff",lineHeight:1,letterSpacing:-.5}}>{t.title}</h2>
              <span style={{fontSize:16,color:G,fontWeight:900,lineHeight:1}}>{t.tag}</span>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:G,marginTop:5}}>{t.protocolo}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.65)",marginTop:3,fontWeight:600}}>{t.subtitle}</div>
          </div>
        </div>
        {/* KPI strip: 3 números chave */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:20,position:"relative",zIndex:2}}>
          <div style={{background:"rgba(255,255,255,.08)",border:`1.5px solid ${cor}44`,borderRadius:14,padding:"12px 16px",textAlign:"center"}}>
            <div style={{fontSize:10,color:cor,fontWeight:900,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>↓ Redução de mortalidade</div>
            <div style={{fontSize:36,fontWeight:950,color:"#fff",lineHeight:1}}>{t.risk}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.55)",marginTop:2,fontWeight:700}}>vs braço controle</div>
          </div>
          <div style={{background:"rgba(255,255,255,.08)",border:`1.5px solid ${G}44`,borderRadius:14,padding:"12px 16px",textAlign:"center"}}>
            <div style={{fontSize:10,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>↑ Ganho de sobrevida</div>
            <div style={{fontSize:36,fontWeight:950,color:G,lineHeight:1}}>{t.ganhoLabel}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.55)",marginTop:2,fontWeight:700}}>{t.endpoint}</div>
          </div>
          <div style={{background:"rgba(255,255,255,.08)",border:"1.5px solid rgba(255,255,255,.15)",borderRadius:14,padding:"12px 16px",textAlign:"center"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,.7)",fontWeight:900,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>HR · Hazard Ratio</div>
            <div style={{fontSize:36,fontWeight:950,color:"#fff",lineHeight:1}}>{t.hr}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.55)",marginTop:2,fontWeight:700}}>IC 95% favorável</div>
          </div>
        </div>
        {/* Arms */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12,position:"relative",zIndex:2}}>
          <div style={{background:`${cor}22`,border:`1.5px solid ${cor}55`,borderRadius:12,padding:"9px 14px"}}>
            <div style={{fontSize:9,color:cor,fontWeight:900,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>⚗️ Braço Experimental</div>
            <div style={{fontSize:14,fontWeight:950,color:"#fff",lineHeight:1.3}}>{t.armA}</div>
          </div>
          <div style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:12,padding:"9px 14px"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,.5)",fontWeight:900,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>⚖️ Braço Controle</div>
            <div style={{fontSize:14,fontWeight:950,color:"rgba(255,255,255,.82)",lineHeight:1.3}}>{t.armB}</div>
          </div>
        </div>
      </div>

      {/* ── GRÁFICOS ── */}
      <div style={{padding:"18px 22px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {/* Barras coloridas */}
        <div style={{background:"#fff",border:"1.5px solid #E8EEF7",borderRadius:18,padding:"16px 18px",boxShadow:"0 2px 8px rgba(13,31,60,.05)"}}>
          <div style={{fontSize:10,color:cor,fontWeight:900,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>📊 {t.endpoint}</div>
          <BarChart a={t.exp} b={t.ctrl} unit={t.unit} armA={t.armA} armB={t.armB} corA={cor}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:14}}>
            {[[`${fmt(t.exp)}${t.unit}`,"Experimental",cor],[`${fmt(t.ctrl)}${t.unit}`,"Controle","#94A3B8"],[`${t.hr}`,"HR",G]].map(([v,l,c])=><div key={l} style={{background:"#F8FAFC",border:`1.5px solid ${c}33`,borderRadius:12,padding:"9px 10px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:950,color:c,lineHeight:1}}>{v}</div>
              <div style={{fontSize:9,color:"#94A3B8",fontWeight:800,marginTop:3,textTransform:"uppercase"}}>{l}</div>
            </div>)}
          </div>
        </div>
        {/* Curva Kaplan-Meier */}
        <div style={{background:"#fff",border:"1.5px solid #E8EEF7",borderRadius:18,padding:"16px 18px",boxShadow:"0 2px 8px rgba(13,31,60,.05)"}}>
          <div style={{fontSize:10,color:cor,fontWeight:900,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>📈 Curva de sobrevida (KM)</div>
          <SurvCurve a={t.exp} b={t.ctrl} corA={cor}/>
          <div style={{display:"flex",gap:16,marginTop:8,flexWrap:"wrap"}}>
            <span style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:cor,fontWeight:800}}>
              <span style={{width:20,height:4,background:cor,display:"inline-block",borderRadius:2}}/>{t.armA}
            </span>
            <span style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#94A3B8",fontWeight:800}}>
              <span style={{width:20,height:0,border:"2.5px dashed #CBD5E1",display:"inline-block"}}/>{t.armB}
            </span>
          </div>
        </div>
      </div>

      {/* ── DESFECHO + AÇÕES ── */}
      <div style={{padding:"0 22px 20px"}}>
        <div style={{background:`linear-gradient(90deg,${N},#163A6B)`,color:"#fff",borderRadius:14,padding:"14px 20px",fontSize:15,fontWeight:950,lineHeight:1.45,marginBottom:14,borderLeft:`4px solid ${G}`}}>
          🎯 {t.conclusion}
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#94A3B8",fontWeight:700}}>Fonte: {t.source}</span>
          {t.url&&<a href={t.url} target="_blank" rel="noreferrer" style={{background:N,color:"#fff",borderRadius:10,padding:"9px 18px",fontSize:12,fontWeight:950,textDecoration:"none"}}>↗ Artigo original</a>}
          <button onClick={()=>{setTrialOpen(null);setMedTab("ia");}} style={{background:G,color:"#fff",border:"none",borderRadius:10,padding:"9px 18px",fontSize:12,fontWeight:950,cursor:"pointer",fontFamily:"inherit"}}>🤖 Discutir com IA</button>
          <button onClick={()=>{setTrialOpen(null);setMedTab("prontuario");}} style={{background:"#fff",color:N,border:"1.5px solid #E2E8F0",borderRadius:10,padding:"9px 18px",fontSize:12,fontWeight:950,cursor:"pointer",fontFamily:"inherit"}}>📝 Aplicar no prontuário</button>
        </div>
      </div>
    </div>;
  }
  const css=[
    `@keyframes dmSlideIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}`,
    `@keyframes dmPop{from{opacity:0;transform:scale(.90) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}`,
    `@keyframes dmIconPop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}`,
    `.dmSlide{animation:dmSlideIn .42s cubic-bezier(.2,.8,.2,1) both}`,
    `.dmAppIcon{border:none;cursor:pointer;font-family:inherit;transition:.18s cubic-bezier(.2,.8,.2,1);text-align:center;padding:0}`,
    `.dmAppIcon:hover{transform:translateY(-4px) scale(1.07);box-shadow:0 10px 28px rgba(13,31,60,.14)!important}`,
    `.dmAppIcon:active{transform:scale(.97)}`,
    `.dmTrialRow{border:1px solid transparent;background:transparent;cursor:pointer;font-family:inherit;text-align:left;width:100%;transition:.14s ease;border-radius:12px;display:grid}`,
    `.dmTrialRow:hover{background:#FFFBEB!important;border-color:${G}44!important;transform:translateX(2px)}`,
    `.dmModalOv{position:fixed;inset:0;z-index:99990;background:rgba(8,20,48,.65);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:16px}`,
    `.dmModalPop{animation:dmPop .36s cubic-bezier(.2,.8,.2,1) both}`,
    `@media(max-width:900px){.dmGrid{grid-template-columns:1fr!important}}`,
    `@media(max-width:600px){.dmIcons{grid-template-columns:repeat(4,1fr)!important}}`,
  ].join("\n");
  return <div style={{display:"grid",gap:16,color:N}}>
    <style>{css}</style>
    {/* ══ BANNER PRINCIPAL COM TRANSIÇÃO ══ */}
    <div style={{background:curSlide.bg,borderRadius:24,boxShadow:"0 16px 48px rgba(13,31,60,.22),0 0 0 1px rgba(255,255,255,.06)",overflow:"hidden",cursor:curSlide.action?"pointer":"default",position:"relative",minHeight:160}}
      onClick={()=>curSlide.action&&setMedTab(curSlide.action)}>
      {/* Background orbs */}
      <div style={{position:"absolute",right:-60,top:-60,width:320,height:320,borderRadius:"50%",background:"rgba(255,255,255,.04)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",left:-40,bottom:-80,width:280,height:280,borderRadius:"50%",background:`${curSlide.accent||G}14`,pointerEvents:"none"}}/>
      <div key={curSlide.id} className="dmSlide" style={{padding:"26px 30px 20px",position:"relative",zIndex:2}}>
        {curSlide.id==="home"
          ?<div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:20,alignItems:"center"}}>
            <div>
              <div style={{fontSize:11,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Página inicial · APACApp · Oncologia</div>
              <h1 style={{fontSize:34,fontWeight:950,color:"#fff",margin:"0 0 8px",lineHeight:1.05}}>{saudacao}, Dr. Silas Negrão.</h1>
              <div style={{fontSize:14,color:"rgba(255,255,255,.72)",fontWeight:700,marginBottom:20}}>{frases[now.getDate()%4]}</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {metrics.map(m=><button key={m.l} onClick={e=>{e.stopPropagation();setMedTab(m.action);}} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.18)",borderRadius:12,padding:"8px 14px",cursor:"pointer",color:"#fff",fontFamily:"inherit",transition:".14s ease"}}>
                  <span style={{fontSize:20}}>{m.ico}</span>
                  <span><span style={{fontSize:18,fontWeight:950,color:m.c}}>{m.v}</span><span style={{fontSize:10,color:"rgba(255,255,255,.65)",fontWeight:800,marginLeft:4}}>{m.l}</span></span>
                </button>)}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:56,lineHeight:1,color:G,fontWeight:950,letterSpacing:-2}}>{hora}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.6)",fontWeight:800,marginTop:4,textTransform:"capitalize"}}>{data}</div>
              <div style={{marginTop:12,fontSize:11,color:"rgba(255,255,255,.38)",fontWeight:700,textAlign:"right"}}>Criado por Dr. Silas Negrão</div>
            </div>
          </div>
          :<div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:20,alignItems:"center"}}>
            <div style={{display:"flex",gap:18,alignItems:"center"}}>
              <div style={{width:72,height:72,borderRadius:20,background:"rgba(255,255,255,.12)",border:`1.5px solid ${curSlide.accent||G}44`,display:"grid",placeItems:"center",fontSize:38,flexShrink:0}}>{curSlide.ico}</div>
              <div>
                <div style={{fontSize:10,color:curSlide.accent||G,fontWeight:900,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Abrir seção →</div>
                <div style={{fontSize:28,fontWeight:950,color:"#fff",lineHeight:1.05,marginBottom:6}}>{curSlide.title}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.68)",fontWeight:700}}>{curSlide.sub}</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
                {metrics.map(m=><div key={m.l} style={{textAlign:"center",minWidth:44}}>
                  <div style={{fontSize:18}}>{m.ico}</div>
                  <div style={{fontSize:17,fontWeight:950,color:m.c,lineHeight:1}}>{m.v}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.45)",fontWeight:800,textTransform:"uppercase"}}>{m.l}</div>
                </div>)}
              </div>
              <div style={{marginTop:14,fontSize:11,color:"rgba(255,255,255,.28)",fontWeight:700}}>Criado por Dr. Silas Negrão</div>
            </div>
          </div>}
      </div>
      {/* Dots */}
      <div style={{display:"flex",gap:5,justifyContent:"center",paddingBottom:12,position:"relative",zIndex:2}}>
        {slides.map((_,i)=><button key={i} onClick={e=>{e.stopPropagation();setSlideIdx(i);setPaused(true);setTimeout(()=>setPaused(false),9000);}} style={{width:i===slideIdx%slides.length?28:7,height:7,borderRadius:999,border:"none",background:i===slideIdx%slides.length?"rgba(255,255,255,.95)":"rgba(255,255,255,.3)",cursor:"pointer",transition:".22s cubic-bezier(.2,.8,.2,1)"}}/>)}
      </div>
    </div>
    {/* ══ ÍCONES DE APP ══ */}
    <div style={{background:"#fff",border:"1.5px solid #E8EEF7",borderRadius:22,padding:"18px 20px",boxShadow:"0 6px 20px rgba(13,31,60,.06)"}}>
      <div style={{fontSize:10,color:"#94A3B8",fontWeight:900,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Acessos rápidos</div>
      <div className="dmIcons" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
        {APP_ICONS.map((a,idx)=><button key={a.label} className="dmAppIcon" onClick={()=>setMedTab(a.action)} onDoubleClick={()=>setMedTab(a.action)}
          style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7,padding:"16px 8px",borderRadius:18,background:a.bg,border:`1.5px solid ${a.border}`,boxShadow:"0 2px 8px rgba(13,31,60,.06)",animation:`dmIconPop .28s ${idx*.03}s cubic-bezier(.2,.8,.2,1) both`}}>
          <span style={{fontSize:30,lineHeight:1,filter:"drop-shadow(0 2px 4px rgba(0,0,0,.08))"}}>{a.ico}</span>
          <span style={{fontSize:11,fontWeight:900,color:a.c,lineHeight:1.2,textAlign:"center"}}>{a.label}</span>
        </button>)}
      </div>
    </div>
    {/* ══ GRID INFERIOR ══ */}
    <div className="dmGrid" style={{display:"grid",gridTemplateColumns:"1.15fr .85fr",gap:16}}>
      {/* Fila do dia */}
      <div style={{background:"#fff",border:`1.5px solid ${G}44`,borderRadius:22,padding:"18px 20px",boxShadow:"0 8px 24px rgba(13,31,60,.07)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <h2 style={{fontSize:18,margin:"0 0 2px",fontWeight:950}}>🩺 Atendimentos do dia</h2>
            <div style={{fontSize:11,color:"#94A3B8",fontWeight:700}}>{fila.filter(p=>p.status==="aguardando").length} aguardando · {fila.filter(p=>p.status==="em_consulta").length} em consulta</div>
          </div>
          <button onClick={()=>setMedTab("fila")} style={{...sc_.btn("gold",{fontSize:11,padding:"7px 14px"})}}>Ver fila completa</button>
        </div>
        <div style={{display:"grid",gap:7}}>
          {fila.slice(0,5).map((p,i)=>{const pr=prioStyle[p.prioridade]||prioStyle.media;return(
            <button key={`${p.pacID||p.nome||"pac"}-${i}-fd`} style={{border:`1px solid #E8EEF7`,borderRadius:14,padding:"10px 14px",display:"flex",alignItems:"center",gap:12,background:"#FAFCFF",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:".14s ease",boxShadow:"0 1px 4px rgba(13,31,60,.04)"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#F0F6FF";e.currentTarget.style.borderColor=G+"55";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#FAFCFF";e.currentTarget.style.borderColor="#E8EEF7";}}
              onClick={()=>onAbrirAtendimento?onAbrirAtendimento(p):setMedTab("prontuario")}>
              <span style={{width:38,height:38,borderRadius:11,background:p.status==="em_consulta"?G:N,color:"#fff",display:"grid",placeItems:"center",fontWeight:950,fontSize:11,flexShrink:0,boxShadow:"0 3px 8px rgba(13,31,60,.18)"}}>
                {p.status==="em_consulta"?"🩺":`#${p.num||String(i+1).padStart(3,"0")}`}
              </span>
              <span style={{flex:1,minWidth:0}}>
                <span style={{display:"block",fontSize:13,fontWeight:950,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.nome}</span>
                <span style={{display:"block",fontSize:11,color:"#64748B",fontWeight:700,marginTop:1}}>{p.proto||p.trat||"Aguardando avaliação"}{p.checkin?" · "+p.checkin:""}</span>
              </span>
              <span style={{background:pr.bg,color:pr.c,border:`1.5px solid ${pr.c}44`,borderRadius:999,padding:"3px 10px",fontSize:10,fontWeight:900,flexShrink:0}}>{pr.label}</span>
            </button>
          );})}
        </div>
      </div>
      {/* Estudos + refs */}
      <div style={{display:"grid",gap:12,alignContent:"start"}}>
        <div style={{background:"#fff",border:`1.5px solid ${G}44`,borderRadius:22,padding:"16px 18px",boxShadow:"0 8px 24px rgba(13,31,60,.07)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h2 style={{fontSize:17,margin:0,fontWeight:950}}>🧬 Estudos clínicos</h2>
            <span style={{fontSize:10,color:"#94A3B8",fontWeight:800}}>Clique para detalhes</span>
          </div>
          <div style={{display:"grid",gap:3}}>
            {TRIALS.map((t,i)=><button key={t.title} className="dmTrialRow" onClick={()=>setTrialOpen(t)}
              style={{padding:"9px 10px",background:i%2===0?"#FAFAFA":"#fff",gridTemplateColumns:"26px 1fr",gap:10,alignItems:"start"}}>
              <span style={{fontSize:18,lineHeight:1.3,marginTop:1}}>{t.icon}</span>
              <span>
                <span style={{display:"block",fontSize:13,fontWeight:950,color:N,lineHeight:1.2}}>{t.title}<span style={{color:G,fontWeight:800,fontSize:10,marginLeft:5}}>· {t.tag}</span></span>
                <span style={{display:"block",fontSize:11,color:"#64748B",fontWeight:700,lineHeight:1.35,marginTop:2}}>{t.conclusion}</span>
              </span>
            </button>)}
          </div>
        </div>
        <div style={{background:"#fff",border:"1.5px solid #E8EEF7",borderRadius:18,padding:"14px 16px",boxShadow:"0 4px 14px rgba(13,31,60,.05)"}}>
          <div style={{fontSize:10,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>🔗 Referências</div>
          <div style={{display:"grid",gap:5}}>
            {[{l:"SBOC",sub:"Sociedade Brasileira de Oncologia",url:"https://sboc.org.br/"},{l:"MOC Brasil",sub:"Manual de Oncologia Clínica",url:"https://mocbrasil.com/"},{l:"INCA",sub:"Publicações e manuais",url:"https://www.gov.br/inca/pt-br/assuntos/publicacoes"},{l:"SBOC Notícias",sub:"Notícias e agenda",url:"https://sboc.org.br/noticias"}].map(u=><a key={u.l} href={u.url} target="_blank" rel="noreferrer" style={{display:"flex",justifyContent:"space-between",alignItems:"center",textDecoration:"none",padding:"8px 12px",borderRadius:12,background:"#FFFBEB",border:`1.5px solid ${G}22`,transition:".12s ease"}}
              onMouseEnter={e=>e.currentTarget.style.background="#FEF3C7"}
              onMouseLeave={e=>e.currentTarget.style.background="#FFFBEB"}>
              <div><div style={{fontSize:12,color:N,fontWeight:900}}>{u.l}</div><div style={{fontSize:10,color:"#64748B",fontWeight:700}}>{u.sub}</div></div>
              <span style={{color:G,fontWeight:950,fontSize:16}}>↗</span>
            </a>)}
          </div>
        </div>
        {/* Assinatura */}
        <div style={{textAlign:"center",padding:"8px 0 2px"}}>
          <div style={{fontSize:11,color:"#CBD5E1",fontWeight:800,letterSpacing:.5}}>⚕ APACApp · Oncologia</div>
          <div style={{fontSize:10,color:"#94A3B8",fontWeight:700,marginTop:2}}>Criado por Dr. Silas Negrão</div>
        </div>
      </div>
    </div>
    {/* ══ MODAL TRIAL ══ */}
    {trialOpen&&<div className="dmModalOv" onClick={()=>setTrialOpen(null)}>
      <div className="dmModalPop" onClick={e=>e.stopPropagation()}>
        <TrialCard t={trialOpen} onClose={()=>setTrialOpen(null)}/>
      </div>
    </div>}
  </div>;
}
