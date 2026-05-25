// ─────────────────────────────────────────────────────────────────────────────
// primitives.jsx — Micro-componentes UI reutilizáveis
// Importados por App.jsx e por feature-pages (FarmaciaPage, etc.)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from "react";
import { N, T, G, VE, AM, VM, HOSP } from "../../utils/constants";

// ── UTILITÁRIOS DE TEXTO / IMPRESSÃO ─────────────────────────────────────────
export async function copiarTexto(texto) {
  const t = String(texto || "");
  try { await navigator.clipboard.writeText(t); return true; }
  catch (_) {
    try {
      const ta = document.createElement("textarea");
      ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.left = "-9999px";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); return true;
    } catch (e) { alert("Não foi possível copiar automaticamente. Selecione o texto e use Ctrl+C."); return false; }
  }
}

export function limparMarkdown(txt = "") {
  return String(txt || "")
    .replace(/\*{1,3}([^*\n]{1,200})\*{1,3}/g, "$1")
    .replace(/_{2}([^_\n]{1,200})_{2}/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^={3,}[-=]*\s*$/gm, "")
    .replace(/^-{3,}\s*$/gm, "")
    .replace(/^>\s*/gm, "")
    .replace(/`([^`\n]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, "• ")
    .replace(/\/{2,}/g, "/")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const gerarHTML = (titulo, conteudo) =>
  `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${titulo}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;background:#F0F4F8;padding:20px;font-size:13px}.pg{background:#fff;max-width:780px;margin:0 auto;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.12);overflow:hidden}.hd{background:#1B365D;padding:18px 24px}.hn{color:#fff;font-size:14px;font-weight:900}.hs{color:rgba(255,255,255,.55);font-size:10px;margin-top:2px}.ct{padding:22px 24px}h1{color:#1B365D;font-size:16px;font-weight:900;border-bottom:3px solid #B8860B;padding-bottom:7px;margin-bottom:14px}pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:12px;line-height:1.8;color:#1E293B;background:#F8FAFC;border-left:4px solid #B8860B;padding:12px 14px;border-radius:0 8px 8px 0;margin-bottom:14px}.sl{font-size:10px;color:#64748B;text-align:center;padding:12px 0;border-top:1px solid #CBD5E1}.ft{border-top:2px solid #E2E8F0;padding:12px 24px;display:flex;justify-content:space-between;background:#F8FAFC;font-size:10px;color:#64748B}.np{margin-top:16px;text-align:center}.bp{background:#B8860B;color:#1B365D;border:none;padding:11px 28px;font-size:13px;border-radius:8px;cursor:pointer;font-weight:900}@media print{body{background:#fff;padding:0}.pg{box-shadow:none}.np{display:none}}</style></head><body><div class="pg"><div class="hd"><div class="hn">HOSPITAL DO BEM · Unidade Oncológica</div><div class="hs">Complexo Hospitalar Regional Dep. Janduhy Carneiro · Patos/PB</div></div><div class="ct"><h1>${titulo}</h1><pre>${(conteudo || "").replace(/</g, "&lt;")}</pre><div class="sl">Dr. Silas Negrão Serra Jr. · CRM-PB 17341 · RQE Oncologia Clínica 9099</div></div><div class="ft"><span>Hospital do Bem · Patos/PB</span><span>${new Date().toLocaleString("pt-BR")}</span></div></div><div class="np"><button class="bp" onclick="window.print()">🖨 Imprimir / Salvar PDF</button></div></body></html>`;

