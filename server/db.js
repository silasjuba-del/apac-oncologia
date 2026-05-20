// server/db.js v3 — Onco App — Hospital do Bem
// Recepção: SOMENTE dados demográficos e administrativos
// CID / estadiamento / subtipo: extraídos pelo Claude dos laudos do Drive

import Database from "better-sqlite3";
import path     from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "../onco_app.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`

-- ── PACIENTES — preenchido pelo paciente no celular ───────────
CREATE TABLE IF NOT EXISTS pacientes (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at          TEXT DEFAULT (datetime('now','localtime')),
  status              TEXT DEFAULT 'aguardando_recepcao',
  nome                TEXT,
  cpf                 TEXT,
  data_nascimento     TEXT,
  nome_mae            TEXT,
  cidade              TEXT,
  telefone            TEXT,
  sexo                TEXT,
  cns                 TEXT,
  doencas             TEXT DEFAULT '[]',
  doenca_coracao      TEXT,
  doenca_rim          TEXT,
  doenca_figado       TEXT,
  doencas_outras      TEXT,
  tabagismo           TEXT DEFAULT 'nunca',
  tabagismo_anos      TEXT,
  tabagismo_cigarros  TEXT,
  tabagismo_parou     TEXT,
  etilismo            TEXT DEFAULT 'nunca',
  etilismo_frequencia TEXT,
  etilismo_parou      TEXT,
  medicamentos        TEXT DEFAULT '[]',
  medicamentos_outros TEXT,
  alergias            TEXT,
  cirurgias           TEXT,
  vacinas_atualizadas TEXT DEFAULT 'nao_informado',
  historico_familiar  TEXT,
  sintomas_atuais     TEXT
);

-- ── RECEPÇÃO — apenas dados demográficos/administrativos ──────
-- SEM CID, estadiamento ou dados clínicos (esses vêm do dossiê)
CREATE TABLE IF NOT EXISTS recepcao (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id     INTEGER REFERENCES pacientes(id),
  created_at      TEXT DEFAULT (datetime('now','localtime')),
  atualizado_em   TEXT,
  nome            TEXT,
  cpf             TEXT,
  data_nascimento TEXT,
  nome_mae        TEXT,
  logradouro      TEXT,
  bairro          TEXT,
  municipio       TEXT,
  uf              TEXT,
  cep             TEXT,
  telefone        TEXT,
  cns             TEXT,
  numero_sus      TEXT,
  convenio        TEXT DEFAULT 'SUS',
  sexo            TEXT,
  drive_folder    TEXT,   -- pasta Google Drive com os laudos
  obs_recepcao    TEXT
);

-- ── DOSSIÊ — gerado pelo Claude a partir dos laudos do Drive ──
-- Contém CID, diagnóstico histológico, estadiamento, subtipo, biomarcadores
CREATE TABLE IF NOT EXISTS dossies (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id             INTEGER REFERENCES pacientes(id),
  created_at              TEXT DEFAULT (datetime('now','localtime')),
  drive_folder            TEXT,
  resumo_claude           TEXT,
  cid10_extraido          TEXT,
  diagnostico_extraido    TEXT,
  estadiamento_extraido   TEXT,
  subtipo_extraido        TEXT,
  biomarcadores_extraidos TEXT,
  metastases_extraidas    TEXT,
  data_biopsia_extraida   TEXT,
  status_analise          TEXT DEFAULT 'pendente',
  erro_analise            TEXT
);

-- ── LAUDOS (upload direto) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS laudos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  recepcao_id     INTEGER REFERENCES recepcao(id),
  paciente_id     INTEGER REFERENCES pacientes(id),
  created_at      TEXT DEFAULT (datetime('now','localtime')),
  tipo_exame      TEXT,
  data_exame      TEXT,
  descricao       TEXT,
  nome_arquivo    TEXT,
  caminho_arquivo TEXT,
  mime_type       TEXT,
  resumo_claude   TEXT,
  resumo_em       TEXT
);

-- ── EVOLUÇÕES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evolucoes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id     INTEGER REFERENCES pacientes(id),
  dossie_id       INTEGER REFERENCES dossies(id),
  created_at      TEXT DEFAULT (datetime('now','localtime')),
  medico          TEXT DEFAULT 'Dr. Silas Negrão',
  texto_evolucao  TEXT,
  resumo_inicial  TEXT,
  status          TEXT DEFAULT 'rascunho'
);

-- ── APAC ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS apac (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  evolucao_id             INTEGER REFERENCES evolucoes(id),
  paciente_id             INTEGER REFERENCES pacientes(id),
  created_at              TEXT DEFAULT (datetime('now','localtime')),
  nome                    TEXT,
  cpf                     TEXT,
  cns                     TEXT,
  nome_mae                TEXT,
  municipio               TEXT,
  data_nascimento         TEXT,
  cid10                   TEXT,
  diagnostico_histologico TEXT,
  data_biopsia            TEXT,
  estadiamento            TEXT,
  procedimento_sigtap     TEXT,
  procedimentos_json      TEXT DEFAULT '[]',
  linha_tratamento        TEXT,
  protocolo               TEXT,
  justificativa_clinica   TEXT,
  laudos_comprobatorios   TEXT,
  peso                    TEXT,
  altura                  TEXT,
  superficie_corporal     TEXT,
  funcao_renal            TEXT,
  funcao_hepatica         TEXT,
  status_completude       TEXT DEFAULT 'incompleta',
  pendencias_json         TEXT DEFAULT '[]',
  risco_glosa             TEXT DEFAULT 'alto'
);

