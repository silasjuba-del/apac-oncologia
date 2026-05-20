/**
 * ══════════════════════════════════════════════════════════════
 *  ONCOLOGIA INTEGRADA — SISTEMA DE AGENTES IA
 *  Dr. Silas Negrão Serra Jr. · CRM-PB 17341
 *
 *  8 Agentes especializados em oncologia clínica:
 *  1. OrchestradorAgent  — roteador inteligente
 *  2. ProntuárioAgent    — preenche/atualiza prontuário
 *  3. ProtocoloAgent     — sugere QT + calcula doses
 *  4. APACAgent          — preenche/valida APAC SUS
 *  5. TriagemAgent       — analisa pré-QT
 *  6. DriveAgent         — lê laudos do Google Drive
 *  7. DocumentosAgent    — gera receitas/exames/laudos
 *  8. EvidênciasAgent    — busca estudos clínicos
 * ══════════════════════════════════════════════════════════════
 */

const MODEL   = "claude-opus-4-5";
const MAX_TOK = 2000;

const getKey = () =>
  localStorage.getItem("anthropic_key") || window.__ANTHROPIC_KEY__;

// ── Chamada base com tool_use ─────────────────────────────────
async function callClaude(messages, system, tools = [], maxTk = MAX_TOK) {
  const key = getKey();
  if (!key) throw new Error("API Key não configurada.");

  const body = { model: MODEL, max_tokens: maxTk, system, messages };
  if (tools.length) body.tools = tools;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || `HTTP ${r.status}`);
  }
  return r.json();
}

// ── Extrair texto da resposta ─────────────────────────────────
function getText(resp) {
  return resp.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
}
function getToolUse(resp) {
  return resp.content?.filter(b => b.type === "tool_use") || [];
}

// ══════════════════════════════════════════════════════════════
// DEFINIÇÃO DAS FERRAMENTAS (tools) disponíveis para os agentes
// ══════════════════════════════════════════════════════════════
const TOOLS_PRONTUARIO = [
  {
    name: "atualizar_campo",
    description: "Atualiza um campo específico do prontuário do paciente",
    input_schema: {
      type: "object",
      properties: {
        campo: { type: "string", description: "Nome do campo (diag, cid, tnm, estadio, bio, trat, conduta, etc.)" },
        valor: { type: "string", description: "Novo valor para o campo" },
        motivo: { type: "string", description: "Justificativa clínica da atualização" },
      },
      required: ["campo", "valor"],
    },
  },
  {
    name: "adicionar_alerta",
    description: "Adiciona um alerta clínico ao prontuário",
    input_schema: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: ["urgente", "atencao", "info"] },
        mensagem: { type: "string" },
        acao_sugerida: { type: "string" },
      },
      required: ["tipo", "mensagem"],
    },
  },
];

const TOOLS_PROTOCOLO = [
  {
    name: "selecionar_protocolo",
    description: "Seleciona e configura um protocolo de QT para o paciente",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome do protocolo (ex: mFOLFOX6)" },
        indicacao: { type: "string" },
        periodo: { type: "string", enum: ["semanal","q14d","q21d","d1d8q21","d1d8d15q28","diario"] },
        reducao: { type: "number", enum: [0, 10, 20, 25] },
        ciclos: { type: "number" },
        justificativa: { type: "string" },
        estudo_referencia: { type: "string" },
      },
      required: ["nome", "periodo", "justificativa"],
    },
  },
  {
    name: "calcular_dose",
    description: "Calcula a dose de um fármaco baseado na SC do paciente",
    input_schema: {
      type: "object",
      properties: {
        farmaco: { type: "string" },
        dose_padrao: { type: "number" },
        unidade: { type: "string", enum: ["mg/m²","mg/kg","AUC","mg fixo"] },
        sc: { type: "number" },
        reducao_pct: { type: "number" },
      },
      required: ["farmaco","dose_padrao","unidade","sc"],
    },
  },
];

