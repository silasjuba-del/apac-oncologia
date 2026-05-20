// src/components/ReviewBanner.jsx
// Adapted from OncoApp_v5/components/review/ReviewBanner.tsx
import { useState } from "react";

const N = "#1B365D", T = "#2B7A8C", G = "#B8860B", VE = "#15803D", VM = "#B91C1C";

const CAT_LABELS = {
  nome: "Dados pessoais", dataNascimento: "Dados pessoais", cns: "Dados pessoais",
  nomeMae: "Dados pessoais", municipio: "Dados pessoais", uf: "Dados pessoais",
  cpf: "Dados pessoais", telefone: "Dados pessoais", peso: "Dados pessoais", altura: "Dados pessoais",
  diagnostico: "Diagnóstico oncológico", estadiamento: "Diagnóstico oncológico",
  histologia: "Diagnóstico oncológico", subtipo: "Diagnóstico oncológico",
  biomarcadores: "Diagnóstico oncológico", tratamentoAtual: "Diagnóstico oncológico",
  linhasTratamento: "Diagnóstico oncológico",
  alergias: "Dados clínicos", medicacoesUso: "Dados clínicos",
  antecedentesPatologicos: "Dados clínicos", performance: "Dados clínicos",
  cid10: "APAC / SUS", sigtap: "APAC / SUS", justificativaApac: "APAC / SUS",
};

const CAT_PRIORITY = {
  "Diagnóstico oncológico": 0, "APAC / SUS": 1, "Dados clínicos": 2, "Dados pessoais": 3,
};

