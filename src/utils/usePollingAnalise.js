// src/utils/usePollingAnalise.js
// C5d: hook de polling para aguardar análise Claude do check-in
// Usa useRef para evitar múltiplos intervalos ao trocar de paciente.

import { useEffect, useRef, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";   // ex: https://onco-backend.onrender.com

/**
 * usePollingAnalise
 *
 * @param {object} options
 * @param {number|null} options.pacienteId   - ID do paciente no backend SQLite
 * @param {string}      options.analiseStatus - status atual ("pendente"|"processando"|"concluida"|"erro")
 * @param {function}    options.onConcluida  - callback({ resumoEvolucao }) quando análise termina
 * @param {function}    options.onErro       - callback(mensagem) quando análise falha
 */
export function usePollingAnalise({ pacienteId, analiseStatus, onConcluida, onErro }) {
  const intervalRef = useRef(null);

  const parar = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Só faz polling se tiver backend configurado e análise ainda em curso
    if (!API_URL || !pacienteId) return;
    if (analiseStatus === "concluida" || analiseStatus === "erro") return;
    if (analiseStatus !== "processando" && analiseStatus !== "pendente") return;

    parar(); // garante que não haja intervalo anterior rodando

    intervalRef.current = setInterval(async () => {
      try {
        const s = await fetch(`${API_URL}/api/medico/analise-status/${pacienteId}`)
          .then(r => r.json());

        if (s.analise_status === "concluida") {
          parar();
          // Buscar prontuário atualizado com o resumoEvolucao
          const atualizado = await fetch(`${API_URL}/api/medico/prontuario/${pacienteId}`)
            .then(r => r.json());
          onConcluida?.(atualizado);

        } else if (s.analise_status === "erro") {
          parar();
          onErro?.(s.analise_erro || "Falha na análise automática. Faça a evolução manualmente.");
        }
      } catch {
        // Rede indisponível — parar polling silenciosamente
        parar();
      }
    }, 4000);

    return parar; // cleanup ao desmontar ou mudar dependências
  }, [pacienteId, analiseStatus, parar, onConcluida, onErro]);

  return { parar };
}
