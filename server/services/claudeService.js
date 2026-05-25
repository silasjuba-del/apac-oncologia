// server/services/claudeService.js v3
// Onco App — Hospital do Bem — Dr. Silas Negrão
// Prompts: dossiê oncológico + APAC auto-preenchida + validação anti-glosa

import Anthropic from "@anthropic-ai/sdk";

let claudeClient = null;
function getModel() {
  return process.env.ANTHROPIC_MODEL || "claude-opus-4-5";
}
function getClaude() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no backend.");
  if (!claudeClient) claudeClient = new Anthropic({ apiKey });
  return claudeClient;
}

function parseArr(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : [String(p)]; }
  catch { return v.split(",").map(x => x.trim()).filter(Boolean); }
}

// ─────────────────────────────────────────────────────────────
// 1. DOSSIÊ ONCOLÓGICO ESTRUTURADO
//    Entrada: dados paciente + textos/resumos dos laudos do Drive
//    Saída: texto estruturado com marcadores ===SECTION===
// ─────────────────────────────────────────────────────────────

export async function responderClaude({ prompt, maxTokens = 1200, files = [] }) {
  if (!String(prompt || "").trim() && !files.length) throw new Error("Prompt ou arquivo obrigatório.");
  const content = [];
  for (const file of (files || []).slice(0, 8)) {
    const mimeType = file.mimeType || file.type || "application/pdf";
    const data = file.base64 || file.data || "";
    if (!data) continue;
    if (mimeType === "application/pdf") {
      content.push({ type:"document", source:{ type:"base64", media_type:mimeType, data } });
    } else if (["image/jpeg","image/png","image/webp"].includes(mimeType)) {
      content.push({ type:"image", source:{ type:"base64", media_type:mimeType, data } });
    } else if (file.text) {
      content.push({ type:"text", text:String(file.text) });
    }
  }
  content.push({ type:"text", text:String(prompt || "") });
  const res = await getClaude().messages.create({
    model: getModel(),
    max_tokens: Math.min(Number(maxTokens) || 1200, 8000),
    messages: [{ role: "user", content }]
  });
  return res.content?.filter(b => b.type === "text").map(b => b.text).join("\n").trim() || "";
}