export default function ReviewBanner({ patches = [], onApply, onDismiss }) {
  const [open, setOpen] = useState(false);
  const [dec, setDec] = useState(new Map());
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (!patches.length) return null;

  const active = patches[0];
  const items = [...(active.fieldPatches ?? []), ...(active.apacPatches ?? [])]
    .filter(fp => fp.requiresMedicalReview)
    .sort((a, b) => (CAT_PRIORITY[CAT_LABELS[a.field]] ?? 3) - (CAT_PRIORITY[CAT_LABELS[b.field]] ?? 3));

  const urgent = (active.urgentAlerts?.length ?? 0) > 0;

  function decide(field, d, v) {
    setDec(p => new Map(p).set(field, { d, v }));
    setEditing(null);
  }

  function approveAll() {
    const n = new Map(dec);
    items.forEach(i => { if (!n.has(i.field)) n.set(i.field, { d: "approved", v: i.suggestedValue }); });
    setDec(n);
  }

  async function submit() {
    setSaving(true);
    const approved = [], rejected = [], edited = [];
    items.forEach(i => {
      const d = dec.get(i.field);
      if (!d || d.d === "approved") approved.push({ field: i.field, value: d?.v ?? i.suggestedValue });
      else if (d.d === "rejected") rejected.push(i.field);
      else { approved.push({ field: i.field, value: d.v }); edited.push({ field: i.field, finalValue: d.v, originalSuggestion: i.suggestedValue }); }
    });
    // auto-approved fields
    (active.fieldsAutoApproved ?? []).forEach(f => {
      const fp = [...(active.fieldPatches ?? []), ...(active.apacPatches ?? [])].find(x => x.field === f);
      if (fp) approved.push({ field: f, value: fp.suggestedValue });
    });
    try {
      await onApply?.({ patchId: active.id, approvedFields: approved, rejectedFields: rejected, editedFields: edited });
      setDone(true);
      setTimeout(() => { setDone(false); setOpen(false); onDismiss?.(); }, 1200);
    } finally { setSaving(false); }
  }

  if (done) return (
    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 20px", color: VE, fontWeight: 600, fontSize: 14 }}>
      Revisão aplicada com sucesso.
    </div>
  );

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{ background: urgent ? VM : N, color: "#fff", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}
      >
        <span style={{ fontSize: 22 }}>{urgent ? "🚨" : "🔔"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{urgent && "ALERTA URGENTE — "}{patches.length} sugestão(ões) aguardando revisão</div>
          <div style={{ fontSize: 12, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active.summary}</div>
        </div>
        <button style={{ background: G, color: "#fff", border: "none", borderRadius: 10, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Revisar</button>
      </div>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 660, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            {/* header */}
            <div style={{ background: "#f9fafb", padding: "16px 24px", borderBottom: "1px solid #e5e7eb", borderRadius: "18px 18px 0 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 900, color: N, fontSize: 15 }}>{(active.triggerEventType ?? "").replace(/_/g, " ").toUpperCase()}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{active.summary}</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 20, color: "#9ca3af", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {urgent && (
              <div style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "8px 24px", color: VM, fontSize: 13, fontWeight: 600 }}>
                Urgências: {active.urgentAlerts.join(" — ")}
              </div>
            )}
            {(active.fieldsAutoApproved?.length ?? 0) > 0 && (
              <div style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", padding: "6px 24px", color: VE, fontSize: 12, fontWeight: 500 }}>
                Auto-aprovados: {active.fieldsAutoApproved.length} campos demográficos
              </div>
            )}

            {/* items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {items.length === 0 && (
                <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "24px 0" }}>
                  {(active.fieldsAutoApproved?.length ?? 0) > 0
                    ? "Todos os campos foram auto-aprovados. Clique em Confirmar para aplicar."
                    : "Nenhum campo para revisar."}
                </p>
              )}
              {items.map(fp => {
                const d = dec.get(fp.field);
                const cat = CAT_LABELS[fp.field] ?? "Outros";
                const conf = Math.round((fp.confidence ?? 0) * 100);
                const confColor = conf >= 90 ? VE : conf >= 75 ? "#b45309" : VM;
                const priColor = CAT_PRIORITY[cat] === 0 ? VM : CAT_PRIORITY[cat] === 1 ? "#b45309" : T;
                return (
                  <div key={fp.field} style={{ border: `1px solid #e5e7eb`, borderLeft: `4px solid ${priColor}`, borderRadius: 12, padding: 14, opacity: d ? 0.6 : 1, transition: "opacity 0.2s" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#eff6ff", color: N, padding: "2px 8px", borderRadius: 4 }}>{cat}</span>
                      <code style={{ fontSize: 10, color: T }}>{fp.field}</code>
                      <span style={{ fontSize: 10, fontWeight: 700, color: confColor, background: "#f9fafb", border: `1px solid ${confColor}`, borderRadius: 20, padding: "1px 7px" }}>{conf}%</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 28px 1fr", gap: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Atual</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>{fp.currentValue != null ? String(fp.currentValue) : "(vazio)"}</div>
                      </div>
                      <div style={{ color: T, fontSize: 18, textAlign: "center", paddingTop: 14 }}>→</div>
                      <div>
                        <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Sugerido</div>
                        {editing === fp.field
                          ? <div style={{ display: "flex", gap: 4 }}>
                              <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                                style={{ flex: 1, border: `1px solid ${T}`, borderRadius: 6, padding: "3px 8px", fontSize: 12, outline: "none" }} />
                              <button onClick={() => decide(fp.field, "edited", editVal)} style={{ background: VE, color: "#fff", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>OK</button>
                              <button onClick={() => setEditing(null)} style={{ background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>×</button>
                            </div>
                          : <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{fp.suggestedValue != null ? String(fp.suggestedValue) : "—"}</div>}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic", marginBottom: 10 }}>{fp.rationale}</div>
                    {!d
                      ? <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => decide(fp.field, "approved", fp.suggestedValue)} style={{ flex: 1, background: VE, color: "#fff", border: "none", borderRadius: 10, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Aprovar</button>
                          <button onClick={() => { setEditing(fp.field); setEditVal(String(fp.suggestedValue ?? "")); }} style={{ flex: 1, background: T, color: "#fff", border: "none", borderRadius: 10, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Editar</button>
                          <button onClick={() => decide(fp.field, "rejected")} style={{ flex: 1, background: VM, color: "#fff", border: "none", borderRadius: 10, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Rejeitar</button>
                        </div>
                      : <div style={{ fontSize: 12, fontWeight: 700, color: d.d === "rejected" ? VM : d.d === "edited" ? "#b45309" : VE, display: "flex", alignItems: "center", gap: 8 }}>
                          {d.d === "approved" ? "✓ Aprovado" : d.d === "edited" ? `✎ Editado: ${String(d.v)}` : "✗ Rejeitado"}
                          <button onClick={() => { const n = new Map(dec); n.delete(fp.field); setDec(n); }} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 10, textDecoration: "underline", cursor: "pointer", fontWeight: 400 }}>desfazer</button>
                        </div>}
                  </div>
                );
              })}
            </div>

            {/* footer */}
            <div style={{ borderTop: "1px solid #e5e7eb", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", borderRadius: "0 0 18px 18px" }}>
              <button onClick={approveAll} style={{ fontSize: 12, color: VE, border: `1px solid #86efac`, borderRadius: 10, padding: "7px 14px", background: "none", cursor: "pointer", fontWeight: 600 }}>Aprovar todos</button>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{dec.size}/{items.length} revisados</span>
                <button onClick={submit} disabled={saving} style={{ background: N, color: "#fff", border: "none", borderRadius: 10, padding: "8px 20px", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Salvando..." : "Confirmar revisão"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
