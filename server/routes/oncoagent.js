import express from "express";
import { z } from "zod";
import { deliberateOncoCase } from "../services/oncoagent/orchestrator.js";
import { appendFeedbackRule, readFeedbackMemory } from "../services/oncoagent/feedbackMemory.js";
import { getOncoAgentCase, getAgentRunsByCase, listOncoAgentCases } from "../services/oncoagent/caseStore.js";

const router = express.Router();

const RATE_LIMIT_WINDOW_MS = Number(process.env.ONCOAGENT_RATE_LIMIT_WINDOW_MS || 60000);
const RATE_LIMIT_MAX = Number(process.env.ONCOAGENT_RATE_LIMIT_MAX || 10);
const requestBuckets = new Map();

function rateLimit(req, res, next) {
  const key = req.ip || req.headers["x-forwarded-for"] || "local";
  const now = Date.now();
  const bucket = requestBuckets.get(key) || { start: now, count: 0 };

  if (now - bucket.start > RATE_LIMIT_WINDOW_MS) {
    bucket.start = now;
    bucket.count = 0;
  }

  bucket.count += 1;
  requestBuckets.set(key, bucket);

  if (bucket.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      ok: false,
      error: "Limite de requisições excedido para OncoAgent. Tente novamente em instantes."
    });
  }

  next();
}

const CaseSchema = z.object({
  caso: z.string().min(10),
  nome: z.string().optional(),
  identificacao: z.string().optional(),
  idade: z.string().optional(),
  ecog: z.string().optional(),
  tumor: z.string().optional(),
  estadio: z.string().optional(),
  cid10: z.string().optional(),
  histologia: z.string().optional(),
  morfologia: z.string().optional(),
  biomarcadores: z.string().optional(),
  linhaTerapeutica: z.string().optional(),
  protocoloPretendido: z.string().optional(),
  sigtap: z.string().optional(),
  justificativa: z.string().optional(),
  cpf: z.string().optional(),
  cns: z.string().optional(),
  peso: z.string().optional(),
  altura: z.string().optional(),
  hemograma: z.string().optional(),
  creatinina: z.string().optional(),
  funcaoHepatica: z.string().optional(),
  alergias: z.string().optional(),
  ciclo: z.string().optional(),
  ajustesPrevios: z.string().optional(),
  nivel_evidencia_dados: z.string().optional()
});

const FeedbackSchema = z.object({
  categoria: z.string().optional(),
  prioridade: z.enum(["baixa", "media", "alta", "critica"]).optional(),
  caso_origem: z.string().optional(),
  correcao_original: z.string().min(5),
  regra_aprendida: z.string().min(5),
  aplicar_em: z.array(z.string()).optional(),
  conflita_com: z.array(z.string()).optional(),
  fonte_base: z.array(z.string()).optional(),
  nivel_evidencia: z.string().optional(),
  observacoes: z.string().optional()
});

router.post("/deliberar", rateLimit, async (req, res) => {
  try {
    const payload = CaseSchema.parse(req.body);
    const result = await deliberateOncoCase(payload);
    res.json({ ok: true, result });
  } catch (error) {
    console.error("[OncoAgent] erro:", error);
    res.status(400).json({
      ok: false,
      error: error.message || "Erro ao deliberar caso."
    });
  }
});


router.get("/cases", async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 25;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const data = listOncoAgentCases({ limit, offset });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/deliberar/:hash", async (req, res) => {
  try {
    const item = getOncoAgentCase(req.params.hash);
    if (!item) {
      return res.status(404).json({
        ok: false,
        error: "Parecer não encontrado no SQLite."
      });
    }

    res.json({ ok: true, item });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/deliberar/:hash/runs", async (req, res) => {
  try {
    const runs = getAgentRunsByCase(req.params.hash);
    res.json({ ok: true, runs });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/feedback", async (_req, res) => {
  try {
    const memory = readFeedbackMemory();
    res.json({ ok: true, memory });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/feedback", async (req, res) => {
  try {
    const payload = FeedbackSchema.parse(req.body);
    const rule = appendFeedbackRule(payload);
    res.json({ ok: true, rule });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

export default router;
