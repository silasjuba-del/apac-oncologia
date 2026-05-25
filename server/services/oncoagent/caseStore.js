import { getOncoAgentDb } from "./db.js";

function parseJson(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function caseRowToObject(row) {
  if (!row) return null;

  return {
    hash_caso: row.hash_caso,
    run_id: row.run_id,
    version: row.version,
    input_payload: parseJson(row.input_payload_json, {}),
    result: parseJson(row.result_payload_json, null),
    critical_block: Boolean(row.critical_block),
    release: parseJson(row.release_json, {}),
    safety_notice: row.safety_notice,
    started_at: row.started_at,
    generated_at: row.generated_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function insertOrUpdateCaseStmt(db) {
  return db.prepare(`
    INSERT INTO oncoagent_cases (
      hash_caso, run_id, version, input_payload_json, result_payload_json,
      critical_block, release_json, safety_notice, started_at, generated_at,
      created_at, updated_at
    )
    VALUES (
      @hash_caso, @run_id, @version, @input_payload_json, @result_payload_json,
      @critical_block, @release_json, @safety_notice, @started_at, @generated_at,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT(hash_caso) DO UPDATE SET
      run_id = excluded.run_id,
      version = excluded.version,
      input_payload_json = excluded.input_payload_json,
      result_payload_json = excluded.result_payload_json,
      critical_block = excluded.critical_block,
      release_json = excluded.release_json,
      safety_notice = excluded.safety_notice,
      started_at = excluded.started_at,
      generated_at = excluded.generated_at,
      updated_at = CURRENT_TIMESTAMP
  `);
}

function insertAgentRunStmt(db) {
  return db.prepare(`
    INSERT INTO oncoagent_agent_runs (
      hash_caso, run_id, agente, started_at, ended_at, duration_ms,
      status, error, result_payload_json, created_at
    )
    VALUES (
      @hash_caso, @run_id, @agente, @started_at, @ended_at, @duration_ms,
      @status, @error, @result_payload_json, CURRENT_TIMESTAMP
    )
  `);
}

function buildCaseParams({ hashCaso, runId, inputPayload, result }) {
  return {
    hash_caso: hashCaso,
    run_id: runId,
    version: result.version || "1.6.0",
    input_payload_json: JSON.stringify(inputPayload ?? {}),
    result_payload_json: JSON.stringify(result ?? {}),
    critical_block: result.criticalBlock ? 1 : 0,
    release_json: JSON.stringify(result.release || {}),
    safety_notice: result.safety_notice || "",
    started_at: result.startedAt || null,
    generated_at: result.generatedAt || null
  };
}

function buildAgentRunParams({ hashCaso, runId, timing, result }) {
  return {
    hash_caso: hashCaso,
    run_id: runId,
    agente: timing.agente,
    started_at: timing.started_at || null,
    ended_at: timing.ended_at || null,
    duration_ms: Number.isFinite(timing.ms) ? Math.round(timing.ms) : null,
    status: timing.error ? "error" : "ok",
    error: timing.error || null,
    result_payload_json: result ? JSON.stringify(result) : null
  };
}

export function saveOncoAgentCase({ hashCaso, runId, inputPayload, result }) {
  if (!hashCaso) throw new Error("hashCaso é obrigatório para persistir caso.");
  if (!runId) throw new Error("runId é obrigatório para persistir caso.");

  const db = getOncoAgentDb();
  insertOrUpdateCaseStmt(db).run(buildCaseParams({ hashCaso, runId, inputPayload, result }));

  return getOncoAgentCase(hashCaso);
}

export function saveAgentRuns({ hashCaso, runId, agentTimings = [], agentResults = [] }) {
  if (!hashCaso || !runId) return [];

  const db = getOncoAgentDb();
  const byAgent = new Map(agentResults.map((r) => [r.agente, r]));
  const insert = insertAgentRunStmt(db);

  const tx = db.transaction((items) => {
    const inserted = [];

    for (const timing of items) {
      const params = buildAgentRunParams({
        hashCaso,
        runId,
        timing,
        result: byAgent.get(timing.agente) || null
      });

      const info = insert.run(params);
      inserted.push({ id: info.lastInsertRowid, ...params });
    }

    return inserted;
  });

  return tx(agentTimings);
}

export function saveOncoAgentDeliberation({ hashCaso, runId, inputPayload, result, agentTimings = [], agentResults = [] }) {
  if (!hashCaso) throw new Error("hashCaso é obrigatório para persistir caso.");
  if (!runId) throw new Error("runId é obrigatório para persistir caso.");

  const db = getOncoAgentDb();
  const insertCase = insertOrUpdateCaseStmt(db);
  const insertRun = insertAgentRunStmt(db);

  const tx = db.transaction(() => {
    insertCase.run(buildCaseParams({ hashCaso, runId, inputPayload, result }));

    const byAgent = new Map(agentResults.map((r) => [r.agente, r]));

    for (const timing of agentTimings) {
      insertRun.run(buildAgentRunParams({
        hashCaso,
        runId,
        timing,
        result: byAgent.get(timing.agente) || null
      }));
    }

    return getOncoAgentCase(hashCaso);
  });

  return tx();
}

export function getOncoAgentCase(hashCaso) {
  const db = getOncoAgentDb();
  const row = db.prepare(`
    SELECT *
    FROM oncoagent_cases
    WHERE hash_caso = ?
  `).get(hashCaso);

  return caseRowToObject(row);
}

export function getAgentRunsByCase(hashCaso) {
  const db = getOncoAgentDb();
  const rows = db.prepare(`
    SELECT *
    FROM oncoagent_agent_runs
    WHERE hash_caso = ?
    ORDER BY id ASC
  `).all(hashCaso);

  return rows.map((row) => ({
    id: row.id,
    hash_caso: row.hash_caso,
    run_id: row.run_id,
    agente: row.agente,
    started_at: row.started_at,
    ended_at: row.ended_at,
    duration_ms: row.duration_ms,
    status: row.status,
    error: row.error,
    result_payload: parseJson(row.result_payload_json, null),
    created_at: row.created_at
  }));
}

export function listOncoAgentCases({ limit = 25, offset = 0 } = {}) {
  const db = getOncoAgentDb();
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const total = db.prepare("SELECT COUNT(*) AS n FROM oncoagent_cases").get().n;

  const rows = db.prepare(`
    SELECT
      hash_caso,
      run_id,
      version,
      critical_block,
      release_json,
      safety_notice,
      started_at,
      generated_at,
      created_at,
      updated_at
    FROM oncoagent_cases
    ORDER BY created_at DESC
    LIMIT ?
    OFFSET ?
  `).all(safeLimit, safeOffset);

  return {
    total,
    limit: safeLimit,
    offset: safeOffset,
    items: rows.map((row) => ({
      hash_caso: row.hash_caso,
      run_id: row.run_id,
      version: row.version,
      critical_block: Boolean(row.critical_block),
      release: parseJson(row.release_json, {}),
      safety_notice: row.safety_notice,
      started_at: row.started_at,
      generated_at: row.generated_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  };
}

export function applyOncoAgentRetention({
  retentionDays = Number(process.env.ONCOAGENT_RETENTION_DAYS || 0),
  retentionMaxCases = Number(process.env.ONCOAGENT_RETENTION_MAX_CASES || 0)
} = {}) {
  const db = getOncoAgentDb();
  const deleted = { byAge: 0, byLimit: 0 };

  const tx = db.transaction(() => {
    if (retentionDays > 0) {
      const info = db.prepare(`
        DELETE FROM oncoagent_cases
        WHERE created_at < datetime('now', ?)
      `).run(`-${retentionDays} days`);
      deleted.byAge = info.changes || 0;
    }

    if (retentionMaxCases > 0) {
      const info = db.prepare(`
        DELETE FROM oncoagent_cases
        WHERE hash_caso IN (
          SELECT hash_caso
          FROM oncoagent_cases
          ORDER BY created_at DESC
          LIMIT -1 OFFSET ?
        )
      `).run(retentionMaxCases);
      deleted.byLimit = info.changes || 0;
    }

    return deleted;
  });

  return tx();
}
