// ─────────────────────────────────────────────────────────────────────────────
// Step2Protocolo.jsx
// Seleção de protocolo a partir do catálogo v0.2 auditado.
// Exibe status (draft/bloqueado), farmacos detectados, tumor contexto.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { buscarProtocolos, filtrarProtocolosPrescritiveis, labelStatus, agruparPorTumor } from '../lib/protocoloCatalogo';

const N  = '#1B365D';
const VE = '#15803D';
const VM = '#B91C1C';
const AM = '#B45309';
const T  = '#2B7A8C';

/**
 * Props:
 *   protocolos    — array do catálogo v0.2 carregado
 *   onSelecionar  — callback(protocolo)
 *   onVoltar      — callback()
 */
export default function Step2Protocolo({ protocolos = [], onSelecionar, onVoltar }) {
  const [busca, setBusca] = useState('');
  const [tumorFiltro, setTumorFiltro] = useState('');
  const [modoVisualizacao, setModoVisualizacao] = useState('busca'); // 'busca' | 'grupos'

  // Apenas prescritíveis (sem bloqueados/quarentena/excluídos)
  const prescritíveis = useMemo(() => filtrarProtocolosPrescritiveis(protocolos), [protocolos]);

  // Tumores únicos para filtro
  const tumores = useMemo(() => {
    const set = new Set(prescritíveis.map(p => p.tumorContexto || 'Não especificado'));
    return [...set].sort();
  }, [prescritíveis]);

  // Busca
  const resultadosBusca = useMemo(() => {
    if (busca.trim().length < 2) return [];
    const res = buscarProtocolos(prescritíveis, busca);
    if (tumorFiltro) return res.filter(p => p.tumorContexto === tumorFiltro);
    return res;
  }, [busca, tumorFiltro, prescritíveis]);

  // Grupos
  const grupos = useMemo(() => {
    const lista = tumorFiltro ? prescritíveis.filter(p => p.tumorContexto === tumorFiltro) : prescritíveis;
    return agruparPorTumor(lista);
  }, [prescritíveis, tumorFiltro]);

  const totalBloqueados = protocolos.filter(p => p.status === 'bloqueado' || p.status === 'quarentena_fragmento_pdf').length;
  const totalDraft      = prescritíveis.filter(p => p.status === 'draft').length;

  return (
    <div>
      {/* Header */}
      <div style={estilos.sectionHeader}>
        <span style={{ fontSize: 20 }}>💊</span>
        <div style={{ flex: 1 }}>
          <div style={estilos.titulo}>Seleção de Protocolo</div>
          <div style={estilos.sub}>
            {prescritíveis.length} protocolos disponíveis no catálogo v0.2 ·
            {totalBloqueados > 0 && <span style={{ color: VM }}> {totalBloqueados} bloqueados (não listados)</span>}
          </div>
        </div>
        <button onClick={onVoltar} style={estilos.btnVoltar}>← Voltar</button>
      </div>

      {/* Aviso catálogo draft */}
      <div style={estilos.avisoDraft}>
        ⚠️ Todos os {totalDraft} protocolos disponíveis estão em status <strong>DRAFT</strong> —
        nenhum foi aprovado formalmente nesta versão. Confirmar doses contra o PDF fonte antes de usar.
      </div>

      {/* Barra de ferramentas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {/* Toggle visualização */}
        <div style={estilos.toggleGroup}>
          {[['busca', '🔍 Busca'], ['grupos', '📂 Por tumor']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setModoVisualizacao(v)}
              style={{
                ...estilos.toggleBtn,
                background: modoVisualizacao === v ? N : 'transparent',
                color: modoVisualizacao === v ? '#fff' : '#374151',
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Filtro tumor */}
        <select
          value={tumorFiltro}
          onChange={e => setTumorFiltro(e.target.value)}
          style={{ ...estilos.selectFiltro, flex: 1 }}
        >
          <option value="">Todos os tumores</option>
          {tumores.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Busca livre */}
      {modoVisualizacao === 'busca' && (
        <div style={{ marginBottom: 12 }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome do protocolo, fármaco ou tumor (mín. 2 caracteres)..."
            autoFocus
            style={estilos.inputBusca}
          />

          {busca.length >= 2 && resultadosBusca.length === 0 && (
            <div style={estilos.semResultados}>
              Nenhum protocolo encontrado para "{busca}".
            </div>
          )}

          <div style={{ display: 'grid', gap: 6 }}>
            {resultadosBusca.map(p => (
              <ProtocoloCard key={p.id} protocolo={p} onSelecionar={onSelecionar} />
            ))}
          </div>
        </div>
      )}

      {/* Visualização por grupos */}
      {modoVisualizacao === 'grupos' && (
        <div>
          {Object.entries(grupos).map(([tumor, lista]) => (
            <GrupoTumor key={tumor} tumor={tumor} protocolos={lista} onSelecionar={onSelecionar} />
          ))}
          {Object.keys(grupos).length === 0 && (
            <div style={estilos.semResultados}>Nenhum protocolo disponível para este filtro.</div>
          )}
        </div>
      )}
    </div>
  );
}

function GrupoTumor({ tumor, protocolos, onSelecionar }) {
  const [expandido, setExpandido] = useState(false);
  const visiveis = expandido ? protocolos : protocolos.slice(0, 4);

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={estilos.grupoHeader}
        onClick={() => setExpandido(e => !e)}
      >
        <span style={{ fontWeight: 800, color: N, fontSize: 12 }}>{tumor}</span>
        <span style={{ color: '#64748B', fontSize: 11 }}>
          {protocolos.length} protocolo{protocolos.length !== 1 ? 's' : ''} {expandido ? '▲' : '▼'}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 5 }}>
        {visiveis.map(p => (
          <ProtocoloCard key={p.id} protocolo={p} onSelecionar={onSelecionar} compacto />
        ))}
      </div>
      {!expandido && protocolos.length > 4 && (
        <button onClick={() => setExpandido(true)} style={estilos.btnVerMais}>
          + Ver mais {protocolos.length - 4} protocolos
        </button>
      )}
    </div>
  );
}

