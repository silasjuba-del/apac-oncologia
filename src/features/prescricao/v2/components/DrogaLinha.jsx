// ─────────────────────────────────────────────────────────────────────────────
// DrogaLinha.jsx
// Linha de fármaco na tabela de prescrição com dose calculada e alertas.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { NIVEL } from '../lib/validacoesSeguranca';

const COR_NIVEL = {
  critico: '#B91C1C',
  aviso:   '#B45309',
  ok:      '#15803D',
};

/**
 * Props:
 *   linha   — resultado de calcProtocoloCompleto().linhas[i]
 *   index
 */
export default function DrogaLinha({ linha, index }) {
  if (!linha) return null;

  const {
    farmaco,
    doseBase,
    doseUnidade,
    via,
    dias,
    observacao,
    bsaUsada,
    reducaoPct,
    doseCalculada,
    unidadeFinal,
    erro,
    avisos = [],
    doseCumulativa = {},
  } = linha;

  const temErro = !!erro;
  const temCumulativoCritico = doseCumulativa.nivel === 'critico';
  const temCumulativoAviso   = doseCumulativa.nivel === 'aviso';

  const bgRow =
    temErro || temCumulativoCritico
      ? '#FEF2F2'
      : index % 2 === 0
      ? '#F8FAFC'
      : '#FFFFFF';

  return (
    <>
      <tr style={{ background: bgRow, borderBottom: '1px solid #E2E8F0' }}>
        {/* Fármaco */}
        <td style={{ padding: '8px 10px', fontWeight: 700, fontSize: 12, color: '#1B365D' }}>
          {farmaco}
        </td>

        {/* Dose base */}
        <td style={{ padding: '8px 10px', fontSize: 11, color: '#374151' }}>
          {doseBase} {doseUnidade}
        </td>

        {/* BSA/parâmetro usado */}
        <td style={{ padding: '8px 10px', fontSize: 11, color: '#64748B' }}>
          {doseUnidade === 'mg/m²' && bsaUsada ? `${bsaUsada} m²` : '—'}
        </td>

        {/* Dose calculada */}
        <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 900 }}>
          {temErro ? (
            <span style={{ color: '#B91C1C', fontSize: 11 }}>⛔ Erro</span>
          ) : doseCalculada !== null ? (
            <span style={{ color: reducaoPct > 0 ? '#B45309' : '#1B365D' }}>
              {doseCalculada} {unidadeFinal}
              {reducaoPct > 0 && (
                <span style={{ fontSize: 9, color: '#B91C1C', marginLeft: 4 }}>−{reducaoPct}%</span>
              )}
            </span>
          ) : (
            <span style={{ color: '#B45309', fontSize: 11 }}>Calcular manualmente</span>
          )}
        </td>

        {/* Via */}
        <td style={{ padding: '8px 10px', fontSize: 11, color: '#374151' }}>
          <span
            style={{
              background:
                via?.toLowerCase().includes('intravesical')
                  ? '#FEF2F2'
                  : '#EFF6FF',
              color:
                via?.toLowerCase().includes('intravesical')
                  ? '#B91C1C'
                  : '#1E40AF',
              borderRadius: 5,
              padding: '1px 6px',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {via || '?'}
          </span>
        </td>

        {/* Dias */}
        <td style={{ padding: '8px 10px', fontSize: 11 }}>
          <span
            style={{
              background: '#F0FDF4',
              color: '#15803D',
              borderRadius: 5,
              padding: '1px 6px',
              fontWeight: 700,
            }}
          >
            {Array.isArray(dias) ? dias.map(d => `D${d}`).join(' ') : dias || '?'}
          </span>
        </td>
      </tr>

      {/* Sub-linha: avisos e erros */}
      {(temErro || avisos.length > 0 || doseCumulativa.nivel !== 'ok') && (
        <tr style={{ background: temErro || temCumulativoCritico ? '#FEF2F2' : '#FFFBEB' }}>
          <td colSpan={6} style={{ padding: '4px 10px 8px 10px' }}>
            {temErro && (
              <div style={{ color: '#B91C1C', fontSize: 11, marginBottom: 2 }}>
                ⛔ {erro}
              </div>
            )}
            {doseCumulativa.mensagem && (
              <div
                style={{
                  color: COR_NIVEL[doseCumulativa.nivel] || '#374151',
                  fontSize: 11,
                  marginBottom: 2,
                  fontWeight: 700,
                }}
              >
                {doseCumulativa.mensagem}
              </div>
            )}
            {avisos.map((av, i) => (
              <div key={i} style={{ color: '#B45309', fontSize: 10, marginBottom: 1 }}>
                📋 {av}
              </div>
            ))}
            {observacao && (
              <div style={{ color: '#64748B', fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>
                {observacao}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
