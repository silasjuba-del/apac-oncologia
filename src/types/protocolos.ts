// === ARQUIVO: src/types/protocolos.ts ===
// APACApp v4.5 — Dr. Silas Negrão — Hospital do Bem, Patos/PB — SUS/SBOC 2026
// Melhorias: EsquemaDose, duracaoTipo, potencialEmetogênico estrito no domínio,
//            ResultadoCálculoDose revisado, cicloReferencia em ModificaçãoDroga

// ─── Tipos primitivos ─────────────────────────────────────────────────────────

/** Tipo ESTRITO — usado na camada de domínio. Seed/persistência usam string. */
export type PotencialEmetogênico = 'ALTO' | 'MODERADO' | 'BAIXO' | 'MÍNIMO';

export type RiscoAnafilático = 'Alto' | 'Moderado' | 'Baixo';

export type ContextoTratamento =
  | 'Neoadjuvante' | 'Adjuvante' | 'Metastático' | 'Quimiorradioterapia'
  | 'Perioperatório' | 'Hormonioterapia' | 'Definitivo';

export type ViaAdministração = 'IV' | 'VO' | 'SC' | 'IM' | 'EV contínuo';

export type TipoCâncer =
  | 'Mama' | 'Colorretal' | 'Pâncreas' | 'Trato Biliar' | 'Estômago'
  | 'Esôfago' | 'Canal Anal' | 'Fígado' | 'Pulmão' | 'Pulmão Pequenas Células'
  | 'Cabeça e Pescoço' | 'Bexiga' | 'Rim' | 'Próstata' | 'Colo Uterino'
  | 'Endométrio' | 'Ovário' | 'Sarcoma' | 'Melanoma' | 'NET'
  | 'Tumor Desmoide' | 'GIST' | 'Mesotelioma' | 'Timo';

export type StatusHER2 = 'Positivo' | 'Negativo' | 'Indiferente';
export type StatusHR  = 'Positivo' | 'Negativo' | 'Indiferente';

/** Duração semântica do protocolo — substitui ciclos: 0 como proxy */
export type DuracaoTipo =
  | 'fixa'           // número fixo de ciclos
  | 'ate_progressao' // até progressão ou toxicidade
  | 'manutencao'     // manutenção indefinida
  | 'ate_toxicidade';

// ─── Esquema de dose variável por ciclo (ataque/manutenção) ──────────────────
// Inspirado em sugestão Gemini — permite modelar qualquer agente com dose
// variável sem quebrar compatibilidade com os 49 protocolos existentes.

export interface EsquemaDose {
  /** Ciclos em que esta dose se aplica. 'todos' = todos os ciclos da fase. */
  ciclos: number[] | 'todos';
  dose: number;
  unidade: 'mg/m²' | 'mg/kg' | 'mg' | 'AUC' | 'mcg';
  tempoInfusão?: string;
  observação?: string;
}

// ─── Droga ────────────────────────────────────────────────────────────────────

export interface DrogaProtocolo {
  nome: string;
  /** Dose-base (fallback para protocolos sem esquemas) */
  dose: number;
  unidade: 'mg/m²' | 'mg/kg' | 'mg' | 'AUC' | 'mcg';
  via: ViaAdministração;
  dias: string;
  tempoInfusão?: string;
  observações?: string;
  /**
   * Esquemas variáveis por ciclo — ataque/manutenção ou outros padrões.
   * Se presente, sobrepõe dose/unidade/tempoInfusão para os ciclos indicados.
   * Compatível com legado: ausência do campo usa dose/unidade padrão.
   * Ex: Trastuzumabe { esquemas: [
   *   { ciclos: [1], dose: 8, unidade: 'mg/kg', observação: 'Ataque — 90 min' },
   *   { ciclos: 'todos', dose: 6, unidade: 'mg/kg', observação: 'Manutenção — 30 min' }
   * ]}
   */
  esquemas?: EsquemaDose[];
  /**
   * Arredondamento farmacêutico desta droga.
   * default: 5 para mg/m²; 50 para AUC (Carboplatina); 1 para mg/kg; 1 para dose fixa.
   */
  multiplosArredondamento?: number;
}

