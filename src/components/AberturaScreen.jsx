import { useState, useEffect, useRef } from "react";

const CSS = `
@keyframes abBarOpen{0%{opacity:1;}100%{height:0;opacity:0;}}
@keyframes abScanDown{0%{top:0%;opacity:1;}85%{opacity:.5;}100%{top:100%;opacity:0;}}
@keyframes abFloatUp{0%{opacity:0;transform:translateY(0) scale(0);}10%{opacity:.6;}90%{opacity:.2;}100%{opacity:0;transform:translateY(-100vh) scale(1.5);}}
@keyframes abStreakIn{0%{opacity:0;transform:translateX(-30px);letter-spacing:20px;}100%{opacity:1;transform:none;letter-spacing:9px;}}
@keyframes abIconBurst{0%{opacity:0;transform:scale(0) rotate(-20deg);}70%{transform:scale(1.12) rotate(4deg);}100%{opacity:1;transform:scale(1) rotate(0);}}
@keyframes abIconPulse{0%,100%{box-shadow:0 0 0 0 rgba(184,134,11,.4);}50%{box-shadow:0 0 0 16px rgba(184,134,11,0);}}
@keyframes abTitleWipe{0%{opacity:0;transform:translateY(28px) scale(.95);filter:blur(14px);}60%{filter:blur(0);}100%{opacity:1;transform:none;filter:blur(0);}}
@keyframes abGlitch{0%{text-shadow:3px 0 #0EA5E9,-3px 0 #B8860B,0 0 80px rgba(27,54,93,.9);}33%{text-shadow:-4px 0 #D4A017,4px 0 #2B7A8C,0 0 80px rgba(27,54,93,.9);}66%{text-shadow:2px 0 #B8860B,-2px 0 #0EA5E9,0 0 80px rgba(27,54,93,.9);}100%{text-shadow:0 0 80px rgba(27,54,93,.9),0 4px 40px rgba(0,0,0,.6);}}
@keyframes abLineExpand{from{width:0;opacity:0;}to{width:min(320px,70vw);opacity:1;}}
@keyframes abSlideUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
@keyframes abCreditSlam{0%{opacity:0;transform:scale(1.25) translateY(8px);filter:blur(8px);}100%{opacity:1;transform:none;filter:blur(0);}}
@keyframes abRingPulse{0%{transform:translate(-50%,-50%) scale(1);opacity:.6;}100%{transform:translate(-50%,-50%) scale(1.4);opacity:0;}}
@keyframes abPlayRing{0%,100%{box-shadow:0 0 0 18px rgba(184,134,11,.12),0 0 0 36px rgba(184,134,11,.06);}50%{box-shadow:0 0 0 28px rgba(184,134,11,.18),0 0 0 54px rgba(184,134,11,.04);}}
@keyframes abZoomOut{0%{transform:scale(1);filter:blur(0) brightness(1);opacity:1;}100%{transform:scale(2.8);filter:blur(18px) brightness(2);opacity:0;}}
@keyframes abFlash{0%{opacity:0;}40%{opacity:.9;}100%{opacity:0;}}
`;

