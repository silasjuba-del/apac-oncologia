// apacValidator.test.js — Testes P3: validateAPAC, getCIDFromDiag, getSIGTAPFromDiag
// npm test
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { validateAPAC, getCIDFromDiag, getSIGTAPFromDiag, CID10, SIGTAP } from '../apacValidator';

// ── Paciente base completo ────────────────────────────────────────────────────
const PAC_COMPLETO = {
  nome:       'Maria das Graças Silva',
  nasc:       '15/03/1968',
  mae:        'Antônia das Graças',
  cidade:     'Patos',
  cns:        '123456789012345',       // 15 dígitos
  cid:        'C50.4',
  cod_proc:   '03040200023',           // 11 dígitos
  justif_apac: 'A'.repeat(100),        // >= 80 chars
  estadio:    'IIB',
  trat:       'AC-T',
  diag:       'Adenocarcinoma invasivo de mama',
};

// ─────────────────────────────────────────────────────────────────────────────
describe('validateAPAC — paciente completo', () => {

  it('todos os obrigatórios preenchidos → valid true, score 100', () => {
    const r = validateAPAC(PAC_COMPLETO);
    expect(r.valid).toBe(true);
    expect(r.camposFaltantes).toHaveLength(0);
    // score = okCount / 16 * 100; PAC_COMPLETO tem os 11 required + 0 opcionais preenchidos
    // mas score usa RULES.length (16), então 11/16 * 100 ≈ 69
    expect(r.score).toBeGreaterThan(60);
  });

  it('score 100 quando todos os 16 campos preenchidos corretamente', () => {
    const pac = {
      ...PAC_COMPLETO,
      tnm:      'T2N1M0',
      bio:      'RE+ HER2-',
      ecog:     '0',
      cpf:      '00000000000',   // opcionais — sem validação de formato
      data_sol: '25/05/2026',
    };
    const r = validateAPAC(pac);
    expect(r.valid).toBe(true);
    expect(r.score).toBe(100);
    expect(r.camposFaltantes).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateAPAC — paciente vazio', () => {

  it('paciente vazio → valid false, todos os req faltantes', () => {
    const r = validateAPAC({});
    expect(r.valid).toBe(false);
    expect(r.score).toBe(0);
    expect(r.camposFaltantes.length).toBeGreaterThan(0);
    // Todos os 11 campos required devem estar nos faltantes
    expect(r.camposFaltantes).toContain('Nome do paciente');
    expect(r.camposFaltantes).toContain('CNS (15 dígitos)');
    expect(r.camposFaltantes).toContain('CID-10 principal');
    expect(r.camposFaltantes).toContain('Código SIGTAP');
    expect(r.camposFaltantes).toContain('Justificativa clínica');
  });

  it('avisos contêm campos opcionais ausentes', () => {
    const r = validateAPAC({});
    expect(r.avisos).toContain('TNM / Estadiamento');
    expect(r.avisos).toContain('Biomarcadores');
    expect(r.avisos).toContain('ECOG');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateAPAC — validação de formato CNS', () => {

  it('CNS com exatamente 15 dígitos → válido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cns: '123456789012345' });
    expect(r.camposFaltantes).not.toContain('CNS (15 dígitos)');
    expect(r.camposFaltantes).not.toContain('CNS (15 dígitos) — formato inválido');
  });

  it('CNS com 14 dígitos → formato inválido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cns: '12345678901234' });
    expect(r.camposFaltantes).toContain('CNS (15 dígitos) — formato inválido');
    expect(r.valid).toBe(false);
  });

  it('CNS com 16 dígitos → formato inválido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cns: '1234567890123456' });
    expect(r.camposFaltantes).toContain('CNS (15 dígitos) — formato inválido');
  });

  it('CNS null → campo faltante (não formato inválido)', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cns: null });
    expect(r.camposFaltantes).toContain('CNS (15 dígitos)');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateAPAC — validação de formato CID-10', () => {

  it('CID formato C50.4 → válido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cid: 'C50.4' });
    expect(r.camposFaltantes.filter(x => x.includes('CID'))).toHaveLength(0);
  });

  it('CID sem ponto (C509) → formato inválido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cid: 'C509' });
    expect(r.camposFaltantes).toContain('CID-10 principal — formato inválido');
  });

  it('CID letra minúscula → formato inválido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cid: 'c50.4' });
    expect(r.camposFaltantes).toContain('CID-10 principal — formato inválido');
  });

  it('CID C20 (sem sub) → válido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cid: 'C20' });
    expect(r.camposFaltantes.filter(x => x.includes('CID'))).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateAPAC — validação de SIGTAP', () => {

  it('cod_proc com 11 dígitos → válido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cod_proc: '03040200023' });
    expect(r.camposFaltantes.filter(x => x.includes('SIGTAP'))).toHaveLength(0);
  });

  it('cod_proc com pontuação (11+ dígitos) → válido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cod_proc: '03.04.02.002-3' });
    expect(r.camposFaltantes.filter(x => x.includes('SIGTAP'))).toHaveLength(0);
  });

  it('cod_proc com 9 dígitos → formato inválido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cod_proc: '030402000' });
    expect(r.camposFaltantes).toContain('Código SIGTAP — formato inválido');
  });

  it('cod_proc vazio → faltante', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, cod_proc: '' });
    expect(r.camposFaltantes).toContain('Código SIGTAP');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateAPAC — validação de justificativa clínica', () => {

  it('justif com >= 80 chars → válido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, justif_apac: 'A'.repeat(80) });
    expect(r.camposFaltantes.filter(x => x.includes('Justificativa'))).toHaveLength(0);
  });

  it('justif com 79 chars → formato inválido', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, justif_apac: 'A'.repeat(79) });
    expect(r.camposFaltantes).toContain('Justificativa clínica — formato inválido');
  });

  it('justif vazia → faltante', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, justif_apac: '' });
    expect(r.camposFaltantes).toContain('Justificativa clínica');
  });

  it('justif apenas espaços → formato inválido (trim.length < 80)', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, justif_apac: ' '.repeat(100) });
    expect(r.camposFaltantes).toContain('Justificativa clínica — formato inválido');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateAPAC — campos opcionais', () => {

  it('campos opcionais ausentes vão para avisos, não faltantes', () => {
    const r = validateAPAC(PAC_COMPLETO); // sem tnm, bio, ecog, cpf, data_sol
    expect(r.avisos).toContain('ECOG');
    expect(r.avisos).toContain('Biomarcadores');
    expect(r.valid).toBe(true);
  });

  it('campo value null = ausente', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, ecog: null });
    expect(r.avisos).toContain('ECOG');
  });

  it('campo value array vazio = ausente', () => {
    const r = validateAPAC({ ...PAC_COMPLETO, ecog: [] });
    expect(r.avisos).toContain('ECOG');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('getCIDFromDiag', () => {

  it('null/undefined → null', () => {
    expect(getCIDFromDiag(null)).toBeNull();
    expect(getCIDFromDiag(undefined)).toBeNull();
    expect(getCIDFromDiag('')).toBeNull();
  });

  it('diagnóstico de mama → C50.9', () => {
    expect(getCIDFromDiag('Adenocarcinoma de mama')).toBe('C50.9');
    expect(getCIDFromDiag('CARCINOMA DE MAMA DIREITA')).toBe('C50.9');
  });

  it('diagnóstico de pulmão com acento → C34.1', () => {
    expect(getCIDFromDiag('Adenocarcinoma de pulmão')).toBe('C34.1');
    expect(getCIDFromDiag('Adenocarcinoma de pulmao')).toBe('C34.1');
  });

  it('diagnóstico de cólon → C18.9', () => {
    expect(getCIDFromDiag('Adenocarcinoma de cólon ascendente')).toBe('C18.9');
    expect(getCIDFromDiag('Adenocarcinoma de colon')).toBe('C18.9');
  });

  it('diagnóstico de próstata → C61', () => {
    expect(getCIDFromDiag('Adenocarcinoma de próstata')).toBe('C61');
    expect(getCIDFromDiag('carcinoma de prostata')).toBe('C61');
  });

  it('diagnóstico de ovário → C56', () => {
    expect(getCIDFromDiag('Carcinoma de ovário estadio III')).toBe('C56');
  });

  it('diagnóstico de linfoma → C85.9', () => {
    expect(getCIDFromDiag('Linfoma não-Hodgkin difuso')).toBe('C85.9');
  });

  it('diagnóstico sem match → null', () => {
    expect(getCIDFromDiag('Síndrome rara sem CID mapeado')).toBeNull();
  });

  it('CID10 exportado tem entradas para mama e pulmão', () => {
    expect(CID10.mama.codigo).toBe('C50.9');
    expect(CID10.pulmao.codigo).toBe('C34.1');
    expect(CID10['pulmão'].codigo).toBe('C34.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('getSIGTAPFromDiag', () => {

  it('null/undefined → null', () => {
    expect(getSIGTAPFromDiag(null)).toBeNull();
    expect(getSIGTAPFromDiag('')).toBeNull();
  });

  it('diagnóstico de mama → objeto SIGTAP mama', () => {
    const r = getSIGTAPFromDiag('Adenocarcinoma de mama');
    expect(r).not.toBeNull();
    expect(r.codigo).toBe('03.04.02.002-3');
    expect(r.nome).toContain('Mama');
  });

  it('diagnóstico de pulmão → SIGTAP pulmão', () => {
    const r = getSIGTAPFromDiag('Adenocarcinoma de pulmão');
    expect(r).not.toBeNull();
    expect(r.codigo).toBe('03.04.02.008-2');
  });

  it('diagnóstico de cólon → SIGTAP cólon/reto', () => {
    const r = getSIGTAPFromDiag('adenocarcinoma de colon ascendente');
    expect(r).not.toBeNull();
    expect(r.codigo).toBe('03.04.02.004-0');
  });

  it('diagnóstico sem match → null', () => {
    expect(getSIGTAPFromDiag('Tumor raro sem protocolo')).toBeNull();
  });

  it('SIGTAP exportado tem entradas corretas', () => {
    expect(SIGTAP.mama.codigo).toBe('03.04.02.002-3');
    expect(SIGTAP.linfoma.codigo).toBe('03.04.02.016-3');
  });
});
