// ─────────────────────────────────────────────────────────────────────────────
// StepperMedico.jsx — Fluxo guiado em 5 etapas para o médico oncologista
// Paciente → Resumo IA → Validar APAC → APAC/Prescrição → Concluir
// P4 — UI médica simplificada
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from "react";
import { N, G, VE, VM, AM, T } from "../../utils/constants";
import { sc_, Btn, NOW } from "../../components/ui/primitives";
import { validarAPAC } from "../../utils/dossie";
import { resolverAPACCompleta } from "../../utils/apacDeterministico";
import { APACDossieChecklist, APACEntradaRapida } from "./APACDossieComps";
import { DocumentosPosEvolucao } from "./DossieBarComponents";
import ProntuarioDossieUnico from "./ProntuarioDossieUnico";

// ── Definicao das etapas ──────────────────────────────────────────────────────

const ETAPAS = [
  { id: "paciente",    icone: "👤", label: "Paciente"      },
  { id: "resumo",      icone: "🧠", label: "Resumo IA"     },
  { id: "validar",     icone: "✅", label: "Validar APAC"  },
  { id: "apac",        icone: "📋", label: "APAC/Prescrição"},
  { id: "concluir",    icone: "🏁", label: "Concluir"      },
];

// ── Barra de progresso ────────────────────────────────────────────────────────

