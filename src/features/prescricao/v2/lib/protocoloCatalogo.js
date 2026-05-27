// ─────────────────────────────────────────────────────────────────────────────
// protocoloCatalogo.js
// Adapter para o catálogo QT citotóxica v0.2.
// Responsável por carregar, filtrar e indexar protocolos.
//
// NÃO conecta ao APACApp diretamente — sem integração nesta versão.
// ─────────────────────────────────────────────────────────────────────────────

export const VERSAO_CATALOGO_V02 = 'qt-protocol-catalog-revisado-v0.2';
export const VERSAO_CATALOGO_V03 = 'qt-protocol-catalog-curado-v0.3';

// Manter alias legado para compatibilidade interna
export const VERSAO_CATALOGO = VERSAO_CATALOGO_V02;

// BUG-04 fix: removido 'draft' de STATUS_PRESCRITIVEL.
// 'draft' = nunca entrou em revisão — visível com aviso mas NÃO prescritível.
// 'revisao_medica' = em revisão — prescritível com CRM obrigatório.
// 'aprovado' = aprovado formalmente — ainda não existe no catálogo v0.3.
export const STATUS_PRESCRITIVEL = ['revisao_medica', 'aprovado'];

// Visible com aviso amarelo — não filtrado da lista, mas com badge de alerta
export const STATUS_VISIVEL_COM_AVISO = ['draft'];

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
/**
 * Normaliza um protocolo do schema v0.3 para o formato interno do módulo.
 * O módulo (calculadoraDose, validacoesSeguranca, Steps) espera os campos v0.2.
 *
 * Mapeamento principal:
 *   v0.3 nomeExibicao/nomeCanonico → nome
 *   v0.3 tumores[]                 → tumorContexto (join)
 *   v0.3 farmacos[]                → farmacosDetectados[] + doseEstruturada[]
 *   v0.3 cicloDias                 → periodicidadeExtraida
 *   v0.3 cid10Sugeridos            → cids
 *   v0.3 fonteV02Ids               → fonteIds (referência)
 */
function normalizarProtocoloV3(p) {
  const farmacos = p.farmacos || [];

  return {
    ...p,
    // Nome para exibição
    nome: p.nomeExibicao || p.nomeCanonico || p.id,

    // Contexto de tumor (v0.2 usa string; v0.3 usa array)
    tumorContexto: (p.tumores || [])
      .map(t => t.replace(/_revisar$/, ' ⚠️').replace(/_/g, ' '))
      .join(', ') || 'Contexto não especificado',

    // farmacosDetectados: extraído de farmacos[].nome
    farmacosDetectados: farmacos.map(f => f.nome).filter(Boolean),

    // doseEstruturada: cada entrada precisa do campo 'farmaco' (alias de 'nome')
    // calculadoraDose.js usa farmaco.farmaco como label do fármaco
    doseEstruturada: farmacos.map(f => ({
      ...f,
      farmaco: f.farmaco || f.nome,  // garante campo 'farmaco' esperado pelo calculador
    })),

    // Periodicidade legível
    periodicidadeExtraida: p.periodicidadeExtraida
      || (p.cicloDias ? `A cada ${p.cicloDias} dias` : undefined),

    // BUG-01 fix: array vazio [] é falsy → usaria cid10Sugeridos não curados como fallback.
    // cids = [] = "nenhum CID operacional definido", não é fallback para cid10Sugeridos.
    cids: Array.isArray(p.cids) && p.cids.length > 0 ? p.cids : (p.cid10Sugeridos || []),

    // Versão do catálogo de origem
    versaoCatalogo: p.versaoCatalogo || 'v0.3',
  };
}

export function carregarCatalogo(raw) {
  const erros = [];

  if (!raw) {
    return { ok: false, protocolos: [], erros: ['Catálogo não fornecido'], versao: '' };
  }

  const sv = raw.schemaVersion || '';
  // BUG-03 fix: detecção estrita por versão — não usar 'curado' (substring genérica)
  const isV3 = sv === VERSAO_CATALOGO_V03 || sv.includes('v0.3');
  const isV2 = sv === VERSAO_CATALOGO_V02 || sv.includes('v0.2') || sv.includes('revisado');

  if (!isV2 && !isV3) {
    erros.push(`Versão do catálogo não reconhecida: "${sv}". Suportados: v0.2, v0.3`);
  }

  if (!Array.isArray(raw.protocolos)) {
    return { ok: false, protocolos: [], erros: [...erros, 'Campo protocolos[] ausente no JSON'], versao: sv };
  }

  const protocolos = raw.protocolos.map(p => {
    const base = isV3 ? normalizarProtocoloV3(p) : p;
    // BUG-05 fix: status null/vazio → 'bloqueado' com erro, não 'draft' silencioso
    const statusValidos = [...STATUS_PRESCRITIVEL, ...STATUS_VISIVEL_COM_AVISO, ...STATUS_BLOQUEADO];
    let statusFinal = base.status;
    if (!statusFinal || !statusValidos.includes(statusFinal)) {
      erros.push(`Protocolo ${base.id || '?'}: status inválido "${base.status}" → bloqueado preventivamente`);
      statusFinal = 'bloqueado';
    }

    // BUG-02 fix: expor cid10Bloqueados como Set para verificação rápida em runtime
    const cid10BloqueadosSet = new Set(
      (base.cid10Bloqueados || []).map(b => (typeof b === 'string' ? b : b?.cid)).filter(Boolean)
    );

    return {
      ...base,
      status:          statusFinal,
      revisar:         base.revisar !== false,
      versaoCatalogo:  base.versaoCatalogo || (isV3 ? 'v0.3' : 'v0.2'),
      cid10BloqueadosSet,  // Set<string> — use em validações de CID do paciente
    };
  });

  return {
    ok: erros.length === 0,
    protocolos,
    erros,
    versao: sv,
    schemaV3: isV3,
    geradoEm: raw.geradoEm || raw.generatedAt,
    revisadoEm: raw.revisadoEm || raw.lastSafetyAuditAt,
    totalOriginal: raw.estatisticasV02?.totalProtocolos
      || raw.auditoriaSeguranca?.totalProtocolos
      || protocolos.length,
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
