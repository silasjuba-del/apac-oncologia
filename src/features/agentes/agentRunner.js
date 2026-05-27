// === src/features/agentes/agentRunner.js ===
// APACApp v1.1.8 — Runner de agentes independente de React (auditor 7)
//
// CORREÇÃO ARQUITETURAL: a v1.1.7 mantinha a execução dos agentes dentro do
// componente AgentesPipeline.jsx. Resultado: agentes só rodavam quando a
// Central Médica estava montada. Não era automação real.
//
// v1.1.8: este módulo roda os agentes em retroscena, no AppShell, sem
// depender de nenhum componente React estar visível. Quando o médico abre
// a Central, ele encontra os resultados PROVENIENTES daqui (via store).

import { AGENTES } from '../AgentesPipeline.jsx';
import { TIPO_AGENTE_LOCAL, TIPO_AGENTE_IA } from '../oncoProUtils.js';
import { requireEncounter } from '../../utils/clinicalStore';

/**
 * Executa os agentes LOCAIS (não IA) em sequência com acumulador local.
 *
 * @param pac               paciente base
 * @param contextoAgentes   campos `_xxx` vindos da fila (ex: _texto_laudos)
 * @returns { acumulado, estados }
 */
export async function executarAgentesLocais({ pac, contextoAgentes = {} } = {}) {
  let acumulado = { ...(pac || {}), ...contextoAgentes };
  const estados = {};

  for (const agente of AGENTES.filter(a => a.tipo === TIPO_AGENTE_LOCAL)) {
    if (!agente.condicaoPara(acumulado)) {
      estados[agente.id] = {
        status: 'aguardando',
        mensagem: 'Pré-requisitos faltando',
      };
      continue;
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      const r = await agente.executar(acumulado, {});
      if (r.sucesso && r.campos) {
        Object.assign(acumulado, r.campos);
      }
      estados[agente.id] = {
        status: r.sucesso ? 'concluido' : 'falhou',
        mensagem: r.mensagem,
        campos: r.campos || {},
        confianca: r.confianca,
        destinatario: r.destinatario,
      };
    } catch (e) {
      estados[agente.id] = {
        status: 'falhou',
        mensagem: 'Erro: ' + (e?.message || String(e)),
      };
    }
  }

  return { acumulado, estados };
}

/**
 * Executa agentes IA. Exige consentimento e chamarClaude.
 */
export async function executarAgentesIA({
  pac, contextoAgentes = {}, chamarClaude, consentimentoIA = false,
} = {}) {
  if (!consentimentoIA) {
    return { acumulado: pac, estados: {}, motivo: 'sem_consentimento' };
  }
  if (typeof chamarClaude !== 'function') {
    return { acumulado: pac, estados: {}, motivo: 'sem_chamarClaude' };
  }

  // F0 gate — agentes IA clínicos requerem encounter aberto.
  // Sem isso, dados gerados pela IA não têm encounterId e não podem
  // ser salvos via saveClinicalArtifact (bloqueado sem encounter).
  const encCheck = requireEncounter(pac);
  if (!encCheck.ok) {
    console.warn('[agentRunner] Pipeline IA bloqueado — sem encounter ativo:', encCheck.reason);
    return { acumulado: pac, estados: {}, motivo: 'sem_encounter', reason: encCheck.reason };
  }

  let acumulado = { ...(pac || {}), ...contextoAgentes };
  const estados = {};
  const ctx = { chamarClaude };

  for (const agente of AGENTES.filter(a => a.tipo === TIPO_AGENTE_IA)) {
    if (!agente.condicaoPara(acumulado)) {
      estados[agente.id] = { status: 'aguardando', mensagem: 'Pré-requisitos faltando' };
      continue;
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      const r = await agente.executar(acumulado, ctx);
      if (r.sucesso && r.campos) Object.assign(acumulado, r.campos);
      estados[agente.id] = {
        status: r.sucesso ? 'concluido' : 'falhou',
        mensagem: r.mensagem,
        campos: r.campos || {},
        confianca: r.confianca,
        destinatario: r.destinatario,
      };
    } catch (e) {
      estados[agente.id] = {
        status: 'falhou',
        mensagem: 'Erro IA: ' + (e?.message || String(e)),
      };
    }
  }

  return { acumulado, estados };
}
