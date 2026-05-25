const DEGRADED_THRESHOLDS = {
  prontuario_preliminar: {
    minRequired: ["diagnostico_ou_suspeita", "historia_ou_laudo"],
    blockIfMissing: []
  },
  apac_rascunho: {
    minRequired: ["identificacao", "cid10", "histologia_ou_diagnostico", "linha_terapeutica", "protocolo_pretendido"],
    blockIfMissing: []
  },
  apac_conferencia: {
    minRequired: ["cpf_ou_cns", "cid10_completo", "morfologia", "tnm_ou_estadio", "linha_terapeutica", "protocolo_pretendido", "sigtap", "justificativa_80"],
    blockIfMissing: ["cpf_ou_cns", "cid10_completo", "sigtap", "linha_terapeutica"]
  },
  prescricao_rascunho: {
    minRequired: ["protocolo_pretendido", "ecog", "peso", "altura", "hemograma", "creatinina", "alergias"],
    blockIfMissing: ["peso", "altura", "hemograma", "creatinina"]
  },
  prescricao_validacao: {
    minRequired: ["protocolo_pretendido", "ecog", "peso", "altura", "superficie_corporal", "hemograma", "creatinina", "funcao_hepatica", "alergias", "ciclo", "ajustes_previos"],
    blockIfMissing: ["peso", "altura", "superficie_corporal", "hemograma", "creatinina", "funcao_hepatica", "ciclo"]
  }
};

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function textFromPayload(payload = {}) {
  return normalizeText([
    payload.caso, payload.idade, payload.ecog, payload.tumor, payload.estadio,
    payload.cid10, payload.histologia, payload.morfologia, payload.linhaTerapeutica,
    payload.protocoloPretendido, payload.sigtap, payload.justificativa,
    payload.peso, payload.altura, payload.hemograma, payload.creatinina,
    payload.funcaoHepatica, payload.alergias, payload.ciclo
  ].filter(Boolean).join(" "));
}

