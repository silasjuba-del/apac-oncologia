// === src/features/rotas/MedicoCentralValidacao.jsx ===
// APACApp v1.1.8 — Rota /medico/central-validacao
//
// Auditor 7: "A Central Médica não deve ser o motor. Deve ser o painel de
// auditoria. Hoje ela ainda é parcialmente motor."
//
// v1.1.8: Central NÃO processa entradas, NÃO autoexecuta agentes. Apenas
// LÊ o store de resultados (preenchido pelo orquestrador do AppShell) e
// mostra ao médico.

import { useMemo } from 'react';
import AgentesPipeline from '../AgentesPipeline.jsx';

export default function MedicoCentralValidacao({
  pac, up, chamarClaude, pacienteKey,
  entradasStore, resultadosAgentesStore,
}) {
  // entradasPendentes só para exibição/contagem — não para processamento
  const entradasPendentes = useMemo(
    () => entradasStore?.entradasPendentes(pacienteKey) || [],
    [entradasStore, pacienteKey],
  );

  // Resultados dos agentes vêm do store (gravados pelo agentRunner em retroscena)
  const resultadosSalvos = useMemo(
    () => resultadosAgentesStore?.ler(pacienteKey) || null,
    [resultadosAgentesStore, pacienteKey],
  );

  return (
    <AgentesPipeline
      pac={pac}
      up={up}
      chamarClaude={chamarClaude}
      entradasPendentes={entradasPendentes}
      // v1.1.8: passa resultados pré-processados do store
      estadosAgentesPersistidos={resultadosSalvos?.estadosAgentes || null}
      resumoPaciente={resultadosSalvos?.resumoPaciente || null}
      // Para retrocompatibilidade — Pipeline pode marcar manualmente se necessário
      onEntradaProcessada={(resultado) => {
        entradasStore?.marcarProcessada(resultado.id, resultado);
      }}
    />
  );
}
