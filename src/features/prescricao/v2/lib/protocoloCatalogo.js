// ─────────────────────────────────────────────────────────────────────────────
// protocoloCatalogo.js
// Adapter para o catálogo QT citotóxica v0.2.
// Responsável por carregar, filtrar e indexar protocolos.
//
// NÃO conecta ao APACApp diretamente — sem integração nesta versão.
// ─────────────────────────────────────────────────────────────────────────────

export const VERSAO_CATALOGO = 'qt-protocol-catalog-revisado-v0.2';

// Status prescritíveis (nunca 'aprovado' no v0.2 — ainda não existe)
export const STATUS_PRESCRITIVEL = ['draft', 'revisao_medica'];
export const STATUS_BLOQUEADO = ['bloqueado', 'quarentena_fragmento_pdf', 'excluido_nao_qt_pura'];

/**
 * Carrega e valida o catálogo a partir de um JSON importado.
 * O JSON deve ser importado pelo componente pai e passado como argumento.
 *
 * Uso:
 *   import catalogoRaw from '../../../../data/protocolos_qt_catalogo_v02.json'
 *   const catalogo = carregarCatalogo(catalogoRaw)
 *
 * @param {Object} raw - conteúdo do JSON v0.2
 * @returns {{ ok: boolean, protocolos: Object[], erros: string[], versao: string }}
 */
export function carregarCatalogo(raw) {
  const erros = [];

  if (!raw) {
    return { ok: false, protocolos: [], erros: ['Catálogo não fornecido'], versao: '' };
  }

  if (!raw.schemaVersion?.includes('v0.2') && !raw.schemaVersion?.includes('revisado')) {
    erros.push(`Versão do catálogo não reconhecida: "${raw.schemaVersion}". Esperado: "${VERSAO_CATALOGO}"`);
  }

  if (!Array.isArray(raw.protocolos)) {
    return { ok: false, protocolos: [], erros: [...erros, 'Campo protocolos[] ausente no JSON'], versao: raw.schemaVersion };
  }

  const protocolos = raw.protocolos.map(p => ({
    ...p,
    // Garantir campos mínimos
    status:   p.status   || 'draft',
    revisar:  p.revisar  !== false,
    versaoCatalogo: p.versaoCatalogo || 'v0.2',
  }));

  return {
    ok: erros.length === 0,
    protocolos,
    erros,
    versao: raw.schemaVersion,
    geradoEm: raw.geradoEm,
    revisadoEm: raw.revisadoEm,
    totalOriginal: raw.estatisticasV02?.totalProtocolos || protocolos.length,
  };
}

/**
 * Filtra protocolos para exibição na tela de seleção.
 * Remove bloqueados/quarentena/excluídos da lista de seleção.
 * AINDA exibe com aviso os que estão em draft.
 *
 * @param {Object[]} protocolos
 * @returns {Object[]}
 */
export function filtrarProtocolosPrescritiveis(protocolos) {
  return protocolos.filter(p => !STATUS_BLOQUEADO.includes(p.status));
}

/**
 * Busca protocolos por nome, fármaco ou tumor.
 *
 * @param {Object[]} protocolos
 * @param {string} termo
 * @returns {Object[]}
 */
export function buscarProtocolos(protocolos, termo) {
  if (!termo || termo.trim().length < 2) return [];
  const t = termo.toLowerCase().trim();

  return protocolos.filter(p => {
    const nome = (p.nome || '').toLowerCase();
    const tumor = (p.tumorContexto || '').toLowerCase();
    const farmacos = (p.farmacosDetectados || []).join(' ').toLowerCase();
    return nome.includes(t) || tumor.includes(t) || farmacos.includes(t);
  });
}

/**
 * Agrupa protocolos por tumorContexto para exibição em lista.
 *
 * @param {Object[]} protocolos
 * @returns {Object} { [tumorLabel]: Object[] }
 */
export function agruparPorTumor(protocolos) {
  return protocolos.reduce((acc, p) => {
    const tumor = p.tumorContexto || 'Contexto não especificado';
    if (!acc[tumor]) acc[tumor] = [];
    acc[tumor].push(p);
    return acc;
  }, {});
}

/**
 * Retorna label de status para exibição na UI.
 *
 * @param {string} status
 * @returns {{ label: string, cor: string, icone: string }}
 */
export function labelStatus(status) {
  const MAP = {
    draft:                   { label: 'DRAFT',        cor: '#B45309', icone: '⚠️' },
    revisao_medica:          { label: 'EM REVISÃO',   cor: '#1D4ED8', icone: '🔍' },
    aprovado:                { label: 'APROVADO',      cor: '#15803D', icone: '✅' },
    bloqueado:               { label: 'BLOQUEADO',    cor: '#B91C1C', icone: '⛔' },
    quarentena_fragmento_pdf:{ label: 'QUARENTENA',   cor: '#7C3AED', icone: '🔒' },
    excluido_nao_qt_pura:    { label: 'EXCLUÍDO',     cor: '#6B7280', icone: '🚫' },
  };
  return MAP[status] || { label: status?.toUpperCase() || '?', cor: '#6B7280', icone: '❓' };
}

/**
 * Gera hash determinístico para trilha de auditoria.
 * Identifica qual versão exata do protocolo foi usada na prescrição.
 *
 * @param {Object} protocolo
 * @param {string} dataISO
 * @returns {string}
 */
export function gerarHashProtocolo(protocolo, dataISO) {
  const str = JSON.stringify(ordenarChaves({
    id:             protocolo.id,
    nome:           protocolo.nome,
    status:         protocolo.status,
    farmacosDetectados: protocolo.farmacosDetectados,
    doseEstruturada: protocolo.doseEstruturada,
    linhasDoseExtraidas: protocolo.linhasDoseExtraidas,
    periodicidadeExtraida: protocolo.periodicidadeExtraida,
    tumorContexto: protocolo.tumorContexto,
    fonte: protocolo.fonte,
    versaoCatalogo: protocolo.versaoCatalogo,
    dataUso:        dataISO,
  }));

  // Hash djb2 simples (não criptográfico — para rastreabilidade de versão)
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

function ordenarChaves(valor) {
  if (Array.isArray(valor)) return valor.map(ordenarChaves);
  if (!valor || typeof valor !== 'object') return valor;

  return Object.keys(valor).sort().reduce((acc, chave) => {
    acc[chave] = ordenarChaves(valor[chave]);
    return acc;
  }, {});
}
