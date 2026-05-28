// ─────────────────────────────────────────────────────────────────────────────
// AberturaScreen.jsx  —  Splash screen animada
//
// FASES:
//   1. Símbolos médicos e células voam em direção à tela (0–2.8s)
//   2. Letras de "ONCOLOGIA INTEGRADA" sobem de baixo para cima (2.2–3.8s)
//   3. Linha dourada + subtítulo (3.8–4.5s)
//   4. Foto com brilho + "Criado por Silas" com shimmer (4.5–6.5s)
//   5. Botão Entrar (7s) + auto-enter (11s)
//
// FOTO: coloque o arquivo em public/foto-silas.jpg
//       enquanto ausente, exibe avatar dourado com ⚕
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";

// ── KEYFRAMES ─────────────────────────────────────────────────────────────────
const CSS = `
/* Simbolos voando em direção à tela */
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

/* Célula (tumor) — blob que voa e se expande */
@keyframes cellBurst{ 0%{opacity:0;transform:scale(.08);filter:blur(6px);}
                      40%{opacity:.75;transform:scale(1.4);filter:blur(0);}
                      100%{opacity:0;transform:scale(4.5);filter:blur(12px);} }

/* Partículas de fundo */
@keyframes particleDrift{ 0%{opacity:0;transform:translateY(0) scale(1);}
                           20%{opacity:.7;}
                           100%{opacity:0;transform:translateY(-110vh) scale(1.8);} }

/* Letras subindo de baixo para cima */
@keyframes letterUp{ 0%{opacity:0;transform:translateY(72px) scale(.85);filter:blur(8px);}
                     60%{filter:blur(0);}
                     100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0);} }

/* Linha dourada expandindo */
@keyframes lineGrow{ from{width:0;opacity:0;} to{width:min(380px,75vw);opacity:1;} }

/* Subtítulo desliza */
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

/* Crédito aparece */
@keyframes creditIn{ 0%{opacity:0;transform:scale(1.2) translateY(6px);filter:blur(6px);}
                     100%{opacity:1;transform:none;filter:blur(0);} }

/* Botão aparece */
@keyframes btnIn{ from{opacity:0;transform:translateY(12px) scale(.9);} to{opacity:1;transform:none;} }

/* Saída zoom */
@keyframes zoomExit{ 0%{opacity:1;transform:scale(1);filter:blur(0) brightness(1);}
                     100%{opacity:0;transform:scale(2.5);filter:blur(20px) brightness(2);} }

/* Flash branco */
@keyframes flashW{ 0%{opacity:0;} 30%{opacity:.95;} 100%{opacity:0;} }

/* Nebulosa de fundo pulsando */
@keyframes nebula{ 0%,100%{opacity:.18;transform:scale(1);} 50%{opacity:.28;transform:scale(1.06);} }

/* Título brilhando antes do glitch */
@keyframes titleGlow{ 0%,100%{text-shadow:0 0 80px rgba(27,54,93,.8),0 4px 40px rgba(0,0,0,.6);}
                      50%{text-shadow:0 0 120px rgba(27,54,93,1),0 0 40px rgba(43,122,140,.5),0 4px 40px rgba(0,0,0,.7);} }

/* Ponteiro HUD piscando */
@keyframes hudBlink{ 0%,100%{opacity:.4;} 50%{opacity:1;} }
`;

// ── DADOS DOS SÍMBOLOS ────────────────────────────────────────────────────────
const SIMBOLOS = [
  // Cantos
  { ico:"🧬", left:6,  top:8,  size:52, anim:"flyTL", dur:1.8, delay:0.0 },
  { ico:"⚕",  left:88, top:6,  size:60, anim:"flyTR", dur:2.0, delay:0.15 },
  { ico:"🔬", left:5,  top:80, size:48, anim:"flyBL", dur:1.9, delay:0.3  },
  { ico:"🩺", left:90, top:78, size:54, anim:"flyBR", dur:1.8, delay:0.1  },
  // Laterais
  { ico:"⚛",  left:3,  top:48, size:50, anim:"flyL",  dur:2.0, delay:0.4  },
  { ico:"💊", left:94, top:42, size:44, anim:"flyR",  dur:1.9, delay:0.25 },
  { ico:"🧪", left:48, top:3,  size:46, anim:"flyT",  dur:2.1, delay:0.2  },
  { ico:"💉", left:52, top:93, size:42, anim:"flyB",  dur:1.8, delay:0.35 },
  // Intermediários
  { ico:"🦠", left:22, top:15, size:46, anim:"flyTL", dur:2.2, delay:0.5  },
  { ico:"🧫", left:75, top:18, size:44, anim:"flyTR", dur:2.0, delay:0.45 },
  { ico:"🩻", left:18, top:72, size:50, anim:"flyBL", dur:2.1, delay:0.55 },
  { ico:"🔭", left:78, top:68, size:44, anim:"flyBR", dur:2.0, delay:0.6  },
  { ico:"✚",  left:38, top:6,  size:40, anim:"flyT",  dur:2.2, delay:0.7  },
  { ico:"⚡", left:65, top:92, size:38, anim:"flyB",  dur:2.0, delay:0.65 },
  { ico:"🏥", left:92, top:58, size:46, anim:"flyR",  dur:2.3, delay:0.8  },
];

