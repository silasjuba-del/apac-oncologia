// ─────────────────────────────────────────────────────────────────────────────
// AlertaBloqueio.jsx
// Exibe alertas de segurança clínica com nível visual claro.
// Nunca oculta alertas críticos. Crítico não pode ser "dismissed".
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { NIVEL } from '../lib/validacoesSeguranca';

const CORES = {
  [NIVEL.CRITICO]: { bg: '#FEF2F2', borda: '#DC2626', texto: '#991B1B', icone: '⛔', titulo: 'BLOQUEANTE — Não prescritível' },
  [NIVEL.GRAVE]:   { bg: '#FFF7ED', borda: '#D97706', texto: '#92400E', icone: '⚠️', titulo: 'Atenção grave — Confirmação obrigatória' },
  [NIVEL.AVISO]:   { bg: '#FFFBEB', borda: '#F59E0B', texto: '#78350F', icone: '📋', titulo: 'Aviso' },
  [NIVEL.INFO]:    { bg: '#EFF6FF', borda: '#3B82F6', texto: '#1E40AF', icone: 'ℹ️',  titulo: 'Informação' },
};

/**
 * Renderiza um único alerta de segurança.
 */
export function AlertaItem({ alerta }) {
  const c = CORES[alerta.nivel] || CORES[NIVEL.INFO];
  return (
    <div
      style={{
        background: c.bg,
        border: `1.5px solid ${c.borda}`,
        borderRadius: 8,
        padding: '8px 12px',
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>{c.icone}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 10, color: c.texto, textTransform: 'uppercase', marginBottom: 2 }}>
            {c.titulo}
          </div>
          <div style={{ fontSize: 12, color: c.texto, lineHeight: 1.5 }}>
            {alerta.mensagem}
          </div>
          {alerta.codigo && (
            <div style={{ fontSize: 9, color: c.borda, opacity: 0.7, marginTop: 2, fontFamily: 'monospace' }}>
              [{alerta.codigo}]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Bloco consolidado de alertas para um protocolo/paciente.
 *
 * Props:
 *   alertas        — array de { nivel, codigo, mensagem }
 *   mostrarTodos   — se false, apenas críticos e graves são mostrados por padrão
 */
export default function AlertaBloqueio({ alertas = [], mostrarTodos = true }) {
  const [expandido, setExpandido] = React.useState(false);

  if (!alertas || alertas.length === 0) return null;

  const criticos = alertas.filter(a => a.nivel === NIVEL.CRITICO);
  const graves   = alertas.filter(a => a.nivel === NIVEL.GRAVE);
  const avisos   = alertas.filter(a => a.nivel === NIVEL.AVISO);
  const infos    = alertas.filter(a => a.nivel === NIVEL.INFO);

  const visiveis = mostrarTodos || expandido
    ? alertas
    : [...criticos, ...graves];

  const ocultos = alertas.length - visiveis.length;

  return (
    <div style={{ margin: '8px 0' }}>
      {/* Resumo de contagem */}
      {(criticos.length > 0 || graves.length > 0) && (
        <div
          style={{
            background: criticos.length > 0 ? '#FEF2F2' : '#FFF7ED',
            border: `2px solid ${criticos.length > 0 ? '#DC2626' : '#D97706'}`,
            borderRadius: 10,
            padding: '8px 12px',
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 900, color: criticos.length > 0 ? '#991B1B' : '#92400E' }}>
            {criticos.length > 0
              ? `⛔ ${criticos.length} bloqueante${criticos.length > 1 ? 's' : ''} — prescrição não permitida`
              : `⚠️ ${graves.length} alerta${graves.length > 1 ? 's' : ''} grave${graves.length > 1 ? 's' : ''} — confirmação obrigatória`}
            {avisos.length > 0 && (
              <span style={{ fontWeight: 400, marginLeft: 8, opacity: 0.7 }}>
                + {avisos.length} aviso{avisos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Alertas visíveis */}
      {visiveis.map((a, i) => (
        <AlertaItem key={a.codigo || i} alerta={a} />
      ))}

      {/* Toggle para avisos e infos ocultos */}
      {ocultos > 0 && (
        <button
          onClick={() => setExpandido(true)}
          style={{
            background: 'none',
            border: '1px dashed #CBD5E1',
            borderRadius: 7,
            color: '#64748B',
            fontSize: 11,
            padding: '5px 12px',
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'inherit',
          }}
        >
          + Ver mais {ocultos} alerta{ocultos > 1 ? 's' : ''} (avisos/info)
        </button>
      )}
    </div>
  );
}
