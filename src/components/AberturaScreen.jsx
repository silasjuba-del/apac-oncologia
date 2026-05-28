// ─────────────────────────────────────────────────────────────────────────────
// AberturaScreen.jsx — Splash Cinemática Premium v3
//
// IMAGENS (salvar em /public/):
//   img1-metastase.jpg   → diagrama metástase
//   img2-medico.jpg      → médico com raio-x
//   img3-ia.jpg          → IA robô
//   img4-quimio.jpg      → sala de quimio
//   foto-silas.jpg       → foto Dr. Silas
//
// VÍDEO: public/abertura2.mp4  (já copiado)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";

// ── KEYFRAMES CSS ─────────────────────────────────────────────────────────────
const CSS = `
/* Imagem voando em direção ao telespectador */
@keyframes imgFly {
  0%   { transform:scale(.04) translateZ(0); opacity:0;   filter:blur(40px) brightness(2.5); }
  10%  { opacity:1; filter:blur(0) brightness(1.3); }
  65%  { transform:scale(1.06); filter:blur(0) brightness(1.05); }
  85%  { opacity:1; }
  100% { transform:scale(1.22); opacity:0; filter:blur(12px); }
}

/* Ken Burns lento para o vídeo de fundo */
@keyframes kenBurns {
  0%   { transform:scale(1.0); }
  100% { transform:scale(1.12); }
}

/* Partículas médicas flutuando */
@keyframes floatUp {
  0%   { opacity:0; transform:translateY(0) scale(1) rotate(0deg); }
  15%  { opacity:.8; }
  85%  { opacity:.4; }
  100% { opacity:0; transform:translateY(-110vh) scale(1.6) rotate(20deg); }
}

/* Foto ghost emergindo atrás do título */
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

/* Botão aparece */
@keyframes btnAppear {
  from { opacity:0; transform:translateY(16px) scale(.9); }
  to   { opacity:1; transform:none; }
}

/* Saída zoom */
@keyframes exitZoom {
  0%   { opacity:1; transform:scale(1);   filter:blur(0) brightness(1); }
  100% { opacity:0; transform:scale(2.8); filter:blur(24px) brightness(2.5); }
}

/* Flash branco saída */
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

/* Partícula celular voando */
@keyframes cellSpin {
  0%   { opacity:0; transform:scale(.1) rotate(0deg); filter:blur(4px); }
  30%  { opacity:.7; filter:blur(0); }
  70%  { opacity:.5; }
  100% { opacity:0; transform:scale(3.5) rotate(180deg); filter:blur(16px); }
}

/* Vibração dramática no brass hit */
@keyframes shake {
  0%,100% { transform:translateX(0); }
  20%     { transform:translateX(-4px); }
  40%     { transform:translateX(4px); }
  60%     { transform:translateX(-3px); }
  80%     { transform:translateX(3px); }
}
`;

// ── DADOS ──────────────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL;

// SVGs médicos embutidos — funcionam sem arquivos externos
const svgUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const SVG_METASTASE = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%"><stop offset="0%" stop-color="#1a0010"/><stop offset="100%" stop-color="#030003"/></radialGradient>
    <radialGradient id="c1" cx="40%" cy="40%"><stop offset="0%" stop-color="#cc1133"/><stop offset="100%" stop-color="#6b0018"/></radialGradient>
    <radialGradient id="c2" cx="40%" cy="40%"><stop offset="0%" stop-color="#ff4466"/><stop offset="100%" stop-color="#990022"/></radialGradient>
    <radialGradient id="c3" cx="40%" cy="40%"><stop offset="0%" stop-color="#dd2244"/><stop offset="100%" stop-color="#7a0015"/></radialGradient>
    <filter id="gl"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <ellipse cx="400" cy="300" rx="420" ry="320" fill="#12000a" opacity=".6"/>
  <!-- Célula principal -->
  <ellipse cx="400" cy="295" rx="170" ry="155" fill="url(#c1)" opacity=".92" filter="url(#gl)"/>
  <ellipse cx="390" cy="288" rx="65" ry="58" fill="#3a000d" opacity=".85"/>
  <circle cx="383" cy="284" r="28" fill="#cc1133" opacity=".75"/>
  <!-- Projeções invasivas (tentáculos) -->
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
  <!-- Micro células satélite -->
  <circle cx="620" cy="155" r="18" fill="#cc1133" opacity=".5"/>
  <circle cx="168" cy="490" r="15" fill="#dd2244" opacity=".45"/>
  <circle cx="680" cy="490" r="13" fill="#ff4466" opacity=".4"/>
  <circle cx="130" cy="130" r="11" fill="#cc1133" opacity=".4"/>
  <!-- Glow central -->
  <ellipse cx="400" cy="295" rx="80" ry="70" fill="#ff0033" opacity=".08"/>
  <!-- Texto médico HUD -->
  <text x="22" y="38" font-family="monospace" font-size="11" fill="#cc1133" opacity=".6">METÁSTASE · CARCINOMA INVASIVO</text>
  <text x="22" y="580" font-family="monospace" font-size="10" fill="#cc1133" opacity=".45">CEL-ID:A2B7 · INVASÃO VASCULAR DETECTADA</text>