function hasPayloadValue(value) {
  if (value === undefined || value === null) return false;
  const v = normalizeText(value).trim();
  if (!v) return false;
  return !/(^|\b)(nao informado|nao informada|nao informados|nao informadas|ausente|pendente|a definir|nao disponivel|indisponivel|nao consta|sem informacao)(\b|$)/.test(v);
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function escaped(term) {
  return normalizeText(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termMarkedAbsent(text, terms) {
  const absenceBefore = "(?:sem|ausente|ausentes|nao\\s+informad[oa]s?|nao\\s+disponivel|indisponivel|nao\\s+consta|nao\\s+descrit[oa]s?|pendente|a\\s+definir|faltante|faltam?)";
  const absenceAfter = "(?:ausente|ausentes|nao\\s+informad[oa]s?|nao\\s+disponivel|indisponivel|nao\\s+consta|nao\\s+descrit[oa]s?|pendente|a\\s+definir|faltante|faltam?)";

  return terms.some((term) => {
    const t = escaped(term);
    const before = new RegExp(`${absenceBefore}.{0,40}\\b${t}\\b`, "i");
    const after = new RegExp(`\\b${t}\\b.{0,30}${absenceAfter}`, "i");
    return before.test(text) || after.test(text);
  });
}

function hasField({ text, payloadValue, terms = [], absenceTerms = terms }) {
  if (hasPayloadValue(payloadValue)) return true;
  if (!terms.length) return false;
  if (termMarkedAbsent(text, absenceTerms)) return false;
  return hasAny(text, terms);
}

export function inferPresence(payload = {}) {
  const text = textFromPayload(payload);

  return {
    identificacao: Boolean(
      hasPayloadValue(payload.nome) ||
      hasPayloadValue(payload.identificacao) ||
      hasField({ text, terms: ["paciente"], absenceTerms: ["identificacao", "nome", "paciente"] })
    ),

    cpf_ou_cns: Boolean(
      hasPayloadValue(payload.cpf) ||
      hasPayloadValue(payload.cns) ||
      hasField({ text, terms: ["cpf", "cns", "cartao sus", "cartao do sus"], absenceTerms: ["cpf", "cns", "cartao sus", "cartao do sus"] })
    ),

    diagnostico_ou_suspeita: Boolean(
      hasPayloadValue(payload.tumor) ||
      hasPayloadValue(payload.cid10) ||
      hasPayloadValue(payload.diagnostico) ||
      hasAny(text, ["cancer", "carcinoma", "adenocarcinoma", "neoplasia", "linfoma", "sarcoma"])
    ),

    historia_ou_laudo: Boolean(payload.caso && String(payload.caso).trim().length > 30),

    cid10: Boolean(
      hasPayloadValue(payload.cid10) ||
      /\bc\d{2}\b/i.test(text) ||
      /\bc\d{2}\.\d\b/i.test(text)
    ),

    cid10_completo: Boolean(
      /^C\d{2}\.\d/i.test(String(payload.cid10 || "")) ||
      /\bc\d{2}\.\d\b/i.test(text)
    ),

    histologia_ou_diagnostico: Boolean(
      hasPayloadValue(payload.histologia) ||
      hasAny(text, ["adenocarcinoma", "carcinoma", "sarcoma", "linfoma", "melanoma"])
    ),

    morfologia: Boolean(
      hasField({ text, payloadValue: payload.morfologia, terms: ["cid-o", "cid o", "morfologia", "morfologia cid-o"], absenceTerms: ["cid-o", "cid o", "morfologia"] })
    ),

    tnm_ou_estadio: Boolean(
      hasPayloadValue(payload.tnm) ||
      hasPayloadValue(payload.estadio) ||
      hasField({ text, terms: ["estadio", "estadiamento", "tnm"], absenceTerms: ["estadio", "estadiamento", "tnm"] })
    ),

    linha_terapeutica: Boolean(
      hasPayloadValue(payload.linhaTerapeutica) ||
      hasField({ text, terms: ["1a linha", "1 linha", "primeira linha", "2a linha", "2 linha", "segunda linha", "adjuvante", "neoadjuvante", "metastatico 1l", "1l"], absenceTerms: ["linha terapeutica", "linha", "contexto"] })
    ),

    protocolo_pretendido: Boolean(
      hasPayloadValue(payload.protocoloPretendido) ||
      hasField({ text, terms: ["protocolo", "folfox", "folfiri", "carboplatina", "cisplatina", "pembrolizumabe", "trastuzumabe", "osimertinibe", "docetaxel", "paclitaxel", "capecitabina"], absenceTerms: ["protocolo", "tratamento", "quimioterapia"] })
    ),

    biomarcadores: Boolean(
      hasPayloadValue(payload.biomarcadores) ||
      hasAny(text, ["egfr", "alk", "ros1", "pd-l1", "pdl1", "her2", "msi", "dmmr", "braf", "kras", "nras", "ret", "met"])
    ),

    sigtap: Boolean(
      hasPayloadValue(payload.sigtap) ||
      (!termMarkedAbsent(text, ["sigtap", "codigo sigtap"]) && /\d{2}\.\d{2}\.\d{2}\.\d{3}-\d/.test(text))
    ),

    justificativa_80: Boolean(hasPayloadValue(payload.justificativa) && String(payload.justificativa).length >= 80),

    ecog: Boolean(
      hasPayloadValue(payload.ecog) ||
      hasField({ text, terms: ["ecog", "performance status", "ps"], absenceTerms: ["ecog", "performance status", "ps"] })
    ),

    peso: Boolean(
      hasField({ text, payloadValue: payload.peso, terms: ["peso"], absenceTerms: ["peso"] })
    ),

    altura: Boolean(
      hasField({ text, payloadValue: payload.altura, terms: ["altura"], absenceTerms: ["altura"] })
    ),

    superficie_corporal: Boolean(
      hasPayloadValue(payload.superficieCorporal) ||
      hasField({ text, terms: ["superficie corporal", "sc "], absenceTerms: ["superficie corporal", "sc"] })
    ),

    hemograma: Boolean(
      hasPayloadValue(payload.hemograma) ||
      hasField({ text, terms: ["hemograma", "hemoglobina", "neutrofilos", "plaquetas"], absenceTerms: ["hemograma", "hemoglobina", "neutrofilos", "plaquetas"] })
    ),

    creatinina: Boolean(
      hasPayloadValue(payload.creatinina) ||
      hasField({ text, terms: ["creatinina", "clearance"], absenceTerms: ["creatinina", "clearance"] })
    ),

    funcao_hepatica: Boolean(
      hasPayloadValue(payload.funcaoHepatica) ||
      hasField({ text, terms: ["funcao hepatica", "tgo", "tgp", "bilirrubina"], absenceTerms: ["funcao hepatica", "tgo", "tgp", "bilirrubina"] })
    ),

    alergias: Boolean(
      hasField({ text, payloadValue: payload.alergias, terms: ["alergia", "alergias"], absenceTerms: ["alergia", "alergias"] })
    ),

    ciclo: Boolean(
      hasField({ text, payloadValue: payload.ciclo, terms: ["ciclo"], absenceTerms: ["ciclo"] })
    ),

    ajustes_previos: Boolean(
      hasPayloadValue(payload.ajustesPrevios) ||
      hasAny(text, ["reducao de dose", "ajuste de dose", "dose reduzida"])
    )
  };
}

export function evaluateDegradedMode(payload = {}) {
  const presence = inferPresence(payload);
  const outputs = {};

  for (const [level, rules] of Object.entries(DEGRADED_THRESHOLDS)) {
    const missing = rules.minRequired.filter((field) => !presence[field]);
    const blocking = rules.blockIfMissing.filter((field) => !presence[field]);
    outputs[level] = {
      allowed: missing.length === 0 && blocking.length === 0,
      missing,
      blocking,
      status: blocking.length ? "bloqueado" : missing.length ? "degradado" : "liberado"
    };
  }

  return { presence, outputs };
}