// ─── Fase ─────────────────────────────────────────────────────────────────────

export interface FaseRegime {
  nome: string;
  /** 0 = até progressão/toxicidade — use duracaoTipo para semântica correta */
  ciclos: number;
  intervalo: string;
  drogas: DrogaProtocolo[];
  notasFase?: string;
  /** Semântica da duração — substitui inferência por ciclos === 0 */
  duracaoTipo?: DuracaoTipo;
  /** Ciclo absoluto de início desta fase no protocolo total (calculado automaticamente) */
  cicloInicio?: number;
  /** Ciclo absoluto de fim desta fase (calculado automaticamente) */
  cicloFim?: number;
}

// ─── Protocolo ────────────────────────────────────────────────────────────────

export interface ProtocoloQuimioterapia {
  id: string;
  nome: string;
  tipoCâncer: TipoCâncer;
  contexto: ContextoTratamento;
  trialReferência?: string;
  /**
   * Camada de persistência/seed aceita string composta ("ALTO (AC) / BAIXO (T)").
   * A camada de domínio usa extrairEmetogênicoPrincipal() que valida e extrai.
   * Nunca usar o valor bruto para lógica clínica — sempre passar pela função.
   */
  potencialEmetogênico: PotencialEmetogênico | string;
  riscoAnafilático?: RiscoAnafilático;
  filgrastim?: 'Obrigatório' | 'Recomendado' | 'Opcional' | 'Não';
  statusHER2?: StatusHER2;
  statusHR?: StatusHR;
  fases: FaseRegime[];
  totalCiclos?: number;
  duração?: string;
  notasClínicas?: string[];
  alertas?: string[];
}

// ─── Pré-medicações ───────────────────────────────────────────────────────────

export interface ItemPreMedicação {
  droga: string;
  dose: string;
  via: string;
  timing: string;
  obrigatório: boolean;
}

// ─── Dados do paciente para cálculo ──────────────────────────────────────────

export interface DadosPacienteParaDose {
  alturaCm: number;
  pesoKg: number;
  bsaM2?: number;
  /** Obrigatório para Carboplatina AUC (Calvert) */
  creatininaMgDl?: number;
  idadeAnos?: number;
  sexo?: 'M' | 'F';
  /** Calculado automaticamente via Cockroft-Gault + ajuste de peso */
  clcrMlMin?: number;
  /** IMC calculado automaticamente */
  imc?: number;
  /** Peso ajustado usado no Cockroft-Gault quando IMC ≥ 30 */
  pesoUsadoParaClCr?: number;
}

// ─── Resultado de cálculo — revisado ─────────────────────────────────────────

export interface ResultadoCálculoDose {
  droga: string;
  dosePrescrita: string;
  /** Preenchido apenas se método usou BSA */
  bsaUsado?: number;
  /** Preenchido apenas se método usou peso (mg/kg) */
  pesoUsadoKg?: number;
  /** Preenchido apenas se método usou ClCr (Calvert) */
  clcrUsadoMlMin?: number;
  doseAbsolutaMg: number;
  doseAbsolutaArredondada: number;
  metodoCalculo: 'mg/m²' | 'mg/kg' | 'Calvert-AUC' | 'dose-fixa' | 'retirada' | 'ignorado';
  alertaCalculo?: string;
  observacao?: string;
}

// ─── FaseComModificações — tipo completo exportado ───────────────────────────

export interface FaseComModificações extends Omit<FaseRegime, 'drogas'> {
  drogas: DrogaComModificação[];
  /** Índice original da fase no protocolo-base */
  faseIndexOriginal?: number;
  /** true quando esta fase corresponde ao cicloAtual da prescrição */
  ativaNoCiclo?: boolean;
  cicloDentroDaFase?: number;
  cicloInicioFase?: number;
  cicloFimFase?: number;
}

// ─── Modificação de droga — Discriminated Union ───────────────────────────────
// Elimina ambiguidade entre redução percentual e alteração absoluta em tempo de compilação

export type EscopoModificação = 'ciclo_atual' | 'ciclos_posteriores' | 'excluir_protocolo';

