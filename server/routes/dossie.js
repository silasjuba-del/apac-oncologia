// server/routes/dossie.js
// Upload direto de laudos → Claude → Dossiê
// SEM dependência de Google Drive

import express  from "express";
import multer   from "multer";
import fs       from "fs";
import path     from "path";
import { fileURLToPath } from "url";
import db, { getPacienteCompleto } from "../db.js";
import { gerarDossie, resumirLaudo } from "../services/claudeService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router    = express.Router();

const upload = multer({
  dest: path.join(__dirname, "../../uploads/"),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_, f, cb) => {
    const ok = ["application/pdf","image/jpeg","image/png","image/webp"].includes(f.mimetype);
    cb(ok ? null : new Error("Formato inválido. Use PDF, JPG ou PNG."), ok);
  },
});

// ─────────────────────────────────────────────────────────────
// POST /api/dossie/gerar
// multipart/form-data:
//   paciente_id  : number
//   texto_livre  : string (opcional — texto colado de laudo)
//   laudos[]     : arquivos (PDF/JPG/PNG)
//   tipos[]      : tipo de cada arquivo (biópsia, tomografia, etc.)
//   datas[]      : data de cada arquivo
// ─────────────────────────────────────────────────────────────
router.post("/gerar", upload.array("laudos", 20), async (req, res) => {
  const pacienteId = Number(req.body.paciente_id);
  const pacienteJson = parseJsonSeguro(req.body.paciente_json, {});
  const recepcaoJson = parseJsonSeguro(req.body.recepcao_json, {});
  if (!process.env.ANTHROPIC_API_KEY) {
    limparUploadsTemporarios(req.files);
    return res.status(503).json({
      ok:false,
      code:"ANTHROPIC_API_KEY_MISSING",
      message:"Claude não configurado no backend. Preencha ANTHROPIC_API_KEY no server/.env e reinicie o servidor.",
    });
  }

  try {
    const dados = pacienteId
      ? getPacienteCompleto(pacienteId)
      : { paciente: pacienteJson, recepcao: recepcaoJson };
    if (pacienteId && !dados) return res.status(404).json({ message: "Paciente não encontrado." });

    if (!pacienteId) {
      const textosLaudos = await montarTextosLaudos(req);
      const resumo = await gerarDossie({
        paciente: dados.paciente || {},
        recepcao: dados.recepcao || {},
        textosLaudos,
      });
      return res.json({
        ok: true,
        dossieId: null,
        status: "concluido",
        text: resumo,
        resumo,
        arquivosLidos: (req.files || []).length,
      });
    }

    // Criar dossiê com status processando
    const info = db.prepare(`
      INSERT INTO dossies (paciente_id, status_analise)
      VALUES (?, 'processando')
    `).run(pacienteId);
    const dossieId = info.lastInsertRowid;

    res.json({ ok: true, dossieId, status: "processando" });

    // Background — analisar laudos + gerar dossiê
    ;(async () => {
      try {
        const textosLaudos = await montarTextosLaudos(req);

        // 3. Gerar dossiê consolidado
        const resumo = await gerarDossie({
          paciente: dados.paciente,
          recepcao: dados.recepcao,
          textosLaudos,
        });

        // Extrair campos estruturados do resumo para APAC
        const cid10        = extrairCampo(resumo, "Diagnóstico:");
        const estadiamento = extrairCampo(resumo, "Estadiamento:");
        const subtipo      = extrairCampo(resumo, "Subtipo molecular:");
        const biomarcadores= extrairCampo(resumo, "Biomarcadores:");
        const dataBiopsia  = textosLaudos.find(l => l.tipo?.toLowerCase().includes("biópsia"))?.data || "";

        db.prepare(`
          UPDATE dossies SET
            resumo_claude=?,
            cid10_extraido=?,
            estadiamento_extraido=?,
            subtipo_extraido=?,
            biomarcadores_extraidos=?,
            data_biopsia_extraida=?,
            status_analise='concluido'
          WHERE id=?
        `).run(resumo, cid10, estadiamento, subtipo, biomarcadores, dataBiopsia, dossieId);

      } catch (e) {
        console.error("[dossie background]", e.message);
        db.prepare(
          "UPDATE dossies SET status_analise='erro', erro_analise=? WHERE id=?"
        ).run("Falha na análise. Verifique sua chave API e tente novamente.", dossieId);
        // Limpar arquivos temporários em caso de erro
        limparUploadsTemporarios(req.files);
      }
    })();

  } catch (e) {
    console.error("[/dossie/gerar]", e.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// GET /api/dossie/status/:id
router.get("/status/:id", (req, res) => {
  try {
    const d = db.prepare(
      "SELECT id, status_analise, erro_analise, resumo_claude, cid10_extraido, estadiamento_extraido, subtipo_extraido, biomarcadores_extraidos FROM dossies WHERE id=?"
    ).get(Number(req.params.id));
    if (!d) return res.status(404).json({ message: "Dossiê não encontrado." });
    res.json(d);
  } catch (e) {
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// GET /api/dossie/ultimo/:pacienteId
router.get("/ultimo/:pacienteId", (req, res) => {
  try {
    const d = db.prepare(
      "SELECT * FROM dossies WHERE paciente_id=? ORDER BY created_at DESC LIMIT 1"
    ).get(Number(req.params.pacienteId));
    res.json(d || null);
  } catch (e) {
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// ── Helpers ───────────────────────────────────────────────────

// POST /api/dossie/ler-local
// Lê PDF/imagem por caminho local do Windows e envia ao mesmo filtro Claude.
router.post("/ler-local", async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        ok: false,
        code: "ANTHROPIC_API_KEY_MISSING",
        message: "ANTHROPIC_API_KEY não configurada no backend. O arquivo foi localizado, mas ainda não pode ser lido pela IA.",
      });
    }

    const { paciente_id, caminho, tipo, data, paciente = {}, recepcao = {} } = req.body || {};
    if (!String(caminho || "").trim()) {
      return res.status(400).json({ ok: false, message: "Caminho do arquivo é obrigatório." });
    }

    const entrada = decodeURIComponent(String(caminho).trim().replace(/^file:\/\/\/?/i, ""));
    const caminhoNormalizado = path.resolve(entrada.replace(/\\/g, path.sep).replace(/\//g, path.sep));
    const roots = String(process.env.LOCAL_DOC_ROOTS || ("C:\\Users\\silas\\OneDrive\\" + "\u00c1rea de Trabalho" + ";C:\\Users\\silas\\Downloads;C:\\Users\\silas\\OneDrive\\Documentos"))
      .split(";")
      .map(r => path.resolve(r.trim()))
      .filter(Boolean);
    const permitido = roots.some(root => {
      const a = caminhoNormalizado.toLowerCase();
      const b = root.toLowerCase();
      return a === b || a.startsWith(b + path.sep.toLowerCase());
    });
    if (!permitido) {
      return res.status(403).json({
        ok: false,
        message: "Por segurança, só leio arquivos dentro de Desktop/OneDrive, Downloads ou Documentos. Ajuste LOCAL_DOC_ROOTS no server/.env se precisar.",
        caminho: caminhoNormalizado,
      });
    }

    if (!fs.existsSync(caminhoNormalizado)) {
      return res.status(404).json({ ok: false, message: "Arquivo não encontrado: " + caminhoNormalizado });
    }

    const st = fs.statSync(caminhoNormalizado);
    if (!st.isFile()) return res.status(400).json({ ok: false, message: "O caminho informado não é um arquivo." });
    if (st.size > 30 * 1024 * 1024) return res.status(413).json({ ok: false, message: "Arquivo acima de 30 MB. Reduza ou divida o PDF." });

    const ext = path.extname(caminhoNormalizado).toLowerCase();
    const MIMES = { ".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
    const mimeType = MIMES[ext];
    if (!mimeType) return res.status(400).json({ ok: false, message: "Formato não suportado. Use PDF, JPG, PNG ou WEBP." });

    const pacienteId = Number(paciente_id);
    const dadosDb = pacienteId ? getPacienteCompleto(pacienteId) : null;
    const dados = dadosDb || { paciente: paciente || {}, recepcao: recepcao || {} };
    const base64Data = fs.readFileSync(caminhoNormalizado).toString("base64");
    const tipoEx = tipo || detectarTipo(path.basename(caminhoNormalizado));
    const dataEx = data || "";

    const resumoLaudo = await resumirLaudo({ tipo: tipoEx, data: dataEx, mimeType, base64Data });
    const textosLaudos = [{ tipo: tipoEx, data: dataEx, conteudo: resumoLaudo }];
    const resumo = await gerarDossie({
      paciente: dados.paciente || {},
      recepcao: dados.recepcao || {},
      textosLaudos,
    });

    let dossieId = null;
    if (dadosDb && pacienteId) {
      const info = db.prepare("INSERT INTO dossies (paciente_id, status_analise) VALUES (?, 'concluido')").run(pacienteId);
      dossieId = info.lastInsertRowid;
      const cid10 = extrairCampo(resumo, "Diagnóstico:");
      const estadiamento = extrairCampo(resumo, "Estadiamento:");
      const subtipo = extrairCampo(resumo, "Subtipo molecular:");
      const biomarcadores = extrairCampo(resumo, "Biomarcadores:");
      const dataBiopsia = tipoEx.toLowerCase().includes("bi") ? dataEx : "";
      db.prepare(`
        UPDATE dossies SET
          resumo_claude=?,
          cid10_extraido=?,
          estadiamento_extraido=?,
          subtipo_extraido=?,
          biomarcadores_extraidos=?,
          data_biopsia_extraida=?,
          status_analise='concluido'
        WHERE id=?
      `).run(resumo, cid10, estadiamento, subtipo, biomarcadores, dataBiopsia, dossieId);
    }

    res.json({
      ok: true,
      status: "concluido",
      dossieId,
      text: resumo,
      resumo,
      resumoLaudo,
      arquivo: { nome: path.basename(caminhoNormalizado), caminho: caminhoNormalizado, mimeType, tamanho: st.size },
    });
  } catch (e) {
    console.error("[/dossie/ler-local]", e.message);
    res.status(500).json({ ok: false, message: e.message || "Erro interno." });
  }
});

function limparUploadsTemporarios(files = []) {
  for (const f of files || []) {
    try {
      if (f?.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
    } catch {}
  }
}

function parseJsonSeguro(raw, fallback = {}) {
  if (!raw) return fallback;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(String(raw)); }
  catch { return fallback; }
}

async function montarTextosLaudos(req) {
  const textosLaudos = [];

  const textoLivre = req.body.texto_livre?.trim();
  if (textoLivre) {
    textosLaudos.push({
      tipo: "laudo (texto colado)",
      data: new Date().toISOString().substring(0, 10),
      conteudo: textoLivre,
    });
  }

  const arquivos = req.files || [];
  const tipos = [].concat(req.body.tipos || []);
  const datas = [].concat(req.body.datas || []);

  for (let i = 0; i < arquivos.length; i++) {
    const arq = arquivos[i];
    const tipo = tipos[i] || detectarTipo(arq.originalname);
    const data = datas[i] || "";

    try {
      const b64 = fs.readFileSync(arq.path).toString("base64");
      const resumo = await resumirLaudo({
        tipo,
        data,
        mimeType: arq.mimetype,
        base64Data: b64,
      });
      textosLaudos.push({ tipo, data, conteudo: resumo });
    } catch (ef) {
      console.warn("[laudo]", arq.originalname, ef.message);
      textosLaudos.push({
        tipo,
        data,
        conteudo: `Não foi possível analisar este arquivo automaticamente: ${arq.originalname}`,
      });
    } finally {
      if (fs.existsSync(arq.path)) fs.unlinkSync(arq.path);
    }
  }

  return textosLaudos;
}

function detectarTipo(nomeArquivo) {
  const n = nomeArquivo.toLowerCase();
  if (n.includes("biop"))     return "biópsia";
  if (n.includes("tomog"))    return "tomografia";
  if (n.includes("pet"))      return "PET-CT";
  if (n.includes("cintilo"))  return "cintilografia";
  if (n.includes("rm") || n.includes("ressonancia")) return "ressonância magnética";
  if (n.includes("lab") || n.includes("hemo"))       return "laboratório";
  if (n.includes("rx") || n.includes("raio"))        return "raio-X";
  return "exame";
}

function extrairCampo(texto, campo) {
  const regex = new RegExp(`${campo}\\s*(.+)`, "i");
  const match = texto?.match(regex);
  return match?.[1]?.trim() || null;
}

export default router;