</svg>`);

const SVG_MEDICO = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
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
  <!-- Painel raio-X (tórax) -->
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
  <!-- Pulmões -->
  <ellipse cx="340" cy="260" rx="55" ry="80" fill="#1a3d5a" opacity=".5"/>
  <ellipse cx="460" cy="260" rx="55" ry="80" fill="#1a3d5a" opacity=".5"/>
  <!-- Nódulo suspeito destacado -->
  <circle cx="468" cy="215" r="14" fill="#ff6633" opacity=".5" filter="url(#xglow)"/>
  <circle cx="468" cy="215" r="9" fill="#ff4400" opacity=".7"/>
  <!-- Seta de diagnóstico -->
  <line x1="510" y1="195" x2="484" y2="213" stroke="#FFD700" stroke-width="1.5" opacity=".8"/>
  <text x="515" y="192" font-family="monospace" font-size="10" fill="#FFD700" opacity=".85">NÓDULO</text>
  <!-- Cabeça/pescoço -->
  <path d="M380 80 Q380 65 400 58 Q420 65 420 80" stroke="#c8d8e8" stroke-width="2" fill="none" opacity=".6"/>
  <!-- Info HUD -->
  <text x="232" y="552" font-family="monospace" font-size="9" fill="#4a9cc8" opacity=".7">TÓRAX PA · 120kV · 200mA</text>
  <text x="445" y="552" font-family="monospace" font-size="9" fill="#4a9cc8" opacity=".5">ONCOLOGIA</text>
  <!-- Luz cirúrgica -->
  <circle cx="680" cy="120" r="55" fill="#f0f8ff" opacity=".03"/>
  <circle cx="680" cy="120" r="35" fill="#f0f8ff" opacity=".04"/>
</svg>`);

const SVG_IA = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#010810"/><stop offset="100%" stop-color="#020c18"/></linearGradient>
    <radialGradient id="brain" cx="50%" cy="48%"><stop offset="0%" stop-color="#0a4060"/><stop offset="100%" stop-color="#020c18"/></radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glow2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <!-- Cérebro digital simplificado -->
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
  <!-- Nós neurais brilhantes -->
  <circle cx="295" cy="225" r="5" fill="#00d4ff" opacity=".9" filter="url(#glow2)"/>
  <circle cx="290" cy="295" r="4" fill="#00d4ff" opacity=".8" filter="url(#glow2)"/>
  <circle cx="298" cy="355" r="5" fill="#00d4ff" opacity=".85" filter="url(#glow2)"/>
  <circle cx="505" cy="225" r="5" fill="#00d4ff" opacity=".9" filter="url(#glow2)"/>
  <circle cx="510" cy="295" r="4" fill="#00d4ff" opacity=".8" filter="url(#glow2)"/>
  <circle cx="502" cy="355" r="5" fill="#00d4ff" opacity=".85" filter="url(#glow2)"/>
  <circle cx="400" cy="200" r="6" fill="#00d4ff" opacity=".9" filter="url(#glow)"/>
  <circle cx="400" cy="380" r="6" fill="#00d4ff" opacity=".85" filter="url(#glow)"/>
  <!-- Conexões neurais pulsantes -->
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
  <text x="370" y="466" font-family="monospace" font-size="12" fill="#00d4ff" opacity=".8" font-weight="bold">AI·ONCO</text>
  <!-- Dados fluindo -->
  <text x="30" y="40" font-family="monospace" font-size="9" fill="#0891B2" opacity=".5">01101000 01100101 01100001 01101100 01110100 01101000</text>
  <text x="30" y="570" font-family="monospace" font-size="9" fill="#0891B2" opacity=".45">NEURAL·NET · ONCOLOGY·AI · DEEP·LEARNING · v4.2</text>
  <!-- Glow central -->
  <ellipse cx="400" cy="290" rx="60" ry="50" fill="#0891B2" opacity=".06"/>
