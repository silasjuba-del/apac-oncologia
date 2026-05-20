/**
 * ══════════════════════════════════════════════════════════════
 *  ia_service.js — Serviço IA real com Claude API
 *  Para testar rotas e resumos com casos reais
 *  Dr. Silas Negrão Serra Jr. · CRM-PB 17341
 * ══════════════════════════════════════════════════════════════
 */

const MODEL = "claude-opus-4-5";
const MAX_TOKENS = 1500;

const getKey = () => {
  const k = import.meta?.env?.VITE_ANTHROPIC_KEY
    || localStorage.getItem("anthropic_key")
    || window.__ANTHROPIC_KEY__;
  if (!k) console.warn("⚠️ VITE_ANTHROPIC_KEY não configurada no .env");
  return k;
};

async function claude(prompt, system = "", maxTk = MAX_TOKENS) {
  const key = getKey();
  if (!key) throw new Error("API key não configurada. Configure no painel IA.");

  const body = {
    model: MODEL,
    max_tokens: maxTk,
    system: system || `Você é um assistente oncológico clínico do Dr. Silas Negrão Serra Jr., CRM-PB 17341, do Hospital do Bem — Unidade Oncológica, Patos/PB. Responda SEMPRE em português brasileiro. Seja objetivo e clinicamente preciso. Nunca invente dados.`,
    messages: [{ role: "user", content: prompt }],
  };

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
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${r.status}`);
  }

  const data = await r.json();
  return data.content?.[0]?.text || "";
}

export const IA = {

  async resumirProntuario(pac) {
    return claude(`
Gere um resumo clínico estruturado para o prontuário oncológico deste paciente.
Formato: IDENTIFICAÇÃO | DIAGNÓSTICO | ESTADIAMENTO | BIOMARCADORES | TRATAMENTO ATUAL | ANTECEDENTES | CONDUTA | OBSERVAÇÕES.
Seja conciso, clínico, sem repetições.

DADOS DO PACIENTE:
${JSON.stringify(pac, null, 2)}
`, `Você é oncologista assistente do Dr. Silas Negrão. Resuma prontuários de forma estruturada e objetiva.`);
  },

  async resumirImagem(texto, tipo, pac) {
    return claude(`
Analise este ${tipo} e gere resumo com FOCO ONCOLÓGICO para o prontuário.
Inclua: topografia/dimensão tumoral, invasão local, linfonodos, metástases, resposta ao tratamento.
Mencione achados não-oncológicos em UMA linha apenas.
Seja conciso — máximo 5 linhas.

PACIENTE: ${pac?.nome || "—"} | DX: ${pac?.diag || "—"} | TRAT: ${pac?.trat || "—"}

LAUDO COMPLETO:
${texto}
`);
  },

  async resumirRecepcao(dados) {
    return claude(`
Com base nos dados abaixo enviados pela recepção, organize em prontuário estruturado.
Seções: QUEIXA PRINCIPAL | ANTECEDENTES | MEDICAÇÕES | ALERGIAS | HISTÓRIA FAMILIAR | EXAMES TRAZIDOS.
Use linguagem clínica. Não invente informações.

DADOS RECEPÇÃO:
${JSON.stringify(dados, null, 2)}
`);
  },

  async sugerirProtocolo(diag, estadio, bio, ecog, linha) {
    return claude(`
Liste os 3 protocolos de QT mais adequados para este caso oncológico.
Responda APENAS em JSON puro (sem markdown):
{"sugestoes":[{"protocolo":"nome","linha":"1ª/2ª linha","justificativa":"1 frase","estudo":"nome do estudo","prioridade":1},...]}

Diagnóstico: ${diag}
Estádio: ${estadio || "—"}
Biomarcadores: ${bio || "—"}
ECOG: ${ecog || "—"}
Linha pretendida: ${linha || "1ª linha"}
`, "", 600);
  },

  async analisarTriagem(triagem) {
    return claude(`
Analise esta triagem oncológica pré-QT e forneça:
1. Avaliação dos valores laboratoriais (alertas se houver)
2. Avaliação clínica geral
3. Recomendação de conduta (liberar/adiar/contraindicar) com justificativa
4. Pontos de atenção para o médico
Seja direto e clinicamente preciso. Máximo 150 palavras.

TRIAGEM:
PA: ${triagem.pas}/${triagem.pad} | FC: ${triagem.fc} | Temp: ${triagem.temp}°C | SPO₂: ${triagem.spo2}%
Neutrófilos: ${triagem.neutro} | PLT: ${triagem.plt} | Hgb: ${triagem.hgb} | Creat: ${triagem.creat}
ECOG: ${triagem.ecog}
CTCAE: ${JSON.stringify(triagem.ctcae)}
Protocolo: ${triagem.proto} | Ciclo: ${triagem.ciclo}
`);
  },

  async gerarJustificativaAPAC(pac) {
    return claude(`
Gere a justificativa clínica para APAC SUS de quimioterapia.
Texto formal, máximo 120 palavras, para o campo "Justificativa do Procedimento".
Mencione: diagnóstico, estadiamento, indicação terapêutica, protocolo escolhido, referência de diretriz (CONITEC/SBOC/INCA).

Paciente: ${pac?.nome || "—"}
Diagnóstico: ${pac?.diag || "—"} · CID: ${pac?.cid || "—"}
Estadiamento: ${pac?.estadio || "—"} · TNM: ${pac?.tnm || "—"}
Protocolo: ${pac?.trat || "—"} · Linha: ${pac?.linha || "—"}
Biomarcadores: ${pac?.bio || "—"} · ECOG: ${pac?.ecog || "—"}
`);
  },

  async checarAntiglosa(apac) {
    return claude(`
Analise esta APAC e identifique potenciais motivos de glosa pelo SUS.
Responda em JSON: {"riscos":[{"campo":"nome do campo","risco":"descrição","solucao":"como corrigir","gravidade":"alta/media/baixa"}],"score":0-100,"ok":true/false}

DADOS DA APAC:
${JSON.stringify(apac?.campos || {}, null, 2)}
`, "", 800);
  },

  async gerarEvolucao(pac, dados) {
    return claude(`
Gere evolução médica oncológica objetiva para prontuário.
Formato SOAP adaptado: S (subjetivo) | O (objetivo — dados vitais e lab) | A (avaliação) | P (plano).
Máximo 180 palavras. Linguagem clínica formal. Incluir data e assinatura ao final.

PACIENTE: ${pac?.nome} | ${pac?.diag} | ${pac?.trat} | Ciclo: ${pac?.cicloAtual || "—"}
DADOS DA CONSULTA:
${JSON.stringify(dados, null, 2)}
`);
  },

  async duvidasClinicas(pergunta, pac) {
    return claude(`
Responda esta dúvida clínica oncológica de forma objetiva e baseada em evidências.
Cite estudos relevantes quando aplicável. Máximo 200 palavras.

CONTEXTO DO PACIENTE: ${pac?.diag || "—"} · ${pac?.trat || "—"} · ECOG ${pac?.ecog || "—"}
PERGUNTA: ${pergunta}
`, `Você é um especialista em oncologia clínica, com foco em medicina baseada em evidências brasileira (SBOC/CONITEC/INCA). Responda sempre em português.`);
  },

  async gerarCasoTeste(tipo) {
    const casos = {
      mama: "adenocarcinoma mama RH+ HER2-negativo estádio III",
      colon: "adenocarcinoma de cólon metastático RAS wild-type",
      pulmao: "adenocarcinoma pulmão EGFR exon 19 del estádio IV",
      prostata: "carcinoma próstata metastático resistente castração",
      pancreas: "adenocarcinoma pâncreas metastático BRCA2 mutado",
    };
    return claude(`
Gere um caso clínico REALISTA e detalhado de ${casos[tipo] || tipo} para fins educacionais.
Inclua: dados demográficos, queixa, antecedentes, exame físico, exames complementares,
estadiamento, biomarcadores, proposta terapêutica baseada em evidências.
Use dados fictícios mas clinicamente plausíveis.
Responda em JSON estruturado compatível com o prontuário oncológico.
`, "", 2000);
  },
};

export function useIA() {
  const [loading, setLoading] = React.useState(false);
  const [resultado, setResultado] = React.useState("");
  const [erro, setErro] = React.useState("");

  const executar = async (fn, ...args) => {
    setLoading(true);
    setErro("");
    setResultado("");
    try {
      const r = await fn(...args);
      setResultado(r);
      return r;
    } catch (e) {
      const msg = e.message?.includes("API key") ? "⚠️ Configure a API Key no painel IA" : `Erro: ${e.message}`;
      setErro(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { loading, resultado, erro, executar };
}
