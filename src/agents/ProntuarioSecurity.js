/**
 * ══════════════════════════════════════════════════════════════
 *  PRONTUÁRIO SECURITY — Guarda de Identidade
 *  APACApp · Dr. Silas Negrão Serra Jr. · CRM-PB 17341
 *
 *  PROBLEMA CRÍTICO que motivou este agente:
 *  Ao analisar um laudo de "Doracy" via AgenteDrive e salvar o
 *  resumo como evolução, os dados da paciente Doracy entraram no
 *  prontuário de outra paciente. Erro clínico grave.
 *
 *  COMO FUNCIONA:
 *  Camada 1 — LOCAL (síncrono, sem API, < 5ms):
 *    · Extrai nomes próprios do texto sendo salvo
 *    · Compara com pac.nome via similaridade de tokens
 *    · Checa pronomes de gênero vs pac.sexo
 *    · Checa datas de nascimento vs pac.nasc
 *    · Checa CID/diagnóstico vs pac.cid
 *
 *  Camada 2 — IA (assíncrono, só se Camada 1 suspeitar):
 *    · Envia trecho suspeito para Claude verificar
 *    · Devolve veredicto com citação do conflito
 *
 *  RESULTADO:
 *  { nivel: 'ok'|'aviso'|'bloqueio', alertas: string[], detalhes: object }
 *  · 'ok'      → salva normalmente
 *  · 'aviso'   → mostra alerta, permite salvar com confirmação
 *  · 'bloqueio'→ IMPEDE o save, exige revisão manual
 * ══════════════════════════════════════════════════════════════
 */

// ─── Utilitários de normalização ─────────────────────────────────────────────