export const abrirDoc = (titulo, conteudo) => {
  try {
    const w = window.open("", "_blank", "width=820,height=700,scrollbars=yes");
    if (w && w.document) { w.document.open(); w.document.write(gerarHTML(titulo, conteudo)); w.document.close(); }
    else throw 0;
  } catch (e) {
    const a = document.createElement("a");
    a.href = "data:text/html;charset=utf-8," + encodeURIComponent(gerarHTML(titulo, conteudo));
    a.download = (titulo || "doc").slice(0, 30) + ".html";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
};

// ── STYLE HELPERS ─────────────────────────────────────────────────────────────
export const sc_ = {
  card: (e = {}) => ({ background: "#fff", border: "1px solid #CBD5E1", borderRadius: 16, padding: 16, boxShadow: "0 3px 12px rgba(15,23,42,.05)", ...e }),
  btn: (v, e = {}) => ({
    border: "none", cursor: "pointer", fontWeight: 800, borderRadius: 10, padding: "9px 16px", fontSize: 13, fontFamily: "inherit", transition: "all .15s",
    ...(v === "gold" ? { background: G, color: "#fff" } : v === "navy" ? { background: N, color: "#fff" } : v === "teal" ? { background: T, color: "#fff" } : v === "red" ? { background: VM, color: "#fff" } : v === "green" ? { background: VE, color: "#fff" } : { background: "#fff", color: N, border: "1px solid #CBD5E1" }),
    ...e
  }),
  inp: { width: "100%", border: "1px solid #CBD5E1", borderRadius: 9, padding: "9px 11px", fontFamily: "inherit", fontSize: 13, outline: "none", background: "#F8FAFC", boxSizing: "border-box", color: "#1E293B" },
};

export const sc = {
  card: (e = {}) => ({ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 13, padding: 14, boxShadow: "0 2px 8px rgba(15,23,42,.06)", ...e }),
  inp: { width: "100%", border: "1px solid #CBD5E1", borderRadius: 8, padding: "8px 10px", fontFamily: "inherit", fontSize: 12, outline: "none", background: "#F8FAFC", boxSizing: "border-box", color: "#1E293B" },
  btn: (v, e = {}) => ({
    border: "none", cursor: "pointer", fontWeight: 800, borderRadius: 9, padding: "8px 14px", fontSize: 12, fontFamily: "inherit", transition: "all .15s",
    ...({ gold: { background: G, color: "#fff" }, navy: { background: N, color: "#fff" }, teal: { background: T, color: "#fff" }, red: { background: VM, color: "#fff" }, green: { background: VE, color: "#fff" }, ghost: { background: "#F1F5F9", color: N, border: "1px solid #E2E8F0" }, warn: { background: AM, color: "#fff" } })[v],
    ...e
  }),
};

export const TODAY = () => new Date().toLocaleDateString("pt-BR");
export const NOW = () => new Date().toLocaleString("pt-BR");

// ── BOTÃO ─────────────────────────────────────────────────────────────────────
export function Btn({ v = "gold", onClick, ch, s = {}, dis = false }) {
  return <button disabled={dis} style={{ ...sc_.btn(v), opacity: dis ? .5 : 1, ...s }} onClick={onClick}>{ch}</button>;
}

// ── CARTÃO / TÍTULOS ──────────────────────────────────────────────────────────
export function Card({ ch, s = {} }) { return <div style={sc_.card(s)}>{ch}</div>; }
export function H2({ ch, s = {} }) { return <h2 style={{ margin: "0 0 12px", color: N, fontSize: 19, fontWeight: 900, ...s }}>{ch}</h2>; }
export function H3({ ch, s = {} }) { return <h3 style={{ margin: "0 0 9px", color: N, fontSize: 15, fontWeight: 900, ...s }}>{ch}</h3>; }
export function H3b({ ch, s = {} }) { return <h3 style={{ margin: "0 0 9px", color: N, fontSize: 13, fontWeight: 900, ...s }}>{ch}</h3>; }
export function G2({ ch, s = {} }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, ...s }}>{ch}</div>; }

// ── CAMPO / FORMULÁRIO ────────────────────────────────────────────────────────
export function Fld({ l, val, set, ta, rows = 2, ph }) {
  const advance = e => {
    if (e.key === "Enter" && !ta) {
      e.preventDefault();
      const all = Array.from(document.querySelectorAll("input,select,textarea"));
      const i = all.indexOf(e.target);
      if (i < all.length - 1) all[i + 1].focus();
    }
  };
  return (
    <label style={{ display: "grid", gap: 3, marginBottom: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: N, textTransform: "uppercase", letterSpacing: .3 }}>{l}</span>
      {ta
        ? <textarea rows={rows} value={val || ""} onChange={e => set(e.target.value)} placeholder={ph} style={{ ...sc_.inp, resize: "vertical", fontSize: 14 }} />
        : <input value={val || ""} onChange={e => set(e.target.value)} onKeyDown={advance} placeholder={ph} style={{ ...sc_.inp, fontSize: 14 }} />}
    </label>
  );
}

