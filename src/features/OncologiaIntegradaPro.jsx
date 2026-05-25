// === src/features/OncologiaIntegradaPro.jsx ===
// APACApp — Módulo "Oncologia Integrada Pro" v1.1.7
// Dr. Silas Negrão — Hospital do Bem, Patos/PB
//
// v1.1.5 — Agentes orientados à economia de tempo médico (sem fricção)
//   ✓ Aplicação automática de administrativos seguros
//   ✓ Sugestões clínicas em 1 clique para aceitar todas
//   ✓ Conflito só para divergência REAL (não formatação)
//
// v1.1.4 — Soberania médica + APAC unificada
//   ✓ Usa validarAPACBase() — fonte ÚNICA compartilhada com agente anti-glosa
//   ✓ Usa BLOQUEANTES_APAC ampliado
//   ✓ Nível APAC calculado por calcularNivelAPAC()
//
// v1.1.3 — Governança/rastreabilidade
// v1.1.2 — Capecitabina por dose inicial, bloqueantes absolutos, AUC por droga
// v1.1.1 — Bloqueantes remanescentes
// v1.1   — Segurança clínica básica

import { useState, useMemo, useEffect } from 'react';
import {
  parseNumeroBR, normalizarAlturaCm, normalizarPesoKg, normalizarCreatinina,
  normalizarSexo, calcularIdade,
  validarCPF, validarCNS,
  calcularBSA, calcularIMC, calcularPesoIdeal, calcularClCr,
  calcularCapecitabina, REGRA_CAPECITABINA_PADRAO,
  REGRAS_CID_SIGTAP, validarCIDSIGTAP,
  REGRAS_DOSE_CUMULATIVA, validarDoseCumulativa,
  fmtNum, chavePaciente,
  // ✓ v1.1.4 — novos imports
  validarAPACBase, calcularNivelAPAC, BLOQUEANTES_APAC, BLOQUEANTES_CADASTRAIS,
  formatarDataBRSegura,
} from './oncoProUtils.js';

// ═══ Paleta padrão do APACApp ════════════════════════════════════════════════
const N  = '#1B365D'; const T  = '#2B7A8C'; const G  = '#B8860B';
const VE = '#15803D'; const VM = '#B91C1C'; const AM = '#B45309';
const BG = '#EEF2F7';

// (Utilitários de segurança importados de oncoProUtils.js)

// ═══ PROTOCOLOS (v1.1: trials sem imuno citados como "trial base histórico") ═

