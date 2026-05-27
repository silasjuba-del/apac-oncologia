// ─────────────────────────────────────────────────────────────────────────────
// Step3Calculos.jsx
// Exibe doses calculadas por fármaco. Permite ajuste de redução de dose.
// Cálculo via calcProtocoloCompleto() — nunca usa dose extraída como texto puro.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { calcProtocoloCompleto, calcBSASafe } from '../lib/calculadoraDose';
import { NIVEL, validarCompleto } from '../lib/validacoesSeguranca';
import AlertaBloqueio from '../components/AlertaBloqueio';
import DrogaLinha from '../components/DrogaLinha';

const N  = '#1B365D';
const VE = '#15803D';
const VM = '#B91C1C';
const AM = '#B45309';

const REDUCOES = [
  { pct: 0,  label: 'Dose plena',  cor: VE },
  { pct: 25, label: '−25%',        cor: AM },
  { pct: 50, label: '−50%',        cor: '#D97706' },
  { pct: 75, label: '−75%',        cor: VM },
];

/**
 * Props:
 *   protocolo        — objeto selecionado do catálogo v0.2
 *   paciente         — dados do Step1
 *   onProximo        — callback(resultadoCalculo)
 *   onVoltar         — callback()
 */
export default function Step3Calculos({ protocolo, paciente, onProximo, onVoltar }) {
  const [reducaoPct, setReducaoPct] = useState(0);
  const [justReducao, setJustReducao] = useState('');
  const [dosesCumulativas] = useState({});
  const [expandirFonte, setExpandirFonte] = useState(false);

  // BSA para exibição
  const bsaRes = useMemo(
    () => calcBSASafe(paciente.pesoKg, paciente.alturaCm),
    [paciente.pesoKg, paciente.alturaCm]
  );

  // Cálculo completo
  const resultado = useMemo(
    () =>
      calcProtocoloCompleto(protocolo, {
        ...paciente,
        reducaoPct,
        dosesCumulativas,
      }),
    [protocolo, paciente, reducaoPct, dosesCumulativas]
  );

  // Validações
  const validacao = useMemo(
    () => validarCompleto(protocolo, { ...paciente, reducaoPct }),
    [protocolo, paciente, reducaoPct]
  );

  const temLinhasCalculadas = resultado.linhas.length > 0;
  const temErroCalculo = resultado.erros.length > 0;
  const precisaJustReducao = reducaoPct > 0 && justReducao.trim().length < 10;

  const podeProximo =
    !validacao.alertas.some(a => a.nivel === NIVEL.CRITICO) &&
    !temErroCalculo &&
    !precisaJustReducao;

  const handleProximo = () => {
    onProximo?.({
      resultado,
      reducaoPct,
      justReducao,
      bsa: bsaRes.bsa,
      dosesCumulativas,
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={estilos.sectionHeader}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={onVoltar} style={estilos.btnVoltar}>←</button>
          <div>
            <div style={estilos.titulo}>Cálculo de Doses — {protocolo.nome}</div>
            <div style={estilos.sub}>{paciente.nome} · BSA {bsaRes.bsa ? `${bsaRes.bsa} m²` : '(erro)'}</div>
          </div>
        </div>
      </div>

      {/* Alertas de validação */}
      {validacao.alertas.length > 0 && (
        <AlertaBloqueio alertas={validacao.alertas} mostrarTodos={false} />
      )}

      {/* Avisos críticos de dose cumulativa */}
      {resultado.avisosCriticos.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {resultado.avisosCriticos.map((av, i) => (
            <div key={i} style={estilos.avisoCrit}>{av}</div>
          ))}
        </div>
      )}

      {/* Seleção de redução de dose */}
      <div style={estilos.card}>
        <div style={estilos.cardTitle}>Redução de dose</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: reducaoPct > 0 ? 10 : 0 }}>
          {REDUCOES.map(r => (
            <button
              key={r.pct}
              onClick={() => setReducaoPct(r.pct)}
              style={{
                ...estilos.btnReducao,
                border: `2px solid ${reducaoPct === r.pct ? r.cor : '#E2E8F0'}`,
                background: reducaoPct === r.pct ? r.cor + '18' : '#F8FAFC',
                color: reducaoPct === r.pct ? r.cor : '#64748B',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {reducaoPct > 0 && (
          <div>
            <label style={estilos.label}>
              Justificativa da redução de dose * (mín. 10 caracteres)
            </label>
            <textarea
              value={justReducao}
              onChange={e => setJustReducao(e.target.value)}
              rows={2}
              placeholder="Ex: neuropatia G2, toxicidade hematológica no ciclo anterior..."
              style={{
                ...estilos.textarea,
                border: `1.5px solid ${precisaJustReducao ? VM : VE}`,
              }}
            />
          </div>
        )}
      </div>

      {/* Tabela de doses calculadas */}
      {temLinhasCalculadas ? (
        <div style={estilos.card}>
          <div style={estilos.cardTitle}>Doses calculadas</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Fármaco', 'Dose base', 'BSA/param', 'Dose calculada', 'Via', 'Dias'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '7px 10px', textAlign: 'left', fontWeight: 800,
                        color: N, fontSize: 10, borderBottom: '2px solid #E2E8F0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultado.linhas.map((linha, i) => (
                  <DrogaLinha key={i} linha={linha} index={i} />
                ))}
              </tbody>
            </table>
          </div>

          {reducaoPct > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: AM, fontWeight: 700 }}>
              ⚠️ Redução de {reducaoPct}% aplicada sobre todas as doses baseadas em mg/m² e mg/kg.
              Doses fixas e AUC foram ajustadas proporcionalmente — revisar com protocolo fonte.
            </div>
          )}
        </div>
      ) : (
        /* Fallback: protocolo sem doseEstruturada — mostra linhas extraídas como referência */
        <div style={{ ...estilos.card, borderColor: AM }}>
          <div style={{ color: AM, fontWeight: 800, fontSize: 12, marginBottom: 8 }}>
            ⚠️ Doses não calculáveis automaticamente
          </div>
          {resultado.erros.map((e, i) => (
            <div key={i} style={{ color: VM, fontSize: 11, marginBottom: 4 }}>⛔ {e}</div>
          ))}
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>
            Referência extraída do PDF (NÃO usar diretamente — confirmar contra fonte):
          </div>
          {(protocolo.linhasDoseExtraidas || []).map((l, i) => (
            <div key={i} style={{ fontSize: 11, color: N, padding: '4px 8px', background: '#F8FAFC', borderRadius: 6, marginBottom: 3 }}>
              {l}
            </div>
          ))}
        </div>
      )}

      {/* Periodicidade e ciclos */}
      <div style={{ ...estilos.card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={estilos.label}>Periodicidade</div>
          <div style={estilos.valor}>{protocolo.periodicidadeExtraida || 'Confirmar no PDF'}</div>
        </div>
        <div>
          <div style={estilos.label}>Farmacos detectados</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {(protocolo.farmacosDetectados || []).map(f => (
              <span key={f} style={estilos.tagFarmaco}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Linhas fonte colapsadas */}
      <button
        onClick={() => setExpandirFonte(e => !e)}
        style={estilos.btnExpandir}
      >
        {expandirFonte ? '▲' : '▼'} Texto fonte do PDF ({(protocolo.linhasDoseExtraidas || []).length} linhas)
      </button>
      {expandirFonte && (
        <div style={{ ...estilos.card, fontSize: 10, color: '#374151', fontFamily: 'monospace', marginTop: 4 }}>
          {(protocolo.linhasDoseExtraidas || []).map((l, i) => (
            <div key={i} style={{ marginBottom: 2 }}>{l}</div>
          ))}
        </div>
      )}

      {/* Botão próximo */}
      <button
        onClick={handleProximo}
        disabled={!podeProximo}
        style={{
          ...estilos.btnProximo,
          opacity: podeProximo ? 1 : 0.4,
          cursor: podeProximo ? 'pointer' : 'not-allowed',
          marginTop: 14,
        }}
      >
        Próximo: Revisão e Confirmação Médica →
      </button>
    </div>
  );
}

const estilos = {
  sectionHeader: {
    marginBottom: 12, padding: '10px 14px', background: '#F8FAFC',
    borderRadius: 10, border: '1px solid #E2E8F0',
  },
  titulo: { fontSize: 14, fontWeight: 900, color: N },
  sub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  btnVoltar: {
    background: '#F1F5F9', border: 'none', borderRadius: 8, width: 34, height: 34,
    cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center',
  },
  avisoCrit: {
    background: '#FEF2F2', border: '1.5px solid #DC2626',
    borderRadius: 8, padding: '7px 12px', marginBottom: 6,
    fontSize: 11, color: '#991B1B', fontWeight: 700,
  },
  card: {
    background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10,
    padding: '12px 14px', marginBottom: 10,
  },
  cardTitle: { fontWeight: 800, fontSize: 12, color: N, marginBottom: 10 },
  label: { fontSize: 10, fontWeight: 700, color: N, textTransform: 'uppercase', marginBottom: 3 },
  valor: { fontSize: 13, fontWeight: 700, color: '#374151' },
  textarea: {
    width: '100%', borderRadius: 8, padding: '8px 10px', fontSize: 12,
    fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
  },
  btnReducao: {
    flex: 1, padding: '9px 6px', borderRadius: 8, cursor: 'pointer',
    fontSize: 11, fontWeight: 800, fontFamily: 'inherit', transition: 'all 0.15s',
  },
  tagFarmaco: {
    background: '#F0FDF4', color: '#15803D', borderRadius: 5,
    padding: '1px 6px', fontSize: 9, fontWeight: 700,
  },
  btnExpandir: {
    background: 'none', border: '1px dashed #CBD5E1', borderRadius: 7,
    color: '#64748B', fontSize: 11, padding: '5px 12px', cursor: 'pointer',
    width: '100%', fontFamily: 'inherit',
  },
  btnProximo: {
    background: N, color: '#fff', border: 'none', borderRadius: 10,
    padding: '12px 24px', fontSize: 13, fontWeight: 900, fontFamily: 'inherit',
    width: '100%', transition: 'opacity 0.2s',
  },
};