const TOOLS_APAC = [
  {
    name: "preencher_apac",
    description: "Preenche campos da APAC SUS com dados do paciente",
    input_schema: {
      type: "object",
      properties: {
        campos: {
          type: "object",
          description: "Objeto com os campos a preencher (cns, nasc, cod_proc, cid, justif_apac, etc.)",
        },
        checklist_ok: { type: "boolean" },
        alertas_glosa: { type: "array", items: { type: "string" } },
      },
      required: ["campos"],
    },
  },
  {
    name: "enviar_financeiro",
    description: "Envia a APAC ao setor financeiro após validação",
    input_schema: {
      type: "object",
      properties: {
        apac_id: { type: "string" },
        observacao: { type: "string" },
      },
      required: ["apac_id"],
    },
  },
];

const TOOLS_DOCUMENTOS = [
  {
    name: "gerar_documento",
    description: "Gera um documento médico para impressão",
    input_schema: {
      type: "object",
      properties: {
        tipo: {
          type: "string",
          enum: ["receita_vo","receita_ev","exames_lab","alarme","nutricao","prontuario","laudo_pericial","evolucao","apac"],
        },
        dados_extras: { type: "object", description: "Dados adicionais específicos do documento" },
      },
      required: ["tipo"],
    },
  },
];

// ══════════════════════════════════════════════════════════════
// CLASSE BASE DOS AGENTES
// ══════════════════════════════════════════════════════════════
class AgentBase {
  constructor(nome, emoji, descricao, systemPrompt) {
    this.nome = nome;
    this.emoji = emoji;
    this.descricao = descricao;
    this.systemPrompt = systemPrompt;
    this.historico = [];
  }

  async executar(input, contexto = {}) {
    throw new Error("Implementar em subclasse");
  }

  log(msg) {
    console.log(`[${this.emoji} ${this.nome}] ${msg}`);
  }
}

// ══════════════════════════════════════════════════════════════
// 1. AGENTE PRONTUÁRIO
// ══════════════════════════════════════════════════════════════
export class AgenteProntuario extends AgentBase {
  constructor() {
    super("Prontuário", "📋", "Preenche e atualiza o prontuário oncológico automaticamente",
      `Você é um assistente oncológico especializado em prontuários médicos do Dr. Silas Negrão (CRM-PB 17341).
Seu papel é analisar dados do paciente e preencher/atualizar campos do prontuário de forma estruturada.
Use as ferramentas disponíveis para atualizar campos específicos.
Seja preciso, clínico e baseie-se nos dados fornecidos. Nunca invente informações.
Responda sempre em português brasileiro.`);
  }

  async executar(pac, instrucao = "Analise e complete o prontuário") {
    const messages = [{
      role: "user",
      content: `INSTRUÇÃO: ${instrucao}

DADOS ATUAIS DO PACIENTE:
${JSON.stringify(pac, null, 2)}

Analise os dados, identifique campos incompletos ou que precisam de melhoria clínica,
e use as ferramentas para atualizar o prontuário. Priorize campos obrigatórios para APAC.`,
    }];

    const resp = await callClaude(messages, this.systemPrompt, TOOLS_PRONTUARIO);
    const acoes = getToolUse(resp);
    const texto = getText(resp);

    const atualizacoes = {};
    const alertas = [];

    for (const acao of acoes) {
      if (acao.name === "atualizar_campo") {
        atualizacoes[acao.input.campo] = acao.input.valor;
        this.log(`Atualizou: ${acao.input.campo} = ${acao.input.valor.slice(0, 40)}`);
      }
      if (acao.name === "adicionar_alerta") {
        alertas.push(acao.input);
        this.log(`Alerta: ${acao.input.tipo} — ${acao.input.mensagem}`);
      }
    }

    return { atualizacoes, alertas, resumo: texto, agente: this.nome };
  }
}

// ══════════════════════════════════════════════════════════════
// 2. AGENTE PROTOCOLO
// ══════════════════════════════════════════════════════════════
export class AgenteProtocolo extends AgentBase {
  constructor() {
    super("Protocolo QT", "💉", "Sugere protocolos de QT e calcula doses",
      `Você é um oncologista especializado em quimioterapia.
Seu papel é analisar o diagnóstico oncológico e sugerir o(s) melhor(es) protocolo(s) de QT.
Base nas diretrizes SBOC, ASCO, ESMO, NCCN e protocolos CONITEC/SUS vigentes.
Use as ferramentas para selecionar protocolos e calcular doses.
Responda em português brasileiro.`);
  }

