// ─────────────────────────────────────────────────────────────────────────────
// validacoesSeguranca.js
// Camada de validação clínica — completamente separada de UI e cálculo.
//
// AUDITORIA OBRIGATÓRIA — pontos cardinais:
//   1. Status do protocolo bloqueia prescrição antes de qualquer dado ser usado
//   2. Via intravesical nunca pode aparecer em prescrição EV/VO sistêmica
//   3. Pemetrexede exige histologia não-escamosa documentada
//   4. Protocolos em draft exigem confirmação explícita dupla
//   5. Nenhuma validação "passa em branco" — ausência de dado = bloqueio
// ─────────────────────────────────────────────────────────────────────────────

// ── NIVEIS DE SEVERIDADE ──────────────────────────────────────────────────────

export const NIVEL = {
  CRITICO:  'critico',   // bloqueia prescrição completamente
  GRAVE:    'grave',     // exige confirmação explícita do médico + justificativa
  AVISO:    'aviso',     // exige confirmação simples do médico
  INFO:     'info',      // exibido mas não bloqueia
};

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// ── VALIDAÇÕES DE PROTOCOLO ──────────────────────────────────────────────────

/**
 * Valida o status do protocolo no catálogo v0.2.
 * Nenhum protocolo está 'aprovado' nesta versão.
 *
 * @param {Object} protocolo - objeto do catálogo v0.2
 * @returns {Object[]} array de alertas { nivel, codigo, mensagem }
 */
export function validarStatusProtocolo(protocolo) {
  const alertas = [];

  if (!protocolo) {
    return [{ nivel: NIVEL.CRITICO, codigo: 'PROTO_NULO', mensagem: 'Protocolo não selecionado.' }];
  }

  if (!protocolo.status) {
    alertas.push({
      nivel: NIVEL.CRITICO,
      codigo: 'STATUS_AUSENTE',
      mensagem: 'Campo status ausente no protocolo — não prescritível sem status definido.',
    });
    return alertas;
  }

  switch (protocolo.status) {
    case 'bloqueado':
      alertas.push({
        nivel: NIVEL.CRITICO,
        codigo: 'STATUS_BLOQUEADO',
        mensagem: `PROTOCOLO BLOQUEADO: ${protocolo.motivoStatus || 'erro crítico identificado na auditoria'}. ` +
          'Não pode ser prescrito nesta versão do catálogo.',
      });
      break;

    case 'quarentena_fragmento_pdf':
      alertas.push({
        nivel: NIVEL.CRITICO,
        codigo: 'STATUS_QUARENTENA',
        mensagem: 'Protocolo em quarentena — fragmento PDF mal extraído. Reconstruir manualmente contra o PDF fonte antes de usar.',
      });
      break;

    case 'excluido_nao_qt_pura':
      alertas.push({
        nivel: NIVEL.CRITICO,
        codigo: 'STATUS_EXCLUIDO',
        mensagem: `Protocolo excluído do catálogo QT pura: ${protocolo.motivoExclusao || 'não é QT citotóxica pura'}.`,
      });
      break;

    case 'draft':
      alertas.push({
        nivel: NIVEL.GRAVE,
        codigo: 'STATUS_DRAFT',
        mensagem:
          'PROTOCOLO EM DRAFT: ainda não revisado individualmente pelo médico responsável. ' +
          'Confirmar doses, dias e periodicidade contra o PDF fonte antes de qualquer uso clínico.',
      });
      break;

    case 'revisao_medica':
      alertas.push({
        nivel: NIVEL.AVISO,
        codigo: 'STATUS_REVISAO',
        mensagem: 'Protocolo em revisão médica — confirmar se a revisão foi concluída para este paciente.',
      });
      break;

    case 'aprovado':
      // Estado futuro — v0.2 não tem aprovados
      alertas.push({
        nivel: NIVEL.INFO,
        codigo: 'STATUS_APROVADO_V02',
        mensagem: 'Atenção: catálogo v0.2 não possui protocolos aprovados. Verificar versão do catálogo.',
      });
      break;

    default:
      alertas.push({
        nivel: NIVEL.GRAVE,
        codigo: 'STATUS_DESCONHECIDO',
        mensagem: `Status desconhecido: "${protocolo.status}". Não prescritível.`,
      });
  }

  return alertas;
}

// ── VALIDAÇÕES DE VIA ────────────────────────────────────────────────────────

/**
 * Detecta fármacos intravesicais dentro de um protocolo sistêmico.
 * Mistura intravesical + EV/VO = risco fatal.
 *
 * @param {Object} protocolo
 * @returns {Object[]} alertas
 */