const PROTOCOLOS = [
  // MAMA
  { id:'MAMA-ADJ-AC-T', nome:'AC × 4 → Paclitaxel × 12 semanal (Adjuvante)', tipo:'Mama', contexto:'Adjuvante',
    statusHER2:'Negativo', trialBase:'NSABP B-30 / Sparano', observacao:null,
    fases:[
      { nome:'AC', ciclos:4, intervalo:'q21d', drogas:[
        { nome:'Doxorrubicina', dose:60, unid:'mg/m²', via:'IV', dias:'D1' },
        { nome:'Ciclofosfamida', dose:600, unid:'mg/m²', via:'IV', dias:'D1' },
      ]},
      { nome:'Paclitaxel semanal', ciclos:12, intervalo:'q7d', drogas:[
        { nome:'Paclitaxel', dose:80, unid:'mg/m²', via:'IV', dias:'D1 semanal' },
      ]}
    ],
    emeto:'ALTO (AC) / BAIXO (T)', anafil:'Alto', filgrastim:'Recomendado' },

  { id:'MAMA-ADJ-TCH', nome:'TCH (Docetaxel + Carbo + Trastuzumabe)', tipo:'Mama', contexto:'Adjuvante',
    statusHER2:'Positivo', trialBase:'BCIRG-006', observacao:null,
    fases:[
      { nome:'TCH', ciclos:6, intervalo:'q21d', drogas:[
        { nome:'Docetaxel', dose:75, unid:'mg/m²', via:'IV', dias:'D1' },
        { nome:'Carboplatina', dose:6, unid:'AUC', via:'IV', dias:'D1' },
        { nome:'Trastuzumabe', dose:8, unid:'mg/kg', via:'IV', dias:'D1',
          esquemas:[
            { ciclos:[1], dose:8, unid:'mg/kg', obs:'Ataque (90 min)' },
            { ciclos:'todos', dose:6, unid:'mg/kg', obs:'Manutenção (30 min) q21d até 1 ano' },
          ]},
      ]}
    ],
    emeto:'MODERADO', anafil:'Alto', filgrastim:'Recomendado' },

  // COLORRETAL
  { id:'CRC-FOLFOX6', nome:'mFOLFOX6', tipo:'Colorretal', contexto:'Adjuvante/Metastático',
    trialBase:'MOSAIC (adj) / N9741 (meta)', observacao:null,
    fases:[
      { nome:'FOLFOX6', ciclos:12, intervalo:'q14d', drogas:[
        { nome:'Oxaliplatina', dose:85, unid:'mg/m²', via:'IV', dias:'D1', infusao:'2h' },
        { nome:'Ácido Folínico', dose:400, unid:'mg/m²', via:'IV', dias:'D1', infusao:'2h' },
        { nome:'5-FU bolus', dose:400, unid:'mg/m²', via:'IV', dias:'D1' },
        { nome:'5-FU infusão', dose:2400, unid:'mg/m²', via:'EV contínuo', dias:'D1-D2', infusao:'46h' },
      ]}
    ],
    emeto:'MODERADO', anafil:'Moderado', filgrastim:'Opcional' },

  { id:'CRC-FOLFIRI', nome:'FOLFIRI', tipo:'Colorretal', contexto:'Metastático',
    trialBase:'BICC-C / Tournigand 2004', observacao:null,
    fases:[
      { nome:'FOLFIRI', ciclos:12, intervalo:'q14d', drogas:[
        { nome:'Irinotecano', dose:180, unid:'mg/m²', via:'IV', dias:'D1', infusao:'90 min' },
        { nome:'Ácido Folínico', dose:400, unid:'mg/m²', via:'IV', dias:'D1' },
        { nome:'5-FU bolus', dose:400, unid:'mg/m²', via:'IV', dias:'D1' },
        { nome:'5-FU infusão', dose:2400, unid:'mg/m²', via:'EV contínuo', dias:'D1-D2', infusao:'46h' },
      ]}
    ],
    emeto:'MODERADO', anafil:'Moderado', filgrastim:'Opcional' },

  { id:'CRC-XELOX', nome:'CAPOX / XELOX', tipo:'Colorretal', contexto:'Adjuvante/Metastático',
    trialBase:'XELOXA / NO16968', observacao:null,
    fases:[
      { nome:'CAPOX', ciclos:8, intervalo:'q21d', drogas:[
        { nome:'Oxaliplatina', dose:130, unid:'mg/m²', via:'IV', dias:'D1', infusao:'2h' },
        { nome:'Capecitabina', dose:1000, unid:'mg/m²', via:'VO', dias:'D1-D14 12/12h' },
      ]}
    ],
    emeto:'MODERADO', anafil:'Moderado', filgrastim:'Opcional' },

  // PULMÃO NSCLC
  { id:'NSCLC-CISGEMCI', nome:'Cisplatina + Gencitabina', tipo:'Pulmão NSCLC', contexto:'Metastático',
    trialBase:'ECOG 1594', observacao:null,
    fases:[
      { nome:'CisGem', ciclos:6, intervalo:'q21d', drogas:[
        { nome:'Cisplatina', dose:75, unid:'mg/m²', via:'IV', dias:'D1', infusao:'2h' },
        { nome:'Gencitabina', dose:1250, unid:'mg/m²', via:'IV', dias:'D1, D8', infusao:'30 min' },
      ]}
    ],
    emeto:'ALTO', anafil:'Baixo', filgrastim:'Opcional' },

  { id:'NSCLC-CARBOPEM', nome:'Carboplatina + Pemetrexede', tipo:'Pulmão NSCLC', contexto:'Metastático',
    trialBase:'PARAMOUNT (manutenção)',
    observacao:'Backbone de KEYNOTE-189 (com pembrolizumabe). Esquema cadastrado é a backbone isolada — adicionar imunoterapia se indicado.',
    fases:[
      { nome:'Indução', ciclos:4, intervalo:'q21d', drogas:[
        { nome:'Carboplatina', dose:5, unid:'AUC', via:'IV', dias:'D1' },
        { nome:'Pemetrexede', dose:500, unid:'mg/m²', via:'IV', dias:'D1', infusao:'10 min' },
      ]},
      { nome:'Manutenção Pemetrexede', ciclos:0, intervalo:'q21d', drogas:[
        { nome:'Pemetrexede', dose:500, unid:'mg/m²', via:'IV', dias:'D1' },
      ]}
    ],
    emeto:'MODERADO', anafil:'Baixo', filgrastim:'Opcional' },

  // PULMÃO SCLC
  { id:'SCLC-CISVP16', nome:'Cisplatina + Etoposídeo', tipo:'Pulmão SCLC', contexto:'Metastático/Limitado',
    trialBase:'Turrisi (limitado) / Roth (extenso)',
    observacao:'Backbone de IMpower133 e CASPIAN (com atezo/durva). Esquema cadastrado é apenas QT — adicionar imunoterapia se indicado.',
    fases:[
      { nome:'CisVP16', ciclos:4, intervalo:'q21d', drogas:[
        { nome:'Cisplatina', dose:75, unid:'mg/m²', via:'IV', dias:'D1' },
        { nome:'Etoposídeo', dose:100, unid:'mg/m²', via:'IV', dias:'D1-D3', infusao:'60 min' },
      ]}
    ],
    emeto:'ALTO', anafil:'Baixo', filgrastim:'Recomendado' },

  // PRÓSTATA
  { id:'PROST-DOC', nome:'Docetaxel 75 mg/m² (mHSPC/CRPC)', tipo:'Próstata', contexto:'Metastático',
    trialBase:'CHAARTED / STAMPEDE / TAX 327', observacao:null,
    fases:[
      { nome:'Docetaxel', ciclos:6, intervalo:'q21d', drogas:[
        { nome:'Docetaxel', dose:75, unid:'mg/m²', via:'IV', dias:'D1', infusao:'1h' },
        { nome:'Prednisona', dose:10, unid:'mg', via:'VO', dias:'Contínua 5 mg 12/12h' },
      ]}
    ],
    emeto:'BAIXO', anafil:'Moderado', filgrastim:'Opcional' },

  // PÂNCREAS
  { id:'PANC-FOLFIRINOX', nome:'FOLFIRINOX', tipo:'Pâncreas', contexto:'Metastático/Adjuvante',
    trialBase:'PRODIGE 4 (meta) / PRODIGE-24 (adj mFOLFIRINOX)', observacao:null,
    fases:[
      { nome:'FOLFIRINOX', ciclos:12, intervalo:'q14d', drogas:[
        { nome:'Oxaliplatina', dose:85, unid:'mg/m²', via:'IV', dias:'D1', infusao:'2h' },
        { nome:'Irinotecano', dose:180, unid:'mg/m²', via:'IV', dias:'D1', infusao:'90 min' },
        { nome:'Ácido Folínico', dose:400, unid:'mg/m²', via:'IV', dias:'D1' },
        { nome:'5-FU infusão', dose:2400, unid:'mg/m²', via:'EV contínuo', dias:'D1-D2', infusao:'46h' },
      ]}
    ],
    emeto:'ALTO', anafil:'Moderado', filgrastim:'Recomendado' },

  { id:'PANC-GEMNAB', nome:'Gencitabina + nab-Paclitaxel', tipo:'Pâncreas', contexto:'Metastático',
    trialBase:'MPACT', observacao:null,
    fases:[
      { nome:'GemNab', ciclos:8, intervalo:'q28d', drogas:[
        { nome:'nab-Paclitaxel', dose:125, unid:'mg/m²', via:'IV', dias:'D1, D8, D15', infusao:'30 min' },
        { nome:'Gencitabina', dose:1000, unid:'mg/m²', via:'IV', dias:'D1, D8, D15', infusao:'30 min' },
      ]}
    ],
    emeto:'MODERADO', anafil:'Baixo', filgrastim:'Opcional' },

  // COLO ÚTERO
  { id:'COLO-CISSEM', nome:'Cisplatina 40 mg/m² semanal (concomitante RT)', tipo:'Colo Uterino', contexto:'Quimiorradioterapia',
    trialBase:'GOG 120 / Rose 1999',
    observacao:'KEYNOTE-A18 adicionou pembrolizumabe à QRT para doença localmente avançada. Esquema aqui é a QRT-base isolada.',
    fases:[
      { nome:'Cisplatina semanal', ciclos:6, intervalo:'q7d', drogas:[
        { nome:'Cisplatina', dose:40, unid:'mg/m²', via:'IV', dias:'D1 semanal', infusao:'1h' },
      ]}
    ],
    emeto:'MODERADO', anafil:'Baixo', filgrastim:'Opcional' },

  // GÁSTRICO
  { id:'GAST-FLOT', nome:'FLOT', tipo:'Gástrico', contexto:'Perioperatório',
    trialBase:'FLOT4-AIO', observacao:null,
    fases:[
      { nome:'FLOT', ciclos:8, intervalo:'q14d', drogas:[
        { nome:'Docetaxel', dose:50, unid:'mg/m²', via:'IV', dias:'D1' },
        { nome:'Oxaliplatina', dose:85, unid:'mg/m²', via:'IV', dias:'D1' },
        { nome:'Ácido Folínico', dose:200, unid:'mg/m²', via:'IV', dias:'D1' },
        { nome:'5-FU infusão', dose:2600, unid:'mg/m²', via:'EV contínuo', dias:'D1', infusao:'24h' },
      ]}
    ],
    emeto:'MODERADO', anafil:'Moderado', filgrastim:'Recomendado' },

  // BEXIGA
  { id:'BEX-DDMVAC', nome:'ddMVAC (Dose-Densa)', tipo:'Bexiga', contexto:'Neoadjuvante',
    trialBase:'VESPER', observacao:null,
    fases:[
      { nome:'ddMVAC', ciclos:6, intervalo:'q14d', drogas:[
        { nome:'Metotrexato', dose:30, unid:'mg/m²', via:'IV', dias:'D1' },
        { nome:'Vinblastina', dose:3, unid:'mg/m²', via:'IV', dias:'D2' },
        { nome:'Doxorrubicina', dose:30, unid:'mg/m²', via:'IV', dias:'D2' },
        { nome:'Cisplatina', dose:70, unid:'mg/m²', via:'IV', dias:'D2' },
      ]}
    ],
    emeto:'ALTO', anafil:'Moderado', filgrastim:'Obrigatório' },

  // OVÁRIO
  { id:'OVA-CARBOPAC', nome:'Carboplatina + Paclitaxel', tipo:'Ovário', contexto:'Adjuvante/Metastático',
    trialBase:'GOG-158',
    observacao:'ICON-7 e GOG-218 adicionaram bevacizumabe; KEYNOTE-826 (cervical) e PAOLA-1 (manutenção PARP) usam combinações. Esquema aqui é o QT-base isolado.',
    fases:[
      { nome:'CarboPac', ciclos:6, intervalo:'q21d', drogas:[
        { nome:'Paclitaxel', dose:175, unid:'mg/m²', via:'IV', dias:'D1', infusao:'3h' },
        { nome:'Carboplatina', dose:5, unid:'AUC', via:'IV', dias:'D1' },
      ]}
    ],
    emeto:'MODERADO', anafil:'Alto', filgrastim:'Opcional' },
];

