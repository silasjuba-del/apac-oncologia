// server/index.js v4 — Onco App — Hospital do Bem
// SEM googleapis — upload direto de laudos

import express   from "express";
import cors      from "cors";
import path      from "path";
import fs        from "fs";
import dotenv    from "dotenv";
import { fileURLToPath } from "url";

import db, { getPacienteCompleto, buscarPacientes, validarAPAC } from "./db.js";
import { responderClaude, preencherAPAC, gerarDossie, gerarDossieComArquivos }  from "./services/claudeService.js";
import dossieRouter       from "./routes/dossie.js";
import oncoAgentRouter    from "./routes/oncoagent.js";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), override: true });
const app       = express();
const PORT      = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit:"60mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Rotas OncoAgent ───────────────────────────────────────────
app.use("/api/oncoagent", oncoAgentRouter);

// Serve o frontend buildado pelo Vite (sempre, sem depender de NODE_ENV)
const distDir = path.join(__dirname, "../dist");
if (fs.existsSync(distDir)) {
  app.use("/apac-oncologia", express.static(distDir));
  app.get("/apac-oncologia", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
  app.get("/apac-oncologia/*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
  app.get("/", (_req, res) => res.redirect("/apac-oncologia/"));
}
fs.mkdirSync(path.join(__dirname, "../uploads"), { recursive: true });

function secNorm(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function secDigits(v) { return String(v || "").replace(/\D/g, ""); }
function secDateKey(v) {
  const s = String(v || "").trim();
  const iso = s.match(/\b(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\b/);
  if (iso) return String(iso[3]).padStart(2, "0") + String(iso[2]).padStart(2, "0") + iso[1];
  const br = s.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
  if (br) return String(br[1]).padStart(2, "0") + String(br[2]).padStart(2, "0") + (br[3].length === 2 ? "20" + br[3] : br[3]);
  const d = secDigits(s);
  if (d.length === 8 && Number(d.slice(0, 4)) > 1900) return d.slice(6, 8) + d.slice(4, 6) + d.slice(0, 4);
  return d;
}
function secNameParts(nome) {
  return secNorm(nome).split(" ").filter(p => p.length >= 3 && !["das", "dos", "del", "de", "da", "do", "e"].includes(p));
}
function secNamesCompatible(a, b) {
  const na = secNorm(a), nb = secNorm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ta = secNameParts(a), tb = secNameParts(b);
  if (!ta.length || !tb.length) return false;
  if (ta.length === 1 || tb.length === 1) return ta[0] === tb[0];
  return ta[0] === tb[0] && ta[ta.length - 1] === tb[tb.length - 1];
}
function secTextHasName(nome, texto) {
  const t = " " + secNorm(texto) + " ";
  const n = secNorm(nome);
  if (!n || !t.trim()) return false;
  if (t.includes(" " + n + " ")) return true;
  const partes = secNameParts(nome);
  if (partes.length >= 2) return t.includes(" " + partes[0] + " ") && t.includes(" " + partes[partes.length - 1] + " ");
  return partes[0]?.length >= 5 && t.includes(" " + partes[0] + " ");
}
function secExtractNamedPatient(texto) {
  const linhas = String(texto || "").split(/\n/).slice(0, 28);
  for (const linha of linhas) {
    const m = String(linha).match(/\b(?:nome\s+completo|nome|paciente|identifica[cç][aã]o)\s*[:\-]\s*(.+)$/i);
    if (!m) continue;
    const nome = String(m[1] || "")
      .replace(/\s+(nasc(?:imento)?|data\s+de\s+nascimento|cpf|cns|cart[aã]o|idade|diagn[oó]stico|diag|cid)\b.*$/i, "")
      .replace(/[|;].*$/, "")
      .replace(/^[•*\-\s]+|[.,\s]+$/g, "")
      .trim();
    if (secNameParts(nome).length) return nome;
  }
  return "";
}
function prontuarioSecurityServer(paciente, texto) {
  const problemas = [];
  const t = String(texto || "");
  if (!secNorm(paciente?.nome)) problemas.push("paciente sem nome cadastrado.");
  if (!t.trim()) problemas.push("texto de evolução vazio.");
  const nomeIdentificado = secExtractNamedPatient(t);
  if (nomeIdentificado && !secNamesCompatible(nomeIdentificado, paciente.nome)) {
    problemas.push(`nome no texto (${nomeIdentificado}) não confere com o paciente (${paciente.nome}).`);
  }
  const outros = db.prepare("SELECT nome FROM pacientes WHERE id<>? AND nome IS NOT NULL AND trim(nome)<>'' LIMIT 500").all(paciente.id || 0);
  const outro = outros.find(p => !secNamesCompatible(p.nome, paciente.nome) && secTextHasName(p.nome, t));
  if (outro) problemas.push(`texto menciona outro paciente cadastrado: ${outro.nome}.`);
  const cpfAtual = secDigits(paciente?.cpf);
  const cpfs = [...t.matchAll(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g)].map(m => secDigits(m[0]));
  if (cpfAtual && cpfs.some(c => c !== cpfAtual)) problemas.push("CPF citado no texto não confere com o paciente.");
  if (!cpfAtual && cpfs.length) problemas.push("texto contém CPF, mas o paciente não tem CPF cadastrado para conferência.");
  const cnsAtual = secDigits(paciente?.cns);
  const cnss = [...t.matchAll(/\b\d{15}\b/g)].map(m => secDigits(m[0]));
  if (cnsAtual && cnss.some(c => c !== cnsAtual)) problemas.push("CNS citado no texto não confere com o paciente.");
  if (!cnsAtual && cnss.length) problemas.push("texto contém CNS, mas o paciente não tem CNS cadastrado para conferência.");
  const nascAtual = secDateKey(paciente?.data_nascimento);
  const nascs = [];
  const reNasc = /\b(?:nasc(?:imento)?|data\s+de\s+nascimento|dn)\.?\s*[:\-]?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/gi;
  let m;
  while ((m = reNasc.exec(t))) nascs.push(secDateKey(m[1]));
  if (nascAtual && nascs.some(d => d && d !== nascAtual)) problemas.push("data de nascimento citada no texto não confere com o paciente.");
  if (!nascAtual && nascs.length) problemas.push("texto contém nascimento, mas o paciente não tem nascimento cadastrado para conferência.");
  return { ok: problemas.length === 0, problemas, agente: "Prontuário Security" };
}

// ── Rotas dossiê (upload direto + Claude) ─────────────────────
app.use("/api/dossie", dossieRouter);

// ── Claude: texto + PDF/imagem em base64
app.post("/api/claude/resumo", async (req,res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ ok:false, code:"ANTHROPIC_API_KEY_MISSING", message:"ANTHROPIC_API_KEY não configurada no backend. O PDF foi anexado, mas ainda não pode ser lido pela IA." });
    }
    const { prompt="", maxTokens=1200, files=[] } = req.body || {};
    const text = await responderClaude({ prompt, maxTokens, files });
    res.json({ ok:true, text, filesRead:(files||[]).length });
  } catch(e) {
    console.error("[/api/claude/resumo]", e.message);
    res.status(500).json({ ok:false, message:e.message });
  }
});

