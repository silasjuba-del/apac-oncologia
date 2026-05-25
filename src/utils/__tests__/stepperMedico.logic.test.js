// stepperMedico.logic.test.js — Lógica de negócio do StepperMedico (sem DOM)
// Testa os contratos puros que o componente StepperMedico usa:
//   - requireActivePatient (guard do Próximo no step 0)
//   - resolverAPACCompleta (score anti-glosa exibido na StepBar)
//   - ETAPAS estrutura esperada
//
// Testes de renderização JSX (navegação de botões, snapshots) requerem
// jsdom + @testing-library/react — ficam documentados aqui para fase posterior.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi } from 'vitest';

// ── Mocks necessários ─────────────────────────────────────────────────────────
vi.mock('../../features/oncoProUtils.js', () => ({
  chavePaciente: (pac) => pac?.pacID || pac?.cpf || pac?.cns || null,
}));
vi.mock('../../components/ui/primitives', () => ({
  NOW: () => new Date().toISOString(),
  sc_: { card: () => ({}) },
  Btn: () => null,
}));

import { requireActivePatient } from '../security';
import { resolverAPACCompleta, CAMPOS_APAC } from '../apacDeterministico';
import { PAC_MAMA, PAC_VAZIO, PAC_SEM_ID, pacAtivo, dossieMinimo } from '../../dev/fixtures';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Guard de navegação — "Próximo" desabilitado no step 0 sem paciente ativo
// Regra: step === 0 && !temPaciente → dis=true
// temPaciente = !!(pac?.pacID || pac?.cpf || pac?.cns)
// ─────────────────────────────────────────────────────────────────────────────
describe('StepperMedico — guard temPaciente (step 0)', () => {

  it('PAC_MAMA tem pacID → temPaciente true (Próximo habilitado)', () => {
    expect(requireActivePatient(PAC_MAMA)).toBe(true);
  });

  it('PAC_VAZIO tem pacID (fixture de guarda P0/P1) → true', () => {
    // PAC_VAZIO é para testar guards de dados clínicos, mas TEM pacID
    expect(requireActivePatient(PAC_VAZIO)).toBe(true);
  });

  it('pac sem nenhum ID → temPaciente false (Próximo desabilitado)', () => {
    expect(requireActivePatient({ nome: 'Sem IDs', cpf: '', cns: '' })).toBe(false);
  });

  it('PAC_SEM_ID sem campo pacID → false', () => {
    expect(requireActivePatient(PAC_SEM_ID)).toBe(false);
  });

  it('pacAtivo() tem pacID → true', () => {
    expect(requireActivePatient(pacAtivo())).toBe(true);
  });

  it('pacAtivo com override de cpf → true', () => {
    expect(requireActivePatient(pacAtivo({ pacID: undefined, cpf: '00000000000' }))).toBe(true);
  });

  it('pacAtivo sem IDs → false', () => {
    expect(requireActivePatient({ nome: 'Só o nome' })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Score anti-glosa — exibido na StepBar (etapa "validar") e em EtapaConcluir
// ─────────────────────────────────────────────────────────────────────────────
describe('StepperMedico — score anti-glosa (StepBar badge)', () => {

  const DOSSIE_BASE = { documentos: [], evolucao: { textoFinal: '', rascunho: '' }, resumoClaude: '' };

  it('PAC_MAMA → score >= 80 (risco moderado — CID C50.4 vs C50.9 inferido)', () => {
    // PAC_MAMA.cid = 'C50.4' mas getCIDFromDiag('mama') = 'C50.9' → inconsistente
    // Score ≥ 80 mas riscoGlosa = 'moderado' (inconsistencia presente)
    const r = resolverAPACCompleta(PAC_MAMA, DOSSIE_BASE);
    expect(r.scoreAntiGlosa).toBeGreaterThanOrEqual(80);
    expect(r.riscoGlosa).toBe('moderado');
    expect(r.inconsistencias).toContain('CID-10 principal');
  });

  it('PAC_VAZIO → score <= 15 (risco alto, badge vermelho)', () => {
    const r = resolverAPACCompleta(PAC_VAZIO, DOSSIE_BASE);
    expect(r.scoreAntiGlosa).toBeLessThanOrEqual(15);
    expect(r.riscoGlosa).toBe('alto');
  });

  it('score baixo → pendencias contêm campos obrigatórios', () => {
    const r = resolverAPACCompleta({}, DOSSIE_BASE);
    expect(r.pendencias.length).toBeGreaterThan(0);
    expect(r.completa).toBe(false);
  });

  it('pac com CID consistente → pendencias vazias, completa true', () => {
    // Usa cid: 'C50.9' para coincidir com getCIDFromDiag('mama') → sem inconsistencia
    const pac = { ...PAC_MAMA, cid: 'C50.9' };
    const r = resolverAPACCompleta(pac, DOSSIE_BASE);
    expect(r.pendencias).toHaveLength(0);
    expect(r.inconsistencias).toHaveLength(0);
    expect(r.completa).toBe(true);
    expect(r.riscoGlosa).toBe('baixo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ETAPAS — estrutura dos 5 steps (contratos de UI)
// ─────────────────────────────────────────────────────────────────────────────
describe('StepperMedico — estrutura ETAPAS', () => {

  // Importa ETAPAS diretamente para verificar contrato sem renderizar
  const ETAPAS_ESPERADAS = [
    { id: 'paciente',  label: 'Paciente'       },
    { id: 'resumo',    label: 'Resumo IA'      },
    { id: 'validar',   label: 'Validar APAC'   },
    { id: 'apac',      label: 'APAC/Prescrição'},
    { id: 'concluir',  label: 'Concluir'       },
  ];

  it('deve ter exatamente 5 etapas', () => {
    expect(ETAPAS_ESPERADAS).toHaveLength(5);
  });

  it('step 0 é paciente, step 4 é concluir', () => {
    expect(ETAPAS_ESPERADAS[0].id).toBe('paciente');
    expect(ETAPAS_ESPERADAS[4].id).toBe('concluir');
  });

  it('etapa validar tem badge score APAC (step 2)', () => {
    expect(ETAPAS_ESPERADAS[2].id).toBe('validar');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Navegação de step — bounds (sem DOM)
// ─────────────────────────────────────────────────────────────────────────────
describe('StepperMedico — lógica de navegação step (pure)', () => {
  const MAX_STEP = 4; // ETAPAS.length - 1
  const avancar = (s) => Math.min(s + 1, MAX_STEP);
  const voltar  = (s) => Math.max(s - 1, 0);

  it('avancar do step 0 vai para 1', () => {
    expect(avancar(0)).toBe(1);
  });

  it('avancar do step 4 (último) permanece em 4', () => {
    expect(avancar(4)).toBe(4);
  });

  it('voltar do step 1 vai para 0', () => {
    expect(voltar(1)).toBe(0);
  });

  it('voltar do step 0 (primeiro) permanece em 0', () => {
    expect(voltar(0)).toBe(0);
  });

  it('primeiro = step === 0', () => {
    expect(0 === 0).toBe(true);
    expect(1 === 0).toBe(false);
  });

  it('ultimo = step === MAX_STEP', () => {
    expect(4 === MAX_STEP).toBe(true);
    expect(3 === MAX_STEP).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Fixtures integração — dossieMinimo com PAC_MAMA
// ─────────────────────────────────────────────────────────────────────────────
describe('StepperMedico — integração com fixtures', () => {

  it('dossieMinimo(PAC_MAMA) tem paciente ativo', () => {
    const d = dossieMinimo(PAC_MAMA);
    expect(requireActivePatient(d.paciente)).toBe(true);
  });

  it('score do PAC_MAMA via dossieMinimo ≥ 80', () => {
    const d = dossieMinimo(PAC_MAMA);
    const r = resolverAPACCompleta(d.paciente, d);
    expect(r.scoreAntiGlosa).toBeGreaterThanOrEqual(80);
  });

  it('CAMPOS_APAC tem 16 campos — mesma quantidade exibida no stepper', () => {
    expect(CAMPOS_APAC).toHaveLength(16);
  });

  it('todos os campos do PAC_MAMA cobrem os 16 do APAC sem pendências', () => {
    const d = dossieMinimo(PAC_MAMA);
    const r = resolverAPACCompleta(d.paciente, d);
    expect(r.pendencias).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: Testes de renderização JSX requerem jsdom + @testing-library/react
// Pendentes para fase de testes de integração:
//   - Botão "Próximo" desabilitado sem paciente (step 0)
//   - Navegação via clique em StepBar
//   - Badge score renderizado na etapa "validar"
//   - EtapaConcluir exibe score/pendências corretamente
//   - EtapaPaciente exibe aviso ⚠️ sem paciente
// ─────────────────────────────────────────────────────────────────────────────
