// src/components/SeletorAPAC.jsx
// Médico seleciona procedimento SIGTAP + associados com base no resumo Claude
// Claude extraiu CID/estadiamento → médico confirma e seleciona o código

import { useState } from "react";

const NAVY  = "#1B365D";
const TEAL  = "#2B7A8C";
const GOLD  = "#B8860B";
const RED   = "#A30000";
const GREEN = "#1B5E20";
const LIGHT = "#F0F4F8";
const WHITE = "#FFFFFF";
const GRAY  = "#6B7C93";

// ── Catálogo SIGTAP oncologia (principais procedimentos APAC) ──
export const SIGTAP = {
  "MAMA": {
    label: "Mama",
    procedimentos: [
      {
        codigo: "03.04.01.001-0", descricao: "Hormonioterapia — Anastrozol 1mg",
        indicacao: "CDI/CLI mama ER+ pós-menopausa", linha: "1ª linha adjuvante / 1ª linha metastático",
        associados: ["ZOLENDRONICO_60", "DENOSUMAB"]
      },
      {
        codigo: "03.04.01.002-9", descricao: "Hormonioterapia — Tamoxifeno 20mg",
        indicacao: "CDI/CLI mama ER+ pré-menopausa", linha: "1ª linha adjuvante",
        associados: []
      },
      {
        codigo: "03.04.01.003-7", descricao: "Hormonioterapia — Letrozol 2,5mg",
        indicacao: "CDI/CLI mama ER+ pós-menopausa", linha: "1ª linha adjuvante / metastático",
        associados: ["ZOLENDRONICO_60"]
      },
      {
        codigo: "03.04.02.014-4", descricao: "QT — AC → Paclitaxel (adjuvante)",
        indicacao: "CDI mama HER2- alto risco", linha: "Adjuvante",
        associados: []
      },
      {
        codigo: "03.04.02.015-2", descricao: "QT — Capecitabina 1250 mg/m²",
        indicacao: "CDI mama metastático ou TN residual", linha: "2ª/3ª linha",
        associados: ["ZOLENDRONICO_60"]
      },
      {
        codigo: "03.04.02.019-5", descricao: "QT — Paclitaxel 175mg/m² (metastático)",
        indicacao: "CDI mama HER2- metastático", linha: "1ª/2ª linha",
        associados: ["ZOLENDRONICO_60"]
      },
      {
        codigo: "03.04.02.020-9", descricao: "QT — Docetaxel 75–100mg/m²",
        indicacao: "CDI mama HER2- metastático", linha: "1ª/2ª linha",
        associados: ["ZOLENDRONICO_60"]
      },
    ]
  },
  "COLON_RETO": {
    label: "Cólon / Reto",
    procedimentos: [
      {
        codigo: "03.04.02.025-0", descricao: "QT — FOLFOX6 (Oxaliplatina + 5-FU/LV)",
        indicacao: "Adenocarcinoma cólon/reto estágio III ou metastático", linha: "1ª linha adjuvante / 1ª linha metastático",
        associados: []
      },
      {
        codigo: "03.04.02.026-8", descricao: "QT — FOLFIRI (Irinotecano + 5-FU/LV)",
        indicacao: "Adenocarcinoma cólon/reto metastático", linha: "2ª linha",
        associados: []
      },
      {
        codigo: "03.04.02.027-6", descricao: "QT — Capecitabina (XELOX adjuvante)",
        indicacao: "Adenocarcinoma cólon estágio III", linha: "1ª linha adjuvante",
        associados: []
      },
      {
        codigo: "03.04.02.028-4", descricao: "QT — Irinotecano 180mg/m²",
        indicacao: "Adenocarcinoma cólon/reto metastático", linha: "2ª/3ª linha",
        associados: []
      },
    ]
  },
  "PULMAO": {
    label: "Pulmão",
    procedimentos: [
      {
        codigo: "03.04.02.030-6", descricao: "QT — Carboplatina + Paclitaxel",
        indicacao: "CPNPC sem driver, QT-RT concomitante ou metastático", linha: "1ª linha",
        associados: []
      },
      {
        codigo: "03.04.02.031-4", descricao: "QT — Carboplatina + Pemetrexede",
        indicacao: "CPNPC não escamoso metastático", linha: "1ª linha",
        associados: []
      },
      {
        codigo: "03.04.02.032-2", descricao: "QT — Carboplatina + Etoposídeo",
        indicacao: "CPPC extenso", linha: "1ª linha",
        associados: []
      },
      {
        codigo: "03.04.03.001-0", descricao: "Terapia alvo — Erlotinibe 150mg (EGFR)",
        indicacao: "CPNPC EGFR mutado", linha: "1ª linha",
        associados: []
      },
      {
        codigo: "03.04.03.002-8", descricao: "Terapia alvo — Osimertinibe 80mg (EGFR T790M)",
        indicacao: "CPNPC EGFR T790M pós-1ª linha", linha: "2ª linha",
        associados: []
      },
    ]
  },
  "PROSTATA": {
    label: "Próstata",
    procedimentos: [
      {
        codigo: "03.04.01.010-0", descricao: "Hormonioterapia — Acetato de Leuprorrelina (análogo GnRH)",
        indicacao: "Adenocarcinoma próstata sensível à castração", linha: "1ª linha",
        associados: ["ZOLENDRONICO_60", "DENOSUMAB"]
      },
      {
        codigo: "03.04.01.011-8", descricao: "Hormonioterapia — Bicalutamida 50mg",
        indicacao: "Adenocarcinoma próstata (combinação ou monoterapia)", linha: "1ª linha",
        associados: []
      },
      {
        codigo: "03.04.02.040-3", descricao: "QT — Docetaxel 75mg/m² (próstata CRPC)",
        indicacao: "Adenocarcinoma próstata resistente à castração", linha: "1ª linha CRPC",
        associados: ["ZOLENDRONICO_60"]
      },
    ]
  },
  "COLO_UTERO": {
    label: "Colo do Útero",
    procedimentos: [
      {
        codigo: "03.04.02.050-0", descricao: "QT-RT — Cisplatina semanal 40mg/m²",
        indicacao: "Carcinoma escamoso / ADC colo do útero EC IB2–IVA", linha: "Concomitante à RT",
        associados: []
      },
      {
        codigo: "03.04.02.051-9", descricao: "QT — Carboplatina + Paclitaxel (colo metastático)",
        indicacao: "Carcinoma colo do útero EC IVB / recidiva", linha: "1ª linha metastático",
        associados: []
      },
    ]
  },
  "GASTRICO": {
    label: "Gástrico / Esôfago",
    procedimentos: [
      {
        codigo: "03.04.02.060-8", descricao: "QT — FLOT (Docetaxel + Oxaliplatina + 5-FU)",
        indicacao: "Adenocarcinoma gástrico / JEG ressecável", linha: "Perioperatório",
        associados: []
      },
      {
        codigo: "03.04.02.061-6", descricao: "QT — Carboplatina + Paclitaxel (esôfago)",
        indicacao: "Carcinoma escamoso / ADC esôfago com RT", linha: "Concomitante à RT",
        associados: []
      },
    ]
  },
  "SUPORTE_OSSEO": {
    label: "Suporte Ósseo (associado)",
    procedimentos: [
      {
        codigo: "03.04.04.001-0",
        id: "ZOLENDRONICO_60",
        descricao: "Ácido Zoledônico 4mg EV (metástase óssea / osteoporose por castração)",
        indicacao: "M1 ósseo confirmado (cintilografia / PET / RM)", linha: "Associado ao tratamento principal",
        associados: []
      },
      {
        codigo: "03.04.04.002-8",
        id: "DENOSUMAB",
        descricao: "Denosumabe 120mg SC (metástase óssea — alternativa ao Zoledônico)",
        indicacao: "M1 ósseo — insuficiência renal ou contraindicação ao bisfosfonato", linha: "Associado",
        associados: []
      },
    ]
  },
};