// ── Health ────────────────────────────────────────────────────

// ─── Google Drive bridge ─────────────────────────────────────────────────────
const DRIVE_MIMES = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function driveConfigStatus() {
  const raw = String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim();
  return {
    configured: !!raw,
    mode: raw ? "google_service_account" : "manual_link",
    message: raw
      ? "Google Drive configurado. Compartilhe a pasta com o e-mail da service account."
      : "Google Drive real ainda não configurado. Use link/descrição/texto; Claude analisará em modo manual.",
  };
}

function extrairDriveId(input = "") {
  const txt = String(input || "").trim();
  return (
    txt.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] ||
    txt.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ||
    txt.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ||
    ""
  );
}

function tipoProvavelDrive(nome = "") {
  const n = String(nome).toLowerCase();
  if (n.includes("biop")) return "Biópsia";
  if (n.includes("ihq") || n.includes("imuno")) return "Imunohistoquímica";
  if (n.includes("tomo") || n.includes("tc")) return "Tomografia";
  if (n.includes("resson") || /\brm\b/.test(n)) return "Ressonância";
  if (n.includes("mamo")) return "Mamografia";
  if (n.includes("usg") || n.includes("ultra")) return "Ultrassom";
  if (n.includes("pet")) return "PET-CT";
  if (n.includes("lab") || n.includes("hemo")) return "Laboratório";
  return "Documento";
}

