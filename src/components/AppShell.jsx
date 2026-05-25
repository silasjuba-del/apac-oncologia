// AppShell.jsx — v4 — Oncologia Integrada — Hospital do Bem
// Paleta: azul marinho, dourado, branco, bordô, preto, fundo levemente acinzentado
// Carrossel com transição CSS ao trocar de aba

import React, { useState, useEffect, useRef } from "react";

// ── PALETA v4 ──────────────────────────────────────────────────────────────────
export const C = {
  navyDeep:    "#0D1F3C",
  navy:        "#1B365D",
  navyMid:     "#2756A0",
  navyLight:   "#EBF2FF",
  gold:        "#B8860B",
  goldBright:  "#D4A017",
  goldPale:    "#FDF8EE",
  goldBorder:  "#E6C460",
  burgundy:    "#7B1D3A",
  burgundyLight:"#FCE8EF",
  bgPage:      "#F5F7FA",
  bgCard:      "#FFFFFF",
  bgCardAlt:   "#FAFBFC",
  textBlack:   "#0A0F1E",
  textDark:    "#1E293B",
  textMid:     "#374151",
  textGray:    "#6B7280",
  border:      "#DDE3EC",
  borderLight: "#EEF2F8",
  green:       "#15803D",
  greenLight:  "#ECFDF5",
  orange:      "#C2410C",
};

// ── ETAPAS DO FLUXO CLÍNICO ────────────────────────────────────────────────────
export const ETAPAS_FLUXO = [
  { id: "pre_consulta",         ico: "📋", label: "Pré-consulta",  cor: "#6B7280" },
  { id: "aguardando_recepcao",  ico: "⏳", label: "Aguardando",    cor: "#6B7280" },
  { id: "recepcao_conferencia", ico: "📎", label: "Recepção",      cor: "#2756A0" },
  { id: "documentos_anexados",  ico: "📂", label: "Documentos",    cor: "#2756A0" },
  { id: "claude_processando",   ico: "🤖", label: "IA lendo",      cor: "#2B7A8C" },
  { id: "pronto_medico",        ico: "✅", label: "Pronto p/MD",   cor: "#15803D" },
  { id: "em_consulta",          ico: "🩺", label: "Em consulta",   cor: "#B8860B" },
  { id: "evolucao_salva",       ico: "💾", label: "Evolução",      cor: "#B8860B" },
  { id: "apac_validacao",       ico: "📄", label: "APAC",          cor: "#C2410C" },
  { id: "apac_pronta",          ico: "🏁", label: "Concluído",     cor: "#15803D" },
];

// ── TABS POR PERFIL ────────────────────────────────────────────────────────────
export const TABS_PERFIL = {
  medico: [
    
    { id: "dashboard",  ico: "📊", label: "Dashboard"     },
    { id: "fila",       ico: "📥", label: "Atendimentos"  },
    { id: "pacientes",  ico: "👥", label: "Pacientes"     },
    { id: "prontuario", ico: "📋", label: "Prontuário"    },
    { id: "upload_modulo", ico: "📤", label: "Upload"      },
    { id: "prescricao", ico: "💉", label: "Prescrição médica"  },
    { id: "apac",       ico: "📄", label: "APAC"          },
    { id: "triagem_recebe", ico: "📥", label: "Enfermagem" },
    { id: "discussao_clinica", ico: "⚖️", label: "Discussão Clínica" },
    { id: "ia",         ico: "🤖", label: "Assistente IA" },
    { id: "admin",      ico: "⚙️", label: "Admin"         },
  ],
  recepcao: [
    { id: "buscar",      ico: "🔍", label: "Buscar Paciente" },
    { id: "conferencia", ico: "✅", label: "Conferência"    },
    { id: "documentos",  ico: "📎", label: "Documentos"     },
    { id: "fila",        ico: "📋", label: "Fila de Espera" },
  ],
  enfermagem: [
    { id: "salao",      ico: "🛋️", label: "Salão de QT"   },
    { id: "triagem",    ico: "🩺", label: "Triagem QT"    },
    { id: "sinais",     ico: "📊", label: "Sinais Vitais"  },
    { id: "toxicidade", ico: "⚠️", label: "CTCAE"         },
  ],
  farmacia: [
    { id: "liberacoes", ico: "💊", label: "Liberações"     },
    { id: "checagem",   ico: "✅", label: "Dupla Checagem" },
    { id: "estoque",    ico: "📦", label: "Estoque"        },
  ],
  assistencia: [
    { id: "tfd",        ico: "🚌", label: "TFD / Transporte" },
    { id: "beneficios", ico: "🤝", label: "Benefícios"       },
  ],
};