export function CampoLinhaCadastro({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>{children}</div>;
}

export function CampoCadastro({ l, k, form, setCampo, ta = false, rows = 2, ph }) {
  const avancarDe = (el) => { const all = Array.from(document.querySelectorAll("input,select,textarea")); const i = all.indexOf(el); if (i >= 0 && i < all.length - 1) all[i + 1].focus(); };
  const onKey = e => { if (e.key === "Enter" && !ta) { e.preventDefault(); avancarDe(e.target); } };
  const onChange = e => {
    const v = e.target.value; setCampo(k, v);
    const d = String(v || "").replace(/\D/g, "");
    const pronto = (k === "cns" && d.length >= 15) || (k === "cpf" && d.length >= 11) || (k === "cep" && d.length >= 8) || (k === "municipio_cod" && d.length >= 7) || (["tel", "telefone_celular", "telefone_alternativo", "responsavel_telefone"].includes(k) && d.length >= 10) || (k === "nasc" && String(v).length >= 10);
    if (pronto) setTimeout(() => avancarDe(e.target), 40);
  };
  return (
    <label style={{ display: "grid", gap: 3, marginBottom: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: N, textTransform: "uppercase", letterSpacing: .3 }}>{l}</span>
      {ta
        ? <textarea rows={rows} value={form?.[k] || ""} onChange={onChange} placeholder={ph} style={{ ...sc_.inp, resize: "vertical", fontSize: 14 }} />
        : <input value={form?.[k] || ""} onChange={onChange} onKeyDown={onKey} placeholder={ph} autoComplete="off" style={{ ...sc_.inp, fontSize: 14 }} />}
    </label>
  );
}

// ── TABELA ────────────────────────────────────────────────────────────────────
export function Tbl({ cols, rows }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #CBD5E1" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{cols.map(c => <th key={c} style={{ background: N, color: "#fff", padding: "7px 10px", textAlign: "left", fontSize: 11 }}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} style={{ background: i % 2 ? "#F8FAFC" : "#fff" }}>{r.map((c, j) => <td key={j} style={{ padding: "7px 10px", fontSize: 12, borderTop: "1px solid #F1F5F9" }}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
export function Bge({ t = "muted", ch }) {
  const m = { ok: { bg: "#EAF7EE", c: VE }, warn: { bg: "#FFF7E6", c: AM }, bad: { bg: "#FDECEC", c: VM }, muted: { bg: "#F1F5F9", c: "#64748B" }, gold: { bg: "#FDF3DC", c: G } };
  const x = m[t] || m.muted;
  return <span style={{ display: "inline-flex", padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 900, background: x.bg, color: x.c }}>{ch}</span>;
}

// ── COPY BOX ──────────────────────────────────────────────────────────────────
export function Cbox({ text, maxH = 200 }) {
  const [cp, setCp] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <button style={sc_.btn("ghost", { fontSize: 10, padding: "3px 9px" })} onClick={async () => { await copiarTexto(text); setCp(true); setTimeout(() => setCp(false), 1300); }}>{cp ? "✓ Copiado" : "Copiar"}</button>
      </div>
      <pre style={{ whiteSpace: "pre-wrap", lineHeight: 1.58, margin: 0, background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 10, padding: 12, fontSize: 13, maxHeight: maxH, overflowY: "auto", fontFamily: "Segoe UI, Arial, sans-serif", fontWeight: 650, color: N }}>{text}</pre>
    </div>
  );
}

// ── RESUMO BULLETS ────────────────────────────────────────────────────────────
export function linhasResumoBullets(texto = "", limite = 40) {
  return limparMarkdown(texto).split(/\n+/).map(l => l.trim()).filter(Boolean).flatMap(l => {
    const sec = l.match(/^={0,3}\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 /\-]{4,})\s*:?\s*={0,3}$/i);
    if (sec) return [{ tipo: "secao", texto: sec[1].replace(/[:]+$/, "").trim() }];
    return l.split(/\s+[•]\s+|;\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/).map(x => x.replace(/^[•\-\*\d.)\s]+/, "").trim()).filter(Boolean).map(x => ({ tipo: "item", texto: x }));
  }).filter(x => x.texto && !/^conduta\s*:?$/i.test(x.texto)).slice(0, limite);
}
export function resumoBulletsTexto(texto = "") { return linhasResumoBullets(texto, 80).map(x => x.tipo === "secao" ? x.texto.toUpperCase() + ":" : "• " + x.texto).join("\n"); }

