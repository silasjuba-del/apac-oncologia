export function safeJsonParse(text, fallback = null) {
  if (!text) return fallback;
  try { return JSON.parse(text); } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try { return JSON.parse(match[0]); } catch { return fallback; }
}

export function normalizeAgentResult(agentId, rawText) {
  const parsed = safeJsonParse(rawText);
  if (parsed) {
    return {
      agente: parsed.agente || agentId,
      resumo: parsed.resumo || "",
      dados_presentes: parsed.dados_presentes || [],
      dados_ausentes: parsed.dados_ausentes || [],
      pendencias_criticas: parsed.pendencias_criticas || [],
      riscos: parsed.riscos || [],
      posicionamento: parsed.posicionamento || "DADOS_INSUFICIENTES",
      justificativa: parsed.justificativa || "",
      evidencias: parsed.evidencias || [],
      acoes_recomendadas: parsed.acoes_recomendadas || [],
      bloqueios: parsed.bloqueios || [],
      raw: rawText
    };
  }
  return {
    agente: agentId,
    resumo: rawText || "",
    dados_presentes: [],
    dados_ausentes: [],
    pendencias_criticas: ["Resposta não estruturada em JSON."],
    riscos: ["Falha de contrato de saída do agente."],
    posicionamento: "ALTO_RISCO_REVISAR",
    justificativa: "Resposta não estruturada; exige revisão humana.",
    evidencias: [],
    acoes_recomendadas: [],
    bloqueios: ["Contrato JSON inválido."],
    raw: rawText
  };
}

export function hasCriticalBlock(results = []) {
  return results.some((r) =>
    r.posicionamento === "ALTO_RISCO_REVISAR" ||
    r.posicionamento === "DADOS_INSUFICIENTES" ||
    (r.pendencias_criticas && r.pendencias_criticas.length > 0) ||
    (r.bloqueios && r.bloqueios.length > 0)
  );
}

export function buildUserContext(payload, degradedMode, localKnowledge = {}) {
  return JSON.stringify({ caso: payload, modo_degradado: degradedMode, conhecimento_local: localKnowledge }, null, 2);
}