// ─────────────────────────────────────────────────────────────
// 1b. DOSSIÊ A PARTIR DE ARQUIVOS DO DRIVE (PDF/imagem real)
//     Usa o mesmo prompt estruturado do gerarDossie,
//     mas envia os arquivos como documentos para leitura direta.
// ─────────────────────────────────────────────────────────────
export async function gerarDossieComArquivos({ paciente = {}, recepcao = {}, files = [], arquivosNomes = [] }) {
  const doencas = parseArr(paciente.doencas);
  const meds    = parseArr(paciente.medicamentos);

  const listaArquivos = arquivosNomes.length > 0
    ? arquivosNomes.map((n, i) => `${i + 1}. ${n}`).join("\n")
    : "Arquivo(s) anexado(s) acima.";

  const content = [];

  // Anexar arquivos como documentos reais (PDF) ou imagens
  for (const file of (files || []).slice(0, 5)) {
    const mimeType = file.mimeType || "application/pdf";
    const data = file.base64 || "";
    if (!data) continue;
    if (mimeType === "application/pdf") {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data },
        title: file.name || "Documento Drive",
        cache_control: { type: "ephemeral" }
      });
    } else if (["image/jpeg","image/png","image/webp"].includes(mimeType)) {
      content.push({ type: "image", source: { type: "base64", media_type: mimeType, data } });
    }
  }

  const prompt = `Você é o assistente clínico do Dr. Silas Negrão, Oncologista Clínico,
Hospital do Bem — Unidade Oncológica, Patos-PB.

LEIA INTEGRALMENTE OS DOCUMENTOS ANEXADOS (PDFs acima).
Extraia TODOS os dados clínicos, oncológicos e laboratoriais presentes.
NÃO invente dados ausentes — se ausente: "Não informado."
NUNCA preencha o campo CONDUTA.

============================================================
DADOS DO PACIENTE (formulário de recepção)
============================================================
Nome: ${paciente.nome || "—"}
Data nascimento: ${paciente.nasc || paciente.data_nascimento || "—"}
CNS: ${paciente.cns || recepcao?.cns || "—"}
CPF: ${paciente.cpf || "—"}
Nome da mãe: ${paciente.nome_mae || "—"}
Cidade: ${paciente.cidade || recepcao?.municipio || "—"}
Convênio: ${recepcao?.convenio || "SUS"}
Diagnóstico referido: ${paciente.diag || "—"}

Doenças: ${doencas.join(", ") || "não informadas"}
Medicamentos: ${meds.join(", ") || "nenhum"}
Alergias: ${paciente.alergias || "nega"}
Cirurgias prévias: ${paciente.cirurgias || "nega"}
Tabagismo: ${paciente.tabagismo || "nunca"}
Etilismo: ${paciente.etilismo || "nunca"}
Histórico familiar oncológico: ${paciente.historico_familiar || "não relatado"}
Sintomas atuais: ${paciente.sintomas_atuais || "—"}

============================================================
ARQUIVOS LIDOS DO GOOGLE DRIVE
============================================================
${listaArquivos}

============================================================
INSTRUÇÕES DE EXTRAÇÃO
============================================================
Leia cada documento anexado na íntegra e extraia:
- Dados de identificação (nome, CNS, CPF, data nascimento, mãe, cidade)
- Diagnóstico histológico exato (tipo histológico, grau, subtipo molecular)
- Estadiamento TNM completo
- Resultados de imuno-histoquímica (RE, RP, HER2, Ki-67, PD-L1, etc.)
- Resultados de anatomopatológico (topografia, dimensão, margens, linfonodos)
- Resultados de imagem (TC, PET, RM, USG, mamografia — dimensões, linfonodos, metástases)
- Datas de todos os exames e procedimentos
- Médicos solicitantes/laudadores
- Pendências documentais

============================================================
FORMATO OBRIGATÓRIO — use EXATAMENTE estes marcadores
============================================================

===DADOS ANAGRÁFICOS===
Nome: | DN: | Sexo: | CPF: | CNS: | Mãe: | Cidade: | Convênio:

===DADOS CLÍNICOS===
Antecedentes: [traduzir para termos médicos]
Tabagismo e etilismo: [formato padrão clínico]
Medicações de uso contínuo: [nomes genéricos]
Alergias: [se nenhuma: "Nega alergias medicamentosas conhecidas"]
Cirurgias prévias: [se nenhuma: "Nega cirurgias anteriores"]
Histórico familiar oncológico: [se nenhum: "Nega história familiar de neoplasias"]
Sintomas atuais: [prosa clínica objetiva]

===DADOS ONCOLÓGICOS===
Diagnóstico: [em maiúsculas — ex: CARCINOMA DUCTAL INVASIVO DE MAMA DIREITA]
Estadiamento: [ex: pT1b pN0(sn) M0 — ESTÁGIO I]
Subtipo molecular: [ex: LUMINAL A / HER2 NEGATIVO / TRIPLO NEGATIVO]
Biomarcadores:
  RE: | RP: | HER2: | Ki-67: | Outros:
Grau histológico: [Nottingham ou equivalente]
Margens cirúrgicas: [livres / comprometidas / distância]

===EXAMES E LAUDOS===
[Para cada documento lido — formato:]
[DATA] — [TIPO] ([Nº laudo/laboratório]):
  → [resumo oncológico completo e objetivo]
  → Achados relevantes: [topografia, dimensões, linfonodos, margens, invasão]

===LABORATÓRIO E EXAME FÍSICO===
[Deixar em branco — preenchimento médico]

===CONDUTA===
[DEIXAR EM BRANCO — EXCLUSIVO DO MÉDICO]

===OBS CLAUDE===
Pendências documentais: [o que falta para estadiamento completo]
Exames complementares sugeridos: [ex: PET-CT, cintilografia óssea, RM hepática]
Biomarcadores sugeridos: [específicos para este tumor]
Alerta APAC: [campos críticos ausentes que podem gerar glosa SUS]
Possível protocolo SUS/INCA/SBOC: [baseado no diagnóstico e estadiamento]
Referência bibliográfica relevante: ["Estudo X (NEJM/JCO/Lancet ANO) comparou A vs B, demonstrando X meses de SG e redução de Y% no risco de morte."]

REGRAS FINAIS:
- CONDUTA sempre vazio — exclusivo do médico
- Diagnóstico e biomarcadores: em MAIÚSCULAS
- Sem "gerado por IA", sem rodapé, sem saudações
- Se dado ausente nos documentos: "Não informado." — jamais inventar
- Seja detalhado: prefira excesso de informação clínica a resumos superficiais`;

  content.push({ type: "text", text: prompt });

  const res = await getClaude().messages.create({
    model: getModel(),
    max_tokens: 6000,
    messages: [{ role: "user", content }],
  });
  return res.content.filter(b => b.type === "text").map(b => b.text).join("\n");
}

