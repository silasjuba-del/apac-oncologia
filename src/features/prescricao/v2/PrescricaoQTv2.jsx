// ─────────────────────────────────────────────────────────────────────────────
// PrescricaoQTv2.jsx
// Orquestrador principal do módulo de prescrição QT citotóxica v2.
//
// ARQUITETURA:
//   Step 1 → Paciente (biometria, ECOG, labs)
//   Step 2 → Protocolo (catálogo v0.2, busca, filtros)
//   Step 3 → Cálculo de dose (BSA, Calvert, redução)
//   Step 4 → Revisão + Confirmação médica + Trilha de auditoria
//
// NÃO integrado ao APACApp nesta versão.
// Catálogo deve ser passado como prop 'catalogoJson'.
// Médico deve ser passado como prop 'medico'.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { carregarCatalogo } from './lib/protocoloCatalogo';
import Step1Paciente   from './steps/Step1Paciente';
import Step2Protocolo  from './steps/Step2Protocolo';
import Step3Calculos   from './steps/Step3Calculos';
import Step4Revisao    from './steps/Step4Revisao';

const N  = '#1B365D';
const VE = '#15803D';
const AM = '#B45309';
const VM = '#B91C1C';
const T  = '#2B7A8C';

const STEPS = [
  { id: 1, label: 'Paciente',   icone: '👤' },
  { id: 2, label: 'Protocolo',  icone: '💊' },
  { id: 3, label: 'Cálculo',    icone: '🧮' },
  { id: 4, label: 'Confirmação',icone: '🔐' },
];

/**
 * Props:
 *   catalogoJson   — conteúdo do JSON v0.2 (import estático ou fetch)
 *   medico         — { nome, crm } do médico logado
 *   pacienteInicial — dados pré-preenchidos do paciente (opcional)
 *   onPrescricaoGerada — callback(prescricao) — para uso futuro
 */
