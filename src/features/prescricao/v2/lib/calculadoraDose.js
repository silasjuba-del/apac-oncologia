// ─────────────────────────────────────────────────────────────────────────────
// calculadoraDose.js
// Biblioteca pura (sem React, sem efeitos colaterais) para cálculos de dose em
// quimioterapia citotóxica.
//
// AUDITORIA OBRIGATÓRIA — pontos cardinais:
//   1. BSA: fórmula Mosteller — √(cm × kg / 3600)
//   2. Calvert: Dose(mg) = AUC × (ClCr + 25)
//   3. Cockcroft-Gault: diferente para M/F
//   4. Nenhum cálculo retorna valor prescritível sem validação clínica
//   5. Todas as funções lançam exceção se parâmetros fora de range
// ─────────────────────────────────────────────────────────────────────────────

// ── CONSTANTES DE SEGURANÇA ────────────────────────────────────────────────────

/** Limites de BSA aceitos. Fora deste range → erro explícito */
export const BSA_MIN_M2 = 0.8;
export const BSA_MAX_M2 = 2.8;

/** Dose cumulativa máxima por fármaco (mg/m² salvo indicado) */
export const DOSE_CUMULATIVA_MAXIMA = {
  doxorrubicina:  { maxMgM2: 450,  aviso80pct: 360, unidade: 'mg/m²', referencia: 'ASCO/ESMO' },
  epirrubicina:   { maxMgM2: 900,  aviso80pct: 720, unidade: 'mg/m²', referencia: 'ESMO 2023' },
  daunorrubicina: { maxMgM2: 550,  aviso80pct: 440, unidade: 'mg/m²', referencia: '' },
  mitoxantrona:   { maxMgM2: 140,  aviso80pct: 112, unidade: 'mg/m²', referencia: '' },
  bleomicina:     { maxUnidades: 360, aviso80pct: 288, unidade: 'U total', referencia: 'NCCN' },
  mitomicina:     { maxMgM2: 60,   aviso80pct: 48,  unidade: 'mg/m²', referencia: 'SOnHe 2024' },
};

/**
 * Aliases de nomes de fármacos para dose cumulativa.
 * Protege contra variações ortográficas (inglês/comercial vs. português).
 * BUG-17: 'doxorubicina' (inglês) não batia com 'doxorrubicina' no mapa.
 */
export const ALIAS_FARMACO_CUMULATIVO = {
  'doxorubicina':   'doxorrubicina',
  'doxo':           'doxorrubicina',
  'adriamicina':    'doxorrubicina',
  'epirubicina':    'epirrubicina',
  'epi':            'epirrubicina',
  'daunorubicina':  'daunorrubicina',
  'mitoxantrone':   'mitoxantrona',
  'mitomycin':      'mitomicina',
  'mitomycin c':    'mitomicina',
  'bleo':           'bleomicina',
};

