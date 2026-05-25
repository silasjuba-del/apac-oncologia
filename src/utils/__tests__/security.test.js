// security.test.js — Testes P0: guards de identidade de paciente e storage helpers
// npm test
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks de dependências externas ───────────────────────────────────────────
vi.mock('../../features/oncoProUtils.js', () => ({
  chavePaciente: (pac) => {
    const v = pac?.pacID || pac?.cpf || pac?.cns || pac?.nome;
    return v ? String(v).toLowerCase().replace(/[^a-z0-9]+/g, '_') : null;
  },
}));

vi.mock('../../components/ui/primitives', () => ({
  NOW: () => new Date().toISOString(),
}));

import {
  requireActivePatient,
  normalizaPacienteValor,
  mesmoPacienteDossie,
  pacientePareceTeste,
  marcarEvolucoesNaoValidadas,
  FONTES_SEGURAS,
  dataPacienteChave,
  nomesPacienteCompativeis,
  palavrasNomePaciente,
  extrairCpfsProntuario,
  extrairCnssProntuario,
  extrairDatasNascimentoProntuario,
  extrairNomeIdentificadoProntuario,
  dossiePacienteKey,
  digitosPacienteValor,
  escapeRegexPaciente,
  nomePacienteNoTexto,
  mensagemProntuarioSecurity,
} from '../security';