export default function PrescricaoQTv2({
  catalogoJson,
  medico = {},
  pacienteInicial = {},
  onPrescricaoGerada,
}) {
  const [stepAtual, setStepAtual] = useState(1);
  const [dadosPaciente, setDadosPaciente] = useState(pacienteInicial);
  const [protocoloSelecionado, setProtocoloSelecionado] = useState(null);
  const [calculoData, setCalculoData] = useState(null);
  const [prescricoes, setPrescricoes] = useState([]); // histórico da sessão

  // Carregar catálogo
  const { ok: catalogoOk, protocolos, erros: errosCatalogo, versao } = useMemo(
    () => (catalogoJson ? carregarCatalogo(catalogoJson) : { ok: false, protocolos: [], erros: ['catalogoJson não fornecido'], versao: '' }),
    [catalogoJson]
  );

  // ── Handlers de navegação ─────────────────────────────────────────────────

  const irStep1 = () => setStepAtual(1);
  const irStep2 = () => setStepAtual(2);
  const irStep3 = (protocolo) => {
    setProtocoloSelecionado(protocolo);
    setStepAtual(3);
  };
  const irStep4 = (dados) => {
    setCalculoData(dados);
    setStepAtual(4);
  };

  const handlePrescricaoConfirmada = (prescricao) => {
    setPrescricoes(prev => [prescricao, ...prev]);
    onPrescricaoGerada?.(prescricao);
    // Não navega automaticamente — Step4 mostra resumo
  };

  const reiniciar = () => {
    setStepAtual(1);
    setProtocoloSelecionado(null);
    setCalculoData(null);
  };

  // ── Erro crítico: catálogo não carregado ──────────────────────────────────
  if (!catalogoJson) {
    return (
      <div style={estilos.erroBloco}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⛔</div>
        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 4 }}>Catálogo não carregado</div>
        <div style={{ fontSize: 12, color: '#991B1B' }}>
          Passe o JSON do catálogo v0.2 como prop <code>catalogoJson</code>.<br />
          Exemplo: <code>{'<PrescricaoQTv2 catalogoJson={catalogoV02} />'}</code>
        </div>
      </div>
    );
  }

  if (!catalogoOk && errosCatalogo.length > 0) {
    return (
      <div style={estilos.erroBloco}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>⛔ Erro ao carregar catálogo</div>
        {errosCatalogo.map((e, i) => <div key={i} style={{ fontSize: 12 }}>{e}</div>)}
      </div>
    );
  }

  return (
    <div style={estilos.wrapper}>
      {/* ── Cabeçalho ── */}
      <div style={estilos.header}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
            Módulo de Prescrição QT — NÃO INTEGRADO
          </div>
          <h2 style={{ color: '#fff', margin: 0, fontSize: 15, fontWeight: 900 }}>
            💉 Prescrição de Quimioterapia Citotóxica
          </h2>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }}>
            Catálogo {versao} · {protocolos.length} protocolos disponíveis
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
          {prescricoes.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '3px 8px', fontSize: 10, color: '#fff' }}>
              {prescricoes.length} gerada{prescricoes.length > 1 ? 's' : ''} nesta sessão
            </div>
          )}
          <div style={{ background: '#FFF7ED', borderRadius: 6, padding: '3px 8px', fontSize: 9, color: AM, fontWeight: 700 }}>
            ⚠️ DRAFT — sem aprovação formal
          </div>
        </div>
      </div>

      {/* ── Stepper ── */}
      <div style={estilos.stepper}>
        {STEPS.map((s, idx) => {
          const ativo    = stepAtual === s.id;
          const concluido= stepAtual > s.id;
          return (
            <React.Fragment key={s.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    fontSize: 14,
                    background: concluido ? VE : ativo ? N : '#E2E8F0',
                    color: concluido || ativo ? '#fff' : '#94A3B8',
                    fontWeight: 900,
                    border: ativo ? `2px solid ${N}` : 'none',
                  }}
                >
                  {concluido ? '✓' : s.icone}
                </div>
                <div style={{ fontSize: 9, fontWeight: ativo ? 800 : 400, color: ativo ? N : '#94A3B8', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {s.label}
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: stepAtual > s.id ? VE : '#E2E8F0', alignSelf: 'center', marginTop: -12 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Conteúdo do step ── */}
      <div style={estilos.conteudo}>
        {stepAtual === 1 && (
          <Step1Paciente
            dadosPaciente={dadosPaciente}
            onChange={setDadosPaciente}
            onProximo={irStep2}
          />
        )}

        {stepAtual === 2 && (
          <Step2Protocolo
            protocolos={protocolos}
            onSelecionar={irStep3}
            onVoltar={irStep1}
          />
        )}

        {stepAtual === 3 && protocoloSelecionado && (
          <Step3Calculos
            protocolo={protocoloSelecionado}
            paciente={dadosPaciente}
            onProximo={irStep4}
            onVoltar={irStep2}
          />
        )}

        {stepAtual === 4 && protocoloSelecionado && calculoData && (
          <Step4Revisao
            protocolo={protocoloSelecionado}
            paciente={dadosPaciente}
            calculoData={calculoData}
            medico={medico}
            onVoltar={() => setStepAtual(3)}
            onConfirmado={handlePrescricaoConfirmada}
          />
        )}
      </div>

      {/* ── Aviso inferior fixo ── */}
      <div style={estilos.rodape}>
        🔒 Módulo em desenvolvimento — não integrado ao prontuário ou farmácia.
        Catálogo v0.2 sem protocolos aprovados. Conduta final é sempre do médico.
      </div>
    </div>
  );
}

const estilos = {
  wrapper: {
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr auto',
    minHeight: '100%',
    fontFamily: 'inherit',
  },
  header: {
    background: `linear-gradient(135deg, ${N}, #0d2347)`,
    borderRadius: '12px 12px 0 0',
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepper: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '14px 16px',
    background: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  conteudo: {
    padding: 16,
    overflowY: 'auto',
  },
  rodape: {
    background: '#FFF7ED',
    borderTop: '1px solid #FDE68A',
    padding: '8px 16px',
    fontSize: 10,
    color: '#92400E',
    textAlign: 'center',
  },
  erroBloco: {
    background: '#FEF2F2',
    border: '2px solid #DC2626',
    borderRadius: 12,
    padding: 24,
    textAlign: 'center',
    color: '#991B1B',
    margin: 16,
  },
};
