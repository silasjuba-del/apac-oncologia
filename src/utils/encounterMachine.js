// ─────────────────────────────────────────────────────────────────────────────
// encounterMachine.js — Contrato de identidade clínica (F0)
//
// Define os tipos, estados e transições da entidade "atendimento" (encounter).
// Arquivo de funções puras — sem dependências externas, totalmente testável.
//
// Conceitos:
//   encounter  = um atendimento: quem, quando, qual tipo, qual status
//   artifact   = qualquer documento gerado neste atendimento:
//                evolução, prescrição, APAC, solicitação, receita
//
// Regra central:
//   Todo salvamento clínico deve carregar patientId + encounterId.
//   Se não tiver os dois → bloqueado por saveClinicalArtifact().
// ─────────────────────────────────────────────────────────────────────────────

// ── Tipos de atendimento ──────────────────────────────────────────────────────

export const ENCOUNTER_TIPOS = {
  PRIMEIRA_CONSULTA: 'primeira_consulta',
  RETORNO_QT:        'retorno_qt',
  RETORNO_CLINICO:   'retorno_clinico',
  INTERCORRENCIA:    'intercorrencia',
};

export const ENCOUNTER_TIPO_LABELS = {
  primeira_consulta: 'Primeira Consulta',
  retorno_qt:        'Retorno QT',
  retorno_clinico:   'Retorno Clínico',
  intercorrencia:    'Intercorrência',
};

// ── Estados do atendimento ────────────────────────────────────────────────────

export const ENCOUNTER_STATUS = {
  OPEN:        'open',       // atendimento em andamento
  CLOSING:     'closing',    // médico assinou tudo, aguardando fechamento formal
  CLOSED:      'closed',     // atendimento encerrado
  QUARANTINED: 'quarantined',// identidade divergente — fora do fluxo
};

// ── Estados dos artefatos clínicos ────────────────────────────────────────────

export const ARTIFACT_STATUS = {
  RECEPCAO_DRAFT:    'recepcao_draft',    // gerado por recepção/formulário
  IA_DRAFT:          'ia_draft',          // processado pelo orquestrador IA
  MEDICAL_VALIDATED: 'medical_validated', // médico revisou, ainda não assinou
  MEDICAL_SIGNED:    'medical_signed',    // evolução/prescrição definitiva
  CLOSED:            'closed',            // atendimento encerrado, somente leitura
  QUARANTINED:       'quarantined',       // identidade divergente — quarentena
};

// ── Tipos de artefatos ────────────────────────────────────────────────────────

export const ARTIFACT_TYPES = {
  EVOLUCAO:    'evolucao',
  PRESCRICAO:  'prescricao',
  APAC:        'apac',
  DOCUMENTO:   'documento',
  EXAME:       'exame',
  RECEITA:     'receita',
  TRIAGEM:     'triagem',
};

// ── Fontes de origem ──────────────────────────────────────────────────────────

export const ARTIFACT_SOURCES = {
  RECEPCAO: 'recepcao',
  MEDICO:   'medico',
  PACIENTE: 'paciente',
  IA:       'ia',
  UPLOAD:   'upload',
  DRIVE:    'drive',
};

// ── Máquina de estados: transições permitidas ─────────────────────────────────
//
// Matriz: fromStatus → toStatus → boolean
// Certas transições dependem também do tipo de artefato (ex: PRESCRICAO não
// pode ir de ia_draft direto para medical_signed sem validated).

const TRANSITION_MATRIX = {
  recepcao_draft: {
    ia_draft:          true,
    medical_validated: true,   // médico abre diretamente da recepção
    medical_signed:    false,  // NUNCA: recepção não assina evolução
    closed:            false,
    quarantined:       true,
  },
  ia_draft: {
    medical_validated: true,
    medical_signed:    false,  // sempre passa por validated antes
    recepcao_draft:    false,
    closed:            false,
    quarantined:       true,
  },
  medical_validated: {
    medical_signed:    true,
    ia_draft:          true,   // médico descarta e pede nova análise IA
    recepcao_draft:    false,
    closed:            false,
    quarantined:       true,
  },
  medical_signed: {
    closed:            true,
    medical_validated: false,  // assinado não volta para draft (auditoria)
    ia_draft:          false,
    recepcao_draft:    false,
    quarantined:       true,   // caso extremo: divergência pós-assinatura
  },
  closed: {
    quarantined:       true,   // único caminho: suspeita de contaminação
    // nada mais é permitido em artefato fechado
  },
  quarantined: {
    // estado terminal — nenhuma transição automática
    // requer intervenção manual
  },
};

