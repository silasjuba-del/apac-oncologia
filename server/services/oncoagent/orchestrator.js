import crypto from "crypto";
import { createRequire } from "module";
import { AGENTS } from "./agents.js";
import { callClaude } from "./anthropicClient.js";
import { evaluateDegradedMode } from "./degradedMode.js";
import { buildUserContext, normalizeAgentResult, hasCriticalBlock } from "./validators.js";
import { localSigtapSuggestion } from "./sigtapAgent.js";
import { getActiveFeedbackRules } from "./feedbackMemory.js";
import { saveOncoAgentDeliberation, applyOncoAgentRetention } from "./caseStore.js";

const require = createRequire(import.meta.url);
const clinicalTrials = require("../../data/oncoagent/clinical_trials.json");
const apacChecklist = require("../../data/oncoagent/apac_checklist.json");

const PARALLEL_AGENTS = [
  "prontuario",
  "apacAntiglosa",
  "sigtap",
  "trials",
  "access",
  "prescricao",
  "toxicidade"
];

const AGENT_TIMEOUT_MS = Number(process.env.ONCOAGENT_AGENT_TIMEOUT_MS || 25000);
const COORDINATOR_MAX_TOKENS = Number(process.env.ONCOAGENT_COORDINATOR_MAX_TOKENS || 1800);
const PARALLEL_MAX_TOKENS = Number(process.env.ONCOAGENT_PARALLEL_MAX_TOKENS || 1500);
const AUDITOR_MAX_TOKENS = Number(process.env.ONCOAGENT_AUDITOR_MAX_TOKENS || 2400);
const FINAL_MAX_TOKENS = Number(process.env.ONCOAGENT_FINAL_MAX_TOKENS || 2400);

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = canonicalize(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function stableHash(payload) {
  const canonical = JSON.stringify(canonicalize(payload || {}));
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

function withTimeout(task, ms, label) {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Timeout no agente ${label} após ${ms} ms.`));
    }, ms);
  });

  return Promise.race([
    Promise.resolve().then(task),
    timeout
  ]).finally(() => clearTimeout(timer));
}

function agentErrorResult(agent, error, label = null) {
  return {
    agente: label || agent?.id || "agente_desconhecido",
    resumo: "",
    dados_presentes: [],
    dados_ausentes: [],
    pendencias_criticas: ["Falha ou timeout de execução do agente."],
    riscos: [error?.message || "Erro desconhecido."],
    posicionamento: "ALTO_RISCO_REVISAR",
    justificativa: "Agente não retornou resposta válida em tempo hábil; exige revisão humana.",
    evidencias: [],
    acoes_recomendadas: [],
    bloqueios: ["Erro/timeout de execução."],
    error: error?.message || String(error)
  };
}

function timingStart(label) {
  return {
    agente: label,
    started_at: new Date().toISOString(),
    started_ms: Date.now()
  };
}

function timingEnd(timing, error = null) {
  return {
    agente: timing.agente,
    started_at: timing.started_at,
    ended_at: new Date().toISOString(),
    ms: Date.now() - timing.started_ms,
    ...(error ? { error: error.message || String(error) } : {})
  };
}

async function runAgent({ key, label, user, maxTokens, timings }) {
  const agent = AGENTS[key];
  const timing = timingStart(label || agent.id);

  try {
    const raw = await withTimeout(() => callClaude({
      system: agent.system,
      user,
      maxTokens
    }), AGENT_TIMEOUT_MS, label || agent.id);

    timings.push(timingEnd(timing));
    const normalized = normalizeAgentResult(label || agent.id, raw);
    normalized.agente = label || agent.id;
    return normalized;
  } catch (error) {
    timings.push(timingEnd(timing, error));
    return agentErrorResult(agent, error, label || agent.id);
  }
}

export async function deliberateOncoCase(payload = {}) {
  const startedAt = new Date().toISOString();
  const runId = crypto.randomUUID();
  const hashCaso = stableHash(payload);
  const agentTimings = [];

  const degradedMode = evaluateDegradedMode(payload);
  const sigtapLocal = localSigtapSuggestion(payload);

  const localKnowledge = {
    clinical_trials: clinicalTrials,
    apac_checklist: apacChecklist,
    feedback_memory_active_rules: getActiveFeedbackRules(),
    sigtap_local_suggestion: sigtapLocal
  };

  const coordinator = await runAgent({
    key: "coordenador",
    label: "coordenador_preliminar",
    user: buildUserContext(payload, degradedMode, localKnowledge),
    maxTokens: COORDINATOR_MAX_TOKENS,
    timings: agentTimings
  });

  const agentPromises = PARALLEL_AGENTS.map((key) => {
    const agent = AGENTS[key];

    return runAgent({
      key,
      label: agent.id,
      user: buildUserContext(
        {
          ...payload,
          coordenador_preliminar: coordinator
        },
        degradedMode,
        localKnowledge
      ),
      maxTokens: PARALLEL_MAX_TOKENS,
      timings: agentTimings
    });
  });

  const settledAgents = await Promise.allSettled(agentPromises);

  const agents = settledAgents.map((item, idx) => {
    if (item.status === "fulfilled") return item.value;

    const key = PARALLEL_AGENTS[idx];
    return agentErrorResult(AGENTS[key], item.reason, AGENTS[key]?.id || key);
  });

  const auditorFinal = await runAgent({
    key: "auditor",
    label: "auditor_final",
    user: JSON.stringify(
      {
        hash_caso: hashCaso,
        run_id: runId,
        caso: payload,
        modo_degradado: degradedMode,
        coordenador,
        agentes: agents,
        sigtap_local: sigtapLocal
      },
      null,
      2
    ),
    maxTokens: AUDITOR_MAX_TOKENS,
    timings: agentTimings
  });

  const final = await runAgent({
    key: "coordenador",
    label: "coordenador_final",
    user: JSON.stringify(
      {
        tarefa: "Consolidar parecer preliminar para validação médica. Não decidir por maioria simples. Pesar dados ausentes, glosa, toxicidade, acesso, evidência e auditoria final.",
        hash_caso: hashCaso,
        run_id: runId,
        caso: payload,
        modo_degradado: degradedMode,
        coordenador_preliminar: coordinator,
        agentes: agents,
        auditor_final: auditorFinal,
        sigtap_local: sigtapLocal
      },
      null,
      2
    ),
    maxTokens: FINAL_MAX_TOKENS,
    timings: agentTimings
  });

  const criticalBlock = hasCriticalBlock([coordinator, ...agents, auditorFinal, final]);

  const result = {
    version: "1.6.0",
    hash_caso: hashCaso,
    run_id: runId,
    generatedAt: new Date().toISOString(),
    startedAt,
    agentTimings,
    safety_notice: "Parecer preliminar gerado por IA. Exige validação médica do Dr. Silas Negrão antes de qualquer conduta, prescrição, APAC ou documento.",
    degradedMode,
    sigtapLocal,
    coordinator,
    agents,
    auditorFinal,
    final,
    criticalBlock,
    release: {
      prontuario_preliminar:
        degradedMode.outputs.prontuario_preliminar.allowed ||
        degradedMode.outputs.prontuario_preliminar.status === "degradado",
      apac_rascunho: degradedMode.outputs.apac_rascunho.allowed,
      apac_conferencia: degradedMode.outputs.apac_conferencia.allowed && !criticalBlock,
      prescricao_rascunho: degradedMode.outputs.prescricao_rascunho.allowed && !criticalBlock,
      prescricao_validacao: degradedMode.outputs.prescricao_validacao.allowed && !criticalBlock
    },
    persistence: {
      sqlite: false
    }
  };

  const allAgentResults = [coordinator, ...agents, auditorFinal, final];

  try {
    saveOncoAgentDeliberation({
      hashCaso,
      runId,
      inputPayload: payload,
      result,
      agentTimings,
      agentResults: allAgentResults
    });

    const retention = applyOncoAgentRetention();

    result.persistence.sqlite = true;
    result.persistence.transactional = true;
    result.persistence.retention = retention;
  } catch (error) {
    result.persistence.sqlite = false;
    result.persistence.transactional = false;
    result.persistence.error = error.message || String(error);
  }

  return result;
}
