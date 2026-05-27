// src/agents/agenteAPAC.js
// Agente APAC Oncológica — APACApp v1.0 (convertido de TypeScript)
// Hospital do Bem — Patos/PB — Dr. Silas Negrão — CRM-PB 17341
//
// ⚠  DEPRECADO — F3 (2025-05)
//
// Os validadores/formatadores abaixo foram extraídos para:
//   → src/utils/validators.js   (validarCPF, validarCNS, calcularIdade,
//                                  formatarCPF, formatarTelefone, formatarCEP…)
//
// A classe AgenteAPACOncologica NÃO é importada em nenhuma parte do projeto
// (zero imports detectados na auditoria F3). Permanece aqui apenas para não
// quebrar possível referência futura e para histórico.
//
// Para novas chamadas de IA: use src/utils/agentGateway.js → agentCall()
// ─────────────────────────────────────────────────────────────────────────────

// ─── Validadores utilitários ──────────────────────────────────────────────────

export function validarCPF(cpf) {
  const limpo = String(cpf||"").replace(/\D/g, '');
  if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(limpo[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(limpo[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(limpo[10]);
}

export function validarCNS(cns) {
  const limpo = String(cns||"").replace(/\s/g, '');
  return /^\d{15}$/.test(limpo) && /^[1279]/.test(limpo);
}

export function validarTelefone(tel) {
  const limpo = String(tel||"").replace(/\D/g, '');
  return limpo.length >= 10 && limpo.length <= 11;
}

export function calcularIdade(dataNasc) {
  if (!dataNasc) return null;
  // Aceita dd/mm/aaaa ou aaaa-mm-dd
  let nasc;
  if (dataNasc.includes('/')) {
    const [dia, mes, ano] = dataNasc.split('/').map(Number);
    nasc = new Date(ano, mes - 1, dia);
  } else {
    nasc = new Date(dataNasc);
  }
  if (isNaN(nasc)) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade >= 0 && idade <= 150 ? idade : null;
}

export function formatarCPF(cpf) {
  const limpo = String(cpf||"").replace(/\D/g, '').slice(0, 11);
  return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatarTelefone(tel) {
  const limpo = String(tel||"").replace(/\D/g, '').slice(0, 11);
  if (limpo.length === 11) return limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (limpo.length === 10) return limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return limpo;
}

export function formatarCEP(cep) {
  const limpo = String(cep||"").replace(/\D/g, '').slice(0, 8);
  return limpo.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// ─── Classe AgenteAPAC ────────────────────────────────────────────────────────

class AgenteAPACOncologica {
  constructor() {
    this.CNES = '2605473';
    this.CODIGO_ORGAO_PB = '25';
    this.CBO_ONCO = '225125';
    this.CRM_SILAS = '17341';

    this.estabelecimentoPadrao = {
      nome: 'Hospital do Bem — Unidade Oncológica',
      cnes: this.CNES,
      codigoOrgaoEmissor: this.CODIGO_ORGAO_PB,
      uf: 'PB',
      municipio: 'Patos',
      codigoIBGE: '2510600',
    };

    this.solicitantePadrao = {
      nome: 'Dr. Silas Negrão Serra Júnior',
      crm: this.CRM_SILAS,
      especialidade: 'Oncologia Clínica',
      cbo: this.CBO_ONCO,
    };
  }

  // ── Criar nova APAC ──────────────────────────────────────────────────────────

  criarNovaAPAC(tipoAPAC = 'Inicial', competencia) {
    const agora = new Date();
    const comp = competencia ?? this._formatarCompetencia(agora);
    const periodoFim = this._calcularFimValidade(agora);
    return {
      id: this._gerarId(),
      estabelecimentoSolicitante: { ...this.estabelecimentoPadrao },
      estabelecimentoExecutante: { ...this.estabelecimentoPadrao },
      paciente: this._pacienteVazio(),
      procedimentos: [],
      dadosClinicos: this._dadosClinicosVazios(),
      profissionalSolicitante: { ...this.solicitantePadrao },
      autorizacao: {
        numero: '',
        tipoAPAC,
        caraterAtendimento: 'Eletivo',
        competencia: comp,
        datasolicitacao: this._formatarData(agora),
        periodoValidadeInicio: this._formatarData(agora),
        periodoValidadeFim: periodoFim,
        status: 'Rascunho',
      },
      criadoEm: agora.toISOString(),
      atualizadoEm: agora.toISOString(),
      versao: 'APACApp v1.0',
    };
  }

  // ── Preencher do prontuário (pac) ─────────────────────────────────────────

  preencherDoProntuario(apac, dados) {
    const atualizada = JSON.parse(JSON.stringify(apac));
    if (dados.paciente) atualizada.paciente = { ...atualizada.paciente, ...dados.paciente };
    if (dados.cid10) atualizada.dadosClinicos.cid10Principal = dados.cid10;
    if (dados.diagnosticoHP) atualizada.dadosClinicos.diagnosticoHistopatologico = dados.diagnosticoHP;
    if (dados.morfologia) atualizada.dadosClinicos.morfologiaCIDO = dados.morfologia;
    if (dados.datadiagnostico) atualizada.dadosClinicos.datadiagnostico = dados.datadiagnostico;
    if (dados.tnm) {
      atualizada.dadosClinicos.tnmT = dados.tnm.t;
      atualizada.dadosClinicos.tnmN = dados.tnm.n;
      atualizada.dadosClinicos.tnmM = dados.tnm.m;
      atualizada.dadosClinicos.estadioClinco = dados.tnm.estadio;
    }
    if (dados.grau) atualizada.dadosClinicos.grauHistopatologico = dados.grau;
    if (dados.intencao) atualizada.dadosClinicos.intencaoTerapeutica = dados.intencao;
    if (dados.linha) atualizada.dadosClinicos.linhaTerapeutica = dados.linha;
    if (dados.esquema) atualizada.dadosClinicos.esquemaTerapeutico = dados.esquema;
    if (dados.justificativa) atualizada.dadosClinicos.justificativaClinica = dados.justificativa;
    if (dados.tratamentosAnteriores) atualizada.dadosClinicos.tratamentosAnteriores = dados.tratamentosAnteriores;
    atualizada.atualizadoEm = new Date().toISOString();
    return atualizada;
  }

  // ── Validação anti-glosa completa ─────────────────────────────────────────

  validar(apac) {
    const erros = [];
    const p = apac.paciente;
    const c = apac.dadosClinicos;
    const a = apac.autorizacao;

    // Paciente
    if (!p.nomePaciente?.trim())
      erros.push({ campo:'nomePaciente', bloco:'Paciente', nivel:'Bloqueante', mensagem:'Nome do paciente é obrigatório.', cod:'P001' });
    if (!validarCNS(p.cns))
      erros.push({ campo:'cns', bloco:'Paciente', nivel:'Bloqueante', mensagem:'CNS inválido (15 dígitos).', cod:'P002' });
    if (!p.dataNascimento)
      erros.push({ campo:'dataNascimento', bloco:'Paciente', nivel:'Bloqueante', mensagem:'Data de nascimento obrigatória.', cod:'P003' });
    if (!p.nomeMaeResponsavel?.trim())
      erros.push({ campo:'nomeMaeResponsavel', bloco:'Paciente', nivel:'Bloqueante', mensagem:'Nome da mãe obrigatório.', cod:'P004' });
    if (!p.municipioResidencia?.trim())
      erros.push({ campo:'municipioResidencia', bloco:'Paciente', nivel:'Alerta', mensagem:'Município de residência deve ser informado.', cod:'P005' });
    if (!p.codigoIBGEMunicipio)
      erros.push({ campo:'codigoIBGE', bloco:'Paciente', nivel:'Alerta', mensagem:'Código IBGE do município deve ser informado.', cod:'P006' });

    // Procedimentos
    const principal = apac.procedimentos.find(p => p.tipo === 'Principal');
    if (!principal)
      erros.push({ campo:'procedimentoPrincipal', bloco:'Procedimentos', nivel:'Bloqueante', mensagem:'Procedimento principal obrigatório.', cod:'PR001' });
    else if (!/^\d{10}$/.test(principal.codigo?.replace(/\./g,'')??''))
      erros.push({ campo:'codigoProcedimento', bloco:'Procedimentos', nivel:'Bloqueante', mensagem:`Código SIGTAP inválido: ${principal.codigo}.`, cod:'PR002' });

    // CID-10
    if (!c.cid10Principal)
      erros.push({ campo:'cid10Principal', bloco:'Dados Clínicos', nivel:'Bloqueante', mensagem:'CID-10 principal obrigatório.', cod:'C001' });
    else if (!this._validarCID10Onco(c.cid10Principal))
      erros.push({ campo:'cid10Principal', bloco:'Dados Clínicos', nivel:'Bloqueante', mensagem:`CID-10 ${c.cid10Principal} não é código oncológico (C00-D48).`, cod:'C002' });

    // Oncológico
    if (!c.diagnosticoHistopatologico?.trim())
      erros.push({ campo:'diagnosticoHistopatologico', bloco:'Dados Clínicos', nivel:'Bloqueante', mensagem:'Diagnóstico histopatológico obrigatório.', cod:'O001' });
    if (!c.datadiagnostico)
      erros.push({ campo:'datadiagnostico', bloco:'Dados Clínicos', nivel:'Bloqueante', mensagem:'Data do diagnóstico obrigatória.', cod:'O002' });
    if (!c.morfologiaCIDO?.trim())
      erros.push({ campo:'morfologiaCIDO', bloco:'Dados Clínicos', nivel:'Bloqueante', mensagem:'Morfologia CID-O obrigatória.', cod:'O003' });

    // TNM
    if (!c.tnmT) erros.push({ campo:'tnmT', bloco:'Estadiamento', nivel:'Bloqueante', mensagem:'T (TNM) obrigatório.', cod:'T001' });
    if (!c.tnmN) erros.push({ campo:'tnmN', bloco:'Estadiamento', nivel:'Bloqueante', mensagem:'N (TNM) obrigatório.', cod:'T002' });
    if (!c.tnmM) erros.push({ campo:'tnmM', bloco:'Estadiamento', nivel:'Bloqueante', mensagem:'M (TNM) obrigatório.', cod:'T003' });
    if (!c.estadioClinco) erros.push({ campo:'estadioClinco', bloco:'Estadiamento', nivel:'Bloqueante', mensagem:'Estádio clínico obrigatório.', cod:'T004' });

    // Conduta
    if (!c.intencaoTerapeutica) erros.push({ campo:'intencaoTerapeutica', bloco:'Conduta', nivel:'Bloqueante', mensagem:'Intenção terapêutica obrigatória.', cod:'CO001' });
    if (!c.linhaTerapeutica) erros.push({ campo:'linhaTerapeutica', bloco:'Conduta', nivel:'Bloqueante', mensagem:'Linha terapêutica obrigatória.', cod:'CO002' });
    if (!c.esquemaTerapeutico?.trim()) erros.push({ campo:'esquemaTerapeutico', bloco:'Conduta', nivel:'Bloqueante', mensagem:'Esquema terapêutico obrigatório.', cod:'CO003' });
    if (!c.justificativaClinica?.trim()) erros.push({ campo:'justificativaClinica', bloco:'Conduta', nivel:'Bloqueante', mensagem:'Justificativa clínica obrigatória.', cod:'CO004' });

    // Autorização
    if (!a.competencia) erros.push({ campo:'competencia', bloco:'Autorização', nivel:'Bloqueante', mensagem:'Competência obrigatória.', cod:'A001' });
    if (!a.periodoValidadeInicio || !a.periodoValidadeFim) erros.push({ campo:'periodoValidade', bloco:'Autorização', nivel:'Bloqueante', mensagem:'Período de validade obrigatório.', cod:'A002' });

    return erros;
  }

  calcularScoreAntiGlosa(apac) {
    const erros = this.validar(apac);
    const bloqueantes = erros.filter(e => e.nivel === 'Bloqueante');
    const alertas = erros.filter(e => e.nivel === 'Alerta');
    const score = Math.max(0, 100 - bloqueantes.length * 15 - alertas.length * 5);
    const nivel = bloqueantes.length > 0 ? 'Bloqueada' : score < 80 ? 'Risco' : 'Aprovada';
    return { score, nivel, erros, camposFaltando: erros.map(e => e.campo) };
  }

  gerarTextoLaudo(apac) {
    const p = apac.paciente;
    const c = apac.dadosClinicos;
    const a = apac.autorizacao;
    const sep = '─'.repeat(60);
    return `LAUDO PARA SOLICITAÇÃO/AUTORIZAÇÃO DE PROCEDIMENTO AMBULATORIAL
${sep}
ESTABELECIMENTO: ${apac.estabelecimentoSolicitante.nome}
CNES: ${apac.estabelecimentoSolicitante.cnes}   COMPETÊNCIA: ${a.competencia}   TIPO: ${a.tipoAPAC}
${sep}
IDENTIFICAÇÃO DO PACIENTE
Nome: ${p.nomePaciente}
CNS: ${p.cns}   Prontuário: ${p.numeroProntuario}
Nascimento: ${p.dataNascimento}   Sexo: ${p.sexo}
Mãe/Responsável: ${p.nomeMaeResponsavel}
Município: ${p.municipioResidencia} / ${p.uf}   CEP: ${p.cep}
Telefone: ${p.telefoneContato ?? 'não informado'}
${sep}
PROCEDIMENTO PRINCIPAL
${apac.procedimentos.filter(pr => pr.tipo==='Principal').map(pr=>`Código: ${pr.codigo}   Nome: ${pr.nome}   Qtd: ${pr.quantidade}`).join('\n')||'Não cadastrado'}

PROCEDIMENTOS SECUNDÁRIOS
${apac.procedimentos.filter(pr => pr.tipo==='Secundário').map((pr,i)=>`${i+1}. ${pr.codigo} — ${pr.nome} — Qtd: ${pr.quantidade}`).join('\n')||'Nenhum'}
${sep}
DADOS CLÍNICOS ONCOLÓGICOS
Diagnóstico: ${c.descricaoDiagnostico}
CID-10: ${c.cid10Principal}   Secundário: ${c.cid10Secundario??'—'}
Diagnóstico HP: ${c.diagnosticoHistopatologico}
Morfologia CID-O: ${c.morfologiaCIDO}   Data diagnóstico: ${c.datadiagnostico}
Grau HP: ${c.grauHistopatologico??'não informado'}   Lateralidade: ${c.lateralidade??'não se aplica'}
${sep}
ESTADIAMENTO
T: ${c.tnmT}   N: ${c.tnmN}   M: ${c.tnmM}
Estádio Clínico: ${c.estadioClinco}
${sep}
TRATAMENTOS ANTERIORES
${c.tratamentosAnteriores?.length===0||!c.tratamentosAnteriores ? 'Nenhum' :
  c.tratamentosAnteriores.map(t=>`• ${t.tipo} — ${t.descricao} — ${t.dataInicio}${t.resposta?` (${t.resposta})`:''}`).join('\n')}
${sep}
CONDUTA ATUAL
Intenção: ${c.intencaoTerapeutica}   Linha: ${c.linhaTerapeutica}
Esquema: ${c.esquemaTerapeutico}
Justificativa: ${c.justificativaClinica}
${sep}
PROFISSIONAL SOLICITANTE
${apac.profissionalSolicitante.nome}
CRM-PB ${apac.profissionalSolicitante.crm} — ${apac.profissionalSolicitante.especialidade}
Solicitação: ${a.datasolicitacao}   Validade: ${a.periodoValidadeInicio} a ${a.periodoValidadeFim}
${sep}
Status: ${a.status?.toUpperCase()}`.trim();
  }

  exportarJSON(apac) {
    const score = this.calcularScoreAntiGlosa(apac);
    return {
      versao: apac.versao,
      id: apac.id,
      scoreAntiGlosa: score.score,
      nivelAntiGlosa: score.nivel,
      errosValidacao: score.erros,
      CNES_SOLICITANTE: apac.estabelecimentoSolicitante.cnes,
      CNES_EXECUTANTE: apac.estabelecimentoExecutante.cnes,
      TIPO_APAC: apac.autorizacao.tipoAPAC==='Inicial'?'1':apac.autorizacao.tipoAPAC==='Continuidade'?'2':'3',
      COMPETENCIA: apac.autorizacao.competencia,
      CNS_PACIENTE: apac.paciente.cns,
      NOME_PACIENTE: apac.paciente.nomePaciente,
      DATA_NASCIMENTO: apac.paciente.dataNascimento,
      SEXO: apac.paciente.sexo,
      COD_IBGE: apac.paciente.codigoIBGEMunicipio,
      PROCEDIMENTO_PRINCIPAL: apac.procedimentos.find(p=>p.tipo==='Principal')?.codigo,
      CID10: apac.dadosClinicos.cid10Principal,
      DIAGNOSTICO_HP: apac.dadosClinicos.diagnosticoHistopatologico,
      MORFOLOGIA: apac.dadosClinicos.morfologiaCIDO,
      TNM: `T${apac.dadosClinicos.tnmT}N${apac.dadosClinicos.tnmN}M${apac.dadosClinicos.tnmM}`,
      ESTADIO: apac.dadosClinicos.estadioClinco,
      INTENCAO: apac.dadosClinicos.intencaoTerapeutica,
      LINHA: apac.dadosClinicos.linhaTerapeutica,
      ESQUEMA: apac.dadosClinicos.esquemaTerapeutico,
      CRM_SOLICITANTE: apac.profissionalSolicitante.crm,
      DATA_SOLICITACAO: apac.autorizacao.datasolicitacao,
      PERIODO_INICIO: apac.autorizacao.periodoValidadeInicio,
      PERIODO_FIM: apac.autorizacao.periodoValidadeFim,
      criadoEm: apac.criadoEm,
    };
  }

  // ── Helpers privados ──────────────────────────────────────────────────────────

  _validarCID10Onco(cid) {
    const match = cid?.match(/^([A-Z])(\d+)/i);
    if (!match) return false;
    const letra = match[1].toUpperCase();
    const num = parseInt(match[2], 10);
    if (letra === 'C') return num >= 0 && num <= 97;
    if (letra === 'D') return num >= 0 && num <= 48;
    return false;
  }

  _calcularFimValidade(inicio) {
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 30);
    return this._formatarData(fim);
  }

  _formatarData(data) {
    const d = String(data.getDate()).padStart(2,'0');
    const m = String(data.getMonth()+1).padStart(2,'0');
    return `${d}/${m}/${data.getFullYear()}`;
  }

  _formatarCompetencia(data) {
    return `${String(data.getMonth()+1).padStart(2,'0')}/${data.getFullYear()}`;
  }

  _gerarId() {
    return `APAC-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  }

  _pacienteVazio() {
    return { nomePaciente:'', numeroProntuario:'', cns:'', dataNascimento:'',
      sexo:'F', nomeMaeResponsavel:'', enderecoResidencia:'',
      municipioResidencia:'', codigoIBGEMunicipio:'', uf:'PB', cep:'' };
  }

  _dadosClinicosVazios() {
    return { cid10Principal:'', cid10Secundario:'', descricaoDiagnostico:'',
      diagnosticoHistopatologico:'', morfologiaCIDO:'', datadiagnostico:'',
      lateralidade:'', tnmT:'', tnmN:'', tnmM:'', estadioClinco:'',
      grauHistopatologico:'', intencaoTerapeutica:'Curativa', linhaTerapeutica:'1ª Linha',
      esquemaTerapeutico:'', justificativaClinica:'', observacoesClinicas:'',
      tratamentosAnteriores:[] };
  }
}

export const agenteAPAC = new AgenteAPACOncologica();
