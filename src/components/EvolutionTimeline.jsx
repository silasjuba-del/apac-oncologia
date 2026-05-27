// src/components/EvolutionTimeline.jsx
// Redesigned timeline — cards with colored accents, bullet points, vitals pills
import { useMemo, useState } from "react";

const N  = "#1B365D";
const T  = "#2B7A8C";
const G  = "#B8860B";
const VE = "#15803D";
const VM = "#B91C1C";
const AM = "#B45309";
const BG = "#EEF2F7";

const MARCO_COR = "#7C3AED";   // roxo para marcos clínicos
const TYPE_META = {
  exam:    { label: "EXAME / LAUDO",       dot: G,          border: G,          bg: "#FFFBEB", badge: "#FEF3C7", badgeTxt: AM        },
  triage:  { label: "TRIAGEM ENFERMAGEM",  dot: T,          border: T,          bg: "#F0F9FF", badge: "#DBEAFE", badgeTxt: T         },
  evolucao:{ label: "EVOLUÇÃO MÉDICA",     dot: N,          border: N,          bg: "#EEF2F7", badge: "#E0E7FF", badgeTxt: N         },
  marco:   { label: "MARCO CLÍNICO",       dot: MARCO_COR,  border: MARCO_COR,  bg: "#F5F3FF", badge: "#EDE9FE", badgeTxt: MARCO_COR },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d || !(d instanceof Date) || isNaN(d)) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtTime(d) {
  if (!d || !(d instanceof Date) || isNaN(d)) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function parseTimelineDate(value) {
  if (value instanceof Date && !isNaN(value)) return value;
  const s = String(value || "").trim();
  let m = s.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2}))?/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0));
  m = s.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (m) return new Date(Number(m[3].length === 2 ? "20" + m[3] : m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0));
  const d = new Date(s || Date.now());
  return isNaN(d) ? new Date() : d;
}