  async executar(pac) {
    const sc = pac.peso && pac.altura
      ? (0.016667 * Math.pow(+pac.peso, 0.5) * Math.pow(+pac.altura, 0.5)).toFixed(2)
      : "1.73";

    const messages = [{
      role: "user",
      content: `Sugira o(s) melhor(es) protocolo(s) de QT para este paciente e calcule as doses.

PACIENTE:
Diagnóstico: ${pac.diag || "—"}
CID: ${pac.cid || "—"} · Estádio: ${pac.estadio || "—"} · TNM: ${pac.tnm || "—"}
Biomarcadores: ${pac.bio || "—"}
ECOG: ${pac.ecog || "—"} · Linha: ${pac.linha || "1ª linha"} · Intenção: ${pac.intencao || "—"}
SC: ${sc} m² · Peso: ${pac.peso || "—"} kg · Altura: ${pac.altura || "—"} cm
Antecedentes: ${pac.antec || "—"} · Alergias: ${pac.alerg || "—"}

Use as ferramentas para selecionar o protocolo e calcular doses para SC=${sc}m².`,
    }];

    const resp = await callClaude(messages, this.systemPrompt, TOOLS_PROTOCOLO);
    const acoes = getToolUse(resp);
    const texto = getText(resp);

    const protocolos = [];
    const doses = [];

    for (const acao of acoes) {
      if (acao.name === "selecionar_protocolo") protocolos.push(acao.input);
      if (acao.name === "calcular_dose") {
        const d = acao.input;
        const doseCalc = d.unidade === "mg/m²"
          ? (d.dose_padrao * d.sc * (1 - (d.reducao_pct || 0) / 100)).toFixed(0) + " mg"
          : `${d.dose_padrao} ${d.unidade}`;
        doses.push({ ...d, doseCalc });
      }
    }

    return { protocolos, doses, analise: texto, sc, agente: this.nome };
  }
}

// ══════════════════════════════════════════════════════════════
// 3. AGENTE APAC
// ══════════════════════════════════════════════════════════════
export class AgenteAPAC extends AgentBase {
  constructor() {
    super("APAC SUS", "📄", "Preenche, valida e envia APAC para o financeiro",
      `Você é especialista em APAC SUS para oncologia clínica.
Preencha automaticamente os campos da APAC a partir dos dados do prontuário.
Valide conforme critérios SIGTAP/CONITEC. Identifique riscos de glosa proativamente.
Use ferramentas para preencher e enviar. Responda em português.`);
  }

  async executar(pac, apacId) {
    const messages = [{
      role: "user",
      content: `Preencha a APAC SUS automaticamente com os dados abaixo.
Gere a justificativa clínica completa, verifique riscos de glosa e valide o checklist.

DADOS DO PACIENTE:
${JSON.stringify(pac, null, 2)}

ID DA APAC: ${apacId || "APAC-" + Date.now()}

Preencha TODOS os campos disponíveis. Gere justificativa clínica formal citando diretriz CONITEC/SBOC.`,
    }];

    const resp = await callClaude(messages, this.systemPrompt, TOOLS_APAC);
    const acoes = getToolUse(resp);
    const texto = getText(resp);

    let camposAPAC = {};
    let alertasGlosa = [];
    let enviado = false;

    for (const acao of acoes) {
      if (acao.name === "preencher_apac") {
        camposAPAC = { ...camposAPAC, ...acao.input.campos };
        alertasGlosa = acao.input.alertas_glosa || [];
      }
      if (acao.name === "enviar_financeiro") enviado = true;
    }

    // Complementar campos automáticos
    camposAPAC = {
      nome: pac.nome, cns: pac.cns, nasc: pac.nasc,
      sexo: pac.sexo, mae: pac.mae, tel: pac.tel,
      cidade: pac.cidade, cid: pac.cid,
      diag: pac.diag, estadio: pac.estadio,
      trat: pac.trat, ecog: pac.ecog,
      exFisico: pac.exFisico,
      exames_resumo: pac.anatom || pac.imagen || "",
      prof_solicitante: "Dr. Silas Negrão Serra Jr.",
      crm_solicitante: "CRM-PB 17341",
      data_sol: new Date().toLocaleDateString("pt-BR"),
      ...camposAPAC,
    };

    return { camposAPAC, alertasGlosa, analise: texto, enviado, agente: this.nome };
  }
}

