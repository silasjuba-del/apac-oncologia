// src/utils/db.js
// Camada unificada: Supabase (nuvem) + localStorage (offline/cache)
import { supabase, isConfigured } from "../lib/supabase.js";
import {
  loadPacientes, savePacientes,
  loadAgenda, saveAgenda,
  loadFila, saveFila,
  loadHistoricoQT, saveHistoricoQT,
  loadTriagens, saveTriagens,
} from "./storage.js";

// ─── STATUS ──────────────────────────────────────────────────────────────────
let _online = false;
export const isOnline = () => _online;

async function checkOnline() {
  if (!isConfigured()) return false;
  try {
    const { error } = await supabase.from("pacientes").select("pac_id").limit(1);
    _online = !error;
  } catch { _online = false; }
  return _online;
}

// ─── PACIENTES ────────────────────────────────────────────────────────────────
export async function dbSalvarPaciente(pac) {
  if (!pac?.pacID) return;
  // Sempre salva local primeiro
  const lista = loadPacientes();
  const idx   = lista.findIndex(p => p.pacID === pac.pacID);
  const agora = Date.now();
  if (idx >= 0) lista[idx] = { ...lista[idx], ...pac, _atualizado: agora };
  else          lista.push({ ...pac, _criado: agora, _atualizado: agora });
  savePacientes(lista);

  // Sincroniza nuvem em background
  if (isConfigured()) {
    supabase.from("pacientes").upsert({
      pac_id: pac.pacID,
      dados:  { ...pac, _atualizado: agora },
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "pac_id" }).then(({ error }) => {
      if (error) console.warn("[Supabase] salvar paciente:", error.message);
    });
  }
}

export async function dbDeletarPaciente(pacID) {
  const lista = loadPacientes().filter(p => p.pacID !== pacID);
  savePacientes(lista);
  if (isConfigured()) {
    supabase.from("pacientes").delete().eq("pac_id", pacID)
      .then(({ error }) => { if (error) console.warn("[Supabase] deletar:", error.message); });
  }
}

export async function dbCarregarPacientes() {
  // 1. Carrega do local imediatamente
  let lista = loadPacientes();

  // 2. Busca da nuvem e faz merge
  if (isConfigured()) {
    try {
      const { data, error } = await supabase.from("pacientes").select("*").order("atualizado_em", { ascending: false });
      if (!error && data) {
        const nuvemMap = new Map(data.map(r => [r.pac_id, { ...r.dados, _syncedAt: Date.now() }]));
        const localMap = new Map(lista.map(p => [p.pacID, p]));

        // Merge: nuvem vence se mais recente
        nuvemMap.forEach((nuvemPac, pacID) => {
          const local = localMap.get(pacID);
          if (!local || (nuvemPac._atualizado || 0) >= (local._atualizado || 0)) {
            localMap.set(pacID, nuvemPac);
          }
        });

        // Pacientes locais não na nuvem → upsert na nuvem
        localMap.forEach((localPac, pacID) => {
          if (!nuvemMap.has(pacID)) {
            supabase.from("pacientes").upsert({
              pac_id: pacID, dados: localPac, atualizado_em: new Date().toISOString(),
            }, { onConflict: "pac_id" }).then(() => {});
          }
        });

        lista = Array.from(localMap.values());
        savePacientes(lista);
        _online = true;
      }
    } catch (e) {
      console.warn("[Supabase] carregar pacientes:", e.message);
    }
  }
  return lista;
}

// ─── CONFIGURAÇÕES (agenda, fila, triagens, historicoQT) ─────────────────────
async function dbSalvarConfig(chave, valor) {
  // Local
  const salvarLocal = { agenda: saveAgenda, fila: saveFila, historico_qt: saveHistoricoQT, triagens: saveTriagens };
  salvarLocal[chave]?.(valor);

  // Nuvem
  if (isConfigured()) {
    supabase.from("configuracoes").upsert({
      chave, valor, atualizado_em: new Date().toISOString(),
    }, { onConflict: "chave" }).then(({ error }) => {
      if (error) console.warn(`[Supabase] salvar config ${chave}:`, error.message);
    });
  }
}

async function dbCarregarConfig(chave, fallbackFn) {
  if (!isConfigured()) return fallbackFn();
  try {
    const { data, error } = await supabase.from("configuracoes").select("valor").eq("chave", chave).single();
    if (!error && data?.valor) return data.valor;
  } catch {}
  return fallbackFn();
}

export const dbSalvarAgenda     = (v) => dbSalvarConfig("agenda", v);
export const dbSalvarFila       = (v) => dbSalvarConfig("fila", v);
export const dbSalvarHistoricoQT= (v) => dbSalvarConfig("historico_qt", v);
export const dbSalvarTriagens   = (v) => dbSalvarConfig("triagens", v);

export const dbCarregarAgenda     = () => dbCarregarConfig("agenda",       loadAgenda);
export const dbCarregarFila       = () => dbCarregarConfig("fila",         loadFila);
export const dbCarregarHistoricoQT= () => dbCarregarConfig("historico_qt", loadHistoricoQT);
export const dbCarregarTriagens   = () => dbCarregarConfig("triagens",     loadTriagens);

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────────
export async function dbInit() {
  await checkOnline();
  return _online;
}

// ─── STATUS SYNC (para exibir na UI) ─────────────────────────────────────────
export function getSyncStatus() {
  if (!isConfigured()) return { status: "local", label: "💾 Somente local", cor: "#94A3B8" };
  if (_online)         return { status: "synced", label: "☁️ Sincronizado",  cor: "#15803D" };
  return                      { status: "offline", label: "⚠️ Offline",       cor: "#B45309" };
}
