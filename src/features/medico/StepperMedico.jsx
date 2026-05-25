// ─────────────────────────────────────────────────────────────────────────────
// StepperMedico.jsx — Fluxo guiado por tipo de consulta (F2)
//
// Etapa 0: Seleção de tipo de consulta → abre encounter F0
// Etapas 1+: Adaptativas por tipo (RETORNO_QT tem Validar APAC, INTERCORRENCIA tem Conduta, etc.)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from "react";
import { N, G, VE, VM, AM } from "../../utils/constants";
import { sc_, Btn, NOW } from "../../components/ui/primitives";
import { validarAPAC } from "../../utils/dossie";
import { resolverAPACCompleta } from "../../utils/apacDeterministico";
import { APACDossieChecklist, APACEntradaRapida } from "./APACDossieComps";
import { DocumentosPosEvolucao } from "./DossieBarComponents";
import ProntuarioDossieUnico from "./ProntuarioDossieUnico";
import EncounterHeader from "../../components/EncounterHeader";
import { useEncounter } from "../../contexts/EncounterContext";
import {
  getEtapas, getMaxStep, podeAvancar, TIPO_DEFAULT,
  ENCOUNTER_TIPOS, ENCOUNTER_TIPO_LABELS,
} from "../../utils/stepperConfig";

// ── Cards de tipo de consulta ─────────────────────────────────────────────────

const TIPO_CONFIG = {
  [ENCOUNTER_TIPOS.RETORNO_QT]: {
    icone:    '💊',
    descricao: 'Retorno de quimioterapia — ciclo, evolução e APAC QT',
    cor:       '#1B365D',
    bg:        '#EFF6FF',
    border:    '#1B365D',
  },
  [ENCOUNTER_TIPOS.RETORNO_CLINICO]: {
    icone:    '🩺',
    descricao: 'Consulta clínica de seguimento — evolução sem APAC QT',
    cor:       '#065F46',
    bg:        '#ECFDF5',
    border:    '#065F46',
  },
  [ENCOUNTER_TIPOS.PRIMEIRA_CONSULTA]: {
    icone:    '📋',
    descricao: 'Primeira consulta — anamnese completa e APAC inicial',
    cor:       '#7C3AED',
    bg:        '#F5F3FF',
    border:    '#7C3AED',
  },
  [ENCOUNTER_TIPOS.INTERCORRENCIA]: {
    icone:    '⚡',
    descricao: 'Intercorrência urgente — conduta rápida sem APAC',
    cor:       '#991B1B',
    bg:        '#FFF5F5',
    border:    '#991B1B',
  },
};

// ── Etapa 0 — Seleção de tipo de consulta ────────────────────────────────────

function EtapaTipo({ tipo, onSelectTipo, pac }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
        Selecione o tipo de consulta para {pac?.nome ? <strong>{pac.nome}</strong> : "o paciente"}:
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {Object.entries(TIPO_CONFIG).map(([t, cfg]) => {
          const selecionado = tipo === t;
          return (
            <button
              key={t}
              onClick={() => onSelectTipo(t)}
              style={{
                display:       "flex",
                flexDirection: "column",
                alignItems:    "flex-start",
                gap:           6,
                padding:       "14px 16px",
                border:        `2px solid ${selecionado ? cfg.border : "#E2E8F0"}`,
                borderRadius:  12,
                background:    selecionado ? cfg.bg : "#FAFAFA",
                cursor:        "pointer",
                textAlign:     "left",
                transition:    "all .15s",
                boxShadow:     selecionado ? `0 2px 8px ${cfg.border}33` : "none",
              }}
            >
              <div style={{ fontSize: 24 }}>{cfg.icone}</div>
              <div style={{
                fontSize:   13,
                fontWeight: 900,
                color:      selecionado ? cfg.cor : "#1E293B",
              }}>
                {ENCOUNTER_TIPO_LABELS[t]}
              </div>
              <div style={{
                fontSize:  11,
                color:     selecionado ? cfg.cor : "#64748B",
                lineHeight: 1.4,
              }}>
                {cfg.descricao}
              </div>
              {selecionado && (
                <div style={{
                  marginTop:  4,
                  fontSize:   10,
                  fontWeight: 900,
                  color:      cfg.cor,
                  background: cfg.border + "22",
                  borderRadius: 8,
                  padding:    "3px 8px",
                }}>
                  ✓ Selecionado
                </div>
              )}
            </button>
          );
        })}
      </div>
      {!pac?.pacID && !pac?.cpf && !pac?.cns && (
        <div style={{
          background: "#FEF2F2", border: "1px solid " + VM + "55",
          borderRadius: 8, padding: "10px 14px",
          fontSize: 12, color: VM, fontWeight: 700,
        }}>
          ⚠️ Nenhum paciente ativo. Selecione um paciente antes de iniciar o atendimento.
        </div>
      )}
    </div>
  );
}

