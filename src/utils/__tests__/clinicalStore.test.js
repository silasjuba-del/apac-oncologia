// ─────────────────────────────────────────────────────────────────────────────
// clinicalStore.test.js — Testes do portão único de salvamento clínico (F0)
//
// Paciente fictício: Maria das Graças Silva
// Segundo paciente fictício: José Ferreira Neto (para divergência)
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mock de localStorage para ambiente Node (vitest roda em Node, sem DOM) ──
let _store = {};
const localStorageMock = {
  getItem:    (k)    => (_store[k] ?? null),
  setItem:    (k, v) => { _store[k] = String(v); },
  removeItem: (k)    => { delete _store[k]; },
  clear:      ()     => { _store = {}; },
};
vi.stubGlobal('localStorage', localStorageMock);

import {
  openEncounter, getActiveEncounter, closeEncounter, quarantineEncounter,
  saveClinicalArtifact, requireEncounter, buildLegacyArtifact,
} from '../clinicalStore';
import {
  createEncounter, createArtifact, transitionArtifact,
  ENCOUNTER_TIPOS, ENCOUNTER_STATUS,
  ARTIFACT_STATUS, ARTIFACT_TYPES, ARTIFACT_SOURCES,
  getLegacyEncounterId,
} from '../encounterMachine';

// ── Pacientes fictícios ───────────────────────────────────────────────────────

const MARIA = {
  pacID:    'PAC-TEST-F0-001',
  nome:     'Maria das Graças Silva',
  nasc:     '1960-03-15',
  cpf:      '000.000.000-00',
  cns:      '123456789012345',
};

const JOSE = {
  pacID:    'PAC-TEST-F0-999',
  nome:     'José Ferreira Neto',
  nasc:     '1955-07-22',
  cpf:      '111.111.111-11',
  cns:      '999999999999999',
};

// ── Setup: limpar localStorage antes de cada teste ───────────────────────────