export default function AberturaScreen({ onConcluir }) {
  const videoRef = useRef(null);
  const [fase, setFase] = useState("play"); // "play" | "video" | "texto" | "continuar" | "zoom"

  // Estados dos elementos de texto
  const [showEyebrow,  setShowEyebrow]  = useState(false);
  const [showIcon,     setShowIcon]     = useState(false);
  const [showTitle,    setShowTitle]    = useState(false);
  const [glitch,       setGlitch]       = useState(false);
  const [showLine,     setShowLine]     = useState(false);
  const [showSub,      setShowSub]      = useState(false);
  const [showCredit,   setShowCredit]   = useState(false);
  const [showOverlay,  setShowOverlay]  = useState(false);
  const [showBtn,      setShowBtn]      = useState(false);
  const [flashActive,  setFlashActive]  = useState(false);
  const [zoomActive,   setZoomActive]   = useState(false);
  const timers = useRef([]);

  function t(ms, fn) {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function startVideo() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.volume = 0.9;
    v.play().catch(() => { v.muted = true; v.play(); });
    v.addEventListener("ended", () => { /* para no final */ }, { once: true });
    setFase("video");

    // Timeline
    t(5000, () => {
      // scan já dispara via CSS class
      setShowOverlay(true);
    });
    t(5200, () => setShowEyebrow(true));
    t(5700, () => setShowIcon(true));
    t(6250, () => setShowTitle(true));
    t(6800, () => { setGlitch(true); setTimeout(() => setGlitch(false), 200); });
    t(7100, () => setShowLine(true));
    t(7500, () => setShowSub(true));
    t(7900, () => setShowCredit(true));
    t(9400, () => setShowBtn(true));
  }

  function pular() {
    timers.current.forEach(clearTimeout);
    continuar();
  }

  function continuar() {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 130);
    setTimeout(() => setZoomActive(true), 80);
    setTimeout(() => {
      onConcluir();
    }, 700);
  }

  // Gera partículas uma vez
  const PARTICLES = useRef(
    Array.from({ length: 42 }, (_, i) => ({
      key: i,
      size: Math.random() * 7 + 2,
      left: Math.random() * 100,
      color: ["#B8860B","#D4A017","#2B7A8C","rgba(27,54,93,.5)","rgba(255,255,255,.25)"][Math.floor(Math.random() * 5)],
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 8,
      blur: Math.random() > .6 ? 1.5 : 0,
    }))
  );

  return (
    <>
      <style>{CSS}</style>

      {/* Flash branco */}
      {flashActive && (
        <div style={{ position:"fixed",inset:0,zIndex:9999,background:"#fff",animation:"abFlash .13s ease both",pointerEvents:"none" }}/>
      )}

      {/* Container principal */}
      <div style={{
        position:"fixed",inset:0,zIndex:9990,
        display:"flex",alignItems:"center",justifyContent:"center",
        overflow:"hidden",background:"#000",
        animation: zoomActive ? "abZoomOut .65s cubic-bezier(.4,0,.2,1) both" : "none",
      }}>

        {/* Vídeo */}
        <video ref={videoRef} playsInline preload="auto" style={{
          position:"absolute",inset:0,width:"100%",height:"100%",
          objectFit:"contain",objectPosition:"center center",
          zIndex:0,background:"#000",
          filter: showOverlay
            ? "brightness(.55) saturate(1.2) contrast(1.08)"
            : "brightness(.88) saturate(1.1) contrast(1.04)",
          transition:"filter 1.2s ease",
        }} src={`${import.meta.env.BASE_URL}abertura.mp4`}/>

        {/* Overlay escurecimento rodapé */}
        <div style={{
          position:"absolute",inset:0,zIndex:1,pointerEvents:"none",
          background:"linear-gradient(180deg,rgba(0,0,0,.45) 0%,transparent 25%,transparent 50%,rgba(0,0,0,.92) 100%)",
          opacity: showOverlay ? 1 : 0,
          transition:"opacity 1.2s ease",
        }}/>
        <div style={{
          position:"absolute",inset:0,zIndex:1,pointerEvents:"none",
          background:"linear-gradient(90deg,rgba(0,0,0,.4) 0%,transparent 20%,transparent 80%,rgba(0,0,0,.4) 100%)",
          opacity: showOverlay ? 1 : 0,
          transition:"opacity 1.2s ease",
        }}/>

        {/* Barras cinematográficas (entrada) */}
        {fase !== "play" && <>
          <div style={{ position:"absolute",top:0,left:0,right:0,height:"14vh",background:"#000",zIndex:10,
            animation:"abBarOpen 1s cubic-bezier(.77,0,.18,1) .2s both" }}/>
          <div style={{ position:"absolute",bottom:0,left:0,right:0,height:"14vh",background:"#000",zIndex:10,
            animation:"abBarOpen 1s cubic-bezier(.77,0,.18,1) .2s both" }}/>
        </>}

        {/* Scan line */}
        {showOverlay && (
          <div style={{
            position:"absolute",left:0,right:0,height:"2px",top:0,zIndex:4,pointerEvents:"none",
            background:"linear-gradient(90deg,transparent 0%,#D4A017cc 30%,#fff 50%,#D4A017cc 70%,transparent 100%)",
            animation:"abScanDown 1.8s cubic-bezier(.4,0,.6,1) both",
          }}/>
        )}

        {/* Crosshair */}
        <div style={{
          position:"absolute",inset:0,zIndex:3,pointerEvents:"none",
          opacity: showOverlay ? 1 : 0,transition:"opacity 1s ease",
        }}>
          <div style={{ position:"absolute",left:"50%",top:"10%",width:"1px",height:"80%",background:"rgba(184,134,11,.22)" }}/>
          <div style={{ position:"absolute",top:"50%",left:"8%",width:"84%",height:"1px",background:"rgba(184,134,11,.22)" }}/>
        </div>

        {/* Corners HUD */}
        {[
          { top:20,left:20,borderTop:"2px solid #D4A01788",borderLeft:"2px solid #D4A01788" },
          { top:20,right:20,borderTop:"2px solid #D4A01788",borderRight:"2px solid #D4A01788" },
          { bottom:20,left:20,borderBottom:"2px solid #D4A01788",borderLeft:"2px solid #D4A01788" },
          { bottom:20,right:20,borderBottom:"2px solid #D4A01788",borderRight:"2px solid #D4A01788" },
        ].map((s,i) => (
          <div key={i} style={{
            position:"absolute",width:32,height:32,zIndex:4,...s,
            opacity: showOverlay ? 1 : 0,
            transition:`opacity .6s ease ${i*.1}s`,
          }}/>
        ))}

        {/* Partículas */}
        <div style={{ position:"absolute",inset:0,zIndex:2,pointerEvents:"none",overflow:"hidden",
          opacity: showOverlay ? 1 : 0,transition:"opacity 1s ease" }}>
          {PARTICLES.current.map(p => (
            <div key={p.key} style={{
              position:"absolute",borderRadius:"50%",
              width:p.size,height:p.size,
              left:`${p.left}%`,bottom:"-5%",
              background:p.color,
              filter:`blur(${p.blur}px)`,
              animation:`abFloatUp ${p.duration}s ${p.delay}s linear infinite`,
            }}/>
          ))}
        </div>

        {/* TEXTO — ancorado no rodapé */}
        <div style={{
          position:"absolute",bottom:110,left:0,right:0,
          zIndex:5,textAlign:"center",
          display:"flex",flexDirection:"column",alignItems:"center",
          padding:"0 24px 12px",
          opacity: showEyebrow || showIcon ? 1 : 0,
          pointerEvents:"none",
        }}>
          {/* Eyebrow */}
          <div style={{
            fontSize:10,fontWeight:900,letterSpacing:9,color:"#B8860B",
            textTransform:"uppercase",textShadow:"0 0 28px rgba(184,134,11,.7)",
            marginBottom:14,
            opacity: showEyebrow ? 1 : 0,
            animation: showEyebrow ? "abStreakIn .6s cubic-bezier(.2,.8,.2,1) both" : "none",
          }}>⚕ Hospital do Bem · Patos / PB</div>

          {/* Ícone */}
          <div style={{
            width:56,height:56,borderRadius:16,
            background:"linear-gradient(135deg,#B8860B,#D4A017)",
            display:"grid",placeItems:"center",fontSize:28,
            marginBottom:12,
            opacity: showIcon ? 1 : 0,
            animation: showIcon
              ? "abIconBurst .55s cubic-bezier(.175,.885,.32,1.275) both, abIconPulse 2.8s ease 1s infinite"
              : "none",
          }}>⚕</div>

          {/* Título */}
          <h1 style={{
            fontSize:"clamp(36px,5.5vw,68px)",fontWeight:950,color:"#fff",
            lineHeight:1.05,letterSpacing:-1.5,paddingBottom:6,
            textShadow: glitch
              ? "3px 0 #0EA5E9,-3px 0 #B8860B,0 0 80px rgba(27,54,93,.9)"
              : "0 0 80px rgba(27,54,93,.9),0 4px 40px rgba(0,0,0,.6)",
            fontFamily:"inherit",margin:0,
            opacity: showTitle ? 1 : 0,
            animation: showTitle ? "abTitleWipe .85s cubic-bezier(.2,.8,.2,1) both" : "none",
            transition: glitch ? "text-shadow .05s steps(2,end)" : "none",
          }}>Oncologia<br/>Integrada</h1>

          {/* Linha dourada */}
          <div style={{
            height:2.5,width:0,margin:"14px 0 12px",borderRadius:2,
            background:"linear-gradient(90deg,transparent,#B8860B,#D4A017,#fff,#D4A017,#B8860B,transparent)",
            boxShadow:"0 0 10px #D4A017",
            animation: showLine ? "abLineExpand .7s cubic-bezier(.2,.8,.2,1) both" : "none",
          }}/>

          {/* Subtítulo */}
          <div style={{
            fontSize:"clamp(10px,1.5vw,14px)",fontWeight:700,
            color:"rgba(255,255,255,.65)",letterSpacing:4,
            textTransform:"uppercase",marginBottom:8,
            opacity: showSub ? 1 : 0,
            animation: showSub ? "abSlideUp .6s cubic-bezier(.2,.8,.2,1) both" : "none",
          }}>Plataforma Clínica Inteligente</div>

          {/* Crédito */}
          <div style={{
            fontSize:"clamp(15px,2.2vw,24px)",fontWeight:900,
            color:"#D4A017",letterSpacing:2,
            textShadow:"0 0 40px rgba(184,134,11,.8),0 2px 14px rgba(0,0,0,.7)",
            opacity: showCredit ? 1 : 0,
            animation: showCredit ? "abCreditSlam .55s cubic-bezier(.175,.885,.32,1.275) both" : "none",
          }}>✦ Dr. Silas Negrão Serra Jr. ✦</div>
        </div>

        {/* BOTÃO CONTINUAR */}
        <div style={{
          position:"absolute",bottom:28,left:"50%",transform:"translateX(-50%)",
          zIndex:8,display:"flex",flexDirection:"column",alignItems:"center",gap:10,
          opacity: showBtn ? 1 : 0,
          transition:"opacity .8s ease",
          pointerEvents: showBtn ? "auto" : "none",
        }}>
          <div style={{ position:"relative",display:"inline-block" }}>
            <div style={{
              position:"absolute",left:"50%",top:"50%",
              width:190,height:54,borderRadius:50,
              border:"2px solid rgba(212,160,23,.35)",
              animation:"abRingPulse 2s ease infinite",
              pointerEvents:"none",
            }}/>
            <button onClick={continuar} style={{
              background:"linear-gradient(135deg,#B8860B,#D4A017)",
              border:"none",cursor:"pointer",
              fontFamily:"inherit",fontSize:14,fontWeight:900,
              color:"#fff",letterSpacing:3,textTransform:"uppercase",
              padding:"14px 44px",borderRadius:50,
              boxShadow:"0 6px 30px rgba(184,134,11,.45)",
              transition:"transform .18s ease,box-shadow .18s ease",
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.06)";e.currentTarget.style.boxShadow="0 10px 40px rgba(184,134,11,.65)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 6px 30px rgba(184,134,11,.45)";}}>
              ▶ &nbsp;Continuar
            </button>
          </div>
          <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,.28)",letterSpacing:2,textTransform:"uppercase" }}>
            Clique para entrar no app
          </div>
        </div>

        {/* TELA DE PLAY */}
        {fase === "play" && (
          <div style={{
            position:"absolute",inset:0,zIndex:60,background:"#000",
            display:"flex",flexDirection:"column",alignItems:"center",
            justifyContent:"center",gap:20,
          }}>
            {/* Ícone play pulsante */}
            <div style={{
              width:96,height:96,borderRadius:"50%",
              background:"linear-gradient(135deg,#B8860B,#D4A017)",
              display:"grid",placeItems:"center",fontSize:40,color:"#fff",
              animation:"abPlayRing 2s ease infinite",cursor:"pointer",
            }} onClick={startVideo}>▶</div>

            <div style={{ color:"rgba(255,255,255,.9)",fontSize:16,fontWeight:900,letterSpacing:4,textTransform:"uppercase" }}>
              Toque para iniciar
            </div>
            <div style={{ color:"rgba(255,255,255,.3)",fontSize:11,fontWeight:700,letterSpacing:1 }}>
              com som · fullscreen recomendado
            </div>

            {/* Botões Iniciar / Pular */}
            <div style={{ display:"flex",gap:14,marginTop:6 }}>
              <button onClick={startVideo} style={{
                background:"linear-gradient(135deg,#B8860B,#D4A017)",
                border:"none",borderRadius:50,padding:"12px 32px",
                color:"#fff",fontSize:13,fontWeight:900,letterSpacing:3,
                textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
                boxShadow:"0 4px 20px rgba(184,134,11,.4)",
              }}>▶ &nbsp;Iniciar</button>
              <button onClick={pular} style={{
                background:"transparent",
                border:"1.5px solid rgba(255,255,255,.25)",
                borderRadius:50,padding:"12px 28px",
                color:"rgba(255,255,255,.55)",fontSize:13,fontWeight:800,letterSpacing:3,
                textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
                transition:".2s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.5)";e.currentTarget.style.color="rgba(255,255,255,.85)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.25)";e.currentTarget.style.color="rgba(255,255,255,.55)";}}>
                ✕ &nbsp;Pular
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