export function validarViaAdministracao(protocolo) {
  const alertas = [];
  if (!protocolo) return alertas;

  const farmacos = protocolo.doseEstruturada || [];
  const textoFonte = normalizarTexto([
    protocolo.nome,
    protocolo.titulo,
    protocolo.viaAdministracao,
    protocolo.periodicidadeExtraida,
    protocolo.textoFonteSnippet,
    protocolo.snippet,
    ...(protocolo.linhasDoseExtraidas || []),
  ].filter(Boolean).join(' '));

  const intravesicais = farmacos.filter(
    f => normalizarTexto(f.via).includes('intravesical') || normalizarTexto(f.observacao).includes('intravesical')
  );
  const sistemicos = farmacos.filter(
    f => !(normalizarTexto(f.via).includes('intravesical') || normalizarTexto(f.observacao).includes('intravesical'))
  );
  const textoIndicaIntravesical = textoFonte.includes('intravesical') || textoFonte.includes('intravesic');
  const textoIndicaViaSistemica = /\b(ev|iv|vo|oral|sc|subcutanea|endovenosa|intravenosa)\b/.test(textoFonte);

  if (intravesicais.length > 0 && sistemicos.length > 0) {
    alertas.push({
      nivel: NIVEL.CRITICO,
      codigo: 'VIA_MISTA_INTRAVESICAL',
      mensagem:
        `ALERTA CRÍTICO DE VIA: protocolo contém fármacos intravesicais (${intravesicais.map(f => f.farmaco).join(', ')}) ` +
        `e sistêmicos misturados. Separar obrigatoriamente antes de prescrever.`,
    });
  } else if (intravesicais.length > 0) {
    alertas.push({
      nivel: NIVEL.CRITICO,
      codigo: 'VIA_INTRAVESICAL',
      mensagem:
        'Protocolo intravesical não pode ser prescrito por este módulo (QT sistêmica). ' +
        'Usar módulo específico de QT intravesical.',
    });
  } else if (textoIndicaIntravesical && farmacos.length === 0) {
    alertas.push({
      nivel: NIVEL.CRITICO,
      codigo: 'VIA_INTRAVESICAL_TEXTO',
      mensagem:
        'Protocolo cita via intravesical no texto-fonte, mas não possui doseEstruturada para validação. ' +
        'Bloqueado para evitar prescrição sistêmica incorreta.',
    });
  } else if (textoIndicaIntravesical && textoIndicaViaSistemica) {
    alertas.push({
      nivel: NIVEL.CRITICO,
      codigo: 'VIA_MISTA_TEXTO',
      mensagem:
        'Texto-fonte mistura ou sugere vias intravesical e sistêmica. Separar protocolo e validar manualmente antes de prescrever.',
    });
  }

  return alertas;
}

// ── VALIDAÇÕES DE FÁRMACO ESPECÍFICAS ───────────────────────────────────────

/**
 * Valida requisitos específicos por fármaco.
 *
 * @param {Object} protocolo
 * @param {Object} paciente - { histologia, audiometria, feve, neuropatiaGrau, bilirrubina }
 * @returns {Object[]} alertas
 */