// ─────────────────────────────────────────────────────────────────────────────
describe('requireActivePatient — P0 guard', () => {

  it('paciente com pacID → ativo (true)', () => {
    expect(requireActivePatient({ pacID: 'PAC-001' })).toBe(true);
  });

  it('paciente com cpf → ativo (true)', () => {
    expect(requireActivePatient({ cpf: '000.000.000-00' })).toBe(true);
  });

  it('paciente com cns → ativo (true)', () => {
    expect(requireActivePatient({ cns: '123456789012345' })).toBe(true);
  });

  it('paciente com apenas nome (sem IDs) → inativo (false)', () => {
    expect(requireActivePatient({ nome: 'Maria' })).toBe(false);
  });

  it('paciente vazio {} → inativo (false)', () => {
    expect(requireActivePatient({})).toBe(false);
  });

  it('null → inativo (false)', () => {
    expect(requireActivePatient(null)).toBe(false);
  });

  it('undefined → inativo (false)', () => {
    expect(requireActivePatient(undefined)).toBe(false);
  });

  it('pacID vazio string → inativo (false)', () => {
    // String vazia é falsy em JS
    expect(requireActivePatient({ pacID: '' })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('normalizaPacienteValor', () => {

  it('remove acentos', () => {
    expect(normalizaPacienteValor('José')).toBe('jose');
    expect(normalizaPacienteValor('Antônia')).toBe('antonia');
    expect(normalizaPacienteValor('João')).toBe('joao');
  });

  it('converte para minúsculas', () => {
    expect(normalizaPacienteValor('MARIA')).toBe('maria');
  });

  it('remove caracteres especiais e pontuação', () => {
    expect(normalizaPacienteValor('000.000.000-00')).toBe('000 000 000 00');
  });

  it('null/undefined → string vazia', () => {
    expect(normalizaPacienteValor(null)).toBe('');
    expect(normalizaPacienteValor(undefined)).toBe('');
    expect(normalizaPacienteValor('')).toBe('');
  });

  it('trim de espaços nas bordas', () => {
    expect(normalizaPacienteValor('  Maria  ')).toBe('maria');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('dataPacienteChave', () => {

  it('data BR dd/mm/aaaa → ddmmaaaa', () => {
    expect(dataPacienteChave('15/03/1968')).toBe('15031968');
  });

  it('data ISO aaaa-mm-dd → ddmmaaaa', () => {
    expect(dataPacienteChave('1968-03-15')).toBe('15031968');
  });

  it('string vazia → string vazia', () => {
    expect(dataPacienteChave('')).toBe('');
    expect(dataPacienteChave(null)).toBe('');
  });

  it('ano 2 dígitos → trata como 20xx', () => {
    const r = dataPacienteChave('15/03/26');
    expect(r).toBe('15032026');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('nomesPacienteCompativeis', () => {

  it('mesmo nome exato → compatíveis', () => {
    expect(nomesPacienteCompativeis('Maria Silva', 'Maria Silva')).toBe(true);
  });

  it('mesmo nome normalizado (acentos) → compatíveis', () => {
    expect(nomesPacienteCompativeis('José Ferreira', 'Jose Ferreira')).toBe(true);
  });

  it('primeiro e último nome iguais → compatíveis (mesmo com nome do meio diferente)', () => {
    // 'Maria A. Silva': 'A.' tem 1 char, é filtrado; primeiro=maria, último=silva
    // 'Maria Antônia Silva': primeiro=maria, último=silva → compatíveis
    expect(nomesPacienteCompativeis('Maria Antônia Silva', 'Maria A. Silva')).toBe(true);
    expect(nomesPacienteCompativeis('Maria Antônia Silva', 'Maria Silva')).toBe(true);
  });

  it('primeiro nome diferente → incompatíveis', () => {
    expect(nomesPacienteCompativeis('Ana Silva', 'Maria Silva')).toBe(false);
  });

  it('nomes completamente diferentes → incompatíveis', () => {
    expect(nomesPacienteCompativeis('Maria Silva', 'José Ferreira')).toBe(false);
  });

  it('string vazia → incompatíveis', () => {
    expect(nomesPacienteCompativeis('', 'Maria Silva')).toBe(false);
    expect(nomesPacienteCompativeis('Maria Silva', '')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('palavrasNomePaciente', () => {

  it('remove preposições (de, da, do, das, dos)', () => {
    const r = palavrasNomePaciente('Maria das Graças Silva');
    expect(r).not.toContain('das');
    expect(r).toContain('maria');
    expect(r).toContain('gracas');
    expect(r).toContain('silva');
  });

  it('remove palavras com menos de 3 letras', () => {
    const r = palavrasNomePaciente('Ana de Souza');
    expect(r).not.toContain('de');
    // 'ana' tem 3 letras — deve ser incluída
    expect(r).toContain('ana');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('mesmoPacienteDossie', () => {

  const DOSSIE_BASE = {
    paciente: { pacID: 'PAC-001', nome: 'Maria Silva', cpf: '00000000000', cns: '123456789012345' },
    resumoClaude: 'texto longo',
    documentos: [],
    evolucao: { textoFinal: '', rascunho: '' },
  };

  it('mesmo pacID → mesmo paciente', () => {
    expect(mesmoPacienteDossie(DOSSIE_BASE, { pacID: 'PAC-001' })).toBe(true);
  });

  it('mesmo CPF → mesmo paciente', () => {
    expect(mesmoPacienteDossie(DOSSIE_BASE, { cpf: '00000000000' })).toBe(true);
  });

  it('mesmo CNS → mesmo paciente', () => {
    expect(mesmoPacienteDossie(DOSSIE_BASE, { cns: '123456789012345' })).toBe(true);
  });

  it('mesmo nome sem IDs alternativos → mesmo paciente', () => {
    const dossie = { paciente: { nome: 'Maria Silva' }, resumoClaude: 'texto', documentos: [], evolucao: { textoFinal: '', rascunho: '' } };
    expect(mesmoPacienteDossie(dossie, { nome: 'Maria Silva' })).toBe(true);
  });

  it('pacID diferente mas dossie vazio (sem conteúdo) → considera compatível', () => {
    const dossieVazio = { paciente: { nome: 'João' }, resumoClaude: '', documentos: [], evolucao: { textoFinal: '', rascunho: '' } };
    // Sem conteúdo → retorna true (dossiê vazio não pode contaminar)
    expect(mesmoPacienteDossie(dossieVazio, { nome: 'Maria' })).toBe(true);
  });

  it('nome diferente e dossie tem conteúdo → pacientes diferentes (false)', () => {
    const dossieComConteudo = { ...DOSSIE_BASE, resumoClaude: 'conteudo importante' };
    expect(mesmoPacienteDossie(dossieComConteudo, { nome: 'José Ferreira', pacID: 'PAC-999' })).toBe(false);
  });

  it('dossie vazio {} → retorna true (não há conteúdo para contaminar)', () => {
    expect(mesmoPacienteDossie({}, { nome: 'Maria' })).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('pacientePareceTeste', () => {

  it('nome "Paciente Teste" → parece teste', () => {
    expect(pacientePareceTeste({ nome: 'Paciente Teste' })).toBe(true);
  });

  it('CPF "000.000.000-00" sem indicador no nome → não parece teste', () => {
    // A função verifica texto, não CPF especificamente
    expect(pacientePareceTeste({ nome: 'Maria Silva', cpf: '000.000.000-00' })).toBe(false);
  });

  it('nome "Fulano de Tal" → parece teste', () => {
    expect(pacientePareceTeste({ nome: 'Fulano de Tal' })).toBe(true);
  });

  it('nome "Ciclano Santos" → parece teste', () => {
    expect(pacientePareceTeste({ nome: 'Ciclano Santos' })).toBe(true);
  });

  it('nome "Demo paciente" → parece teste', () => {
    expect(pacientePareceTeste({ nome: 'Demo Maria' })).toBe(true);
  });

  it('paciente real não parece teste', () => {
    expect(pacientePareceTeste({ nome: 'Maria das Graças Silva' })).toBe(false);
    expect(pacientePareceTeste({ nome: 'José Ferreira Neto' })).toBe(false);
  });

  it('objeto vazio → não parece teste', () => {
    expect(pacientePareceTeste({})).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('marcarEvolucoesNaoValidadas — P0', () => {

  it('evolução com fonte segura → _validado true', () => {
    const evs = [{ texto: 'ev1', fonte: 'dossie' }];
    const r = marcarEvolucoesNaoValidadas(evs);
    expect(r[0]._validado).toBe(true);
    expect(r[0]._fonteOriginal).toBe('dossie');
  });

  it('evolução sem fonte → _validado false, fonteOriginal "desconhecida"', () => {
    const evs = [{ texto: 'ev2' }];
    const r = marcarEvolucoesNaoValidadas(evs);
    expect(r[0]._validado).toBe(false);
    expect(r[0]._fonteOriginal).toBe('desconhecida');
  });

  it('evolução com fonte desconhecida (fora da whitelist) → _validado false', () => {
    const evs = [{ texto: 'ev3', fonte: 'fonte_estranha' }];
    const r = marcarEvolucoesNaoValidadas(evs);
    expect(r[0]._validado).toBe(false);
    expect(r[0]._fonteOriginal).toBe('fonte_estranha');
  });

  it('todas as fontes da whitelist → _validado true', () => {
    const fontes = [...FONTES_SEGURAS];
    const evs = fontes.map(f => ({ texto: 'ev', fonte: f }));
    const r = marcarEvolucoesNaoValidadas(evs);
    r.forEach(ev => expect(ev._validado).toBe(true));
  });

  it('array vazio → array vazio', () => {
    expect(marcarEvolucoesNaoValidadas([])).toHaveLength(0);
  });

  it('não muta o objeto original', () => {
    const ev = { texto: 'x', fonte: 'dossie' };
    const [r] = marcarEvolucoesNaoValidadas([ev]);
    expect(r).not.toBe(ev);
    expect(ev._validado).toBeUndefined();
  });

  it('FONTES_SEGURAS contém "dossie", "ia", "prescricao_qt"', () => {
    expect(FONTES_SEGURAS.has('dossie')).toBe(true);
    expect(FONTES_SEGURAS.has('ia')).toBe(true);
    expect(FONTES_SEGURAS.has('prescricao_qt')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('extrairCpfsProntuario', () => {

  it('extrai CPF formatado', () => {
    const r = extrairCpfsProntuario('CPF: 123.456.789-00 do paciente');
    expect(r).toContain('12345678900');
  });

  it('extrai CPF sem formatação', () => {
    const r = extrairCpfsProntuario('CPF 12345678900');
    expect(r).toContain('12345678900');
  });

  it('texto sem CPF → array vazio', () => {
    expect(extrairCpfsProntuario('Nenhum cpf aqui')).toHaveLength(0);
  });

  it('texto vazio → array vazio', () => {
    expect(extrairCpfsProntuario('')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('extrairCnssProntuario', () => {

  it('extrai CNS de 15 dígitos', () => {
    const r = extrairCnssProntuario('CNS 123456789012345 do paciente');
    expect(r).toContain('123456789012345');
  });

  it('texto sem CNS → array vazio', () => {
    expect(extrairCnssProntuario('sem cns aqui 1234')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('extrairDatasNascimentoProntuario', () => {

  it('extrai data após "nasc:"', () => {
    const r = extrairDatasNascimentoProntuario('nasc: 15/03/1968');
    expect(r).toContain('15031968');
  });

  it('extrai data após "data de nascimento:"', () => {
    const r = extrairDatasNascimentoProntuario('Data de Nascimento: 22/07/1955');
    expect(r).toContain('22071955');
  });

  it('texto sem data de nascimento → array vazio', () => {
    expect(extrairDatasNascimentoProntuario('sem data aqui')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('extrairNomeIdentificadoProntuario', () => {

  it('extrai nome após "Nome:"', () => {
    const r = extrairNomeIdentificadoProntuario('Nome: Maria das Graças Silva\nDiagnóstico: câncer');
    expect(r).toBeTruthy();
    expect(r.toLowerCase()).toContain('maria');
  });

  it('extrai nome após "Paciente:"', () => {
    const r = extrairNomeIdentificadoProntuario('Paciente: José Ferreira Neto\nDiagnóstico: câncer');
    expect(r).toBeTruthy();
  });

  it('texto sem identificação de nome → string vazia', () => {
    expect(extrairNomeIdentificadoProntuario('Texto genérico sem nome identificado')).toBe('');
  });

  it('texto vazio → string vazia', () => {
    expect(extrairNomeIdentificadoProntuario('')).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('digitosPacienteValor', () => {

  it('remove não-dígitos', () => {
    expect(digitosPacienteValor('123.456.789-00')).toBe('12345678900');
    expect(digitosPacienteValor('000.000.000-00')).toBe('00000000000');
  });

  it('null/undefined → string vazia', () => {
    expect(digitosPacienteValor(null)).toBe('');
    expect(digitosPacienteValor(undefined)).toBe('');
  });

  it('já são apenas dígitos → mantém', () => {
    expect(digitosPacienteValor('12345')).toBe('12345');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('escapeRegexPaciente', () => {

  it('escapa caracteres especiais de regex', () => {
    const r = escapeRegexPaciente('Costa (Filho)');
    expect(r).toBe('Costa \\(Filho\\)');
  });

  it('texto sem especiais → inalterado', () => {
    expect(escapeRegexPaciente('Maria Silva')).toBe('Maria Silva');
  });

  it('null → string vazia', () => {
    expect(escapeRegexPaciente(null)).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('nomePacienteNoTexto', () => {

  it('nome completo presente no texto → true', () => {
    expect(nomePacienteNoTexto('Maria Silva', 'Paciente: maria silva — diagnóstico confirmado')).toBe(true);
  });

  it('primeiro e último nome presentes → true', () => {
    expect(nomePacienteNoTexto('Maria das Graças Silva', 'texto com maria silva identificada')).toBe(true);
  });

  it('nome ausente no texto → false', () => {
    expect(nomePacienteNoTexto('Maria Silva', 'Paciente José Ferreira atendido')).toBe(false);
  });

  it('nome ou texto vazios → false', () => {
    expect(nomePacienteNoTexto('', 'algum texto')).toBe(false);
    expect(nomePacienteNoTexto('Maria', '')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('mensagemProntuarioSecurity', () => {

  it('formata mensagem com problemas', () => {
    const res = {
      pacienteAtual: 'Maria Silva',
      origem: 'Prontuário',
      problemas: ['CPF divergente', 'Nome diferente'],
      alertas: [],
    };
    const msg = mensagemProntuarioSecurity(res);
    expect(msg).toContain('PRONTUÁRIO SECURITY');
    expect(msg).toContain('Maria Silva');
    expect(msg).toContain('CPF divergente');
    expect(msg).toContain('Nome diferente');
  });

  it('inclui alertas quando presentes', () => {
    const res = {
      pacienteAtual: 'José',
      origem: 'Teste',
      problemas: ['erro'],
      alertas: ['aviso adicional'],
    };
    const msg = mensagemProntuarioSecurity(res);
    expect(msg).toContain('aviso adicional');
  });

  it('funciona com resultado vazio', () => {
    const msg = mensagemProntuarioSecurity({});
    expect(msg).toContain('PRONTUÁRIO SECURITY');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('dossiePacienteKey', () => {

  it('usa pacID quando disponível', () => {
    const k = dossiePacienteKey({ pacID: 'PAC-001' });
    expect(k).toMatch(/dossie_oncologico_pac_001/);
  });

  it('fallback para cpf quando sem pacID', () => {
    const k = dossiePacienteKey({ cpf: '000.000.000-00' });
    expect(k).toContain('dossie_oncologico_');
    expect(k.length).toBeGreaterThan(20);
  });

  it('paciente vazio → usa "sem_paciente"', () => {
    const k = dossiePacienteKey({});
    expect(k).toContain('sem_paciente');
  });
});
