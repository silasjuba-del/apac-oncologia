// ─────────────────────────────────────────────────────────────────────────────
// pipeline.js — P2: Contrato único de ingestão de documentos clínicos
// ─────────────────────────────────────────────────────────────────────────────
// TODA entrada de documento clínico (upload IA, Drive, texto, recepção)
// passa por integrarDocumentoNoDossie() ANTES de tocar no dossiê.
// Garante: identidade do paciente, origem rastreável, segurança uniforme.
//
// Fluxo canônico:
//   ENTRADA (arquivo|texto|Drive|link)
//     → criarDocumentoClinico(params)
//     → integrarDocumentoNoDossie(doc, ctx)
//         1. executarProntuarioSecurity  ← bloqueia sem paciente/texto
//         2. extrairCamposIA → up()      ← preenche campos vazios
//         3. up("docs_ia_resumo")        ← rastreabilidade
//         4. setDossie(novoDossie)       ← persistência canônica
//     → retorna novoDossie | null
// ─────────────────────────────────────────────────────────────────────────────
import { NOW } from '../components/ui/primitives';
import { executarProntuarioSecurity } from './security';
import { extrairCamposIA, extrairEvolucaoIA, extrairExamesRealizadosTexto } from './parse';
import { criarDossieInicial, gerarTextoEvolucao, validarAPAC } from './dossie';

// ── Schema canônico de DocumentoClínico ──────────────────────────────────────
// Todos os documentos adicionados ao dossiê devem usar este shape.
// O campo `fonte` é obrigatório para rastreabilidade (P0/P1).
export function criarDocumentoClinico({
  tipo        = "Laudo/Exame",
  nome        = "Documento",
  resumo      = "",
  camposIA    = null,   // objeto de campos extraídos pela IA; null = extrai na hora
  origem      = "manual",
  link        = null,   // URL Google Drive ou externo
  arquivo     = null,   // { name, size, type } — objeto File serializado
  extra       = {},     // campos opcionais (exames, evolucaoClaude, etc.)
} = {}) {
  return {
    id:       Date.now() + Math.floor(Math.random() * 99999),
    tipo,
    nome,
    resumo,
    camposIA: camposIA ?? (resumo ? extrairCamposIA(resumo) : {}),
    origem,
    fonte:    origem,   // alias para rastreabilidade de segurança
    link,
    arquivo:  arquivo ? { name: arquivo.name, size: arquivo.size, type: arquivo.type } : null,
    criadoEm: NOW(),
    ...extra,
  };
}

// ── Pipeline canônico ─────────────────────────────────────────────────────────
// Retorna o novo estado do dossiê (para callers que precisam, ex.: aplicarPagina),
// ou null se bloqueado pelo guard de segurança.
export function integrarDocumentoNoDossie(doc, { pac, dossie, setDossie, up, addMsg } = {}) {
  if (!doc) return null;

  // ── 1. Guard de segurança ─────────────────────────────────────────────────
  const origemLabel = doc.origem || "upload";
  const textoCheck  = doc.resumo || doc.nome || "documento";
  if (!executarProntuarioSecurity({ pac, texto: textoCheck, origem: origemLabel }, addMsg)) return null;

  // ── 2. Aplicar campos IA ao paciente (só preenche vazios) ─────────────────
  const campos = doc.camposIA || {};
  const camposAplicados = {};
  if (up && Object.keys(campos).length) {
    Object.entries(campos).forEach(([k, v]) => {
      if (v && !pac?.[k]) { up(k, v); camposAplicados[k] = v; }
    });
  }

  // ── 3. Rastreabilidade: acumular resumo em docs_ia_resumo ─────────────────
  const newDocsIaResumo = (pac?.docs_ia_resumo || "") + "\n\n---\n[" + origemLabel + "]\n" + doc.resumo;
  if (up && doc.resumo) {
    up("docs_ia_resumo", newDocsIaResumo);
  }

  // ── 4. Construir novo estado canônico do dossiê ───────────────────────────
  const base = dossie || criarDossieInicial(pac);
  // Remove duplicata pelo id antes de inserir
  const semDuplicata = (base.documentos || []).filter(x => String(x.id) !== String(doc.id));
  const novoClaude   = [base.resumoClaude, doc.resumo].filter(Boolean).join("\n\n---\n");

  // Inclui campos novos diretamente (sem esperar React state de up())
  const novoPaciente = {
    ...(base.paciente || {}),
    ...pac,
    ...camposAplicados,
    docs_ia_resumo: doc.resumo ? newDocsIaResumo : (pac?.docs_ia_resumo || ""),
  };

  const novoDossie = {
    ...base,
    paciente:     novoPaciente,
    documentos:   [doc, ...semDuplicata],
    resumoClaude: novoClaude,
    status:       "pronto_medico",
    updatedAt:    NOW(),
  };

  // Regenera rascunho de evolução + valida APAC com estado atualizado
  novoDossie.evolucao = {
    ...(novoDossie.evolucao || {}),
    rascunho: gerarTextoEvolucao(novoDossie),
    // textoFinal inalterado — só o médico salva o final
  };
  novoDossie.apac = validarAPAC(novoDossie);

  // ── 5. Persistir via setDossie (sempre passado como setDossieGuardado em App.jsx) ──
  setDossie && setDossie(() => novoDossie);

  return novoDossie;
}

// ── Helper: múltiplos documentos de uma vez (ex.: recepcao vinculando N arquivos) ──
export function integrarDocumentosNoDossie(docs = [], ctx = {}) {
  if (!docs.length) return null;
  // Encadeia as integrações: cada uma lê o dossie atualizado
  let dossieAtual = ctx.dossie;
  let ultimo = null;
  for (const doc of docs) {
    const resultado = integrarDocumentoNoDossie(doc, { ...ctx, dossie: dossieAtual });
    if (resultado) { dossieAtual = resultado; ultimo = resultado; }
  }
  return ultimo;
}