// ─────────────────────────────────────────────────────────────
export default function SeletorAPAC({ resumoClaude, onSelecionar }) {
  const [grupoAtivo, setGrupoAtivo] = useState("");
  const [selecionados, setSelecionados] = useState([]);
  const [obs, setObs] = useState("");

  // Detectar grupo tumoral automaticamente pelo resumo Claude
  const grupoSugerido = (() => {
    if (!resumoClaude) return "";
    const r = resumoClaude.toLowerCase();
    if (r.includes("mama"))    return "MAMA";
    if (r.includes("cólon") || r.includes("colon") || r.includes("reto")) return "COLON_RETO";
    if (r.includes("pulmão") || r.includes("pulmao") || r.includes("cpnpc") || r.includes("cppc")) return "PULMAO";
    if (r.includes("próstata") || r.includes("prostata")) return "PROSTATA";
    if (r.includes("colo do útero") || r.includes("cervical") || r.includes("colo uterino")) return "COLO_UTERO";
    if (r.includes("gástrico") || r.includes("gastrico") || r.includes("esôfago") || r.includes("esofago")) return "GASTRICO";
    return "";
  })();

  const grupoFinal = grupoAtivo || grupoSugerido;
  const temMetOsseo = resumoClaude?.toLowerCase().includes("m1 oss") || resumoClaude?.toLowerCase().includes("metástase óssea");

  function toggleProc(proc) {
    setSelecionados(s => {
      const existe = s.find(p => p.codigo === proc.codigo);
      if (existe) return s.filter(p => p.codigo !== proc.codigo);
      const novaLista = [...s, proc];
      // Auto-adicionar ácido zoledônico se M1 ósseo detectado
      if (temMetOsseo && proc.associados?.includes("ZOLENDRONICO_60")) {
        const zol = SIGTAP["SUPORTE_OSSEO"].procedimentos.find(p => p.id === "ZOLENDRONICO_60");
        if (zol && !novaLista.find(p => p.codigo === zol.codigo)) {
          novaLista.push(zol);
        }
      }
      return novaLista;
    });
  }

  function confirmar() {
    if (selecionados.length === 0) return;
    onSelecionar({ procedimentos: selecionados, obs });
  }

  const grupos = Object.keys(SIGTAP);

  return (
    <div style={{ fontFamily: "Helvetica,Arial,sans-serif" }}>

      {/* Sugestão automática */}
      {grupoSugerido && (
        <div style={{ background:"#E3F2FD", border:"1px solid #90CAF9", borderRadius:8, padding:"10px 16px", marginBottom:16, fontSize:13 }}>
          💡 Claude detectou: <strong>{SIGTAP[grupoSugerido]?.label}</strong> — grupo pré-selecionado.
        </div>
      )}

      {/* Seletor de grupo tumoral */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
        {grupos.map(g => (
          <button key={g} onClick={() => setGrupoAtivo(g)}
            style={{ padding:"7px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:13,
              fontWeight: grupoFinal===g ? "bold" : "normal",
              background: grupoFinal===g ? NAVY : LIGHT,
              color: grupoFinal===g ? WHITE : NAVY }}>
            {SIGTAP[g].label}
          </button>
        ))}
      </div>

      {/* Procedimentos do grupo */}
      {grupoFinal && SIGTAP[grupoFinal] && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:"bold", color:NAVY, marginBottom:12 }}>
            {SIGTAP[grupoFinal].label} — Selecione o(s) procedimento(s):
          </div>
          {SIGTAP[grupoFinal].procedimentos.map(proc => {
            const ativo = selecionados.find(p => p.codigo === proc.codigo);
            return (
              <div key={proc.codigo} onClick={() => toggleProc(proc)}
                style={{ padding:"12px 16px", marginBottom:8, borderRadius:8, cursor:"pointer",
                  border:`2px solid ${ativo ? TEAL : "#CBD5E0"}`,
                  background: ativo ? "#E0F2F1" : WHITE, transition:"all 0.15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:"bold", color: ativo ? TEAL : NAVY }}>
                      {ativo ? "✅ " : "○ "}{proc.descricao}
                    </div>
                    <div style={{ fontSize:12, color:GRAY, marginTop:3 }}>{proc.indicacao}</div>
                    <div style={{ fontSize:12, color:TEAL, marginTop:2 }}>Linha: {proc.linha}</div>
                  </div>
                  <div style={{ fontSize:11, color:GRAY, whiteSpace:"nowrap", marginLeft:12 }}>
                    {proc.codigo}
                  </div>
                </div>
                {proc.associados?.length > 0 && (
                  <div style={{ fontSize:11, color:GOLD, marginTop:4 }}>
                    ⚡ Inclui automaticamente: {proc.associados.join(", ")} se M1 ósseo detectado
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Suporte ósseo separado se M1 ósseo */}
      {temMetOsseo && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:"bold", color:RED, marginBottom:12 }}>
            🦴 Metástase óssea detectada — Suporte ósseo:
          </div>
          {SIGTAP["SUPORTE_OSSEO"].procedimentos.map(proc => {
            const ativo = selecionados.find(p => p.codigo === proc.codigo);
            return (
              <div key={proc.codigo} onClick={() => toggleProc(proc)}
                style={{ padding:"12px 16px", marginBottom:8, borderRadius:8, cursor:"pointer",
                  border:`2px solid ${ativo ? TEAL : "#CBD5E0"}`,
                  background: ativo ? "#E0F2F1" : WHITE }}>
                <div style={{ fontSize:13, fontWeight:"bold", color: ativo ? TEAL : NAVY }}>
                  {ativo ? "✅ " : "○ "}{proc.descricao}
                </div>
                <div style={{ fontSize:12, color:GRAY, marginTop:3 }}>{proc.indicacao}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selecionados */}
      {selecionados.length > 0 && (
        <div style={{ background:LIGHT, borderRadius:8, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontWeight:"bold", color:NAVY, fontSize:14, marginBottom:10 }}>
            Procedimentos selecionados:
          </div>
          {selecionados.map(p => (
            <div key={p.codigo} style={{ fontSize:13, marginBottom:6 }}>
              <strong>{p.codigo}</strong> — {p.descricao}
            </div>
          ))}
        </div>
      )}

      {/* Obs médico */}
      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:13, fontWeight:"bold", color:NAVY, display:"block", marginBottom:6 }}>
          Observação / Justificativa (opcional)
        </label>
        <textarea value={obs} onChange={e => setObs(e.target.value)}
          style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #CBD5E0", borderRadius:8,
            fontSize:13, minHeight:72, resize:"vertical", boxSizing:"border-box" }}
          placeholder="Justificativa clínica adicional para a APAC..." />
      </div>

      <button onClick={confirmar} disabled={selecionados.length === 0}
        style={{ width:"100%", padding:"13px 0",
          background: selecionados.length ? NAVY : "#CBD5E0",
          color: selecionados.length ? WHITE : GRAY,
          border:"none", borderRadius:8, fontWeight:"bold", fontSize:15,
          cursor: selecionados.length ? "pointer" : "default" }}>
        Gerar APAC com {selecionados.length} procedimento(s)
      </button>
    </div>
  );
}