async function getDriveClient() {
  const raw = String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim();
  if (!raw) return null;
  let serviceAccountPath = raw;
  if (!raw.startsWith("{")) {
    const candidates = [
      path.resolve(raw),
      path.resolve(__dirname, raw),
      path.resolve(__dirname, path.basename(raw)),
    ];
    serviceAccountPath = candidates.find(p => fs.existsSync(p)) || candidates[0];
  }
  const parsed = raw.startsWith("{")
    ? JSON.parse(raw)
    : JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: parsed,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

async function driveSearchFiles(q = "") {
  const drive = await getDriveClient();
  if (!drive) return { configured:false, folder:null, files:[] };
  const input = String(q || "").trim();
  const id = extrairDriveId(input);
  let folder = null;
  let files = [];
  if (id) {
    const meta = await drive.files.get({
      fileId: id,
      fields: "id,name,mimeType,webViewLink,createdTime,modifiedTime,size",
      supportsAllDrives: true,
    });
    if (meta.data.mimeType === "application/vnd.google-apps.folder") {
      folder = meta.data;
      const listed = await drive.files.list({
        q: `'${id}' in parents and trashed=false`,
        fields: "files(id,name,mimeType,webViewLink,createdTime,modifiedTime,size)",
        pageSize: 50,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      files = listed.data.files || [];
    } else {
      files = [meta.data];
    }
  } else {
    const folders = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and trashed=false and name contains '${input.replace(/'/g, "\\'")}'`,
      fields: "files(id,name,mimeType,webViewLink,createdTime,modifiedTime,size)",
      pageSize: 5,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    folder = (folders.data.files || [])[0] || null;
    if (folder) {
      const listed = await drive.files.list({
        q: `'${folder.id}' in parents and trashed=false`,
        fields: "files(id,name,mimeType,webViewLink,createdTime,modifiedTime,size)",
        pageSize: 50,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      files = listed.data.files || [];
    }
  }
  return {
    configured:true,
    folder,
    files: files.map(f => ({ ...f, tipoProvavel: tipoProvavelDrive(f.name) })),
  };
}

async function baixarDriveComoClaudeFiles(files = [], { maxFiles = 3, maxTotalBytes = 9 * 1024 * 1024 } = {}) {
  const drive = await getDriveClient();
  if (!drive) return [];
  const out = [];
  let totalBytes = 0;
  for (const f of files.slice(0, 20)) {
    if (out.length >= maxFiles) break;
    const mimeType = f.mimeType;
    if (!["application/pdf","image/jpeg","image/png","image/webp"].includes(mimeType)) continue;
    const fileSize = parseInt(f.size || "0");
    // Pular arquivos > 6MB (base64 seria ~8MB, poderia estourar limite Claude)
    if (fileSize > 6 * 1024 * 1024) {
      console.log(`[Drive] Ignorando ${f.name} (${Math.round(fileSize/1024)}KB — muito grande)`);
      continue;
    }
    // Verificar limite total acumulado
    if (totalBytes + fileSize * 1.4 > maxTotalBytes) {
      console.log(`[Drive] Limite total atingido ao processar ${f.name}`);
      break;
    }
    try {
      const res = await drive.files.get(
        { fileId: f.id, alt: "media", supportsAllDrives: true },
        { responseType: "arraybuffer" }
      );
      const b64 = Buffer.from(res.data).toString("base64");
      totalBytes += b64.length;
      out.push({ name: f.name, mimeType, base64: b64 });
      console.log(`[Drive] Baixado: ${f.name} (${Math.round(b64.length/1024)}KB b64)`);
    } catch(e) {
      console.warn(`[Drive] Falha ao baixar ${f.name}: ${e.message}`);
    }
  }
  return out;
}

app.get("/api/drive/health", (_req, res) => {
  res.json({ ok:true, ...driveConfigStatus() });
});

app.get("/api/drive/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(400).json({ ok:false, message:"Informe nome, CPF, ID ou link da pasta Drive." });
    const status = driveConfigStatus();
    if (!status.configured) return res.json({ ok:true, ...status, folder:null, files:[] });
    const found = await driveSearchFiles(q);
    res.json({ ok:true, ...status, ...found });
  } catch (e) {
    console.error("[/api/drive/search]", e.message);
    res.status(500).json({ ok:false, message:e.message });
  }
});

app.post("/api/dossie/drive", async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ ok:false, code:"ANTHROPIC_API_KEY_MISSING", message:"Claude não configurado no backend." });
    }
    const { paciente = {}, recepcao = {}, drive_folder = "", texto = "", tipo = "Documento", arquivoIds = null } = req.body || {};
    const status = driveConfigStatus();
    let folder = null;
    let arquivos = [];
    let filesPayload = [];

    if (status.configured && String(drive_folder || "").trim()) {
      const found = await driveSearchFiles(drive_folder);
      folder = found.folder || null;
      arquivos = found.files || [];
      // Se o frontend enviou IDs específicos selecionados pelo usuário, filtrar
      let filesToDownload = arquivos;
      if (Array.isArray(arquivoIds) && arquivoIds.length > 0) {
        filesToDownload = arquivos.filter(f => arquivoIds.includes(f.id));
        console.log(`[Drive] Seleção manual: ${filesToDownload.length} arquivo(s) de ${arquivos.length}`);
      }
      filesPayload = await baixarDriveComoClaudeFiles(filesToDownload);
    }

    const arquivosNomes = filesPayload.map(f => f.name);

    // Se há texto complementar, adicionar como documento de texto
    if (texto && texto.trim()) {
      filesPayload.push({ mimeType: "text/plain", text: texto.trim(), name: "Texto colado" });
    }

    // Usar prompt oncológico completo (mesma qualidade do gerarDossie)
    const resumo = await gerarDossieComArquivos({
      paciente: { ...paciente, diag: paciente.diag || tipo },
      recepcao: { ...recepcao, drive_folder },
      files: filesPayload,
      arquivosNomes,
    });

    res.json({ ok:true, ...status, folder, arquivos, resumo, filesRead:filesPayload.length });
  } catch (e) {
    console.error("[/api/dossie/drive]", e.message);
    res.status(500).json({ ok:false, message:e.message });
  }
});


