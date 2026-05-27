// ─────────────────────────────────────────────────────────────────────────────
// Step4Revisao.jsx
// Revisão final + confirmação médica explícita + geração da trilha de auditoria.
// NÃO integra ao APACApp nesta versão. Retorna objeto prescricao estruturado.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import { gerarHashProtocolo } from '../lib/protocoloCatalogo';
import { NIVEL, validarCompleto } from '../lib/validacoesSeguranca';
import AlertaBloqueio from '../components/AlertaBloqueio';
import ModalConfirmacao from '../components/ModalConfirmacao';

const N  = '#1B365D';
const VE = '#15803D';
const VM = '#B91C1C';
const AM = '#B45309';
const T  = '#2B7A8C';

/**
 * Props:
 *   protocolo    — objeto do catálogo v0.2
 *   paciente     — dados do Step1
 *   calculoData  — resultado de Step3 { resultado, reducaoPct, justReducao, bsa, dosesCumulativas }
 *   medico       — { nome, crm }
 *   onVoltar     — callback()
 *   onConfirmado — callback(prescricao) — objeto final estruturado
 */
export default function Step4Revisao({
  protocolo,
  paciente,
  calculoData,
  medico = {},
  onVoltar,
  onConfirmado,
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const [prescricaoGerada, setPrescricaoGerada] = useState(null);

  const validacao = validarCompleto(protocolo, paciente);
  const { resultado, reducaoPct, justReducao, bsa } = calculoData || {};

  const handleAbrirModal = () => {
    if (!validacao.podeProsseguir) return;
    setModalAberto(true);
  };

  const handleConfirmar = useCallback((dadosConfirmacao) => {
    const agora = new Date().toISOString();
    const hash = gerarHashProtocolo(protocolo, agora);

    const prescricao = {
      // Identificação
      id: `RX-${Date.now()}`,
      hashProtocolo: hash,
      catalogoVersao: protocolo.versaoCatalogo || 'v0.2',
      status: 'gerado_nao_integrado',

      // Timestamps
      geradoEm: agora,
      dataConfirmacao: dadosConfirmacao.timestamp,

      // Médico
      medico: {
        nome: dadosConfirmacao.medicoNome,
        crm: dadosConfirmacao.crm,
      },

      // Paciente (sem dados sensíveis completos — apenas identificadores mínimos)
      paciente: {
        id: paciente.id || paciente.prontuario,
        nome: paciente.nome,
        prontuario: paciente.prontuario,
        bsa,
        pesoKg: paciente.pesoKg,
        alturaCm: paciente.alturaCm,
        ecog: paciente.ecog,
        sexo: paciente.sexo,
        idade: paciente.idade,
      },

      // Protocolo
      protocolo: {
        id: protocolo.id,
        nome: protocolo.nome,
        tumorContexto: protocolo.tumorContexto,
        periodicidade: protocolo.periodicidadeExtraida,
        fonte: protocolo.fonte,
        statusCatalogo: protocolo.status,
      },

      // Doses calculadas
      doses: (resultado?.linhas || []).map(l => ({
        farmaco: l.farmaco,
        doseBase: l.doseBase,
        doseUnidade: l.doseUnidade,
        via: l.via,
        dias: l.dias,
        doseCalculada: l.doseCalculada,
        unidadeFinal: l.unidadeFinal,
        reducaoPct,
        bsaUsada: l.bsaUsada,
        avisos: l.avisos,
        erros: l.erro ? [l.erro] : [],
      })),

      // Ajustes de dose
      reducaoPct,
      justificativaReducao: justReducao || '',

      // Confirmação do médico
      checklistMarcado: dadosConfirmacao.checklistMarcado,
      justificativaMedica: dadosConfirmacao.justificativa,

      // Alertas que foram aceitos
      alertasAceitos: validacao.alertas.filter(a => a.nivel !== NIVEL.CRITICO),

      // Avisos críticos de dose cumulativa aceitos
      avisosCumulativosAceitos: resultado?.avisosCriticos || [],

      // Metadados
      _meta: {
        versaoModulo: 'PrescricaoQTv2-nao-integrado',
        catalogoArquivo: 'protocolos_qt_catalogo_v0.2_revisao.json',
        aviso: 'NENHUM protocolo aprovado no catálogo v0.2. Conduta final é do médico.',
      },
    };

    setPrescricaoGerada(prescricao);
    setModalAberto(false);
    onConfirmado?.(prescricao);
  }, [protocolo, paciente, validacao, resultado, reducaoPct, justReducao, bsa, onConfirmado]);

  // Se prescrição já foi gerada, mostra resumo
  if (prescricaoGerada) {
    return <ResumoPrescricao prescricao={prescricaoGerada} onNovaPrescricao={() => setPrescricaoGerada(null)} />;
  }

  return (
    <div>
      {/* Header */}
      <div style={estilos.sectionHeader}>
        <button onClick={onVoltar} style={estilos.btnVoltar}>←</button>
        <div>
          <div style={estilos.titulo}>Revisão Final — {protocolo.nome}</div>
          <div style={estilos.sub}>Confirmar todos os dados antes de gerar a prescrição</div>
        </div>
      </div>

      {/* Alertas */}
      {validacao.alertas.length > 0 && (
        <AlertaBloqueio alertas={validacao.alertas} mostrarTodos />
      )}

      {/* Resumo paciente */}
      <SectionCard titulo="👤 Paciente" cor={N}>
        <Grid2>
          <Campo label="Nome" valor={paciente.nome} />
          <Campo label="Prontuário" valor={paciente.prontuario} />
          <Campo label="Peso / Altura" valor={`${paciente.pesoKg} kg / ${paciente.alturaCm} cm`} />
          <Campo label="BSA (Mosteller)" valor={`${bsa} m²`} destaque />
          <Campo label="ECOG" valor={paciente.ecog} />
          <Campo label="Idade" valor={`${paciente.idade} anos`} />
          {paciente.histologia && <Campo label="Histologia" valor={paciente.histologia} />}
        </Grid2>
      </SectionCard>

      {/* Resumo protocolo */}
      <SectionCard titulo="💊 Protocolo" cor={T}>
        <Grid2>
          <Campo label="Nome" valor={protocolo.nome} />
          <Campo label="Status catálogo" valor={protocolo.status} corValor={AM} />
          <Campo label="Tumor/contexto" valor={protocolo.tumorContexto} />
          <Campo label="Periodicidade" valor={protocolo.periodicidadeExtraida || '—'} />
          <Campo label="Versão catálogo" valor={protocolo.versaoCatalogo || 'v0.2'} />
          <Campo label="Fonte PDF" valor={protocolo.fonte} />
        </Grid2>
      </SectionCard>

      {/* Resumo doses */}
      <SectionCard titulo="📋 Doses calculadas" cor={VE}>
        {reducaoPct > 0 && (
          <div style={{ fontSize: 11, color: AM, fontWeight: 700, marginBottom: 8 }}>
            ⚠️ Redução aplicada: −{reducaoPct}% — Justificativa: {justReducao || '(não informada)'}
          </div>
        )}
        {(resultado?.linhas || []).length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#F0FDF4' }}>
                  {['Fármaco', 'Dose calculada', 'Via', 'Dias'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 800, color: VE, fontSize: 10, borderBottom: '1px solid #D1FAE5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(resultado?.linhas || []).map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F0FDF4' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: N }}>{l.farmaco}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 900, color: reducaoPct > 0 ? AM : VE, fontSize: 13 }}>
                      {l.doseCalculada !== null && l.doseCalculada !== undefined ? `${l.doseCalculada} ${l.unidadeFinal}` : <span style={{ color: VM }}>⛔ Erro</span>}
                    </td>
                    <td style={{ padding: '6px 8px', color: '#374151' }}>{l.via || '?'}</td>
                    <td style={{ padding: '6px 8px', color: '#374151' }}>
                      {Array.isArray(l.dias) ? l.dias.map(d => `D${d}`).join(' ') : l.dias || '?'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: AM }}>
            ⚠️ Doses não estruturadas — revisar manualmente com PDF fonte.
          </div>
        )}
      </SectionCard>

      {/* Aviso DRAFT */}
      <div style={estilos.avisoCatalogo}>
        🔒 <strong>Catálogo v0.2 — NENHUM protocolo aprovado.</strong> Esta prescrição será gerada como
        rascunho não integrado. O médico assume responsabilidade pela adequação clínica.
      </div>

      {/* Botão confirmar */}
      <button
        onClick={handleAbrirModal}
        disabled={!validacao.podeProsseguir}
        style={{
          ...estilos.btnConfirmar,
          opacity: validacao.podeProsseguir ? 1 : 0.4,
          cursor: validacao.podeProsseguir ? 'pointer' : 'not-allowed',
        }}
      >
        🔐 Abrir confirmação médica e gerar prescrição
      </button>

      {!validacao.podeProsseguir && (
        <div style={{ textAlign: 'center', fontSize: 11, color: VM, marginTop: 6 }}>
          Resolva os bloqueantes acima para habilitar a confirmação.
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <ModalConfirmacao
          protocolo={protocolo}
          paciente={paciente}
          alertas={validacao.alertas}
          exigeJustificativa={validacao.exigeJustificativa}
          medico={medico}
          onConfirmar={handleConfirmar}
          onCancelar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}

// ── Subcomponentes de UI ──────────────────────────────────────────────────────

function SectionCard({ titulo, cor, children }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ background: cor + '18', borderBottom: '1px solid #E2E8F0', padding: '7px 12px', fontWeight: 800, fontSize: 11, color: cor }}>
        {titulo}
      </div>
      <div style={{ padding: '10px 12px' }}>{children}</div>
    </div>
  );
}

