// encounterMachine.test.js — Testes F0: máquina de estados e contratos de identidade
// Paciente fictício: Maria das Graças Silva (dados inventados, CPF/CNS inválidos)
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import {
  createEncounter,
  createArtifact,
  transitionArtifact,
  isTransitionAllowed,
  identityMatches,
  snapshotIdentity,
  getLegacyEncounterId,
  isLegacyEncounter,
  ENCOUNTER_TIPOS,
  ENCOUNTER_STATUS,
  ARTIFACT_STATUS,
  ARTIFACT_TYPES,
  ARTIFACT_SOURCES,
} from '../encounterMachine';

// ── Paciente fictício ─────────────────────────────────────────────────────────
const PAC_FICTICIO = {
  pacID: 'PAC-TEST-F0-001',
  nome:  'Maria das Graças Silva',
  nasc:  '15/03/1968',
  cns:   '123456789012345',
  cpf:   '000.000.000-00',
};

const PAC_OUTRO = {
  pacID: 'PAC-TEST-F0-999',
  nome:  'José Ferreira Neto',
  nasc:  '22/07/1955',
  cns:   '999888777666555',
  cpf:   '111.111.111-11',
};

// ─────────────────────────────────────────────────────────────────────────────
describe('createEncounter', () => {

  it('cria encounter com campos obrigatórios', () => {
    const enc = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.PRIMEIRA_CONSULTA);
    expect(enc.encounterId).toBeTruthy();
    expect(enc.patientId).toBe('PAC-TEST-F0-001');
    expect(enc.tipo).toBe('primeira_consulta');
    expect(enc.status).toBe(ENCOUNTER_STATUS.OPEN);
    expect(enc.abertaEm).toBeTruthy();
    expect(enc.medicoId).toBe('silas');
  });

  it('encounterId tem prefixo do tipo (PC para primeira_consulta)', () => {
    const enc = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.PRIMEIRA_CONSULTA);
    expect(enc.encounterId).toMatch(/^ENC-PC-/);
  });

  it('retorno QT gera prefixo RQ', () => {
    const enc = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    expect(enc.encounterId).toMatch(/^ENC-RQ-/);
  });

  it('intercorrência gera prefixo IC', () => {
    const enc = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.INTERCORRENCIA);
    expect(enc.encounterId).toMatch(/^ENC-IC-/);
  });

  it('lança erro se patientId ausente', () => {
    expect(() => createEncounter(null, ENCOUNTER_TIPOS.PRIMEIRA_CONSULTA)).toThrow();
    expect(() => createEncounter('',   ENCOUNTER_TIPOS.PRIMEIRA_CONSULTA)).toThrow();
  });

  it('lança erro se tipo inválido', () => {
    expect(() => createEncounter('PAC-001', 'tipo_invalido')).toThrow();
  });

  it('dois encounters do mesmo paciente têm encounterId diferentes', () => {
    const e1 = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    const e2 = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    expect(e1.encounterId).not.toBe(e2.encounterId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('createArtifact', () => {

  const enc = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.RETORNO_QT);

  it('cria artefato de evolução com campos corretos', () => {
    const art = createArtifact({
      encounterId:  enc.encounterId,
      patientId:    PAC_FICTICIO.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO,
      source:       ARTIFACT_SOURCES.IA,
      pac:          PAC_FICTICIO,
      content:      'Rascunho de evolução gerado pela IA',
    });
    expect(art.artifactId).toMatch(/^EVO?-|^EVA?L?-/); // Prefixo EVO (3 chars de 'evolucao')
    expect(art.encounterId).toBe(enc.encounterId);
    expect(art.patientId).toBe(PAC_FICTICIO.pacID);
    expect(art.artifactType).toBe('evolucao');
    expect(art.status).toBe(ARTIFACT_STATUS.IA_DRAFT);  // fonte IA → ia_draft
    expect(art.identitySnapshot.nome).toBe('Maria das Graças Silva');
    expect(art.identitySnapshot.cnsParcial).toContain('***');
    expect(art.identitySnapshot.cpfParcial).toContain('***');
  });

  it('artefato de recepção começa em recepcao_draft', () => {
    const art = createArtifact({
      encounterId: enc.encounterId, patientId: PAC_FICTICIO.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO, source: ARTIFACT_SOURCES.RECEPCAO,
      pac: PAC_FICTICIO,
    });
    expect(art.status).toBe(ARTIFACT_STATUS.RECEPCAO_DRAFT);
  });

  it('lança erro se encounterId ausente', () => {
    expect(() => createArtifact({
      encounterId: '', patientId: PAC_FICTICIO.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO, source: ARTIFACT_SOURCES.IA,
    })).toThrow();
  });

  it('lança erro se patientId ausente', () => {
    expect(() => createArtifact({
      encounterId: enc.encounterId, patientId: '',
      artifactType: ARTIFACT_TYPES.EVOLUCAO, source: ARTIFACT_SOURCES.IA,
    })).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('isTransitionAllowed — transições permitidas', () => {

  it('recepcao_draft → ia_draft ✅', () => {
    expect(isTransitionAllowed('recepcao_draft', 'ia_draft')).toBe(true);
  });

  it('recepcao_draft → medical_validated ✅', () => {
    expect(isTransitionAllowed('recepcao_draft', 'medical_validated')).toBe(true);
  });

  it('ia_draft → medical_validated ✅', () => {
    expect(isTransitionAllowed('ia_draft', 'medical_validated')).toBe(true);
  });

  it('medical_validated → medical_signed ✅', () => {
    expect(isTransitionAllowed('medical_validated', 'medical_signed')).toBe(true);
  });

  it('medical_signed → closed ✅', () => {
    expect(isTransitionAllowed('medical_signed', 'closed')).toBe(true);
  });

  it('qualquer → quarantined ✅ (estado de segurança)', () => {
    expect(isTransitionAllowed('recepcao_draft',    'quarantined')).toBe(true);
    expect(isTransitionAllowed('ia_draft',          'quarantined')).toBe(true);
    expect(isTransitionAllowed('medical_validated', 'quarantined')).toBe(true);
    expect(isTransitionAllowed('medical_signed',    'quarantined')).toBe(true);
    expect(isTransitionAllowed('closed',            'quarantined')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('isTransitionAllowed — transições BLOQUEADAS', () => {

  it('recepcao_draft → medical_signed ❌ (recepção não assina)', () => {
    expect(isTransitionAllowed('recepcao_draft', 'medical_signed')).toBe(false);
  });

  it('ia_draft → medical_signed ❌ (IA não assina, deve passar por validated)', () => {
    expect(isTransitionAllowed('ia_draft', 'medical_signed')).toBe(false);
  });

  it('medical_signed → medical_validated ❌ (assinado não volta para draft)', () => {
    expect(isTransitionAllowed('medical_signed', 'medical_validated')).toBe(false);
  });

  it('closed → qualquer outro ❌ (artefato fechado é imutável)', () => {
    expect(isTransitionAllowed('closed', 'medical_validated')).toBe(false);
    expect(isTransitionAllowed('closed', 'medical_signed')).toBe(false);
    expect(isTransitionAllowed('closed', 'ia_draft')).toBe(false);
  });

  it('prescricao: ia_draft → medical_signed ❌ (restrição adicional por tipo)', () => {
    expect(isTransitionAllowed('ia_draft', 'medical_signed', 'prescricao')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('transitionArtifact', () => {

  const enc = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.PRIMEIRA_CONSULTA);

  it('ia_draft → medical_validated com sucesso', () => {
    const art = createArtifact({
      encounterId: enc.encounterId, patientId: PAC_FICTICIO.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO, source: ARTIFACT_SOURCES.IA,
      pac: PAC_FICTICIO,
    });
    const transitioned = transitionArtifact(art, ARTIFACT_STATUS.MEDICAL_VALIDATED);
    expect(transitioned.status).toBe(ARTIFACT_STATUS.MEDICAL_VALIDATED);
    expect(transitioned.updatedAt).toBeTruthy();
    expect(transitioned).not.toBe(art); // novo objeto, não mutação
  });

  it('medical_validated → medical_signed com sucesso', () => {
    const art = createArtifact({
      encounterId: enc.encounterId, patientId: PAC_FICTICIO.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO, source: ARTIFACT_SOURCES.IA,
      pac: PAC_FICTICIO,
    });
    const v1 = transitionArtifact(art, ARTIFACT_STATUS.MEDICAL_VALIDATED);
    const v2 = transitionArtifact(v1,  ARTIFACT_STATUS.MEDICAL_SIGNED);
    expect(v2.status).toBe(ARTIFACT_STATUS.MEDICAL_SIGNED);
  });

  it('recepcao_draft → medical_signed lança erro (transição bloqueada)', () => {
    const art = createArtifact({
      encounterId: enc.encounterId, patientId: PAC_FICTICIO.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO, source: ARTIFACT_SOURCES.RECEPCAO,
      pac: PAC_FICTICIO,
    });
    expect(() => transitionArtifact(art, ARTIFACT_STATUS.MEDICAL_SIGNED)).toThrow();
  });

  it('objeto original não é mutado (imutabilidade)', () => {
    const art = createArtifact({
      encounterId: enc.encounterId, patientId: PAC_FICTICIO.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO, source: ARTIFACT_SOURCES.IA,
      pac: PAC_FICTICIO,
    });
    const original = art.status;
    transitionArtifact(art, ARTIFACT_STATUS.MEDICAL_VALIDATED);
    expect(art.status).toBe(original); // não mutou
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('snapshotIdentity', () => {

  it('captura campos essenciais de Maria', () => {
    const snap = snapshotIdentity(PAC_FICTICIO);
    expect(snap.nome).toBe('Maria das Graças Silva');
    expect(snap.patientId).toBe('PAC-TEST-F0-001');
    expect(snap.nascimento).toBe('15/03/1968');
    expect(snap.capturedAt).toBeTruthy();
  });

  it('CNS é parcial (não expõe completo)', () => {
    const snap = snapshotIdentity(PAC_FICTICIO);
    expect(snap.cnsParcial).toContain('***');
    expect(snap.cnsParcial).not.toBe(PAC_FICTICIO.cns);
  });

  it('CPF é parcial', () => {
    const snap = snapshotIdentity(PAC_FICTICIO);
    expect(snap.cpfParcial).toContain('***');
  });

  it('paciente sem CNS → cnsParcial null', () => {
    const snap = snapshotIdentity({ nome: 'Ana', pacID: 'X' });
    expect(snap.cnsParcial).toBeNull();
  });

  it('objeto vazio não quebra', () => {
    const snap = snapshotIdentity({});
    expect(snap.nome).toBeNull();
    expect(snap.patientId).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('identityMatches', () => {

  it('snapshot correto de Maria → ok true', () => {
    const snap = snapshotIdentity(PAC_FICTICIO);
    const result = identityMatches(snap, PAC_FICTICIO);
    expect(result.ok).toBe(true);
  });

  it('snapshot de Maria com patientId de José → ok false', () => {
    const snap = snapshotIdentity(PAC_FICTICIO);
    const result = identityMatches(snap, PAC_OUTRO);
    expect(result.ok).toBe(false);
    expect(result.motivo).toBeTruthy();
  });

  it('snapshot sem patientId (legado) → ok true com legacy flag', () => {
    const snapLegado = { nome: null, patientId: null, capturedAt: new Date().toISOString() };
    const result = identityMatches(snapLegado, PAC_FICTICIO);
    expect(result.ok).toBe(true);
    expect(result.legacy).toBe(true);
  });

  it('snapshot null → ok true (artefato sem identidade não bloqueia)', () => {
    const result = identityMatches(null, PAC_FICTICIO);
    expect(result.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('getLegacyEncounterId + isLegacyEncounter', () => {

  it('dossiê legado gera ID com prefixo LEGACY', () => {
    const legacyId = getLegacyEncounterId('PAC-001', 'DOS-12345');
    expect(legacyId).toMatch(/^LEGACY-/);
    expect(isLegacyEncounter(legacyId)).toBe(true);
  });

  it('encounter real não é legacy', () => {
    const enc = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.RETORNO_CLINICO);
    expect(isLegacyEncounter(enc.encounterId)).toBe(false);
  });

  it('string vazia é legacy (caso edge)', () => {
    expect(isLegacyEncounter('')).toBe(false);
    expect(isLegacyEncounter('LEGACY-PAC-001')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Fluxo completo — Maria Graças, Retorno QT Ciclo 4', () => {

  it('fluxo: IA gera rascunho → médico valida → médico assina', () => {
    // 1. Médico abre o atendimento
    const enc = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    expect(enc.status).toBe(ENCOUNTER_STATUS.OPEN);

    // 2. IA gera rascunho de evolução
    const rascunho = createArtifact({
      encounterId:  enc.encounterId,
      patientId:    PAC_FICTICIO.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO,
      source:       ARTIFACT_SOURCES.IA,
      pac:          PAC_FICTICIO,
      content:      'Paciente retorna para C4D1. Labs dentro dos limites. Manter esquema.',
    });
    expect(rascunho.status).toBe(ARTIFACT_STATUS.IA_DRAFT);

    // 3. Médico revisa
    const validado = transitionArtifact(rascunho, ARTIFACT_STATUS.MEDICAL_VALIDATED);
    expect(validado.status).toBe(ARTIFACT_STATUS.MEDICAL_VALIDATED);

    // 4. Médico assina
    const assinado = transitionArtifact(validado, ARTIFACT_STATUS.MEDICAL_SIGNED);
    expect(assinado.status).toBe(ARTIFACT_STATUS.MEDICAL_SIGNED);

    // 5. Verificar que todos os IDs estão corretos
    expect(assinado.encounterId).toBe(enc.encounterId);
    expect(assinado.patientId).toBe(PAC_FICTICIO.pacID);
  });

  it('bloqueio: tentativa de assinar sem validar (ia_draft → medical_signed)', () => {
    const enc = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    const rascunho = createArtifact({
      encounterId:  enc.encounterId,
      patientId:    PAC_FICTICIO.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO,
      source:       ARTIFACT_SOURCES.IA,
      pac:          PAC_FICTICIO,
    });
    // Tenta pular direto para signed → deve falhar
    expect(() => transitionArtifact(rascunho, ARTIFACT_STATUS.MEDICAL_SIGNED)).toThrow();
  });

  it('bloqueio: prescrição IA não pode pular validação', () => {
    const enc = createEncounter(PAC_FICTICIO.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    const prescricao = createArtifact({
      encounterId:  enc.encounterId,
      patientId:    PAC_FICTICIO.pacID,
      artifactType: ARTIFACT_TYPES.PRESCRICAO,
      source:       ARTIFACT_SOURCES.IA,
      pac:          PAC_FICTICIO,
      content:      { protocolo: 'FOLFOX', ciclo: 4, doseAjuste: 100 },
    });
    expect(prescricao.status).toBe(ARTIFACT_STATUS.IA_DRAFT);
    expect(() => transitionArtifact(prescricao, ARTIFACT_STATUS.MEDICAL_SIGNED)).toThrow();
    // Caminho correto: validated primeiro
    const validada = transitionArtifact(prescricao, ARTIFACT_STATUS.MEDICAL_VALIDATED);
    const assinada = transitionArtifact(validada, ARTIFACT_STATUS.MEDICAL_SIGNED);
    expect(assinada.status).toBe(ARTIFACT_STATUS.MEDICAL_SIGNED);
  });

  it('quarentena: artefato com patientId errado → motivo registrado', () => {
    const snap = snapshotIdentity(PAC_FICTICIO); // Maria
    const result = identityMatches(snap, PAC_OUTRO); // mas paciente ativo é José
    expect(result.ok).toBe(false);
    expect(result.motivo).toContain('PAC-TEST-F0-001');
    expect(result.motivo).toContain('PAC-TEST-F0-999');
  });
});
