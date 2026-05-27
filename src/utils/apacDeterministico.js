/**
 * apacDeterministico.js — Resolucao deterministica de campos APAC por fonte
 * P3 — Anti-glosa: rastreia de onde cada campo veio e se e confiavel
 *
 * Status possiveis por campo:
 *   'preenchido'   — valor explicitamente inserido pelo medico/secretaria
 *   'inferido'     — valor extraido automaticamente por IA / regex de laudos
 *   'ausente'      — campo vazio, nao encontrado em nenhuma fonte
 *   'inconsistente'— duas fontes dao valores diferentes para o mesmo campo
 *
 * Fonte: string legivel indicando de onde o valor veio, ex:
 *   'pac.cid', 'pac.diag', 'ia:diagCID', 'doc:laudo.pdf', 'ia:anatom', 'dossie:evolucao'
 */

import { getCIDFromDiag } from './apacValidator';
import { resolverSIGTAP } from './sigtapResolver';

// ── Helpers internos ──────────────────────────────────────────────────────────

const _v = (x) => x !== null && x !== undefined && String(x).trim() !== '' && String(x).trim() !== '—';

const _ok = (valor, fonte) => ({ valor, status: 'preenchido', fonte });
const _inf = (valor, fonte) => ({ valor, status: 'inferido', fonte });
const _ausente = () => ({ valor: null, status: 'ausente', fonte: null });
const _incons = (valorPac, valorInf, fontePac, fonteInf) => ({
  valor: valorPac,          // mantemos o valor do medico como verdade
  valorAlternativo: valorInf,
  status: 'inconsistente',
  fonte: fontePac,
  fonteAlternativa: fonteInf,
});

/** Busca camposIA de todos os documentos do dossie, retorna {valor,fonte} ou null */
function _buscarNoDocs(campo, dossie) {
  const docs = dossie?.documentos || [];
  for (const doc of docs) {
    const val = doc?.camposIA?.[campo];
    if (_v(val)) return { valor: val, fonte: `doc:${doc.nome || doc.tipo || 'laudo'}` };
  }
  return null;
}

/** Busca em pac.camposIA (campos extraidos pelo pipeline na ultima ingestao) */
function _buscarEmCamposIA(campo, pac) {
  const val = pac?.camposIA?.[campo];
  if (_v(val)) return { valor: val, fonte: 'ia:camposIA' };
  return null;
}

// ── Resolvedores por campo ────────────────────────────────────────────────────

/**
 * resolverCampoAPAC(campo, pac, dossie)
 * Retorna { valor, status, fonte } — e opcionalmente valorAlternativo + fonteAlternativa
 * quando status === 'inconsistente'.
 */
