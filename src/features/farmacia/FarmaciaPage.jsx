// ─────────────────────────────────────────────────────────────────────────────
// FarmaciaPage.jsx — Módulo de Farmácia Oncológica
// Extraído de App.jsx — usa constants.js + primitives.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, G, VE, AM, VM, BG, AUTOR, HOSP, ESTOQUE_IV, MEDS_ORAIS } from "../../utils/constants";
import { sc_, Btn, H2, H3, Bge, TopBar, Footer, PrintModal, ChatAba } from "../../components/ui/primitives";

// Mock de prescrições — em produção virá do estado/DB do App
const PRESC_MOCK = [
  {
    id: "p1", pac: "Maria Aparecida Santos", proto: "mFOLFOX6",
    data: new Date().toLocaleDateString("pt-BR"), status: "pendente",
    doses: [
      { med: "Oxaliplatina 50 mg", dose: "170 mg", via: "IV 2h" },
      { med: "Leucovorina 100 mg", dose: "800 mg", via: "IV 2h" },
      { med: "5-FU 500 mg", dose: "4800 mg infusional", via: "IV 46h" },
    ],
  },
  {
    id: "p2", pac: "João Pedro Ferreira", proto: "Carboplatina + Paclitaxel",
    data: new Date().toLocaleDateString("pt-BR"), status: "pendente",
    doses: [
      { med: "Paclitaxel 300 mg", dose: "315 mg", via: "IV 3h" },
      { med: "Carboplatina 450 mg", dose: "675 mg", via: "IV 30min" },
    ],
  },
  {
    id: "p3", pac: "Ana Regina Costa", proto: "AC",
    data: new Date().toLocaleDateString("pt-BR"), status: "confirmado",
    doses: [
      { med: "Doxorrubicina 50 mg", dose: "108 mg", via: "IV bolus" },
      { med: "Ciclofosfamida 500 mg", dose: "1080 mg", via: "IV 30min" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function FarmaciaPage({ pac, cicloLiberado, setCicloLiberado, mensagens, addMsg, back, alertCount, onAlert }) {
  const [abaF, setAbaF] = useState("prescricoes");
  const [stockIV, setStockIV] = useState(ESTOQUE_IV);
  const [stockOral, setStockOral] = useState(MEDS_ORAIS);
  const [print, setPrint] = useState(null);
  const [prescricoes, setPrescricoes] = useState(PRESC_MOCK);

  const confirmar = id => {
    const presc = prescricoes.find(p => p.id === id);
    if (presc) {
      presc.doses.forEach(dose => {
        const medKey = dose.med.split(" ")[0].toLowerCase();
        setStockIV(x => x.map(item => item.n.toLowerCase().includes(medKey) ? { ...item, estoque: Math.max(0, item.estoque - 1) } : item));
      });
      if (addMsg) addMsg("Farmácia", "Médico", `✅ Prescrição confirmada para ${presc.pac} — ${presc.proto}.`, "ciclo");
    }
    setPrescricoes(x => x.map(p => p.id === id ? { ...p, status: "confirmado" } : p));
  };

  const ABAS = [
    { id: "prescricoes", l: "📋 Prescrições" },
    { id: "estoque", l: "📦 Estoque" },
    { id: "msgs", l: `💬 Chat${(mensagens || []).filter(m => !m.lida && (m.para === "Farmácia" || m.para === "Todos")).length > 0 ? " 🔴" : ""}` },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", fontFamily: "Georgia,serif" }}>
      {print && <PrintModal titulo={print.t} conteudo={print.c} onClose={() => setPrint(null)} />}
      <TopBar title="Farmácia" back={back} alertCount={alertCount} onAlert={onAlert} />

      {/* Abas */}
      <div style={{ background: N, display: "flex", overflowX: "auto", borderBottom: `3px solid ${G}`, flexShrink: 0 }}>
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAbaF(a.id)} style={{ border: "none", cursor: "pointer", padding: "9px 14px", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", background: abaF === a.id ? G : N, color: abaF === a.id ? "#fff" : "rgba(255,255,255,.5)", flexShrink: 0 }}>
            {a.l}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>

        {/* ABA: PRESCRIÇÕES */}
        {abaF === "prescricoes" && (
          <div style={{ display: "grid", gap: 10 }}>
            {prescricoes.map(p => (
              <div key={p.id} style={{ ...sc_.card({ border: `2px solid ${p.status === "confirmado" ? VE : p.status === "pendente" ? AM : "#CBD5E1"}` }) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <strong style={{ color: N, display: "block", fontSize: 14 }}>{p.pac}</strong>
                    <span style={{ color: "#2B7A8C", fontSize: 12 }}>{p.proto} · {p.data}</span>
                  </div>
                  <Bge t={p.status === "confirmado" ? "ok" : p.status === "pendente" ? "warn" : "muted"} ch={p.status} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  {p.doses?.map((d, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#374151", padding: "2px 0" }}>• {d.med} — {d.dose} — {d.via}</div>
                  ))}
                </div>
                {p.status !== "confirmado" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn v="gold" ch="✅ Confirmar e Dispensar" s={{ flex: 1, fontSize: 12 }} onClick={() => confirmar(p.id)} />
                    <Btn v="ghost" ch="🖨" s={{ fontSize: 11 }} onClick={() => setPrint({
                      t: "Prescrição — " + p.pac,
                      c: `PRESCRIÇÃO ONCOLÓGICA\nData: ${p.data}\nPaciente: ${p.pac}\nProtocolo: ${p.proto}\n\n${p.doses?.map(d => `${d.med} — ${d.dose} — ${d.via}`).join("\n")}\n\n${AUTOR}\n${HOSP}`,
                    })} />
                  </div>
                )}
                {p.status === "confirmado" && (
                  <div style={{ color: VE, fontSize: 11, fontWeight: 700 }}>✅ Dispensado e estoque atualizado</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ABA: ESTOQUE */}
        {abaF === "estoque" && (
          <div style={{ display: "grid", gap: 12 }}>
            {/* Endovenosos */}
            <div style={sc_.card()}>
              <H2 ch="💊 Estoque Endovenoso" />
              <div style={{ display: "grid", gap: 7 }}>
                {stockIV.map(m => (
                  <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "center", border: `1px solid ${m.estoque <= m.minimo ? VM : "#CBD5E1"}`, borderRadius: 10, padding: "8px 11px", background: m.estoque <= m.minimo ? "#FFF5F5" : "#F8FAFC" }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: N, fontSize: 12 }}>{m.n}</strong>
                      <div style={{ color: "#64748B", fontSize: 10 }}>{m.dose}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 900, color: m.estoque <= m.minimo ? VM : VE, fontSize: 14 }}>{m.estoque}</div>
                      <div style={{ fontSize: 9, color: "#94A3B8" }}>{m.un} · mín {m.minimo}</div>
                    </div>
                    {m.estoque <= m.minimo && (
                      <span style={{ background: VM, color: "#fff", borderRadius: 999, padding: "2px 7px", fontSize: 9, fontWeight: 900 }}>⚠ BAIXO</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Orais */}
            <div style={sc_.card()}>
              <H2 ch="💊 Medicamentos Orais" />
              <div style={{ display: "grid", gap: 7 }}>
                {stockOral.map(m => (
                  <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "center", border: `1px solid ${m.estoque <= m.minimo ? VM : "#CBD5E1"}`, borderRadius: 10, padding: "8px 11px", background: m.estoque <= m.minimo ? "#FFF5F5" : "#F8FAFC" }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: N, fontSize: 12 }}>{m.n}</strong>
                      <div style={{ color: "#64748B", fontSize: 10 }}>{m.dose}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 900, color: m.estoque <= m.minimo ? VM : VE, fontSize: 14 }}>{m.estoque}</div>
                      <div style={{ fontSize: 9, color: "#94A3B8" }}>{m.un} · mín {m.minimo}</div>
                    </div>
                    {m.estoque <= m.minimo && (
                      <span style={{ background: VM, color: "#fff", borderRadius: 999, padding: "2px 7px", fontSize: 9, fontWeight: 900 }}>⚠ BAIXO</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA: MSGS */}
        {abaF === "msgs" && (
          <div style={{ display: "grid", gap: 10 }}>
            <H2 ch="💬 Chat Equipe — Farmácia" />
            {(mensagens || []).filter(m => m.para === "Farmácia" || m.de === "Farmácia" || m.para === "Todos").slice(0, 15).map((m, i) => (
              <div key={i} style={{ ...sc_.card({ border: `1px solid ${m.para === "Farmácia" && !m.lida ? AM + "66" : "#CBD5E1"}` }) }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontSize: 16 }}>{m.tipo === "ciclo" ? "💉" : m.tipo === "alerta" ? "⚠️" : "💬"}</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: N, fontSize: 12 }}>{m.de} → {m.para}</strong>
                    <span style={{ color: "#94A3B8", fontSize: 10, marginLeft: 8 }}>{m.dt}</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>{m.txt}</p>
              </div>
            ))}
            <div style={{ ...sc_.card({ background: "#F8FAFC" }) }}>
              <H3 ch="Enviar mensagem" />
              <textarea rows={2} placeholder="Mensagem para a equipe..." id="farm_msg_txt" style={{ ...sc_.inp, width: "100%", resize: "none", marginBottom: 8 }} />
              <Btn v="teal" ch="📤 Enviar para Médico" s={{ width: "100%", fontSize: 12 }} onClick={() => {
                const t = document.getElementById("farm_msg_txt");
                if (t?.value.trim()) { addMsg("Farmácia", "Médico", t.value.trim(), "msg"); t.value = ""; }
              }} />
            </div>
          </div>
        )}

        <ChatAba mensagens={mensagens} addMsg={addMsg} de="Farmácia" />
      </div>
      <Footer />
    </div>
  );
}
