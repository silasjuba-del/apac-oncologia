import{r,j as t}from"./vendor-react-Ds7D3P6J.js";const T=`
/* Simbolos voando em dire\xE7\xE3o \xE0 tela */
@keyframes flyTL   { 0%{opacity:0;transform:translate(-120px,-120px) scale(.15) rotate(-15deg);filter:blur(3px);}
                     50%{opacity:.9;transform:translate(-20px,-20px) scale(1.6) rotate(5deg);filter:blur(0);}
                     100%{opacity:0;transform:translate(20px,20px) scale(3.5) rotate(8deg);filter:blur(10px);} }
@keyframes flyTR   { 0%{opacity:0;transform:translate(120px,-120px) scale(.15) rotate(15deg);filter:blur(3px);}
                     50%{opacity:.9;transform:translate(20px,-20px) scale(1.6) rotate(-5deg);filter:blur(0);}
                     100%{opacity:0;transform:translate(-20px,20px) scale(3.5) rotate(-8deg);filter:blur(10px);} }
@keyframes flyBL   { 0%{opacity:0;transform:translate(-120px,120px) scale(.15) rotate(20deg);filter:blur(3px);}
                     50%{opacity:.9;transform:translate(-20px,20px) scale(1.6) rotate(-5deg);filter:blur(0);}
                     100%{opacity:0;transform:translate(20px,-20px) scale(3.5) rotate(-10deg);filter:blur(10px);} }
@keyframes flyBR   { 0%{opacity:0;transform:translate(120px,120px) scale(.15) rotate(-20deg);filter:blur(3px);}
                     50%{opacity:.9;transform:translate(20px,20px) scale(1.6) rotate(5deg);filter:blur(0);}
                     100%{opacity:0;transform:translate(-20px,-20px) scale(3.5) rotate(10deg);filter:blur(10px);} }
@keyframes flyL    { 0%{opacity:0;transform:translate(-150px,0) scale(.12);filter:blur(4px);}
                     50%{opacity:.9;transform:translate(-20px,0) scale(1.7);filter:blur(0);}
                     100%{opacity:0;transform:translate(30px,0) scale(3.8);filter:blur(10px);} }
@keyframes flyR    { 0%{opacity:0;transform:translate(150px,0) scale(.12);filter:blur(4px);}
                     50%{opacity:.9;transform:translate(20px,0) scale(1.7);filter:blur(0);}
                     100%{opacity:0;transform:translate(-30px,0) scale(3.8);filter:blur(10px);} }
@keyframes flyT    { 0%{opacity:0;transform:translate(0,-160px) scale(.1);filter:blur(4px);}
                     50%{opacity:.9;transform:translate(0,-20px) scale(1.8);filter:blur(0);}
                     100%{opacity:0;transform:translate(0,30px) scale(4);filter:blur(10px);} }
@keyframes flyB    { 0%{opacity:0;transform:translate(0,160px) scale(.1);filter:blur(4px);}
                     50%{opacity:.9;transform:translate(0,20px) scale(1.8);filter:blur(0);}
                     100%{opacity:0;transform:translate(0,-30px) scale(4);filter:blur(10px);} }

/* C\xE9lula (tumor) \u2014 blob que voa e se expande */
@keyframes cellBurst{ 0%{opacity:0;transform:scale(.08);filter:blur(6px);}
                      40%{opacity:.75;transform:scale(1.4);filter:blur(0);}
                      100%{opacity:0;transform:scale(4.5);filter:blur(12px);} }

/* Part\xEDculas de fundo */
@keyframes particleDrift{ 0%{opacity:0;transform:translateY(0) scale(1);}
                           20%{opacity:.7;}
                           100%{opacity:0;transform:translateY(-110vh) scale(1.8);} }

/* Letras subindo de baixo para cima */
@keyframes letterUp{ 0%{opacity:0;transform:translateY(72px) scale(.85);filter:blur(8px);}
                     60%{filter:blur(0);}
                     100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0);} }

/* Linha dourada expandindo */
@keyframes lineGrow{ from{width:0;opacity:0;} to{width:min(380px,75vw);opacity:1;} }

/* Subt\xEDtulo desliza */
@keyframes slideUp{ from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

/* Foto / avatar aparece com brilho */
@keyframes photoIn{ 0%{opacity:0;transform:scale(.3);filter:blur(12px);}
                    60%{opacity:1;transform:scale(1.06);filter:blur(0);}
                    100%{opacity:1;transform:scale(1);} }

/* Anel pulsando ao redor da foto */
@keyframes ringPulse{ 0%{transform:translate(-50%,-50%) scale(1);opacity:.7;}
                      100%{transform:translate(-50%,-50%) scale(1.8);opacity:0;} }

/* Shimmer dourado no texto */
@keyframes shimmer{ 0%{background-position:-200% center;}
                    100%{background-position:200% center;} }

/* Brilho do nome pulsando */
@keyframes nameGlow{ 0%,100%{text-shadow:0 0 20px rgba(212,160,23,.6),0 0 40px rgba(184,134,11,.3);}
                     50%{text-shadow:0 0 40px rgba(255,210,80,1),0 0 80px rgba(212,160,23,.8),0 0 120px rgba(184,134,11,.5);} }

/* Cr\xE9dito aparece */
@keyframes creditIn{ 0%{opacity:0;transform:scale(1.2) translateY(6px);filter:blur(6px);}
                     100%{opacity:1;transform:none;filter:blur(0);} }

/* Bot\xE3o aparece */
@keyframes btnIn{ from{opacity:0;transform:translateY(12px) scale(.9);} to{opacity:1;transform:none;} }

/* Sa\xEDda zoom */
@keyframes zoomExit{ 0%{opacity:1;transform:scale(1);filter:blur(0) brightness(1);}
                     100%{opacity:0;transform:scale(2.5);filter:blur(20px) brightness(2);} }

/* Flash branco */
@keyframes flashW{ 0%{opacity:0;} 30%{opacity:.95;} 100%{opacity:0;} }

/* Nebulosa de fundo pulsando */
@keyframes nebula{ 0%,100%{opacity:.18;transform:scale(1);} 50%{opacity:.28;transform:scale(1.06);} }

/* T\xEDtulo brilhando antes do glitch */
@keyframes titleGlow{ 0%,100%{text-shadow:0 0 80px rgba(27,54,93,.8),0 4px 40px rgba(0,0,0,.6);}
                      50%{text-shadow:0 0 120px rgba(27,54,93,1),0 0 40px rgba(43,122,140,.5),0 4px 40px rgba(0,0,0,.7);} }

/* Ponteiro HUD piscando */
@keyframes hudBlink{ 0%,100%{opacity:.4;} 50%{opacity:1;} }
`,F=[{ico:"\u{1F9EC}",left:6,top:8,size:52,anim:"flyTL",dur:1.8,delay:0},{ico:"\u2695",left:88,top:6,size:60,anim:"flyTR",dur:2,delay:.15},{ico:"\u{1F52C}",left:5,top:80,size:48,anim:"flyBL",dur:1.9,delay:.3},{ico:"\u{1FA7A}",left:90,top:78,size:54,anim:"flyBR",dur:1.8,delay:.1},{ico:"\u269B",left:3,top:48,size:50,anim:"flyL",dur:2,delay:.4},{ico:"\u{1F48A}",left:94,top:42,size:44,anim:"flyR",dur:1.9,delay:.25},{ico:"\u{1F9EA}",left:48,top:3,size:46,anim:"flyT",dur:2.1,delay:.2},{ico:"\u{1F489}",left:52,top:93,size:42,anim:"flyB",dur:1.8,delay:.35},{ico:"\u{1F9A0}",left:22,top:15,size:46,anim:"flyTL",dur:2.2,delay:.5},{ico:"\u{1F9EB}",left:75,top:18,size:44,anim:"flyTR",dur:2,delay:.45},{ico:"\u{1FA7B}",left:18,top:72,size:50,anim:"flyBL",dur:2.1,delay:.55},{ico:"\u{1F52D}",left:78,top:68,size:44,anim:"flyBR",dur:2,delay:.6},{ico:"\u271A",left:38,top:6,size:40,anim:"flyT",dur:2.2,delay:.7},{ico:"\u26A1",left:65,top:92,size:38,anim:"flyB",dur:2,delay:.65},{ico:"\u{1F3E5}",left:92,top:58,size:46,anim:"flyR",dur:2.3,delay:.8}],A=[{left:15,top:25,size:90,color:"rgba(139,0,60,.7)",delay:.05,dur:2.2},{left:80,top:30,size:70,color:"rgba(80,10,100,.7)",delay:.2,dur:2},{left:50,top:50,size:110,color:"rgba(0,80,100,.65)",delay:.4,dur:2.4},{left:25,top:65,size:85,color:"rgba(120,20,20,.7)",delay:.6,dur:2.1},{left:72,top:55,size:75,color:"rgba(60,0,80,.65)",delay:.3,dur:2.3},{left:40,top:20,size:65,color:"rgba(0,60,80,.6)",delay:.7,dur:2},{left:60,top:78,size:80,color:"rgba(100,0,40,.65)",delay:.15,dur:2.2}],D=Array.from({length:36},(n,o)=>({key:o,left:Math.random()*100,size:Math.random()*5+1.5,color:["#B8860B","#D4A017","rgba(43,122,140,.6)","rgba(255,255,255,.3)","rgba(27,54,93,.5)"][o%5],dur:Math.random()*14+10,delay:Math.random()*10}));function b(n,o){return n.split("").map((l,s)=>({ch:l,delay:o+s*.075}))}const I=b("ONCOLOGIA",2.2),R=b("INTEGRADA",2.85);function C({onConcluir:n}){const[o,l]=r.useState(!1),[s,m]=r.useState(!1),[f,y]=r.useState(!1),[g,h]=r.useState(!1),[z,S]=r.useState(!1),[p,v]=r.useState(!1),[x,k]=r.useState(!1),[w,B]=r.useState(!1),[E,u]=r.useState(!1),c=r.useRef([]);function i(e,a){const j=setTimeout(a,e);c.current.push(j)}r.useEffect(()=>(i(2e3,()=>l(!0)),i(3900,()=>m(!0)),i(4350,()=>y(!0)),i(4700,()=>h(!0)),i(5600,()=>S(!0)),i(7e3,()=>v(!0)),i(11e3,()=>d()),()=>c.current.forEach(clearTimeout)),[]);function d(){c.current.forEach(clearTimeout),u(!0),setTimeout(()=>u(!1),160),B(!0),setTimeout(n,700)}return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:T}),E&&t.jsx("div",{style:{position:"fixed",inset:0,zIndex:99999,background:"#fff",animation:"flashW .16s ease both",pointerEvents:"none"}}),t.jsxs("div",{style:{position:"fixed",inset:0,zIndex:9990,overflow:"hidden",background:"radial-gradient(ellipse at 50% 40%, #0a1628 0%, #030810 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:w?"zoomExit .7s cubic-bezier(.4,0,.2,1) both":"none"},children:[t.jsx("div",{style:{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse 80% 60% at 30% 60%, rgba(43,122,140,.18) 0%, transparent 60%),radial-gradient(ellipse 60% 50% at 70% 30%, rgba(27,54,93,.22) 0%, transparent 55%)",animation:"nebula 6s ease-in-out infinite"}}),t.jsx("div",{style:{position:"absolute",inset:0,pointerEvents:"none",backgroundImage:"radial-gradient(circle, rgba(184,134,11,.12) 1px, transparent 1px)",backgroundSize:"40px 40px",opacity:.5}}),[{top:18,left:18,borderTop:"1.5px solid rgba(212,160,23,.5)",borderLeft:"1.5px solid rgba(212,160,23,.5)"},{top:18,right:18,borderTop:"1.5px solid rgba(212,160,23,.5)",borderRight:"1.5px solid rgba(212,160,23,.5)"},{bottom:18,left:18,borderBottom:"1.5px solid rgba(212,160,23,.5)",borderLeft:"1.5px solid rgba(212,160,23,.5)"},{bottom:18,right:18,borderBottom:"1.5px solid rgba(212,160,23,.5)",borderRight:"1.5px solid rgba(212,160,23,.5)"}].map((e,a)=>t.jsx("div",{style:{position:"absolute",width:28,height:28,zIndex:4,...e,animation:"hudBlink 2.5s ease-in-out infinite",animationDelay:`${a*.3}s`}},a)),t.jsx("div",{style:{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"},children:D.map(e=>t.jsx("div",{style:{position:"absolute",borderRadius:"50%",width:e.size,height:e.size,left:`${e.left}%`,bottom:"-5%",background:e.color,animation:`particleDrift ${e.dur}s ${e.delay}s linear infinite`}},e.key))}),A.map((e,a)=>t.jsx("div",{style:{position:"absolute",left:`${e.left}%`,top:`${e.top}%`,width:e.size,height:e.size,background:`radial-gradient(circle at 35% 35%, ${e.color}, rgba(0,0,0,.9))`,borderRadius:"60% 40% 55% 45% / 45% 55% 40% 60%",animation:`cellBurst ${e.dur}s ${e.delay}s cubic-bezier(.2,.8,.2,1) both`,boxShadow:`0 0 30px ${e.color}`,pointerEvents:"none",zIndex:2},children:t.jsx("div",{style:{position:"absolute",top:"25%",left:"28%",width:"44%",height:"44%",background:"rgba(255,255,255,.12)",borderRadius:"50%"}})},a)),F.map((e,a)=>t.jsx("div",{style:{position:"absolute",left:`${e.left}%`,top:`${e.top}%`,fontSize:e.size,lineHeight:1,animation:`${e.anim} ${e.dur}s ${e.delay}s cubic-bezier(.2,.8,.2,1) both`,pointerEvents:"none",zIndex:3,filter:"drop-shadow(0 0 12px rgba(184,134,11,.5))"},children:e.ico},a)),t.jsxs("div",{style:{position:"absolute",bottom:120,left:0,right:0,textAlign:"center",zIndex:6,pointerEvents:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:4},children:[t.jsx("div",{style:{display:"flex",gap:"clamp(2px,0.6vw,8px)",justifyContent:"center"},children:I.map((e,a)=>t.jsx("span",{style:{fontSize:"clamp(34px,5.5vw,72px)",fontWeight:950,color:"#FFFFFF",letterSpacing:"-0.5px",textShadow:"0 0 60px rgba(27,54,93,.8),0 4px 30px rgba(0,0,0,.7)",opacity:o?1:0,animation:o?`letterUp .7s ${e.delay}s cubic-bezier(.2,.8,.2,1) both`:"none",display:"inline-block",fontFamily:"inherit"},children:e.ch},a))}),t.jsx("div",{style:{display:"flex",gap:"clamp(2px,0.5vw,7px)",justifyContent:"center"},children:R.map((e,a)=>t.jsx("span",{style:{fontSize:"clamp(22px,3.5vw,46px)",fontWeight:700,color:"rgba(255,255,255,.78)",letterSpacing:"clamp(4px,1vw,10px)",textTransform:"uppercase",opacity:o?1:0,animation:o?`letterUp .7s ${e.delay}s cubic-bezier(.2,.8,.2,1) both`:"none",display:"inline-block",fontFamily:"inherit"},children:e.ch},a))}),t.jsx("div",{style:{height:2,margin:"10px 0 8px",borderRadius:2,background:"linear-gradient(90deg,transparent,#B8860B,#D4A017,#fff,#D4A017,#B8860B,transparent)",boxShadow:"0 0 12px #D4A017,0 0 24px rgba(212,160,23,.4)",animation:s?"lineGrow .8s cubic-bezier(.2,.8,.2,1) both":"none",width:s?void 0:0}}),t.jsx("div",{style:{fontSize:"clamp(9px,1.4vw,13px)",fontWeight:700,color:"rgba(255,255,255,.5)",letterSpacing:"clamp(3px,.8vw,8px)",textTransform:"uppercase",opacity:f?1:0,animation:f?"slideUp .6s cubic-bezier(.2,.8,.2,1) both":"none"},children:"Plataforma Cl\xEDnica Inteligente"})]}),g&&t.jsxs("div",{style:{position:"absolute",top:"clamp(24px,8vh,60px)",left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:12,zIndex:7},children:[t.jsxs("div",{style:{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"},children:[[1,2,3].map(e=>t.jsx("div",{style:{position:"absolute",top:"50%",left:"50%",width:100+e*22,height:100+e*22,borderRadius:"50%",border:`${2/e}px solid rgba(212,160,23,${.6/e})`,animation:`ringPulse ${1.2+e*.4}s ${e*.25}s ease-out infinite`,pointerEvents:"none"}},e)),t.jsxs("div",{style:{width:88,height:88,borderRadius:"50%",overflow:"hidden",border:"3px solid #D4A017",boxShadow:"0 0 0 4px rgba(184,134,11,.25),0 0 40px rgba(212,160,23,.7),0 0 80px rgba(184,134,11,.35)",animation:"photoIn .9s cubic-bezier(.175,.885,.32,1.275) both",flexShrink:0,background:"linear-gradient(135deg,#0a1628,#162d54)"},children:[t.jsx("img",{src:"/apac-oncologia/foto-silas.jpg",alt:"Dr. Silas",onError:()=>k(!0),style:{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top center",display:x?"none":"block"}}),x&&t.jsx("div",{style:{width:"100%",height:"100%",background:"linear-gradient(135deg,#1B365D,#2B7A8C)",display:"grid",placeItems:"center",fontSize:38},children:"\u2695"})]})]}),z&&t.jsxs("div",{style:{textAlign:"center",animation:"creditIn .65s cubic-bezier(.175,.885,.32,1.275) both"},children:[t.jsx("div",{style:{fontSize:"clamp(8px,1.1vw,11px)",fontWeight:700,color:"rgba(255,255,255,.4)",letterSpacing:4,textTransform:"uppercase",marginBottom:4},children:"Criado por"}),t.jsx("div",{style:{fontSize:"clamp(13px,2vw,20px)",fontWeight:900,letterSpacing:1,background:"linear-gradient(90deg, #B8860B 0%, #fff 25%, #D4A017 40%, #fff 55%, #FFD700 70%, #D4A017 85%, #B8860B 100%)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",animation:"shimmer 2.5s linear infinite, nameGlow 2s ease-in-out 1s infinite",WebkitTextFillColor:"transparent"},children:"Dr. Silas Negr\xE3o Serra Jr."}),t.jsx("div",{style:{fontSize:"clamp(8px,.9vw,10px)",fontWeight:700,color:"rgba(184,134,11,.6)",letterSpacing:3,textTransform:"uppercase",marginTop:3},children:"CRM-PB 17341 \xB7 Oncologista Cl\xEDnico"})]})]}),t.jsxs("div",{style:{position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:8,display:"flex",flexDirection:"column",alignItems:"center",gap:8,opacity:p?1:0,pointerEvents:p?"auto":"none",animation:p?"btnIn .7s cubic-bezier(.2,.8,.2,1) both":"none"},children:[t.jsxs("div",{style:{position:"relative"},children:[t.jsx("div",{style:{position:"absolute",inset:-14,borderRadius:50,border:"1.5px solid rgba(212,160,23,.3)",animation:"ringPulse 2s ease infinite",pointerEvents:"none"}}),t.jsx("button",{onClick:d,style:{background:"linear-gradient(135deg,#B8860B 0%,#D4A017 50%,#B8860B 100%)",backgroundSize:"200% auto",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:900,color:"#fff",letterSpacing:3,textTransform:"uppercase",padding:"13px 46px",borderRadius:50,boxShadow:"0 6px 28px rgba(184,134,11,.5),0 2px 8px rgba(0,0,0,.5)",transition:"transform .18s ease,box-shadow .18s ease"},onMouseEnter:e=>{e.currentTarget.style.transform="scale(1.07)",e.currentTarget.style.boxShadow="0 10px 40px rgba(184,134,11,.7),0 2px 8px rgba(0,0,0,.5)"},onMouseLeave:e=>{e.currentTarget.style.transform="scale(1)",e.currentTarget.style.boxShadow="0 6px 28px rgba(184,134,11,.5),0 2px 8px rgba(0,0,0,.5)"},children:"\u25B6 \xA0Entrar"})]}),t.jsx("div",{style:{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.2)",letterSpacing:2,textTransform:"uppercase"},children:"Toque para entrar \xB7 entrada autom\xE1tica em breve"})]}),t.jsx("button",{onClick:d,style:{position:"absolute",top:16,right:16,zIndex:9,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:20,padding:"5px 14px",color:"rgba(255,255,255,.35)",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",transition:".2s"},onMouseEnter:e=>{e.currentTarget.style.background="rgba(255,255,255,.12)",e.currentTarget.style.color="rgba(255,255,255,.7)"},onMouseLeave:e=>{e.currentTarget.style.background="rgba(255,255,255,.06)",e.currentTarget.style.color="rgba(255,255,255,.35)"},children:"\u2715 Pular"})]})]})}export{C as default};