function normalizarNomeFarmaco(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ── SUPERFÍCIE CORPORAL (BSA) ──────────────────────────────────────────────────

/**
 * Calcula BSA pela fórmula de Mosteller (padrão oncológico no Brasil).
 *
 * BSA = √(altura_cm × peso_kg / 3600)
 *
 * @param {number} pesoKg
 * @param {number} alturaCm
 * @returns {number} BSA em m² (4 casas decimais)
 * @throws {Error} se parâmetros inválidos ou BSA fora do range de segurança
 */
export function calcBSA(pesoKg, alturaCm) {
  if (typeof pesoKg !== 'number' || typeof alturaCm !== 'number') {
    throw new Error('calcBSA: peso e altura devem ser números');
  }
  if (pesoKg <= 0 || pesoKg > 300) {
    throw new Error(`calcBSA: peso inválido (${pesoKg} kg)`);
  }
  if (alturaCm <= 0 || alturaCm > 250) {
    throw new Error(`calcBSA: altura inválida (${alturaCm} cm)`);
  }

  const bsa = Math.sqrt((alturaCm * pesoKg) / 3600);

  if (bsa < BSA_MIN_M2 || bsa > BSA_MAX_M2) {
    throw new Error(
      `calcBSA: BSA calculada (${bsa.toFixed(2)} m²) fora do range clínico ` +
      `[${BSA_MIN_M2}–${BSA_MAX_M2} m²]. Revisar peso e altura.`
    );
  }

  return parseFloat(bsa.toFixed(4));
}

/**
 * Retorna BSA sem lançar exceção.
 * Em caso de erro, retorna null e preenche erro.
 *
 * @returns {{ bsa: number|null, erro: string|null }}
 */
export function calcBSASafe(pesoKg, alturaCm) {
  try {
    return { bsa: calcBSA(pesoKg, alturaCm), erro: null };
  } catch (e) {
    return { bsa: null, erro: e.message };
  }
}

// ── CLEARANCE DE CREATININA (COCKCROFT-GAULT) ──────────────────────────────────

/**
 * Estima ClCr pela fórmula de Cockcroft-Gault.
 *
 * Homens: ClCr = (140 − idade) × peso / (72 × Cr)
 * Mulheres: ClCr × 0,85
 *
 * ATENÇÃO: usa peso ideal para obesos (IBM > 30).
 *
 * @param {number} idade  - anos
 * @param {number} pesoKg - peso atual (kg); função aplica peso ideal se obeso
 * @param {number} alturaCm
 * @param {number} creatinina - creatinina sérica em mg/dL
 * @param {'M'|'F'} sexo
 * @returns {number} ClCr em mL/min (2 casas decimais)
 * @throws {Error} se parâmetros inválidos
 */
export function calcCrCl(idade, pesoKg, alturaCm, creatinina, sexo) {
  const idadeNum = Number(idade);
  const pesoNum = Number(pesoKg);
  const alturaNum = Number(alturaCm);
  const creatNum = Number(creatinina);

  if (!Number.isFinite(idadeNum) || idadeNum < 18 || idadeNum > 110)
    throw new Error(`calcCrCl: idade fora do range (${idade} anos)`);
  if (!Number.isFinite(pesoNum) || pesoNum <= 0 || pesoNum > 300)
    throw new Error(`calcCrCl: peso invalido (${pesoKg} kg)`);
  if (!Number.isFinite(alturaNum) || alturaNum < 120 || alturaNum > 230)
    throw new Error(`calcCrCl: altura invalida (${alturaCm} cm)`);
  if (!Number.isFinite(creatNum) || creatNum <= 0 || creatNum > 20)
    throw new Error(`calcCrCl: creatinina invalida (${creatinina} mg/dL)`);
  if (sexo !== 'M' && sexo !== 'F')
    throw new Error(`calcCrCl: sexo deve ser 'M' ou 'F'`);

  const alturaM = alturaNum / 100;
  const alturaExcesso = Math.max(alturaNum - 152.4, 0);
  const pesoIdeal = sexo === 'M'
    ? 50 + 2.3 * (alturaExcesso / 2.54)
    : 45.5 + 2.3 * (alturaExcesso / 2.54);

  const imc = pesoNum / (alturaM * alturaM);
  const pesoAjustado = pesoIdeal + 0.4 * Math.max(0, pesoNum - pesoIdeal);
  const pesoUsado = imc >= 30 ? Math.min(pesoNum, pesoAjustado) : pesoNum;

  const base = ((140 - idadeNum) * pesoUsado) / (72 * creatNum);
  const crcl = sexo === 'F' ? base * 0.85 : base;

  return parseFloat(Math.max(crcl, 1).toFixed(2));
}
/** Versao safe de calcCrCl */
export function calcCrClSafe(idade, pesoKg, alturaCm, creatinina, sexo) {
  try {
    return { crcl: calcCrCl(idade, pesoKg, alturaCm, creatinina, sexo), erro: null };
  } catch (e) {
    return { crcl: null, erro: e.message };
  }
}

// ── FÓRMULA DE CALVERT (CARBOPLATINA) ─────────────────────────────────────────

/**
 * Calcula dose de carboplatina pela fórmula de Calvert.
 *
 * Dose (mg) = AUC × (ClCr + 25)
 *
 * AUC recomendado por indicação (fonte SOnHe 2024 / NCCN):
 *   - AUC 5-6: primeira linha
 *   - AUC 4-5: segunda linha / toxicidade prévia
 *   - AUC 2:   semanal
 *
 * ATENÇÃO: limite superior prático de dose = 1000 mg (cap de Jodrell/Newell)
 *
 * @param {number} auc    - AUC alvo (mg·min/mL)
 * @param {number} crclMlMin - ClCr estimado por Cockcroft-Gault
 * @returns {number} dose em mg (inteiro, arredondado para múltiplo de 10)
 * @throws {Error} se AUC ou ClCr inválidos
 */
export function calcCalvert(auc, crclMlMin) {
  if (auc <= 0 || auc > 10)
    throw new Error(`calcCalvert: AUC inválido (${auc}). Range esperado: 1–10.`);
  if (crclMlMin <= 0)
    throw new Error(`calcCalvert: ClCr inválido (${crclMlMin} mL/min)`);
  if (crclMlMin < 15)
    throw new Error(
      `calcCalvert: ClCr ${crclMlMin} mL/min (<15). Carboplatina por Calvert bloqueada; revisar função renal e conduta.`
    );

  // Cap de Jodrell & Newell: ClCr máximo usado no cálculo = 125 mL/min
  const crclCap = Math.min(crclMlMin, 125);
  const dose = auc * (crclCap + 25);

  // Arredondar para múltiplo de 10 mg (prática farmacêutica)
  return Math.round(dose / 10) * 10;
}

/** Versão safe de calcCalvert */
export function calcCalvertSafe(auc, crclMlMin) {
  try {
    return { dose: calcCalvert(auc, crclMlMin), erro: null };
  } catch (e) {
    return { dose: null, erro: e.message };
  }
}

// ── DOSE POR FÁRMACO ───────────────────────────────────────────────────────────

/**
 * Calcula dose individual de um fármaco do protocolo.
 *
 * @param {Object} farmaco - objeto do protocolo v0.2
 *   { doseValor, doseUnidade, via, observacao }
 *   doseUnidade: 'mg/m²' | 'mg/kg' | 'AUC' | 'mg' | 'UI' | 'mcg/kg'
 * @param {Object} params - dados do paciente
 *   { bsa, pesoKg, crclMlMin, reducaoPct }
 * @returns {{ doseCalculada: number|null, unidadeFinal: string, erro: string|null, avisos: string[] }}
 */
export function calcDoseFarmaco(farmaco, params) {
  const { doseValor, doseUnidade } = farmaco;
  // BUG-12 fix: sem default para crclMlMin — null/undefined dispara erro explícito no case AUC
  const { bsa, pesoKg, crclMlMin, reducaoPct = 0 } = params;
  const avisos = [];
  let doseCalculada = null;
  let unidadeFinal = 'mg';
  let erro = null;

  if (!doseValor || doseValor <= 0) {
    return { doseCalculada: null, unidadeFinal: 'mg', erro: 'doseValor ausente ou inválido', avisos };
  }

  const bloqueiaReducaoPercentual =
    farmaco.reducaoNaoAplicavel === true ||
    farmaco.reducaoPercentualPermitida === false ||
    farmaco.aplicarReducaoDose === false ||
    farmaco.classe === 'co_medicacao_obrigatoria';
  const reducaoEfetivaPct = bloqueiaReducaoPercentual ? 0 : reducaoPct;
  const fatorReducao = 1 - reducaoEfetivaPct / 100;

  if (bloqueiaReducaoPercentual && reducaoPct > 0) {
    avisos.push(
      `${farmaco.farmaco || farmaco.nome || 'Farmaco'}: reducao global de dose nao aplicada por ser co-medicacao/medicacao fixa obrigatoria.`
    );
  }

  try {
    switch (doseUnidade) {
      case 'mg/m²':
      case 'mg/m2': {
        // BUG-13 fix: revalidar BSA contra limites de segurança mesmo que calculada corretamente
        const bsaNum = Number(bsa);
        if (!bsa || !Number.isFinite(bsaNum) || bsaNum < BSA_MIN_M2 || bsaNum > BSA_MAX_M2) {
          throw new Error(
            `BSA inválida para cálculo SC: ${bsa} m² — esperado ${BSA_MIN_M2}–${BSA_MAX_M2} m²`
          );
        }
        doseCalculada = parseFloat((doseValor * bsaNum * fatorReducao).toFixed(1));
        unidadeFinal = 'mg';
        break;
      }

      case 'mg/kg':
        if (!pesoKg) throw new Error('Peso obrigatório para mg/kg');
        doseCalculada = parseFloat((doseValor * pesoKg * fatorReducao).toFixed(1));
        unidadeFinal = 'mg';
        break;

      case 'AUC':
        // BUG-12 fix: sem default — null/undefined → erro explícito. Nunca assumir ClCr 60.
        if (crclMlMin === null || crclMlMin === undefined || !Number.isFinite(Number(crclMlMin))) {
          throw new Error(
            'ClCr OBRIGATÓRIO para cálculo de Calvert — coletar creatinina sérica e calcular ClCr'
          );
        }
        doseCalculada = calcCalvert(doseValor, Number(crclMlMin));
        if (fatorReducao < 1) {
          doseCalculada = Math.round(doseCalculada * fatorReducao / 10) * 10;
          avisos.push('Redução de dose aplicada sobre resultado de Calvert — revisar com farmácia');
        }
        unidadeFinal = 'mg';
        break;

      case 'mg':
        // dose fixa — redução percentual ainda se aplica
        doseCalculada = parseFloat((doseValor * fatorReducao).toFixed(1));
        unidadeFinal = 'mg';
        if (fatorReducao < 1) {
          avisos.push('Dose fixa com redução percentual aplicada — confirmar com protocolo fonte');
        }
        break;

      case 'UI':
      case 'U':
        // BUG-14 fix: aplicar fatorReducao também em UI (bleomicina)
        doseCalculada = parseFloat((doseValor * fatorReducao).toFixed(1));
        unidadeFinal = 'UI';
        if (fatorReducao < 1) {
          avisos.push('Redução de dose aplicada sobre UI — confirmar com farmácia (dose não baseada em BSA)');
        }
        avisos.push('Bleomicina/similar: verificar dose cumulativa total de UI antes de prescrever');
        break;

      case 'mg/m²/dia':
      case 'mg/m2/dia': {
        // BUG-06 / CLINIC-02: temozolomida e similares com dose diária por SC
        const bsaNum2 = Number(bsa);
        if (!bsa || !Number.isFinite(bsaNum2) || bsaNum2 < BSA_MIN_M2 || bsaNum2 > BSA_MAX_M2) {
          throw new Error(`BSA inválida para cálculo mg/m²/dia: ${bsa} m²`);
        }
        doseCalculada = parseFloat((doseValor * bsaNum2 * fatorReducao).toFixed(1));
        unidadeFinal = 'mg/dia';
        avisos.push('Dose diária calculada — confirmar número de dias e dose total do ciclo com protocolo fonte');
        break;
      }

      default:
        avisos.push(`Unidade "${doseUnidade}" não mapeada — dose não calculada automaticamente`);
        erro = `Unidade desconhecida: ${doseUnidade}`;
        break;
    }
  } catch (e) {
    erro = e.message;
  }

  return { doseCalculada, unidadeFinal, erro, avisos };
}

// ── DOSE CUMULATIVA MÁXIMA ─────────────────────────────────────────────────────

/**
 * Verifica se a dose cumulativa de um fármaco está próxima ou acima do limite.
 *
 * @param {string} nomeFarmacoNormalizado - lowercase, sem acento
 * @param {number} dosePorCicloMg         - dose neste ciclo (mg total, não mg/m²)
 * @param {number} doseJaAdministradaMg   - dose cumulativa já dada (histórico)
 * @param {number} bsa                    - BSA do paciente (para converter mg → mg/m²)
 * @returns {{ nivel: 'ok'|'aviso'|'critico', mensagem: string, totalMgM2: number|null }}
 */
export function verificarDoseCumulativa(nomeFarmacoNormalizado, dosePorCicloMg, doseJaAdministradaMg, bsa) {
  // BUG-17 fix: resolver alias internamente — função é pública e pode receber variantes ortográficas
  const nomeResolvido = ALIAS_FARMACO_CUMULATIVO[nomeFarmacoNormalizado] || nomeFarmacoNormalizado;
  const limite = DOSE_CUMULATIVA_MAXIMA[nomeResolvido];
  if (!limite) {
    return { nivel: 'ok', mensagem: '', totalMgM2: 0 };
  }

  const usaDoseTotal = Boolean(limite.maxUnidades) && !limite.maxMgM2;
  const bsaNumerica = Number(bsa);
  if (!usaDoseTotal && (!Number.isFinite(bsaNumerica) || bsaNumerica <= 0)) {
    return {
      nivel: 'critico',
      mensagem:
        `⛔ DOSE CUMULATIVA NÃO VERIFICADA: ${nomeFarmacoNormalizado} exige BSA válida para converter mg totais em ${limite.unidade}. ` +
        'Corrigir peso/altura antes de prescrever.',
      totalMgM2: null,
    };
  }

  const totalMg = Number(doseJaAdministradaMg || 0) + Number(dosePorCicloMg || 0);
  if (!Number.isFinite(totalMg) || totalMg < 0) {
    return {
      nivel: 'critico',
      mensagem: `⛔ DOSE CUMULATIVA NÃO VERIFICADA: valores inválidos para ${nomeFarmacoNormalizado}.`,
      totalMgM2: null,
    };
  }

  const totalAjustado = usaDoseTotal ? totalMg : totalMg / bsaNumerica;
  const totalMgM2 = parseFloat(totalAjustado.toFixed(1));
  const max = limite.maxMgM2 || limite.maxUnidades || 0;

  if (totalMgM2 >= max) {
    return {
      nivel: 'critico',
      mensagem: `⛔ DOSE CUMULATIVA MÁXIMA ATINGIDA: ${totalMgM2} ${limite.unidade} (limite: ${max} ${limite.unidade}). NÃO PRESCREVER sem avaliação cardiológica/especializada.`,
      totalMgM2,
    };
  }

  if (totalMgM2 >= (limite.aviso80pct || max * 0.8)) {
    return {
      nivel: 'aviso',
      mensagem: `⚠️ ${totalMgM2} ${limite.unidade} acumulados (≥80% do limite de ${max} ${limite.unidade}). Monitorar função orgânica.`,
      totalMgM2,
    };
  }

  return { nivel: 'ok', mensagem: '', totalMgM2 };
}

// ── RESUMO DE CÁLCULO ─────────────────────────────────────────────────────────

/**
 * Gera o resumo completo de cálculo de dose para um protocolo inteiro.
 * Entrada: protocolo v0.2 + dadosPaciente.
 * Saída: array de linhas de prescrição calculadas.
 *
 * @param {Object} protocolo  - objeto do catálogo v0.2
 * @param {Object} paciente   - { pesoKg, alturaCm, creatinina, idade, sexo, reducaoPct, dosesCumulativas }
 * @returns {{ linhas: Object[], avisosCriticos: string[], erros: string[] }}
 */
export function calcProtocoloCompleto(protocolo, paciente) {
  const avisosCriticos = [];
  const erros = [];
  const linhas = [];

  // 1. BSA
  const { bsa, erro: erroBSA } = calcBSASafe(paciente.pesoKg, paciente.alturaCm);
  if (erroBSA) {
    erros.push(`BSA: ${erroBSA}`);
    return { linhas, avisosCriticos, erros };
  }

  // 2. ClCr
  let crcl = paciente.crclMlMin || null;
  if (!crcl && paciente.creatinina && paciente.idade && paciente.sexo) {
    const res = calcCrClSafe(paciente.idade, paciente.pesoKg, paciente.alturaCm, paciente.creatinina, paciente.sexo);
    if (res.erro) erros.push(`ClCr: ${res.erro}`);
    else crcl = res.crcl;
  }

  // BUG-16 fix: fármacos nefrotóxicos exigem ClCr mesmo para mg/m² (não só AUC/Calvert).
  // Cisplatina/oxaliplatina em mg/m² calculam sem erro mas necessitam de função renal.
  const NEFROTOXICOS_PREFIXOS = ['cisplat', 'carboplat', 'oxaliplat', 'metotrexat'];
  if (!crcl) {
    const temNefrotoxicoPendente = (protocolo.doseEstruturada || []).some(f => {
      const nome = normalizarNomeFarmaco(f.farmaco || f.nome);
      return NEFROTOXICOS_PREFIXOS.some(p => nome.includes(p));
    });
    if (temNefrotoxicoPendente) {
      avisosCriticos.push(
        '⛔ FUNÇÃO RENAL NÃO AVALIADA: protocolo contém agente nefrotóxico. ' +
        'Coletar creatinina sérica e calcular ClCr antes de prescrever.'
      );
    }
  }

  // 3. Farmacos
  const farmacos = protocolo.doseEstruturada || [];
  if (farmacos.length === 0) {
    erros.push('Protocolo sem doseEstruturada — doses não calculáveis automaticamente. Usar linhasDoseExtraidas como referência.');
    return { linhas, avisosCriticos, erros };
  }

  const temCisplatina = farmacos.some(f => normalizarNomeFarmaco(f.farmaco || f.nome).includes('cisplatina'));
  if (temCisplatina && (crcl === null || crcl === undefined || !Number.isFinite(Number(crcl)))) {
    erros.push('Cisplatina: ClCr/funcao renal obrigatoria antes do calculo de dose. Informar creatinina, idade e sexo ou ClCr validado.');
  }
  for (const farmaco of farmacos) {
    const resultado = calcDoseFarmaco(farmaco, {
      bsa,
      pesoKg: paciente.pesoKg,
      crclMlMin: crcl,
      reducaoPct: paciente.reducaoPct || 0,
    });

    // Verificar dose cumulativa
    let cumCheck = { nivel: 'ok', mensagem: '' };
    // BUG-17 fix: resolver aliases antes de buscar no mapa (ex: 'doxorubicina' → 'doxorrubicina')
    const nomeRaw = normalizarNomeFarmaco(farmaco.farmaco || farmaco.nome);
    const nomeNorm = ALIAS_FARMACO_CUMULATIVO[nomeRaw] || nomeRaw;
    const previo = (paciente.dosesCumulativas || {})[nomeNorm] || 0;
    if (resultado.doseCalculada !== null && resultado.doseCalculada !== undefined) {
      cumCheck = verificarDoseCumulativa(nomeNorm, resultado.doseCalculada, previo, bsa);
      if (cumCheck.nivel !== 'ok') avisosCriticos.push(cumCheck.mensagem);
    }
    if (resultado.erro) {
      erros.push(`${farmaco.farmaco || 'Fármaco'}: ${resultado.erro}`);
    }

    linhas.push({
      farmaco: farmaco.farmaco,
      doseBase: farmaco.doseValor,
      doseUnidade: farmaco.doseUnidade,
      via: farmaco.via,
      dias: farmaco.dias,
      observacao: farmaco.observacao,
      bsaUsada: bsa,
      crclUsado: crcl,
      reducaoPct: paciente.reducaoPct || 0,
      doseCalculada: resultado.doseCalculada,
      unidadeFinal: resultado.unidadeFinal,
      erro: resultado.erro,
      avisos: resultado.avisos,
      doseCumulativa: cumCheck,
    });
  }

  return { linhas, avisosCriticos, erros };
}