const FLUXO_ATENDIMENTO = [
  {
    id: "pre_consulta",
    ordem: 1,
    area: "Paciente",
    titulo: "Pre-consulta iniciada",
    objetivo: "Paciente preenche dados demograficos, sintomas e historico de saude.",
    entrada: ["formulario_paciente"],
    saida: "aguardando_recepcao",
    automacoes: ["criar_dossie_provisorio", "avisar_recepcao"],
  },
  {
    id: "aguardando_recepcao",
    ordem: 2,
    area: "Recepcao",
    titulo: "Aguardando recepcao",
    objetivo: "Recepcao encontra o paciente por nome, CPF, CNS, nascimento ou mae.",
    entrada: ["busca_paciente", "checkin"],
    saida: "recepcao_conferencia",
    automacoes: ["abrir_dossie", "limpar_paciente_anterior"],
  },
  {
    id: "recepcao_conferencia",
    ordem: 3,
    area: "Recepcao",
    titulo: "Recepcao em conferencia",
    objetivo: "Confirmar somente dados administrativos e anexar documentos.",
    entrada: ["confirmacao_demografica", "upload_recepcao", "drive"],
    saida: "documentos_anexados",
    automacoes: ["vincular_documentos_ao_dossie"],
  },
  {
    id: "documentos_anexados",
    ordem: 4,
    area: "IA",
    titulo: "Documentos anexados",
    objetivo: "Enviar laudos, PDF, imagens ou texto para organizacao pela IA.",
    entrada: ["pdf", "imagem", "texto_colado", "drive"],
    saida: "claude_processando",
    automacoes: ["iniciar_analise_claude"],
  },
  {
    id: "claude_processando",
    ordem: 5,
    area: "IA",
    titulo: "Claude processando",
    objetivo: "Extrair resumo oncologico, pendencias e dados estruturados sem definir conduta.",
    entrada: ["dossie", "documentos"],
    saida: "pronto_medico",
    automacoes: ["gerar_resumo_oncologico", "preencher_rascunho_evolucao"],
  },
  {
    id: "pronto_medico",
    ordem: 6,
    area: "Medico",
    titulo: "Pronto para medico",
    objetivo: "Medico abre atendimento em pagina unica, limpa e editavel.",
    entrada: ["lista_atendimento", "resumo_claude"],
    saida: "em_consulta",
    automacoes: ["abrir_prontuario_unico"],
  },
  {
    id: "em_consulta",
    ordem: 7,
    area: "Medico",
    titulo: "Em consulta",
    objetivo: "Medico valida e edita a evolucao unica.",
    entrada: ["evolucao_editavel"],
    saida: "evolucao_salva",
    automacoes: ["salvar_evolucao", "registrar_timeline"],
  },
  {
    id: "evolucao_salva",
    ordem: 8,
    area: "Documentos",
    titulo: "Evolucao salva",
    objetivo: "Selecionar documentos a gerar: receitas, exames, orientacoes, termo e APAC.",
    entrada: ["evolucao_validada"],
    saida: "apac_validacao",
    automacoes: ["gerar_documentos_selecionados"],
  },
  {
    id: "apac_validacao",
    ordem: 9,
    area: "Faturamento/APAC",
    titulo: "APAC em validacao",
    objetivo: "Validar checklist anti-glosa antes de imprimir.",
    entrada: ["dados_apac", "laudos", "evolucao"],
    saida: "apac_pronta",
    automacoes: ["validar_antiglosa", "bloquear_se_critico"],
  },
  {
    id: "apac_pronta",
    ordem: 10,
    area: "Faturamento/APAC",
    titulo: "APAC pronta",
    objetivo: "Imprimir ou exportar APAC revisada.",
    entrada: ["apac_validada"],
    saida: null,
    automacoes: ["imprimir_apac", "registrar_status_final"],
  },
  {
    id: "pendencia_administrativa",
    ordem: 99,
    area: "Equipe",
    titulo: "Pendencia administrativa",
    objetivo: "Aguardar correcao de documento, cadastro ou autorizacao.",
    entrada: ["pendencia"],
    saida: "recepcao_conferencia",
    automacoes: ["avisar_setor_responsavel"],
  },
];