// Células-tumor (blobs CSS)
const CELULAS = [
  { left:15, top:25, size:90,  color:"rgba(139,0,60,.7)",   delay:0.05, dur:2.2 },
  { left:80, top:30, size:70,  color:"rgba(80,10,100,.7)",  delay:0.2,  dur:2.0 },
  { left:50, top:50, size:110, color:"rgba(0,80,100,.65)",  delay:0.4,  dur:2.4 },
  { left:25, top:65, size:85,  color:"rgba(120,20,20,.7)",  delay:0.6,  dur:2.1 },
  { left:72, top:55, size:75,  color:"rgba(60,0,80,.65)",   delay:0.3,  dur:2.3 },
  { left:40, top:20, size:65,  color:"rgba(0,60,80,.6)",    delay:0.7,  dur:2.0 },
  { left:60, top:78, size:80,  color:"rgba(100,0,40,.65)",  delay:0.15, dur:2.2 },
];

// Partículas de fundo
const PARTICULAS = Array.from({ length: 36 }, (_, i) => ({
  key: i,
  left: Math.random() * 100,
  size: Math.random() * 5 + 1.5,
  color: ["#B8860B","#D4A017","rgba(43,122,140,.6)","rgba(255,255,255,.3)","rgba(27,54,93,.5)"][i % 5],
  dur: Math.random() * 14 + 10,
  delay: Math.random() * 10,
}));

// Letras com delays
function splitLetras(word, startDelay) {
  return word.split("").map((ch, i) => ({
    ch,
    delay: startDelay + i * 0.075,
  }));
}
const LETRAS_1 = splitLetras("ONCOLOGIA", 2.2);
const LETRAS_2 = splitLetras("INTEGRADA", 2.85);