/**
 * isTransitionAllowed — verifica se uma transição de status é permitida.
 *
 * @param {string} fromStatus - status atual do artefato
 * @param {string} toStatus   - status desejado
 * @param {string} [artifactType] - tipo do artefato (restrições adicionais)
 * @returns {boolean}
 */
export function isTransitionAllowed(fromStatus, toStatus, artifactType) {
  const allowed = TRANSITION_MATRIX[fromStatus]?.[toStatus] ?? false;
  if (!allowed) return false;

  // Restrições adicionais por tipo de artefato
  if (artifactType === ARTIFACT_TYPES.PRESCRICAO) {
    // Prescrição nunca pula medical_validated
    if (fromStatus === ARTIFACT_STATUS.IA_DRAFT &&
        toStatus   === ARTIFACT_STATUS.MEDICAL_SIGNED) return false;
  }

  return true;
}

// ── Criação de entidades ───────────────────────────────────────────────────────

/**
 * createEncounter — cria um novo atendimento.
 *
 * @param {string} patientId  - ID do paciente (pac.pacID || pac.cpf || pac.cns)
 * @param {string} tipo       - ENCOUNTER_TIPOS.*
 * @param {string} [medicoId] - ID do médico (padrão: 'silas' da EQUIPE)
 * @returns {Object} encounter
 */
export function createEncounter(patientId, tipo, medicoId = 'silas') {
  if (!patientId) throw new Error('createEncounter: patientId obrigatório');
  if (!Object.values(ENCOUNTER_TIPOS).includes(tipo)) {
    throw new Error(`createEncounter: tipo inválido "${tipo}"`);
  }

  return {
    encounterId: generateEncounterId(tipo),
    patientId:   String(patientId),
    tipo,
    status:      ENCOUNTER_STATUS.OPEN,
    abertaEm:    new Date().toISOString(),
    fechadaEm:   null,
    medicoId,
    updatedAt:   new Date().toISOString(),
  };
}

/**
 * createArtifact — cria um artefato clínico vinculado a um atendimento.
 *
 * @param {Object} opts
 * @param {string} opts.encounterId
 * @param {string} opts.patientId
 * @param {string} opts.artifactType - ARTIFACT_TYPES.*
 * @param {string} opts.source       - ARTIFACT_SOURCES.*
 * @param {Object} opts.pac          - dados do paciente (para identitySnapshot)
 * @param {*}      [opts.content]    - conteúdo do artefato
 * @returns {Object} artifact
 */
export function createArtifact({ encounterId, patientId, artifactType, source, pac, content }) {
  if (!encounterId) throw new Error('createArtifact: encounterId obrigatório');
  if (!patientId)   throw new Error('createArtifact: patientId obrigatório');
  if (!ARTIFACT_TYPES[artifactType?.toUpperCase()] && !Object.values(ARTIFACT_TYPES).includes(artifactType)) {
    throw new Error(`createArtifact: artifactType inválido "${artifactType}"`);
  }

  // Status inicial depende da fonte
  const initialStatus = source === ARTIFACT_SOURCES.IA
    ? ARTIFACT_STATUS.IA_DRAFT
    : source === ARTIFACT_SOURCES.RECEPCAO || source === ARTIFACT_SOURCES.PACIENTE
      ? ARTIFACT_STATUS.RECEPCAO_DRAFT
      : ARTIFACT_STATUS.IA_DRAFT;

  return {
    artifactId:        generateArtifactId(artifactType),
    encounterId:       String(encounterId),
    patientId:         String(patientId),
    artifactType,
    status:            initialStatus,
    source,
    content:           content ?? null,
    identitySnapshot:  snapshotIdentity(pac),
    createdAt:         new Date().toISOString(),
    updatedAt:         new Date().toISOString(),
    createdBy:         'medico', // expandir para multi-usuário futuramente
  };
}

/**
 * transitionArtifact — tenta transicionar um artefato para novo status.
 * Retorna o artefato atualizado ou lança erro se transição não permitida.
 *
 * @param {Object} artifact
 * @param {string} newStatus
 * @returns {Object} artifact com novo status
 * @throws {Error} se transição não for permitida
 */