export async function gerarDossie({ paciente, recepcao, textosLaudos = [] }) {
  const doencas = parseArr(paciente.doencas);
  const meds    = parseArr(paciente.medicamentos);

  const laudosBloco = textosLaudos.length > 0
    ? textosLaudos.map((l, i) =>
        `\n--- LAUDO ${i + 1}: ${l.tipo || "exame"} (${l.data || "s/d"}) ---\n${l.conteudo}`
      ).join("\n")
    : "Nenhum laudo disponível — aguardar envio ou inserir manualmente.";

  const prompt = `
Você é o assistente clínico do Dr. Silas Negrão, Oncologista Clínico,
Hospital do Bem — Unidade Oncológica, Patos-PB.

Analise os dados abaixo e gere um DOSSIÊ ONCOLÓGICO ESTRUTURADO em bullets.
Siga EXATAMENTE o formato com os marcadores ===SEÇÃO=== indicados.
NÃO invente dados ausentes. Se ausente: escreva "Não informado."
NUNCA preencha o campo CONDUTA.
Dentro de cada seção, use linhas curtas iniciadas por "•". Evite parágrafos longos.

============================================================
DADOS DO FORMULÁRIO DO PACIENTE
============================================================
Nome: ${paciente.nome || "—"}
Data nascimento: ${paciente.data_nascimento || "—"}
Cidade: ${paciente.cidade || "—"}
CNS: ${paciente.cns || recepcao?.cns || "—"}
CPF: ${paciente.cpf || "—"}
Nome da mãe: ${paciente.nome_mae || "—"}
Sexo: ${paciente.sexo || "—"}

Doenças assinaladas: ${doencas.join(", ") || "nenhuma"}
Doença cardíaca (referida): ${paciente.doenca_coracao || "—"}
Doença renal (referida): ${paciente.doenca_rim || "—"}
Doença hepática (referida): ${paciente.doenca_figado || "—"}
Outras doenças: ${paciente.doencas_outras || "—"}

Tabagismo: ${paciente.tabagismo || "nunca"}
${paciente.tabagismo !== "nunca" ? `  Cigarros/dia: ${paciente.tabagismo_cigarros || "?"} | Anos: ${paciente.tabagismo_anos || "?"}` : ""}
${paciente.tabagismo === "ex-tabagista" ? `  Parou há: ${paciente.tabagismo_parou || "?"}` : ""}

Etilismo: ${paciente.etilismo || "nunca"}
${paciente.etilismo !== "nunca" ? `  Frequência: ${paciente.etilismo_frequencia || "?"}` : ""}
${paciente.etilismo === "ex-etilista" ? `  Parou há: ${paciente.etilismo_parou || "?"}` : ""}

Medicamentos: ${meds.join(", ") || "nenhum"}
${paciente.medicamentos_outros ? `Outros medicamentos: ${paciente.medicamentos_outros}` : ""}
Alergias: ${paciente.alergias || "nega"}
Cirurgias prévias: ${paciente.cirurgias || "nega"}
Vacinação: ${paciente.vacinas_atualizadas === "sim" ? "atualizada" : "não atualizada / não informado"}
Histórico familiar oncológico: ${paciente.historico_familiar || "não relatado"}
Sintomas atuais: ${paciente.sintomas_atuais || "não relatado"}

============================================================
DADOS DA RECEPÇÃO
============================================================
Município: ${recepcao?.municipio || recepcao?.cidade || "—"}
Convênio: ${recepcao?.convenio || "SUS"}
Pasta Drive: ${recepcao?.drive_folder || "—"}

============================================================
LAUDOS
============================================================
${laudosBloco}

============================================================
FORMATO OBRIGATÓRIO — use EXATAMENTE estes marcadores
============================================================

===DADOS ANAGRÁFICOS===
Nome: | DN: | Cidade: | Sexo: | CPF: | CNS: | Convênio:

===DADOS CLÍNICOS===
Antecedentes patológicos: [traduzir para termos médicos]
Tabagismo e etilismo: [formato padrão]
Medicações de uso contínuo: [nomes genéricos]
Alergias: [se nenhuma: "Nega alergias medicamentosas conhecidas"]
Cirurgias prévias: [se nenhuma: "Nega cirurgias anteriores"]
Vacinação: [conforme referido]
Histórico familiar oncológico: [se nenhum: "Nega história familiar de neoplasias"]
Sintomas atuais: [prosa clínica objetiva]

===DADOS ONCOLÓGICOS===
Diagnóstico: [em maiúsculo — ex: ADENOCARCINOMA DE CÓLON ESQUERDO]
Estadiamento: [em maiúsculo — ex: pT3 pN1 M0 — ESTÁGIO III]
Subtipo molecular: [ex: MSI-H / LUMINAL A / EGFR EXON 19 DEL]
Biomarcadores: [listar os disponíveis nos laudos ou "Pendente — ver sugestões"]

===EXAMES===
[Para cada laudo: DATA — TIPO: resumo oncológico objetivo em 2-4 linhas]
[Foco: topografia + dimensões + invasão + linfonodos + metástases se imagem]
[Foco: histologia + grau + margem + índice mitótico se biópsia]

===LABORATÓRIO E EXAME FÍSICO===
[Deixar em branco — preenchimento médico]

===CONDUTA===
[Deixar em branco — preenchimento médico]

===OBS CLAUDE===
Pendências: [campos ausentes que impactam conduta]
Completar estadiamento: [exames faltantes — ex: PET-CT, RM hepática]
Biomarcadores sugeridos: [específicos para o tumor]
Possível protocolo SUS/SBOC: [baseado no diagnóstico]
Trial relacionado: ["Estudo X comparou A versus B, demonstrando ganho de SG de Y meses e redução do risco de morte em Z%."]

REGRAS:
- CONDUTA sempre vazio
- Biomarcadores e diagnóstico: em maiúsculas
- Sem "gerado por IA", sem rodapés, sem saudações
- Se dado ausente: "Não informado." — nunca inventar
`;

  const res = await getClaude().messages.create({
    model: getModel(), max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });
  return res.content.filter(b => b.type === "text").map(b => b.text).join("\n");
}

