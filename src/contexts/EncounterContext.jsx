// ─────────────────────────────────────────────────────────────────────────────
// EncounterContext.jsx — Contexto React do atendimento ativo (F0)
//
// Expõe o encounter ativo para toda a árvore React.
// Nenhum componente persiste diretamente — usa saveClinicalArtifact().
//
// Hook público: useEncounter()
//
// Exemplo de uso:
//   const { encounter, openEncounterSession, closeEncounterSession } = useEncounter();
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  openEncounter   as storeOpen,
  getActiveEncounter,
  closeEncounter  as storeClose,
  quarantineEncounter as storeQuarantine,
  saveClinicalArtifact as storeSave,
  requireEncounter,
} from '../utils/clinicalStore';
import {
  createEncounter,
  ENCOUNTER_TIPOS,
  ENCOUNTER_STATUS,
} from '../utils/encounterMachine';

// ── Contexto ──────────────────────────────────────────────────────────────────

const EncounterContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * EncounterProvider — envolve a aplicação (ou pelo menos a área médica).
 * Deve ficar acima de StepperMedico e qualquer componente que salve dados clínicos.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function EncounterProvider({ children }) {
  const [encounter, setEncounter] = useState(() => getActiveEncounter());

  // Sincroniza com localStorage ao montar (ex: refresh de página)
  useEffect(() => {
    const active = getActiveEncounter();
    setEncounter(active);
  }, []);

  /**
   * openEncounterSession — inicia um novo atendimento.
   *
   * @param {string} patientId - pac.pacID || pac.cpf || pac.cns
   * @param {string} tipo      - ENCOUNTER_TIPOS.*
   * @param {string} [medicoId]
   * @returns {Object} encounter criado
   */
  const openEncounterSession = useCallback((patientId, tipo, medicoId) => {
    const enc = createEncounter(patientId, tipo, medicoId);
    storeOpen(enc);
    setEncounter(enc);
    return enc;
  }, []);

  /**
   * closeEncounterSession — fecha o atendimento ativo.
   */
  const closeEncounterSession = useCallback(() => {
    storeClose();
    setEncounter(null);
  }, []);

  /**
   * quarantineSession — coloca o atendimento em quarentena (divergência de identidade).
   * @param {string} motivo
   */
  const quarantineSession = useCallback((motivo) => {
    storeQuarantine(motivo);
    setEncounter(prev => prev ? { ...prev, status: ENCOUNTER_STATUS.QUARANTINED } : null);
  }, []);

  /**
   * saveArtifact — portão único de salvamento para componentes React.
   * Delega para saveClinicalArtifact e atualiza contexto se quarentena.
   *
   * @param {Object}   artifact
   * @param {Object}   dossie
   * @param {Object}   pac
   * @param {Function} setDossie
   * @param {Object}   [opts]
   * @returns {{ ok: boolean, artifact?, reason?, quarantined? }}
   */
  const saveArtifact = useCallback((artifact, dossie, pac, setDossie, opts = {}) => {
    const result = storeSave(artifact, dossie, pac, setDossie, opts);
    if (result.quarantined) {
      // Sincronizar estado React com quarentena aplicada pelo storeSave
      setEncounter(prev => prev ? { ...prev, status: ENCOUNTER_STATUS.QUARANTINED } : null);
    }
    return result;
  }, []);

  /**
   * checkEncounter — verifica se há encounter ativo para o paciente dado.
   * Útil para guards de componente antes de tentar salvar.
   *
   * @param {Object} pac
   * @returns {{ ok: boolean, encounter?, reason? }}
   */
  const checkEncounter = useCallback((pac) => {
    return requireEncounter(pac);
  }, []);

  const value = {
    // Estado
    encounter,
    isOpen:       encounter?.status === ENCOUNTER_STATUS.OPEN,
    isQuarantined: encounter?.status === ENCOUNTER_STATUS.QUARANTINED,

    // Ações
    openEncounterSession,
    closeEncounterSession,
    quarantineSession,
    saveArtifact,
    checkEncounter,

    // Constantes re-exportadas para conveniência dos consumers
    ENCOUNTER_TIPOS,
    ENCOUNTER_STATUS,
  };

  return (
    <EncounterContext.Provider value={value}>
      {children}
    </EncounterContext.Provider>
  );
}

// ── Hook público ──────────────────────────────────────────────────────────────

/**
 * useEncounter — hook para consumir o contexto de atendimento.
 *
 * @throws {Error} se usado fora do EncounterProvider
 * @returns {Object} valor do EncounterContext
 */
export function useEncounter() {
  const ctx = useContext(EncounterContext);
  if (!ctx) {
    throw new Error('useEncounter deve ser usado dentro de <EncounterProvider>');
  }
  return ctx;
}

export default EncounterContext;