</svg>`);

const SVG_QUIMIO = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
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
  <!-- Líquido dentro -->
  <ellipse cx="400" cy="200" rx="72" ry="75" fill="#1a0d2e" opacity=".9"/>
  <ellipse cx="400" cy="210" rx="68" ry="60" fill="#220f38" opacity=".7"/>
  <!-- Brilho bolsa -->
  <ellipse cx="370" cy="120" rx="22" ry="32" fill="white" opacity=".06"/>
  <!-- Gancho / suporte -->
  <path d="M400 55 Q400 35 418 25 Q436 18 438 32" stroke="#c8b060" stroke-width="3" fill="none"/>
  <rect x="396" y="52" width="8" height="25" rx="2" fill="#c8b060" opacity=".8"/>
  <!-- Tubo de infusão -->
  <path d="M400 285 Q402 320 398 360 Q396 400 400 450 Q402 480 400 520 Q399 545 400 580" stroke="#8a6ab8" stroke-width="4" fill="none" opacity=".7"/>
  <!-- Câmara de gotejamento -->
  <rect x="385" y="360" width="30" height="48" rx="8" fill="#1a0d2e" stroke="#8a5db8" stroke-width="1.5" opacity=".85"/>
  <ellipse cx="400" cy="398" rx="10" ry="14" fill="#3a1d60" opacity=".7"/>
  <!-- Gotas dentro da câmara -->
  <ellipse cx="400" cy="372" rx="3" ry="4" fill="#9b6dcc" opacity=".8"/>
  <ellipse cx="395" cy="388" rx="2.5" ry="3.5" fill="#9b6dcc" opacity=".65"/>
  <!-- Molécula à esquerda (cisplatina estilizada) -->
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
  <!-- Molécula à direita (5-FU estilizada) -->
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
  <text x="22" y="38" font-family="monospace" font-size="10" fill="#B8860B" opacity=".6">QUIMIOTERAPIA SISTÊMICA · PROTOCOLO ATIVO</text>
  <text x="22" y="575" font-family="monospace" font-size="9" fill="#B8860B" opacity=".4">INFUSÃO CONTROLADA · ml/h · ONCOLOGIA CLÍNICA</text>
</svg>`);

const IMGS = [
  { src: SVG_METASTASE, dur: 2600, delay: 200  },
  { src: SVG_MEDICO,    dur: 2600, delay: 2400 },
  { src: SVG_IA,        dur: 2600, delay: 4600 },
  { src: SVG_QUIMIO,    dur: 2600, delay: 6800 },
];

// Letras com stagger
function mkLetras(word, t0) {
  return word.split("").map((c, i) => ({ c, d: t0 + i * 80 }));
}
const L1 = mkLetras("ONCOLOGIA", 7600);
const L2 = mkLetras("INTEGRADA", 8350);

// Partículas médicas
const PARTS = Array.from({ length: 48 }, (_, i) => ({
  key: i, left: Math.random() * 100,
  size: Math.random() * 6 + 1.5,
  color: ["#D4A017","#B8860B","rgba(43,122,140,.7)","rgba(255,255,255,.35)","rgba(27,54,93,.6)"][i % 5],
  dur: Math.random() * 14 + 10, delay: Math.random() * 12,
}));

// Células-tumor
const CELLS = [
  { l: 8,  t: 12, s: 80,  c: "rgba(139,0,50,.75)",  d: 0.2 },
  { l: 88, t: 8,  s: 70,  c: "rgba(80,10,100,.7)",  d: 0.5 },
  { l: 5,  t: 72, s: 90,  c: "rgba(0,80,110,.7)",   d: 1.0 },
  { l: 88, t: 70, s: 75,  c: "rgba(120,20,20,.75)", d: 1.5 },
  { l: 48, t: 4,  s: 65,  c: "rgba(60,0,80,.65)",   d: 0.8 },
  { l: 50, t: 88, s: 80,  c: "rgba(100,0,40,.7)",   d: 0.3 },
  { l: 25, t: 42, s: 55,  c: "rgba(0,60,90,.6)",    d: 1.2 },
];