// ─────────────────────────────────────────────────────────────
// 2. APAC AUTO-PREENCHIDA
// ─────────────────────────────────────────────────────────────
export async function preencherAPAC({ paciente, recepcao, resumoClaude }) {
  const prompt = `
Você é o assistente administrativo oncológico do Dr. Silas Negrão,
Hospital do Bem, Patos-PB. Preencha os campos da APAC-SUS abaixo.
Se ausente, retorne null. Retorne APENAS JSON válido, sem texto adicional.

PACIENTE:
Nome: ${paciente.nome || ""}
CPF: ${paciente.cpf || ""}
CNS: ${paciente.cns || recepcao?.cns || ""}
Nome da mãe: ${paciente.nome_mae || ""}
Município: ${recepcao?.municipio || paciente.cidade || ""}
Data nascimento: ${paciente.data_nascimento || ""}

DOSSIÊ CLAUDE (extraia CID, diagnóstico, estadiamento, protocolo):
${resumoClaude?.substring(0, 3500) || ""}

Retorne JSON com exatamente estes campos:
{
  "nome": "", "cpf": "", "cns": "", "nome_mae": "", "municipio": "",
  "cid10": "", "diagnostico_histologico": "", "data_biopsia": "",
  "estadiamento": "", "procedimento_sigtap": "", "linha_tratamento": "",
  "protocolo": "", "justificativa_clinica": "", "laudos_comprobatorios": "",
  "peso": "", "altura": "", "superficie_corporal": "",
  "funcao_renal": "", "funcao_hepatica": ""
}
`;

  const res = await getClaude().messages.create({
    model: getModel(), max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });
  const texto = res.content.filter(b => b.type === "text").map(b => b.text).join("");
  try {
    return JSON.parse(texto.replace(/```json|```/g, "").trim());
  } catch { return {}; }
}

