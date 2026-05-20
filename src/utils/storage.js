// src/utils/storage.js — persistência local completa
const KEY_PACIENTES  = "onco_pacientes_v1";
const KEY_PAC_ATUAL  = "onco_pac_atual_v1";
const KEY_AGENDA     = "onco_agenda_v1";
const KEY_FILA       = "onco_fila_v1";
const KEY_HISTORICO  = "onco_historico_qt_v1";
const KEY_TRIAGENS   = "onco_triagens_v1";
const KEY_PATCHES    = "onco_ai_patches_v1";

function get(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function set(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── PACIENTES ────────────────────────────────────────────────────────────────
export function loadPacientes()         { return get(KEY_PACIENTES, []); }
export function savePacientes(lista)    { set(KEY_PACIENTES, lista); }

export function salvarPaciente(pac) {
  if (!pac?.pacID) return;
  const lista = loadPacientes();
  const idx   = lista.findIndex(p => p.pacID === pac.pacID);
  if (idx >= 0) lista[idx] = { ...lista[idx], ...pac, _atualizado: Date.now() };
  else          lista.push({ ...pac, _criado: Date.now(), _atualizado: Date.now() });
  set(KEY_PACIENTES, lista);
}

export function deletarPaciente(pacID) {
  const lista = loadPacientes().filter(p => p.pacID !== pacID);
  set(KEY_PACIENTES, lista);
}

// ── PAC ATUAL (sessão ativa) ──────────────────────────────────────────────────
export function loadPacAtual()          { return get(KEY_PAC_ATUAL, null); }
export function savePacAtual(pac)       { set(KEY_PAC_ATUAL, pac); }
export function clearPacAtual()         { localStorage.removeItem(KEY_PAC_ATUAL); }

// ── AGENDA ───────────────────────────────────────────────────────────────────
export function loadAgenda()            { return get(KEY_AGENDA, []); }
export function saveAgenda(lista)       { set(KEY_AGENDA, lista); }

// ── FILA DE ESPERA ────────────────────────────────────────────────────────────
export function loadFila()              { return get(KEY_FILA, []); }
export function saveFila(lista)         { set(KEY_FILA, lista); }

// ── HISTÓRICO QT ──────────────────────────────────────────────────────────────
export function loadHistoricoQT()       { return get(KEY_HISTORICO, []); }
export function saveHistoricoQT(lista)  { set(KEY_HISTORICO, lista); }

// ── TRIAGENS ─────────────────────────────────────────────────────────────────
export function loadTriagens()          { return get(KEY_TRIAGENS, []); }
export function saveTriagens(lista)     { set(KEY_TRIAGENS, lista); }

// ── AI PATCHES ────────────────────────────────────────────────────────────────
export function loadAiPatches()         { return get(KEY_PATCHES, []); }
export function saveAiPatches(lista)    { set(KEY_PATCHES, lista); }

// ── UTIL ──────────────────────────────────────────────────────────────────────
export function exportarTudo() {
  return {
    pacientes:  loadPacientes(),
    agenda:     loadAgenda(),
    fila:       loadFila(),
    historicoQT:loadHistoricoQT(),
    triagens:   loadTriagens(),
    exportadoEm: new Date().toISOString(),
    versao: "onco_v1",
  };
}

export function importarTudo(json) {
  try {
    const d = typeof json === "string" ? JSON.parse(json) : json;
    if (d.pacientes)   set(KEY_PACIENTES,  d.pacientes);
    if (d.agenda)      set(KEY_AGENDA,     d.agenda);
    if (d.fila)        set(KEY_FILA,       d.fila);
    if (d.historicoQT) set(KEY_HISTORICO,  d.historicoQT);
    if (d.triagens)    set(KEY_TRIAGENS,   d.triagens);
    return true;
  } catch { return false; }
}

export function limparTudo() {
  [KEY_PACIENTES,KEY_PAC_ATUAL,KEY_AGENDA,KEY_FILA,KEY_HISTORICO,KEY_TRIAGENS,KEY_PATCHES]
    .forEach(k => localStorage.removeItem(k));
}