// ══════════════════════════════════════════════════════════════
// 4. AGENTE TRIAGEM
// ══════════════════════════════════════════════════════════════
export class AgenteTriagem extends AgentBase {
  constructor() {
    super("Triagem QT", "🩺", "Analisa triagem pré-QT e sugere conduta ao médico",
      `Você é um oncologista assistente analisando triagem pré-quimioterapia.
Avalie os valores clínicos e laboratoriais. Identifique contraindicações absolutas e relativas.
Forneça recomendação clara: liberar/adiar/contraindicar com justificativa baseada em CTCAE v5.0.
Seja direto. Responda em português.`);
  }

  async executar(triagem) {
    const messages = [{
      role: "user",
      content: `Analise esta triagem pré-QT e forneça recomendação clínica detalhada.

SINAIS VITAIS:
PA: ${triagem.pas}/${triagem.pad} mmHg · FC: ${triagem.fc} · FR: ${triagem.fr}
Temperatura: ${triagem.temp}°C · SPO₂: ${triagem.spo2}%
Peso: ${triagem.peso}kg · Altura: ${triagem.altura}cm

LABORATORIAL:
Hemoglobina: ${triagem.hgb} g/dL
Leucócitos: ${triagem.leuco} /mm³
Neutrófilos: ${triagem.neutro} /mm³
Plaquetas: ${triagem.plt} /mm³
Creatinina: ${triagem.creat} mg/dL
TGO: ${triagem.tgo} · TGP: ${triagem.tgp}

ECOG: ${triagem.ecog}
CTCAE: ${JSON.stringify(triagem.ctcae)}

PROTOCOLO: ${triagem.proto} · CICLO: ${triagem.ciclo}

Forneça:
1. Avaliação de cada valor crítico
2. Recomendação (liberar/adiar/contraindicar) com justificativa
3. Conduta sugerida (para revisão do médico)
4. Alertas específicos para o médico plantonista

⚠️ Inclua sempre: "Esta análise é uma sugestão clínica. A decisão final é responsabilidade do médico."`,
    }];

    const resp = await callClaude(messages, this.systemPrompt, [], 1200);
    return { analise: getText(resp), agente: this.nome };
  }
}

// ══════════════════════════════════════════════════════════════
// 5. AGENTE DRIVE (Google Drive)
// ══════════════════════════════════════════════════════════════
export class AgenteDrive extends AgentBase {
  constructor() {
    super("Drive", "📁", "Lê laudos do Google Drive e extrai dados para o prontuário",
      `Você é especialista em extração de dados clínicos de documentos oncológicos.
Analise laudos (TC, biópsia, patologia, hemograma) e extraia informações relevantes.
Organize em estrutura de prontuário. Foco em dados oncológicos. Responda em português.`);
  }

  async executar(textoLaudo, tipoLaudo, pac) {
    const messages = [{
      role: "user",
      content: `Analise este ${tipoLaudo} e extraia dados para o prontuário oncológico.
Responda em JSON estruturado com os campos relevantes.

PACIENTE: ${pac?.nome || "—"} | DIAGNÓSTICO: ${pac?.diag || "—"}

TEXTO DO LAUDO:
${textoLaudo}

Extraia e estruture:
- Achados oncológicos principais
- Dimensões tumorais / localização
- Comprometimento linfonodal
- Metástases
- Resposta ao tratamento (se aplicável)
- Biomarcadores identificados
- Sugestão de campos para atualizar no prontuário

Formato JSON: {"campos_prontuario":{...},"resumo_oncologico":"...","alertas":[...],"achados_nao_oncologicos":"..."}`,
    }];

    const resp = await callClaude(messages, this.systemPrompt, [], 1500);
    const txt = getText(resp);
    try {
      const clean = txt.replace(/```json|```/g, "").trim();
      return { ...JSON.parse(clean), agente: this.nome };
    } catch {
      return { resumo_oncologico: txt, campos_prontuario: {}, alertas: [], agente: this.nome };
    }
  }
}

// ══════════════════════════════════════════════════════════════
// 6. AGENTE DOCUMENTOS
// ══════════════════════════════════════════════════════════════
export class AgenteDocumentos extends AgentBase {
  constructor() {
    super("Documentos", "🖨️", "Gera todos os documentos médicos SUS automaticamente",
      `Você é um assistente médico especializado em geração de documentos SUS oncológicos.
Gere documentos formais, completos e adequados ao contexto clínico.
Documentos sempre em português, sem siglas em inglês, adequados ao SUS.`);
  }

