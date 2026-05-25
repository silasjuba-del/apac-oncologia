// === ARQUIVO: src/data/protocolos-seed.ts ===
// Protocolos CLÁSSICOS e de maior uso — Hospital do Bem, SUS/SBOC 2026
// QT pura + associações com: Bevacizumabe, Trastuzumabe, Pertuzumabe APENAS
// Alvo-terapias puras, hormonioterapia e imunoterapia isoladas EXCLUÍDAS

import type { ProtocoloQuimioterapia } from '../types/protocolos';

export const PROTOCOLOS_SEED: ProtocoloQuimioterapia[] = [

  // ══════════════════════════════════════════════════════════════
  // I. MAMA
  // ══════════════════════════════════════════════════════════════

  {
    id: 'MAMA-NEO-001',
    nome: 'AC → Docetaxel (NSABP B-27)',
    tipoCâncer: 'Mama',
    contexto: 'Neoadjuvante',
    trialReferência: 'NSABP B-27',
    potencialEmetogênico: 'ALTO (AC) / BAIXO (D)',
    riscoAnafilático: 'Alto',
    statusHER2: 'Negativo',
    filgrastim: 'Opcional',
    alertas: ['Cardiotoxicidade cumulativa — Doxorrubicina (dose máx 450 mg/m²)', 'Pré-medicação anti-histamínica obrigatória para Docetaxel'],
    fases: [
      {
        nome: 'AC',
        ciclos: 4,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Doxorrubicina', dose: 60, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '15 min' },
          { nome: 'Ciclofosfamida', dose: 600, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '30 min' },
        ],
      },
      {
        nome: 'Docetaxel',
        ciclos: 4,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Docetaxel', dose: 100, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '60 min' },
        ],
      },
    ],
    totalCiclos: 8,
    notasClínicas: ['Sequência AC → Docetaxel; não inverter fases'],
  },

  {
    id: 'MAMA-ADJ-001',
    nome: 'AC → Paclitaxel (E1199)',
    tipoCâncer: 'Mama',
    contexto: 'Adjuvante',
    trialReferência: 'E1199',
    potencialEmetogênico: 'ALTO (AC) / BAIXO (T)',
    riscoAnafilático: 'Alto',
    statusHER2: 'Negativo',
    filgrastim: 'Não',
    alertas: ['Cardiotoxicidade cumulativa — Doxorrubicina', 'Pré-medicação anti-histamínica obrigatória para Paclitaxel'],
    fases: [
      {
        nome: 'AC',
        ciclos: 4,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Doxorrubicina', dose: 60, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '15 min' },
          { nome: 'Ciclofosfamida', dose: 600, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '30 min' },
        ],
      },
      {
        nome: 'Paclitaxel',
        ciclos: 4,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 175, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '3h' },
        ],
        notasFase: 'Alternativa: Paclitaxel 80 mg/m² semanal × 12 semanas',
      },
    ],
    totalCiclos: 8,
  },

  {
    id: 'MAMA-ADJ-002',
    nome: 'Dose Densa AC → Paclitaxel (CALGB 9741)',
    tipoCâncer: 'Mama',
    contexto: 'Adjuvante',
    trialReferência: 'CALGB 9741',
    potencialEmetogênico: 'ALTO',
    riscoAnafilático: 'Alto',
    statusHER2: 'Negativo',
    filgrastim: 'Obrigatório',
    alertas: ['Filgrastim obrigatório entre ciclos — dose densa', 'Cardiotoxicidade cumulativa — Doxorrubicina'],
    fases: [
      {
        nome: 'AC Dose Densa',
        ciclos: 4,
        intervalo: 'q14 dias',
        drogas: [
          { nome: 'Doxorrubicina', dose: 60, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '15 min' },
          { nome: 'Ciclofosfamida', dose: 600, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '30 min' },
        ],
        notasFase: 'Filgrastim D3-D10 de cada ciclo',
      },
      {
        nome: 'Paclitaxel Dose Densa',
        ciclos: 4,
        intervalo: 'q14 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 175, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '3h' },
        ],
        notasFase: 'Filgrastim D3-D10 de cada ciclo',
      },
    ],
    totalCiclos: 8,
  },

  {
    id: 'MAMA-ADJ-003',
    nome: 'TAC (BCIRG 001)',
    tipoCâncer: 'Mama',
    contexto: 'Adjuvante',
    trialReferência: 'BCIRG 001',
    potencialEmetogênico: 'ALTO',
    riscoAnafilático: 'Alto',
    statusHER2: 'Negativo',
    filgrastim: 'Recomendado',
    alertas: ['Cardiotoxicidade cumulativa — Doxorrubicina', 'Pré-medicação obrigatória para Docetaxel'],
    fases: [
      {
        nome: 'TAC',
        ciclos: 6,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Docetaxel', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '60 min' },
          { nome: 'Doxorrubicina', dose: 50, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '15 min' },
          { nome: 'Ciclofosfamida', dose: 500, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '30 min' },
        ],
      },
    ],
    totalCiclos: 6,
  },

  {
    id: 'MAMA-HER2-001',
    nome: 'AC → Paclitaxel + Trastuzumabe (NCCTG N9831/NSABP B-31)',
    tipoCâncer: 'Mama',
    contexto: 'Adjuvante',
    trialReferência: 'NCCTG N9831 / NSABP B-31',
    potencialEmetogênico: 'ALTO (AC) / BAIXO (T)',
    riscoAnafilático: 'Alto',
    statusHER2: 'Positivo',
    filgrastim: 'Não',
    alertas: ['Cardiotoxicidade cumulativa — Doxorrubicina', 'Monitorar FEVE antes e durante Trastuzumabe', 'NÃO administrar Trastuzumabe concomitante com AC — risco cardíaco'],
    fases: [
      {
        nome: 'AC',
        ciclos: 4,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Doxorrubicina', dose: 60, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '15 min' },
          { nome: 'Ciclofosfamida', dose: 600, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '30 min' },
        ],
      },
      {
        nome: 'Paclitaxel + Trastuzumabe',
        ciclos: 4,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 175, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '3h' },
          { nome: 'Trastuzumabe', dose: 8, unidade: 'mg/kg', via: 'IV', dias: 'D1 (1ª dose)', tempoInfusão: '90 min', observações: 'Manutenção: 6 mg/kg q21 dias' },
        ],
      },
      {
        nome: 'Trastuzumabe manutenção',
        ciclos: 14,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Trastuzumabe', dose: 6, unidade: 'mg/kg', via: 'IV', dias: 'D1', tempoInfusão: '30 min (após 1ª dose bem tolerada)' },
        ],
        notasFase: 'Total Trastuzumabe: 52 semanas (1 ano)',
      },
    ],
    totalCiclos: 22,
    duração: '12 meses',
  },

  {
    id: 'MAMA-HER2-002',
    nome: 'Docetaxel + Carboplatina + Trastuzumabe — TCH (BCIRG 006)',
    tipoCâncer: 'Mama',
    contexto: 'Adjuvante',
    trialReferência: 'BCIRG 006',
    potencialEmetogênico: 'MODERADO',
    riscoAnafilático: 'Alto',
    statusHER2: 'Positivo',
    filgrastim: 'Opcional',
    alertas: ['Preferir em pacientes com risco cardíaco elevado — sem antraciclina', 'Monitorar FEVE durante Trastuzumabe'],
    fases: [
      {
        nome: 'TCH',
        ciclos: 6,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Docetaxel', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '60 min' },
          { nome: 'Carboplatina', dose: 6, unidade: 'AUC', via: 'IV', dias: 'D1', tempoInfusão: '30-60 min' },
          { nome: 'Trastuzumabe', dose: 8, unidade: 'mg/kg', via: 'IV', dias: 'D1 (1ª dose)', tempoInfusão: '90 min', observações: 'Manutenção: 6 mg/kg q21' },
        ],
      },
      {
        nome: 'Trastuzumabe manutenção',
        ciclos: 12,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Trastuzumabe', dose: 6, unidade: 'mg/kg', via: 'IV', dias: 'D1', tempoInfusão: '30 min' },
        ],
      },
    ],
    totalCiclos: 18,
    duração: '12 meses',
  },

  {
    id: 'MAMA-HER2-003',
    nome: 'Docetaxel + Trastuzumabe + Pertuzumabe (NeoSphere — Neoadjuvante)',
    tipoCâncer: 'Mama',
    contexto: 'Neoadjuvante',
    trialReferência: 'NeoSphere',
    potencialEmetogênico: 'BAIXO',
    riscoAnafilático: 'Alto',
    statusHER2: 'Positivo',
    filgrastim: 'Não',
    alertas: ['Monitorar FEVE antes e durante tratamento', 'Pertuzumabe: contraindicado na gestação (teratogênico)'],
    fases: [
      {
        nome: 'Docetaxel + Trastuzumabe + Pertuzumabe',
        ciclos: 4,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Trastuzumabe', dose: 8, unidade: 'mg/kg', via: 'IV', dias: 'D1 (1ª dose)', tempoInfusão: '90 min', observações: 'Manutenção: 6 mg/kg q21' },
          { nome: 'Pertuzumabe', dose: 840, unidade: 'mg', via: 'IV', dias: 'D1 (1ª dose)', tempoInfusão: '60 min', observações: 'Manutenção: 420 mg q21' },
          { nome: 'Docetaxel', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '60 min', observações: 'Pode escalonar para 100 mg/m² se tolerado' },
        ],
      },
    ],
    totalCiclos: 4,
    notasClínicas: ['Seguir com AC × 4 ciclos após neoadjuvante (protocolo completo)'],
  },

  {
    id: 'MAMA-MET-001',
    nome: 'Paclitaxel + Bevacizumabe (ECOG 2100)',
    tipoCâncer: 'Mama',
    contexto: 'Metastático',
    trialReferência: 'ECOG 2100',
    potencialEmetogênico: 'BAIXO',
    riscoAnafilático: 'Alto',
    statusHER2: 'Negativo',
    alertas: ['Pré-medicação anti-histamínica obrigatória — Paclitaxel', 'Bevacizumabe: avaliar HAS, proteinúria, cicatrização'],
    fases: [
      {
        nome: 'Paclitaxel + Bevacizumabe',
        ciclos: 0,
        intervalo: 'q28 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 90, unidade: 'mg/m²', via: 'IV', dias: 'D1, D8, D15', tempoInfusão: '1h' },
          { nome: 'Bevacizumabe', dose: 10, unidade: 'mg/kg', via: 'IV', dias: 'D1 e D15', tempoInfusão: '90 min (1ª dose) / 60 min / 30 min', observações: 'Manutenção até progressão' },
        ],
        notasFase: 'Até progressão ou toxicidade',
      },
    ],
    notasClínicas: ['Bevacizumabe manutenção mesmo após suspensão do taxano em pacientes com resposta'],
  },

  {
    id: 'MAMA-MET-002',
    nome: 'Capecitabina + Docetaxel (XT)',
    tipoCâncer: 'Mama',
    contexto: 'Metastático',
    potencialEmetogênico: 'BAIXO',
    riscoAnafilático: 'Baixo',
    statusHER2: 'Negativo',
    alertas: ['Síndrome mão-pé — reduzir dose Capecitabina se grau ≥2'],
    fases: [
      {
        nome: 'XT',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Docetaxel', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '60 min' },
          { nome: 'Capecitabina', dose: 1250, unidade: 'mg/m²', via: 'VO', dias: 'D1-14', observações: '2× ao dia' },
        ],
        notasFase: 'Até progressão ou toxicidade',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // II. CÓLON E RETO
  // ══════════════════════════════════════════════════════════════

  {
    id: 'CCR-ADJ-001',
    nome: 'mFOLFOX6 — Adjuvante (MOSAIC)',
    tipoCâncer: 'Colorretal',
    contexto: 'Adjuvante',
    trialReferência: 'MOSAIC',
    potencialEmetogênico: 'MODERADO',
    alertas: ['Oxaliplatina: neuropatia cumulativa — avaliar D/C se grau ≥2 persistente', 'Evitar gelo/frio durante infusão de Oxaliplatina'],
    fases: [
      {
        nome: 'mFOLFOX6',
        ciclos: 12,
        intervalo: 'q14 dias',
        drogas: [
          { nome: 'Oxaliplatina', dose: 85, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2h' },
          { nome: 'Ácido Folínico (Folinato de Cálcio)', dose: 400, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2h (concomitante com Oxaliplatina)' },
          { nome: 'Fluoruracila', dose: 400, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: 'Bólus IV' },
          { nome: 'Fluoruracila', dose: 2400, unidade: 'mg/m²', via: 'EV contínuo', dias: 'D1-D2', tempoInfusão: 'Infusão contínua 46h' },
        ],
      },
    ],
    totalCiclos: 12,
    duração: '6 meses',
  },

  {
    id: 'CCR-MET-001',
    nome: 'FOLFIRI — Metastático',
    tipoCâncer: 'Colorretal',
    contexto: 'Metastático',
    potencialEmetogênico: 'MODERADO',
    alertas: ['Irinotecano: síndrome colinérgica aguda — atropina 0,25 mg SC se necessário', 'Diarreia tardia: loperamida 4 mg até 16 mg/dia'],
    fases: [
      {
        nome: 'FOLFIRI',
        ciclos: 0,
        intervalo: 'q14 dias',
        drogas: [
          { nome: 'Irinotecano', dose: 180, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '90 min' },
          { nome: 'Ácido Folínico (Folinato de Cálcio)', dose: 400, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2h' },
          { nome: 'Fluoruracila', dose: 400, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: 'Bólus IV' },
          { nome: 'Fluoruracila', dose: 2400, unidade: 'mg/m²', via: 'EV contínuo', dias: 'D1-D2', tempoInfusão: 'Infusão contínua 46h' },
        ],
        notasFase: 'Até progressão; pode associar Bevacizumabe',
      },
    ],
  },

  {
    id: 'CCR-MET-002',
    nome: 'FOLFIRI + Bevacizumabe',
    tipoCâncer: 'Colorretal',
    contexto: 'Metastático',
    trialReferência: 'IFL/BICC-C',
    potencialEmetogênico: 'MODERADO',
    alertas: ['Bevacizumabe: HAS, proteinúria, risco perfuração intestinal', 'Suspender Bevacizumabe ≥4 semanas antes de cirurgia'],
    fases: [
      {
        nome: 'FOLFIRI + Bevacizumabe',
        ciclos: 0,
        intervalo: 'q14 dias',
        drogas: [
          { nome: 'Bevacizumabe', dose: 5, unidade: 'mg/kg', via: 'IV', dias: 'D1', tempoInfusão: '90 min (1ª) / 60 min / 30 min' },
          { nome: 'Irinotecano', dose: 180, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '90 min' },
          { nome: 'Ácido Folínico (Folinato de Cálcio)', dose: 400, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2h' },
          { nome: 'Fluoruracila', dose: 400, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: 'Bólus IV' },
          { nome: 'Fluoruracila', dose: 2400, unidade: 'mg/m²', via: 'EV contínuo', dias: 'D1-D2', tempoInfusão: 'Infusão contínua 46h' },
        ],
      },
    ],
  },

  {
    id: 'CCR-MET-003',
    nome: 'mFOLFOX6 + Bevacizumabe',
    tipoCâncer: 'Colorretal',
    contexto: 'Metastático',
    trialReferência: 'NO16966',
    potencialEmetogênico: 'MODERADO',
    alertas: ['Bevacizumabe: HAS, proteinúria', 'Oxaliplatina: neuropatia cumulativa', 'Evitar gelo durante infusão'],
    fases: [
      {
        nome: 'mFOLFOX6 + Bevacizumabe',
        ciclos: 0,
        intervalo: 'q14 dias',
        drogas: [
          { nome: 'Bevacizumabe', dose: 5, unidade: 'mg/kg', via: 'IV', dias: 'D1', tempoInfusão: '90 min (1ª) / 60 min / 30 min' },
          { nome: 'Oxaliplatina', dose: 85, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2h' },
          { nome: 'Ácido Folínico (Folinato de Cálcio)', dose: 400, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2h' },
          { nome: 'Fluoruracila', dose: 400, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: 'Bólus IV' },
          { nome: 'Fluoruracila', dose: 2400, unidade: 'mg/m²', via: 'EV contínuo', dias: 'D1-D2', tempoInfusão: 'Infusão contínua 46h' },
        ],
      },
    ],
  },

  {
    id: 'CCR-MET-004',
    nome: 'XELOX (Capecitabina + Oxaliplatina)',
    tipoCâncer: 'Colorretal',
    contexto: 'Metastático',
    potencialEmetogênico: 'MODERADO',
    alertas: ['Oxaliplatina: neuropatia cumulativa', 'Capecitabina: síndrome mão-pé'],
    fases: [
      {
        nome: 'XELOX',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Oxaliplatina', dose: 130, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2h' },
          { nome: 'Capecitabina', dose: 1000, unidade: 'mg/m²', via: 'VO', dias: 'D1-14', observações: '2× ao dia' },
        ],
      },
    ],
  },

  {
    id: 'CCR-NEO-001',
    nome: 'Capecitabina + RT — Neoadjuvante Reto',
    tipoCâncer: 'Colorretal',
    contexto: 'Quimiorradioterapia',
    potencialEmetogênico: 'MÍNIMO',
    alertas: ['Síndrome mão-pé', 'Associar RT conforme planejamento radioterápico'],
    fases: [
      {
        nome: 'Capecitabina + RT',
        ciclos: 1,
        intervalo: 'Concomitante com RT',
        drogas: [
          { nome: 'Capecitabina', dose: 825, unidade: 'mg/m²', via: 'VO', dias: 'D1-D35 (dias de RT)', observações: '2× ao dia' },
        ],
        notasFase: 'RT 50,4 Gy em 28 frações; cirurgia após 6-8 semanas',
      },
    ],
    notasClínicas: ['Adjuvante pós-cirurgia: Capecitabina 1250 mg/m² 2×/dia D1-14 q21 × 4 ciclos'],
  },

  // ══════════════════════════════════════════════════════════════
  // III. PULMÃO — NSCLC
  // ══════════════════════════════════════════════════════════════

  {
    id: 'NSCLC-ADJ-001',
    nome: 'Carboplatina + Paclitaxel — Adjuvante/Metastático NSCLC',
    tipoCâncer: 'Pulmão',
    contexto: 'Adjuvante',
    potencialEmetogênico: 'MODERADO',
    riscoAnafilático: 'Alto',
    alertas: ['Pré-medicação anti-histamínica obrigatória para Paclitaxel'],
    fases: [
      {
        nome: 'Carboplatina + Paclitaxel',
        ciclos: 4,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 200, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '3h' },
          { nome: 'Carboplatina', dose: 6, unidade: 'AUC', via: 'IV', dias: 'D1', tempoInfusão: '30-60 min' },
        ],
      },
    ],
    totalCiclos: 4,
  },

  {
    id: 'NSCLC-MET-001',
    nome: 'Carboplatina + Paclitaxel + Bevacizumabe (ECOG 4599)',
    tipoCâncer: 'Pulmão',
    contexto: 'Metastático',
    trialReferência: 'ECOG 4599',
    potencialEmetogênico: 'MODERADO',
    riscoAnafilático: 'Alto',
    alertas: ['Bevacizumabe CONTRAINDICADO: histologia escamosa, hemoptise, SNC', 'Pré-medicação anti-histamínica obrigatória — Paclitaxel'],
    fases: [
      {
        nome: 'Indução',
        ciclos: 6,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 200, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '3h' },
          { nome: 'Carboplatina', dose: 6, unidade: 'AUC', via: 'IV', dias: 'D1', tempoInfusão: '30-60 min' },
          { nome: 'Bevacizumabe', dose: 15, unidade: 'mg/kg', via: 'IV', dias: 'D1', tempoInfusão: '90 min (1ª) / 60 min / 30 min' },
        ],
      },
      {
        nome: 'Manutenção Bevacizumabe',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Bevacizumabe', dose: 15, unidade: 'mg/kg', via: 'IV', dias: 'D1', tempoInfusão: '30 min', observações: 'Até progressão' },
        ],
        notasFase: 'Manutenção até progressão ou toxicidade',
      },
    ],
    totalCiclos: 6,
    notasClínicas: ['Apenas NSCLC não escamoso', 'Bevacizumabe manutenção após fim da QT'],
  },

  {
    id: 'NSCLC-MET-002',
    nome: 'Gencitabina + Cisplatina — Metastático NSCLC',
    tipoCâncer: 'Pulmão',
    contexto: 'Metastático',
    potencialEmetogênico: 'ALTO',
    alertas: ['Cisplatina: hidratação pré e pós (1-2L SF 0,9%)', 'Monitorar creatinina antes de cada ciclo'],
    fases: [
      {
        nome: 'Gencitabina + Cisplatina',
        ciclos: 6,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Gencitabina', dose: 1250, unidade: 'mg/m²', via: 'IV', dias: 'D1 e D8', tempoInfusão: '30 min' },
          { nome: 'Cisplatina', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2-3h' },
        ],
      },
    ],
    totalCiclos: 6,
  },

  {
    id: 'NSCLC-MET-003',
    nome: 'Pemetrexede + Cisplatina — NSCLC Não Escamoso',
    tipoCâncer: 'Pulmão',
    contexto: 'Metastático',
    potencialEmetogênico: 'ALTO',
    alertas: ['Suplementação OBRIGATÓRIA: Ácido Fólico 400 mcg/dia VO e Vitamina B12 1000 mcg IM q9 semanas', 'Dexametasona 4 mg 2×/dia D-1, D0, D1 (profilaxia rash)'],
    fases: [
      {
        nome: 'Pemetrexede + Cisplatina',
        ciclos: 6,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Pemetrexede', dose: 500, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '10 min' },
          { nome: 'Cisplatina', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2h', observações: 'Administrar após Pemetrexede' },
        ],
      },
    ],
    totalCiclos: 6,
    notasClínicas: ['EXCLUSIVO para não escamoso (adenocarcinoma, grandes células)', 'Manutenção: Pemetrexede 500 mg/m² q21 até progressão'],
  },

  // ══════════════════════════════════════════════════════════════
  // IV. PULMÃO — SCLC
  // ══════════════════════════════════════════════════════════════

  {
    id: 'SCLC-001',
    nome: 'Etoposídeo + Cisplatina — EP (SCLC Padrão)',
    tipoCâncer: 'Pulmão Pequenas Células',
    contexto: 'Metastático',
    potencialEmetogênico: 'ALTO',
    alertas: ['Cisplatina: hidratação pré e pós obrigatória', 'Padrão para doença limitada com RT concomitante'],
    fases: [
      {
        nome: 'EP',
        ciclos: 4,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Etoposídeo', dose: 100, unidade: 'mg/m²', via: 'IV', dias: 'D1-D3', tempoInfusão: '60 min' },
          { nome: 'Cisplatina', dose: 80, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2-3h' },
        ],
      },
    ],
    totalCiclos: 4,
    notasClínicas: ['RT torácica concomitante na doença limitada', 'Irradiação craniana profilática se RC'],
  },

  {
    id: 'SCLC-002',
    nome: 'Etoposídeo + Carboplatina (SCLC — intolerância cisplatina)',
    tipoCâncer: 'Pulmão Pequenas Células',
    contexto: 'Metastático',
    potencialEmetogênico: 'MODERADO',
    fases: [
      {
        nome: 'EC',
        ciclos: 4,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Etoposídeo', dose: 100, unidade: 'mg/m²', via: 'IV', dias: 'D1-D3', tempoInfusão: '60 min' },
          { nome: 'Carboplatina', dose: 5, unidade: 'AUC', via: 'IV', dias: 'D1', tempoInfusão: '30-60 min' },
        ],
      },
    ],
    totalCiclos: 4,
  },

  // ══════════════════════════════════════════════════════════════
  // V. PÂNCREAS
  // ══════════════════════════════════════════════════════════════

  {
    id: 'PANCREAS-001',
    nome: 'FOLFIRINOX — Pâncreas Metastático (bom PS)',
    tipoCâncer: 'Pâncreas',
    contexto: 'Metastático',
    trialReferência: 'PRODIGE 4/ACCORD 11',
    potencialEmetogênico: 'ALTO',
    alertas: ['Apenas para PS 0-1', 'Irinotecano: diarreia tardia — loperamida de resgate', 'Oxaliplatina: neuropatia cumulativa'],
    fases: [
      {
        nome: 'FOLFIRINOX',
        ciclos: 0,
        intervalo: 'q14 dias',
        drogas: [
          { nome: 'Oxaliplatina', dose: 85, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2h' },
          { nome: 'Irinotecano', dose: 180, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '90 min' },
          { nome: 'Ácido Folínico (Folinato de Cálcio)', dose: 400, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2h' },
          { nome: 'Fluoruracila', dose: 400, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: 'Bólus IV' },
          { nome: 'Fluoruracila', dose: 2400, unidade: 'mg/m²', via: 'EV contínuo', dias: 'D1-D2', tempoInfusão: 'Infusão contínua 46h' },
        ],
        notasFase: 'Até progressão ou toxicidade',
      },
    ],
  },

  {
    id: 'PANCREAS-002',
    nome: 'Gencitabina Monoterapia — Pâncreas',
    tipoCâncer: 'Pâncreas',
    contexto: 'Metastático',
    trialReferência: 'Burris 1997',
    potencialEmetogênico: 'BAIXO',
    alertas: ['Opção para PS 2 ou idosos', 'Monitorar hemograma — mielossupressão'],
    fases: [
      {
        nome: 'Gencitabina',
        ciclos: 0,
        intervalo: 'q28 dias',
        drogas: [
          { nome: 'Gencitabina', dose: 1000, unidade: 'mg/m²', via: 'IV', dias: 'D1, D8, D15', tempoInfusão: '30 min' },
        ],
        notasFase: 'Ciclo: 3 semanas ON / 1 semana OFF',
      },
    ],
  },

  {
    id: 'PANCREAS-003',
    nome: 'Gencitabina + Capecitabina (GEM-CAP)',
    tipoCâncer: 'Pâncreas',
    contexto: 'Metastático',
    potencialEmetogênico: 'BAIXO',
    fases: [
      {
        nome: 'GEM-CAP',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Gencitabina', dose: 1000, unidade: 'mg/m²', via: 'IV', dias: 'D1 e D8', tempoInfusão: '30 min' },
          { nome: 'Capecitabina', dose: 650, unidade: 'mg/m²', via: 'VO', dias: 'D1-14', observações: '2× ao dia' },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // VI. TRATO BILIAR
  // ══════════════════════════════════════════════════════════════

  {
    id: 'BILIAR-001',
    nome: 'Gencitabina + Cisplatina — Biliar (ABC-02)',
    tipoCâncer: 'Trato Biliar',
    contexto: 'Metastático',
    trialReferência: 'ABC-02',
    potencialEmetogênico: 'ALTO',
    alertas: ['Hidratação pré e pós-cisplatina obrigatória'],
    fases: [
      {
        nome: 'Gencitabina + Cisplatina',
        ciclos: 8,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Gencitabina', dose: 1000, unidade: 'mg/m²', via: 'IV', dias: 'D1 e D8', tempoInfusão: '30 min' },
          { nome: 'Cisplatina', dose: 25, unidade: 'mg/m²', via: 'IV', dias: 'D1 e D8', tempoInfusão: '1h' },
        ],
      },
    ],
    totalCiclos: 8,
    duração: '6 meses',
  },

  {
    id: 'BILIAR-002',
    nome: 'GEMOX — Trato Biliar',
    tipoCâncer: 'Trato Biliar',
    contexto: 'Metastático',
    potencialEmetogênico: 'MODERADO',
    alertas: ['Oxaliplatina: neuropatia cumulativa'],
    fases: [
      {
        nome: 'GEMOX',
        ciclos: 0,
        intervalo: 'q14 dias',
        drogas: [
          { nome: 'Gencitabina', dose: 1000, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '100 min' },
          { nome: 'Oxaliplatina', dose: 100, unidade: 'mg/m²', via: 'IV', dias: 'D2', tempoInfusão: '2h' },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // VII. GÁSTRICO E ESÔFAGO
  // ══════════════════════════════════════════════════════════════

  {
    id: 'GASTRICO-001',
    nome: 'DCF — Gástrico Metastático',
    tipoCâncer: 'Estômago',
    contexto: 'Metastático',
    trialReferência: 'V325',
    potencialEmetogênico: 'ALTO',
    riscoAnafilático: 'Moderado',
    alertas: ['Toxicidade significativa — reservar para PS 0-1', 'Cardiotoxicidade cumulativa — Doxorrubicina'],
    fases: [
      {
        nome: 'DCF',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Docetaxel', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '60 min' },
          { nome: 'Cisplatina', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2-3h' },
          { nome: 'Fluoruracila', dose: 750, unidade: 'mg/m²', via: 'EV contínuo', dias: 'D1-D5', tempoInfusão: 'Infusão contínua 5 dias' },
        ],
      },
    ],
  },

  {
    id: 'GASTRICO-002',
    nome: 'Trastuzumabe + Cisplatina + Capecitabina (TOGA) — HER2+',
    tipoCâncer: 'Estômago',
    contexto: 'Metastático',
    trialReferência: 'ToGA',
    potencialEmetogênico: 'ALTO',
    statusHER2: 'Positivo',
    alertas: ['Apenas HER2 IHC3+ ou IHC2+/FISH+', 'Monitorar FEVE', 'Hidratação pré-cisplatina'],
    fases: [
      {
        nome: 'Trastuzumabe + Cisplatina + Capecitabina',
        ciclos: 6,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Trastuzumabe', dose: 8, unidade: 'mg/kg', via: 'IV', dias: 'D1 (1ª dose)', tempoInfusão: '90 min', observações: 'Manutenção: 6 mg/kg q21' },
          { nome: 'Cisplatina', dose: 80, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2-3h' },
          { nome: 'Capecitabina', dose: 1000, unidade: 'mg/m²', via: 'VO', dias: 'D1-14', observações: '2× ao dia' },
        ],
        notasFase: 'Alternativa ao invés de Capecitabina: 5-FU 800 mg/m²/dia D1-5 infusão contínua',
      },
    ],
    totalCiclos: 6,
  },

  {
    id: 'ESOFAGO-001',
    nome: 'Paclitaxel + Carboplatina + RT — CROSS (Neoadjuvante Esôfago)',
    tipoCâncer: 'Esôfago',
    contexto: 'Quimiorradioterapia',
    trialReferência: 'CROSS',
    potencialEmetogênico: 'MODERADO',
    riscoAnafilático: 'Alto',
    alertas: ['Pré-medicação obrigatória para Paclitaxel', 'RT 41,4 Gy em 23 frações — concomitante'],
    fases: [
      {
        nome: 'Paclitaxel + Carboplatina (semanal + RT)',
        ciclos: 5,
        intervalo: 'Semanal',
        drogas: [
          { nome: 'Paclitaxel', dose: 50, unidade: 'mg/m²', via: 'IV', dias: 'D1 semanal', tempoInfusão: '1h' },
          { nome: 'Carboplatina', dose: 2, unidade: 'AUC', via: 'IV', dias: 'D1 semanal', tempoInfusão: '30 min' },
        ],
        notasFase: 'Concomitante com RT 41,4 Gy / 23 frações — 5 semanas',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // VIII. CABEÇA E PESCOÇO
  // ══════════════════════════════════════════════════════════════

  {
    id: 'HN-001',
    nome: 'TPF — Cabeça e Pescoço (Indução)',
    tipoCâncer: 'Cabeça e Pescoço',
    contexto: 'Neoadjuvante',
    trialReferência: 'TAX 323 / TAX 324',
    potencialEmetogênico: 'ALTO',
    riscoAnafilático: 'Alto',
    alertas: ['Toxicidade severa — apenas PS 0-1', 'Filgrastim recomendado', 'Hidratação pré-cisplatina'],
    filgrastim: 'Recomendado',
    fases: [
      {
        nome: 'TPF',
        ciclos: 3,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Docetaxel', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '60 min' },
          { nome: 'Cisplatina', dose: 100, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2-3h' },
          { nome: 'Fluoruracila', dose: 1000, unidade: 'mg/m²', via: 'EV contínuo', dias: 'D1-D4', tempoInfusão: 'Infusão contínua 96h' },
        ],
        notasFase: 'Seguir de quimiorradioterapia com Cisplatina semanal',
      },
    ],
    totalCiclos: 3,
  },

  {
    id: 'HN-002',
    nome: 'Cisplatina + RT — Cabeça e Pescoço (Definitivo/Adjuvante)',
    tipoCâncer: 'Cabeça e Pescoço',
    contexto: 'Quimiorradioterapia',
    potencialEmetogênico: 'ALTO',
    alertas: ['Hidratação pré e pós-cisplatina obrigatória', 'Monitorar audiometria e função renal'],
    fases: [
      {
        nome: 'Cisplatina semanal + RT',
        ciclos: 6,
        intervalo: 'Semanal',
        drogas: [
          { nome: 'Cisplatina', dose: 40, unidade: 'mg/m²', via: 'IV', dias: 'D1 semanal', tempoInfusão: '1h' },
        ],
        notasFase: 'RT 70 Gy / 35 frações (definitivo) ou 60-66 Gy (adjuvante)',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // IX. COLO UTERINO
  // ══════════════════════════════════════════════════════════════

  {
    id: 'COLO-001',
    nome: 'Cisplatina + RT — Colo Uterino (Definitivo)',
    tipoCâncer: 'Colo Uterino',
    contexto: 'Quimiorradioterapia',
    trialReferência: 'GOG 123',
    potencialEmetogênico: 'ALTO',
    alertas: ['Padrão SUS para estágio IB2-IVA', 'Hidratação pré e pós obrigatória'],
    fases: [
      {
        nome: 'Cisplatina semanal + RT',
        ciclos: 5,
        intervalo: 'Semanal',
        drogas: [
          { nome: 'Cisplatina', dose: 40, unidade: 'mg/m²', via: 'IV', dias: 'D1 semanal', tempoInfusão: '1h' },
        ],
        notasFase: 'RT externa 45-50 Gy + braquiterapia',
      },
    ],
  },

  {
    id: 'COLO-002',
    nome: 'Paclitaxel + Cisplatina — Colo Uterino Metastático',
    tipoCâncer: 'Colo Uterino',
    contexto: 'Metastático',
    trialReferência: 'GOG 169',
    potencialEmetogênico: 'ALTO',
    riscoAnafilático: 'Alto',
    alertas: ['Pré-medicação obrigatória para Paclitaxel', 'Hidratação pré-cisplatina'],
    fases: [
      {
        nome: 'Paclitaxel + Cisplatina',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 135, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '24h' },
          { nome: 'Cisplatina', dose: 50, unidade: 'mg/m²', via: 'IV', dias: 'D2', tempoInfusão: '2h' },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // X. OVÁRIO
  // ══════════════════════════════════════════════════════════════

  {
    id: 'OVARIO-001',
    nome: 'Carboplatina + Paclitaxel — Ovário (Padrão)',
    tipoCâncer: 'Ovário',
    contexto: 'Adjuvante',
    trialReferência: 'GOG 158',
    potencialEmetogênico: 'MODERADO',
    riscoAnafilático: 'Alto',
    alertas: ['Pré-medicação obrigatória para Paclitaxel', 'Neuropatia periférica cumulativa'],
    fases: [
      {
        nome: 'Carboplatina + Paclitaxel',
        ciclos: 6,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 175, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '3h' },
          { nome: 'Carboplatina', dose: 5, unidade: 'AUC', via: 'IV', dias: 'D1', tempoInfusão: '30-60 min' },
        ],
      },
    ],
    totalCiclos: 6,
    duração: '18 semanas',
  },

  {
    id: 'OVARIO-002',
    nome: 'Carboplatina + Paclitaxel + Bevacizumabe (GOG 218)',
    tipoCâncer: 'Ovário',
    contexto: 'Adjuvante',
    trialReferência: 'GOG 218',
    potencialEmetogênico: 'MODERADO',
    riscoAnafilático: 'Alto',
    alertas: ['Bevacizumabe: iniciar no 2º ciclo', 'Não administrar Bevacizumabe ≤28 dias pós-cirurgia', 'Risco de fístula GI — não usar em oclusão'],
    fases: [
      {
        nome: 'Indução (ciclo 1 sem Bevacizumabe)',
        ciclos: 1,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 175, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '3h' },
          { nome: 'Carboplatina', dose: 6, unidade: 'AUC', via: 'IV', dias: 'D1', tempoInfusão: '30-60 min' },
        ],
      },
      {
        nome: 'Carboplatina + Paclitaxel + Bevacizumabe',
        ciclos: 5,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 175, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '3h' },
          { nome: 'Carboplatina', dose: 6, unidade: 'AUC', via: 'IV', dias: 'D1', tempoInfusão: '30-60 min' },
          { nome: 'Bevacizumabe', dose: 15, unidade: 'mg/kg', via: 'IV', dias: 'D1', tempoInfusão: '90 min (1ª) / 60 min / 30 min' },
        ],
      },
      {
        nome: 'Manutenção Bevacizumabe',
        ciclos: 16,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Bevacizumabe', dose: 15, unidade: 'mg/kg', via: 'IV', dias: 'D1', tempoInfusão: '30 min' },
        ],
        notasFase: 'Total: 22 ciclos de Bevacizumabe',
      },
    ],
    totalCiclos: 22,
  },

  // ══════════════════════════════════════════════════════════════
  // XI. BEXIGA
  // ══════════════════════════════════════════════════════════════

  {
    id: 'BEXIGA-001',
    nome: 'MVAC — Bexiga Metastático',
    tipoCâncer: 'Bexiga',
    contexto: 'Metastático',
    potencialEmetogênico: 'ALTO',
    alertas: ['Toxicidade elevada — monitorar função renal e cardíaca', 'Filgrastim recomendado'],
    filgrastim: 'Recomendado',
    fases: [
      {
        nome: 'MVAC',
        ciclos: 0,
        intervalo: 'q28 dias',
        drogas: [
          { nome: 'Metotrexato', dose: 30, unidade: 'mg/m²', via: 'IV', dias: 'D1, D15, D22', tempoInfusão: 'Bólus IV' },
          { nome: 'Vimblastina', dose: 3, unidade: 'mg/m²', via: 'IV', dias: 'D2, D15, D22', tempoInfusão: 'Bólus IV' },
          { nome: 'Doxorrubicina', dose: 30, unidade: 'mg/m²', via: 'IV', dias: 'D2', tempoInfusão: '15 min' },
          { nome: 'Cisplatina', dose: 70, unidade: 'mg/m²', via: 'IV', dias: 'D2', tempoInfusão: '2-3h' },
        ],
      },
    ],
  },

  {
    id: 'BEXIGA-002',
    nome: 'Gencitabina + Cisplatina — Bexiga (GC)',
    tipoCâncer: 'Bexiga',
    contexto: 'Metastático',
    trialReferência: 'von der Maase 2000',
    potencialEmetogênico: 'ALTO',
    alertas: ['Toxicidade mais favorável que MVAC', 'Hidratação pré-cisplatina obrigatória'],
    fases: [
      {
        nome: 'GC',
        ciclos: 0,
        intervalo: 'q28 dias',
        drogas: [
          { nome: 'Gencitabina', dose: 1000, unidade: 'mg/m²', via: 'IV', dias: 'D1, D8, D15', tempoInfusão: '30 min' },
          { nome: 'Cisplatina', dose: 70, unidade: 'mg/m²', via: 'IV', dias: 'D2', tempoInfusão: '2-3h' },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // XII. PRÓSTATA
  // ══════════════════════════════════════════════════════════════

  {
    id: 'PROSTATA-001',
    nome: 'Docetaxel + Prednisona — Próstata Metastático (TAX327)',
    tipoCâncer: 'Próstata',
    contexto: 'Metastático',
    trialReferência: 'TAX327',
    potencialEmetogênico: 'BAIXO',
    riscoAnafilático: 'Alto',
    alertas: ['Pré-medicação obrigatória para Docetaxel', 'Prednisona oral contínua — não suspender abruptamente'],
    fases: [
      {
        nome: 'Docetaxel + Prednisona',
        ciclos: 10,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Docetaxel', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '60 min' },
          { nome: 'Prednisona', dose: 5, unidade: 'mg', via: 'VO', dias: 'D1-D21 (contínuo)', observações: '2× ao dia — 5 mg 12/12h' },
        ],
      },
    ],
    totalCiclos: 10,
  },

  // ══════════════════════════════════════════════════════════════
  // XIII. ENDOMÉTRIO
  // ══════════════════════════════════════════════════════════════

  {
    id: 'ENDOMETRIO-001',
    nome: 'Paclitaxel + Carboplatina — Endométrio',
    tipoCâncer: 'Endométrio',
    contexto: 'Adjuvante',
    trialReferência: 'GOG 209',
    potencialEmetogênico: 'MODERADO',
    riscoAnafilático: 'Alto',
    alertas: ['Padrão para estágio III-IV ou recorrente', 'Pré-medicação obrigatória'],
    fases: [
      {
        nome: 'Paclitaxel + Carboplatina',
        ciclos: 6,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 175, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '3h' },
          { nome: 'Carboplatina', dose: 6, unidade: 'AUC', via: 'IV', dias: 'D1', tempoInfusão: '30-60 min' },
        ],
      },
    ],
    totalCiclos: 6,
  },

  // ══════════════════════════════════════════════════════════════
  // XIV. RIM
  // ══════════════════════════════════════════════════════════════

  {
    id: 'RIM-001',
    nome: 'Gencitabina + Fluoruracila — CCR não células claras',
    tipoCâncer: 'Rim',
    contexto: 'Metastático',
    potencialEmetogênico: 'BAIXO',
    fases: [
      {
        nome: 'Gencitabina + 5-FU',
        ciclos: 0,
        intervalo: 'q28 dias',
        drogas: [
          { nome: 'Gencitabina', dose: 900, unidade: 'mg/m²', via: 'IV', dias: 'D1, D8, D15', tempoInfusão: '30 min' },
          { nome: 'Fluoruracila', dose: 600, unidade: 'mg/m²', via: 'IV', dias: 'D1, D8, D15', tempoInfusão: 'Bólus IV' },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // XV. MESOTELIOMA
  // ══════════════════════════════════════════════════════════════

  {
    id: 'MESO-001',
    nome: 'Pemetrexede + Cisplatina — Mesotelioma (EMPHACIS)',
    tipoCâncer: 'Mesotelioma',
    contexto: 'Metastático',
    trialReferência: 'EMPHACIS',
    potencialEmetogênico: 'ALTO',
    alertas: ['Suplementação OBRIGATÓRIA: Ácido Fólico + Vitamina B12', 'Dexametasona profilaxia rash D-1/D0/D1'],
    fases: [
      {
        nome: 'Pemetrexede + Cisplatina',
        ciclos: 6,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Pemetrexede', dose: 500, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '10 min' },
          { nome: 'Cisplatina', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2h', observações: 'Após Pemetrexede' },
        ],
      },
    ],
    totalCiclos: 6,
  },

  // ══════════════════════════════════════════════════════════════
  // XVI. CANAL ANAL
  // ══════════════════════════════════════════════════════════════

  {
    id: 'ANAL-001',
    nome: 'Nigro — Fluoruracila + Mitomicina + RT (Canal Anal)',
    tipoCâncer: 'Canal Anal',
    contexto: 'Quimiorradioterapia',
    trialReferência: 'Nigro 1974 / ACT II',
    potencialEmetogênico: 'BAIXO',
    alertas: ['Padrão definitivo — evitar cirurgia', 'Mitomicina: toxicidade hematológica cumulativa'],
    fases: [
      {
        nome: 'Mitomicina + 5-FU + RT',
        ciclos: 2,
        intervalo: 'D1 e D29',
        drogas: [
          { nome: 'Mitomicina C', dose: 10, unidade: 'mg/m²', via: 'IV', dias: 'D1 e D29', tempoInfusão: 'Bólus IV', observações: 'Máx 20 mg dose total' },
          { nome: 'Fluoruracila', dose: 1000, unidade: 'mg/m²', via: 'EV contínuo', dias: 'D1-D4 e D29-D32', tempoInfusão: 'Infusão contínua 96h' },
        ],
        notasFase: 'RT 50,4 Gy concomitante',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // XVII. MELANOMA (QT convencional)
  // ══════════════════════════════════════════════════════════════

  {
    id: 'MELANOMA-001',
    nome: 'Dacarbazina — Melanoma Metastático',
    tipoCâncer: 'Melanoma',
    contexto: 'Metastático',
    potencialEmetogênico: 'ALTO',
    alertas: ['Opção histórica — preferir imunoterapia ou BRAF-alvo quando disponível'],
    fases: [
      {
        nome: 'Dacarbazina',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Dacarbazina', dose: 1000, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '30-60 min' },
        ],
      },
    ],
  },

  {
    id: 'MELANOMA-002',
    nome: 'Paclitaxel + Carboplatina — Melanoma 2ª linha',
    tipoCâncer: 'Melanoma',
    contexto: 'Metastático',
    potencialEmetogênico: 'MODERADO',
    riscoAnafilático: 'Alto',
    alertas: ['Pré-medicação obrigatória para Paclitaxel'],
    fases: [
      {
        nome: 'Paclitaxel + Carboplatina',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Paclitaxel', dose: 175, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '3h' },
          { nome: 'Carboplatina', dose: 6, unidade: 'AUC', via: 'IV', dias: 'D1', tempoInfusão: '30-60 min' },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // XVIII. SARCOMA
  // ══════════════════════════════════════════════════════════════

  {
    id: 'SARCOMA-001',
    nome: 'Doxorrubicina — Sarcoma Partes Moles (1ª linha)',
    tipoCâncer: 'Sarcoma',
    contexto: 'Metastático',
    potencialEmetogênico: 'MODERADO',
    alertas: ['Cardiotoxicidade cumulativa — dose máx 450-550 mg/m² lifetime'],
    fases: [
      {
        nome: 'Doxorrubicina',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Doxorrubicina', dose: 75, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '15-30 min' },
        ],
      },
    ],
  },

  {
    id: 'SARCOMA-002',
    nome: 'Ifosfamida + Doxorrubicina — Sarcoma',
    tipoCâncer: 'Sarcoma',
    contexto: 'Metastático',
    potencialEmetogênico: 'ALTO',
    alertas: ['Mesna OBRIGATÓRIO — proteção vesical', 'Hidratação vigorosa — débito ≥100 mL/h', 'Cardiotoxicidade cumulativa'],
    fases: [
      {
        nome: 'Ifosfamida + Doxorrubicina',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Doxorrubicina', dose: 50, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '15-30 min' },
          { nome: 'Ifosfamida', dose: 5000, unidade: 'mg/m²', via: 'EV contínuo', dias: 'D1', tempoInfusão: 'Infusão contínua 24h' },
          { nome: 'Mesna', dose: 1000, unidade: 'mg/m²', via: 'IV', dias: 'D1 (0h) / D1 (4h) / D1 (8h)', tempoInfusão: 'Bólus — horários: 0h, 4h, 8h após Ifosfamida', observações: 'Dose total Mesna = 20% da dose de Ifosfamida em cada ponto' },
        ],
      },
    ],
  },

  {
    id: 'SARCOMA-003',
    nome: 'Gencitabina + Docetaxel — Sarcoma (SARC002)',
    tipoCâncer: 'Sarcoma',
    contexto: 'Metastático',
    trialReferência: 'SARC002',
    potencialEmetogênico: 'BAIXO',
    riscoAnafilático: 'Alto',
    filgrastim: 'Recomendado',
    alertas: ['Especialmente ativo em leiomiossarcoma e sarcoma pleomórfico'],
    fases: [
      {
        nome: 'Gencitabina + Docetaxel',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Gencitabina', dose: 900, unidade: 'mg/m²', via: 'IV', dias: 'D1 e D8', tempoInfusão: '90 min' },
          { nome: 'Docetaxel', dose: 100, unidade: 'mg/m²', via: 'IV', dias: 'D8', tempoInfusão: '60 min', observações: 'Administrar após Gencitabina' },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // XIX. TIMO
  // ══════════════════════════════════════════════════════════════

  {
    id: 'TIMO-001',
    nome: 'CAP — Timoma/Carcinoma Tímico',
    tipoCâncer: 'Timo',
    contexto: 'Metastático',
    trialReferência: 'Loehrer 1994',
    potencialEmetogênico: 'ALTO',
    riscoAnafilático: 'Alto',
    alertas: ['Cardiotoxicidade cumulativa — Doxorrubicina', 'Hidratação pré-cisplatina'],
    fases: [
      {
        nome: 'CAP',
        ciclos: 0,
        intervalo: 'q21 dias',
        drogas: [
          { nome: 'Cisplatina', dose: 50, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '2-3h' },
          { nome: 'Doxorrubicina', dose: 50, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '15-30 min' },
          { nome: 'Ciclofosfamida', dose: 500, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '30 min' },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // XX. HEPATOCARCINOMA
  // ══════════════════════════════════════════════════════════════

  {
    id: 'HCC-001',
    nome: 'GEMOX — Hepatocarcinoma (QT sistêmica)',
    tipoCâncer: 'Fígado',
    contexto: 'Metastático',
    potencialEmetogênico: 'MODERADO',
    alertas: ['Apenas Child-Pugh A', 'Ajustar Gencitabina conforme função hepática'],
    fases: [
      {
        nome: 'GEMOX',
        ciclos: 0,
        intervalo: 'q14 dias',
        drogas: [
          { nome: 'Gencitabina', dose: 1000, unidade: 'mg/m²', via: 'IV', dias: 'D1', tempoInfusão: '30 min' },
          { nome: 'Oxaliplatina', dose: 100, unidade: 'mg/m²', via: 'IV', dias: 'D2', tempoInfusão: '2h' },
        ],
      },
    ],
  },

];

export default PROTOCOLOS_SEED;