beforeEach(() => {
  _store = {};            // limpa o mock entre cada teste
  vi.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEncounter(pac = MARIA, tipo = ENCOUNTER_TIPOS.RETORNO_QT) {
  return createEncounter(pac.pacID, tipo);
}

function makeArtifact(enc, pac = MARIA, overrides = {}) {
  return createArtifact({
    encounterId:  enc.encounterId,
    patientId:    pac.pacID,
    artifactType: ARTIFACT_TYPES.EVOLUCAO,
    source:       ARTIFACT_SOURCES.IA,
    pac,
    content:      'Paciente refere bem-estar. Sem efeitos adversos.',
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. openEncounter / getActiveEncounter / closeEncounter / quarantineEncounter
// ─────────────────────────────────────────────────────────────────────────────

describe('openEncounter / getActiveEncounter', () => {
  it('retorna null quando não há encounter ativo', () => {
    expect(getActiveEncounter()).toBeNull();
  });

  it('persiste e recupera encounter aberto', () => {
    const enc = makeEncounter();
    openEncounter(enc);
    const retrieved = getActiveEncounter();
    expect(retrieved).not.toBeNull();
    expect(retrieved.encounterId).toBe(enc.encounterId);
    expect(retrieved.patientId).toBe(MARIA.pacID);
    expect(retrieved.status).toBe(ENCOUNTER_STATUS.OPEN);
  });

  it('retorna null para encounter com status CLOSED', () => {
    const enc = { ...makeEncounter(), status: ENCOUNTER_STATUS.CLOSED };
    openEncounter(enc);
    expect(getActiveEncounter()).toBeNull();
  });

  it('retorna null para encounter com status QUARANTINED', () => {
    const enc = { ...makeEncounter(), status: ENCOUNTER_STATUS.QUARANTINED };
    openEncounter(enc);
    expect(getActiveEncounter()).toBeNull();
  });
});

describe('closeEncounter', () => {
  it('remove o encounter ativo e salva no histórico', () => {
    const enc = makeEncounter();
    openEncounter(enc);
    expect(getActiveEncounter()).not.toBeNull();

    closeEncounter();
    expect(getActiveEncounter()).toBeNull();

    const hist = JSON.parse(localStorage.getItem('apacapp_encounters_historico_v1') || '[]');
    expect(hist).toHaveLength(1);
    expect(hist[0].encounterId).toBe(enc.encounterId);
    expect(hist[0].status).toBe(ENCOUNTER_STATUS.CLOSED);
    expect(hist[0].fechadaEm).toBeDefined();
  });

  it('não falha quando não há encounter ativo', () => {
    expect(() => closeEncounter()).not.toThrow();
  });
});

describe('quarantineEncounter', () => {
  it('marca encounter como quarantined com motivo', () => {
    const enc = makeEncounter();
    openEncounter(enc);

    quarantineEncounter('Divergência de identidade detectada');

    const raw = JSON.parse(localStorage.getItem('apacapp_encounter_ativo_v1'));
    expect(raw.status).toBe(ENCOUNTER_STATUS.QUARANTINED);
    expect(raw.motivoQuarentena).toBe('Divergência de identidade detectada');
    expect(raw.quarentenaEm).toBeDefined();
  });

  it('não falha quando não há encounter ativo', () => {
    expect(() => quarantineEncounter('motivo')).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. saveClinicalArtifact — bloqueios
// ─────────────────────────────────────────────────────────────────────────────

describe('saveClinicalArtifact — bloqueios', () => {
  it('bloqueia artefato sem patientId', () => {
    const enc = makeEncounter();
    const artifact = makeArtifact(enc);
    const noPatient = { ...artifact, patientId: null };

    const result = saveClinicalArtifact(noPatient, {}, MARIA, null);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/patientId ausente/);
  });

  it('bloqueia artefato sem encounterId', () => {
    const enc = makeEncounter();
    const artifact = makeArtifact(enc);
    const noEnc = { ...artifact, encounterId: null };

    const result = saveClinicalArtifact(noEnc, {}, MARIA, null);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/encounterId ausente/);
  });

  it('bloqueia artefato com encounterId legado (LEGACY-)', () => {
    const legacyId = getLegacyEncounterId(MARIA.pacID);
    const artifact = {
      artifactId:        'EVL-TEST',
      encounterId:       legacyId,
      patientId:         MARIA.pacID,
      artifactType:      ARTIFACT_TYPES.EVOLUCAO,
      status:            ARTIFACT_STATUS.IA_DRAFT,
      source:            ARTIFACT_SOURCES.IA,
      content:           'legado',
      identitySnapshot:  { patientId: null },
    };

    const result = saveClinicalArtifact(artifact, {}, MARIA, null);
    expect(result.ok).toBe(false);
    expect(result.legacy).toBe(true);
    expect(result.reason).toMatch(/legado/);
  });

  it('bloqueia e quarentena quando identidade diverge (patientId diferente)', () => {
    const enc = makeEncounter();
    openEncounter(enc);

    // Artefato criado para MARIA mas tentando salvar com JOSE ativo
    const artifact = makeArtifact(enc, MARIA);

    const setDossie = vi.fn();
    const result = saveClinicalArtifact(artifact, {}, JOSE, setDossie);

    expect(result.ok).toBe(false);
    expect(result.quarantined).toBe(true);
    expect(result.reason).toMatch(/Identidade divergente/);
    expect(setDossie).not.toHaveBeenCalled();

    // Encounter deve ter sido quarentenado
    const raw = JSON.parse(localStorage.getItem('apacapp_encounter_ativo_v1'));
    expect(raw.status).toBe(ENCOUNTER_STATUS.QUARANTINED);
  });

  it('bloqueia transição não permitida (ia_draft → medical_signed)', () => {
    const enc = makeEncounter();
    const artifact = makeArtifact(enc); // status = ia_draft

    const result = saveClinicalArtifact(artifact, {}, MARIA, null, {
      newStatus: ARTIFACT_STATUS.MEDICAL_SIGNED,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/Transição/);
    expect(result.reason).toMatch(/não permitida/);
  });

  it('bloqueia artefato sem source', () => {
    const enc = makeEncounter();
    const artifact = makeArtifact(enc);
    const noSource = { ...artifact, source: null };

    const result = saveClinicalArtifact(noSource, {}, MARIA, null);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/source ausente/);
  });

  it('bloqueia prescrição: transição ia_draft → medical_signed sem validated', () => {
    const enc = makeEncounter();
    const artifact = createArtifact({
      encounterId:  enc.encounterId,
      patientId:    MARIA.pacID,
      artifactType: ARTIFACT_TYPES.PRESCRICAO,
      source:       ARTIFACT_SOURCES.IA,
      pac:          MARIA,
      content:      { medicamento: 'Capecitabina 500mg' },
    });
    // status = ia_draft para prescrição

    const result = saveClinicalArtifact(artifact, {}, MARIA, null, {
      newStatus: ARTIFACT_STATUS.MEDICAL_SIGNED,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/Transição/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. saveClinicalArtifact — fluxos bem-sucedidos
// ─────────────────────────────────────────────────────────────────────────────

describe('saveClinicalArtifact — fluxos bem-sucedidos', () => {
  it('salva artefato de evolução com ia_draft → medical_validated', () => {
    const enc = makeEncounter();
    const artifact = makeArtifact(enc); // status = ia_draft

    const capturedDossie = {};
    const setDossie = vi.fn(fn => {
      Object.assign(capturedDossie, fn({ evolucao: null }));
    });

    const result = saveClinicalArtifact(artifact, {}, MARIA, setDossie, {
      newStatus: ARTIFACT_STATUS.MEDICAL_VALIDATED,
    });

    expect(result.ok).toBe(true);
    expect(result.artifact.status).toBe(ARTIFACT_STATUS.MEDICAL_VALIDATED);
    expect(setDossie).toHaveBeenCalledOnce();
  });

  it('salva artefato de evolução sem transição (mantém status atual)', () => {
    const enc = makeEncounter();
    const artifact = makeArtifact(enc); // status = ia_draft

    const setDossie = vi.fn();
    const result = saveClinicalArtifact(artifact, {}, MARIA, setDossie);

    expect(result.ok).toBe(true);
    expect(result.artifact.status).toBe(ARTIFACT_STATUS.IA_DRAFT);
    expect(setDossie).toHaveBeenCalledOnce();
  });

  it('funciona sem setDossie (persistência opcional)', () => {
    const enc = makeEncounter();
    const artifact = makeArtifact(enc);

    const result = saveClinicalArtifact(artifact, {}, MARIA, null);
    expect(result.ok).toBe(true);
    expect(result.artifact).toBeDefined();
  });

  it('fluxo completo: ia_draft → validated → signed para evolução', () => {
    const enc = makeEncounter();
    let artifact = makeArtifact(enc);

    // Passo 1: IA processa
    expect(artifact.status).toBe(ARTIFACT_STATUS.IA_DRAFT);

    // Passo 2: médico valida
    let result = saveClinicalArtifact(artifact, {}, MARIA, null, {
      newStatus: ARTIFACT_STATUS.MEDICAL_VALIDATED,
    });
    expect(result.ok).toBe(true);
    artifact = result.artifact;
    expect(artifact.status).toBe(ARTIFACT_STATUS.MEDICAL_VALIDATED);

    // Passo 3: médico assina
    result = saveClinicalArtifact(artifact, {}, MARIA, null, {
      newStatus: ARTIFACT_STATUS.MEDICAL_SIGNED,
    });
    expect(result.ok).toBe(true);
    expect(result.artifact.status).toBe(ARTIFACT_STATUS.MEDICAL_SIGNED);
  });

  it('fluxo prescrição: ia_draft → validated → signed (com passo intermediário obrigatório)', () => {
    const enc = makeEncounter();
    const prescricao = createArtifact({
      encounterId:  enc.encounterId,
      patientId:    MARIA.pacID,
      artifactType: ARTIFACT_TYPES.PRESCRICAO,
      source:       ARTIFACT_SOURCES.IA,
      pac:          MARIA,
      content:      { medicamento: 'Capecitabina 500mg', ciclo: 4 },
    });

    // ia_draft → validated OK
    let result = saveClinicalArtifact(prescricao, {}, MARIA, null, {
      newStatus: ARTIFACT_STATUS.MEDICAL_VALIDATED,
    });
    expect(result.ok).toBe(true);

    // validated → signed OK
    result = saveClinicalArtifact(result.artifact, {}, MARIA, null, {
      newStatus: ARTIFACT_STATUS.MEDICAL_SIGNED,
    });
    expect(result.ok).toBe(true);
    expect(result.artifact.status).toBe(ARTIFACT_STATUS.MEDICAL_SIGNED);
  });

  it('salva APAC e mescla no dossiê corretamente', () => {
    const enc = makeEncounter();
    const apac = createArtifact({
      encounterId:  enc.encounterId,
      patientId:    MARIA.pacID,
      artifactType: ARTIFACT_TYPES.APAC,
      source:       ARTIFACT_SOURCES.MEDICO,
      pac:          MARIA,
      content:      { cid: 'C50.4', procedimento: '0304010153', justificativa: 'Retorno QT ciclo 4' },
    });

    let dossieMesclado = null;
    const setDossie = vi.fn(fn => {
      dossieMesclado = fn({ apac: null });
    });

    const result = saveClinicalArtifact(apac, {}, MARIA, setDossie);
    expect(result.ok).toBe(true);
    expect(dossieMesclado?.apac?.cid).toBe('C50.4');
    expect(dossieMesclado?.apac?.artifactId).toBe(apac.artifactId);
  });

  it('permite forceSave para artefato legado (uso interno)', () => {
    const legacyId = getLegacyEncounterId(MARIA.pacID);
    const artifact = {
      artifactId:       'EVL-LEGACY-001',
      encounterId:      legacyId,
      patientId:        MARIA.pacID,
      artifactType:     ARTIFACT_TYPES.EVOLUCAO,
      status:           ARTIFACT_STATUS.MEDICAL_SIGNED,
      source:           ARTIFACT_SOURCES.MEDICO,
      content:          'Texto legado',
      identitySnapshot: { patientId: null },
    };

    const result = saveClinicalArtifact(artifact, {}, MARIA, null, { forceSave: true });
    expect(result.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. saveClinicalArtifact — merge no dossiê
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeArtifactIntoDossie — via saveClinicalArtifact', () => {
  it('evolucao ia_draft salva como rascunho', () => {
    const enc = makeEncounter();
    const artifact = makeArtifact(enc); // ia_draft
    let merged = null;
    const setDossie = vi.fn(fn => { merged = fn({}); });

    saveClinicalArtifact(artifact, {}, MARIA, setDossie);

    expect(merged.evolucao.rascunho).toBe('Paciente refere bem-estar. Sem efeitos adversos.');
    expect(merged.evolucao.textoFinal).toBe('');
  });

  it('evolucao medical_signed salva como textoFinal', () => {
    const enc = makeEncounter();
    // Criar diretamente com status medical_signed via forceSave
    const artifact = {
      ...makeArtifact(enc),
      status: ARTIFACT_STATUS.MEDICAL_SIGNED,
    };
    let merged = null;
    const setDossie = vi.fn(fn => { merged = fn({}); });

    saveClinicalArtifact(artifact, {}, MARIA, setDossie, { forceSave: true });

    expect(merged.evolucao.textoFinal).toBe('Paciente refere bem-estar. Sem efeitos adversos.');
  });

  it('documento salva em dossie.documentos (deduplicado por artifactId)', () => {
    const enc = makeEncounter();
    const doc = createArtifact({
      encounterId:  enc.encounterId,
      patientId:    MARIA.pacID,
      artifactType: ARTIFACT_TYPES.DOCUMENTO,
      source:       ARTIFACT_SOURCES.UPLOAD,
      pac:          MARIA,
      content:      { nome: 'Laudo_AP.pdf' },
    });

    let merged = null;
    // Primeiro save
    const setDossie1 = vi.fn(fn => { merged = fn({ documentos: [] }); });
    saveClinicalArtifact(doc, {}, MARIA, setDossie1);
    expect(merged.documentos).toHaveLength(1);

    // Segundo save do mesmo documento (atualiza, não duplica)
    const setDossie2 = vi.fn(fn => { merged = fn({ documentos: merged.documentos }); });
    saveClinicalArtifact(doc, {}, MARIA, setDossie2);
    expect(merged.documentos).toHaveLength(1);
  });

  it('vincular encounterId ao dossiê se ausente', () => {
    const enc = makeEncounter();
    const artifact = makeArtifact(enc);
    let merged = null;
    const setDossie = vi.fn(fn => { merged = fn({}); });

    saveClinicalArtifact(artifact, {}, MARIA, setDossie);

    expect(merged.encounterId).toBe(enc.encounterId);
  });

  it('não sobrescreve encounterId existente no dossiê', () => {
    const enc = makeEncounter();
    const artifact = makeArtifact(enc);
    let merged = null;
    const setDossie = vi.fn(fn => { merged = fn({ encounterId: 'ENC-EXISTENTE' }); });

    saveClinicalArtifact(artifact, {}, MARIA, setDossie);

    expect(merged.encounterId).toBe('ENC-EXISTENTE');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. requireEncounter
// ─────────────────────────────────────────────────────────────────────────────

describe('requireEncounter', () => {
  it('falha quando não há encounter ativo', () => {
    const result = requireEncounter(MARIA);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/Nenhum atendimento aberto/);
  });

  it('retorna encounter quando está aberto para o mesmo paciente', () => {
    const enc = makeEncounter();
    openEncounter(enc);

    const result = requireEncounter(MARIA);
    expect(result.ok).toBe(true);
    expect(result.encounter.encounterId).toBe(enc.encounterId);
  });

  it('falha quando encounter está fechado', () => {
    const enc = { ...makeEncounter(), status: ENCOUNTER_STATUS.CLOSED };
    // Forçar escrita direta no localStorage (simular estado inválido)
    localStorage.setItem('apacapp_encounter_ativo_v1', JSON.stringify(enc));

    const result = requireEncounter(MARIA);
    // getActiveEncounter retorna null para CLOSED → "Nenhum atendimento aberto"
    expect(result.ok).toBe(false);
  });

  it('falha quando encounter pertence a outro paciente', () => {
    const enc = makeEncounter(JOSE); // encounter de JOSE
    openEncounter(enc);

    const result = requireEncounter(MARIA); // tentando com MARIA
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/paciente ativo/);
  });

  it('aceita quando paciente não tem ID (pac sem dados)', () => {
    const enc = makeEncounter();
    openEncounter(enc);

    const result = requireEncounter({}); // pac sem ID
    expect(result.ok).toBe(true); // sem ID para comparar → não bloqueia
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. buildLegacyArtifact
// ─────────────────────────────────────────────────────────────────────────────

describe('buildLegacyArtifact', () => {
  it('cria artefato legado com encounterId LEGACY-', () => {
    const dossie = {
      id: 'dossie-maria-001',
      evolucao: { textoFinal: 'Evolução legada anterior ao F0.' },
      createdAt: '2025-01-01T10:00:00.000Z',
    };

    const artifact = buildLegacyArtifact(dossie, MARIA);

    expect(artifact.encounterId).toMatch(/^LEGACY-/);
    expect(artifact.patientId).toBe(MARIA.pacID);
    expect(artifact.isLegacy).toBe(true);
    expect(artifact.status).toBe(ARTIFACT_STATUS.MEDICAL_SIGNED);
    expect(artifact.content).toBe('Evolução legada anterior ao F0.');
  });

  it('usa rascunho quando não há textoFinal no dossie legado', () => {
    const dossie = {
      id: 'dossie-001',
      evolucao: { rascunho: 'Rascunho legado.' },
    };
    const artifact = buildLegacyArtifact(dossie, MARIA);
    expect(artifact.content).toBe('Rascunho legado.');
  });

  it('funciona sem dossie (graceful degradation)', () => {
    expect(() => buildLegacyArtifact(null, MARIA)).not.toThrow();
  });

  it('artefato legado bloqueado pelo saveClinicalArtifact (sem forceSave)', () => {
    const artifact = buildLegacyArtifact({ id: 'dossie-001' }, MARIA);
    const result = saveClinicalArtifact(artifact, {}, MARIA, null);
    expect(result.ok).toBe(false);
    expect(result.legacy).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Fluxo completo: Maria das Graças Silva — Retorno QT Ciclo 4
// ─────────────────────────────────────────────────────────────────────────────

describe('Fluxo completo — Maria das Graças Silva, Retorno QT Ciclo 4', () => {
  it('1. Abre atendimento e registra no localStorage', () => {
    const enc = createEncounter(MARIA.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    openEncounter(enc);

    const active = getActiveEncounter();
    expect(active).not.toBeNull();
    expect(active.status).toBe(ENCOUNTER_STATUS.OPEN);
    expect(active.tipo).toBe(ENCOUNTER_TIPOS.RETORNO_QT);
  });

  it('2. IA gera rascunho de evolução e APAC (ia_draft)', () => {
    const enc = createEncounter(MARIA.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    openEncounter(enc);

    const evolucao = createArtifact({
      encounterId:  enc.encounterId,
      patientId:    MARIA.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO,
      source:       ARTIFACT_SOURCES.IA,
      pac:          MARIA,
      content: {
        dat:    'Paciente em retorno QT ciclo 4. ECOG 1. Tolerou bem ciclo anterior.',
        exames: 'Hemograma: neutrófilos 1.800/mm³. Creatinina 0.9 mg/dL.',
        resumo: 'Capecitabina + Oxaliplatina C4. Sem toxicidade G3/G4.',
      },
    });

    expect(evolucao.status).toBe(ARTIFACT_STATUS.IA_DRAFT);
    expect(evolucao.encounterId).toBe(enc.encounterId);
    expect(evolucao.identitySnapshot.patientId).toBe(MARIA.pacID);
  });

  it('3. Médico valida evolução (ia_draft → medical_validated)', () => {
    const enc = createEncounter(MARIA.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    openEncounter(enc);

    const evolucao = createArtifact({
      encounterId:  enc.encounterId,
      patientId:    MARIA.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO,
      source:       ARTIFACT_SOURCES.IA,
      pac:          MARIA,
      content:      'Paciente estável. Ciclo 4 autorizado.',
    });

    const dossie = {};
    let savedDossie = null;
    const setDossie = vi.fn(fn => { savedDossie = fn(dossie); });

    const result = saveClinicalArtifact(evolucao, dossie, MARIA, setDossie, {
      newStatus: ARTIFACT_STATUS.MEDICAL_VALIDATED,
    });

    expect(result.ok).toBe(true);
    expect(result.artifact.status).toBe(ARTIFACT_STATUS.MEDICAL_VALIDATED);
    expect(savedDossie?.evolucao?.status).toBe(ARTIFACT_STATUS.MEDICAL_VALIDATED);
  });

  it('4. Médico assina evolução (medical_validated → medical_signed)', () => {
    const enc = createEncounter(MARIA.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    openEncounter(enc);

    // Criar já em medical_validated
    const evolucao = {
      ...createArtifact({
        encounterId:  enc.encounterId,
        patientId:    MARIA.pacID,
        artifactType: ARTIFACT_TYPES.EVOLUCAO,
        source:       ARTIFACT_SOURCES.MEDICO,
        pac:          MARIA,
        content:      'Evolução final assinada. Ciclo 4 realizado sem intercorrências.',
      }),
      status: ARTIFACT_STATUS.MEDICAL_VALIDATED,
    };

    let dossieFinal = null;
    const setDossie = vi.fn(fn => { dossieFinal = fn({}); });

    const result = saveClinicalArtifact(evolucao, {}, MARIA, setDossie, {
      newStatus: ARTIFACT_STATUS.MEDICAL_SIGNED,
    });

    expect(result.ok).toBe(true);
    expect(result.artifact.status).toBe(ARTIFACT_STATUS.MEDICAL_SIGNED);
    expect(dossieFinal?.evolucao?.textoFinal).toContain('Ciclo 4 realizado');
    expect(dossieFinal?.evolucao?.status).toBe(ARTIFACT_STATUS.MEDICAL_SIGNED);
  });

  it('5. Tentativa de trocar paciente bloqueia e quarentena', () => {
    const enc = createEncounter(MARIA.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    openEncounter(enc);

    // Artefato pertence a MARIA, mas paciente ativo agora é JOSE
    const artifact = createArtifact({
      encounterId:  enc.encounterId,
      patientId:    MARIA.pacID,
      artifactType: ARTIFACT_TYPES.EVOLUCAO,
      source:       ARTIFACT_SOURCES.IA,
      pac:          MARIA,
      content:      'Conteúdo do atendimento de Maria',
    });

    const setDossie = vi.fn();
    const result = saveClinicalArtifact(artifact, {}, JOSE, setDossie);

    expect(result.ok).toBe(false);
    expect(result.quarantined).toBe(true);
    expect(setDossie).not.toHaveBeenCalled();
  });

  it('6. Fecha atendimento após assinatura', () => {
    const enc = createEncounter(MARIA.pacID, ENCOUNTER_TIPOS.RETORNO_QT);
    openEncounter(enc);

    closeEncounter();

    expect(getActiveEncounter()).toBeNull();
    const hist = JSON.parse(localStorage.getItem('apacapp_encounters_historico_v1') || '[]');
    expect(hist[0].status).toBe(ENCOUNTER_STATUS.CLOSED);
    expect(hist[0].patientId).toBe(MARIA.pacID);
    expect(hist[0].tipo).toBe(ENCOUNTER_TIPOS.RETORNO_QT);
  });
});