function timelineDateKey(date) {
  if (!(date instanceof Date) || isNaN(date)) return "sem-data";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normTimelineKey(v) {
  return cleanTimelineText(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function itemTitle(item) {
  const d = item?.data || {};
  return cleanTimelineText(d.nome || d.tipo || d.nomeExame || d.autor || d.enfermeiroNome || TYPE_META[item?.type]?.label || "");
}

function itemBody(item) {
  const d = item?.data || {};
  return cleanTimelineText([
    d.resumo,
    d.resultado,
    d.laudo,
    d.queixaAtual,
    d.queixa,
    d.evolucao,
    d.texto,
    d.descricao,
    d.obs,
    d.observacoes,
  ].filter(Boolean).join(" "));
}

function fullItemText(item) {
  const d = item?.data || {};
  const alarmes = Array.isArray(d.alarmes) ? d.alarmes : [];
  const sinaisAlarme = Array.isArray(d.sinaisAlarme) ? d.sinaisAlarme : [];
  return [
    `${fmtDate(item?.date)} - ${TYPE_META[item?.type]?.label || "REGISTRO"}`,
    itemTitle(item),
    itemBody(item),
    d.conduta && "CONDUTA: " + d.conduta,
    alarmes.length ? "SINAIS DE ALARME: " + alarmes.join(" · ") : "",
    sinaisAlarme.length ? "SINAIS DE ALARME: " + sinaisAlarme.join(" · ") : "",
  ].filter(Boolean).join("\n\n");
}

function itemSignature(item) {
  return [
    item?.type || "",
    timelineDateKey(item?.date),
    normTimelineKey(itemTitle(item)).slice(0, 90),
    normTimelineKey(itemBody(item)).slice(0, 220),
  ].join("|");
}

const ORIGEM_DOC_RE = /^(AN[ÁA]LISE\s+IA\s+RECEP[CÇ][AÃ]O|IA\s+DOCUMENTOS|RESUMO\s+IA|UPLOAD|DOCUMENTOS?|RMADA|PROGRAMADA|CADASTRO\s+DEMOGR[ÁA]FICO|PRIMEIRA\s+CONSULTA)$/i;
const TITULO_SECAO_RE = /^(={2,}\s*)?(DADOS\s+ANAGR[ÁA]FICOS|RESUMO\s+CL[ÍI]NICO|DADOS\s+CL[ÍI]NICOS|DADOS\s+ONCOL[ÓO]GICOS|LAUDOS?\s+EM\s+CRONOLOGIA|LABORAT[ÓO]RIO(?:\s+E\s+EXAME\s+F[ÍI]SICO)?|EXAME\s+F[ÍI]SICO|CONDUTA|OBSERVA[CÇ][OÕ]ES?)(\s*={2,})?\s*:?\s*$/i;
const EXAME_REAL_RE = /\b(TC|TOMOGRAF|RM|RESSON|PET[\s-]?CT|PET\b|USG|ULTRASS|MAMOG|RX|RAIO[\s-]?X|CINTIL|ENDOSCOP|COLONOSCOP|ECOCARD|ANATOMOPAT|AN[ÁA]TOMO|BI[ÓO]PSIA|IMUNO|IHQ|HEMOGRAMA|CREATININA|UREIA|TGO|TGP|BILIRRUB|CEA|CA[\s-]?125|CA[\s-]?19|PSA|PD[\s-]?L1|LABORAT)/i;

function cleanTimelineText(v) {
  return String(v || "")
    .replace(/^\s*[•\-–—]\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatClinicalTimelineText(v = "") {
  return String(v || "")
    .replace(/\s+(DADOS\s+ANAGR[ÁA]FICOS|RESUMO\s+CL[ÍI]NICO|DADOS\s+CL[ÍI]NICOS|DADOS\s+ONCOL[ÓO]GICOS|LAUDOS?\s+EM\s+CRONOLOGIA|LABORAT[ÓO]RIO|EXAME\s+F[ÍI]SICO|CONDUTA|OBSERVA[ÇC][ÕO]ES?)\s+/gi, "\n===$1===\n")
    .replace(/\s+(Queixa|Antecedentes patol[óo]gicos|Medica[çc][õo]es de uso cont[íi]nuo|Alergias|Cirurgias pr[ée]vias|Hist[óo]rico familiar|Tipo de tumor|Sede tumoral|Estadiamento\/TNM|Est[áa]gio|Subtipo|Biomarcadores|CID-10|ECOG|Pend[êe]ncias|Sugest[õo]es|Exame f[íi]sico|Conduta)\s*:/gi, "\n• $1:")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizarExamTimeline(e = {}) {
  let nome = cleanTimelineText(e.nome || e.tipo || e.nomeExame || "Exame");
  let resumo = cleanTimelineText(e.resumo || e.resultado || e.laudo || "");
  const origemComoTitulo = ORIGEM_DOC_RE.test(nome);

  if (origemComoTitulo && EXAME_REAL_RE.test(resumo)) {
    const partes = resumo.split(/\s+(?:-|–|—|:)\s+/).map(cleanTimelineText).filter(Boolean);
    const idx = partes.findIndex(p => EXAME_REAL_RE.test(p));
    if (idx >= 0) {
      nome = partes[idx];
      resumo = partes.slice(idx + 1).join(" - ") || "";
    }
  }

  return { ...e, nome, tipo: nome, resumo };
}

function deveExibirExamTimeline(e = {}) {
  const nome = cleanTimelineText(e.nome || e.tipo || e.nomeExame || "");
  const resumo = cleanTimelineText(e.resumo || e.resultado || e.laudo || "");
  const texto = [nome, resumo].filter(Boolean).join(" ");
  if (!texto) return false;
  if (TITULO_SECAO_RE.test(nome) || TITULO_SECAO_RE.test(resumo)) return false;
  if (ORIGEM_DOC_RE.test(nome)) return false;
  if (!resumo && /:\s*$/.test(nome)) return false;
  if (/:\s*$/.test(resumo) && resumo.length < 90) return false;
  return EXAME_REAL_RE.test(texto) || resumo.length > 12;
}

// ─── Vitals pill ─────────────────────────────────────────────────────────────

function Pill({ label, color }) {
  return (
    <span style={{
      display: "inline-block",
      background: color + "22",
      color: color,
      border: "1px solid " + color + "55",
      borderRadius: 20,
      padding: "1px 8px",
      fontSize: 10,
      fontWeight: 700,
      marginRight: 3,
      marginBottom: 3,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

// ─── Card shell ──────────────────────────────────────────────────────────────

function Card({ meta, dateObj, children, onDelete, onOpen, fullText }) {
  const [open, setOpen] = useState(false);
  const dot   = meta.dot;
  const bg    = meta.bg;
  const border= meta.border;
  const canExpand = !!fullText;
  const toggleOpen = () => {
    if (canExpand) setOpen(v => !v);
    else onOpen && onOpen();
  };

  return (
    <div onClick={toggleOpen} style={{
      background: "#fff",
      borderRadius: 14,
      boxShadow: "0 2px 10px rgba(0,0,0,.07)",
      border: `1px solid ${border}33`,
      borderLeft: `5px solid ${border}`,
      overflow: "hidden",
      marginBottom: 2,
      cursor: (onOpen || canExpand) ? "pointer" : "default",
    }}>
      {/* Header row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px 0 14px",
      }}>
        {/* Colored dot */}
        <span style={{
          width: 13, height: 13,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
          boxShadow: `0 0 0 3px ${dot}22`,
        }} />

        {/* Type label */}
        <span style={{
          fontSize: 10,
          fontWeight: 900,
          color: dot,
          flex: 1,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}>{meta.label}</span>

        {/* Date badge */}
        <span style={{
          background: meta.badge,
          color: meta.badgeTxt,
          border: `1px solid ${meta.border}33`,
          borderRadius: 20,
          padding: "2px 9px",
          fontSize: 10,
          fontWeight: 800,
          flexShrink: 0,
        }}>{fmtDate(dateObj)}{fmtTime(dateObj) ? " · " + fmtTime(dateObj) : ""}</span>
        {onDelete && (
          <button
            type="button"
            onClick={(e)=>{e.stopPropagation();onDelete&&onDelete();}}
            style={{
              background: "#FFF5F5",
              color: VM,
              border: `1px solid ${VM}55`,
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 900,
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            Apagar
          </button>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: border + "20", margin: "8px 16px 0" }} />

      {/* Body */}
      <div style={{ padding: "10px 16px 14px 16px" }}>
        {children}
        {(onOpen || canExpand) && (
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}>
            {canExpand && open && (
              <button
                type="button"
                onClick={(e)=>{e.stopPropagation();globalThis.navigator?.clipboard?.writeText(fullText);}}
                style={{
                  border:"1px solid "+T+"55",background:"#F0F9FF",
                  color:T,borderRadius:8,padding:"5px 10px",
                  fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit",
                }}
              >
                Copiar
              </button>
            )}
            <button
              type="button"
              onClick={(e)=>{e.stopPropagation();toggleOpen();}}
              style={{
                border:"1px solid "+meta.border+"55",background:meta.badge,
                color:meta.badgeTxt,borderRadius:8,padding:"5px 10px",
                fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit",
              }}
            >
              {canExpand ? (open ? "Fechar" : "Expandir") : "Abrir resumo"}
            </button>
          </div>
        )}
        {canExpand && open && (
          <div style={{
            marginTop:10,
            background:bg,
            border:"1px solid "+border+"33",
            borderRadius:12,
            padding:"12px 14px",
          }}>
            <BulletLines text={fullText} color="#24364f" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Author line ─────────────────────────────────────────────────────────────

function AuthorLine({ text }) {
  if (!text) return null;
  return (
    <div style={{
      fontSize: 11,
      color: "#6B7280",
      fontStyle: "italic",
      marginBottom: 8,
    }}>{text}</div>
  );
}

// ─── Bullet list ─────────────────────────────────────────────────────────────

function BulletLines({ text, color }) {
  if (!text) return null;
  const lines = formatClinicalTimelineText(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return (
    <div style={{ marginTop: 4 }}>
      {lines.map((l, i) => {
        // ===SEÇÃO=== — título grande, negrito, maiúsculas
        if (/^===.+===$/.test(l)) {
          const titulo = l.replace(/^===|===$/g, "").trim();
          return (
            <div key={i} style={{
              fontWeight: 900,
              fontSize: 18,
              color: N,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginTop: i > 0 ? 14 : 4,
              marginBottom: 5,
              paddingBottom: 4,
              borderBottom: `3px solid ${G}`,
            }}>{titulo}</div>
          );
        }
        // Linha com bullet e chave: valor
        const bulletMatch = l.match(/^•\s*([^:]{1,40}):\s*(.+)$/);
        if (bulletMatch) {
          return (
            <div key={i} style={{ display: "flex", gap: 7, fontSize: 13, color: color || "#374151", lineHeight: 1.62, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: N, flexShrink: 0 }}>• {bulletMatch[1]}:</span>
              <span style={{ flex: 1 }}>{bulletMatch[2]}</span>
            </div>
          );
        }
        // Linha simples
        return (
          <div key={i} style={{
            display: "flex",
            gap: 8,
            fontSize: 13,
            color: color || "#374151",
            lineHeight: 1.62,
            marginBottom: 4,
          }}>
            <span style={{ color: N, fontWeight: 900, flexShrink: 0 }}>•</span>
            <span>{l.replace(/^•\s*/, "")}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Alarm section ───────────────────────────────────────────────────────────

function AlarmSection({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{
      marginTop: 10,
      background: "#FEF2F2",
      border: `1px solid ${VM}44`,
      borderRadius: 10,
      padding: "7px 12px",
      display: "flex",
      gap: 8,
      alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>🚨</span>
      <div>
        <span style={{ fontWeight: 800, color: VM, fontSize: 12 }}>Alarme: </span>
        <span style={{ color: VM, fontSize: 12 }}>{Array.isArray(items) ? items.join(" · ") : items}</span>
      </div>
    </div>
  );
}

// ─── QT status ───────────────────────────────────────────────────────────────

function QTStatus({ liberada, autorizadoPor, bloqueadaPor }) {
  if (liberada == null) return null;
  return (
    <div style={{
      marginTop: 8,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: liberada ? "#DCFCE7" : "#FEF2F2",
      border: `1px solid ${liberada ? VE : VM}55`,
      borderRadius: 20,
      padding: "4px 14px",
      fontSize: 12,
      fontWeight: 800,
      color: liberada ? VE : VM,
    }}>
      {liberada ? "✅" : "🚫"}
      {liberada
        ? `QT LIBERADA${autorizadoPor ? " — " + autorizadoPor : ""}`
        : `QT BLOQUEADA${bloqueadaPor ? " — " + bloqueadaPor : " — aguarda médico"}`}
    </div>
  );
}

// ─── Exam Card ───────────────────────────────────────────────────────────────

function ExamCard({ e, dateObj, onDelete, onOpen }) {
  const meta   = TYPE_META.exam;
  const nome   = e.nome || e.tipo || e.nomeExame || "Exame";
  const resumo = e.resumo || e.resultado || e.laudo || "";
  const achados = Array.isArray(e.achadosPrincipais || e.achados)
    ? (e.achadosPrincipais || e.achados)
    : [];
  const fonte  = e.fonte || e.responsavel || "";
  const conclusao = e.conclusao || "";

  const bodyText = [
    resumo,
    ...achados,
    conclusao,
  ].filter(Boolean).join("\n");

  const fullText = [
    nome,
    bodyText,
  ].filter(Boolean).join("\n\n");

  return (
    <Card meta={meta} dateObj={dateObj} onDelete={onDelete} onOpen={onOpen} fullText={fullText}>
      <div style={{ fontSize: 12, fontWeight: 900, color: G, marginBottom: 3 }}>{nome}</div>
      {fonte && <AuthorLine text={"Fonte: " + fonte} />}
      {bodyText && <BulletLines text={bodyText} color="#4B5563" />}
    </Card>
  );
}

// ─── Triage Card ─────────────────────────────────────────────────────────────

function TriageCard({ t, dateObj, onDelete, onOpen }) {
  const autor   = t.enfermeiroNome || t.enfermeiro || t.autor || "";
  const cargo   = t.cargo || "";
  const tipo    = t.tipo || "";
  const isMedico = tipo.toLowerCase().includes("consul")
    || tipo.toLowerCase().includes("evolu")
    || String(autor).toLowerCase().includes("dr.")
    || String(autor).toLowerCase().includes("dr ");

  const meta = isMedico ? TYPE_META.evolucao : TYPE_META.triage;

  // Vitals pills
  const vitals = [
    t.pa          && { l: "PA " + t.pa,           c: N  },
    t.fc          && { l: "FC " + t.fc,           c: T  },
    t.temperatura && { l: "T " + t.temperatura + "°C", c: VM },
    t.saturacao   && { l: "SpO₂ " + t.saturacao + "%", c: VE },
    t.ecog != null && { l: "ECOG " + t.ecog,      c: G  },
    t.peso        && { l: t.peso + " kg",          c: AM },
  ].filter(Boolean);

  const queixa  = t.queixaAtual || t.queixa || "";
  const obs     = t.obs || t.observacoes || "";
  const evolText = t.evolucao || t.texto || t.descricao || "";
  const alarmes = t.sinaisAlarme || [];

  const authorLine = [autor, cargo].filter(Boolean).join(" · ");
  const fullText = [
    authorLine,
    queixa && "QUEIXA: " + queixa,
    evolText || obs,
    Array.isArray(alarmes) && alarmes.length ? "SINAIS DE ALARME: " + alarmes.join(" · ") : "",
    t.qtLiberada != null ? (t.qtLiberada ? "QT LIBERADA" : "QT BLOQUEADA") : "",
  ].filter(Boolean).join("\n\n");

  return (
    <Card meta={meta} dateObj={dateObj} onDelete={onDelete} onOpen={onOpen} fullText={fullText}>
      {authorLine && <AuthorLine text={authorLine} />}

      {/* Vitals */}
      {vitals.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {vitals.map((v, i) => <Pill key={i} label={v.l} color={v.c} />)}
        </div>
      )}

      {/* Queixa */}
      {queixa && (
        <div style={{ fontSize: 11, color: "#4B5563", marginBottom: 5 }}>
          <span style={{ fontWeight: 700, color: N }}>Queixa: </span>{queixa}
        </div>
      )}

      {/* Evolution text with bullet points */}
      {evolText && <BulletLines text={evolText} color="#374151" />}
      {obs && !evolText && <BulletLines text={obs} color="#374151" />}

      {/* Alarm */}
      <AlarmSection items={alarmes} />

      {/* QT */}
      <QTStatus
        liberada={t.qtLiberada}
        autorizadoPor={t.autorizadoPor}
        bloqueadaPor={t.qtBloqueadaPor}
      />
    </Card>
  );
}

// ─── Marco Card (milestone clínico) ──────────────────────────────────────────

function MarcoCard({ m, dateObj, onOpen }) {
  const ICONES = {
    diagnostico:   "🔬",
    inicio_qt:     "💉",
    apac:          "📋",
    consulta:      "🩺",
    cirurgia:      "🔪",
    radioterapia:  "☢️",
    obito:         "🖤",
    remissao:      "✅",
    recidiva:      "⚠️",
    outro:         "📌",
  };
  const icone = ICONES[m.tipo] || "📌";
  return (
    <div onClick={onOpen} style={{
      background: "#F5F3FF",
      border: `2px solid ${MARCO_COR}`,
      borderLeft: `6px solid ${MARCO_COR}`,
      borderRadius: 14,
      padding: "12px 16px",
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      cursor: onOpen ? "pointer" : "default",
    }}>
      <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{icone}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: MARCO_COR, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Marco Clínico
          </span>
          <span style={{
            background: "#EDE9FE", color: MARCO_COR, borderRadius: 20,
            padding: "2px 10px", fontSize: 11, fontWeight: 800,
          }}>{fmtDate(dateObj)}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#1E1B4B", marginBottom: m.descricao ? 4 : 0 }}>
          {m.titulo}
        </div>
        {m.descricao && (
          <div style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.55 }}>
            {m.descricao}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Timeline dot + date badge on left ───────────────────────────────────────

function TimelineSide({ dateObj, color, isLast }) {
  return (
    <div style={{
      width: 68,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      paddingTop: 14,
      position: "relative",
    }}>
      {/* Vertical line */}
      {!isLast && (
        <div style={{
          position: "absolute",
          top: 28,
          right: 9,
          bottom: -20,
          width: 2,
          background: color + "33",
          zIndex: 0,
        }} />
      )}

      {/* Circle on line */}
      <div style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "#fff",
        border: `3px solid ${color}`,
        zIndex: 1,
        flexShrink: 0,
        boxShadow: `0 0 0 4px ${color}18`,
      }} />

      {/* Day/month */}
      <div style={{
        fontSize: 11,
        fontWeight: 900,
        color: color,
        marginTop: 4,
        textAlign: "right",
      }}>
        {dateObj instanceof Date && !isNaN(dateObj)
          ? dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
          : "—"}
      </div>

      {/* Year */}
      <div style={{ fontSize: 9, color: "#9CA3AF", textAlign: "right" }}>
        {dateObj instanceof Date && !isNaN(dateObj) ? dateObj.getFullYear() : ""}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      textAlign: "center",
      padding: "40px 24px",
      background: "#fff",
      borderRadius: 16,
      border: "1px dashed #CBD5E1",
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🗂️</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: N, marginBottom: 6 }}>
        Nenhum registro encontrado
      </div>
      <div style={{ fontSize: 12, color: "#9CA3AF" }}>
        Exames, triagens e evoluções aparecem aqui conforme forem registrados.
      </div>
    </div>
  );
}

function TimelineModal({ item, onClose }) {
  if (!item) return null;
  const meta = TYPE_META[item.type] || TYPE_META.marco;
  const texto = fullItemText(item);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.48)",zIndex:9500,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:18}}>
      <div style={{background:"#fff",borderRadius:16,border:"1px solid #DDE3EC",boxShadow:"0 18px 60px rgba(15,23,42,.28)",width:"min(920px,96vw)",maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:"1px solid #E2E8F0",background:meta.bg,borderRadius:"16px 16px 0 0"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:950,color:meta.badgeTxt,textTransform:"uppercase",letterSpacing:.8}}>{meta.label} · {fmtDate(item.date)}</div>
            <div style={{fontSize:18,fontWeight:950,color:N,lineHeight:1.2,marginTop:2}}>{itemTitle(item)||"Registro clínico"}</div>
          </div>
          <button type="button" onClick={()=>globalThis.navigator?.clipboard?.writeText(texto)} style={{border:"1px solid "+meta.border+"55",background:"#fff",color:N,borderRadius:9,padding:"8px 12px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>Copiar</button>
          <button type="button" onClick={onClose} style={{border:"1px solid #CBD5E1",background:"#fff",color:"#475569",borderRadius:9,padding:"8px 12px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>Fechar</button>
        </div>
        <div style={{padding:18}}>
          <BulletLines text={texto} color="#24364f" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EvolutionTimeline({ exams = [], triages = [], evolucoes = [], marcos = [], onDelete, onVoltar, onProsseguir, onConcluir }) {
  const [filtro, setFiltro] = useState("all");
  const [expanded, setExpanded] = useState({});
  const [selecionado, setSelecionado] = useState(null);

  const rawItems = useMemo(() => ([
    // ── Marcos clínicos (diagnóstico, início QT, APAC, etc.) ───────────────
    ...marcos.map((m, index) => ({
      date: parseTimelineDate(m.data || m.criadoEm || Date.now()),
      type: "marco",
      data: m,
      index,
    })),
    // ── Exames / Laudos ────────────────────────────────────────────────────
    ...exams.map((e, index) => ({ e: normalizarExamTimeline(e), index }))
      .filter(({ e }) => deveExibirExamTimeline(e))
      .map(({ e, index }) => ({
        date: parseTimelineDate(e.data || e.dataExame || e.criadoEm || e.createdAt || Date.now()),
        type: "exam",
        data: e,
        index,
      })),
    // ── Triagens e evoluções ───────────────────────────────────────────────
    ...triages.map((t, index) => {
      const tipo = String(t.tipo || t.fonte || t.__source || "").toLowerCase();
      const autor = String(t.autor || t.enfermeiroNome || "").toLowerCase();
      const isEvolucao = t.__source === "evolucao" || tipo.includes("consulta") || tipo.includes("evolu") || autor.includes("dr.");
      return {
        date: parseTimelineDate(t.dataHora || t.data || t.criadoEm || Date.now()),
        type: isEvolucao ? "evolucao" : "triage",
        data: t,
        index,
      };
    }),
    ...evolucoes.map((ev, index) => ({
      date: parseTimelineDate(ev.dataHora || ev.data || ev.criadoEm || Date.now()),
      type: "evolucao",
      data: ev,
      index,
    })),
  ]), [exams, triages, evolucoes, marcos]);

  const items = useMemo(() => {
    const seen = new Set();
    return rawItems
      .filter(item => filtro === "all" || item.type === filtro)
      .sort((a, b) => b.date - a.date)
      .filter(item => {
        const key = itemSignature(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [rawItems, filtro]);

  const counts = useMemo(() => {
    const unique = [];
    const seen = new Set();
    rawItems.forEach(item => {
      const key = itemSignature(item);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });
    return {
      all:     unique.length,
      marco:   unique.filter(i => i.type === "marco").length,
      exam:    unique.filter(i => i.type === "exam").length,
      evolucao:unique.filter(i => i.type === "evolucao").length,
      triage:  unique.filter(i => i.type === "triage").length,
    };
  }, [rawItems]);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach(item => {
      const key = timelineDateKey(item.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries()).map(([key, list]) => ({ key, date: list[0]?.date, list }));
  }, [items]);

  if (!items.length) return <EmptyState />;

  const filtros = [
    ["all",      "Todos",    counts.all,      N         ],
    ["marco",    "Marcos",   counts.marco,    MARCO_COR ],
    ["exam",     "Exames",   counts.exam,     G         ],
    ["evolucao", "Evoluções",counts.evolucao, N         ],
    ["triage",   "Triagem",  counts.triage,   T         ],
  ].filter(([id,, count]) => id === "all" || count > 0);

  return (
    <div style={{
      display: "grid",
      gap: 12,
      padding: "2px 4px 8px",
    }}>
      <div style={{
        background: "#fff",
        border: "1px solid #DDE3EC",
        borderRadius: 14,
        padding: "10px 12px",
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: N }}>Timeline clínica</div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>
            Duplicados ocultos e registros agrupados por data.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {onVoltar && <button type="button" onClick={onVoltar} style={{border:"1px solid #CBD5E1",background:"#fff",color:N,borderRadius:999,padding:"5px 10px",fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>← Voltar</button>}
          <button type="button" onClick={()=>globalThis.navigator?.clipboard?.writeText(items.map(fullItemText).join("\n\n---\n\n"))} style={{border:"1px solid "+T+"55",background:"#F0F9FF",color:T,borderRadius:999,padding:"5px 10px",fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>Copiar</button>
          {filtros.map(([id, label, count, color]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFiltro(id)}
              style={{
                border: `1px solid ${filtro === id ? color : "#CBD5E1"}`,
                background: filtro === id ? color : "#F8FAFC",
                color: filtro === id ? "#fff" : color,
                borderRadius: 999,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 900,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {label} · {count}
            </button>
          ))}
        </div>
      </div>

      {groups.map((group, groupIndex) => {
        const aberta = !!expanded[group.key];
        const limite = aberta ? group.list.length : 5;
        const visiveis = group.list.slice(0, limite);
        const hidden = group.list.length - visiveis.length;
        const cMarco= group.list.filter(i => i.type === "marco").length;
        const cExam = group.list.filter(i => i.type === "exam").length;
        const cEvol = group.list.filter(i => i.type === "evolucao").length;
        const cTri  = group.list.filter(i => i.type === "triage").length;

        return (
          <section key={group.key} style={{
            position: "relative",
            paddingLeft: 18,
            borderLeft: `3px solid ${groupIndex === 0 ? G : "#DDE3EC"}`,
          }}>
            <div style={{
              position: "absolute",
              left: -8,
              top: 12,
              width: 13,
              height: 13,
              borderRadius: "50%",
              background: "#fff",
              border: `3px solid ${groupIndex === 0 ? G : N}`,
              boxShadow: `0 0 0 4px ${(groupIndex === 0 ? G : N)}18`,
            }} />

            <div style={{
              background: "#FFFFFF",
              border: "1px solid #DDE3EC",
              borderRadius: 14,
              padding: "10px 12px",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}>
              <div>
                <div style={{ color: N, fontSize: 12, fontWeight: 900 }}>{fmtDate(group.date)}</div>
                <div style={{ color: "#64748B", fontSize: 10 }}>{group.list.length} registro(s) neste dia</div>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {cMarco> 0 && <Pill label={`${cMarco} marco(s)`}      color={MARCO_COR} />}
                {cExam > 0 && <Pill label={`${cExam} exame(s)`}       color={G} />}
                {cEvol > 0 && <Pill label={`${cEvol} evolução(ões)`}  color={N} />}
                {cTri  > 0 && <Pill label={`${cTri} triagem(ns)`}     color={T} />}
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {visiveis.map((item, i) => (
                <div key={itemSignature(item) + i}>
                  {item.type === "marco"
                    ? <MarcoCard m={item.data} dateObj={item.date} onOpen={()=>setSelecionado(item)} />
                    : item.type === "exam"
                    ? <ExamCard e={item.data} dateObj={item.date} onOpen={()=>setSelecionado(item)} onDelete={onDelete ? () => onDelete(item) : null} />
                    : <TriageCard t={item.data} dateObj={item.date} onOpen={()=>setSelecionado(item)} onDelete={onDelete ? () => onDelete(item) : null} />}
                </div>
              ))}
            </div>

            {hidden > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(x => ({ ...x, [group.key]: true }))}
                style={{
                  marginTop: 8,
                  width: "100%",
                  border: "1px dashed #CBD5E1",
                  background: "#F8FAFC",
                  color: N,
                  borderRadius: 10,
                  padding: "8px 10px",
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Ver mais {hidden} registro(s) deste dia
              </button>
            )}
            {aberta && group.list.length > 5 && (
              <button
                type="button"
                onClick={() => setExpanded(x => ({ ...x, [group.key]: false }))}
                style={{
                  marginTop: 8,
                  border: "none",
                  background: "transparent",
                  color: "#64748B",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Recolher este dia
              </button>
            )}
          </section>
        );
      })}
      {(onProsseguir || onConcluir) && (
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #E2E8F0",paddingTop:10}}>
          {onProsseguir && <button type="button" onClick={onProsseguir} style={{border:"none",background:N,color:"#fff",borderRadius:10,padding:"9px 14px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>Prosseguir →</button>}
          {onConcluir && <button type="button" onClick={onConcluir} style={{border:"none",background:VE,color:"#fff",borderRadius:10,padding:"9px 14px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>Concluir atendimento e salvar</button>}
        </div>
      )}
      <TimelineModal item={selecionado} onClose={()=>setSelecionado(null)} />
    </div>
  );
}