// ─────────────────────────────────────────────────────────────
// 3. VALIDAÇÃO ANTI-GLOSA
// ─────────────────────────────────────────────────────────────
export function validarAPAC(apacData) {
  const CAMPOS = [
    { campo:"nome",                    label:"Nome do paciente",              critico:true  },
    { campo:"cpf",                     label:"CPF",                           critico:true  },
    { campo:"cns",                     label:"CNS / Cartão SUS",              critico:true  },
    { campo:"nome_mae",                label:"Nome da mãe",                   critico:true  },
    { campo:"municipio",               label:"Município de origem",           critico:true  },
    { campo:"cid10",                   label:"CID-10 principal",              critico:true  },
    { campo:"diagnostico_histologico", label:"Diagnóstico histológico",       critico:true  },
    { campo:"data_biopsia",            label:"Data da biópsia",               critico:true  },
    { campo:"estadiamento",            label:"Estadiamento TNM",              critico:true  },
    { campo:"procedimento_sigtap",     label:"Procedimento SIGTAP",           critico:true  },
    { campo:"linha_tratamento",        label:"Linha de tratamento",           critico:true  },
    { campo:"protocolo",               label:"Protocolo proposto",            critico:true  },
    { campo:"justificativa_clinica",   label:"Justificativa clínica",         critico:true  },
    { campo:"laudos_comprobatorios",   label:"Laudos comprobatórios",         critico:false },
    { campo:"peso",                    label:"Peso (se QT com dose/SC)",      critico:false },
    { campo:"altura",                  label:"Altura (se dose/SC)",           critico:false },
    { campo:"funcao_renal",            label:"Função renal (nefrotóxico)",    critico:false },
    { campo:"funcao_hepatica",         label:"Função hepática (hepatotóxico)",critico:false },
  ];
  const pendencias   = [];
  const criticas     = [];
  const nao_criticas = [];
  for (const c of CAMPOS) {
    const v = apacData[c.campo];
    const ausente = !v || String(v).trim() === "" || v === "null" || v === null;
    if (ausente) {
      pendencias.push(c.label);
      if (c.critico) criticas.push(c.label); else nao_criticas.push(c.label);
    }
  }
  const risco_glosa       = criticas.length === 0 ? "baixo" : criticas.length <= 3 ? "medio" : "alto";
  const status_completude = criticas.length === 0 ? "completa" : "incompleta";
  return {
    status_completude, risco_glosa,
    pendencias_json: JSON.stringify(pendencias),
    pendencias, criticas, nao_criticas,
    total_campos: CAMPOS.length,
    preenchidos:  CAMPOS.length - pendencias.length,
    pct: Math.round(((CAMPOS.length - pendencias.length) / CAMPOS.length) * 100),
  };
}

