// apacDeterministico.test.js — Testes P3: resolucao deterministica de campos APAC
// npm test
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi } from 'vitest';

// ── Mock de apacValidator (getCIDFromDiag / getSIGTAPFromDiag) ────────────────
vi.mock('../apacValidator', () => ({
  getCIDFromDiag: (diag) => {
    if (!diag) return null;
    const d = diag.toLowerCase();
    if (d.includes('mama'))    return 'C50.9';
    if (d.includes('pulmao') || d.includes('pulmão')) return 'C34.1';
    if (d.includes('colon') || d.includes('cólon'))   return 'C18.9';
    return null;
  },
  getSIGTAPFromDiag: (diag) => {
    if (!diag) return null;
    const d = diag.toLowerCase();
    if (d.includes('mama')) return { codigo: '03.04.02.002-3', nome: 'QT Mama' };
    return null;
  },
}));

import { resolverCampoAPAC, resolverAPACCompleta, CAMPOS_APAC, STATUS_META } from '../apacDeterministico';

// ─────────────────────────────────────────────────────────────────────────────

const PAC_COMPLETO = {
  pacID: 'PAC-001',
  nome: 'Maria Teste',
  cpf: '000.000.000-00',
  cns: '123456789012345',
  nasc: '01/01/1970',
  mae: 'Ana Teste',
  cidade: 'Patos',
  cid: 'C50.9',
  diag: 'Adenocarcinoma de mama',
  cod_proc: '03040200023',
  justif_apac: 'A'.repeat(100),
  estadio: 'IIIA',
  trat: 'AC-T',
  tnm: 'T2N1M0',
  bio: 'RE+',
  ecog: '1',
  data_sol: '25/05/2026',
};

const DOSSIE_BASE = {
  documentos: [],
  evolucao: { textoFinal: '', rascunho: '' },
  resumoClaude: '',
};

