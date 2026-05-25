/**
 * fixtures.js — Pacientes e dossiês de teste realistas para dev e testes unitários
 * Todos os dados são fictícios (CPF/CNS inválidos, nomes inventados).
 * Usados em: npm test, Storybook, seed de dev local.
 */

// ── Pacientes ─────────────────────────────────────────────────────────────────

export const PAC_MAMA = {
  pacID: 'PAC-TEST-001',
  nome: 'Maria das Graças Silva',
  cpf: '000.000.000-00',
  cns: '123456789012345',
  nasc: '15/03/1968',
  mae: 'Antônia das Graças',
  cidade: 'Patos',
  municipio: 'Patos',
  sexo: 'F',
  cid: 'C50.4',
  cid_sugerido: 'C50.4',
  diag: 'Adenocarcinoma invasivo de mama direita, grau II',
  local_cancer: 'mama',
  estadio: 'IIB',
  tnm: 'T2N1M0',
  trat: 'AC-T (Doxorrubicina + Ciclofosfamida → Paclitaxel)',
  linha: 'Neoadjuvante',
  intencao: 'Curativa',
  cod_proc: '03040200023',
  justif_apac: 'Paciente com adenocarcinoma invasivo de mama direita, estadio IIB (T2N1M0), HER2 negativo, RE positivo (90%), RP positivo (60%). Indicada quimioterapia neoadjuvante com protocolo AC-T antes de cirurgia conservadora. Performance ECOG 0, função renal e hepática preservadas. Solicitação baseada em protocolo NCCN Breast Cancer 2026.',
  ecog: '0',
  re: 'Positivo (90%)',
  rp: 'Positivo (60%)',
  her2: 'Negativo',
  ki67: '22%',
  bio: 'RE+ (90%) RP+ (60%) HER2- Ki67 22%',
  peso: '68',
  altura: '1.62',
  data_sol: '25/05/2026',
  queixa: 'Nódulo palpável em mama direita há 3 meses',
  antec: 'HAS controlada. Sem cirurgias prévias. Sem histórico familiar de Ca mama.',
  meds: 'Losartana 50mg 1x/dia',
  anatom: 'Conclusão: Adenocarcinoma invasivo NST grau histológico II. RE: Positivo (90%). RP: Positivo (60%). HER2: Negativo (score 1+). Ki67: 22%. Estadio pT2N1M0.',
  imagen: 'TC tórax: Sem evidência de metástases pulmonares. Nódulo axilar ipsilateral de 1.2cm. Estadio IIB confirmado.',
  data_biopsia: '10/05/2026',
  evolucoes: [],
};

export const PAC_COLON = {
  pacID: 'PAC-TEST-002',
  nome: 'José Ferreira Neto',
  cpf: '111.111.111-11',
  cns: '234567890123456',
  nasc: '22/07/1955',
  mae: 'Maria Ferreira',
  cidade: 'Campina Grande',
  municipio: 'Campina Grande',
  sexo: 'M',
  cid: 'C18.2',
  diag: 'Adenocarcinoma moderadamente diferenciado de cólon ascendente',
  local_cancer: 'cólon',
  estadio: 'IIIC',
  tnm: 'T4N2M0',
  trat: 'FOLFOX4 (5-FU + Oxaliplatina + Leucovorin)',
  linha: 'Adjuvante',
  intencao: 'Curativa',
  cod_proc: '03040200040',
  ecog: '1',
  bio: 'RAS mutado, BRAF selvagem, MSS',
  data_sol: '20/05/2026',
  queixa: 'Hematoquezia, perda ponderal de 8kg em 3 meses',
  antec: 'DM2. Colectomia direita em 04/2026.',
  justif_apac: 'Adenocarcinoma de cólon ascendente estadio IIIC (T4N2M0), submetido a colectomia direita em 04/2026. Indicada quimioterapia adjuvante com FOLFOX4 por 12 ciclos conforme protocolo ASCO/ESMO. Performance ECOG 1. Função renal e hepática dentro dos limites para QT. RAS mutado — sem indicação de anti-EGFR.',
  anatom: 'Diagnóstico: Adenocarcinoma moderadamente diferenciado. T4N2M0. 14 linfonodos positivos de 22 ressecados. Margens cirúrgicas livres. RAS mutado.',
  evolucoes: [],
};

export const PAC_PULMAO = {
  pacID: 'PAC-TEST-003',
  nome: 'Ana Beatriz Souza',
  cpf: '222.222.222-22',
  cns: '345678901234567',
  nasc: '05/11/1962',
  mae: 'Francisca Souza',
  cidade: 'João Pessoa',
  municipio: 'João Pessoa',
  sexo: 'F',
  cid: 'C34.1',
  diag: 'Adenocarcinoma de pulmão, EGFR exon 19 deleção',
  local_cancer: 'pulmão',
  estadio: 'IV',
  tnm: 'T2N2M1b',
  trat: 'Osimertinibe 80mg/dia',
  linha: '1ª linha',
  intencao: 'Paliativa',
  cod_proc: '03040200082',
  ecog: '1',
  bio: 'EGFR exon 19 del+, ALK negativo, PD-L1 35%',
  data_sol: '18/05/2026',
  queixa: 'Dispneia progressiva e hemoptise ocasional',
  justif_apac: 'Adenocarcinoma de pulmão estadio IV (T2N2M1b) com mutação EGFR exon 19 deleção. Indicado osimertinibe 80mg/dia como terapia alvo de 1ª linha conforme FLAURA trial e consenso IASLC 2026. Performance ECOG 1. Função hepática e renal preservadas. Expectativa de resposta >70% conforme literatura.',
  evolucoes: [],
};

