// ─────────────────────────────────────────────────────────────────────────────
// clinicalStore.js — ÚNICO portão de salvamento clínico (F0)
//
// REGRA: nenhum componente salva prontuário, APAC, prescrição ou evolução
// diretamente. TUDO passa por saveClinicalArtifact().
//
// Esta função:
//   1. Verifica que patientId + encounterId existem
//   2. Verifica que o paciente ativo bate com o destino
//   3. Verifica que a transição de status é permitida
//   4. Verifica que a origem é rastreável
//   5. Persiste via setDossie (React state) + localStorage
//   6. Se divergência de identidade → quarentena
//
// Dados legados (sem encounterId): leitura permitida, escrita bloqueada.
// ─────────────────────────────────────────────────────────────────────────────

import {
  ARTIFACT_STATUS, ENCOUNTER_STATUS,
  isTransitionAllowed, identityMatches, transitionArtifact,
  getLegacyEncounterId, isLegacyEncounter, snapshotIdentity,
} from './encounterMachine';

// ── Chave de storage ──────────────────────────────────────────────────────────

const ENCOUNTER_STORAGE_KEY = 'apacapp_encounter_ativo_v1';
const ENCOUNTER_HISTORY_KEY = 'apacapp_encounters_historico_v1';

// ── Encounter ativo ───────────────────────────────────────────────────────────

/**
 * openEncounter — registra atendimento como ativo no localStorage.
 * Deve ser chamado quando o médico clica "iniciar atendimento".
 *
 * @param {Object} encounter - objeto criado por createEncounter()
 */
export function openEncounter(encounter) {
  try {
    localStorage.setItem(ENCOUNTER_STORAGE_KEY, JSON.stringify(encounter));
  } catch (_) {
    // localStorage cheio ou indisponível — não travar o atendimento
  }
}

/**
 * getActiveEncounter — retorna o atendimento ativo ou null.
 * @returns {Object|null}
 */
export function getActiveEncounter() {
  try {
    const raw = localStorage.getItem(ENCOUNTER_STORAGE_KEY);
    if (!raw) return null;
    const enc = JSON.parse(raw);
    if (enc?.status === ENCOUNTER_STATUS.CLOSED ||
        enc?.status === ENCOUNTER_STATUS.QUARANTINED) return null;
    return enc;
  } catch (_) {
    return null;
  }
}

/**
 * closeEncounter — fecha o atendimento ativo e adiciona ao histórico.
 */
export function closeEncounter() {
  try {
    const enc = getActiveEncounter();
    if (!enc) return;
    const closed = { ...enc, status: ENCOUNTER_STATUS.CLOSED, fechadaEm: new Date().toISOString() };
    // Salva no histórico
    const hist = JSON.parse(localStorage.getItem(ENCOUNTER_HISTORY_KEY) || '[]');
    hist.unshift(closed);
    localStorage.setItem(ENCOUNTER_HISTORY_KEY, JSON.stringify(hist.slice(0, 200)));
    // Remove o ativo
    localStorage.removeItem(ENCOUNTER_STORAGE_KEY);
  } catch (_) {}
}

/**
 * quarantineEncounter — envia atendimento para quarentena por divergência.
 * @param {string} motivo
 */
export function quarantineEncounter(motivo) {
  try {
    const enc = getActiveEncounter();
    if (!enc) return;
    const q = { ...enc, status: ENCOUNTER_STATUS.QUARANTINED, motivoQuarentena: motivo, quarentenaEm: new Date().toISOString() };
    localStorage.setItem(ENCOUNTER_STORAGE_KEY, JSON.stringify(q));
  } catch (_) {}
}

// ── Portão único de salvamento ────────────────────────────────────────────────

/**
 * saveClinicalArtifact — único escritor de dados clínicos.
 *
 * Retorna:
 *   { ok: true,  artifact }  — salvamento bem-sucedido
 *   { ok: false, reason, quarantined? }  — bloqueado com motivo
 *
 * @param {Object}   artifact  - objeto criado por createArtifact()
 * @param {Object}   dossie    - dossiê atual
 * @param {Object}   pac       - paciente ativo
 * @param {Function} setDossie - setter React do dossiê (setDossieGuardado)
 * @param {Object}   [opts]
 * @param {string}   [opts.newStatus]  - transição de status desejada
 * @param {boolean}  [opts.forceSave]  - override para uso interno (somente testes)
 */