function Grid2({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px 12px' }}>
      {children}
    </div>
  );
}

function Campo({ label, valor, destaque = false, corValor }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: destaque ? 14 : 12, fontWeight: destaque ? 900 : 500, color: corValor || (destaque ? N : '#374151') }}>
        {valor || '—'}
      </div>
    </div>
  );
}

function ResumoPrescricao({ prescricao, onNovaPrescricao }) {
  const auditoriaSegura = criarTrilhaAuditoriaSegura(prescricao);

  return (
    <div>
      <div style={{ background: '#F0FDF4', border: '2px solid #15803D', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: '#15803D', marginBottom: 4 }}>
          ✅ Prescrição gerada — não integrada
        </div>
        <div style={{ fontSize: 11, color: '#166534' }}>
          ID: {prescricao.id} · Hash: {prescricao.hashProtocolo}
        </div>
        <div style={{ fontSize: 11, color: '#166534' }}>
          {prescricao.protocolo.nome} · {prescricao.paciente.nome} · BSA {prescricao.paciente.bsa} m²
        </div>
      </div>

      <div style={{ background: '#FFF7ED', border: '1px solid #D97706', borderRadius: 9, padding: '10px 12px', marginBottom: 14, fontSize: 11, color: '#92400E' }}>
        ⚠️ Esta prescrição foi gerada como rascunho. Não foi enviada à farmácia nem ao sistema de prescrição.
        O médico deve transferir manualmente as doses para o prontuário oficial.
        <br /><strong>Catálogo v0.2 — NENHUM protocolo aprovado.</strong>
      </div>

      {/* Doses finais */}
      <div style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 12, color: N, marginBottom: 8 }}>Doses prescritas</div>
        {prescricao.doses.map((d, i) => (
          <div key={i} style={{ padding: '6px 0', borderBottom: i < prescricao.doses.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <span style={{ fontWeight: 700, color: N }}>{d.farmaco}</span>
            <span style={{ color: '#374151', marginLeft: 8 }}>
              {d.doseCalculada !== null && d.doseCalculada !== undefined ? `${d.doseCalculada} ${d.unidadeFinal}` : '⛔ Erro'}
              {d.reducaoPct > 0 && <span style={{ color: AM, fontSize: 10, marginLeft: 4 }}>(−{d.reducaoPct}%)</span>}
            </span>
            <span style={{ color: '#64748B', fontSize: 10, marginLeft: 8 }}>
              {d.via} · {Array.isArray(d.dias) ? d.dias.map(dd => `D${dd}`).join(' ') : d.dias}
            </span>
          </div>
        ))}
      </div>

      {/* Trilha de auditoria */}
      <details style={{ marginBottom: 10 }}>
        <summary style={{ cursor: 'pointer', fontSize: 11, color: '#64748B', padding: '6px 0' }}>
          📋 Ver trilha de auditoria sem PHI
        </summary>
        <pre style={{
          background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
          padding: 10, fontSize: 9, overflowX: 'auto', color: '#374151', marginTop: 4,
        }}>
          {JSON.stringify(auditoriaSegura, null, 2)}
        </pre>
      </details>

      <button onClick={onNovaPrescricao} style={{ background: N, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        + Nova prescrição
      </button>
    </div>
  );
}

function criarTrilhaAuditoriaSegura(prescricao) {
  return {
    id: prescricao.id,
    hashProtocolo: prescricao.hashProtocolo,
    catalogoVersao: prescricao.catalogoVersao,
    status: prescricao.status,
    geradoEm: prescricao.geradoEm,
    dataConfirmacao: prescricao.dataConfirmacao,
    medico: {
      crm: prescricao.medico?.crm,
    },
    paciente: {
      id: prescricao.paciente?.id || null,
      prontuario: prescricao.paciente?.prontuario || null,
      idade: prescricao.paciente?.idade ?? null,
      sexo: prescricao.paciente?.sexo ?? null,
      ecog: prescricao.paciente?.ecog ?? null,
      bsa: prescricao.paciente?.bsa ?? null,
      pesoKg: prescricao.paciente?.pesoKg ?? null,
      alturaCm: prescricao.paciente?.alturaCm ?? null,
    },
    protocolo: prescricao.protocolo,
    doses: (prescricao.doses || []).map(d => ({
      farmaco: d.farmaco,
      doseBase: d.doseBase,
      doseUnidade: d.doseUnidade,
      via: d.via,
      dias: d.dias,
      doseCalculada: d.doseCalculada,
      unidadeFinal: d.unidadeFinal,
      reducaoPct: d.reducaoPct,
      avisos: d.avisos,
      erros: d.erros,
    })),
    reducaoPct: prescricao.reducaoPct,
    checklistMarcado: prescricao.checklistMarcado,
    alertasAceitos: (prescricao.alertasAceitos || []).map(a => ({
      nivel: a.nivel,
      codigo: a.codigo,
    })),
    avisosCumulativosAceitos: prescricao.avisosCumulativosAceitos,
    _meta: prescricao._meta,
  };
}

const estilos = {
  sectionHeader: {
    display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12,
    padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0',
  },
  titulo: { fontSize: 14, fontWeight: 900, color: N },
  sub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  btnVoltar: {
    background: '#F1F5F9', border: 'none', borderRadius: 8, width: 34, height: 34,
    cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center',
  },
  avisoCatalogo: {
    background: '#FFF7ED', border: '1px solid #D97706', borderRadius: 8,
    padding: '10px 12px', marginBottom: 12, fontSize: 11, color: '#92400E',
  },
  btnConfirmar: {
    background: '#1B365D', color: '#fff', border: 'none', borderRadius: 10,
    padding: '13px 24px', fontSize: 13, fontWeight: 900, fontFamily: 'inherit',
    width: '100%', transition: 'opacity 0.2s',
  },
};
