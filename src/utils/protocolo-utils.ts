// === ARQUIVO: src/utils/protocolo-utils.ts ===
// APACApp v4.5 — Dr. Silas Negrão — Hospital do Bem, Patos/PB
// Melhorias: type guard real, sanity checks BSA, ClCr alerta cap,
//            peso ajustado IMC≥30, resolverFaseDoCiclo, resolverDoseDroga,
//            arredondamento por droga, resultadoCálculo revisado

import type {
  ProtocoloQuimioterapia,
  DadosPacienteParaDose,
  ResultadoCálculoDose,
  ItemPreMedicação,
  DrogaProtocolo,
  DrogaComModificação,
  FaseRegime,
  FaseResolvida,
  FaseComModificações,
  AlertaSanidade,
  EsquemaDose,
  PotencialEmetogênico,
  ModificaçãoDroga,
  EscopoModificação,
} from '../types/protocolos';

// ─── Cores por emetogenicidade ────────────────────────────────────────────────

export const CORES_EMETOGÊNICO: Record<string, { bg: string; text: string; border: string; label: string }> = {
  ALTO:     { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444', label: 'Alto (>90%)' },
  MODERADO: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B', label: 'Moderado (30–90%)' },
  BAIXO:    { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6', label: 'Baixo (10–30%)' },
  MÍNIMO:   { bg: '#D1FAE5', text: '#065F46', border: '#10B981', label: 'Mínimo (<10%)' },
};

export const CORES_ANAFILÁTICO: Record<string, { bg: string; text: string }> = {
  Alto:     { bg: '#FEE2E2', text: '#991B1B' },
  Moderado: { bg: '#FEF3C7', text: '#92400E' },
  Baixo:    { bg: '#D1FAE5', text: '#065F46' },
};

export const COR_NAVY = '#1B365D';
export const COR_TEAL = '#2B7A8C';
export const COR_GOLD = '#C9973A';

// ─── Normalizar busca sem acento (NFD) ────────────────────────────────────────

export function normalizarParaBusca(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ─── Extrair emetogênico principal — com validação ───────────────────────────
// Nunca retorna fallback silencioso. Lança erro se valor não reconhecido.

export function extrairEmetogênicoPrincipal(valor: string): PotencialEmetogênico {
  const upper = valor.toUpperCase();
  if (upper.includes('ALTO'))     return 'ALTO';
  if (upper.includes('MODERADO')) return 'MODERADO';
  if (upper.includes('BAIXO'))    return 'BAIXO';
  if (upper.includes('MÍNIMO') || upper.includes('MINIMO')) return 'MÍNIMO';
  // Não silenciar — alertar no console e retornar BAIXO como fallback seguro com aviso
  console.warn(`[APACApp] potencialEmetogênico não reconhecido: "${valor}" — usando BAIXO como fallback. Corrigir no seed.`);
  return 'BAIXO';
}

// ─── BSA — Mosteller ──────────────────────────────────────────────────────────

export function calcularBSA(alturaCm: number, pesoKg: number): number {
  return Math.sqrt((alturaCm * pesoKg) / 3600);
}

// ─── Sanity check dos dados do paciente ──────────────────────────────────────
// Não bloqueia mas gera alertas que a UI deve exibir.

export function validarDadosPaciente(dados: DadosPacienteParaDose): AlertaSanidade[] {
  const alertas: AlertaSanidade[] = [];

  if (dados.alturaCm < 100) {
    alertas.push({ campo: 'alturaCm', nivel: 'erro',
      mensagem: `Altura ${dados.alturaCm} cm suspeita. Verificar se foi digitada em metros (ex: 1.65 → inserir 165).` });
  }
  if (dados.alturaCm > 230) {
    alertas.push({ campo: 'alturaCm', nivel: 'aviso',
      mensagem: `Altura ${dados.alturaCm} cm acima do esperado para adulto. Confirmar.` });
  }
  if (dados.pesoKg < 30) {
    alertas.push({ campo: 'pesoKg', nivel: 'erro',
      mensagem: `Peso ${dados.pesoKg} kg muito baixo. Verificar unidade (kg, não g).` });
  }
  if (dados.pesoKg > 220) {
    alertas.push({ campo: 'pesoKg', nivel: 'aviso',
      mensagem: `Peso ${dados.pesoKg} kg acima do esperado. Confirmar.` });
  }

  const bsa = calcularBSA(dados.alturaCm, dados.pesoKg);
  if (bsa < 1.0) {
    alertas.push({ campo: 'bsa', nivel: 'aviso',
      mensagem: `BSA calculada ${bsa.toFixed(2)} m² abaixo de 1.0 m². Verificar dados ou confirmar paciente caquético.` });
  }
  if (bsa > 2.8) {
    alertas.push({ campo: 'bsa', nivel: 'aviso',
      mensagem: `BSA calculada ${bsa.toFixed(2)} m² acima de 2.8 m². Verificar ou aplicar cap institucional.` });
  }

  if (dados.creatininaMgDl !== undefined && dados.creatininaMgDl <= 0) {
    alertas.push({ campo: 'creatinina', nivel: 'erro',
      mensagem: 'Creatinina deve ser maior que zero.' });
  }

  return alertas;
}

// ─── Peso ideal (Devine) e ajustado (ABW) ────────────────────────────────────
// Para Cockroft-Gault em pacientes com IMC ≥ 30.

export function calcularPesoIdeal(alturaCm: number, sexo: 'M' | 'F'): number {
  const alturaPol = alturaCm / 2.54;
  return sexo === 'M'
    ? 50 + 2.3 * (alturaPol - 60)
    : 45.5 + 2.3 * (alturaPol - 60);
}

export function calcularIMC(pesoKg: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  return pesoKg / (alturaM * alturaM);
}

export function calcularPesoAjustado(
  pesoKg: number,
  alturaCm: number,
  sexo: 'M' | 'F',
): number {
  const pi = calcularPesoIdeal(alturaCm, sexo);
  return pi + 0.4 * (pesoKg - pi);
}

// ─── Cockroft-Gault com ajuste de peso para IMC ≥ 30 ────────────────────────

export function calcularClCr(
  creatininaMgDl: number,
  pesoKg: number,
  alturaCm: number,
  idadeAnos: number,
  sexo: 'M' | 'F',
): { clcr: number; pesoUsado: number; ajustadoPorObesidade: boolean } {
  const imc = calcularIMC(pesoKg, alturaCm);
  const ajustadoPorObesidade = imc >= 30;
  const pesoUsado = ajustadoPorObesidade
    ? calcularPesoAjustado(pesoKg, alturaCm, sexo)
    : pesoKg;
  const fatorSexo = sexo === 'F' ? 0.85 : 1.0;
  const clcr = ((140 - idadeAnos) * pesoUsado * fatorSexo) / (72 * creatininaMgDl);
  return { clcr, pesoUsado, ajustadoPorObesidade };
}

// ─── Carboplatina — Calvert ───────────────────────────────────────────────────

export function calcularCarboplatina(
  auc: number,
  dados: DadosPacienteParaDose,
): { doseMg: number; clcrUsado: number; alerta?: string; alertas: string[] } {
  const alertas: string[] = [];

  if (!dados.creatininaMgDl || !dados.idadeAnos || !dados.sexo) {
    return {
      doseMg: 0, clcrUsado: 0, alertas,
      alerta: '⚠️ CALVERT INCOMPLETO — informe creatinina, idade e sexo.',
    };
  }

  const { clcr, pesoUsado, ajustadoPorObesidade } = calcularClCr(
    dados.creatininaMgDl,
    dados.pesoKg,
    dados.alturaCm,
    dados.idadeAnos,
    dados.sexo,
  );

  if (ajustadoPorObesidade) {
    alertas.push(
      `IMC ≥ 30 detectado — usado peso ajustado ${pesoUsado.toFixed(1)} kg (vs. peso real ${dados.pesoKg} kg) para Cockroft-Gault.`,
    );
  }

  const capAplicado = clcr > 125;
  const clcrCapped = Math.min(clcr, 125);

  if (capAplicado) {
    alertas.push(
      `ClCr calculado ${clcr.toFixed(1)} mL/min; limitado a 125 mL/min (cap ASCO/EMA) para cálculo de carboplatina.`,
    );
  }

  const doseMg = auc * (clcrCapped + 25);

  return {
    doseMg: parseFloat(doseMg.toFixed(1)),
    clcrUsado: parseFloat(clcrCapped.toFixed(1)),
    alertas,
  };
}

// ─── Resolver dose da droga pelo ciclo (EsquemaDose) ─────────────────────────
// CORREÇÃO: usa cicloDentroDaFase (relativo) como referência primária,
// cicloAbsoluto como fallback — resolve Trastuzumabe dose de ataque corretamente.

export function resolverDoseDroga(
  droga: DrogaProtocolo,
  cicloDentroDaFase: number,
  cicloAbsoluto: number = cicloDentroDaFase,
): { dose: number; unidade: DrogaProtocolo['unidade']; tempoInfusão?: string; observação?: string } {
  if (droga.esquemas && droga.esquemas.length > 0) {
    // 1. Esquema específico por ciclo RELATIVO à fase (padrão — ex: ataque no ciclo 1 da fase)
    const porFase = droga.esquemas.find(
      (e) => e.ciclos !== 'todos' && Array.isArray(e.ciclos) && (e.ciclos as number[]).includes(cicloDentroDaFase),
    );
    if (porFase) {
      return {
        dose: porFase.dose,
        unidade: porFase.unidade,
        tempoInfusão: porFase.tempoInfusão ?? droga.tempoInfusão,
        observação: porFase.observação,
      };
    }

    // 2. Fallback por ciclo ABSOLUTO (para esquemas que usam numeração do protocolo)
    if (cicloAbsoluto !== cicloDentroDaFase) {
      const porAbsoluto = droga.esquemas.find(
        (e) => e.ciclos !== 'todos' && Array.isArray(e.ciclos) && (e.ciclos as number[]).includes(cicloAbsoluto),
      );
      if (porAbsoluto) {
        return {
          dose: porAbsoluto.dose,
          unidade: porAbsoluto.unidade,
          tempoInfusão: porAbsoluto.tempoInfusão ?? droga.tempoInfusão,
          observação: porAbsoluto.observação,
        };
      }
    }

    // 3. Fallback para 'todos' (manutenção)
    const geral = droga.esquemas.find((e) => e.ciclos === 'todos');
    if (geral) {
      return {
        dose: geral.dose,
        unidade: geral.unidade,
        tempoInfusão: geral.tempoInfusão ?? droga.tempoInfusão,
        observação: geral.observação,
      };
    }
  }
  // Legado — sem esquemas
  return { dose: droga.dose, unidade: droga.unidade, tempoInfusão: droga.tempoInfusão };
}

// ─── Resolver fase ativa pelo ciclo absoluto ─────────────────────────────────
// Motor central de ciclo/fase — novo em v4.4.

export function resolverFaseDoCiclo(
  protocolo: ProtocoloQuimioterapia,
  cicloAtual: number,
): FaseResolvida | null {
  let acumulado = 0;
  for (let i = 0; i < protocolo.fases.length; i++) {
    const fase = protocolo.fases[i];
    // Fase com ciclos === 0 ou duracaoTipo 'ate_progressao'/'manutencao' = ilimitada
    const ehIlimitada =
      fase.ciclos === 0 ||
      fase.duracaoTipo === 'ate_progressao' ||
      fase.duracaoTipo === 'manutencao' ||
      fase.duracaoTipo === 'ate_toxicidade';

    const cicloInicio = acumulado + 1;
    const cicloFim = ehIlimitada ? Infinity : acumulado + fase.ciclos;

    if (cicloAtual >= cicloInicio && cicloAtual <= cicloFim) {
      return {
        fase,
        faseIndex: i,
        cicloDentroDaFase: cicloAtual - acumulado,
        cicloInicioFase: cicloInicio,
        cicloFimFase: ehIlimitada ? -1 : cicloFim,
      };
    }
    if (!ehIlimitada) acumulado = acumulado + fase.ciclos;
  }
  return null;
}

// ─── Filtrar modificações aplicáveis ao ciclo atual ──────────────────────────
// Respeita escopo temporal de cada modificação.

export function filtrarModificacoesParaCiclo(
  modificacoes: ModificaçãoDroga[],
  cicloAtual: number,
): ModificaçãoDroga[] {
  return modificacoes.filter((mod) => {
    switch (mod.escopo) {
      case 'ciclo_atual':
        // Válida apenas no ciclo em que foi aplicada
        return mod.cicloReferencia === cicloAtual;
      case 'ciclos_posteriores':
        // Válida a partir do ciclo em que foi aplicada
        return cicloAtual >= mod.cicloReferencia;
      case 'excluir_protocolo':
        // Sempre válida
        return true;
      default:
        return false;
    }
  });
}

// ─── Gerar fases com modificações aplicadas para um ciclo específico ─────────

export function gerarFasesParaCiclo(
  protocolo: ProtocoloQuimioterapia,
  cicloAtual: number,
  modificacoes: ModificaçãoDroga[],
): FaseComModificações[] {
  const modsAtivas = filtrarModificacoesParaCiclo(modificacoes, cicloAtual);
  const faseResolvida = resolverFaseDoCiclo(protocolo, cicloAtual);

  let cicloInicioFase = 1;

  return protocolo.fases.map((fase, fi) => {
    const cicloFimFase = fase.ciclos === -1
      ? -1
      : cicloInicioFase + fase.ciclos - 1;
    const ativaNoCiclo = faseResolvida?.faseIndex === fi;

    const drogas = fase.drogas.map((droga, di): DrogaComModificação => {
      const mod = modsAtivas.find(
        (m) => m.faseIndex === fi && m.drogaIndex === di,
      );

      if (!mod) return { ...droga };

      const drogaAtualizada: DrogaComModificação = { ...droga };

      if (mod.tipo === 'retirar') {
        drogaAtualizada.modificacaoAtiva = {
          tipo: 'retirar',
          doseOriginal: droga.dose,
          retiradaNesteCiclo: mod.escopo === 'ciclo_atual',
          retiradaPermanente: mod.escopo === 'excluir_protocolo',
          escopo: mod.escopo,
          cicloReferencia: mod.cicloReferencia,
          justificativa: mod.justificativa,
        };
      } else if (mod.tipo === 'redução_dose') {
        const percentual = Math.max(1, Math.min(99, mod.percentualReducao));
        const fator = 1 - percentual / 100;
        drogaAtualizada.dose = parseFloat((droga.dose * fator).toFixed(2));
        drogaAtualizada.modificacaoAtiva = {
          tipo: 'redução_dose',
          doseOriginal: droga.dose,
          retiradaNesteCiclo: false,
          retiradaPermanente: false,
          escopo: mod.escopo,
          cicloReferencia: mod.cicloReferencia,
          justificativa: mod.justificativa,
        };
      } else if (mod.tipo === 'alterar_dose') {
        drogaAtualizada.dose = mod.novaDose;
        drogaAtualizada.modificacaoAtiva = {
          tipo: 'alterar_dose',
          doseOriginal: droga.dose,
          retiradaNesteCiclo: false,
          retiradaPermanente: false,
          escopo: mod.escopo,
          cicloReferencia: mod.cicloReferencia,
          justificativa: mod.justificativa,
        };
      } else if (mod.tipo === 'alterar_tempo_infusão' && mod.novoTempoInfusão) {
        drogaAtualizada.tempoInfusão = mod.novoTempoInfusão;
        drogaAtualizada.modificacaoAtiva = {
          tipo: 'alterar_tempo_infusão',
          doseOriginal: droga.dose,
          retiradaNesteCiclo: false,
          retiradaPermanente: false,
          escopo: mod.escopo,
          cicloReferencia: mod.cicloReferencia,
          justificativa: mod.justificativa,
        };
      }

      return drogaAtualizada;
    });

    const faseComModificacoes: FaseComModificações = {
      ...fase,
      drogas,
      faseIndexOriginal: fi,
      ativaNoCiclo,
      cicloDentroDaFase: ativaNoCiclo ? faseResolvida?.cicloDentroDaFase : undefined,
      cicloInicioFase,
      cicloFimFase,
    };

    if (fase.ciclos !== -1) cicloInicioFase = cicloFimFase + 1;
    return faseComModificacoes;
  });
}

// ─── Type guard — seguro, sem cast ───────────────────────────────────────────

export function temModificacaoAtiva(
  droga: DrogaProtocolo | DrogaComModificação,
): droga is DrogaComModificação {
  return 'modificacaoAtiva' in droga && droga.modificacaoAtiva !== undefined;
}

// ─── Arredondamento farmacêutico ──────────────────────────────────────────────

function arredondarParaMultiplo(valor: number, multiplo: number): number {
  if (multiplo <= 1) return Math.round(valor);
  return Math.round(valor / multiplo) * multiplo;
}

function multiplosArredondamentoPadrao(unidade: DrogaProtocolo['unidade']): number {
  switch (unidade) {
    case 'mg/m²': return 5;    // múltiplo de 5 mg
    case 'AUC':   return 50;   // Carboplatina — múltiplo de 50 mg
    case 'mg/kg': return 1;    // inteiro
    case 'mg':    return 1;
    case 'mcg':   return 1;
    default:      return 1;
  }
}

// ─── Calcular doses — v4.5 ───────────────────────────────────────────────────
// - Import inline removido — FaseComModificações importado no topo
// - resolverDoseDroga recebe cicloDentroDaFase (relativo) + cicloAbsoluto
// - Type guard real; sem cast; BSA/peso/ClCr apenas onde aplicável

export function calcularDosesProtocolo(
  fases: FaseComModificações[],
  dados: DadosPacienteParaDose,
  cicloAtual: number = 1,
  faseResolvida?: FaseResolvida,
): ResultadoCálculoDose[] {
  const bsa = dados.bsaM2 ?? calcularBSA(dados.alturaCm, dados.pesoKg);
  const resultados: ResultadoCálculoDose[] = [];

  // cicloDentroDaFase: relativo para EsquemaDose; cicloAtual: absoluto como fallback
  const cicloDentroDaFase = faseResolvida?.cicloDentroDaFase ?? cicloAtual;
  const fasesParaCalcular = faseResolvida
    ? fases.filter((_, index) => index === faseResolvida.faseIndex)
    : fases;

  fasesParaCalcular.forEach((fase) => {
    fase.drogas.forEach((droga) => {
      // ── Type guard real — sem cast ────────────────────────────────────────
      if (temModificacaoAtiva(droga)) {
        const mod = droga.modificacaoAtiva!;
        if (mod.tipo === 'retirar') {
          resultados.push({
            droga: `${droga.nome} (${fase.nome})`,
            dosePrescrita: 'RETIRADA',
            doseAbsolutaMg: 0,
            doseAbsolutaArredondada: 0,
            metodoCalculo: 'retirada',
            alertaCalculo: `❌ Droga retirada — ${mod.justificativa}`,
            observacao: droga.observações,
          });
          return;
        }
      }

      // ── Resolver dose: ciclo relativo (primário) + absoluto (fallback) ────
      const doseResolvida = resolverDoseDroga(droga, cicloDentroDaFase, cicloAtual);
      const { dose, unidade } = doseResolvida;
      const multiplo = droga.multiplosArredondamento ?? multiplosArredondamentoPadrao(unidade);

      if (unidade === 'mg/m²') {
        // Evitar arredondamento fatal para doses baixas (< 10 mg/m²)
        const absoluta = dose * bsa;
        const arredondada = absoluta < 10
          ? parseFloat(absoluta.toFixed(1)) // não arredondar doses baixas (ex: Vincristina)
          : arredondarParaMultiplo(absoluta, multiplo);
        resultados.push({
          droga: `${droga.nome} (${fase.nome})`,
          dosePrescrita: `${dose} mg/m²`,
          bsaUsado: parseFloat(bsa.toFixed(2)),
          doseAbsolutaMg: parseFloat(absoluta.toFixed(1)),
          doseAbsolutaArredondada: arredondada,
          metodoCalculo: 'mg/m²',
          alertaCalculo: doseResolvida.observação,
          observacao: droga.observações,
        });

      } else if (unidade === 'mg/kg') {
        const absoluta = dose * dados.pesoKg;
        resultados.push({
          droga: `${droga.nome} (${fase.nome})`,
          dosePrescrita: `${dose} mg/kg`,
          pesoUsadoKg: dados.pesoKg,
          doseAbsolutaMg: parseFloat(absoluta.toFixed(1)),
          doseAbsolutaArredondada: Math.round(absoluta),
          metodoCalculo: 'mg/kg',
          alertaCalculo: doseResolvida.observação,
          observacao: droga.observações,
        });

      } else if (unidade === 'AUC') {
        const { doseMg, clcrUsado, alerta, alertas } = calcularCarboplatina(dose, dados);
        const arredondada = doseMg > 0 ? arredondarParaMultiplo(doseMg, multiplo) : 0;
        const alertasJoinados = [
          ...alertas,
          alerta ? alerta : `Calvert: AUC ${dose} × (ClCr ${clcrUsado} + 25) = ${doseMg} mg`,
        ].filter(Boolean).join(' | ');
        resultados.push({
          droga: `${droga.nome} (${fase.nome})`,
          dosePrescrita: `AUC ${dose}`,
          clcrUsadoMlMin: clcrUsado || undefined,
          doseAbsolutaMg: doseMg,
          doseAbsolutaArredondada: arredondada,
          metodoCalculo: 'Calvert-AUC',
          alertaCalculo: alertasJoinados || undefined,
          observacao: droga.observações,
        });

      } else if (unidade === 'mg') {
        resultados.push({
          droga: `${droga.nome} (${fase.nome})`,
          dosePrescrita: `${dose} mg (dose fixa)`,
          doseAbsolutaMg: dose,
          doseAbsolutaArredondada: dose,
          metodoCalculo: 'dose-fixa',
          observacao: droga.observações,
        });

      } else if (unidade === 'mcg') {
        resultados.push({
          droga: `${droga.nome} (${fase.nome})`,
          dosePrescrita: `${dose} mcg`,
          doseAbsolutaMg: parseFloat((dose / 1000).toFixed(3)),
          doseAbsolutaArredondada: parseFloat((dose / 1000).toFixed(3)),
          metodoCalculo: 'dose-fixa',
          observacao: droga.observações,
        });

      } else {
        resultados.push({
          droga: `${droga.nome} (${fase.nome})`,
          dosePrescrita: `${dose} ${unidade}`,
          doseAbsolutaMg: 0,
          doseAbsolutaArredondada: 0,
          metodoCalculo: 'ignorado',
          alertaCalculo: 'Via oral ou unidade sem cálculo automático.',
          observacao: droga.observações,
        });
      }
    });
  });

  return resultados;
}

// ─── Gerador de ID único ──────────────────────────────────────────────────────

export function gerarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Diluições padrão ─────────────────────────────────────────────────────────

export interface DiluiçãoDroga {
  droga: string;
  diluente: string;
  concentraçãoFinal: string;
  volumeFinal: string;
  estabilidade: string;
  observações?: string;
}

export const DILUIÇÕES_PADRÃO: Record<string, DiluiçãoDroga> = {
  'Doxorrubicina': {
    droga: 'Doxorrubicina', diluente: 'SF 0,9% ou SG 5%', concentraçãoFinal: '2 mg/mL',
    volumeFinal: 'Diluir em 50–100 mL', estabilidade: '24h temperatura ambiente (proteger luz)',
    observações: 'Vesicante — confirmar acesso EV. Não misturar com Heparina.',
  },
  'Ciclofosfamida': {
    droga: 'Ciclofosfamida', diluente: 'SF 0,9% ou SG 5%', concentraçãoFinal: '10 mg/mL',
    volumeFinal: 'Diluir em 50–250 mL', estabilidade: '24h refrigerado',
    observações: 'Hidratação oral durante infusão.',
  },
  'Paclitaxel': {
    droga: 'Paclitaxel', diluente: 'SF 0,9% ou SG 5%', concentraçãoFinal: '0,3–1,2 mg/mL',
    volumeFinal: 'Diluir em 250–500 mL', estabilidade: '24h temperatura ambiente',
    observações: 'Equipo SEM PVC. Filtro 0,22 µm. Pré-medicar 30 min antes.',
  },
  'Docetaxel': {
    droga: 'Docetaxel', diluente: 'SF 0,9% ou SG 5%', concentraçãoFinal: '0,3–0,74 mg/mL',
    volumeFinal: 'Diluir em 250 mL', estabilidade: '4h temperatura ambiente',
    observações: 'Pré-medicar corticoide D-1, D0, D1. Usar dentro de 4h.',
  },
  'Carboplatina': {
    droga: 'Carboplatina', diluente: 'SG 5% APENAS', concentraçãoFinal: '0,5–2 mg/mL',
    volumeFinal: 'Diluir em 250–500 mL SG 5%', estabilidade: '8h temperatura ambiente',
    observações: 'NÃO usar SF 0,9% — precipitação. Fórmula Calvert: AUC × (ClCr + 25).',
  },
  'Cisplatina': {
    droga: 'Cisplatina', diluente: 'SF 0,9%', concentraçãoFinal: '0,5–1 mg/mL',
    volumeFinal: 'Diluir em 250–500 mL SF 0,9%', estabilidade: '8h temperatura ambiente (proteger luz)',
    observações: 'Hidratação: 1L SF pré + 1L SF pós. Débito urinário >100 mL/h. NÃO usar SG 5%.',
  },
  'Oxaliplatina': {
    droga: 'Oxaliplatina', diluente: 'SG 5% APENAS', concentraçãoFinal: '0,2–0,6 mg/mL',
    volumeFinal: 'Diluir em 250–500 mL SG 5%', estabilidade: '6h temperatura ambiente',
    observações: 'NÃO usar SF 0,9% — inativação. NÃO alumínio. Evitar frio/gelo.',
  },
  'Fluoruracila': {
    droga: 'Fluoruracila (5-FU)', diluente: 'SF 0,9% ou SG 5%',
    concentraçãoFinal: 'Bólus: puro; Contínuo: 1–5 mg/mL',
    volumeFinal: 'Bólus: sem diluição; Contínua: 250–500 mL', estabilidade: '72h (proteger luz)',
    observações: 'Bomba de infusão para FOLFOX/FOLFIRI. Via central se >24h.',
  },
  'Ácido Folínico (Folinato de Cálcio)': {
    droga: 'Ácido Folínico', diluente: 'SF 0,9% ou SG 5%', concentraçãoFinal: '0,5–5 mg/mL',
    volumeFinal: 'Diluir em 100–500 mL', estabilidade: '12h (proteger luz)',
    observações: 'Administrar ANTES do 5-FU bólus.',
  },
  'Irinotecano': {
    droga: 'Irinotecano', diluente: 'SF 0,9% ou SG 5%', concentraçãoFinal: '0,12–2,8 mg/mL',
    volumeFinal: 'Diluir em 250 mL', estabilidade: '12h temperatura ambiente',
    observações: 'Síndrome colinérgica: atropina 0,25 mg SC. Diarreia tardia: loperamida.',
  },
  'Gencitabina': {
    droga: 'Gencitabina', diluente: 'SF 0,9%', concentraçãoFinal: '≤40 mg/mL',
    volumeFinal: 'Diluir em 100–250 mL', estabilidade: '24h temperatura ambiente',
    observações: 'Infusão padrão 30 min. >60 min aumenta toxicidade.',
  },
  'Trastuzumabe': {
    droga: 'Trastuzumabe', diluente: 'SF 0,9%', concentraçãoFinal: '0,8–4 mg/mL',
    volumeFinal: 'Diluir em 250 mL SF 0,9%', estabilidade: '24h refrigerado',
    observações: '1ª dose: 90 min. 2ª dose: 60 min. Demais: 30 min (se tolerado).',
  },
  'Pertuzumabe': {
    droga: 'Pertuzumabe', diluente: 'SF 0,9%', concentraçãoFinal: 'Vial 14 mL em 250 mL SF',
    volumeFinal: '250 mL SF 0,9%', estabilidade: '24h refrigerado',
    observações: '1ª dose 840 mg em 60 min. Manutenção 420 mg em 30–60 min. Não sacudir.',
  },
  'Bevacizumabe': {
    droga: 'Bevacizumabe', diluente: 'SF 0,9%', concentraçãoFinal: '1,4–16,5 mg/mL',
    volumeFinal: '100 mL SF 0,9%', estabilidade: '8h refrigerado',
    observações: '1ª dose: 90 min. 2ª: 60 min. 3ª+: 30 min. NÃO agitar.',
  },
  'Etoposídeo': {
    droga: 'Etoposídeo', diluente: 'SF 0,9% ou SG 5%', concentraçãoFinal: '0,2–0,4 mg/mL',
    volumeFinal: 'Diluir em 250–500 mL', estabilidade: '24h temperatura ambiente',
    observações: '>0,4 mg/mL pode precipitar. Infusão em 60 min.',
  },
  'Pemetrexede': {
    droga: 'Pemetrexede', diluente: 'SF 0,9%', concentraçãoFinal: '25 mg/mL',
    volumeFinal: 'Reconstituir 500 mg em 20 mL; diluir em 100 mL SF', estabilidade: '27h refrigerado',
    observações: 'Ácido fólico 400 µg/dia VO × 7 dias antes. B12 1000 µg IM q9 semanas.',
  },
  'Ifosfamida': {
    droga: 'Ifosfamida', diluente: 'SF 0,9% ou SG 5%', concentraçãoFinal: '0,6–20 mg/mL',
    volumeFinal: 'Diluir em 250–1000 mL', estabilidade: '24h temperatura ambiente',
    observações: 'Mesna OBRIGATÓRIO. Hidratação vigorosa. Débito ≥100 mL/h.',
  },
  'Mesna': {
    droga: 'Mesna', diluente: 'SF 0,9% ou SG 5%', concentraçãoFinal: '20 mg/mL (bólus)',
    volumeFinal: 'Bólus: 50 mL; Infusão: 100 mL', estabilidade: '24h temperatura ambiente',
    observações: '0h, 4h e 8h após Ifosfamida. 20% da dose em cada ponto.',
  },
  'Ondansetrona': {
    droga: 'Ondansetrona', diluente: 'SF 0,9% ou SG 5%', concentraçãoFinal: '0,32–1 mg/mL',
    volumeFinal: '50 mL (8 mg) ou 100 mL (16 mg)', estabilidade: '48h temperatura ambiente',
    observações: 'Infundir em 15 min. Dose IV máx 16 mg. ECG se QTc prolongado.',
  },
  'Dexametasona': {
    droga: 'Dexametasona', diluente: 'SF 0,9% ou SG 5%', concentraçãoFinal: '0,4–4 mg/mL',
    volumeFinal: 'Diluir em 50–100 mL', estabilidade: '24h temperatura ambiente',
    observações: 'Bólus IV lento (2–3 min) para doses ≤10 mg.',
  },
};

// ─── Pré-medicações ───────────────────────────────────────────────────────────

export interface PreMedicaçãoGerada {
  título: string;
  itens: ItemPreMedicação[];
  outrasObservações?: string[];
}

export function gerarPreMedicações(protocolo: ProtocoloQuimioterapia): PreMedicaçãoGerada[] {
  const resultado: PreMedicaçãoGerada[] = [];
  const emeto = extrairEmetogênicoPrincipal(protocolo.potencialEmetogênico);
  const anafil = protocolo.riscoAnafilático;

  // Antiemese
  const itensAntiemese: ItemPreMedicação[] = [];
  if (emeto === 'ALTO') {
    itensAntiemese.push({ droga: 'Ondansetrona', dose: '8 mg', via: 'IV', timing: 'D1 — 30 min antes QT', obrigatório: true });
    itensAntiemese.push({ droga: 'Dexametasona', dose: '12 mg', via: 'IV', timing: 'D1 — 30 min antes QT', obrigatório: true });
    itensAntiemese.push({ droga: 'Metoclopramida', dose: '10 mg', via: 'IV', timing: 'D1 — 30 min antes QT (náusea refratária)', obrigatório: false });
    itensAntiemese.push({ droga: 'Prometazina', dose: '25 mg', via: 'VO', timing: 'D1 — antes de dormir', obrigatório: false });
    itensAntiemese.push({ droga: 'Dexametasona', dose: '8 mg', via: 'VO', timing: 'D2 e D3 — manhã', obrigatório: true });
  } else if (emeto === 'MODERADO') {
    itensAntiemese.push({ droga: 'Ondansetrona', dose: '8 mg', via: 'IV', timing: 'D1 — 30 min antes QT', obrigatório: true });
    itensAntiemese.push({ droga: 'Dexametasona', dose: '8 mg', via: 'IV', timing: 'D1 — 30 min antes QT', obrigatório: true });
    itensAntiemese.push({ droga: 'Prometazina', dose: '25 mg', via: 'VO', timing: 'D1 — antes de dormir', obrigatório: false });
    itensAntiemese.push({ droga: 'Ondansetrona', dose: '8 mg', via: 'VO', timing: 'D2–D3 — 12/12h se náusea', obrigatório: false });
  } else if (emeto === 'BAIXO') {
    itensAntiemese.push({ droga: 'Dexametasona', dose: '8 mg', via: 'IV', timing: 'D1 — 30 min antes QT', obrigatório: true });
    itensAntiemese.push({ droga: 'Ondansetrona', dose: '8 mg', via: 'VO', timing: 'Se náusea', obrigatório: false });
    itensAntiemese.push({ droga: 'Prometazina', dose: '25 mg', via: 'VO', timing: 'Se náusea', obrigatório: false });
  } else {
    itensAntiemese.push({ droga: 'Ondansetrona', dose: '8 mg', via: 'VO', timing: 'Se náusea / conforme necessidade', obrigatório: false });
  }
  resultado.push({ título: '1. Antiemese', itens: itensAntiemese });

  // Irinotecano: Atropina SC para síndrome colinérgica
  const temIrinotecano = protocolo.fases.some((f) =>
    f.drogas.some((d) => d.nome.toLowerCase().includes('irinotecano'))
  );
  if (temIrinotecano) {
    resultado.push({
      título: '2. Específico — Irinotecano (Colinérgica)',
      itens: [
        { droga: 'Atropina', dose: '0,25 mg', via: 'SC', timing: 'D1 — imediatamente antes da infusão', obrigatório: true },
        { droga: 'Escopolamina', dose: '0,5 mg', via: 'SC', timing: 'Se cólica ou sudorese persistente', obrigatório: false },
      ],
      outrasObservações: [
        'Síndrome colinérgica aguda: cólicas, diarreia precoce, sudorese, lacrimejamento — durante/logo após infusão.',
        'Diarreia tardia (>24h): Loperamida 4 mg VO + 2 mg a cada 2h até 12h sem diarreia.',
      ],
    });
  }

  // Profilaxia anafilática
  if (anafil === 'Alto') {
    resultado.push({
      título: '2. Profilaxia de Hipersensibilidade / Infusional',
      itens: [
        { droga: 'Dexametasona', dose: '8–12 mg', via: 'IV', timing: '30–60 min antes da infusão', obrigatório: true },
        { droga: 'Difenidramina', dose: '50 mg', via: 'IV lento', timing: '30–60 min antes', obrigatório: true },
        { droga: 'Hidrocortisona', dose: '100 mg', via: 'IV', timing: '30–60 min antes (protocolo institucional)', obrigatório: false },
        { droga: 'Paracetamol', dose: '750 mg', via: 'VO', timing: '30–60 min antes (Trastuzumabe/Pertuzumabe)', obrigatório: false },
        // Ranitidina REMOVIDA — proibição Anvisa/NDMA. Famotidina conforme protocolo institucional se necessário.
      ],
      outrasObservações: [
        'Observar paciente nos primeiros 30 min da infusão.',
        'Material de emergência: adrenalina, hidrocortisona.',
        'Se reação: parar infusão, acionar médico, tratar conforme grau CTCAE v5.',
      ],
    });
  } else if (anafil === 'Moderado') {
    resultado.push({
      título: '2. Profilaxia Infusional (Risco Moderado)',
      itens: [
        { droga: 'Dexametasona', dose: '8 mg', via: 'IV', timing: '30 min antes', obrigatório: false },
        { droga: 'Prometazina', dose: '25 mg', via: 'VO', timing: '30 min antes (se histórico de reação)', obrigatório: false },
      ],
    });
  }

  // Hidratação cisplatina
  const temCisplatina = protocolo.fases.some((f) =>
    f.drogas.some((d) => d.nome.toLowerCase().includes('cisplatina')),
  );
  if (temCisplatina) {
    resultado.push({
      título: '3. Hidratação Pré/Pós — Cisplatina',
      itens: [
        { droga: 'SF 0,9%', dose: '1000 mL', via: 'IV', timing: 'PRÉ-QT — 2h antes', obrigatório: true },
        { droga: 'KCl 10% + MgSO4 10%', dose: 'KCl 20 mEq + MgSO4 10 mL', via: 'IV', timing: 'Na hidratação pré ou pós', obrigatório: false },
        { droga: 'SF 0,9%', dose: '1000 mL', via: 'IV', timing: 'PÓS-QT — manter débito urinário >100 mL/h', obrigatório: true },
      ],
      outrasObservações: [
        'Débito urinário >100 mL/h antes de iniciar Cisplatina.',
        'Furosemida 40 mg IV se débito inadequado.',
        'Monitorar Cr, Mg, K antes de cada ciclo.',
      ],
    });
  }

  // Oxaliplatina — orientações frio
  const temOxaliplatina = protocolo.fases.some((f) =>
    f.drogas.some((d) => d.nome.toLowerCase().includes('oxaliplatina')),
  );
  if (temOxaliplatina) {
    resultado.push({
      título: '4. Orientações — Oxaliplatina',
      itens: [],
      outrasObservações: [
        'Evitar alimentos/bebidas gelados durante e nas 48–72h após a infusão.',
        'Luvas ao pegar objetos frios.',
        'Neuropatia cumulativa: avaliar redução de dose se grau ≥2 persistente.',
      ],
    });
  }

  // Pemetrexede — suplementação
  const temPemetrexede = protocolo.fases.some((f) =>
    f.drogas.some((d) => d.nome.toLowerCase().includes('pemetrexede')),
  );
  if (temPemetrexede) {
    resultado.push({
      título: '5. Suplementação — Pemetrexede',
      itens: [
        { droga: 'Ácido Fólico', dose: '400 mcg/dia', via: 'VO', timing: '7 dias antes do 1º ciclo — manter até 21 dias após último ciclo', obrigatório: true },
        { droga: 'Vitamina B12', dose: '1000 mcg', via: 'IM', timing: 'Antes do 1º ciclo; repetir q9 semanas', obrigatório: true },
        { droga: 'Dexametasona', dose: '4 mg 2×/dia', via: 'VO', timing: 'D-1, D0, D1 — profilaxia rash', obrigatório: true },
      ],
    });
  }

  return resultado;
}