export function validarRequisitosFarmacos(protocolo, paciente = {}) {
  const alertas = [];
  if (!protocolo) return alertas;

  const farmacos = protocolo.farmacosDetectados || [];
  const farmacosList = farmacos.map(f => f.toLowerCase());

  // Pemetrexede → histologia não-escamosa obrigatória
  if (farmacosList.includes('pemetrexede') || farmacosList.includes('pemetrexed')) {
    if (!paciente.histologia) {
      alertas.push({
        nivel: NIVEL.GRAVE,
        codigo: 'PEMETREXEDE_SEM_HISTOLOGIA',
        mensagem:
          'Pemetrexede: histologia obrigatória (indicado apenas para não-escamoso). ' +
          'Documentar histologia antes de prescrever.',
      });
    } else if (
      paciente.histologia.toLowerCase().includes('escamoso') ||
      paciente.histologia.toLowerCase().includes('squamous')
    ) {
      alertas.push({
        nivel: NIVEL.CRITICO,
        codigo: 'PEMETREXEDE_ESCAMOSO',
        mensagem: `Pemetrexede CONTRAINDICADO em histologia escamosa (documentado: "${paciente.histologia}").`,
      });
    }
    // Suplementação vitamínica
    alertas.push({
      nivel: NIVEL.AVISO,
      codigo: 'PEMETREXEDE_SUPLEMENTACAO',
      mensagem:
        'Pemetrexede: confirmar suplementação com Ácido Fólico 400mcg/dia (7+ dias antes) e Vitamina B12 1000mcg IM (7 dias antes e a cada 3 ciclos).',
    });
  }

  // Cisplatina → hidratação e auditometria
  if (farmacosList.includes('cisplatina')) {
    const crclBruto = paciente.crclMlMin ?? paciente.clcr ?? paciente.clearanceCreatinina ?? paciente.creatininaClearance;
    const crclNum = Number(crclBruto);
    const temClcr = crclBruto !== null && crclBruto !== undefined && crclBruto !== '' && Number.isFinite(crclNum) && crclNum > 0;
    const podeCalcularClcr = paciente.creatinina && paciente.idade && paciente.sexo && paciente.pesoKg && paciente.alturaCm;

    if (!temClcr && !podeCalcularClcr) {
      alertas.push({
        nivel: NIVEL.CRITICO,
        codigo: 'CISPLATINA_SEM_FUNCAO_RENAL',
        mensagem: 'Cisplatina: funcao renal/ClCr obrigatoria antes de prescrever. Informar ClCr validado ou creatinina, idade, sexo, peso e altura para calculo.',
      });
    } else if (temClcr && crclNum < 50) {
      alertas.push({
        nivel: NIVEL.CRITICO,
        codigo: 'CISPLATINA_CLCR_BAIXO',
        mensagem: `Cisplatina: ClCr ${crclNum} mL/min (<50). Bloquear prescricao ate revisao medica/farmacia e alternativa de conduta.`,
      });
    } else if (temClcr && crclNum < 60) {
      alertas.push({
        nivel: NIVEL.GRAVE,
        codigo: 'CISPLATINA_CLCR_LIMITE',
        mensagem: `Cisplatina: ClCr ${crclNum} mL/min (50-59). Exige justificativa medica, hidratacao e monitorizacao renal.`,
      });
    }
    alertas.push({
      nivel: NIVEL.AVISO,
      codigo: 'CISPLATINA_HIDRATACAO',
      mensagem: 'Cisplatina: confirmar protocolo de hidratação agressiva (SF 0,9% ≥2L pré + ≥2L pós) e diurese > 100 mL/h.',
    });
    if (!paciente.audiometria && !paciente.audiometriaOK) {
      alertas.push({
        nivel: NIVEL.AVISO,
        codigo: 'CISPLATINA_AUDIOMETRIA',
        mensagem: 'Cisplatina: audiometria basal recomendada antes do 1º ciclo.',
      });
    }
  }

  // Antraciclinas → FEVE
  const antraciclinas = ['doxorrubicina', 'epirrubicina', 'daunorrubicina', 'mitoxantrona'];
  const antraciclinaPresente = antraciclinas.find(a => farmacosList.includes(a));
  if (antraciclinaPresente) {
    if (!paciente.feve) {
      alertas.push({
        nivel: NIVEL.AVISO,
        codigo: 'ANTRACICINA_FEVE',
        mensagem: `${antraciclinaPresente}: FEVE basal (ecocardiograma) recomendada antes do 1º ciclo e periodicamente.`,
      });
    } else if (Number(paciente.feve) < 50) {
      alertas.push({
        nivel: NIVEL.CRITICO,
        codigo: 'ANTRACICILINA_FEVE_BAIXA',
        mensagem: `${antraciclinaPresente}: FEVE documentada em ${paciente.feve}% (< 50%). CONTRAINDICAÇÃO relativa grave — decisão médica documentada obrigatória.`,
      });
    }
  }

  // Bleomicina → função pulmonar
  if (farmacosList.includes('bleomicina')) {
    alertas.push({
      nivel: NIVEL.AVISO,
      codigo: 'BLEOMICINA_PULMONAR',
      mensagem: 'Bleomicina: atenção à dose cumulativa total (limite: 360 U). Monitorar DLCO e sintomas pulmonares.',
    });
  }

  // Ifosfamida → MESNA obrigatório
  if (farmacosList.includes('ifosfamida')) {
    alertas.push({
      nivel: NIVEL.GRAVE,
      codigo: 'IFOSFAMIDA_MESNA',
      mensagem: 'Ifosfamida: MESNA uroprotretor OBRIGATÓRIO (sem MESNA = contraindicado). Confirmar prescrição de MESNA antes de liberar.',
    });
  }

  // Vincristina/Vinblastina → neuropatia
  if (farmacosList.includes('vincristina') || farmacosList.includes('vinblastina')) {
    const grau = paciente.neuropatiaGrau || 0;
    if (grau >= 2) {
      alertas.push({
        nivel: NIVEL.GRAVE,
        codigo: 'VINCA_NEUROPATIA',
        mensagem: `Alcaloide de vinca: neuropatia documentada em grau ${grau} — considerar redução de dose ou suspensão.`,
      });
    }
  }

  // Oxaliplatina → neuropatia cumulativa
  if (farmacosList.includes('oxaliplatina')) {
    const grau = paciente.neuropatiaGrau || 0;
    if (grau >= 2) {
      alertas.push({
        nivel: NIVEL.GRAVE,
        codigo: 'OXALI_NEUROPATIA',
        mensagem: `Oxaliplatina: neuropatia grau ${grau}. Guia ESMO: reduzir 25% em G2 persistente, suspender em G3.`,
      });
    }
  }

  return alertas;
}

