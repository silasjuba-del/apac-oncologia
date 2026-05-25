// pipeline.test.js — Testes do contrato único de ingestão de documentos clínicos
// Roda com: npm test
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks de dependências externas ───────────────────────────────────────────
vi.mock('../security', () => ({
  executarProntuarioSecurity: ({ pac, texto }) => {
    if (!pac?.pacID && !pac?.cpf && !pac?.cns) return false; // sem paciente → bloqueia
    if (!texto?.trim()) return false;                         // sem texto → bloqueia
    return true;
  },
}));

vi.mock('../../components/ui/primitives', () => ({
  NOW: () => '2026-05-25T00:00:00.000Z',
  TODAY: () => '25/05/2026',
  limparMarkdown: (t) => t,
}));

vi.mock('../parse', () => ({
  extrairCamposIA: (texto) => {
    const campos = {};
    const cid = texto.match(/CID[:\s-]+([A-Z]\d{2}(?:\.\d)?)/i);
    if (cid) campos.cid = cid[1];
    const diag = texto.match(/diagnóstico[:\s]+([^\n.]{5,60})/i);
    if (diag) campos.diag = diag[1].trim();
    return campos;
  },
  extrairEvolucaoIA: () => '',
  extrairExamesRealizadosTexto: () => [],
}));

vi.mock('../dossie', () => ({
  criarDossieInicial: (pac) => ({
    id: 'DOS-TEST',
    status: 'pre_consulta',
    paciente: { ...(pac || {}) },
    documentos: [],
    resumoClaude: '',
    evolucao: { rascunho: '', textoFinal: '', salvaEm: null },
    apac: { campos: {}, pendencias: [], riscoGlosa: 'alto' },
    createdAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z',
  }),
  gerarTextoEvolucao: (d) => 'RASCUNHO_GERADO',
  validarAPAC: () => ({ campos: {}, pendencias: ['Nome', 'CID-10'], riscoGlosa: 'alto', completa: false }),
}));

// ── Importa APÓS os mocks ─────────────────────────────────────────────────────
import { criarDocumentoClinico, integrarDocumentoNoDossie, integrarDocumentosNoDossie } from '../pipeline';

// ─────────────────────────────────────────────────────────────────────────────

const PAC_ATIVO = { pacID: 'PAC-001', nome: 'Maria Teste', cpf: '000.000.000-00' };

describe('criarDocumentoClinico', () => {
  it('cria documento com campos obrigatórios', () => {
    const doc = criarDocumentoClinico({ tipo: 'Biópsia', nome: 'biopsia.pdf', resumo: 'Adenocarcinoma', origem: 'upload_ia' });
    expect(doc.id).toBeTruthy();
    expect(doc.tipo).toBe('Biópsia');
    expect(doc.nome).toBe('biopsia.pdf');
    expect(doc.resumo).toBe('Adenocarcinoma');
    expect(doc.origem).toBe('upload_ia');
    expect(doc.fonte).toBe('upload_ia');  // rastreabilidade P0/P1
    expect(doc.criadoEm).toBeTruthy();
  });

  it('usa defaults quando campos são omitidos', () => {
    const doc = criarDocumentoClinico();
    expect(doc.tipo).toBe('Laudo/Exame');
    expect(doc.nome).toBe('Documento');
    expect(doc.resumo).toBe('');
    expect(doc.origem).toBe('manual');
    expect(doc.link).toBeNull();
    expect(doc.arquivo).toBeNull();
  });

  it('extrai camposIA do resumo automaticamente quando não informado', () => {
    const doc = criarDocumentoClinico({
      resumo: 'Diagnóstico: Adenocarcinoma de mama. CID: C50.1',
      origem: 'upload_ia',
    });
    expect(doc.camposIA).toBeDefined();
    // O mock de extrairCamposIA detecta CID
    expect(doc.camposIA.cid).toBe('C50.1');
  });

  it('serializa arquivo File como objeto plain', () => {
    const fakeFile = { name: 'laudo.pdf', size: 1024, type: 'application/pdf' };
    const doc = criarDocumentoClinico({ arquivo: fakeFile });
    expect(doc.arquivo).toEqual({ name: 'laudo.pdf', size: 1024, type: 'application/pdf' });
  });
});