  async executar(pac, tiposDoc = ["receita_vo","exames","alarme","nutricao"]) {
    const TEMPLATES = {
      receita_vo: `RECEITA MÉDICA — VIA ORAL\n\nGere uma prescrição sintomática completa para paciente oncológico em QT. Inclua: antiemético, protetor gástrico, antidiarreico, analgésico leve. Se alergia a dipirona (${pac.alerg}), substituir por paracetamol.`,
      exames: `REQUISIÇÃO DE EXAMES\n\nGere requisição pré-QT com hemograma, função renal e hepática para 3 ciclos.`,
      alarme: `SINAIS DE ALARME\n\nGere cartão de sinais de alarme para paciente oncológico em linguagem simples, sem termos técnicos.`,
      nutricao: `ORIENTAÇÃO NUTRICIONAL\n\nGere orientações alimentares para paciente em QT. Considere alergias: ${pac.alerg}.`,
      laudo_pericial: `LAUDO PERICIAL\n\nGere laudo médico para afastamento/benefícios INSS. Diagnóstico: ${pac.diag}.`,
      evolucao: `EVOLUÇÃO MÉDICA SOAP\n\nGere evolução do ciclo atual de QT em formato SOAP.`,
    };

    const documentos = {};
    const AUTOR = "Dr. Silas Negrão Serra Jr.\nCRM-PB 17341 · RQE Oncologia Clínica 9099\nHospital do Bem — Unidade Oncológica · Patos/PB";
    const hoje = new Date().toLocaleDateString("pt-BR");

    for (const tipo of tiposDoc) {
      if (!TEMPLATES[tipo]) continue;
      const messages = [{
        role: "user",
        content: `${TEMPLATES[tipo]}

DADOS DO PACIENTE:
Nome: ${pac.nome || "___"}
Diagnóstico: ${pac.diag || "___"}
Protocolo: ${pac.trat || "___"}
Alergias: ${pac.alerg || "Nenhuma"}
Peso: ${pac.peso}kg · Altura: ${pac.altura}cm
Data: ${hoje}
Médico: ${AUTOR}

Gere o documento completo, formal, pronto para impressão.`,
      }];
      const resp = await callClaude(messages, this.systemPrompt, [], 800);
      documentos[tipo] = getText(resp);
    }

    return { documentos, agente: this.nome };
  }
}

// ══════════════════════════════════════════════════════════════
// 7. AGENTE EVIDÊNCIAS CLÍNICAS
// ══════════════════════════════════════════════════════════════
export class AgenteEvidencias extends AgentBase {
  constructor() {
    super("Evidências", "📚", "Busca estudos clínicos relevantes para o caso",
      `Você é um oncologista com expertise em medicina baseada em evidências.
Cite estudos clínicos relevantes (ASCO/ESMO/SBOC) para embasar decisões terapêuticas.
Use dados de estudos reais com desfechos objetivos (SG, SLP, HR, p-valor).
Responda em português.`);
  }

  async executar(pac, pergunta = null) {
    const q = pergunta || `Quais as evidências para ${pac.trat || "o tratamento escolhido"} em ${pac.diag}?`;
    const messages = [{
      role: "user",
      content: `${q}

CONTEXTO:
Diagnóstico: ${pac.diag || "—"} · Estádio: ${pac.estadio || "—"}
Biomarcadores: ${pac.bio || "—"} · Linha: ${pac.linha || "—"}
Tratamento atual: ${pac.trat || "—"}

Forneça:
1. Estudos-chave com resultados (SG, SLP, HR)
2. Diretriz que embasa a conduta
3. Alternativas com evidência
4. Considerações para contexto SUS/CONITEC`,
    }];

    const resp = await callClaude(messages, this.systemPrompt, [], 1200);
    return { evidencias: getText(resp), agente: this.nome };
  }
}

