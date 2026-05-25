import { getOncoAgentDb } from "./db.js";

function parseJson(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function rowToRule(row) {
  return {
    id: row.id,
    versao: row.versao,
    status: row.status,
    categoria: row.categoria,
    prioridade: row.prioridade,
    criada_em: row.criada_em,
    atualizada_em: row.atualizada_em,
    autor: row.autor,
    caso_origem: row.caso_origem,
    correcao_original: row.correcao_original,
    regra_aprendida: row.regra_aprendida,
    aplicar_em: parseJson(row.aplicar_em_json, []),
    conflita_com: parseJson(row.conflita_com_json, []),
    fonte_base: parseJson(row.fonte_base_json, []),
    nivel_evidencia: row.nivel_evidencia,
    observacoes: row.observacoes || ""
  };
}

export function readFeedbackMemory() {
  const db = getOncoAgentDb();
  const rows = db.prepare(`
    SELECT *
    FROM oncoagent_rules
    ORDER BY created_at ASC, id ASC
  `).all();

  return {
    version: "1.6.0",
    source: "sqlite",
    updated_at: new Date().toISOString(),
    rules: rows.map(rowToRule)
  };
}

export function getActiveFeedbackRules() {
  const db = getOncoAgentDb();
  const rows = db.prepare(`
    SELECT *
    FROM oncoagent_rules
    WHERE status = 'ativa'
    ORDER BY
      CASE prioridade
        WHEN 'critica' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'media' THEN 3
        WHEN 'baixa' THEN 4
        ELSE 5
      END,
      created_at ASC
  `).all();

  return rows.map(rowToRule);
}

export function appendFeedbackRule(input) {
  if (!input?.correcao_original || !input?.regra_aprendida) {
    throw new Error("correcao_original e regra_aprendida são obrigatórios.");
  }

  const db = getOncoAgentDb();
  const nowDate = new Date().toISOString().slice(0, 10);

  const tx = db.transaction((payload) => {
    const count = db.prepare("SELECT COUNT(*) AS n FROM oncoagent_rules").get().n;
    const nextNumber = String(count + 1).padStart(4, "0");

    const rule = {
      id: payload.id || `rule_${nextNumber}`,
      versao: payload.versao || "1.0.0",
      status: payload.status || "ativa",
      categoria: payload.categoria || "geral",
      prioridade: payload.prioridade || "media",
      criada_em: payload.criada_em || nowDate,
      atualizada_em: nowDate,
      autor: payload.autor || "Dr. Silas Negrão",
      caso_origem: payload.caso_origem || "A definir",
      correcao_original: payload.correcao_original,
      regra_aprendida: payload.regra_aprendida,
      aplicar_em_json: JSON.stringify(payload.aplicar_em || ["coordenador"]),
      conflita_com_json: JSON.stringify(payload.conflita_com || []),
      fonte_base_json: JSON.stringify(payload.fonte_base || ["correcao_medica"]),
      nivel_evidencia: payload.nivel_evidencia || "pratica_local",
      observacoes: payload.observacoes || ""
    };

    db.prepare(`
      INSERT INTO oncoagent_rules (
        id, versao, status, categoria, prioridade, criada_em, atualizada_em,
        autor, caso_origem, correcao_original, regra_aprendida,
        aplicar_em_json, conflita_com_json, fonte_base_json,
        nivel_evidencia, observacoes, created_at, updated_at
      )
      VALUES (
        @id, @versao, @status, @categoria, @prioridade, @criada_em, @atualizada_em,
        @autor, @caso_origem, @correcao_original, @regra_aprendida,
        @aplicar_em_json, @conflita_com_json, @fonte_base_json,
        @nivel_evidencia, @observacoes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `).run(rule);

    return rowToRule({
      ...rule,
      aplicar_em_json: rule.aplicar_em_json,
      conflita_com_json: rule.conflita_com_json,
      fonte_base_json: rule.fonte_base_json
    });
  });

  return tx(input);
}