// ─────────────────────────────────────────────────────────────
// 4. RESUMO DE LAUDO INDIVIDUAL
// ─────────────────────────────────────────────────────────────
export async function resumirLaudo({ tipo, data, mimeType, base64Data, textoExtraido }) {
  const isPDF   = mimeType === "application/pdf";
  const isImage = ["image/jpeg","image/png","image/webp"].includes(mimeType);
  if (!isPDF && !isImage && !textoExtraido) throw new Error("Tipo de arquivo não suportado.");

  let conteudo;
  if (base64Data && (isPDF || isImage)) {
    conteudo = [
      { type: isPDF ? "document" : "image",
        source: { type: "base64", media_type: mimeType, data: base64Data } },
      { type: "text", text: promptLaudo(tipo, data) },
    ];
  } else {
    conteudo = [{ type: "text", text: `${promptLaudo(tipo, data)}\n\n${textoExtraido}` }];
  }
  const res = await getClaude().messages.create({
    model: getModel(), max_tokens: 800,
    messages: [{ role: "user", content: conteudo }],
  });
  return res.content.filter(b => b.type === "text").map(b => b.text).join("\n");
}

function promptLaudo(tipo, data) {
  return `Você é assistente oncológico do Dr. Silas Negrão, Hospital do Bem, Patos-PB.
Analise este laudo e gere resumo OBJETIVO em bullets com foco oncológico.
Tipo: ${tipo || "exame"} | Data: ${data || "não informada"}
Foco: topografia + dimensões + invasão + linfonodos + metástases (imagem)
      histologia + grau + margem + mitoses (biópsia) | captação + local (PET)
Se sem doença: "Sem evidência de doença ativa."
Formato obrigatório:
• Data:
• Tipo:
• Achados oncológicos:
• Estadiamento/biomarcadores se disponíveis:
• Pendências:
Sem "gerado por IA".`;
}

// ─────────────────────────────────────────────────────────────
// 5. RESUMO DO QUESTIONÁRIO DO PACIENTE (fluxo legado)
// ─────────────────────────────────────────────────────────────
export async function resumoQuestionarioPaciente(dados) {
  const doencas = parseArr(dados.doencas);
  const meds    = parseArr(dados.medicamentos);
  const prompt = `Você é o assistente clínico do Dr. Silas Negrão, Hospital do Bem, Patos-PB.
Traduza os dados abaixo para terminologia médica objetiva.
NÃO invente dados. Use prosa concisa.

Nome: ${dados.nome || "—"} | Nasc: ${dados.data_nascimento || "—"} | Cidade: ${dados.cidade || "—"}
Doenças: ${doencas.join(", ") || "nenhuma"}
Tabagismo: ${dados.tabagismo || "nunca"} | Etilismo: ${dados.etilismo || "nunca"}
Medicamentos: ${meds.join(", ") || "nenhum"}
Alergias: ${dados.alergias || "nega"} | Cirurgias: ${dados.cirurgias || "nega"}
Histórico familiar: ${dados.historico_familiar || "—"}
Sintomas atuais: ${dados.sintomas_atuais || "—"}

Gere seções: ANAMNESE DEMOGRÁFICA / ANTECEDENTES / TABAGISMO E ETILISMO /
MEDICAÇÕES / ALERGIAS / CIRURGIAS PRÉVIAS / VACINAÇÃO / HISTÓRICO FAMILIAR / QUEIXA PRINCIPAL / SINTOMAS ATUAIS`;

  const res = await getClaude().messages.create({
    model: getModel(), max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });
  return res.content.filter(b => b.type === "text").map(b => b.text).join("\n");
}

export default { responderClaude, gerarDossie, preencherAPAC, validarAPAC, resumirLaudo, resumoQuestionarioPaciente };