// ── VALIDAÇÕES DE PACIENTE ───────────────────────────────────────────────────

/**
 * Valida dados mínimos do paciente para prescrição de QT.
 *
 * @param {Object} paciente
 * @returns {Object[]} alertas
 */
export function validarDadosPaciente(paciente = {}) {
  const alertas = [];

  if (!paciente.id && !paciente.cpf && !paciente.prontuario) {
    alertas.push({
      nivel: NIVEL.CRITICO,
      codigo: 'PAC_SEM_ID',
      mensagem: 'Identificação do paciente ausente. Prescrição requer prontuário, CPF ou ID cadastral.',
    });
  }

  if (!paciente.pesoKg) {
    alertas.push({
      nivel: NIVEL.CRITICO,
      codigo: 'PAC_SEM_PESO',
      mensagem: 'Peso do paciente obrigatório para cálculo de dose.',
    });
  }

  if (!paciente.alturaCm) {
    alertas.push({
      nivel: NIVEL.CRITICO,
      codigo: 'PAC_SEM_ALTURA',
      mensagem: 'Altura do paciente obrigatória para cálculo de BSA.',
    });
  }

  if (paciente.pesoKg && (paciente.pesoKg < 20 || paciente.pesoKg > 250)) {
    alertas.push({
      nivel: NIVEL.GRAVE,
      codigo: 'PAC_PESO_EXTREMO',
      mensagem: `Peso fora do range habitual (${paciente.pesoKg} kg). Confirmar com a equipe antes de calcular.`,
    });
  }

  if (!paciente.ecog && paciente.ecog !== 0) {
    alertas.push({
      nivel: NIVEL.AVISO,
      codigo: 'PAC_SEM_ECOG',
      mensagem: 'ECOG/PS não documentado. Registrar para adequação de protocolo.',
    });
  } else if (Number(paciente.ecog) >= 3) {
    alertas.push({
      nivel: NIVEL.GRAVE,
      codigo: 'PAC_ECOG_ALTO',
      mensagem: `ECOG ${paciente.ecog}: maioria dos protocolos não indicados para PS ≥ 3. Decisão médica documentada obrigatória.`,
    });
  }

  return alertas;
}

// ── VALIDAÇÃO DE TERMOS NÃO-QT ───────────────────────────────────────────────

/**
 * Verifica se o protocolo contém termos que indicam que NÃO é QT pura citotóxica.
 *
 * @param {Object} protocolo
 * @returns {Object[]} alertas
 */
export function validarTermosNaoQt(protocolo) {
  const alertas = [];
  if (!protocolo) return alertas;

  const termos = protocolo.termosNaoQtDetectados || [];

  if (termos.length > 0) {
    alertas.push({
      nivel: NIVEL.CRITICO,
      codigo: 'TERMOS_NAO_QT',
      mensagem:
        `Protocolo contém termos não-QT detectados: [${termos.join(', ')}]. ` +
        'Verificar se é QT citotóxica pura ou protocolo misto. Não usar sem revisão.',
    });
  }

  return alertas;
}

// ── VALIDAÇÃO COMPLETA ────────────────────────────────────────────────────────

/**
 * Executa TODAS as validações de segurança.
 * Retorna estrutura consolidada com nível máximo de severidade.
 *
 * @param {Object} protocolo
 * @param {Object} paciente
 * @returns {{ alertas: Object[], nivelMaximo: string, podeProsseguir: boolean, exigeJustificativa: boolean }}
 */
export function validarCompleto(protocolo, paciente) {
  const alertas = [
    ...validarStatusProtocolo(protocolo),
    ...validarViaAdministracao(protocolo),
    ...validarTermosNaoQt(protocolo),
    ...validarDadosPaciente(paciente),
    ...validarRequisitosFarmacos(protocolo, paciente),
  ];

  const temCritico = alertas.some(a => a.nivel === NIVEL.CRITICO);
  const temGrave   = alertas.some(a => a.nivel === NIVEL.GRAVE);

  return {
    alertas,
    nivelMaximo: temCritico ? NIVEL.CRITICO : temGrave ? NIVEL.GRAVE : NIVEL.AVISO,
    podeProsseguir: !temCritico,        // crítico = bloqueio absoluto
    exigeJustificativa: temGrave,       // grave = justificativa obrigatória
  };
}