export const LABEL_PERFIL = {
  medico:     "👨‍⚕️ Médico",
  recepcao:   "📋 Recepção",
  enfermagem: "🩺 Enfermagem",
  farmacia:   "💊 Farmácia",
  assistencia:"🤝 Assistência Social",
};

// ── BARRA DO PACIENTE COM STEPPER ─────────────────────────────────────────────
function PatientBar({ pac, fluxoStatus }) {
  if (!pac || !pac.nome) return null;

  const idxAtual   = ETAPAS_FLUXO.findIndex(e => e.id === fluxoStatus);
  const safeIdx    = idxAtual < 0 ? 0 : idxAtual;
  const start      = Math.max(0, Math.min(safeIdx - 2, ETAPAS_FLUXO.length - 5));
  const visiveis   = ETAPAS_FLUXO.slice(start, start + 5);
  const etapaAtual = ETAPAS_FLUXO[safeIdx];

  return (
    <div style={{
      background: "linear-gradient(90deg, #0D1F3C 0%, #162d54 100%)",
      borderBottom: "2px solid #B8860B55",
      padding: "0 16px",
      display: "flex",
      alignItems: "center",
      gap: 20,
      flexShrink: 0,
      height: 46,
    }}>
      {/* Dados do paciente */}
      <div style={{ minWidth: 0, flex: "0 0 210px" }}>
        <div style={{
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: 13,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {pac.nome}
        </div>
        <div style={{ color: "rgba(255,255,255,.45)", fontSize: 10, marginTop: 1 }}>
          {[pac.cid, pac.estadio].filter(Boolean).join(" · ") || "Sem diagnóstico"}
        </div>
      </div>

      {/* Divisor */}
      <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.12)", flexShrink: 0 }} />

      {/* Badge etapa atual */}
      {etapaAtual && (
        <div style={{
          background: etapaAtual.cor + "22",
          border: "1px solid " + etapaAtual.cor + "55",
          borderRadius: 8,
          padding: "2px 9px",
          flexShrink: 0,
        }}>
          <span style={{ color: etapaAtual.cor, fontSize: 11, fontWeight: 700 }}>
            {etapaAtual.ico} {etapaAtual.label}
          </span>
        </div>
      )}

      {/* Stepper */}
      <div style={{
        display: "flex",
        alignItems: "center",
        flex: 1,
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {visiveis.map((etapa, i) => {
          const idx     = ETAPAS_FLUXO.findIndex(e => e.id === etapa.id);
          const passado = idx < safeIdx;
          const atual   = idx === safeIdx;
          return (
            <React.Fragment key={etapa.id}>
              {i > 0 && (
                <div style={{
                  height: 1,
                  width: 24,
                  background: passado ? "#15803D88" : "rgba(255,255,255,.15)",
                  flexShrink: 0,
                }} />
              )}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                flexShrink: 0,
              }}>
                <div style={{
                  width:  atual ? 26 : 20,
                  height: atual ? 26 : 20,
                  borderRadius: "50%",
                  background: atual ? etapa.cor : passado ? "#15803D55" : "rgba(255,255,255,.08)",
                  border: "2px solid " + (atual ? etapa.cor : passado ? "#15803D" : "rgba(255,255,255,.2)"),
                  display: "grid",
                  placeItems: "center",
                  fontSize: atual ? 12 : 9,
                  transition: "all .25s",
                  boxShadow: atual ? "0 0 12px " + etapa.cor + "66" : "none",
                }}>
                  {passado
                    ? <span style={{ color: "#15803D", fontSize: 10, fontWeight: 900 }}>✓</span>
                    : etapa.ico}
                </div>
                {atual && (
                  <div style={{
                    color: etapa.cor,
                    fontSize: 8,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}>
                    {etapa.label}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── CONTEÚDO COM CARROSSEL ────────────────────────────────────────────────────
function CarouselContent({ activeTab, children }) {
  const [renderKey, setRenderKey] = useState(activeTab);
  const [phase, setPhase]         = useState("in");
  const prevRef                   = useRef(activeTab);

  useEffect(() => {
    if (prevRef.current === activeTab) return;
    setPhase("out");
    const t1 = setTimeout(() => {
      setRenderKey(activeTab);
      setPhase("in");
      prevRef.current = activeTab;
    }, 150);
    return () => clearTimeout(t1);
  }, [activeTab]);

  const anim = phase === "in"
    ? "carouselIn 0.22s cubic-bezier(.4,0,.2,1) both"
    : "carouselOut 0.15s cubic-bezier(.4,0,.2,1) both";

  return (
    <>
      <style>{`
        @keyframes carouselIn {
          from { opacity:0; transform:translateX(32px) scale(.99); }
          to   { opacity:1; transform:translateX(0)    scale(1);   }
        }
        @keyframes carouselOut {
          from { opacity:1; transform:translateX(0)     scale(1);   }
          to   { opacity:0; transform:translateX(-22px) scale(.99); }
        }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:10px; }
        ::-webkit-scrollbar-thumb:hover { background:#94A3B8; }
        * { box-sizing:border-box; }
      `}</style>
      <div key={renderKey} style={{ animation: anim }}>
        {children}
      </div>
    </>
  );
}

// ── APPSHELL PRINCIPAL ────────────────────────────────────────────────────────
export default function AppShell({
  perfil        = "medico",
  activeTab,
  onTabChange,
  pac,
  fluxoStatus,
  onTrocarPerfil,
  alertCount    = 0,
  msgCount      = 0,
  headerRight,
  children,
}) {
  const tabs     = (TABS_PERFIL[perfil] || TABS_PERFIL.medico).map(t =>
    perfil === "medico" && t.id === "triagem_recebe"
      ? { id: "enfermagem", ico: "🩺", label: "Enfermagem" }
      : t
  );
  const tabsView = tabs.map(t => perfil === "medico" && t.id === "fila" ? { ...t, ico: "📥", label: "Atendimentos" } : t);
  const tabAtual = tabsView.find(t => t.id === activeTab);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Segoe UI','Inter',system-ui,-apple-system,sans-serif",
      background: "#F5F7FA",
      color: "#0A0F1E",
    }}>

      {/* ── SIDEBAR ────────────────────────────────────── */}
      <aside style={{
        width: 230,
        minWidth: 230,
        background: "linear-gradient(180deg,#0D1F3C 0%,#162d54 65%,#0d2242 100%)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        zIndex: 200,
        scrollbarWidth: "none",
        boxShadow: "4px 0 24px rgba(0,0,0,.2)",
      }}>

        {/* Logo */}
        <div style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(255,255,255,.07)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{
              width:40, height:40, borderRadius:12,
              background: "linear-gradient(135deg,#B8860B,#D4A017)",
              display:"grid", placeItems:"center",
              fontSize:20, flexShrink:0,
              boxShadow:"0 4px 14px #B8860B44",
            }}>⚕</div>
            <div>
              <div style={{ color:"#FFF", fontWeight:800, fontSize:14, letterSpacing:.3, lineHeight:1.2 }}>
                Oncologia
              </div>
              <div style={{ color:"#D4A017", fontSize:10, fontWeight:600, letterSpacing:.5 }}>
                INTEGRADA · v4
              </div>
            </div>
          </div>
          <div style={{
            background:"rgba(255,255,255,.04)",
            borderRadius:8,
            padding:"7px 10px",
            border:"1px solid rgba(255,255,255,.06)",
          }}>
            <div style={{ color:"rgba(255,255,255,.65)", fontSize:10, lineHeight:1.5 }}>
              🏥 Hospital do Bem
            </div>
            <div style={{ color:"rgba(255,255,255,.28)", fontSize:9, lineHeight:1.5 }}>
              Unidade Oncológica · Patos-PB
            </div>
          </div>
        </div>

        {/* Perfil ativo */}
        <div style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
          <button
            onClick={onTrocarPerfil}
            style={{
              width:"100%",
              background:"linear-gradient(90deg,#B8860B1A,#B8860B0D)",
              border:"1px solid #B8860B44",
              borderRadius:10,
              padding:"8px 12px",
              cursor:"pointer",
              display:"flex",
              alignItems:"center",
              justifyContent:"space-between",
              transition:"all .15s",
              fontFamily:"inherit",
            }}
            onMouseEnter={e => e.currentTarget.style.background="linear-gradient(90deg,#B8860B2A,#B8860B18)"}
            onMouseLeave={e => e.currentTarget.style.background="linear-gradient(90deg,#B8860B1A,#B8860B0D)"}
          >
            <span style={{ color:"#D4A017", fontWeight:700, fontSize:12 }}>
              {LABEL_PERFIL[perfil] || perfil}
            </span>
            <span style={{ color:"rgba(255,255,255,.3)", fontSize:9 }}>trocar ↓</span>
          </button>
        </div>

        {/* Navegação */}
        <nav style={{ flex:1, padding:"12px 8px", display:"flex", flexDirection:"column", gap:3 }}>
          <div style={{
            color:"rgba(255,255,255,.22)",
            fontSize:9,
            fontWeight:700,
            letterSpacing:1.2,
            textTransform:"uppercase",
            padding:"0 8px 8px",
          }}>Módulos</div>

          {tabsView.map(tab => {
            const ativo = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"10px 12px",
                  borderRadius:10,
                  border: ativo ? "1px solid #B8860B44" : "1px solid transparent",
                  cursor:"pointer",
                  background: ativo
                    ? "linear-gradient(90deg,#B8860B22 0%,#B8860B0A 100%)"
                    : "transparent",
                  color: ativo ? "#FFFFFF" : "rgba(255,255,255,.48)",
                  fontSize:13, fontWeight: ativo ? 700 : 500,
                  textAlign:"left",
                  transition:"all .15s",
                  fontFamily:"inherit",
                  width:"100%",
                  boxShadow: ativo ? "inset 3px 0 0 #B8860B" : "none",
                  letterSpacing:.1,
                }}
                onMouseEnter={e => { if (!ativo) e.currentTarget.style.background="rgba(255,255,255,.05)"; }}
                onMouseLeave={e => { if (!ativo) e.currentTarget.style.background="transparent"; }}
              >
                <span style={{ fontSize:15, flexShrink:0, opacity: ativo ? 1 : .65 }}>{tab.ico}</span>
                <span style={{ flex:1 }}>{tab.label}</span>
                {tab.badge > 0 && (
                  <span style={{
                    background:"#7B1D3A", color:"#fff",
                    borderRadius:10, padding:"1px 6px",
                    fontSize:10, fontWeight:800,
                  }}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Rodapé */}
        <div style={{ padding:"12px 14px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{
            background:"rgba(184,134,11,.1)",
            borderRadius:8, padding:"8px 10px",
            border:"1px solid #B8860B22",
          }}>
            <div style={{ color:"#D4A017", fontSize:10, fontWeight:700, letterSpacing:.3 }}>
              Dr. Silas Negrão Serra Jr.
            </div>
            <div style={{ color:"rgba(255,255,255,.28)", fontSize:9, marginTop:2 }}>
              CRM-PB 17341 · RQE Oncol. 9099
            </div>
          </div>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL ─────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

        {/* Header */}
        <header style={{
          background:"#FFFFFF",
          borderBottom:"1px solid #DDE3EC",
          padding:"0 16px",
          height:48,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0,
          position:"sticky", top:0, zIndex:100,
          boxShadow:"0 1px 4px rgba(0,0,0,.06)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ color:"#6B7280", fontSize:12 }}>{LABEL_PERFIL[perfil]}</span>
            <span style={{ color:"#DDE3EC" }}>›</span>
            <span style={{ color:"#0A0F1E", fontWeight:700, fontSize:15, letterSpacing:.1 }}>
              {tabAtual?.ico} {tabAtual?.label || "Início"}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
            {alertCount > 0 && (
              <div style={{
                background:"#FCE8EF", border:"1px solid #7B1D3A44",
                borderRadius:8, padding:"3px 9px",
                color:"#7B1D3A", fontSize:11, fontWeight:700, cursor:"pointer",
              }}>
                🚨 {alertCount} alerta{alertCount !== 1 ? "s" : ""}
              </div>
            )}
            {msgCount > 0 && (
              <div style={{
                background:"#EBF2FF", border:"1px solid #2756A033",
                borderRadius:8, padding:"3px 9px",
                color:"#2756A0", fontSize:11, fontWeight:700,
              }}>
                💬 {msgCount}
              </div>
            )}
            {headerRight}
            <div style={{
              fontSize:11, color:"#6B7280",
              background:"#F5F7FA",
              borderRadius:7, padding:"3px 8px",
              border:"1px solid #DDE3EC",
            }}>
              {new Date().toLocaleDateString("pt-BR", {
                weekday:"short", day:"2-digit", month:"short", year:"numeric",
              })}
            </div>
          </div>
        </header>

        {/* Barra paciente */}
        <PatientBar pac={pac} fluxoStatus={fluxoStatus || (pac && pac.status)} />

        {/* Conteúdo com carrossel */}
        <main style={{
          flex:1, overflowY:"auto",
          padding:"20px 24px",
          background:"#F5F7FA",
        }}>
          <div style={{ maxWidth:1080, margin:"0 auto" }}>
            <CarouselContent activeTab={activeTab}>
              {children}
            </CarouselContent>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── UTILITÁRIOS DE DESIGN v4 (exportados para uso em outras telas) ─────────────

export function Card({ children, style }) {
  return (
    <div style={{
      background:"#FFFFFF",
      border:"1px solid #DDE3EC",
      borderRadius:14,
      padding:"16px 20px",
      boxShadow:"0 1px 4px rgba(0,0,0,.05)",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, icon, action }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
      <h2 style={{
        margin:0, fontSize:16, fontWeight:800,
        color:"#0A0F1E",
        display:"flex", alignItems:"center", gap:8,
        letterSpacing:.1,
      }}>
        {icon && <span>{icon}</span>}
        {children}
      </h2>
      {action}
    </div>
  );
}

export function StatusBadge({ label, type = "info" }) {
  const map = {
    info:    { bg:"#EBF2FF",  color:"#2756A0", border:"#2756A044" },
    success: { bg:"#ECFDF5",  color:"#15803D", border:"#15803D44" },
    warn:    { bg:"#FFF7ED",  color:"#C2410C", border:"#C2410C44" },
    danger:  { bg:"#FCE8EF",  color:"#7B1D3A", border:"#7B1D3A44" },
    gold:    { bg:"#FDF8EE",  color:"#B8860B", border:"#E6C46066" },
  };
  const s = map[type] || map.info;
  return (
    <span style={{
      background:s.bg, color:s.color,
      border:"1px solid "+s.border,
      borderRadius:8, padding:"3px 10px",
      fontSize:11, fontWeight:700, letterSpacing:.2,
      whiteSpace:"nowrap",
    }}>
      {label}
    </span>
  );
}

export function BtnV4({ children, onClick, variant = "primary", style, disabled }) {
  const v = {
    primary: { background:"linear-gradient(135deg,#1B365D,#2756A0)", color:"#fff", border:"1px solid #2756A0", boxShadow:"0 2px 8px #1B365D33" },
    gold:    { background:"linear-gradient(135deg,#B8860B,#D4A017)", color:"#fff", border:"1px solid #E6C460", boxShadow:"0 2px 8px #B8860B33" },
    burgundy:{ background:"linear-gradient(135deg,#7B1D3A,#9B2335)", color:"#fff", border:"1px solid #7B1D3A", boxShadow:"0 2px 8px #7B1D3A33" },
    ghost:   { background:"transparent", color:"#1E293B", border:"1px solid #DDE3EC", boxShadow:"none" },
    navy:    { background:"#EBF2FF", color:"#1B365D", border:"1px solid #2756A033", boxShadow:"none" },
  }[variant] || {};
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...v, borderRadius:10, padding:"9px 18px",
      fontSize:13, fontWeight:700,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .5 : 1,
      transition:"all .15s",
      fontFamily:"inherit",
      letterSpacing:.2,
      ...style,
    }}>
      {children}
    </button>
  );
}

export function SubTabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display:"flex", gap:2,
      background:"#F5F7FA",
      border:"1px solid #DDE3EC",
      borderRadius:10, padding:4,
      marginBottom:16,
    }}>
      {tabs.map(tab => {
        const ativo = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            flex:1, padding:"7px 12px",
            borderRadius:8, border:"none",
            cursor:"pointer",
            background: ativo ? "#FFFFFF" : "transparent",
            color: ativo ? "#1B365D" : "#6B7280",
            fontSize:12, fontWeight: ativo ? 700 : 500,
            transition:"all .15s",
            fontFamily:"inherit",
            boxShadow: ativo ? "0 1px 4px rgba(0,0,0,.08)" : "none",
            borderBottom: ativo ? "2px solid #B8860B" : "2px solid transparent",
            letterSpacing:.1,
          }}>
            {tab.ico && <span style={{ marginRight:5 }}>{tab.ico}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function AlertBanner({ type = "info", title, message, onDismiss }) {
  const map = {
    info:    { bg:"#EBF2FF", border:"#2756A0", icon:"ℹ️", color:"#1B365D" },
    success: { bg:"#ECFDF5", border:"#15803D", icon:"✅", color:"#15803D" },
    warn:    { bg:"#FFF7ED", border:"#C2410C", icon:"⚠️", color:"#C2410C" },
    danger:  { bg:"#FCE8EF", border:"#7B1D3A", icon:"🚨", color:"#7B1D3A" },
    gold:    { bg:"#FDF8EE", border:"#B8860B", icon:"✦",  color:"#B8860B" },
  };
  const s = map[type] || map.info;
  return (
    <div style={{
      background:s.bg,
      border:"1px solid "+s.border+"44",
      borderLeft:"4px solid "+s.border,
      borderRadius:10, padding:"12px 16px",
      display:"flex", gap:12, alignItems:"flex-start",
      marginBottom:12,
    }}>
      <span style={{ fontSize:18, flexShrink:0 }}>{s.icon}</span>
      <div style={{ flex:1 }}>
        {title && <div style={{ fontWeight:700, fontSize:13, color:s.color, marginBottom:2 }}>{title}</div>}
        {message && <div style={{ fontSize:12, color:"#374151", lineHeight:1.5 }}>{message}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} style={{
          background:"none", border:"none", cursor:"pointer",
          color:"#6B7280", fontSize:14, padding:"0 4px", flexShrink:0,
        }}>✕</button>
      )}
    </div>
  );
}

export function CompletudeMeter({ pct = 0, label }) {
  const cor = pct >= 80 ? "#15803D" : pct >= 50 ? "#B8860B" : "#7B1D3A";
  return (
    <div style={{ marginBottom:8 }}>
      {label && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontSize:11, color:"#6B7280" }}>{label}</span>
          <span style={{ fontSize:11, fontWeight:700, color:cor }}>{pct}%</span>
        </div>
      )}
      <div style={{ height:6, background:"#EEF2F8", borderRadius:999, overflow:"hidden" }}>
        <div style={{
          height:"100%", width:pct+"%",
          background:"linear-gradient(90deg,"+cor+","+cor+"CC)",
          borderRadius:999, transition:"width .4s ease",
        }}/>
      </div>
    </div>
  );
}