// ═══ ANTIEMÉTICOS (NCCN/MASCC 2024) ═════════════════════════════════════════

function gerarAntieméticos(emetoPrincipal) {
  const emeto = (emetoPrincipal || '').toUpperCase();
  if (emeto.includes('ALTO')) {
    return {
      titulo:'Alto risco — Regime quádruplo (NCCN/MASCC 2024)',
      itens:[
        { droga:'Palonosetrona', dose:'0,25 mg', via:'IV', timing:'D1 30 min pré-QT', obrigatorio:true },
        { droga:'Aprepitanto', dose:'125 mg', via:'VO', timing:'D1 1h pré-QT; 80 mg D2-D3', obrigatorio:true },
        { droga:'Dexametasona', dose:'12 mg', via:'IV/VO', timing:'D1 pré-QT; 8 mg D2-D4', obrigatorio:true },
        { droga:'Olanzapina', dose:'5–10 mg', via:'VO', timing:'D1-D4 noite (após jantar)', obrigatorio:true },
        { droga:'Ondansetrona', dose:'8 mg', via:'VO', timing:'Resgate 8/8h SN', obrigatorio:false },
      ],
      observacoes:[
        'NEPA (netupitanto+palonosetrona) 300/0,5 mg VO substitui combinação de Palo+Aprepitanto.',
        'Olanzapina reduz náuseas tardias em 30-40% (J-FORCE).',
        'Manter dexametasona 4-8 mg D2-D4 para emese tardia.',
      ],
    };
  }
  if (emeto.includes('MODERADO')) {
    return {
      titulo:'Risco moderado — Regime triplo',
      itens:[
        { droga:'Palonosetrona', dose:'0,25 mg', via:'IV', timing:'D1 30 min pré-QT', obrigatorio:true },
        { droga:'Dexametasona', dose:'8 mg', via:'IV/VO', timing:'D1 pré-QT; 4 mg D2-D3', obrigatorio:true },
        { droga:'Aprepitanto', dose:'125 mg', via:'VO', timing:'D1 (carboplatina AUC≥4, ifosfamida)', obrigatorio:false },
        { droga:'Ondansetrona', dose:'8 mg', via:'VO', timing:'Resgate', obrigatorio:false },
      ],
      observacoes:['Considerar olanzapina 5 mg D1-D3 se náusea persistir.', 'Aprepitanto recomendado para carboplatina AUC ≥4.'],
    };
  }
  if (emeto.includes('BAIXO')) {
    return {
      titulo:'Baixo risco — Profilaxia simples',
      itens:[
        { droga:'Dexametasona', dose:'8 mg', via:'IV/VO', timing:'D1 pré-QT', obrigatorio:true },
        { droga:'Ondansetrona', dose:'8 mg', via:'VO', timing:'Resgate SN', obrigatorio:false },
      ],
      observacoes:['Sem necessidade de antagonista NK1 ou olanzapina.'],
    };
  }
  return {
    titulo:'Risco mínimo — Sem profilaxia rotineira',
    itens:[{ droga:'Ondansetrona', dose:'4–8 mg', via:'VO', timing:'Resgate', obrigatorio:false }],
    observacoes:['Antieméticos apenas se sintomas.'],
  };
}

// (Dose cumulativa importada de oncoProUtils.js)

// ═══ MOTOR DE FASES (v4.5) ══════════════════════════════════════════════════

function resolverFaseDoCiclo(protocolo, cicloAtual) {
  let acumulado = 0;
  for (let i = 0; i < protocolo.fases.length; i++) {
    const fase = protocolo.fases[i];
    const ilimitada = fase.ciclos === 0;
    const inicio = acumulado + 1;
    const fim = ilimitada ? Infinity : acumulado + fase.ciclos;
    if (cicloAtual >= inicio && cicloAtual <= fim) {
      return { fase, faseIndex:i, cicloDentroDaFase: cicloAtual - acumulado, inicio, fim: ilimitada ? -1 : fim };
    }
    if (ilimitada) return null;
    acumulado += fase.ciclos;
  }
  return null;
}

function resolverDose(droga, cicloDentroDaFase) {
  if (droga.esquemas && droga.esquemas.length > 0) {
    const porFase = droga.esquemas.find(e => e.ciclos !== 'todos' && Array.isArray(e.ciclos) && e.ciclos.includes(cicloDentroDaFase));
    if (porFase) return { dose:porFase.dose, unid:porFase.unid, obs:porFase.obs };
    const geral = droga.esquemas.find(e => e.ciclos === 'todos');
    if (geral) return { dose:geral.dose, unid:geral.unid, obs:geral.obs };
  }
  return { dose:droga.dose, unid:droga.unid };
}

// ═══ ESTILOS ════════════════════════════════════════════════════════════════
const cardStyle = { background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,.07)', border:'1px solid #E2E8F0', padding:20, marginBottom:16 };
const sectionTitle = { fontSize:18, fontWeight:900, color:N, textTransform:'uppercase', letterSpacing:.6, borderBottom:`3px solid ${G}`, paddingBottom:7, margin:'0 0 14px' };
const inputStyle = { border:'1px solid #CBD5E1', borderRadius:8, padding:'8px 12px', fontSize:13, width:'100%', boxSizing:'border-box' };
const btnPri = { background:G, color:'#fff', fontWeight:900, borderRadius:10, padding:'10px 20px', border:'none', cursor:'pointer' };
const btnSec = { background:'#fff', color:N, fontWeight:700, borderRadius:10, padding:'10px 20px', border:`2px solid ${N}`, cursor:'pointer' };

// ═══ AVISO DE APOIO À DECISÃO (sempre visível) ══════════════════════════════

function AvisoApoioDecisao() {
  return (
    <div style={{
      background:'#FFFBEB', border:`1px solid #FDE68A`, borderRadius:10,
      padding:'10px 14px', marginBottom:14, fontSize:12, color:'#78350F',
      display:'flex', gap:10, alignItems:'flex-start',
    }}>
      <span style={{ fontSize:18, lineHeight:1 }}>⚕️</span>
      <div>
        <strong>Módulo de apoio à decisão clínica.</strong> Os cálculos, sugestões de antieméticos
        e validações de APAC exibidos aqui devem ser <strong>revisados pelo médico assistente</strong>
        antes de qualquer prescrição ou autorização. Não substitui PCDT/CONITEC ou diretrizes oficiais.
      </div>
    </div>
  );
}

// ═══ TABS ═══════════════════════════════════════════════════════════════════