export function saveClinicalArtifact(artifact, dossie, pac, setDossie, opts = {}) {
  const { newStatus, forceSave } = opts;

  // ── 1. Verificar patientId + encounterId ──────────────────────────────────
  if (!artifact?.patientId) {
    return { ok: false, reason: 'saveClinicalArtifact: patientId ausente no artefato.' };
  }
  if (!artifact?.encounterId) {
    return { ok: false, reason: 'saveClinicalArtifact: encounterId ausente. Inicie um atendimento primeiro.' };
  }

  // ── 2. Dados legados: leitura ok, nova escrita bloqueada ──────────────────
  if (!forceSave && isLegacyEncounter(artifact.encounterId)) {
    return {
      ok:     false,
      reason: 'saveClinicalArtifact: artefato com encounterId legado. Abra um novo atendimento para salvar.',
      legacy: true,
    };
  }

  // ── 3. Verificar identidade ───────────────────────────────────────────────
  const idCheck = identityMatches(artifact.identitySnapshot, pac);
  if (!idCheck.ok && !idCheck.legacy) {
    // Divergência real → quarentena
    quarantineEncounter(idCheck.motivo);
    const quarantined = transitionArtifact(artifact, ARTIFACT_STATUS.QUARANTINED);
    return {
      ok:           false,
      reason:       `Identidade divergente: ${idCheck.motivo}`,
      quarantined:  true,
      artifact:     quarantined,
    };
  }

  // ── 4. Verificar transição de status ─────────────────────────────────────
  let finalArtifact = artifact;
  if (newStatus && newStatus !== artifact.status) {
    if (!isTransitionAllowed(artifact.status, newStatus, artifact.artifactType)) {
      return {
        ok:     false,
        reason: `Transição "${artifact.status}" → "${newStatus}" não permitida para "${artifact.artifactType}".`,
      };
    }
    finalArtifact = transitionArtifact(artifact, newStatus);
  }

  // ── 5. Verificar origem rastreável ────────────────────────────────────────
  if (!finalArtifact.source) {
    return { ok: false, reason: 'saveClinicalArtifact: campo source ausente (rastreabilidade obrigatória).' };
  }

  // ── 6. Persistir via setDossie ────────────────────────────────────────────
  if (typeof setDossie === 'function') {
    try {
      setDossie(prev => mergeArtifactIntoDossie(prev, finalArtifact));
    } catch (err) {
      return { ok: false, reason: `Erro ao persistir dossiê: ${err.message}` };
    }
  }

  return { ok: true, artifact: finalArtifact };
}

// ── Merge de artefato no dossiê ────────────────────────────────────────────────

function mergeArtifactIntoDossie(dossie, artifact) {
  if (!dossie) return dossie;
  const updated = { ...dossie, updatedAt: new Date().toISOString() };

  switch (artifact.artifactType) {
    case 'evolucao':
      updated.evolucao = {
        ...(dossie.evolucao || {}),
        rascunho:    artifact.status === ARTIFACT_STATUS.RECEPCAO_DRAFT || artifact.status === ARTIFACT_STATUS.IA_DRAFT
                       ? artifact.content
                       : (dossie.evolucao?.rascunho || ''),
        textoFinal:  artifact.status === ARTIFACT_STATUS.MEDICAL_SIGNED
                       ? artifact.content
                       : (dossie.evolucao?.textoFinal || ''),
        status:      artifact.status,
        artifactId:  artifact.artifactId,
        salvaEm:     new Date().toISOString(),
      };
      break;

    case 'prescricao':
      updated.prescricao = {
        ...(dossie.prescricao || {}),
        ...artifact.content,
        status:     artifact.status,
        artifactId: artifact.artifactId,
        salvaEm:    new Date().toISOString(),
      };
      break;

    case 'apac':
      updated.apac = {
        ...(dossie.apac || {}),
        ...artifact.content,
        status:     artifact.status,
        artifactId: artifact.artifactId,
        salvaEm:    new Date().toISOString(),
      };
      break;

    case 'documento':
      updated.documentos = [
        artifact,
        ...(dossie.documentos || []).filter(d => d.artifactId !== artifact.artifactId),
      ];
      break;

    default:
      // Outros tipos: armazenar em documentosGerados
      updated.documentosGerados = [
        artifact,
        ...(dossie.documentosGerados || []).filter(d => d.artifactId !== artifact.artifactId),
      ];
  }

  // Vincular encounterId ao dossiê se ainda não tiver
  if (!updated.encounterId) {
    updated.encounterId = artifact.encounterId;
  }

  return updated;
}

// ── Guard de encounter ────────────────────────────────────────────────────────

/**
 * requireEncounter — verifica se há um atendimento ativo.
 * Retorna o encounter ou objeto com erro.
 *
 * @param {Object} pac - paciente ativo
 * @returns {{ ok: boolean, encounter?, reason? }}
 */
export function requireEncounter(pac) {
  const encounter = getActiveEncounter();

  if (!encounter) {
    return { ok: false, reason: 'Nenhum atendimento aberto. Inicie um atendimento antes de salvar.' };
  }

  if (encounter.status !== ENCOUNTER_STATUS.OPEN) {
    return { ok: false, reason: `Atendimento com status "${encounter.status}" — não aceita novos artefatos.` };
  }

  const pacId = pac?.pacID || pac?.cpf || pac?.cns;
  if (pacId && encounter.patientId && String(encounter.patientId) !== String(pacId)) {
    return {
      ok:     false,
      reason: `Atendimento aberto para paciente "${encounter.patientId}", mas paciente ativo é "${pacId}". Feche o atendimento atual primeiro.`,
    };
  }

  return { ok: true, encounter };
}

/**
 * buildLegacyArtifact — cria artefato compatível para dados legados.
 * Permite que dossiês antigos sejam lidos sem encounterId real.
 *
 * @param {Object} dossie
 * @param {Object} pac
 * @returns {Object} artifact com encounterId legado
 */
export function buildLegacyArtifact(dossie, pac) {
  const patientId  = pac?.pacID || pac?.cpf || pac?.cns || 'desconhecido';
  const encounterId = getLegacyEncounterId(patientId, dossie?.id);
  return {
    artifactId:       'LEGACY-' + (dossie?.id || Date.now()),
    encounterId,
    patientId,
    artifactType:     'evolucao',
    status:           ARTIFACT_STATUS.MEDICAL_SIGNED, // legado = considerado assinado
    source:           'medico',
    content:          dossie?.evolucao?.textoFinal || dossie?.evolucao?.rascunho || '',
    identitySnapshot: snapshotIdentity(pac),
    createdAt:        dossie?.createdAt || new Date().toISOString(),
    updatedAt:        dossie?.updatedAt || new Date().toISOString(),
    createdBy:        'medico',
    isLegacy:         true,
  };
}