function ProtocoloCard({ protocolo, onSelecionar, compacto = false }) {
  const st = labelStatus(protocolo.status);
  const farmacos = (protocolo.farmacosDetectados || []).slice(0, 5);
  const temCorrecaoFarmacos = !!protocolo.correcaoFarmacos;

  return (
    <div
      onClick={() => onSelecionar(protocolo)}
      style={{
        ...estilos.card,
        cursor: 'pointer',
        padding: compacto ? '8px 12px' : '10px 14px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          {/* Nome */}
          <div style={{ fontWeight: 800, fontSize: compacto ? 12 : 13, color: N }}>
            {protocolo.nome}
          </div>

          {/* Tumor contexto */}
          {!compacto && protocolo.tumorContexto && (
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
              {protocolo.tumorContexto}
            </div>
          )}

          {/* Periodicidade */}
          {protocolo.periodicidadeExtraida && (
            <span style={estilos.tagPeriodo}>
              {protocolo.periodicidadeExtraida}
            </span>
          )}

          {/* Farmacos */}
          {farmacos.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 5 }}>
              {farmacos.map(f => (
                <span key={f} style={estilos.tagFarmaco}>{f}</span>
              ))}
              {(protocolo.farmacosDetectados || []).length > 5 && (
                <span style={{ ...estilos.tagFarmaco, opacity: 0.6 }}>
                  +{protocolo.farmacosDetectados.length - 5}
                </span>
              )}
              {temCorrecaoFarmacos && (
                <span style={{ ...estilos.tagFarmaco, background: '#FFF7ED', color: '#92400E' }}>✏️ editado</span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {/* Badge status */}
          <span
            style={{
              background: st.cor + '22',
              color: st.cor,
              borderRadius: 6,
              padding: '2px 7px',
              fontSize: 9,
              fontWeight: 900,
              whiteSpace: 'nowrap',
            }}
          >
            {st.icone} {st.label}
          </span>

          {/* Seta */}
          <span style={{ fontSize: 16, color: '#94A3B8' }}>›</span>
        </div>
      </div>

      {/* Correções aplicadas */}
      {protocolo.correcaoAplicada && (
        <div style={{ fontSize: 9, color: '#B45309', marginTop: 4, borderTop: '1px solid #FDE68A', paddingTop: 4 }}>
          ✏️ Correção: {protocolo.correcaoAplicada}
        </div>
      )}
    </div>
  );
}

const estilos = {
  sectionHeader: {
    display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12,
    padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0',
  },
  titulo: { fontSize: 14, fontWeight: 900, color: N },
  sub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  btnVoltar: {
    background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '6px 12px',
    cursor: 'pointer', fontSize: 11, fontWeight: 700, color: N, fontFamily: 'inherit',
  },
  avisoDraft: {
    background: '#FFF7ED', border: '1px solid #D97706', borderRadius: 8,
    padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#92400E',
  },
  toggleGroup: {
    display: 'flex', background: '#F1F5F9', borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0',
  },
  toggleBtn: {
    border: 'none', padding: '7px 12px', fontSize: 11, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
  },
  selectFiltro: {
    borderRadius: 8, border: '1.5px solid #CBD5E1', padding: '7px 10px',
    fontSize: 11, fontFamily: 'inherit', background: '#fff', minWidth: 160,
  },
  inputBusca: {
    width: '100%', borderRadius: 9, border: '1.5px solid #CBD5E1',
    padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', marginBottom: 10,
  },
  semResultados: {
    textAlign: 'center', padding: '16px', color: '#94A3B8', fontSize: 12,
  },
  grupoHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '7px 10px', background: '#EFF6FF', borderRadius: 8, marginBottom: 6,
    cursor: 'pointer', border: '1px solid #BFDBFE',
  },
  card: {
    background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10,
    transition: 'all 0.15s',
  },
  tagPeriodo: {
    background: '#E0F2FE', color: '#0369A1', borderRadius: 5,
    padding: '1px 6px', fontSize: 9, fontWeight: 700, marginTop: 4, display: 'inline-block',
  },
  tagFarmaco: {
    background: '#F0FDF4', color: '#15803D', borderRadius: 5,
    padding: '1px 6px', fontSize: 9, fontWeight: 700,
  },
  btnVerMais: {
    background: 'none', border: '1px dashed #CBD5E1', borderRadius: 7,
    color: '#64748B', fontSize: 11, padding: '5px 12px', cursor: 'pointer',
    width: '100%', fontFamily: 'inherit', marginTop: 4,
  },
};