// ── Etapa Paciente ────────────────────────────────────────────────────────────

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

// ── Etapa Conduta Urgente (INTERCORRENCIA) ────────────────────────────────────

function EtapaConduta({ pac, dossie, addMsg }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{
        background: "#FFF5F5", border: "1px solid #FCA5A5",
        borderRadius: 10, padding: "12px 16px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#991B1B", marginBottom: 6 }}>
          ⚡ Intercorrência — Conduta urgente
        </div>
        <div style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.6 }}>
          Paciente: <strong>{pac?.nome || "—"}</strong><br />
          Diagnóstico: {pac?.diag || "—"} · CID: {pac?.cid || "—"}<br />
          Protocolo: {pac?.trat || "—"} · ECOG: {pac?.ecog || "—"}
        </div>
      </div>
      <DocumentosPosEvolucao dossie={dossie} addMsg={addMsg} />
    </div>
  );
}

// ── Etapa Concluir ────────────────────────────────────────────────────────────

function EtapaConcluir({ pac, dossie, apac, resolucao, onSalvarEvolucao, onAbrirAPAC, onNovo }) {
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(!!dossie?.evolucao?.textoFinal);

  const docsGerados   = dossie?.documentosGerados || [];
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
      {/* Resumo */}
      <div style={sc_.card({ border: "2px solid " + VE + "55" })}>
        <div style={{ fontSize: 13, fontWeight: 900, color: N, marginBottom: 10 }}>
          Resumo do atendimento — {pac?.nome || "Paciente"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          <div style={{ background: "#EAF7EE", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: "#64748B", fontWeight: 900, textTransform: "uppercase" }}>Score APAC</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: resolucao?.scoreAntiGlosa >= 80 ? VE : resolucao?.scoreAntiGlosa >= 50 ? AM : VM }}>
              {resolucao?.scoreAntiGlosa ?? "—"}/100
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
            Inconsistências: {resolucao.inconsistencias.join(" · ")}
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
          <Btn v="gold" ch="Abrir APAC anti-glosa" s={{ flex: 1, padding: 11 }} onClick={onAbrirAPAC} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn v="ghost" ch="🗑 Novo atendimento" s={{ fontSize: 11, padding: "8px 14px" }} onClick={onNovo} />
      </div>
    </div>
  );
}

// ── Barra de progresso ────────────────────────────────────────────────────────

