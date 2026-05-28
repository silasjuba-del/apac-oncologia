import{r as l,j as t}from"./vendor-react-Ds7D3P6J.js";const G=`
/* Imagem voando em dire\xE7\xE3o ao telespectador */
@keyframes imgFly {
  0%   { transform:scale(.04) translateZ(0); opacity:0;   filter:blur(40px) brightness(2.5); }
  10%  { opacity:1; filter:blur(0) brightness(1.3); }
  65%  { transform:scale(1.06); filter:blur(0) brightness(1.05); }
  85%  { opacity:1; }
  100% { transform:scale(1.22); opacity:0; filter:blur(12px); }
}

/* Ken Burns lento para o v\xEDdeo de fundo */
@keyframes kenBurns {
  0%   { transform:scale(1.0); }
  100% { transform:scale(1.12); }
}

/* Part\xEDculas m\xE9dicas flutuando */
@keyframes floatUp {
  0%   { opacity:0; transform:translateY(0) scale(1) rotate(0deg); }
  15%  { opacity:.8; }
  85%  { opacity:.4; }
  100% { opacity:0; transform:translateY(-110vh) scale(1.6) rotate(20deg); }
}

/* Foto ghost emergindo atr\xE1s do t\xEDtulo */
@keyframes ghostIn {
  0%   { opacity:0; transform:scale(1.25); filter:blur(40px) grayscale(.6); }
  60%  { filter:blur(10px) grayscale(.3); }
  100% { opacity:1; transform:scale(1.0); filter:blur(8px) grayscale(.2); }
}

/* Letras "ONCOLOGIA INTEGRADA" subindo */
@keyframes letterRise {
  0%   { opacity:0; transform:translateY(90px) scale(.8); filter:blur(10px); }
  55%  { filter:blur(0); }
  100% { opacity:1; transform:translateY(0) scale(1); filter:blur(0); }
}

/* Brilho pulsante nas letras douradas */
@keyframes goldPulse {
  0%,100% { text-shadow: 0 0 30px #D4A017, 0 0 60px rgba(212,160,23,.5), 0 0 100px rgba(184,134,11,.3); }
  50%      { text-shadow: 0 0 60px #FFD700, 0 0 120px rgba(255,215,0,.8), 0 0 200px rgba(212,160,23,.6), 0 0 4px #fff; }
}

/* Shimmer dourado varrendo o texto */
@keyframes shimmerGold {
  0%   { background-position: -300% center; }
  100% { background-position: 300% center; }
}

/* "CRIADO POR DR SILAS" aparecendo */
@keyframes creditSlam {
  0%   { opacity:0; transform:scale(1.3) translateY(12px); filter:blur(12px); }
  60%  { filter:blur(0); }
  100% { opacity:1; transform:none; filter:blur(0); }
}

/* Linha dourada expandindo */
@keyframes lineExpand {
  from { width:0; opacity:0; }
  to   { width:min(500px,85vw); opacity:1; }
}

/* Anel pulsante ao redor da foto */
@keyframes ringOut {
  0%   { transform:translate(-50%,-50%) scale(1);   opacity:.8; }
  100% { transform:translate(-50%,-50%) scale(2.2); opacity:0; }
}

/* Bot\xE3o aparece */
@keyframes btnAppear {
  from { opacity:0; transform:translateY(16px) scale(.9); }
  to   { opacity:1; transform:none; }
}

/* Sa\xEDda zoom */
@keyframes exitZoom {
  0%   { opacity:1; transform:scale(1);   filter:blur(0) brightness(1); }
  100% { opacity:0; transform:scale(2.8); filter:blur(24px) brightness(2.5); }
}

/* Flash branco sa\xEDda */
@keyframes flashOut {
  0%   { opacity:0; }
  30%  { opacity:1; }
  100% { opacity:0; }
}

/* Overlay fadeIn */
@keyframes overlayIn {
  from { opacity:0; }
  to   { opacity:1; }
}

/* Nebulosa pulsando */
@keyframes nebulaPulse {
  0%,100% { opacity:.2; transform:scale(1); }
  50%     { opacity:.35; transform:scale(1.08); }
}

/* HUD corners piscando */
@keyframes hudBlink {
  0%,100% { opacity:.3; }
  50%     { opacity:.9; }
}

/* Video fadein */
@keyframes videoFade {
  from { opacity:0; }
  to   { opacity:1; }
}

/* Part\xEDcula celular voando */
@keyframes cellSpin {
  0%   { opacity:0; transform:scale(.1) rotate(0deg); filter:blur(4px); }
  30%  { opacity:.7; filter:blur(0); }
  70%  { opacity:.5; }
  100% { opacity:0; transform:scale(3.5) rotate(180deg); filter:blur(16px); }
}

/* Vibra\xE7\xE3o dram\xE1tica no brass hit */
@keyframes shake {
  0%,100% { transform:translateX(0); }
  20%     { transform:translateX(-4px); }
  40%     { transform:translateX(4px); }
  60%     { transform:translateX(-3px); }
  80%     { transform:translateX(3px); }
}
`,k="/apac-oncologia/",C=[{src:`${k}img1-metastase.jpg`,fallback:"linear-gradient(135deg, #8B0030 0%, #2B7A8C 50%, #B8860B 100%)",dur:2600,delay:200},{src:`${k}img2-medico.jpg`,fallback:"linear-gradient(135deg, #0a1628 0%, #1D4ED8 50%, #0a2040 100%)",dur:2600,delay:2400},{src:`${k}img3-ia.jpg`,fallback:"linear-gradient(135deg, #050d1a 0%, #0891B2 50%, #1B365D 100%)",dur:2600,delay:4600},{src:`${k}img4-quimio.jpg`,fallback:"linear-gradient(135deg, #1a1a2e 0%, #B8860B 40%, #2B7A8C 100%)",dur:2600,delay:6800}];function F(n,a){return n.split("").map((b,x)=>({c:b,d:a+x*80}))}const N=F("ONCOLOGIA",7600),X=F("INTEGRADA",8350),q=Array.from({length:48},(n,a)=>({key:a,left:Math.random()*100,size:Math.random()*6+1.5,color:["#D4A017","#B8860B","rgba(43,122,140,.7)","rgba(255,255,255,.35)","rgba(27,54,93,.6)"][a%5],dur:Math.random()*14+10,delay:Math.random()*12})),Y=[{l:8,t:12,s:80,c:"rgba(139,0,50,.75)",d:.2},{l:88,t:8,s:70,c:"rgba(80,10,100,.7)",d:.5},{l:5,t:72,s:90,c:"rgba(0,80,110,.7)",d:1},{l:88,t:70,s:75,c:"rgba(120,20,20,.75)",d:1.5},{l:48,t:4,s:65,c:"rgba(60,0,80,.65)",d:.8},{l:50,t:88,s:80,c:"rgba(100,0,40,.7)",d:.3},{l:25,t:42,s:55,c:"rgba(0,60,90,.6)",d:1.2}];function H(n){const a=n.currentTime,b=n.createConvolver(),x=Math.floor(n.sampleRate*5),j=n.createBuffer(2,x,n.sampleRate);for(let r=0;r<2;r++){const o=j.getChannelData(r);for(let s=0;s<x;s++)o[s]=(Math.random()*2-1)*Math.exp(-4.5*s/x)}b.buffer=j;const c=n.createGain();c.connect(n.destination),c.gain.setValueAtTime(0,a),c.gain.linearRampToValueAtTime(.75,a+3),c.gain.setValueAtTime(.75,a+13),c.gain.linearRampToValueAtTime(0,a+17);const w=n.createGain();w.gain.setValueAtTime(.55,a),b.connect(w),w.connect(c);function p(r,o,s,d="sine",y=.2){const g=n.createOscillator(),u=n.createGain();g.type=d,g.frequency.setValueAtTime(r,a+o),u.gain.setValueAtTime(0,a+o),u.gain.linearRampToValueAtTime(y,a+o+.08),u.gain.setValueAtTime(y,a+s-.4),u.gain.linearRampToValueAtTime(0,a+s),g.connect(u),u.connect(c),u.connect(b),g.start(a+o),g.stop(a+s)}function h(r,o,s=120,d=.28){const y=Math.floor(n.sampleRate*(o-r)),g=n.createBuffer(1,y,n.sampleRate),u=g.getChannelData(0);for(let E=0;E<y;E++)u[E]=Math.random()*2-1;const v=n.createBufferSource();v.buffer=g;const S=n.createBiquadFilter();S.type="lowpass",S.frequency.value=s;const m=n.createGain();m.gain.setValueAtTime(0,a+r),m.gain.linearRampToValueAtTime(d,a+r+.04),m.gain.setValueAtTime(d,a+o-.4),m.gain.linearRampToValueAtTime(0,a+o),v.connect(S),S.connect(m),m.connect(c),v.start(a+r)}return p(27.5,0,17,"sawtooth",.22),p(55,0,17,"sawtooth",.18),p(110,0,17,"sine",.12),h(0,17,80,.2),[.4,2,3.6,5.2,6.8].forEach(r=>{h(r,r+.1,70,.55),h(r+.2,r+.32,55,.38)}),[220,247,277,311,330,370,415,440].forEach((r,o)=>{p(r,2+o*.55,8,"sawtooth",.055+o*.008),p(r*1.004,2+o*.55,8,"sawtooth",.04)}),[110,138.6,165,220,277,330,415,440].forEach((r,o)=>{const s=n.createOscillator(),d=n.createGain();s.type="sawtooth",s.frequency.setValueAtTime(r,a+7.5),d.gain.setValueAtTime(.38,a+7.5),d.gain.exponentialRampToValueAtTime(.01,a+11),s.connect(d),d.connect(c),d.connect(b),s.start(a+7.5),s.stop(a+11.5)}),h(7.5,7.7,200,.6),h(7.52,7.65,60,.5),[[440,"A4"],[554,"C#5"],[659,"E5"],[880,"A5"],[1109,"C#6"]].forEach(([r],o)=>{p(r,8.5+o*.12,16,"sawtooth",.09),p(r*1.003,8.5+o*.12,16,"sawtooth",.06),p(r*.997,8.5+o*.12,16,"sawtooth",.05)}),[1760,2093,2349,2637,3136].forEach((r,o)=>{p(r,10+o*.09,16,"sine",.038)}),c}function Z({onConcluir:n}){const[a,b]=l.useState(-1),[x,j]=l.useState(!1),[c,w]=l.useState(!1),[p,h]=l.useState(!1),[z,r]=l.useState(!1),[o,s]=l.useState(!1),[d,y]=l.useState(!1),[g,u]=l.useState(!1),[v,S]=l.useState(!1),[m,E]=l.useState(!1),[I,$]=l.useState(!1),[V,R]=l.useState(!1),[L,O]=l.useState({}),D=l.useRef(null),T=l.useRef(null),B=l.useRef([]),f=l.useCallback((e,i)=>{const W=setTimeout(i,e);B.current.push(W)},[]);l.useEffect(()=>(C.forEach((e,i)=>{f(e.delay,()=>b(i))}),f(7200,()=>{b(-1),j(!0);const e=D.current;e&&(e.muted=!0,e.play().catch(()=>{}))}),f(7500,()=>{w(!0),setTimeout(()=>w(!1),500)}),f(7600,()=>h(!0)),f(7700,()=>r(!0)),f(9200,()=>s(!0)),f(9700,()=>y(!0)),f(10200,()=>u(!0)),f(12e3,()=>S(!0)),f(16500,()=>A()),()=>B.current.forEach(clearTimeout)),[]);function M(){if(!T.current)try{const e=new(window.AudioContext||window.webkitAudioContext);T.current=H(e)}catch{}}function A(){if(B.current.forEach(clearTimeout),T.current)try{T.current.gain.linearRampToValueAtTime(0,T.current.context.currentTime+.5)}catch{}R(!0),setTimeout(()=>R(!1),180),$(!0),setTimeout(n,750)}const P=e=>O(i=>({...i,[e]:!0}));return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:G}),V&&t.jsx("div",{style:{position:"fixed",inset:0,zIndex:99999,background:"#fff",animation:"flashOut .18s ease both",pointerEvents:"none"}}),t.jsxs("div",{onClick:M,style:{position:"fixed",inset:0,zIndex:9990,overflow:"hidden",background:"radial-gradient(ellipse at 50% 40%, #0a1628 0%, #020810 100%)",fontFamily:"system-ui, sans-serif",animation:I?"exitZoom .75s cubic-bezier(.4,0,.2,1) both":"none"},children:[t.jsx("video",{ref:D,muted:!0,playsInline:!0,loop:!0,preload:"auto",src:`${k}abertura2.mp4`,style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,opacity:x?1:0,filter:"brightness(.35) saturate(1.3)",transition:"opacity 1.5s ease",animation:x?"kenBurns 20s linear both":"none"}}),t.jsx("div",{style:{position:"absolute",inset:0,zIndex:1,pointerEvents:"none",background:"radial-gradient(ellipse at center, transparent 30%, rgba(2,8,16,.85) 100%)"}}),t.jsx("div",{style:{position:"absolute",inset:0,zIndex:1,pointerEvents:"none",background:"radial-gradient(ellipse 70% 55% at 30% 55%, rgba(43,122,140,.2) 0%, transparent 60%),radial-gradient(ellipse 55% 50% at 68% 32%, rgba(27,54,93,.25) 0%, transparent 55%)",animation:"nebulaPulse 7s ease-in-out infinite"}}),t.jsx("div",{style:{position:"absolute",inset:0,zIndex:1,pointerEvents:"none",backgroundImage:"radial-gradient(circle, rgba(184,134,11,.1) 1px, transparent 1px)",backgroundSize:"42px 42px"}}),Y.map((e,i)=>t.jsx("div",{style:{position:"absolute",left:`${e.l}%`,top:`${e.t}%`,width:e.s,height:e.s,background:`radial-gradient(circle at 32% 32%, ${e.c}, rgba(0,0,0,.9))`,borderRadius:"58% 42% 54% 46% / 44% 56% 38% 62%",boxShadow:`0 0 30px ${e.c}`,animation:`cellSpin 2.2s ${e.d}s cubic-bezier(.2,.8,.2,1) both`,zIndex:2,pointerEvents:"none"},children:t.jsx("div",{style:{position:"absolute",top:"24%",left:"27%",width:"45%",height:"45%",borderRadius:"50%",background:"rgba(255,255,255,.14)"}})},i)),t.jsx("div",{style:{position:"absolute",inset:0,zIndex:2,pointerEvents:"none",overflow:"hidden"},children:q.map(e=>t.jsx("div",{style:{position:"absolute",borderRadius:"50%",width:e.size,height:e.size,left:`${e.left}%`,bottom:"-4%",background:e.color,animation:`floatUp ${e.dur}s ${e.delay}s linear infinite`}},e.key))}),C.map((e,i)=>a===i&&t.jsxs("div",{style:{position:"absolute",inset:0,zIndex:3,animation:"imgFly 2.6s cubic-bezier(.2,.8,.2,1) both",pointerEvents:"none"},children:[L[i]?t.jsx("div",{style:{width:"100%",height:"100%",background:e.fallback,display:"flex",alignItems:"center",justifyContent:"center",fontSize:120,opacity:.6},children:"\u{1F9EC}"}):t.jsx("img",{src:e.src,alt:"",onError:()=>P(i),style:{width:"100%",height:"100%",objectFit:"cover"}}),t.jsx("div",{style:{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,.5) 0%,transparent 30%,transparent 65%,rgba(0,0,0,.8) 100%)"}})]},i)),[{top:20,left:20,borderTop:"1.5px solid rgba(212,160,23,.6)",borderLeft:"1.5px solid rgba(212,160,23,.6)"},{top:20,right:20,borderTop:"1.5px solid rgba(212,160,23,.6)",borderRight:"1.5px solid rgba(212,160,23,.6)"},{bottom:20,left:20,borderBottom:"1.5px solid rgba(212,160,23,.6)",borderLeft:"1.5px solid rgba(212,160,23,.6)"},{bottom:20,right:20,borderBottom:"1.5px solid rgba(212,160,23,.6)",borderRight:"1.5px solid rgba(212,160,23,.6)"}].map((e,i)=>t.jsx("div",{style:{position:"absolute",width:30,height:30,zIndex:8,...e,animation:`hudBlink ${2+i*.3}s ease-in-out infinite`,animationDelay:`${i*.25}s`}},i)),p&&t.jsx("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",animation:"ghostIn 2s cubic-bezier(.2,.8,.2,1) both",pointerEvents:"none"},children:m?t.jsx("div",{style:{width:"min(480px,70vw)",height:"min(480px,70vw)",borderRadius:"50%",background:"radial-gradient(circle, rgba(212,160,23,.15), transparent 70%)",fontSize:180,opacity:.18,display:"grid",placeItems:"center"},children:"\u2695"}):t.jsx("img",{src:`${k}foto-silas.jpg`,alt:"",onError:()=>E(!0),style:{width:"min(480px,70vw)",height:"min(480px,70vw)",objectFit:"cover",objectPosition:"top center",borderRadius:"50%",opacity:.22,filter:"blur(8px) grayscale(.25) sepia(.2)",mixBlendMode:"luminosity"}})}),z&&t.jsxs("div",{style:{position:"absolute",bottom:130,left:0,right:0,zIndex:6,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4,animation:c?"shake .5s ease both":"none",pointerEvents:"none"},children:[t.jsx("div",{style:{display:"flex",gap:"clamp(1px,.5vw,7px)",justifyContent:"center"},children:N.map((e,i)=>t.jsx("span",{style:{fontSize:"clamp(38px,7vw,90px)",fontWeight:950,display:"inline-block",animation:`letterRise .75s ${e.d}ms cubic-bezier(.2,.8,.2,1) both`,background:"linear-gradient(180deg, #FFF8DC 0%, #FFD700 30%, #D4A017 60%, #B8860B 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",filter:"drop-shadow(0 0 8px rgba(212,160,23,.9))"},children:e.c},i))}),t.jsx("div",{style:{display:"flex",gap:"clamp(2px,.6vw,9px)",justifyContent:"center"},children:X.map((e,i)=>t.jsx("span",{style:{fontSize:"clamp(22px,4vw,52px)",fontWeight:700,display:"inline-block",letterSpacing:"clamp(4px,1vw,12px)",animation:`letterRise .75s ${e.d}ms cubic-bezier(.2,.8,.2,1) both`,background:"linear-gradient(180deg, #fff 0%, rgba(255,215,0,.9) 50%, rgba(212,160,23,.8) 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",filter:"drop-shadow(0 0 5px rgba(212,160,23,.7))"},children:e.c},i))}),o&&t.jsx("div",{style:{position:"absolute",inset:"-20px -40px",borderRadius:20,pointerEvents:"none",animation:"goldPulse 2s ease-in-out infinite",zIndex:-1}}),t.jsx("div",{style:{height:2.5,margin:"12px 0 10px",borderRadius:2,background:"linear-gradient(90deg,transparent,#B8860B,#FFD700,#fff,#FFD700,#B8860B,transparent)",boxShadow:"0 0 16px #D4A017, 0 0 32px rgba(212,160,23,.5)",animation:o?"lineExpand .9s cubic-bezier(.2,.8,.2,1) both":"none",width:o?void 0:0}}),t.jsx("div",{style:{fontSize:"clamp(9px,1.3vw,13px)",fontWeight:700,color:"rgba(255,255,255,.5)",letterSpacing:"clamp(4px,.9vw,9px)",textTransform:"uppercase",opacity:d?1:0,transition:"opacity .8s ease"},children:"Plataforma Cl\xEDnica Inteligente"})]}),g&&t.jsxs("div",{style:{position:"absolute",top:"clamp(16px,6vh,50px)",left:"50%",transform:"translateX(-50%)",zIndex:7,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:8,animation:"creditSlam .7s cubic-bezier(.175,.885,.32,1.275) both",width:"90vw",maxWidth:700},children:[t.jsxs("div",{style:{position:"relative",marginBottom:4},children:[[1,2,3].map(e=>t.jsx("div",{style:{position:"absolute",top:"50%",left:"50%",width:82+e*24,height:82+e*24,borderRadius:"50%",border:`${2/e}px solid rgba(212,160,23,${.65/e})`,animation:`ringOut ${1.2+e*.35}s ${e*.22}s ease-out infinite`,pointerEvents:"none"}},e)),t.jsx("div",{style:{width:76,height:76,borderRadius:"50%",overflow:"hidden",border:"2.5px solid #D4A017",boxShadow:"0 0 0 4px rgba(184,134,11,.2), 0 0 40px rgba(212,160,23,.8), 0 0 80px rgba(184,134,11,.4)",background:"linear-gradient(135deg,#0a1628,#162d54)"},children:m?t.jsx("div",{style:{width:"100%",height:"100%",background:"linear-gradient(135deg,#1B365D,#2B7A8C)",display:"grid",placeItems:"center",fontSize:36},children:"\u2695"}):t.jsx("img",{src:`${k}foto-silas.jpg`,alt:"Dr. Silas",onError:()=>E(!0),style:{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top center"}})})]}),t.jsx("div",{style:{fontSize:"clamp(9px,1.2vw,12px)",fontWeight:800,color:"rgba(255,255,255,.45)",letterSpacing:6,textTransform:"uppercase"},children:"Criado por"}),t.jsx("div",{style:{fontSize:"clamp(22px,4.5vw,58px)",fontWeight:950,letterSpacing:"-0.5px",lineHeight:1.05,background:"linear-gradient(90deg, #8B6010 0%, #B8860B 10%, #D4A017 25%, #FFD700 40%, #FFF8DC 50%, #FFD700 60%, #D4A017 75%, #B8860B 90%, #8B6010 100%)",backgroundSize:"300% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",animation:"shimmerGold 3s linear infinite",filter:"drop-shadow(0 0 12px rgba(255,215,0,.8)) drop-shadow(0 2px 20px rgba(184,134,11,.6))"},children:"Dr. Silas Negr\xE3o Serra Jr."}),t.jsx("div",{style:{fontSize:"clamp(9px,1.1vw,12px)",fontWeight:700,color:"rgba(212,160,23,.7)",letterSpacing:3,textTransform:"uppercase",marginTop:2},children:"CRM-PB 17341 \xB7 Oncologista Cl\xEDnico \xB7 Patos/PB"})]}),t.jsxs("div",{style:{position:"absolute",bottom:22,left:"50%",transform:"translateX(-50%)",zIndex:9,display:"flex",flexDirection:"column",alignItems:"center",gap:8,opacity:v?1:0,pointerEvents:v?"auto":"none",animation:v?"btnAppear .8s cubic-bezier(.2,.8,.2,1) both":"none"},children:[t.jsxs("div",{style:{position:"relative"},children:[t.jsx("div",{style:{position:"absolute",inset:-16,borderRadius:50,border:"1.5px solid rgba(212,160,23,.35)",animation:"ringOut 2s ease infinite",pointerEvents:"none"}}),t.jsx("button",{onClick:A,style:{background:"linear-gradient(135deg,#B8860B 0%,#D4A017 40%,#FFD700 60%,#B8860B 100%)",backgroundSize:"200% auto",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:900,color:"#0a0f1e",letterSpacing:3,textTransform:"uppercase",padding:"13px 50px",borderRadius:50,boxShadow:"0 6px 32px rgba(184,134,11,.6), 0 2px 8px rgba(0,0,0,.5)",animation:"shimmerGold 2s linear infinite",transition:"transform .18s ease, box-shadow .18s ease"},onMouseEnter:e=>{e.currentTarget.style.transform="scale(1.08)",e.currentTarget.style.boxShadow="0 10px 50px rgba(255,215,0,.8), 0 2px 10px rgba(0,0,0,.5)"},onMouseLeave:e=>{e.currentTarget.style.transform="scale(1)",e.currentTarget.style.boxShadow="0 6px 32px rgba(184,134,11,.6), 0 2px 8px rgba(0,0,0,.5)"},children:"\u25B6 \xA0ENTRAR"})]}),t.jsx("div",{style:{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.2)",letterSpacing:2,textTransform:"uppercase"},children:"Toque para entrar \xB7 entrada autom\xE1tica em instantes"})]}),t.jsx("button",{onClick:A,style:{position:"absolute",top:14,right:14,zIndex:10,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.12)",borderRadius:20,padding:"5px 14px",color:"rgba(255,255,255,.3)",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",transition:".2s"},onMouseEnter:e=>{e.currentTarget.style.background="rgba(255,255,255,.1)",e.currentTarget.style.color="rgba(255,255,255,.65)"},onMouseLeave:e=>{e.currentTarget.style.background="rgba(255,255,255,.05)",e.currentTarget.style.color="rgba(255,255,255,.3)"},children:"\u2715 Pular"})]})]})}export{Z as default};
