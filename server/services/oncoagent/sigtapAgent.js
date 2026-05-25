import { createRequire } from "module";

const require = createRequire(import.meta.url);
const sigtapRules = require("../../data/oncoagent/sigtap_rules.json");

function includesAny(text, arr) {
  return arr.some((x) => text.includes(String(x).toLowerCase()));
}

export function localSigtapSuggestion(payload = {}) {
  const text = [
    payload.caso,
    payload.cid10,
    payload.tumor,
    payload.histologia,
    payload.protocoloPretendido,
    payload.linhaTerapeutica
  ].filter(Boolean).join(" ").toLowerCase();

  const hits = [];

  for (const rule of sigtapRules.rules || []) {
    const cidOk =
      rule.cid_prefixes?.some((p) => String(payload.cid10 || "").startsWith(p)) ||
      includesAny(text, rule.keywords || []);

    const protocolOk =
      !rule.protocol_keywords?.length ||
      includesAny(text, rule.protocol_keywords);

    if (cidOk && protocolOk) {
      hits.push({
        code: rule.sigtap,
        label: rule.label,
        confidence: rule.confidence,
        required_fields: rule.required_fields,
        warnings: rule.warnings || []
      });
    }
  }

  if (!hits.length) {
    return {
      code: null,
      label: "SIGTAP a definir",
      confidence: "baixa",
      required_fields: [
        "CID-10 completo",
        "histologia/morfologia",
        "estádio",
        "linha terapêutica",
        "protocolo pretendido"
      ],
      warnings: ["Nenhuma regra local encontrou compatibilidade suficiente."]
    };
  }

  return hits[0];
}
