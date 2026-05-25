import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbInstance = null;

function jsonStringify(value) {
  return JSON.stringify(value ?? null);
}

function seedFeedbackRules(db) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM oncoagent_rules").get().n;
  if (count > 0) return;

  const seedPath = path.resolve(__dirname, "../../data/oncoagent/feedback_memory.json");
  if (!fs.existsSync(seedPath)) return;

  const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
  const rules = Array.isArray(seed.rules) ? seed.rules : [];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO oncoagent_rules (
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
  `);

  const tx = db.transaction((items) => {
    for (const r of items) {
      insert.run({
        id: r.id,
        versao: r.versao || "1.0.0",
        status: r.status || "ativa",
        categoria: r.categoria || "geral",
        prioridade: r.prioridade || "media",
        criada_em: r.criada_em || new Date().toISOString().slice(0, 10),
        atualizada_em: r.atualizada_em || new Date().toISOString().slice(0, 10),
        autor: r.autor || "Dr. Silas Negrão",
        caso_origem: r.caso_origem || "seed",
        correcao_original: r.correcao_original,
        regra_aprendida: r.regra_aprendida,
        aplicar_em_json: jsonStringify(r.aplicar_em || []),
        conflita_com_json: jsonStringify(r.conflita_com || []),
        fonte_base_json: jsonStringify(r.fonte_base || []),
        nivel_evidencia: r.nivel_evidencia || "pratica_local",
        observacoes: r.observacoes || ""
      });
    }
  });

  tx(rules.filter((r) => r.id && r.correcao_original && r.regra_aprendida));
}

function initializeSchema(db) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  db.exec(`
    CREATE TABLE IF NOT EXISTS oncoagent_rules (
      id TEXT PRIMARY KEY,
      versao TEXT NOT NULL DEFAULT '1.0.0',
      status TEXT NOT NULL DEFAULT 'ativa',
      categoria TEXT NOT NULL DEFAULT 'geral',
      prioridade TEXT NOT NULL DEFAULT 'media',
      criada_em TEXT NOT NULL,
      atualizada_em TEXT NOT NULL,
      autor TEXT NOT NULL DEFAULT 'Dr. Silas Negrão',
      caso_origem TEXT,
      correcao_original TEXT NOT NULL,
      regra_aprendida TEXT NOT NULL,
      aplicar_em_json TEXT NOT NULL DEFAULT '[]',
      conflita_com_json TEXT NOT NULL DEFAULT '[]',
      fonte_base_json TEXT NOT NULL DEFAULT '[]',
      nivel_evidencia TEXT,
      observacoes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_oncoagent_rules_status
      ON oncoagent_rules(status);

    CREATE INDEX IF NOT EXISTS idx_oncoagent_rules_categoria
      ON oncoagent_rules(categoria);

    CREATE TABLE IF NOT EXISTS oncoagent_cases (
      hash_caso TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      version TEXT NOT NULL,
      input_payload_json TEXT NOT NULL,
      result_payload_json TEXT NOT NULL,
      critical_block INTEGER NOT NULL DEFAULT 0,
      release_json TEXT NOT NULL DEFAULT '{}',
      safety_notice TEXT,
      started_at TEXT,
      generated_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_oncoagent_cases_run_id
      ON oncoagent_cases(run_id);

    CREATE INDEX IF NOT EXISTS idx_oncoagent_cases_created_at
      ON oncoagent_cases(created_at);

    CREATE TABLE IF NOT EXISTS oncoagent_agent_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash_caso TEXT NOT NULL,
      run_id TEXT NOT NULL,
      agente TEXT NOT NULL,
      started_at TEXT,
      ended_at TEXT,
      duration_ms INTEGER,
      status TEXT NOT NULL DEFAULT 'ok',
      error TEXT,
      result_payload_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hash_caso) REFERENCES oncoagent_cases(hash_caso) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_oncoagent_agent_runs_hash
      ON oncoagent_agent_runs(hash_caso);

    CREATE INDEX IF NOT EXISTS idx_oncoagent_agent_runs_run_id
      ON oncoagent_agent_runs(run_id);

    CREATE INDEX IF NOT EXISTS idx_oncoagent_agent_runs_agente
      ON oncoagent_agent_runs(agente);
  `);

  seedFeedbackRules(db);
}

export function getOncoAgentDb() {
  if (dbInstance) return dbInstance;

  const dbPath = process.env.ONCOAGENT_DB_PATH ||
    path.resolve(__dirname, "../../data/oncoagent/oncoagent.sqlite");

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  dbInstance = new Database(dbPath);
  initializeSchema(dbInstance);

  return dbInstance;
}

export function closeOncoAgentDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