-- ── ÍNDICES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pac_nome ON pacientes(nome);
CREATE INDEX IF NOT EXISTS idx_pac_cpf  ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_rec_pac  ON recepcao(paciente_id);
CREATE INDEX IF NOT EXISTS idx_dos_pac  ON dossies(paciente_id);
CREATE INDEX IF NOT EXISTS idx_evo_pac  ON evolucoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_apac_evo ON apac(evolucao_id);
CREATE INDEX IF NOT EXISTS idx_laud_pac ON laudos(paciente_id);
`);

// ── Migração segura ───────────────────────────────────────────
function colunaExiste(tab, col) {
  return db.prepare(`PRAGMA table_info(${tab})`).all().some(c => c.name === col);
}
const migracoes = [
  ["dossies",   "cid10_extraido",          "TEXT"],
  ["dossies",   "diagnostico_extraido",    "TEXT"],
  ["dossies",   "estadiamento_extraido",   "TEXT"],
  ["dossies",   "subtipo_extraido",        "TEXT"],
  ["dossies",   "biomarcadores_extraidos", "TEXT"],
  ["dossies",   "metastases_extraidas",    "TEXT"],
  ["dossies",   "data_biopsia_extraida",   "TEXT"],
  ["recepcao",  "logradouro",              "TEXT"],
  ["recepcao",  "bairro",                  "TEXT"],
  ["recepcao",  "municipio",               "TEXT"],
  ["recepcao",  "uf",                      "TEXT"],
  ["recepcao",  "cep",                     "TEXT"],
  ["recepcao",  "drive_folder",            "TEXT"],
  ["recepcao",  "obs_recepcao",            "TEXT"],
  ["apac",      "procedimentos_json",      "TEXT DEFAULT '[]'"],
  ["apac",      "data_nascimento",         "TEXT"],
  ["evolucoes", "dossie_id",               "INTEGER"],
  ["evolucoes", "resumo_inicial",          "TEXT"],
];
for (const [t, c, d] of migracoes) {
  if (!colunaExiste(t, c)) {
    db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${d}`);
    console.log(`[DB v3] Migração: ${t}.${c} adicionado.`);
  }
}

// ── Helpers ───────────────────────────────────────────────────
export function parseArr(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : [String(p)]; }
  catch { return v.split(",").map(x => x.trim()).filter(Boolean); }
}

export function getPacienteCompleto(id) {
  const paciente  = db.prepare("SELECT * FROM pacientes WHERE id=?").get(id);
  if (!paciente) return null;
  const recepcao  = db.prepare("SELECT * FROM recepcao WHERE paciente_id=? ORDER BY created_at DESC LIMIT 1").get(id);
  const dossie    = db.prepare("SELECT * FROM dossies   WHERE paciente_id=? ORDER BY created_at DESC LIMIT 1").get(id);
  const evolucoes = db.prepare("SELECT * FROM evolucoes WHERE paciente_id=? ORDER BY created_at DESC").all(id);
  const laudos    = db.prepare("SELECT * FROM laudos    WHERE paciente_id=? ORDER BY data_exame DESC, created_at DESC").all(id);
  return { paciente, recepcao, dossie, evolucoes, laudos };
}

export function buscarPacientes(q) {
  return db.prepare(`
    SELECT p.id, p.nome, p.cpf, p.cidade, p.status, p.created_at,
           r.municipio, r.drive_folder, d.status_analise,
           d.cid10_extraido, d.estadiamento_extraido
    FROM pacientes p
    LEFT JOIN recepcao r ON r.paciente_id=p.id
    LEFT JOIN dossies  d ON d.paciente_id=p.id
    WHERE p.nome LIKE ? OR p.cpf LIKE ?
    ORDER BY p.created_at DESC LIMIT 30
  `).all(`%${q}%`, `%${q}%`);
}

export function validarAPAC(dados) {
  const OBRIGATORIOS = [
    { k:"nome",                    l:"Nome do paciente"               },
    { k:"cpf",                     l:"CPF"                            },
    { k:"cns",                     l:"CNS / Cartão SUS"               },
    { k:"nome_mae",                l:"Nome da mãe"                    },
    { k:"municipio",               l:"Município de origem"            },
    { k:"cid10",                   l:"CID-10 principal"               },
    { k:"diagnostico_histologico", l:"Diagnóstico histológico"        },
    { k:"data_biopsia",            l:"Data da biópsia"                },
    { k:"estadiamento",            l:"Estadiamento TNM"               },
    { k:"procedimento_sigtap",     l:"Procedimento SIGTAP"            },
    { k:"linha_tratamento",        l:"Linha de tratamento"            },
    { k:"protocolo",               l:"Protocolo proposto"             },
    { k:"justificativa_clinica",   l:"Justificativa clínica"          },
  ];
  const pendencias        = OBRIGATORIOS
    .filter(c => !dados[c.k] || dados[c.k] === "null" || String(dados[c.k]).trim() === "")
    .map(c => c.l);
  const risco_glosa       = pendencias.length === 0 ? "baixo" : pendencias.length <= 3 ? "medio" : "alto";
  const status_completude = pendencias.length === 0 ? "completa" : "incompleta";
  const pct               = Math.round(((OBRIGATORIOS.length - pendencias.length) / OBRIGATORIOS.length) * 100);
  return { status_completude, risco_glosa, pendencias, pendencias_json: JSON.stringify(pendencias), pct };
}

export default db;