const EVENTOS_FLUXO = {
  paciente_enviou_preconsulta: { de: ["pre_consulta"], para: "aguardando_recepcao" },
  recepcao_iniciou_conferencia: { de: ["aguardando_recepcao"], para: "recepcao_conferencia" },
  recepcao_anexou_documentos: { de: ["recepcao_conferencia"], para: "documentos_anexados" },
  ia_iniciada: { de: ["documentos_anexados"], para: "claude_processando" },
  ia_concluida: { de: ["claude_processando"], para: "pronto_medico" },
  medico_abriu_atendimento: { de: ["pronto_medico"], para: "em_consulta" },
  medico_salvou_evolucao: { de: ["em_consulta"], para: "evolucao_salva" },
  medico_solicitou_apac: { de: ["evolucao_salva"], para: "apac_validacao" },
  apac_validada: { de: ["apac_validacao"], para: "apac_pronta" },
  pendencia_identificada: { de: FLUXO_ATENDIMENTO.map(x => x.id), para: "pendencia_administrativa" },
  pendencia_corrigida: { de: ["pendencia_administrativa"], para: "recepcao_conferencia" },
};

function etapaFluxo(status) {
  return FLUXO_ATENDIMENTO.find(x => x.id === status) || FLUXO_ATENDIMENTO[0];
}

function proximaEtapaFluxo(status) {
  const atual = etapaFluxo(status);
  return atual.saida ? etapaFluxo(atual.saida) : null;
}

function transicaoFluxo(status, evento) {
  const atual = etapaFluxo(status).id;
  const regra = EVENTOS_FLUXO[evento];
  if (!regra) {
    return { ok:false, statusAtual:atual, message:"Evento de fluxo nao reconhecido." };
  }
  if (!regra.de.includes(atual)) {
    return {
      ok:false,
      statusAtual:atual,
      evento,
      message:"Evento nao permitido para o status atual.",
      permitidoEm:regra.de,
      proximaSugerida:proximaEtapaFluxo(atual),
    };
  }
  return {
    ok:true,
    statusAnterior:atual,
    evento,
    statusNovo:regra.para,
    etapaAtual:etapaFluxo(regra.para),
    proximaSugerida:proximaEtapaFluxo(regra.para),
  };
}

app.get("/api/fluxo/rotas", (_req, res) => {
  res.json({
    ok:true,
    nome:"Dossie Oncologico Inteligente",
    versao:"mvp-1",
    rotas:FLUXO_ATENDIMENTO,
    eventos:Object.keys(EVENTOS_FLUXO),
  });
});

app.get("/api/fluxo/status/:status", (req, res) => {
  const etapa = etapaFluxo(req.params.status);
  res.json({ ok:true, etapa, proxima:proximaEtapaFluxo(etapa.id) });
});

app.post("/api/fluxo/proximo-passo", (req, res) => {
  const { status="pre_consulta", evento="" } = req.body || {};
  const resultado = evento
    ? transicaoFluxo(status, evento)
    : { ok:true, statusAtual:etapaFluxo(status).id, etapaAtual:etapaFluxo(status), proximaSugerida:proximaEtapaFluxo(status) };
  res.status(resultado.ok ? 200 : 400).json(resultado);
});


app.get("/api/health", (_req, res) => res.json({
  ok: true,
  service: "onco-app-backend-v4",
  claude: !!process.env.ANTHROPIC_API_KEY,
  fluxo: true,
}));

