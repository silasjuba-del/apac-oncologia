// === src/features/rotas/useEntradasStore.js ===
// APACApp v1.1.7 — Store de EntradaDado por paciente
//
// v1.1.7 (resposta às auditorias):
//   ✓ Lock cooperativo via localStorage (mitiga race entre abas)
//   ✓ Sincronização entre abas via BroadcastChannel
//   ✓ Limpeza por pacienteKey
//   ✓ Aviso "SANDBOX ONLY" — não usar com PII real até backend (v1.2)
//
// Centraliza o fluxo: cada rota (recepção, paciente, enfermagem, upload)
// emite EntradaDado via `emitir(...)`. A Central de Validação consome via
// `entradasPendentes(pacienteKey)`.
//
// AVISO LGPD (FASE DE TESTES):
//   Este store usa localStorage clear-text. Para uso com pacientes reais,
//   migrar para backend autenticado (v1.2) com criptografia em repouso.

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { criarEntradaDado } from '../oncoProUtils.js';

const STORAGE_KEY = 'apacapp_entradas_v117';
const LOCK_KEY = 'apacapp_lock_v117';
const LOCK_TTL_MS = 200;
const CHANNEL_NAME = 'apacapp_entradas_v117';

// ─── Lock cooperativo (auditor 5) ─────────────────────────────────────────
// Não é um lock real (atomicidade não é possível em localStorage), mas
// reduz colisões entre abas. Backend resolverá definitivamente em v1.2.
function adquirirLock() {
  if (typeof localStorage === 'undefined') return true;
  const agora = Date.now();
  const existente = localStorage.getItem(LOCK_KEY);
  if (existente) {
    const ts = parseInt(existente, 10);
    if (!Number.isNaN(ts) && agora - ts < LOCK_TTL_MS) return false; // outra aba detém
  }
  localStorage.setItem(LOCK_KEY, String(agora));
  return true;
}
function liberarLock() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(LOCK_KEY);
}

function carregarDoStorage() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function salvarNoStorage(entradas) {
  if (typeof localStorage === 'undefined') return;
  try {
    const limitadas = entradas.slice(-200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitadas));
  } catch {/* quota exceeded — ignora */}
}

// ─── BroadcastChannel para sincronização entre abas ────────────────────────
function criarCanal() {
  if (typeof BroadcastChannel === 'undefined') return null;
  try { return new BroadcastChannel(CHANNEL_NAME); } catch { return null; }
}

/**
 * Hook que expõe a fila de EntradaDado e o emissor.
 */
export function useEntradasStore() {
  const [entradas, setEntradas] = useState(() => carregarDoStorage());
  const canalRef = useRef(null);

  // Cria BroadcastChannel uma vez e escuta mudanças de outras abas
  useEffect(() => {
    canalRef.current = criarCanal();
    if (!canalRef.current) return undefined;

    const onMsg = (ev) => {
      if (ev.data?.tipo === 'entradas_atualizadas') {
        // Recarrega do storage (foi outra aba que escreveu)
        setEntradas(carregarDoStorage());
      }
    };
    canalRef.current.addEventListener('message', onMsg);

    // Sincroniza também via evento 'storage' nativo (mesma origem, abas distintas)
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setEntradas(carregarDoStorage());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
    }

    return () => {
      canalRef.current?.removeEventListener('message', onMsg);
      canalRef.current?.close?.();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
      }
    };
  }, []);

  // Persistência: salva no localStorage e notifica outras abas
  useEffect(() => {
    if (!adquirirLock()) {
      // Outra aba detém o lock; tentamos novamente em 50ms
      const t = setTimeout(() => salvarNoStorage(entradas), 50);
      return () => clearTimeout(t);
    }
    try {
      salvarNoStorage(entradas);
      canalRef.current?.postMessage({ tipo: 'entradas_atualizadas' });
    } finally {
      liberarLock();
    }
  }, [entradas]);

  const emitir = useCallback((args) => {
    if (!args?.pacienteKey) {
      // v1.1.7: rejeita emissão sem chave (antes silenciosamente caía em "-")
      console.error('useEntradasStore.emitir: pacienteKey obrigatória');
      return null;
    }
    let entrada;
    try {
      entrada = criarEntradaDado(args);
    } catch (e) {
      console.error('useEntradasStore.emitir: ' + e.message);
      return null;
    }
    setEntradas(prev => [...prev, entrada]);
    return entrada;
  }, []);

  const entradasPendentes = useCallback((pacienteKey) => {
    if (!pacienteKey) return [];
    return entradas.filter(e => e.pacienteKey === pacienteKey && e.status === 'novo');
  }, [entradas]);

  const marcarProcessada = useCallback((id, resultado) => {
    setEntradas(prev => prev.map(e =>
      e.id === id
        ? {
            ...e,
            status: resultado?.status || 'processado',
            processadoEm: new Date().toISOString(),
            aplicados: resultado?.aplicados || [],
            sugestoes: resultado?.sugestoes || [],
            ignorados: resultado?.ignorados || [],
            contextoAgentes: resultado?.contextoAgentes,
            resumoPaciente: resultado?.resumoPaciente,
            motivoRejeicao: resultado?.motivoRejeicao,
          }
        : e
    ));
  }, []);

  const limparPorPaciente = useCallback((pacienteKey) => {
    if (!pacienteKey) return;
    setEntradas(prev => prev.filter(e => e.pacienteKey !== pacienteKey));
  }, []);

  const limparTudo = useCallback(() => {
    setEntradas([]);
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  }, []);

  return useMemo(() => ({
    entradas, emitir, entradasPendentes, marcarProcessada,
    limparPorPaciente, limparTudo,
  }), [entradas, emitir, entradasPendentes, marcarProcessada, limparPorPaciente, limparTudo]);
}