describe('integrarDocumentoNoDossie', () => {
  let setDossie, up, addMsg;

  beforeEach(() => {
    setDossie = vi.fn();
    up        = vi.fn();
    addMsg    = vi.fn();
  });

  it('retorna null e NÃO chama setDossie sem paciente ativo', () => {
    const doc = criarDocumentoClinico({ resumo: 'Adenocarcinoma', origem: 'upload_ia' });
    const resultado = integrarDocumentoNoDossie(doc, { pac: {}, dossie: null, setDossie, up, addMsg });
    expect(resultado).toBeNull();
    expect(setDossie).not.toHaveBeenCalled();
  });

  it('aceita documento sem resumo mas com nome (documento de recepção sem análise IA)', () => {
    // Doc sem resumo mas com nome é válido — recepção vincula antes da IA analisar
    const doc = criarDocumentoClinico({ nome: 'arquivo.pdf', resumo: '', origem: 'recepcao_upload' });
    const resultado = integrarDocumentoNoDossie(doc, { pac: PAC_ATIVO, dossie: null, setDossie, up, addMsg });
    expect(resultado).not.toBeNull();  // aceito — nome serve como textoCheck
    expect(setDossie).toHaveBeenCalledTimes(1);
    expect(resultado.documentos[0].nome).toBe('arquivo.pdf');
  });

  it('retorna null e NÃO chama setDossie quando doc é null', () => {
    const resultado = integrarDocumentoNoDossie(null, { pac: PAC_ATIVO, dossie: null, setDossie, up, addMsg });
    expect(resultado).toBeNull();
    expect(setDossie).not.toHaveBeenCalled();
  });

  it('integra documento e chama setDossie com paciente ativo + resumo', () => {
    const doc = criarDocumentoClinico({ tipo: 'Biópsia', resumo: 'CID: C50.1\nAdenocarcinoma', origem: 'upload_ia' });
    const resultado = integrarDocumentoNoDossie(doc, { pac: PAC_ATIVO, dossie: null, setDossie, up, addMsg });
    expect(resultado).not.toBeNull();
    expect(setDossie).toHaveBeenCalledTimes(1);
  });

  it('adiciona documento na FRENTE da lista (mais recente primeiro)', () => {
    const docExistente = criarDocumentoClinico({ tipo: 'TC', resumo: 'TC tórax ok', origem: 'drive_ia' });
    const dossieInicial = { id: 'DOS-X', paciente: PAC_ATIVO, documentos: [docExistente], resumoClaude: '', evolucao: { rascunho: '' }, apac: {} };
    const novoDoc = criarDocumentoClinico({ tipo: 'Biópsia', resumo: 'Adenocarcinoma CID: C50.1', origem: 'upload_ia' });

    const resultado = integrarDocumentoNoDossie(novoDoc, { pac: PAC_ATIVO, dossie: dossieInicial, setDossie, up, addMsg });
    expect(resultado.documentos[0].id).toBe(novoDoc.id);
    expect(resultado.documentos).toHaveLength(2);
  });

  it('NÃO sobrescreve campos do paciente já preenchidos via up()', () => {
    const pacComDiag = { ...PAC_ATIVO, cid: 'C18.0', diag: 'Carcinoma já confirmado' };
    const doc = criarDocumentoClinico({ resumo: 'diagnóstico: adenocarcinoma de mama. CID: C50.1', origem: 'upload_ia' });

    integrarDocumentoNoDossie(doc, { pac: pacComDiag, dossie: null, setDossie, up, addMsg });
    // up() foi chamado para cid/diag mas os valores JÁ EXISTIAM → não deve chamar para esses
    const upChamadas = up.mock.calls.map(c => c[0]); // keys que foram atualizadas
    expect(upChamadas).not.toContain('cid');   // cid = 'C18.0' já existe
    expect(upChamadas).not.toContain('diag');  // diag já existe
  });

  it('acumula docs_ia_resumo no paciente sem sobrescrever', () => {
    const pacComResumo = { ...PAC_ATIVO, docs_ia_resumo: 'RESUMO ANTERIOR' };
    const doc = criarDocumentoClinico({ resumo: 'NOVO RESUMO', origem: 'upload_ia' });
    integrarDocumentoNoDossie(doc, { pac: pacComResumo, dossie: null, setDossie, up, addMsg });
    const upResumo = up.mock.calls.find(c => c[0] === 'docs_ia_resumo');
    expect(upResumo).toBeTruthy();
    expect(upResumo[1]).toContain('RESUMO ANTERIOR');
    expect(upResumo[1]).toContain('NOVO RESUMO');
  });

  it('não duplica documento com mesmo id', () => {
    const doc = criarDocumentoClinico({ tipo: 'TC', resumo: 'TC ok CID: C18.0', origem: 'drive_ia' });
    const dossieComDoc = { id: 'DOS-Y', paciente: PAC_ATIVO, documentos: [doc], resumoClaude: '', evolucao: { rascunho: '' }, apac: {} };
    const resultado = integrarDocumentoNoDossie(doc, { pac: PAC_ATIVO, dossie: dossieComDoc, setDossie, up, addMsg });
    expect(resultado.documentos).toHaveLength(1); // sem duplicata
  });
});

describe('integrarDocumentosNoDossie (múltiplos)', () => {
  it('integra N documentos em sequência e retorna último dossie', () => {
    const setDossie = vi.fn();
    const up = vi.fn();
    const docs = [
      criarDocumentoClinico({ resumo: 'Biópsia: CID: C50.1 adenocarcinoma', origem: 'upload_ia' }),
      criarDocumentoClinico({ resumo: 'TC tórax sem metástases', origem: 'upload_ia' }),
    ];
    const resultado = integrarDocumentosNoDossie(docs, { pac: PAC_ATIVO, dossie: null, setDossie, up, addMsg: vi.fn() });
    expect(resultado).not.toBeNull();
    expect(setDossie).toHaveBeenCalledTimes(2); // uma vez por documento
    expect(resultado.documentos).toHaveLength(2);
  });

  it('para na primeira falha de segurança e retorna último sucesso', () => {
    const setDossie = vi.fn();
    const docs = [
      criarDocumentoClinico({ resumo: 'Laudo ok', origem: 'upload_ia' }),
      criarDocumentoClinico({ resumo: 'Laudo 2', origem: 'upload_ia' }),
    ];
    // Sem paciente → ambos bloqueiam
    const resultado = integrarDocumentosNoDossie(docs, { pac: {}, dossie: null, setDossie, up: vi.fn(), addMsg: vi.fn() });
    expect(resultado).toBeNull();
    expect(setDossie).not.toHaveBeenCalled();
  });
});