// ─────────────────────────────────────────────────────────────
// PACIENTE
// ─────────────────────────────────────────────────────────────
app.post("/api/paciente/form", (req, res) => {
  try {
    const d = req.body;
    if (!d.nome?.trim()) return res.status(400).json({ message:"Nome é obrigatório." });
    const info = db.prepare(`
      INSERT INTO pacientes (
        nome,cpf,data_nascimento,cidade,telefone,nome_mae,sexo,cns,
        doencas,doenca_coracao,doenca_rim,doenca_figado,doencas_outras,
        tabagismo,tabagismo_anos,tabagismo_cigarros,tabagismo_parou,
        etilismo,etilismo_frequencia,etilismo_parou,
        medicamentos,medicamentos_outros,alergias,cirurgias,
        vacinas_atualizadas,historico_familiar,sintomas_atuais
      ) VALUES (
        @nome,@cpf,@data_nascimento,@cidade,@telefone,@nome_mae,@sexo,@cns,
        @doencas,@doenca_coracao,@doenca_rim,@doenca_figado,@doencas_outras,
        @tabagismo,@tabagismo_anos,@tabagismo_cigarros,@tabagismo_parou,
        @etilismo,@etilismo_frequencia,@etilismo_parou,
        @medicamentos,@medicamentos_outros,@alergias,@cirurgias,
        @vacinas_atualizadas,@historico_familiar,@sintomas_atuais
      )
    `).run({
      nome:d.nome, cpf:d.cpf||null, data_nascimento:d.data_nascimento||null,
      cidade:d.cidade||null, telefone:d.telefone||null,
      nome_mae:d.nome_mae||null, sexo:d.sexo||null, cns:d.cns||null,
      doencas:JSON.stringify(Array.isArray(d.doencas)?d.doencas:[]),
      doenca_coracao:d.doenca_coracao||null, doenca_rim:d.doenca_rim||null,
      doenca_figado:d.doenca_figado||null, doencas_outras:d.doencas_outras||null,
      tabagismo:d.tabagismo||"nunca", tabagismo_anos:d.tabagismo_anos||null,
      tabagismo_cigarros:d.tabagismo_cigarros||null, tabagismo_parou:d.tabagismo_parou||null,
      etilismo:d.etilismo||"nunca", etilismo_frequencia:d.etilismo_frequencia||null,
      etilismo_parou:d.etilismo_parou||null,
      medicamentos:JSON.stringify(Array.isArray(d.medicamentos)?d.medicamentos:[]),
      medicamentos_outros:d.medicamentos_outros||null, alergias:d.alergias||null,
      cirurgias:d.cirurgias||null, vacinas_atualizadas:d.vacinas_atualizadas||"nao_informado",
      historico_familiar:d.historico_familiar||null, sintomas_atuais:d.sintomas_atuais||null,
    });
    res.json({ ok:true, pacienteId:info.lastInsertRowid });
  } catch(e) {
    console.error("[/paciente/form]", e.message);
    res.status(500).json({ message:"Erro interno." });
  }
});

app.get("/api/paciente/busca", (req, res) => {
  try { res.json(buscarPacientes(req.query.q||"")); }
  catch(e) { res.status(500).json({ message:"Erro interno." }); }
});

app.get("/api/paciente/:id", (req, res) => {
  try {
    const d = getPacienteCompleto(Number(req.params.id));
    if (!d) return res.status(404).json({ message:"Não encontrado." });
    res.json(d);
  } catch(e) { res.status(500).json({ message:"Erro interno." }); }
});

// ─────────────────────────────────────────────────────────────
// RECEPÇÃO — só dados demográficos
// ─────────────────────────────────────────────────────────────
app.post("/api/recepcao/confirmar", (req, res) => {
  try {
    const { paciente_id, dados, drive_folder } = req.body;
    if (!paciente_id) return res.status(400).json({ message:"paciente_id obrigatório." });

    db.prepare(`
      UPDATE pacientes SET
        nome=COALESCE(@nome,nome), cpf=COALESCE(@cpf,cpf),
        data_nascimento=COALESCE(@data_nascimento,data_nascimento),
        cidade=COALESCE(@cidade,cidade), telefone=COALESCE(@telefone,telefone),
        nome_mae=COALESCE(@nome_mae,nome_mae), cns=COALESCE(@cns,cns),
        status='em_atendimento'
      WHERE id=@id
    `).run({ nome:null, cpf:null, data_nascimento:null, cidade:null, telefone:null, nome_mae:null, cns:null, ...(dados||{}), id:paciente_id });

    const exist = db.prepare("SELECT id FROM recepcao WHERE paciente_id=? LIMIT 1").get(paciente_id);
    let recId;
    if (exist) {
      db.prepare(`
        UPDATE recepcao SET nome=@nome,cpf=@cpf,data_nascimento=@data_nascimento,
        telefone=@telefone,nome_mae=@nome_mae,convenio=@convenio,
        numero_sus=@numero_sus,cns=@cns,logradouro=@logradouro,bairro=@bairro,
        municipio=@municipio,uf=@uf,cep=@cep,drive_folder=@drive_folder
        WHERE id=@id
      `).run({ ...(dados||{}), drive_folder:drive_folder||null, id:exist.id });
      recId = exist.id;
    } else {
      const defaults = { nome:null,cpf:null,data_nascimento:null,telefone:null,nome_mae:null,
        convenio:null,numero_sus:null,cns:null,logradouro:null,bairro:null,municipio:null,uf:null,cep:null };
      const info = db.prepare(`
        INSERT INTO recepcao (paciente_id,nome,cpf,data_nascimento,telefone,
        nome_mae,convenio,numero_sus,cns,logradouro,bairro,municipio,uf,cep,drive_folder)
        VALUES (@paciente_id,@nome,@cpf,@data_nascimento,@telefone,
        @nome_mae,@convenio,@numero_sus,@cns,@logradouro,@bairro,@municipio,@uf,@cep,@drive_folder)
      `).run({ ...defaults, paciente_id, ...(dados||{}), drive_folder:drive_folder||null });
      recId = info.lastInsertRowid;
    }
    res.json({ ok:true, recepcaoId:recId });
  } catch(e) {
    console.error("[/recepcao/confirmar]", e.message);
    res.status(500).json({ message:"Erro interno." });
  }
});