/** Base comum a todos os tipos de modificação */
interface ModificacaoBase {
  id: string;
  faseIndex: number;
  drogaIndex: number;
  drogaNome: string;
  escopo: EscopoModificação;
  /** Ciclo absoluto em que foi aplicada — essencial para escopo temporal */
  cicloReferencia: number;
  /** Obrigatória — auditoria médica e defesa administrativa */
  justificativa: string;
  criadoEm: string;
}

/** Redução percentual: 1–99% da dose-base original */
export interface ModificacaoReducaoDose extends ModificacaoBase {
  tipo: 'redução_dose';
  /** Percentual de redução: 1 a 99 */
  percentualReducao: number;
}

/** Alterar dose-base para novo valor na mesma unidade original da droga */
export interface ModificacaoAlterarDose extends ModificacaoBase {
  tipo: 'alterar_dose';
  /** Nova dose-base na unidade original (mg/m², mg/kg, AUC — nunca mg absolutos) */
  novaDose: number;
}

/** Alterar tempo de infusão */
export interface ModificacaoAlterarTempoInfusão extends ModificacaoBase {
  tipo: 'alterar_tempo_infusão';
  novoTempoInfusão: string;
}

/** Retirar droga da prescrição */
export interface ModificacaoRetirar extends ModificacaoBase {
  tipo: 'retirar';
}

/** Union discriminada — TypeScript força tratamento exaustivo em todos os consumidores */
export type ModificaçãoDroga =
  | ModificacaoReducaoDose
  | ModificacaoAlterarDose
  | ModificacaoAlterarTempoInfusão
  | ModificacaoRetirar;

/** Helper de tipo para omitir campos gerados automaticamente */
export type ModificaçãoDrogaInput = Omit<ModificaçãoDroga, 'id' | 'cicloReferencia' | 'criadoEm'>;

/** Registro imutável de auditoria — nunca sobrescrito */
export interface EventoAuditoria {
  id: string;
  tipo: 'modificacao_aplicada' | 'modificacao_desfeita' | 'ciclo_alterado' | 'prescricao_iniciada';
  descricao: string;
  cicloAtual: number;
  criadoEm: string;
  dados?: unknown;
}

// ─── Droga com modificação aplicada ──────────────────────────────────────────

export interface DrogaComModificação extends DrogaProtocolo {
  modificacaoAtiva?: {
    /** Tipo da modificação — estreitado pela union */
    tipo: ModificaçãoDroga['tipo'];
    doseOriginal: number;
    retiradaNesteCiclo: boolean;
    retiradaPermanente: boolean;
    escopo: EscopoModificação;
    cicloReferencia: number;
    justificativa: string;
  };
}

// ─── Prescrição de paciente ───────────────────────────────────────────────────

export interface ProtocoloEmPrescrição extends Omit<ProtocoloQuimioterapia, 'fases'> {
  fases: FaseComModificações[];
  cicloAtual: number;
  dataPrescrição: string;
  /** Estado atual das modificações — deduplicado por faseIndex+drogaIndex+tipo */
  modificacoesAtivas: ModificaçãoDroga[];
  /** Log imutável de todos os eventos — nunca sobrescrito */
  auditoria: EventoAuditoria[];
}

// ─── Resultado de fase resolvida por ciclo ────────────────────────────────────

export interface FaseResolvida {
  fase: FaseRegime;
  faseIndex: number;
  cicloDentroDaFase: number;
  cicloInicioFase: number;
  cicloFimFase: number;
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

export interface FiltrosProtocolo {
  busca: string;
  tipoCâncer: TipoCâncer | '';
  contexto: ContextoTratamento | '';
  statusHER2: StatusHER2 | '';
  statusHR: StatusHR | '';
  potencialEmetogênico: PotencialEmetogênico | '';
  riscoAnafilático: RiscoAnafilático | '';
  filgrastim: boolean;
}

// ─── Sanity check ─────────────────────────────────────────────────────────────

export interface AlertaSanidade {
  campo: string;
  mensagem: string;
  nivel: 'aviso' | 'erro';
}
