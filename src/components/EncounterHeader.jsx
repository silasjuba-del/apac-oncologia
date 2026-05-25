// ─────────────────────────────────────────────────────────────────────────────
// EncounterHeader.jsx — Cabeçalho de auditoria visual do atendimento (F0)
//
// Mostra: nome do paciente, tipo de atendimento, status e horário de abertura.
// Cor de fundo varia conforme status: aberto=verde, quarentena=vermelho.
//
// Usado em: StepperMedico, ProntuarioDossie, APACDossie
// ─────────────────────────────────────────────────────────────────────────────

import { useEncounter } from '../contexts/EncounterContext';
import { ENCOUNTER_TIPO_LABELS, ENCOUNTER_STATUS } from '../utils/encounterMachine';

// ── Paleta de status ──────────────────────────────────────────────────────────

const STATUS_STYLE = {
  [ENCOUNTER_STATUS.OPEN]:        { bg: '#e8f5e9', border: '#4caf50', dot: '#4caf50', label: 'Em andamento' },
  [ENCOUNTER_STATUS.CLOSING]:     { bg: '#fff8e1', border: '#ff9800', dot: '#ff9800', label: 'Encerrando' },
  [ENCOUNTER_STATUS.CLOSED]:      { bg: '#f5f5f5', border: '#9e9e9e', dot: '#9e9e9e', label: 'Encerrado'   },
  [ENCOUNTER_STATUS.QUARANTINED]: { bg: '#ffebee', border: '#f44336', dot: '#f44336', label: 'QUARENTENA'  },
};

// ── Formatar hora de abertura ─────────────────────────────────────────────────

function formatHora(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit',
    });
  } catch (_) {
    return isoString;
  }
}

function formatData(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch (_) {
    return isoString;
  }
}

// ── Componente ─────────────────────────────────────────────────────────────────

/**
 * EncounterHeader — barra de auditoria clínica no topo das telas médicas.
 *
 * @param {{ pac?: Object, compact?: boolean }} props
 *   pac     — paciente ativo (para exibir nome quando não há encounter)
 *   compact — versão compacta (apenas 1 linha, sem encounterId)
 */
export default function EncounterHeader({ pac, compact = false }) {
  const { encounter } = useEncounter();

  // ── Sem encounter: aviso neutro ───────────────────────────────────────────
  if (!encounter) {
    return (
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            8,
        padding:        '6px 12px',
        background:     '#fafafa',
        border:         '1px solid #e0e0e0',
        borderRadius:   6,
        fontSize:       12,
        color:          '#757575',
      }}>
        <span style={{ fontSize: 14 }}>⚠️</span>
        <span>Nenhum atendimento aberto</span>
        {pac?.nome && (
          <span style={{ marginLeft: 8, fontWeight: 600, color: '#424242' }}>
            · {pac.nome}
          </span>
        )}
      </div>
    );
  }

  // ── Com encounter ─────────────────────────────────────────────────────────
  const style = STATUS_STYLE[encounter.status] || STATUS_STYLE[ENCOUNTER_STATUS.OPEN];
  const tipoLabel = ENCOUNTER_TIPO_LABELS[encounter.tipo] || encounter.tipo;

  if (compact) {
    return (
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            8,
        padding:        '4px 10px',
        background:     style.bg,
        border:         `1px solid ${style.border}`,
        borderRadius:   4,
        fontSize:       11,
      }}>
        <StatusDot color={style.dot} />
        <span style={{ fontWeight: 600 }}>{tipoLabel}</span>
        <span style={{ color: '#616161' }}>·</span>
        <span>{formatHora(encounter.abertaEm)}</span>
        {encounter.status === ENCOUNTER_STATUS.QUARANTINED && (
          <QuarantineBadge />
        )}
      </div>
    );
  }

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            12,
      padding:        '8px 14px',
      background:     style.bg,
      border:         `1px solid ${style.border}`,
      borderRadius:   6,
      fontSize:       12,
    }}>
      {/* Status indicator */}
      <StatusDot color={style.dot} size={10} />

      {/* Tipo de atendimento */}
      <span style={{ fontWeight: 700, fontSize: 13 }}>{tipoLabel}</span>

      <Divider />

      {/* Paciente */}
      {encounter.patientId && (
        <>
          <span style={{ color: '#424242' }}>
            <span style={{ color: '#757575', marginRight: 4 }}>Pac:</span>
            <strong>{pac?.nome || encounter.patientId}</strong>
          </span>
          <Divider />
        </>
      )}

      {/* Data e hora */}
      <span style={{ color: '#616161' }}>
        {formatData(encounter.abertaEm)} às {formatHora(encounter.abertaEm)}
      </span>

      <Divider />

      {/* Status badge */}
      <StatusBadge label={style.label} color={style.border}
                   quarantine={encounter.status === ENCOUNTER_STATUS.QUARANTINED} />

      {/* EncounterId — pequeno, para auditoria */}
      {!compact && (
        <span style={{ marginLeft: 'auto', color: '#9e9e9e', fontSize: 10, fontFamily: 'monospace' }}>
          {encounter.encounterId}
        </span>
      )}
    </div>
  );
}

// ── Sub-componentes internos ───────────────────────────────────────────────────

function StatusDot({ color, size = 8 }) {
  return (
    <span style={{
      display:      'inline-block',
      width:        size,
      height:       size,
      borderRadius: '50%',
      background:   color,
      flexShrink:   0,
    }} />
  );
}

function Divider() {
  return <span style={{ color: '#e0e0e0' }}>|</span>;
}

function StatusBadge({ label, color, quarantine }) {
  return (
    <span style={{
      padding:      '2px 8px',
      borderRadius: 12,
      border:       `1px solid ${color}`,
      color,
      fontWeight:   quarantine ? 700 : 500,
      fontSize:     11,
      letterSpacing: quarantine ? 1 : 0,
    }}>
      {quarantine && '🔒 '}{label}
    </span>
  );
}

function QuarantineBadge() {
  return (
    <span style={{
      padding:      '1px 6px',
      borderRadius: 10,
      background:   '#f44336',
      color:        '#fff',
      fontWeight:   700,
      fontSize:     10,
      letterSpacing: 1,
    }}>
      QUARENTENA
    </span>
  );
}