// ─────────────────────────────────────────────────────────────
// MÉDICO
// ─────────────────────────────────────────────────────────────
app.get("/api/medico/lista", (req, res) => {
  try {
    res.json(db.prepare(`
      SELECT p.id,p.nome,p.cidade,p.status,p.created_at,
             r.municipio, d.status_analise,
             d.cid10_extraido, d.estadiamento_extraido
      FROM pacientes p
      LEFT JOIN recepcao r ON r.paciente_id=p.id
      LEFT JOIN dossies  d ON d.paciente_id=p.id
      WHERE date(p.created_at)=date('now','localtime') OR p.status='em_atendimento'
      ORDER BY p.created_at DESC LIMIT 50
    `).all());
  } catch(e) { res.status(500).json({ message:"Erro interno." }); }
});

app.post("/api/medico/evolucao/salvar", (req, res) => {
  try {
    const { paciente_id, dossie_id, texto_evolucao } = req.body;
    if (!paciente_id) return res.status(400).json({ message:"paciente_id obrigatório." });
    const paciente = db.prepare("SELECT id,nome,cpf,cns,data_nascimento FROM pacientes WHERE id=?").get(paciente_id);
    if (!paciente) return res.status(404).json({ message:"Paciente não encontrado." });
    const security = prontuarioSecurityServer(paciente, texto_evolucao || "");
    if (!security.ok) {
      return res.status(409).json({
        ok:false,
        agent:"Prontuário Security",
        message:"Prontuário Security bloqueou o salvamento: dados demográficos não conferem.",
        problemas:security.problemas
      });
    }
    const exist = db.prepare(
      "SELECT id FROM evolucoes WHERE paciente_id=? AND status='rascunho' LIMIT 1"
    ).get(paciente_id);
    let evolucaoId;
    if (exist) {
      db.prepare("UPDATE evolucoes SET texto_evolucao=?,status='salvo' WHERE id=?")
        .run(texto_evolucao, exist.id);
      evolucaoId = exist.id;
    } else {
      const info = db.prepare(
        "INSERT INTO evolucoes (paciente_id,dossie_id,texto_evolucao,status) VALUES (?,?,?,'salvo')"
      ).run(paciente_id, dossie_id||null, texto_evolucao);
      evolucaoId = info.lastInsertRowid;
    }
    db.prepare("UPDATE pacientes SET status='concluido' WHERE id=?").run(paciente_id);
    res.json({ ok:true, evolucaoId });
  } catch(e) {
    console.error("[/evolucao/salvar]", e.message);
    res.status(500).json({ message:"Erro interno." });
  }
});

