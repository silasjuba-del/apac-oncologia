// === src/features/agentes/useAgentesResultadoStore.js ===
// APACApp v1.1.8 — Persistência de resultados dos agentes por paciente
//
// Auditor 7: "Os resultados dos agentes vivem dentro do estado local de
// AgentesPipeline.jsx. Se a Central desmontar, os resultados somem.
// Isso é incompatível com automação em retroscena."
//
// v1.1.8: hook que persiste resultados dos agentes em localStorage por
// pacienteKey. Quando o médico abre a Central, vê o que JÁ foi processado
// — mesmo se nunca abriu a Central antes para esse paciente.

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'apacapp_resultados_agentes_v118';

function carregar() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : {};
  } catch { return {}; }
}

function salvar(map) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {/* quota — ignora */}
}

/**
 * Hook de store de resultados de agentes por pacienteKey.
 *
 * Estrutura por paciente:
 * {
 *   estadosAgentes: { [agenteId]: { status, mensagem, campos, confianca } },
 *   atualizadoEm: ISO,
 * }
 */
export function useAgentesResultadoStore() {
  const [mapa, setMapa] = useState(() => carregar());

  useEffect(() => { salvar(mapa); }, [mapa]);

  const gravar = useCallback((pacienteKey, payload) => {
    if (!pacienteKey) return;
    setMapa(m => ({
      ...m,
      [pacienteKey]: {
        ...payload,
        atualizadoEm: new Date().toISOString(),
      },
    }));
  }, []);

  const ler = useCallback((pacienteKey) => {
    if (!pacienteKey) return null;
    return mapa[pacienteKey] || null;
  }, [mapa]);

  const limpar = useCallback((pacienteKey) => {
    if (!pacienteKey) return;
    setMapa(m => {
      const novo = { ...m };
      delete novo[pacienteKey];
      return novo;
    });
  }, []);

  return { gravar, ler, limpar };
}