function Tabs({ aba, setAba }) {
  const items = [
    { id:'triagem',   label:'🩺 Triagem QT' },
    { id:'apac',      label:'📋 Conferência APAC' },
    { id:'antiem',    label:'💊 Antieméticos' },
    { id:'cumul',     label:'⚠️ Dose Cumulativa' },
    { id:'cidsigtap', label:'🔍 CID × SIGTAP' },
    { id:'capec',     label:'💊 Capecitabina VO' },
  ];
  return (
    <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap', background:'#fff', padding:8, borderRadius:12, border:'1px solid #E2E8F0' }}>
      {items.map(it => (
        <button key={it.id} onClick={() => setAba(it.id)}
          style={{
            padding:'10px 16px', border:'none', borderRadius:8, fontWeight:700, fontSize:13,
            cursor:'pointer', flex:'1 1 auto', minWidth:140,
            background: aba === it.id ? N : 'transparent',
            color: aba === it.id ? '#fff' : '#475569',
            transition:'all 0.15s',
          }}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ═══ DADOS CLÍNICOS NORMALIZADOS (hook) ═════════════════════════════════════

function useDadosClinicos(pac) {
  return useMemo(() => {
    const altura = normalizarAlturaCm(pac?.altura);
    const peso = normalizarPesoKg(pac?.peso);
    const sexo = normalizarSexo(pac?.sexo);
    const idade = calcularIdade(pac?.nasc);
    const creatinina = normalizarCreatinina(pac?.creatinina);
    const bsa = calcularBSA(altura, peso);
    const imc = calcularIMC(peso, altura);
    const clcrInfo = calcularClCr({ creatinina, peso, altura, idade, sexo });
    return {
      altura, peso, sexo, idade, creatinina, bsa, imc, clcrInfo,
      dadosCompletos: !!(altura && peso && sexo && idade != null),
      faltando: [
        !altura && 'altura',
        !peso && 'peso',
        !sexo && 'sexo',
        idade == null && 'data de nascimento',
      ].filter(Boolean),
    };
  }, [pac?.altura, pac?.peso, pac?.sexo, pac?.nasc, pac?.creatinina]);
}

// ═══ TAB 1: TRIAGEM QT ══════════════════════════════════════════════════════

function TriagemQT({ pac, up }) {
  const dados = useDadosClinicos(pac);
  const [protId, setProtId] = useState('');
  const [ciclo, setCiclo] = useState(1);
  const [busca, setBusca] = useState('');

  const protocolo = protId ? PROTOCOLOS.find(p => p.id === protId) : null;
  const faseResolvida = protocolo ? resolverFaseDoCiclo(protocolo, ciclo) : null;
  const protocolosFiltrados = busca
    ? PROTOCOLOS.filter(p => (p.nome + p.tipo + (p.trialBase || '')).toLowerCase().includes(busca.toLowerCase()))
    : PROTOCOLOS;

  // ✓ v1.1.2: bloqueio específico por droga AUC — não bloqueia página inteira
  const protocoloUsaAUC = protocolo?.fases?.some(f => f.drogas?.some(d => d.unid === 'AUC'));
  const aucBloqueado = protocoloUsaAUC && !dados.clcrInfo;

  // Para cálculos não-AUC, basta peso+altura. Só sexo+idade+creat são essenciais para AUC.
  const podeCalcularBasico = !!(dados.peso && dados.altura);

  return (
    <div>
      <AvisoApoioDecisao />

      {!podeCalcularBasico && (
        <div style={{ ...cardStyle, background:'#FEE2E2', border:`2px solid ${VM}` }}>
          <p style={{ margin:0, fontWeight:800, color:'#991B1B', fontSize:14 }}>
            ⛔ Cálculo bloqueado — peso e altura obrigatórios
          </p>
          <p style={{ margin:'6px 0 0', fontSize:13, color:'#7F1D1D' }}>
            Preencha no app principal: <strong>{[!dados.peso && 'peso', !dados.altura && 'altura'].filter(Boolean).join(', ')}</strong>.
            Não é seguro calcular dose oncológica sem esses dados.
          </p>
        </div>
      )}

      <div style={cardStyle}>
        <h3 style={sectionTitle}>Triagem QT — Cálculo de Doses por Ciclo</h3>
        <p style={{ color:'#6B7280', fontSize:13, margin:'0 0 14px' }}>
          {pac?.nome ? `Paciente: ${pac.nome}` : '⚠️ Nenhum paciente carregado'} ·
          BSA: <strong>{fmtNum(dados.bsa, 2)} m²</strong> ·
          IMC: <strong>{fmtNum(dados.imc, 1)}</strong> ·
          ClCr: <strong>{dados.clcrInfo ? fmtNum(dados.clcrInfo.clcr, 0) + ' mL/min' : '— (sexo/creat ausentes)'}</strong>
          {dados.clcrInfo?.obeso && <span style={{ color:AM, marginLeft:8 }}>⚠️ Peso ajustado IMC≥30</span>}
          {dados.clcrInfo?.caquetico && <span style={{ color:AM, marginLeft:8 }}>⚠️ IMC&lt;18,5 — ClCr pode ser impreciso, revisar dose manualmente</span>}
          {dados.clcrInfo?.capAplicado && <span style={{ color:AM, marginLeft:8 }}>⚠️ ClCr capado 125</span>}
        </p>

        <input type="text" placeholder="🔎 Buscar protocolo (mama, FOLFOX, FLOT...)" value={busca}
          onChange={e => setBusca(e.target.value)} style={{ ...inputStyle, marginBottom:12 }} />

        <select value={protId} onChange={e => { setProtId(e.target.value); setCiclo(1); }} style={inputStyle}
          disabled={!podeCalcularBasico}>
          <option value="">— Selecione o protocolo —</option>
          {protocolosFiltrados.map(p => (
            <option key={p.id} value={p.id}>{p.tipo} · {p.nome}</option>
          ))}
        </select>

        {aucBloqueado && (
          <div style={{
            marginTop:12, padding:14, background:'#FEE2E2', borderRadius:10,
            border:`2px solid ${VM}`,
          }}>
            <p style={{ margin:0, fontWeight:800, color:'#991B1B', fontSize:13 }}>
              ⛔ Este protocolo usa carboplatina por AUC (Calvert)
            </p>
            <p style={{ margin:'6px 0 0', fontSize:12, color:'#7F1D1D' }}>
              Para calcular ClCr são necessários: <strong>{[!dados.creatinina && 'creatinina', !dados.sexo && 'sexo', dados.idade == null && 'data de nascimento'].filter(Boolean).join(', ') || 'dados completos do paciente'}</strong>.
              Preencha no app principal.
            </p>
          </div>
        )}

        {protocolo && (
          <div style={{ marginTop:16 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:12, padding:'4px 10px', background:T, color:'#fff', borderRadius:14, fontWeight:700 }}>
                {protocolo.contexto}
              </span>
              {protocolo.trialBase && (
                <span style={{ fontSize:11, color:N, fontStyle:'italic' }}>📚 Trial base: {protocolo.trialBase}</span>
              )}
              <span style={{ fontSize:11, padding:'2px 8px', background:'#FEE2E2', color:'#991B1B', borderRadius:10, fontWeight:600 }}>
                Emeto: {protocolo.emeto}
              </span>
              {protocolo.anafil && protocolo.anafil !== 'Baixo' && (
                <span style={{ fontSize:11, padding:'2px 8px', background:'#FEF3C7', color:'#92400E', borderRadius:10, fontWeight:600 }}>
                  Anafil: {protocolo.anafil}
                </span>
              )}
            </div>

            {protocolo.observacao && (
              <div style={{ marginTop:10, padding:10, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, fontSize:12, color:'#1E40AF' }}>
                ℹ️ <strong>Observação:</strong> {protocolo.observacao}
              </div>
            )}

            <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:14, flexWrap:'wrap' }}>
              <button onClick={() => setCiclo(c => Math.max(1, c - 1))} style={{ ...btnSec, padding:'6px 16px' }}>−</button>
              <span style={{ fontSize:18, fontWeight:900, color:N }}>Ciclo {ciclo}</span>
              <button onClick={() => setCiclo(c => c + 1)} style={{ ...btnSec, padding:'6px 16px' }}>+</button>
              {faseResolvida && (
                <span style={{ fontSize:13, color:T, fontWeight:600 }}>
                  Fase: <strong>{faseResolvida.fase.nome}</strong> · ciclo {faseResolvida.cicloDentroDaFase} da fase
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {protocolo && faseResolvida && podeCalcularBasico && !aucBloqueado && (
        <div style={cardStyle}>
          <h4 style={{ ...sectionTitle, fontSize:16 }}>Doses calculadas — Ciclo {ciclo}</h4>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:N, color:'#fff' }}>
                <th style={{ padding:'10px 8px', textAlign:'left' }}>Droga</th>
                <th style={{ padding:'10px 8px' }}>Dose protocolo</th>
                <th style={{ padding:'10px 8px' }}>Cálculo</th>
                <th style={{ padding:'10px 8px' }}>Dose absoluta</th>
                <th style={{ padding:'10px 8px' }}>Via / Dias</th>
              </tr>
            </thead>
            <tbody>
              {faseResolvida.fase.drogas.map((d, i) => {
                const { dose, unid, obs } = resolverDose(d, faseResolvida.cicloDentroDaFase);
                let absoluta = null, arredondada = null, metodo = '';
                if (unid === 'mg/m²') {
                  absoluta = dose * dados.bsa;
                  arredondada = absoluta < 10 ? +absoluta.toFixed(1) : Math.round(absoluta / 5) * 5;
                  metodo = `${dose} × ${fmtNum(dados.bsa, 2)} m²`;
                } else if (unid === 'mg/kg') {
                  absoluta = dose * dados.peso;
                  arredondada = Math.round(absoluta);
                  metodo = `${dose} × ${dados.peso} kg`;
                } else if (unid === 'AUC') {
                  if (dados.clcrInfo) {
                    absoluta = dose * (dados.clcrInfo.clcr + 25);
                    arredondada = Math.round(absoluta / 50) * 50;
                    metodo = `AUC ${dose} × (ClCr ${fmtNum(dados.clcrInfo.clcr, 0)} + 25)`;
                  } else {
                    metodo = 'Calvert bloqueado — falta creat/sexo';
                  }
                } else if (unid === 'mg') {
                  absoluta = dose; arredondada = dose; metodo = 'dose fixa';
                } else {
                  metodo = 'VO/EV contínua';
                }
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#F8FAFC' : '#fff', borderBottom:'1px solid #E5E7EB' }}>
                    <td style={{ padding:'10px 8px', fontWeight:700, color:N }}>
                      {d.nome}
                      {obs && <div style={{ fontSize:11, color:T, fontWeight:400 }}>{obs}</div>}
                    </td>
                    <td style={{ padding:'10px 8px', textAlign:'center' }}>{dose} {unid}</td>
                    <td style={{ padding:'10px 8px', textAlign:'center', fontSize:11, color:'#6B7280' }}>{metodo}</td>
                    <td style={{ padding:'10px 8px', textAlign:'center', fontWeight:900, color:G, fontSize:14 }}>
                      {arredondada != null ? `${arredondada} mg` : '—'}
                    </td>
                    <td style={{ padding:'10px 8px', fontSize:12 }}>
                      {d.via} · {d.dias}
                      {d.infusao && <div style={{ fontSize:11, color:'#6B7280' }}>{d.infusao}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {dados.clcrInfo && (
            <div style={{ marginTop:14, padding:12, background:'#EFF6FF', borderRadius:8, fontSize:12, color:'#1E40AF' }}>
              📐 <strong>Cockcroft-Gault:</strong> Peso usado {fmtNum(dados.clcrInfo.pesoUsado, 1)} kg
              {dados.clcrInfo.obeso && ' (ajustado IMC≥30)'}
              {dados.clcrInfo.caquetico && ' (caquexia)'} ·
              ClCr {fmtNum(dados.clcrInfo.bruto, 0)} mL/min
              {dados.clcrInfo.capAplicado && ` (capado em 125)`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ TAB 2: CONFERÊNCIA APAC ════════════════════════════════════════════════

function ConferenciaAPACMini({ pac, up }) {
  const dados = useDadosClinicos(pac);

  // ✓ v1.1.4: usa validarAPACBase() — fonte ÚNICA compartilhada com agente anti-glosa
  const validacoes = useMemo(() => validarAPACBase(pac), [pac]);

  const criticos = validacoes.filter(e => e.critico);
  const alertas = validacoes.filter(e => !e.critico);

  // ✓ v1.1.4: usa BLOQUEANTES_APAC / BLOQUEANTES_CADASTRAIS importados (não locais)
  const bloqueantes = validacoes.filter(v => v.critico && BLOQUEANTES_APAC.has(v.campo));
  const bloqueantesCadastrais = validacoes.filter(v => BLOQUEANTES_CADASTRAIS.has(v.campo) && v.tipo === 'invalido');

  // Separar pendência de campo vs regra relacional
  const pendCampos = validacoes.filter(v => v.tipo === 'ausente' || v.tipo === 'invalido');
  const pendRegras = validacoes.filter(v => v.tipo === 'incompativel');

  const totalCampos = 17;
  const completos = Math.max(0, totalCampos - pendCampos.length);
  const score = Math.max(0, 100 - criticos.length * 8 - alertas.length * 3);

  // ✓ v1.1.4: nível APAC vem da função central
  const nivel = calcularNivelAPAC(validacoes);
  const cor = nivel === 'APROVADA' ? VE
            : nivel === 'APROVADA COM ALERTAS' ? AM
            : nivel === 'RISCO' ? AM : VM;
  const bg = nivel === 'APROVADA' ? '#D1FAE5'
           : nivel === 'APROVADA COM ALERTAS' ? '#FEF3C7'
           : nivel === 'RISCO' ? '#FEF3C7' : '#FEE2E2';

  const valCID = pac?.cid && pac?.cod_proc ? validarCIDSIGTAP(pac.cid, pac.cod_proc) : null;

  return (
    <div>
      <AvisoApoioDecisao />

      <div style={{ ...cardStyle, background: bg, border:`2px solid ${cor}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
          <div>
            <p style={{ margin:0, fontSize:11, color:cor, fontWeight:700 }}>SCORE ANTI-GLOSA</p>
            <p style={{ margin:'4px 0 0', fontSize:36, fontWeight:900, color:cor }}>{score}</p>
            <p style={{ margin:0, fontSize:16, fontWeight:800, color:cor }}>{nivel}</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ margin:0, fontSize:13, color:cor, fontWeight:600 }}>
              {completos}/{totalCampos} campos preenchidos
            </p>
            <p style={{ margin:'4px 0 0', fontSize:12, color:cor }}>
              {criticos.length} pendência(s) crítica(s)
            </p>
          </div>
        </div>
      </div>

      {validacoes.length > 0 && (
        <div style={cardStyle}>
          <h4 style={{ ...sectionTitle, fontSize:16 }}>⚠️ Pendências da APAC</h4>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {validacoes.map((e, i) => (
              <span key={i} style={{
                fontSize:12, padding:'5px 12px', borderRadius:18, fontWeight:600,
                background: e.critico ? '#FEE2E2' : '#FEF3C7',
                color: e.critico ? '#991B1B' : '#92400E',
                border: `1px solid ${e.critico ? '#FECACA' : '#FDE68A'}`,
              }}>
                {e.critico ? '⛔' : '⚠️'} {e.label}
                {e.tipo === 'invalido' && ' (inválido)'}
              </span>
            ))}
          </div>
        </div>
      )}

      {valCID && (
        <div style={{ ...cardStyle, background: valCID.ok ? '#ECFDF5' : '#FEE2E2', border:`1px solid ${valCID.ok ? '#A7F3D0' : '#FECACA'}` }}>
          <h4 style={{ margin:'0 0 8px', fontSize:14, fontWeight:800, color: valCID.ok ? '#065F46' : '#991B1B' }}>
            🔍 Validação CID × SIGTAP — Regra v{REGRAS_CID_SIGTAP.versao}
          </h4>
          <p style={{ margin:0, fontSize:13, color: valCID.ok ? '#065F46' : '#991B1B' }}>{valCID.msg}</p>
          {valCID.alerta && (
            <p style={{ margin:'6px 0 0', fontSize:12, color:'#78350F', fontStyle:'italic' }}>
              ⚠️ Tabela local não cobre este CID. Confirmar manualmente em PCDT/CONITEC.
            </p>
          )}
        </div>
      )}

      <div style={cardStyle}>
        <h4 style={{ ...sectionTitle, fontSize:16 }}>Dados clínicos para APAC</h4>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>CID-10 *</label>
            <input value={pac?.cid || ''} onChange={e => up('cid', e.target.value.toUpperCase())} placeholder="C50.9" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>SIGTAP * (10 dígitos)</label>
            <input value={pac?.cod_proc || ''} onChange={e => up('cod_proc', e.target.value)} placeholder="0304020315" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>Estadiamento *</label>
            <input value={pac?.estadio || ''} onChange={e => up('estadio', e.target.value)} placeholder="IIA, IIIB, IV..." style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>TNM</label>
            <input value={pac?.tnm || ''} onChange={e => up('tnm', e.target.value)} placeholder="T2N1M0" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>Linha terapêutica *</label>
            <select value={pac?.linha || ''} onChange={e => up('linha', e.target.value)} style={inputStyle}>
              <option value="">—</option>
              <option>1ª Linha</option><option>2ª Linha</option>
              <option>3ª Linha</option><option>Manutenção</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>Intenção *</label>
            <select value={pac?.intencao || ''} onChange={e => up('intencao', e.target.value)} style={inputStyle}>
              <option value="">—</option>
              <option>Curativa</option><option>Adjuvante</option>
              <option>Neoadjuvante</option><option>Paliativa</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ TAB 3: ANTIEMÉTICOS ════════════════════════════════════════════════════

function AntieméticosTab({ pac }) {
  const [risco, setRisco] = useState(pac?.protocolo_emeto || 'ALTO');
  const regime = gerarAntieméticos(risco);

  return (
    <div>
      <AvisoApoioDecisao />

      <div style={cardStyle}>
        <h3 style={sectionTitle}>💊 Antieméticos Modernos (NCCN/MASCC 2024)</h3>
        <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>
          Risco emetogênico do protocolo
        </label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['ALTO','MODERADO','BAIXO','MÍNIMO'].map(r => (
            <button key={r} onClick={() => setRisco(r)}
              style={{
                flex:'1 1 auto', minWidth:120, padding:'10px', border:'2px solid', borderRadius:8, fontWeight:700, fontSize:13,
                cursor:'pointer',
                borderColor: risco === r ? T : '#D1D5DB',
                background: risco === r ? T : '#fff',
                color: risco === r ? '#fff' : '#374151',
              }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h4 style={{ ...sectionTitle, fontSize:16 }}>{regime.titulo}</h4>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:520 }}>
            <thead>
              <tr style={{ background:N, color:'#fff' }}>
                <th style={{ padding:'10px 8px', textAlign:'left' }}>Droga</th>
                <th style={{ padding:'10px 8px' }}>Dose</th>
                <th style={{ padding:'10px 8px' }}>Via</th>
                <th style={{ padding:'10px 8px', textAlign:'left' }}>Timing</th>
                <th style={{ padding:'10px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {regime.itens.map((it, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#F8FAFC' : '#fff', borderBottom:'1px solid #E5E7EB' }}>
                  <td style={{ padding:'10px 8px', fontWeight:700, color:N }}>{it.droga}</td>
                  <td style={{ padding:'10px 8px', textAlign:'center' }}>{it.dose}</td>
                  <td style={{ padding:'10px 8px', textAlign:'center' }}>{it.via}</td>
                  <td style={{ padding:'10px 8px', fontSize:12 }}>{it.timing}</td>
                  <td style={{ padding:'10px 8px', textAlign:'center' }}>
                    <span style={{
                      padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:700,
                      background: it.obrigatorio ? '#FEE2E2' : '#F3F4F6',
                      color: it.obrigatorio ? '#991B1B' : '#374151',
                    }}>
                      {it.obrigatorio ? 'OBRIGATÓRIO' : 'OPCIONAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {regime.observacoes && regime.observacoes.length > 0 && (
          <div style={{ marginTop:14, padding:12, background:'#FFFBEB', borderRadius:8, border:'1px solid #FDE68A' }}>
            <p style={{ margin:'0 0 6px', fontSize:12, fontWeight:700, color:'#92400E' }}>📝 Observações clínicas</p>
            <ul style={{ margin:0, paddingLeft:20, fontSize:12, color:'#78350F' }}>
              {regime.observacoes.map((o, i) => <li key={i} style={{ marginBottom:4 }}>{o}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ TAB 4: DOSE CUMULATIVA (com sync por paciente + override) ═════════════

function DoseCumulativaTab({ pac, up }) {
  const [historico, setHistorico] = useState(pac?.historico_doses || []);
  const [drogaNova, setDrogaNova] = useState('');
  const [doseNova, setDoseNova] = useState('');
  const [overrideAtivo, setOverrideAtivo] = useState(false);
  const [justificativa, setJustificativa] = useState('');

  // ✓ v1.1: SYNC quando troca paciente (bug crítico v1.0)
  // ✓ v1.1.1: chave robusta — cobre id/pacID/pacienteId/cns/nome+nasc
  const pacienteKey = pac?.id || pac?.pacID || pac?.pacienteId || pac?.cns || `${pac?.nome || ''}-${pac?.nasc || ''}`;

  useEffect(() => {
    setHistorico(pac?.historico_doses || []);
    setOverrideAtivo(false);
    setJustificativa('');
    setDrogaNova('');
    setDoseNova('');
  }, [pacienteKey, pac?.historico_doses]);

  const doseNum = parseNumeroBR(doseNova);
  const validacao = drogaNova && doseNum != null ? validarDoseCumulativa(historico, drogaNova, doseNum) : null;
  const requerOverride = validacao && validacao.nivel === 'BLOQUEIO';

  const adicionar = () => {
    if (!drogaNova || doseNum == null) {
      alert('Informe a droga e a dose (use vírgula ou ponto).');
      return;
    }
    if (requerOverride && (!overrideAtivo || justificativa.trim().length < 10)) {
      alert('Dose cumulativa em limite crítico. Ative o override e escreva justificativa médica (≥ 10 caracteres).');
      return;
    }
    const novo = [
      ...historico,
      {
        droga: drogaNova,
        dose: doseNum,
        // ✓ v1.1.1: salva unidade conforme a regra da droga (bleomicina = "U")
        unidade: validacao?.regra?.unidade || 'mg/m²',
        data: new Date().toISOString().split('T')[0],
        override: requerOverride ? justificativa : null,
      },
    ];
    setHistorico(novo);
    up && up('historico_doses', novo);
    setDoseNova('');
    setOverrideAtivo(false);
    setJustificativa('');
  };

  const remover = idx => {
    if (!confirm('Remover este registro de dose?')) return;
    const novo = historico.filter((_, i) => i !== idx);
    setHistorico(novo);
    up && up('historico_doses', novo);
  };

  return (
    <div>
      <AvisoApoioDecisao />

      <div style={cardStyle}>
        <h3 style={sectionTitle}>⚠️ Dose Cumulativa</h3>
        <p style={{ color:'#6B7280', fontSize:13, margin:'0 0 14px' }}>
          Rastreio de Doxo, Epi, Cis, Bleo, Oxa. Paciente atual: <strong>{pac?.nome || '—'}</strong>.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr auto', gap:10, marginBottom:14 }}>
          <select value={drogaNova} onChange={e => setDrogaNova(e.target.value)} style={inputStyle}>
            <option value="">— Droga —</option>
            {REGRAS_DOSE_CUMULATIVA.map(r => <option key={r.droga} value={r.droga}>{r.droga}</option>)}
          </select>
          <input type="text" value={doseNova} onChange={e => setDoseNova(e.target.value)}
            placeholder="Dose deste ciclo (ex: 60 ou 60,5)" style={inputStyle} />
          <button onClick={adicionar}
            style={{ ...btnPri, background: requerOverride && !overrideAtivo ? VM : G }}>
            {requerOverride ? '⚠️ Adicionar c/ override' : '+ Adicionar'}
          </button>
        </div>

        {validacao && (
          <div style={{
            padding:14, borderRadius:10, marginBottom:10,
            background: validacao.nivel === 'OK' ? '#ECFDF5' : validacao.nivel === 'ALERTA' ? '#FEF3C7' : '#FEE2E2',
            border: `2px solid ${validacao.nivel === 'OK' ? '#A7F3D0' : validacao.nivel === 'ALERTA' ? '#FDE68A' : '#FECACA'}`,
          }}>
            <p style={{ margin:0, fontWeight:800, fontSize:13,
              color: validacao.nivel === 'OK' ? '#065F46' : validacao.nivel === 'ALERTA' ? '#92400E' : '#991B1B' }}>
              {validacao.nivel === 'OK' && '✓ '}{validacao.nivel === 'ALERTA' && '⚠️ '}{validacao.nivel === 'BLOQUEIO' && '⛔ '}
              {validacao.mensagem}
            </p>
            <div style={{ marginTop:8, height:8, background:'#fff', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(100, validacao.pct)}%`,
                background: validacao.nivel === 'OK' ? VE : validacao.nivel === 'ALERTA' ? AM : VM,
                transition:'width .3s' }} />
            </div>

            {requerOverride && (
              <div style={{ marginTop:14, padding:12, background:'#FEE2E2', borderRadius:8, border:'2px dashed #DC2626' }}>
                <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontWeight:700, color:'#991B1B', fontSize:13 }}>
                  <input type="checkbox" checked={overrideAtivo} onChange={e => setOverrideAtivo(e.target.checked)}
                    style={{ width:18, height:18, accentColor:'#DC2626' }} />
                  Ativar override médico (sob minha responsabilidade)
                </label>
                {overrideAtivo && (
                  <textarea value={justificativa} onChange={e => setJustificativa(e.target.value)}
                    placeholder="Justificativa clínica obrigatória (mín. 10 caracteres)..."
                    rows={3}
                    style={{ ...inputStyle, marginTop:8, resize:'vertical', fontFamily:'inherit' }} />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {historico.length > 0 && (
        <div style={cardStyle}>
          <h4 style={{ ...sectionTitle, fontSize:16 }}>Histórico de exposição</h4>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:480 }}>
              <thead>
                <tr style={{ background:N, color:'#fff' }}>
                  <th style={{ padding:'10px 8px', textAlign:'left' }}>Droga</th>
                  <th style={{ padding:'10px 8px' }}>Dose</th>
                  <th style={{ padding:'10px 8px' }}>Data</th>
                  <th style={{ padding:'10px 8px' }}>Override</th>
                  <th style={{ padding:'10px 8px' }}>—</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #E5E7EB' }}>
                    <td style={{ padding:'8px', fontWeight:700, color:N }}>{h.droga}</td>
                    <td style={{ padding:'8px', textAlign:'center' }}>{h.dose} {h.unidade || 'mg/m²'}</td>
                    <td style={{ padding:'8px', textAlign:'center', fontSize:12, color:'#6B7280' }}>{h.data}</td>
                    <td style={{ padding:'8px', textAlign:'center', fontSize:11, color: h.override ? VM : '#9CA3AF' }}>
                      {h.override ? `⚠️ ${h.override.substring(0, 25)}...` : '—'}
                    </td>
                    <td style={{ padding:'8px', textAlign:'center' }}>
                      <button onClick={() => remover(i)} style={{ background:'none', border:'none', color:VM, cursor:'pointer', fontWeight:700 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ TAB 5: CID × SIGTAP ════════════════════════════════════════════════════

function CIDSIGTAPTab({ pac }) {
  const [cid, setCID] = useState(pac?.cid || '');
  const [sigtap, setSigtap] = useState(pac?.cod_proc || '');

  useEffect(() => {
    setCID(pac?.cid || '');
    setSigtap(pac?.cod_proc || '');
  }, [pac?.pacID, pac?.cns]);

  const resultado = cid && sigtap ? validarCIDSIGTAP(cid, sigtap) : null;

  return (
    <div>
      <AvisoApoioDecisao />

      <div style={cardStyle}>
        <h3 style={sectionTitle}>🔍 Validação Cruzada CID-10 × SIGTAP</h3>
        <p style={{ color:'#6B7280', fontSize:13, margin:'0 0 4px' }}>
          Tabela versão <strong>{REGRAS_CID_SIGTAP.versao}</strong> · {REGRAS_CID_SIGTAP.fonte}
        </p>
        <p style={{ color:'#6B7280', fontSize:13, margin:'0 0 14px' }}>
          Principal causa de glosa APAC: incompatibilidade CID × procedimento.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>CID-10</label>
            <input value={cid} onChange={e => setCID(e.target.value.toUpperCase())} placeholder="Ex: C50.9" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>SIGTAP (10 dígitos)</label>
            <input value={sigtap} onChange={e => setSigtap(e.target.value)} placeholder="0304020315" style={inputStyle} />
          </div>
        </div>

        {resultado && (
          <div style={{
            marginTop:14, padding:16, borderRadius:10,
            background: resultado.ok ? '#ECFDF5' : '#FEE2E2',
            border: `2px solid ${resultado.ok ? '#A7F3D0' : '#FECACA'}`,
          }}>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color: resultado.ok ? '#065F46' : '#991B1B' }}>
              {resultado.msg}
            </p>
            {resultado.alerta && (
              <p style={{ margin:'6px 0 0', fontSize:12, color:'#78350F' }}>
                ⚠️ Sem regra cadastrada — verifique no PCDT/SBOC.
              </p>
            )}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h4 style={{ ...sectionTitle, fontSize:16 }}>Tabela local de compatibilidade</h4>
        <p style={{ fontSize:12, color:'#6B7280', margin:'0 0 10px' }}>
          Regras simplificadas para Hospital do Bem. Cobertura limitada — consultar PCDT/CONITEC para casos não listados.
        </p>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:400 }}>
            <thead>
              <tr style={{ background:N, color:'#fff' }}>
                <th style={{ padding:'8px', textAlign:'left' }}>CID</th>
                <th style={{ padding:'8px', textAlign:'left' }}>SIGTAPs aceitos</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(REGRAS_CID_SIGTAP.mapa).slice(0, 14).map(([k, v]) => (
                <tr key={k} style={{ borderBottom:'1px solid #E5E7EB' }}>
                  <td style={{ padding:'8px', fontWeight:700, color:N }}>{k}</td>
                  <td style={{ padding:'8px', fontFamily:'monospace', fontSize:11 }}>{v.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══ TAB 6: CAPECITABINA VO (com ajuste renal obrigatório) ══════════════════

function CapecitabinaTab({ pac }) {
  const dados = useDadosClinicos(pac);
  const [dose, setDose] = useState(1000);

  // ✓ v1.1.1: bloqueia se peso/altura ausentes
  if (!dados.altura || !dados.peso) {
    return (
      <div>
        <AvisoApoioDecisao />
        <div style={{ ...cardStyle, background:'#FEE2E2', border:`2px solid ${VM}` }}>
          <h3 style={sectionTitle}>💊 Capecitabina VO</h3>
          <p style={{ margin:0, fontWeight:800, color:'#991B1B', fontSize:14 }}>
            ⛔ Cálculo bloqueado
          </p>
          <p style={{ margin:'6px 0 0', fontSize:13, color:'#7F1D1D' }}>
            Informe <strong>altura</strong> e <strong>peso</strong> reais do paciente no app principal antes de calcular dose oncológica.
          </p>
        </div>
      </div>
    );
  }

  // ✓ v1.1.1: bloqueia se ClCr não for calculável (creat / sexo / idade ausente)
  if (!dados.clcrInfo) {
    const faltando = [
      !dados.creatinina && 'creatinina',
      !dados.sexo && 'sexo',
      dados.idade == null && 'data de nascimento',
    ].filter(Boolean);
    return (
      <div>
        <AvisoApoioDecisao />
        <div style={{ ...cardStyle, background:'#FEE2E2', border:`2px solid ${VM}` }}>
          <h3 style={sectionTitle}>💊 Capecitabina VO</h3>
          <p style={{ margin:0, fontWeight:800, color:'#991B1B', fontSize:14 }}>
            ⛔ Cálculo bloqueado — ClCr obrigatório
          </p>
          <p style={{ margin:'6px 0 0', fontSize:13, color:'#7F1D1D' }}>
            Para calcular dose de capecitabina é necessário ClCr (Cockcroft-Gault).
            Preencha no app principal: <strong>{faltando.join(', ')}</strong>.
          </p>
          <p style={{ margin:'8px 0 0', fontSize:12, color:'#7F1D1D', fontStyle:'italic' }}>
            Capecitabina contraindicada em ClCr &lt; 30 mL/min e requer redução em 30-50 mL/min.
          </p>
        </div>
      </div>
    );
  }

  const resultado = calcularCapecitabina({
    dosePorM2: dose,
    bsa: dados.bsa,
    clcr: dados.clcrInfo.clcr,
  });

  return (
    <div>
      <AvisoApoioDecisao />

      <div style={cardStyle}>
        <h3 style={sectionTitle}>💊 Capecitabina VO — Posologia por Comprimido</h3>
        <p style={{ color:'#6B7280', fontSize:13, margin:'0 0 14px' }}>
          Paciente: <strong>{pac?.nome || '—'}</strong> · BSA: <strong>{fmtNum(dados.bsa, 2)} m²</strong>
          {dados.clcrInfo && ` · ClCr: ${fmtNum(dados.clcrInfo.clcr, 0)} mL/min`}
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>Dose por m² (protocolo)</label>
            <select value={dose} onChange={e => setDose(parseFloat(e.target.value))} style={inputStyle}>
              <option value={1000}>1000 mg/m² (CAPOX/Mono)</option>
              <option value={1250}>1250 mg/m² (XELODA mono)</option>
              <option value={825}>825 mg/m² (concomitante RT)</option>
              <option value={750}>750 mg/m² (idoso/ajuste)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>Dose total/dia</label>
            <input value={resultado.erro ? '—' : resultado.doseTotalDia + ' mg'} disabled
              style={{ ...inputStyle, background:'#F3F4F6', fontWeight:700, color: resultado.erro ? VM : G }} />
          </div>
        </div>

        {resultado.erro ? (
          <div style={{ padding:16, background:'#FEE2E2', borderRadius:10, border:`2px solid ${VM}` }}>
            <p style={{ margin:0, fontWeight:800, color:'#991B1B', fontSize:14 }}>
              ⛔ {resultado.erro}
            </p>
          </div>
        ) : (
          <>
            {resultado.fatorAjuste < 1 && (
              <div style={{ padding:12, background:'#FEF3C7', borderRadius:8, border:'1px solid #FDE68A', marginBottom:12 }}>
                <p style={{ margin:0, fontWeight:800, color:'#92400E', fontSize:13 }}>
                  ⚠️ Ajuste renal aplicado: {resultado.motivoAjuste}
                </p>
              </div>
            )}

            {resultado.alertaMonitor && (
              <div style={{ padding:12, background:'#EFF6FF', borderRadius:8, border:'1px solid #BFDBFE', marginBottom:12 }}>
                <p style={{ margin:0, fontWeight:700, color:'#1E40AF', fontSize:13 }}>
                  ℹ️ {resultado.alertaMonitor}
                </p>
              </div>
            )}

            <div style={{ background:'#F0F9FF', borderRadius:10, padding:16, border:'1px solid #BAE6FD' }}>
              <h4 style={{ margin:'0 0 10px', fontSize:14, fontWeight:800, color:N }}>📋 Posologia recomendada</h4>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ background:'#fff', padding:12, borderRadius:8, border:`2px solid ${G}` }}>
                  <p style={{ margin:0, fontSize:11, color:G, fontWeight:700 }}>☀️ MANHÃ</p>
                  <p style={{ margin:'4px 0', fontSize:20, fontWeight:900, color:N }}>{resultado.porTomada} mg</p>
                  <p style={{ margin:0, fontSize:13, color:'#475569', fontWeight:600 }}>{resultado.manha}</p>
                </div>
                <div style={{ background:'#fff', padding:12, borderRadius:8, border:`2px solid ${T}` }}>
                  <p style={{ margin:0, fontSize:11, color:T, fontWeight:700 }}>🌙 NOITE</p>
                  <p style={{ margin:'4px 0', fontSize:20, fontWeight:900, color:N }}>{resultado.porTomada} mg</p>
                  <p style={{ margin:0, fontSize:13, color:'#475569', fontWeight:600 }}>{resultado.noite}</p>
                </div>
              </div>
              <p style={{ margin:'12px 0 0', fontSize:12, color:'#1E40AF', fontStyle:'italic' }}>
                💡 {resultado.obs}
              </p>
            </div>
          </>
        )}

        <div style={{ marginTop:14, padding:12, background:'#FFFBEB', borderRadius:8, border:'1px solid #FDE68A', fontSize:12, color:'#78350F' }}>
          <strong>⚠️ Regras renais (regra institucional: {REGRA_CAPECITABINA_PADRAO === 'conservadora' ? 'CONSERVADORA' : 'EMA flexível'}):</strong>
          <ul style={{ margin:'6px 0 0', paddingLeft:18 }}>
            {REGRA_CAPECITABINA_PADRAO === 'conservadora' ? (
              <li>ClCr 30–50 mL/min: <strong>redução institucional de 25%</strong> aplicada automaticamente (alinhada FDA Xeloda).</li>
            ) : (
              <>
                <li>ClCr 30–50 mL/min + dose inicial ≥ 1200 mg/m²: <strong>redução de 25%</strong> (regra EMA).</li>
                <li>ClCr 30–50 mL/min + dose inicial &lt; 1200 mg/m²: <strong>manter dose</strong> com monitorização de toxicidade.</li>
              </>
            )}
            <li>ClCr &lt; 30 mL/min: <strong>contraindicado — cálculo bloqueado</strong></li>
            <li>Bilirrubina &gt; 3× LSN: ajuste individualizado (manual)</li>
            <li>Síndrome mão-pé grau 2: suspender; grau 3: reduzir 25%</li>
            <li>Diarreia grau 2 persistente: reduzir 25%</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ═══ COMPONENTE PRINCIPAL ═══════════════════════════════════════════════════

export default function OncologiaIntegradaPro({ pac, up, chamarClaude }) {
  // chamarClaude reservado para integração futura; não usado na v1.1
  void chamarClaude;

  const [aba, setAba] = useState('triagem');
  const upSafe = up || (() => {});

  return (
    <div style={{ background:BG, minHeight:'100vh', padding:'20px 16px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        <div style={{ marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div>
            <p style={{ margin:0, fontSize:11, color:T, fontWeight:700, letterSpacing:1 }}>APACApp · MÓDULO PRO v1.1.10</p>
            <h2 style={{ margin:'4px 0 0', fontSize:22, fontWeight:900, color:N }}>
              🩺 Oncologia Integrada Pro
            </h2>
          </div>
          <div style={{ fontSize:12, color:'#6B7280', textAlign:'right' }}>
            <div>Hospital do Bem · CNES 2605473</div>
            <div>Dr. Silas Negrão · CRM-PB 17341</div>
          </div>
        </div>

        <Tabs aba={aba} setAba={setAba} />

        {aba === 'triagem'   && <TriagemQT pac={pac} up={upSafe} />}
        {aba === 'apac'      && <ConferenciaAPACMini pac={pac} up={upSafe} />}
        {aba === 'antiem'    && <AntieméticosTab pac={pac} />}
        {aba === 'cumul'     && <DoseCumulativaTab pac={pac} up={upSafe} />}
        {aba === 'cidsigtap' && <CIDSIGTAPTab pac={pac} />}
        {aba === 'capec'     && <CapecitabinaTab pac={pac} />}

      </div>
    </div>
  );
}