// ─────────────────────────────────────────────────────────────
// APAC
// ─────────────────────────────────────────────────────────────
app.post("/api/apac/gerar", async (req, res) => {
  const { evolucao_id, paciente_id } = req.body;
  if (!evolucao_id || !paciente_id) return res.status(400).json({ message:"Campos obrigatórios." });
  try {
    const dados  = getPacienteCompleto(paciente_id);
    if (!dados) return res.status(404).json({ message:"Paciente não encontrado." });
    const dossie = db.prepare(
      "SELECT * FROM dossies WHERE paciente_id=? ORDER BY created_at DESC LIMIT 1"
    ).get(paciente_id);
    const campos = await preencherAPAC({
      paciente: dados.paciente,
      recepcao: dados.recepcao,
      resumoClaude: dossie?.resumo_claude,
    });
    const validacao = validarAPAC(campos);
    const exist = db.prepare("SELECT id FROM apac WHERE evolucao_id=? LIMIT 1").get(evolucao_id);
    let apacId;
    const vals = {
      ...campos, ...validacao,
      evolucao_id, paciente_id,
      procedimentos_json: JSON.stringify([]),
    };
    if (exist) {
      db.prepare(`UPDATE apac SET nome=@nome,cpf=@cpf,cns=@cns,nome_mae=@nome_mae,
        municipio=@municipio,cid10=@cid10,diagnostico_histologico=@diagnostico_histologico,
        data_biopsia=@data_biopsia,estadiamento=@estadiamento,
        procedimento_sigtap=@procedimento_sigtap,linha_tratamento=@linha_tratamento,
        protocolo=@protocolo,justificativa_clinica=@justificativa_clinica,
        peso=@peso,altura=@altura,funcao_renal=@funcao_renal,funcao_hepatica=@funcao_hepatica,
        status_completude=@status_completude,pendencias_json=@pendencias_json,
        risco_glosa=@risco_glosa WHERE id=@id`
      ).run({ ...vals, id:exist.id });
      apacId = exist.id;
    } else {
      const info = db.prepare(`INSERT INTO apac (evolucao_id,paciente_id,nome,cpf,cns,nome_mae,
        municipio,cid10,diagnostico_histologico,data_biopsia,estadiamento,
        procedimento_sigtap,linha_tratamento,protocolo,justificativa_clinica,
        peso,altura,funcao_renal,funcao_hepatica,status_completude,pendencias_json,risco_glosa)
        VALUES (@evolucao_id,@paciente_id,@nome,@cpf,@cns,@nome_mae,@municipio,
        @cid10,@diagnostico_histologico,@data_biopsia,@estadiamento,
        @procedimento_sigtap,@linha_tratamento,@protocolo,@justificativa_clinica,
        @peso,@altura,@funcao_renal,@funcao_hepatica,@status_completude,
        @pendencias_json,@risco_glosa)`
      ).run(vals);
      apacId = info.lastInsertRowid;
    }
    res.json({ ok:true, apacId, validacao, campos });
  } catch(e) {
    console.error("[/apac/gerar]", e.message);
    res.status(500).json({ message:"Erro interno." });
  }
});

app.put("/api/apac/:id", (req, res) => {
  try {
    const val = validarAPAC(req.body);
    db.prepare(`UPDATE apac SET nome=@nome,cpf=@cpf,cns=@cns,nome_mae=@nome_mae,
      municipio=@municipio,cid10=@cid10,diagnostico_histologico=@diagnostico_histologico,
      data_biopsia=@data_biopsia,estadiamento=@estadiamento,
      procedimento_sigtap=@procedimento_sigtap,linha_tratamento=@linha_tratamento,
      protocolo=@protocolo,justificativa_clinica=@justificativa_clinica,
      peso=@peso,altura=@altura,funcao_renal=@funcao_renal,funcao_hepatica=@funcao_hepatica,
      status_completude=@status_completude,pendencias_json=@pendencias_json,
      risco_glosa=@risco_glosa WHERE id=@id`
    ).run({ ...req.body, ...val, id:Number(req.params.id) });
    res.json({ ok:true, validacao:val });
  } catch(e) { res.status(500).json({ message:"Erro interno." }); }
});

app.get("/api/apac/:evolucaoId", (req, res) => {
  try {
    const a = db.prepare(
      "SELECT * FROM apac WHERE evolucao_id=? ORDER BY created_at DESC LIMIT 1"
    ).get(Number(req.params.evolucaoId));
    if (!a) return res.status(404).json({ message:"APAC não encontrada." });
    res.json({ ...a, pendencias:JSON.parse(a.pendencias_json||"[]") });
  } catch(e) { res.status(500).json({ message:"Erro interno." }); }
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error("[ERRO GLOBAL]", err.message);
  if (err.message === "Formato inválido. Use PDF, JPG ou PNG.")
    return res.status(400).json({ message: err.message });
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ message:"Arquivo excede 30 MB." });
  res.status(500).json({ message:"Erro interno no servidor." });
});

app.listen(PORT, () => {
  console.log(`\n\u{1F3E5}  Onco App v4 — http://localhost:${PORT}`);
  console.log(`    Upload direto de laudos → Claude → Dossie`);
  console.log(`    ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "✅ configurada" : "❌ AUSENTE — configure no .env"}\n`);
});