/** Remove acentos, converte para minúsculas, remove preposições comuns */
function normNome(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\b(da|de|do|das|dos|e|di)\b/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Similaridade de Jaccard entre conjuntos de tokens */
function jaccard(a, b) {
  const ta = new Set(normNome(a).split(' ').filter(Boolean));
  const tb = new Set(normNome(b).split(' ').filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  const inter = [...ta].filter(x => tb.has(x)).length;
  const union = new Set([...ta, ...tb]).size;
  return inter / union;
}

/** Verifica se dois nomes são "o mesmo" com tolerância a abreviações */
function mesmoNome(nomeA, nomeB) {
  if (!nomeA || !nomeB) return false;
  const j = jaccard(nomeA, nomeB);
  if (j >= 0.5) return true;
  // Verifica se um é subconjunto do outro (abreviações)
  const ta = normNome(nomeA).split(' ').filter(Boolean);
  const tb = normNome(nomeB).split(' ').filter(Boolean);
  if (ta.length === 0 || tb.length === 0) return false;
  const menor = ta.length < tb.length ? ta : tb;
  const maior = ta.length < tb.length ? tb : ta;
  const match = menor.filter(t => t.length >= 3 && maior.includes(t)).length;
  return match / menor.length >= 0.6;
}

/** Normaliza data no formato dd/mm/aaaa ou aaaa-mm-dd → "dd/mm/aaaa" */
function normData(d) {
  if (!d) return null;
  d = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [ano, mes, dia] = d.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) {
    const [dia, mes, ano] = d.split('/');
    return `${dia.padStart(2,'0')}/${mes.padStart(2,'0')}/${ano}`;
  }
  return null;
}

// ─── Camada 1: Análise local (síncrona) ──────────────────────────────────────

/**
 * Extrai nomes próprios de um texto clínico.
 * Ignora palavras comuns de prontuário que são capitalizadas por erro.
 */
const PALAVRAS_IGNORAR = new Set([
  'hospital', 'unidade', 'oncologica', 'patos', 'bem', 'sus', 'apac', 'cns', 'cpf',
  'cid', 'ecog', 'folfox', 'folfiri', 'tc', 'rm', 'pet', 'hemoglobina', 'neutro',
  'plaquetas', 'creatinina', 'tgo', 'tgp', 'consulta', 'ciclo', 'retorno',
  'intercorrencia', 'laudo', 'exame', 'biopsia', 'patologia', 'resultado',
  'diagnostico', 'tratamento', 'quimioterapia', 'radioterapia', 'cirurgia',
  'evolucao', 'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  'medico', 'medica', 'dra', 'dr', 'enfermagem', 'farmacia',
]);

function extrairNomesCandidatos(texto) {
  if (!texto) return [];
  const candidatos = [];

  // Padrão: 2+ palavras capitalizadas consecutivas, com preposições opcionais
  const NOME_RE = /\b([A-ZÁÊÇÃÕÉÍÓÚ][a-záêçãõéíóúü]{2,}(?:\s+(?:d[aeo]s?\s+)?[A-ZÁÊÇÃÕÉÍÓÚ][a-záêçãõéíóúü]{2,})+)\b/g;
  let m;
  while ((m = NOME_RE.exec(texto)) !== null) {
    const candidato = m[1].trim();
    const normalizado = normNome(candidato);
    // Filtra palavras técnicas/comuns
    const tokens = normalizado.split(' ').filter(Boolean);
    if (tokens.every(t => PALAVRAS_IGNORAR.has(t))) continue;
    if (candidato.length < 7) continue;
    candidatos.push(candidato);
  }

  // Contextos clínicos explícitos (precedido por "paciente", "Sra.", "Sr.")
  const CONTEXTO_RE = /(?:paciente|Sra?\.?|nome[:\s]+)\s+([A-ZÁÊÇÃÕÉÍÓÚ][a-záêçãõéíóúü]{2,}(?:\s+[A-ZÁÊÇÃÕÉÍÓÚ][a-záêçãõéíóúü]{1,})*)/gi;
  while ((m = CONTEXTO_RE.exec(texto)) !== null) {
    const candidato = m[1].trim();
    if (candidato.length >= 4 && !PALAVRAS_IGNORAR.has(normNome(candidato).split(' ')[0])) {
      candidatos.push(candidato);
    }
  }

  // Deduplica mantendo mais longo
  return [...new Set(candidatos)].sort((a,b) => b.length - a.length);
}

/**
 * Extrai datas no formato dd/mm/aaaa do texto
 */
function extrairDatas(texto) {
  if (!texto) return [];
  const datas = [];
  const DATE_RE = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
  let m;
  while ((m = DATE_RE.exec(texto)) !== null) {
    const [, d, mes, anoRaw] = m;
    const ano = anoRaw.length === 2 ? '19' + anoRaw : anoRaw;
    // Só datas que parecem nascimento (ano 1900-2020, dia/mês válidos)
    const a = parseInt(ano);
    const dm = parseInt(d);
    const mm = parseInt(mes);
    if (a >= 1900 && a <= 2020 && dm >= 1 && dm <= 31 && mm >= 1 && mm <= 12) {
      datas.push(`${String(dm).padStart(2,'0')}/${String(mm).padStart(2,'0')}/${ano}`);
    }
  }
  return [...new Set(datas)];
}

/**
 * Extrai CIDs oncológicos do texto
 */
function extrairCIDs(texto) {
  if (!texto) return [];
  const CID_RE = /\b([CD]\d{2}(?:\.\d+)?)\b/gi;
  return [...new Set([...texto.matchAll(CID_RE)].map(m => m[1].toUpperCase()))];
}

/**
 * Detecta pronomes/marcadores de gênero no texto
 */
function detectarGeneroTexto(texto) {
  if (!texto) return null;
  const t = texto.toLowerCase();
  const scoreFem = (
    (t.match(/\b(ela|dela|nela|a paciente|foi submetida|submetida|diagnosticada|medicada|internada)\b/g) || []).length
  );
  const scoreMasc = (
    (t.match(/\b(ele|dele|nele|o paciente|foi submetido|submetido|diagnosticado|medicado|internado)\b/g) || []).length
  );
  if (scoreFem > scoreMasc) return 'F';
  if (scoreMasc > scoreFem) return 'M';
  return null;
}

/**
 * Camada 1 — análise local completa
 * @returns {{ nivel, alertas, suspeitas, candidatosNome, datasEncontradas, cidsEncontrados }}
 */
function analisarLocal(texto, pac) {
  const alertas = [];
  const suspeitas = [];
  let nivelMax = 0; // 0=ok, 1=aviso, 2=bloqueio

  const nomePac = pac?.nome || '';
  const nascPac = normData(pac?.nasc || pac?.data_nascimento || '');
  const sexoPac = (pac?.sexo || '').toUpperCase();
  const cidPac  = (pac?.cid || '').toUpperCase();

  // ── 1. Análise de nomes ───────────────────────────────────────────────────
  const candidatosNome = extrairNomesCandidatos(texto);

  for (const candidato of candidatosNome) {
    if (mesmoNome(candidato, nomePac)) continue; // ✅ é o paciente certo

    // É um nome diferente do paciente atual
    const sim = jaccard(candidato, nomePac);
    if (sim < 0.3) {
      // Nome muito diferente — suspeita alta
      const msg = `Nome "${candidato}" encontrado no texto mas o paciente ativo é "${nomePac}"`;
      suspeitas.push({ tipo: 'nome', valor: candidato, msg });
      alertas.push(`🚨 NOME DIFERENTE: "${candidato}" ≠ "${nomePac}"`);
      nivelMax = Math.max(nivelMax, 2); // BLOQUEIO
    }
  }

  // ── 2. Análise de datas de nascimento ──────────────────────────────────────
  const datasEncontradas = extrairDatas(texto);
  if (nascPac) {
    for (const data of datasEncontradas) {
      if (data !== nascPac) {
        // Pode ser data de exame — só suspeita se contexto clínico de nascimento
        const idx = texto.indexOf(data.replace(/\//g,'\\/'));
        const contexto = texto.slice(Math.max(0, idx - 40), idx + 40).toLowerCase();
        const isNasc = /nasc|nascimento|ddn|data de nasc|anos de idade|anos,/.test(contexto);
        if (isNasc) {
          alertas.push(`⚠️ DATA DE NASC: "${data}" ≠ paciente "${nascPac}"`);
          suspeitas.push({ tipo: 'nascimento', valor: data, msg: `Data de nascimento divergente` });
          nivelMax = Math.max(nivelMax, 2); // BLOQUEIO
        }
      }
    }
  }

  // ── 3. Análise de gênero ──────────────────────────────────────────────────
  if (sexoPac) {
    const generoTexto = detectarGeneroTexto(texto);
    if (generoTexto && generoTexto !== sexoPac) {
      alertas.push(`⚠️ GÊNERO: texto usa pronomes de "${generoTexto === 'F' ? 'feminino' : 'masculino'}" mas paciente é "${sexoPac === 'F' ? 'Feminino' : 'Masculino'}"`);
      suspeitas.push({ tipo: 'genero', valor: generoTexto, msg: 'Pronomes incompatíveis com o paciente ativo' });
      nivelMax = Math.max(nivelMax, 1); // AVISO
    }
  }

  // ── 4. Análise de CID ─────────────────────────────────────────────────────
  const cidsEncontrados = extrairCIDs(texto);
  if (cidPac && cidsEncontrados.length > 0) {
    const cidBase = cidPac.replace(/\..*/,''); // C50.1 → C50
    const temCidCompativel = cidsEncontrados.some(c =>
      c.startsWith(cidBase) || cidBase.startsWith(c.replace(/\..*/,''))
    );
    if (!temCidCompativel && cidsEncontrados.length > 0) {
      const cidsStr = cidsEncontrados.join(', ');
      alertas.push(`⚠️ CID: texto contém ${cidsStr} mas o diagnóstico ativo é ${cidPac}`);
      suspeitas.push({ tipo: 'cid', valor: cidsStr, msg: 'CID do texto incompatível com diagnóstico ativo' });
      nivelMax = Math.max(nivelMax, 1); // AVISO
    }
  }

  const NIVEIS = ['ok', 'aviso', 'bloqueio'];
  return {
    nivel: NIVEIS[nivelMax],
    alertas,
    suspeitas,
    candidatosNome,
    datasEncontradas,
    cidsEncontrados,
    precisaIA: nivelMax > 0 && suspeitas.some(s => s.tipo === 'nome'),
  };
}

// ─── Camada 2: Verificação por IA (assíncrona) ────────────────────────────────

async function verificarComIA(texto, pac, suspeitas) {
  const getKey = () =>
    localStorage.getItem('anthropic_key') ||
    (() => { try { return JSON.parse(localStorage.getItem('ia_keys')||'{}').claude||''; } catch { return ''; } })() ||
    (typeof window !== 'undefined' && window.__ANTHROPIC_KEY__) || '';

  const key = getKey();
  if (!key) {
    // Sem chave → degrada graciosamente para aviso com análise local
    return {
      nivel: 'aviso',
      veredictoIA: null,
      msg: 'Verificação IA indisponível (chave não configurada). Análise local detectou inconsistências — revise manualmente.',
    };
  }

  const primeiros800 = texto.slice(0, 800);
  const nomePac = pac?.nome || '—';
  const nascPac = pac?.nasc || '—';
  const sexoPac = pac?.sexo === 'F' ? 'Feminino' : pac?.sexo === 'M' ? 'Masculino' : '—';
  const cidPac  = pac?.cid || '—';

  const prompt = `Você é um agente de segurança de prontuário médico. Analise se o texto abaixo pertence ao paciente ativo indicado.

PACIENTE ATIVO:
- Nome: ${nomePac}
- Data nasc: ${nascPac}
- Sexo: ${sexoPac}
- CID/Diagnóstico: ${cidPac}

SUSPEITAS IDENTIFICADAS LOCALMENTE:
${suspeitas.map(s => `• ${s.tipo.toUpperCase()}: ${s.msg}`).join('\n')}

TRECHO DO TEXTO A VERIFICAR:
"${primeiros800}"

Responda SOMENTE em JSON (sem markdown):
{
  "pertence_ao_paciente": true/false,
  "confianca": 0-100,
  "conflitos": ["lista de conflitos encontrados com citações do texto"],
  "veredicto": "ok"|"aviso"|"bloqueio",
  "justificativa": "frase curta"
}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5', // Haiku — rápido e barato para classificação
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const txt = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
    const clean = txt.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      nivel: parsed.veredicto || 'aviso',
      confianca: parsed.confianca || 50,
      conflitos: parsed.conflitos || [],
      justificativa: parsed.justificativa || '',
      pertenceAoPaciente: parsed.pertence_ao_paciente,
      veredictoIA: parsed,
    };
  } catch (e) {
    // Falha na IA → mantém resultado local
    return {
      nivel: 'aviso',
      veredictoIA: null,
      msg: `IA indisponível (${e.message}). Revise manualmente.`,
    };
  }
}

// ─── Interface pública ────────────────────────────────────────────────────────

/**
 * Verifica se um texto pode ser salvo com segurança no prontuário do paciente.
 *
 * @param {string} texto - Texto da evolução/resumo sendo salvo
 * @param {object} pac   - Objeto paciente ativo { nome, nasc, sexo, cid, ... }
 * @param {object} opts  - Opções: { usarIA: boolean (default true) }
 * @returns {Promise<{
 *   nivel: 'ok'|'aviso'|'bloqueio',
 *   alertas: string[],
 *   suspeitas: object[],
 *   veredictoIA: object|null,
 *   resumo: string,
 * }>}
 */
export async function verificarSegurancaProntuario(texto, pac, opts = {}) {
  const { usarIA = true } = opts;

  // Texto muito curto — sem risco de contaminação
  if (!texto || texto.trim().length < 40) {
    return { nivel: 'ok', alertas: [], suspeitas: [], veredictoIA: null, resumo: 'Texto muito curto para análise.' };
  }

  // Camada 1: análise local (síncrona)
  const local = analisarLocal(texto, pac);

  // Nenhuma suspeita → libera imediatamente
  if (local.nivel === 'ok') {
    return { nivel: 'ok', alertas: [], suspeitas: [], veredictoIA: null, resumo: '✅ Identidade verificada.' };
  }

  // Camada 2: IA (somente se há suspeita de nome errado e IA habilitada)
  if (usarIA && local.precisaIA) {
    const ia = await verificarComIA(texto, pac, local.suspeitas);
    return {
      nivel: ia.nivel,
      alertas: local.alertas,
      suspeitas: local.suspeitas,
      veredictoIA: ia.veredictoIA,
      conflitosIA: ia.conflitos || [],
      resumo: ia.justificativa || ia.msg || local.alertas.join(' | '),
    };
  }

  // Aviso local sem IA
  return {
    nivel: local.nivel,
    alertas: local.alertas,
    suspeitas: local.suspeitas,
    veredictoIA: null,
    resumo: local.alertas.join(' | '),
  };
}

/**
 * Versão síncrona (somente Camada 1) — para uso em onChange/preview
 * Retorna resultado imediato sem chamar API
 */
export function verificarSegurancaLocal(texto, pac) {
  if (!texto || texto.trim().length < 40 || !pac?.nome) {
    return { nivel: 'ok', alertas: [] };
  }
  const { nivel, alertas } = analisarLocal(texto, pac);
  return { nivel, alertas };
}