export function ResumoBullets({ texto, maxH = 260 }) {
  const [cp, setCp] = useState(false);
  const linhas = linhasResumoBullets(texto);
  const alerta = String(texto || "").trim().startsWith("⚠");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <button style={sc_.btn("ghost", { fontSize: 10, padding: "3px 9px" })} onClick={async () => { await copiarTexto(resumoBulletsTexto(texto)); setCp(true); setTimeout(() => setCp(false), 1300); }}>{cp ? "✓ Copiado" : "Copiar bullets"}</button>
      </div>
      <div style={{ background: "#F0F9FF", border: `1px solid ${alerta ? AM : T}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, lineHeight: 1.55, maxHeight: maxH, overflowY: "auto", color: alerta ? AM : "#1e3a5f" }}>
        {alerta
          ? <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "Segoe UI, Arial, sans-serif", fontWeight: 750 }}>{texto}</pre>
          : <div style={{ display: "grid", gap: 5 }}>
            {linhas.map((l, i) => l.tipo === "secao"
              ? <div key={i} style={{ fontSize: 10, fontWeight: 950, color: G, textTransform: "uppercase", letterSpacing: .6, marginTop: i ? 8 : 0 }}>{l.texto}</div>
              : <div key={i} style={{ display: "grid", gridTemplateColumns: "14px 1fr", gap: 6, alignItems: "start", fontWeight: 700 }}><span style={{ color: T, fontWeight: 950 }}>•</span><span>{l.texto}</span></div>)}
          </div>}
      </div>
    </div>
  );
}

// ── TOP BAR / FOOTER ──────────────────────────────────────────────────────────
export function TopBar({ title, back, alertCount = 0, onAlert }) {
  return (
    <div style={{ background: N, color: "#fff", padding: "8px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,.25)" }}>
      {back && <button onClick={back} style={{ background: "none", border: "1px solid rgba(255,255,255,.25)", color: "#fff", padding: "4px 11px", borderRadius: 999, cursor: "pointer", fontSize: 11 }}>← Voltar</button>}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 14 }}>{title}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(184,134,11,.16)", border: `1px solid ${G}66`, color: G, borderRadius: 999, padding: "2px 9px", fontSize: 10, fontWeight: 900, marginTop: 3 }}>✦ Criado por Dr. Silas Negrão Serra Jr.</div>
      </div>
      {alertCount > 0 && <div style={{ background: VM, color: "#fff", padding: "4px 13px", borderRadius: 999, fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 }} onClick={onAlert}>🚨 {alertCount} alerta{alertCount > 1 ? "s" : ""}</div>}
    </div>
  );
}

export function TopBarOld({ title, back, alertCount = 0, onAlert }) {
  return <div style={{ background: N, color: "#fff", padding: "7px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,.25)" }}>{back && <button onClick={back} style={{ background: "none", border: "1px solid rgba(255,255,255,.25)", color: "#fff", padding: "4px 11px", borderRadius: 999, cursor: "pointer", fontSize: 11 }}>← Voltar</button>}<div style={{ flex: 1 }}><div style={{ fontWeight: 900, fontSize: 14 }}>{title}</div><div style={{ fontSize: 9, color: G, fontWeight: 700 }}>Dr. Silas Negrão · {HOSP}</div></div>{alertCount > 0 && <div style={{ background: VM, color: "#fff", padding: "4px 13px", borderRadius: 999, fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 }} onClick={onAlert}>🚨 {alertCount} alerta{alertCount > 1 ? "s" : ""}</div>}</div>;
}

export function Footer() {
  return (
    <div style={{ background: N, padding: "9px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, marginTop: "auto", borderTop: `3px solid ${G}` }}>
      <span style={{ color: G, fontWeight: 1000, fontSize: 14, letterSpacing: .5, textTransform: "uppercase" }}>✦ Dr. Silas Negrão Serra Jr.</span>
      <span style={{ color: "rgba(255,255,255,.45)", fontSize: 10 }}>CRM-PB 17341 · RQE Oncologia 9099 · {HOSP}</span>
    </div>
  );
}

export function FooterOld() {
  return (
    <div style={{ background: N, borderTop: `3px solid ${G}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, marginTop: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ color: G, fontSize: 18, lineHeight: 1 }}>✦</span>
        <div>
          <div style={{ color: G, fontWeight: 900, fontSize: 13, letterSpacing: .5 }}>Dr. Silas Negrão Serra Jr.</div>
          <div style={{ color: "rgba(255,255,255,.45)", fontSize: 9 }}>CRM-PB 17341 · RQE Oncologia Clínica 9099 · RQE Clínica Médica 9098</div>
        </div>
      </div>
      <span style={{ color: "rgba(255,255,255,.25)", fontSize: 9, textAlign: "right" }}>Oncologia Integrada<br />{HOSP}</span>
    </div>
  );
}