// ─────────────────────────────────────────────────────────────────────────────
export default function AberturaScreen({ onConcluir }) {
  const [showLetras,  setShowLetras]  = useState(false);
  const [showLinha,   setShowLinha]   = useState(false);
  const [showSub,     setShowSub]     = useState(false);
  const [showFoto,    setShowFoto]    = useState(false);
  const [showCredit,  setShowCredit]  = useState(false);
  const [showBtn,     setShowBtn]     = useState(false);
  const [fotoErro,    setFotoErro]    = useState(false);
  const [saindo,      setSaindo]      = useState(false);
  const [flash,       setFlash]       = useState(false);
  const timers = useRef([]);

  function t(ms, fn) {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }

  useEffect(() => {
    t(2000,  () => setShowLetras(true));
    t(3900,  () => setShowLinha(true));
    t(4350,  () => setShowSub(true));
    t(4700,  () => setShowFoto(true));
    t(5600,  () => setShowCredit(true));
    t(7000,  () => setShowBtn(true));
    t(11000, () => sair());
    return () => timers.current.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function sair() {
    timers.current.forEach(clearTimeout);
    setFlash(true);
    setTimeout(() => setFlash(false), 160);
    setSaindo(true);
    setTimeout(onConcluir, 700);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* Flash saída */}
      {flash && (
        <div style={{
          position:"fixed",inset:0,zIndex:99999,background:"#fff",
          animation:"flashW .16s ease both",pointerEvents:"none",
        }}/>
      )}

      {/* Container principal */}
      <div style={{
        position:"fixed",inset:0,zIndex:9990,overflow:"hidden",
        background:"radial-gradient(ellipse at 50% 40%, #0a1628 0%, #030810 100%)",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        animation: saindo ? "zoomExit .7s cubic-bezier(.4,0,.2,1) both" : "none",
      }}>

        {/* Nebulosa de fundo */}
        <div style={{
          position:"absolute",inset:0,pointerEvents:"none",
          background:"radial-gradient(ellipse 80% 60% at 30% 60%, rgba(43,122,140,.18) 0%, transparent 60%),"
                    +"radial-gradient(ellipse 60% 50% at 70% 30%, rgba(27,54,93,.22) 0%, transparent 55%)",
          animation:"nebula 6s ease-in-out infinite",
        }}/>

        {/* Grid de pontos HUD */}
        <div style={{
          position:"absolute",inset:0,pointerEvents:"none",
          backgroundImage:"radial-gradient(circle, rgba(184,134,11,.12) 1px, transparent 1px)",
          backgroundSize:"40px 40px",
          opacity:.5,
        }}/>

        {/* Corners HUD */}
        {[
          {top:18,left:18,borderTop:"1.5px solid rgba(212,160,23,.5)",borderLeft:"1.5px solid rgba(212,160,23,.5)"},
          {top:18,right:18,borderTop:"1.5px solid rgba(212,160,23,.5)",borderRight:"1.5px solid rgba(212,160,23,.5)"},
          {bottom:18,left:18,borderBottom:"1.5px solid rgba(212,160,23,.5)",borderLeft:"1.5px solid rgba(212,160,23,.5)"},
          {bottom:18,right:18,borderBottom:"1.5px solid rgba(212,160,23,.5)",borderRight:"1.5px solid rgba(212,160,23,.5)"},
        ].map((s,i) => (
          <div key={i} style={{
            position:"absolute",width:28,height:28,zIndex:4,...s,
            animation:"hudBlink 2.5s ease-in-out infinite",
            animationDelay:`${i*.3}s`,
          }}/>
        ))}

        {/* Partículas flutuantes */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
          {PARTICULAS.map(p => (
            <div key={p.key} style={{
              position:"absolute",borderRadius:"50%",
              width:p.size,height:p.size,
              left:`${p.left}%`,bottom:"-5%",
              background:p.color,
              animation:`particleDrift ${p.dur}s ${p.delay}s linear infinite`,
            }}/>
          ))}
        </div>

        {/* ── CÉLULAS TUMORAIS (blobs) ── */}
        {CELULAS.map((c, i) => (
          <div key={i} style={{
            position:"absolute",
            left:`${c.left}%`,top:`${c.top}%`,
            width:c.size,height:c.size,
            background:`radial-gradient(circle at 35% 35%, ${c.color}, rgba(0,0,0,.9))`,
            borderRadius:"60% 40% 55% 45% / 45% 55% 40% 60%",
            animation:`cellBurst ${c.dur}s ${c.delay}s cubic-bezier(.2,.8,.2,1) both`,
            boxShadow:`0 0 30px ${c.color}`,
            pointerEvents:"none",zIndex:2,
          }}>
            {/* Núcleo interno */}
            <div style={{
              position:"absolute",top:"25%",left:"28%",
              width:"44%",height:"44%",
              background:"rgba(255,255,255,.12)",
              borderRadius:"50%",
            }}/>
          </div>
        ))}

        {/* ── SÍMBOLOS MÉDICOS VOANDO ── */}
        {SIMBOLOS.map((s, i) => (
          <div key={i} style={{
            position:"absolute",
            left:`${s.left}%`,top:`${s.top}%`,
            fontSize:s.size,lineHeight:1,
            animation:`${s.anim} ${s.dur}s ${s.delay}s cubic-bezier(.2,.8,.2,1) both`,
            pointerEvents:"none",zIndex:3,
            filter:"drop-shadow(0 0 12px rgba(184,134,11,.5))",
          }}>{s.ico}</div>
        ))}

        {/* ── LETRAS "ONCOLOGIA INTEGRADA" ── */}
        <div style={{
          position:"absolute",
          bottom:120,left:0,right:0,
          textAlign:"center",zIndex:6,
          pointerEvents:"none",
          display:"flex",flexDirection:"column",alignItems:"center",gap:4,
        }}>
          {/* ONCOLOGIA */}
          <div style={{display:"flex",gap:"clamp(2px,0.6vw,8px)",justifyContent:"center"}}>
            {LETRAS_1.map((l, i) => (
              <span key={i} style={{
                fontSize:"clamp(34px,5.5vw,72px)",
                fontWeight:950,color:"#FFFFFF",
                letterSpacing:"-0.5px",
                textShadow:"0 0 60px rgba(27,54,93,.8),0 4px 30px rgba(0,0,0,.7)",
                opacity: showLetras ? 1 : 0,
                animation: showLetras
                  ? `letterUp .7s ${l.delay}s cubic-bezier(.2,.8,.2,1) both`
                  : "none",
                display:"inline-block",
                fontFamily:"inherit",
              }}>{l.ch}</span>
            ))}
          </div>

          {/* INTEGRADA */}
          <div style={{display:"flex",gap:"clamp(2px,0.5vw,7px)",justifyContent:"center"}}>
            {LETRAS_2.map((l, i) => (
              <span key={i} style={{
                fontSize:"clamp(22px,3.5vw,46px)",
                fontWeight:700,
                color:"rgba(255,255,255,.78)",
                letterSpacing:"clamp(4px,1vw,10px)",
                textTransform:"uppercase",
                opacity: showLetras ? 1 : 0,
                animation: showLetras
                  ? `letterUp .7s ${l.delay}s cubic-bezier(.2,.8,.2,1) both`
                  : "none",
                display:"inline-block",
                fontFamily:"inherit",
              }}>{l.ch}</span>
            ))}
          </div>

          {/* Linha dourada */}
          <div style={{
            height:2,margin:"10px 0 8px",borderRadius:2,
            background:"linear-gradient(90deg,transparent,#B8860B,#D4A017,#fff,#D4A017,#B8860B,transparent)",
            boxShadow:"0 0 12px #D4A017,0 0 24px rgba(212,160,23,.4)",
            animation: showLinha ? "lineGrow .8s cubic-bezier(.2,.8,.2,1) both" : "none",
            width: showLinha ? undefined : 0,
          }}/>

          {/* Subtítulo */}
          <div style={{
            fontSize:"clamp(9px,1.4vw,13px)",fontWeight:700,
            color:"rgba(255,255,255,.5)",letterSpacing:"clamp(3px,.8vw,8px)",
            textTransform:"uppercase",
            opacity: showSub ? 1 : 0,
            animation: showSub ? "slideUp .6s cubic-bezier(.2,.8,.2,1) both" : "none",
          }}>Plataforma Clínica Inteligente</div>
        </div>

        {/* ── FOTO + CRÉDITO ── */}
        {showFoto && (
          <div style={{
            position:"absolute",
            top:"clamp(24px,8vh,60px)",
            left:"50%",transform:"translateX(-50%)",
            display:"flex",flexDirection:"column",alignItems:"center",
            gap:12,zIndex:7,
          }}>
            {/* Anel pulsante externo */}
            <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {[1,2,3].map(n => (
                <div key={n} style={{
                  position:"absolute",top:"50%",left:"50%",
                  width:100+n*22,height:100+n*22,borderRadius:"50%",
                  border:`${2/n}px solid rgba(212,160,23,${.6/n})`,
                  animation:`ringPulse ${1.2+n*.4}s ${n*.25}s ease-out infinite`,
                  pointerEvents:"none",
                }}/>
              ))}

              {/* Círculo foto */}
              <div style={{
                width:88,height:88,borderRadius:"50%",
                overflow:"hidden",
                border:"3px solid #D4A017",
                boxShadow:"0 0 0 4px rgba(184,134,11,.25),0 0 40px rgba(212,160,23,.7),0 0 80px rgba(184,134,11,.35)",
                animation:"photoIn .9s cubic-bezier(.175,.885,.32,1.275) both",
                flexShrink:0,
                background:"linear-gradient(135deg,#0a1628,#162d54)",
              }}>
                <img
                  src={`${import.meta.env.BASE_URL}foto-silas.jpg`}
                  alt="Dr. Silas"
                  onError={() => setFotoErro(true)}
                  style={{
                    width:"100%",height:"100%",objectFit:"cover",objectPosition:"top center",
                    display: fotoErro ? "none" : "block",
                  }}
                />
                {fotoErro && (
                  <div style={{
                    width:"100%",height:"100%",
                    background:"linear-gradient(135deg,#1B365D,#2B7A8C)",
                    display:"grid",placeItems:"center",
                    fontSize:38,
                  }}>⚕</div>
                )}
              </div>
            </div>

            {/* "Criado por" + nome com shimmer */}
            {showCredit && (
              <div style={{
                textAlign:"center",
                animation:"creditIn .65s cubic-bezier(.175,.885,.32,1.275) both",
              }}>
                <div style={{
                  fontSize:"clamp(8px,1.1vw,11px)",fontWeight:700,
                  color:"rgba(255,255,255,.4)",letterSpacing:4,
                  textTransform:"uppercase",marginBottom:4,
                }}>Criado por</div>
                <div style={{
                  fontSize:"clamp(13px,2vw,20px)",fontWeight:900,
                  letterSpacing:1,
                  background:"linear-gradient(90deg, #B8860B 0%, #fff 25%, #D4A017 40%, #fff 55%, #FFD700 70%, #D4A017 85%, #B8860B 100%)",
                  backgroundSize:"200% auto",
                  WebkitBackgroundClip:"text",
                  WebkitTextFillColor:"transparent",
                  backgroundClip:"text",
                  animation:"shimmer 2.5s linear infinite, nameGlow 2s ease-in-out 1s infinite",
                  WebkitTextFillColor:"transparent",
                }}>Dr. Silas Negrão Serra Jr.</div>
                <div style={{
                  fontSize:"clamp(8px,.9vw,10px)",fontWeight:700,
                  color:"rgba(184,134,11,.6)",letterSpacing:3,
                  textTransform:"uppercase",marginTop:3,
                }}>CRM-PB 17341 · Oncologista Clínico</div>
              </div>
            )}
          </div>
        )}

        {/* ── BOTÃO ENTRAR ── */}
        <div style={{
          position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",
          zIndex:8,display:"flex",flexDirection:"column",alignItems:"center",gap:8,
          opacity: showBtn ? 1 : 0,pointerEvents: showBtn ? "auto" : "none",
          animation: showBtn ? "btnIn .7s cubic-bezier(.2,.8,.2,1) both" : "none",
        }}>
          <div style={{position:"relative"}}>
            <div style={{
              position:"absolute",inset:-14,borderRadius:50,
              border:"1.5px solid rgba(212,160,23,.3)",
              animation:"ringPulse 2s ease infinite",pointerEvents:"none",
            }}/>
            <button
              onClick={sair}
              style={{
                background:"linear-gradient(135deg,#B8860B 0%,#D4A017 50%,#B8860B 100%)",
                backgroundSize:"200% auto",
                border:"none",cursor:"pointer",
                fontFamily:"inherit",fontSize:13,fontWeight:900,
                color:"#fff",letterSpacing:3,textTransform:"uppercase",
                padding:"13px 46px",borderRadius:50,
                boxShadow:"0 6px 28px rgba(184,134,11,.5),0 2px 8px rgba(0,0,0,.5)",
                transition:"transform .18s ease,box-shadow .18s ease",
              }}
              onMouseEnter={e=>{
                e.currentTarget.style.transform="scale(1.07)";
                e.currentTarget.style.boxShadow="0 10px 40px rgba(184,134,11,.7),0 2px 8px rgba(0,0,0,.5)";
              }}
              onMouseLeave={e=>{
                e.currentTarget.style.transform="scale(1)";
                e.currentTarget.style.boxShadow="0 6px 28px rgba(184,134,11,.5),0 2px 8px rgba(0,0,0,.5)";
              }}
            >▶ &nbsp;Entrar</button>
          </div>
          <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.2)",letterSpacing:2,textTransform:"uppercase"}}>
            Toque para entrar · entrada automática em breve
          </div>
        </div>

        {/* Botão pular (canto) */}
        <button
          onClick={sair}
          style={{
            position:"absolute",top:16,right:16,zIndex:9,
            background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",
            borderRadius:20,padding:"5px 14px",
            color:"rgba(255,255,255,.35)",fontSize:10,fontWeight:700,
            letterSpacing:2,textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
            transition:".2s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.12)";e.currentTarget.style.color="rgba(255,255,255,.7)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.06)";e.currentTarget.style.color="rgba(255,255,255,.35)";}}
        >✕ Pular</button>

      </div>
    </>
  );
}