// ══════════════════════════════════════════════════════════════
// 8. ORQUESTRADOR — Roteador inteligente entre agentes
// ══════════════════════════════════════════════════════════════
export class OrchestradorAgent extends AgentBase {
  constructor() {
    super("Orquestrador", "🧠", "Interpreta comandos e delega para o agente correto",
      `Você é um orquestrador de agentes oncológicos para o Dr. Silas Negrão.
Analise o comando do médico e determine qual(is) agente(s) acionar.
Responda em JSON: {"agentes":["prontuario","protocolo","apac","triagem","drive","documentos","evidencias"],"instrucao":"...","prioridade":"alta/media/baixa"}
Exemplos:
- "preencher prontuário" → prontuario
- "sugerir QT" → protocolo + evidencias
- "gerar APAC" → apac + documentos
- "analisar laudo" → drive + prontuario
- "preparar consulta" → prontuario + protocolo + apac + documentos`);
  }

  async rotear(comando, pac) {
    const messages = [{
      role: "user",
      content: `Comando do Dr. Silas: "${comando}"
Paciente atual: ${pac?.nome || "—"} | ${pac?.diag || "sem diagnóstico"}
Determine os agentes a acionar. Responda SOMENTE em JSON.`,
    }];
    const resp = await callClaude(messages, this.systemPrompt, [], 300);
    try {
      const txt = getText(resp).replace(/```json|```/g, "").trim();
      return JSON.parse(txt);
    } catch {
      return { agentes: ["prontuario"], instrucao: comando, prioridade: "media" };
    }
  }
}

// ══════════════════════════════════════════════════════════════
// SISTEMA DE AGENTES — Interface unificada
// ══════════════════════════════════════════════════════════════
export class SistemaAgentes {
  constructor() {
    this.orquestrador = new OrchestradorAgent();
    this.agentes = {
      prontuario:  new AgenteProntuario(),
      protocolo:   new AgenteProtocolo(),
      apac:        new AgenteAPAC(),
      triagem:     new AgenteTriagem(),
      drive:       new AgenteDrive(),
      documentos:  new AgenteDocumentos(),
      evidencias:  new AgenteEvidencias(),
    };
    this.historico = [];
  }

  async executarComando(comando, pac, extra = {}) {
    const inicio = Date.now();
    const logs = [];
    const resultados = {};

    logs.push({ agente: "🧠 Orquestrador", status: "iniciando", msg: `Analisando: "${comando}"` });

    // Rotear o comando
    const rota = await this.orquestrador.rotear(comando, pac);
    logs.push({ agente: "🧠 Orquestrador", status: "ok", msg: `Agentes: ${rota.agentes.join(", ")}` });

    // Executar agentes em paralelo quando possível
    const promises = rota.agentes.map(async (nomeAgente) => {
      const agente = this.agentes[nomeAgente];
      if (!agente) return;
      logs.push({ agente: `${agente.emoji} ${agente.nome}`, status: "executando", msg: "Processando..." });
      try {
        let resultado;
        if (nomeAgente === "prontuario")  resultado = await agente.executar(pac, rota.instrucao);
        if (nomeAgente === "protocolo")   resultado = await agente.executar(pac);
        if (nomeAgente === "apac")        resultado = await agente.executar(pac, extra.apacId);
        if (nomeAgente === "triagem")     resultado = await agente.executar(extra.triagem || {});
        if (nomeAgente === "drive")       resultado = await agente.executar(extra.textoLaudo || "", extra.tipoLaudo || "laudo", pac);
        if (nomeAgente === "documentos")  resultado = await agente.executar(pac, extra.tiposDoc);
        if (nomeAgente === "evidencias")  resultado = await agente.executar(pac, extra.pergunta);
        resultados[nomeAgente] = resultado;
        logs.push({ agente: `${agente.emoji} ${agente.nome}`, status: "ok", msg: "Concluído ✅" });
      } catch (e) {
        logs.push({ agente: `${agente.emoji} ${agente.nome}`, status: "erro", msg: e.message });
        resultados[nomeAgente] = { erro: e.message };
      }
    });

    await Promise.allSettled(promises);

    const registro = {
      id: Date.now(),
      comando,
      paciente: pac?.nome,
      agentes: rota.agentes,
      resultados,
      logs,
      duracao: ((Date.now() - inicio) / 1000).toFixed(1) + "s",
      timestamp: new Date().toLocaleString("pt-BR"),
    };
    this.historico.unshift(registro);
    return registro;
  }
}

export const sistemaAgentes = new SistemaAgentes();
