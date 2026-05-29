import{r as s,j as e}from"./vendor-react-Ds7D3P6J.js";const L=`
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
`,C="/apac-oncologia/",S=r=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(r)}`,V=S(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%"><stop offset="0%" stop-color="#1a0010"/><stop offset="100%" stop-color="#030003"/></radialGradient>
    <radialGradient id="c1" cx="40%" cy="40%"><stop offset="0%" stop-color="#cc1133"/><stop offset="100%" stop-color="#6b0018"/></radialGradient>
    <radialGradient id="c2" cx="40%" cy="40%"><stop offset="0%" stop-color="#ff4466"/><stop offset="100%" stop-color="#990022"/></radialGradient>
    <radialGradient id="c3" cx="40%" cy="40%"><stop offset="0%" stop-color="#dd2244"/><stop offset="100%" stop-color="#7a0015"/></radialGradient>
    <filter id="gl"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <ellipse cx="400" cy="300" rx="420" ry="320" fill="#12000a" opacity=".6"/>
  <!-- C\xE9lula principal -->
  <ellipse cx="400" cy="295" rx="170" ry="155" fill="url(#c1)" opacity=".92" filter="url(#gl)"/>
  <ellipse cx="390" cy="288" rx="65" ry="58" fill="#3a000d" opacity=".85"/>
  <circle cx="383" cy="284" r="28" fill="#cc1133" opacity=".75"/>
  <!-- Proje\xE7\xF5es invasivas (tent\xE1culos) -->
  <path d="M570 280 Q650 240 720 210" stroke="#cc1133" stroke-width="6" fill="none" opacity=".7"/>
  <ellipse cx="738" cy="204" rx="38" ry="32" fill="url(#c3)" opacity=".8" filter="url(#gl)"/>
  <path d="M560 340 Q640 390 700 430" stroke="#dd2244" stroke-width="5" fill="none" opacity=".6"/>
  <ellipse cx="715" cy="445" rx="30" ry="25" fill="url(#c2)" opacity=".75"/>
  <path d="M230 260 Q155 210 90 175" stroke="#cc1133" stroke-width="5" fill="none" opacity=".6"/>
  <ellipse cx="74" cy="168" rx="32" ry="27" fill="url(#c3)" opacity=".75"/>
  <path d="M250 350 Q170 410 110 455" stroke="#dd2244" stroke-width="4" fill="none" opacity=".55"/>
  <ellipse cx="96" cy="465" rx="25" ry="22" fill="url(#c2)" opacity=".7"/>
  <path d="M390 130 Q380 60 370 20" stroke="#cc1133" stroke-width="4" fill="none" opacity=".5"/>
  <ellipse cx="368" cy="10" rx="22" ry="18" fill="url(#c3)" opacity=".65"/>
  <path d="M410 470 Q420 540 430 580" stroke="#dd2244" stroke-width="4" fill="none" opacity=".5"/>
  <ellipse cx="432" cy="590" rx="22" ry="16" fill="url(#c2)" opacity=".6"/>
  <!-- Micro c\xE9lulas sat\xE9lite -->
  <circle cx="620" cy="155" r="18" fill="#cc1133" opacity=".5"/>
  <circle cx="168" cy="490" r="15" fill="#dd2244" opacity=".45"/>
  <circle cx="680" cy="490" r="13" fill="#ff4466" opacity=".4"/>
  <circle cx="130" cy="130" r="11" fill="#cc1133" opacity=".4"/>
  <!-- Glow central -->
  <ellipse cx="400" cy="295" rx="80" ry="70" fill="#ff0033" opacity=".08"/>
  <!-- Texto m\xE9dico HUD -->
  <text x="22" y="38" font-family="monospace" font-size="11" fill="#cc1133" opacity=".6">MET\xC1STASE \xB7 CARCINOMA INVASIVO</text>
  <text x="22" y="580" font-family="monospace" font-size="10" fill="#cc1133" opacity=".45">CEL-ID:A2B7 \xB7 INVAS\xC3O VASCULAR DETECTADA</text>
</svg>`),P=S(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#020a18"/><stop offset="100%" stop-color="#040c24"/></linearGradient>
    <linearGradient id="xr" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#c8e6f8" stop-opacity=".85"/><stop offset="100%" stop-color="#4a9cc8" stop-opacity=".6"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="xglow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <!-- Grade HUD de fundo -->
  <line x1="0" y1="100" x2="800" y2="100" stroke="#1D4ED8" stroke-width=".4" opacity=".3"/>
  <line x1="0" y1="200" x2="800" y2="200" stroke="#1D4ED8" stroke-width=".4" opacity=".3"/>
  <line x1="0" y1="300" x2="800" y2="300" stroke="#1D4ED8" stroke-width=".4" opacity=".3"/>
  <line x1="0" y1="400" x2="800" y2="400" stroke="#1D4ED8" stroke-width=".4" opacity=".3"/>
  <line x1="0" y1="500" x2="800" y2="500" stroke="#1D4ED8" stroke-width=".4" opacity=".3"/>
  <line x1="160" y1="0" x2="160" y2="600" stroke="#1D4ED8" stroke-width=".4" opacity=".3"/>
  <line x1="320" y1="0" x2="320" y2="600" stroke="#1D4ED8" stroke-width=".4" opacity=".3"/>
  <line x1="480" y1="0" x2="480" y2="600" stroke="#1D4ED8" stroke-width=".4" opacity=".3"/>
  <line x1="640" y1="0" x2="640" y2="600" stroke="#1D4ED8" stroke-width=".4" opacity=".3"/>
  <!-- Painel raio-X (t\xF3rax) -->
  <rect x="220" y="60" width="360" height="480" rx="4" fill="#030b1a" stroke="#3a7abf" stroke-width="1.5" opacity=".9"/>
  <rect x="228" y="68" width="344" height="464" rx="2" fill="#040e20" opacity=".95"/>
  <!-- Costelas -->
  <path d="M340 160 Q290 170 265 195 Q255 215 270 230" stroke="#b8d8f0" stroke-width="2.5" fill="none" opacity=".75"/>
  <path d="M340 180 Q285 192 258 218 Q246 240 262 256" stroke="#b8d8f0" stroke-width="2.5" fill="none" opacity=".7"/>
  <path d="M340 200 Q282 214 254 243 Q240 268 258 284" stroke="#b8d8f0" stroke-width="2.2" fill="none" opacity=".65"/>
  <path d="M340 220 Q280 236 250 268 Q235 295 255 312" stroke="#b8d8f0" stroke-width="2" fill="none" opacity=".6"/>
  <path d="M340 240 Q280 258 248 292 Q232 322 252 340" stroke="#b8d8f0" stroke-width="1.8" fill="none" opacity=".55"/>
  <path d="M460 160 Q510 170 535 195 Q545 215 530 230" stroke="#b8d8f0" stroke-width="2.5" fill="none" opacity=".75"/>
  <path d="M460 180 Q515 192 542 218 Q554 240 538 256" stroke="#b8d8f0" stroke-width="2.5" fill="none" opacity=".7"/>
  <path d="M460 200 Q518 214 546 243 Q560 268 542 284" stroke="#b8d8f0" stroke-width="2.2" fill="none" opacity=".65"/>
  <path d="M460 220 Q520 236 550 268 Q565 295 545 312" stroke="#b8d8f0" stroke-width="2" fill="none" opacity=".6"/>
  <path d="M460 240 Q520 258 552 292 Q568 322 548 340" stroke="#b8d8f0" stroke-width="1.8" fill="none" opacity=".55"/>
  <!-- Coluna vertebral -->
  <rect x="393" y="130" width="14" height="12" rx="2" fill="#c8e0f0" opacity=".8"/>
  <rect x="393" y="148" width="14" height="11" rx="2" fill="#c8e0f0" opacity=".77"/>
  <rect x="393" y="165" width="14" height="11" rx="2" fill="#c8e0f0" opacity=".74"/>
  <rect x="393" y="182" width="14" height="11" rx="2" fill="#c8e0f0" opacity=".71"/>
  <rect x="393" y="199" width="14" height="11" rx="2" fill="#c8e0f0" opacity=".68"/>
  <rect x="393" y="216" width="14" height="11" rx="2" fill="#c8e0f0" opacity=".65"/>
  <rect x="393" y="233" width="14" height="12" rx="2" fill="#c8e0f0" opacity=".62"/>
  <rect x="393" y="251" width="14" height="11" rx="2" fill="#c8e0f0" opacity=".59"/>
  <rect x="393" y="268" width="14" height="11" rx="2" fill="#c8e0f0" opacity=".56"/>
  <rect x="393" y="285" width="14" height="11" rx="2" fill="#c8e0f0" opacity=".53"/>
  <rect x="393" y="302" width="14" height="12" rx="2" fill="#c8e0f0" opacity=".5"/>
  <!-- Pulm\xF5es -->
  <ellipse cx="340" cy="260" rx="55" ry="80" fill="#1a3d5a" opacity=".5"/>
  <ellipse cx="460" cy="260" rx="55" ry="80" fill="#1a3d5a" opacity=".5"/>
  <!-- N\xF3dulo suspeito destacado -->
  <circle cx="468" cy="215" r="14" fill="#ff6633" opacity=".5" filter="url(#xglow)"/>
  <circle cx="468" cy="215" r="9" fill="#ff4400" opacity=".7"/>
  <!-- Seta de diagn\xF3stico -->
  <line x1="510" y1="195" x2="484" y2="213" stroke="#FFD700" stroke-width="1.5" opacity=".8"/>
  <text x="515" y="192" font-family="monospace" font-size="10" fill="#FFD700" opacity=".85">N\xD3DULO</text>
  <!-- Cabe\xE7a/pesco\xE7o -->
  <path d="M380 80 Q380 65 400 58 Q420 65 420 80" stroke="#c8d8e8" stroke-width="2" fill="none" opacity=".6"/>
  <!-- Info HUD -->
  <text x="232" y="552" font-family="monospace" font-size="9" fill="#4a9cc8" opacity=".7">T\xD3RAX PA \xB7 120kV \xB7 200mA</text>
  <text x="445" y="552" font-family="monospace" font-size="9" fill="#4a9cc8" opacity=".5">ONCOLOGIA</text>
  <!-- Luz cir\xFArgica -->
  <circle cx="680" cy="120" r="55" fill="#f0f8ff" opacity=".03"/>
  <circle cx="680" cy="120" r="35" fill="#f0f8ff" opacity=".04"/>
</svg>`),$=S(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#010810"/><stop offset="100%" stop-color="#020c18"/></linearGradient>
    <radialGradient id="brain" cx="50%" cy="48%"><stop offset="0%" stop-color="#0a4060"/><stop offset="100%" stop-color="#020c18"/></radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glow2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <!-- C\xE9rebro digital simplificado -->
  <ellipse cx="400" cy="290" rx="180" ry="155" fill="url(#brain)" opacity=".9"/>
  <!-- Fissura central -->
  <path d="M400 140 Q398 200 400 290 Q402 380 400 440" stroke="#0891B2" stroke-width="1.5" fill="none" opacity=".5"/>
  <!-- Giros cerebrais esquerdo -->
  <path d="M240 240 Q260 210 295 220 Q320 230 330 260 Q340 285 310 295 Q280 305 265 285" stroke="#0891B2" stroke-width="2" fill="none" opacity=".6"/>
  <path d="M225 300 Q245 270 280 278 Q310 285 318 315 Q325 340 295 348 Q265 356 248 332" stroke="#0891B2" stroke-width="2" fill="none" opacity=".55"/>
  <path d="M235 360 Q258 335 290 345 Q315 355 320 382 Q325 405 298 412 Q272 418 252 395" stroke="#0891B2" stroke-width="1.8" fill="none" opacity=".5"/>
  <!-- Giros cerebrais direito -->
  <path d="M560 240 Q540 210 505 220 Q480 230 470 260 Q460 285 490 295 Q520 305 535 285" stroke="#0891B2" stroke-width="2" fill="none" opacity=".6"/>
  <path d="M575 300 Q555 270 520 278 Q490 285 482 315 Q475 340 505 348 Q535 356 552 332" stroke="#0891B2" stroke-width="2" fill="none" opacity=".55"/>
  <path d="M565 360 Q542 335 510 345 Q485 355 480 382 Q475 405 502 412 Q528 418 548 395" stroke="#0891B2" stroke-width="1.8" fill="none" opacity=".5"/>
  <!-- N\xF3s neurais brilhantes -->
  <circle cx="295" cy="225" r="5" fill="#00d4ff" opacity=".9" filter="url(#glow2)"/>
  <circle cx="290" cy="295" r="4" fill="#00d4ff" opacity=".8" filter="url(#glow2)"/>
  <circle cx="298" cy="355" r="5" fill="#00d4ff" opacity=".85" filter="url(#glow2)"/>
  <circle cx="505" cy="225" r="5" fill="#00d4ff" opacity=".9" filter="url(#glow2)"/>
  <circle cx="510" cy="295" r="4" fill="#00d4ff" opacity=".8" filter="url(#glow2)"/>
  <circle cx="502" cy="355" r="5" fill="#00d4ff" opacity=".85" filter="url(#glow2)"/>
  <circle cx="400" cy="200" r="6" fill="#00d4ff" opacity=".9" filter="url(#glow)"/>
  <circle cx="400" cy="380" r="6" fill="#00d4ff" opacity=".85" filter="url(#glow)"/>
  <!-- Conex\xF5es neurais pulsantes -->
  <line x1="295" y1="225" x2="400" y2="200" stroke="#00d4ff" stroke-width="1" opacity=".4"/>
  <line x1="505" y1="225" x2="400" y2="200" stroke="#00d4ff" stroke-width="1" opacity=".4"/>
  <line x1="290" y1="295" x2="400" y2="290" stroke="#00d4ff" stroke-width="1.5" opacity=".5"/>
  <line x1="510" y1="295" x2="400" y2="290" stroke="#00d4ff" stroke-width="1.5" opacity=".5"/>
  <line x1="298" y1="355" x2="400" y2="380" stroke="#00d4ff" stroke-width="1" opacity=".4"/>
  <line x1="502" y1="355" x2="400" y2="380" stroke="#00d4ff" stroke-width="1" opacity=".4"/>
  <!-- Circuito externo -->
  <rect x="350" y="440" width="100" height="40" rx="4" stroke="#0891B2" stroke-width="1.5" fill="none" opacity=".5"/>
  <line x1="400" y1="440" x2="400" y2="420" stroke="#0891B2" stroke-width="1.5" opacity=".5"/>
  <line x1="360" y1="480" x2="360" y2="510" stroke="#0891B2" stroke-width="1.5" opacity=".4"/>
  <line x1="440" y1="480" x2="440" y2="510" stroke="#0891B2" stroke-width="1.5" opacity=".4"/>
  <!-- Texto IA -->
  <text x="370" y="466" font-family="monospace" font-size="12" fill="#00d4ff" opacity=".8" font-weight="bold">AI\xB7ONCO</text>
  <!-- Dados fluindo -->
  <text x="30" y="40" font-family="monospace" font-size="9" fill="#0891B2" opacity=".5">01101000 01100101 01100001 01101100 01110100 01101000</text>
  <text x="30" y="570" font-family="monospace" font-size="9" fill="#0891B2" opacity=".45">NEURAL\xB7NET \xB7 ONCOLOGY\xB7AI \xB7 DEEP\xB7LEARNING \xB7 v4.2</text>
  <!-- Glow central -->
  <ellipse cx="400" cy="290" rx="60" ry="50" fill="#0891B2" opacity=".06"/>
</svg>`),U=S(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#08060a"/><stop offset="100%" stop-color="#0f0d14"/></linearGradient>
    <radialGradient id="bag" cx="50%" cy="40%"><stop offset="0%" stop-color="#2a1a40"/><stop offset="100%" stop-color="#110d1a"/></radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glow2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <!-- Fundo molecular -->
  <circle cx="100" cy="100" r="3" fill="#B8860B" opacity=".3"/>
  <circle cx="700" cy="80" r="3" fill="#B8860B" opacity=".3"/>
  <circle cx="150" cy="500" r="3" fill="#B8860B" opacity=".3"/>
  <circle cx="650" cy="520" r="3" fill="#B8860B" opacity=".3"/>
  <line x1="100" y1="100" x2="700" y2="80" stroke="#B8860B" stroke-width=".5" opacity=".15"/>
  <line x1="100" y1="100" x2="150" y2="500" stroke="#B8860B" stroke-width=".5" opacity=".15"/>
  <line x1="700" y1="80" x2="650" y2="520" stroke="#B8860B" stroke-width=".5" opacity=".15"/>
  <!-- Bolsa de quimio -->
  <ellipse cx="400" cy="170" rx="95" ry="115" fill="url(#bag)" stroke="#6a3d9a" stroke-width="1.5" opacity=".85"/>
  <ellipse cx="400" cy="165" rx="88" ry="108" fill="none" stroke="#8a5db8" stroke-width=".8" opacity=".4"/>
  <!-- L\xEDquido dentro -->
  <ellipse cx="400" cy="200" rx="72" ry="75" fill="#1a0d2e" opacity=".9"/>
  <ellipse cx="400" cy="210" rx="68" ry="60" fill="#220f38" opacity=".7"/>
  <!-- Brilho bolsa -->
  <ellipse cx="370" cy="120" rx="22" ry="32" fill="white" opacity=".06"/>
  <!-- Gancho / suporte -->
  <path d="M400 55 Q400 35 418 25 Q436 18 438 32" stroke="#c8b060" stroke-width="3" fill="none"/>
  <rect x="396" y="52" width="8" height="25" rx="2" fill="#c8b060" opacity=".8"/>
  <!-- Tubo de infus\xE3o -->
  <path d="M400 285 Q402 320 398 360 Q396 400 400 450 Q402 480 400 520 Q399 545 400 580" stroke="#8a6ab8" stroke-width="4" fill="none" opacity=".7"/>
  <!-- C\xE2mara de gotejamento -->
  <rect x="385" y="360" width="30" height="48" rx="8" fill="#1a0d2e" stroke="#8a5db8" stroke-width="1.5" opacity=".85"/>
  <ellipse cx="400" cy="398" rx="10" ry="14" fill="#3a1d60" opacity=".7"/>
  <!-- Gotas dentro da c\xE2mara -->
  <ellipse cx="400" cy="372" rx="3" ry="4" fill="#9b6dcc" opacity=".8"/>
  <ellipse cx="395" cy="388" rx="2.5" ry="3.5" fill="#9b6dcc" opacity=".65"/>
  <!-- Mol\xE9cula \xE0 esquerda (cisplatina estilizada) -->
  <circle cx="180" cy="300" r="22" fill="#2a1a40" stroke="#B8860B" stroke-width="2" opacity=".85" filter="url(#glow2)"/>
  <circle cx="180" cy="300" r="10" fill="#c8a020" opacity=".7"/>
  <text x="174" y="304" font-family="monospace" font-size="9" fill="#FFD700" opacity=".9">Pt</text>
  <circle cx="140" cy="265" r="12" fill="#2a1a40" stroke="#B8860B" stroke-width="1.5" opacity=".75"/>
  <text x="134" y="269" font-family="monospace" font-size="8" fill="#c8a020" opacity=".8">Cl</text>
  <circle cx="220" cy="265" r="12" fill="#2a1a40" stroke="#B8860B" stroke-width="1.5" opacity=".75"/>
  <text x="214" y="269" font-family="monospace" font-size="8" fill="#c8a020" opacity=".8">Cl</text>
  <circle cx="140" cy="335" r="12" fill="#2a1a40" stroke="#B8860B" stroke-width="1.5" opacity=".75"/>
  <text x="134" y="339" font-family="monospace" font-size="8" fill="#c8a020" opacity=".8">NH</text>
  <circle cx="220" cy="335" r="12" fill="#2a1a40" stroke="#B8860B" stroke-width="1.5" opacity=".75"/>
  <text x="214" y="339" font-family="monospace" font-size="8" fill="#c8a020" opacity=".8">NH</text>
  <line x1="180" y1="300" x2="140" y2="265" stroke="#B8860B" stroke-width="1.5" opacity=".6"/>
  <line x1="180" y1="300" x2="220" y2="265" stroke="#B8860B" stroke-width="1.5" opacity=".6"/>
  <line x1="180" y1="300" x2="140" y2="335" stroke="#B8860B" stroke-width="1.5" opacity=".6"/>
  <line x1="180" y1="300" x2="220" y2="335" stroke="#B8860B" stroke-width="1.5" opacity=".6"/>
  <!-- Label cisplatina -->
  <text x="145" y="370" font-family="monospace" font-size="9" fill="#FFD700" opacity=".6">CISPLATINA</text>
  <!-- Mol\xE9cula \xE0 direita (5-FU estilizada) -->
  <polygon points="620,270 650,255 680,270 680,300 650,315 620,300" fill="#1a0d2e" stroke="#2B7A8C" stroke-width="2" opacity=".85" filter="url(#glow2)"/>
  <text x="634" y="290" font-family="monospace" font-size="9" fill="#00d4d4" opacity=".9">5-FU</text>
  <circle cx="600" cy="240" r="10" fill="#1a0d2e" stroke="#2B7A8C" stroke-width="1.5" opacity=".7"/>
  <text x="594" y="244" font-family="monospace" font-size="7" fill="#2B7A8C" opacity=".8">F</text>
  <circle cx="700" cy="240" r="10" fill="#1a0d2e" stroke="#2B7A8C" stroke-width="1.5" opacity=".7"/>
  <text x="695" y="244" font-family="monospace" font-size="7" fill="#2B7A8C" opacity=".8">O</text>
  <line x1="620" y1="270" x2="600" y2="240" stroke="#2B7A8C" stroke-width="1.5" opacity=".55"/>
  <line x1="680" y1="270" x2="700" y2="240" stroke="#2B7A8C" stroke-width=".5" opacity=".55"/>
  <text x="608" y="330" font-family="monospace" font-size="9" fill="#00d4d4" opacity=".55">FLUORURACIL</text>
  <!-- HUD info -->
  <text x="22" y="38" font-family="monospace" font-size="10" fill="#B8860B" opacity=".6">QUIMIOTERAPIA SIST\xCAMICA \xB7 PROTOCOLO ATIVO</text>
  <text x="22" y="575" font-family="monospace" font-size="9" fill="#B8860B" opacity=".4">INFUS\xC3O CONTROLADA \xB7 ml/h \xB7 ONCOLOGIA CL\xCDNICA</text>
</svg>`),G=[{src:V,dur:2600,delay:200},{src:P,dur:2600,delay:2400},{src:$,dur:2600,delay:4600},{src:U,dur:2600,delay:6800}];function F(r,i){return r.split("").map((h,g)=>({c:h,d:i+g*80}))}const W=F("ONCOLOGIA",7600),q=F("INTEGRADA",8350),X=Array.from({length:48},(r,i)=>({key:i,left:Math.random()*100,size:Math.random()*6+1.5,color:["#D4A017","#B8860B","rgba(43,122,140,.7)","rgba(255,255,255,.35)","rgba(27,54,93,.6)"][i%5],dur:Math.random()*14+10,delay:Math.random()*12})),H=[{l:8,t:12,s:80,c:"rgba(139,0,50,.75)",d:.2},{l:88,t:8,s:70,c:"rgba(80,10,100,.7)",d:.5},{l:5,t:72,s:90,c:"rgba(0,80,110,.7)",d:1},{l:88,t:70,s:75,c:"rgba(120,20,20,.75)",d:1.5},{l:48,t:4,s:65,c:"rgba(60,0,80,.65)",d:.8},{l:50,t:88,s:80,c:"rgba(100,0,40,.7)",d:.3},{l:25,t:42,s:55,c:"rgba(0,60,90,.6)",d:1.2}];function Y(r){const i=r.currentTime,h=r.createConvolver(),g=Math.floor(r.sampleRate*5),A=r.createBuffer(2,g,r.sampleRate);for(let o=0;o<2;o++){const a=A.getChannelData(o);for(let l=0;l<g;l++)a[l]=(Math.random()*2-1)*Math.exp(-4.5*l/g)}h.buffer=A;const c=r.createGain();c.connect(r.destination),c.gain.setValueAtTime(0,i),c.gain.linearRampToValueAtTime(.75,i+3),c.gain.setValueAtTime(.75,i+13),c.gain.linearRampToValueAtTime(0,i+17);const w=r.createGain();w.gain.setValueAtTime(.55,i),h.connect(w),w.connect(c);function p(o,a,l,d="sine",m=.2){const x=r.createOscillator(),f=r.createGain();x.type=d,x.frequency.setValueAtTime(o,i+a),f.gain.setValueAtTime(0,i+a),f.gain.linearRampToValueAtTime(m,i+a+.08),f.gain.setValueAtTime(m,i+l-.4),f.gain.linearRampToValueAtTime(0,i+l),x.connect(f),f.connect(c),f.connect(h),x.start(i+a),x.stop(i+l)}function b(o,a,l=120,d=.28){const m=Math.floor(r.sampleRate*(a-o)),x=r.createBuffer(1,m,r.sampleRate),f=x.getChannelData(0);for(let v=0;v<m;v++)f[v]=Math.random()*2-1;const k=r.createBufferSource();k.buffer=x;const B=r.createBiquadFilter();B.type="lowpass",B.frequency.value=l;const u=r.createGain();u.gain.setValueAtTime(0,i+o),u.gain.linearRampToValueAtTime(d,i+o+.04),u.gain.setValueAtTime(d,i+a-.4),u.gain.linearRampToValueAtTime(0,i+a),k.connect(B),B.connect(u),u.connect(c),k.start(i+o)}return p(27.5,0,17,"sawtooth",.22),p(55,0,17,"sawtooth",.18),p(110,0,17,"sine",.12),b(0,17,80,.2),[.4,2,3.6,5.2,6.8].forEach(o=>{b(o,o+.1,70,.55),b(o+.2,o+.32,55,.38)}),[220,247,277,311,330,370,415,440].forEach((o,a)=>{p(o,2+a*.55,8,"sawtooth",.055+a*.008),p(o*1.004,2+a*.55,8,"sawtooth",.04)}),[110,138.6,165,220,277,330,415,440].forEach((o,a)=>{const l=r.createOscillator(),d=r.createGain();l.type="sawtooth",l.frequency.setValueAtTime(o,i+7.5),d.gain.setValueAtTime(.38,i+7.5),d.gain.exponentialRampToValueAtTime(.01,i+11),l.connect(d),d.connect(c),d.connect(h),l.start(i+7.5),l.stop(i+11.5)}),b(7.5,7.7,200,.6),b(7.52,7.65,60,.5),[[440,"A4"],[554,"C#5"],[659,"E5"],[880,"A5"],[1109,"C#6"]].forEach(([o],a)=>{p(o,8.5+a*.12,16,"sawtooth",.09),p(o*1.003,8.5+a*.12,16,"sawtooth",.06),p(o*.997,8.5+a*.12,16,"sawtooth",.05)}),[1760,2093,2349,2637,3136].forEach((o,a)=>{p(o,10+a*.09,16,"sine",.038)}),c}function K({onConcluir:r}){const[i,h]=s.useState(-1),[g,A]=s.useState(!1),[c,w]=s.useState(!1),[p,b]=s.useState(!1),[M,o]=s.useState(!1),[a,l]=s.useState(!1),[d,m]=s.useState(!1),[x,f]=s.useState(!1),[k,B]=s.useState(!1),[u,v]=s.useState(!1),[Q,j]=s.useState(!1),[R,z]=s.useState(!1),[_,Z]=s.useState({}),I=s.useRef(null),E=s.useRef(null),D=s.useRef([]),y=s.useCallback((t,n)=>{const N=setTimeout(n,t);D.current.push(N)},[]);s.useEffect(()=>(G.forEach((t,n)=>{y(t.delay,()=>h(n))}),y(7200,()=>{h(-1),A(!0);const t=I.current;t&&(t.muted=!0,t.play().catch(()=>{}))}),y(7500,()=>{w(!0),setTimeout(()=>w(!1),500)}),y(7600,()=>b(!0)),y(7700,()=>o(!0)),y(9200,()=>l(!0)),y(9700,()=>m(!0)),y(10200,()=>f(!0)),y(12e3,()=>B(!0)),y(16500,()=>T()),()=>D.current.forEach(clearTimeout)),[]);function O(){if(!E.current)try{const t=new(window.AudioContext||window.webkitAudioContext);E.current=Y(t)}catch{}}function T(){if(D.current.forEach(clearTimeout),E.current)try{E.current.gain.linearRampToValueAtTime(0,E.current.context.currentTime+.5)}catch{}z(!0),setTimeout(()=>z(!1),180),j(!0),setTimeout(r,750)}return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:L}),R&&e.jsx("div",{style:{position:"fixed",inset:0,zIndex:99999,background:"#fff",animation:"flashOut .18s ease both",pointerEvents:"none"}}),e.jsxs("div",{onClick:O,style:{position:"fixed",inset:0,zIndex:9990,overflow:"hidden",background:"radial-gradient(ellipse at 50% 40%, #0a1628 0%, #020810 100%)",fontFamily:"system-ui, sans-serif",animation:Q?"exitZoom .75s cubic-bezier(.4,0,.2,1) both":"none"},children:[e.jsx("video",{ref:I,muted:!0,playsInline:!0,loop:!0,preload:"auto",src:`${C}abertura3.mp4`,style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,opacity:g?1:0,filter:"brightness(.35) saturate(1.3)",transition:"opacity 1.5s ease",animation:g?"kenBurns 20s linear both":"none"}}),e.jsx("div",{style:{position:"absolute",inset:0,zIndex:1,pointerEvents:"none",background:"radial-gradient(ellipse at center, transparent 30%, rgba(2,8,16,.85) 100%)"}}),e.jsx("div",{style:{position:"absolute",inset:0,zIndex:1,pointerEvents:"none",background:"radial-gradient(ellipse 70% 55% at 30% 55%, rgba(43,122,140,.2) 0%, transparent 60%),radial-gradient(ellipse 55% 50% at 68% 32%, rgba(27,54,93,.25) 0%, transparent 55%)",animation:"nebulaPulse 7s ease-in-out infinite"}}),e.jsx("div",{style:{position:"absolute",inset:0,zIndex:1,pointerEvents:"none",backgroundImage:"radial-gradient(circle, rgba(184,134,11,.1) 1px, transparent 1px)",backgroundSize:"42px 42px"}}),H.map((t,n)=>e.jsx("div",{style:{position:"absolute",left:`${t.l}%`,top:`${t.t}%`,width:t.s,height:t.s,background:`radial-gradient(circle at 32% 32%, ${t.c}, rgba(0,0,0,.9))`,borderRadius:"58% 42% 54% 46% / 44% 56% 38% 62%",boxShadow:`0 0 30px ${t.c}`,animation:`cellSpin 2.2s ${t.d}s cubic-bezier(.2,.8,.2,1) both`,zIndex:2,pointerEvents:"none"},children:e.jsx("div",{style:{position:"absolute",top:"24%",left:"27%",width:"45%",height:"45%",borderRadius:"50%",background:"rgba(255,255,255,.14)"}})},n)),e.jsx("div",{style:{position:"absolute",inset:0,zIndex:2,pointerEvents:"none",overflow:"hidden"},children:X.map(t=>e.jsx("div",{style:{position:"absolute",borderRadius:"50%",width:t.size,height:t.size,left:`${t.left}%`,bottom:"-4%",background:t.color,animation:`floatUp ${t.dur}s ${t.delay}s linear infinite`}},t.key))}),G.map((t,n)=>i===n&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:3,animation:"imgFly 2.6s cubic-bezier(.2,.8,.2,1) both",pointerEvents:"none"},children:[e.jsx("img",{src:t.src,alt:"",style:{width:"100%",height:"100%",objectFit:"cover"}}),e.jsx("div",{style:{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,.5) 0%,transparent 30%,transparent 65%,rgba(0,0,0,.8) 100%)"}})]},n)),[{top:20,left:20,borderTop:"1.5px solid rgba(212,160,23,.6)",borderLeft:"1.5px solid rgba(212,160,23,.6)"},{top:20,right:20,borderTop:"1.5px solid rgba(212,160,23,.6)",borderRight:"1.5px solid rgba(212,160,23,.6)"},{bottom:20,left:20,borderBottom:"1.5px solid rgba(212,160,23,.6)",borderLeft:"1.5px solid rgba(212,160,23,.6)"},{bottom:20,right:20,borderBottom:"1.5px solid rgba(212,160,23,.6)",borderRight:"1.5px solid rgba(212,160,23,.6)"}].map((t,n)=>e.jsx("div",{style:{position:"absolute",width:30,height:30,zIndex:8,...t,animation:`hudBlink ${2+n*.3}s ease-in-out infinite`,animationDelay:`${n*.25}s`}},n)),p&&e.jsx("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",animation:"ghostIn 2s cubic-bezier(.2,.8,.2,1) both",pointerEvents:"none"},children:u?e.jsx("div",{style:{width:"min(480px,70vw)",height:"min(480px,70vw)",borderRadius:"50%",background:"radial-gradient(circle, rgba(212,160,23,.15), transparent 70%)",fontSize:180,opacity:.18,display:"grid",placeItems:"center"},children:"\u2695"}):e.jsx("img",{src:`${C}foto-silas.jpg`,alt:"",onError:()=>v(!0),style:{width:"min(480px,70vw)",height:"min(480px,70vw)",objectFit:"cover",objectPosition:"top center",borderRadius:"50%",opacity:.22,filter:"blur(8px) grayscale(.25) sepia(.2)",mixBlendMode:"luminosity"}})}),M&&e.jsxs("div",{style:{position:"absolute",bottom:130,left:0,right:0,zIndex:6,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4,animation:c?"shake .5s ease both":"none",pointerEvents:"none"},children:[e.jsx("div",{style:{display:"flex",gap:"clamp(1px,.5vw,7px)",justifyContent:"center"},children:W.map((t,n)=>e.jsx("span",{style:{fontSize:"clamp(38px,7vw,90px)",fontWeight:950,display:"inline-block",animation:`letterRise .75s ${t.d}ms cubic-bezier(.2,.8,.2,1) both`,background:"linear-gradient(180deg, #FFF8DC 0%, #FFD700 30%, #D4A017 60%, #B8860B 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",filter:"drop-shadow(0 0 8px rgba(212,160,23,.9))"},children:t.c},n))}),e.jsx("div",{style:{display:"flex",gap:"clamp(2px,.6vw,9px)",justifyContent:"center"},children:q.map((t,n)=>e.jsx("span",{style:{fontSize:"clamp(22px,4vw,52px)",fontWeight:700,display:"inline-block",letterSpacing:"clamp(4px,1vw,12px)",animation:`letterRise .75s ${t.d}ms cubic-bezier(.2,.8,.2,1) both`,background:"linear-gradient(180deg, #fff 0%, rgba(255,215,0,.9) 50%, rgba(212,160,23,.8) 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",filter:"drop-shadow(0 0 5px rgba(212,160,23,.7))"},children:t.c},n))}),a&&e.jsx("div",{style:{position:"absolute",inset:"-20px -40px",borderRadius:20,pointerEvents:"none",animation:"goldPulse 2s ease-in-out infinite",zIndex:-1}}),e.jsx("div",{style:{height:2.5,margin:"12px 0 10px",borderRadius:2,background:"linear-gradient(90deg,transparent,#B8860B,#FFD700,#fff,#FFD700,#B8860B,transparent)",boxShadow:"0 0 16px #D4A017, 0 0 32px rgba(212,160,23,.5)",animation:a?"lineExpand .9s cubic-bezier(.2,.8,.2,1) both":"none",width:a?void 0:0}}),e.jsx("div",{style:{fontSize:"clamp(9px,1.3vw,13px)",fontWeight:700,color:"rgba(255,255,255,.5)",letterSpacing:"clamp(4px,.9vw,9px)",textTransform:"uppercase",opacity:d?1:0,transition:"opacity .8s ease"},children:"Plataforma Cl\xEDnica Inteligente"})]}),x&&e.jsxs("div",{style:{position:"absolute",top:"clamp(16px,6vh,50px)",left:"50%",transform:"translateX(-50%)",zIndex:7,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:8,animation:"creditSlam .7s cubic-bezier(.175,.885,.32,1.275) both",width:"90vw",maxWidth:700},children:[e.jsxs("div",{style:{position:"relative",marginBottom:4},children:[[1,2,3].map(t=>e.jsx("div",{style:{position:"absolute",top:"50%",left:"50%",width:82+t*24,height:82+t*24,borderRadius:"50%",border:`${2/t}px solid rgba(212,160,23,${.65/t})`,animation:`ringOut ${1.2+t*.35}s ${t*.22}s ease-out infinite`,pointerEvents:"none"}},t)),e.jsx("div",{style:{width:76,height:76,borderRadius:"50%",overflow:"hidden",border:"2.5px solid #D4A017",boxShadow:"0 0 0 4px rgba(184,134,11,.2), 0 0 40px rgba(212,160,23,.8), 0 0 80px rgba(184,134,11,.4)",background:"linear-gradient(135deg,#0a1628,#162d54)"},children:u?e.jsx("div",{style:{width:"100%",height:"100%",background:"linear-gradient(135deg,#1B365D,#2B7A8C)",display:"grid",placeItems:"center",fontSize:36},children:"\u2695"}):e.jsx("img",{src:`${C}foto-silas.jpg`,alt:"Dr. Silas",onError:()=>v(!0),style:{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top center"}})})]}),e.jsx("div",{style:{fontSize:"clamp(9px,1.2vw,12px)",fontWeight:800,color:"rgba(255,255,255,.45)",letterSpacing:6,textTransform:"uppercase"},children:"Criado por"}),e.jsx("div",{style:{fontSize:"clamp(22px,4.5vw,58px)",fontWeight:950,letterSpacing:"-0.5px",lineHeight:1.05,background:"linear-gradient(90deg, #8B6010 0%, #B8860B 10%, #D4A017 25%, #FFD700 40%, #FFF8DC 50%, #FFD700 60%, #D4A017 75%, #B8860B 90%, #8B6010 100%)",backgroundSize:"300% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",animation:"shimmerGold 3s linear infinite",filter:"drop-shadow(0 0 12px rgba(255,215,0,.8)) drop-shadow(0 2px 20px rgba(184,134,11,.6))"},children:"Dr. Silas Negr\xE3o Serra Jr."}),e.jsx("div",{style:{fontSize:"clamp(9px,1.1vw,12px)",fontWeight:700,color:"rgba(212,160,23,.7)",letterSpacing:3,textTransform:"uppercase",marginTop:2},children:"CRM-PB 17341 \xB7 Oncologista Cl\xEDnico \xB7 Patos/PB"})]}),e.jsxs("div",{style:{position:"absolute",bottom:22,left:"50%",transform:"translateX(-50%)",zIndex:9,display:"flex",flexDirection:"column",alignItems:"center",gap:8,opacity:k?1:0,pointerEvents:k?"auto":"none",animation:k?"btnAppear .8s cubic-bezier(.2,.8,.2,1) both":"none"},children:[e.jsxs("div",{style:{position:"relative"},children:[e.jsx("div",{style:{position:"absolute",inset:-16,borderRadius:50,border:"1.5px solid rgba(212,160,23,.35)",animation:"ringOut 2s ease infinite",pointerEvents:"none"}}),e.jsx("button",{onClick:T,style:{background:"linear-gradient(135deg,#B8860B 0%,#D4A017 40%,#FFD700 60%,#B8860B 100%)",backgroundSize:"200% auto",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:900,color:"#0a0f1e",letterSpacing:3,textTransform:"uppercase",padding:"13px 50px",borderRadius:50,boxShadow:"0 6px 32px rgba(184,134,11,.6), 0 2px 8px rgba(0,0,0,.5)",animation:"shimmerGold 2s linear infinite",transition:"transform .18s ease, box-shadow .18s ease"},onMouseEnter:t=>{t.currentTarget.style.transform="scale(1.08)",t.currentTarget.style.boxShadow="0 10px 50px rgba(255,215,0,.8), 0 2px 10px rgba(0,0,0,.5)"},onMouseLeave:t=>{t.currentTarget.style.transform="scale(1)",t.currentTarget.style.boxShadow="0 6px 32px rgba(184,134,11,.6), 0 2px 8px rgba(0,0,0,.5)"},children:"\u25B6 \xA0ENTRAR"})]}),e.jsx("div",{style:{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.2)",letterSpacing:2,textTransform:"uppercase"},children:"Toque para entrar \xB7 entrada autom\xE1tica em instantes"})]}),e.jsx("button",{onClick:T,style:{position:"absolute",top:14,right:14,zIndex:10,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.12)",borderRadius:20,padding:"5px 14px",color:"rgba(255,255,255,.3)",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",transition:".2s"},onMouseEnter:t=>{t.currentTarget.style.background="rgba(255,255,255,.1)",t.currentTarget.style.color="rgba(255,255,255,.65)"},onMouseLeave:t=>{t.currentTarget.style.background="rgba(255,255,255,.05)",t.currentTarget.style.color="rgba(255,255,255,.3)"},children:"\u2715 Pular"})]})]})}export{K as default};