export function resolverCampoAPAC(campo, pac = {}, dossie = null) {
  switch (campo) {

    // ── Identificacao demografica ─────────────────────────────────────────────

    case 'nome':
      if (_v(pac.nome)) return _ok(pac.nome, 'pac.nome');
      return _ausente();

    case 'nasc':
      if (_v(pac.nasc)) return _ok(pac.nasc, 'pac.nasc');
      if (_v(pac.dataNasc)) return _ok(pac.dataNasc, 'pac.dataNasc');
      return _ausente();

    case 'mae':
      if (_v(pac.mae)) return _ok(pac.mae, 'pac.mae');
      return _ausente();

    case 'cidade': {
      const val = pac.cidade || pac.municipio;
      if (_v(val)) return _ok(val, pac.cidade ? 'pac.cidade' : 'pac.municipio');
      return _ausente();
    }

    case 'cpf':
      if (_v(pac.cpf)) return _ok(pac.cpf, 'pac.cpf');
      return _ausente();

    case 'cns':
      if (_v(pac.cns)) return _ok(pac.cns, 'pac.cns');
      return _ausente();

    case 'ecog':
      if (_v(pac.ecog)) return _ok(pac.ecog, 'pac.ecog');
      {
        const fromDoc = _buscarNoDocs('ecog', dossie);
        if (fromDoc) return _inf(fromDoc.valor, fromDoc.fonte);
      }
      return _ausente();

    case 'data_sol':
      if (_v(pac.data_sol)) return _ok(pac.data_sol, 'pac.data_sol');
      return _ausente();

    // ── CID-10 ────────────────────────────────────────────────────────────────

    case 'cid': {
      const cidPac = pac.cid || pac.cid_sugerido;
      const cidDiag = getCIDFromDiag(pac.diag);
      const fromDoc = _buscarNoDocs('cid', dossie);
      const fromCamposIA = _buscarEmCamposIA('cid', pac);

      if (_v(cidPac)) {
        // Verificar inconsistencia com inferencia
        const cidInf = cidDiag || fromDoc?.valor || fromCamposIA?.valor;
        const fonteInf = cidDiag ? 'ia:diagCID' : (fromDoc?.fonte || fromCamposIA?.fonte);
        if (_v(cidInf) && cidInf !== cidPac) {
          return _incons(cidPac, cidInf, pac.cid ? 'pac.cid' : 'pac.cid_sugerido', fonteInf);
        }
        return _ok(cidPac, pac.cid ? 'pac.cid' : 'pac.cid_sugerido');
      }

      // Sem CID direto — tentar inferir
      if (_v(cidDiag)) return _inf(cidDiag, 'ia:diagCID');
      if (fromDoc) return _inf(fromDoc.valor, fromDoc.fonte);
      if (fromCamposIA) return _inf(fromCamposIA.valor, fromCamposIA.fonte);
      return _ausente();
    }

    // ── Diagnostico ───────────────────────────────────────────────────────────

    case 'diag': {
      if (_v(pac.diag)) {
        const fromDoc = _buscarNoDocs('diag', dossie) || _buscarEmCamposIA('diag', pac);
        if (fromDoc && fromDoc.valor !== pac.diag) {
          return _incons(pac.diag, fromDoc.valor, 'pac.diag', fromDoc.fonte);
        }
        return _ok(pac.diag, 'pac.diag');
      }
      // Inferir do anatom
      if (_v(pac.anatom)) {
        const m = pac.anatom.match(/(?:diagnóstico|conclusão|laudo final|resultado)[\s:*]+([^\n.]{10,130})/i)
               || pac.anatom.match(/\b(Adenocarcinoma|Carcinoma|GIST|Linfoma|Sarcoma|Melanoma)[a-zA-ZÀ-ú\s,\-]{4,80}/i);
        if (m?.[1]) return _inf(m[1].trim(), 'ia:anatom');
      }
      const fromDoc = _buscarNoDocs('diag', dossie) || _buscarEmCamposIA('diag', pac);
      if (fromDoc) return _inf(fromDoc.valor, fromDoc.fonte);
      return _ausente();
    }

    // ── Procedimento SIGTAP ───────────────────────────────────────────────────

    case 'cod_proc': {
      // Usa resolverSIGTAP (cadeia CID→mapa→texto) como fonte única.
      // Elimina duplicação e garante mapa CID→SIGTAP mais completo.
      const r = resolverSIGTAP(pac);
      if (r.status === 'ausente') return _ausente();
      if (r.status === 'preenchido') return _ok(r.codigo, r.fonte || 'pac.cod_proc');
      return _inf(r.codigo, r.fonte || 'ia:sigtapResolver');
    }

    // ── Justificativa clinica ─────────────────────────────────────────────────

    case 'justif_apac': {
      if (_v(pac.justif_apac) && pac.justif_apac.trim().length >= 80)
        return _ok(pac.justif_apac, 'pac.justif_apac');

      // Evolucao salva e longa o suficiente
      const evolucao = dossie?.evolucao?.textoFinal || dossie?.evolucao?.rascunho || '';
      if (evolucao.trim().length >= 80)
        return _inf(evolucao.slice(0, 300) + (evolucao.length > 300 ? '...' : ''), 'dossie:evolucao');

      // resumoClaude longo
      const resumo = dossie?.resumoClaude || '';
      if (resumo.trim().length >= 80)
        return _inf(resumo.slice(0, 300) + (resumo.length > 300 ? '...' : ''), 'dossie:resumoClaude');

      // Justificativa curta existente (marcamos como preenchido mesmo assim — medico revisará)
      if (_v(pac.justif_apac)) return _ok(pac.justif_apac, 'pac.justif_apac');

      return _ausente();
    }

    // ── Estadiamento ──────────────────────────────────────────────────────────

    case 'estadio': {
      if (_v(pac.estadio)) return _ok(pac.estadio, 'pac.estadio');

      // TNM implica estadio
      if (_v(pac.tnm)) return _inf(pac.tnm, 'pac.tnm');

      // Inferir de laudos
      const textos = [pac.anatom, pac.imagen, pac.obs_ia].filter(Boolean).join(' ');
      if (textos) {
        const mEst = textos.match(/(?:estádio|estadio|stage)\s*:?\s*([IV]{1,4}[A-C]?)\b/i)
                  || textos.match(/\b(pT[0-4][a-d]?N[0-3][a-c]?M[01][a-c]?)\b/i);
        if (mEst?.[1]) return _inf(mEst[1], 'ia:laudos');
      }

      const fromDoc = _buscarNoDocs('estadio', dossie);
      if (fromDoc) return _inf(fromDoc.valor, fromDoc.fonte);
      return _ausente();
    }

    case 'tnm': {
      if (_v(pac.tnm)) return _ok(pac.tnm, 'pac.tnm');

      const textos = [pac.anatom, pac.imagen, pac.obs_ia].filter(Boolean).join(' ');
      if (textos) {
        const mTNM = textos.match(/\b([cpyr]?T[0-4][a-d]?N[0-3][a-c]?M[01][a-c]?)\b/i);
        if (mTNM?.[1]) return _inf(mTNM[1], 'ia:laudos');
      }
      return _ausente();
    }

    // ── Esquema terapeutico ───────────────────────────────────────────────────

    case 'trat': {
      if (_v(pac.trat)) return _ok(pac.trat, 'pac.trat');
      if (_v(pac.linha)) return _ok(pac.linha, 'pac.linha');

      const textos = [pac.obs_ia, dossie?.evolucao?.rascunho].filter(Boolean).join(' ');
      if (textos) {
        const mTrat = textos.match(/(?:esquema|protocolo|tratamento|quimioterapia)[\s:]+([^\n.]{5,60})/i);
        if (mTrat?.[1]) return _inf(mTrat[1].trim(), 'ia:obs_ia');
      }
      return _ausente();
    }

    // ── Biomarcadores ─────────────────────────────────────────────────────────

    case 'bio': {
      // Campos especializados de mama
      const partes = [];
      if (_v(pac.re)) partes.push('RE:' + pac.re);
      if (_v(pac.rp)) partes.push('RP:' + pac.rp);
      if (_v(pac.her2)) partes.push('HER2:' + pac.her2);
      if (_v(pac.ki67)) partes.push('Ki67:' + pac.ki67);
      if (_v(pac.bio)) partes.push(pac.bio);

      if (partes.length) return _ok(partes.join(' | '), 'pac.bio');

      // Inferir do anatom (IHQ)
      if (_v(pac.anatom)) {
        const mRE = pac.anatom.match(/\bRE\b[\s:=]+([^\s,;.\n()]{1,15})/i);
        const mHER = pac.anatom.match(/\bHER2\b[\s:=]+([^\s,;.\n()]{1,15})/i);
        if (mRE || mHER) {
          const val = [mRE && ('RE:' + mRE[1].trim()), mHER && ('HER2:' + mHER[1].trim())].filter(Boolean).join(' | ');
          return _inf(val, 'ia:anatom');
        }
      }
      return _ausente();
    }

    default:
      // Campo nao mapeado — verificar diretamente no pac
      if (_v(pac[campo])) return _ok(pac[campo], `pac.${campo}`);
      return _ausente();
  }
}

