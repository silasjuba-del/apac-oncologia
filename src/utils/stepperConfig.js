// ─────────────────────────────────────────────────────────────────────────────
// stepperConfig.js — Contrato de etapas do StepperMedico (F2)
//
// REGRA: o tipo de consulta é selecionado na etapa zero.
// Cada tipo tem seu próprio fluxo de etapas.
//
// Arquivo de funções puras — sem dependências externas, totalmente testável.
// ─────────────────────────────────────────────────────────────────────────────

import { ENCOUNTER_TIPOS, ENCOUNTER_TIPO_LABELS } from './encounterMachine';

// ── Definição de etapas por tipo de consulta ─────────────────────────────────

/**
 * ETAPAS_POR_TIPO — mapa de etapas para cada tipo de atendimento.
 *
 * Regras de negócio:
 *  - Toda sequência começa com 'tipo' (etapa 0) e termina com 'concluir'
 *  - RETORNO_QT: obrigatório 'validar' (score anti-glosa antes de imprimir APAC)
 *  - PRIMEIRA_CONSULTA: obrigatório 'apac' (APAC inicial do SUS)
 *  - RETORNO_CLINICO: sem 'validar' obrigatório (consulta clínica pura)
 *  - INTERCORRENCIA: sem APAC (fluxo de urgência)
 */
export const ETAPAS_POR_TIPO = {
  [ENCOUNTER_TIPOS.RETORNO_QT]: [
    { id: 'tipo',     icone: '👆', label: 'Tipo'            },
    { id: 'paciente', icone: '👤', label: 'Paciente'        },
    { id: 'evolucao', icone: '🧠', label: 'Evolução IA'     },
    { id: 'validar',  icone: '✅', label: 'Validar APAC'    },
    { id: 'apac',     icone: '📋', label: 'APAC / QT'       },
    { id: 'concluir', icone: '🏁', label: 'Concluir'        },
  ],
  [ENCOUNTER_TIPOS.PRIMEIRA_CONSULTA]: [
    { id: 'tipo',     icone: '👆', label: 'Tipo'            },
    { id: 'paciente', icone: '👤', label: 'Paciente'        },
    { id: 'evolucao', icone: '🧠', label: 'Anamnese IA'     },
    { id: 'apac',     icone: '📋', label: 'APAC Inicial'    },
    { id: 'concluir', icone: '🏁', label: 'Concluir'        },
  ],
  [ENCOUNTER_TIPOS.RETORNO_CLINICO]: [
    { id: 'tipo',     icone: '👆', label: 'Tipo'            },
    { id: 'paciente', icone: '👤', label: 'Paciente'        },
    { id: 'evolucao', icone: '🧠', label: 'Evolução IA'     },
    { id: 'concluir', icone: '🏁', label: 'Concluir'        },
  ],
  [ENCOUNTER_TIPOS.INTERCORRENCIA]: [
    { id: 'tipo',     icone: '👆', label: 'Tipo'            },
    { id: 'paciente', icone: '👤', label: 'Paciente'        },
    { id: 'conduta',  icone: '⚡', label: 'Conduta Urgente' },
    { id: 'concluir', icone: '🏁', label: 'Concluir'        },
  ],
};

// ── Tipo default quando não há seleção ───────────────────────────────────────

export const TIPO_DEFAULT = ENCOUNTER_TIPOS.RETORNO_QT;

// ── Getter de etapas ──────────────────────────────────────────────────────────

/**
 * getEtapas — retorna array de etapas para o tipo de consulta dado.
 * Retorna RETORNO_QT como default para tipos inválidos.
 *
 * @param {string} tipo - ENCOUNTER_TIPOS.*
 * @returns {Array<{ id: string, icone: string, label: string }>}
 */
export function getEtapas(tipo) {
  return ETAPAS_POR_TIPO[tipo] || ETAPAS_POR_TIPO[TIPO_DEFAULT];
}

/**
 * getMaxStep — retorna o índice da última etapa para um tipo.
 * @param {string} tipo
 * @returns {number}
 */
export function getMaxStep(tipo) {
  return getEtapas(tipo).length - 1;
}

/**
 * temEtapa — verifica se um tipo de consulta inclui uma etapa específica.
 * @param {string} tipo
 * @param {string} etapaId
 * @returns {boolean}
 */
export function temEtapa(tipo, etapaId) {
  return getEtapas(tipo).some(e => e.id === etapaId);
}

/**
 * indexEtapa — retorna o índice de uma etapa num tipo de consulta.
 * Retorna -1 se não existir.
 * @param {string} tipo
 * @param {string} etapaId
 * @returns {number}
 */
export function indexEtapa(tipo, etapaId) {
  return getEtapas(tipo).findIndex(e => e.id === etapaId);
}

// ── Regras de negócio por etapa ───────────────────────────────────────────────

/**
 * etapaRequerEncounter — etapas que exigem encounter aberto para avançar.
 * Todas as etapas clínicas (após 'tipo') requerem encounter.
 */
export const ETAPAS_REQUEREM_ENCOUNTER = new Set([
  'evolucao', 'validar', 'apac', 'conduta', 'concluir',
]);

/**
 * etapaRequerPaciente — etapas que exigem paciente identificado.
 */
export const ETAPAS_REQUEREM_PACIENTE = new Set([
  'paciente', 'evolucao', 'validar', 'apac', 'conduta', 'concluir',
]);

/**
 * podeAvancar — verifica se o stepper pode avançar da etapa atual.
 *
 * @param {{ step: number, tipo: string, temPaciente: boolean, temEncounter: boolean }} opts
 * @returns {{ ok: boolean, motivo?: string }}
 */
export function podeAvancar({ step, tipo, temPaciente, temEncounter }) {
  const etapas  = getEtapas(tipo);
  const etapaId = etapas[step]?.id;

  if (!etapaId) return { ok: false, motivo: 'Etapa inválida.' };

  // Etapa tipo: precisa de tipo selecionado (sempre ok pois o tipo é o próprio estado)
  if (etapaId === 'tipo') return { ok: true };

  // Etapas clínicas: precisam de paciente
  if (ETAPAS_REQUEREM_PACIENTE.has(etapaId) && !temPaciente) {
    return { ok: false, motivo: 'Selecione um paciente antes de continuar.' };
  }

  // Etapas clínicas (exceto paciente): precisam de encounter aberto
  if (ETAPAS_REQUEREM_ENCOUNTER.has(etapaId) && !temEncounter) {
    return { ok: false, motivo: 'Inicie um atendimento antes de continuar.' };
  }

  return { ok: true };
}

// ── Re-exportar labels para uso no seletor de tipo ───────────────────────────

export { ENCOUNTER_TIPOS, ENCOUNTER_TIPO_LABELS };
