// === src/features/rotas/useAutomacaoEntradas.js ===
// APACApp v1.1.9 — Orquestrador de automação em RETROSCENA (definitivo)
//
// Auditor 7 (crítica principal v1.1.7): "Os agentes não rodam realmente em
// retroscena se a Central Médica não estiver montada. O runner dos agentes
// precisa sair do componente visual AgentesPipeline.jsx."
//
// Auditor 9 #3.2 (crítica v1.1.8): "Os resultados dos agentes não eram
// aplicados em retroscena — ficavam só no store. A Central acabava virando
// motor de fato porque era ela que aplicava ao abrir."
//
// v1.1.9: AppShell agora aplica automaticamente os campos seguros e salva
// sugestões/conflitos no store de agentes para o médico auditar.
//
// Sequência completa:
//   1. processarEntradasComAcumulador → aplica auto-seguros das entradas
//   2. marcarEntradaProcessada
//   3. executarAgentesLocais → roda em retroscena
//   4. classificarResultadosAgentes → 3 grupos: aplicadosAuto, sugestoes, bloqueios
//   5. aplicarCampoAgenteRetroscena → aplica auto direto via up() COM auditoria
//   6. marcarAgentesProcessados → grava {estados, aplicadosAuto, sugestoes, bloqueios}

import { useEffect, useRef } from 'react';
import {
  processarEntradasComAcumulador,
  chavePaciente,
  classificarResultadosAgentes,
  aplicarCampoAgenteRetroscena,
} from '../oncoProUtils.js';
import { executarAgentesLocais } from '../agentes/agentRunner.js';

export function useAutomacaoEntradas({
  pac, up, entradasStore, resultadosAgentesStore, pacienteKey,
}) {
  const pacKey = pacienteKey || chavePaciente(pac);
  const processadasRef = useRef(new Set());
  const debounceRef = useRef(null);
  const executandoRef = useRef(false);

  useEffect(() => {
    if (!pacKey) return;
    if (!entradasStore) return;

    const pendentes = entradasStore.entradasPendentes(pacKey);
    const novas = pendentes.filter(e => !processadasRef.current.has(e.id));
    if (novas.length === 0) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (executandoRef.current) return;
      executandoRef.current = true;

      try {
        // Marca cedo para evitar reprocessamento em re-render
        novas.forEach(e => processadasRef.current.add(e.id));

        // 1) Processa entradas com acumulador local
        const { acumulado, resultados, contextoAgentes, resumoPaciente } =
          processarEntradasComAcumulador(novas, pac, up);

        // 2) Marca como "entrada_processada"
        resultados.forEach(r => entradasStore.marcarProcessada(r.id, {
          ...r,
          status: 'entrada_processada',
        }));

        // 3) Roda agentes locais EM RETROSCENA
        let resultadoAgentes = null;
        try {
          resultadoAgentes = await executarAgentesLocais({
            pac: acumulado,
            contextoAgentes,
          });
        } catch (e) {
          console.warn('executarAgentesLocais falhou:', e);
        }

        // 4) Classifica resultados (auditor 9 #3.2)
        let aplicadosAuto = [];
        let sugestoes = [];
        let bloqueios = [];
        if (resultadoAgentes?.estados) {
          const classificacao = classificarResultadosAgentes(
            resultadoAgentes.estados,
            acumulado,
          );
          aplicadosAuto = classificacao.aplicadosAuto;
          sugestoes = classificacao.sugestoes;
          bloqueios = classificacao.bloqueios;

          // 5) Aplica campos auto-seguros em retroscena via up() COM auditoria
          aplicadosAuto.forEach(item => {
            aplicarCampoAgenteRetroscena(up, acumulado, item);
          });
        }

        // 6) Marca como agentes_processados
        resultados.forEach(r => entradasStore.marcarProcessada(r.id, {
          ...r,
          status: resultadoAgentes ? 'agentes_processados' : 'agentes_erro',
          motivoAgentes: resultadoAgentes ? null : 'runner_falhou',
        }));

        // Persiste no store de agentes — com classificação completa
        if (resultadoAgentes && resultadosAgentesStore?.gravar) {
          resultadosAgentesStore.gravar(pacKey, {
            estadosAgentes: resultadoAgentes.estados,
            acumulado: resultadoAgentes.acumulado,
            resumoPaciente,
            // v1.1.9 — classificação para a Central exibir sem reclassificar
            aplicadosAutoRetroscena: aplicadosAuto,
            sugestoesClinicas: sugestoes,
            bloqueiosSoberania: bloqueios,
          });
        }
      } finally {
        executandoRef.current = false;
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [pacKey, entradasStore?.entradas?.length, pac, up, entradasStore, resultadosAgentesStore]);

  useEffect(() => {
    processadasRef.current = new Set();
  }, [pacKey]);
}