export function transitionArtifact(artifact, newStatus) {
  if (!isTransitionAllowed(artifact.status, newStatus, artifact.artifactType)) {
    throw new Error(
      `transitionArtifact: transição "${artifact.status}" → "${newStatus}" ` +
      `não permitida para tipo "${artifact.artifactType}"`
    );
  }
  return {
    ...artifact,
    status:    newStatus,
    updatedAt: new Date().toISOString(),
  };
}

// ── Snapshot de identidade ────────────────────────────────────────────────────

/**
 * snapshotIdentity — captura identidade mínima do paciente no momento do save.
 * Usado para auditoria forense: se identidade do artefato diferir do paciente
 * ativo no futuro, o snapshot revela quando a divergência começou.
 *
 * NÃO armazena CNS/CPF completos — apenas parciais para rastreio sem expor PII.
 *
 * @param {Object} pac
 * @returns {Object}
 */
export function snapshotIdentity(pac = {}) {
  const cns = String(pac?.cns || '');
  const cpf = String(pac?.cpf || '');
  return {
    patientId:   pac?.pacID || null,
    nome:        pac?.nome  || null,
    nascimento:  pac?.nasc  || null,
    cnsParcial:  cns.length >= 4 ? cns.slice(0, 3) + '***' + cns.slice(-2) : null,
    cpfParcial:  cpf.replace(/\D/g,'').length >= 6
                   ? cpf.replace(/\D/g,'').slice(0,3) + '***'
                   : null,
    capturedAt:  new Date().toISOString(),
  };
}

// ── Verificação de identidade ─────────────────────────────────────────────────

/**
 * identityMatches — compara snapshot de identidade com paciente ativo.
 * Usado pelo saveClinicalArtifact para detectar divergência.
 *
 * @param {Object} snapshot - identitySnapshot do artefato
 * @param {Object} pac      - paciente ativo atual
 * @returns {{ ok: boolean, motivo: string|null }}
 */
export function identityMatches(snapshot, pac = {}) {
  if (!snapshot || !snapshot.patientId) {
    // Artefato legado sem snapshot — não bloquear, apenas alertar
    return { ok: true, motivo: null, legacy: true };
  }

  const snapshotId = String(snapshot.patientId || '');
  const pacId      = String(pac?.pacID || pac?.cpf || pac?.cns || '');

  if (snapshotId && pacId && snapshotId !== pacId) {
    return {
      ok:     false,
      motivo: `patientId do artefato ("${snapshotId}") diverge do paciente ativo ("${pacId}")`,
    };
  }

  const nomePac      = normalizeNome(pac?.nome);
  const nomeSnapshot = normalizeNome(snapshot?.nome);
  if (nomePac && nomeSnapshot && nomePac !== nomeSnapshot) {
    return {
      ok:     false,
      motivo: `nome no artefato ("${snapshot.nome}") diverge do paciente ativo ("${pac?.nome}")`,
    };
  }

  return { ok: true, motivo: null };
}

// ── Helpers de legado ─────────────────────────────────────────────────────────

/**
 * getLegacyEncounterId — gera um encounterId sintético para dados legados
 * (dossiês criados antes da implementação do F0).
 * Permite que o sistema leia dados antigos sem quebrar.
 *
 * @param {string} patientId
 * @param {string} [dossieId]
 * @returns {string}
 */
export function getLegacyEncounterId(patientId, dossieId) {
  const id = dossieId || patientId || 'desconhecido';
  return `LEGACY-${String(id).replace(/[^a-zA-Z0-9]/g, '-')}`;
}

/**
 * isLegacyEncounter — detecta se um encounterId é legado.
 * @param {string} encounterId
 * @returns {boolean}
 */
export function isLegacyEncounter(encounterId) {
  return String(encounterId || '').startsWith('LEGACY-');
}

// ── Geradores de ID ───────────────────────────────────────────────────────────

function generateEncounterId(tipo) {
  const tipoAbrev = {
    primeira_consulta: 'PC',
    retorno_qt:        'RQ',
    retorno_clinico:   'RC',
    intercorrencia:    'IC',
  }[tipo] || 'AT';
  const now  = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ENC-${tipoAbrev}-${date}-${rand}`;
}

function generateArtifactId(artifactType) {
  const prefix = String(artifactType || 'ART').slice(0, 3).toUpperCase();
  const rand   = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

function normalizeNome(nome = '') {
  return String(nome || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}