function StepBar({ step, onStep, apacScore }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      background: "#F8FAFC", borderBottom: "1px solid #E2E8F0",
      padding: "10px 16px", marginBottom: 16, borderRadius: "10px 10px 0 0",
    }}>
      {ETAPAS.map((e, i) => {
        const ativo    = i === step;
        const concluido = i < step;
        const cor      = concluido ? VE : ativo ? G : "#CBD5E1";
        const txtCor   = concluido ? VE : ativo ? G : "#94A3B8";
        return (
          <React.Fragment key={e.id}>
            <button
              onClick={() => onStep(i)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 3, border: "none", cursor: "pointer",
                padding: "4px 10px", borderRadius: 8,
                background: ativo ? "#EFF6FF" : "transparent",
                outline: "none",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: concluido ? VE : ativo ? G : "#F1F5F9",
                border: "2px solid " + cor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: concluido ? 14 : 15, color: concluido ? "#fff" : ativo ? "#fff" : "#94A3B8",
                fontWeight: 900, transition: "all .2s",
              }}>
                {concluido ? "✓" : e.icone}
              </div>
              <span style={{ fontSize: 10, fontWeight: 900, color: txtCor, whiteSpace: "nowrap" }}>
                {e.label}
              </span>
              {/* Badge score APAC na etapa Validar */}
              {e.id === "validar" && apacScore != null && (
                <span style={{
                  fontSize: 9, fontWeight: 900,
                  color: apacScore >= 80 ? VE : apacScore >= 50 ? AM : VM,
                }}>
                  {apacScore}/100
                </span>
              )}
            </button>
            {/* Linha conectora */}
            {i < ETAPAS.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: i < step ? VE : "#E2E8F0",
                transition: "background .3s",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Etapa 0 — Paciente ────────────────────────────────────────────────────────

function EtapaPaciente({ pac }) {
  const campos = [
    ["Nome",         pac?.nome],
    ["CPF",          pac?.cpf],
    ["CNS",          pac?.cns],
    ["Nascimento",   pac?.nasc],
    ["Mãe",          pac?.mae],
    ["Município",    pac?.cidade || pac?.municipio],
    ["Queixa",       pac?.queixa],
    ["Diagnóstico",  pac?.diag],
    ["CID-10",       pac?.cid],
    ["Estadiamento", pac?.estadio || pac?.tnm],
    ["ECOG",         pac?.ecog],
    ["Alergias",     pac?.alerg],
  ];
  const temPaciente = !!(pac?.pacID || pac?.cpf || pac?.cns);
  return (
    <div>
      {!temPaciente && (
        <div style={{
          background: "#FEF2F2", border: "1px solid " + VM + "55",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          fontSize: 13, color: VM, fontWeight: 800,
        }}>
          ⚠️ Nenhum paciente ativo. Selecione um paciente na barra de atendimentos para continuar.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {campos.map(([label, val]) => (
          <div key={label} style={{
            background: val ? "#F8FAFC" : "#FFF7E6",
            border: "1px solid " + (val ? "#E2E8F0" : AM + "44"),
            borderRadius: 8, padding: "8px 12px",
          }}>
            <div style={{ fontSize: 9, color: "#64748B", fontWeight: 900, textTransform: "uppercase", marginBottom: 2 }}>
              {label}
            </div>
            <div style={{ fontSize: 12, color: val ? N : AM, fontWeight: val ? 700 : 500 }}>
              {val || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Etapa 4 — Concluir ────────────────────────────────────────────────────────

function EtapaConcluir({ pac, dossie, apac, resolucao, onSalvarEvolucao, onAbrirAPAC, onNovo }) {
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(!!dossie?.evolucao?.textoFinal);

  const docsGerados  = dossie?.documentosGerados || [];
  const evolucaoFinal = dossie?.evolucao?.textoFinal || dossie?.evolucao?.rascunho || "";

  const handleSalvar = async () => {
    if (!evolucaoFinal.trim()) { alert("Escreva a evolução antes de salvar."); return; }
    setSalvando(true);
    const ok = onSalvarEvolucao && await onSalvarEvolucao(evolucaoFinal);
    setSalvando(false);
    if (ok !== false) setSalvo(true);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Resumo do atendimento */}
      <div style={sc_.card({ border: "2px solid " + VE + "55" })}>
        <div style={{ fontSize: 13, fontWeight: 900, color: N, marginBottom: 10 }}>
          Resumo do atendimento — {pac?.nome || "Paciente"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          <div style={{ background: "#EAF7EE", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: "#64748B", fontWeight: 900, textTransform: "uppercase" }}>Score APAC</div>
            <div style={{
              fontSize: 20, fontWeight: 900,
              color: resolucao?.scoreAntiGlosa >= 80 ? VE : resolucao?.scoreAntiGlosa >= 50 ? AM : VM,
            }}>
              {resolucao?.scoreAntiGlosa ?? apac?.riscoGlosa === "baixo" ? "✅" : "—"}/100
            </div>
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: "#64748B", fontWeight: 900, textTransform: "uppercase" }}>Documentos</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: N }}>{dossie?.documentos?.length || 0}</div>
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: "#64748B", fontWeight: 900, textTransform: "uppercase" }}>Docs gerados</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: N }}>{docsGerados.length}</div>
          </div>
        </div>
        {resolucao?.pendencias?.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: VM, fontWeight: 800 }}>
            Pendências APAC: {resolucao.pendencias.join(" · ")}
          </div>
        )}
        {resolucao?.inconsistencias?.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#7C3AED", fontWeight: 800 }}>
            Inconsistências a revisar: {resolucao.inconsistencias.join(" · ")}
          </div>
        )}
      </div>

      {/* Evolução */}
      <div style={sc_.card()}>
        <div style={{ fontSize: 12, fontWeight: 900, color: N, marginBottom: 8 }}>
          Evolução médica {salvo ? "✅ Salva" : "(rascunho)"}
        </div>
        <textarea
          readOnly
          value={evolucaoFinal}
          rows={6}
          style={{ ...sc_.inp, width: "100%", resize: "vertical", fontFamily: "Georgia, serif", fontSize: 12, lineHeight: 1.7 }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn
            v={salvo ? "ghost" : "green"}
            ch={salvando ? "Salvando..." : salvo ? "✅ Evolução salva" : "Salvar evolução"}
            s={{ flex: 1, padding: 11 }}
            dis={salvando || !evolucaoFinal.trim()}
            onClick={handleSalvar}
          />
          <Btn
            v="gold"
            ch="Abrir APAC anti-glosa"
            s={{ flex: 1, padding: 11 }}
            onClick={onAbrirAPAC}
          />
        </div>
      </div>

      {/* Novo atendimento */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn
          v="ghost"
          ch="🗑 Novo atendimento"
          s={{ fontSize: 11, padding: "8px 14px" }}
          onClick={onNovo}
        />
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function StepperMedico({
  pac, dossie, setDossie, up, addMsg,
  onSalvarEvolucao, onAbrirAPAC, onLimpar,
}) {
  const [step, setStep] = useState(0);

  // Derivados memoizados para não recalcular em cada render
  const apac = useMemo(() => validarAPAC(dossie || {}), [
    dossie?.paciente?.cid, dossie?.paciente?.diag, dossie?.paciente?.cns,
    dossie?.paciente?.nome, dossie?.documentos?.length, dossie?.evolucao?.textoFinal,
  ]);

  const resolucao = useMemo(() =>
    apac.resolucao || resolverAPACCompleta(dossie?.paciente || pac || {}, dossie || {}),
    [apac]
  );

  const temPaciente = !!(pac?.pacID || pac?.cpf || pac?.cns);

  const avancar  = () => setStep(s => Math.min(s + 1, ETAPAS.length - 1));
  const voltar   = () => setStep(s => Math.max(s - 1, 0));
  const primeiro = step === 0;
  const ultimo   = step === ETAPAS.length - 1;

  // Renderiza conteudo da etapa atual
  const renderEtapa = () => {
    switch (step) {
      case 0:
        return <EtapaPaciente pac={pac} />;

      case 1:
        return (
          <ProntuarioDossieUnico
            pac={pac}
            dossie={dossie}
            setDossie={setDossie}
            up={up}
            addMsg={addMsg}
            onSalvarEvolucao={onSalvarEvolucao}
            onAbrirAPAC={() => setStep(3)}
          />
        );

      case 2:
        return (
          <div style={{ display: "grid", gap: 12 }}>
            <APACDossieChecklist dossie={dossie} setDossie={setDossie} />
            {resolucao.inferidos.length > 0 && (
              <div style={{
                background: "#FFFBEB", border: "1px solid " + AM + "44",
                borderRadius: 10, padding: "10px 14px", fontSize: 12, color: AM, fontWeight: 700,
              }}>
                🤖 Os campos abaixo foram <strong>inferidos por IA</strong> e precisam de confirmação médica antes de imprimir a APAC:<br />
                <span style={{ fontWeight: 900 }}>{resolucao.inferidos.join(" · ")}</span>
              </div>
            )}
            {resolucao.inconsistencias.length > 0 && (
              <div style={{
                background: "#EDE9FE", border: "1px solid #7C3AED44",
                borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#7C3AED", fontWeight: 700,
              }}>
                ⚠️ <strong>Inconsistências detectadas</strong> — o valor inserido difere da inferência da IA. Verifique:<br />
                <span style={{ fontWeight: 900 }}>{resolucao.inconsistencias.join(" · ")}</span>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div style={{ display: "grid", gap: 16 }}>
            <APACEntradaRapida pac={pac} up={up} dossie={dossie} setDossie={setDossie} addMsg={addMsg} />
            <DocumentosPosEvolucao dossie={dossie} setDossie={setDossie} addMsg={addMsg} onAbrirAPAC={onAbrirAPAC} />
          </div>
        );

      case 4:
        return (
          <EtapaConcluir
            pac={pac}
            dossie={dossie}
            apac={apac}
            resolucao={resolucao}
            onSalvarEvolucao={onSalvarEvolucao}
            onAbrirAPAC={onAbrirAPAC}
            onNovo={onLimpar}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "grid", gap: 0 }}>
      {/* Barra de progresso */}
      <StepBar step={step} onStep={setStep} apacScore={resolucao?.scoreAntiGlosa} />

      {/* Aviso sem paciente nas etapas clínicas */}
      {!temPaciente && step > 0 && (
        <div style={{
          background: "#FEF2F2", border: "1px solid " + VM + "55",
          borderRadius: 10, padding: "10px 14px", marginBottom: 12,
          fontSize: 12, color: VM, fontWeight: 800,
        }}>
          ⚠️ Selecione um paciente para continuar esta etapa.
        </div>
      )}

      {/* Conteudo da etapa */}
      <div style={{ minHeight: 320 }}>
        {renderEtapa()}
      </div>

      {/* Navegação */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 20, paddingTop: 14, borderTop: "1px solid #E2E8F0",
      }}>
        <Btn
          v="ghost"
          ch="← Voltar"
          s={{ padding: "9px 18px", fontSize: 12, visibility: primeiro ? "hidden" : "visible" }}
          onClick={voltar}
        />
        <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>
          {step + 1} / {ETAPAS.length} — {ETAPAS[step].label}
        </div>
        {!ultimo ? (
          <Btn
            v="navy"
            ch="Próximo →"
            s={{ padding: "9px 18px", fontSize: 12 }}
            dis={step === 0 && !temPaciente}
            onClick={avancar}
          />
        ) : (
          <div style={{ width: 100 }} /> // spacer
        )}
      </div>
    </div>
  );
}