// ── PRINT MODAL ───────────────────────────────────────────────────────────────
export function PrintModal({ titulo, conteudo, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 9000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16, paddingTop: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, width: "100%", maxWidth: 660, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h2 style={{ color: "#1B365D", margin: 0, fontSize: 15 }}>{titulo}</h2>
          <div style={{ display: "flex", gap: 7 }}>
            <Btn v="teal" ch="📋" s={{ fontSize: 11 }} onClick={() => navigator.clipboard?.writeText(conteudo)} />
            <Btn v="gold" ch="🖨" s={{ fontSize: 11 }} onClick={() => abrirDoc(titulo, conteudo)} />
            <Btn v="ghost" ch="✕" s={{ fontSize: 11 }} onClick={onClose} />
          </div>
        </div>
        <hr style={{ margin: "8px 0 12px", border: "none", borderTop: "2px solid #B8860B" }} />
        <div style={{ background: "#F8FAFC", borderRadius: 9, padding: "10px 12px", maxHeight: 500, overflowY: "auto" }}>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "Georgia,serif", fontSize: 11, lineHeight: 1.7, color: "#374151", margin: 0 }}>{conteudo}</pre>
        </div>
      </div>
    </div>
  );
}

// ── MIC CAPTURA ───────────────────────────────────────────────────────────────
export function MicCaptura({ onTexto }) {
  const [rec, setRec] = useState(false);
  const start = () => {
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) return;
    const R = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    R.lang = "pt-BR";
    R.onresult = e => { onTexto && onTexto(e.results[0][0].transcript); };
    R.onerror = R.onend = () => setRec(false);
    R.start(); setRec(true);
  };
  return <button onClick={start} style={{ background: rec ? "#DC2626" : "#F1F5F9", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 14, display: "grid", placeItems: "center" }}>{rec ? "🔴" : "🎤"}</button>;
}

