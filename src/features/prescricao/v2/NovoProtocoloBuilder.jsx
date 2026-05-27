// ─────────────────────────────────────────────────────────────────────────────
// NovoProtocoloBuilder.jsx
// Ferramenta de desenvolvimento para criar novos protocolos v0.3.
//
// FLUXO:
//   1. Busca na web (PubMed, NCCN, Scholar, INCA) para coletar informações
//   2. Preenche formulário estruturado (fármacos, doses, CIDs, ciclo)
//   3. Gera JSON v0.3 compatível → copia para adicionar ao catálogo
//   4. Salva drafts em localStorage (até 20 entradas)
//
// SEGURANÇA:
//   - prescricaoPermitida: SEMPRE false — bloqueado no gerarJSON()
//   - status inicial: 'draft' — não prescritível
//   - Não modifica arquivo JSON do catálogo diretamente (limitação browser)
//   - Não tem validade clínica — uso de desenvolvimento apenas
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useCallback } from 'react';

// ── Constantes ────────────────────────────────────────────────────────────────
const DRAFT_KEY = 'apacapp_protocolos_draft_v3';
const MAX_DRAFTS = 20;

const FONTES_BUSCA = [
  {
    label: 'PubMed',
    ico: '🔬',
    cor: '#2563EB',
    url: q => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q + ' chemotherapy protocol')}`,
  },
  {
    label: 'NCCN',
    ico: '📋',
    cor: '#7C3AED',
    url: q => `https://www.nccn.org/search/results?q=${encodeURIComponent(q)}`,
  },
  {
    label: 'Scholar',
    ico: '🎓',
    cor: '#0891B2',
    url: q => `https://scholar.google.com/scholar?q=${encodeURIComponent(q + ' protocol chemotherapy')}`,
  },
  {
    label: 'INCA',
    ico: '🏥',
    cor: '#059669',
    url: q => `https://www.inca.gov.br/busca?busca=${encodeURIComponent(q)}`,
  },
  {
    label: 'Google',
    ico: '🌐',
    cor: '#DC2626',
    url: q => `https://www.google.com/search?q=${encodeURIComponent(q + ' protocolo quimioterapia dose')}`,
  },
  {
    label: 'ClinicalTrials',
    ico: '🧪',
    cor: '#D97706',
    url: q => `https://clinicaltrials.gov/search?term=${encodeURIComponent(q)}`,
  },
];

const UNIDADES = ['mg/m²', 'mg/kg', 'mg', 'AUC', 'UI/m²', 'UI/kg', 'UI', 'mg/m²/dia', 'mg/kg/dia', '%', 'mcg/m²', 'mcg/kg'];
const VIAS     = ['IV', 'VO', 'SC', 'IM', 'IT', 'ID', 'Inalatória'];
const DIAS_SUGESTAO = ['1', '1,8', '1,2,3', '1,3,5', '1-5', '1,15', '1,8,15', '1,2,3,4,5', 'D1'];

const FARMACO_EMPTY = {
  nome: '', doseValor: '', doseUnidade: 'mg/m²', via: 'IV',
  diasText: '1', doMax: '', doMin: '', reducaoNaoAplicavel: false, coMedicacao: false,
};

const PROTO_EMPTY = {
  id: '', nomeExibicao: '', nomeCanonico: '',
  tumoresText: '', cicloDias: '', periodicidadeExtraida: '',
  cid10SugeridosText: '', cid10BloqueadosText: '',
  linhasTratamentoText: '', fonte: '', referencia: '',
  status: 'draft', revisarInfo: '',
};

// ── Cores ─────────────────────────────────────────────────────────────────────
const C = {
  navy:   '#1B365D',
  green:  '#15803D',
  red:    '#B91C1C',
  amber:  '#B45309',
  blue:   '#1D4ED8',
  gray:   '#64748B',
  border: '#E2E8F0',
  bg:     '#F8FAFC',
  white:  '#FFFFFF',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDias(str) {
  if (!str || !str.trim()) return [1];
  return str
    .replace(/-/g, ',')
    .split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => Number.isFinite(n) && n >= 1);
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]'); }
  catch { return []; }
}