/** Paciente sem dados clínicos — testa guards P0/P1 */
export const PAC_VAZIO = {
  pacID: 'PAC-TEST-VAZIO',
  nome: '',
  cpf: '',
  cns: '',
};

/** Paciente sem ID — deve ser bloqueado pelo requireActivePatient */
export const PAC_SEM_ID = {
  nome: 'Paciente Sem ID',
  cpf: '',
  cns: '',
};

// ── Dossiês ───────────────────────────────────────────────────────────────────

export const DOSSIE_MAMA = {
  id: 'DOS-TEST-001',
  status: 'pronto_medico',
  paciente: { ...PAC_MAMA },
  documentos: [
    {
      id: 1001,
      tipo: 'Biópsia / Anatomopatológico',
      nome: 'AP_mama_direita_2026.pdf',
      resumo: PAC_MAMA.anatom,
      camposIA: { cid: 'C50.4', diag: 'Adenocarcinoma invasivo NST grau II' },
      origem: 'upload_ia',
      fonte: 'upload_ia',
      criadoEm: '2026-05-10T10:00:00.000Z',
    },
    {
      id: 1002,
      tipo: 'Tomografia',
      nome: 'TC_torax_2026.pdf',
      resumo: PAC_MAMA.imagen,
      camposIA: { estadio: 'IIB' },
      origem: 'upload_ia',
      fonte: 'upload_ia',
      criadoEm: '2026-05-12T14:30:00.000Z',
    },
  ],
  resumoClaude: 'Paciente com adenocarcinoma de mama direita estadio IIB. Indicada neoadjuvância com AC-T. RE+ RP+ HER2-.',
  evolucao: {
    rascunho: 'EVOLUÇÃO MÉDICA\n\nDiagnóstico: Adenocarcinoma invasivo de mama direita (C50.4), estadio IIB (T2N1M0).\nECOG: 0. Protocolo: AC-T neoadjuvante.\nConduta: Iniciar quimioterapia conforme protocolo.',
    textoFinal: '',
    salvaEm: null,
  },
  apac: { campos: {}, pendencias: [], riscoGlosa: 'baixo', completa: true },
  createdAt: '2026-05-10T10:00:00.000Z',
  updatedAt: '2026-05-25T08:00:00.000Z',
};

export const DOSSIE_VAZIO = {
  id: 'DOS-TEST-VAZIO',
  status: 'pre_consulta',
  paciente: {},
  documentos: [],
  resumoClaude: '',
  evolucao: { rascunho: '', textoFinal: '', salvaEm: null },
  apac: { campos: {}, pendencias: [], riscoGlosa: 'alto', completa: false },
  createdAt: '2026-05-25T00:00:00.000Z',
  updatedAt: '2026-05-25T00:00:00.000Z',
};

// ── Documentos clínicos avulsos ───────────────────────────────────────────────

export const DOC_BIOPSIA_MAMA = {
  id: 9001,
  tipo: 'Biópsia',
  nome: 'biopsia_mama.pdf',
  resumo: 'Adenocarcinoma invasivo NST grau II. RE+ RP+ HER2- Ki67 22%. pT2N1M0.',
  camposIA: { cid: 'C50.4', diag: 'Adenocarcinoma invasivo NST grau II' },
  origem: 'upload_ia',
  fonte: 'upload_ia',
  criadoEm: '2026-05-25T00:00:00.000Z',
};

export const DOC_SEM_RESUMO = {
  id: 9002,
  tipo: 'Documento',
  nome: 'exame_laboratorial.pdf',
  resumo: '',
  camposIA: {},
  origem: 'recepcao_upload',
  fonte: 'recepcao_upload',
  criadoEm: '2026-05-25T00:00:00.000Z',
};

// ── Helpers de teste ──────────────────────────────────────────────────────────

/** Cria pac minimal com ID válido para passar requireActivePatient */
export function pacAtivo(overrides = {}) {
  return { pacID: 'PAC-TEST', nome: 'Teste Ativo', ...overrides };
}

/** Cria dossie minimal válido para testes de pipeline */
export function dossieMinimo(pac = pacAtivo()) {
  return {
    id: 'DOS-MIN-' + Date.now(),
    status: 'pre_consulta',
    paciente: { ...pac },
    documentos: [],
    resumoClaude: '',
    evolucao: { rascunho: '', textoFinal: '', salvaEm: null },
    apac: { campos: {}, pendencias: [], riscoGlosa: 'alto', completa: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