// ─────────────────────────────────────────────────────────────────────────────
describe('resolverCampoAPAC — campos demograficos', () => {

  it('nome preenchido → status preenchido, fonte pac.nome', () => {
    const r = resolverCampoAPAC('nome', { nome: 'Maria' });
    expect(r.status).toBe('preenchido');
    expect(r.valor).toBe('Maria');
    expect(r.fonte).toBe('pac.nome');
  });

  it('nome vazio → ausente', () => {
    const r = resolverCampoAPAC('nome', {});
    expect(r.status).toBe('ausente');
    expect(r.valor).toBeNull();
  });

  it('nasc via campo alternativo dataNasc', () => {
    const r = resolverCampoAPAC('nasc', { dataNasc: '10/05/1980' });
    expect(r.status).toBe('preenchido');
    expect(r.fonte).toBe('pac.dataNasc');
  });

  it('cidade via pac.municipio quando pac.cidade ausente', () => {
    const r = resolverCampoAPAC('cidade', { municipio: 'Campina Grande' });
    expect(r.status).toBe('preenchido');
    expect(r.fonte).toBe('pac.municipio');
  });

  it('campo desconhecido cai no default — usa pac[campo]', () => {
    const r = resolverCampoAPAC('ecog', { ecog: '0' });
    expect(r.status).toBe('preenchido');
    expect(r.valor).toBe('0');
  });

  it('campo desconhecido sem valor → ausente', () => {
    const r = resolverCampoAPAC('ecog', {});
    expect(r.status).toBe('ausente');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('resolverCampoAPAC — CID-10', () => {

  it('CID direto em pac.cid → preenchido', () => {
    const r = resolverCampoAPAC('cid', { cid: 'C50.9', diag: 'Adenocarcinoma de mama' });
    // Inferencia coincide → preenchido (sem inconsistencia)
    expect(r.status).toBe('preenchido');
    expect(r.valor).toBe('C50.9');
    expect(r.fonte).toBe('pac.cid');
  });

  it('CID ausente mas diagnostico permite inferencia → inferido', () => {
    const r = resolverCampoAPAC('cid', { diag: 'Adenocarcinoma de mama' });
    expect(r.status).toBe('inferido');
    expect(r.valor).toBe('C50.9');
    expect(r.fonte).toBe('ia:diagCID');
  });

  it('CID ausente e diag sem match → ausente', () => {
    const r = resolverCampoAPAC('cid', { diag: 'Síndrome rara sem CID mapeado' });
    expect(r.status).toBe('ausente');
  });

  it('CID no pac conflita com CID inferido do diag → inconsistente', () => {
    const r = resolverCampoAPAC('cid', { cid: 'C34.1', diag: 'Adenocarcinoma de mama' });
    // pac.cid = C34.1 (pulmao), diag sugere C50.9 (mama) — conflito
    expect(r.status).toBe('inconsistente');
    expect(r.valor).toBe('C34.1');           // mantém valor do médico
    expect(r.valorAlternativo).toBe('C50.9'); // IA sugere C50.9
  });

  it('CID via camposIA do documento quando pac.cid ausente', () => {
    const dossie = {
      documentos: [{ nome: 'laudo.pdf', camposIA: { cid: 'C18.9' } }],
      evolucao: { textoFinal: '' },
    };
    const r = resolverCampoAPAC('cid', {}, dossie);
    expect(r.status).toBe('inferido');
    expect(r.valor).toBe('C18.9');
    expect(r.fonte).toBe('doc:laudo.pdf');
  });

  it('CID via pac.cid_sugerido quando cid principal ausente', () => {
    const r = resolverCampoAPAC('cid', { cid_sugerido: 'C56' });
    expect(r.status).toBe('preenchido');
    expect(r.fonte).toBe('pac.cid_sugerido');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('resolverCampoAPAC — cod_proc (SIGTAP)', () => {

  it('codigo direto → preenchido', () => {
    const r = resolverCampoAPAC('cod_proc', { cod_proc: '03040200023' });
    expect(r.status).toBe('preenchido');
    expect(r.fonte).toBe('pac.cod_proc');
  });

  it('ausente mas diag de mama → inferido via getSIGTAPFromDiag', () => {
    const r = resolverCampoAPAC('cod_proc', { diag: 'Adenocarcinoma de mama' });
    expect(r.status).toBe('inferido');
    expect(r.valor).toBe('03.04.02.002-3');
    expect(r.fonte).toBe('ia:diagSIGTAP');
  });

  it('ausente e diag sem SIGTAP mapeado → ausente', () => {
    const r = resolverCampoAPAC('cod_proc', { diag: 'Tumor raro sem protocolo' });
    expect(r.status).toBe('ausente');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('resolverCampoAPAC — justificativa clinica', () => {

  it('justificativa longa em pac → preenchido', () => {
    const r = resolverCampoAPAC('justif_apac', { justif_apac: 'A'.repeat(100) });
    expect(r.status).toBe('preenchido');
  });

  it('justificativa curta em pac → preenchido (medico revisará)', () => {
    const r = resolverCampoAPAC('justif_apac', { justif_apac: 'curta' });
    expect(r.status).toBe('preenchido');
  });

  it('ausente em pac mas evolucao longa no dossie → inferido', () => {
    const dossie = { evolucao: { textoFinal: 'B'.repeat(200) }, documentos: [], resumoClaude: '' };
    const r = resolverCampoAPAC('justif_apac', {}, dossie);
    expect(r.status).toBe('inferido');
    expect(r.fonte).toBe('dossie:evolucao');
  });

  it('ausente em pac e sem evolucao, resumoClaude longo → inferido', () => {
    const dossie = { evolucao: { textoFinal: '' }, documentos: [], resumoClaude: 'C'.repeat(150) };
    const r = resolverCampoAPAC('justif_apac', {}, dossie);
    expect(r.status).toBe('inferido');
    expect(r.fonte).toBe('dossie:resumoClaude');
  });

  it('tudo ausente → ausente', () => {
    const r = resolverCampoAPAC('justif_apac', {}, DOSSIE_BASE);
    expect(r.status).toBe('ausente');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('resolverCampoAPAC — estadiamento', () => {

  it('estadio direto → preenchido', () => {
    const r = resolverCampoAPAC('estadio', { estadio: 'IIIA' });
    expect(r.status).toBe('preenchido');
    expect(r.fonte).toBe('pac.estadio');
  });

  it('sem estadio mas com tnm → inferido via pac.tnm', () => {
    const r = resolverCampoAPAC('estadio', { tnm: 'T2N1M0' });
    expect(r.status).toBe('inferido');
    expect(r.valor).toBe('T2N1M0');
    expect(r.fonte).toBe('pac.tnm');
  });

  it('sem estadio nem tnm mas regex bate em pac.anatom → inferido', () => {
    const r = resolverCampoAPAC('estadio', { anatom: 'Conclusão: Estádio IIIB confirmado.' });
    expect(r.status).toBe('inferido');
    expect(r.valor).toBe('IIIB');
    expect(r.fonte).toBe('ia:laudos');
  });

  it('TNM em texto de laudo → inferido', () => {
    const r = resolverCampoAPAC('estadio', { imagen: 'Achados: pT2N1M0 em TC tórax.' });
    expect(r.status).toBe('inferido');
    expect(r.fonte).toBe('ia:laudos');
  });

  it('nada disponivel → ausente', () => {
    const r = resolverCampoAPAC('estadio', {});
    expect(r.status).toBe('ausente');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('resolverCampoAPAC — diagnostico', () => {

  it('diag direto → preenchido', () => {
    const r = resolverCampoAPAC('diag', { diag: 'Adenocarcinoma de mama' });
    expect(r.status).toBe('preenchido');
  });

  it('sem diag mas com anatom contendo conclusao → inferido', () => {
    const r = resolverCampoAPAC('diag', {
      anatom: 'Diagnóstico: Adenocarcinoma moderadamente diferenciado de mama direita.',
    });
    expect(r.status).toBe('inferido');
    expect(r.fonte).toBe('ia:anatom');
  });

  it('diag difere do doc → inconsistente', () => {
    const dossie = {
      documentos: [{ nome: 'biopsia.pdf', camposIA: { diag: 'Carcinoma de células escamosas' } }],
      evolucao: { textoFinal: '' },
    };
    const r = resolverCampoAPAC('diag', { diag: 'Adenocarcinoma' }, dossie);
    expect(r.status).toBe('inconsistente');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('resolverCampoAPAC — biomarcadores', () => {

  it('bio direto → preenchido', () => {
    const r = resolverCampoAPAC('bio', { bio: 'RE+, HER2-' });
    expect(r.status).toBe('preenchido');
  });

  it('campos separados re/rp/her2 → preenchido concatenado', () => {
    const r = resolverCampoAPAC('bio', { re: 'Positivo', rp: 'Negativo', her2: 'Negativo' });
    expect(r.status).toBe('preenchido');
    expect(r.valor).toContain('RE:Positivo');
    expect(r.valor).toContain('HER2:Negativo');
  });

  it('RE no anatom → inferido', () => {
    const r = resolverCampoAPAC('bio', { anatom: 'RE: Positivo (90%). HER2: Negativo.' });
    expect(r.status).toBe('inferido');
    expect(r.fonte).toBe('ia:anatom');
  });

  it('sem bio e sem anatom → ausente', () => {
    const r = resolverCampoAPAC('bio', {});
    expect(r.status).toBe('ausente');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('resolverAPACCompleta', () => {

  it('paciente completo → pendencias vazias, score alto', () => {
    const r = resolverAPACCompleta(PAC_COMPLETO, DOSSIE_BASE);
    expect(r.pendencias).toHaveLength(0);
    expect(r.scoreAntiGlosa).toBeGreaterThanOrEqual(80);
    expect(r.riscoGlosa).toBe('baixo');
    expect(r.completa).toBe(true);
  });

  it('paciente vazio → pendencias cobrindo todos os req', () => {
    const r = resolverAPACCompleta({}, DOSSIE_BASE);
    const reqCampos = CAMPOS_APAC.filter(c => c.req).map(c => c.label);
    reqCampos.forEach(label => expect(r.pendencias).toContain(label));
    expect(r.riscoGlosa).toBe('alto');
    // Sem inconsistencias (+10 bonus) mas todos os req ausentes (0pts base) → score = 10
    expect(r.scoreAntiGlosa).toBe(10);
    expect(r.completa).toBe(false);
  });

  it('campos inferidos por IA aparecem na lista inferidos', () => {
    const r = resolverAPACCompleta({ diag: 'Adenocarcinoma de mama' }, DOSSIE_BASE);
    // CID e SIGTAP devem ser inferidos
    expect(r.inferidos).toContain('CID-10 principal');
    expect(r.inferidos).toContain('Codigo SIGTAP');
  });

  it('inconsistencia detectada aparece na lista inconsistencias', () => {
    const r = resolverAPACCompleta({ cid: 'C34.1', diag: 'Adenocarcinoma de mama' }, DOSSIE_BASE);
    expect(r.inconsistencias).toContain('CID-10 principal');
  });

  it('todos os 16 campos APAC aparecem no resultado', () => {
    const r = resolverAPACCompleta(PAC_COMPLETO, DOSSIE_BASE);
    expect(Object.keys(r.campos)).toHaveLength(CAMPOS_APAC.length);
    CAMPOS_APAC.forEach(({ campo }) => {
      expect(r.campos[campo]).toBeDefined();
      expect(r.campos[campo].status).toMatch(/^(preenchido|inferido|ausente|inconsistente)$/);
    });
  });

  it('evolucao longa no dossie preenche justif_apac como inferida', () => {
    const dossie = { ...DOSSIE_BASE, evolucao: { textoFinal: 'D'.repeat(200) } };
    const r = resolverAPACCompleta({}, dossie);
    expect(r.campos.justif_apac.status).toBe('inferido');
    expect(r.campos.justif_apac.fonte).toBe('dossie:evolucao');
  });

  it('score minimo com pac vazio = 10 (bonus nao-inconsistente)', () => {
    // Formula: 70pts req + 20pts cobertura + 10pts sem inconsistencias
    // Pac vazio: req=0, cobertura=0, inconsistencias=0 → score = 10
    const r = resolverAPACCompleta({}, DOSSIE_BASE);
    expect(r.scoreAntiGlosa).toBe(10);
  });

  it('score 100 apenas com campos req preenchidos diretamente (sem inferidos, sem inconsistencias)', () => {
    const r = resolverAPACCompleta(PAC_COMPLETO, DOSSIE_BASE);
    // PAC_COMPLETO tem todos os req + sem inconsistencias → deve bater 100
    expect(r.scoreAntiGlosa).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('STATUS_META — metadados de UI', () => {
  it('todos os 4 status tem icone, cor e label', () => {
    ['preenchido','inferido','ausente','inconsistente'].forEach(s => {
      expect(STATUS_META[s]).toBeDefined();
      expect(STATUS_META[s].icone).toBeTruthy();
      expect(STATUS_META[s].cor).toBeTruthy();
      expect(STATUS_META[s].label).toBeTruthy();
    });
  });
});