// ── CHAT ABA ──────────────────────────────────────────────────────────────────
export function ChatAba({ mensagens, addMsg, de = "Médico" }) {
  const [aberto, setAberto] = useState(false);
  const [txt, setTxt] = useState("");
  const [para, setPara] = useState("Todos");
  const [filtro, setFiltro] = useState("Todos");
  const bottomRef = useRef(null);
  const SETORES = ["Todos", "Médico", "Farmácia", "Enfermagem", "Recepção", "Assistência Social", "Paciente"];
  const CORES_S = { "Médico": N, "Farmácia": VE, "Enfermagem": T, "Recepção": G, "Assistência Social": "#7C3AED", "Paciente": "#6d28d9", "Sistema": "#64748B" };
  const filtradas = (mensagens || []).filter(m => filtro === "Todos" || m.de === filtro || m.para === filtro).slice(-20);
  const naoLidas = (mensagens || []).filter(m => m.para === de && m.lida === false).length;
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens, aberto]);
  const enviar = () => { if (!txt.trim()) return; addMsg && addMsg(de, para, txt, "msg"); setTxt(""); };
  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={() => setAberto(a => !a)} style={{ ...sc_.btn("navy", { width: "100%", padding: 9, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }) }}>
        <span>💬 Chat da Equipe</span>
        {naoLidas > 0 && <span style={{ background: VM, color: "#fff", borderRadius: 999, padding: "0 6px", fontSize: 10, fontWeight: 900 }}>{naoLidas}</span>}
        <span>{aberto ? "▲" : "▼"}</span>
      </button>
      {aberto && (
        <div style={{ border: `2px solid ${N}44`, borderRadius: "0 0 11px 11px", overflow: "hidden", marginTop: -2 }}>
          <div style={{ background: N, display: "flex", overflowX: "auto" }}>
            {SETORES.map(s => <button key={s} onClick={() => setFiltro(s)} style={{ border: "none", cursor: "pointer", padding: "5px 9px", fontSize: 9, fontWeight: 800, whiteSpace: "nowrap", fontFamily: "inherit", background: filtro === s ? G : N, color: filtro === s ? "#fff" : "rgba(255,255,255,.45)" }}>{s === "Todos" ? "Todos" : s.split(" ")[0]}</button>)}
          </div>
          <div style={{ background: "#F8FAFC", padding: 10, maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {filtradas.length === 0 && <p style={{ color: "#94A3B8", textAlign: "center", fontSize: 11 }}>Sem mensagens.</p>}
            {filtradas.map((m, i) => {
              const eu = m.de === de; const cor = CORES_S[m.de] || T;
              return (
                <div key={i} style={{ display: "flex", flexDirection: eu ? "row-reverse" : "row", gap: 5 }}>
                  <div style={{ maxWidth: "78%" }}>
                    <div style={{ display: "flex", gap: 5, marginBottom: 2, flexDirection: eu ? "row-reverse" : "row" }}>
                      <span style={{ background: cor, color: "#fff", padding: "0px 5px", borderRadius: 999, fontSize: 8, fontWeight: 900 }}>{m.de}</span>
                      {m.para !== "Todos" && <span style={{ fontSize: 8, color: "#94A3B8" }}>→ {m.para}</span>}
                    </div>
                    <div style={{ background: eu ? N : "#fff", color: eu ? "#fff" : "#374151", borderRadius: eu ? "11px 11px 3px 11px" : "11px 11px 11px 3px", padding: "5px 9px", fontSize: 11, lineHeight: 1.5, border: eu ? "none" : "1px solid #E2E8F0" }}>{m.txt}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: "7px 9px", background: "#fff", borderTop: "1px solid #E2E8F0" }}>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: "#64748B", fontWeight: 800, marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 }}>Enviar para:</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {SETORES.filter(s => s !== "Todos").map(s => <button key={s} onClick={() => setPara(s)} style={{ fontSize: 9, padding: "4px 9px", borderRadius: 999, border: "none", cursor: "pointer", fontWeight: 900, fontFamily: "inherit", background: para === s ? N : G + "22", color: para === s ? "#fff" : G, transition: "all .15s" }}>{s}</button>)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <input value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && enviar()} placeholder={`Mensagem → ${para}...`} style={{ ...sc_.inp, flex: 1, fontSize: 11 }} />
              <Btn v="teal" ch="→" s={{ padding: "5px 11px" }} onClick={enviar} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