function StepBar({ step, onStep, etapas, apacScore }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      background: "#F8FAFC", borderBottom: "1px solid #E2E8F0",
      padding: "10px 16px", marginBottom: 16, borderRadius: "10px 10px 0 0",
      overflowX: "auto",
    }}>
      {etapas.map((e, i) => {
        const ativo     = i === step;
        const concluido = i < step;
        const cor       = concluido ? VE : ativo ? G : "#CBD5E1";
        const txtCor    = concluido ? VE : ativo ? G : "#94A3B8";
        return (
          <React.Fragment key={e.id}>
            <button
              onClick={() => onStep(i)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 3, border: "none", cursor: "pointer",
                padding: "4px 10px", borderRadius: 8,
                background: ativo ? "#EFF6FF" : "transparent",
                outline: "none", flexShrink: 0,
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
              {/* Badge score APAC na etapa validar */}
              {e.id === "validar" && apacScore != null && (
                <span style={{
                  fontSize: 9, fontWeight: 900,
                  color: apacScore >= 80 ? VE : apacScore >= 50 ? AM : VM,
                }}>
                  {apacScore}/100
                </span>
              )}
            </button>
            {i < etapas.length - 1 && (
              <div style={{
                flex: "0 0 16px", height: 2, minWidth: 8,
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

// ── Componente principal ──────────────────────────────────────────────────────

export default function StepperMedico({
  pac, dossie, setDossie, up, addMsg,
  onSalvarEvolucao, onAbrirAPAC, onLimpar,
}) {
  const { encounter, openEncounterSession, isOpen } = useEncounter();

  // Tipo: começa pelo tipo já inferido do encounter ativo, ou default
  const tipoInicial = encounter?.tipo || TIPO_DEFAULT;
  const [tipo, setTipo]  = useState(tipoInicial);
  const [step, setStep]  = useState(0);

  // Etapas dinâmicas conforme tipo selecionado
  const etapas  = useMemo(() => getEtapas(tipo),  [tipo]);
  const maxStep = useMemo(() => etapas.length - 1, [etapas]);

  // Derivados memoizados APAC
  const apac = useMemo(() => validarAPAC(dossie || {}), [
    dossie?.paciente?.cid, dossie?.paciente?.diag, dossie?.paciente?.cns,
    dossie?.paciente?.nome, dossie?.documentos?.length, dossie?.evolucao?.textoFinal,
  ]);
  const resolucao = useMemo(() =>
    apac.resolucao || resolverAPACCompleta(dossie?.paciente || pac || {}, dossie || {}),
    [apac]
  );

  const temPaciente = !!(pac?.pacID || pac?.cpf || pac?.cns);
  const temEncounter = isOpen;

  // Ao selecionar tipo no step 0 → abre encounter se paciente identificado
  const handleSelectTipo = (novoTipo) => {
    setTipo(novoTipo);
    if (temPaciente && !isOpen) {
      const patId = pac?.pacID || pac?.cpf || pac?.cns;
      openEncounterSession(String(patId), novoTipo);
    }
  };

  const avancar = () => {
    const check = podeAvancar({ step, tipo, temPaciente, temEncounter });
    if (!check.ok) { alert(check.motivo); return; }
    setStep(s => Math.min(s + 1, maxStep));
  };
  const voltar  = () => setStep(s => Math.max(s - 1, 0));

  const primeiro = step === 0;
  const ultimo   = step === maxStep;
  const etapaAtual = etapas[step];

  // ── Render de cada etapa ────────────────────────────────────────────────────
  const renderEtapa = () => {
    const id = etapaAtual?.id;

    switch (id) {
      case 'tipo':
        return <EtapaTipo tipo={tipo} onSelectTipo={handleSelectTipo} pac={pac} />;

      case 'paciente':
        return <EtapaPaciente pac={pac} />;

      case 'evolucao':
        return (
          <ProntuarioDossieUnico
            pac={pac}
            dossie={dossie}
            setDossie={setDossie}
            up={up}
            addMsg={addMsg}
            onSalvarEvolucao={onSalvarEvolucao}
            onAbrirAPAC={() => {
              const iApac = etapas.findIndex(e => e.id === 'apac');
              if (iApac > -1) setStep(iApac);
            }}
          />
        );

      case 'validar':
        return (
          <div style={{ display: "grid", gap: 12 }}>
            <APACDossieChecklist dossie={dossie} setDossie={setDossie} />
            {resolucao.inferidos?.length > 0 && (
              <div style={{
                background: "#FFFBEB", border: "1px solid " + AM + "44",
                borderRadius: 10, padding: "10px 14px", fontSize: 12, color: AM, fontWeight: 700,
              }}>
                🤖 Campos <strong>inferidos por IA</strong> — confirmar antes de imprimir APAC:<br />
                <span style={{ fontWeight: 900 }}>{resolucao.inferidos.join(" · ")}</span>
              </div>
            )}
            {resolucao.inconsistencias?.length > 0 && (
              <div style={{
                background: "#EDE9FE", border: "1px solid #7C3AED44",
                borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#7C3AED", fontWeight: 700,
              }}>
                ⚠️ <strong>Inconsistências</strong> — verificar:<br />
                <span style={{ fontWeight: 900 }}>{resolucao.inconsistencias.join(" · ")}</span>
              </div>
            )}
          </div>
        );

      case 'apac':
        return (
          <div style={{ display: "grid", gap: 16 }}>
            <APACEntradaRapida pac={pac} up={up} dossie={dossie} setDossie={setDossie} addMsg={addMsg} />
            <DocumentosPosEvolucao dossie={dossie} setDossie={setDossie} addMsg={addMsg} onAbrirAPAC={onAbrirAPAC} />
          </div>
        );

      case 'conduta':
        return <EtapaConduta pac={pac} dossie={dossie} addMsg={addMsg} />;

      case 'concluir':
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
      {/* F0 — Cabeçalho de auditoria clínica */}
      <div style={{ marginBottom: 8 }}>
        <EncounterHeader pac={pac} compact />
      </div>

      {/* Barra de progresso adaptativa */}
      <StepBar
        step={step}
        onStep={setStep}
        etapas={etapas}
        apacScore={resolucao?.scoreAntiGlosa}
      />

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

      {/* Aviso sem encounter nas etapas clínicas (após paciente) */}
      {!temEncounter && step > 1 && (
        <div style={{
          background: "#FFF7E6", border: "1px solid " + AM + "55",
          borderRadius: 10, padding: "10px 14px", marginBottom: 12,
          fontSize: 12, color: AM, fontWeight: 800,
        }}>
          ⚠️ Atendimento não iniciado. Volte ao passo "Tipo" e selecione o tipo de consulta para abrir o atendimento.
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
          {step + 1} / {etapas.length} — {etapaAtual?.label}
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
          <div style={{ width: 100 }} />
        )}
      </div>
    </div>
  );
}