// ── WEB AUDIO — PARTITURA CINEMÁTICA ─────────────────────────────────────────
function tocarPartitura(ctx) {
  const t = ctx.currentTime;

  /* Reverb de sala grande via impulso */
  const conv = ctx.createConvolver();
  const irLen = Math.floor(ctx.sampleRate * 5);
  const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < irLen; i++)
      d[i] = (Math.random() * 2 - 1) * Math.exp(-4.5 * i / irLen);
  }
  conv.buffer = ir;

  const master = ctx.createGain();
  master.connect(ctx.destination);
  master.gain.setValueAtTime(0, t);
  master.gain.linearRampToValueAtTime(0.75, t + 3);
  master.gain.setValueAtTime(0.75, t + 13);
  master.gain.linearRampToValueAtTime(0, t + 17);

  const wet = ctx.createGain();
  wet.gain.setValueAtTime(0.55, t);
  conv.connect(wet);
  wet.connect(master);

  /* helpers */
  function osc(freq, start, end, type = "sine", vol = 0.2) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t + start);
    g.gain.setValueAtTime(0, t + start);
    g.gain.linearRampToValueAtTime(vol, t + start + 0.08);
    g.gain.setValueAtTime(vol, t + end - 0.4);
    g.gain.linearRampToValueAtTime(0, t + end);
    o.connect(g); g.connect(master); g.connect(conv);
    o.start(t + start); o.stop(t + end);
  }

  function nz(start, end, fc = 120, vol = 0.28) {
    const len = Math.floor(ctx.sampleRate * (end - start));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = fc;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t + start);
    g.gain.linearRampToValueAtTime(vol, t + start + 0.04);
    g.gain.setValueAtTime(vol, t + end - 0.4);
    g.gain.linearRampToValueAtTime(0, t + end);
    src.connect(filt); filt.connect(g); g.connect(master);
    src.start(t + start);
  }

  /* ── PARTITURA ── */

  // Baixo profundo (A0 = 27.5Hz, A1 = 55Hz)
  osc(27.5, 0, 17, "sawtooth", 0.22);
  osc(55,   0, 17, "sawtooth", 0.18);
  osc(110,  0, 17, "sine",     0.12);

  // Rumble cavernoso
  nz(0, 17, 80, 0.20);

  // Batidas de coração dramáticas
  [0.4, 2.0, 3.6, 5.2, 6.8].forEach(bt => {
    nz(bt,        bt + 0.10, 70,  0.55);
    nz(bt + 0.20, bt + 0.32, 55,  0.38);
  });

  // Cordas em tensão crescente (2s → 7s)
  const notas = [220, 247, 277, 311, 330, 370, 415, 440];
  notas.forEach((f, i) => {
    osc(f, 2 + i * 0.55, 8, "sawtooth", 0.055 + i * 0.008);
    osc(f * 1.004, 2 + i * 0.55, 8, "sawtooth", 0.04);
  });

  // ═══ BRASS HIT — momento revelação (7.5s) ═══
  [110, 138.6, 165, 220, 277, 330, 415, 440].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(f, t + 7.5);
    g.gain.setValueAtTime(0.38, t + 7.5);
    g.gain.exponentialRampToValueAtTime(0.01, t + 11);
    o.connect(g); g.connect(master); g.connect(conv);
    o.start(t + 7.5); o.stop(t + 11.5);
  });
  // Percussão no hit
  nz(7.5, 7.7, 200, 0.6);
  nz(7.52, 7.65, 60, 0.5);

  // Orquestra plena (8.5s → 16s) — Lá maior
  [[440,"A4"],[554,"C#5"],[659,"E5"],[880,"A5"],[1109,"C#6"]].forEach(([f], i) => {
    osc(f,       8.5 + i * 0.12, 16, "sawtooth", 0.09);
    osc(f * 1.003, 8.5 + i * 0.12, 16, "sawtooth", 0.06);
    osc(f * 0.997, 8.5 + i * 0.12, 16, "sawtooth", 0.05);
  });

  // Brilho agudo (shimmer do título) — 10s+
  [1760, 2093, 2349, 2637, 3136].forEach((f, i) => {
    osc(f, 10 + i * 0.09, 16, "sine", 0.038);
  });

  return master;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AberturaScreen({ onConcluir }) {
  const [imgAtiva, setImgAtiva]     = useState(-1);
  const [showVideo, setShowVideo]   = useState(false);
  const [shake,     setShake]       = useState(false);
  const [showGhost, setShowGhost]   = useState(false);
  const [showTitle, setShowTitle]   = useState(false);
  const [showLinha, setShowLinha]   = useState(false);
  const [showSub,   setShowSub]     = useState(false);
  const [showCred,  setShowCred]    = useState(false);
  const [showBtn,   setShowBtn]     = useState(false);
  const [fotoErr,   setFotoErr]     = useState(false);
  const [saindo,    setSaindo]      = useState(false);
  const [flash,     setFlash]       = useState(false);
  const [imgErros,  setImgErros]    = useState({});
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const timers   = useRef([]);

  const T = useCallback((ms, fn) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    /* ── Imagens voando ── */
    IMGS.forEach((img, i) => {
      T(img.delay, () => setImgAtiva(i));
    });

    /* ── Vídeo de fundo aparece ── */
    T(7200, () => {
      setImgAtiva(-1);
      setShowVideo(true);
      const v = videoRef.current;
      if (v) { v.muted = true; v.play().catch(() => {}); }
    });

    /* ── Brass hit ── */
    T(7500, () => {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    });

    /* ── Ghost photo ── */
    T(7600, () => setShowGhost(true));

    /* ── Título ── */
    T(7700, () => setShowTitle(true));

    /* ── Linha / sub ── */
    T(9200, () => setShowLinha(true));
    T(9700, () => setShowSub(true));

    /* ── Crédito CRIADO POR DR SILAS ── */
    T(10200, () => setShowCred(true));

    /* ── Botão ── */
    T(12000, () => setShowBtn(true));

    /* ── Auto-enter ── */
    T(16500, () => sair());

    return () => timers.current.forEach(clearTimeout);
  }, []); // eslint-disable-line

  /* Inicia música ao primeiro toque/clique */
  function iniciarAudio() {
    if (audioRef.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioRef.current = tocarPartitura(ctx);
    } catch (_) { /* silencioso se bloqueado */ }
  }

  function sair() {
    timers.current.forEach(clearTimeout);
    if (audioRef.current) {
      try { audioRef.current.gain.linearRampToValueAtTime(0, audioRef.current.context.currentTime + 0.5); } catch (_) {}
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    setSaindo(true);
    setTimeout(onConcluir, 750);
  }

  const imgErrHandler = (i) => setImgErros(e => ({ ...e, [i]: true }));

  return (
    <>
      <style>{CSS}</style>

      {/* Flash branco saída */}
      {flash && (
        <div style={{
          position:"fixed", inset:0, zIndex:99999, background:"#fff",
          animation:"flashOut .18s ease both", pointerEvents:"none",
        }}/>
      )}

      {/* ── CONTAINER PRINCIPAL ── */}
      <div
        onClick={iniciarAudio}
        style={{
          position:"fixed", inset:0, zIndex:9990, overflow:"hidden",
          background:"radial-gradient(ellipse at 50% 40%, #0a1628 0%, #020810 100%)",
          fontFamily:"system-ui, sans-serif",
          animation: saindo ? "exitZoom .75s cubic-bezier(.4,0,.2,1) both" : "none",
        }}
      >

        {/* ── VÍDEO DE FUNDO ── */}
        <video
          ref={videoRef}
          muted playsInline loop preload="auto"
          src={`${BASE}abertura2.mp4`}
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"cover", zIndex:0,
            opacity: showVideo ? 1 : 0,
            filter:"brightness(.35) saturate(1.3)",
            transition:"opacity 1.5s ease",
            animation: showVideo ? "kenBurns 20s linear both" : "none",
          }}
        />

        {/* Gradiente escurecendo bordas */}
        <div style={{
          position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
          background:"radial-gradient(ellipse at center, transparent 30%, rgba(2,8,16,.85) 100%)",
        }}/>

        {/* Nebulosa */}
        <div style={{
          position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
          background:"radial-gradient(ellipse 70% 55% at 30% 55%, rgba(43,122,140,.2) 0%, transparent 60%),"
                    +"radial-gradient(ellipse 55% 50% at 68% 32%, rgba(27,54,93,.25) 0%, transparent 55%)",
          animation:"nebulaPulse 7s ease-in-out infinite",
        }}/>

        {/* Grid HUD */}
        <div style={{
          position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
          backgroundImage:"radial-gradient(circle, rgba(184,134,11,.1) 1px, transparent 1px)",
          backgroundSize:"42px 42px",
        }}/>

        {/* ── CÉLULAS TUMORAIS ── */}
        {CELLS.map((c, i) => (
          <div key={i} style={{
            position:"absolute", left:`${c.l}%`, top:`${c.t}%`,
            width:c.s, height:c.s,
            background:`radial-gradient(circle at 32% 32%, ${c.c}, rgba(0,0,0,.9))`,
            borderRadius:"58% 42% 54% 46% / 44% 56% 38% 62%",
            boxShadow:`0 0 30px ${c.c}`,
            animation:`cellSpin 2.2s ${c.d}s cubic-bezier(.2,.8,.2,1) both`,
            zIndex:2, pointerEvents:"none",
          }}>
            <div style={{
              position:"absolute", top:"24%", left:"27%",
              width:"45%", height:"45%", borderRadius:"50%",
              background:"rgba(255,255,255,.14)",
            }}/>
          </div>
        ))}

        {/* ── PARTÍCULAS ── */}
        <div style={{ position:"absolute", inset:0, zIndex:2, pointerEvents:"none", overflow:"hidden" }}>
          {PARTS.map(p => (
            <div key={p.key} style={{
              position:"absolute", borderRadius:"50%",
              width:p.size, height:p.size,
              left:`${p.left}%`, bottom:"-4%",
              background:p.color,
              animation:`floatUp ${p.dur}s ${p.delay}s linear infinite`,
            }}/>
          ))}
        </div>

        {/* ── IMAGENS VOANDO ── */}
        {IMGS.map((img, i) => imgAtiva === i && (
          <div key={i} style={{
            position:"absolute", inset:0, zIndex:3,
            animation:"imgFly 2.6s cubic-bezier(.2,.8,.2,1) both",
            pointerEvents:"none",
          }}>
            <img
              src={img.src}
              alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
            />
            {/* Overlay escuro sobre a imagem */}
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(180deg,rgba(0,0,0,.5) 0%,transparent 30%,transparent 65%,rgba(0,0,0,.8) 100%)",
            }}/>
          </div>
        ))}

        {/* ── CORNERS HUD ── */}
        {[
          { top:20, left:20,  borderTop:"1.5px solid rgba(212,160,23,.6)", borderLeft:"1.5px solid rgba(212,160,23,.6)" },
          { top:20, right:20, borderTop:"1.5px solid rgba(212,160,23,.6)", borderRight:"1.5px solid rgba(212,160,23,.6)" },
          { bottom:20, left:20,  borderBottom:"1.5px solid rgba(212,160,23,.6)", borderLeft:"1.5px solid rgba(212,160,23,.6)" },
          { bottom:20, right:20, borderBottom:"1.5px solid rgba(212,160,23,.6)", borderRight:"1.5px solid rgba(212,160,23,.6)" },
        ].map((s, i) => (
          <div key={i} style={{
            position:"absolute", width:30, height:30, zIndex:8, ...s,
            animation:`hudBlink ${2+i*.3}s ease-in-out infinite`,
            animationDelay:`${i*.25}s`,
          }}/>
        ))}

        {/* ── FOTO GHOST atrás do título ── */}
        {showGhost && (
          <div style={{
            position:"absolute", inset:0, zIndex:4,
            display:"flex", alignItems:"center", justifyContent:"center",
            animation:"ghostIn 2s cubic-bezier(.2,.8,.2,1) both",
            pointerEvents:"none",
          }}>
            {!fotoErr
              ? <img
                  src={`${BASE}foto-silas.jpg`}
                  alt=""
                  onError={() => setFotoErr(true)}
                  style={{
                    width:"min(480px,70vw)", height:"min(480px,70vw)",
                    objectFit:"cover", objectPosition:"top center",
                    borderRadius:"50%",
                    opacity:.22,
                    filter:"blur(8px) grayscale(.25) sepia(.2)",
                    mixBlendMode:"luminosity",
                  }}
                />
              : <div style={{
                  width:"min(480px,70vw)", height:"min(480px,70vw)",
                  borderRadius:"50%",
                  background:"radial-gradient(circle, rgba(212,160,23,.15), transparent 70%)",
                  fontSize:180, opacity:.18,
                  display:"grid", placeItems:"center",
                }}>⚕</div>
            }
          </div>
        )}

        {/* ── TÍTULO "ONCOLOGIA INTEGRADA" ── */}
        {showTitle && (
          <div style={{
            position:"absolute", bottom:130, left:0, right:0,
            zIndex:6, textAlign:"center",
            display:"flex", flexDirection:"column", alignItems:"center", gap:4,
            animation: shake ? "shake .5s ease both" : "none",
            pointerEvents:"none",
          }}>
            {/* ONCOLOGIA */}
            <div style={{ display:"flex", gap:"clamp(1px,.5vw,7px)", justifyContent:"center" }}>
              {L1.map((l, i) => (
                <span key={i} style={{
                  fontSize:"clamp(38px,7vw,90px)", fontWeight:950,
                  display:"inline-block",
                  animation:`letterRise .75s ${l.d}ms cubic-bezier(.2,.8,.2,1) both`,
                  background:"linear-gradient(180deg, #FFF8DC 0%, #FFD700 30%, #D4A017 60%, #B8860B 100%)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  backgroundClip:"text",
                  filter:"drop-shadow(0 0 8px rgba(212,160,23,.9))",
                }}>{l.c}</span>
              ))}
            </div>

            {/* INTEGRADA */}
            <div style={{ display:"flex", gap:"clamp(2px,.6vw,9px)", justifyContent:"center" }}>
              {L2.map((l, i) => (
                <span key={i} style={{
                  fontSize:"clamp(22px,4vw,52px)", fontWeight:700,
                  display:"inline-block",
                  letterSpacing:"clamp(4px,1vw,12px)",
                  animation:`letterRise .75s ${l.d}ms cubic-bezier(.2,.8,.2,1) both`,
                  background:"linear-gradient(180deg, #fff 0%, rgba(255,215,0,.9) 50%, rgba(212,160,23,.8) 100%)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  backgroundClip:"text",
                  filter:"drop-shadow(0 0 5px rgba(212,160,23,.7))",
                }}>{l.c}</span>
              ))}
            </div>

            {/* Glow pulse no título */}
            {showLinha && (
              <div style={{
                position:"absolute", inset:"-20px -40px",
                borderRadius:20, pointerEvents:"none",
                animation:"goldPulse 2s ease-in-out infinite",
                zIndex:-1,
              }}/>
            )}

            {/* Linha dourada */}
            <div style={{
              height:2.5, margin:"12px 0 10px", borderRadius:2,
              background:"linear-gradient(90deg,transparent,#B8860B,#FFD700,#fff,#FFD700,#B8860B,transparent)",
              boxShadow:"0 0 16px #D4A017, 0 0 32px rgba(212,160,23,.5)",
              animation: showLinha ? "lineExpand .9s cubic-bezier(.2,.8,.2,1) both" : "none",
              width: showLinha ? undefined : 0,
            }}/>

            {/* "Plataforma Clínica Inteligente" */}
            <div style={{
              fontSize:"clamp(9px,1.3vw,13px)", fontWeight:700,
              color:"rgba(255,255,255,.5)", letterSpacing:"clamp(4px,.9vw,9px)",
              textTransform:"uppercase",
              opacity: showSub ? 1 : 0,
              transition:"opacity .8s ease",
            }}>Plataforma Clínica Inteligente</div>
          </div>
        )}

        {/* ── CRIADO POR DR SILAS (GRANDE) ── */}
        {showCred && (
          <div style={{
            position:"absolute",
            top:"clamp(16px,6vh,50px)",
            left:"50%", transform:"translateX(-50%)",
            zIndex:7, textAlign:"center",
            display:"flex", flexDirection:"column", alignItems:"center", gap:8,
            animation:"creditSlam .7s cubic-bezier(.175,.885,.32,1.275) both",
            width:"90vw", maxWidth:700,
          }}>
            {/* Foto circular com anéis */}
            <div style={{ position:"relative", marginBottom:4 }}>
              {[1,2,3].map(n => (
                <div key={n} style={{
                  position:"absolute", top:"50%", left:"50%",
                  width:82+n*24, height:82+n*24, borderRadius:"50%",
                  border:`${2/n}px solid rgba(212,160,23,${.65/n})`,
                  animation:`ringOut ${1.2+n*.35}s ${n*.22}s ease-out infinite`,
                  pointerEvents:"none",
                }}/>
              ))}
              <div style={{
                width:76, height:76, borderRadius:"50%",
                overflow:"hidden",
                border:"2.5px solid #D4A017",
                boxShadow:"0 0 0 4px rgba(184,134,11,.2), 0 0 40px rgba(212,160,23,.8), 0 0 80px rgba(184,134,11,.4)",
                background:"linear-gradient(135deg,#0a1628,#162d54)",
              }}>
                {!fotoErr
                  ? <img
                      src={`${BASE}foto-silas.jpg`}
                      alt="Dr. Silas"
                      onError={() => setFotoErr(true)}
                      style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top center" }}
                    />
                  : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#1B365D,#2B7A8C)", display:"grid", placeItems:"center", fontSize:36 }}>⚕</div>
                }
              </div>
            </div>

            {/* CRIADO POR */}
            <div style={{
              fontSize:"clamp(9px,1.2vw,12px)", fontWeight:800,
              color:"rgba(255,255,255,.45)", letterSpacing:6,
              textTransform:"uppercase",
            }}>Criado por</div>

            {/* DR. SILAS — GRANDE COM SHIMMER */}
            <div style={{
              fontSize:"clamp(22px,4.5vw,58px)", fontWeight:950,
              letterSpacing:"-0.5px", lineHeight:1.05,
              background:"linear-gradient(90deg, #8B6010 0%, #B8860B 10%, #D4A017 25%, #FFD700 40%, #FFF8DC 50%, #FFD700 60%, #D4A017 75%, #B8860B 90%, #8B6010 100%)",
              backgroundSize:"300% auto",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              backgroundClip:"text",
              animation:"shimmerGold 3s linear infinite",
              filter:"drop-shadow(0 0 12px rgba(255,215,0,.8)) drop-shadow(0 2px 20px rgba(184,134,11,.6))",
            }}>Dr. Silas Negrão Serra Jr.</div>

            {/* Subtítulo CRM */}
            <div style={{
              fontSize:"clamp(9px,1.1vw,12px)", fontWeight:700,
              color:"rgba(212,160,23,.7)", letterSpacing:3,
              textTransform:"uppercase", marginTop:2,
            }}>CRM-PB 17341 · Oncologista Clínico · Patos/PB</div>
          </div>
        )}

        {/* ── BOTÃO ENTRAR ── */}
        <div style={{
          position:"absolute", bottom:22, left:"50%", transform:"translateX(-50%)",
          zIndex:9, display:"flex", flexDirection:"column", alignItems:"center", gap:8,
          opacity: showBtn ? 1 : 0, pointerEvents: showBtn ? "auto" : "none",
          animation: showBtn ? "btnAppear .8s cubic-bezier(.2,.8,.2,1) both" : "none",
        }}>
          {/* Anel pulsante */}
          <div style={{ position:"relative" }}>
            <div style={{
              position:"absolute", inset:-16, borderRadius:50,
              border:"1.5px solid rgba(212,160,23,.35)",
              animation:"ringOut 2s ease infinite", pointerEvents:"none",
            }}/>
            <button
              onClick={sair}
              style={{
                background:"linear-gradient(135deg,#B8860B 0%,#D4A017 40%,#FFD700 60%,#B8860B 100%)",
                backgroundSize:"200% auto",
                border:"none", cursor:"pointer",
                fontFamily:"inherit", fontSize:14, fontWeight:900,
                color:"#0a0f1e", letterSpacing:3, textTransform:"uppercase",
                padding:"13px 50px", borderRadius:50,
                boxShadow:"0 6px 32px rgba(184,134,11,.6), 0 2px 8px rgba(0,0,0,.5)",
                animation:"shimmerGold 2s linear infinite",
                transition:"transform .18s ease, box-shadow .18s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.boxShadow = "0 10px 50px rgba(255,215,0,.8), 0 2px 10px rgba(0,0,0,.5)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 6px 32px rgba(184,134,11,.6), 0 2px 8px rgba(0,0,0,.5)";
              }}
            >▶ &nbsp;ENTRAR</button>
          </div>
          <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.2)", letterSpacing:2, textTransform:"uppercase" }}>
            Toque para entrar · entrada automática em instantes
          </div>
        </div>

        {/* Botão pular */}
        <button
          onClick={sair}
          style={{
            position:"absolute", top:14, right:14, zIndex:10,
            background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.12)",
            borderRadius:20, padding:"5px 14px",
            color:"rgba(255,255,255,.3)", fontSize:10, fontWeight:700,
            letterSpacing:2, textTransform:"uppercase", cursor:"pointer",
            fontFamily:"inherit", transition:".2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,.1)"; e.currentTarget.style.color="rgba(255,255,255,.65)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,.05)"; e.currentTarget.style.color="rgba(255,255,255,.3)"; }}
        >✕ Pular</button>

      </div>
    </>
  );
}