function saveDrafts(list) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(list.slice(0, MAX_DRAFTS))); }
  catch { /* quota exceeded — silencioso */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function NovoProtocoloBuilder() {
  const [aba, setAba]           = useState('form');      // 'form' | 'drafts'
  const [busca, setBusca]       = useState('');
  const [proto, setProto]       = useState(PROTO_EMPTY);
  const [farmacos, setFarmacos] = useState([{ ...FARMACO_EMPTY }]);
  const [preview, setPreview]   = useState(false);
  const [copiado, setCopiado]   = useState(false);
  const [drafts, setDrafts]     = useState(loadDrafts);
  const [draftSalvo, setDraftSalvo] = useState('');

  const up = useCallback((k, v) => setProto(p => ({ ...p, [k]: v })), []);

  // ── Fármacos ───────────────────────────────────────────────────────────────
  const addFarmaco    = () => setFarmacos(fs => [...fs, { ...FARMACO_EMPTY }]);
  const removeFarmaco = i  => setFarmacos(fs => fs.filter((_, idx) => idx !== i));
  const upFarmaco     = (i, k, v) =>
    setFarmacos(fs => fs.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)));

  // ── Gerar JSON v0.3 ────────────────────────────────────────────────────────
  const gerarJSON = useCallback(() => {
    const id = proto.id ||
      slugify(proto.nomeExibicao || proto.nomeCanonico || '') ||
      `proto-${Date.now()}`;

    return {
      id,
      schemaVersion: 'qt-protocol-catalog-curado-v0.3',
      nomeExibicao:  proto.nomeExibicao  || proto.nomeCanonico || id,
      nomeCanonico:  proto.nomeCanonico  || proto.nomeExibicao || id,
      tumores: proto.tumoresText
        ? proto.tumoresText.split(',').map(t => slugify(t.trim())).filter(Boolean)
        : [],
      farmacos: farmacos.map(f => ({
        nome:         f.nome,
        farmaco:      f.nome,
        ...(f.doseValor !== '' ? { doseValor: Number(f.doseValor) } : {}),
        doseUnidade:  f.doseUnidade,
        via:          f.via,
        diasAdm:      parseDias(f.diasText),
        ...(f.doMax ? { doseMaxima: Number(f.doMax) } : {}),
        ...(f.doMin ? { doseMinima: Number(f.doMin) } : {}),
        ...(f.reducaoNaoAplicavel ? { reducaoNaoAplicavel: true } : {}),
        ...(f.coMedicacao        ? { coMedicacao: true }          : {}),
      })),
      ...(proto.cicloDias ? { cicloDias: Number(proto.cicloDias) } : {}),
      periodicidadeExtraida: proto.periodicidadeExtraida ||
        (proto.cicloDias ? `A cada ${proto.cicloDias} dias` : undefined),
      cid10Sugeridos: proto.cid10SugeridosText
        ? proto.cid10SugeridosText.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
        : [],
      cid10Bloqueados: proto.cid10BloqueadosText
        ? proto.cid10BloqueadosText.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
        : [],
      linhasTratamento: proto.linhasTratamentoText
        ? proto.linhasTratamentoText.split(',').map(l => l.trim()).filter(Boolean)
        : [],
      fonte:     proto.fonte      || 'manual',
      referencia: proto.referencia || '',
      status:    proto.status     || 'draft',
      prescricaoPermitida: false,  // IMUTÁVEL — só revisão médica formal pode mudar
      ...(proto.revisarInfo ? { revisarInfo: proto.revisarInfo } : {}),
      geradoEm: new Date().toISOString(),
    };
  }, [proto, farmacos]);

  const jsonStr = useMemo(() => JSON.stringify(gerarJSON(), null, 2), [gerarJSON]);

  // ── Ações ──────────────────────────────────────────────────────────────────
  const copiarJSON = () => {
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const salvarDraft = () => {
    const entry = { ...gerarJSON(), _savedAt: new Date().toISOString() };
    const novos  = [entry, ...drafts.filter(d => d.id !== entry.id)];
    setDrafts(novos);
    saveDrafts(novos);
    setDraftSalvo(entry.nomeExibicao || entry.id);
    setTimeout(() => setDraftSalvo(''), 3000);
  };

  const carregarDraft = (draft) => {
    setProto({
      id:                   draft.id              || '',
      nomeExibicao:         draft.nomeExibicao    || '',
      nomeCanonico:         draft.nomeCanonico     || '',
      tumoresText:          (draft.tumores         || []).join(', '),
      cicloDias:            draft.cicloDias != null ? String(draft.cicloDias) : '',
      periodicidadeExtraida: draft.periodicidadeExtraida || '',
      cid10SugeridosText:   (draft.cid10Sugeridos  || []).join(', '),
      cid10BloqueadosText:  (draft.cid10Bloqueados || []).join(', '),
      linhasTratamentoText: (draft.linhasTratamento || []).join(', '),
      fonte:                draft.fonte            || '',
      referencia:           draft.referencia       || '',
      status:               draft.status           || 'draft',
      revisarInfo:          draft.revisarInfo      || '',
    });
    setFarmacos(
      draft.farmacos?.length
        ? draft.farmacos.map(f => ({
            nome:               f.nome             || '',
            doseValor:          f.doseValor != null ? String(f.doseValor) : '',
            doseUnidade:        f.doseUnidade       || 'mg/m²',
            via:                f.via               || 'IV',
            diasText:           (f.diasAdm          || [1]).join(', '),
            doMax:              f.doseMaxima != null ? String(f.doseMaxima) : '',
            doMin:              f.doseMinima != null ? String(f.doseMinima) : '',
            reducaoNaoAplicavel: !!f.reducaoNaoAplicavel,
            coMedicacao:        !!f.coMedicacao,
          }))
        : [{ ...FARMACO_EMPTY }]
    );
    setAba('form');
  };

  const excluirDraft = (id) => {
    const novos = drafts.filter(d => d.id !== id);
    setDrafts(novos);
    saveDrafts(novos);
  };

  const limparFormulario = () => {
    if (!window.confirm('Limpar formulário?')) return;
    setProto(PROTO_EMPTY);
    setFarmacos([{ ...FARMACO_EMPTY }]);
    setPreview(false);
  };

  const abrirBusca = (fonteFn) => {
    const termo = busca.trim();
    if (!termo) { alert('Digite um termo de busca primeiro.'); return; }
    window.open(fonteFn(termo), '_blank', 'noopener,noreferrer');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>

      {/* ── Banner dev ── */}
      <div style={s.bannerDev}>
        <span style={{ fontSize: 16 }}>🔧</span>
        <div>
          <strong>Ferramenta de desenvolvimento</strong> — gera entrada JSON para o catálogo v0.3.
          Protocolo sempre nasce como <code>prescricaoPermitida: false</code> e <code>status: draft</code>.
          Revisão médica formal é obrigatória antes de qualquer uso clínico.
        </div>
      </div>

      {/* ── Abas ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          { id: 'form',   label: '📝 Formulário' },
          { id: 'drafts', label: `💾 Drafts salvos (${drafts.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            style={{
              ...s.abaBtn,
              background:   aba === t.id ? C.navy  : C.bg,
              color:        aba === t.id ? '#fff'  : C.gray,
              borderColor:  aba === t.id ? C.navy  : C.border,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ABA: FORMULÁRIO                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {aba === 'form' && (
        <>
          {/* ── Busca web ── */}
          <div style={s.card}>
            <div style={s.cardTitle}>🔍 Busca Web</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && abrirBusca(FONTES_BUSCA[0].url)}
                placeholder="Ex: FOLFOX coloretal, Carboplatina AUC ovário, AC mama..."
                style={{ ...s.input, flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {FONTES_BUSCA.map(f => (
                <button
                  key={f.label}
                  onClick={() => abrirBusca(f.url)}
                  style={{
                    ...s.btnFonte,
                    borderColor: f.cor,
                    color:       f.cor,
                  }}
                >
                  {f.ico} {f.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: C.gray }}>
              Abre em nova aba · cole as informações encontradas nos campos abaixo
            </div>
          </div>

          {/* ── Identificação ── */}
          <div style={s.card}>
            <div style={s.cardTitle}>📌 Identificação</div>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Nome de exibição *</label>
                <input value={proto.nomeExibicao} onChange={e => up('nomeExibicao', e.target.value)}
                  placeholder="Ex: mFOLFOX6, CAPOX, AC mama" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Nome canônico</label>
                <input value={proto.nomeCanonico} onChange={e => up('nomeCanonico', e.target.value)}
                  placeholder="Ex: folfox6-modificado" style={s.input} />
              </div>
            </div>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>ID (slug único)</label>
                <input value={proto.id} onChange={e => up('id', e.target.value)}
                  placeholder={proto.nomeExibicao ? slugify(proto.nomeExibicao) : 'auto-gerado'}
                  style={s.input} />
              </div>
              <div>
                <label style={s.label}>Status inicial</label>
                <select value={proto.status} onChange={e => up('status', e.target.value)} style={s.input}>
                  <option value="draft">draft — visível com aviso, não prescritível</option>
                  <option value="revisao_medica">revisao_medica — requer CRM</option>
                  <option value="bloqueado">bloqueado — oculto da lista</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Contexto clínico ── */}
          <div style={s.card}>
            <div style={s.cardTitle}>🎯 Contexto Clínico</div>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Tumores (vírgula)</label>
                <input value={proto.tumoresText}
                  onChange={e => up('tumoresText', e.target.value)}
                  placeholder="coloretal, mama, pulmao" style={s.input} />
                <div style={s.hint}>Espaços → underline automático</div>
              </div>
              <div>
                <label style={s.label}>Linhas de tratamento</label>
                <input value={proto.linhasTratamentoText}
                  onChange={e => up('linhasTratamentoText', e.target.value)}
                  placeholder="1a linha, adjuvante, neoadjuvante" style={s.input} />
              </div>
            </div>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>CID-10 sugeridos (vírgula)</label>
                <input value={proto.cid10SugeridosText}
                  onChange={e => up('cid10SugeridosText', e.target.value)}
                  placeholder="C18, C19, C20" style={s.input} />
              </div>
              <div>
                <label style={s.label}>CID-10 bloqueados (vírgula)</label>
                <input value={proto.cid10BloqueadosText}
                  onChange={e => up('cid10BloqueadosText', e.target.value)}
                  placeholder="C56, C73 (contraindicado)" style={{ ...s.input, borderColor: '#FCA5A5' }} />
              </div>
            </div>
          </div>

          {/* ── Ciclo ── */}
          <div style={s.card}>
            <div style={s.cardTitle}>🔄 Ciclo e Periodicidade</div>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Duração do ciclo (dias)</label>
                <input value={proto.cicloDias} type="number" min="1" max="365"
                  onChange={e => up('cicloDias', e.target.value)}
                  placeholder="Ex: 14, 21, 28" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Descrição de periodicidade</label>
                <input value={proto.periodicidadeExtraida}
                  onChange={e => up('periodicidadeExtraida', e.target.value)}
                  placeholder={proto.cicloDias ? `A cada ${proto.cicloDias} dias` : 'Ex: A cada 21 dias'}
                  style={s.input} />
              </div>
            </div>
          </div>

          {/* ── Fármacos ── */}
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={s.cardTitle}>💊 Fármacos</div>
              <button onClick={addFarmaco} style={s.btnAdd}>+ Adicionar fármaco</button>
            </div>

            {farmacos.map((f, i) => (
              <div key={i} style={s.farmacoCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 11, color: C.navy }}>Fármaco {i + 1}</span>
                  {farmacos.length > 1 && (
                    <button onClick={() => removeFarmaco(i)} style={s.btnRemove}>✕ remover</button>
                  )}
                </div>

                {/* Linha 1: nome + dose + unidade */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <div>
                    <label style={s.label}>Nome *</label>
                    <input value={f.nome} onChange={e => upFarmaco(i, 'nome', e.target.value)}
                      placeholder="Ex: oxaliplatina, fluoruracil" style={s.input} />
                  </div>
                  <div>
                    <label style={s.label}>Dose</label>
                    <input value={f.doseValor} type="number" step="any" min="0"
                      onChange={e => upFarmaco(i, 'doseValor', e.target.value)}
                      placeholder="Ex: 85" style={s.input} />
                  </div>
                  <div>
                    <label style={s.label}>Unidade</label>
                    <select value={f.doseUnidade} onChange={e => upFarmaco(i, 'doseUnidade', e.target.value)} style={s.input}>
                      {UNIDADES.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {/* Linha 2: via + dias + dose max/min */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <div>
                    <label style={s.label}>Via</label>
                    <select value={f.via} onChange={e => upFarmaco(i, 'via', e.target.value)} style={s.input}>
                      {VIAS.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Dias de adm (vírgula)</label>
                    <input value={f.diasText} onChange={e => upFarmaco(i, 'diasText', e.target.value)}
                      placeholder="1 ou 1,8 ou 1,2,3" style={s.input} />
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                      {DIAS_SUGESTAO.map(d => (
                        <button key={d} onClick={() => upFarmaco(i, 'diasText', d)}
                          style={{ ...s.chipDia, background: f.diasText === d ? C.navy : C.bg, color: f.diasText === d ? '#fff' : C.gray }}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={s.label}>Dose máx (mg)</label>
                    <input value={f.doMax} type="number" min="0"
                      onChange={e => upFarmaco(i, 'doMax', e.target.value)}
                      placeholder="Ex: 800" style={s.input} />
                  </div>
                  <div>
                    <label style={s.label}>Dose mín (mg)</label>
                    <input value={f.doMin} type="number" min="0"
                      onChange={e => upFarmaco(i, 'doMin', e.target.value)}
                      placeholder="Ex: 100" style={s.input} />
                  </div>
                </div>

                {/* Flags */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={s.checkLabel}>
                    <input type="checkbox" checked={f.reducaoNaoAplicavel}
                      onChange={e => upFarmaco(i, 'reducaoNaoAplicavel', e.target.checked)} />
                    {' '}Dose fixa (não reduzir)
                  </label>
                  <label style={s.checkLabel}>
                    <input type="checkbox" checked={f.coMedicacao}
                      onChange={e => upFarmaco(i, 'coMedicacao', e.target.checked)} />
                    {' '}Co-medicação (prednisona, etc.)
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* ── Metadados ── */}
          <div style={s.card}>
            <div style={s.cardTitle}>📚 Metadados e Fonte</div>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Fonte</label>
                <input value={proto.fonte} onChange={e => up('fonte', e.target.value)}
                  placeholder="Ex: NEJM 2004, NCCN v2.2024, INCA 2022" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Referência completa / DOI / URL</label>
                <input value={proto.referencia} onChange={e => up('referencia', e.target.value)}
                  placeholder="https://doi.org/..." style={s.input} />
              </div>
            </div>
            <div>
              <label style={s.label}>Notas de revisão / avisos</label>
              <textarea value={proto.revisarInfo} onChange={e => up('revisarInfo', e.target.value)}
                rows={2} placeholder="Ex: confirmar dose de leucovorina, verificar tempo de infusão..."
                style={{ ...s.input, resize: 'vertical' }} />
            </div>
          </div>

          {/* ── Preview JSON ── */}
          <button onClick={() => setPreview(v => !v)} style={s.btnPreview}>
            {preview ? '▲ Ocultar JSON' : '▼ Pré-visualizar JSON v0.3'}
          </button>

          {preview && (
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 11, color: C.navy }}>JSON gerado — catálogo v0.3</div>
                <button onClick={copiarJSON} style={{ ...s.btnAcao, background: copiado ? C.green : C.blue, color: '#fff' }}>
                  {copiado ? '✅ Copiado!' : '📋 Copiar JSON'}
                </button>
              </div>
              <pre style={s.pre}>{jsonStr}</pre>
              <div style={{ marginTop: 8, fontSize: 10, color: C.amber }}>
                ⚠️ Cole este objeto no array <code>protocolos[]</code> do arquivo{' '}
                <code>src/data/protocolos_qt_catalogo_v0.3_curado_preliminar.json</code> e reconstrua o bundle.
              </div>
            </div>
          )}

          {/* ── Ações ── */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <button onClick={salvarDraft} style={{ ...s.btnAcao, background: C.navy, color: '#fff', flex: 1 }}>
              💾 Salvar draft localmente
            </button>
            <button onClick={copiarJSON} style={{ ...s.btnAcao, background: C.blue, color: '#fff', flex: 1 }}>
              {copiado ? '✅ Copiado!' : '📋 Copiar JSON'}
            </button>
            <button onClick={limparFormulario} style={{ ...s.btnAcao, background: C.bg, color: C.red, border: `1px solid ${C.red}`, flex: 1 }}>
              🗑 Limpar
            </button>
          </div>

          {draftSalvo && (
            <div style={{ marginTop: 8, background: '#F0FDF4', border: `1px solid ${C.green}`, borderRadius: 8, padding: '8px 12px', fontSize: 11, color: C.green, fontWeight: 700 }}>
              ✅ Draft "{draftSalvo}" salvo. Veja na aba "Drafts salvos".
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ABA: DRAFTS                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {aba === 'drafts' && (
        <div>
          {drafts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.gray }}>
              Nenhum draft salvo ainda.<br />
              <button onClick={() => setAba('form')} style={{ ...s.btnAcao, marginTop: 12, background: C.navy, color: '#fff' }}>
                ← Ir para o formulário
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 10 }}>
                {drafts.length} draft(s) · armazenados em localStorage · máx {MAX_DRAFTS}
              </div>
              {drafts.map((d, i) => (
                <div key={d.id + i} style={{ ...s.card, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 13, color: C.navy }}>{d.nomeExibicao || d.id}</div>
                      <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>
                        {(d.tumores || []).join(', ') || '—'} · {d.farmacos?.length || 0} fármaco(s)
                        {' · '}CIDs: {(d.cid10Sugeridos || []).join(', ') || '—'}
                      </div>
                      <div style={{ fontSize: 10, color: C.gray }}>
                        Status: <strong>{d.status}</strong>
                        {d._savedAt && ` · Salvo: ${new Date(d._savedAt).toLocaleString('pt-BR')}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => carregarDraft(d)}
                        style={{ ...s.btnAcao, fontSize: 10, background: C.navy, color: '#fff', padding: '4px 10px' }}>
                        ✏️ Editar
                      </button>
                      <button onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(d, null, 2));
                      }} style={{ ...s.btnAcao, fontSize: 10, background: C.blue, color: '#fff', padding: '4px 10px' }}>
                        📋 Copiar
                      </button>
                      <button onClick={() => {
                        if (window.confirm(`Excluir draft "${d.nomeExibicao || d.id}"?`)) excluirDraft(d.id);
                      }} style={{ ...s.btnAcao, fontSize: 10, background: '#FEF2F2', color: C.red, border: `1px solid ${C.red}`, padding: '4px 10px' }}>
                        🗑
                      </button>
                    </div>
                  </div>

                  {/* Preview inline dos fármacos */}
                  {d.farmacos?.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {d.farmacos.map((f, j) => (
                        <span key={j} style={s.tagFarmaco}>
                          {f.nome} {f.doseValor != null ? f.doseValor : '?'} {f.doseUnidade} {f.via}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button onClick={() => {
                if (window.confirm('Apagar TODOS os drafts?')) {
                  setDrafts([]);
                  saveDrafts([]);
                }
              }} style={{ ...s.btnAcao, background: '#FEF2F2', color: C.red, border: `1px solid ${C.red}`, marginTop: 4 }}>
                🗑 Apagar todos os drafts
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Footer dev ── */}
      <div style={{ marginTop: 16, padding: '8px 0', borderTop: `1px dashed ${C.border}`, fontSize: 9, color: C.gray, textAlign: 'center' }}>
        Ferramenta de desenvolvimento · protocolos gerados requerem revisão médica formal antes de qualquer uso clínico
        · prescricaoPermitida: false imutável até aprovação
      </div>
    </div>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = {
  bannerDev: {
    background: '#FFFBEB', border: '1.5px dashed #D97706', borderRadius: 10,
    padding: '8px 12px', marginBottom: 14, fontSize: 11, color: '#92400E',
    display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.5,
  },
  card: {
    background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 10,
    padding: '12px 14px', marginBottom: 10,
  },
  farmacoCard: {
    background: '#F8FAFC', border: `1.5px solid ${C.border}`, borderRadius: 8,
    padding: '10px 12px', marginBottom: 8,
  },
  cardTitle: { fontWeight: 900, fontSize: 12, color: C.navy, marginBottom: 10 },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: C.navy, textTransform: 'uppercase', marginBottom: 3 },
  hint: { fontSize: 9, color: C.gray, marginTop: 2 },
  input: {
    width: '100%', padding: '7px 9px', border: `1.5px solid ${C.border}`, borderRadius: 7,
    fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
    outline: 'none',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.navy, cursor: 'pointer' },
  abaBtn: {
    padding: '7px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer',
    fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
  },
  btnFonte: {
    padding: '5px 10px', borderRadius: 7, border: '1.5px solid', cursor: 'pointer',
    fontSize: 11, fontWeight: 700, fontFamily: 'inherit', background: '#fff',
    transition: 'opacity 0.15s',
  },
  btnAdd: {
    background: '#EFF6FF', color: C.blue, border: `1.5px solid ${C.blue}`,
    borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnRemove: {
    background: '#FEF2F2', color: C.red, border: 'none', borderRadius: 6,
    padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnPreview: {
    width: '100%', background: 'none', border: `1px dashed ${C.border}`, borderRadius: 7,
    color: C.gray, fontSize: 11, padding: '6px 12px', cursor: 'pointer',
    fontFamily: 'inherit', marginBottom: 6,
  },
  btnAcao: {
    padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 800, fontFamily: 'inherit',
  },
  pre: {
    background: '#0F172A', color: '#E2E8F0', borderRadius: 8, padding: 12,
    fontSize: 10, overflowX: 'auto', margin: 0, maxHeight: 400,
    fontFamily: 'monospace', lineHeight: 1.5,
  },
  chipDia: {
    padding: '1px 5px', borderRadius: 4, border: `1px solid ${C.border}`,
    fontSize: 9, cursor: 'pointer', fontFamily: 'inherit',
  },
  tagFarmaco: {
    background: '#EFF6FF', color: C.blue, borderRadius: 5,
    padding: '2px 7px', fontSize: 9, fontWeight: 700,
  },
};