// ── Resolucao completa ────────────────────────────────────────────────────────

/**
 * CAMPOS_APAC — lista de todos os campos auditados com metadados
 * req: true = bloqueante (glosa certa se ausente)
 * req: false = alerta (risco de glosa)
 */
export const CAMPOS_APAC = [
  { campo: 'nome',        label: 'Nome do paciente',      req: true  },
  { campo: 'nasc',        label: 'Data de nascimento',    req: true  },
  { campo: 'mae',         label: 'Nome da mae',           req: true  },
  { campo: 'cidade',      label: 'Municipio',             req: true  },
  { campo: 'cns',         label: 'CNS (15 digitos)',      req: true  },
  { campo: 'cid',         label: 'CID-10 principal',      req: true  },
  { campo: 'cod_proc',    label: 'Codigo SIGTAP',         req: true  },
  { campo: 'justif_apac', label: 'Justificativa clinica', req: true  },
  { campo: 'estadio',     label: 'Estadiamento',          req: true  },
  { campo: 'trat',        label: 'Esquema terapeutico',   req: true  },
  { campo: 'diag',        label: 'Diagnostico principal', req: true  },
  { campo: 'tnm',         label: 'TNM / Estadiamento',    req: false },
  { campo: 'bio',         label: 'Biomarcadores',         req: false },
  { campo: 'ecog',        label: 'ECOG',                  req: false },
  { campo: 'cpf',         label: 'CPF',                   req: false },
  { campo: 'data_sol',    label: 'Data de solicitacao',   req: false },
];

/**
 * resolverAPACCompleta(pac, dossie)
 * Retorna objeto com todos os campos resolvidos + metricas globais.
 *
 * {
 *   campos: { [campo]: { valor, status, fonte, [valorAlternativo, fonteAlternativa] } },
 *   pendencias: string[],     // labels dos campos req ausentes
 *   inconsistencias: string[],// labels dos campos inconsistentes
 *   inferidos: string[],      // labels dos campos preenchidos por IA
 *   preenchidos: number,
 *   total: number,
 *   riscoGlosa: 'baixo' | 'moderado' | 'alto',
 *   scoreAntiGlosa: number,   // 0-100
 *   completa: boolean,
 * }
 */
export function resolverAPACCompleta(pac = {}, dossie = null) {
  const campos = {};
  const pendencias = [];
  const inconsistencias = [];
  const inferidos = [];
  let preenchidos = 0;

  for (const { campo, label, req } of CAMPOS_APAC) {
    const r = resolverCampoAPAC(campo, pac, dossie);
    campos[campo] = { ...r, label, req };

    switch (r.status) {
      case 'preenchido':
        preenchidos++;
        break;
      case 'inferido':
        preenchidos++;          // inferido conta como preenchido para score
        inferidos.push(label);
        break;
      case 'ausente':
        if (req) pendencias.push(label);
        break;
      case 'inconsistente':
        preenchidos++;          // valor existe, mas precisa revisao
        inconsistencias.push(label);
        break;
    }
  }

  const total = CAMPOS_APAC.length;
  const reqTotal = CAMPOS_APAC.filter(c => c.req).length;
  const reqOk = CAMPOS_APAC.filter(c => c.req).filter(c => campos[c.campo]?.status !== 'ausente').length;
  const scoreAntiGlosa = Math.round(
    (reqOk / reqTotal) * 70 +                        // 70pts por campos obrig
    (Math.min(preenchidos, total) / total) * 20 +    // 20pts por cobertura total
    (inconsistencias.length === 0 ? 10 : 0)          // 10pts bonus sem inconsistencias
  );

  const criticas = CAMPOS_APAC.filter(c => c.req && campos[c.campo]?.status === 'ausente');
  const riscoGlosa = criticas.length > 0
    ? 'alto'
    : inconsistencias.length > 0 || pendencias.length > 0
      ? 'moderado'
      : 'baixo';

  // bloqueante = true quando imprimir/enviar APAC deve ser desabilitado na UI.
  // Critério: algum campo obrigatório AUSENTE (glosa certa) ou score muito baixo.
  const bloqueante = criticas.length > 0 || scoreAntiGlosa < 60;

  return {
    campos,
    pendencias,
    inconsistencias,
    inferidos,
    preenchidos,
    total,
    scoreAntiGlosa,
    riscoGlosa,
    completa: pendencias.length === 0 && inconsistencias.length === 0,
    bloqueante,
  };
}

// ── Etiqueta de status para UI ────────────────────────────────────────────────

export const STATUS_META = {
  preenchido:    { label: 'Confirmado',    cor: '#16A34A', bg: '#DCFCE7', icone: '✅' },
  inferido:      { label: 'Inferido IA',   cor: '#D97706', bg: '#FEF3C7', icone: '🤖' },
  ausente:       { label: 'Ausente',       cor: '#DC2626', bg: '#FEE2E2', icone: '❌' },
  inconsistente: { label: 'Inconsistente', cor: '#7C3AED', bg: '#EDE9FE', icone: '⚠️' },
};
