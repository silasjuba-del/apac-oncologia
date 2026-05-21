import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import MedicoProntuario from './pages/MedicoProntuario.jsx';
import AssistenteIA from './components/AssistenteIA.jsx';
import UploadSimples from './components/UploadSimples.jsx';
import { APACSystem, APACDashboardWidget } from './components/APACSystem.jsx';
import AgentPanel from './components/AgentPanel.jsx';
import IATestador from './components/IATestador.jsx';
import ReviewBanner from './components/ReviewBanner.jsx';
import EvolutionTimeline from './components/EvolutionTimeline.jsx';
import GerenciarPacientes from './components/GerenciarPacientes.jsx';
import ConsultaDia from './components/ConsultaDia.jsx';
import {
  loadPacAtual, savePacAtual, clearPacAtual,
  loadAiPatches, saveAiPatches,
} from './utils/storage.js';
import {
  dbInit, dbSalvarPaciente, dbCarregarPacientes,
  dbSalvarAgenda, dbCarregarAgenda,
  dbSalvarFila, dbCarregarFila,
  dbSalvarHistoricoQT, dbCarregarHistoricoQT,
  dbSalvarTriagens, dbCarregarTriagens,
  getSyncStatus,
} from './utils/db.js';

const N="#1B365D",T="#2B7A8C",G="#B8860B",VE="#15803D",AM="#B45309",VM="#B91C1C",BG="#EEF2F7";
const AUTOR="Dr. Silas Negrão Serra Jr. — CRM-PB 17341";
const AUTOR2="RQE Oncologia Clínica 9099 | RQE Clínica Médica 9098";
const EQUIPE=[
  {id:"silas",  nome:"Dr. Silas Negrão Serra Jr.", cargo:"Oncologista Clínico", reg:"CRM-PB 17341 · RQE 9099",   tipo:"medico",     ico:"👨‍⚕️"},
  {id:"farm1",  nome:"Josenildo Santos",            cargo:"Farmacêutico",        reg:"CRF-PB 1234",               tipo:"farmacia",    ico:"💊"},
  {id:"enf1",   nome:"Ana Karla Lima",              cargo:"Enfermeira",          reg:"COREN-PB 5678",             tipo:"enfermagem",  ico:"🩺"},
  {id:"rec1",   nome:"Maria das Graças Silva",      cargo:"Recepcionista",       reg:"",                         tipo:"recepcao",    ico:"📋"},
  {id:"as1",    nome:"Carlos Roberto Oliveira",     cargo:"Assistente Social",   reg:"CRESS-PB 9012",             tipo:"assistencia", ico:"🤝"},
];
const assinatura=(f)=>`${f?.nome||AUTOR}
${f?.cargo||""} ${f?.reg??""}`.trim();
const HOSP="Hospital do Bem — Unidade Oncológica";
const HOSP2="Complexo Hospitalar Regional Dep. Janduhy Carneiro — Patos/PB";
const APP_NOME="Oncologia Integrada";

const SINAIS_T=[
  {id:"febre",txt:"Febre ≥ 37,8°C com calafrios",n:"verm"},{id:"disp",txt:"Dispneia ou dor no peito",n:"verm"},
  {id:"sang",txt:"Sangramento ativo",n:"verm"},{id:"conf",txt:"Confusão mental",n:"verm"},
  {id:"hipoTA",txt:"Pressão muito baixa / desmaio",n:"verm"},{id:"vomit",txt:"Vômitos > 4×/dia",n:"amar"},
  {id:"diarr",txt:"Diarreia ≥ 4 evacuações/dia",n:"amar"},{id:"dor",txt:"Dor intensa mal controlada",n:"amar"},
  {id:"mucosa",txt:"Mucosite com dificuldade de deglutição",n:"amar"},{id:"edema",txt:"Edema de membros ou face",n:"amar"},
  {id:"nausea",txt:"Náuseas / vômitos controlados",n:"verd"},{id:"anorex",txt:"Falta de apetite leve",n:"verd"},
  {id:"astenia",txt:"Cansaço / fadiga",n:"verd"},{id:"queda",txt:"Queda de cabelo",n:"verd"},
];
const NIV={
  verm:{bg:"#FDECEC",cor:VM,label:"EMERGÊNCIA",instrucao:"Encaminhar ao pronto-socorro IMEDIATAMENTE"},
  amar:{bg:"#FFF7E6",cor:AM,label:"ATENÇÃO",instrucao:"Comunicar equipe médica no mesmo dia"},
  verd:{bg:"#EAF7EE",cor:VE,label:"LEVE",instrucao:"Orientações domiciliares — monitorar evolução"},
  neutro:{bg:"#F1F5F9",cor:"#94A3B8",label:"—",instrucao:"Selecione os sintomas abaixo"},
};
const ORIENTACOES={
  nausea:"Tome ondansetrona 8 mg conforme prescrito. Refeições pequenas e frequentes. Evite gorduras e alimentos com odor forte. Gelo picado pode ajudar.",
  anorex:"Prefira alimentos nutritivos em pequenas quantidades: ovos, frango cozido, arroz, banana. Evite jejum prolongado.",
  astenia:"Esperado durante o tratamento. Descanse quando necessário. Hidratação: 2 litros/dia. Atividades leves são benéficas.",
  queda:"Temporária e reversível após o tratamento. Use chapéu ou turbante se preferir. Shampoo suave no couro cabeludo.",
};

// PROTOCOLOS COMPLETOS COM DIAS
const PROTOS=[
  {id:"mfolfox6",n:"mFOLFOX6",ind:"Cólon / Reto",ciclo:"14 dias",custo:1800,sus:2400,
   dr:[
     {n:"Oxaliplatina",d:85,t:"m2",dia:"D1",via:"IV 2h"},
     {n:"Leucovorina",d:400,t:"m2",dia:"D1",via:"IV 2h"},
     {n:"5-FU bolus",d:400,t:"m2",dia:"D1",via:"IV bolus"},
     {n:"5-FU infusional",d:2400,t:"m2",dia:"D1–D3",via:"IV 46h"},
   ]},
  {id:"folfiri",n:"FOLFIRI",ind:"Cólon / Reto 2ª linha",ciclo:"14 dias",custo:1650,sus:2200,
   dr:[
     {n:"Irinotecano",d:180,t:"m2",dia:"D1",via:"IV 90min"},
     {n:"Leucovorina",d:400,t:"m2",dia:"D1",via:"IV 2h"},
     {n:"5-FU bolus",d:400,t:"m2",dia:"D1",via:"IV bolus"},
     {n:"5-FU infusional",d:2400,t:"m2",dia:"D1–D3",via:"IV 46h"},
   ]},
  {id:"carbo_pac",n:"Carboplatina + Paclitaxel",ind:"Pulmão / Ovário",ciclo:"21 dias",custo:2200,sus:3100,
   dr:[
     {n:"Paclitaxel",d:175,t:"m2",dia:"D1",via:"IV 3h"},
     {n:"Carboplatina",d:5,t:"auc",dia:"D1",via:"IV 30min"},
   ]},
  {id:"ac",n:"AC",ind:"Mama — adjuvante",ciclo:"21 dias",custo:950,sus:1400,
   dr:[
     {n:"Doxorrubicina",d:60,t:"m2",dia:"D1",via:"IV bolus"},
     {n:"Ciclofosfamida",d:600,t:"m2",dia:"D1",via:"IV 30min"},
   ]},
  {id:"gem_nab",n:"Gemcitabina + nab-Paclitaxel",ind:"Pâncreas 1ª linha",ciclo:"28 dias",custo:4200,sus:5800,
   dr:[
     {n:"nab-Paclitaxel",d:125,t:"m2",dia:"D1, D8, D15",via:"IV 30min"},
     {n:"Gemcitabina",d:1000,t:"m2",dia:"D1, D8, D15",via:"IV 30min"},
   ]},
  {id:"pembro",n:"Pembrolizumabe",ind:"Imunoterapia",ciclo:"21 dias",custo:8500,sus:9800,
   dr:[
     {n:"Pembrolizumabe",d:200,t:"fix",dia:"D1",via:"IV 30min"},
   ]},
  {id:"cddp_rt",n:"Cisplatina concomitante RT",ind:"Colo útero / Cabeça-Pescoço",ciclo:"7 dias (semanal)",custo:320,sus:780,
   dr:[
     {n:"Cisplatina",d:40,t:"m2",dia:"D1 semanal",via:"IV 1h"},
   ]},
  {id:"doce",n:"Docetaxel + Prednisona",ind:"Próstata metastático",ciclo:"21 dias",custo:1200,sus:1900,
   dr:[
     {n:"Docetaxel",d:75,t:"m2",dia:"D1",via:"IV 1h"},
     {n:"Prednisona",d:10,t:"fix",dia:"D1–D21",via:"VO diário"},
   ]},

  {id:"tamox",n:"Tamoxifeno",ind:"Mama RH+ pré/pós-menopausa",ciclo:"28 dias contínuo",custo:45,sus:65,dr:[{n:"Tamoxifeno",d:20,t:"fix",dia:"D1–D28",via:"VO 1×/dia"}]},
  {id:"anast",n:"Anastrozol",ind:"Mama RH+ pós-menopausa",ciclo:"28 dias contínuo",custo:68,sus:95,dr:[{n:"Anastrozol",d:1,t:"fix",dia:"D1–D28",via:"VO 1×/dia"}]},
  {id:"letro",n:"Letrozol",ind:"Mama RH+ pós-menopausa",ciclo:"28 dias contínuo",custo:75,sus:105,dr:[{n:"Letrozol",d:2.5,t:"fix",dia:"D1–D28",via:"VO 1×/dia"}]},
  {id:"exem",n:"Exemestano",ind:"Mama RH+ pós-menopausa",ciclo:"28 dias contínuo",custo:110,sus:155,dr:[{n:"Exemestano",d:25,t:"fix",dia:"D1–D28",via:"VO 1×/dia (c/ refeição)"}]},
  {id:"leup375",n:"Leuprorelina 3,75 mg",ind:"Próstata / Mama pré-menopausa",ciclo:"28 dias",custo:420,sus:580,dr:[{n:"Leuprorelina",d:3.75,t:"fix",dia:"D1",via:"IM mensal"}]},
  {id:"leup75",n:"Leuprorelina 7,5 mg",ind:"Próstata / Mama pré-menopausa",ciclo:"28 dias",custo:680,sus:950,dr:[{n:"Leuprorelina",d:7.5,t:"fix",dia:"D1",via:"IM mensal"}]},
  {id:"trip",n:"Triptorelina 3,75 mg",ind:"Próstata — ablação androgênica",ciclo:"28 dias",custo:480,sus:670,dr:[{n:"Triptorelina",d:3.75,t:"fix",dia:"D1",via:"IM mensal"}]},
  {id:"bica",n:"Bicalutamida 50 mg",ind:"Próstata",ciclo:"28 dias contínuo",custo:85,sus:120,dr:[{n:"Bicalutamida",d:50,t:"fix",dia:"D1–D28",via:"VO 1×/dia"}]},
  {id:"bica150",n:"Bicalutamida 150 mg",ind:"Próstata não-metastático",ciclo:"28 dias contínuo",custo:190,sus:260,dr:[{n:"Bicalutamida",d:150,t:"fix",dia:"D1–D28",via:"VO 1×/dia"}]},

  {id:"trastu",n:"Trastuzumabe",ind:"Mama HER2+ adjuvante/metastático",ciclo:"21 dias",custo:4200,sus:5800,dr:[{n:"Trastuzumabe",d:6,t:"m2",dia:"D1",via:"IV 30–90 min (manutenção)"}]},
  {id:"pertu",n:"Pertuzumabe",ind:"Mama HER2+ 1ª linha metastática",ciclo:"21 dias",custo:6800,sus:9200,dr:[{n:"Pertuzumabe",d:420,t:"fix",dia:"D1",via:"IV 60 min (manutenção)"}]},
  {id:"hp",n:"Trastuzumabe + Pertuzumabe (HP)",ind:"Mama HER2+ — duplo bloqueio",ciclo:"21 dias",custo:10500,sus:14800,dr:[{n:"Trastuzumabe",d:6,t:"m2",dia:"D1",via:"IV 30 min"},{n:"Pertuzumabe",d:420,t:"fix",dia:"D1",via:"IV 60 min"}]},
  {id:"beva5",n:"Bevacizumabe 5 mg/kg",ind:"Cólon metastático / Ovário",ciclo:"14 dias",custo:2800,sus:3900,dr:[{n:"Bevacizumabe",d:5,t:"m2",dia:"D1",via:"IV 30–90 min"}]},
  {id:"beva10",n:"Bevacizumabe 10 mg/kg",ind:"Pulmão / Ovário",ciclo:"21 dias",custo:5200,sus:7100,dr:[{n:"Bevacizumabe",d:10,t:"m2",dia:"D1",via:"IV 30–90 min"}]},
  {id:"cetu500",n:"Cetuximabe",ind:"Cólon RAS/BRAF wt (cólon esquerdo)",ciclo:"14 dias",custo:7800,sus:10500,dr:[{n:"Cetuximabe",d:500,t:"fix",dia:"D1",via:"IV 60–120 min"}]},

  {id:"ac_t",n:"AC-T (sequencial)",ind:"Mama — adjuvante/neoadjuvante",ciclo:"AC 21 dias → Paclitaxel semanal",custo:2100,sus:2900,dr:[{n:"Doxorrubicina",d:60,t:"m2",dia:"D1",via:"IV bolus"},{n:"Ciclofosfamida",d:600,t:"m2",dia:"D1",via:"IV 30 min"},{n:"Paclitaxel (sequencial)",d:80,t:"m2",dia:"D1 semanal",via:"IV 1h"}]},
  {id:"fec",n:"FEC 75",ind:"Mama — adjuvante",ciclo:"21 dias",custo:880,sus:1250,dr:[{n:"Fluorouracil",d:500,t:"m2",dia:"D1",via:"IV bolus"},{n:"Epirrubicina",d:75,t:"m2",dia:"D1",via:"IV lento"},{n:"Ciclofosfamida",d:500,t:"m2",dia:"D1",via:"IV 30 min"}]},
  {id:"capecit",n:"Capecitabina",ind:"Mama metastático / Cólon adjuvante",ciclo:"21 dias (D1–D14)",custo:1100,sus:1550,dr:[{n:"Capecitabina",d:1250,t:"m2",dia:"D1–D14",via:"VO 2×/dia (c/ refeição)"}]},

  {id:"flot",n:"FLOT",ind:"Gástrico / JEG — perioperatório",ciclo:"14 dias",custo:2400,sus:3300,dr:[{n:"Docetaxel",d:50,t:"m2",dia:"D1",via:"IV 1h"},{n:"Leucovorina",d:200,t:"m2",dia:"D1",via:"IV 2h"},{n:"5-FU",d:2600,t:"m2",dia:"D1 48h",via:"IV 46h IC"},{n:"Oxaliplatina",d:85,t:"m2",dia:"D1",via:"IV 2h"}]},
  {id:"xelox",n:"XELOX (CAPOX)",ind:"Cólon / Gástrico",ciclo:"21 dias",custo:1900,sus:2600,dr:[{n:"Oxaliplatina",d:130,t:"m2",dia:"D1",via:"IV 2h"},{n:"Capecitabina",d:1000,t:"m2",dia:"D1–D14",via:"VO 2×/dia"}]},
  {id:"gem_cddp",n:"Gemcitabina + Cisplatina",ind:"Pulmão / Bexiga / Vias biliares",ciclo:"21 dias",custo:1850,sus:2550,dr:[{n:"Gemcitabina",d:1000,t:"m2",dia:"D1, D8",via:"IV 30 min"},{n:"Cisplatina",d:70,t:"m2",dia:"D1",via:"IV 1h (pré-hidratação)"}]},
  {id:"carbo_etopo",n:"Carboplatina + Etoposídeo",ind:"Pulmão pequenas células (CPPC)",ciclo:"21 dias",custo:1650,sus:2300,dr:[{n:"Carboplatina",d:5,t:"auc",dia:"D1",via:"IV 30 min"},{n:"Etoposídeo",d:100,t:"m2",dia:"D1–D3",via:"IV 1h"}]},
  {id:"alimta",n:"Pemetrexede + Carboplatina",ind:"Pulmão não-CEC não-driver",ciclo:"21 dias",custo:4800,sus:6500,dr:[{n:"Pemetrexede",d:500,t:"m2",dia:"D1",via:"IV 10 min"},{n:"Carboplatina",d:5,t:"auc",dia:"D1",via:"IV 30 min"}]},
  {id:"irinoc",n:"Irinotecano",ind:"Cólon 2ª linha / Gástrico",ciclo:"14 dias",custo:1450,sus:2000,dr:[{n:"Irinotecano",d:180,t:"m2",dia:"D1",via:"IV 90 min"}]},

  {id:"gemcisu",n:"Gemcitabina + Cisplatina (bexiga)",ind:"Bexiga músculo-invasiva / metastática",ciclo:"28 dias",custo:2100,sus:2900,dr:[{n:"Gemcitabina",d:1000,t:"m2",dia:"D1, D8, D15",via:"IV 30 min"},{n:"Cisplatina",d:70,t:"m2",dia:"D2",via:"IV 1h"}]},

  {id:"g_csf",n:"G-CSF (Filgrastim)",ind:"Profilaxia neutropenia febril",ciclo:"Pós-QT D2+",custo:380,sus:520,dr:[{n:"Filgrastim",d:5,t:"fix",dia:"D2–D7 pós-QT",via:"SC diário"}]},
  {id:"filg300",n:"Filgrastim 300 mcg",ind:"Neutropenia febril / mobilização células-tronco",ciclo:"Conforme indicação",custo:350,sus:480,dr:[{n:"Filgrastim 300 mcg",d:300,t:"fix",dia:"D1+",via:"SC 1×/dia"}]},
  {id:"zol4",n:"Ácido Zoledrónico 4 mg",ind:"Metástases ósseas / Mieloma / Hipercalcemia maligna",ciclo:"28 dias",custo:580,sus:810,dr:[{n:"Ácido Zoledrónico",d:4,t:"fix",dia:"D1",via:"IV 15 min (100 mL SF)"}]},
  {id:"zol_men",n:"Ácido Zoledrónico — manutenção",ind:"Metástases ósseas (após 1 ano)",ciclo:"84 dias (a cada 3 meses)",custo:580,sus:810,dr:[{n:"Ácido Zoledrónico",d:4,t:"fix",dia:"D1",via:"IV 15 min (100 mL SF)"}]},
  {id:"denoz",n:"Denosumabe 120 mg",ind:"Metástases ósseas / GCTB",ciclo:"28 dias",custo:4200,sus:5800,dr:[{n:"Denosumabe",d:120,t:"fix",dia:"D1",via:"SC"}]},
];

// ── BANCO DE PROTOCOLOS POR TUMOR (melhorias v11) ─────────────────────────────
const PROTOCOLOS_DB={
  mama:{label:"Mama",emoji:"🎀",palavras:["mama","breast","ductal","lobular","carcinoma de mama"],grupos:[
    {nome:"Neoadjuvante / Adjuvante",protos:[
      {id:"AC",nome:"AC",drugs:[{n:"Doxorrubicina",d:60,u:"mg/m²"},{n:"Ciclofosfamida",d:600,u:"mg/m²"}],ciclo:"q21d",cor:"#B91C1C"},
      {id:"AC-T",nome:"AC → Paclitaxel",drugs:[{n:"Doxorrubicina",d:60,u:"mg/m²"},{n:"Ciclofosfamida",d:600,u:"mg/m²"},{n:"Paclitaxel",d:80,u:"mg/m²"}],ciclo:"AC q21d → PTX semanal",cor:"#7C3AED"},
      {id:"TC",nome:"TC",drugs:[{n:"Docetaxel",d:75,u:"mg/m²"},{n:"Ciclofosfamida",d:600,u:"mg/m²"}],ciclo:"q21d",cor:"#15803D"},
      {id:"EC",nome:"EC",drugs:[{n:"Epirrubicina",d:90,u:"mg/m²"},{n:"Ciclofosfamida",d:600,u:"mg/m²"}],ciclo:"q21d",cor:"#B45309"},
      {id:"TCHP",nome:"TCHP (HER2+)",drugs:[{n:"Docetaxel",d:75,u:"mg/m²"},{n:"Carboplatina",d:6,u:"AUC"},{n:"Trastuzumabe",d:8,u:"mg/kg"},{n:"Pertuzumabe",d:840,u:"mg fixo"}],ciclo:"q21d",cor:"#0EA5E9"},
    ]},
    {nome:"Metastático RH+/HER2−",protos:[
      {id:"PTX-S",nome:"Paclitaxel Semanal",drugs:[{n:"Paclitaxel",d:80,u:"mg/m²"}],ciclo:"d1-d8-d15 q28d",cor:"#15803D"},
      {id:"CAPE",nome:"Capecitabina",drugs:[{n:"Capecitabina",d:1250,u:"mg/m²"}],ciclo:"d1-d14 q21d",cor:"#2B7A8C"},
      {id:"ERIB",nome:"Eribulina",drugs:[{n:"Eribulina",d:1.23,u:"mg/m²"}],ciclo:"d1-d8 q21d",cor:"#B45309"},
    ]},
    {nome:"HER2+",protos:[
      {id:"TH",nome:"Docetaxel + Trastuzumabe",drugs:[{n:"Docetaxel",d:75,u:"mg/m²"},{n:"Trastuzumabe",d:8,u:"mg/kg"}],ciclo:"q21d",cor:"#0EA5E9"},
      {id:"TDM1",nome:"T-DM1",drugs:[{n:"Ado-trastuzumabe",d:3.6,u:"mg/kg"}],ciclo:"q21d",cor:"#7C3AED"},
      {id:"TDXD",nome:"T-DXd",drugs:[{n:"Trastuzumabe deruxtecano",d:5.4,u:"mg/kg"}],ciclo:"q21d",cor:"#7C3AED"},
    ]},
  ]},
  pulmao:{label:"Pulmão CPNPC",emoji:"🫁",palavras:["pulmão","pulmonar","cpnpc","adenocarcinoma de pulmão","carcinoma de células não pequenas","nsclc"],grupos:[
    {nome:"1ª linha — Sem driver",protos:[
      {id:"CARBO-PTX",nome:"Carboplatina + Paclitaxel",drugs:[{n:"Carboplatina",d:5,u:"AUC"},{n:"Paclitaxel",d:175,u:"mg/m²"}],ciclo:"q21d",cor:"#2B7A8C"},
      {id:"CARBO-PEME",nome:"Carboplatina + Pemetrexede",drugs:[{n:"Carboplatina",d:5,u:"AUC"},{n:"Pemetrexede",d:500,u:"mg/m²"}],ciclo:"q21d",cor:"#15803D"},
      {id:"PEMBRO-QT",nome:"Pembrolizumabe + QT",drugs:[{n:"Pembrolizumabe",d:200,u:"mg fixo"},{n:"Carboplatina",d:5,u:"AUC"},{n:"Pemetrexede",d:500,u:"mg/m²"}],ciclo:"q21d",cor:"#7C3AED"},
    ]},
    {nome:"Driver EGFR",protos:[
      {id:"OSIMERT",nome:"Osimertinibe",drugs:[{n:"Osimertinibe",d:80,u:"mg VO"}],ciclo:"diário",cor:"#15803D"},
      {id:"ERLOT",nome:"Erlotinibe",drugs:[{n:"Erlotinibe",d:150,u:"mg VO"}],ciclo:"diário",cor:"#B45309"},
    ]},
    {nome:"Driver ALK",protos:[
      {id:"ALECT",nome:"Alectinibe",drugs:[{n:"Alectinibe",d:600,u:"mg VO 2×/dia"}],ciclo:"contínuo",cor:"#2B7A8C"},
      {id:"LORLA",nome:"Lorlatinibe",drugs:[{n:"Lorlatinibe",d:100,u:"mg VO"}],ciclo:"diário",cor:"#7C3AED"},
    ]},
  ]},
  colon:{label:"Cólon / Reto",emoji:"🔵",palavras:["cólon","colon","reto","retal","colorretal","adenocarcinoma de cólon","adenocarcinoma retal"],grupos:[
    {nome:"1ª linha",protos:[
      {id:"FOLFOX6",nome:"mFOLFOX6",drugs:[{n:"Oxaliplatina",d:85,u:"mg/m²"},{n:"Leucovorina",d:400,u:"mg/m²"},{n:"5-FU bolus",d:400,u:"mg/m²"},{n:"5-FU infusão",d:2400,u:"mg/m²"}],ciclo:"q14d",cor:"#1B365D"},
      {id:"FOLFIRI",nome:"FOLFIRI",drugs:[{n:"Irinotecano",d:180,u:"mg/m²"},{n:"Leucovorina",d:400,u:"mg/m²"},{n:"5-FU bolus",d:400,u:"mg/m²"},{n:"5-FU infusão",d:2400,u:"mg/m²"}],ciclo:"q14d",cor:"#2B7A8C"},
      {id:"XELOX",nome:"XELOX",drugs:[{n:"Oxaliplatina",d:130,u:"mg/m²"},{n:"Capecitabina",d:1000,u:"mg/m²"}],ciclo:"q21d",cor:"#15803D"},
      {id:"FOLFIRINOX",nome:"FOLFIRINOX",drugs:[{n:"Oxaliplatina",d:85,u:"mg/m²"},{n:"Irinotecano",d:180,u:"mg/m²"},{n:"Leucovorina",d:400,u:"mg/m²"},{n:"5-FU",d:2400,u:"mg/m²"}],ciclo:"q14d",cor:"#B45309"},
    ]},
    {nome:"+ Biológico",protos:[
      {id:"FOLFOX-BEVA",nome:"mFOLFOX6 + Bevacizumabe",drugs:[{n:"Bevacizumabe",d:5,u:"mg/kg"}],ciclo:"q14d",cor:"#B91C1C"},
      {id:"FOLFIRI-CETUX",nome:"FOLFIRI + Cetuximabe",drugs:[{n:"Cetuximabe",d:500,u:"mg/m²"}],ciclo:"q14d",cor:"#7C3AED"},
      {id:"PEMBRO-MSI",nome:"Pembrolizumabe (MSI-H)",drugs:[{n:"Pembrolizumabe",d:200,u:"mg fixo"}],ciclo:"q21d",cor:"#7C3AED"},
    ]},
  ]},
  gastrico:{label:"Gástrico / JEG",emoji:"🟡",palavras:["gástrico","estômago","gástrica","jeg","junção esôfago-gástrica","adenocarcinoma gástrico"],grupos:[
    {nome:"1ª linha",protos:[
      {id:"FLOT",nome:"FLOT",drugs:[{n:"5-FU",d:2600,u:"mg/m²"},{n:"Leucovorina",d:200,u:"mg/m²"},{n:"Oxaliplatina",d:85,u:"mg/m²"},{n:"Docetaxel",d:50,u:"mg/m²"}],ciclo:"q14d",cor:"#1B365D"},
      {id:"XELOX-G",nome:"XELOX",drugs:[{n:"Oxaliplatina",d:130,u:"mg/m²"},{n:"Capecitabina",d:1000,u:"mg/m²"}],ciclo:"q21d",cor:"#2B7A8C"},
      {id:"NIVO-QT",nome:"Nivolumabe + QT",drugs:[{n:"Nivolumabe",d:360,u:"mg fixo"},{n:"Oxaliplatina",d:130,u:"mg/m²"},{n:"Capecitabina",d:1000,u:"mg/m²"}],ciclo:"q21d",cor:"#7C3AED"},
    ]},
    {nome:"HER2+",protos:[
      {id:"XELOX-TRAST",nome:"XELOX + Trastuzumabe",drugs:[{n:"Trastuzumabe",d:8,u:"mg/kg"},{n:"Oxaliplatina",d:130,u:"mg/m²"},{n:"Capecitabina",d:1000,u:"mg/m²"}],ciclo:"q21d",cor:"#0EA5E9"},
      {id:"TDXD-G",nome:"T-DXd (HER2+ 2ª linha)",drugs:[{n:"Trastuzumabe deruxtecano",d:6.4,u:"mg/kg"}],ciclo:"q21d",cor:"#7C3AED"},
    ]},
  ]},
  pancreas:{label:"Pâncreas",emoji:"🟠",palavras:["pâncreas","pancreático","pancreática","adenocarcinoma pancreático"],grupos:[
    {nome:"1ª linha",protos:[
      {id:"FOLFIRINOX-P",nome:"FOLFIRINOX",drugs:[{n:"Oxaliplatina",d:85,u:"mg/m²"},{n:"Irinotecano",d:180,u:"mg/m²"},{n:"Leucovorina",d:400,u:"mg/m²"},{n:"5-FU",d:2400,u:"mg/m²"}],ciclo:"q14d",cor:"#B45309"},
      {id:"GEMCITAB",nome:"Gencitabina",drugs:[{n:"Gencitabina",d:1000,u:"mg/m²"}],ciclo:"d1-d8-d15 q28d",cor:"#15803D"},
      {id:"GEM-NAB",nome:"Gencitabina + nab-PTX",drugs:[{n:"Gencitabina",d:1000,u:"mg/m²"},{n:"nab-Paclitaxel",d:125,u:"mg/m²"}],ciclo:"d1-d8-d15 q28d",cor:"#2B7A8C"},
    ]},
  ]},
  prostata:{label:"Próstata",emoji:"🔵",palavras:["próstata","prostático","prostática","adenocarcinoma de próstata"],grupos:[
    {nome:"Castração-sensível",protos:[
      {id:"DOCETAX-P",nome:"Docetaxel + Prednisona",drugs:[{n:"Docetaxel",d:75,u:"mg/m²"},{n:"Prednisona",d:10,u:"mg VO"}],ciclo:"q21d",cor:"#1B365D"},
      {id:"CABAZIT",nome:"Cabazitaxel",drugs:[{n:"Cabazitaxel",d:20,u:"mg/m²"}],ciclo:"q21d",cor:"#B45309"},
    ]},
    {nome:"CRPC / Hormonioterapia",protos:[
      {id:"ENZALUT",nome:"Enzalutamida",drugs:[{n:"Enzalutamida",d:160,u:"mg VO"}],ciclo:"diário",cor:"#2B7A8C"},
      {id:"ABIRATER",nome:"Abiraterona",drugs:[{n:"Abiraterona",d:1000,u:"mg VO"},{n:"Prednisona",d:10,u:"mg VO"}],ciclo:"diário",cor:"#15803D"},
    ]},
  ]},
  ovario:{label:"Ovário",emoji:"🟣",palavras:["ovário","ovarian","tubo","peritoneu","carcinoma de ovário"],grupos:[
    {nome:"1ª linha",protos:[
      {id:"CARBO-PTX-O",nome:"Carboplatina + Paclitaxel",drugs:[{n:"Carboplatina",d:5,u:"AUC"},{n:"Paclitaxel",d:175,u:"mg/m²"}],ciclo:"q21d",cor:"#7C3AED"},
      {id:"CARBO-GEM-O",nome:"Carboplatina + Gencitabina",drugs:[{n:"Carboplatina",d:4,u:"AUC"},{n:"Gencitabina",d:1000,u:"mg/m²"}],ciclo:"d1-d8 q21d",cor:"#B45309"},
      {id:"OLAPAR",nome:"Olaparibe (BRCA mut.)",drugs:[{n:"Olaparibe",d:300,u:"mg VO 2×/dia"}],ciclo:"diário",cor:"#15803D"},
    ]},
  ]},
  bexiga:{label:"Bexiga",emoji:"🟤",palavras:["bexiga","urotelial","urotélio","carcinoma urotelial"],grupos:[
    {nome:"1ª / 2ª linha",protos:[
      {id:"GEM-CIS-B",nome:"Gencitabina + Cisplatina",drugs:[{n:"Gencitabina",d:1000,u:"mg/m²"},{n:"Cisplatina",d:70,u:"mg/m²"}],ciclo:"d1-d8 q21d",cor:"#1B365D"},
      {id:"GEM-CARBO-B",nome:"Gencitabina + Carboplatina",drugs:[{n:"Gencitabina",d:1000,u:"mg/m²"},{n:"Carboplatina",d:4.5,u:"AUC"}],ciclo:"d1-d8 q21d",cor:"#2B7A8C"},
      {id:"EV-302",nome:"Enfortumabe vedotina + Pembro",drugs:[{n:"Enfortumabe vedotina",d:1.25,u:"mg/kg"},{n:"Pembrolizumabe",d:200,u:"mg fixo"}],ciclo:"d1-d8-d15 q21d",cor:"#7C3AED"},
    ]},
  ]},
  esofago:{label:"Esôfago / JEG",emoji:"🔴",palavras:["esôfago","esofágico","esofagiano"],grupos:[
    {nome:"Neoadjuvante / 1ª linha",protos:[
      {id:"CROSS",nome:"CROSS (QT-RT)",drugs:[{n:"Carboplatina",d:2,u:"AUC"},{n:"Paclitaxel",d:50,u:"mg/m²"}],ciclo:"semanal × 5",cor:"#1B365D"},
      {id:"FLOT-E",nome:"FLOT",drugs:[{n:"5-FU",d:2600,u:"mg/m²"},{n:"Leucovorina",d:200,u:"mg/m²"},{n:"Oxaliplatina",d:85,u:"mg/m²"},{n:"Docetaxel",d:50,u:"mg/m²"}],ciclo:"q14d",cor:"#B45309"},
      {id:"NIVO-QT-CE",nome:"Nivolumabe + QT (escamoso)",drugs:[{n:"Nivolumabe",d:360,u:"mg fixo"},{n:"Carboplatina",d:5,u:"AUC"},{n:"Paclitaxel",d:175,u:"mg/m²"}],ciclo:"q21d",cor:"#7C3AED"},
    ]},
  ]},
};
function detectarTumor(diag=""){const d=diag.toLowerCase();for(const[key,tumor]of Object.entries(PROTOCOLOS_DB)){if(tumor.palavras.some(p=>d.includes(p)))return{key,...tumor};}return null;}
function listarProtocolos(tumorKey){const tumor=PROTOCOLOS_DB[tumorKey];if(!tumor)return[];return tumor.grupos.flatMap(g=>g.protos.map(p=>({...p,grupo:g.nome})));}
const PERIODOS=[
  {id:"semanal",label:"Semanal (D1 a cada 7 dias)"},{id:"q14d",label:"A cada 14 dias (D1 q14d)"},
  {id:"q21d",label:"A cada 21 dias (D1 q21d)"},{id:"d1d8q21",label:"D1 e D8 a cada 21 dias"},
  {id:"d1d8d15q28",label:"D1, D8 e D15 a cada 28 dias"},{id:"d1d14q21",label:"D1 a D14 a cada 21 dias (VO)"},
  {id:"diario",label:"Diário contínuo (VO)"},{id:"custom",label:"Outro (especificar)"},
];
const REDUCOES=[
  {pct:0,label:"Dose plena (100%)",cor:VE},{pct:10,label:"Redução de 10%",cor:AM},
  {pct:20,label:"Redução de 20%",cor:"#F97316"},{pct:25,label:"Redução de 25%",cor:VM},
];
const EXAMES_LAB_TEMPLATE=[
  {sigla:"Hgb",nome:"Hemoglobina",unidade:"g/dL",ref:"12–16"},{sigla:"Leuco",nome:"Leucócitos",unidade:"/mm³",ref:"4.000–10.000"},
  {sigla:"Neutro",nome:"Neutrófilos",unidade:"/mm³",ref:">1.500"},{sigla:"PLT",nome:"Plaquetas",unidade:"/mm³",ref:"150.000–450.000"},
  {sigla:"Creat",nome:"Creatinina",unidade:"mg/dL",ref:"0,6–1,2"},{sigla:"Ureia",nome:"Ureia",unidade:"mg/dL",ref:"15–45"},
  {sigla:"TGO",nome:"TGO (AST)",unidade:"U/L",ref:"<40"},{sigla:"TGP",nome:"TGP (ALT)",unidade:"U/L",ref:"<41"},
  {sigla:"FA",nome:"Fosfatase Alcalina",unidade:"U/L",ref:"44–147"},{sigla:"BT",nome:"Bilirrubina Total",unidade:"mg/dL",ref:"<1,2"},
  {sigla:"DHL",nome:"DHL",unidade:"U/L",ref:"140–280"},{sigla:"PCR",nome:"PCR",unidade:"mg/dL",ref:"<0,5"},
  {sigla:"CEA",nome:"CEA",unidade:"ng/mL",ref:"<5,0"},{sigla:"CA125",nome:"CA-125",unidade:"U/mL",ref:"<35"},
  {sigla:"CA153",nome:"CA-15.3",unidade:"U/mL",ref:"<30"},{sigla:"PSA",nome:"PSA Total",unidade:"ng/mL",ref:"<4,0"},
  {sigla:"AFP",nome:"AFP",unidade:"ng/mL",ref:"<20"},
];
const TIPOS_IMAGEM=["Tomografia Computadorizada (TC)","Ressonância Magnética (RM)","PET-CT","Cintilografia Óssea","Ultrassonografia","Radiografia","Mamografia","Ecocardiograma","Biópsia / Anatomia Patológica","Mielograma","Outro"];
const PASSOS_TRIAGEM=[{n:1,l:"Identificação"},{n:2,l:"Sinais Vitais"},{n:3,l:"Laboratorial"},{n:4,l:"ECOG / Estado"},{n:5,l:"CTCAE"},{n:6,l:"Conclusão"}];
const CTCAE_ITEMS=[
  {id:"nausea",nome:"Náusea",desc:"G0: sem · G1: sem perda apetite · G2: apetite reduzido · G3: IV indicada · G4: ameaça vida"},
  {id:"vomito",nome:"Vômito",desc:"G0: sem · G1: 1-2×/dia · G2: 3-5×/dia · G3: ≥6×/dia / IV · G4: ameaça vida"},
  {id:"diarreia",nome:"Diarreia",desc:"G0: sem · G1: <4×/dia · G2: 4-6×/dia · G3: ≥7×/dia / internação · G4: ameaça vida"},
  {id:"mucosite",nome:"Mucosite oral",desc:"G0: sem · G1: assintomática · G2: dor, sem dificuldade oral · G3: sonda necessária · G4: ameaça vida"},
  {id:"neuropatia",nome:"Neuropatia periférica",desc:"G0: sem · G1: assintomática · G2: dificuldade AVD · G3: limitação AVD · G4: incapacitante"},
  {id:"fadiga",nome:"Fadiga",desc:"G0: sem · G1: não limitante · G2: limita AVD instrumental · G3: limita autocuidado · G4: —"},
  {id:"mao_pe",nome:"Síndrome mão-pé",desc:"G0: sem · G1: eritema, não doloroso · G2: dor, EVA 4-6 · G3: intenso, incapacitante · G4: —"},
  {id:"alopecia",nome:"Alopecia",desc:"G0: sem · G1: <50% perda · G2: ≥50% perda, peruca indicada · G3-4: —"},
  {id:"react_cutanea",nome:"Reação cutânea",desc:"G0: sem · G1: máculas/pápulas < 10% · G2: 10-30% corpo · G3: > 30%, limitante · G4: ameaça vida"},
];

const DOCS_OBR=[
  {id:"d1",n:"Documento de identificação (CPF)",peso:1},{id:"d2",n:"Cartão SUS / CNS",peso:1},
  {id:"d3",n:"Anatomopatológico",peso:3},{id:"d4",n:"Imuno-histoquímica / biomarcadores",peso:2},
  {id:"d5",n:"Imagem basal com estadiamento",peso:3},{id:"d6",n:"TNM / estadiamento descrito",peso:3},
  {id:"d7",n:"CID-10 compatível",peso:2},{id:"d8",n:"Linha de tratamento documentada",peso:2},
  {id:"d9",n:"Protocolo, dose e periodicidade",peso:3},{id:"d10",n:"Assinatura / carimbo médico",peso:1},
];
const ESTOQUE=[
  {f:"Oxaliplatina 50 mg",amp:24,uso:6},{f:"5-FU 500 mg",amp:48,uso:8},
  {f:"Leucovorina 100 mg",amp:30,uso:4},{f:"Carboplatina 450 mg",amp:12,uso:3},
  {f:"Paclitaxel 300 mg",amp:8,uso:2},{f:"Pembrolizumabe 100 mg",amp:6,uso:2},
  {f:"Doxorrubicina 50 mg",amp:15,uso:3},
];
const MOCK_ALERTAS=[
  {id:1,nome:"Maria Aparecida Santos",diag:"Adenocarcinoma cólon IV",sint:"Febre 38,5°C + calafrios",n:"verm",h:"08:14"},
  {id:2,nome:"José Francisco Lima",diag:"Ca próstata metastático",sint:"Vômitos persistentes",n:"amar",h:"09:32"},
  {id:3,nome:"Ana Maria Rodrigues",diag:"Ca mama RH+ HER2−",sint:"Astenia intensa",n:"verd",h:"10:05"},
];
const MOCK_CADEIRAS=[
  {id:"P01",pac:"Maria A. Santos",proto:"mFOLFOX6",min:145,st:"ocup"},
  {id:"P02",pac:"João P. Ferreira",proto:"Carboplatina+Paclitaxel",min:80,st:"ocup"},
  {id:"P03",pac:"Ana R. Costa",proto:"AC",min:200,st:"ocup"},
  {id:"P04",pac:"Preparo em curso",proto:"Pembrolizumabe",min:0,st:"prep"},
  {id:"P05",pac:"—",proto:"—",min:0,st:"livre"},
  {id:"P06",pac:"—",proto:"—",min:0,st:"livre"},
];
const TRIALS=[
  {id:"t1",n:"KEYNOTE-590",fase:"III",tumor:"Esôfago / GEJ",status:"encerrado",fim:"Jan 2025",
   sg:"14,2m vs 10,7m (HR 0,73)",slp:"6,3m vs 5,8m",resp:"45% vs 29%",
   inc:["Adenocarcinoma ou CE de esôfago/JEG","Doença metastática ou irressecável","ECOG 0–1","Sem QT prévia metastática"],
   exc:["Doença autoimune ativa","Anti-PD-1/L1 prévio","SNC ativas não tratadas","Gestação"]},
  {id:"t2",n:"LAURA",fase:"III",tumor:"CPNPC Estádio III",status:"ativo",fim:"Dez 2025",
   sg:"NR",slp:"39,1m vs 5,6m (HR 0,23)",resp:"76% vs 23%",
   inc:["CPNPC estádio III irressecável","Sem progressão após QRT","EGFR mutado","ECOG 0–1"],
   exc:["Progressão durante QRT","Metástases a distância","Pneumonite grau ≥ 2","ECOG ≥ 2"]},
  {id:"t3",n:"KEYNOTE-177",fase:"III",tumor:"Cólon Metastático",status:"encerrado",fim:"Mar 2024",
   sg:"NR vs 36,7m (HR 0,74)",slp:"16,5m vs 8,2m (HR 0,60)",resp:"43,8% vs 33,1%",
   inc:["CCR metastático","MSI-H / dMMR","1ª linha","ECOG 0–2"],
   exc:["MSS","Doença autoimune","Anti-PD-1 prévio"]},
  {id:"t4",n:"MONARCH-3",fase:"III",tumor:"Mama RH+ HER2-",status:"encerrado",fim:"Jun 2024",
   sg:"67,1m vs 53,7m (HR 0,75)",slp:"28,2m vs 14,8m (HR 0,54)",resp:"59% vs 44%",
   inc:["Mama RH+ HER2- metastática","Pós-menopausa","1ª linha","ECOG 0–1"],
   exc:["Tratamento prévio para doença metastática","Visceral crisis grave"]},
  {id:"t5",n:"CHECKMATE-9LA",fase:"III",tumor:"CPNPC Metastático",status:"encerrado",fim:"Ago 2024",
   sg:"15,8m vs 11,0m (HR 0,72)",slp:"6,7m vs 5,0m (HR 0,67)",resp:"38% vs 25%",
   inc:["CPNPC metastático","Sem driver EGFR/ALK","ECOG 0–1","Qualquer PD-L1"],
   exc:["EGFR/ALK positivo","Doença autoimune ativa","SNC não tratadas"]},
];
const genPacID=()=>"OI-"+new Date().getFullYear()+"-"+String(Math.floor(Math.random()*9000)+1000);
const PAC0={nome:"",nasc:"",idade:"",cpf:"",cns:"",cidade:"",tel:"",mae:"",queixa:"",antec:"",meds:"",alerg:"",sexo:"",convenio:"",diag:"",cid:"",tnm:"",estadio:"",bio:"",ecog:"",trat:"",linha:"",intencao:"",pacID:genPacID(),peso:"",altura:"",exFisico:"",hipFunc:"",anam_remedio_doenca:"",anam_cirurgia:"",anam_hist_fam:"",docs_drive_resumo:"",cod_proc:"0304010072",cid_sec:"",cid_causas:"",exames_resumo:"",justif_apac:"",validade_apac:"",raca:"",endereco:"",municipio_cod:"2512903",cep:"58700-000",data_sol:""};
const calcSC=(peso,altura)=>{const p=Number(peso),h=Number(altura);if(!p||!h)return null;return Math.sqrt(p*h/3600).toFixed(2);};
const calcProxCiclo=(proto,dataBase)=>{const d=new Date(dataBase||Date.now());const p=(proto||"").toUpperCase();let dias=21;if(/FOLFOX|FOLFIRI|FOLFOXIRI|XELOX/.test(p))dias=14;if(/SEMANAL|WEEKLY/.test(p))dias=7;if(/TAMOX|ANASTRO|LETRO|EXEMESTA/.test(p))dias=30;if(/TRIPTORE|LECTRUM/.test(p))dias=28;d.setDate(d.getDate()+dias);return d.toLocaleDateString("pt-BR");};
const MOCK_PAC={nome:"Maria Aparecida dos Santos",nasc:"12/03/1964",idade:"62",cpf:"000.000.000-00",cns:"000 0000 0000 0000",cidade:"Patos-PB",tel:"(83) 99999-0000",mae:"Francisca Maria dos Santos",queixa:"Perda ponderal e dor abdominal.",antec:"HAS controlada.",meds:"Losartana 50 mg/dia.",alerg:"Nega.",diag:"Adenocarcinoma cólon sigmoide metastático — fígado.",cid:"C18.7",tnm:"cT3N1M1",estadio:"Estádio IV",bio:"RAS wt · BRAF wt · MSS",ecog:"1",trat:"mFOLFOX6 ± cetuximabe",linha:"1ª linha paliativa",intencao:"Paliativa — possibilidade de conversão"};

const BIOM={
  mama:{t:"Mama",cat:[
    {n:"Luminal A",def:"RH+ HER2− Ki67<20%",c:VE,tx:"HT isolada"},
    {n:"Luminal B HER2−",def:"RH+ HER2− Ki67≥20%",c:G,tx:"HT+QT"},
    {n:"Luminal B HER2+",def:"RH+ HER2+",c:T,tx:"HT+QT+anti-HER2"},
    {n:"HER2 enriquecido",def:"RH− HER2+",c:AM,tx:"QT+trastuzumabe"},
    {n:"Triplo Negativo",def:"RH− HER2−",c:VM,tx:"QT±imuno"},
    {n:"HER2-low",def:"IHQ 1+ ou IHQ 2+/ISH−",c:"#0EA5E9",tx:"T-DXd"},
  ],mk:["ER","PR","HER2","Ki-67","PD-L1","BRCA1/2","PIK3CA"]},
  pulmao:{t:"Pulmão CPNPC",cat:[
    {n:"EGFR",def:"Ex19del/L858R/ex20ins",c:T,tx:"Osimertinibe"},
    {n:"ALK",def:"EML4-ALK e variantes",c:VE,tx:"Alectinibe/Brigatinibe"},
    {n:"ROS1",def:"Fusão ROS1",c:G,tx:"Crizotinibe/Entrectinibe"},
    {n:"KRAS G12C",def:"p.G12C",c:AM,tx:"Sotorasibe"},
    {n:"MET ex14",def:"Skipping éxon 14",c:"#7C3AED",tx:"Capmatinibe"},
    {n:"RET",def:"Fusão RET",c:"#EC4899",tx:"Selpercatinibe"},
    {n:"BRAF V600E",def:"Mutação BRAF",c:VM,tx:"Dabrafenibe+trametinibe"},
    {n:"PD-L1 ≥50%",def:"Sem driver",c:"#6366F1",tx:"Pembrolizumabe"},
  ],mk:["EGFR","ALK","ROS1","KRAS G12C","MET","RET","BRAF","PD-L1 TPS","TMB"]},
  ovario:{t:"Ovário",cat:[
    {n:"BRCA1 germinal",def:"Hereditária BRCA1",c:VM,tx:"PARP-i"},
    {n:"BRCA2 germinal",def:"Hereditária BRCA2",c:AM,tx:"PARP-i"},
    {n:"HRD+ BRCA wt",def:"HRD alto sem BRCA",c:G,tx:"Niraparibe"},
    {n:"HRD− (HRP)",def:"Sem def. HRD",c:T,tx:"Bevacizumabe+QT"},
  ],mk:["BRCA1/2","HRD score","CA-125","HE4"]},
  prostata:{t:"Próstata",cat:[
    {n:"Baixo risco",def:"PSA<10+ISUP1+T1-T2a",c:VE,tx:"Vigilância ativa"},
    {n:"Intermediário",def:"PSA 10-20 ou ISUP2-3",c:G,tx:"RT+HT curta"},
    {n:"Alto risco",def:"PSA>20 ou ISUP4-5",c:AM,tx:"RT+HT longa"},
    {n:"Muito alto",def:"cT3b-T4 ou ISUP5",c:VM,tx:"RT+HT+docetaxel"},
    {n:"BRCA2/HRRm",def:"Mutação BRCA2/HRR",c:"#7C3AED",tx:"PARP-i"},
  ],mk:["PSA","Gleason/ISUP","AR-V7","BRCA1/2","MSI"]},
  gastrico:{t:"Gástrico/JEG",cat:[
    {n:"HER2+",def:"IHQ 3+ ou ISH+",c:AM,tx:"QT+trastuzumabe"},
    {n:"MSI-H/EBV+",def:"Instab. alta ou EBV+",c:VE,tx:"Pembrolizumabe"},
    {n:"PD-L1 CPS≥5",def:"CPS≥5",c:T,tx:"Nivolumabe+QT"},
    {n:"CLDN18.2+",def:"CLDN18.2 ≥75%",c:G,tx:"Zolbetuximabe+QT"},
  ],mk:["HER2","PD-L1 CPS","MSI","EBV","CLDN18.2","FGFR2b"]},
  imuno:{t:"Imuno-oncologia",cat:[
    {n:"PD-L1 22C3 TPS≥50%",def:"Dako 22C3 alto",c:VE,tx:"Pembrolizumabe mono"},
    {n:"PD-L1 22C3 1-49%",def:"Intermediário",c:G,tx:"Pembrolizumabe+QT"},
    {n:"PD-L1 28-8≥1%",def:"Dako 28-8",c:T,tx:"Nivolumabe"},
    {n:"TMB≥10 mut/Mb",def:"Alta carga mutacional",c:"#7C3AED",tx:"Pembrolizumabe"},
    {n:"MSI-H/dMMR",def:"Instab.alta/def.MMR",c:VM,tx:"Pembrolizumabe/Nivolumabe"},
  ],mk:["PD-L1 22C3","PD-L1 28-8","PD-L1 SP142","TMB","MSI/dMMR","CTLA-4"]},
};

const CID_DB={
  "adenocarcinoma cólon":"C18.9","adenocarcinoma reto":"C20","adenocarcinoma gástrico":"C16.9",
  "adenocarcinoma pâncreas":"C25.9","adenocarcinoma pulmão":"C34.1","carcinoma pulmão":"C34.1",
  "adenocarcinoma mama":"C50.9","carcinoma mama":"C50.9","adenocarcinoma ovário":"C56",
  "carcinoma ovário":"C56","carcinoma próstata":"C61","adenocarcinoma próstata":"C61",
  "carcinoma esôfago":"C15.9","carcinoma esôfago/jeg":"C16.0","carcinoma cabeça pescoço":"C14.8",
  "carcinoma bexiga":"C67.9","carcinoma rim":"C64","carcinoma colo útero":"C53.9",
  "carcinoma endométrio":"C54.1","melanoma":"C43.9","carcinoma tireóide":"C73",
  "linfoma":"C85.9","leucemia":"C95.9","mieloma":"C90.0","carcinoma hepatocelular":"C22.0",
};
const getCID=(diag)=>{const d=(diag||"").toLowerCase();return Object.entries(CID_DB).find(([k])=>d.includes(k))?.[1]||"";};
const getTNMEstadio=(tnm)=>{if(!tnm)return"";const t=tnm.toUpperCase();if(t.includes("M1"))return"IV";if(t.match(/T[34]|N[23]/))return"III";if(t.match(/T2|N1/))return"II";return"I";};
const ECOG_OPTS=["0 — Ativo, sem restrição","1 — Restrição leve, deambula","2 — Acamado <50% do dia","3 — Acamado >50% do dia","4 — Completamente incapacitado"];
const LINHA_OPTS=["1ª linha","2ª linha","3ª linha","4ª linha ou mais","Neoadjuvante","Adjuvante","Perioperatório","Paliativo"];

function BiomarcadoresSelector({pac,up}){
  const [tumorSel,setTumorSel]=useState(null);
  const TUMORES=Object.entries(BIOM).map(([k,v])=>({k,t:v.t}));
  const dados=tumorSel?BIOM[tumorSel]:null;
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
      {TUMORES.map(x=><button key={x.k} onClick={()=>setTumorSel(tumorSel===x.k?null:x.k)} style={{...sc_.btn(tumorSel===x.k?"navy":"ghost",{fontSize:10,padding:"6px 4px",textAlign:"center",lineHeight:1.3})}}>
        {x.t.substring(0,20)}{x.t.length>20?"...":""}
      </button>)}
    </div>
    {dados&&<div style={{background:"#F8FAFC",borderRadius:12,padding:12,border:"1px solid #CBD5E1"}}>
      <strong style={{color:N,display:"block",marginBottom:8,fontSize:13}}>{dados.t}</strong>
      <div style={{display:"grid",gap:5,marginBottom:10}}>
        {dados.cat.map((x,i)=><div key={i} onClick={()=>up("bio",x.n+" — "+x.def)} style={{display:"flex",gap:9,alignItems:"center",border:`1px solid ${x.c}44`,borderRadius:9,padding:"6px 10px",cursor:"pointer",background:pac.bio?.includes(x.n)?"#FFFBEB":"#fff"}}>
          <div style={{width:8,height:8,background:x.c,borderRadius:"50%",flexShrink:0}}/>
          <div style={{flex:1}}><strong style={{color:N,fontSize:11}}>{x.n}</strong> <span style={{color:"#64748B",fontSize:9}}>{x.def}</span></div>
          <span style={{color:x.c,fontSize:9,fontWeight:700}}>{x.tx.substring(0,20)}</span>
        </div>)}
      </div>
      <div style={{borderTop:"1px solid #E2E8F0",paddingTop:8}}>
        <small style={{color:"#64748B",fontWeight:700,display:"block",marginBottom:4}}>Marcadores relevantes:</small>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {dados.mk.map((m,i)=><span key={i} style={{background:N,color:"#fff",padding:"2px 7px",borderRadius:999,fontSize:9,fontWeight:700}}>{m}</span>)}
        </div>
      </div>
    </div>}
  </div>;
}

const gerarHTMLPremium=(titulo,conteudo,tipo)=>{
  const C={prontuario:"#1B365D",receita:"#15803D",laudo:"#1B365D"}[tipo]||"#1B365D";
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${titulo}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;background:#F0F4F8;padding:20px;font-size:13px}.pg{background:#fff;max-width:780px;margin:0 auto;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.12);overflow:hidden}.hd{background:${C};padding:18px 24px;display:flex;justify-content:space-between;align-items:center}.hn{color:#fff;font-size:14px;font-weight:900}.hs{color:rgba(255,255,255,.55);font-size:10px;margin-top:2px}.bd{background:#B8860B;color:${C};padding:4px 12px;border-radius:20px;font-size:10px;font-weight:900;text-transform:uppercase}.ct{padding:22px 24px}h1{color:${C};font-size:16px;font-weight:900;border-bottom:3px solid #B8860B;padding-bottom:7px;margin-bottom:14px}pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:12px;line-height:1.8;color:#1E293B;background:#F8FAFC;border-left:4px solid #B8860B;padding:12px 14px;border-radius:0 8px 8px 0;margin-bottom:14px}.sl{border-top:1px solid #CBD5E1;margin-top:30px;padding-top:4px;font-size:10px;color:#64748B;text-align:center}.ft{border-top:2px solid #E2E8F0;padding:12px 24px;display:flex;justify-content:space-between;background:#F8FAFC;font-size:10px;color:#64748B}.np{margin-top:18px;text-align:center}.bp{background:#B8860B;color:${C};border:none;padding:11px 28px;font-size:13px;border-radius:8px;cursor:pointer;font-family:Georgia,serif;font-weight:900}@media print{body{background:#fff;padding:0}.pg{box-shadow:none}.np{display:none}}</style>
  </head><body><div class="pg"><div class="hd"><div><div class="hn">HOSPITAL DO BEM · Unidade Oncológica</div><div class="hs">Complexo Hospitalar Regional Dep. Janduhy Carneiro · Patos/PB</div></div><div class="bd">${tipo?.toUpperCase()||"DOCUMENTO"}</div></div><div class="ct"><h1>${titulo}</h1><pre>${(conteudo||"").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre><div class="sl">Dr. Silas Negrão Serra Jr. · CRM-PB 17341 · RQE Oncologia Clínica 9099</div></div><div class="ft"><span><strong>Hospital do Bem</strong> · Patos/PB</span><span>Emitido: ${new Date().toLocaleString("pt-BR")}</span></div></div><div class="np"><button class="bp" onclick="window.print()">🖨 Imprimir / Salvar PDF</button></div></body></html>`;
};

const abrirPremium=(titulo,conteudo,tipo)=>{
  const html=gerarHTMLPremium(titulo,conteudo,tipo||"prontuario");
  try{
    const w=window.open("","_blank","width=820,height=700,scrollbars=yes");
    if(w&&w.document){w.document.open();w.document.write(html);w.document.close();}
    else{// fallback: data URI sem popup bloqueado
      const a=document.createElement("a");
      a.href="data:text/html;charset=utf-8,"+encodeURIComponent(html);
      a.download=(titulo.replace(/[^a-zA-Z0-9]/g,"_").substring(0,40)||"documento")+".html";
      document.body.appendChild(a);a.click();document.body.removeChild(a);
    }
  }catch(e){navigator.clipboard?.writeText(titulo+"\n\n"+conteudo);alert("Pressione Ctrl+P para imprimir. O texto foi copiado para a área de transferência.");}
};

const toN=v=>Number((v||"0").replace(",","."))||0;
const cDose=(dr,sc,clcr,auc,red)=>{const f=1-(red/100);if(dr.t==="m2")return`${Math.round(dr.d*toN(sc)*f)} mg`;if(dr.t==="fix")return`${Math.round(dr.d*f)} mg`;return`${Math.round((toN(auc)||dr.d)*(toN(clcr)+25)*f)} mg`;};
const calcGlosa=(docs=[],p={})=>{const tot=DOCS_OBR.reduce((s,d)=>s+d.peso,0);const pts=DOCS_OBR.filter(d=>docs.includes(d.id)).reduce((s,d)=>s+d.peso,0);const flds=[p.nome,p.cpf,p.cns,p.diag,p.cid,p.trat].filter(Boolean).length;const sc=Math.round((pts/tot)*70+(flds/6)*30);return sc>=85?{sc,cor:VE,bg:"#EAF7EE",txt:"Baixo risco"}:sc>=65?{sc,cor:AM,bg:"#FFF7E6",txt:"Moderado"}:{sc,cor:VM,bg:"#FDECEC",txt:"Alto risco"};};
const fmtTime=s=>{if(s<=0)return"Concluído";const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;return h>0?`${h}h ${m}m`:`${m}m${String(ss).padStart(2,"0")}s`;};
const DISCLAIMER="\n\n\u26a0 NOTA LEGAL: Esta \xe9 apenas uma sugest\xe3o de conduta cl\xednica baseada no hist\xf3rico oncol\xf3gico do paciente. O m\xe9dico plantonista n\xe3o est\xe1 obrigado a seguir esta conduta, devendo agir conforme seu julgamento cl\xednico e as condi\xe7\xf5es do servi\xe7o.";
const prescHosp=(sins,pac)=>{
  const emerg=SINAIS_T.filter(s=>sins.includes(s.id)&&s.n==="verm");
  if(!emerg.length)return"";
  const temFebre=emerg.some(s=>s.id==="febre");
  return `SUGEST\xc3O DE CONDUTA \u2014 INTERCORR\xeaNCIA ONCOL\xd3GICA${temFebre?" (NEUTROPENIA FEBRIL SUSPEITA)":""}\nData: ${new Date().toLocaleDateString("pt-BR")}\nPaciente: ${pac.nome||"___"}\nDiagn\xf3stico: ${pac.diag||"\u2014"} \xb7 Protocolo: ${pac.trat||"\u2014"}\nAlergias: ${pac.alerg||"\u2014"}\n\n${temFebre?"CONDUTA SUGERIDA:\n1. SF 0,9% 500 mL IV cont\xednuo\n2. Piperacilina-Tazobactam 4,5 g IV 8/8h (ap\xf3s hemoculturas)\n3. Dipirona 1 g IV 6/6h se Tax > 37,8\xb0C (se n\xe3o al\xe9rgico)\n4. Hemoculturas \xd7 2 perif\xe9ricas ANTES do ATB\n5. Hemograma + PCR + Procalcitonina + Ureia + Creatinina URGENTE\n6. RX t\xf3rax AP\n7. Isolamento de contato\n8. Monitoriza\xe7\xe3o cont\xednua de sinais vitais":"CONDUTA SUGERIDA:\n1. Avalia\xe7\xe3o cl\xednica completa\n2. Hemograma URGENTE\n3. Acesso venoso perif\xe9rico\n4. Hidrata\xe7\xe3o com SF 0,9% conforme avalia\xe7\xe3o\n5. Monitoriza\xe7\xe3o de sinais vitais"}\n${DISCLAIMER}\n\n${HOSP}`;
};
const conductaVomitos=`CONDUTA SUGERIDA \u2014 V\xd4MITOS EM PACIENTE ONCOL\xd3GICO\n\nMEDICAMENTOS (sob crit\xe9rio do plantonista):\n1. Ondansetrona 8 mg IV/IM 8/8h\n2. Metoclopramida 10 mg IV 8/8h (se refrat\xe1rio)\n3. Dexametasona 4 mg IV 8/8h (se n\xe3o em uso)\n4. SF 0,9% 500 mL IV se sinais de desidrata\xe7\xe3o\n5. Reposi\xe7\xe3o de KCl se hipocalemia\n\nORIENTA\xc7\xd5ES NUTRICIONAIS:\n\u2022 Dieta zero por 4\u20136h; depois l\xedquidos claros frios\n\u2022 Refei\xe7\xf5es pequenas e frequentes (6\u20138\xd7/dia)\n\u2022 Alimentos frios ou em temperatura ambiente\n\u2022 Evitar gorduras, frituras, odores fortes ao cozinhar\n\u2022 Gelo picado ou picol\xe9 de fruta podem ajudar\n\u2022 \xc1gua de coco, isot\xf4nico, soro caseiro\n\u2022 Arroz, ma\xe7\xe3 sem casca, torrada, banana${DISCLAIMER}\n\n${HOSP}`;
const conductaDiarreia=`CONDUTA SUGERIDA \u2014 DIARREIA EM PACIENTE ONCOL\xd3GICO\n\nMEDICAMENTOS (sob crit\xe9rio do plantonista):\n1. Loperamida 4 mg VO inicial + 2 mg ap\xf3s cada evacua\xe7\xe3o (m\xe1x 16 mg/dia)\n2. Hidrata\xe7\xe3o oral intensa (SRO, \xe1gua de coco, isot\xf4nico)\n3. SF 0,9% 500\u20131000 mL IV se desidrata\xe7\xe3o cl\xednica\n4. Reposi\xe7\xe3o eletr\xfal\xedtica conforme ionograma\n5. Coprocultura se febre associada\n6. Suspender irinotecano/capecitabina se grau \u2265 3\n\nORIENTA\xc7\xd5ES NUTRICIONAIS:\n\u2022 Dieta BRAT: Banana \xb7 Arroz \xb7 Ma\xe7\xe3 sem casca \xb7 Torrada\n\u2022 Frango cozido desfiado, batata cozida sem casca\n\u2022 Evitar leite e derivados, frutas \xe1cidas, sucos, fibras insol\xfaveis\n\u2022 Evitar alimentos crus, gordurosos, condimentados, cafe\xedna, \xe1lcool\n\u2022 M\xednimo 2\u20133 litros de l\xedquidos/dia (agua, ch\xe1 sem leite)\n\u2022 Fracionar em 6\u20138 refei\xe7\xf5es pequenas${DISCLAIMER}\n\n${HOSP}`;

const sc_={card:(e={})=>({background:"#fff",border:"1px solid #CBD5E1",borderRadius:16,padding:16,boxShadow:"0 3px 12px rgba(15,23,42,.05)",...e}),btn:(v,e={})=>({border:"none",cursor:"pointer",fontWeight:800,borderRadius:10,padding:"9px 16px",fontSize:13,fontFamily:"inherit",transition:"all .15s",...(v==="gold"?{background:G,color:"#fff"}:v==="navy"?{background:N,color:"#fff"}:v==="teal"?{background:T,color:"#fff"}:v==="red"?{background:VM,color:"#fff"}:v==="green"?{background:VE,color:"#fff"}:{background:"#fff",color:N,border:"1px solid #CBD5E1"}),...e}),inp:{width:"100%",border:"1px solid #CBD5E1",borderRadius:9,padding:"9px 11px",fontFamily:"inherit",fontSize:13,outline:"none",background:"#F8FAFC",boxSizing:"border-box",color:"#1E293B"}};
const sc={card:(e={})=>({background:"#fff",border:"1px solid #E2E8F0",borderRadius:13,padding:14,boxShadow:"0 2px 8px rgba(15,23,42,.06)",...e}),inp:{width:"100%",border:"1px solid #CBD5E1",borderRadius:8,padding:"8px 10px",fontFamily:"inherit",fontSize:12,outline:"none",background:"#F8FAFC",boxSizing:"border-box",color:"#1E293B"},btn:(v,e={})=>({border:"none",cursor:"pointer",fontWeight:800,borderRadius:9,padding:"8px 14px",fontSize:12,fontFamily:"inherit",transition:"all .15s",...({gold:{background:G,color:"#fff"},navy:{background:N,color:"#fff"},teal:{background:T,color:"#fff"},red:{background:VM,color:"#fff"},green:{background:VE,color:"#fff"},ghost:{background:"#F1F5F9",color:N,border:"1px solid #E2E8F0"},warn:{background:AM,color:"#fff"}})[v],...e})};
const TODAY=()=>new Date().toLocaleDateString("pt-BR");
const NOW=()=>new Date().toLocaleString("pt-BR");

const STATUS_DOSSIE=[
  {id:"pre_consulta",label:"Pré-consulta iniciada",cor:T},
  {id:"aguardando_recepcao",label:"Aguardando recepção",cor:AM},
  {id:"recepcao_conferencia",label:"Recepção em conferência",cor:G},
  {id:"documentos_anexados",label:"Documentos anexados",cor:T},
  {id:"claude_processando",label:"Claude processando",cor:AM},
  {id:"pronto_medico",label:"Pronto para médico",cor:VE},
  {id:"em_consulta",label:"Em consulta",cor:N},
  {id:"evolucao_salva",label:"Evolução salva",cor:VE},
  {id:"apac_validacao",label:"APAC em validação",cor:AM},
  {id:"apac_pronta",label:"APAC pronta",cor:VE},
  {id:"pendencia_administrativa",label:"Pendência administrativa",cor:VM},
];
const statusDossieMeta=id=>STATUS_DOSSIE.find(s=>s.id===id)||STATUS_DOSSIE[0];
const criarDossieInicial=pac=>({
  id:"DOS-"+Date.now(),
  status:"pre_consulta",
  paciente:{...(pac||{})},
  recepcao:{conferido:false,conferidoEm:null,observacoes:""},
  documentos:[],
  resumoClaude:"",
  evolucao:{rascunho:"",textoFinal:"",salvaEm:null},
  documentosGerados:[],
  apac:{campos:{},pendencias:[],riscoGlosa:"alto"},
  createdAt:NOW(),
  updatedAt:NOW(),
});
function dossiePacienteKey(pac={}){
  const id=pac.pacID||pac.cpf||pac.cns||pac.nome||"sem_paciente";
  return "dossie_oncologico_"+String(id).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_");
}
function normalizaPacienteValor(v){return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();}
function mesmoPacienteDossie(dossie={},pac={}){
  const dp=dossie?.paciente||{};
  const idKeys=["pacID","cpf","cns"];
  for(const k of idKeys){
    const a=normalizaPacienteValor(dp[k]);
    const b=normalizaPacienteValor(pac[k]);
    if(a&&b&&a===b)return true;
  }
  const nomeA=normalizaPacienteValor(dp.nome||dp.pac);
  const nomeB=normalizaPacienteValor(pac.nome||pac.pac);
  const nascA=normalizaPacienteValor(dp.nasc||dp.data_nascimento);
  const nascB=normalizaPacienteValor(pac.nasc||pac.data_nascimento);
  if(nomeA&&nomeB&&nomeA===nomeB&&(!nascA||!nascB||nascA===nascB))return true;
  const temConteudo=!!(dossie?.resumoClaude||dossie?.documentos?.length||dossie?.evolucao?.textoFinal||dossie?.evolucao?.rascunho);
  if(temConteudo&&nomeA&&nomeB&&nomeA!==nomeB)return false;
  return !temConteudo;
}
function loadDossiePaciente(pac={}){
  try{const raw=localStorage.getItem(dossiePacienteKey(pac));if(raw){const d=JSON.parse(raw);if(d?.id)return d;}}catch(_){}
  return null;
}
function saveDossiePaciente(dossie){
  try{
    if(!dossie?.id)return;
    const paciente=dossie.paciente||{};
    localStorage.setItem("dossie_oncologico_atual",JSON.stringify(dossie));
    localStorage.setItem(dossiePacienteKey(paciente),JSON.stringify(dossie));
    const lista=JSON.parse(localStorage.getItem("dossies_oncologicos_lista")||"[]").filter(x=>x.id!==dossie.id);
    lista.unshift({id:dossie.id,key:dossiePacienteKey(paciente),paciente:{nome:paciente.nome,cpf:paciente.cpf,cns:paciente.cns,nasc:paciente.nasc,pacID:paciente.pacID},status:dossie.status,updatedAt:dossie.updatedAt||NOW()});
    localStorage.setItem("dossies_oncologicos_lista",JSON.stringify(lista.slice(0,60)));
  }catch(_){}
}
async function copiarTexto(texto){
  const t=String(texto||"");
  try{await navigator.clipboard.writeText(t);return true;}
  catch(_){
    try{const ta=document.createElement("textarea");ta.value=t;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.left="-9999px";document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);return true;}
    catch(e){alert("Não foi possível copiar automaticamente. Selecione o texto e use Ctrl+C.");return false;}
  }
}
const resumoDocDossie=d=>{
  const docs=d?.documentos||[];
  if(!docs.length)return "Nenhum documento anexado.";
  return docs.map((x,i)=>[(i+1)+".",x.tipo||"Documento",x.nome||x.link||"sem nome",x.origem?("("+x.origem+")"):"",x.resumo?("- "+x.resumo):""].filter(Boolean).join(" ")).join("\n");
};
function gerarTextoEvolucao(dossie){
  const p=dossie?.paciente||{};
  const clin=[
    "Antecedentes patológicos: "+(p.antec||"—"),
    "Medicações de uso contínuo: "+(p.meds||"—"),
    "Alergias: "+(p.alerg||"—"),
    "Cirurgias prévias: "+(p.anam_cirurgia||"—"),
    "Vacinação: "+(p.vacinas||"—"),
    "Histórico familiar: "+(p.anam_hist_fam||"—"),
    "Sintomas atuais: "+(p.queixa||"—"),
  ].join("\n");
  const onco=[
    "Diagnóstico: "+(p.diag||"—"),
    "CID-10: "+(p.cid||"—"),
    "Estadiamento/TNM: "+([p.estadio,p.tnm].filter(Boolean).join(" · ")||"—"),
    "Subtipo molecular / biomarcadores: "+(p.bio||"—"),
    "ECOG: "+(p.ecog||"—"),
    "Protocolo proposto: "+(p.trat||"—"),
  ].join("\n");
  const exames=[p.exames_resumo||"",p.docs_drive_resumo||"",dossie?.resumoClaude||"",resumoDocDossie(dossie)].filter(Boolean).join("\n\n");
  return [
    "PRONTUÁRIO — EVOLUÇÃO",
    "Data: "+TODAY(),
    "",
    "DADOS ANAGRÁFICOS",
    "Paciente: "+(p.nome||"—"),
    "Nascimento: "+(p.nasc||"—")+" · CPF: "+(p.cpf||"—")+" · CNS: "+(p.cns||"—"),
    "Mãe: "+(p.mae||"—")+" · Município: "+(p.cidade||p.municipio||"—"),
    "Telefone: "+(p.tel||"—"),
    "",
    "DADOS CLÍNICOS",
    clin,
    "",
    "DADOS ONCOLÓGICOS",
    onco,
    "",
    "EXAMES",
    exames||"Sem exames resumidos no dossiê.",
    "",
    "LABORATÓRIO / EXAME FÍSICO",
    "",
    "",
    "CONDUTA",
    "",
    "",
    "OBS — SUGESTÕES CLAUDE",
    dossie?.resumoClaude||"Aguardando organização pela IA. Claude deve organizar dados e pendências, sem decidir conduta.",
  ].join("\n");
}
function validarAPAC(dossie){
  const p=dossie?.paciente||{};
  const final=dossie?.evolucao?.textoFinal||dossie?.evolucao?.rascunho||"";
  const campos={
    nome:p.nome,cpf:p.cpf,cns:p.cns,mae:p.mae,municipio:p.cidade||p.municipio,cid:p.cid,
    diagnostico_histologico:p.diag,data_biopsia:p.data_biopsia,estadiamento:p.estadio||p.tnm,
    procedimento_sigtap:p.cod_proc,linha_protocolo:p.linha||p.trat,justificativa:p.justif_apac||final,
    laudos:(dossie?.documentos||[]).length>0,peso_altura:p.peso&&p.altura,funcao_renal_hepatica:p.exames_resumo||p.exames_lab?.length,
  };
  const req=[
    ["nome","Nome"],["cpf","CPF"],["cns","CNS"],["mae","Nome da mãe"],["municipio","Município"],
    ["cid","CID-10"],["diagnostico_histologico","Diagnóstico histológico"],["data_biopsia","Data da biópsia"],
    ["estadiamento","Estadiamento"],["procedimento_sigtap","Procedimento SIGTAP"],["linha_protocolo","Linha/protocolo"],
    ["justificativa","Justificativa clínica"],["laudos","Laudos comprobatórios"],["peso_altura","Peso/altura/SC"],
    ["funcao_renal_hepatica","Função renal/hepática"],
  ];
  const pendencias=req.filter(([k])=>!campos[k]||String(campos[k]).trim()==="").map(([,l])=>l);
  const criticas=["Nome","CPF","CNS","CID-10","Diagnóstico histológico","Estadiamento","Procedimento SIGTAP","Justificativa clínica"].filter(x=>pendencias.includes(x));
  const riscoGlosa=criticas.length?"alto":pendencias.length?"moderado":"baixo";
  return {campos,pendencias,criticas,riscoGlosa,completa:pendencias.length===0};
}
function gerarDocumentosSelecionados(dossie,selecao){
  const p=dossie?.paciente||{};
  const ev=dossie?.evolucao?.textoFinal||dossie?.evolucao?.rascunho||"";
  const cab="Paciente: "+(p.nome||"—")+" · CPF: "+(p.cpf||"—")+" · Data: "+TODAY()+"\n"+AUTOR+" · "+HOSP;
  const map={
    sintomaticos:"RECEITA DE SINTOMÁTICOS\n\n"+cab+"\n\n1. Ondansetrona 8 mg — usar conforme náuseas.\n2. Dipirona 500 mg — se dor ou febre, conforme orientação médica.\n3. Pantoprazol 40 mg — se dispepsia/uso de corticoide.",
    antiemeticos:"RECEITA DE ANTIEMÉTICOS\n\n"+cab+"\n\nOndansetrona 8 mg, Metoclopramida 10 mg e Dexametasona conforme protocolo e avaliação médica.",
    analgesia:"RECEITA DE ANALGESIA\n\n"+cab+"\n\nEscalonar analgesia conforme dor, função renal/hepática e tolerância.",
    medicacao_ev:"MEDICAÇÃO ENDOVENOSA\n\n"+cab+"\n\nPrescrição EV deve ser validada pelo médico antes da administração.",
    exames:"SOLICITAÇÃO DE EXAMES\n\n"+cab+"\n\nHemograma, ureia, creatinina, TGO, TGP, bilirrubinas e exames dirigidos conforme evolução.",
    dieta:"ORIENTAÇÕES DIETÉTICAS\n\n"+cab+"\n\nHidratação, fracionamento alimentar e retorno se sinais de alarme.",
    alarme:"SINAIS DE ALARME\n\n"+cab+"\n\nFebre, falta de ar, sangramento, vômitos persistentes, diarreia intensa ou piora do estado geral: procurar urgência.",
    termo:"TERMO DE CONSENTIMENTO\n\n"+cab+"\n\nTratamento proposto: "+(p.trat||"—")+". Riscos, benefícios e alternativas discutidos em consulta.",
    apac:"APAC — RASCUNHO CLÍNICO\n\n"+cab+"\n\nBaseado na evolução salva:\n"+ev.slice(0,1800),
  };
  return Object.entries(selecao||{}).filter(([,v])=>v).map(([k])=>({id:k,titulo:k.replace(/_/g," ").toUpperCase(),texto:map[k]||""}));
}
async function gerarDossieClaude(dossie){
  const base=gerarTextoEvolucao(dossie);
  const prompt=[
    "Você é assistente de organização clínica oncológica.",
    "Organize os dados do dossiê em resumo objetivo para o médico validar.",
    "Não decida conduta e deixe CONDUTA em branco.",
    "Aponte pendências de estadiamento, biomarcadores, exames e APAC.",
    "",
    base
  ].join("\n");
  let resumo="";
  try{resumo=await chamarClaude(prompt,1100);}catch(_){}
  const avisoClaude=String(resumo||"").startsWith("⚠")?String(resumo):"";
  if(!resumo||avisoClaude)resumo=[
    avisoClaude,
    avisoClaude?"":"",
    "Resumo local do dossiê:",
    resumoDocDossie(dossie),
    "",
    "Pendências possíveis: conferir CID, estadiamento, biomarcadores, laudos comprobatórios e dados APAC.",
    "Conduta permanece em branco para validação médica."
  ].filter(Boolean).join("\n");
  const novo={...dossie,resumoClaude:resumo,status:"pronto_medico",updatedAt:NOW()};
  novo.evolucao={...(dossie.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};
  novo.apac=validarAPAC(novo);
  return novo;
}

function Btn({v="gold",onClick,ch,s={},dis=false}){return <button disabled={dis} style={{...sc_.btn(v),opacity:dis?.5:1,...s}} onClick={onClick}>{ch}</button>;}
function Card({ch,s={}}){return <div style={sc_.card(s)}>{ch}</div>;}
function H2({ch,s={}}){return <h2 style={{margin:"0 0 12px",color:N,fontSize:19,fontWeight:900,...s}}>{ch}</h2>;}
function H3({ch,s={}}){return <h3 style={{margin:"0 0 9px",color:N,fontSize:15,fontWeight:900,...s}}>{ch}</h3>;}
function Fld({l,val,set,ta,rows=2,ph}){
  const advance=e=>{if(e.key==="Enter"&&!ta){e.preventDefault();const all=Array.from(document.querySelectorAll("input,select,textarea"));const i=all.indexOf(e.target);if(i<all.length-1)all[i+1].focus();}};
  return <label style={{display:"grid",gap:3,marginBottom:8}}>
    <span style={{fontSize:12,fontWeight:800,color:N,textTransform:"uppercase",letterSpacing:.3}}>{l}</span>
    {ta?<textarea rows={rows} value={val||""} onChange={e=>set(e.target.value)} placeholder={ph} style={{...sc_.inp,resize:"vertical",fontSize:14}}/>
       :<input value={val||""} onChange={e=>set(e.target.value)} onKeyDown={advance} placeholder={ph} style={{...sc_.inp,fontSize:14}}/>}
  </label>;
}
function G2({ch,s={}}){return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,...s}}>{ch}</div>;}
function Tbl({cols,rows}){return <div style={{overflowX:"auto",borderRadius:10,border:"1px solid #CBD5E1"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{cols.map(c=><th key={c} style={{background:N,color:"#fff",padding:"7px 10px",textAlign:"left",fontSize:11}}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} style={{background:i%2?"#F8FAFC":"#fff"}}>{r.map((c,j)=><td key={j} style={{padding:"7px 10px",fontSize:12,borderTop:"1px solid #F1F5F9"}}>{c}</td>)}</tr>)}</tbody></table></div>;}
function Cbox({text,maxH=200}){const[cp,setCp]=useState(false);return <div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}><button style={sc_.btn("ghost",{fontSize:10,padding:"3px 9px"})} onClick={async()=>{await copiarTexto(text);setCp(true);setTimeout(()=>setCp(false),1300);}}>{cp?"✓ Copiado":"Copiar"}</button></div><pre style={{whiteSpace:"pre-wrap",lineHeight:1.58,margin:0,background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:10,padding:12,fontSize:13,maxHeight:maxH,overflowY:"auto",fontFamily:"Segoe UI, Arial, sans-serif",fontWeight:650,color:N}}>{text}</pre></div>;}
function Bge({t="muted",ch}){const m={ok:{bg:"#EAF7EE",c:VE},warn:{bg:"#FFF7E6",c:AM},bad:{bg:"#FDECEC",c:VM},muted:{bg:"#F1F5F9",c:"#64748B"},gold:{bg:"#FDF3DC",c:G}};const x=m[t]||m.muted;return <span style={{display:"inline-flex",padding:"2px 9px",borderRadius:999,fontSize:10,fontWeight:900,background:x.bg,color:x.c}}>{ch}</span>;}
function TopBarOld({title,back,alertCount=0,onAlert}){return <div style={{background:N,color:"#fff",padding:"7px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,.25)"}}>{back&&<button onClick={back} style={{background:"none",border:"1px solid rgba(255,255,255,.25)",color:"#fff",padding:"4px 11px",borderRadius:999,cursor:"pointer",fontSize:11}}>← Voltar</button>}<div style={{flex:1}}><div style={{fontWeight:900,fontSize:14}}>{title}</div><div style={{fontSize:9,color:G,fontWeight:700}}>Dr. Silas Negrão · {HOSP}</div></div>{alertCount>0&&<div style={{background:VM,color:"#fff",padding:"4px 13px",borderRadius:999,fontSize:12,fontWeight:900,cursor:"pointer",flexShrink:0}} onClick={onAlert}>🚨 {alertCount} alerta{alertCount>1?"s":""}</div>}</div>;}

function TriagemComp({sins,setSins,pac}){
  const sel=SINAIS_T.filter(s=>sins.includes(s.id));
  const niv=sel.some(s=>s.n==="verm")?"verm":sel.some(s=>s.n==="amar")?"amar":sel.some(s=>s.n==="verd")?"verd":"neutro";
  const NI=NIV[niv];const presc=prescHosp(sins,pac);
  return <G2 ch={<>
    <div style={sc_.card()}>
      <H2 ch="Triagem Oncológica"/>
      <div style={{background:NI.bg,borderRadius:13,padding:"11px 14px",marginBottom:12,border:`2px solid ${NI.cor}44`}}>
        <strong style={{color:NI.cor,fontSize:18,display:"block"}}>{NI.label}</strong>
        <span style={{color:NI.cor,fontSize:13}}>{NI.instrucao}</span>
      </div>
      <div style={{display:"grid",gap:5}}>
        {SINAIS_T.map(s=>{const at=sins.includes(s.id);const cc={verm:VM,amar:AM,verd:VE}[s.n];const cb={verm:"#FDECEC",amar:"#FFF7E6",verd:"#EAF7EE"}[s.n];return <label key={s.id} style={{display:"flex",gap:9,alignItems:"center",border:`1.5px solid ${at?cc:"#CBD5E1"}`,borderRadius:11,padding:"9px 12px",cursor:"pointer",background:at?cb:"#fff",fontSize:13,fontWeight:700}}><input type="checkbox" checked={at} onChange={()=>setSins(x=>x.includes(s.id)?x.filter(i=>i!==s.id):[...x,s.id])}/><span style={{color:at?cc:"#374151"}}>{s.txt}</span></label>;})}
      </div>
    </div>
    <div style={{display:"grid",gap:12,alignContent:"start"}}>
      {niv==="neutro"&&<div style={sc_.card({textAlign:"center",padding:36})}><div style={{fontSize:48,marginBottom:10}}>🩺</div><H2 ch="Selecione os sintomas"/><p style={{color:"#64748B",fontSize:13}}>A classificação aparecerá aqui.</p></div>}
      {niv==="verm"&&<div style={sc_.card({background:"#FDECEC",border:`2px solid ${VM}`})}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}><span style={{fontSize:38}}>🚨</span><h2 style={{color:VM,margin:0,fontSize:17}}>VÁ AO PRONTO-SOCORRO IMEDIATAMENTE</h2></div>
        <p style={{color:"#7F1D1D",fontSize:13,marginBottom:12}}>Não espere. Atendimento urgente agora.</p>
        {presc&&<><H3 ch="📋 Instruções ao plantonista" s={{color:VM}}/><Cbox text={presc}/></>}
      </div>}
      {niv==="amar"&&<div style={sc_.card({background:"#FFF7E6",border:`2px solid ${AM}`})}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:10}}><span style={{fontSize:38}}>⚠️</span><H2 ch="CONTATE A EQUIPE HOJE" s={{color:AM,margin:0}}/></div>
        <p style={{color:"#7C2D12",fontSize:13}}>Avaliação médica ainda hoje. Ligue ao hospital ou vá à UPA.</p>
        <Cbox text={`INTERCORRÊNCIA\nPaciente: ${pac.nome||"___"}\nNível: ATENÇÃO\nSintomas: ${sel.map(s=>s.txt).join("; ")}\n${HOSP}\n${AUTOR}`}/>
      </div>}
      {niv==="verd"&&<div style={sc_.card({background:"#EAF7EE",border:`1px solid ${VE}`})}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}><span style={{fontSize:38}}>💚</span><H2 ch="Sintomas Leves — Orientações" s={{color:VE,margin:0}}/></div>
        {sins.map(id=>{const s=SINAIS_T.find(x=>x.id===id);if(!s||s.n!=="verd")return null;return <div key={id} style={{background:"#fff",borderRadius:10,padding:"9px 12px",marginBottom:7}}><strong style={{color:N,display:"block",fontSize:13,marginBottom:3}}>{s.txt}</strong><p style={{color:"#374151",fontSize:12,margin:0,lineHeight:1.6}}>{ORIENTACOES[id]||"Monitorar. Procurar atendimento se piorar."}</p></div>;})}
      </div>}
    </div>
  </>}/>;
}


const ESTOQUE_IV=[
  {id:"ox50",n:"Oxaliplatina 50 mg",dose:"50 mg/FA",un:"FA",estoque:24,minimo:6},
  {id:"fu500",n:"5-FU 500 mg",dose:"500 mg/FA",un:"FA",estoque:48,minimo:10},
  {id:"lcv100",n:"Leucovorina 100 mg",dose:"100 mg/FA",un:"FA",estoque:30,minimo:6},
  {id:"carbo450",n:"Carboplatina 450 mg",dose:"450 mg/FA",un:"FA",estoque:12,minimo:4},
  {id:"pac300",n:"Paclitaxel 300 mg",dose:"300 mg/FA",un:"FA",estoque:8,minimo:3},
  {id:"pembro100",n:"Pembrolizumabe 100 mg",dose:"100 mg/FA",un:"FA",estoque:4,minimo:2},
  {id:"doxo50",n:"Doxorrubicina 50 mg",dose:"50 mg/FA",un:"FA",estoque:15,minimo:4},
  {id:"gem200",n:"Gemcitabina 200 mg",dose:"200 mg/FA",un:"FA",estoque:36,minimo:8},
  {id:"irinot100",n:"Irinotecano 100 mg",dose:"100 mg/FA",un:"FA",estoque:20,minimo:5},
  {id:"cddp50",n:"Cisplatina 50 mg",dose:"50 mg/FA",un:"FA",estoque:3,minimo:4},
];
const MEDS_ORAIS=[
  {id:"cap500",n:"Capecitabina 500 mg",dose:"500 mg/cp",un:"cp",estoque:840,minimo:200},
  {id:"tamox20",n:"Tamoxifeno 20 mg",dose:"20 mg/cp",un:"cp",estoque:180,minimo:60},
  {id:"anast1",n:"Anastrozol 1 mg",dose:"1 mg/cp",un:"cp",estoque:90,minimo:30},
  {id:"letro25",n:"Letrozol 2,5 mg",dose:"2,5 mg/cp",un:"cp",estoque:60,minimo:30},
  {id:"bica50",n:"Bicalutamida 50 mg",dose:"50 mg/cp",un:"cp",estoque:120,minimo:30},
  {id:"pred5",n:"Prednisona 5 mg",dose:"5 mg/cp",un:"cp",estoque:200,minimo:50},
  {id:"onda8",n:"Ondansetrona 8 mg",dose:"8 mg/cp",un:"cp",estoque:150,minimo:40},
  {id:"dexa4",n:"Dexametasona 4 mg",dose:"4 mg/cp",un:"cp",estoque:10,minimo:20},
];
const PRESC_MOCK=[
  {id:"p1",pac:"Maria Aparecida Santos",proto:"mFOLFOX6",data:new Date().toLocaleDateString("pt-BR"),status:"pendente",
   doses:[{med:"Oxaliplatina 50 mg",dose:"170 mg",via:"IV 2h"},{med:"Leucovorina 100 mg",dose:"800 mg",via:"IV 2h"},{med:"5-FU 500 mg",dose:"4800 mg infusional",via:"IV 46h"}]},
  {id:"p2",pac:"João Pedro Ferreira",proto:"Carboplatina + Paclitaxel",data:new Date().toLocaleDateString("pt-BR"),status:"pendente",
   doses:[{med:"Paclitaxel 300 mg",dose:"315 mg",via:"IV 3h"},{med:"Carboplatina 450 mg",dose:"675 mg",via:"IV 30min"}]},
  {id:"p3",pac:"Ana Regina Costa",proto:"AC",data:new Date().toLocaleDateString("pt-BR"),status:"confirmado",
   doses:[{med:"Doxorrubicina 50 mg",dose:"108 mg",via:"IV bolus"},{med:"Ciclofosfamida 500 mg",dose:"1080 mg",via:"IV 30min"}]},
];

function FarmaciaPage({pac,cicloLiberado,setCicloLiberado,mensagens,addMsg,back,alertCount,onAlert}){
  const [abaF,setAbaF]=useState("prescricoes");
  const [stockIV,setStockIV]=useState(ESTOQUE_IV);
  const [stockOral,setStockOral]=useState(MEDS_ORAIS);
  const [print,setPrint]=useState(null);
  const [prescricoes,setPrescricoes]=useState(PRESC_MOCK);
  
  const confirmar=id=>{
    const presc=prescricoes.find(p=>p.id===id);
    if(presc){
      presc.doses.forEach(dose=>{
        const medKey=dose.med.split(" ")[0].toLowerCase();
        setStockIV(x=>x.map(item=>item.n.toLowerCase().includes(medKey)?{...item,estoque:Math.max(0,item.estoque-1)}:item));
      });
      if(addMsg) addMsg("Farmácia","Médico",`✅ Prescrição confirmada para ${presc.pac} — ${presc.proto}.`,"ciclo");
    }
    setPrescricoes(x=>x.map(p=>p.id===id?{...p,status:"confirmado"}:p));
  };

  const ABAS=[
    {id:"prescricoes",l:"📋 Prescrições"},
    {id:"estoque",l:"📦 Estoque"},
    {id:"msgs",l:`💬 Chat${(mensagens||[]).filter(m=>!m.lida&&(m.para==="Farmácia"||m.para==="Todos")).length>0?" 🔴":""}`},
  ];

  return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <TopBar title="Farmácia" back={back} alertCount={alertCount} onAlert={onAlert}/>
    <div style={{background:N,display:"flex",overflowX:"auto",borderBottom:`3px solid ${G}`,flexShrink:0}}>
      {ABAS.map(a=><button key={a.id} onClick={()=>setAbaF(a.id)} style={{border:"none",cursor:"pointer",padding:"9px 14px",fontSize:12,fontWeight:800,whiteSpace:"nowrap",background:abaF===a.id?G:N,color:abaF===a.id?"#fff":"rgba(255,255,255,.5)",flexShrink:0}}>{a.l}</button>)}
    </div>
    <div style={{flex:1,padding:16,overflowY:"auto"}}>

      {abaF==="prescricoes"&&<div style={{display:"grid",gap:10}}>
        {prescricoes.map(p=><div key={p.id} style={{...sc_.card({border:`2px solid ${p.status==="confirmado"?VE:p.status==="pendente"?AM:"#CBD5E1"}`})}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div><strong style={{color:N,display:"block",fontSize:14}}>{p.pac}</strong><span style={{color:T,fontSize:12}}>{p.proto} · {p.data}</span></div>
            <Bge t={p.status==="confirmado"?"ok":p.status==="pendente"?"warn":"muted"} ch={p.status}/>
          </div>
          <div style={{marginBottom:8}}>
            {p.doses?.map((d,i)=><div key={i} style={{fontSize:11,color:"#374151",padding:"2px 0"}}>• {d.med} — {d.dose} — {d.via}</div>)}
          </div>
          {p.status!=="confirmado"&&<div style={{display:"flex",gap:8}}>
            <Btn v="gold" ch="✅ Confirmar e Dispensar" s={{flex:1,fontSize:12}} onClick={()=>confirmar(p.id)}/>
            <Btn v="ghost" ch="🖨" s={{fontSize:11}} onClick={()=>setPrint({t:"Prescrição — "+p.pac,c:`PRESCRIÇÃO ONCOLÓGICA
Data: ${p.data}
Paciente: ${p.pac}
Protocolo: ${p.proto}

${p.doses?.map(d=>`${d.med} — ${d.dose} — ${d.via}`).join("\n")}

${AUTOR}
${HOSP}`})}/>
          </div>}
          {p.status==="confirmado"&&<div style={{color:VE,fontSize:11,fontWeight:700}}>✅ Dispensado e estoque atualizado</div>}
        </div>)}
      </div>}

      {abaF==="estoque"&&<div style={{display:"grid",gap:12}}>
        <div style={sc_.card()}>
          <H2 ch="💊 Estoque Endovenoso"/>
          <div style={{display:"grid",gap:7}}>
            {stockIV.map((m,i)=><div key={m.id} style={{display:"flex",gap:10,alignItems:"center",border:`1px solid ${m.estoque<=m.minimo?VM:"#CBD5E1"}`,borderRadius:10,padding:"8px 11px",background:m.estoque<=m.minimo?"#FFF5F5":"#F8FAFC"}}>
              <div style={{flex:1}}><strong style={{color:N,fontSize:12}}>{m.n}</strong><div style={{color:"#64748B",fontSize:10}}>{m.dose}</div></div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:900,color:m.estoque<=m.minimo?VM:VE,fontSize:14}}>{m.estoque}</div>
                <div style={{fontSize:9,color:"#94A3B8"}}>{m.un} · mín {m.minimo}</div>
              </div>
              {m.estoque<=m.minimo&&<span style={{background:VM,color:"#fff",borderRadius:999,padding:"2px 7px",fontSize:9,fontWeight:900}}>⚠ BAIXO</span>}
            </div>)}
          </div>
        </div>
        <div style={sc_.card()}>
          <H2 ch="💊 Medicamentos Orais"/>
          <div style={{display:"grid",gap:7}}>
            {stockOral.map((m,i)=><div key={m.id} style={{display:"flex",gap:10,alignItems:"center",border:`1px solid ${m.estoque<=m.minimo?VM:"#CBD5E1"}`,borderRadius:10,padding:"8px 11px",background:m.estoque<=m.minimo?"#FFF5F5":"#F8FAFC"}}>
              <div style={{flex:1}}><strong style={{color:N,fontSize:12}}>{m.n}</strong><div style={{color:"#64748B",fontSize:10}}>{m.dose}</div></div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:900,color:m.estoque<=m.minimo?VM:VE,fontSize:14}}>{m.estoque}</div>
                <div style={{fontSize:9,color:"#94A3B8"}}>{m.un} · mín {m.minimo}</div>
              </div>
              {m.estoque<=m.minimo&&<span style={{background:VM,color:"#fff",borderRadius:999,padding:"2px 7px",fontSize:9,fontWeight:900}}>⚠ BAIXO</span>}
            </div>)}
          </div>
        </div>
      </div>}

      {abaF==="msgs"&&<div style={{display:"grid",gap:10}}>
        <H2 ch="💬 Chat Equipe — Farmácia"/>
        {(mensagens||[]).filter(m=>m.para==="Farmácia"||m.de==="Farmácia"||m.para==="Todos").slice(0,15).map((m,i)=><div key={i} style={{...sc_.card({border:`1px solid ${m.para==="Farmácia"&&!m.lida?AM+"66":"#CBD5E1"}`})}}>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:5}}>
            <span style={{fontSize:16}}>{m.tipo==="ciclo"?"💉":m.tipo==="alerta"?"⚠️":"💬"}</span>
            <div style={{flex:1}}>
              <strong style={{color:N,fontSize:12}}>{m.de} → {m.para}</strong>
              <span style={{color:"#94A3B8",fontSize:10,marginLeft:8}}>{m.dt}</span>
            </div>
          </div>
          <p style={{fontSize:12,color:"#374151",margin:0}}>{m.txt}</p>
        </div>)}
        <div style={{...sc_.card({background:"#F8FAFC"})}}>
          <H3 ch="Enviar mensagem"/>
          <textarea rows={2} placeholder="Mensagem para a equipe..." id="farm_msg_txt" style={{...sc_.inp,width:"100%",resize:"none",marginBottom:8}}/>
          <Btn v="teal" ch="📤 Enviar para Médico" s={{width:"100%",fontSize:12}} onClick={()=>{const t=document.getElementById("farm_msg_txt");if(t?.value.trim()){addMsg("Farmácia","Médico",t.value.trim(),"msg");t.value="";}}}/>
        </div>
      </div>}
      <ChatAba mensagens={mensagens} addMsg={addMsg} de="Farmácia"/>
    </div>
    <Footer/>
  </div>;
}

function AlertaDoseForm({pac,onEnviar,hoje}){
  const [med,setMed]=useState("");const [calc,setCalc]=useState("");const [ref2,setRef2]=useState("");const [motivo,setMotivo]=useState("");
  const enviar=()=>{if(!med||!calc||!motivo){alert("Preencha medicamento, dose e motivo.");return;}onEnviar({id:Date.now(),pac:pac.nome||"___",med,calc,obs:motivo,dt:hoje});setMed("");setCalc("");setRef2("");setMotivo("");alert("Alerta enviado ao médico.");};
  return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
    <Fld l="Paciente" val={pac.nome||"—"} set={()=>{}}/>
    <Fld l="Medicamento" val={med} set={setMed}/>
    <Fld l="Dose calculada" val={calc} set={setCalc}/>
    <Fld l="Dose de referência" val={ref2} set={setRef2}/>
    <div style={{gridColumn:"1/-1"}}><Fld l="Motivo do alerta" val={motivo} set={setMotivo} ta rows={3}/></div>
    <div style={{gridColumn:"1/-1"}}><Btn v="red" ch="⚠ Enviar Alerta ao Médico" s={{width:"100%",fontSize:13,padding:10}} onClick={enviar}/></div>
  </div>;
}

function RecepcaoPage({pac,up,setPac,setPg,listaEspera=[],setListaEspera,addFila,agendamentos=[],addAgendamento,funcLogado,mensagens,addMsg,alertCount,onAlert,onEnviar,dossie,setDossie}){
  const [abaRec,setAbaRec]=useState("dados");
  const [print,setPrint]=useState(null);
  const [retSel,setRetSel]=useState(null);
  const [chkNome,setChkNome]=useState("");
  const [chkProto,setChkProto]=useState("");
  const [upFiles,setUpFiles]=useState([]);
  const refCam=useRef(null);const refArq=useRef(null);
  const onCamRec=e=>{const f=Array.from(e.target.files||[]);setUpFiles(x=>[...x,...f.map(fl=>({ico:"📸",n:fl.name,tp:"Foto"}))]);e.target.value="";};
  const onArqRec=e=>{const f=Array.from(e.target.files||[]);setUpFiles(x=>[...x,...f.map(fl=>({ico:"📄",n:fl.name,tp:"Doc"}))]);e.target.value="";};
  const hj=new Date().toLocaleDateString("pt-BR");
  const assLocal=funcLogado||EQUIPE[0];
  const assFmt=`${assLocal.nome}
${assLocal.cargo} ${assLocal.reg}`;
  const recSintVo=`RECEITA MÉDICA — SINTOMÁTICOS (VO)
Data: ${hj}
Nome: ${pac.nome||"___"} · Nasc: ${pac.nasc||"___"} · CPF: ${pac.cpf||"___"}

1. Pantoprazol 20 mg — 1 cp jejum
2. Ondansetrona 8 mg — 1 cp 8/8h×2d pós-QT
3. Metoclopramida 10 mg — 1 cp 8/8h×2d
4. Dexametasona 4 mg — noite anterior + dia seguinte
5. Loperamida 2 mg — 2 cp início, 1cp/2h se diarreia
6. Lactulose — 30 mL 12/12h se obstipação
7. Simeticona 125 mg — 1 cp 8/8h após refeições

${assFmt}
${HOSP}`;
  const recSintEv=`RECEITA — SINTOMÁTICOS EV (UBS/UPA)
Data: ${hj}
Nome: ${pac.nome||"___"}

1. Complexo B — IV em SF 500 mL, 3h
2. Ondansetrona 8 mg — IV em SF 100 mL, 15min
3. Metoclopramida 10 mg — IV em SF 100 mL
4. Noripurum — IV em SF 250 mL, 30min
5. Buscopan — IV em SF 250 mL
6. Dexametasona 10 mg — IV lento

${assFmt}
${HOSP}`;
  const recExames=`REQUISIÇÃO DE EXAMES
Data: ${hj}
Nome: ${pac.nome||"___"}

CICLO 1 / CICLO 2 / CICLO 3:
Hemograma completo · Ureia · Creatinina · TGO · TGP

Favor realizar 2 dias ANTES do próximo ciclo.

${assFmt}
${HOSP}`;
  const RETORNOS=["7 dias","14 dias","21 dias","30 dias","3 meses","6 meses"];
  const dataRetorno=dias=>{const d=new Date();const mp={"7 dias":7,"14 dias":14,"21 dias":21,"30 dias":30,"3 meses":90,"6 meses":180};d.setDate(d.getDate()+(mp[dias]||7));return d.toLocaleDateString("pt-BR");};
  const txtRetorno=retSel?`AGENDAMENTO DE RETORNO
Data: ${dataRetorno(retSel)}

Paciente: ${pac.nome||"___"} · Nasc: ${pac.nasc||"___"}
Retorno em: ${retSel} → ${dataRetorno(retSel)}

Chegue 30 min antes. Traga exames.
${assFmt}
${HOSP}`:"";

  const ABAS_REC=[
    {id:"dados",l:"👤 Cadastro"},
    {id:"upload",l:"📥 Upload/Drive"},
    {id:"novo",l:"➕ Novo Paciente"},
    {id:"limpar",l:"🗑 Limpar Dados"},
    {id:"lista",l:"🧾 Lista de Espera"},
    {id:"agenda_rec",l:"🗓 Agendamento"},
    {id:"retorno",l:"📅 Retorno"},
    {id:"receitas",l:"💊 Receitas"},
  ];

  return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <TopBar title="Recepção" back={()=>setPg("landing")} alertCount={alertCount} onAlert={onAlert}/>
    <div style={{background:N,display:"flex",overflowX:"auto",borderBottom:`3px solid ${G}`,flexShrink:0}}>
      {ABAS_REC.map(a=><button key={a.id} onClick={()=>setAbaRec(a.id)} style={{border:"none",cursor:"pointer",padding:"9px 13px",fontSize:12,fontWeight:800,whiteSpace:"nowrap",background:abaRec===a.id?G:N,color:abaRec===a.id?"#fff":"rgba(255,255,255,.5)",flexShrink:0}}>{a.l}</button>)}
    </div>
    <div style={{flex:1,padding:16,overflowY:"auto"}}><div style={{maxWidth:900,margin:"0 auto"}}>

      {abaRec==="dados"&&<div style={{display:"grid",gap:12}}>
        <div style={sc_.card()}>
          <H2 ch="👤 Dados Demográficos"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Fld l="Nome Completo *" val={pac.nome||""} set={v=>up("nome",v)} ph="Nome do paciente"/>
            <Fld l="Data de Nasc." val={pac.nasc||""} set={v=>up("nasc",v)} ph="DD/MM/AAAA"/>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Sexo</label><select value={pac.sexo||""} onChange={e=>up("sexo",e.target.value)} style={{...sc_.inp,fontSize:12,marginBottom:8}}><option value="">Selecionar...</option><option>Feminino</option><option>Masculino</option><option>Outro</option></select></div>
            <Fld l="CPF" val={pac.cpf||""} set={v=>up("cpf",v)} ph="000.000.000-00"/>
            <Fld l="CNS (Cartão SUS)" val={pac.cns||""} set={v=>up("cns",v)} ph="000 0000 0000 0000"/>
            <Fld l="Telefone" val={pac.tel||""} set={v=>up("tel",v)} ph="(00) 90000-0000"/>
            <Fld l="Cidade / Estado" val={pac.cidade||""} set={v=>up("cidade",v)} ph="Patos / PB"/>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Convênio</label><select value={pac.convenio||""} onChange={e=>up("convenio",e.target.value)} style={{...sc_.inp,fontSize:12,marginBottom:8}}><option value="">Selecionar...</option><option>SUS</option><option>Unimed</option><option>Bradesco Saúde</option><option>Hapvida</option><option>Particular</option></select></div>
          </div>
        </div>
        <div style={sc_.card()}>
          <H2 ch="📁 Laudos no Google Drive"/>
          <p style={{color:"#64748B",fontSize:12,marginBottom:10}}>Informe o nome da pasta no Drive onde os laudos foram salvos. O médico usará este nome para buscar e analisar os arquivos com o Claude.</p>
          <Fld l="Nome da pasta no Drive (laudos)" val={pac.drive_folder||""} set={v=>up("drive_folder",v)} ph="Ex: MARIA SILVA — 1ª VEZ — 19.05.2026"/>
          <p style={{color:"#94A3B8",fontSize:11,marginTop:4}}>Laudos aceitos: biópsia, tomografia, PET-CT, cintilografia, ressonância, laboratório.</p>
        </div>
        <div style={sc_.card()}>
          <H2 ch="📎 Upload de Documentos"/>
          <p style={{color:"#64748B",fontSize:12,marginBottom:10}}>Envie laudos, exames e documentos de encaminhamento.</p>
          <input ref={refCam} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={onCamRec}/>
          <input ref={refArq} type="file" accept=".pdf,.doc,.docx,image/*" multiple style={{display:"none"}} onChange={onArqRec}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
            <div onClick={()=>refCam.current?.click()} style={{border:`2px dashed ${T}`,borderRadius:12,padding:"16px 8px",textAlign:"center",cursor:"pointer",background:"#F0F9FF"}}><div style={{fontSize:24,marginBottom:3}}>📷</div><strong style={{color:T,fontSize:11}}>Câmera</strong><div style={{fontSize:9,color:"#94A3B8"}}>Foto ao vivo</div></div>
            <div onClick={()=>refArq.current?.click()} style={{border:`2px dashed ${G}`,borderRadius:12,padding:"16px 8px",textAlign:"center",cursor:"pointer",background:"#FFFBEB"}}><div style={{fontSize:24,marginBottom:3}}>📁</div><strong style={{color:G,fontSize:11}}>Arquivo</strong><div style={{fontSize:9,color:"#94A3B8"}}>PDF · DOC · IMG</div></div>
            <div onClick={()=>{const el=document.createElement("input");el.type="file";el.accept="image/*";el.onchange=onArqRec;el.click();}} style={{border:`2px dashed ${VE}`,borderRadius:12,padding:"16px 8px",textAlign:"center",cursor:"pointer",background:"#EAF7EE"}}><div style={{fontSize:24,marginBottom:3}}>🖼</div><strong style={{color:VE,fontSize:11}}>Imagem</strong><div style={{fontSize:9,color:"#94A3B8"}}>JPEG · PNG</div></div>
          </div>
          {upFiles.length>0&&<div style={{marginBottom:10}}>{upFiles.map((f,i)=><div key={i} style={{display:"flex",gap:9,alignItems:"center",border:"1px solid #CBD5E1",borderRadius:9,padding:"6px 10px",marginBottom:4,background:"#F8FAFC"}}><span style={{fontSize:16}}>{f.ico}</span><div style={{flex:1}}><span style={{fontSize:12,color:N,fontWeight:700}}>{f.n}</span><span style={{fontSize:9,color:"#94A3B8",marginLeft:6}}>{f.tp}</span></div><button style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:13}} onClick={()=>setUpFiles(x=>x.filter((_,j)=>j!==i))}>✕</button></div>)}</div>}
          <Btn v="gold" ch="✅ Confirmar e Enviar ao Médico" s={{width:"100%",fontSize:13,padding:12,marginTop:4}} onClick={()=>{if(!pac.nome){alert("Informe o nome do paciente.");return;}if(onEnviar)onEnviar();else alert("Paciente registrado com sucesso!");}}/>
        </div>
      <RecepcaoDossiePanel pac={pac} dossie={dossie} setDossie={setDossie} upFiles={upFiles} addMsg={addMsg} onEnviar={onEnviar}/>
      </div>}

      {abaRec==="upload"&&<div style={{display:"grid",gap:12}}>
        <div style={sc_.card()}>
          <H2 ch="📥 Upload/Drive da Recepção"/>
          <p style={{color:"#64748B",fontSize:12,marginBottom:10}}>Rota da recepção para anexar laudos ao dossiê. Todo documento passa pela IA antes de aparecer no prontuário do médico.</p>
          <UploadComIA pac={pac} up={up} addMsg={addMsg} destino="prontuario" origem="Recepção" onConcluido={(res,meta)=>setDossie&&setDossie(d=>{const base=d||criarDossieInicial(pac);const doc={id:Date.now(),tipo:meta?.tipo||"Upload Recepção",nome:meta?.arquivos?.[0]?.n||"Documento recepção",resumo:res,origem:"recepcao_upload",criadoEm:NOW()};const novo={...base,paciente:{...(base.paciente||{}),...pac},documentos:[doc,...(base.documentos||[])],resumoClaude:[base.resumoClaude,res].filter(Boolean).join("\n\n---\n"),status:"documentos_anexados",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo),textoFinal:""};novo.apac=validarAPAC(novo);return novo;})}/>
        </div>
        <DriveDossieComp pac={pac} dossie={dossie} setDossie={setDossie} addMsg={addMsg}/>
      </div>}

      {abaRec==="novo"&&<div style={{display:"grid",gap:12}}>
        <div style={sc_.card({textAlign:"center",padding:28})}>
          <div style={{fontSize:48,marginBottom:12}}>➕</div>
          <h3 style={{color:N,fontWeight:900,marginBottom:8}}>Novo Paciente</h3>
          <p style={{color:"#64748B",fontSize:13,marginBottom:20}}>Limpa os campos atuais e abre um novo cadastro em branco para o próximo paciente.</p>
          <Btn v="gold" ch="Iniciar Novo Cadastro" s={{width:"100%",fontSize:14,padding:13}} onClick={()=>{
            if(window.confirm("Iniciar cadastro de novo paciente? Os dados não salvos serão perdidos.")){
              const novoPac={...PAC0,pacID:genPacID()};
              setPac(novoPac);savePacAtual(novoPac);setUpFiles([]);setAbaRec("dados");
            }
          }}/>
        </div>
        <div style={sc_.card()}>
          <H3 ch="👥 Últimos Cadastrados"/>
          {listaEspera.length===0&&<p style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:12}}>Nenhum paciente na fila ainda.</p>}
          {listaEspera.slice(0,5).map((p,i)=><div key={i} style={{display:"flex",gap:9,alignItems:"center",padding:"7px 10px",borderRadius:9,background:"#F8FAFC",border:"1px solid #E2E8F0",marginBottom:5}}>
            <span style={{fontSize:18}}>👤</span>
            <div style={{flex:1}}><span style={{fontSize:12,color:N,fontWeight:700}}>{p.nome}</span>{p.chegada&&<span style={{fontSize:10,color:"#94A3B8",marginLeft:6}}>{p.chegada}</span>}</div>
            <span style={{fontSize:10,color:p.status==="aguardando"?AM:VE,fontWeight:700}}>{p.status==="aguardando"?"Aguardando":"Em atendimento"}</span>
          </div>)}
        </div>
      </div>}

      {abaRec==="limpar"&&<div style={sc_.card({textAlign:"center",padding:28})}>
        <div style={{fontSize:48,marginBottom:12}}>🗑</div>
        <h3 style={{color:N,fontWeight:900,marginBottom:8}}>Limpar Dados</h3>
        <p style={{color:"#64748B",fontSize:13,marginBottom:8}}>Remove os dados do paciente atual da tela da recepção.</p>
        <p style={{color:"#94A3B8",fontSize:11,marginBottom:20}}>Os registros já salvos no banco de dados não são apagados.</p>
        <Btn v="red" ch="Limpar e Iniciar do Zero" s={{width:"100%",fontSize:14,padding:13,marginBottom:8}} onClick={()=>{
          if(window.confirm("Limpar todos os dados da tela? Esta ação não apaga registros salvos.")){
            const novoPac={...PAC0,pacID:genPacID()};
            setPac(novoPac);savePacAtual(novoPac);setUpFiles([]);setAbaRec("dados");
          }
        }}/>
        <button onClick={()=>setAbaRec("dados")} style={{background:"#F1F5F9",color:N,border:"1px solid #CBD5E1",borderRadius:10,padding:"11px 20px",fontWeight:700,fontSize:13,cursor:"pointer",width:"100%"}}>Cancelar</button>
      </div>}

      {abaRec==="lista"&&<div style={{display:"grid",gap:14}}>
        <div style={sc_.card()}>
          <H2 ch="🧾 Check-in — Gerar Número"/>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div onClick={()=>{if(pac.nome&&addFila){addFila({nome:pac.nome,proto:pac.trat,ciclo:"C1D1",chegada:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),status:"aguardando",pacID:pac.pacID||""});alert(`Check-in: ${pac.nome}`);}}} style={{...sc_.card({flex:1,background:"#EAF7EE",border:`1px solid ${VE}`,padding:12,textAlign:"center",cursor:"pointer",borderRadius:12})}}>
              <div style={{fontSize:22,marginBottom:3}}>📲</div><strong style={{color:VE,fontSize:12}}>Check-in Rápido</strong>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Fld l="Nome" val={chkNome} set={setChkNome}/>
            <Fld l="Protocolo (opcional)" val={chkProto} set={setChkProto}/>
          </div>
          <Btn v="gold" ch="✅ Fazer Check-in" s={{width:"100%",fontSize:14,padding:11,marginTop:6}} dis={!chkNome} onClick={()=>{if(!chkNome.trim())return;if(addFila)addFila({nome:chkNome,proto:chkProto,chegada:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),status:"aguardando"});setChkNome("");setChkProto("");}}/>
        </div>
        <ListaEsperaPrioridade listaEspera={listaEspera} setListaEspera={setListaEspera} onAbrirConsulta={()=>{}}/>
      </div>}

      {abaRec==="agenda_rec"&&<AgendamentoComp agendamentos={agendamentos||[]} addAgendamento={addAgendamento||((a)=>{})} ismedico={false}/>}

      {abaRec==="retorno"&&<div style={{display:"grid",gap:10}}>
        <div style={sc_.card()}>
          <H2 ch="📅 Agendamento de Retorno"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
            {RETORNOS.map(r=><button key={r} onClick={()=>setRetSel(r)} style={{...sc_.btn(retSel===r?"navy":"ghost",{fontSize:12,padding:"8px 4px",textAlign:"center"})}}>{r}</button>)}
          </div>
          {retSel&&<><div style={{background:"#EAF7EE",borderRadius:12,padding:"10px 14px",marginBottom:10,border:`1px solid ${VE}`}}>
            <strong style={{color:N}}>{retSel} → {dataRetorno(retSel)}</strong>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn v="gold" ch="🖨 Imprimir Retorno" s={{flex:1}} onClick={()=>setPrint({t:"Retorno — "+pac.nome,c:txtRetorno})}/>
            <Btn v="ghost" ch="📋 Copiar" onClick={()=>navigator.clipboard?.writeText(txtRetorno)}/>
          </div></>}
        </div>
      </div>}

      {abaRec==="receitas"&&<div style={{display:"grid",gap:10}}>
        {[{t:"💊 Sintomáticos VO",c:recSintVo},{t:"💉 Sintomáticos EV",c:recSintEv},{t:"🧪 Exames Lab",c:recExames}].map((r,i)=><div key={i} style={sc_.card()}>
          <H3 ch={r.t}/>
          <div style={{display:"flex",gap:8}}>
            <Btn v="gold" ch="🖨 Imprimir" s={{flex:1,fontSize:12}} onClick={()=>setPrint({t:r.t,c:r.c})}/>
            <Btn v="ghost" ch="📋 Copiar" s={{fontSize:11}} onClick={()=>navigator.clipboard?.writeText(r.c)}/>
          </div>
        </div>)}
      </div>}

      <ChatAba mensagens={mensagens} addMsg={addMsg} de="Recepção"/>
    </div></div>
    <Footer/>
  </div>;
}



// ─── ENFERMAGEM PAGE ──────────────────────────────────────────────────────────
function EnfermagemPage({pac,mensagens,addMsg,addHistQT,back,alertCount,onAlert,onNovaTriagem}){
  const [abaEnf,setAbaEnf]=useState("salao");
  const [cadeiras,setCadeiras]=useState(MOCK_CADEIRAS.map(c=>({...c})));
  const [print,setPrint]=useState(null);
  const hoje2=new Date().toLocaleDateString("pt-BR");

  const iniciar=(id)=>{
    const cad=cadeiras.find(c=>c.id===id);
    if(cad?.pac){addHistQT&&addHistQT({data:hoje2,protocolo:cad.proto,ciclo:"C"+(Math.floor(Math.random()*3)+1)+"D1",pacID:pac.pacID||"",proxCiclo:calcProxCiclo(cad.proto,new Date())});}
    setCadeiras(x=>x.map(c=>c.id===id?{...c,st:"ocup"}:c));
    if(addMsg)addMsg("Enfermagem","Médico",`Infusão iniciada: Cadeira ${id} — ${cad?.pac||"—"} · ${cad?.proto||"—"}`,"ciclo");
  };

  return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <TopBar title="Enfermagem — Salão" back={back} alertCount={alertCount} onAlert={onAlert}/>
    <div style={{background:N,display:"flex",borderBottom:`3px solid ${G}`,flexShrink:0}}>
      {[{id:"salao",l:"🛋️ Salão"},{id:"triagem",l:"🩺 Triagem"}].map(a=><button key={a.id} onClick={()=>setAbaEnf(a.id)} style={{border:"none",cursor:"pointer",padding:"9px 16px",fontSize:13,fontWeight:800,flex:1,background:abaEnf===a.id?G:N,color:abaEnf===a.id?"#fff":"rgba(255,255,255,.5)"}}>{a.l}</button>)}
    </div>
    <div style={{flex:1,padding:16,overflowY:"auto"}}>
      {abaEnf==="salao"&&<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {cadeiras.map(cad=>{const ocup=cad.st==="ocup",prep=cad.st==="prep";return <div key={cad.id} style={sc_.card({border:`2px solid ${ocup?T:prep?G:"#CBD5E1"}`,background:ocup?"#EFF9FF":prep?"#FFFBEB":"#F8FAFC"})}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><strong style={{color:N,fontSize:13}}>{cad.id}</strong><Bge t={ocup?"ok":prep?"gold":"muted"} ch={ocup?"Ocupada":prep?"Preparo":"Livre"}/></div>
          <p style={{color:ocup?N:"#94A3B8",fontWeight:ocup?700:400,fontSize:13,margin:"0 0 2px"}}>{cad.pac}</p>
          <p style={{color:"#64748B",fontSize:11,margin:"0 0 8px"}}>{cad.proto}</p>
          {!ocup&&!prep&&<Btn v="teal" ch="▶ Iniciar" s={{width:"100%",fontSize:11}} onClick={()=>iniciar(cad.id)}/>}
          {(ocup||prep)&&<Btn v="red" ch="⏹ Concluir" s={{width:"100%",fontSize:11}} onClick={()=>setCadeiras(x=>x.map(c=>c.id===cad.id?{...c,st:"livre",pac:"—",proto:"—"}:c))}/>}
        </div>;})}
      </div>}
      {abaEnf==="triagem"&&<TriagemQTv17Frame pac={pac} addMsg={addMsg} onEnviar={t=>{onNovaTriagem&&onNovaTriagem(t);}}/>}
      <ChatAba mensagens={mensagens} addMsg={addMsg} de="Enfermagem"/>
    </div>
    <Footer/>
  </div>;
}

// ─── APAC COMP ────────────────────────────────────────────────────────────────
const APAC_CAMPOS=[
  {k:"nome",l:"Nome do Paciente",obrig:true},{k:"nasc",l:"Data de Nascimento",obrig:true},
  {k:"cns",l:"Cartão Nacional de Saúde (CNS)",obrig:true},{k:"cpf",l:"CPF",obrig:true},
  {k:"cidade",l:"Município",obrig:true},{k:"mae",l:"Nome da Mãe",obrig:true},
  {k:"diag",l:"Diagnóstico",obrig:true},{k:"cid",l:"CID-10",obrig:true},
  {k:"trat",l:"Protocolo",obrig:true},{k:"bio",l:"Biomarcadores",obrig:false},
  {k:"ecog",l:"ECOG",obrig:false},{k:"peso",l:"Peso (kg)",obrig:false},
];
function APACComp({pac,up,setPac,funcLogado,addMsg}){
  const [editando,setEditando]=useState(null);const [tmpVal,setTmpVal]=useState("");
  const [faturStatus,setFaturStatus]=useState(null);const [motivoReprova,setMotivoReprova]=useState("");
  const [camposExtras,setCamposExtras]=useState({});
  const upE=(k,v)=>setCamposExtras(x=>({...x,[k]:v}));
  const getVal=(k)=>camposExtras[k]||pac[k]||"";
  const hoje=new Date().toLocaleDateString("pt-BR");
  const faltando=APAC_CAMPOS.filter(c=>c.obrig&&!getVal(c.k));
  const completude=Math.round(((APAC_CAMPOS.length-faltando.length)/APAC_CAMPOS.length)*100);
  const txtAPAC=`LAUDO MÉDICO PARA PROCEDIMENTOS DE ALTA COMPLEXIDADE — APAC\n${"═".repeat(60)}\n\nEstabelecimento: ${HOSP} · ${HOSP2}\n\nPaciente: ${getVal("nome")||"___"}\nCNS: ${getVal("cns")||"___"} · Nasc: ${getVal("nasc")||"___"} · CPF: ${getVal("cpf")||"___"}\nNome da Mãe: ${getVal("mae")||"___"}\nMunicípio: ${getVal("cidade")||"___"} — PB\n\nDiagnóstico: ${getVal("diag")||"___"} · CID-10: ${getVal("cid")||"___"}\nProtocolo: ${getVal("trat")||"___"} · ECOG: ${getVal("ecog")||"___"}\nBiomarcadores: ${getVal("bio")||"___"}\n\nProcedimento: 0304010030 — Quimioterapia\n\nMédico Solicitante: ${AUTOR}\n${AUTOR2}\nData: ${hoje}\n\n${"═".repeat(60)}\nAutorização: ___________________________\nValidade: ____/____/________ a ____/____/________`;
  return <div style={{display:"grid",gap:14}}>
    <div style={{...sc_.card({background:faturStatus==="aprovado"?"#EAF7EE":faturStatus==="reprovado"?"#FDECEC":faturStatus==="analise"?"#EFF9FF":`linear-gradient(135deg,${N},#0d2347)`,border:`2px solid ${faturStatus==="aprovado"?VE:faturStatus==="reprovado"?VM:faturStatus==="analise"?T:N}`})}}>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <span style={{fontSize:24}}>{faturStatus==="aprovado"?"✅":faturStatus==="reprovado"?"❌":faturStatus==="analise"?"⏳":"📋"}</span>
        <div style={{flex:1}}>
          <strong style={{color:faturStatus?"inherit":"#fff",fontSize:14,display:"block"}}>{faturStatus==="aprovado"?"APAC APROVADA":faturStatus==="reprovado"?"APAC REPROVADA":faturStatus==="analise"?"APAC EM ANÁLISE":"Gerador de APAC"}</strong>
          <small style={{color:faturStatus?"inherit":"rgba(255,255,255,.6)",fontSize:11}}>{faturStatus==="reprovado"?`Motivo: ${motivoReprova}`:pac.nome||"Preencha os campos"}</small>
        </div>
        <div style={{textAlign:"right",color:completude>=80?VE:completude>=50?AM:VM,fontWeight:900,fontSize:18}}>{completude}%</div>
      </div>
      {faturStatus==="reprovado"&&<div style={{marginTop:8,background:"rgba(185,28,28,.1)",border:`1px solid ${VM}`,borderRadius:9,padding:"7px 11px"}}>
        <Btn v="red" ch="✏ Corrigir e Reenviar" s={{fontSize:11,marginTop:6}} onClick={()=>setFaturStatus(null)}/>
      </div>}
    </div>
    <div style={sc_.card()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <H2 ch="✅ Checklist APAC" s={{margin:0}}/>
        <div style={{display:"flex",gap:8}}>
          <Btn v="teal" ch="👁 Prévia" s={{fontSize:11}} onClick={()=>abrirPremium("APAC — "+pac.nome,txtAPAC,"laudo")}/>
          {!faturStatus&&<Btn v="gold" ch="📤 Enviar" s={{fontSize:12}} dis={faltando.length>0} onClick={()=>{setFaturStatus("analise");if(addMsg)addMsg("Médico","Faturamento",`APAC gerada para ${pac.nome||"paciente"}.`,"msg");}}/>}
        </div>
      </div>
      <div style={{height:7,background:"#E2E8F0",borderRadius:999,marginBottom:10,overflow:"hidden"}}>
        <div style={{height:"100%",background:completude>=80?VE:completude>=50?AM:VM,width:completude+"%",transition:"width .3s",borderRadius:999}}/>
      </div>
      <div style={{display:"grid",gap:5}}>
        {APAC_CAMPOS.map(campo=>{const val=getVal(campo.k);const ok=!!val&&val!=="—";const editandoEste=editando===campo.k;
          return <div key={campo.k} style={{border:`1px solid ${ok?VE+"44":campo.obrig?VM+"44":"#CBD5E1"}`,borderRadius:9,padding:"7px 11px",background:ok?"#F0FDF4":campo.obrig&&!ok?"#FFF5F5":"#F8FAFC"}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:14,flexShrink:0}}>{ok?"✅":campo.obrig?"❌":"⚠️"}</span>
              <div style={{flex:1}}><strong style={{color:N,fontSize:11}}>{campo.l}{campo.obrig&&<span style={{color:VM,marginLeft:2}}>*</span>}</strong>{ok&&<div style={{color:VE,fontSize:10,marginTop:1}}>{String(val).substring(0,50)}</div>}</div>
              {!ok&&<Btn v={campo.obrig?"red":"ghost"} ch="✏" s={{fontSize:10,padding:"3px 8px"}} onClick={()=>{setEditando(campo.k);setTmpVal(val||"");}}/>}
            </div>
            {editandoEste&&<div style={{marginTop:6,display:"flex",gap:6}}>
              <input value={tmpVal} onChange={e=>setTmpVal(e.target.value)} autoFocus style={{...sc_.inp,flex:1,fontSize:12}} onKeyDown={e=>{if(e.key==="Enter"){upE(campo.k,tmpVal);up&&up(campo.k,tmpVal);setEditando(null);}}}/>
              <Btn v="teal" ch="✓" s={{fontSize:12,padding:"5px 9px"}} onClick={()=>{upE(campo.k,tmpVal);up&&up(campo.k,tmpVal);setEditando(null);}}/>
            </div>}
          </div>;
        })}
      </div>
    </div>
    {faturStatus==="analise"&&<div style={sc_.card({background:"#EFF9FF",border:`1px solid ${T}`})}>
      <H3 ch="⏳ Em análise — Faturamento"/>
      <div style={{display:"flex",gap:8}}>
        <Btn v="green" ch="✅ Aprovar" s={{flex:1,fontSize:12}} onClick={()=>{setFaturStatus("aprovado");if(addMsg)addMsg("Faturamento","Médico",`APAC de ${pac.nome||"—"} APROVADA.`,"msg");}}/>
        <Btn v="red" ch="❌ Reprovar" s={{flex:1,fontSize:12}} onClick={()=>{const m=prompt("Motivo:");if(m){setMotivoReprova(m);setFaturStatus("reprovado");if(addMsg)addMsg("Faturamento","Médico",`APAC REPROVADA: ${m}`,"alerta");}}}/>
      </div>
    </div>}
  </div>;
}

// ─── PROGRAMA TERAPÊUTICO ─────────────────────────────────────────────────────
const CICLO_OPCOES=[
  {id:"semanal",l:"Semanal (7d)",dias:7,d8:false},
  {id:"q14d",l:"A cada 14 dias",dias:14,d8:false},
  {id:"q21d",l:"A cada 21 dias",dias:21,d8:false},
  {id:"d1d8_21d",l:"D1–D8 / 21d",dias:21,d8:true},
];
const NUM_PRESC=[1,3,6,8,10,12];
function ProgramaTerapeutico({pac,addMsg,cicloLiberado,setCicloLiberado}){
  const [cicloOp,setCicloOp]=useState(CICLO_OPCOES[2]);
  const [numPresc,setNumPresc]=useState(6);
  const [dataInicio,setDataInicio]=useState(()=>new Date().toISOString().split("T")[0]);
  const [buscaPT,setBuscaPT]=useState("");
  const [selPT,setSelPT]=useState(null);
  const [programa,setPrograma]=useState(null);
  const [reducao,setReducao]=useState(0);

  const gerarPrograma=()=>{
    if(!selPT){alert("Selecione um protocolo.");return;}
    const ciclos=[];let d=new Date(dataInicio+"T12:00:00");
    for(let i=0;i<numPresc;i++){
      ciclos.push({id:`C${i+1}D1`,ciclo:`C${i+1}`,dia:"D1",data:d.toLocaleDateString("pt-BR"),status:"agendado",doses:selPT.dr.map(dr=>({...dr,doseCalc:cDose(dr,"1.75","80","5",reducao)}))});
      if(cicloOp.d8){const d8=new Date(d);d8.setDate(d8.getDate()+7);ciclos.push({id:`C${i+1}D8`,ciclo:`C${i+1}`,dia:"D8",data:d8.toLocaleDateString("pt-BR"),status:"agendado",doses:selPT.dr.map(dr=>({...dr,doseCalc:cDose(dr,"1.75","80","5",reducao)}))});}
      d.setDate(d.getDate()+cicloOp.dias);
    }
    setPrograma({id:Date.now(),protocolo:selPT.n,pacNome:pac.nome||"___",cicloOp:cicloOp.l,numPresc,dataInicio,ciclos,status:"ativo"});
    setCicloLiberado&&setCicloLiberado(true);
    if(addMsg){addMsg("Médico","Farmácia",`Programa ${selPT.n} gerado: ${numPresc} ciclos. Início: ${new Date(dataInicio).toLocaleDateString("pt-BR")}.`,"ciclo");addMsg("Médico","Enfermagem",`Programa ${selPT.n} para ${pac.nome||"—"}: ${numPresc} ciclos.`,"msg");}
  };

  return <div style={{display:"grid",gap:14}}>
    <div style={sc_.card()}>
      <H2 ch="🗓 Programa Terapêutico"/>
      <input value={buscaPT} onChange={e=>{setBuscaPT(e.target.value);setSelPT(null);}} placeholder="🔍 Buscar protocolo..." style={{...sc_.inp,marginBottom:8,fontSize:13}}/>
      {buscaPT&&<div style={{background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:9,maxHeight:160,overflowY:"auto",marginBottom:8}}>
        {PROTOS.filter(p=>p.n.toLowerCase().includes(buscaPT.toLowerCase())||p.ind.toLowerCase().includes(buscaPT.toLowerCase())).map(p=><div key={p.id} onClick={()=>{setSelPT(p);setBuscaPT(p.n);}} style={{padding:"7px 11px",cursor:"pointer",borderBottom:"1px solid #F1F5F9",background:selPT?.id===p.id?"#EFF9FF":"#fff"}}>
          <strong style={{color:N,fontSize:12}}>{p.n}</strong> <span style={{color:"#64748B",fontSize:10}}>{p.ind}</span>
        </div>)}
      </div>}
      {selPT&&<div style={{background:"#EFF9FF",borderRadius:9,padding:"7px 11px",marginBottom:10,border:`1px solid ${T}`,fontSize:12}}><strong>{selPT.n}</strong> — {selPT.ind}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px",marginBottom:12}}>
        <div>
          <label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:5}}>Tipo de Ciclo</label>
          {CICLO_OPCOES.map(op=><button key={op.id} onClick={()=>setCicloOp(op)} style={{...sc_.btn(cicloOp.id===op.id?"navy":"ghost",{fontSize:11,width:"100%",textAlign:"left",marginBottom:4})}}>{cicloOp.id===op.id?"● ":"○ "}{op.l}</button>)}
        </div>
        <div>
          <label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:5}}>Nº de Prescrições</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:8}}>
            {NUM_PRESC.map(n=><button key={n} onClick={()=>setNumPresc(n)} style={{...sc_.btn(numPresc===n?"gold":"ghost",{fontSize:13,padding:"6px 4px",textAlign:"center"})}}>{n}</button>)}
          </div>
          <label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Início</label>
          <input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} style={{...sc_.inp,fontSize:13}}/>
          <div style={{marginTop:8,display:"flex",gap:5}}>
            {[0,10,20,30].map(r=><button key={r} onClick={()=>setReducao(r)} style={sc_.btn(reducao===r?r===0?"green":"red":"ghost",{fontSize:10,padding:"4px 6px"})}>{r===0?"Plena":`-${r}%`}</button>)}
          </div>
        </div>
      </div>
      <Btn v="gold" ch="🚀 Gerar e Enviar para Farmácia + Salão" s={{width:"100%",fontSize:13,padding:12}} dis={!selPT} onClick={gerarPrograma}/>
    </div>
    {programa&&<div style={sc_.card()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div><H2 ch={`📅 ${programa.protocolo}`} s={{margin:0}}/><small style={{color:"#64748B"}}>{programa.pacNome} · {programa.cicloOp} · {programa.numPresc} prescrições</small></div>
        <Btn v="teal" ch="🖨" s={{fontSize:11}} onClick={()=>abrirPremium("Programa Terapêutico",programa.ciclos.filter(c=>c.status!=="cancelado").map(c=>`${c.ciclo} ${c.dia} — ${c.data} — ${c.status}`).join("\n"),"prontuario")}/>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>{["Ciclo","Dia","Data","Status","Ações"].map(h=><th key={h} style={{background:N,color:"#fff",padding:"6px 8px",textAlign:"left",fontSize:11}}>{h}</th>)}</tr></thead>
          <tbody>{programa.ciclos.map((cic,i)=>{const stc=({agendado:{c:T},realizado:{c:VE},suspenso:{c:AM},cancelado:{c:VM}})[cic.status]||{c:T};return <tr key={cic.id} style={{opacity:cic.status==="cancelado"?.4:1,borderBottom:"1px solid #F1F5F9"}}>
            <td style={{padding:"6px 8px",fontWeight:900,color:N}}>{cic.ciclo}</td>
            <td style={{padding:"6px 8px",color:"#64748B",fontSize:10}}>{cic.dia}</td>
            <td style={{padding:"6px 8px",fontWeight:700}}>{cic.data}</td>
            <td style={{padding:"6px 8px"}}><span style={{background:stc.c+"22",color:stc.c,padding:"1px 7px",borderRadius:999,fontSize:10,fontWeight:900}}>{cic.status}</span></td>
            <td style={{padding:"6px 8px"}}>{cic.status!=="cancelado"&&<div style={{display:"flex",gap:3}}>
              <button onClick={()=>setPrograma(p=>({...p,ciclos:p.ciclos.map((c2,j)=>j===i?{...c2,status:"realizado"}:c2)}))} style={{...sc_.btn("green",{fontSize:9,padding:"2px 5px"})}}>✅</button>
              <button onClick={()=>setPrograma(p=>({...p,ciclos:p.ciclos.map((c2,j)=>j===i?{...c2,status:"suspenso"}:c2)}))} style={{...sc_.btn("gold",{fontSize:9,padding:"2px 5px"})}}>⏸</button>
              <button onClick={()=>{if(window.confirm("Cancelar este e posteriores?"))setPrograma(p=>({...p,ciclos:p.ciclos.map((c2,j)=>j>=i?{...c2,status:"cancelado"}:c2),...{status:"interrompido"}}));}} style={{...sc_.btn("red",{fontSize:9,padding:"2px 5px"})}}>🛑</button>
            </div>}</td>
          </tr>;})}</tbody>
        </table>
      </div>
    </div>}
  </div>;
}

// ─── CONSULTAS DO DIA ────────────────────────────────────────────────────────
function ConsultasDiaComp({consultasDia,setConsultasDia,onAbrirPac}){
  const STATUS={aguardando:{c:AM,bg:"#FFF7E6"},em_consulta:{c:T,bg:"#EFF9FF"},concluido:{c:VE,bg:"#EAF7EE"}};
  const upStatus=(i,s)=>setConsultasDia(x=>x.map((p,j)=>j===i?{...p,status:s}:p));
  return <div style={{display:"grid",gap:14}}>
    <div style={{...sc_.card({background:`linear-gradient(135deg,${N},#0d2347)`,padding:16})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div><H2 ch="📅 Consultas de Hoje" s={{color:"#fff",margin:0}}/><p style={{color:G,fontSize:11,margin:"2px 0 0"}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</p></div>
        <div style={{color:G,fontSize:24,fontWeight:900}}>{consultasDia.length}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {["D","S","T","Q","Q","S","S"].map((d,i)=>{const hj=new Date().getDay();const dt=new Date(Date.now()+(i-hj)*86400000);return <div key={i} style={{textAlign:"center",padding:"4px 0",borderRadius:8,background:i===hj?"rgba(184,134,11,.5)":"rgba(255,255,255,.07)"}}>
          <div style={{color:i===hj?G:"rgba(255,255,255,.4)",fontSize:8,fontWeight:700}}>{d}</div>
          <div style={{color:i===hj?"#fff":"rgba(255,255,255,.5)",fontSize:12,fontWeight:i===hj?900:400}}>{dt.getDate()}</div>
        </div>;})}
      </div>
    </div>
    {consultasDia.length===0
      ?<div style={sc_.card({textAlign:"center",padding:28,color:"#94A3B8"})}><div style={{fontSize:36,marginBottom:8}}>📋</div><p>Aguardando check-ins da Recepção.</p></div>
      :<div style={{display:"grid",gap:9}}>
        {consultasDia.map((p,i)=>{const st=STATUS[p.status]||STATUS.aguardando;return <div key={i} style={{border:`2px solid ${st.c}`,borderRadius:14,padding:"10px 13px",background:st.bg}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:36,height:36,background:N,borderRadius:"50%",display:"grid",placeItems:"center",flexShrink:0}}><span style={{color:G,fontWeight:900,fontSize:12}}>#{p.num}</span></div>
            <div style={{flex:1}}><strong style={{color:N,display:"block",fontSize:14}}>{p.nome}</strong><div style={{fontSize:11,color:"#64748B"}}>{p.proto||"—"} · {p.checkin}</div></div>
            <select value={p.status||"aguardando"} onChange={e=>upStatus(i,e.target.value)} style={{...sc_.inp,fontSize:11,padding:"3px 7px",width:130}}>
              <option value="aguardando">⏳ Aguardando</option>
              <option value="em_consulta">🩺 Em consulta</option>
              <option value="concluido">✅ Concluído</option>
            </select>
          </div>
          <Btn v="teal" ch="📋 Abrir Prontuário" s={{marginTop:7,fontSize:11,width:"100%"}} onClick={onAbrirPac&&(()=>onAbrirPac(p))}/>
        </div>;})}
      </div>}
  </div>;
}

// ─── AGENDAMENTO ─────────────────────────────────────────────────────────────
function AgendamentoComp({agendamentos,addAgendamento,ismedico}){
  const [form,setForm]=useState({pac:"",data:"",hora:"",tipo:"Consulta oncológica"});
  const [busca,setBusca]=useState("");
  const hoje=new Date().toLocaleDateString("pt-BR");
  const TIPOS=["Consulta oncológica","QT — mFOLFOX6","QT — AC","QT — FOLFIRI","QT — CarboTaxol","Retorno","Exames laboratoriais","TC/PET avaliação","Outro"];
  const STATUS_COR={agendado:{c:T},confirmado:{c:VE},cancelado:{c:VM},realizado:{c:"#64748B"}};
  const agFiltrados=(agendamentos||[]).filter(a=>!busca||a.pac?.toLowerCase().includes(busca.toLowerCase())||a.data?.includes(busca));
  const agHoje=agFiltrados.filter(a=>a.data===hoje);
  const agFuturos=agFiltrados.filter(a=>a.data!==hoje);
  return <div style={{display:"grid",gap:12}}>
    {!ismedico&&<div style={sc_.card()}>
      <H2 ch="➕ Novo Agendamento"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
        <Fld l="Nome do paciente" val={form.pac} set={v=>setForm(x=>({...x,pac:v}))}/>
        <Fld l="Data (DD/MM/AAAA)" val={form.data} set={v=>setForm(x=>({...x,data:v}))}/>
        <Fld l="Hora (HH:MM)" val={form.hora} set={v=>setForm(x=>({...x,hora:v}))}/>
        <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Tipo</label><select value={form.tipo} onChange={e=>setForm(x=>({...x,tipo:e.target.value}))} style={{...sc_.inp,fontSize:12}}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
      </div>
      <Btn v="gold" ch="📅 Confirmar" s={{width:"100%",marginTop:9,fontSize:13,padding:10}} dis={!form.pac||!form.data} onClick={()=>{addAgendamento({...form,status:"agendado"});setForm({pac:"",data:"",hora:"",tipo:"Consulta oncológica"});}}/>
    </div>}
    <div style={sc_.card()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><H2 ch="🗓 Agenda" s={{margin:0}}/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." style={{...sc_.inp,width:160,fontSize:11}}/></div>
      {agHoje.length>0&&<><H3 ch={`📌 Hoje — ${hoje}`} s={{color:T}}/>{agHoje.map((a,i)=>{const st=STATUS_COR[a.status]||STATUS_COR.agendado;return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${st.c}44`,borderRadius:10,padding:"8px 11px",marginBottom:6,background:st.c+"11"}}><div><strong style={{color:N,fontSize:12}}>{a.pac}</strong><div style={{color:"#64748B",fontSize:10}}>{a.hora} · {a.tipo}</div></div><span style={{background:st.c,color:"#fff",padding:"2px 8px",borderRadius:999,fontSize:9,fontWeight:900}}>{a.status}</span></div>;})}
      </>}
      {agFuturos.slice(0,8).map((a,i)=>{const st=STATUS_COR[a.status]||STATUS_COR.agendado;return <div key={i} style={{display:"flex",gap:9,alignItems:"center",border:"1px solid #CBD5E1",borderRadius:10,padding:"7px 11px",marginBottom:5,background:"#F8FAFC"}}>
        <div style={{minWidth:40,textAlign:"center"}}><div style={{color:N,fontSize:11,fontWeight:900}}>{a.data?.split("/")[0]}</div><div style={{color:"#94A3B8",fontSize:9}}>{a.data?.split("/").slice(1).join("/")}</div></div>
        <div style={{flex:1}}><strong style={{color:N,fontSize:12}}>{a.pac}</strong><div style={{color:"#64748B",fontSize:10}}>{a.hora} · {a.tipo}</div></div>
        <span style={{background:st.c,color:"#fff",padding:"2px 7px",borderRadius:999,fontSize:9,fontWeight:900}}>{a.status}</span>
      </div>;})}
      {agFiltrados.length===0&&<p style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:16}}>Sem agendamentos.</p>}
    </div>
  </div>;
}

// ─── CARTEIRINHA ──────────────────────────────────────────────────────────────
function CarteirinhaTab({pac,pacID,histQT,addFila}){
  const [print,setPrint]=useState(null);
  const [qrZoom,setQrZoom]=useState(false);
  const hoje=new Date().toLocaleDateString("pt-BR");
  const qtFiltrado=(histQT||[]).filter(h=>!h.pacID||h.pacID===pacID||h.pacID==="");
  const proxData=qtFiltrado[0]?.proxCiclo||calcProxCiclo(pac.trat,new Date());
  const txtCarteirinha=`CARTEIRINHA — ${pacID}\nNome: ${pac.nome||"___"}\nNasc: ${pac.nasc||"___"} · CPF: ${pac.cpf||"___"}\nCidade: ${pac.cidade||"___"} · Mãe: ${pac.mae||"___"}\nCNS: ${pac.cns||"___"}\n\nHISTÓRICO QT:\n${qtFiltrado.map(q=>`${q.data} · ${q.protocolo} · Ciclo ${q.ciclo}`).join("\n")}\n\nPróximo ciclo: ${proxData} (confirmar com secretaria)\n\n${HOSP} · ${AUTOR}`;
  return <div style={{display:"grid",gap:14}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <div style={{background:`linear-gradient(135deg,${N} 0%,#0d2347 60%,#1a3a6e)`,borderRadius:20,padding:"20px 22px",boxShadow:"0 12px 40px rgba(0,0,0,.35)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,background:"rgba(184,134,11,.1)",borderRadius:"50%"}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <div><div style={{color:G,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Oncologia Integrada</div><div style={{color:"rgba(255,255,255,.5)",fontSize:8}}>{HOSP} · Patos/PB</div></div>
        <div style={{background:G,borderRadius:8,padding:"3px 9px",fontSize:9,fontWeight:900,color:"#fff"}}>CARTEIRINHA</div>
      </div>
      <div style={{textAlign:"center",marginBottom:10,paddingBottom:8,borderBottom:"1px solid rgba(255,255,255,.15)"}}>
        <div style={{fontSize:11,fontWeight:900,color:"rgba(255,255,255,.4)",letterSpacing:3}}>H</div>
        <div style={{fontSize:14,fontWeight:900,color:"#fff",letterSpacing:1}}>HOSPITAL DO BEM</div>
        <div style={{fontSize:8,color:G,letterSpacing:1}}>UNIDADE ONCOLÓGICA · PATOS/PB</div>
      </div>
      <div style={{color:G,fontSize:20,fontWeight:900,marginBottom:3}}>{pacID}</div>
      <div style={{color:"#fff",fontSize:16,fontWeight:700,marginBottom:2}}>{pac.nome||"Nome do Paciente"}</div>
      <div style={{color:"rgba(255,255,255,.5)",fontSize:10,marginBottom:10}}>{pac.nasc||"Nascimento"} · {pac.cpf||"CPF"}</div>
      <div style={{borderTop:"1px solid rgba(255,255,255,.15)",paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{color:G,fontSize:9,fontWeight:700,textTransform:"uppercase"}}>Mãe</div>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>{pac.mae||"—"}</div>
          <div style={{color:G,fontSize:9,fontWeight:700,textTransform:"uppercase",marginTop:4}}>CNS</div>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>{pac.cns||"—"}</div>
          <div style={{color:G,fontSize:9,fontWeight:700,textTransform:"uppercase",marginTop:4}}>Cidade</div>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>{pac.cidade||"—"}</div>
        </div>
        <div style={{textAlign:"center",cursor:"pointer"}} onClick={()=>setQrZoom(z=>!z)}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pacID+"|"+(pac.nome||"")+"|"+(pac.trat||"")+"|"+proxData)}`} alt="QR" style={{width:qrZoom?240:120,height:qrZoom?240:120,borderRadius:10,background:"#fff",padding:6,transition:"all .3s",boxShadow:qrZoom?"0 0 0 8px "+G+",0 16px 48px rgba(0,0,0,.5)":"0 4px 12px rgba(0,0,0,.2)"}}/>
          <div style={{color:qrZoom?G:"rgba(255,255,255,.5)",fontSize:qrZoom?10:8,marginTop:3,fontWeight:qrZoom?900:400}}>{qrZoom?"📲 Pronto para escanear":"Toque para ampliar"}</div>
        </div>
      </div>
    </div>
    {qtFiltrado.length>0&&<div style={{background:`linear-gradient(135deg,${VE},#052e16)`,borderRadius:14,padding:"12px 16px",color:"#fff"}}>
      <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:2,color:"rgba(255,255,255,.6)",marginBottom:3}}>Próximo Ciclo Previsto</div>
      <div style={{fontSize:20,fontWeight:900}}>{proxData}</div>
      <div style={{color:"rgba(255,255,255,.5)",fontSize:10,marginTop:3}}>⚠️ Confirmar data e horário com a secretaria antes de vir</div>
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      <Btn v="teal" ch="📲 Check-in com 1 Clique" s={{fontSize:13,padding:12,fontWeight:900}} onClick={()=>{if(addFila){addFila({nome:pac.nome||"Paciente",proto:pac.trat,ciclo:"C1D1",pacID});alert(`✅ Check-in realizado!\n${pac.nome||"Paciente"}\nAguarde ser chamado.`);}}}/>
      <Btn v="gold" ch="🖨 Imprimir Carteirinha" s={{fontSize:12,padding:12}} onClick={()=>abrirPremium("Carteirinha — "+pacID,txtCarteirinha,"laudo")}/>
    </div>
    <div style={sc_.card()}>
      <H2 ch="💉 Histórico de Quimioterapia"/>
      {qtFiltrado.length===0?<p style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:16}}>Nenhuma infusão registrada ainda.</p>
        :<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>{["Data","Protocolo","Ciclo","Próximo Ciclo"].map(cc=><th key={cc} style={{background:N,color:"#fff",padding:"6px 8px",textAlign:"left",fontSize:10}}>{cc}</th>)}</tr></thead>
          <tbody>{qtFiltrado.map((h,i)=><tr key={i} style={{background:i%2?"#F8FAFC":"#fff"}}>
            <td style={{padding:"7px 8px",fontSize:11,fontWeight:700,color:N}}>{h.data}</td>
            <td style={{padding:"7px 8px",fontSize:11,color:T,fontWeight:700}}>{h.protocolo}</td>
            <td style={{padding:"7px 8px",fontSize:11}}>{h.ciclo}</td>
            <td style={{padding:"7px 8px"}}><div style={{fontSize:11,fontWeight:700,color:VE}}>{h.proxCiclo}</div><div style={{fontSize:9,color:"#94A3B8",fontStyle:"italic"}}>⚠ Confirmar com secretaria</div></td>
          </tr>)}</tbody>
        </table></div>}
    </div>
  </div>;
}

// ─── SEGUNDA VIA ──────────────────────────────────────────────────────────────
function SegundaViaTab({pac,addCaixaEntrada,laudoLiberado=false}){
  const [print,setPrint]=useState(null);
  const hoje=new Date().toLocaleDateString("pt-BR");
  const cabHosp=`H  HOSPITAL DO BEM\nUnidade Oncológica — Complexo Hospitalar Regional Dep. Janduhy Carneiro\n\nDr. Silas Negrão — CRM-PB 17341\n${"─".repeat(60)}\nNOME: ${pac.nome||"___"}  NASC.: ${pac.nasc||"______"}  CIDADE: ${pac.cidade||"__________"}  IDADE: ${pac.idade||"__"}\n${"─".repeat(60)}\n`;
  const receitaSint=`${cabHosp}RECEITA MÉDICA                    Data: ${hoje}\n\nVIA ORAL\n1. Pantoprazol 20 mg — jejum, tomar durante toda QT\n2. Ondansetrona 8 mg — 8/8h por 2 dias pós-QT\n3. Metoclopramida 10 mg — 8/8h por 2 dias pós-QT\n4. Dexametasona 4 mg — noite anterior + dia seguinte\n5. Loperamida 2 mg — 2 cp início, 1 cp/2h se diarreia\n6. Lactulose — 30 mL 12/12h se obstipação\n7. Simeticona 125 mg — 8/8h após refeições\n\nVIA ENDOVENOSA (UBS)\n1. Complexo B — IV SF 500 mL · 2. Ondansetrona 8 mg IV · 3. Noripurum IV · 4. Buscopan IV · 5. Dexametasona 10 mg IV\n\nObs: Nenhuma medicação está contraindicada.\n${"─".repeat(60)}\n${AUTOR} · ${AUTOR2}\n${HOSP}`;
  const examesLab=`${cabHosp}REQUISIÇÃO DE EXAMES              Data: ${hoje}\n\nCOLETAR ANTES DO PRÓXIMO CICLO\n                   CICLO 1      CICLO 2      CICLO 3\nHEMOGRAMA             X            X            X\nUREIA                 X            X            X\nCREATININA            X            X            X\nTGO (AST)             X            X            X\nTGP (ALT)             X            X            X\n\nFavor realizar 2 dias ANTES do próximo ciclo.\n${"─".repeat(60)}\n${AUTOR} · ${AUTOR2}\n${HOSP}`;
  const laudoPericial=`${cabHosp}RELATÓRIO MÉDICO ONCOLÓGICO\nDOCUMENTO PARA FINS PERICIAIS\n\nAtesto que o(a) paciente foi diagnosticado(a) com ${pac.diag||"neoplasia maligna"} e encontra-se em tratamento oncológico com quimioterapia.\n\nRecomendo afastamento por 6 meses.\n\nDireitos: INSS · FGTS · PIS/PASEP · IR isento · Transporte · Passe Livre\n${"─".repeat(60)}\n${AUTOR} · ${AUTOR2}\nData: ${hoje}\n${HOSP}`;
  const sinaisAlarme=`${cabHosp}SINAIS DE ALARME                  Data: ${hoje}\n\nVÁ AO PRONTO SOCORRO SE:\n■ FEBRE >37,8°C — IMEDIATAMENTE!\n■ Calafrios · Pus em cateter · Tosse+falta de ar\n■ Dor ao urinar · Sangramento · Confusão mental\n■ Sangue nas fezes/urina/vômitos · Dor forte\n■ Falta de ar súbita · Inchaço no rosto\n\nEM CASO DE DÚVIDA, VÁ AO PS — NÃO ESPERE!\n\nPressão:___/___ Vômitos: ( )Nenhum ( )1-2x ( )>3x\nDor (0-10): ( )0 ( )1-3 ( )4-6 ( )7-10\n${"─".repeat(60)}\n${AUTOR} · ${HOSP}`;
  const oriNutri=`${cabHosp}ORIENTAÇÃO NUTRICIONAL            Data: ${hoje}\n\n✓ PODE COMER:\nProteínas: frango/peixe/carne magra/ovos cozidos/feijão\nCarboidratos: arroz/macarrão/pão/batata/aveia\nFrutas: descascadas e lavadas · Vegetais: preferencialmente cozidos\nLíquidos: 2-3 L/dia água filtrada, caldos, sucos naturais\n\n✗ NÃO PODE:\nCarnes/ovos crus · Sushi · ÁLCOOL (qualquer) · Alimentos ultraprocessados\nQueijo fresco artesanal · Frituras excessivas · Refrigerantes\n\nDICAS: Fracionar (6×/dia) · Mastigar devagar · Lavar bem os alimentos\n${"─".repeat(60)}\n${AUTOR} · ${HOSP}`;
  const DOCS=[
    {ico:"💊",t:"Receita de Sintomáticos",sub:"Medicamentos VO + EV pós-QT",c:receitaSint},
    {ico:"🧪",t:"Requisição de Exames",sub:"Hemograma · Ureia · Creatinina · TGO · TGP",c:examesLab},
    {ico:"📋",t:"Laudo Pericial / Relatório",sub:"INSS · Afastamento · Direitos sociais",c:laudoPericial,gate:true},
    {ico:"🚨",t:"Sinais de Alarme",sub:"Quando ir ao Pronto-Socorro",c:sinaisAlarme},
    {ico:"🥗",t:"Orientação Nutricional",sub:"O que comer durante o tratamento",c:oriNutri},
  ];
  return <div style={{display:"grid",gap:11}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <div style={{...sc_.card({background:`linear-gradient(135deg,${N},#0d2347)`,padding:14})}}>
      <H2 ch="📄 Segunda Via de Documentos" s={{color:"#fff",margin:"0 0 3px"}}/><p style={{color:G,fontSize:10,margin:0}}>Documentos médicos a qualquer momento</p>
    </div>
    {DOCS.map((d,i)=><div key={i} style={{...sc_.card({border:`1px solid ${d.gate&&!laudoLiberado?VM+"44":N+"22"}`}),display:"flex",gap:12,alignItems:"center"}}>
      <div style={{width:46,height:46,background:`linear-gradient(135deg,${N},${T})`,borderRadius:12,display:"grid",placeItems:"center",fontSize:24,flexShrink:0}}>{d.ico}</div>
      <div style={{flex:1}}><strong style={{color:N,display:"block",fontSize:13}}>{d.t}</strong><small style={{color:"#64748B",fontSize:10}}>{d.sub}</small>{d.gate&&!laudoLiberado&&<span style={{display:"block",fontSize:9,color:VM,fontWeight:700,marginTop:2}}>🔒 Requer liberação da Assistência Social</span>}</div>
      <div style={{display:"flex",gap:5,flexDirection:"column"}}>
        {(!d.gate||laudoLiberado)?<><Btn v="gold" ch="🖨" s={{fontSize:11,padding:"6px 11px"}} onClick={()=>setPrint({t:d.t,c:d.c})}/><Btn v="ghost" ch="📋" s={{fontSize:10,padding:"5px 8px"}} onClick={()=>navigator.clipboard?.writeText(d.c)}/></>
          :<Btn v="ghost" ch="📱 Solicitar AS" s={{fontSize:10,background:AM+"22",color:AM}} onClick={()=>alert("Solicite à Assistência Social a liberação do seu laudo.")}/>}
      </div>
    </div>)}
  </div>;
}

// ─── INBOX PACIENTE ───────────────────────────────────────────────────────────
function InboxPaciente({pacID,pac,caixa,setCaixa,mensagens,addMsg}){
  const [selecionado,setSelecionado]=useState(null);
  const [chatDest,setChatDest]=useState("Recepção");
  const [chatTxt,setChatTxt]=useState("");
  const [aba,setAba]=useState("inbox");
  const [msg,setMsg]=useState("");
  const marcarLida=(id)=>setCaixa(x=>x.map(m=>m.id===id?{...m,lida:true}:m));
  const enviarMsg=()=>{if(!chatTxt.trim())return;if(addMsg)addMsg("Paciente",chatDest,chatTxt,"msg");setMsg(`✓ Mensagem enviada`);setTimeout(()=>setMsg(""),2000);setChatTxt("");};
  const TIPO_COR={laudo:T,receita:G,msg:N,alerta:VM};
  const TIPO_ICO={laudo:"🧪",receita:"💊",msg:"✉️",alerta:"🚨"};
  return <div style={{display:"grid",gap:12}}>
    <div style={{background:N,display:"flex",borderRadius:12,overflow:"hidden"}}>
      {[{id:"inbox",l:"📬 Mensagens"},{id:"chat",l:"💬 Falar com Equipe"}].map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{border:"none",cursor:"pointer",padding:"9px 16px",fontSize:12,fontWeight:800,flex:1,background:aba===a.id?G:N,color:aba===a.id?"#fff":"rgba(255,255,255,.55)"}}>{a.l}</button>)}
    </div>
    {aba==="inbox"&&<div>
      <div style={{background:`linear-gradient(135deg,${N},${T})`,borderRadius:12,padding:"9px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"center"}}>
        <div style={{width:36,height:36,background:G,borderRadius:"50%",display:"grid",placeItems:"center",fontWeight:900,color:"#fff",fontSize:12,flexShrink:0}}>{pacID?.slice(-4)}</div>
        <div style={{flex:1}}><div style={{color:G,fontWeight:900,fontSize:12}}>{pacID}</div><div style={{color:"rgba(255,255,255,.6)",fontSize:10}}>{pac.nome||"Paciente"}</div></div>
        <div style={{background:(caixa||[]).filter(m=>!m.lida).length>0?VM:"rgba(255,255,255,.15)",color:"#fff",borderRadius:999,padding:"2px 9px",fontSize:10,fontWeight:900}}>{(caixa||[]).filter(m=>!m.lida).length} nova{(caixa||[]).filter(m=>!m.lida).length!==1?"s":""}</div>
      </div>
      {selecionado===null
        ?<div style={{display:"grid",gap:8}}>
          {(caixa||[]).length===0&&<div style={{textAlign:"center",padding:24,color:"#94A3B8"}}><div style={{fontSize:32,marginBottom:6}}>📬</div><p>Nenhuma mensagem ainda.</p></div>}
          {(caixa||[]).map(m=><div key={m.id} onClick={()=>{setSelecionado(m);marcarLida(m.id);}} style={{border:`1.5px solid ${m.lida?"#CBD5E1":TIPO_COR[m.tipo]||N}`,borderRadius:13,padding:"10px 13px",cursor:"pointer",background:m.lida?"#F8FAFC":"#fff"}}>
            <div style={{display:"flex",gap:9,alignItems:"center"}}>
              <span style={{fontSize:20,flexShrink:0}}>{TIPO_ICO[m.tipo]||"✉️"}</span>
              <div style={{flex:1}}><strong style={{color:N,fontSize:12}}>{m.titulo}</strong>{!m.lida&&<span style={{background:TIPO_COR[m.tipo]||N,color:"#fff",padding:"1px 7px",borderRadius:999,fontSize:8,fontWeight:900,marginLeft:6}}>NOVA</span>}<div style={{color:"#64748B",fontSize:9,marginTop:1}}>{m.de} · {m.dt}</div></div>
            </div>
          </div>)}
        </div>
        :<div>
          <button onClick={()=>setSelecionado(null)} style={{...sc_.btn("ghost",{fontSize:11,marginBottom:9})}}>← Voltar</button>
          <div style={sc_.card()}>
            <strong style={{color:N,display:"block",fontSize:14,marginBottom:4}}>{selecionado.titulo}</strong>
            <small style={{color:"#64748B",fontSize:10,display:"block",marginBottom:10}}>De: {selecionado.de} · {selecionado.dt}</small>
            <pre style={{whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",fontSize:12,lineHeight:1.7,color:"#1E293B",background:"#F8FAFC",borderRadius:9,padding:12}}>{selecionado.conteudo}</pre>
            <div style={{display:"flex",gap:7,marginTop:10}}>
              <Btn v="teal" ch="📋 Copiar" s={{fontSize:11}} onClick={()=>navigator.clipboard?.writeText(selecionado.conteudo)}/>
              <Btn v="navy" ch="🖨 Imprimir" s={{fontSize:11}} onClick={()=>abrirPremium(selecionado.titulo,selecionado.conteudo,"prontuario")}/>
            </div>
          </div>
        </div>}
    </div>}
    {aba==="chat"&&<div>
      <div style={{display:"flex",gap:7,marginBottom:10}}>
        {["Recepção","Enfermagem","Assistência Social"].map(d=><button key={d} onClick={()=>setChatDest(d)} style={{...sc_.btn(chatDest===d?"navy":"ghost",{fontSize:11,flex:1})}}>{d==="Recepção"?"📋 Recepção":d==="Enfermagem"?"🩺 Enfermagem":"🤝 Assist. Social"}</button>)}
      </div>
      <div style={sc_.card()}>
        {msg&&<p style={{fontSize:11,color:VE,padding:"4px 8px",background:"#EAF7EE",borderRadius:6,marginBottom:6}}>{msg}</p>}
        <div style={{maxHeight:200,overflowY:"auto",marginBottom:9,display:"flex",flexDirection:"column",gap:6}}>
          {(mensagens||[]).filter(m=>(m.de==="Paciente"&&m.para===chatDest)||(m.de===chatDest&&m.para==="Paciente")).slice(0,10).map((m,i)=><div key={i} style={{display:"flex",flexDirection:m.de==="Paciente"?"row-reverse":"row",gap:7}}>
            <div style={{maxWidth:"75%",background:m.de==="Paciente"?T:"#F1F5F9",color:m.de==="Paciente"?"#fff":"#374151",borderRadius:11,padding:"7px 11px",fontSize:12}}>
              <div style={{fontSize:8,opacity:.6,marginBottom:2}}>{m.de} · {m.dt?.split(" ")[1]||""}</div>{m.txt}
            </div>
          </div>)}
          {(mensagens||[]).filter(m=>m.de==="Paciente"&&m.para===chatDest).length===0&&<p style={{color:"#94A3B8",fontSize:11,textAlign:"center",padding:14}}>Inicie uma conversa com {chatDest}</p>}
        </div>
        <div style={{display:"flex",gap:7}}>
          <input value={chatTxt} onChange={e=>setChatTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enviarMsg()} placeholder={`Mensagem para ${chatDest}...`} style={{...sc_.inp,flex:1,fontSize:12}}/>
          <Btn v="teal" ch="Enviar" s={{fontSize:11}} onClick={enviarMsg}/>
        </div>
      </div>
      <div style={{...sc_.card({marginTop:8,background:chatDest==="Recepção"?"#EFF9FF":chatDest==="Enfermagem"?"#EAF7EE":"#FFFBEB",border:`1px solid ${chatDest==="Recepção"?T:chatDest==="Enfermagem"?VE:G}`})}}>
        <small style={{fontWeight:700,color:N,display:"block",marginBottom:5}}>Mensagens rápidas:</small>
        {(chatDest==="Recepção"?["Quero agendar retorno","Confirmar consulta agendada","Preciso remarcar meu horário","Qual o status do meu exame?","Preciso mais informações sobre o tratamento","Tive reação — quando posso ligar?"]:
          chatDest==="Enfermagem"?["Estou com náuseas após a QT","Tenho dúvida sobre meu medicamento","Sinto dor no local da punção","Quando será meu próximo ciclo?","Preciso de orientação sobre efeitos colaterais"]:
          ["Preciso de suporte financeiro","Dificuldade para vir às consultas","Quero informações sobre TFD","Preciso do laudo para INSS","Quero falar com o assistente social"]
        ).map((txt,i)=><button key={i} onClick={()=>{if(addMsg){addMsg("Paciente",chatDest,txt,"msg");setMsg(`✓ "${txt.substring(0,30)}"`);setTimeout(()=>setMsg(""),2000);}}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",textAlign:"left",border:`1px solid ${chatDest==="Recepção"?T+"44":chatDest==="Enfermagem"?VE+"44":G+"44"}`,borderRadius:8,padding:"7px 10px",marginBottom:4,cursor:"pointer",background:"#fff",fontSize:11,fontFamily:"inherit",color:N,fontWeight:600}}><span>{txt}</span><span style={{color:chatDest==="Recepção"?T:chatDest==="Enfermagem"?VE:G,fontSize:13}}>→</span></button>)}
      </div>
    </div>}
  </div>;
}

// ─── COMUNICAÇÃO ──────────────────────────────────────────────────────────────
function ComunicacaoPage({mensagens,addMsg,back,alertCount,onAlert}){
  const [de,setDe]=useState("Médico");const [para,setPara]=useState("Farmácia");const [txt,setTxt]=useState("");const [filtro,setFiltro]=useState("Todos");
  const enviar=()=>{if(!txt.trim())return;addMsg(de,para,txt);setTxt("");};
  const msgs=(mensagens||[]).filter(m=>filtro==="Todos"||(m.de===filtro||m.para===filtro));
  const tipoIcon={ciclo:"💉",alerta:"⚠️",msg:"💬",emergencia:"🚨",triagem:"🩺"};
  const MEMBROS=["Médico","Farmácia","Enfermagem","Recepção","Assistência Social","Todos"];
  return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
    <TopBar title="Comunicação" back={back} alertCount={alertCount} onAlert={onAlert}/>
    <div style={{flex:1,padding:16,overflowY:"auto",display:"grid",gap:12}}>
      <div style={sc_.card()}>
        <H2 ch="📤 Enviar Mensagem"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px",marginBottom:10}}>
          <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>De</label><select value={de} onChange={e=>setDe(e.target.value)} style={{...sc_.inp,fontSize:13}}>{MEMBROS.slice(0,-1).map(m=><option key={m}>{m}</option>)}</select></div>
          <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Para</label><select value={para} onChange={e=>setPara(e.target.value)} style={{...sc_.inp,fontSize:13}}>{MEMBROS.map(m=><option key={m}>{m}</option>)}</select></div>
        </div>
        <textarea value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),enviar())} placeholder="Digite a mensagem (Enter para enviar)..." rows={3} style={{...sc_.inp,width:"100%",resize:"none",marginBottom:8,fontSize:13}}/>
        <Btn v="teal" ch="📤 Enviar" s={{width:"100%",fontSize:13}} onClick={enviar}/>
      </div>
      <div style={sc_.card()}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><H2 ch="📨 Mensagens" s={{margin:0}}/><select value={filtro} onChange={e=>setFiltro(e.target.value)} style={{...sc_.inp,width:130,fontSize:11}}>{MEMBROS.map(m=><option key={m}>{m}</option>)}</select></div>
        {msgs.length===0&&<p style={{color:"#94A3B8",textAlign:"center",padding:16,fontSize:12}}>Sem mensagens.</p>}
        {msgs.slice(0,20).map((m,i)=><div key={i} style={{border:`1px solid ${m.tipo==="emergencia"?VM:m.tipo==="alerta"?AM:T}33`,borderRadius:11,padding:"8px 12px",marginBottom:7,background:m.tipo==="emergencia"?"#FFF5F5":"#F8FAFC"}}>
          <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:5}}>
            <span style={{fontSize:16}}>{tipoIcon[m.tipo]||"💬"}</span>
            <strong style={{color:N,fontSize:12,flex:1}}>{m.de} → {m.para}</strong>
            <span style={{color:"#94A3B8",fontSize:10}}>{m.dt}</span>
          </div>
          <p style={{fontSize:12,color:"#374151",margin:0,lineHeight:1.5}}>{m.txt}</p>
        </div>)}
      </div>
    </div>
    <Footer/>
  </div>;
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const gerarHTML=(titulo,conteudo)=>`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${titulo}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;background:#F0F4F8;padding:20px;font-size:13px}.pg{background:#fff;max-width:780px;margin:0 auto;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.12);overflow:hidden}.hd{background:#1B365D;padding:18px 24px}.hn{color:#fff;font-size:14px;font-weight:900}.hs{color:rgba(255,255,255,.55);font-size:10px;margin-top:2px}.ct{padding:22px 24px}h1{color:#1B365D;font-size:16px;font-weight:900;border-bottom:3px solid #B8860B;padding-bottom:7px;margin-bottom:14px}pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:12px;line-height:1.8;color:#1E293B;background:#F8FAFC;border-left:4px solid #B8860B;padding:12px 14px;border-radius:0 8px 8px 0;margin-bottom:14px}.sl{font-size:10px;color:#64748B;text-align:center;padding:12px 0;border-top:1px solid #CBD5E1}.ft{border-top:2px solid #E2E8F0;padding:12px 24px;display:flex;justify-content:space-between;background:#F8FAFC;font-size:10px;color:#64748B}.np{margin-top:16px;text-align:center}.bp{background:#B8860B;color:#1B365D;border:none;padding:11px 28px;font-size:13px;border-radius:8px;cursor:pointer;font-weight:900}@media print{body{background:#fff;padding:0}.pg{box-shadow:none}.np{display:none}}</style></head><body><div class="pg"><div class="hd"><div class="hn">HOSPITAL DO BEM · Unidade Oncológica</div><div class="hs">Complexo Hospitalar Regional Dep. Janduhy Carneiro · Patos/PB</div></div><div class="ct"><h1>${titulo}</h1><pre>${(conteudo||"").replace(/</g,"&lt;")}</pre><div class="sl">Dr. Silas Negrão Serra Jr. · CRM-PB 17341 · RQE Oncologia Clínica 9099</div></div><div class="ft"><span>Hospital do Bem · Patos/PB</span><span>${new Date().toLocaleString("pt-BR")}</span></div></div><div class="np"><button class="bp" onclick="window.print()">🖨 Imprimir / Salvar PDF</button></div></body></html>`;
const abrirDoc=(titulo,conteudo)=>{try{const w=window.open("","_blank","width=820,height=700,scrollbars=yes");if(w&&w.document){w.document.open();w.document.write(gerarHTML(titulo,conteudo));w.document.close();}else throw 0;}catch(e){const a=document.createElement("a");a.href="data:text/html;charset=utf-8,"+encodeURIComponent(gerarHTML(titulo,conteudo));a.download=(titulo||"doc").slice(0,30)+".html";document.body.appendChild(a);a.click();document.body.removeChild(a);}};

// ── COMPONENTES RECUPERADOS DAS SESSÕES ANTERIORES ──────────────────────────
function AssistenciaSocialPage({pac,up,back,laudoLiberado,setLaudoLiberado,alertCount,onAlert}){
  const [evolucao,setEvolucao]=useState("");const [evolucoes,setEvolucoes]=useState([{dt:"15/05/2026",txt:"Paciente orientada sobre FGTS e INSS. Encaminhada ao CRAS.",autor:"Serv. Social"}]);
  const [print,setPrint]=useState(null);
  const hoje=new Date().toLocaleDateString("pt-BR");
  const cab=`HOSPITAL DO BEM — Assistência Social\n${hoje}\nNome: ${pac.nome||"___"} · CID: ${pac.cid||"___"}\n${"─".repeat(50)}\n\n`;
  const LAUDOS=[
    {n:"Declaração Oncológica",c:cab+`DECLARAÇÃO MÉDICA ONCOLÓGICA\n\nAtesto que o(a) paciente está em tratamento oncológico ativo com quimioterapia no Hospital do Bem, Patos/PB, necessitando afastamento por 6 meses.\n\n${AUTOR} · ${AUTOR2}`},
    {n:"Laudo INSS/Benefício",c:cab+`LAUDO PARA FINS PERICIAIS — INSS\n\nPaciente em tratamento oncológico. Afastamento recomendado por 6 meses.\nDireitos: INSS · FGTS · PIS/PASEP · IR Isento · Passe Livre\n\n${AUTOR} · ${AUTOR2}`},
    {n:"Relatório TFD",c:cab+`RELATÓRIO — TRATAMENTO FORA DO DOMICÍLIO\n\nO(a) paciente necessita de deslocamento para tratamento oncológico, solicitando TFD conforme legislação SUS.\n\n${AUTOR} · ${AUTOR2}`},
  ];
  return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <TopBar title="Assistência Social" back={back} alertCount={alertCount} onAlert={onAlert}/>
    <div style={{flex:1,padding:14,overflowY:"auto",display:"grid",gap:11}}>
      <div style={sc_.card()}>
        <H2 ch="Dados"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 9px"}}>
          {[["Nome","nome"],["Nascimento","nasc"],["CPF","cpf"],["CID-10","cid"],["Cidade","cidade"]].map(([l,k])=><Fld key={k} l={l} val={pac[k]||""} set={v=>up(k,v)}/>)}
        </div>
      </div>
      <div style={sc_.card()}>
        <H2 ch="Laudos Sociais"/>
        <div style={{background:laudoLiberado?"#EAF7EE":"#FFF7E6",border:`1px solid ${laudoLiberado?VE:AM}`,borderRadius:10,padding:10,marginBottom:10,display:"flex",gap:9,alignItems:"center"}}>
          <span style={{fontSize:18}}>{laudoLiberado?"✅":"🔒"}</span>
          <div style={{flex:1}}><strong style={{color:N,display:"block",fontSize:12}}>Laudo Pericial</strong><small style={{color:"#64748B",fontSize:10}}>{laudoLiberado?"LIBERADO":"Pendente de avaliação"}</small></div>
          <Btn v={laudoLiberado?"ghost":"gold"} ch={laudoLiberado?"Revogar":"✅ Liberar"} s={{fontSize:10}} onClick={()=>{if(laudoLiberado){if(window.confirm("Revogar?"))setLaudoLiberado&&setLaudoLiberado(false);}else setLaudoLiberado&&setLaudoLiberado(true);}}/>
        </div>
        {LAUDOS.map((l,i)=><div key={i} style={{border:"1px solid #CBD5E1",borderRadius:9,padding:"8px 11px",marginBottom:7}}>
          <strong style={{color:N,display:"block",marginBottom:5,fontSize:12}}>{l.n}</strong>
          <div style={{display:"flex",gap:5}}><Btn v="gold" ch="🖨" s={{fontSize:11}} onClick={()=>setPrint({t:l.n,c:l.c})}/><Btn v="ghost" ch="📋" s={{fontSize:10}} onClick={()=>navigator.clipboard?.writeText(l.c)}/></div>
        </div>)}
      </div>
      <div style={sc_.card()}>
        <H2 ch="Evolução Social"/>
        <textarea rows={2} value={evolucao} onChange={e=>setEvolucao(e.target.value)} style={{...sc_.inp,resize:"none",marginBottom:7}} placeholder="Registro de evolução..."/>
        <Btn v="gold" ch="💾 Gravar" s={{width:"100%"}} onClick={()=>{if(!evolucao.trim())return;setEvolucoes(x=>[{dt:hoje,txt:evolucao,autor:"Serv. Social"},...x]);setEvolucao("");}}/>
        <div style={{marginTop:8}}>{evolucoes.map((e,i)=><div key={i} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:7,padding:"5px 9px",marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}><span style={{fontSize:10,fontWeight:800,color:T}}>{e.autor}</span><span style={{fontSize:9,color:"#94A3B8"}}>{e.dt}</span></div><p style={{fontSize:11,color:"#374151",margin:0}}>{e.txt}</p></div>)}</div>
      </div>
    </div>
  </div>;
}

function BalancoComp(){
  const [aba,setAba]=useState("margem");
  const dados=PROTOS.filter(p=>p.custo&&p.sus).map(p=>({...p,margem:p.sus-p.custo,pct:Math.round(((p.sus-p.custo)/p.sus)*100)})).sort((a,b)=>b.sus-a.sus);
  return <div style={{display:"grid",gap:11}}>
    <div style={{background:N,display:"flex",borderRadius:10,overflow:"hidden"}}>
      {[{id:"margem",l:"💹 Margem SUS"},{id:"preparo",l:"⏱ Preparo"}].map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{border:"none",cursor:"pointer",padding:"9px",fontSize:12,fontWeight:800,flex:1,background:aba===a.id?G:N,color:aba===a.id?"#fff":"rgba(255,255,255,.5)"}}>{a.l}</button>)}
    </div>
    {aba==="margem"&&<div style={sc_.card({padding:11})}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,minWidth:420}}>
          <thead><tr style={{background:"#F8FAFC"}}>{["Protocolo","Indicação","Custo","SUS","Margem","%"].map(h=><th key={h} style={{padding:"6px 7px",textAlign:"left",fontWeight:800,color:N,fontSize:9,borderBottom:"2px solid #E2E8F0"}}>{h}</th>)}</tr></thead>
          <tbody>{dados.map((p,i)=><tr key={p.id} style={{borderBottom:"1px solid #F1F5F9",background:i%2?"#fff":"#F8FAFC"}}>
            <td style={{padding:"5px 7px",fontWeight:700,color:N}}>{p.n}</td>
            <td style={{padding:"5px 7px",color:"#64748B",fontSize:9}}>{p.ind}</td>
            <td style={{padding:"5px 7px",color:VM,fontWeight:700}}>R${p.custo?.toLocaleString("pt-BR")}</td>
            <td style={{padding:"5px 7px",color:VE,fontWeight:700}}>R${p.sus?.toLocaleString("pt-BR")}</td>
            <td style={{padding:"5px 7px",fontWeight:900,color:p.margem>0?VE:VM}}>R${p.margem?.toLocaleString("pt-BR")}</td>
            <td style={{padding:"5px 7px"}}><span style={{background:p.pct>15?VE:p.pct>0?AM:VM,color:"#fff",borderRadius:999,padding:"1px 5px",fontSize:8,fontWeight:900}}>{p.pct}%</span></td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>}
    {aba==="preparo"&&<div style={sc_.card({padding:11})}>
      {[["mFOLFOX6","30min","Oxa 2h + 5-FU 46h","~48h total"],["Carboplatina+PTX","45min","PTX 3h + Carbo 30min","~4h"],["Pembrolizumabe","15min","30min IV","~1h"],["Trastuzumabe","20min","1ª: 90min","~2h"]].map((r,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0",borderBottom:"1px solid #F1F5F9"}}>
        <strong style={{color:N,fontSize:10,flex:2}}>{r[0]}</strong>
        <span style={{color:G,fontSize:10,flex:1}}>Prep: {r[1]}</span>
        <span style={{color:"#64748B",fontSize:10,flex:2}}>{r[2]}</span>
        <span style={{color:T,fontWeight:700,fontSize:10,flex:1}}>{r[3]}</span>
      </div>)}
    </div>}
  </div>;
}

function DashboardMedico({pac,consultasDia,alertas,mensagens,setMedTab,caixaEntrada,agendamentos,onAbrirAtendimento}){
  const hoje=new Date().toLocaleDateString("pt-BR");
  const hora=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  const dia=new Date().toLocaleDateString("pt-BR",{weekday:"long"});
  const FRASES=["Curar às vezes, aliviar frequentemente, confortar sempre. — Trudeau","A medicina é a arte de manter o homem em saúde. — Hipócrates","O cuidado com o paciente é o ato mais poderoso da medicina."];
  const frase=FRASES[new Date().getDate()%FRASES.length];
  const pendencias=[
    ...(caixaEntrada||[]).filter(m=>!m.lida).map(m=>({tipo:"📬",txt:`Msg: ${m.titulo}`,acao:"prontuario"})),
    ...(alertas||[]).filter(a=>a.n==="verm").map(a=>({tipo:"🚨",txt:`Urgente: ${a.nome}`,acao:"alertas"})),
    {tipo:"📄",txt:"2 APACs pendentes de revisão",acao:"apac"},
  ].slice(0,5);
  return <div style={{display:"grid",gap:12}}>
    <div style={{background:`linear-gradient(135deg,${N},#0d2347)`,borderRadius:14,padding:"14px 16px",color:"#fff"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
        <div><div style={{fontSize:20,fontWeight:900}}>{hora} ⏰</div><div style={{color:"rgba(255,255,255,.5)",fontSize:10,textTransform:"capitalize"}}>{dia} · {hoje}</div></div>
        <div style={{textAlign:"right"}}><div style={{color:G,fontWeight:900,fontSize:12}}>{AUTOR}</div><div style={{color:"rgba(255,255,255,.35)",fontSize:9}}>{HOSP}</div></div>
      </div>
      <div style={{color:G,fontSize:10,fontStyle:"italic",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:7}}>"{frase}"</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
      {[{l:"Consultas Hoje",v:consultasDia.length||3,ico:"👥",c:T,t:"consultas_dia"},{l:"Alertas",v:alertas.length,ico:"🚨",c:VM,t:"alertas"},{l:"Pendências",v:pendencias.length,ico:"📋",c:G,t:"apac"},{l:"Msgs",v:(mensagens||[]).filter(m=>!m.lida&&m.para==="Médico").length,ico:"💬",c:N,t:"triagem_recebe"}].map(x=><div key={x.l} onClick={()=>setMedTab(x.t)} style={sc_.card({borderTop:`3px solid ${x.c}`,padding:9,cursor:"pointer",textAlign:"center"})}>
        <div style={{fontSize:18,marginBottom:2}}>{x.ico}</div>
        <div style={{fontSize:20,fontWeight:900,color:x.c}}>{x.v}</div>
        <div style={{fontSize:9,color:"#64748B",fontWeight:700}}>{x.l}</div>
      </div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div style={sc_.card({padding:11})}>
        <H3 ch="📅 Consultas de Hoje"/>
        {(consultasDia.length?consultasDia:[{nome:"Maria Aparecida Santos",proto:"mFOLFOX6",num:"001",status:"aguardando",checkin:"08:05"},{nome:"João Ferreira",proto:"CarboTaxol",num:"002",status:"em_consulta",checkin:"08:30"},{nome:"Ana Beatriz Costa",proto:"Pembrolizumabe",num:"003",status:"aguardando",checkin:"09:00"}]).slice(0,5).map((p,i)=><div key={i} onClick={()=>onAbrirAtendimento?onAbrirAtendimento(p):setMedTab("prontuario")} style={{display:"flex",gap:7,alignItems:"center",padding:"5px 7px",borderRadius:8,cursor:"pointer",marginBottom:4,background:"#F8FAFC",border:`1px solid ${{aguardando:AM,em_consulta:T,concluido:VE}[p.status]||T}22`}}>
          <div style={{width:26,height:26,background:{aguardando:AM,em_consulta:T,concluido:VE}[p.status]||T,borderRadius:"50%",display:"grid",placeItems:"center",flexShrink:0,color:"#fff",fontSize:8,fontWeight:900}}>#{p.num||String(i+1).padStart(3,"0")}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:N,fontWeight:700,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nome}</div>
            <div style={{color:"#64748B",fontSize:9}}>{p.proto} {p.checkin?"· "+p.checkin:""}</div>
          </div>
          <span style={{fontSize:8,fontWeight:900,color:{aguardando:AM,em_consulta:T,concluido:VE}[p.status]||T}}>{p.status==="em_consulta"?"●":p.status==="concluido"?"✓":"○"}</span>
        </div>)}
        <Btn v="teal" ch="Ver lista completa →" s={{width:"100%",fontSize:10,marginTop:5}} onClick={()=>setMedTab("consultas_dia")}/>
      </div>
      <div style={sc_.card({padding:11})}>
        <H3 ch="📋 Pendências"/>
        {pendencias.map((p,i)=><div key={i} onClick={()=>setMedTab(p.acao)} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 7px",borderRadius:8,background:"#FFF7E6",border:"1px solid "+AM+"33",marginBottom:4,cursor:"pointer"}}>
          <span style={{fontSize:14}}>{p.tipo}</span>
          <span style={{flex:1,fontSize:11,color:N,fontWeight:600}}>{p.txt}</span>
          <span style={{color:T,fontSize:10}}>→</span>
        </div>)}
        {pendencias.length===0&&<p style={{color:"#94A3B8",fontSize:11,textAlign:"center",padding:"10px 0"}}>✅ Sem pendências</p>}
      </div>
    </div>
    <div style={sc_.card({padding:11})}>
      <H3 ch="📰 Atualizações em Oncologia"/>
      {[{t:"SBOC 2026: CDK4/6 1ª linha mama — consenso atualizado",src:"SBOC",c:VE,url:"https://sboc.org.br/diretrizes"},{t:"ASCO 2026: Pembrolizumabe adjuvante CPNPC — KEYNOTE-091",src:"ASCO",c:T,url:"https://www.asco.org/practice-patients/guidelines"},{t:"ESMO: Zoledrónico Q3M equivalente Q4S em metástases ósseas",src:"ESMO",c:N,url:"https://www.esmo.org/guidelines"},{t:"NCCN v2: HRD ovário — niraparibe 1ª linha manutenção",src:"NCCN",c:G,url:"https://www.nccn.org/guidelines"}].map((n,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 7px",borderRadius:6,marginBottom:3,background:"#F8FAFC"}}>
        <span style={{background:n.c,color:"#fff",padding:"1px 5px",borderRadius:999,fontSize:8,fontWeight:900,flexShrink:0}}>{n.src}</span>
        <span style={{color:N,fontSize:10,flex:1}}>{n.t}</span>
        <a href={n.url} target="_blank" rel="noreferrer" style={{color:T,fontSize:9,textDecoration:"none",fontWeight:700,flexShrink:0}}>Abrir →</a>
      </div>)}
    </div>
    <div style={sc_.card({padding:11})}>
      <H3 ch="📚 Diretrizes — Acesso Rápido"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
        {[{n:"SBOC",url:"https://sboc.org.br/diretrizes",d:"Sociedade Brasileira de Oncologia Clínica",c:VE},{n:"MOC/INCA",url:"https://www.inca.gov.br/publicacoes/manuais/manual-de-bases-tecnicas-da-oncologia",d:"Manual Oncologia Clínica",c:VM},{n:"NCCN",url:"https://www.nccn.org/guidelines",d:"EUA — Guidelines completos",c:N},{n:"ESMO",url:"https://www.esmo.org/guidelines",d:"Europa — Consensus",c:T},{n:"ASCO",url:"https://www.asco.org/practice-patients/guidelines",d:"American Society",c:G},{n:"UpToDate",url:"https://www.uptodate.com",d:"Evidências clínicas",c:AM}].map(g=><a key={g.n} href={g.url} target="_blank" rel="noreferrer" style={{textDecoration:"none",padding:"8px 10px",borderRadius:9,border:`2px solid ${g.c}33`,background:g.c+"0D",display:"block"}}>
          <div style={{fontWeight:900,color:g.c,fontSize:12,marginBottom:2}}>{g.n}</div>
          <div style={{fontSize:9,color:"#64748B",lineHeight:1.3}}>{g.d}</div>
        </a>)}
      </div>
    </div>
  </div>;
}

function EnviarExamesTab({pac,addCaixaEntrada}){
  const [arqs,setArqs]=useState([]);const [env,setEnv]=useState(false);
  const refA=useRef(null);const refC=useRef(null);
  const onArq=e=>{setArqs(x=>[...x,...Array.from(e.target.files||[]).map(f=>({ico:"📄",n:f.name}))]);e.target.value="";};
  const onCam=e=>{setArqs(x=>[...x,...Array.from(e.target.files||[]).map(f=>({ico:"📸",n:f.name}))]);e.target.value="";};
  const enviar=()=>{if(!arqs.length)return;setEnv(true);setTimeout(()=>{addCaixaEntrada&&addCaixaEntrada({de:"Paciente",titulo:`Exames (${arqs.length} arq.)`,conteudo:arqs.map(a=>a.n).join(", "),tipo:"laudo"});setArqs([]);setEnv(false);alert("✅ Enviado!");},1200);};
  return <div style={{display:"grid",gap:11}}>
    <input ref={refC} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={onCam}/>
    <input ref={refA} type="file" accept=".pdf,.doc,.docx,image/*" multiple style={{display:"none"}} onChange={onArq}/>
    <div style={{...sc_.card({background:`linear-gradient(135deg,${N},#0d2347)`,padding:14})}}>
      <h2 style={{color:"#fff",margin:"0 0 3px",fontSize:15}}>📤 Enviar Exames e Laudos</h2>
      <p style={{color:"rgba(255,255,255,.45)",fontSize:10,margin:0}}>Tomografia · Anatomopatológico · Laboratório</p>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      <div onClick={()=>refC.current?.click()} style={{border:"2px dashed "+T,borderRadius:13,padding:"18px 8px",textAlign:"center",cursor:"pointer",background:"#F0F9FF"}}><div style={{fontSize:28,marginBottom:5}}>📷</div><strong style={{color:T,fontSize:12}}>Câmera</strong></div>
      <div onClick={()=>refA.current?.click()} style={{border:"2px dashed "+G,borderRadius:13,padding:"18px 8px",textAlign:"center",cursor:"pointer",background:"#FFFBEB"}}><div style={{fontSize:28,marginBottom:5}}>📁</div><strong style={{color:G,fontSize:12}}>Arquivo</strong></div>
    </div>
    {arqs.length>0&&<div style={sc_.card()}>{arqs.map((a,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"4px 7px",borderBottom:"1px solid #F1F5F9"}}><span>{a.ico}</span><span style={{flex:1,fontSize:11,fontWeight:700}}>{a.n}</span><button style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8"}} onClick={()=>setArqs(x=>x.filter((_,j)=>j!==i))}>✕</button></div>)}</div>}
    <button onClick={enviar} disabled={env||!arqs.length} style={{width:"100%",background:arqs.length?G:"#94A3B8",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:900,cursor:arqs.length?"pointer":"default",fontFamily:"inherit"}}>{env?"⏳ Enviando...":"📤 Enviar"}</button>
  </div>;
}

function EstatisticasComp({consultasDia}){
  const bars=[{l:"Adenoca. cólon",n:18,c:T},{l:"Ca pulmão",n:14,c:N},{l:"Ca mama RH+",n:12,c:"#EC4899"},{l:"Ca próstata",n:9,c:G},{l:"Ca pâncreas",n:6,c:AM},{l:"Ca gástrico",n:5,c:VM}];
  return <div style={{display:"grid",gap:11}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
      {[{l:"Pacientes Ativos",v:47,ico:"👥",c:T},{l:"Ciclos/mês",v:124,ico:"💉",c:G},{l:"Consultas hoje",v:consultasDia.length||3,ico:"📅",c:VE},{l:"Protocolos",v:PROTOS.length,ico:"📋",c:N}].map(x=><div key={x.l} style={sc_.card({borderTop:`3px solid ${x.c}`,padding:10,textAlign:"center"})}>
        <div style={{fontSize:18,marginBottom:2}}>{x.ico}</div><div style={{fontSize:22,fontWeight:900,color:x.c}}>{x.v}</div><div style={{fontSize:9,color:"#64748B",fontWeight:700}}>{x.l}</div>
      </div>)}
    </div>
    <div style={sc_.card({padding:12})}>
      <H3 ch="🎯 Diagnósticos"/>
      {bars.map((b,i)=><div key={i} style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:11,color:N,fontWeight:600}}>{b.l}</span><span style={{fontSize:11,fontWeight:900,color:b.c}}>{b.n}</span></div><div style={{height:5,background:"#E2E8F0",borderRadius:999,overflow:"hidden"}}><div style={{height:"100%",background:b.c,width:(b.n/18*100)+"%",borderRadius:999}}/></div></div>)}
    </div>
    <div style={sc_.card({padding:12})}>
      <H3 ch="⚡ ECOG"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
        {[{e:"0",n:12,c:VE},{e:"1",n:22,c:T},{e:"2",n:9,c:G},{e:"3",n:3,c:AM},{e:"4",n:1,c:VM}].map(x=><div key={x.e} style={{textAlign:"center",padding:"7px 4px",background:x.c+"11",borderRadius:9,border:`1px solid ${x.c}44`}}><div style={{fontSize:18,fontWeight:900,color:x.c}}>{x.n}</div><div style={{fontSize:9,color:"#64748B",fontWeight:700}}>ECOG {x.e}</div></div>)}
      </div>
    </div>
  </div>;
}

const PRIO_COR={alta:{c:VM,bg:"#FFF0F0"},media:{c:AM,bg:"#FFF7E6"},baixa:{c:VE,bg:"#EAF7EE"}};
function ListaEsperaPrioridade({listaEspera,setListaEspera,onAbrirConsulta}){
  const sorted=[...listaEspera].sort((a,b)=>({alta:0,media:1,baixa:2}[a.prioridade]||1)-({alta:0,media:1,baixa:2}[b.prioridade]||1));
  if(!sorted.length)return <p style={{color:"#94A3B8",textAlign:"center",padding:16,fontSize:12}}>Lista vazia.</p>;
  return <div style={{display:"grid",gap:7}}>
    {sorted.map((p,i)=>{const pr=PRIO_COR[p.prioridade]||PRIO_COR.media;return <div key={i} style={{border:`2px solid ${pr.c}44`,borderRadius:12,padding:"9px 12px",background:pr.bg}}>
      <div style={{display:"flex",gap:9,alignItems:"center"}}>
        <div style={{width:32,height:32,background:pr.c,borderRadius:"50%",display:"grid",placeItems:"center",flexShrink:0,color:"#fff",fontWeight:900,fontSize:11}}>#{p.num}</div>
        <div style={{flex:1}}><strong style={{color:N,display:"block",fontSize:13}}>{p.nome}</strong><div style={{fontSize:10,color:"#64748B"}}>{p.proto||"—"} · {p.chegada}</div></div>
        <select value={p.prioridade||"media"} onChange={e=>setListaEspera(x=>x.map((el,j)=>j===i?{...el,prioridade:e.target.value}:el))} style={{...sc_.inp,fontSize:10,padding:"2px 5px",width:88}}>
          <option value="alta">🔴 Alta</option><option value="media">🟡 Média</option><option value="baixa">🟢 Baixa</option>
        </select>
      </div>
      <div style={{display:"flex",gap:6,marginTop:7}}>
        <Btn v="teal" ch="▶ Iniciar" s={{fontSize:10,flex:1}} onClick={()=>onAbrirConsulta&&onAbrirConsulta(p)}/>
        <Btn v="ghost" ch="✅" s={{fontSize:10}} onClick={()=>setListaEspera(x=>x.filter((_,j)=>j!==i))}/>
      </div>
    </div>;})}
  </div>;
}

function PrimeiraConsultaWizard({pac,up,setPac,onEnviar}){
  const [step,setStep]=useState(1);
  const [arqs,setArqs]=useState([]);
  const refC=useRef(null);const refA=useRef(null);
  const STEPS=[{n:1,l:"Dados"},{n:2,l:"Documentos"},{n:3,l:"Confirmar"}];
  return <div style={sc_.card()}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:14}}>
      {STEPS.map(s=><div key={s.n} style={{textAlign:"center"}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:step===s.n?T:step>s.n?VE:"#E2E8F0",color:step<=s.n?"#fff":"#94A3B8",display:"grid",placeItems:"center",fontSize:11,fontWeight:900,margin:"0 auto 3px"}}>{step>s.n?"✓":s.n}</div>
        <div style={{fontSize:9,fontWeight:900,color:step===s.n?T:step>s.n?VE:"#94A3B8",textTransform:"uppercase"}}>{s.l}</div>
      </div>)}
    </div>
    {step===1&&<div>
      <H2 ch="Dados do Paciente"/>
      {[["Nome completo *","nome"],["Data de nascimento","nasc"],["CPF","cpf"],["CNS (Cartão SUS)","cns"],["Cidade / Município","cidade"],["Telefone","tel"],["Nome da mãe","mae"],["Peso (kg)","peso"],["Altura (cm)","altura"]].map(([l,k])=><Fld key={k} l={l} val={pac[k]||""} set={v=>up(k,v)}/>)}
      {pac.peso&&pac.altura&&<div style={{background:"#EAF7EE",borderRadius:8,padding:"5px 9px",marginBottom:7,border:`1px solid ${VE}`,fontSize:11}}><strong style={{color:VE}}>SC: {calcSC(pac.peso,pac.altura)} m²</strong></div>}
      <div style={{display:"flex",gap:7,marginTop:7}}>
        <Btn v="ghost" ch="Demo" s={{fontSize:11}} onClick={()=>setPac(x=>({...x,...MOCK_PAC}))}/>
        <Btn v="gold" ch="Continuar →" s={{flex:1,fontSize:13,padding:10}} dis={!pac.nome} onClick={()=>setStep(2)}/>
      </div>
    </div>}
    {step===2&&<div>
      <H2 ch="Documentos"/>
      <input ref={refC} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{setArqs(x=>[...x,...Array.from(e.target.files||[]).map(f=>({n:f.name}))]);e.target.value="";}}/>
      <input ref={refA} type="file" accept=".pdf,.doc,.docx,image/*" multiple style={{display:"none"}} onChange={e=>{setArqs(x=>[...x,...Array.from(e.target.files||[]).map(f=>({n:f.name}))]);e.target.value="";}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <div onClick={()=>refC.current?.click()} style={{border:"2px dashed "+T,borderRadius:11,padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"#F0F9FF"}}><div style={{fontSize:24,marginBottom:4}}>📷</div><strong style={{color:T,fontSize:12}}>Câmera</strong></div>
        <div onClick={()=>refA.current?.click()} style={{border:"2px dashed "+G,borderRadius:11,padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"#FFFBEB"}}><div style={{fontSize:24,marginBottom:4}}>📁</div><strong style={{color:G,fontSize:12}}>Arquivo</strong></div>
      </div>
      {arqs.map((a,i)=><div key={i} style={{display:"flex",gap:7,alignItems:"center",border:"1px solid #CBD5E1",borderRadius:7,padding:"4px 8px",marginBottom:4,fontSize:11}}><span>📄</span><span style={{flex:1,fontWeight:700}}>{a.n}</span><button style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8"}} onClick={()=>setArqs(x=>x.filter((_,j)=>j!==i))}>✕</button></div>)}
      <div style={{display:"flex",gap:7,marginTop:8}}><Btn v="ghost" ch="← Voltar" onClick={()=>setStep(1)}/><Btn v="gold" ch="Continuar →" s={{flex:1,padding:10}} onClick={()=>setStep(3)}/></div>
    </div>}
    {step===3&&<div>
      <H2 ch="Confirmar"/>
      <div style={{background:"#EAF7EE",border:`1px solid ${VE}`,borderRadius:11,padding:13,marginBottom:13}}>
        {[["Paciente",pac.nome],["Nascimento",pac.nasc],["CPF",pac.cpf],["CNS",pac.cns],["Cidade",pac.cidade]].filter(([,v])=>v).map(([l,v])=><div key={l} style={{fontSize:12,marginBottom:2}}><strong>{l}:</strong> {v}</div>)}
        <div style={{fontSize:12,marginTop:4}}><strong>Docs:</strong> {arqs.length} arquivo(s)</div>
      </div>
      <div style={{display:"flex",gap:7}}><Btn v="ghost" ch="← Editar" onClick={()=>setStep(1)}/><Btn v="gold" ch="✅ Enviar ao Médico" s={{flex:1,fontSize:13,padding:10}} onClick={()=>onEnviar&&onEnviar()}/></div>
    </div>}
  </div>;
}

// ── PRESCRIÇÃO QT INTELIGENTE ─────────────────────────────────────────────────
function PrescricaoQT({pac,up,addMsg,ciclosHistorico,setCiclosHistorico}){
  const [tela,setTela]=useState("busca");
  const [protoSel,setProtoSel]=useState(null);
  const [busca,setBusca]=useState("");
  const [sugestoesIA,setSugestoesIA]=useState(null);
  const [loadingIA,setLoadingIA]=useState(false);
  const [tumorDetectado,setTumorDetectado]=useState(null);
  useEffect(()=>{if(pac?.diag){const t=detectarTumor(pac.diag);setTumorDetectado(t);}},[pac?.diag]);
  const buscarSugestoesIA=async()=>{setLoadingIA(true);const r=await IA_sugerirProtocolo(pac?.diag,pac?.estadio,pac?.bio,pac?.ecog);setSugestoesIA(r.sugestoes||[]);setLoadingIA(false);};
  const todosProtos=Object.values(PROTOCOLOS_DB).flatMap(t=>t.grupos.flatMap(g=>g.protos.map(p=>({...p,tumor:t.label}))));
  const protosFiltrados=busca.length>1?todosProtos.filter(p=>p.nome.toLowerCase().includes(busca.toLowerCase())||p.tumor.toLowerCase().includes(busca.toLowerCase())):[];
  if(tela==="detalhe"&&protoSel)return <DetalheProtocolo proto={protoSel} pac={pac} up={up} addMsg={addMsg} historico={ciclosHistorico} setHistorico={setCiclosHistorico} onVoltar={()=>setTela("busca")} onSalvo={()=>setTela("historico")}/>;
  if(tela==="historico")return <HistoricoCiclos historico={ciclosHistorico} setHistorico={setCiclosHistorico} pac={pac} onVoltar={()=>setTela("busca")}/>;
  return(<div style={{display:"grid",gap:12}}>
    <div style={{background:`linear-gradient(135deg,${N},#0d2347)`,borderRadius:13,padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{color:G,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Oncologia Integrada</div>
        <h2 style={{color:"#fff",margin:0,fontSize:15,fontWeight:900}}>💉 Prescrição de Quimioterapia</h2>
        {pac?.diag&&<div style={{color:"rgba(255,255,255,.5)",fontSize:11,marginTop:2}}>{pac.diag}</div>}
      </div>
      <Btn v="ghost" ch={`📋 Histórico (${(ciclosHistorico||[]).length})`} s={{fontSize:11}} onClick={()=>setTela("historico")}/>
    </div>
    {tumorDetectado&&<div style={sc.card({border:"1px solid "+G+"44",background:"#FFFBEB"})}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:22}}>{tumorDetectado.emoji}</span>
          <div>
            <strong style={{color:N,fontSize:13}}>{tumorDetectado.label}</strong>
            <div style={{color:"#64748B",fontSize:10}}>Protocolos específicos detectados pelo diagnóstico</div>
          </div>
        </div>
        <Btn v="navy" ch={loadingIA?"⏳":"🤖 Sugestão IA"} s={{fontSize:11}} dis={loadingIA} onClick={buscarSugestoesIA}/>
      </div>
      {sugestoesIA&&sugestoesIA.length>0&&<div style={{background:"#F0FDF4",border:"1px solid "+VE+"44",borderRadius:10,padding:10,marginBottom:10}}>
        <div style={{color:VE,fontWeight:800,fontSize:11,marginBottom:6}}>🤖 Sugerido pelo Claude para este paciente:</div>
        {sugestoesIA.map((s,i)=>(
          <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"5px 0",borderBottom:i<sugestoesIA.length-1?"1px solid #E2E8F0":"none"}}>
            <span style={{background:[G,T,N][i]||N,color:"#fff",borderRadius:999,padding:"1px 7px",fontSize:9,fontWeight:900,flexShrink:0}}>#{i+1}</span>
            <div style={{flex:1}}>
              <strong style={{color:N,fontSize:12}}>{s.protocolo}</strong>
              <span style={{color:"#64748B",fontSize:10,marginLeft:6}}>{s.linha}</span>
              <div style={{color:"#64748B",fontSize:10,marginTop:1}}>{s.justificativa}</div>
              {s.evidencia&&<div style={{color:T,fontSize:9,marginTop:1}}>📚 {s.evidencia}</div>}
            </div>
            <Btn v="teal" ch="Selecionar" s={{fontSize:10,padding:"4px 8px"}} onClick={()=>{const p=todosProtos.find(tp=>tp.nome===s.protocolo||tp.id===s.protocolo)||todosProtos.find(tp=>tp.nome.toLowerCase().includes(s.protocolo.toLowerCase()));if(p){setProtoSel(p);setTela("detalhe");}}}/>
          </div>
        ))}
      </div>}
      {tumorDetectado.grupos.map(grupo=>(
        <div key={grupo.nome} style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:900,color:N,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6,paddingBottom:4,borderBottom:"1px solid #E2E8F0"}}>{grupo.nome}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {grupo.protos.map(p=>(
              <button key={p.id} onClick={()=>{setProtoSel(p);setTela("detalhe");}} style={{background:p.cor+"15",border:`2px solid ${p.cor}44`,borderRadius:10,padding:"7px 14px",cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                <div style={{fontWeight:900,color:p.cor,fontSize:12}}>{p.nome}</div>
                <div style={{color:"#64748B",fontSize:9,marginTop:1}}>{p.ciclo} · {p.drugs.length} fármaco{p.drugs.length>1?"s":""}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>}
    <div style={sc.card()}>
      <strong style={{color:N,fontSize:12,display:"block",marginBottom:8}}>🔍 Busca livre por protocolo</strong>
      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Digite o nome do protocolo (ex: FOLFOX, Paclitaxel, TCHP...)" style={{...sc.inp,fontSize:13,marginBottom:8}}/>
      {busca.length>1&&protosFiltrados.length===0&&<p style={{color:"#94A3B8",fontSize:12}}>Nenhum protocolo encontrado para "{busca}".</p>}
      {protosFiltrados.map(p=>(
        <div key={p.id} onClick={()=>{setProtoSel(p);setTela("detalhe");setBusca("");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderRadius:10,border:"1px solid #CBD5E1",marginBottom:5,cursor:"pointer",background:"#F8FAFC"}}>
          <div><strong style={{color:N,fontSize:12}}>{p.nome}</strong><span style={{color:"#64748B",fontSize:10,marginLeft:8}}>{p.tumor} · {p.ciclo}</span></div>
          <span style={{color:T,fontSize:11}}>→</span>
        </div>
      ))}
    </div>
  </div>);
}

function DetalheProtocolo({proto,pac,up,addMsg,historico,setHistorico,onVoltar,onSalvo}){
  const [reducao,setReducao]=useState(0);
  const [periodo,setPeriodo]=useState(proto.ciclo||"q21d");
  const [periodoCustom,setPeriodoCustom]=useState("");
  const [drugs,setDrugs]=useState(proto.drugs.map(d=>({...d,ativo:true})));
  const [numCiclos,setNumCiclos]=useState(6);
  const [dataInicio,setDataInicio]=useState(TODAY());
  const [obs,setObs]=useState("");
  const [abaSel,setAbaSel]=useState("doses");
  const [novoDrug,setNovoDrug]=useState({n:"",d:"",u:"mg/m²"});
  const [showAddDrug,setShowAddDrug]=useState(false);
  const scPac=pac?.peso&&pac?.altura?(0.016667*Math.pow(Number(pac.peso),0.5)*Math.pow(Number(pac.altura),0.5)).toFixed(2):"1.73";
  const calcDose=(dose,scv=1.73)=>{const base=Number(dose)||0;return(base*(1-reducao/100)*scv).toFixed(0);};
  const calcProximas=()=>{
    const datas=[];const d=new Date(dataInicio.split("/").reverse().join("-"));
    if(isNaN(d.getTime()))return[];
    const intervalos={q21d:21,q14d:14,semanal:7,d1d8q21:21,d1d8d15q28:28,diario:1};
    const dias=intervalos[periodo]||21;
    for(let i=0;i<numCiclos;i++){const data=new Date(d.getTime()+i*dias*86400000);datas.push({ciclo:`C${i+1}D1`,data:data.toLocaleDateString("pt-BR")});}
    return datas;
  };
  const liberarCiclos=()=>{
    const proximas=calcProximas();
    const novos=[...(historico||[]),...proximas.map(p=>({id:Date.now()+Math.random(),ciclo:p.ciclo,data:p.data,protocolo:proto.nome,status:"agendado",drugs:drugs.filter(d=>d.ativo).map(d=>({...d,doseCalc:d.u==="mg/m²"?calcDose(d.d,scPac):d.d})),reducao,periodo,obs}))];
    setHistorico(novos);up&&up("ciclos_qt",novos);
    addMsg&&addMsg("Médico","Farmácia",`QT liberada: ${proto.nome} · ${numCiclos} ciclos · início ${dataInicio} · SC ${scPac} m²`,"ciclo");
    alert(`✅ ${numCiclos} ciclos de ${proto.nome} liberados!\nFarmácia e Enfermagem notificadas.`);
    onSalvo&&onSalvo();
  };
  const excluirProtocolo=()=>{
    if(!window.confirm(`⚠️ Excluir protocolo ${proto.nome}?\n\nTODOS os ciclos futuros serão removidos!`))return;
    const novos=(historico||[]).filter(c=>c.status!=="agendado"||c.protocolo!==proto.nome);
    setHistorico(novos);up&&up("ciclos_qt",novos);
    addMsg&&addMsg("Médico","Farmácia",`⚠️ Protocolo ${proto.nome} excluído. Ciclos futuros cancelados.`,"alerta");
    onVoltar();
  };
  return(<div>
    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
      <button onClick={onVoltar} style={{background:"#F1F5F9",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,display:"grid",placeItems:"center"}}>←</button>
      <div style={{flex:1}}>
        <h2 style={{color:N,fontSize:16,fontWeight:900,margin:0}}>{proto.nome}</h2>
        <span style={{background:proto.cor+"22",color:proto.cor,padding:"1px 8px",borderRadius:999,fontSize:10,fontWeight:900}}>{proto.ciclo}</span>
        {pac?.nome&&<span style={{color:"#64748B",fontSize:11,marginLeft:8}}>· {pac.nome}</span>}
      </div>
      <button onClick={excluirProtocolo} style={{background:"#FFF5F5",border:"1px solid "+VM+"44",color:VM,borderRadius:9,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>🗑 Excluir</button>
    </div>
    <div style={{display:"flex",gap:0,background:N,borderRadius:11,overflow:"hidden",marginBottom:14}}>
      {[["doses","💊 Doses"],["periodo","📅 Período"],["ciclos","🔄 Ciclos"],["mudanca","✏️ Alterações"]].map(([id,l])=>(
        <button key={id} onClick={()=>setAbaSel(id)} style={{border:"none",cursor:"pointer",padding:"9px",fontSize:11,fontWeight:800,flex:1,fontFamily:"inherit",background:abaSel===id?G:N,color:abaSel===id?"#fff":"rgba(255,255,255,.5)"}}>
          {l}
        </button>
      ))}
    </div>
    {abaSel==="doses"&&<div style={sc.card()}>
      <div style={{marginBottom:14}}>
        <strong style={{color:N,fontSize:12,display:"block",marginBottom:8}}>Redução de Dose</strong>
        <div style={{display:"flex",gap:6}}>
          {REDUCOES.map(r=>(
            <button key={r.pct} onClick={()=>setReducao(r.pct)} style={{flex:1,border:`2px solid ${reducao===r.pct?r.cor:"#CBD5E1"}`,background:reducao===r.pct?r.cor+"15":"#F8FAFC",color:reducao===r.pct?r.cor:"#64748B",borderRadius:9,padding:"8px 4px",cursor:"pointer",fontSize:10,fontWeight:800,fontFamily:"inherit"}}>
              {r.pct===0?"✅ Plena":`-${r.pct}%`}<div style={{fontSize:9,marginTop:2,opacity:0.7}}>{100-r.pct}%</div>
            </button>
          ))}
        </div>
      </div>
      {pac?.peso&&pac?.altura&&<div style={{background:"#EAF7EE",borderRadius:9,padding:"6px 10px",marginBottom:10,fontSize:11,color:VE,fontWeight:700}}>
        SC (Mosteller): {scPac} m² · Peso: {pac.peso}kg · Altura: {pac.altura}cm
      </div>}
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:10}}>
        <thead><tr style={{background:"#F8FAFC"}}>
          {["Fármaco","Dose padrão","Dia(s)","SC m²",`Dose calculada${reducao>0?` (−${reducao}%)`:""}","Via","Editar","Ativo`].map(h=>(
            <th key={h} style={{padding:"7px 8px",textAlign:"left",fontWeight:800,color:N,fontSize:10,borderBottom:"2px solid #E2E8F0"}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {drugs.map((d,i)=>{
            const doseCalcBase=d.u==="mg/m²"?calcDose(d.d,scPac):d.u==="AUC"?`${d.d} AUC`:`${d.d}`;
            const doseEdit=d.doseEdit!==undefined?d.doseEdit:doseCalcBase;
            return(<tr key={i} style={{borderBottom:"1px solid #F1F5F9",opacity:d.ativo?1:0.4}}>
              <td style={{padding:"7px 8px",fontWeight:700,color:d.ativo?N:"#94A3B8"}}>{d.n}</td>
              <td style={{padding:"7px 8px"}}>{d.d} {d.u}</td>
              <td style={{padding:"7px 8px"}}><span style={{background:T+"22",color:T,borderRadius:6,padding:"2px 7px",fontSize:10,fontWeight:900}}>{d.dia||proto.ciclo||"D1"}</span></td>
              <td style={{padding:"7px 8px",color:"#64748B"}}>{d.u==="mg/m²"?scPac:"—"}</td>
              <td style={{padding:"7px 8px",fontWeight:900,color:reducao>0?VM:VE}}>
                {d.editando?<input value={doseEdit} onChange={e=>setDrugs(x=>x.map((dd,j)=>j===i?{...dd,doseEdit:e.target.value}:dd))} style={{...sc.inp,width:80,padding:"3px 6px",fontSize:11}} onBlur={()=>setDrugs(x=>x.map((dd,j)=>j===i?{...dd,editando:false}:dd))} autoFocus/>
                  :<span>{d.doseEdit!==undefined?d.doseEdit+" mg":(d.u==="mg/m²"?`${doseCalcBase} mg`:d.u==="AUC"?`${d.d} AUC`:`${d.d} ${d.u}`)}{reducao>0&&<span style={{fontSize:9,color:VM,marginLeft:4}}>↓{reducao}%</span>}</span>}
              </td>
              <td style={{padding:"7px 8px",color:"#64748B",fontSize:11}}>{d.via||"IV"}</td>
              <td style={{padding:"7px 8px"}}>
                <button onClick={()=>setDrugs(x=>x.map((dd,j)=>j===i?{...dd,editando:!dd.editando,doseEdit:doseEdit}:dd))} style={{background:T+"22",border:"none",color:T,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"inherit"}}>✏️</button>
              </td>
              <td style={{padding:"7px 8px"}}>
                <button onClick={()=>setDrugs(x=>x.map((dd,j)=>j===i?{...dd,ativo:!dd.ativo}:dd))} style={{background:d.ativo?VE+"22":VM+"22",border:"none",color:d.ativo?VE:VM,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"inherit"}}>
                  {d.ativo?"✓":"✕"}
                </button>
              </td>
            </tr>);
          })}
        </tbody>
      </table>
      <button onClick={()=>setShowAddDrug(!showAddDrug)} style={{background:"none",border:`1px dashed ${T}`,color:T,borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit",marginBottom:showAddDrug?8:0}}>
        + Adicionar medicação
      </button>
      {showAddDrug&&<div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:6,marginBottom:8}}>
        <input placeholder="Nome do fármaco" value={novoDrug.n} onChange={e=>setNovoDrug(x=>({...x,n:e.target.value}))} style={{...sc.inp,fontSize:11}}/>
        <input placeholder="Dose" value={novoDrug.d} onChange={e=>setNovoDrug(x=>({...x,d:e.target.value}))} style={{...sc.inp,fontSize:11}}/>
        <select value={novoDrug.u} onChange={e=>setNovoDrug(x=>({...x,u:e.target.value}))} style={{...sc.inp,fontSize:11}}>
          {["mg/m²","mg/kg","mg fixo","AUC","mg VO","mcg"].map(u=><option key={u}>{u}</option>)}
        </select>
        <Btn v="teal" ch="+" s={{padding:"6px 12px"}} dis={!novoDrug.n||!novoDrug.d} onClick={()=>{setDrugs(x=>[...x,{...novoDrug,ativo:true}]);setNovoDrug({n:"",d:"",u:"mg/m²"});setShowAddDrug(false);}}/>
      </div>}
    </div>}
    {abaSel==="periodo"&&<div style={sc.card()}>
      <strong style={{color:N,fontSize:12,display:"block",marginBottom:10}}>Selecione o Intervalo entre Ciclos</strong>
      {PERIODOS.map(p=>(
        <label key={p.id} style={{display:"flex",gap:10,alignItems:"center",border:`1.5px solid ${periodo===p.id?T:"#CBD5E1"}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",background:periodo===p.id?"#EFF9FF":"#F8FAFC",marginBottom:6}}>
          <input type="radio" checked={periodo===p.id} onChange={()=>setPeriodo(p.id)} style={{accentColor:T,width:15,height:15}}/>
          <span style={{fontSize:12,fontWeight:periodo===p.id?700:400,color:periodo===p.id?N:"#374151"}}>{p.label}</span>
        </label>
      ))}
      {periodo==="custom"&&<Fld l="Especificar período" val={periodoCustom} set={setPeriodoCustom} ph="Ex: D1, D4, D8 a cada 21 dias..."/>}
    </div>}
    {abaSel==="ciclos"&&<div style={sc.card()}>
      <strong style={{color:N,fontSize:12,display:"block",marginBottom:12}}>Liberar Ciclos de Quimioterapia</strong>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px",marginBottom:12}}>
        <Fld l="Data do 1º Ciclo (D1C1)" val={dataInicio} set={setDataInicio}/>
        <div>
          <label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Número de Ciclos a Liberar</label>
          <div style={{display:"flex",gap:5}}>
            {[1,2,3,4,6,8,12].map(n=>(
              <button key={n} onClick={()=>setNumCiclos(n)} style={{flex:1,border:`2px solid ${numCiclos===n?N:"#CBD5E1"}`,background:numCiclos===n?N:"#F8FAFC",color:numCiclos===n?"#fff":N,borderRadius:8,padding:"7px 2px",cursor:"pointer",fontSize:11,fontWeight:900,fontFamily:"inherit"}}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:10,marginBottom:12}}>
        <strong style={{fontSize:11,color:N,display:"block",marginBottom:6}}>📅 Preview dos ciclos:</strong>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>
          {calcProximas().map((c,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:7,padding:"5px 7px",textAlign:"center"}}>
              <div style={{fontWeight:900,color:T,fontSize:10}}>{c.ciclo}</div>
              <div style={{color:"#64748B",fontSize:9}}>{c.data}</div>
            </div>
          ))}
        </div>
      </div>
      <Fld l="Observações / Justificativa" val={obs} set={setObs} ta rows={2} ph="Ex: ECOG 1, bom PS, iniciar protocolo padrão..."/>
      <Btn v="gold" ch={`✅ Liberar ${numCiclos} ciclo${numCiclos>1?"s":""} de ${proto.nome}`} s={{width:"100%",padding:12,fontSize:13,fontWeight:900}} onClick={liberarCiclos}/>
    </div>}
    {abaSel==="mudanca"&&<div style={sc.card()}>
      <H2 ch="✏️ Registrar Mudança de Protocolo" s={{fontSize:13}}/>
      <MudancaProtocolo proto={proto} historico={historico} setHistorico={setHistorico} up={up} addMsg={addMsg}/>
    </div>}
  </div>);
}

function MudancaProtocolo({proto,historico,setHistorico,up,addMsg}){
  const [form,setForm]=useState({tipo:"",motivo:"",data:TODAY(),cicloRef:"",obs:""});
  const upF=(k,v)=>setForm(x=>({...x,[k]:v}));
  const TIPOS=["Redução de dose","Troca de protocolo","Suspensão temporária","Suspensão definitiva","Adiamento de ciclo","Adição de medicação","Remoção de medicação","Outro"];
  const registrar=()=>{
    if(!form.tipo||!form.motivo)return alert("Preencha tipo e motivo.");
    const nova={...form,id:Date.now(),protocolo:proto.nome};
    const novos=[nova,...(historico||[]).map(c=>({...c,mudancas:[...(c.mudancas||[]),nova]}))];
    setHistorico(novos);up&&up("ciclos_qt",novos);
    addMsg&&addMsg("Médico","Farmácia",`⚠️ Mudança em ${proto.nome}: ${form.tipo}. Motivo: ${form.motivo}`,"alerta");
    setForm({tipo:"",motivo:"",data:TODAY(),cicloRef:"",obs:""});
    alert("✅ Mudança registrada no prontuário.");
  };
  return(<div>
    <div style={{marginBottom:8}}>
      <label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Tipo de Mudança *</label>
      <select value={form.tipo} onChange={e=>upF("tipo",e.target.value)} style={{...sc.inp,fontSize:12}}>
        <option value="">Selecionar...</option>{TIPOS.map(t=><option key={t}>{t}</option>)}
      </select>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
      <Fld l="Data" val={form.data} set={v=>upF("data",v)}/>
      <Fld l="Ciclo de referência" val={form.cicloRef} set={v=>upF("cicloRef",v)} ph="Ex: C3D1"/>
    </div>
    <Fld l="Motivo / Justificativa *" val={form.motivo} set={v=>upF("motivo",v)} ta rows={3} ph="Ex: Neuropatia G2 persistente, reduzindo Oxaliplatina 20%..."/>
    <Fld l="Observações adicionais" val={form.obs} set={v=>upF("obs",v)} ta rows={2}/>
    <Btn v="warn" ch="📝 Registrar Mudança" s={{...sc.btn("warn"),width:"100%",padding:11}} dis={!form.tipo||!form.motivo} onClick={registrar}/>
  </div>);
}

function HistoricoCiclos({historico,setHistorico,pac,onVoltar}){
  const todos=historico||[];
  const agendados=todos.filter(c=>c.status==="agendado");
  const realizados=todos.filter(c=>c.status==="realizado");
  const [aba,setAba]=useState("todos");
  const marcarRealizado=(id)=>{const novos=todos.map(c=>c.id===id?{...c,status:"realizado",dataReal:TODAY()}:c);setHistorico(novos);};
  const cancelar=(id)=>{if(!window.confirm("Cancelar este ciclo?"))return;setHistorico(todos.filter(c=>c.id!==id));};
  const lista=aba==="agendados"?agendados:aba==="realizados"?realizados:todos;
  return(<div>
    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
      <button onClick={onVoltar} style={{background:"#F1F5F9",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,display:"grid",placeItems:"center"}}>←</button>
      <h2 style={{color:N,fontSize:15,fontWeight:900,margin:0,flex:1}}>📋 Histórico de Ciclos QT</h2>
      <div style={{display:"flex",gap:6,fontSize:11}}>
        <span style={{background:VE+"22",color:VE,padding:"2px 8px",borderRadius:999,fontWeight:700}}>✅ {realizados.length}</span>
        <span style={{background:T+"22",color:T,padding:"2px 8px",borderRadius:999,fontWeight:700}}>📅 {agendados.length}</span>
      </div>
    </div>
    <div style={{display:"flex",gap:0,background:"#F1F5F9",borderRadius:10,overflow:"hidden",marginBottom:12}}>
      {[["todos","Todos"],["agendados","📅 Agendados"],["realizados","✅ Realizados"]].map(([id,l])=>(
        <button key={id} onClick={()=>setAba(id)} style={{flex:1,border:"none",cursor:"pointer",padding:"8px",fontSize:11,fontWeight:700,fontFamily:"inherit",background:aba===id?N:"transparent",color:aba===id?"#fff":"#64748B"}}>{l}</button>
      ))}
    </div>
    {lista.length===0?(
      <div style={{textAlign:"center",padding:24,color:"#94A3B8"}}><div style={{fontSize:28,marginBottom:6}}>💉</div><p style={{fontSize:12}}>Nenhum ciclo nesta categoria.</p></div>
    ):(
      <div style={{display:"grid",gap:8}}>
        {lista.map((c,i)=>(
          <div key={c.id||i} style={sc.card({border:`2px solid ${c.status==="realizado"?VE:T}33`})}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <strong style={{color:N,fontSize:13}}>{c.ciclo}</strong>
                  <span style={{background:(c.status==="realizado"?VE:T)+"22",color:c.status==="realizado"?VE:T,padding:"1px 7px",borderRadius:999,fontSize:9,fontWeight:900}}>
                    {c.status==="realizado"?"✅ Realizado":"📅 Agendado"}
                  </span>
                  {c.reducao>0&&<span style={{background:VM+"22",color:VM,padding:"1px 7px",borderRadius:999,fontSize:9,fontWeight:900}}>−{c.reducao}%</span>}
                </div>
                <div style={{color:"#64748B",fontSize:10,marginTop:2}}>📅 {c.data} · {c.protocolo}</div>
                {c.dataReal&&<div style={{color:VE,fontSize:9,marginTop:1}}>Realizado em: {c.dataReal}</div>}
              </div>
              <div style={{display:"flex",gap:5}}>
                {c.status==="agendado"&&<>
                  <button onClick={()=>marcarRealizado(c.id)} style={{background:VE+"22",color:VE,border:"none",borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit"}}>✅ Realizado</button>
                  <button onClick={()=>cancelar(c.id)} style={{background:VM+"11",color:VM,border:"none",borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit"}}>✕</button>
                </>}
              </div>
            </div>
            {c.drugs&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {c.drugs.filter(d=>d.ativo!==false).map((d,j)=>(
                <span key={j} style={{background:"#F1F5F9",color:N,padding:"2px 8px",borderRadius:999,fontSize:9,fontWeight:700}}>{d.n} {d.doseCalc||d.d} {d.u==="mg/m²"?"mg":d.u}</span>
              ))}
            </div>}
            {c.obs&&<div style={{color:"#64748B",fontSize:10,marginTop:5,fontStyle:"italic"}}>{c.obs}</div>}
          </div>
        ))}
      </div>
    )}
  </div>);
}

// ── TRIAGEM DE ENFERMAGEM ─────────────────────────────────────────────────────
function TriagemEnfermagem({pac,addMsg,onTriagemConcluida}){
  const [step,setStep]=useState(1);
  const [d,setD]=useState({nome:pac?.nome||"",ciclo:"",protocolo:pac?.trat||"",data:TODAY(),hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),enfermeira:"",pas:"",pad:"",fc:"",fr:"",temp:"",spo2:"",peso:pac?.peso||"",altura:pac?.altura||"",hgb:"",leuco:"",neutro:"",plt:"",creat:"",tgo:"",tgp:"",ecog:"",ctcae:{},conclusao:"",obs:""});
  const [print,setPrint]=useState(null);
  const upD=(k,v)=>setD(x=>({...x,[k]:v}));
  const upCT=(k,v)=>setD(x=>({...x,ctcae:{...x.ctcae,[k]:v}}));
  const ECOG_DEF=["0 — Completamente ativo, sem restrição","1 — Atividade física vigorosa restrita, ambulatorial","2 — Ambulatorial, capaz de autocuidado, acamado <50% do tempo","3 — Limitado autocuidado, acamado >50% do tempo","4 — Completamente incapaz, dependente, acamado 100%"];
  const COR_CTCAE={G0:VE,G1:"#84CC16",G2:AM,G3:"#F97316",G4:VM};
  const gerarDocumento=()=>{
    const ctcaeAtivos=Object.entries(d.ctcae).filter(([,v])=>v&&v!=="G0").map(([k,v])=>`${CTCAE_ITEMS.find(i=>i.id===k)?.nome||k}: ${v}`).join(" · ");
    return `TRIAGEM ONCOLÓGICA PRÉ-QUIMIOTERAPIA\n${HOSP}\n${AUTOR} · ${AUTOR2}\n${"═".repeat(55)}\nData: ${d.data} às ${d.hora}\nEnfermeira: ${d.enfermeira||"—"}\nPaciente: ${d.nome||"—"}\nProtocolo: ${d.protocolo||"—"} · ${d.ciclo||"—"}\n${"─".repeat(55)}\n\nSINAIS VITAIS:\nPA: ${d.pas}/${d.pad} mmHg   FC: ${d.fc} bpm   FR: ${d.fr} irpm\nTemp: ${d.temp}°C   SPO₂: ${d.spo2}%\nPeso: ${d.peso}kg   Altura: ${d.altura}cm\n\nEXAMES LABORATORIAIS (pré-ciclo):\nHgb: ${d.hgb||"—"} g/dL       Leuco: ${d.leuco||"—"} /mm³\nNeutrófilos: ${d.neutro||"—"} /mm³   Plaquetas: ${d.plt||"—"} /mm³\nCreatinina: ${d.creat||"—"} mg/dL   TGO: ${d.tgo||"—"}   TGP: ${d.tgp||"—"}\n\nECOG: ${d.ecog||"—"} · ${ECOG_DEF[Number(d.ecog)]||"—"}\n\nTOXICIDADE CTCAE:\n${ctcaeAtivos||"Sem toxicidade G1+ relatada"}\n\nCONCLUSÃO: ${d.conclusao}\n${d.obs?"\nOBSERVAÇÕES: "+d.obs:""}\n${"─".repeat(55)}\n⚠️ Esta triagem é avaliação de enfermagem. A liberação final é responsabilidade exclusiva do médico.\n\n${AUTOR} · ${AUTOR2}\n${HOSP}`;
  };
  const concluir=()=>{
    const doc=gerarDocumento();
    setPrint({t:`Triagem QT — ${d.nome} — ${d.ciclo}`,c:doc});
    addMsg&&addMsg("Enfermagem","Médico",`📋 Triagem: ${d.nome} · ${d.ciclo} — ${d.conclusao}`,"triagem");
    onTriagemConcluida&&onTriagemConcluida({...d,doc});
  };
  return(<div style={{fontFamily:"Georgia, serif"}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,marginBottom:16}}>
      {PASSOS_TRIAGEM.map(p=>(
        <div key={p.n} style={{textAlign:"center",cursor:"pointer"}} onClick={()=>step>p.n&&setStep(p.n)}>
          <div style={{width:26,height:26,borderRadius:"50%",margin:"0 auto 3px",display:"grid",placeItems:"center",fontSize:10,fontWeight:900,background:step===p.n?T:step>p.n?VE:"#E2E8F0",color:step===p.n||step>p.n?"#fff":"#94A3B8"}}>{step>p.n?"✓":p.n}</div>
          <div style={{fontSize:8,fontWeight:700,color:step===p.n?T:step>p.n?VE:"#94A3B8",textTransform:"uppercase"}}>{p.l}</div>
        </div>
      ))}
    </div>
    {step===1&&<div style={sc.card()}>
      <H2 ch="1. Identificação do Paciente" s={{fontSize:15}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
        <Fld l="Nome completo" val={d.nome} set={v=>upD("nome",v)} ph={pac?.nome||"Nome do paciente"}/>
        <Fld l="Número do ciclo" val={d.ciclo} set={v=>upD("ciclo",v)} ph="Ex: C3D1, C1D8..."/>
        <Fld l="Protocolo de QT" val={d.protocolo} set={v=>upD("protocolo",v)} ph={pac?.trat||"Ex: mFOLFOX6, AC..."}/>
        <Fld l="Enfermeira responsável" val={d.enfermeira} set={v=>upD("enfermeira",v)} ph="Nome da enfermeira"/>
      </div>
      <Btn v="teal" ch="Próximo: Sinais Vitais →" s={{width:"100%",padding:11,marginTop:8}} dis={!d.nome||!d.ciclo} onClick={()=>setStep(2)}/>
    </div>}
    {step===2&&<div style={sc.card()}>
      <H2 ch="2. Sinais Vitais" s={{fontSize:15}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 10px"}}>
        {[["PA Sistólica (mmHg)","pas","120"],["PA Diastólica (mmHg)","pad","80"],["FC (bpm)","fc","72"],["FR (irpm)","fr","16"],["Temperatura (°C)","temp","36,8"],["SPO₂ (%)","spo2","97"],["Peso (kg)","peso",pac?.peso||"65"],["Altura (cm)","altura",pac?.altura||"162"]].map(([l,k,ph])=>(
          <Fld key={k} l={l} val={d[k]} set={v=>upD(k,v)} ph={ph}/>
        ))}
      </div>
      {Number(d.temp)>=37.8&&<div style={{background:"#FEF2F2",border:"1px solid "+VM,borderRadius:9,padding:"8px 12px",marginBottom:8,color:VM,fontWeight:700,fontSize:12}}>🚨 ALERTA: Temperatura ≥ 37,8°C — Investigar neutropenia febril!</div>}
      {Number(d.spo2)<94&&d.spo2&&<div style={{background:"#FFF5F5",border:"1px solid "+AM,borderRadius:9,padding:"8px 12px",marginBottom:8,color:AM,fontWeight:700,fontSize:12}}>⚠️ SPO₂ baixa ({d.spo2}%) — Avaliar suporte de oxigênio</div>}
      {Number(d.pas)<90&&d.pas&&<div style={{background:"#FFF5F5",border:"1px solid "+AM,borderRadius:9,padding:"8px 12px",marginBottom:8,color:AM,fontWeight:700,fontSize:12}}>⚠️ Hipotensão — PA {d.pas}/{d.pad} mmHg</div>}
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <Btn v="ghost" ch="← Voltar" onClick={()=>setStep(1)}/>
        <Btn v="teal" ch="Próximo: Exames Lab →" s={{flex:1,padding:11}} onClick={()=>setStep(3)}/>
      </div>
    </div>}
    {step===3&&<div style={sc.card()}>
      <H2 ch="3. Exames Laboratoriais Pré-Ciclo" s={{fontSize:15}}/>
      <div style={{background:"#EFF9FF",border:"1px solid "+T+"33",borderRadius:9,padding:"7px 10px",marginBottom:10,fontSize:11,color:T}}>
        💡 Valores mínimos habituais: Neutrófilos ≥ 1.500 · Plaquetas ≥ 100.000 · Hgb ≥ 8,0
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
        {[["Hemoglobina (g/dL)","hgb","≥ 8,0"],["Leucócitos (/mm³)","leuco","≥ 4.000"],["Neutrófilos (/mm³)","neutro","≥ 1.500"],["Plaquetas (/mm³)","plt","≥ 100.000"],["Creatinina (mg/dL)","creat","≤ 1,5"],["TGO/AST (U/L)","tgo","≤ 3×LSN"],["TGP/ALT (U/L)","tgp","≤ 3×LSN"]].map(([l,k,ref])=>(
          <div key={k}>
            <Fld l={l} val={d[k]} set={v=>upD(k,v)} ph={ref}/>
            {k==="neutro"&&d.neutro&&Number(d.neutro)<1500&&<div style={{color:VM,fontSize:9,fontWeight:700,marginTop:-5,marginBottom:6}}>⚠️ Abaixo do limite para QT!</div>}
            {k==="plt"&&d.plt&&Number(d.plt)<100000&&<div style={{color:VM,fontSize:9,fontWeight:700,marginTop:-5,marginBottom:6}}>⚠️ Plaquetopenia — revisar protocolo</div>}
            {k==="hgb"&&d.hgb&&Number(d.hgb)<8&&<div style={{color:VM,fontSize:9,fontWeight:700,marginTop:-5,marginBottom:6}}>⚠️ Hemoglobina crítica</div>}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <Btn v="ghost" ch="← Voltar" onClick={()=>setStep(2)}/>
        <Btn v="teal" ch="Próximo: ECOG →" s={{flex:1,padding:11}} onClick={()=>setStep(4)}/>
      </div>
    </div>}
    {step===4&&<div style={sc.card()}>
      <H2 ch="4. ECOG Performance Status" s={{fontSize:15}}/>
      {ECOG_DEF.map((def,i)=>(
        <label key={i} style={{display:"flex",gap:12,alignItems:"center",border:`2px solid ${d.ecog===String(i)?T:"#CBD5E1"}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",background:d.ecog===String(i)?"#EFF9FF":"#F8FAFC",marginBottom:6}}>
          <input type="radio" checked={d.ecog===String(i)} onChange={()=>upD("ecog",String(i))} style={{accentColor:T,width:16,height:16,flexShrink:0}}/>
          <div><span style={{fontWeight:900,color:N,fontSize:13,marginRight:6}}>{i}</span><span style={{fontSize:12,color:"#374151"}}>{def.replace(`${i} — `,"")}</span></div>
        </label>
      ))}
      {d.ecog&&Number(d.ecog)>=3&&<div style={{background:"#FEF2F2",border:"1px solid "+VM,borderRadius:9,padding:"8px 12px",marginTop:6,color:VM,fontWeight:700,fontSize:12}}>
        🚨 ECOG {d.ecog} — Revisar indicação de QT com médico responsável
      </div>}
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <Btn v="ghost" ch="← Voltar" onClick={()=>setStep(3)}/>
        <Btn v="teal" ch="Próximo: Toxicidade →" s={{flex:1,padding:11}} dis={!d.ecog} onClick={()=>setStep(5)}/>
      </div>
    </div>}
    {step===5&&<div style={sc.card()}>
      <H2 ch="5. Toxicidade CTCAE v5.0" s={{fontSize:15}}/>
      <p style={{fontSize:11,color:"#64748B",marginBottom:10}}>Avalie cada toxicidade presente. G0 = sem toxicidade.</p>
      {CTCAE_ITEMS.map(item=>(
        <div key={item.id} style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:800,color:N,marginBottom:4}}>{item.nome}</div>
          <div style={{fontSize:9,color:"#64748B",marginBottom:5,lineHeight:1.4}}>{item.desc}</div>
          <div style={{display:"flex",gap:5}}>
            {["G0","G1","G2","G3","G4"].map(g=>{const sel=(d.ctcae[item.id]||"G0")===g;return(
              <button key={g} onClick={()=>upCT(item.id,g)} style={{flex:1,border:`2px solid ${sel?COR_CTCAE[g]:"#CBD5E1"}`,background:sel?COR_CTCAE[g]:"#F8FAFC",color:sel?"#fff":"#64748B",borderRadius:7,padding:"5px 2px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"inherit"}}>{g}</button>
            );})}
          </div>
        </div>
      ))}
      {Object.values(d.ctcae).some(v=>v==="G3"||v==="G4")&&<div style={{background:"#FEF2F2",border:"2px solid "+VM,borderRadius:10,padding:"10px 12px",marginTop:6}}>
        <strong style={{color:VM,fontSize:12}}>🚨 Toxicidade G3/G4 detectada!</strong>
        <p style={{color:"#7F1D1D",fontSize:11,marginTop:4}}>Comunicar ao médico antes de liberar QT.</p>
      </div>}
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <Btn v="ghost" ch="← Voltar" onClick={()=>setStep(4)}/>
        <Btn v="teal" ch="Próximo: Conclusão →" s={{flex:1,padding:11}} onClick={()=>setStep(6)}/>
      </div>
    </div>}
    {step===6&&<div style={sc.card()}>
      <H2 ch="6. Conclusão da Triagem" s={{fontSize:15}}/>
      <p style={{fontSize:11,color:"#64748B",marginBottom:12}}>Avaliação final de enfermagem. A liberação é responsabilidade exclusiva do médico.</p>
      <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:10,marginBottom:12}}>
        <strong style={{color:N,fontSize:11,display:"block",marginBottom:6}}>📊 Resumo da Avaliação:</strong>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          {[["PA",`${d.pas}/${d.pad}`],["FC",d.fc+" bpm"],["SPO₂",d.spo2+"%"],["Temp",d.temp+"°C"],["ECOG",d.ecog],["Neutro",d.neutro],["PLT",d.plt],["Hgb",d.hgb]].map(([l,v])=>(
            <div key={l} style={{display:"flex",gap:6,fontSize:11}}><span style={{color:"#64748B",width:50}}>{l}:</span><strong style={{color:N}}>{v||"—"}</strong></div>
          ))}
        </div>
      </div>
      {[{v:"✅ APTO — Liberar para QT conforme protocolo",c:VE,bg:"#EAF7EE"},{v:"⏸ ADIAR — Aguardar nova avaliação médica",c:AM,bg:"#FFF7E6"},{v:"⚠️ ATENÇÃO — Comunicar médico antes de iniciar",c:"#F97316",bg:"#FFF3E0"},{v:"🚨 CONTRAINDICADO — QT não iniciar sem avaliação médica",c:VM,bg:"#FEF2F2"}].map(o=>(
        <button key={o.v} onClick={()=>upD("conclusao",o.v)} style={{display:"block",width:"100%",border:`2px solid ${d.conclusao===o.v?o.c:"#CBD5E1"}`,borderRadius:11,padding:"11px 12px",fontWeight:900,cursor:"pointer",background:d.conclusao===o.v?o.bg:"#F8FAFC",color:d.conclusao===o.v?o.c:N,fontSize:12,textAlign:"left",marginBottom:6,fontFamily:"inherit"}}>{o.v}</button>
      ))}
      <Fld l="Observações da Enfermagem" val={d.obs} set={v=>upD("obs",v)} ta rows={3} ph="Intercorrências, sintomas relatados, orientações fornecidas..."/>
      <div style={{background:"#FFFBEB",border:"1px solid "+AM+"44",borderRadius:9,padding:"7px 12px",marginBottom:10,fontSize:10,color:AM,lineHeight:1.5}}>
        ⚠️ NOTA LEGAL: Esta triagem é uma avaliação de enfermagem. A liberação final para quimioterapia é de responsabilidade exclusiva do médico plantonista.
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn v="ghost" ch="← Voltar" onClick={()=>setStep(5)}/>
        <Btn v="gold" ch="✅ Concluir e Enviar ao Médico" s={{flex:1,padding:11,fontWeight:900}} dis={!d.conclusao} onClick={concluir}/>
      </div>
      {d.conclusao&&<Btn v="ghost" ch="🖨️ Imprimir Triagem" s={{width:"100%",marginTop:7,fontSize:11}} onClick={()=>setPrint({t:`Triagem — ${d.nome} — ${d.ciclo}`,c:gerarDocumento()})}/>}
    </div>}
  </div>);
}

function ReceitasComp({pac,addCaixaEntrada}){
  const [print,setPrint]=useState(null);
  const hoje=new Date().toLocaleDateString("pt-BR");
  const cab=`${AUTOR} · ${AUTOR2}\n${HOSP}\n${"─".repeat(50)}\nNome: ${pac.nome||"___"}  Data: ${hoje}\n${"─".repeat(50)}\n\n`;
  const DOCS=[
    {ico:"💊",t:"Sintomáticos VO",c:cab+`RECEITA MÉDICA — VIA ORAL\n\n1. Pantoprazol 20mg — jejum durante QT\n2. Ondansetrona 8mg — 8/8h × 2d pós-QT\n3. Metoclopramida 10mg — 8/8h × 2d\n4. Dexametasona 4mg — noite ant. + dia seguinte\n5. Loperamida 2mg — 2cp início + 1cp/2h (diarreia)\n6. Lactulose 30mL — 12/12h (obstipação)\n7. Simeticona 125mg — 8/8h pós refeições`},
    {ico:"💉",t:"Sintomáticos EV (UBS)",c:cab+`RECEITA MÉDICA — VIA ENDOVENOSA\n\n1. Complexo B — IV SF 500mL 3h\n2. Ondansetrona 8mg — IV SF 100mL 15min\n3. Metoclopramida 10mg — IV SF 100mL\n4. Noripurum — IV SF 250mL 30min\n5. Buscopan — IV SF 250mL\n6. Dexametasona 10mg — IV lento`},
    {ico:"🧪",t:"Exames Laboratoriais",c:cab+`REQUISIÇÃO DE EXAMES\n\nREALIZAR 2 DIAS ANTES DO PRÓXIMO CICLO:\n\n          CICLO 1   CICLO 2   CICLO 3\nHemograma    X         X         X\nUreia         X         X         X\nCreatinina    X         X         X\nTGO (AST)     X         X         X\nTGP (ALT)     X         X         X`},
    {ico:"🚨",t:"Sinais de Alarme",c:cab+`SINAIS DE ALARME\n\nVÁ AO PRONTO SOCORRO SE:\n■ FEBRE acima de 37,8°C — IMEDIATAMENTE!\n■ Calafrios intensos / pus no cateter\n■ Falta de ar ou dificuldade respiratória\n■ Dor ao urinar / sangramento anormal\n■ Confusão mental ou desmaio\n■ Vômitos > 5x/dia ou diarreia > 6x/dia\n■ Dor forte que não melhora\n\nEM CASO DE DÚVIDA — VÁ AO PS, NÃO ESPERE!`},
    {ico:"🥗",t:"Orientação Nutricional",c:cab+`ORIENTAÇÃO NUTRICIONAL\n\n✓ PODE: Frango/peixe/ovos cozidos · Feijão · Arroz/batata · Frutas descascadas · Vegetais cozidos · 2-3L água/dia\n\n✗ NÃO PODE: Carnes cruas/sushi · ÁLCOOL · Ultraprocessados · Queijo artesanal fresco\n\nDICAS: 6 refeições pequenas · Mastigar devagar · Lavar bem os alimentos`},
  ];
  return <div style={{display:"grid",gap:9}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    {DOCS.map((d,i)=><div key={i} style={{...sc_.card(),display:"flex",gap:9,alignItems:"center",padding:11}}>
      <div style={{width:38,height:38,background:`linear-gradient(135deg,${N},${T})`,borderRadius:9,display:"grid",placeItems:"center",fontSize:18,flexShrink:0}}>{d.ico}</div>
      <strong style={{color:N,flex:1,fontSize:12}}>{d.t}</strong>
      <div style={{display:"flex",gap:5}}>
        <Btn v="gold" ch="🖨" s={{fontSize:11,padding:"5px 8px"}} onClick={()=>setPrint({t:d.t,c:d.c})}/>
        <Btn v="ghost" ch="📋" s={{fontSize:10,padding:"5px 7px"}} onClick={()=>navigator.clipboard?.writeText(d.c)}/>
      </div>
    </div>)}
  </div>;
}

function SalaoMedico({addMsg,setEmergenciaAtiva}){
  const [aba,setAba]=useState("cadeiras");
  const [emMsg,setEmMsg]=useState("");const [emCad,setEmCad]=useState("");
  const dispararEmergencia=()=>{
    const txt=`🚨 EMERGÊNCIA — Cadeira ${emCad||"?"}: ${emMsg||"Intercorrência urgente!"}`;
    playAlertSound();
    setEmergenciaAtiva&&setEmergenciaAtiva({de:"Salão",txt,hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})});
    addMsg&&addMsg("Salão","Médico",txt,"emergencia");
  };
  return <div style={{display:"grid",gap:12}}>
    <div style={{background:N,display:"flex",borderRadius:11,overflow:"hidden"}}>
      {[{id:"cadeiras",l:"🛋️ Cadeiras"},{id:"emergencia",l:"🚨 Emergência"}].map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{border:"none",cursor:"pointer",padding:"9px",fontSize:12,fontWeight:800,flex:1,background:aba===a.id?(a.id==="emergencia"?VM:G):N,color:aba===a.id?"#fff":"rgba(255,255,255,.5)"}}>{a.l}</button>)}
    </div>
    {aba==="cadeiras"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
      {MOCK_CADEIRAS.map(cad=>{const ocup=cad.st==="ocup",prep=cad.st==="prep";return <div key={cad.id} style={sc_.card({border:`2px solid ${ocup?T:prep?G:"#CBD5E1"}`,background:ocup?"#EFF9FF":prep?"#FFFBEB":"#F8FAFC",padding:10})}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><strong style={{color:N,fontSize:12}}>{cad.id}</strong><Bge t={ocup?"ok":prep?"gold":"muted"} ch={ocup?"Em uso":prep?"Preparo":"Livre"}/></div>
        <p style={{color:ocup?N:"#94A3B8",fontWeight:ocup?700:400,fontSize:12,margin:"0 0 2px"}}>{cad.pac}</p>
        <p style={{color:"#64748B",fontSize:10,margin:"0 0 6px"}}>{cad.proto}</p>
        {ocup&&<Btn v="red" ch="🚨" s={{width:"100%",fontSize:10}} onClick={()=>{setEmCad(cad.id);setEmMsg("Intercorrência em "+cad.pac);setAba("emergencia");}}/>}
      </div>;})}
    </div>}
    {aba==="emergencia"&&<div style={sc_.card({background:"#FEF2F2",border:`3px solid ${VM}`})}>
      <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:44,marginBottom:5}}>🚨</div><h2 style={{color:VM,fontSize:17,fontWeight:900,margin:"0 0 3px"}}>EMERGÊNCIA — SALÃO</h2><p style={{color:"#7F1D1D",fontSize:11,margin:0}}>Alerta invade a tela do médico com som</p></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px",marginBottom:10}}>
        <div><label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Cadeira</label>
          <select value={emCad} onChange={e=>setEmCad(e.target.value)} style={{...sc_.inp,fontSize:12}}>
            <option value="">Selecionar...</option>{MOCK_CADEIRAS.map(c=><option key={c.id} value={c.id}>{c.id} — {c.pac}</option>)}
          </select></div>
        <div><label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Ocorrência</label>
          <select onChange={e=>setEmMsg(e.target.value)} style={{...sc_.inp,fontSize:12}}>
            <option value="">Selecionar...</option>{["Queda de pressão","Reação alérgica","Extravasamento QT","Dificuldade respiratória","Dor torácica","Crise convulsiva"].map(o=><option key={o}>{o}</option>)}
          </select></div>
      </div>
      <textarea value={emMsg} onChange={e=>setEmMsg(e.target.value)} rows={2} placeholder="Descreva a emergência..." style={{...sc_.inp,width:"100%",resize:"none",marginBottom:10}}/>
      <button onClick={dispararEmergencia} style={{width:"100%",background:VM,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>🚨 DISPARAR EMERGÊNCIA</button>
    </div>}
  </div>;
}

function SeletorEquipe({funcLogado,setFuncLogado}){
  const [open,setOpen]=useState(false);
  return <div style={{position:"relative"}}>
    <button onClick={()=>setOpen(x=>!x)} style={{background:"rgba(255,255,255,.12)",border:"none",color:"#fff",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>
      {(funcLogado?.nome||"Equipe").split(" ")[0]} ▾
    </button>
    {open&&<div style={{position:"absolute",top:"110%",right:0,background:"#fff",borderRadius:11,boxShadow:"0 8px 32px rgba(0,0,0,.18)",padding:8,minWidth:210,zIndex:9999}}>
      {EQUIPE.map(e=><button key={e.id} onClick={()=>{setFuncLogado(e);setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",background:funcLogado?.id===e.id?"#EFF9FF":"transparent",border:"none",cursor:"pointer",padding:"7px 10px",borderRadius:7,marginBottom:2}}>
        <div style={{fontWeight:800,color:N,fontSize:12}}>{e.nome}</div>
        <div style={{color:"#64748B",fontSize:10}}>{e.cargo}</div>
      </button>)}
    </div>}
  </div>;
}

function TriagemMedicoComp({mensagens,addMsg,pac}){
  const triagens=(mensagens||[]).filter(m=>m.tipo==="triagem"||m.de==="Enfermagem");
  return <div style={{display:"grid",gap:11}}>
    {triagens.length===0?<div style={sc_.card({textAlign:"center",padding:24,color:"#94A3B8"})}>
      <div style={{fontSize:32,marginBottom:7}}>🩺</div><p style={{fontSize:12}}>Nenhuma triagem recebida.</p>
      <Btn v="teal" ch="Simular triagem" s={{marginTop:9,fontSize:11}} onClick={()=>addMsg&&addMsg("Enfermagem","Médico",`Triagem — ${pac.nome||"Paciente"}:\n✅ LIBERADO PARA QT\nPA: 128/82 · SPO₂: 97% · FC: 78\nECOG: 1 · Náusea G1 · Fadiga G1`,"triagem")}/>
    </div>
    :<div style={{display:"grid",gap:8}}>
      {triagens.map((m,i)=><div key={i} style={sc_.card({border:`1px solid ${m.txt?.includes("LIBERADO")?VE:AM}44`})}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}><span style={{fontSize:18}}>{m.txt?.includes("LIBERADO")?"✅":"⏸"}</span><div style={{flex:1}}><strong style={{color:N,fontSize:12}}>{m.de}</strong><div style={{color:"#64748B",fontSize:9}}>{m.dt}</div></div><Bge t={m.txt?.includes("LIBERADO")?"ok":"warn"} ch={m.txt?.includes("LIBERADO")?"LIBERADO":"PENDENTE"}/></div>
        <pre style={{whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",fontSize:10,lineHeight:1.6,background:"#F8FAFC",borderRadius:7,padding:8,color:"#374151",margin:"0 0 7px",maxHeight:160,overflowY:"auto"}}>{m.txt}</pre>
        <div style={{display:"flex",gap:5}}><Btn v="green" ch="✅ Confirmar QT" s={{flex:1,fontSize:10}} onClick={()=>addMsg&&addMsg("Médico","Enfermagem","QT confirmada. Pode iniciar.","msg")}/><Btn v="gold" ch="⏸ Adiar" s={{fontSize:10}} onClick={()=>addMsg&&addMsg("Médico","Enfermagem","QT ADIADA.","alerta")}/></div>
      </div>)}
    </div>}
  </div>;
}

function TrialsCompMelhorado({pac,addMsg}){
  const [aba,setAba]=useState("estudos");const [sel,setSel]=useState(null);const [incluidos,setIncluidos]=useState([]);
  const refUp=useRef(null);const [arqUp,setArqUp]=useState([]);const [analise,setAnalise]=useState(null);
  const verificar=t=>{const fail=[];t.inc.forEach(c=>{if(c.toLowerCase().includes("ecog 0–2")&&Number(pac.ecog||"3")>2)fail.push(c);});return{fail,elegivel:fail.length===0};};
  return <div style={{display:"grid",gap:11}}>
    <div style={{background:N,display:"flex",borderRadius:10,overflow:"hidden"}}>
      {[{id:"estudos",l:"📋 Estudos"},{id:"upload",l:"📤 Upload"},{id:"incluidos",l:`👥 Incluídos (${incluidos.length})`}].map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{border:"none",cursor:"pointer",padding:"9px",fontSize:11,fontWeight:800,flex:1,background:aba===a.id?G:N,color:aba===a.id?"#fff":"rgba(255,255,255,.5)"}}>{a.l}</button>)}
    </div>
    {aba==="estudos"&&TRIALS.map(t=>{const el=pac.diag?verificar(t):{fail:[],elegivel:false};const isOpen=sel?.id===t.id;return <div key={t.id} style={sc_.card({border:`2px solid ${el.elegivel&&pac.diag?VE:isOpen?G:"#E2E8F0"}`})}>
      <div onClick={()=>setSel(isOpen?null:t)} style={{cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}><div><strong style={{color:N,fontSize:13}}>{t.n}</strong> <span style={{color:"#64748B",fontSize:10}}>Fase {t.fase} · {t.tumor}</span></div><div style={{display:"flex",gap:4,flexShrink:0}}><span style={{background:t.status==="ativo"?VE:T,color:"#fff",padding:"1px 5px",borderRadius:999,fontSize:8,fontWeight:900}}>{t.status?.toUpperCase()}</span>{el.elegivel&&pac.diag&&<span style={{background:G,color:"#fff",padding:"1px 5px",borderRadius:999,fontSize:8,fontWeight:900}}>✓ ELEGÍVEL</span>}</div></div>
        <div style={{fontSize:10,marginTop:2}}><strong style={{color:N}}>SG:</strong> {t.sg} {t.slp&&<span> · <strong style={{color:T}}>SLP:</strong> {t.slp}</span>}</div>
      </div>
      {isOpen&&<div style={{marginTop:9,paddingTop:8,borderTop:"1px solid #E2E8F0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:7}}>
          <div style={{background:"#EAF7EE",borderRadius:7,padding:8}}><strong style={{color:VE,fontSize:10,display:"block",marginBottom:3}}>✅ Inclusão</strong>{t.inc.map((c,i)=><div key={i} style={{fontSize:9,marginBottom:1}}>• {c}</div>)}</div>
          <div style={{background:"#FFF5F5",borderRadius:7,padding:8}}><strong style={{color:VM,fontSize:10,display:"block",marginBottom:3}}>❌ Exclusão</strong>{t.exc.map((c,i)=><div key={i} style={{fontSize:9,marginBottom:1}}>• {c}</div>)}</div>
        </div>
        <div style={{display:"flex",gap:5}}>
          {el.elegivel&&pac.diag&&<Btn v="gold" ch="✅ Incluir" s={{flex:1,fontSize:10}} onClick={()=>{if(!pac.nome)return alert("Cadastre o paciente.");setIncluidos(x=>[{pac:pac.nome,trial:t.n,data:new Date().toLocaleDateString("pt-BR")},...x]);setAba("incluidos");addMsg&&addMsg("Médico","Todos",`${pac.nome} incluído em ${t.n}.`,"msg");}}/>}
          <Btn v="teal" ch="📤 Sponsor" s={{fontSize:10}} onClick={()=>alert(`Dados enviados ao sponsor: ${t.n}`)}/>
        </div>
      </div>}
    </div>;})}
    {aba==="upload"&&<div style={sc_.card()}>
      <H2 ch="📤 Upload de Protocolo"/>
      <input ref={refUp} type="file" accept=".pdf,.doc,.docx" style={{display:"none"}} onChange={e=>{setArqUp(Array.from(e.target.files||[]).map(f=>({n:f.name})));e.target.value="";}}/>
      <div onClick={()=>refUp.current?.click()} style={{border:"2px dashed "+T,borderRadius:10,padding:"20px",textAlign:"center",cursor:"pointer",background:"#F0F9FF",marginBottom:8}}><div style={{fontSize:30,marginBottom:5}}>📄</div><strong style={{color:T,fontSize:12}}>Upload PDF ou Word</strong></div>
      {arqUp.length>0&&!analise&&<Btn v="gold" ch="📤 Extrair Critérios" s={{width:"100%"}} onClick={()=>{setAnalise({loading:true});setTimeout(()=>setAnalise({ok:["Histologia confirmada","ECOG 0–2","Sem anti-PD-1 prévio"],exc:["Autoimune ativa","SNC não tratadas"],titulo:arqUp[0].n}),2000);}}/>}
      {analise?.loading&&<p style={{textAlign:"center",color:T,padding:12}}>⏳ Extraindo critérios...</p>}
      {analise&&!analise.loading&&<div style={{marginTop:9,background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:9,padding:10}}><H3 ch={"✅ "+analise.titulo} s={{color:VE}}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}><div style={{background:"#EAF7EE",borderRadius:7,padding:8}}><strong style={{color:VE,fontSize:10,display:"block",marginBottom:3}}>✅ Inclusão</strong>{analise.ok.map((c,i)=><div key={i} style={{fontSize:9,marginBottom:1}}>• {c}</div>)}</div><div style={{background:"#FFF5F5",borderRadius:7,padding:8}}><strong style={{color:VM,fontSize:10,display:"block",marginBottom:3}}>❌ Exclusão</strong>{analise.exc.map((c,i)=><div key={i} style={{fontSize:9,marginBottom:1}}>• {c}</div>)}</div></div></div>}
    </div>}
    {aba==="incluidos"&&<div style={sc_.card()}><H2 ch="👥 Pacientes Incluídos"/>{incluidos.length===0?<p style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:14}}>Nenhum incluído.</p>:incluidos.map((p,i)=><div key={i} style={{display:"flex",gap:9,alignItems:"center",border:"1px solid "+VE+"44",borderRadius:8,padding:"7px 10px",marginBottom:6,background:"#EAF7EE"}}><span style={{fontSize:16}}>🧬</span><div style={{flex:1}}><strong style={{color:N}}>{p.pac}</strong><div style={{color:"#64748B",fontSize:10}}>{p.trial} · {p.data}</div></div></div>)}</div>}
  </div>;
}


function BtnSalvar({pac}){const [ok,setOk]=useState(false);return <Btn v="gold" ch={ok?"✓ Salvo!":"💾 Salvar"} s={{flex:1,background:ok?"#15803D":"#B8860B"}} onClick={()=>{setOk(true);setTimeout(()=>setOk(false),2000);}}/>;} 
function EmergPrintBtn({pac,txt}){return <Btn v="red" ch="🖨 Imprimir" s={{fontSize:10}} onClick={()=>abrirDoc("Emergência",txt||"")}/>;} 
function AmareloBlocoReacoes({sins,pac}){const ss=sins||[];return <div style={{background:"#FFF7E6",border:"1px solid #B45309",borderRadius:10,padding:"8px 12px"}}>{ss.map(id=>{const o=ORIENTACOES[id];return o?<div key={id} style={{fontSize:11,padding:"3px 0"}}>• {o}</div>:null;})}</div>;}
function ConfiguracoesComp({pac,up,funcLogado}){return <div style={{padding:12}}><h2 style={{color:"#1B365D",fontSize:16,fontWeight:900,marginBottom:12}}>⚙️ Configurações</h2><p style={{fontSize:12,color:"#64748B"}}>Ajustes do sistema em desenvolvimento.</p></div>;}
function PrintModal({titulo,conteudo,onClose}){return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,paddingTop:20}}><div style={{background:"#fff",borderRadius:16,padding:20,width:"100%",maxWidth:660,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h2 style={{color:"#1B365D",margin:0,fontSize:15}}>{titulo}</h2><div style={{display:"flex",gap:7}}><Btn v="teal" ch="📋" s={{fontSize:11}} onClick={()=>navigator.clipboard?.writeText(conteudo)}/><Btn v="gold" ch="🖨" s={{fontSize:11}} onClick={()=>abrirDoc(titulo,conteudo)}/><Btn v="ghost" ch="✕" s={{fontSize:11}} onClick={onClose}/></div></div><hr style={{margin:"8px 0 12px",border:"none",borderTop:"2px solid #B8860B"}}/><div style={{background:"#F8FAFC",borderRadius:9,padding:"10px 12px",maxHeight:500,overflowY:"auto"}}><pre style={{whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",fontSize:11,lineHeight:1.7,color:"#374151",margin:0}}>{conteudo}</pre></div></div></div>;}
function MicCaptura({onTexto}){const [rec,setRec]=useState(false);const start=()=>{if(!("SpeechRecognition" in window||"webkitSpeechRecognition" in window))return;const R=new(window.SpeechRecognition||window.webkitSpeechRecognition)();R.lang="pt-BR";R.onresult=e=>{onTexto&&onTexto(e.results[0][0].transcript);};R.onerror=R.onend=()=>setRec(false);R.start();setRec(true);};return <button onClick={start} style={{background:rec?"#DC2626":"#F1F5F9",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:14,display:"grid",placeItems:"center"}}>{rec?"🔴":"🎤"}</button>;}
function TriagemQT({setPrint}){return <TriagemComp sins={[]} setSins={()=>{}} pac={{}} setPrint={setPrint}/>;}

function _getApiKey(){return window.__ANTHROPIC_KEY__||localStorage.getItem("anthropic_key")||"";}
function _apiUrl(){return (import.meta.env.VITE_API_URL||"http://127.0.0.1:3001").replace(/\/$/,"");}
async function gerarResumoProntuarioIA(pac){
  const prompt=`Você é assistente de organização clínica oncológica do Dr. Silas Negrão, Hospital do Bem, Patos-PB.
Organize os dados abaixo em resumo estruturado para evolução médica editável.
Não invente informações. Não decida conduta. Deixe CONDUTA em branco para o médico preencher.

Organize em:
IDENTIFICAÇÃO
DADOS CLÍNICOS
DADOS ONCOLÓGICOS
EXAMES / LABORATÓRIO
PENDÊNCIAS
SUGESTÕES CLAUDE
CONDUTA: [em branco]

Nome: ${pac.nome||"—"} | Nasc: ${pac.nasc||"—"} | Cidade: ${pac.cidade||"—"}
CPF: ${pac.cpf||"—"} | CNS: ${pac.cns||"—"} | Mãe: ${pac.mae||"—"}
Diagnóstico: ${pac.diag||"—"} | CID: ${pac.cid||"—"} | TNM: ${pac.tnm||"—"} | Estádio: ${pac.estadio||"—"}
ECOG: ${pac.ecog||"—"} | Peso: ${pac.peso||"—"} kg | Altura: ${pac.altura||"—"} cm | SC: ${pac.sc||"—"} m²
Biomarcadores: ${pac.bio||"—"} | Tratamento: ${pac.trat||"—"} | Linha: ${pac.linha||"—"} | Intenção: ${pac.intencao||"—"}
Queixa: ${pac.queixa||"—"}
Antecedentes: ${pac.antec||"—"}
Medicações: ${pac.meds||"—"}
Alergias: ${pac.alerg||"—"}
Histórico familiar: ${pac.anam_hist_fam||"—"}
Cirurgias: ${pac.anam_cirurgia||"—"}`;
  return await chamarClaude(prompt,1400);
}

async function chamarClaude(prompt,maxTokens=1200){
  let backendMsg="";
  try{
    const r=await fetch(_apiUrl()+"/api/claude/resumo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,maxTokens})});
    const d=await r.json().catch(()=>({}));
    if(r.ok&&d.ok)return d.text||"";
    backendMsg=d.message||("HTTP "+r.status);
  }catch(e){
    backendMsg="Backend indisponível: "+e.message;
  }

  const apiKey=_getApiKey();
  if(!apiKey){
    return "⚠ Claude não configurado. Defina ANTHROPIC_API_KEY no arquivo server/.env e reinicie o backend. Detalhe: "+backendMsg;
  }

  try{
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-5",max_tokens:maxTokens,messages:[{role:"user",content:prompt}]})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)return "Erro Claude: "+(d.error?.message||d.message||("HTTP "+r.status));
    return d.content?.[0]?.text||"";
  }catch(e){return "Erro de conexão Claude: "+e.message;}
}
async function chamarGPT(prompt,apiKey,maxTokens=600){
  try{const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},body:JSON.stringify({model:"gpt-4o",messages:[{role:"user",content:prompt}],max_tokens:maxTokens})});const d=await r.json();return d.choices?.[0]?.message?.content||"Sem resposta";}
  catch(e){return "Erro GPT: "+e.message;}
}
async function chamarGemini(prompt,apiKey,maxTokens=600){
  try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:maxTokens}})});const d=await r.json();return d.candidates?.[0]?.content?.parts?.[0]?.text||"Sem resposta";}
  catch(e){return "Erro Gemini: "+e.message;}
}
async function chamarGrok(prompt,apiKey,maxTokens=600){
  try{const r=await fetch("https://api.x.ai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},body:JSON.stringify({model:"grok-3",messages:[{role:"user",content:prompt}],max_tokens:maxTokens})});const d=await r.json();return d.choices?.[0]?.message?.content||"Sem resposta";}
  catch(e){return "Erro Grok: "+e.message;}
}
async function IA_resumirDados(dadosRecepcao,dadosPaciente){
  const prompt=`Você é um oncologista assistente. Com base nos dados abaixo enviados pela recepção e pelo paciente, gere um resumo estruturado para o prontuário oncológico. Organize em seções: IDENTIFICAÇÃO | QUEIXA PRINCIPAL | ANTECEDENTES | MEDICAÇÕES | ALERGIAS | HISTÓRIA FAMILIAR | OBSERVAÇÕES CLÍNICAS. Seja objetivo e clinicamente relevante. Não invente informações.\n\nDADOS RECEBIDOS:\n${JSON.stringify({...dadosRecepcao,...dadosPaciente},null,2)}\n\nMÉDICO RESPONSÁVEL: ${AUTOR} · ${AUTOR2} · ${HOSP}`;
  return await chamarClaude(prompt,800);
}
async function IA_resumirExame(textoOuDescricao,tipoExame,pac){
  const prompt=`Você é um oncologista assistente. Analise este ${tipoExame} e forneça um resumo EXCLUSIVAMENTE com foco oncológico para o prontuário. Destaque: localização/tamanho tumoral, invasão local, linfonodos, metástases, resposta ao tratamento (se aplicável). Mencione achados não-oncológicos APENAS em 1 linha separada. Seja conciso e objetivo.\n\nPACIENTE: ${pac?.nome||"—"} | DIAGNÓSTICO: ${pac?.diag||"—"}\nCONTEÚDO DO EXAME: ${textoOuDescricao}`;
  return await chamarClaude(prompt,600);
}
async function IA_sugerirProtocolo(diag,estadio,bio,ecog){
  const prompt=`Oncologista clínico: liste os 3 protocolos de quimioterapia mais adequados para este paciente, com justificativa breve. Responda em JSON puro sem markdown:\n{"sugestoes":[{"protocolo":"nome","justificativa":"1 frase","linha":"1ª/2ª linha","evidencia":"estudo nome","prioridade":1},...]}.\n\nDiagnóstico: ${diag} | Estádio: ${estadio} | Bio: ${bio} | ECOG: ${ecog}`;
  try{const txt=await chamarClaude(prompt,500);const clean=txt.replace(/```json|```/g,"").trim();return JSON.parse(clean);}
  catch{return{sugestoes:[]};}
}

// ── FLUXO RECEPÇÃO IA ─────────────────────────────────────────────────────────
function FluxoRecepcaoIA({pac,up,onEnviadoAoMedico,tipo="recepcao"}){
  const [form,setForm]=useState({queixa:"",antecedentes:"",meds:"",alerg:"",hf:"",obs:"",nome:pac?.nome||"",nasc:pac?.nasc||"",cidade:pac?.cidade||"",cpf:pac?.cpf||"",tel:pac?.tel||"",mae:pac?.mae||"",peso:pac?.peso||"",altura:pac?.altura||""});
  const [laudos,setLaudos]=useState([]);
  const [loading,setLoading]=useState(false);
  const [resumo,setResumo]=useState("");
  const [step,setStep]=useState(1);
  const fileRef=useRef(null);const camRef=useRef(null);
  const upForm=(k,v)=>setForm(x=>({...x,[k]:v}));
  const gerarResumo=async()=>{setLoading(true);setStep(3);const r=await IA_resumirDados(form,{laudos:laudos.map(l=>l.nome)});setResumo(r);setLoading(false);};
  const enviarAoMedico=()=>{
    ["nome","nasc","cidade","cpf","tel","mae","peso","altura","antecedentes","meds","alerg"].forEach(k=>{if(form[k])up(k,form[k]);});
    if(resumo)up("obs_ia",resumo);
    up("laudos_pendentes",laudos);
    onEnviadoAoMedico&&onEnviadoAoMedico({form,resumo,laudos});
    alert("✅ Dados e laudos enviados ao médico!\nO prontuário foi atualizado automaticamente.");
    setStep(1);setLaudos([]);setResumo("");
  };
  const adicionarLaudo=(arquivo)=>setLaudos(x=>[...x,{id:Date.now(),nome:arquivo.name,tipo:arquivo.type,status:"enviado"}]);
  return(
    <div style={sc.card()}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["1","Dados Pessoais"],["2","Laudos / Exames"],["3","Revisão IA"]].map(([n,l])=>(
          <div key={n} style={{flex:1,textAlign:"center"}}>
            <div style={{width:28,height:28,borderRadius:"50%",margin:"0 auto 4px",display:"grid",placeItems:"center",fontSize:11,fontWeight:900,background:step>=Number(n)?T:"#E2E8F0",color:step>=Number(n)?"#fff":"#94A3B8"}}>{step>Number(n)?"✓":n}</div>
            <div style={{fontSize:9,fontWeight:700,color:step>=Number(n)?T:"#94A3B8",textTransform:"uppercase"}}>{l}</div>
          </div>
        ))}
      </div>
      {step===1&&<div>
        <H2 ch={tipo==="recepcao"?"📋 Cadastro — Recepção":"👤 Dados Pessoais"} s={{fontSize:15}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
          {[["Nome completo *","nome"],["Data de nascimento","nasc"],["CPF","cpf"],["Telefone","tel"],["Cidade","cidade"],["Nome da mãe","mae"],["Peso (kg)","peso"],["Altura (cm)","altura"]].map(([l,k])=>(
            <Fld key={k} l={l} val={form[k]} set={v=>upForm(k,v)}/>
          ))}
        </div>
        <Fld l="Queixa principal" val={form.queixa} set={v=>upForm("queixa",v)} ta rows={2} ph="Ex: Tenho um caroço no seio há 3 meses..."/>
        <Fld l="Antecedentes / Doenças" val={form.antecedentes} set={v=>upForm("antecedentes",v)} ta rows={2} ph="Ex: HAS, DM2, cirurgia prévia..."/>
        <Fld l="Medicamentos em uso" val={form.meds} set={v=>upForm("meds",v)} ta rows={2} ph="Ex: Losartana 50mg, Metformina 850mg..."/>
        <Fld l="Alergias" val={form.alerg} set={v=>upForm("alerg",v)} ph="Ex: Dipirona, Penicilina..."/>
        <Fld l="História familiar de câncer" val={form.hf} set={v=>upForm("hf",v)} ph="Ex: Mãe - câncer de mama..."/>
        <Btn v="teal" ch="Continuar: Enviar Laudos →" s={{width:"100%",padding:11,marginTop:8}} dis={!form.nome} onClick={()=>setStep(2)}/>
      </div>}
      {step===2&&<div>
        <H2 ch="📁 Envio de Laudos e Exames" s={{fontSize:15}}/>
        <p style={{fontSize:11,color:"#64748B",marginBottom:12}}>Envie tomografias, biópsias, hemogramas. A IA irá resumir com foco oncológico.</p>
        <input ref={fileRef} type="file" accept=".pdf,image/*,.doc,.docx" multiple style={{display:"none"}} onChange={e=>Array.from(e.target.files||[]).forEach(adicionarLaudo)}/>
        <input ref={camRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>e.target.files[0]&&adicionarLaudo(e.target.files[0])}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div onClick={()=>camRef.current?.click()} style={{border:"2px dashed "+T,borderRadius:12,padding:"18px 8px",textAlign:"center",cursor:"pointer",background:"#F0F9FF"}}>
            <div style={{fontSize:26,marginBottom:4}}>📷</div><strong style={{color:T,fontSize:12}}>Câmera</strong>
            <div style={{color:"#64748B",fontSize:10,marginTop:2}}>Fotografar laudo físico</div>
          </div>
          <div onClick={()=>fileRef.current?.click()} style={{border:"2px dashed "+G,borderRadius:12,padding:"18px 8px",textAlign:"center",cursor:"pointer",background:"#FFFBEB"}}>
            <div style={{fontSize:26,marginBottom:4}}>📁</div><strong style={{color:G,fontSize:12}}>Upload</strong>
            <div style={{color:"#64748B",fontSize:10,marginTop:2}}>PDF · Imagem · Word</div>
          </div>
        </div>
        {laudos.length>0&&<div style={{marginBottom:12}}>
          <strong style={{fontSize:11,color:N,display:"block",marginBottom:6}}>📎 {laudos.length} arquivo{laudos.length>1?"s":""} selecionado{laudos.length>1?"s":""}:</strong>
          {laudos.map((l,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"4px 8px",borderRadius:7,background:"#EAF7EE",marginBottom:4}}>
              <span style={{fontSize:14}}>{l.tipo?.includes("image")?"🖼️":"📄"}</span>
              <span style={{flex:1,fontSize:11,fontWeight:700,color:N}}>{l.nome}</span>
              <button onClick={()=>setLaudos(x=>x.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:12}}>✕</button>
            </div>
          ))}
        </div>}
        <Fld l="Descrever laudos adicionais (opcional)" val={form.obs} set={v=>upForm("obs",v)} ta rows={3} ph="Ex: TC abdome de 10/05/2026 mostra nódulo hepático de 2cm..."/>
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <Btn v="ghost" ch="← Voltar" onClick={()=>setStep(1)}/>
          <Btn v="gold" ch="🤖 Gerar Resumo com IA →" s={{flex:1,padding:11}} onClick={gerarResumo}/>
        </div>
      </div>}
      {step===3&&<div>
        <H2 ch="🤖 Resumo Gerado pela IA" s={{fontSize:15}}/>
        {loading?(
          <div style={{textAlign:"center",padding:28,background:"#EFF9FF",borderRadius:12,border:"1px solid "+T}}>
            <div style={{fontSize:36,marginBottom:8}}>⏳</div>
            <p style={{color:T,fontWeight:700,fontSize:13}}>Claude está analisando os dados...</p>
          </div>
        ):(
          <>
            <div style={{background:"#EAF7EE",border:"1px solid "+VE+"44",borderRadius:10,padding:"8px 12px",marginBottom:8,fontSize:11,color:VE,fontWeight:700}}>
              ✅ Resumo pronto — médico poderá revisar e editar antes de salvar
            </div>
            <textarea value={resumo} onChange={e=>setResumo(e.target.value)} rows={12} style={{...sc.inp,resize:"vertical",fontFamily:"Georgia,serif",lineHeight:1.7,fontSize:11,marginBottom:8}}/>
            {laudos.length>0&&<div style={{background:"#FFFBEB",borderRadius:9,padding:"8px 12px",marginTop:0,marginBottom:8,fontSize:11,color:AM}}>
              📎 {laudos.length} laudo{laudos.length>1?"s":""} em fila para análise pelo médico
            </div>}
            <div style={{display:"flex",gap:8}}>
              <Btn v="ghost" ch="← Editar dados" onClick={()=>setStep(2)}/>
              <Btn v="teal" ch="🔄 Regerar IA" s={{fontSize:11}} onClick={gerarResumo}/>
              <Btn v="gold" ch="✅ Enviar ao Médico" s={{flex:1,padding:11,fontWeight:900}} onClick={enviarAoMedico}/>
            </div>
          </>
        )}
      </div>}
    </div>
  );
}

// ── ABA EXAMES LABORATORIAIS ──────────────────────────────────────────────────
function AbaExamesLaboratoriaisOld({pac,up}){
  const [ciclos,setCiclos]=useState(pac?.exames_lab||[]);
  const [form,setForm]=useState({data:TODAY(),ciclo:"",valores:{}});
  const [expandido,setExpandido]=useState(false);
  const upV=(k,v)=>setForm(x=>({...x,valores:{...x.valores,[k]:v}}));
  const salvarCiclo=()=>{
    if(!form.ciclo&&Object.keys(form.valores).filter(k=>form.valores[k]).length===0)return;
    const nc={...form,id:Date.now()};const novos=[nc,...ciclos];
    setCiclos(novos);up("exames_lab",novos);
    setForm({data:TODAY(),ciclo:"",valores:{}});
  };
  const corValor=(sigla,val)=>{
    if(!val||isNaN(Number(val)))return"#374151";const n=Number(val);
    const alertas={Neutro:[1500,500],PLT:[150000,50000],Hgb:[12,8],Creat:[1.2,2.0]};
    if(alertas[sigla]){if(n<alertas[sigla][1])return VM;if(n<alertas[sigla][0])return AM;}
    return VE;
  };
  const PRESETS={Neutro:["4200","2800","1500","900","400"],PLT:["220000","150000","100000","70000","30000"],Hgb:["13.0","11.5","10.0","8.0","6.5"],Creat:["0.9","1.1","1.4","1.8","2.5"]};
  const ultimo=ciclos[0]?.valores||{};
  const neutro=Number(ultimo.Neutro||0);const hgb=Number(ultimo.Hgb||0);const plt=Number(ultimo.PLT||0);
  const apto=(neutro>=1500||!neutro)&&(hgb>=8||!hgb)&&(plt>=100000||!plt);
  const criterios=[
    {l:"Neutrófilos",v:neutro,meta:1500,ok:neutro>=1500,fmt:neutro?neutro.toLocaleString("pt-BR")+" /mm³":"—",unid:"/mm³"},
    {l:"Hemoglobina",v:hgb,meta:8,ok:hgb>=8,fmt:hgb?hgb+" g/dL":"—",unid:"g/dL"},
    {l:"Plaquetas",v:plt,meta:100000,ok:plt>=100000,fmt:plt?plt.toLocaleString("pt-BR")+" /mm³":"—",unid:"/mm³"},
  ];
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <H2 ch="🧪 Exames Laboratoriais" s={{margin:0,fontSize:15}}/>
    </div>
    <div style={{...sc_.card({background:apto?"#EAF7EE":"#FFF5F5",border:`2px solid ${apto?VE:VM}`,padding:11,marginBottom:12})}}>
      <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:22}}>{apto?"✅":"⚠️"}</span>
        <div><div style={{fontWeight:900,color:apto?VE:VM,fontSize:13}}>{apto?"APTO PARA QT":"CRITÉRIOS NÃO ATINGIDOS"}</div>
        <div style={{fontSize:10,color:"#64748B"}}>Mínimos para início/continuidade da quimioterapia</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
        {criterios.map(c=><div key={c.l} style={{background:"#fff",borderRadius:9,padding:"7px 10px",border:`1px solid ${c.v?(c.ok?VE:VM):G}44`}}>
          <div style={{fontSize:9,fontWeight:800,color:"#64748B",textTransform:"uppercase",marginBottom:3}}>{c.l}</div>
          <div style={{fontWeight:900,color:c.v?(c.ok?VE:VM):G,fontSize:13}}>{c.fmt}</div>
          <div style={{fontSize:8,color:"#94A3B8",marginTop:2}}>Mín: ≥{c.meta.toLocaleString("pt-BR")} {c.unid}</div>
          {c.v>0&&<div style={{fontSize:8,fontWeight:900,color:c.ok?VE:VM,marginTop:2}}>{c.ok?"✓ OK":"✗ BAIXO"}</div>}
        </div>)}
      </div>
    </div>
    <div style={{...sc_.card({border:`1px solid ${T}44`,marginBottom:12})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <H3 ch="+ Inserir Resultado Laboratorial" s={{margin:0,fontSize:13,color:T}}/>
        <button onClick={()=>setExpandido(x=>!x)} style={{...sc_.btn("ghost",{fontSize:10,padding:"3px 9px",borderRadius:999})}}>{expandido?"▲ Menos campos":"▼ Mais exames"}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px",marginBottom:10}}>
        <Fld l="Data" val={form.data} set={v=>setForm(x=>({...x,data:v}))}/>
        <Fld l="Ciclo / referência" val={form.ciclo} set={v=>setForm(x=>({...x,ciclo:v}))} ph="C1D1, Pré-QT, Controle..."/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:10}}>
        {[{s:"Neutro",l:"Neutro /mm³",min:1500,dir:"ge"},{s:"PLT",l:"Plaquetas /mm³",min:100000,dir:"ge"},{s:"Hgb",l:"Hgb g/dL",min:8,dir:"ge"},{s:"Creat",l:"Creat mg/dL",min:1.2,dir:"le"}].map(({s,l,min,dir})=>{
          const v=Number((form.valores[s]||"").replace(",","."));const ok=!v||(dir==="ge"?v>=min:v<=min);
          return <div key={s} style={{background:"#fff",borderRadius:8,padding:"6px 8px",border:`1.5px solid ${v?(ok?VE:VM):"#CBD5E1"}`}}>
            <div style={{fontSize:9,fontWeight:800,color:"#64748B",marginBottom:2}}>{l}</div>
            <input type="text" value={form.valores[s]||""} onChange={e=>upV(s,e.target.value)} style={{...sc_.inp,fontSize:12,padding:"4px 6px"}}/>
            {v>0&&<div style={{fontSize:8,fontWeight:900,color:ok?VE:VM,marginTop:1}}>{ok?"✓ OK":"✗ BAIXO"}</div>}
            <div style={{display:"flex",gap:2,marginTop:3,flexWrap:"wrap"}}>
              {(PRESETS[s]||[]).slice(0,3).map(p=><button key={p} onClick={()=>upV(s,p)} style={{fontSize:8,padding:"1px 4px",border:"1px solid #E2E8F0",borderRadius:3,cursor:"pointer",background:form.valores[s]===p?"#EFF9FF":"#F8FAFC",fontFamily:"inherit",color:"#374151"}}>{Number(p).toLocaleString("pt-BR")}</button>)}
            </div>
          </div>;
        })}
      </div>
      {expandido&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
        {EXAMES_LAB_TEMPLATE.filter(e=>!["Neutro","PLT","Hgb","Creat"].includes(e.sigla)).map(e=>(
          <div key={e.sigla} style={{background:"#fff",borderRadius:7,padding:"5px 7px",border:"1px solid #E2E8F0"}}>
            <label style={{fontSize:8,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:2}}>{e.sigla} <span style={{color:"#94A3B8",fontWeight:400}}>({e.unidade})</span></label>
            <input type="text" value={form.valores[e.sigla]||""} onChange={ev=>upV(e.sigla,ev.target.value)} placeholder={e.ref} style={{...sc_.inp,fontSize:11,padding:"3px 6px"}}/>
          </div>
        ))}
      </div>}
      <Btn v="gold" ch="💾 Salvar Resultado" s={{width:"100%",padding:9,fontSize:12}} onClick={salvarCiclo}/>
    </div>
    {ciclos.length===0?(
      <div style={{textAlign:"center",padding:20,color:"#94A3B8"}}><div style={{fontSize:24,marginBottom:5}}>🧪</div><p style={{fontSize:12}}>Nenhum resultado inserido ainda.</p></div>
    ):(
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:500}}>
          <thead><tr style={{background:N}}>
            <th style={{color:G,padding:"6px 8px",textAlign:"left",fontSize:10,fontWeight:900}}>Data</th>
            <th style={{color:G,padding:"6px 8px",textAlign:"left",fontSize:10,fontWeight:900}}>Ciclo</th>
            {Object.keys(ciclos[0]?.valores||{}).slice(0,8).map(k=>(
              <th key={k} style={{color:"#fff",padding:"6px 8px",textAlign:"center",fontSize:10,fontWeight:700}}>{k}</th>
            ))}
          </tr></thead>
          <tbody>
            {ciclos.map((c,i)=>(
              <tr key={c.id} style={{background:i%2?"#F8FAFC":"#fff",borderBottom:"1px solid #E2E8F0"}}>
                <td style={{padding:"6px 8px",fontWeight:700,color:N,fontSize:11}}>{c.data}</td>
                <td style={{padding:"6px 8px",color:T,fontSize:10}}>{c.ciclo}</td>
                {Object.entries(c.valores||{}).slice(0,8).map(([k,v])=>(
                  <td key={k} style={{padding:"6px 8px",textAlign:"center",fontWeight:700,color:corValor(k,v),fontSize:11}}>{v||"—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>;
}

// ── ABA EXAMES DE IMAGEM ──────────────────────────────────────────────────────
function AbaExamesImagem({pac,up}){
  const [exames,setExames]=useState(pac?.exames_imagem||[]);
  const [modo,setModo]=useState("lista");
  const [form,setForm]=useState({data:TODAY(),tipo:"",local:"",descricao:"",resumo_ia:""});
  const [loadingIA,setLoadingIA]=useState(false);
  const upF=(k,v)=>setForm(x=>({...x,[k]:v}));
  const gerarResumoIA=async()=>{
    if(!form.descricao)return;setLoadingIA(true);
    const r=await IA_resumirExame(form.descricao,form.tipo||"exame de imagem",pac);
    upF("resumo_ia",r);setLoadingIA(false);
  };
  const salvar=()=>{
    const novo={...form,id:Date.now()};const novos=[novo,...exames];
    setExames(novos);up("exames_imagem",novos);
    setForm({data:TODAY(),tipo:"",local:"",descricao:"",resumo_ia:""});setModo("lista");
  };
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <H2 ch="🖼️ Exames de Imagem" s={{margin:0,fontSize:15}}/>
      <Btn v="teal" ch={modo==="lista"?"+ Novo Exame":"✕ Cancelar"} s={{fontSize:11}} onClick={()=>setModo(modo==="lista"?"novo":"lista")}/>
    </div>
    {modo==="novo"&&<div style={{...sc.card({background:"#EFF9FF",border:"1px solid "+T+"44"}),marginBottom:14}}>
      <H2 ch="Inserir Exame de Imagem" s={{fontSize:13}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
        <Fld l="Data do Exame" val={form.data} set={v=>upF("data",v)}/>
        <div style={{marginBottom:8}}>
          <label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Tipo de Exame</label>
          <select value={form.tipo} onChange={e=>upF("tipo",e.target.value)} style={{...sc.inp,fontSize:12}}>
            <option value="">Selecionar...</option>{TIPOS_IMAGEM.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <Fld l="Local / Topografia avaliada" val={form.local} set={v=>upF("local",v)} ph="Ex: Abdome total com pelve · Tórax · Crânio + coluna..."/>
      <Fld l="Texto completo do laudo (cole aqui para análise IA)" val={form.descricao} set={v=>upF("descricao",v)} ta rows={5} ph="Cole o texto do laudo aqui..."/>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <Btn v="navy" ch={loadingIA?"⏳ Analisando...":"🤖 Resumir com IA (foco oncológico)"} s={{flex:1,fontSize:11}} dis={!form.descricao||loadingIA} onClick={gerarResumoIA}/>
      </div>
      {form.resumo_ia&&<div style={{background:"#EAF7EE",border:"1px solid "+VE+"44",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
        <div style={{color:VE,fontWeight:800,fontSize:11,marginBottom:5}}>🤖 Resumo IA — Foco Oncológico:</div>
        <textarea value={form.resumo_ia} onChange={e=>upF("resumo_ia",e.target.value)} rows={4} style={{...sc.inp,resize:"vertical",fontSize:11,fontFamily:"Georgia,serif",lineHeight:1.6}}/>
      </div>}
      <Btn v="gold" ch="💾 Salvar Exame" s={{width:"100%"}} dis={!form.tipo} onClick={salvar}/>
    </div>}
    {exames.length===0?(
      <div style={{textAlign:"center",padding:24,color:"#94A3B8"}}><div style={{fontSize:28,marginBottom:6}}>🖼️</div><p style={{fontSize:12}}>Nenhum exame de imagem inserido.</p></div>
    ):(
      <div style={{display:"grid",gap:10}}>
        {exames.map((ex,i)=>(
          <div key={ex.id} style={sc.card({border:"1px solid "+T+"33"})}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <strong style={{color:N,fontSize:13}}>{ex.tipo}</strong>
                {ex.local&&<span style={{color:"#64748B",fontSize:11}}> · {ex.local}</span>}
                <div style={{color:"#94A3B8",fontSize:10,marginTop:2}}>📅 {ex.data}</div>
              </div>
              <button onClick={()=>{const novos=exames.filter((_,j)=>j!==i);setExames(novos);up("exames_imagem",novos);}} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:14}}>✕</button>
            </div>
            {ex.resumo_ia?(
              <div style={{background:"#EAF7EE",borderRadius:8,padding:"8px 10px"}}>
                <div style={{color:VE,fontSize:9,fontWeight:900,textTransform:"uppercase",marginBottom:3}}>🤖 Resumo IA</div>
                <p style={{fontSize:11,color:"#374151",lineHeight:1.6,margin:0}}>{ex.resumo_ia}</p>
              </div>
            ):ex.descricao?(
              <p style={{fontSize:11,color:"#64748B",lineHeight:1.5,margin:0}}>{ex.descricao.slice(0,200)}...</p>
            ):null}
          </div>
        ))}
      </div>
    )}
  </div>);
}

function FooterOld(){
  return <div style={{background:N,borderTop:`3px solid ${G}`,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,marginTop:"auto"}}>
    <div style={{display:"flex",alignItems:"center",gap:9}}>
      <span style={{color:G,fontSize:18,lineHeight:1}}>✦</span>
      <div>
        <div style={{color:G,fontWeight:900,fontSize:13,letterSpacing:.5}}>Dr. Silas Negrão Serra Jr.</div>
        <div style={{color:"rgba(255,255,255,.45)",fontSize:9}}>CRM-PB 17341 · RQE Oncologia Clínica 9099 · RQE Clínica Médica 9098</div>
      </div>
    </div>
    <span style={{color:"rgba(255,255,255,.25)",fontSize:9,textAlign:"right"}}>Oncologia Integrada<br/>{HOSP}</span>
  </div>;
}


// ─── UPLOAD COM IA (filtro IA para todos os documentos) ──────────────────────
function UploadComIA({pac,up,addMsg,destino="prontuario",origem="Médico",onConcluido}){
  const [arqs,setArqs]=useState([]);
  const [loading,setLoading]=useState(false);
  const [resultado,setResultado]=useState(null);
  const [txtColar,setTxtColar]=useState("");
  const [abaUp,setAbaUp]=useState("upload");
  const [caminhoLocal,setCaminhoLocal]=useState("");
  const [drag,setDrag]=useState(false);
  const refA=useRef(null);const refC=useRef(null);
  const addArquivos=files=>setArqs(x=>{
    const lista=Array.from(files||[]).map(f=>({ico:f.type?.includes("image")?"📸":"📄",n:f.name,tipo:f.type?.includes("image")?"Imagem":"Documento",obj:f}));
    const seen=new Set(x.map(a=>a.n+"_"+(a.obj?.size||0)));
    return [...x,...lista.filter(a=>!seen.has(a.n+"_"+(a.obj?.size||0)))];
  });
  const onArq=e=>{addArquivos(e.target.files);e.target.value="";};
  const onCam=e=>{addArquivos(e.target.files);e.target.value="";};
  const onDrop=e=>{e.preventDefault();setDrag(false);addArquivos(e.dataTransfer.files);setAbaUp("upload");};
  const arquivoBase64=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||"").split(",")[1]||"");r.onerror=reject;r.readAsDataURL(file);});
  const tipoPorNome=nome=>{const n=String(nome||"").toLowerCase();if(n.includes("biop"))return "biópsia";if(n.includes("ihq")||n.includes("imuno"))return "imunohistoquímica";if(n.includes("tomo")||n.includes("tc"))return "tomografia";if(n.includes("resson")||/\\brm\\b/.test(n))return "ressonância";if(n.includes("mamog"))return "mamografia";if(n.includes("pet"))return "PET-CT";if(n.includes("lab")||n.includes("hemo"))return "laboratório";return "exame";};
  const nomeArquivoLocal=caminho=>String(caminho||"").replace(/^file:\/\/\/?/i,"").split(/[\\/]/).filter(Boolean).pop()||"arquivo local";
  const registrarResultado=(res,meta={})=>{
    setResultado(res);
    if(up&&destino==="lab")up("exames_lab_texto",res);
    else if(up&&destino==="imagem")up("exames_imagem_texto",res);
    else if(up)up("docs_ia_resumo",(pac?.docs_ia_resumo||"")+"\n\n---\n"+res);
    onConcluido&&onConcluido(res,meta);
    if(addMsg)addMsg(origem,"Médico",`📎 Documento enviado via IA — ${pac?.nome||"paciente"} · Destino: ${destino}`,"laudo");
  };
  const processarCaminhoLocal=async()=>{
    if(!caminhoLocal.trim()){alert("Cole o caminho local do PDF/imagem.");return;}
    setLoading(true);
    try{
      const nome=nomeArquivoLocal(caminhoLocal);
      const r=await fetch(_apiUrl()+"/api/dossie/ler-local",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paciente_id:Number(pac?.id||pac?.paciente_id)||null,paciente:pac||{},recepcao:{},caminho:caminhoLocal.trim(),tipo:tipoPorNome(nome),data:new Date().toISOString().slice(0,10)})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok)throw new Error(d.message||("HTTP "+r.status));
      registrarResultado(d.text||d.resumo||d.resumoLaudo||"",{arquivos:[{n:nome,tipo:"Caminho local",caminho:caminhoLocal}],texto:"",destino,origem,tipo:"Caminho local"});
    }catch(e){
      const msg="⚠ Falha ao ler caminho local: "+e.message;
      setResultado(msg);
    }finally{setLoading(false);}
  };
  const processar=async()=>{
    const texto=abaUp==="colar"?txtColar:arqs.map(a=>a.n).join("; ");
    if(!texto.trim()&&arqs.length===0){alert("Envie um arquivo, arraste um documento ou cole um texto.");return;}
    setLoading(true);
    const keys=JSON.parse(localStorage.getItem("ia_keys")||"{}");
    const filesPayload=[];
    for(const a of arqs){
      if(a.obj){
        const mimeType=a.obj.type||(/\.pdf$/i.test(a.n)?"application/pdf":"application/octet-stream");
        if(["application/pdf","image/jpeg","image/png","image/webp"].includes(mimeType)){
          filesPayload.push({name:a.n,mimeType,base64:await arquivoBase64(a.obj)});
        }
      }
    }
    const prompt=`Você é um assistente médico especializado em oncologia. Leia integralmente os PDFs/imagens anexados e/ou o texto abaixo. Gere um resumo estruturado para o prontuário oncológico. Destaque valores críticos, diagnósticos, datas, exame, conclusão e pendências. Não invente dados. Não defina conduta.

Paciente: ${pac?.nome||"—"} · Nascimento: ${pac?.nasc||"—"} · Diagnóstico: ${pac?.diag||"—"}

Arquivos anexados: ${arqs.map(a=>a.n).join(", ")||"nenhum"}
Texto colado:
${abaUp==="colar"?txtColar:""}`;
    let res="";
    try{
      const r=await fetch(_apiUrl()+"/api/claude/resumo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,maxTokens:1200,files:filesPayload})});
      const d=await r.json().catch(()=>({}));
      if(r.ok&&d.ok)res=d.text||"";
      else res="⚠ "+(d.message||("Falha ao ler PDF no backend: HTTP "+r.status));
    }catch(e){res="⚠ Backend Claude indisponível: "+e.message;}
    if((!res||String(res).startsWith("⚠"))&&keys.openai&&!filesPayload.length){try{res=await chamarGPT(prompt,keys.openai,600);}catch(e){}}
    if(!res)res=`📋 RESUMO IA — ${new Date().toLocaleDateString("pt-BR")}

Documento(s): ${arqs.map(a=>a.n).join(", ")||txtColar.substring(0,120)}

Paciente: ${pac?.nome||"—"}

Análise: Documento recebido e registrado no prontuário.
Destino: ${destino}
Origem: ${origem}

[Sem chave Claude configurada — o PDF foi anexado, mas seu conteúdo ainda não foi lido]`;
    registrarResultado(res,{arquivos:arqs,texto:txtColar,destino,origem,tipo:abaUp==="colar"?"Texto colado":"Upload"});
    setLoading(false);
  };
  return <div style={{display:"grid",gap:10}}>
    <div style={{display:"flex",gap:6,background:N,borderRadius:10,padding:4,marginBottom:2}}>
      {[["upload","📎 Upload / Arrastar"],["colar","📋 Colar Texto"]].map(([id,l])=><button key={id} onClick={()=>setAbaUp(id)} style={{flex:1,border:"none",cursor:"pointer",borderRadius:7,padding:"7px",fontSize:11,fontWeight:800,fontFamily:"inherit",background:abaUp===id?G:N,color:abaUp===id?"#fff":"rgba(255,255,255,.5)"}}>{l}</button>)}
    </div>
    {abaUp==="upload"&&<>
      <input ref={refC} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={onCam}/>
      <input ref={refA} type="file" accept=".pdf,.doc,.docx,image/*" multiple style={{display:"none"}} onChange={onArq}/>
      <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={onDrop} style={{border:"2px dashed "+(drag?VE:G),borderRadius:14,padding:10,background:drag?"#EAF7EE":"#FFFBEB"}}>
        <div style={{fontSize:12,color:N,fontWeight:900,textAlign:"center",marginBottom:8}}>Arraste PDF/imagem aqui ou escolha uma origem</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div onClick={()=>refC.current?.click()} style={{border:`1px solid ${T}55`,borderRadius:12,padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"#F0F9FF"}}><div style={{fontSize:24,marginBottom:3}}>📷</div><strong style={{color:T,fontSize:11}}>Câmera</strong></div>
          <div onClick={()=>refA.current?.click()} style={{border:`1px solid ${G}55`,borderRadius:12,padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"#fff"}}><div style={{fontSize:24,marginBottom:3}}>📁</div><strong style={{color:G,fontSize:11}}>Arquivo</strong></div>
        </div>
      </div>
      {arqs.length>0&&<div>{arqs.map((a,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",border:"1px solid #CBD5E1",borderRadius:9,padding:"5px 9px",marginBottom:4}}><span>{a.ico}</span><span style={{flex:1,fontSize:11,fontWeight:700}}>{a.n}</span><button style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8"}} onClick={()=>setArqs(x=>x.filter((_,j)=>j!==i))}>✕</button></div>)}</div>}
      <div style={{marginTop:10,borderTop:"1px solid #CBD5E1",paddingTop:10}}>
        <label style={{fontSize:11,fontWeight:900,color:N,display:"block",marginBottom:5}}>📂 Ou cole o caminho do PDF aberto no computador</label>
        <div style={{display:"flex",gap:6}}>
          <input value={caminhoLocal} onChange={e=>setCaminhoLocal(e.target.value)} placeholder={"C:\\Users\\silas\\OneDrive\\Área de Trabalho\\prontuarios\\PACIENTE.pdf"} style={{...sc_.inp,flex:1,fontSize:11,fontFamily:"Consolas, Courier New, monospace"}}/>
          <Btn v="teal" ch={loading?"Lendo...":"Analisar"} dis={loading||!caminhoLocal.trim()} s={{whiteSpace:"nowrap"}} onClick={processarCaminhoLocal}/>
        </div>
        <p style={{fontSize:10,color:"#64748B",margin:"5px 0 0"}}>Cole também endereços file:///C:/... O backend só lê Desktop/OneDrive, Downloads ou Documentos.</p>
      </div>
    </>}
    {abaUp==="colar"&&<textarea value={txtColar} onChange={e=>setTxtColar(e.target.value)} rows={6} placeholder="Cole aqui o laudo, resultado de exame ou qualquer texto clínico..." style={{...sc_.inp,resize:"vertical",fontSize:13,fontFamily:"Segoe UI, Arial, sans-serif"}}/>}
    {resultado&&<div style={{background:"#EAF7EE",border:`1px solid ${VE}`,borderRadius:10,padding:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><strong style={{color:VE,fontSize:12}}>Resumo IA pronto</strong><Btn v="ghost" ch="Copiar" s={{fontSize:10}} onClick={()=>copiarTexto(resultado)}/></div>
      <Cbox text={resultado} maxH={220}/>
    </div>}
    <Btn v="gold" ch={loading?"Processando com IA...":"Enviar para IA e inserir no dossiê"} dis={loading} s={{width:"100%",padding:11}} onClick={processar}/>
  </div>;
}

function AntiGlosaComp({pac,up}){
  const [docs,setDocs]=useState([]);
  const campos=[
    {k:"nome",l:"Nome Completo"},
    {k:"cpf",l:"CPF"},
    {k:"cns",l:"CNS (Cartão SUS)"},
    {k:"diag",l:"Diagnóstico"},
    {k:"cid",l:"CID-10"},
    {k:"trat",l:"Protocolo de Tratamento"},
    {k:"estadio",l:"Estadiamento"},
    {k:"ecog",l:"ECOG"},
    {k:"linha",l:"Linha de Tratamento"},
    {k:"intencao",l:"Intenção Terapêutica"},
  ];
  const preenchidos=campos.filter(c=>pac?.[c.k]&&String(pac[c.k]).trim()!=="");
  const pct=Math.round((preenchidos.length/campos.length)*70+(docs.length>0?30:0));
  const cor=pct>=85?VE:pct>=60?AM:VM;
  const nivel=pct>=85?"BAIXO RISCO DE GLOSA":pct>=60?"RISCO MODERADO":"ALTO RISCO DE GLOSA";
  return <div style={{display:"grid",gap:12}}>
    <H2 ch="🛡 Mecanismo Anti-Glosa"/>
    <div style={{...sc_.card({background:pct>=85?"#EAF7EE":pct>=60?"#FFF7E6":"#FFF0F0",border:`2px solid ${cor}`})}}>
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:cor,display:"grid",placeItems:"center",color:"#fff",fontSize:20,fontWeight:900,flexShrink:0}}>{pct}%</div>
        <div><div style={{fontWeight:900,color:cor,fontSize:15}}>{nivel}</div><div style={{fontSize:11,color:"#64748B",marginTop:2}}>Score baseado em campos e documentos obrigatórios APAC</div></div>
      </div>
      <div style={{background:"#fff",borderRadius:10,overflow:"hidden",height:8,marginBottom:10}}>
        <div style={{width:pct+"%",height:"100%",background:cor,transition:"width .5s"}}/>
      </div>
    </div>
    <div style={sc_.card()}>
      <H3 ch="📋 Campos Obrigatórios"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {campos.map(c=>{const ok=pac?.[c.k]&&String(pac[c.k]).trim()!=="";return <div key={c.k} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 9px",borderRadius:9,background:ok?"#EAF7EE":"#FFF5F5",border:`1px solid ${ok?VE:VM}33`}}>
          <span style={{fontSize:14}}>{ok?"✅":"❌"}</span>
          <span style={{fontSize:11,color:ok?VE:VM,fontWeight:700}}>{c.l}</span>
          {ok&&<span style={{fontSize:9,color:"#64748B",marginLeft:"auto",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{String(pac[c.k]).substring(0,20)}</span>}
        </div>;})}
      </div>
    </div>
    <div style={sc_.card()}>
      <H3 ch="📎 Documentos Anexados"/>
      <div style={{display:"grid",gap:5,marginBottom:10}}>
        {DOCS_OBR.slice(0,6).map(d=>{const ok=docs.includes(d.id);return <label key={d.id} style={{display:"flex",gap:9,alignItems:"center",padding:"6px 10px",borderRadius:9,cursor:"pointer",background:ok?"#EAF7EE":"#F8FAFC",border:`1px solid ${ok?VE:"#CBD5E1"}`}}>
          <input type="checkbox" checked={ok} onChange={()=>setDocs(x=>ok?x.filter(i=>i!==d.id):[...x,d.id])} style={{accentColor:VE}}/>
          <span style={{fontSize:11,color:ok?VE:N,fontWeight:ok?700:400}}>{d.n}</span>
          <span style={{marginLeft:"auto",fontSize:9,color:"#94A3B8",flexShrink:0}}>peso {d.peso}</span>
        </label>;})}
      </div>
      {pct<85&&<div style={{background:"#FFF7E6",borderRadius:9,padding:"9px 12px",border:`1px solid ${AM}44`}}>
        <strong style={{color:AM,fontSize:11,display:"block",marginBottom:5}}>⚠️ Pontos críticos para evitar glosa:</strong>
        {campos.filter(c=>!(pac?.[c.k]&&String(pac[c.k]).trim()!=="")).slice(0,4).map(c=><div key={c.k} style={{fontSize:10,color:"#92400E",marginBottom:2}}>• Preencher: {c.l}</div>)}
        {docs.length===0&&<div style={{fontSize:10,color:"#92400E",marginBottom:2}}>• Anexar: Anatomopatológico, Imagem, CID documentado</div>}
      </div>}
    </div>
  </div>;
}


function StatusDossieBar({dossie}){
  const meta=statusDossieMeta(dossie?.status);
  const docs=dossie?.documentos?.length||0;
  const apac=dossie?.apac||validarAPAC(dossie||{});
  return <div style={{display:"grid",gridTemplateColumns:"1.1fr .7fr .7fr .9fr",gap:8,marginBottom:12}}>
    <div style={sc_.card({padding:"10px 12px",borderLeft:"5px solid "+meta.cor})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>Status do dossiê</div><div style={{fontSize:13,color:meta.cor,fontWeight:900}}>{meta.label}</div></div>
    <div style={sc_.card({padding:"10px 12px"})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>Documentos</div><div style={{fontSize:18,color:N,fontWeight:900}}>{docs}</div></div>
    <div style={sc_.card({padding:"10px 12px"})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>APAC</div><div style={{fontSize:13,color:apac.riscoGlosa==="alto"?VM:apac.riscoGlosa==="moderado"?AM:VE,fontWeight:900}}>{apac.riscoGlosa==="baixo"?"Baixo risco":apac.riscoGlosa==="moderado"?"Risco moderado":"Alto risco"}</div></div>
    <div style={sc_.card({padding:"10px 12px",background:"#FFFBEB",borderColor:G+"55"})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>Criado por</div><div style={{fontSize:12,color:G,fontWeight:900}}>Dr. Silas Negrão Serra Jr.</div></div>
  </div>;
}

function AtendimentosStandbyBar({pacientes=[],ativo,onAbrir,onNovo}){
  const uniq=useMemo(()=>{
    const itens=[];
    (pacientes||[]).forEach(p=>{
      const nome=p?.nome||p?.pac||"";
      if(!nome)return;
      const key=p.pacID||p.cpf||nome;
      if(!itens.find(x=>(x.pacID||x.cpf||x.nome)===key))itens.push({...p,nome});
    });
    return itens;
  },[pacientes]);
  const primeiro=uniq[0]||null;
  const visiveis=useMemo(()=>uniq.slice(0,12),[uniq]);
  const handleAtender=useCallback((p=primeiro)=>{
    if(!p)return;
    onAbrir&&onAbrir(p);
  },[primeiro,onAbrir]);
  const handleNovo=useCallback(()=>{
    onNovo&&onNovo();
  },[onNovo]);
  return <div style={{background:"#F8FAFC",borderBottom:"1px solid #CBD5E1",padding:"7px 12px",display:"flex",gap:8,alignItems:"center",overflowX:"auto",flexShrink:0}}>
    <span style={{fontSize:10,color:G,fontWeight:900,textTransform:"uppercase",whiteSpace:"nowrap"}}>Standby / atendimentos</span>
    {uniq.length===0&&<span style={{fontSize:11,color:"#94A3B8",whiteSpace:"nowrap"}}>Aguardando check-in da recepção.</span>}
    {visiveis.map(p=>{const active=(ativo?.pacID&&p.pacID===ativo.pacID)||(!ativo?.pacID&&ativo?.nome&&p.nome===ativo.nome);return <button type="button" key={p.pacID||p.cpf||p.nome} onClick={()=>handleAtender(p)} style={{border:"1px solid "+(active?G:"#CBD5E1"),background:active?G:"#fff",color:active?"#fff":N,borderRadius:999,padding:"6px 10px",fontSize:11,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"Segoe UI, Arial, sans-serif"}}>
      {p.status==="aguardando"?"⏳ ":p.status==="em_consulta"?"🩺 ":""}{p.nome}{p.checkin?" · "+p.checkin:""}
    </button>;})}
    <button type="button" aria-label="Novo atendimento" onClick={handleNovo} style={{marginLeft:"auto",border:"1px solid "+G,background:"#FFFBEB",color:G,borderRadius:999,padding:"6px 10px",fontSize:11,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>+ Novo atendimento</button>
  </div>;
}
function RecepcaoDossiePanel({pac,dossie,setDossie,upFiles,addMsg,onEnviar}) {
  const [drive,setDrive]=useState("");
  const [desc,setDesc]=useState("");
  const vincular=()=>{
    const docs=[...(upFiles||[]).map(f=>({id:Date.now()+Math.random(),tipo:f.tp||"Upload",nome:f.n,origem:"recepcao",criadoEm:NOW()}))];
    if(drive.trim()||desc.trim())docs.push({id:Date.now()+99,tipo:"Google Drive",nome:drive||"Pasta Drive",link:drive,descricao:desc,origem:"recepcao_drive",criadoEm:NOW()});
    if(!docs.length){alert("Anexe arquivo, cole link do Drive ou descreva os documentos.");return;}
    setDossie&&setDossie(d=>({...d,paciente:{...(d?.paciente||{}),...pac},recepcao:{...(d?.recepcao||{}),conferido:true,conferidoEm:NOW(),observacoes:desc},documentos:[...docs,...(d?.documentos||[])],status:"documentos_anexados",updatedAt:NOW(),apac:validarAPAC({...d,paciente:{...(d?.paciente||{}),...pac},documentos:[...docs,...(d?.documentos||[])]})}));
    addMsg&&addMsg("Recepção","Médico","Dossiê atualizado: dados conferidos e documentos vinculados para "+(pac?.nome||"paciente")+".","laudo");
    alert("Documentos vinculados ao dossiê.");
  };
  return <div style={sc_.card({border:"2px solid "+G+"55"})}>
    <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:8}}>
      <H2 ch="Dossiê Oncológico — Recepção" s={{margin:0,fontSize:14}}/>
      <span style={{fontSize:10,fontWeight:900,color:statusDossieMeta(dossie?.status).cor}}>{statusDossieMeta(dossie?.status).label}</span>
    </div>
    <p style={{fontSize:12,color:"#64748B",margin:"0 0 10px"}}>A recepção confirma dados demográficos e agrega laudos. Campos clínicos ficam com paciente/médico.</p>
    <Fld l="Pasta ou link do Google Drive" val={drive} set={setDrive} ph="https://drive.google.com/... ou nome da pasta"/>
    <Fld l="Descrição dos documentos" val={desc} set={setDesc} ph="Ex: biópsia, IHQ, TC, laboratório..." ta rows={3}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
      <Btn v="navy" ch="Vincular documentos ao dossiê" s={{padding:11}} onClick={vincular}/>
      <Btn v="gold" ch="Enviar dossiê ao médico" s={{padding:11}} onClick={()=>{vincular();onEnviar&&onEnviar();}}/>
    </div>
  </div>;
}

function DocumentosPosEvolucao({dossie,setDossie,addMsg,onAbrirAPAC}){
  const [sel,setSel]=useState({sintomaticos:true,antiemeticos:true,analgesia:false,medicacao_ev:false,exames:true,dieta:false,alarme:true,termo:false,apac:true});
  const [docs,setDocs]=useState(dossie?.documentosGerados||[]);
  const opts=[
    ["sintomaticos","Receita sintomáticos"],["antiemeticos","Receita antieméticos"],["analgesia","Receita analgesia"],["medicacao_ev","Medicação EV"],["exames","Solicitação de exames"],["dieta","Orientações dietéticas"],["alarme","Sinais de alarme"],["termo","Termo de consentimento"],["apac","APAC"],
  ];
  const gerar=()=>{
    const novos=gerarDocumentosSelecionados(dossie,sel);
    setDocs(novos);
    const apac=validarAPAC(dossie);
    setDossie&&setDossie(d=>({...d,documentosGerados:novos,apac,status:sel.apac?"apac_validacao":"evolucao_salva",updatedAt:NOW()}));
    addMsg&&addMsg("Médico","Equipe","Evolução salva e documentos gerados para "+(dossie?.paciente?.nome||"paciente")+".","msg");
  };
  return <div style={sc_.card({border:"2px solid "+VE+"55"})}>
    <H2 ch="Gerar documentos após salvar" s={{fontSize:14}}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
      {opts.map(([k,l])=><label key={k} style={{display:"flex",gap:7,alignItems:"center",fontSize:11,fontWeight:800,color:N,background:sel[k]?"#EAF7EE":"#F8FAFC",border:"1px solid "+(sel[k]?VE:"#CBD5E1"),borderRadius:8,padding:"7px 9px",cursor:"pointer"}}><input type="checkbox" checked={!!sel[k]} onChange={()=>setSel(x=>({...x,[k]:!x[k]}))} style={{accentColor:VE}}/>{l}</label>)}
    </div>
    <div style={{display:"flex",gap:8}}>
      <Btn v="green" ch="Gerar selecionados" s={{flex:1,padding:11}} onClick={gerar}/>
      <Btn v="teal" ch="Imprimir todos separados" s={{flex:1,padding:11}} dis={!docs.length} onClick={()=>docs.forEach((doc,i)=>setTimeout(()=>abrirPremium(doc.titulo,doc.texto,"prontuario"),i*250))}/>
      <Btn v="gold" ch="Abrir APAC anti-glosa" s={{flex:1,padding:11}} onClick={()=>{setDossie&&setDossie(d=>({...d,apac:validarAPAC(d),status:"apac_validacao"}));onAbrirAPAC&&onAbrirAPAC();}}/>
    </div>
    {docs.length>0&&<div style={{display:"grid",gap:8,marginTop:12}}>{docs.map(doc=><div key={doc.id} style={{background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:10,padding:10}}><strong style={{fontSize:12,color:N}}>{doc.titulo}</strong><Cbox text={doc.texto} maxH={140}/><Btn v="ghost" ch="Imprimir" s={{fontSize:10,marginTop:6}} onClick={()=>abrirPremium(doc.titulo,doc.texto,"prontuario")}/></div>)}</div>}
  </div>;
}

function ProntuarioDossieUnico({pac,dossie,setDossie,up,addMsg,onSalvarEvolucao,onAbrirAPAC}){
  const editorRef=useRef(null);
  const [processando,setProcessando]=useState(false);
  const [salvo,setSalvo]=useState(!!dossie?.evolucao?.textoFinal);
  const dossieAtual=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
  const [pagina,setPagina]=useState(()=>montarPaginaProntuario(dossieAtual,pac).html);
  const [texto,setTexto]=useState(()=>montarPaginaProntuario(dossieAtual,pac).texto);

  function esc(v=""){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
  function valor(v){
    const t=String(v||"").trim();
    if(!t)return "";
    if(/^(—|-|nao informado|não informado|aguarda avaliação|aguarda avaliacao|sem dados)$/i.test(t))return "";
    return t;
  }
  function limpar(txt=""){
    return String(txt||"")
      .replace(/[•*_\`>#|]+/g,"")
      .replace(/[📋📄📎📥🧾🧬🧪🩺⚠️✅❌⏳💾📝☁️🤖]/g,"")
      .split("\n")
      .map(l=>l.replace(/^\s*[-–—]+\s*/,"").replace(/^\s*\d+[\.)]\s*/,"").replace(/\s+/g," ").trim())
      .filter(Boolean)
      .join("\n")
      .replace(/\n{3,}/g,"\n\n")
      .trim();
  }
  function curta(txt="",max=230){
    const t=limpar(txt).replace(/^(tipo de documento|achados principais|conclus[aã]o|impress[aã]o|resumo|exames?)\s*:?\s*/i,"");
    if(t.length<=max)return t;
    return t.slice(0,max).replace(/\s+\S*$/,"").trim()+".";
  }
  function dataDoc(doc={}){
    const raw=doc.data||doc.dataExame||doc.criadoEm||doc.createdAt||TODAY();
    return String(raw).split(",")[0].trim();
  }
  function nomeExame(doc={}){
    return curta(doc.tipo||doc.nome||doc.exame||"Exame",80);
  }
  function resumoExame(doc={}){
    return curta(doc.resumo||doc.conteudo||doc.texto||"",260);
  }
  function textoDoPacienteAtual(txt="",p=pac){
    const t=normalizaPacienteValor(txt);
    if(!t)return true;
    const nome=normalizaPacienteValor(p?.nome||p?.pac);
    if(!nome)return false;
    const partes=nome.split(" ").filter(x=>x.length>2);
    const primeiro=partes[0]||"";
    const ultimo=partes.length>1?partes[partes.length-1]:"";
    const citaAtual=t.includes(nome)||(primeiro&&ultimo&&t.includes(primeiro)&&t.includes(ultimo));
    if(citaAtual)return true;
    const pareceIdentificado=/\b(paciente|identificacao|identificação|nascimento|cpf|cns|idade|sexo)\b/.test(t);
    return !pareceIdentificado;
  }
  function docPacienteAtual(doc={}){
    return textoDoPacienteAtual([doc.nome,doc.tipo,doc.resumo,doc.conteudo,doc.texto].filter(Boolean).join(" "),pac);
  }
  function htmlParaTexto(html=""){
    const div=document.createElement("div");
    div.innerHTML=html;
    return limpar(div.innerText||div.textContent||"");
  }
  function linhasClaude(resumo=""){
    return limpar(resumo)
      .split("\n")
      .map(l=>l.trim())
      .filter(l=>l&&!/^conduta/i.test(l)&&!/^observa/i.test(l)&&!/^prontu[aá]rio/i.test(l)&&!/^para prontu[aá]rio/i.test(l)&&!/^data\s*:/i.test(l)&&!/^paciente\s*:/i.test(l)&&!/^identifica/i.test(l)&&!/^diagn[oó]stico$/i.test(l)&&!/^dados/i.test(l)&&!/^exames?$/i.test(l)&&!/^oncol[oó]gico$/i.test(l))
      .slice(0,6)
      .map(l=>curta(l,210));
  }
  function montarPaginaProntuario(d=dossieAtual,p=pac){
    const valido=mesmoPacienteDossie(d,p);
    const base=valido?d:criarDossieInicial(p);
    const px={...(base?.paciente||{}),...(p||{})};
    const docs=(base?.documentos||[]).filter(Boolean).filter(docPacienteAtual).slice(0,8);
    const onco=[
      valor(px.diag)&&"Diagnóstico: "+px.diag,
      valor(px.cid)&&"CID-10: "+px.cid,
      valor(px.estadio||px.tnm)&&"Estadiamento: "+[px.estadio,px.tnm].filter(Boolean).join(" · "),
      valor(px.bio)&&"Biomarcadores: "+px.bio,
      valor(px.ecog)&&"ECOG: "+px.ecog,
      valor(px.trat)&&"Tratamento/protocolo: "+px.trat,
    ].filter(Boolean);
    const clinico=[
      valor(px.queixa)&&"Sintomas atuais: "+px.queixa,
      valor(px.antec)&&"Antecedentes relevantes: "+px.antec,
      valor(px.meds)&&"Medicações: "+px.meds,
      valor(px.alerg)&&"Alergias: "+px.alerg,
    ].filter(Boolean).slice(0,4);
    const brutoClaude=[base?.resumoClaude].filter(x=>textoDoPacienteAtual(x,px)).join("\n");
    const resumoClaude=linhasClaude(brutoClaude).slice(0,4);
    const exames=docs.map(doc=>({
      data:dataDoc(doc),
      exame:nomeExame(doc),
      resumo:resumoExame(doc)||"Resumo aguardando análise."
    })).filter(x=>x.exame||x.resumo);
    const obs=[
      valor(px.peso)&&"Peso: "+px.peso+" kg",
      valor(px.altura)&&"Altura: "+px.altura+" cm",
      valor(px.linha)&&"Linha: "+px.linha,
      valor(px.intencao)&&"Intenção: "+px.intencao,
      ...(base?.apac?.pendencias||[]).slice(0,4).map(x=>"Pendência APAC: "+x),
    ].filter(Boolean);
    const secStyle="font-size:21px;font-weight:900;color:"+N+";margin:22px 0 9px 0;border-bottom:2px solid "+G+";padding-bottom:5px;";
    const lineStyle="font-size:18px;line-height:1.75;font-weight:700;color:"+N+";margin:5px 0;";
    const smallStyle="font-size:16px;line-height:1.65;font-weight:700;color:#334155;margin:4px 0;";
    const partes=[];
    partes.push("<div style='font-size:26px;font-weight:900;color:"+N+";margin-bottom:6px;'>Prontuário oncológico</div>");
    partes.push("<div style='font-size:17px;font-weight:800;color:#475569;margin-bottom:22px;'>"+esc(px.nome||"Paciente não selecionado")+" · "+esc(px.nasc||px.data_nascimento||"")+" · "+esc(px.cns||px.cpf||"")+"</div>");
    partes.push("<div style='"+secStyle+"'>Resumo oncológico essencial</div>");
    const resumoLinhas=[...onco,...resumoClaude].slice(0,8);
    partes.push(resumoLinhas.length?resumoLinhas.map(l=>"<div style='"+lineStyle+"'>"+esc(l)+"</div>").join(""):"<div style='"+lineStyle+"'><br></div>");
    partes.push("<div style='"+secStyle+"'>Exames relevantes</div>");
    if(exames.length){
      partes.push(exames.map(x=>"<div style='"+lineStyle+"'>"+esc(x.data)+" - <span style='text-decoration:underline;text-decoration-thickness:2px;font-weight:900;'>"+esc(x.exame)+"</span> - "+esc(x.resumo)+"</div>").join(""));
    }else{
      partes.push("<div style='"+lineStyle+"'><br></div>");
    }
    partes.push("<div style='"+secStyle+"'>Clínica relevante</div>");
    partes.push(clinico.length?clinico.map(l=>"<div style='"+smallStyle+"'>"+esc(l)+"</div>").join(""):"<div style='"+smallStyle+"'><br></div>");
    partes.push("<div style='"+secStyle+"'>Laboratório e exame físico</div>");
    partes.push("<div style='"+lineStyle+"'><br></div>");
    partes.push("<div style='"+secStyle+"'>Conduta médica</div>");
    partes.push("<div style='"+lineStyle+"'><br></div>");
    partes.push("<div style='"+secStyle+"'>Observações precisas</div>");
    partes.push(obs.length?obs.map(l=>"<div style='"+smallStyle+"'>"+esc(l)+"</div>").join(""):"<div style='"+smallStyle+"'><br></div>");
    const html=partes.join("");
    return {html,texto:htmlParaTexto(html)};
  }
  function aplicarPagina(d=dossieAtual,p=pac){
    const pg=montarPaginaProntuario(d,p);
    setPagina(pg.html);
    setTexto(pg.texto);
    setSalvo(!!d?.evolucao?.textoFinal);
    setTimeout(()=>{if(editorRef.current)editorRef.current.innerHTML=pg.html;},0);
  }
  useEffect(()=>{aplicarPagina(dossieAtual,pac);},[dossie?.id,dossie?.resumoClaude,dossie?.documentos?.length,pac?.pacID,pac?.nome,pac?.cpf,pac?.cns,pac?.nasc]);
  useEffect(()=>{
    if(!dossie||!setDossie||!mesmoPacienteDossie(dossie,pac))return;
    const docsOrig=dossie.documentos||[];
    const docsOk=docsOrig.filter(docPacienteAtual);
    const resumoOk=textoDoPacienteAtual(dossie.resumoClaude,pac)?(dossie.resumoClaude||""):"";
    if(docsOk.length!==docsOrig.length||resumoOk!==(dossie.resumoClaude||"")){
      setDossie({...dossie,documentos:docsOk,resumoClaude:resumoOk,evolucao:{...(dossie.evolucao||{}),rascunho:"",textoFinal:"",html:""},updatedAt:NOW()});
    }
  },[dossie?.id,dossie?.documentos?.length,dossie?.resumoClaude,pac?.pacID,pac?.nome,pac?.cpf,pac?.cns,pac?.nasc]);

  const organizar=async()=>{
    setProcessando(true);
    try{
      const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
      setDossie&&setDossie({...base,paciente:{...(base.paciente||{}),...pac},status:"claude_processando",updatedAt:NOW()});
      const novo=await gerarDossieClaude({...base,paciente:{...(base.paciente||{}),...pac}});
      const limpo={...novo,paciente:{...(novo.paciente||{}),...pac},status:"pronto_medico",updatedAt:NOW()};
      limpo.evolucao={...(limpo.evolucao||{}),rascunho:montarPaginaProntuario(limpo,pac).texto,textoFinal:""};
      limpo.apac=validarAPAC(limpo);
      setDossie&&setDossie(limpo);
      aplicarPagina(limpo,pac);
      setSalvo(false);
    }finally{setProcessando(false);}
  };
  const adicionarResumoDocumento=(res,meta={})=>{
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
    const doc={id:Date.now(),tipo:meta.tipo||"Documento",nome:meta.arquivos?.[0]?.n||"Documento analisado",resumo:curta(res,650),origem:"prontuario_dragdrop",criadoEm:NOW()};
    const novo={...base,paciente:{...(base.paciente||{}),...pac},documentos:[doc,...(base.documentos||[])],resumoClaude:limpar(res),status:"pronto_medico",updatedAt:NOW()};
    novo.evolucao={...(novo.evolucao||{}),rascunho:montarPaginaProntuario(novo,pac).texto,textoFinal:""};
    novo.apac=validarAPAC(novo);
    setDossie&&setDossie(novo);
    aplicarPagina(novo,pac);
    setSalvo(false);
  };
  const arquivoBase64Simples=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||"").split(",")[1]||"");r.onerror=reject;r.readAsDataURL(file);});
  const analisarUploadSimples=async(formData,payload={})=>{
    setProcessando(true);
    try{
      const arquivos=payload.arquivos||[];
      const textoLivre=payload.textoLivre||"";
      const apiKeyLocal=localStorage.getItem("anthropic_key")||"";
      const filesBase64=[];
      for(const file of arquivos){
        const mimeType=file.type||(/\.pdf$/i.test(file.name)?"application/pdf":"application/octet-stream");
        if(["application/pdf","image/jpeg","image/png","image/webp"].includes(mimeType))filesBase64.push({name:file.name,mimeType,base64:await arquivoBase64Simples(file)});
      }
      const prompt=[
        "Você é assistente oncológico do Dr. Silas Negrão, Hospital do Bem, Patos-PB.",
        "Leia os documentos anexados e gere um resumo muito curto para prontuário oncológico.",
        "Use apenas o essencial oncológico. Não misture dados de outro paciente.",
        "Formato obrigatório: uma linha por informação.",
        "Para exames use exatamente: data - exame - resumo.",
        "Não use símbolos, markdown, listas numeradas ou conduta.",
        "",
        "Paciente atual: "+(pac?.nome||""),
        "Nascimento: "+(pac?.nasc||""),
        "Diagnóstico atual: "+(pac?.diag||""),
        "Arquivos: "+(arquivos.map(f=>f.name).join(", ")||"nenhum"),
        "Texto colado: "+(textoLivre||""),
      ].join("\n");
      let resumo="";
      let backendOk=false;
      if(!apiKeyLocal){
        try{
          const r=await fetch(_apiUrl()+"/api/claude/resumo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,maxTokens:900,files:filesBase64})});
          const data=await r.json().catch(()=>({}));
          if(r.ok&&data.ok){resumo=data.text||"";backendOk=true;}
        }catch(_){}
      }
      if(!backendOk){
        if(!apiKeyLocal)throw new Error("Backend Claude indisponível.");
        const content=filesBase64.map(f=>f.mimeType==="application/pdf"?{type:"document",source:{type:"base64",media_type:f.mimeType,data:f.base64}}:{type:"image",source:{type:"base64",media_type:f.mimeType,data:f.base64}});
        content.push({type:"text",text:textoLivre||"Analise os arquivos acima."});
        const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":apiKeyLocal,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-5",max_tokens:900,system:prompt,messages:[{role:"user",content}]})});
        const data=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(data.error?.message||("Erro Claude "+r.status));
        resumo=data.content?.[0]?.text||"";
      }
      if(!resumo.trim())throw new Error("Claude não retornou resumo.");
      adicionarResumoDocumento(resumo,{arquivos:arquivos.map(f=>({n:f.name,tipo:f.type})),texto:textoLivre,destino:"prontuario",origem:"Médico",tipo:"Upload simples"});
    }finally{setProcessando(false);}
  };
  const salvar=()=>{
    const htmlAtual=editorRef.current?.innerHTML||pagina;
    const textoFinal=htmlParaTexto(htmlAtual);
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
    const novo={...base,paciente:{...(base.paciente||{}),...pac},status:"evolucao_salva",evolucao:{...(base.evolucao||{}),html:htmlAtual,rascunho:textoFinal,textoFinal,salvaEm:NOW()},updatedAt:NOW()};
    novo.apac=validarAPAC(novo);
    setDossie&&setDossie(novo);
    up&&up("obs_ultima_evolucao",textoFinal);
    onSalvarEvolucao&&onSalvarEvolucao(textoFinal);
    setTexto(textoFinal);
    setPagina(htmlAtual);
    setSalvo(true);
  };
  const limparPagina=()=>{
    const pg=montarPaginaProntuario({paciente:{...pac},documentos:[],resumoClaude:"",evolucao:{textoFinal:"",rascunho:""}},pac);
    setPagina(pg.html);setTexto(pg.texto);setSalvo(false);
    setTimeout(()=>{if(editorRef.current)editorRef.current.innerHTML=pg.html;},0);
  };
  return <div style={{display:"grid",gap:14,maxWidth:1180,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{flex:1}}>
        <div style={{fontSize:12,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:1}}>Dossiê Oncológico Inteligente</div>
        <div style={{fontSize:24,fontWeight:900,color:N}}>Prontuário em página única</div>
        <div style={{fontSize:14,fontWeight:800,color:"#475569"}}>{pac?.nome||"Paciente não selecionado"}</div>
      </div>
      <Btn v="navy" ch={processando?"Claude resumindo":"Resumir com Claude"} dis={processando} onClick={organizar}/>
      <Btn v="ghost" ch="Limpar página" onClick={limparPagina}/>
      <Btn v="green" ch="Salvar evolução" s={{padding:"10px 18px",fontSize:14}} onClick={salvar}/>
      <Btn v="gold" ch="APAC anti-glosa" s={{padding:"10px 18px",fontSize:14}} onClick={()=>{setDossie&&setDossie(d=>({...d,apac:validarAPAC(d),status:"apac_validacao"}));onAbrirAPAC&&onAbrirAPAC();}}/>
    </div>
    <details style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,padding:12}}>
      <summary style={{cursor:"pointer",fontSize:15,fontWeight:900,color:N}}>Entrada de documento para resumo pelo Claude</summary>
      <div style={{marginTop:12}}><UploadSimples pacienteId={Number(pac?.id||pac?.paciente_id)||""} onAnalisar={analisarUploadSimples}/></div>
    </details>
    <div
      ref={editorRef}
      key={(pac?.pacID||pac?.cpf||pac?.nome||"sem_paciente")+"_"+(dossieAtual?.updatedAt||"")}
      contentEditable
      suppressContentEditableWarning
      onInput={e=>{setTexto(htmlParaTexto(e.currentTarget.innerHTML));setSalvo(false);}}
      dangerouslySetInnerHTML={{__html:pagina}}
      style={{
        background:"#fff",
        border:"1px solid #E2E8F0",
        borderRadius:3,
        minHeight:760,
        padding:"46px 58px",
        fontFamily:"Segoe UI, Arial, sans-serif",
        boxShadow:"0 10px 28px rgba(15,23,42,.08)",
        outline:"none",
      }}
    />
    {salvo&&<DocumentosPosEvolucao dossie={dossie} setDossie={setDossie} addMsg={addMsg} onAbrirAPAC={onAbrirAPAC}/>}
  </div>;
}

function APACDossieChecklist({dossie,setDossie}){
  const apac=validarAPAC(dossie||{});
  useEffect(()=>{setDossie&&setDossie(d=>({...d,apac,status:apac.completa?"apac_pronta":"apac_validacao",updatedAt:NOW()}));},[apac.pendencias.length]);
  const cor=apac.riscoGlosa==="alto"?VM:apac.riscoGlosa==="moderado"?AM:VE;
  return <div style={sc_.card({border:"2px solid "+cor+"55",marginBottom:12})}>
    <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:8}}>
      <H2 ch="APAC — Validador Anti-Glosa" s={{margin:0,fontSize:14}}/>
      <span style={{background:cor,color:"#fff",borderRadius:999,padding:"5px 12px",fontSize:10,fontWeight:900}}>{apac.riscoGlosa==="baixo"?"APAC pronta":apac.riscoGlosa==="moderado"?"Pendências moderadas":"Pendências críticas"}</span>
    </div>
    {apac.pendencias.length===0?<p style={{fontSize:12,color:VE,fontWeight:800}}>Checklist completo. APAC liberada para impressão.</p>:<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>{apac.pendencias.map(p=><div key={p} style={{fontSize:11,color:N,background:"#FFF7E6",border:"1px solid "+AM+"55",borderRadius:8,padding:"7px 9px"}}>• {p}</div>)}</div>}
    {apac.criticas?.length>0&&<p style={{fontSize:11,color:VM,fontWeight:800,marginTop:8}}>Bloqueio: pendências críticas precisam ser resolvidas antes de marcar APAC pronta.</p>}
  </div>;
}

function DriveDossieComp({pac,dossie,setDossie,addMsg}){
  const API_URL=(import.meta.env.VITE_API_URL||"http://127.0.0.1:3001").replace(/\/$/,"");
  const [url,setUrl]=useState(pac?.drive_folder||[pac?.nome,pac?.nasc].filter(Boolean).join(" "));
  const [texto,setTexto]=useState("");
  const [tipo,setTipo]=useState("Laudo/Exame");
  const [loading,setLoading]=useState(false);
  const [buscando,setBuscando]=useState(false);
  const [resultado,setResultado]=useState("");
  const [achados,setAchados]=useState(null);
  const [erro,setErro]=useState("");
  const [selecionados,setSelecionados]=useState(new Set());

  const toggleSel=id=>setSelecionados(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const selTodos=()=>setSelecionados(new Set((achados?.files||[]).map(f=>f.id)));
  const selNenhum=()=>setSelecionados(new Set());

  const buscarDrive=async()=>{
    if(!url.trim()){alert("Informe nome, CPF, ID ou link da pasta Drive.");return;}
    setBuscando(true);setErro("");setAchados(null);setSelecionados(new Set());
    try{
      const r=await fetch(API_URL+"/api/drive/search?q="+encodeURIComponent(url.trim()));
      const d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.message||"Falha ao buscar no Drive.");
      setAchados(d);
      if(d.folder?.name)setUrl(d.folder.name);
      if(!d.folder)setErro("Nenhuma pasta encontrada. Confira se a pasta foi compartilhada com o e-mail da service account.");
    }catch(e){
      setErro("Drive indisponível: "+e.message+". Mantive o modo manual por texto/link.");
    }finally{setBuscando(false);}
  };

  const analisar=async()=>{
    const conteudo=(url?("Link Drive: "+url+"\n"):"")+texto;
    if(!conteudo.trim()&&selecionados.size===0){alert("Selecione ao menos um arquivo ou cole o link/texto do laudo.");return;}
    if(selecionados.size>5){alert("Selecione no máximo 5 arquivos por vez para análise.");return;}
    setLoading(true);setErro("");
    try{
      const arquivoIds=selecionados.size>0?Array.from(selecionados):null;
      const r=await fetch(API_URL+"/api/dossie/drive",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({paciente:pac||{},recepcao:{drive_folder:url},drive_folder:url,texto,tipo,arquivoIds})
      });
      const data=await r.json();
      if(!r.ok||!data.ok)throw new Error(data.message||"Falha no backend Drive/Claude.");
      const docs=(data.arquivos||[]).map(a=>({id:a.id,tipo:a.tipoProvavel||tipo,nome:a.name,link:a.webViewLink,origem:"google_drive",criadoEm:a.createdTime||NOW(),resumo:"Analisado pelo backend"}));
      if(texto.trim())docs.push({id:Date.now(),tipo,nome:"Texto colado",conteudo:texto,origem:"texto_manual",criadoEm:NOW()});
      const novo={...(dossie||criarDossieInicial(pac)),paciente:{...(dossie?.paciente||{}),...pac,drive_folder:url},documentos:[...docs,...(dossie?.documentos||[])],resumoClaude:data.resumo,status:"pronto_medico",updatedAt:NOW()};
      novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};
      novo.apac=validarAPAC(novo);
      setDossie&&setDossie(novo);
      setResultado(data.resumo);
      setAchados(prev=>({...prev,folder:data.folder||prev?.folder,files:data.arquivos?.length?data.arquivos:(prev?.files||[])}));
      addMsg&&addMsg("Sistema","Médico","Drive analisado por backend/Claude e vinculado ao dossiê de "+(pac?.nome||"paciente")+".","laudo");
    }catch(e){
      const doc={id:Date.now(),tipo,nome:url||tipo,link:url,conteudo:texto,origem:"drive_manual",criadoEm:NOW()};
      const base={...(dossie||criarDossieInicial(pac)),paciente:{...(dossie?.paciente||{}),...pac,drive_folder:url},documentos:[doc,...(dossie?.documentos||[])],status:"documentos_anexados",updatedAt:NOW()};
      const novo=await gerarDossieClaude(base);
      setDossie&&setDossie(novo);
      setResultado(novo.resumoClaude);
      setErro("Backend não respondeu. Usei o fallback local do app: "+e.message);
      addMsg&&addMsg("Sistema","Médico","Drive analisado em modo local e vinculado ao dossiê de "+(pac?.nome||"paciente")+".","laudo");
    }finally{setLoading(false);}
  };

  const arquivosLista=achados?.files||[];
  const nSel=selecionados.size;

  return <div style={{display:"grid",gap:12}}>
    <StatusDossieBar dossie={dossie}/>
    <div style={sc_.card()}>
      <H2 ch="Drive → IA → Dossiê do Paciente"/>
      <p style={{fontSize:12,color:"#64748B"}}>Cole o link da pasta Drive do paciente, clique em <strong>Buscar</strong>, selecione os arquivos e clique em <strong>Gerar Dossiê</strong>. O Claude lê os PDFs e monta o prontuário automaticamente.</p>
      <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:10}}>
        <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Tipo provável</label><select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...sc_.inp,fontSize:12}}>{["Biópsia","Imunohistoquímica","Tomografia","Ressonância","Mamografia","Ultrassom","Cintilografia","PET-CT","Laboratório","Documento pessoal","Laudo/Exame"].map(x=><option key={x}>{x}</option>)}</select></div>
        <Fld l="Nome/CPF, ID ou link da pasta Google Drive" val={url} set={setUrl} ph="https://drive.google.com/drive/folders/... ou MARIA SILVA"/>
      </div>
      <Fld l="Texto colado / descrição complementar" val={texto} set={setTexto} ph="Opcional: cole o laudo ou descreva os arquivos..." ta rows={3}/>
      {erro&&<div style={{background:"#FFF7E6",border:"1px solid "+AM+"55",borderRadius:9,padding:"8px 10px",fontSize:11,color:AM,fontWeight:800}}>{erro}</div>}
      {arquivosLista.length>0&&<div style={{background:"#F8FAFF",border:"1px solid #CBD5E1",borderRadius:10,padding:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:900,color:VE}}>📁 {achados?.folder?.name} — {arquivosLista.length} arquivo(s)</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={selTodos} style={{fontSize:10,padding:"3px 8px",borderRadius:5,border:"1px solid #CBD5E1",background:"#fff",cursor:"pointer",color:N}}>Todos</button>
            <button onClick={selNenhum} style={{fontSize:10,padding:"3px 8px",borderRadius:5,border:"1px solid #CBD5E1",background:"#fff",cursor:"pointer",color:"#64748B"}}>Nenhum</button>
          </div>
        </div>
        <p style={{fontSize:10,color:"#64748B",margin:"0 0 8px"}}>✅ Selecione os arquivos deste paciente (máx. 5 por análise). Arquivos &gt;4MB não serão baixados.</p>
        <div style={{display:"grid",gap:4,maxHeight:280,overflowY:"auto"}}>
          {arquivosLista.map(f=>{
            const sel=selecionados.has(f.id);
            const grande=parseInt(f.size||"0")>4*1024*1024;
            return <div key={f.id} onClick={()=>!grande&&toggleSel(f.id)} style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:grande?"#94A3B8":sel?VE:N,background:sel?"#EAF7EE":"#fff",border:"1px solid "+(sel?VE+"88":"#CBD5E1"),borderRadius:7,padding:"5px 8px",cursor:grande?"not-allowed":"pointer",opacity:grande?0.6:1}}>
              <span style={{fontSize:14}}>{sel?"☑":"☐"}</span>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
              <span style={{fontSize:10,color:"#94A3B8",whiteSpace:"nowrap"}}>{Math.round(parseInt(f.size||"0")/1024)}KB{grande?" ⚠️ grande":""}</span>
            </div>;
          })}
        </div>
        {nSel>0&&<div style={{marginTop:8,fontSize:11,fontWeight:800,color:VE}}>{nSel} arquivo(s) selecionado(s) para análise</div>}
      </div>}
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <Btn v="ghost" ch={buscando?"Buscando...":"🔍 Buscar no Drive"} s={{padding:12}} dis={buscando} onClick={buscarDrive}/>
        <Btn v="navy" ch={loading?"Analisando com IA...":"🧠 Gerar Dossiê"} s={{flex:1,padding:12}} dis={loading||(arquivosLista.length>0&&nSel===0&&!texto.trim())} onClick={analisar}/>
        <label style={{...sc_.btn("gold",{cursor:"pointer",padding:"12px 16px"})}}>📎 Upload<input type="file" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)setTexto("Arquivo selecionado: "+f.name+"\nTipo: "+(f.type||"desconhecido")+"\nTamanho: "+Math.round(f.size/1024)+" KB");}}/></label>
      </div>
    </div>
    {resultado&&<div style={sc_.card({border:"2px solid "+VE+"55"})}><H3 ch="Resumo IA inserido no dossiê"/><Cbox text={resultado} maxH={360}/></div>}
  </div>;
}

// ─── PRONTUÁRIO — EVOLUÇÃO COM RESUMO IA ─────────────────────────────────────
function ProntuarioEvolucao({pac,up,addMsg,onConcluir}){
  const [resumoIA,setResumoIA]=useState(pac?.obs_ia||"");
  const [gerandoIA,setGerandoIA]=useState(false);
  const [evolucao,setEvolucao]=useState("");
  const [salvando,setSalvando]=useState(false);
  const [concluido,setConcluido]=useState(false);
  const [gerandoDossie,setGerandoDossie]=useState(false);
  const [dossieStatus,setDossieStatus]=useState("");
  const API_URL=(import.meta.env.VITE_API_URL||"http://127.0.0.1:3001").replace(/\/$/,"");

  const gerarDossie=async()=>{
    if(!pac?.pacID&&!pac?.id){setDossieStatus("⚠ Salve o paciente primeiro.");return;}
    if(!pac?.drive_folder){setDossieStatus("⚠ Informe a pasta Google Drive na recepção.");return;}
    setGerandoDossie(true);
    setDossieStatus("⏳ Iniciando análise dos laudos pelo Claude...");
    try{
      const res=await fetch(`${API_URL}/api/medico/gerar-dossie`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({paciente_id:pac.id||pac.pacID,drive_folder:pac.drive_folder})
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.message||"Erro ao iniciar dossiê");
      const dossieId=data.dossie_id;
      setDossieStatus("⏳ Analisando laudos... Aguarde (pode levar ~1 minuto).");
      // Polling status
      let tentativas=0;
      const poll=setInterval(async()=>{
        tentativas++;
        if(tentativas>30){clearInterval(poll);setDossieStatus("⚠ Timeout — recarregue a página.");setGerandoDossie(false);return;}
        try{
          const sr=await fetch(`${API_URL}/api/medico/dossie-status/${dossieId}`);
          const sd=await sr.json();
          if(sd.status==="concluido"){
            clearInterval(poll);
            setResumoIA(sd.resumo_claude||"");
            if(sd.resumo_claude)up("obs_ia",sd.resumo_claude);
            setDossieStatus("✅ Dossiê Claude gerado com sucesso!");
            setGerandoDossie(false);
          } else if(sd.status==="erro"){
            clearInterval(poll);
            setDossieStatus(`⚠ Erro: ${sd.erro||"Falha na análise"}`);
            setGerandoDossie(false);
          }
        }catch(_){/* continua polling */}
      },3000);
    }catch(e){
      setDossieStatus(`⚠ ${e.message}`);
      setGerandoDossie(false);
    }
  };

  const gerarResumo=async()=>{
    setGerandoIA(true);
    const r=await gerarResumoProntuarioIA(pac);
    setResumoIA(r);
    if(r&&!r.startsWith("⚠")){up("obs_ia",r);}
    setGerandoIA(false);
  };

  const concluir=()=>{
    if(!evolucao.trim()){alert("Escreva a evolução antes de salvar.");return;}
    setSalvando(true);
    setTimeout(()=>{onConcluir&&onConcluir(evolucao);setConcluido(true);setSalvando(false);},600);
  };

  if(concluido)return(
    <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:14,padding:28,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:10}}>✅</div>
      <h3 style={{color:VE,fontWeight:900,margin:"0 0 6px"}}>Evolução salva!</h3>
      <p style={{color:"#4b5563",fontSize:13}}>Registrada na Timeline do paciente.</p>
    </div>
  );

  return(
    <div style={{display:"grid",gap:12}}>
      {/* Cabeçalho paciente */}
      <div style={{background:`linear-gradient(135deg,${N},#0d2347)`,borderRadius:14,padding:"14px 18px",color:"#fff"}}>
        <div style={{fontSize:9,color:G,fontWeight:900,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Evolução — {new Date().toLocaleDateString("pt-BR")}</div>
        <div style={{fontWeight:900,fontSize:17}}>{pac?.nome||<span style={{opacity:.4}}>Nenhum paciente selecionado</span>}</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginTop:2}}>{[pac?.nasc&&`Nasc. ${pac.nasc}`,pac?.cidade,pac?.diag].filter(Boolean).join("  ·  ")}</div>
      </div>

      {/* Dossiê Claude — só aparece se VITE_API_URL configurado */}
      {API_URL&&<div style={{...sc_.card(),border:"2px solid #2B7A8C",background:"#F0F9FF"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <H2 ch="📋 Dossiê Oncológico Claude" s={{margin:0,fontSize:13,color:"#1B365D"}}/>
          <button onClick={gerarDossie} disabled={gerandoDossie}
            style={{background:gerandoDossie?"#94A3B8":"#2B7A8C",color:"#fff",border:"none",borderRadius:8,padding:"6px 16px",fontSize:11,fontWeight:800,cursor:gerandoDossie?"not-allowed":"pointer"}}>
            {gerandoDossie?"⏳ Analisando...":"🔬 Gerar Dossiê"}
          </button>
        </div>
        <p style={{fontSize:11,color:"#64748B",margin:"0 0 6px"}}>
          Claude analisa os laudos da pasta Drive <strong>{pac?.drive_folder||"(não informada)"}</strong> e gera o dossiê oncológico estruturado.
        </p>
        {dossieStatus&&<div style={{fontSize:12,color:dossieStatus.startsWith("✅")?"#15803D":dossieStatus.startsWith("⚠")?"#B91C1C":"#2B7A8C",fontWeight:700,marginTop:6}}>{dossieStatus}</div>}
      </div>}

      {/* Resumo IA */}
      <div style={sc_.card()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <H2 ch="🤖 Resumo Clínico — IA" s={{margin:0,fontSize:13}}/>
          <button onClick={gerarResumo} disabled={gerandoIA} style={{background:gerandoIA?"#94A3B8":T,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:800,cursor:gerandoIA?"not-allowed":"pointer"}}>
            {gerandoIA?"⏳ Gerando...":"⚡ Gerar Resumo IA"}
          </button>
        </div>
        {resumoIA
          ?<div style={{background:"#F0F9FF",border:`1px solid ${T}`,borderRadius:10,padding:12,fontSize:12,whiteSpace:"pre-wrap",lineHeight:1.6,maxHeight:260,overflowY:"auto",color:"#1e3a5f"}}>{resumoIA}</div>
          :<div style={{background:"#F8FAFC",border:"1px dashed #CBD5E1",borderRadius:10,padding:"14px",textAlign:"center",color:"#94A3B8",fontSize:12}}>Clique em "Gerar Resumo IA" para gerar o resumo clínico automaticamente com base nos dados do paciente.</div>}
        {resumoIA&&!resumoIA.startsWith("⚠")&&
          <button onClick={()=>setEvolucao(p=>p?p+"\n\n---\nRESUMO CLÍNICO IA:\n"+resumoIA:"RESUMO CLÍNICO IA:\n"+resumoIA)} style={{marginTop:8,fontSize:11,background:"#EAF7EE",color:VE,border:`1px solid ${VE}`,borderRadius:7,padding:"5px 12px",cursor:"pointer",fontWeight:700}}>
            ↓ Copiar para evolução
          </button>}
      </div>

      {/* Evolução texto */}
      <div style={sc_.card()}>
        <H2 ch="📝 Evolução do Dia" s={{fontSize:13}}/>
        <p style={{color:"#64748B",fontSize:12,marginBottom:10}}>Registre o raciocínio clínico, conduta e plano do dia.</p>
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
          {[
            {l:"Início consulta",t:`Paciente ${pac?.nome||"—"}, ${pac?.nasc||""}, ${pac?.cidade||""}.\nQueixa: ${pac?.queixa||"—"}.\nECOG: ${pac?.ecog||"—"}. Peso: ${pac?.peso||"—"} kg.\n\nExame físico: `},
            {l:"Diagnóstico",t:`Diagnóstico: ${pac?.diag||"—"}.\nEstádio: ${pac?.estadio||"—"}. TNM: ${pac?.tnm||"—"}.\nBiomarcadores: ${pac?.bio||"—"}.\n\nConduta: `},
            {l:"Resultado exame",t:`Revisão de exame:\n\nAchados: \n\nConduta: `},
          ].map(m=>(
            <button key={m.l} onClick={()=>setEvolucao(p=>p?p+"\n\n"+m.t:m.t)} style={{fontSize:11,background:"#F1F5F9",color:N,border:"1px solid #CBD5E1",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontWeight:700}}>+ {m.l}</button>
          ))}
        </div>
        <textarea value={evolucao} onChange={e=>setEvolucao(e.target.value)} rows={10}
          placeholder={`Evolução médica — ${new Date().toLocaleDateString("pt-BR")}\n\nPaciente: ${pac?.nome||"—"}\nDiagnóstico: ${pac?.diag||"—"}\n\nSubjetivo:\n\nObjetivo:\n\nAvaliação:\n\nPlano:`}
          style={{width:"100%",border:"1px solid #CBD5E1",borderRadius:10,padding:"10px 12px",fontSize:13,resize:"vertical",outline:"none",fontFamily:"Georgia,serif",background:"#FAFAFA",lineHeight:1.6,boxSizing:"border-box"}}/>
        <button onClick={concluir} disabled={salvando||!evolucao.trim()}
          style={{marginTop:12,width:"100%",background:evolucao.trim()?VE:"#94A3B8",color:"#fff",border:"none",borderRadius:10,padding:13,fontWeight:900,fontSize:14,cursor:evolucao.trim()?"pointer":"not-allowed"}}>
          {salvando?"Salvando...":"✅ Salvar evolução na Timeline"}
        </button>
      </div>
    </div>
  );
}

// ─── PRIMEIRA CONSULTA (PORTAL PACIENTE) ─────────────────────────────────────
function PrimConsultaPaciente({pac,up,addMsg,addCaixa,addFila,onDossieCriado,onConcluido,back,alertCount,onAlert}){
  const [passo,setPasso]=useState(0);// 0=dados,1=anamnese,2=upload,3=sucesso
  const [arqs,setArqs]=useState([]);
  const [enviando,setEnviando]=useState(false);
  const refC=useRef(null);const refA=useRef(null);
  const onCam=e=>{setArqs(x=>[...x,...Array.from(e.target.files||[]).map(f=>({ico:"📸",n:f.name,tipo:"Foto"}))]);e.target.value="";};
  const onArq=e=>{setArqs(x=>[...x,...Array.from(e.target.files||[]).map(f=>({ico:"📄",n:f.name,tipo:f.name.endsWith(".pdf")?"PDF":"Doc"}))]);e.target.value="";};
  const enviar=()=>{
    setEnviando(true);
    setTimeout(async()=>{
      const resumo=`PRIMEIRA CONSULTA — ${new Date().toLocaleDateString("pt-BR")}\n\nPaciente: ${pac.nome||"—"}\nNasc: ${pac.nasc||"—"} · CPF: ${pac.cpf||"—"}\nTel: ${pac.tel||"—"} · Cidade: ${pac.cidade||"—"}\n\nQUEIXA: ${pac.queixa||"—"}\n\nANAMNESE:\n• Medicação p/ doença: ${pac.anam_remedio_doenca||"Não"}\n• Medicamentos em uso: ${pac.meds||"Nenhum"}\n• Alergia a remédio: ${pac.alerg||"Nega"}\n• Cirurgias anteriores: ${pac.anam_cirurgia||"Não"}\n• Histórico familiar de câncer: ${pac.anam_hist_fam||"Não"}\n\nDocumentos enviados: ${arqs.length>0?arqs.map(a=>a.n).join(", "):"Nenhum"}`;
      onDossieCriado&&onDossieCriado({paciente:{...pac},status:"aguardando_recepcao",resumoEntrada:resumo,documentos:arqs.map(a=>({id:Date.now()+Math.random(),tipo:a.tipo||"Upload",nome:a.n,origem:"paciente",criadoEm:NOW()}))});
      if(addCaixa)addCaixa({de:pac.nome||"Paciente",titulo:`Primeira Consulta — ${pac.nome||"—"}`,conteudo:resumo,tipo:"primeira_consulta"});
      if(addMsg)addMsg("Paciente","Médico",`📋 Nova primeira consulta: ${pac.nome||"—"} · ${pac.queixa||"—"}`,"msg");
      // Auto-adiciona à lista de espera da recepção
      if(addFila&&pac.nome)addFila({nome:pac.nome,proto:"Primeira consulta",chegada:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),status:"aguardando",origem:"paciente"});
      // Gerar resumo IA em background
      try{const iaResumo=await IA_resumirDados({queixa:pac.queixa,antecedentes:pac.antec,meds:pac.meds,alerg:pac.alerg,hf:pac.anam_hist_fam,cirurgia:pac.anam_cirurgia},{nome:pac.nome,nasc:pac.nasc,cidade:pac.cidade,cpf:pac.cpf,tel:pac.tel});if(iaResumo&&!iaResumo.startsWith("⚠"))up("obs_ia",iaResumo);}catch(_){}
      setEnviando(false);
      setPasso(3);
    },1500);
  };
  const PASSOS=[{n:0,l:"Dados"},{n:1,l:"Anamnese"},{n:2,l:"Documentos"}];
  return <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
    <input ref={refC} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={onCam}/>
    <input ref={refA} type="file" accept=".pdf,.doc,.docx,image/*" multiple style={{display:"none"}} onChange={onArq}/>
    <TopBar title="Primeira Consulta" back={back} alertCount={alertCount} onAlert={onAlert}/>
    <div style={{flex:1,padding:16,overflowY:"auto"}}><div style={{maxWidth:560,margin:"0 auto"}}>
      {passo<3&&<div style={{display:"flex",gap:0,background:"#fff",borderRadius:12,border:`1px solid #CBD5E1`,overflow:"hidden",marginBottom:16}}>
        {PASSOS.map(p=><div key={p.n} style={{flex:1,textAlign:"center",padding:"9px 4px",background:passo===p.n?N:passo>p.n?VE+"22":"#fff",borderRight:"1px solid #E2E8F0"}}>
          <div style={{fontSize:9,fontWeight:900,color:passo===p.n?"#fff":passo>p.n?VE:"#94A3B8",textTransform:"uppercase"}}>{passo>p.n?"✓ ":""}{p.l}</div>
        </div>)}
      </div>}
      {passo===0&&<div style={{display:"grid",gap:12}}>
        <div style={sc_.card()}>
          <H2 ch="👤 Seus Dados"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Fld l="Nome completo *" val={pac.nome||""} set={v=>up("nome",v)} ph="Seu nome completo"/>
            <Fld l="Data de nascimento" val={pac.nasc||""} set={v=>up("nasc",v)} ph="DD/MM/AAAA"/>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Sexo</label><select value={pac.sexo||""} onChange={e=>up("sexo",e.target.value)} style={{...sc_.inp,fontSize:12,marginBottom:8}}><option value="">Selecionar...</option><option>Feminino</option><option>Masculino</option><option>Outro</option></select></div>
            <Fld l="CPF" val={pac.cpf||""} set={v=>up("cpf",v)} ph="000.000.000-00"/>
            <Fld l="Cartão SUS (CNS)" val={pac.cns||""} set={v=>up("cns",v)} ph="000 0000 0000 0000"/>
            <Fld l="Telefone / WhatsApp" val={pac.tel||""} set={v=>up("tel",v)} ph="(00) 90000-0000"/>
            <Fld l="Cidade / Estado" val={pac.cidade||""} set={v=>up("cidade",v)} ph="Patos / PB"/>
          </div>
          <Fld l="Motivo da consulta — o que está sentindo?" val={pac.queixa||""} set={v=>up("queixa",v)} ph="Ex: Caroço no pescoço, perda de peso, dor..." ta rows={3}/>
          <Btn v="gold" ch="Próximo →" s={{width:"100%",fontSize:14,padding:12,marginTop:4}} dis={!pac.nome} onClick={()=>setPasso(1)}/>
        </div>
      </div>}
      {passo===1&&<div style={{display:"grid",gap:12}}>
        <div style={sc_.card()}>
          <H2 ch="📋 Anamnese Resumida"/>
          <p style={{color:"#64748B",fontSize:12,marginBottom:12}}>Responda as perguntas abaixo para ajudar o médico:</p>
          {[
            {l:"Toma remédio para alguma doença?",k:"anam_remedio_doenca",ph:"Ex: Sim — Hipertensão / Diabetes / Não"},
            {l:"Quais remédios toma atualmente?",k:"meds",ph:"Nome dos remédios, doses..."},
            {l:"Tem alergia a algum remédio?",k:"alerg",ph:"Ex: Sim — Penicilina / Dipirona / Não"},
            {l:"Já fez alguma cirurgia?",k:"anam_cirurgia",ph:"Ex: Sim — Apendicectomia 2010 / Não"},
            {l:"Alguém na família tem ou teve câncer?",k:"anam_hist_fam",ph:"Ex: Sim — Mãe (mama), Pai (próstata) / Não"},
          ].map(q=><div key={q.k} style={{marginBottom:10}}>
            <label style={{fontSize:12,fontWeight:800,color:N,display:"block",marginBottom:4}}>❓ {q.l}</label>
            <div style={{display:"flex",gap:5,marginBottom:4}}>
              {["Sim","Não"].map(op=><button key={op} onClick={()=>{if(op==="Não")up(q.k,"Não");else if(!(pac[q.k]&&pac[q.k]!=="Não"))up(q.k,"Sim — ");}} style={{...sc_.btn(pac[q.k]&&pac[q.k].startsWith(op)?(op==="Sim"?"gold":"ghost"):"ghost",{fontSize:11,padding:"5px 12px"})}}>{op}</button>)}
            </div>
            {(!pac[q.k]||pac[q.k]==="Sim — "||(!["Não"].includes(pac[q.k])))&&<input value={pac[q.k]||""} onChange={e=>up(q.k,e.target.value)} placeholder={q.ph} style={{...sc_.inp,fontSize:12}}/>}
          </div>)}
          <div style={{display:"flex",gap:7,marginTop:10}}>
            <Btn v="ghost" ch="← Voltar" s={{fontSize:12}} onClick={()=>setPasso(0)}/>
            <Btn v="gold" ch="Próximo →" s={{flex:1,fontSize:14,padding:12}} onClick={()=>setPasso(2)}/>
          </div>
        </div>
      </div>}
      {passo===2&&<div style={{display:"grid",gap:12}}>
        <div style={sc_.card()}>
          <H2 ch="📎 Documentos (Opcional)"/>
          <p style={{color:"#64748B",fontSize:12,marginBottom:10}}>Envie laudos, exames ou encaminhamentos se tiver disponível.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div onClick={()=>refC.current?.click()} style={{border:`2px dashed ${T}`,borderRadius:12,padding:"18px 8px",textAlign:"center",cursor:"pointer",background:"#F0F9FF"}}><div style={{fontSize:28,marginBottom:4}}>📷</div><strong style={{color:T,fontSize:12}}>Foto</strong><div style={{fontSize:10,color:"#94A3B8"}}>Câmera</div></div>
            <div onClick={()=>refA.current?.click()} style={{border:`2px dashed ${G}`,borderRadius:12,padding:"18px 8px",textAlign:"center",cursor:"pointer",background:"#FFFBEB"}}><div style={{fontSize:28,marginBottom:4}}>📁</div><strong style={{color:G,fontSize:12}}>Arquivo PDF</strong><div style={{fontSize:10,color:"#94A3B8"}}>Laudos · Exames</div></div>
          </div>
          {arqs.length>0&&<div style={{marginBottom:10}}>{arqs.map((a,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",border:"1px solid #CBD5E1",borderRadius:9,padding:"6px 10px",marginBottom:4,background:"#F8FAFC"}}><span style={{fontSize:18}}>{a.ico}</span><span style={{flex:1,fontSize:12,fontWeight:700,color:N}}>{a.n}</span><span style={{fontSize:9,color:"#94A3B8"}}>{a.tipo}</span><button style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8"}} onClick={()=>setArqs(x=>x.filter((_,j)=>j!==i))}>✕</button></div>)}</div>}
          <div style={{display:"flex",gap:7,marginTop:8}}>
            <Btn v="ghost" ch="← Voltar" s={{fontSize:12}} onClick={()=>setPasso(1)}/>
            <Btn v="gold" ch={enviando?"⏳ Enviando...":"✅ Enviar ao Médico"} s={{flex:1,fontSize:14,padding:12}} dis={enviando||!pac.nome} onClick={enviar}/>
          </div>
        </div>
      </div>}
      {passo===3&&<div style={sc_.card({textAlign:"center",padding:32})}>
        <div style={{fontSize:64,marginBottom:12}}>✅</div>
        <H2 ch="Enviado com Sucesso!" s={{color:VE}}/>
        <p style={{color:"#64748B",fontSize:14,marginBottom:8}}>Sua ficha foi enviada ao médico.</p>
        <p style={{color:"#64748B",fontSize:12,marginBottom:6}}>Em breve você receberá confirmação do agendamento.</p>
        <div style={{background:"#EAF7EE",borderRadius:12,padding:"10px 16px",marginBottom:20,border:`1px solid ${VE}`}}>
          <p style={{fontSize:12,color:VE,fontWeight:700,margin:0}}>📋 {pac.nome||"Paciente"} · {new Date().toLocaleDateString("pt-BR")}</p>
          <p style={{fontSize:11,color:"#64748B",margin:"4px 0 0"}}>{arqs.length>0?`${arqs.length} documento(s) enviado(s)`:"Sem anexos"}</p>
        </div>
        <Btn v="gold" ch="← Voltar ao Portal" s={{width:"100%",fontSize:13,padding:12}} onClick={onConcluido}/>
      </div>}
    </div></div>
  </div>;
}

// ─── EVOLUÇÕES DO PRONTUÁRIO ──────────────────────────────────────────────────
function EvolucoesProntuarioOld({pac,up,addMsg}){
  const TIPOS=[
    {id:"Consulta",ico:"📋",cor:N},{id:"QT Ciclo",ico:"💉",cor:T},
    {id:"Intercorrência",ico:"🚨",cor:VM},{id:"Resultado Exame",ico:"📊",cor:VE},
    {id:"Retorno",ico:"🔄",cor:G},{id:"Livre",ico:"📝",cor:"#64748B"},
  ];
  const [evolucoes,setEvolucoes]=useState(pac?.evolucoes||[
    {id:1,data:"12/03/2026",hora:"09:00",tipo:"Consulta",autor:AUTOR,texto:"S: Perda ponderal 8 kg/3 meses, dor abdominal em cólica.\nO: BEG, PA 120/80, FC 78. Abdome: dor FID, sem massas palpáveis.\nA: Adenocarcinoma cólon sigmoide — estadiamento inicial. ECOG 1.\nP: TC tórax-abdome-pelve + PET-CT. Retorno em 15 dias com exames."},
    {id:2,data:"02/04/2026",hora:"10:30",tipo:"QT Ciclo",autor:AUTOR,texto:"Ciclo: C1D1 mFOLFOX6\nLab: Neutro 3.200 · PLT 198.000 · Hgb 12,8 · Creat 0,9\nDecisão: ✅ LIBERADO — dose plena\nTolerância: Boa. Sem reações agudas. Orientações domiciliares fornecidas."},
    {id:3,data:"16/04/2026",hora:"08:45",tipo:"QT Ciclo",autor:AUTOR,texto:"Ciclo: C2D1 mFOLFOX6\nLab: Neutro 2.400 · PLT 187.000 · Hgb 12,2 · Creat 0,9\nDecisão: ✅ LIBERADO — dose plena\nTolerância: Boa. Leve neuropatia G1 dedos mãos. Orientado."},
  ]);
  const [tipo,setTipo]=useState(null);
  const [form,setForm]=useState({});
  const [filtroTipo,setFiltroTipo]=useState("Todos");
  const upF=(k,v)=>setForm(x=>({...x,[k]:v}));
  const hoje=TODAY();
  const agora=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  const COR={Consulta:N,"QT Ciclo":T,Intercorrência:VM,"Resultado Exame":VE,Retorno:G,Livre:"#64748B"};
  const selecionarTipo=(t)=>{
    setTipo(t);
    const base={data:hoje,hora:agora};
    if(t.id==="QT Ciclo")setForm({...base,ciclo:pac?.trat?"C?D1 — "+pac.trat:"",neutro:"",plt:"",hgb:"",creat:"",tolerancia:"Boa",decisao:"✅ LIBERADO — dose plena",obs:""});
    else if(t.id==="Consulta")setForm({...base,queixa:"",exFisico:"",conduta:"",retorno:""});
    else if(t.id==="Intercorrência")setForm({...base,sintoma:"",conduta:"",encaminhamento:""});
    else if(t.id==="Resultado Exame")setForm({...base,tipoExame:"",valores:"",interpretacao:""});
    else if(t.id==="Retorno")setForm({...base,avaliacao:"",proximo:""});
    else setForm({...base,texto:""});
  };
  const gerarTexto=()=>{
    if(tipo?.id==="Consulta")return`S: ${form.queixa||"—"}\nO: ${form.exFisico||"—"}\nA: ${pac?.diag||"—"} · ECOG ${pac?.ecog||"—"}\nP: ${form.conduta||"—"}\nRetorno: ${form.retorno||"—"}`;
    if(tipo?.id==="QT Ciclo")return`Ciclo: ${form.ciclo||"—"}\nLab: Neutro ${form.neutro||"—"} · PLT ${form.plt||"—"} · Hgb ${form.hgb||"—"} · Creat ${form.creat||"—"}\nDecisão: ${form.decisao||"—"}\nTolerância: ${form.tolerancia||"—"}${form.obs?"\n"+form.obs:""}`;
    if(tipo?.id==="Intercorrência")return`Sintoma: ${form.sintoma||"—"}\nConduta: ${form.conduta||"—"}${form.encaminhamento?"\nEncaminhamento: "+form.encaminhamento:""}`;
    if(tipo?.id==="Resultado Exame")return`Exame: ${form.tipoExame||"—"}\nValores: ${form.valores||"—"}${form.interpretacao?"\nInterpretação: "+form.interpretacao:""}`;
    if(tipo?.id==="Retorno")return`Avaliação: ${form.avaliacao||"—"}\nPróximo retorno: ${form.proximo||"—"}`;
    return form.texto||"";
  };
  const salvar=()=>{
    const texto=gerarTexto();if(!texto.replace(/—/g,"").trim())return;
    const nova={id:Date.now(),data:form.data||hoje,hora:form.hora||agora,tipo:tipo?.id||"Livre",autor:AUTOR,texto};
    const atualizadas=[nova,...evolucoes];setEvolucoes(atualizadas);if(up)up("evolucoes",atualizadas);
    if(addMsg)addMsg("Médico","Todos",`Evolução registrada: ${tipo?.id||"—"} — ${pac?.nome||"—"}`,"msg");
    setTipo(null);setForm({});
  };
  const filtradas=evolucoes.filter(e=>filtroTipo==="Todos"||e.tipo===filtroTipo);
  return <div style={{display:"grid",gap:14}}>
    <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
      <H2 ch="📝 Evoluções" s={{margin:0}}/>
      {evolucoes.length>0&&<Btn v="teal" ch="🖨 Imprimir Todas" s={{fontSize:11}} onClick={()=>abrirPremium("Evoluções — "+pac?.nome,evolucoes.map(e=>`[${e.data} ${e.hora||""} — ${e.tipo}]\n${e.texto}\n${e.autor}`).join("\n\n"+"─".repeat(40)+"\n\n"),"prontuario")}/>}
    </div>
    {!tipo&&<div>
      <div style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Nova Evolução — Clique no tipo:</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
        {TIPOS.map(t=><button key={t.id} onClick={()=>selecionarTipo(t)} style={{border:`2px solid ${t.cor}33`,borderRadius:11,padding:"10px 6px",cursor:"pointer",background:"#fff",fontFamily:"inherit",transition:"all .15s",textAlign:"center"}} onMouseEnter={e=>{e.currentTarget.style.background=t.cor+"11";e.currentTarget.style.borderColor=t.cor;e.currentTarget.style.transform="translateY(-1px)";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.borderColor=t.cor+"33";e.currentTarget.style.transform="";}}>
          <div style={{fontSize:22,marginBottom:4}}>{t.ico}</div>
          <div style={{fontSize:10,fontWeight:900,color:t.cor}}>{t.id}</div>
        </button>)}
      </div>
    </div>}
    {tipo&&<div style={{...sc_.card({border:`2px solid ${tipo.cor}`,background:tipo.cor+"08"})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:20}}>{tipo.ico}</span><strong style={{color:tipo.cor,fontSize:14}}>{tipo.id}</strong><span style={{color:"#94A3B8",fontSize:11}}>{form.data} {form.hora}</span></div>
        <button onClick={()=>{setTipo(null);setForm({});}} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:18,lineHeight:1}}>✕</button>
      </div>
      {tipo.id==="Consulta"&&<div style={{display:"grid",gap:8}}>
        <div><label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>S — Subjetivo (Queixa / HDA)</label><textarea autoFocus rows={2} value={form.queixa||""} onChange={e=>upF("queixa",e.target.value)} placeholder="Queixa principal, história da doença atual..." style={{...sc_.inp,resize:"vertical",fontSize:13,lineHeight:1.6}}/></div>
        <div><label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>O — Objetivo (Exame Físico)</label><textarea rows={2} value={form.exFisico||""} onChange={e=>upF("exFisico",e.target.value)} placeholder="PA, FC, SpO₂, abdome, MMII..." style={{...sc_.inp,resize:"vertical",fontSize:13,lineHeight:1.6}}/></div>
        <div><label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>P — Plano (Condutas / Exames)</label><textarea rows={2} value={form.conduta||""} onChange={e=>upF("conduta",e.target.value)} placeholder="Exames solicitados, medicações, orientações..." style={{...sc_.inp,resize:"vertical",fontSize:13,lineHeight:1.6}}/></div>
        <Fld l="Próximo retorno" val={form.retorno||""} set={v=>upF("retorno",v)} ph="Ex: 21 dias · 14/06/2026..."/>
      </div>}
      {tipo.id==="QT Ciclo"&&<div style={{display:"grid",gap:9}}>
        <Fld l="Ciclo / Protocolo" val={form.ciclo||""} set={v=>upF("ciclo",v)} ph="Ex: C2D1 mFOLFOX6"/>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",marginBottom:5}}>Hemograma — Mínimos para QT</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
            {[{k:"neutro",l:"Neutro /mm³",ref:"≥1.500",min:1500,dir:"ge"},{k:"plt",l:"Plaquetas /mm³",ref:"≥100.000",min:100000,dir:"ge"},{k:"hgb",l:"Hgb g/dL",ref:"≥8,0",min:8,dir:"ge"},{k:"creat",l:"Creat mg/dL",ref:"<1,2",min:1.2,dir:"le"}].map(({k,l,ref,min,dir})=>{
              const v=Number((form[k]||"").replace(",","."));const ok=!v||(dir==="ge"?v>=min:v<=min);
              return <div key={k} style={{background:"#fff",borderRadius:8,padding:"6px 8px",border:`1.5px solid ${v?(ok?VE:VM):"#CBD5E1"}`}}>
                <div style={{fontSize:9,fontWeight:800,color:"#64748B",marginBottom:2}}>{l}</div>
                <input type="text" value={form[k]||""} onChange={e=>upF(k,e.target.value)} placeholder={ref} style={{...sc_.inp,fontSize:12,padding:"4px 6px"}}/>
                {v>0&&<div style={{fontSize:8,fontWeight:900,color:ok?VE:VM,marginTop:2}}>{ok?"✓ OK":"✗ BAIXO"}</div>}
              </div>;
            })}
          </div>
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",marginBottom:5}}>Decisão</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {["✅ LIBERADO — dose plena","⚠️ LIBERAR — reduzir 25%","⏸ ADIAR — aguardar melhora","🚨 CONTRAINDICADO"].map(d=><button key={d} onClick={()=>upF("decisao",d)} style={{border:`2px solid ${form.decisao===d?VE:"#CBD5E1"}`,borderRadius:8,padding:"7px 9px",fontWeight:900,cursor:"pointer",background:form.decisao===d?"#EAF7EE":"#F8FAFC",color:form.decisao===d?VE:N,fontSize:10,textAlign:"left",fontFamily:"inherit"}}>{d}</button>)}
          </div>
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",marginBottom:5}}>Tolerância ao ciclo anterior</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {["Boa","Moderada — G1/G2","Ruim — G3/G4"].map(t=><button key={t} onClick={()=>upF("tolerancia",t)} style={{...sc_.btn(form.tolerancia===t?"teal":"ghost",{fontSize:10,padding:"5px 11px",borderRadius:999})}}>{t}</button>)}
          </div>
        </div>
        <Fld l="Observações / Toxicidades" val={form.obs||""} set={v=>upF("obs",v)} ta rows={2} ph="Neuropatia, mucosite, náuseas, orientações..."/>
      </div>}
      {tipo.id==="Intercorrência"&&<div style={{display:"grid",gap:8}}>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",marginBottom:5}}>Sintoma principal</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
            {["Febre","Vômitos","Diarreia","Dor","Dispneia","Sangramento","Mucosite","Outro"].map(s=><button key={s} onClick={()=>upF("sintoma",(form.sintoma&&!form.sintoma.includes(s)?form.sintoma+", ":"")+s)} style={{...sc_.btn(form.sintoma?.includes(s)?"red":"ghost",{fontSize:10,padding:"4px 10px",borderRadius:999})}}>{s}</button>)}
          </div>
          <input value={form.sintoma||""} onChange={e=>upF("sintoma",e.target.value)} placeholder="Detalhe..." style={{...sc_.inp,fontSize:12}}/>
        </div>
        <Fld l="Conduta adotada" val={form.conduta||""} set={v=>upF("conduta",v)} ta rows={3}/>
        <Fld l="Encaminhamento" val={form.encaminhamento||""} set={v=>upF("encaminhamento",v)} ph="Ex: PS, internação, retorno em 48h..."/>
      </div>}
      {tipo.id==="Resultado Exame"&&<div style={{display:"grid",gap:8}}>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",marginBottom:5}}>Tipo de Exame</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
            {["TC","PET-CT","RM","Hemograma","Anatomopatológico","Marcadores","Outro"].map(t=><button key={t} onClick={()=>upF("tipoExame",t)} style={{...sc_.btn(form.tipoExame===t?"navy":"ghost",{fontSize:10,padding:"4px 10px",borderRadius:999})}}>{t}</button>)}
          </div>
        </div>
        <Fld l="Valores / Achados principais" val={form.valores||""} set={v=>upF("valores",v)} ta rows={3} ph="Descreva os principais achados..."/>
        <Fld l="Interpretação clínica" val={form.interpretacao||""} set={v=>upF("interpretacao",v)} ta rows={2} ph="Resposta parcial, progressão, estabilidade..."/>
      </div>}
      {tipo.id==="Retorno"&&<div style={{display:"grid",gap:8}}>
        <Fld l="Avaliação clínica" val={form.avaliacao||""} set={v=>upF("avaliacao",v)} ta rows={3} ph="Estado geral, resposta ao tratamento, toxicidades..."/>
        <Fld l="Próximo retorno / conduta" val={form.proximo||""} set={v=>upF("proximo",v)} ph="Ex: 21 dias, novos exames, continuar protocolo..."/>
      </div>}
      {tipo.id==="Livre"&&<div><label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Texto Livre</label><textarea autoFocus rows={6} value={form.texto||""} onChange={e=>upF("texto",e.target.value)} placeholder="Digite a evolução..." style={{...sc_.inp,resize:"vertical",fontSize:13,lineHeight:1.7}}/></div>}
      <Btn v="gold" ch="💾 Salvar Evolução" s={{width:"100%",padding:11,fontSize:13,marginTop:12}} onClick={salvar}/>
    </div>}
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      {["Todos","Consulta","QT Ciclo","Intercorrência","Resultado Exame","Retorno","Livre"].map(t=><button key={t} onClick={()=>setFiltroTipo(t)} style={{...sc_.btn(filtroTipo===t?"gold":"ghost",{fontSize:9,padding:"3px 9px",borderRadius:999})}}>{t}</button>)}
    </div>
    {filtradas.length===0&&<div style={{textAlign:"center",padding:28,color:"#94A3B8"}}><div style={{fontSize:36,marginBottom:8}}>📝</div><p style={{fontSize:12}}>Nenhuma evolução. Clique em um tipo acima para registrar.</p></div>}
    {filtradas.map((ev,i)=>{const cor=COR[ev.tipo]||N;return <div key={ev.id||i} style={sc_.card({borderLeft:`4px solid ${cor}`,padding:"12px 14px"})}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:7}}>
        <div style={{flex:1}}><div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{background:cor,color:"#fff",padding:"2px 9px",borderRadius:999,fontSize:9,fontWeight:900}}>{ev.tipo}</span>
          <span style={{color:N,fontWeight:900,fontSize:12}}>{ev.data}{ev.hora?" · "+ev.hora:""}</span>
          <span style={{color:"#64748B",fontSize:10}}>{ev.autor}</span>
        </div></div>
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>navigator.clipboard?.writeText(ev.texto)} style={{...sc_.btn("ghost",{fontSize:9,padding:"3px 7px"})}}>📋</button>
          <button onClick={()=>abrirPremium("Evolução "+ev.data,`[${ev.data} ${ev.hora||""} — ${ev.tipo}]\n${ev.texto}\n${ev.autor}`,"prontuario")} style={{...sc_.btn("ghost",{fontSize:9,padding:"3px 7px"})}}>🖨</button>
          <button onClick={()=>{const novos=evolucoes.filter((_,j)=>j!==i);setEvolucoes(novos);if(up)up("evolucoes",novos);}} style={{background:"#FFF5F5",border:"none",color:VM,borderRadius:7,padding:"3px 7px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"inherit"}}>✕</button>
        </div>
      </div>
      <pre style={{whiteSpace:"pre-wrap",fontSize:12,lineHeight:1.8,color:"#1E293B",margin:0,fontFamily:"Georgia,serif"}}>{ev.texto}</pre>
    </div>;})}
  </div>;
}

// ─── BUSCAR PACIENTE ─────────────────────────────────────────────────────────
function BuscarPacienteComp({pac,up,setPac,listaEspera=[],agendamentos=[],consultasDia=[],setMedTab,setPronTab,onAbrirPaciente}){
  const [q,setQ]=useState("");
  const [filtro,setFiltro]=useState("todos");
  const todos=[
    ...(listaEspera||[]).map(p=>({...p,origem:"Fila",ico:"🧾"})),
    ...(agendamentos||[]).map(p=>({...p,nome:p.pac||p.nome,origem:"Agenda",ico:"🗓"})),
    ...(consultasDia||[]).map(p=>({...p,origem:"Hoje",ico:"📅"})),
  ];
  const uniq=todos.reduce((acc,p)=>{if(p.nome&&!acc.find(x=>x.nome===p.nome))acc.push(p);return acc;},[]);
  const filtrado=uniq.filter(p=>{
    const match=!q||p.nome?.toLowerCase().includes(q.toLowerCase())||p.proto?.toLowerCase().includes(q.toLowerCase())||p.pacID?.toLowerCase().includes(q.toLowerCase());
    const orig=filtro==="todos"||p.origem?.toLowerCase()===filtro;
    return match&&orig;
  });
  const selecionar=(p)=>{
    if(p.nome)up("nome",p.nome);
    if(p.proto)up("trat",p.proto);
    if(p.pacID)up("pacID",p.pacID);
    if(setPronTab)setPronTab("consulta");
    if(setMedTab)setMedTab("prontuario");
  };
  return <div>
    <H2 ch="🔍 Buscar Paciente"/>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nome, protocolo, ID..." autoFocus style={{...sc_.inp,flex:1,minWidth:180,fontSize:13}}/>
      {["todos","fila","agenda","hoje"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...sc_.btn(filtro===f?"gold":"ghost",{fontSize:10,padding:"6px 11px"})}}>{f==="todos"?"Todos":f==="fila"?"🧾 Fila":f==="agenda"?"🗓 Agenda":"📅 Hoje"}</button>)}
    </div>
    {filtrado.length===0&&<div style={sc_.card({textAlign:"center",padding:32,color:"#94A3B8"})}><div style={{fontSize:40,marginBottom:8}}>🔍</div><p>Nenhum paciente encontrado.</p></div>}
    <div style={{display:"grid",gap:8}}>
      {filtrado.map((p,i)=><div key={i} style={sc_.card({display:"flex",gap:12,alignItems:"center",cursor:"pointer",transition:"box-shadow .15s"})} onClick={()=>selecionar(p)} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 0 0 2px "+G} onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
        <div style={{width:38,height:38,background:G+"22",borderRadius:10,display:"grid",placeItems:"center",fontSize:18,flexShrink:0}}>{p.ico}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,color:N,fontSize:13}}>{p.nome||"—"}</div>
          <div style={{fontSize:11,color:"#64748B"}}>{p.proto||p.tipo||"—"}{p.ciclo?" · "+p.ciclo:""}{p.pacID?" · "+p.pacID:""}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <span style={{background:p.origem==="Fila"?G+"33":p.origem==="Agenda"?T+"33":"#EAF7EE",color:p.origem==="Fila"?G:p.origem==="Agenda"?T:VE,padding:"2px 8px",borderRadius:999,fontSize:10,fontWeight:900}}>{p.origem}</span>
          {p.prioridade&&<div style={{fontSize:9,color:p.prioridade==="alta"?VM:p.prioridade==="media"?AM:VE,fontWeight:900,marginTop:3}}>{p.prioridade?.toUpperCase()}</div>}
        </div>
        <div style={{background:N,color:"#fff",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:900,flexShrink:0}}>Abrir →</div>
      </div>)}
    </div>
    {filtrado.length>0&&<p style={{color:"#94A3B8",fontSize:10,textAlign:"center",marginTop:10}}>{filtrado.length} paciente{filtrado.length>1?"s":""} encontrado{filtrado.length>1?"s":""} · Clique para abrir no prontuário</p>}
  </div>;
}

// ─── DRIVE → PRONTUÁRIO ──────────────────────────────────────────────────────
function DriveIntegracaoCompOld({pac,up,addMsg}){
  const [url,setUrl]=useState("");const [texto,setTexto]=useState("");
  const [modo,setModo]=useState("link");const [loading,setLoading]=useState(false);
  const [resultado,setResultado]=useState(null);const [historico,setHistorico]=useState([]);
  const analisar=async()=>{
    const conteudo=modo==="link"?`Documento Google Drive: ${url}`:texto;
    if(!conteudo.trim()){alert("Informe o link ou cole o conteúdo.");return;}
    setLoading(true);
    const keys=JSON.parse(localStorage.getItem("ia_keys")||"{}");
    const prompt=`Você é um assistente médico especializado em oncologia. Analise o seguinte documento e extraia as informações relevantes para o prontuário oncológico. Estruture em: Tipo de documento, Data, Achados principais, Valores relevantes, Conclusão/Impressão.\n\nPaciente: ${pac?.nome||"—"} · Diagnóstico: ${pac?.diag||"—"}\n\nDocumento:\n${conteudo}`;
    let res="";
    if(keys.claude){try{res=await chamarClaude(prompt,keys.claude,900);}catch(e){}}
    if(!res&&keys.openai){try{res=await chamarGPT(prompt,keys.openai,700);}catch(e){}}
    if(!res)res=`📋 ANÁLISE IA — ${new Date().toLocaleDateString("pt-BR")}\n\nDocumento: ${url||"[texto colado]"}\nPaciente: ${pac?.nome||"—"}\n\nTipo: Documento clínico\nAchados: Documento recebido e processado.\n\n⚠️ Configure uma chave Claude ou OpenAI em Configurações → IA Hub para análise completa.`;
    setResultado(res);setLoading(false);
  };
  const inserirNoProntuario=()=>{
    if(!resultado)return;
    const entry=`\n\n─── DOCUMENTO IMPORTADO ${new Date().toLocaleDateString("pt-BR")} ───\n${resultado}`;
    if(up)up("docs_ia_resumo",(pac?.docs_ia_resumo||"")+entry);
    if(addMsg)addMsg("Médico","Médico",`Documento importado e inserido no prontuário de ${pac?.nome||"—"}.`,"laudo");
    setHistorico(x=>[{url:url||"[texto colado]",resumo:resultado.substring(0,120),data:new Date().toLocaleDateString("pt-BR")},...x]);
    setResultado(null);setUrl("");setTexto("");
  };
  return <div style={{display:"grid",gap:14}}>
    <div style={sc_.card()}>
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
        <div style={{width:48,height:48,background:"linear-gradient(135deg,#4285F4,#0D47A1)",borderRadius:12,display:"grid",placeItems:"center",fontSize:24,flexShrink:0}}>☁️</div>
        <div><H2 ch="Drive → Prontuário" s={{margin:0}}/><p style={{color:"#64748B",fontSize:12,margin:0}}>Importe documentos do Google Drive ou cole texto — a IA extrai e insere no prontuário com 1 clique.</p></div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {[{id:"link",l:"🔗 Link Drive"},{id:"texto",l:"📋 Colar Texto"},{id:"upload",l:"📎 Upload Arquivo"}].map(m=><button key={m.id} onClick={()=>setModo(m.id)} style={{...sc_.btn(modo===m.id?"navy":"ghost",{fontSize:11,padding:"7px 12px"})}}>{m.l}</button>)}
      </div>
      {modo==="link"&&<div>
        <Fld l="Link do Google Drive (compartilhar → qualquer pessoa)" val={url} set={setUrl} ph="https://drive.google.com/file/d/..."/>
        <div style={{background:"#EFF9FF",borderRadius:8,padding:"7px 11px",marginTop:4,fontSize:10,color:T,lineHeight:1.6}}>💡 <strong>Passos:</strong> Drive → botão direito no arquivo → Compartilhar → "Qualquer pessoa com o link" → copie e cole aqui.</div>
      </div>}
      {modo==="texto"&&<div>
        <label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>Cole o conteúdo do documento aqui</label>
        <textarea rows={7} value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Cole laudo, resultado de exame, relatório médico, receita..." style={{...sc_.inp,resize:"vertical",fontSize:12,lineHeight:1.7}}/>
      </div>}
      {modo==="upload"&&<div style={{background:"#F8FAFC",border:"2px dashed #CBD5E1",borderRadius:12,padding:24,textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:8}}>📎</div>
        <p style={{color:"#64748B",fontSize:12,marginBottom:12}}>Selecione um arquivo PDF, imagem ou texto</p>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx" onChange={e=>{const f=e.target.files?.[0];if(f){setTexto(`Arquivo: ${f.name}\nTamanho: ${Math.round(f.size/1024)} KB\nTipo: ${f.type||"desconhecido"}`);setModo("texto");}}} style={{display:"none"}} id="drive_file_inp"/>
        <label htmlFor="drive_file_inp" style={{...sc_.btn("gold",{display:"inline-block",cursor:"pointer",padding:"10px 20px"})}}>Escolher Arquivo</label>
      </div>}
      <Btn v="navy" ch={loading?"⏳ Analisando com IA...":"🤖 Analisar com IA"} s={{width:"100%",marginTop:12,padding:11,fontSize:13}} dis={loading||!(url||texto).trim()} onClick={analisar}/>
    </div>
    {resultado&&<div style={sc_.card({border:`2px solid ${VE}`,background:"#F0FDF4"})}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <H3 ch="🤖 Análise IA — Pronto para inserir" s={{color:VE,margin:0}}/>
        <button onClick={()=>setResultado(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:18}}>✕</button>
      </div>
      <div style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:9,padding:11,marginBottom:12,maxHeight:300,overflowY:"auto"}}>
        <pre style={{whiteSpace:"pre-wrap",fontSize:11,lineHeight:1.75,color:"#1E293B",margin:0,fontFamily:"Georgia,serif"}}>{resultado}</pre>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <Btn v="gold" ch="✅ Inserir no Prontuário" s={{flex:1,padding:11,fontSize:13}} onClick={inserirNoProntuario}/>
        <Btn v="ghost" ch="📋 Copiar" s={{fontSize:11}} onClick={()=>navigator.clipboard?.writeText(resultado)}/>
        <Btn v="teal" ch="🖨 Imprimir" s={{fontSize:11}} onClick={()=>abrirPremium("Documento — "+pac?.nome,resultado,"laudo")}/>
      </div>
    </div>}
    {pac?.docs_ia_resumo&&<div style={sc_.card()}><H3 ch="📄 Documentos Inseridos no Prontuário"/><Cbox text={pac.docs_ia_resumo} maxH={250}/></div>}
    {historico.length>0&&<div style={sc_.card()}><H3 ch="📂 Histórico de Importações"/>
      {historico.map((h,i)=><div key={i} style={{display:"flex",gap:9,alignItems:"center",padding:"7px 0",borderBottom:i<historico.length-1?"1px solid #F1F5F9":"none"}}>
        <span style={{fontSize:18,flexShrink:0}}>📄</span>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:N,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.url}</div><div style={{color:"#64748B",fontSize:10,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.resumo}</div></div>
        <span style={{color:"#94A3B8",fontSize:10,flexShrink:0}}>{h.data}</span>
      </div>)}
    </div>}
  </div>;
}

// ─── V3 COMPONENTES ───────────────────────────────────────────────────────────
// 1. IA FLOATING PANEL
const IA_APPS_V3=[
  {id:"claude",name:"Claude",url:"https://claude.ai",emoji:"🟣",cor:"#7C3AED",desc:"Anthropic — Melhor para medicina"},
  {id:"gpt",name:"ChatGPT",url:"https://chat.openai.com",emoji:"🟢",cor:"#10A37F",desc:"OpenAI — GPT-4o"},
  {id:"gemini",name:"Gemini",url:"https://gemini.google.com",emoji:"🔵",cor:"#4285F4",desc:"Google — Gemini 1.5 Pro"},
  {id:"grok",name:"Grok",url:"https://grok.com",emoji:"⚫",cor:"#1DA1F2",desc:"xAI — Grok 3"},
];
function IAFloatingPanel(){
  const [painel,setPainel]=useState(false);
  const [iaSel,setIaSel]=useState(null);
  const [aberto,setAberto]=useState(false);
  return <>
    <button onClick={()=>setPainel(p=>!p)} title="Assistentes IA" style={{background:painel?G:"rgba(255,255,255,.12)",border:`1.5px solid ${painel?G:"rgba(255,255,255,.2)"}`,color:"#fff",borderRadius:9,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",gap:5,fontFamily:"inherit"}}>
      <span style={{fontSize:14}}>🤖</span><span>IA</span>
    </button>
    {painel&&!iaSel&&<div style={{position:"fixed",top:48,right:10,zIndex:8888,background:"#fff",borderRadius:14,padding:12,boxShadow:"0 12px 40px rgba(0,0,0,.22)",width:240,border:"1px solid #E2E8F0"}}>
      <div style={{fontSize:10,fontWeight:800,color:"#64748B",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Escolha o Assistente IA</div>
      {IA_APPS_V3.map(ia=><div key={ia.id} onClick={()=>{setIaSel(ia);setPainel(false);setAberto(true);}} style={{display:"flex",gap:10,alignItems:"center",padding:"9px 10px",borderRadius:9,cursor:"pointer",border:`1px solid ${ia.cor}22`,marginBottom:5,background:ia.cor+"08"}} onMouseEnter={e=>e.currentTarget.style.background=ia.cor+"18"} onMouseLeave={e=>e.currentTarget.style.background=ia.cor+"08"}>
        <span style={{fontSize:22}}>{ia.emoji}</span>
        <div><div style={{fontWeight:900,color:ia.cor,fontSize:13}}>{ia.name}</div><div style={{fontSize:10,color:"#64748B"}}>{ia.desc}</div></div>
      </div>)}
      <button onClick={()=>setPainel(false)} style={{...sc_.btn("ghost",{width:"100%",fontSize:11,marginTop:4})}}>✕ Fechar</button>
    </div>}
    {aberto&&iaSel&&<div style={{position:"fixed",inset:0,zIndex:9500,background:"rgba(0,0,0,.5)",display:"flex",flexDirection:"column"}}>
      <div style={{background:N,padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:20}}>{iaSel.emoji}</span><div><div style={{color:"#fff",fontWeight:900,fontSize:13}}>{iaSel.name}</div><div style={{color:"rgba(255,255,255,.45)",fontSize:10}}>{iaSel.url}</div></div></div>
        <div style={{display:"flex",gap:7}}>
          <button onClick={()=>{setIaSel(null);setAberto(false);setPainel(true);}} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",borderRadius:9,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:800}}>⟵ Trocar IA</button>
          <a href={iaSel.url} target="_blank" rel="noreferrer" style={{...sc_.btn("gold",{fontSize:11,textDecoration:"none"})}}>↗ Abrir no browser</a>
          <button onClick={()=>{setIaSel(null);setAberto(false);}} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",borderRadius:9,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:800}}>✕ Fechar</button>
        </div>
      </div>
      <div style={{flex:1,background:"#fff"}}><iframe src={iaSel.url} title={iaSel.name} style={{width:"100%",height:"100%",border:"none"}} allow="clipboard-read; clipboard-write"/></div>
      <div style={{background:AM,color:"#fff",padding:"5px 14px",fontSize:10,textAlign:"center",flexShrink:0}}>⚠️ Se não carregar, clique em "↗ Abrir no browser" — alguns sites bloqueiam incorporação.</div>
    </div>}
  </>;
}

// 2. DASHBOARD COMUNICACAO
const COMUN_APPS=[
  {id:"gmail",name:"Gmail",url:"https://mail.google.com",emoji:"📧",cor:"#EA4335"},
  {id:"outlook",name:"Outlook",url:"https://outlook.live.com",emoji:"📮",cor:"#0078D4"},
  {id:"whatsapp",name:"WhatsApp Web",url:"https://web.whatsapp.com",emoji:"💬",cor:"#25D366"},
  {id:"telegram",name:"Telegram Web",url:"https://web.telegram.org",emoji:"✈️",cor:"#0088CC"},
];
function DashboardComunicacao(){
  const [sel,setSel]=useState("gmail");
  const app=COMUN_APPS.find(a=>a.id===sel);
  return <div style={{display:"grid",gap:0,height:"calc(100vh - 120px)"}}>
    <div style={{display:"flex",background:N,borderRadius:"11px 11px 0 0",overflow:"hidden",flexShrink:0}}>
      {COMUN_APPS.map(a=><button key={a.id} onClick={()=>setSel(a.id)} style={{border:"none",cursor:"pointer",padding:"9px 12px",fontSize:11,fontWeight:800,flex:1,fontFamily:"inherit",background:sel===a.id?a.cor:N,color:sel===a.id?"#fff":"rgba(255,255,255,.45)",transition:"all .2s"}}><span style={{marginRight:4}}>{a.emoji}</span>{a.name}</button>)}
    </div>
    <div style={{flex:1,position:"relative",background:"#F8FAFC",borderRadius:"0 0 11px 11px",overflow:"hidden",border:`2px solid ${app.cor}33`,borderTop:"none"}}>
      <iframe key={sel} src={app.url} title={app.name} style={{width:"100%",height:"100%",border:"none"}} allow="clipboard-read; clipboard-write; microphone; camera"/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:`${app.cor}EE`,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:"#fff",fontSize:11,fontWeight:700}}>{app.emoji} {app.name}</span>
        <a href={app.url} target="_blank" rel="noreferrer" style={{background:"rgba(255,255,255,.9)",color:app.cor,padding:"3px 10px",borderRadius:9,fontSize:10,fontWeight:800,textDecoration:"none"}}>↗ Abrir em nova aba</a>
      </div>
    </div>
  </div>;
}

// 3. EXAMES PRONTUARIO
function ExamesProntuario({pac,up}){
  const [aba,setAba]=useState("lab");
  const [labRows,setLabRows]=useState(pac?.exames_lab_prontuario||[{data:"",neutro:"",plt:"",hgb:"",creat:"",tgo:"",tgp:"",obs:""}]);
  const upLab=(i,k,v)=>{const n=labRows.map((r,j)=>j===i?{...r,[k]:v}:r);setLabRows(n);up("exames_lab_prontuario",n);};
  const addLab=()=>{const n=[...labRows,{data:new Date().toLocaleDateString("pt-BR"),neutro:"",plt:"",hgb:"",creat:"",tgo:"",tgp:"",obs:""}];setLabRows(n);up("exames_lab_prontuario",n);};
  const [anatom,setAnatom]=useState(pac?.anatom||"");
  const [imagen,setImagen]=useState(pac?.imagen||"");
  const corVal=(k,v)=>{const n=+v;if(!v||isNaN(n))return N;const lim={neutro:[1500,500],plt:[100000,50000],hgb:[10,8]};if(lim[k])return n<lim[k][1]?VM:n<lim[k][0]?AM:VE;return N;};
  return <div style={{...sc_.card({background:"#F8FAFC",border:`1px solid ${T}44`}),marginBottom:8}}>
    <div style={{display:"flex",gap:0,background:N,borderRadius:9,overflow:"hidden",marginBottom:10}}>
      {[["lab","🧪 Lab"],["anatom","🔬 Anatom"],["imagem","🖼️ Imagem"]].map(([id,l])=><button key={id} onClick={()=>setAba(id)} style={{border:"none",cursor:"pointer",padding:"6px 8px",fontSize:10,fontWeight:800,flex:1,fontFamily:"inherit",background:aba===id?G:N,color:aba===id?"#fff":"rgba(255,255,255,.45)"}}>{l}</button>)}
    </div>
    {aba==="lab"&&<div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead><tr style={{background:N}}>{["Data","Neutro","PLT","Hgb","Creat","TGO","TGP","Obs",""].map(h=><th key={h} style={{color:G,padding:"4px 6px",textAlign:"left",fontSize:9,fontWeight:900,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{labRows.map((r,i)=><tr key={i} style={{borderBottom:"1px solid #E2E8F0"}}>
            {["data","neutro","plt","hgb","creat","tgo","tgp","obs"].map(k=><td key={k} style={{padding:"3px 4px"}}>
              <input value={r[k]||""} onChange={e=>upLab(i,k,e.target.value)} placeholder={k==="data"?new Date().toLocaleDateString("pt-BR"):"—"} style={{...sc_.inp,fontSize:10,padding:"3px 6px",width:k==="obs"?80:k==="data"?70:50,color:["neutro","plt","hgb"].includes(k)?corVal(k,r[k]):"#1E293B",fontWeight:["neutro","plt","hgb"].includes(k)&&r[k]?900:400}}/>
            </td>)}
            <td style={{padding:"3px 4px"}}><button onClick={()=>{const n=labRows.filter((_,j)=>j!==i);setLabRows(n);up("exames_lab_prontuario",n);}} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:12}}>✕</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div style={{display:"flex",gap:7,marginTop:7}}>
        <button onClick={addLab} style={{...sc_.btn("ghost",{fontSize:10,padding:"4px 10px"})}}>+ Linha</button>
        <div style={{fontSize:9,color:"#64748B",alignSelf:"center"}}><span style={{color:VM,fontWeight:700}}>■ Crítico</span>  <span style={{color:AM}}>■ Atenção</span>  <span style={{color:VE}}>■ Normal</span></div>
      </div>
    </div>}
    {aba==="anatom"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px",marginBottom:8}}>
        {[["Tipo histológico","histotipo"],["Grau","grau"],["Ki-67 (%)","ki67"],["Margens","margens"],["IHQ — ER/PR/HER2","ihq"],["Status linfonodal","linfonodos"]].map(([l,k])=><Fld key={k} l={l} val={pac?.[k]||""} set={v=>up(k,v)}/>)}
      </div>
      <Fld l="Laudo completo (resumo)" val={anatom} set={v=>{setAnatom(v);up("anatom",v);}} ta rows={3} ph="Ex: Adenocarcinoma ductal invasivo G2. Ki-67 35%. ER+ PR+ HER2−. Margens livres."/>
    </div>}
    {aba==="imagem"&&<div>
      <Fld l="Síntese dos exames de imagem (foco oncológico)" val={imagen} set={v=>{setImagen(v);up("imagen",v);}} ta rows={4} ph="TC 10/05/2026: massa hepática D 3,2cm (seg VI), adenopatia retroperitoneal 1,8cm. Resposta parcial (−30%)."/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 8px"}}>
        {[["Último exame de imagem","ultimo_exame_img"],["Data","data_img"],["Resposta","resp_img"]].map(([l,k])=><Fld key={k} l={l} val={pac?.[k]||""} set={v=>up(k,v)} ph={k==="resp_img"?"RC/RP/DE/DP":""}/>)}
      </div>
    </div>}
  </div>;
}

// 4. PRESCREVER DOENCA
const DOENCAS_RX=[
  {id:"sinusite",ico:"👃",nome:"Sinusite",items:[{n:"Amoxicilina+Clavulanato 875mg",d:"1 comp",f:"12/12h",dur:"7 dias",v:"VO"},{n:"Loratadina 10mg",d:"1 comp",f:"1×/dia",dur:"7 dias",v:"VO"},{n:"Prednisona 20mg",d:"1 comp",f:"1×/dia (manhã)",dur:"5 dias",v:"VO"}]},
  {id:"itu",ico:"🔵",nome:"ITU",items:[{n:"Ciprofloxacino 500mg",d:"1 comp",f:"12/12h",dur:"7 dias",v:"VO"},{n:"Fenazopiridina 200mg",d:"1 comp",f:"8/8h",dur:"2 dias",v:"VO"},{n:"Dipirona 1g",d:"1 comp",f:"6/6h",dur:"SN",v:"VO"}]},
  {id:"gastrite",ico:"🫃",nome:"Gastrite/DRGE",items:[{n:"Pantoprazol 40mg",d:"1 comp em jejum",f:"1×/dia",dur:"30 dias",v:"VO"},{n:"Domperidona 10mg",d:"1 comp",f:"8/8h (AC)",dur:"14 dias",v:"VO"},{n:"Metoclopramida 10mg",d:"1 comp",f:"8/8h",dur:"7 dias",v:"VO"}]},
  {id:"pressao",ico:"❤️",nome:"HAS",items:[{n:"Losartana 50mg",d:"1 comp",f:"1×/dia",dur:"Contínuo",v:"VO"},{n:"Hidroclorotiazida 25mg",d:"1 comp",f:"1×/dia (manhã)",dur:"Contínuo",v:"VO"},{n:"Anlodipino 5mg",d:"1 comp",f:"1×/dia",dur:"Contínuo",v:"VO"}]},
  {id:"dm",ico:"🩸",nome:"Diabetes (DM2)",items:[{n:"Metformina 850mg",d:"1 comp",f:"12/12h (AC)",dur:"Contínuo",v:"VO"},{n:"Glibenclamida 5mg",d:"1 comp",f:"1×/dia (café)",dur:"Contínuo",v:"VO"}]},
  {id:"febre",ico:"🌡️",nome:"Febre / Analgesia",items:[{n:"Paracetamol 750mg",d:"1 comp",f:"6/6h (máx 4g/d)",dur:"3-5 dias",v:"VO"},{n:"Ibuprofeno 600mg",d:"1 comp",f:"8/8h (AC)",dur:"3-5 dias",v:"VO"}]},
  {id:"alergia",ico:"🌸",nome:"Alergia / Urticária",items:[{n:"Loratadina 10mg",d:"1 comp",f:"1×/dia",dur:"7-14 dias",v:"VO"},{n:"Prednisona 20mg",d:"1 comp",f:"1×/dia (manhã)",dur:"5 dias",v:"VO"},{n:"Ranitidina 150mg",d:"1 comp",f:"12/12h",dur:"7 dias",v:"VO"}]},
  {id:"ansiedade",ico:"🧠",nome:"Ansiedade / Insônia",items:[{n:"Alprazolam 0,5mg",d:"1 comp",f:"À noite",dur:"30 dias (C-IV)",v:"VO"},{n:"Melatonina 3mg",d:"1 comp",f:"30min antes de dormir",dur:"30 dias",v:"VO"}]},
  {id:"dor_oncia",ico:"💊",nome:"Dor Oncológica — Escada OMS",items:[{n:"Dipirona 1g",d:"1 comp",f:"6/6h",dur:"Contínuo",v:"VO"},{n:"Codeína 30mg",d:"1 comp",f:"6/6h (SN)",dur:"Conforme dor",v:"VO"},{n:"Tramadol 50mg",d:"1 cap",f:"8/8h",dur:"Receituário B2",v:"VO"},{n:"Gabapentina 300mg",d:"1 cap",f:"8/8h",dur:"Neuropatia",v:"VO"}]},
  {id:"nausea_qt",ico:"🤢",nome:"Náuseas Pós-QT",items:[{n:"Ondansetrona 8mg",d:"1 comp",f:"8/8h",dur:"2d pós-QT",v:"VO"},{n:"Dexametasona 4mg",d:"1 comp",f:"12/12h",dur:"2d pós-QT",v:"VO"},{n:"Metoclopramida 10mg",d:"1 comp",f:"8/8h",dur:"2d",v:"VO"},{n:"Lorazepam 1mg",d:"1 comp",f:"À noite",dur:"2d",v:"VO"}]},
  {id:"infeccao_qt",ico:"🦠",nome:"Infecção em Imunossuprimido",items:[{n:"Ciprofloxacino 500mg",d:"1 comp",f:"12/12h",dur:"7 dias",v:"VO"},{n:"Fluconazol 150mg",d:"1 cap",f:"Dose única",dur:"1d",v:"VO"},{n:"Sulfametoxazol+TMP 800/160mg",d:"1 comp",f:"12/12h",dur:"Profilaxia PCP",v:"VO"}]},
  {id:"const_qt",ico:"💩",nome:"Constipação / Diarreia QT",items:[{n:"Lactulose 30mL",d:"1 dose",f:"12/12h",dur:"SN",v:"VO"},{n:"Bisacodil 5mg",d:"1 comp",f:"À noite",dur:"SN",v:"VO"},{n:"Loperamida 2mg",d:"2 comp início+1/2h",f:"Diarreia",dur:"Máx 16mg/d",v:"VO"}]},
];
function PrescreverDoenca({pac}){
  const [sel,setSel]=useState(null);
  const [itensSel,setItensSel]=useState([]);
  const [busca,setBusca]=useState("");
  const hoje=new Date().toLocaleDateString("pt-BR");
  const cab=`RECEITA MÉDICA\nData: ${hoje}\n${"═".repeat(50)}\n${HOSP}\n${AUTOR}\n${AUTOR2}\n${"═".repeat(50)}\nPaciente: ${pac?.nome||"___"}\nDiagnóstico: ${pac?.diag||"___"}\nAlergias: ${pac?.alerg||"Nenhuma conhecida"}\n${"─".repeat(50)}\n\n`;
  const toggle=(item)=>setItensSel(x=>x.some(i=>i.n===item.n)?x.filter(i=>i.n!==item.n):[...x,item]);
  const abrirImpressao=()=>{
    if(!itensSel.length)return;
    const corpo=cab+itensSel.map((m,i)=>`${i+1}. ${m.n}\n   Dose: ${m.d} · Frequência: ${m.f} · Duração: ${m.dur} · Via: ${m.v}`).join("\n\n")+`\n\n${"─".repeat(50)}\n${AUTOR}\nCRM-PB 17341\n\n_______________________\nAssinatura e carimbo`;
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Georgia,serif;padding:28px;font-size:13px;line-height:1.8}.btn{background:#B8860B;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:13px;cursor:pointer}@media print{.btn{display:none}}</style></head><body><pre>${corpo}</pre><button class="btn" onclick="window.print()">🖨️ Imprimir</button></body></html>`;
    const w=window.open("","_blank","width=700,height=600");
    if(w){w.document.open();w.document.write(html);w.document.close();}
  };
  const filtradas=DOENCAS_RX.filter(d=>!busca||d.nome.toLowerCase().includes(busca.toLowerCase()));
  return <div style={{display:"grid",gap:11}}>
    <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Buscar doença ou condição..." style={{...sc_.inp,fontSize:13}}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
      {filtradas.map(d=><button key={d.id} onClick={()=>setSel(sel?.id===d.id?null:d)} style={{border:`2px solid ${sel?.id===d.id?G:"#E2E8F0"}`,background:sel?.id===d.id?G+"15":"#F8FAFC",borderRadius:10,padding:"9px 6px",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all .15s"}}>
        <div style={{fontSize:22,marginBottom:4}}>{d.ico}</div>
        <div style={{fontSize:10,fontWeight:800,color:sel?.id===d.id?G:N,lineHeight:1.2}}>{d.nome}</div>
      </button>)}
    </div>
    {sel&&<div style={{...sc_.card({border:`2px solid ${G}44`,background:"#FFFBEB"})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <H3 ch={`${sel.ico} ${sel.nome} — Prescrição Padrão`} s={{margin:0}}/>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setItensSel(sel.items)} style={{...sc_.btn("ghost",{fontSize:10})}}>☑ Todos</button>
          <button onClick={abrirImpressao} style={{...sc_.btn("gold",{fontSize:10})}} disabled={!itensSel.length}>🖨 Imprimir</button>
        </div>
      </div>
      {sel.items.map((item,i)=>{const at=itensSel.some(x=>x.n===item.n);return <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",border:`1.5px solid ${at?G:"#E2E8F0"}`,borderRadius:9,padding:"8px 10px",marginBottom:6,background:at?G+"08":"#F8FAFC",cursor:"pointer"}} onClick={()=>toggle(item)}>
        <input type="checkbox" checked={at} onChange={()=>toggle(item)} style={{width:14,height:14,accentColor:G,marginTop:2,flexShrink:0}}/>
        <div style={{flex:1}}>
          <strong style={{color:N,fontSize:12}}>{item.n}</strong>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:3}}>
            {[{l:"Dose",v:item.d},{l:"Freq",v:item.f},{l:"Duração",v:item.dur},{l:"Via",v:item.v}].map(x=><span key={x.l} style={{background:N+"11",color:N,padding:"1px 6px",borderRadius:999,fontSize:9}}><strong>{x.l}:</strong> {x.v}</span>)}
          </div>
        </div>
      </div>;})}
      {itensSel.length>0&&<button onClick={abrirImpressao} style={{...sc_.btn("gold",{width:"100%",padding:10,fontSize:12,marginTop:4})}}>🖨️ Imprimir Receita ({itensSel.length} medicamento{itensSel.length>1?"s":""})</button>}
    </div>}
  </div>;
}

// 5. APAC COM FOTO
function APACComFoto({pac,up,addMsg}){
  const [foto,setFoto]=useState(pac?.foto||null);
  const [msgFin,setMsgFin]=useState("");
  const [msgsFinanceiro,setMsgsFinanceiro]=useState([{de:"Sistema",txt:"Canal APAC ativo. Médico e Financeiro conectados.",dt:new Date().toLocaleDateString("pt-BR"),tipo:"sistema"}]);
  const [apacStatus,setApacStatus]=useState("rascunho");
  const fileRef=useRef(null);const camRef=useRef(null);
  const STATUS_CFG={rascunho:{l:"Rascunho",c:"#64748B",bg:"#F8FAFC"},enviada:{l:"Enviada ao Financeiro",c:AM,bg:"#FFFBEB"},aprovada:{l:"✅ APAC Aprovada",c:VE,bg:"#EAF7EE"},glosada:{l:"⚠️ APAC Glosada",c:VM,bg:"#FEF2F2"}};
  const st=STATUS_CFG[apacStatus];
  const enviarFinanceiro=()=>{setApacStatus("enviada");const msg=`📋 APAC enviada\nPaciente: ${pac?.nome||"—"}\nProtocolo: ${pac?.trat||"—"}\nCID: ${pac?.cid||"—"}`;setMsgsFinanceiro(x=>[...x,{de:"Médico",txt:msg,dt:new Date().toLocaleDateString("pt-BR"),tipo:"apac"}]);addMsg&&addMsg("Médico","Financeiro",msg,"msg");alert("✅ APAC enviada ao Financeiro!");};
  const simularAprovacao=()=>{setApacStatus("aprovada");const msg="✅ APAC APROVADA!";setMsgsFinanceiro(x=>[...x,{de:"Financeiro",txt:msg,dt:new Date().toLocaleDateString("pt-BR"),tipo:"apac"}]);addMsg&&addMsg("Financeiro","Médico",msg,"msg");};
  const enviarMsgFin=()=>{if(!msgFin.trim())return;setMsgsFinanceiro(x=>[...x,{de:"Médico",txt:msgFin,dt:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),tipo:"msg"}]);addMsg&&addMsg("Médico","Financeiro",msgFin,"msg");setMsgFin("");};
  return <div style={{display:"grid",gap:12}}>
    <div style={{...sc_.card({background:st.bg,border:`2px solid ${st.c}44`}),display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase"}}>Status APAC</div><div style={{fontSize:16,fontWeight:900,color:st.c,marginTop:2}}>{st.l}</div></div>
      <div style={{display:"flex",gap:6}}>
        {apacStatus==="enviada"&&<button onClick={simularAprovacao} style={{...sc_.btn("green",{fontSize:10})}}>Simular aprovação →</button>}
        {(apacStatus==="rascunho"||apacStatus==="glosada")&&<Btn v="gold" ch="📤 Enviar ao Financeiro" s={{fontSize:11}} onClick={enviarFinanceiro}/>}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:12}}>
      <div style={{...sc_.card({textAlign:"center",padding:12})}}>
        <div style={{marginBottom:8,fontWeight:800,fontSize:10,color:N,textTransform:"uppercase"}}>Foto do Paciente</div>
        {foto?<img src={foto} alt="Paciente" style={{width:"100%",height:130,objectFit:"cover",borderRadius:9,marginBottom:8}}/>:<div style={{width:"100%",height:130,background:"#F1F5F9",borderRadius:9,display:"grid",placeItems:"center",marginBottom:8,fontSize:36,color:"#CBD5E1"}}>👤</div>}
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setFoto(ev.target.result);up("foto",ev.target.result);};r.readAsDataURL(f);}}/>
        <input ref={camRef} type="file" accept="image/*" capture="user" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setFoto(ev.target.result);up("foto",ev.target.result);};r.readAsDataURL(f);}}/>
        <div style={{display:"flex",gap:5}}>
          <button onClick={()=>camRef.current?.click()} style={{...sc_.btn("teal",{flex:1,fontSize:10,padding:"5px 3px"})}}>📷</button>
          <button onClick={()=>fileRef.current?.click()} style={{...sc_.btn("ghost",{flex:1,fontSize:10,padding:"5px 3px"})}}>📁</button>
          {foto&&<button onClick={()=>{setFoto(null);up("foto",null);}} style={{...sc_.btn("ghost",{fontSize:10,padding:"5px 7px"})}}>✕</button>}
        </div>
      </div>
      <div style={sc_.card()}>
        <H3 ch="Dados da APAC"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
          {[["Paciente","nome"],["CNS","cns"],["CPF","cpf"],["Nascimento","nasc"],["Diagnóstico / CID","diag"],["TNM","tnm"],["Estádio","estadio"],["Protocolo aprovado","trat"],["ECOG","ecog"],["Linha","linha"]].map(([l,k])=><div key={k} style={{marginBottom:7}}><div style={{fontSize:9,fontWeight:800,color:"#64748B",textTransform:"uppercase",marginBottom:2}}>{l}</div><div style={{fontWeight:700,color:N,fontSize:12,background:"#F8FAFC",borderRadius:6,padding:"4px 8px",border:"1px solid #E2E8F0"}}>{pac?.[k]||"—"}</div></div>)}
        </div>
      </div>
    </div>
    <div style={sc_.card({border:`2px solid ${G}44`})}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <H3 ch="💬 Canal Médico ↔ Financeiro" s={{margin:0}}/>
        <span style={{background:VE+"22",color:VE,padding:"2px 8px",borderRadius:999,fontSize:10,fontWeight:900}}>{msgsFinanceiro.length} mensagen{msgsFinanceiro.length!==1?"s":""}</span>
      </div>
      <div style={{maxHeight:150,overflowY:"auto",display:"flex",flexDirection:"column",gap:6,marginBottom:9}}>
        {msgsFinanceiro.map((m,i)=>{const eu=m.de==="Médico";return <div key={i} style={{display:"flex",flexDirection:eu?"row-reverse":"row",gap:6}}><div style={{maxWidth:"80%"}}><div style={{fontSize:8,color:"#94A3B8",marginBottom:2,textAlign:eu?"right":"left"}}>{m.de} · {m.dt}</div><div style={{background:eu?N:m.de==="Financeiro"?"#EAF7EE":"#F1F5F9",color:eu?"#fff":"#374151",borderRadius:eu?"11px 11px 3px 11px":"11px 11px 11px 3px",padding:"6px 10px",fontSize:11,lineHeight:1.5}}>{m.txt}</div></div></div>;})}
      </div>
      <div style={{display:"flex",gap:7}}>
        <input value={msgFin} onChange={e=>setMsgFin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enviarMsgFin()} placeholder="Mensagem ao Financeiro..." style={{...sc_.inp,flex:1,fontSize:11}}/>
        <Btn v="navy" ch="→" s={{fontSize:11}} onClick={enviarMsgFin}/>
      </div>
    </div>
  </div>;
}

// 6. GRAFICO PRODUCAO
const DADOS_PRODUCAO=[
  {mes:"Jan",sessoes:72,meta:90,valor:192600},{mes:"Fev",sessoes:68,meta:90,valor:181700},
  {mes:"Mar",sessoes:84,meta:90,valor:224900},{mes:"Abr",sessoes:91,meta:90,valor:243600},
  {mes:"Mai",sessoes:88,meta:90,valor:235300},{mes:"Jun",sessoes:76,meta:90,valor:203200},
];
function GraficoProducao(){
  const maxSes=Math.max(...DADOS_PRODUCAO.map(d=>d.sessoes),90);
  const [hovIdx,setHovIdx]=useState(null);
  return <div style={{display:"grid",gap:12}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      {[{l:"Sessões no mês",v:"88",sub:"Meta: 90",c:T},{l:"Faturamento SUS",v:"R$ 235.300",sub:"Maio/2026",c:G},{l:"Margem Líquida",v:"R$ 42.600",sub:"18,1% ↑",c:VE}].map(x=><div key={x.l} style={{...sc_.card({borderTop:`3px solid ${x.c}`,textAlign:"center",padding:12})}}>
        <div style={{fontSize:18,fontWeight:900,color:x.c}}>{x.v}</div>
        <div style={{fontSize:11,fontWeight:700,color:N,marginTop:2}}>{x.l}</div>
        <div style={{fontSize:9,color:"#94A3B8"}}>{x.sub}</div>
      </div>)}
    </div>
    <div style={sc_.card()}>
      <H3 ch="📊 Sessões de QT — Produção Mensal"/>
      <div style={{display:"flex",alignItems:"flex-end",gap:8,height:140,padding:"0 4px",position:"relative"}}>
        <div style={{position:"absolute",left:0,right:0,bottom:`${(90/maxSes)*140}px`,borderTop:`2px dashed ${VM}44`,display:"flex",alignItems:"center"}}>
          <span style={{fontSize:8,color:VM,marginLeft:4,background:"#fff",padding:"0 3px",fontWeight:700}}>Meta 90</span>
        </div>
        {DADOS_PRODUCAO.map((d,i)=>{const h=(d.sessoes/maxSes)*120;const atingiu=d.sessoes>=d.meta;return <div key={i} onMouseEnter={()=>setHovIdx(i)} onMouseLeave={()=>setHovIdx(null)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer"}}>
          {hovIdx===i&&<div style={{position:"absolute",bottom:h+16,background:N,color:"#fff",borderRadius:7,padding:"4px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap",zIndex:10,pointerEvents:"none"}}>{d.sessoes} sessões · R$ {d.valor.toLocaleString("pt-BR")}</div>}
          <div style={{width:"100%",height:h,background:atingiu?VE:T,borderRadius:"5px 5px 0 0",transition:"height .3s",opacity:hovIdx===i?1:.85}}/>
        </div>;})}
      </div>
      <div style={{display:"flex",gap:8,padding:"0 4px",marginTop:4}}>
        {DADOS_PRODUCAO.map((d,i)=><div key={i} style={{flex:1,textAlign:"center"}}><div style={{fontSize:9,fontWeight:900,color:N}}>{d.mes}</div><div style={{fontSize:8,color:d.sessoes>=d.meta?VE:"#94A3B8",fontWeight:700}}>{d.sessoes}</div></div>)}
      </div>
      <div style={{display:"flex",gap:12,marginTop:10,fontSize:10,color:"#64748B"}}><span>🟢 Meta atingida (≥90)</span><span>🔵 Abaixo da meta</span></div>
    </div>
    <div style={sc_.card()}>
      <H3 ch="📦 Estoque EV — Alertas"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
        {[["Oxaliplatina 100mg",12,8],["Bevacizumabe 400mg",2,4],["Carboplatina 450mg",6,8],["Paclitaxel 300mg",9,6]].map(([n,qt,min])=><div key={n} style={{display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${qt<=min?VM:"#E2E8F0"}44`,background:qt<=min?"#FFF5F5":"#F8FAFC",borderRadius:8,padding:"5px 9px",fontSize:11}}>
          <span style={{color:N,fontWeight:qt<=min?700:400}}>{n}</span>
          <div style={{display:"flex",gap:5,alignItems:"center"}}><strong style={{color:qt<=min?VM:VE}}>{qt}</strong>{qt<=min&&<span style={{background:VM,color:"#fff",borderRadius:999,padding:"0 5px",fontSize:8,fontWeight:900}}>⚠</span>}</div>
        </div>)}
      </div>
    </div>
  </div>;
}

// 7. TRIAGEM ENFERMAGEM EMITE
function TriagemEnfermagemEmite({pac,addMsg,onEnviar}){
  const [step,setStep]=useState(1);
  const [d,setD]=useState({nome:pac?.nome||"",ciclo:"",proto:pac?.trat||"",pas:"",pad:"",fc:"",temp:"",spo2:"",fr:"",neutro:"",plt:"",hgb:"",creat:"",ecog:"",ctcae:{},conclusao:"",obs:"",enfermeira:"",hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})});
  const upD=(k,v)=>setD(x=>({...x,[k]:v}));
  const upCT=(k,v)=>setD(x=>({...x,ctcae:{...x.ctcae,[k]:v}}));
  const enviar=()=>{
    const triagem={...d,data:new Date().toLocaleDateString("pt-BR"),id:Date.now()};
    const resumo=`📋 TRIAGEM PRÉ-QT\nPaciente: ${d.nome} · ${d.ciclo}\nPA: ${d.pas}/${d.pad} · FC: ${d.fc} · Temp: ${d.temp}°C · SPO₂: ${d.spo2}%\nNeutro: ${d.neutro} · PLT: ${d.plt} · Hgb: ${d.hgb}\nECOG: ${d.ecog}\nCTCAE: ${Object.entries(d.ctcae).filter(([,v])=>v&&v!=="G0").map(([k,v])=>`${k}:${v}`).join(" · ")||"Sem toxicidade"}\n\nCONCLUSÃO: ${d.conclusao}\n${d.obs?"Obs: "+d.obs:""}`;
    addMsg&&addMsg("Enfermagem","Médico",resumo,"triagem");
    onEnviar&&onEnviar(triagem);
    setStep(6);
  };
  const STEPS=["Identificação","Sinais Vitais","Laboratorial","ECOG + CTCAE","Conclusão","Enviado"];
  return <div>
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {STEPS.map((s,i)=><div key={i} style={{flex:1,textAlign:"center",cursor:i<step?"pointer":"default"}} onClick={()=>i+1<step&&setStep(i+1)}>
        <div style={{width:24,height:24,borderRadius:"50%",margin:"0 auto 3px",display:"grid",placeItems:"center",fontSize:10,fontWeight:900,background:step===i+1?T:step>i+1?VE:"#E2E8F0",color:step>=i+1?"#fff":"#94A3B8"}}>{step>i+1?"✓":i+1}</div>
        <div style={{fontSize:8,fontWeight:700,color:step===i+1?T:"#94A3B8",textTransform:"uppercase"}}>{s}</div>
      </div>)}
    </div>
    {step===1&&<div>
      {[["Nome do paciente","nome"],["Nº do ciclo","ciclo"],["Protocolo de QT","proto"],["Enfermeira responsável","enfermeira"]].map(([l,k])=><Fld key={k} l={l} val={d[k]} set={v=>upD(k,v)}/>)}
      <Btn v="teal" ch="Próximo: Sinais Vitais →" s={{width:"100%",padding:10}} dis={!d.nome||!d.ciclo} onClick={()=>setStep(2)}/>
    </div>}
    {step===2&&<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
        {[["PA Sistólica","pas","120"],["PA Diastólica","pad","80"],["FC (bpm)","fc","72"],["FR (irpm)","fr","16"],["Temperatura (°C)","temp","36,8"],["SPO₂ (%)","spo2","97"]].map(([l,k,ph])=><Fld key={k} l={l} val={d[k]} set={v=>upD(k,v)} ph={ph}/>)}
      </div>
      {d.temp&&+d.temp.replace(",",".")>=37.8&&<div style={{background:"#FEF2F2",border:`1px solid ${VM}`,borderRadius:8,padding:"7px 10px",marginBottom:8,color:VM,fontWeight:700,fontSize:11}}>🚨 Temp ≥ 37,8°C — Investigar neutropenia febril!</div>}
      <div style={{display:"flex",gap:8}}><Btn v="ghost" ch="← Voltar" onClick={()=>setStep(1)}/><Btn v="teal" ch="Próximo →" s={{flex:1,padding:10}} onClick={()=>setStep(3)}/></div>
    </div>}
    {step===3&&<div>
      <div style={{background:"#EFF9FF",borderRadius:9,padding:"7px 10px",marginBottom:9,fontSize:11,color:T}}>💡 Mínimos para QT: Neutro ≥ 1.500 · PLT ≥ 100.000 · Hgb ≥ 8,0 g/dL</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
        {[["Neutrófilos (/mm³)","neutro"],["Plaquetas (/mm³)","plt"],["Hemoglobina (g/dL)","hgb"],["Creatinina (mg/dL)","creat"]].map(([l,k])=><div key={k}><Fld l={l} val={d[k]} set={v=>upD(k,v)}/>{k==="neutro"&&d.neutro&&+d.neutro<1500&&<p style={{color:VM,fontSize:9,fontWeight:700,margin:"-6px 0 6px"}}>⚠ Abaixo do limite!</p>}{k==="plt"&&d.plt&&+d.plt<100000&&<p style={{color:VM,fontSize:9,fontWeight:700,margin:"-6px 0 6px"}}>⚠ Plaquetopenia!</p>}</div>)}
      </div>
      <div style={{display:"flex",gap:8}}><Btn v="ghost" ch="← Voltar" onClick={()=>setStep(2)}/><Btn v="teal" ch="Próximo →" s={{flex:1,padding:10}} onClick={()=>setStep(4)}/></div>
    </div>}
    {step===4&&<div>
      <H3 ch="ECOG Performance Status"/>
      {["0 — Ativo, sem restrição","1 — Restrição leve, ambulatorial","2 — Acamado <50% do tempo","3 — Acamado >50%","4 — Incapaz, totalmente dependente"].map((e,i)=><label key={i} style={{display:"flex",gap:9,alignItems:"center",border:`1.5px solid ${d.ecog===String(i)?T:"#CBD5E1"}`,borderRadius:8,padding:"6px 9px",cursor:"pointer",background:d.ecog===String(i)?"#EFF9FF":"#F8FAFC",marginBottom:5}}><input type="radio" checked={d.ecog===String(i)} onChange={()=>upD("ecog",String(i))} style={{accentColor:T}}/><span style={{fontSize:11}}><strong>{i}</strong> — {e.replace(/\d — /,"")}</span></label>)}
      <H3 ch="Toxicidade CTCAE (principais)" s={{marginTop:10}}/>
      {[["nausea","Náusea"],["vomito","Vômito"],["diarreia","Diarreia"],["fadiga","Fadiga"],["neuropatia","Neuropatia"],["mucosite","Mucosite"]].map(([id,nome])=><div key={id} style={{marginBottom:7}}>
        <div style={{fontSize:11,fontWeight:700,color:N,marginBottom:3}}>{nome}</div>
        <div style={{display:"flex",gap:4}}>
          {["G0","G1","G2","G3","G4"].map(g=>{const sel=(d.ctcae[id]||"G0")===g;const cc={G0:VE,G1:"#84CC16",G2:AM,G3:"#F97316",G4:VM}[g];return <button key={g} onClick={()=>upCT(id,g)} style={{flex:1,border:`1.5px solid ${sel?cc:"#CBD5E1"}`,background:sel?cc:"#F8FAFC",color:sel?"#fff":"#64748B",borderRadius:6,padding:"4px 2px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"inherit"}}>{g}</button>;})}
        </div>
      </div>)}
      <div style={{display:"flex",gap:8,marginTop:8}}><Btn v="ghost" ch="← Voltar" onClick={()=>setStep(3)}/><Btn v="teal" ch="Próximo →" s={{flex:1,padding:10}} dis={!d.ecog} onClick={()=>setStep(5)}/></div>
    </div>}
    {step===5&&<div>
      <H3 ch="Conclusão da Triagem de Enfermagem"/>
      {[{v:"✅ LIBERAR — QT apto conforme critérios",c:VE,bg:"#EAF7EE"},{v:"⏸ ADIAR — Aguardar reavaliação médica",c:AM,bg:"#FFFBEB"},{v:"⚠️ ATENÇÃO — Comunicar médico antes de iniciar",c:T,bg:"#EFF9FF"},{v:"🚨 NÃO LIBERAR — Contraindicado",c:VM,bg:"#FEF2F2"}].map(o=><button key={o.v} onClick={()=>upD("conclusao",o.v)} style={{display:"block",width:"100%",border:`2px solid ${d.conclusao===o.v?o.c:"#CBD5E1"}`,borderRadius:10,padding:"10px 12px",fontWeight:900,cursor:"pointer",background:d.conclusao===o.v?o.bg:"#F8FAFC",color:d.conclusao===o.v?o.c:N,fontSize:12,textAlign:"left",marginBottom:5,fontFamily:"inherit"}}>{o.v}</button>)}
      <Fld l="Observações adicionais" val={d.obs} set={v=>upD("obs",v)} ta rows={2}/>
      <div style={{background:"#FFFBEB",border:`1px solid ${AM}44`,borderRadius:8,padding:"6px 10px",marginBottom:9,fontSize:10,color:AM}}>⚠️ Avaliação de enfermagem. Liberação final é responsabilidade do médico.</div>
      <div style={{display:"flex",gap:8}}><Btn v="ghost" ch="← Voltar" onClick={()=>setStep(4)}/><Btn v="gold" ch="📤 Enviar Triagem ao Médico" s={{flex:1,padding:11}} dis={!d.conclusao} onClick={enviar}/></div>
    </div>}
    {step===6&&<div style={{textAlign:"center",padding:24}}>
      <div style={{fontSize:56,marginBottom:12}}>✅</div>
      <h3 style={{color:VE,margin:"0 0 6px",fontSize:18}}>Triagem Enviada!</h3>
      <p style={{color:"#64748B",fontSize:13,marginBottom:16}}>O médico recebeu o resumo da triagem de <strong>{d.nome}</strong>.</p>
      <div style={{background:"#EAF7EE",borderRadius:10,padding:12,marginBottom:16,textAlign:"left"}}>
        <div style={{fontWeight:900,color:VE,fontSize:12,marginBottom:5}}>Conclusão: {d.conclusao}</div>
        <div style={{fontSize:11,color:"#374151"}}>Neutro: {d.neutro||"—"} · PLT: {d.plt||"—"} · Hgb: {d.hgb||"—"}</div>
      </div>
      <Btn v="teal" ch="+ Nova Triagem" s={{fontSize:13,padding:11,width:"100%"}} onClick={()=>{setStep(1);setD({nome:"",ciclo:"",proto:pac?.trat||"",pas:"",pad:"",fc:"",temp:"",spo2:"",fr:"",neutro:"",plt:"",hgb:"",creat:"",ecog:"",ctcae:{},conclusao:"",obs:"",enfermeira:"",hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})});}}/>
    </div>}
  </div>;
}

// 8. TRIAGEM MEDICO RECEBE
function TriagemMedicoRecebeOld({triagens,addMsg,onConfirmar}){
  const [status,setStatus]=useState({});
  const confirmar=(id,acao)=>{
    setStatus(x=>({...x,[id]:acao}));
    const t=triagens.find(t=>t.id===id);
    const msg=acao==="liberar"?`✅ QT LIBERADA\nPaciente: ${t?.nome} · ${t?.ciclo}\nMédico: ${AUTOR}`:`⛔ QT SUSPENSA\nPaciente: ${t?.nome} · ${t?.ciclo}`;
    addMsg&&addMsg("Médico","Enfermagem",msg,acao==="liberar"?"ciclo":"alerta");
    onConfirmar&&onConfirmar({id,acao,nome:t?.nome});
  };
  if(!triagens?.length)return <div style={{textAlign:"center",padding:28,color:"#94A3B8"}}><div style={{fontSize:32,marginBottom:8}}>🩺</div><p style={{fontSize:12}}>Nenhuma triagem pendente no momento.</p></div>;
  return <div style={{display:"grid",gap:10}}>
    <H2 ch="🩺 Triagens Recebidas — Confirmar Liberação QT"/>
    {triagens.map(t=>{const st=status[t.id];const alertas=[];if(t.neutro&&+t.neutro<1500)alertas.push(`Neutro: ${t.neutro} ⚠️`);if(t.plt&&+t.plt<100000)alertas.push(`PLT: ${t.plt} ⚠️`);if(t.temp&&+t.temp.replace(",",".")>=37.8)alertas.push(`Temp: ${t.temp}°C 🚨`);
    return <div key={t.id} style={{...sc_.card({border:`2px solid ${st==="liberar"?VE:st==="suspender"?VM:T}44`,background:st==="liberar"?"#F0FDF4":st==="suspender"?"#FFF5F5":"#fff"})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
        <div><strong style={{color:N,fontSize:13}}>{t.nome}</strong><div style={{color:"#64748B",fontSize:10,marginTop:2}}>{t.proto} · {t.ciclo} · {t.data} {t.hora}</div>{t.enfermeira&&<div style={{color:"#94A3B8",fontSize:10}}>Triagem: {t.enfermeira}</div>}</div>
        {st&&<span style={{background:st==="liberar"?VE:VM,color:"#fff",borderRadius:999,padding:"3px 10px",fontSize:10,fontWeight:900}}>{st==="liberar"?"✅ Liberado":"⛔ Suspenso"}</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:8}}>
        {[["PA",`${t.pas}/${t.pad}`],["FC",t.fc],["Temp",`${t.temp}°C`],["SPO₂",`${t.spo2}%`],["Neutro",t.neutro],["PLT",t.plt],["Hgb",t.hgb],["ECOG",t.ecog]].map(([l,v])=><div key={l} style={{background:"#F8FAFC",borderRadius:7,padding:"4px 6px",textAlign:"center"}}><div style={{fontSize:8,color:"#94A3B8"}}>{l}</div><div style={{fontSize:11,fontWeight:900,color:N}}>{v||"—"}</div></div>)}
      </div>
      {alertas.length>0&&<div style={{background:"#FEF2F2",border:`1px solid ${VM}44`,borderRadius:8,padding:"6px 9px",marginBottom:8}}><strong style={{color:VM,fontSize:11}}>⚠️ Alertas: </strong><span style={{color:VM,fontSize:11}}>{alertas.join(" · ")}</span></div>}
      <div style={{background:"#F8FAFC",borderRadius:8,padding:"6px 9px",marginBottom:9}}><strong style={{color:N,fontSize:10}}>Conclusão da Enfermagem: </strong><span style={{fontSize:11,color:"#374151"}}>{t.conclusao||"—"}</span></div>
      {!st&&<div style={{display:"flex",gap:8}}><button onClick={()=>confirmar(t.id,"liberar")} style={{...sc_.btn("green",{flex:1,padding:9,fontSize:12})}}>✅ Liberar QT</button><button onClick={()=>confirmar(t.id,"suspender")} style={{...sc_.btn("red",{flex:1,padding:9,fontSize:12})}}>⛔ Suspender</button></div>}
    </div>;})}
  </div>;
}

// 9. CHAT ABA UNIVERSAL
function ChatAba({mensagens,addMsg,de="Médico"}){
  const [aberto,setAberto]=useState(false);
  const [txt,setTxt]=useState("");
  const [para,setPara]=useState("Todos");
  const [filtro,setFiltro]=useState("Todos");
  const bottomRef=useRef(null);
  const SETORES=["Todos","Médico","Farmácia","Enfermagem","Recepção","Assistência Social","Paciente"];
  const CORES_S={"Médico":N,"Farmácia":VE,"Enfermagem":T,"Recepção":G,"Assistência Social":"#7C3AED","Paciente":"#6d28d9","Sistema":"#64748B"};
  const filtradas=(mensagens||[]).filter(m=>filtro==="Todos"||m.de===filtro||m.para===filtro).slice(-20);
  const naoLidas=(mensagens||[]).filter(m=>m.para===de&&m.lida===false).length;
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[mensagens,aberto]);
  const enviar=()=>{if(!txt.trim())return;addMsg&&addMsg(de,para,txt,"msg");setTxt("");};
  return <div style={{marginTop:16}}>
    <button onClick={()=>setAberto(a=>!a)} style={{...sc_.btn("navy",{width:"100%",padding:9,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:7})}}>
      <span>💬 Chat da Equipe</span>
      {naoLidas>0&&<span style={{background:VM,color:"#fff",borderRadius:999,padding:"0 6px",fontSize:10,fontWeight:900}}>{naoLidas}</span>}
      <span>{aberto?"▲":"▼"}</span>
    </button>
    {aberto&&<div style={{border:`2px solid ${N}44`,borderRadius:"0 0 11px 11px",overflow:"hidden",marginTop:-2}}>
      <div style={{background:N,display:"flex",overflowX:"auto"}}>
        {SETORES.map(s=><button key={s} onClick={()=>setFiltro(s)} style={{border:"none",cursor:"pointer",padding:"5px 9px",fontSize:9,fontWeight:800,whiteSpace:"nowrap",fontFamily:"inherit",background:filtro===s?G:N,color:filtro===s?"#fff":"rgba(255,255,255,.45)"}}>{s==="Todos"?"Todos":s.split(" ")[0]}</button>)}
      </div>
      <div style={{background:"#F8FAFC",padding:10,maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
        {filtradas.length===0&&<p style={{color:"#94A3B8",textAlign:"center",fontSize:11}}>Sem mensagens.</p>}
        {filtradas.map((m,i)=>{const eu=m.de===de;const cor=CORES_S[m.de]||T;return <div key={i} style={{display:"flex",flexDirection:eu?"row-reverse":"row",gap:5}}><div style={{maxWidth:"78%"}}><div style={{display:"flex",gap:5,marginBottom:2,flexDirection:eu?"row-reverse":"row"}}><span style={{background:cor,color:"#fff",padding:"0px 5px",borderRadius:999,fontSize:8,fontWeight:900}}>{m.de}</span>{m.para!=="Todos"&&<span style={{fontSize:8,color:"#94A3B8"}}>→ {m.para}</span>}</div><div style={{background:eu?N:"#fff",color:eu?"#fff":"#374151",borderRadius:eu?"11px 11px 3px 11px":"11px 11px 11px 3px",padding:"5px 9px",fontSize:11,lineHeight:1.5,border:eu?"none":"1px solid #E2E8F0"}}>{m.txt}</div></div></div>;})}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"7px 9px",background:"#fff",borderTop:"1px solid #E2E8F0"}}>
        <div style={{marginBottom:6}}>
          <div style={{fontSize:9,color:"#64748B",fontWeight:800,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Enviar para:</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {SETORES.filter(s=>s!=="Todos").map(s=><button key={s} onClick={()=>setPara(s)} style={{fontSize:9,padding:"4px 9px",borderRadius:999,border:"none",cursor:"pointer",fontWeight:900,fontFamily:"inherit",background:para===s?N:G+"22",color:para===s?"#fff":G,transition:"all .15s"}}>{s}</button>)}
          </div>
        </div>
        <div style={{display:"flex",gap:5}}><input value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enviar()} placeholder={`Mensagem → ${para}...`} style={{...sc_.inp,flex:1,fontSize:11}}/><Btn v="teal" ch="→" s={{padding:"5px 11px"}} onClick={enviar}/></div>
      </div>
    </div>}
  </div>;
}

// 10. VIDEOS YOUTUBE
const VIDEOS_EDU=[
  {t:"O que é câncer?",id:"kPm_YKH2R8s",dur:"4 min",cat:"Básico",cor:N},
  {t:"Como funciona a quimioterapia?",id:"Ah9HL1Fdbyw",dur:"7 min",cat:"Tratamento",cor:T},
  {t:"Alimentação durante o tratamento",id:"5aw-P4NAXYU",dur:"5 min",cat:"Nutrição",cor:VE},
  {t:"Sinais de alarme — quando ir ao PS",id:"BpN6JKi4ggs",dur:"3 min",cat:"Urgência",cor:VM},
  {t:"Suporte psicológico e família",id:"5XFBIXR0vts",dur:"8 min",cat:"Bem-estar",cor:"#7C3AED"},
  {t:"Direitos do paciente com câncer",id:"H0gFjnxBuAQ",dur:"6 min",cat:"Direitos",cor:AM},
  {t:"Cuidados com o cateter",id:"a2RpwxGhSQo",dur:"4 min",cat:"Cuidados",cor:"#0EA5E9"},
];
function VideosYouTube(){
  const [sel,setSel]=useState(null);
  const [filtro,setFiltro]=useState("Todos");
  const cats=["Todos",...new Set(VIDEOS_EDU.map(v=>v.cat))];
  const filtrados=filtro==="Todos"?VIDEOS_EDU:VIDEOS_EDU.filter(v=>v.cat===filtro);
  return <div>
    <H2 ch="🎬 Vídeos Educativos — Oncologia"/>
    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>{cats.map(c=><button key={c} onClick={()=>setFiltro(c)} style={{...sc_.btn(filtro===c?"navy":"ghost",{fontSize:10,padding:"3px 10px"})}}>{c}</button>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      {filtrados.map((v,i)=><div key={i} onClick={()=>setSel(v)} style={{...sc_.card({padding:0,overflow:"hidden",cursor:"pointer",transition:"transform .2s"})}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}>
        <div style={{position:"relative",background:v.cor,height:75}}>
          <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.t} style={{width:"100%",height:"100%",objectFit:"cover",opacity:.85}} onError={e=>{e.target.style.display="none";}}/>
          <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center"}}><div style={{width:32,height:32,background:"rgba(255,0,0,.9)",borderRadius:"50%",display:"grid",placeItems:"center",fontSize:14}}>▶</div></div>
        </div>
        <div style={{padding:"7px 9px"}}><div style={{fontWeight:800,fontSize:10,color:N,lineHeight:1.3,marginBottom:4}}>{v.t}</div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{background:v.cor+"22",color:v.cor,padding:"1px 5px",borderRadius:999,fontSize:8,fontWeight:900}}>{v.cat}</span><span style={{fontSize:8,color:"#94A3B8"}}>{v.dur}</span></div></div>
      </div>)}
    </div>
    {sel&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:560,overflow:"hidden"}}>
        <div style={{background:N,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{color:"#fff",fontWeight:800,fontSize:12}}>{sel.t}</div>
          <div style={{display:"flex",gap:6}}><a href={`https://www.youtube.com/watch?v=${sel.id}`} target="_blank" rel="noreferrer" style={{...sc_.btn("gold",{fontSize:10,padding:"4px 10px",textDecoration:"none"})}}>▶ Abrir no YouTube</a><button onClick={()=>setSel(null)} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",borderRadius:9,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:800}}>✕</button></div>
        </div>
        <div style={{position:"relative",paddingBottom:"56.25%"}}><iframe src={`https://www.youtube.com/embed/${sel.id}?autoplay=1&rel=0&modestbranding=1`} title={sel.t} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none"}}/></div>
        <div style={{padding:"8px 12px",background:"#F8FAFC",display:"flex",justifyContent:"space-between",fontSize:10,color:"#64748B"}}><span>{sel.cat} · {sel.dur}</span><span>Hospital do Bem · Patos-PB</span></div>
      </div>
    </div>}
  </div>;
}

// 11. CARTEIRINHA NOVA
function CarteirinhaNova({pac}){
  const [frente,setFrente]=useState(true);
  const sc2=(pac?.peso&&pac?.altura)?(0.016667*Math.pow(+pac.peso,.5)*Math.pow(+pac.altura,.5)).toFixed(2):"—";
  const imprimir=()=>{
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Georgia,serif;margin:0;padding:20px;background:#fff}.card{width:250px;background:linear-gradient(135deg,${N},#0d2347);border-radius:12px;padding:14px;color:#fff;margin-bottom:10px}.btn{background:${G};color:#fff;border:none;padding:8px 18px;border-radius:8px;font-size:12px;cursor:pointer;margin-top:12px}@media print{.btn{display:none}}</style></head><body>
    <div class="card"><div style="font-size:9px;opacity:.6">${HOSP}</div><div style="font-size:14px;font-weight:900;margin:6px 0 2px">${pac?.nome||"—"}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:8px"><div><div style="font-size:8px;opacity:.5">Diagnóstico</div><div style="font-size:11px;font-weight:700">${(pac?.diag||"—").slice(0,20)}</div></div><div><div style="font-size:8px;opacity:.5">Protocolo</div><div style="font-size:11px;font-weight:700">${(pac?.trat||"—").slice(0,15)}</div></div><div><div style="font-size:8px;opacity:.5">ECOG</div><div style="font-size:11px;font-weight:700">${pac?.ecog||"—"}</div></div><div><div style="font-size:8px;opacity:.5">SC</div><div style="font-size:11px;font-weight:700">${sc2} m²</div></div></div></div>
    <div class="card" style="background:linear-gradient(135deg,${T},#1a4a5c)"><div style="font-size:9px;opacity:.6">Alergias</div><div style="font-size:12px;font-weight:900;margin:4px 0">${pac?.alerg||"Nenhuma conhecida"}</div><div style="font-size:9px;opacity:.6;margin-top:6px">Medicações</div><div style="font-size:10px;margin-top:2px">${(pac?.meds||"—").slice(0,60)}</div><div style="margin-top:8px;font-size:9px;opacity:.5">${AUTOR2}</div></div>
    <button class="btn" onclick="window.print()">🖨️ Imprimir Carteirinha</button></body></html>`;
    const w=window.open("","_blank","width=320,height=500");
    if(w){w.document.open();w.document.write(html);w.document.close();}
  };
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
    <div onClick={()=>setFrente(f=>!f)} style={{width:280,minHeight:160,borderRadius:14,overflow:"hidden",cursor:"pointer",userSelect:"none",boxShadow:"0 8px 32px rgba(15,23,42,.22)",transition:"transform .3s"}}>
      {frente
        ?<div style={{background:`linear-gradient(135deg,${N} 0%,#0d2347 60%,${T}88 100%)`,height:"100%",minHeight:160,padding:"14px 16px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{color:G,fontSize:8,fontWeight:900,letterSpacing:1.5,textTransform:"uppercase"}}>Hospital do Bem</div><div style={{color:"rgba(255,255,255,.4)",fontSize:7,marginTop:1}}>Oncologia Clínica · Patos/PB</div></div><div style={{width:28,height:28,background:`linear-gradient(135deg,${G},${AM})`,borderRadius:7,display:"grid",placeItems:"center",fontSize:14}}>⚕</div></div>
          <div><div style={{color:"#fff",fontSize:15,fontWeight:900,lineHeight:1.2,marginBottom:3}}>{pac?.nome?.split(" ").slice(0,3).join(" ")||"Nome do Paciente"}</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{pac?.diag&&<span style={{background:G+"33",border:`1px solid ${G}55`,color:G,padding:"1px 7px",borderRadius:999,fontSize:8,fontWeight:900}}>{pac.diag.split(" ").slice(0,3).join(" ")}</span>}{pac?.trat&&<span style={{background:T+"33",color:T,padding:"1px 7px",borderRadius:999,fontSize:8,fontWeight:700}}>{pac.trat.split(" ")[0]}</span>}</div></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 10px"}}>{[["ECOG",pac?.ecog||"—"],["SC",`${sc2}m²`],["Linha",pac?.linha?.split(" ")[0]||"—"]].map(([l,v])=><div key={l}><div style={{color:"rgba(255,255,255,.4)",fontSize:7,textTransform:"uppercase"}}>{l}</div><div style={{color:"#fff",fontSize:11,fontWeight:900}}>{v}</div></div>)}</div><div style={{fontSize:8,color:"rgba(255,255,255,.25)",textAlign:"right"}}><div>Toque para virar</div><div style={{color:G,marginTop:1,fontWeight:700}}>▶</div></div></div>
        </div>
        :<div style={{background:`linear-gradient(135deg,${T} 0%,#1a4a5c 100%)`,height:"100%",minHeight:160,padding:"14px 16px",display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><div style={{color:G,fontSize:8,fontWeight:900,letterSpacing:1,textTransform:"uppercase"}}>Informações Clínicas</div><div style={{fontSize:8,color:"rgba(255,255,255,.3)"}}>◀ Virar</div></div>
          {[{l:"⚠️ ALERGIAS",v:pac?.alerg||"Nenhuma conhecida",destaque:true},{l:"💊 Medicamentos",v:(pac?.meds||"—").slice(0,45)+((pac?.meds?.length||0)>45?"...":"")},{l:"📞 Emergência",v:pac?.tel||"—"}].map(x=><div key={x.l}><div style={{color:G,fontSize:8,fontWeight:900,marginBottom:2}}>{x.l}</div><div style={{color:x.destaque?"#fff":"rgba(255,255,255,.75)",fontSize:x.destaque?12:10,fontWeight:x.destaque?900:400,lineHeight:1.3}}>{x.v}</div></div>)}
          <div style={{marginTop:"auto"}}><div style={{color:"rgba(255,255,255,.3)",fontSize:7}}>{AUTOR} · {AUTOR2}</div></div>
        </div>}
    </div>
    <button onClick={imprimir} style={{...sc_.btn("gold",{fontSize:11,padding:"5px 14px"})}}>🖨️ Imprimir Carteirinha</button>
  </div>;
}

// 12. PORTAL PRIMEIRA
function PortalPrimeira({pac,up,addMsg,addCaixa,onConcluido}){
  const [step,setStep]=useState(1);
  const [arquivos,setArquivos]=useState([]);
  const fileRef=useRef(null);
  const enviarDados=()=>{
    addMsg&&addMsg("Paciente","Recepção",`📋 Dados pré-consulta enviados.\nNome: ${pac?.nome||"—"} · Tel: ${pac?.tel||"—"}\nQueixa: ${pac?.queixa||"—"}`,"msg");
    addCaixa&&addCaixa({de:"Paciente",titulo:`Pré-consulta — ${pac?.nome||"—"}`,conteudo:pac?.queixa||"—",tipo:"anamnese"});
    if(arquivos.length)addCaixa&&addCaixa({de:"Paciente",titulo:`Arquivos (${arquivos.length}) — ${pac?.nome||"—"}`,conteudo:arquivos.map(a=>a.nome).join(", "),tipo:"laudo"});
    setStep(3);
  };
  if(step===3)return <div style={{textAlign:"center",padding:28}}>
    <div style={{fontSize:56,marginBottom:14}}>✅</div>
    <h2 style={{color:VE,fontSize:18,fontWeight:900,margin:"0 0 8px"}}>Dados Enviados!</h2>
    <p style={{color:"#64748B",fontSize:13,margin:"0 0 16px",lineHeight:1.6}}>Suas informações foram recebidas pela equipe do Hospital do Bem.<br/><strong>Aguarde ser chamado para a consulta presencial com o Dr. Silas.</strong></p>
    <div style={{...sc_.card({background:"#EFF9FF",border:`1px solid ${T}44`,textAlign:"left",marginBottom:14})}}>
      <H3 ch="📋 O que acontece agora?"/>
      <div style={{display:"grid",gap:7}}>
        {["A recepção receberá seus dados e irá te chamar.","O médico revisará seu prontuário antes da consulta.","Na consulta presencial, você será oficialmente cadastrado.","Após a consulta, você terá acesso ao portal completo."].map((t,i)=><div key={i} style={{display:"flex",gap:8,fontSize:11,color:N}}><span style={{background:T,color:"#fff",borderRadius:"50%",width:18,height:18,display:"grid",placeItems:"center",fontSize:9,fontWeight:900,flexShrink:0}}>{i+1}</span>{t}</div>)}
      </div>
    </div>
    <p style={{fontSize:10,color:"#94A3B8"}}>{HOSP} · {new Date().toLocaleString("pt-BR")}</p>
  </div>;
  return <div style={{display:"grid",gap:12}}>
    <div style={{display:"flex",gap:6}}>{[1,2].map(n=><div key={n} style={{flex:1,height:4,borderRadius:999,background:step>=n?T:"#E2E8F0",transition:"background .3s"}}/>)}</div>
    {step===1&&<div style={sc_.card()}>
      <H2 ch="📝 Dados para Pré-Consulta"/>
      <p style={{fontSize:11,color:"#64748B",marginBottom:12}}>Preencha seus dados abaixo. Você será chamado para a consulta presencial em breve.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
        {[["Nome completo *","nome"],["Data de nascimento","nasc"],["CPF","cpf"],["Telefone *","tel"],["Cidade","cidade"],["Nome da mãe","mae"]].map(([l,k])=><Fld key={k} l={l} val={pac?.[k]||""} set={v=>up(k,v)}/>)}
      </div>
      <Fld l="Motivo da consulta / Queixa principal *" val={pac?.queixa||""} set={v=>up("queixa",v)} ta rows={3} ph="Descreva com suas palavras o motivo de procurar o médico..."/>
      <Fld l="Doenças que você trata" val={pac?.antec||""} set={v=>up("antec",v)} ph="HAS, DM2, etc."/>
      <Fld l="Remédios que você usa" val={pac?.meds||""} set={v=>up("meds",v)} ph="Losartana, Metformina..."/>
      <Fld l="Alergias a remédios" val={pac?.alerg||""} set={v=>up("alerg",v)} ph="Dipirona, Penicilina..."/>
      <Btn v="teal" ch="Próximo: Enviar Documentos →" s={{width:"100%",padding:11,marginTop:6}} dis={!pac?.nome||!pac?.tel||!pac?.queixa} onClick={()=>setStep(2)}/>
    </div>}
    {step===2&&<div style={sc_.card()}>
      <H2 ch="📁 Documentos e Exames (opcional)"/>
      <p style={{fontSize:11,color:"#64748B",marginBottom:12}}>Se tiver exames ou laudos, envie aqui. Caso não tenha, clique em "Concluir" diretamente.</p>
      <input ref={fileRef} type="file" accept=".pdf,image/*,.doc,.docx" multiple style={{display:"none"}} onChange={e=>setArquivos(x=>[...x,...Array.from(e.target.files||[]).map(f=>({nome:f.name}))])}/>
      <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${T}`,borderRadius:12,padding:"18px",textAlign:"center",cursor:"pointer",background:"#F0F9FF",marginBottom:10}}><div style={{fontSize:28,marginBottom:5}}>📁</div><strong style={{color:T,fontSize:13}}>Selecionar arquivos</strong><div style={{color:"#64748B",fontSize:10,marginTop:2}}>PDF · Foto · Word</div></div>
      {arquivos.length>0&&<div style={{marginBottom:10}}>{arquivos.map((a,i)=><div key={i} style={{display:"flex",gap:7,alignItems:"center",padding:"4px 8px",borderRadius:7,background:"#EAF7EE",marginBottom:4}}><span>📄</span><span style={{flex:1,fontSize:11,color:N}}>{a.nome}</span><button onClick={()=>setArquivos(x=>x.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8"}}>✕</button></div>)}</div>}
      <div style={{display:"flex",gap:8}}><Btn v="ghost" ch="← Voltar" onClick={()=>setStep(1)}/><Btn v="gold" ch="✅ Concluir e Enviar" s={{flex:1,padding:11,fontWeight:900}} onClick={enviarDados}/></div>
    </div>}
  </div>;
}

// ─── IA HUB (Extensores + Fluxo MCP) ─────────────────────────────────────────
function IAHubComp({pac,addMsg}){
  const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d));}catch{return d;}};
  const [keys,setKeys]=useState(()=>LS("ia_keys",{}));
  const [aba,setAba]=useState("extensores");
  const [fluxo,setFluxo]=useState({nome:"",trigger:"manual",ias:[],saida:"chat",prompt:""});
  const [salvos,setSalvos]=useState(()=>LS("fluxos_ia",[]));
  const [rodando,setRodando]=useState(false);
  const [resultado,setResultado]=useState("");
  const saveKey=(id,v)=>{const n={...keys,[id]:v};setKeys(n);localStorage.setItem("ia_keys",JSON.stringify(n));};
  const salvar=()=>{if(!fluxo.nome)return;const n=[...salvos,{...fluxo,id:Date.now()}];setSalvos(n);localStorage.setItem("fluxos_ia",JSON.stringify(n));alert("Fluxo salvo!");};
  const excluir=(id)=>{const n=salvos.filter(f=>f.id!==id);setSalvos(n);localStorage.setItem("fluxos_ia",JSON.stringify(n));};
  const rodar=async(f)=>{
    setRodando(true);setResultado("⏳ Executando fluxo com "+f.ias.join(" + ")+"...");setAba("resultado");
    const ctx=`Paciente: ${pac?.nome||"N/A"} | Diagnóstico: ${pac?.diag||"N/A"} | Estádio: ${pac?.estadio||"N/A"} | ECOG: ${pac?.ecog||"N/A"} | Protocolo: ${pac?.trat||"N/A"} | Biomarcadores: ${pac?.biom?.join(", ")||"N/A"}`;
    const p=(f.prompt||"Analise o caso oncológico completo e forneça recomendações clínicas")+"\n\nContexto do Paciente:\n"+ctx;
    const partes=[];
    for(const ia of (f.ias||[])){
      if(ia==="claude"){const r=await chamarClaude(p,600);partes.push(`━━━ CLAUDE (Anthropic) ━━━\n${r}`);}
      else if(ia==="gpt"){if(keys.gpt){const r=await chamarGPT(p,keys.gpt);partes.push(`━━━ GPT-4o (OpenAI) ━━━\n${r}`);}else partes.push(`━━━ GPT-4o ━━━\n⚠ Chave API não configurada. Acesse IA Hub → Extensores.`);}
      else if(ia==="gemini"){if(keys.gemini){const r=await chamarGemini(p,keys.gemini);partes.push(`━━━ GEMINI (Google) ━━━\n${r}`);}else partes.push(`━━━ GEMINI ━━━\n⚠ Chave API não configurada.`);}
      else if(ia==="grok"){if(keys.grok){const r=await chamarGrok(p,keys.grok);partes.push(`━━━ GROK (xAI) ━━━\n${r}`);}else partes.push(`━━━ GROK ━━━\n⚠ Chave API não configurada.`);}
    }
    const txt=partes.join("\n\n");
    setResultado(txt);
    if(f.saida==="chat")addMsg&&addMsg("IA Hub","Médico",`Fluxo "${f.nome}" (${f.ias.join("+")}) concluído`,"ia");
    setRodando(false);
  };
  const PROV=[
    {id:"claude",n:"Claude",emp:"Anthropic",ico:"🧠",c:"#7C3AED",desc:"LLM oncológico — integrado nativamente",tipo:"api",url:"https://console.anthropic.com"},
    {id:"gpt",n:"GPT-4o",emp:"OpenAI",ico:"🤖",c:"#10A37F",desc:"Raciocínio avançado, código, análise",tipo:"api",url:"https://platform.openai.com/api-keys"},
    {id:"gemini",n:"Gemini 1.5",emp:"Google",ico:"✨",c:"#1A73E8",desc:"Multimodal — analisa imagens de exames",tipo:"api",url:"https://aistudio.google.com/app/apikey"},
    {id:"grok",n:"Grok 3",emp:"xAI",ico:"𝕏",c:"#111",desc:"Análise em tempo real com web",tipo:"api",url:"https://console.x.ai"},
    {id:"drive",n:"Drive",emp:"Google",ico:"📁",c:"#0F9D58",desc:"Armazenar laudos e imagens na nuvem",tipo:"link",url:"https://drive.google.com"},
    {id:"google",n:"Scholar",emp:"Google",ico:"🔍",c:"#DB4437",desc:"Busca de trials e diretrizes",tipo:"link",url:"https://scholar.google.com"},
    {id:"gmail",n:"Gmail",emp:"Google",ico:"📧",c:"#EA4335",desc:"Enviar relatórios ao paciente",tipo:"link",url:"https://mail.google.com"},
  ];
  const IA_API=PROV.filter(p=>p.tipo==="api");
  const ABAS_HUB=[{id:"extensores",l:"🔌 Extensores"},{id:"fluxo",l:"🔗 Criar Fluxo"},{id:"salvos",l:`📋 Salvos${salvos.length?` (${salvos.length})`:""}`},{id:"resultado",l:"📊 Resultado"}];
  return <div style={{display:"grid",gap:14}}>
    <div style={sc.card({background:`linear-gradient(135deg,${N} 0%,#0d2347 60%,#1a1a2e 100%)`,padding:18})}>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <div style={{fontSize:36}}>🤖</div>
        <div><H2 ch="IA Hub — Extensores & Fluxos MCP" s={{color:"#fff",margin:"0 0 3px"}}/><p style={{color:G,fontSize:11,margin:0}}>Conecte Claude, GPT, Gemini e Grok. Crie fluxos de análise oncológica multi-IA.</p></div>
      </div>
    </div>
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      {ABAS_HUB.map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{border:"none",cursor:"pointer",padding:"7px 14px",borderRadius:8,fontWeight:800,fontSize:11,fontFamily:"inherit",background:aba===a.id?G:N,color:aba===a.id?"#fff":"rgba(255,255,255,.65)",transition:"all .15s"}}>{a.l}</button>)}
    </div>

    {aba==="extensores"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:11}}>
      {PROV.map(pr=>{const ativo=pr.tipo==="api"?(pr.id==="claude"||!!keys[pr.id]):true;return <div key={pr.id} style={sc.card({borderTop:`3px solid ${pr.c}`,position:"relative",padding:14})}>
        <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:8}}>
          <div style={{width:38,height:38,background:pr.c,borderRadius:10,display:"grid",placeItems:"center",fontSize:18,color:"#fff",flexShrink:0,fontWeight:900}}>{pr.ico}</div>
          <div style={{flex:1}}><strong style={{color:N,fontSize:13,display:"block"}}>{pr.n}</strong><span style={{fontSize:9,color:"#94A3B8",textTransform:"uppercase",letterSpacing:.5}}>{pr.emp}</span></div>
          <span style={{fontSize:9,fontWeight:900,padding:"2px 8px",borderRadius:999,background:ativo?"#DEF7EC":pr.tipo==="link"?"#EFF9FF":"#FEF3C7",color:ativo?"#065F46":pr.tipo==="link"?T:"#92400E"}}>{ativo?"✓ ATIVO":pr.tipo==="link"?"LINK":"INATIVO"}</span>
        </div>
        <p style={{fontSize:11,color:"#64748B",margin:"0 0 10px",lineHeight:1.4}}>{pr.desc}</p>
        {pr.tipo==="api"
          ?<><input value={pr.id==="claude"?"(integrado — chave no servidor)":keys[pr.id]||""} onChange={e=>saveKey(pr.id,e.target.value)} type="password" placeholder={`${pr.n} API Key...`} disabled={pr.id==="claude"} style={{...sc.inp,fontSize:10,marginBottom:6,opacity:pr.id==="claude"?.6:1}}/>{pr.id!=="claude"&&<a href={pr.url} target="_blank" rel="noreferrer" style={{fontSize:9,color:T,textDecoration:"none"}}>↗ Obter chave gratuita</a>}</>
          :<a href={pr.url} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}><button style={sc.btn("teal",{width:"100%",fontSize:11})}>{pr.ico} Abrir {pr.n}</button></a>}
      </div>;})}
    </div>}

    {aba==="fluxo"&&<div style={{display:"grid",gap:12}}>
      <div style={sc.card()}>
        <H2 ch="🔗 Construtor de Fluxo Multi-IA"/>
        <Fld l="Nome do Fluxo" val={fluxo.nome} set={v=>setFluxo(x=>({...x,nome:v}))} ph="Ex: Segunda opinião oncológica C2"/>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:7}}>IAs participantes do fluxo</label>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {IA_API.map(pr=>{const sel=fluxo.ias.includes(pr.id);return <button key={pr.id} onClick={()=>setFluxo(x=>({...x,ias:sel?x.ias.filter(i=>i!==pr.id):[...x.ias,pr.id]}))} style={{border:`2px solid ${sel?pr.c:"#E2E8F0"}`,borderRadius:8,padding:"6px 13px",background:sel?pr.c+"15":"#F8FAFC",cursor:"pointer",fontSize:11,fontWeight:800,color:sel?pr.c:N,fontFamily:"inherit",transition:"all .15s"}}>{pr.ico} {pr.n}{sel?` ✓`:""}</button>;})}
          </div>
          {fluxo.ias.length>0&&<p style={{fontSize:10,color:T,marginTop:5}}>Fluxo: {fluxo.ias.map(id=>PROV.find(p=>p.id===id)?.n).join(" → ")}</p>}
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Instrução / Prompt</label>
          <textarea value={fluxo.prompt} onChange={e=>setFluxo(x=>({...x,prompt:e.target.value}))} rows={4} placeholder="Ex: Compare as opções terapêuticas considerando ECOG, toxicidade e biomarcadores. Apresente em formato de tabela comparativa." style={{...sc.inp,resize:"vertical",lineHeight:1.5}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px",marginBottom:12}}>
          <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Gatilho</label>
            <select value={fluxo.trigger} onChange={e=>setFluxo(x=>({...x,trigger:e.target.value}))} style={{...sc.inp,fontSize:12}}>
              <option value="manual">▶ Manual</option>
              <option value="abertura">📋 Ao abrir prontuário</option>
              <option value="exame">🔬 Ao receber exame</option>
              <option value="triagem">🩺 Após triagem</option>
            </select>
          </div>
          <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Saída do resultado</label>
            <select value={fluxo.saida} onChange={e=>setFluxo(x=>({...x,saida:e.target.value}))} style={{...sc.inp,fontSize:12}}>
              <option value="chat">💬 Chat da Equipe</option>
              <option value="tela">📺 Somente na tela</option>
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn v="navy" ch="💾 Salvar Fluxo" s={{flex:1}} dis={!fluxo.nome||!fluxo.ias.length} onClick={salvar}/>
          <Btn v="gold" ch={rodando?"⏳ Executando...":"▶ Executar Agora"} s={{flex:1}} dis={!fluxo.ias.length||rodando} onClick={()=>rodar(fluxo)}/>
        </div>
      </div>
      <div style={sc.card({background:"#F0F9FF",border:`1px solid ${T}22`})}>
        <H2 ch="💡 Como usar o Fluxo IA" s={{color:T}}/>
        <div style={{display:"grid",gap:5}}>
          {["Selecione as IAs — cada uma dará sua análise independente do caso clínico","Escreva a instrução específica que todas as IAs devem responder","O contexto do paciente (diagnóstico, ECOG, protocolo) é enviado automaticamente","Os resultados aparecem lado a lado para você comparar as opiniões","Salve fluxos frequentes como 'Segunda Opinião', 'Avaliação de Toxicidade', etc."].map((t,i)=><div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",fontSize:11,color:"#374151"}}><span style={{background:T,color:"#fff",borderRadius:"50%",width:18,height:18,display:"grid",placeItems:"center",flexShrink:0,fontWeight:900,fontSize:9}}>{i+1}</span>{t}</div>)}
        </div>
      </div>
    </div>}

    {aba==="salvos"&&<div style={{display:"grid",gap:10}}>
      {salvos.length===0&&<div style={sc.card({textAlign:"center",padding:28,color:"#94A3B8"})}><div style={{fontSize:36,marginBottom:8}}>🔗</div><p>Nenhum fluxo salvo ainda.<br/>Crie seu primeiro fluxo na aba "Criar Fluxo".</p></div>}
      {salvos.map(f=><div key={f.id} style={sc.card({borderLeft:`3px solid ${G}`})}>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
          <div style={{flex:1}}>
            <strong style={{color:N,fontSize:13,display:"block"}}>{f.nome}</strong>
            <div style={{fontSize:10,color:"#64748B"}}>{(f.ias||[]).map(id=>PROV.find(p=>p.id===id)?.n).join(" → ")} · Gatilho: {f.trigger} · Saída: {f.saida}</div>
          </div>
          <Btn v="teal" ch={rodando?"⏳":"▶ Rodar"} s={{fontSize:11,padding:"5px 10px"}} dis={rodando} onClick={()=>rodar(f)}/>
          <Btn v="red" ch="🗑" s={{fontSize:11,padding:"5px 9px"}} onClick={()=>excluir(f.id)}/>
        </div>
        {f.prompt&&<p style={{fontSize:11,color:"#64748B",margin:0,fontStyle:"italic",lineHeight:1.4}}>"{f.prompt.substring(0,100)}{f.prompt.length>100?"…":""}"</p>}
      </div>)}
    </div>}

    {aba==="resultado"&&<div style={sc.card()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <H2 ch="📊 Resultado do Fluxo Multi-IA" s={{margin:0}}/>
        <div style={{display:"flex",gap:6}}>
          {resultado&&!rodando&&<Btn v="teal" ch="🖨 Imprimir" s={{fontSize:10}} onClick={()=>window.print()}/>}
          <Btn v="ghost" ch="✕ Limpar" s={{fontSize:10}} onClick={()=>setResultado("")}/>
        </div>
      </div>
      {resultado?<Cbox text={resultado} maxH={520}/>:<div style={{textAlign:"center",padding:28,color:"#94A3B8"}}><div style={{fontSize:36,marginBottom:8}}>📊</div><p>Execute um fluxo para ver os resultados aqui.</p></div>}
    </div>}
  </div>;
}

// --- OVERRIDES CLÍNICOS DR. SILAS ---------------------------------------------
function TopBar({title,back,alertCount=0,onAlert}){
  return <div style={{background:N,color:"#fff",padding:"8px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,.25)"}}>
    {back&&<button onClick={back} style={{background:"none",border:"1px solid rgba(255,255,255,.25)",color:"#fff",padding:"4px 11px",borderRadius:999,cursor:"pointer",fontSize:11}}>← Voltar</button>}
    <div style={{flex:1}}>
      <div style={{fontWeight:900,fontSize:14}}>{title}</div>
      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(184,134,11,.16)",border:`1px solid ${G}66`,color:G,borderRadius:999,padding:"2px 9px",fontSize:10,fontWeight:900,marginTop:3}}>✦ Criado por Dr. Silas Negrão Serra Jr.</div>
    </div>
    {alertCount>0&&<div style={{background:VM,color:"#fff",padding:"4px 13px",borderRadius:999,fontSize:12,fontWeight:900,cursor:"pointer",flexShrink:0}} onClick={onAlert}>🚨 {alertCount} alerta{alertCount>1?"s":""}</div>}
  </div>;
}

function Footer(){
  return <div style={{background:N,padding:"9px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,marginTop:"auto",borderTop:`3px solid ${G}`}}>
    <span style={{color:G,fontWeight:1000,fontSize:14,letterSpacing:.5,textTransform:"uppercase"}}>✦ Dr. Silas Negrão Serra Jr.</span>
    <span style={{color:"rgba(255,255,255,.45)",fontSize:10}}>CRM-PB 17341 · RQE Oncologia 9099 · {HOSP}</span>
  </div>;
}

function resumoAtendimentoEstruturado(pac,novaTexto=""){
  const labs=(pac?.exames_lab||[])[0]?.valores||{};
  const docs=pac?.docs_ia_resumo||pac?.docs_drive_resumo||"";
  return [
    "EVOLUÇÃO ONCOLÓGICA — "+new Date().toLocaleDateString("pt-BR"),
    "Paciente: "+(pac?.nome||"___")+" · Nasc.: "+(pac?.nasc||"___")+" · Cidade: "+(pac?.cidade||"___"),
    "",
    "1. QUEIXA / CONTEXTO",
    pac?.queixa||"—",
    "",
    "2. ANTECEDENTES E MEDICAÇÕES",
    "Antecedentes: "+(pac?.antec||"—"),
    "Medicações: "+(pac?.meds||"—"),
    "Alergias: "+(pac?.alerg||"—"),
    "História familiar: "+(pac?.anam_hist_fam||"—"),
    "Cirurgias prévias: "+(pac?.anam_cirurgia||"—"),
    "",
    "3. DIAGNÓSTICO ONCOLÓGICO",
    pac?.diag||"—",
    "CID: "+(pac?.cid||"—")+" · TNM: "+(pac?.tnm||"—")+" · Estádio: "+(pac?.estadio||"—"),
    "Biomarcadores: "+(pac?.bio||"—")+" · ECOG: "+(pac?.ecog||"—"),
    "",
    "4. EXAME FÍSICO / FUNCIONAL",
    pac?.exFisico||"—",
    "",
    "5. LABORATÓRIO / EXAMES",
    "Neutrófilos: "+(labs.Neutro||labs.neutro||"—")+" · Hb: "+(labs.Hgb||labs.hgb||"—")+" · Plaquetas: "+(labs.PLT||labs.plt||"—"),
    "Documentos/IA: "+(docs?docs.substring(0,900):"—"),
    "",
    "6. TRATAMENTO / CONDUTA",
    "Tratamento: "+(pac?.trat||"—"),
    "Linha: "+(pac?.linha||"—")+" · Intenção: "+(pac?.intencao||"—"),
    "",
    "7. EVOLUÇÃO DO DIA",
    novaTexto||"Paciente avaliado(a). Manter seguimento oncológico conforme plano terapêutico e resultados laboratoriais.",
    "",
    AUTOR
  ].join("\n");
}

function EvolucoesProntuario({pac,up,addMsg}){
  const historicoBase=[
    {id:1,data:"12/03/2026",hora:"09:00",tipo:"Primeira consulta",autor:AUTOR,texto:"Primeira consulta oncológica. Dados clínicos iniciais reunidos, solicitação de estadiamento e revisão anatomopatológica."},
    {id:2,data:"02/04/2026",hora:"10:30",tipo:"QT",autor:AUTOR,texto:"Início de quimioterapia. Revisados critérios laboratoriais e orientações de toxicidade."},
    {id:3,data:"16/04/2026",hora:"08:45",tipo:"Retorno",autor:AUTOR,texto:"Seguimento clínico sem intercorrências graves. Mantido plano terapêutico."},
  ];
  const [evolucoes,setEvolucoes]=useState(pac?.evolucoes?.length?pac.evolucoes:historicoBase);
  const [texto,setTexto]=useState("");
  const [tipo,setTipo]=useState("Consulta");
  const [filtro,setFiltro]=useState("Todos");
  const [editando,setEditando]=useState(false);
  const textoFinal=resumoAtendimentoEstruturado(pac,texto);
  const salvar=()=>{
    const ev={id:Date.now(),data:TODAY(),hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),tipo,autor:AUTOR,texto:textoFinal};
    const novos=[ev,...evolucoes];
    setEvolucoes(novos);up&&up("evolucoes",novos);setTexto("");setEditando(false);
    addMsg&&addMsg("Médico","Equipe",`Nova evolução salva: ${pac?.nome||"paciente"}`,"prontuario");
  };
  const lista=filtro==="Todos"?evolucoes:evolucoes.filter(e=>e.tipo===filtro);
  const TIPOS=["Consulta","Primeira consulta","QT","Retorno","Intercorrência","Exame/Laudo","Telemedicina","Outro"];
  return <div style={{display:"grid",gap:12}}>
    <div style={sc_.card({border:`2px solid ${G}66`,background:"#FFFBEB"})}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
        <div><H2 ch="📋 Evolução estruturada do atendimento" s={{margin:0}}/><p style={{fontSize:12,color:"#64748B",margin:"3px 0 0"}}>Todas as informações do paciente ficam juntas em um resumo único, com histórico por data desde a primeira consulta.</p></div>
        <Btn v="gold" ch={editando?"Ocultar":"+ Evoluir agora"} s={{fontSize:12,whiteSpace:"nowrap"}} onClick={()=>setEditando(x=>!x)}/>
      </div>
      {editando&&<div style={{display:"grid",gap:9}}>
        <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:8}}>
          <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...sc_.inp,fontSize:12}}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select>
          <input value={texto} onChange={e=>setTexto(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)salvar();}} placeholder="Digite apenas a evolução do dia; o sistema agrega diagnóstico, exames, tratamento e histórico automaticamente..." style={{...sc_.inp,fontSize:12}} autoFocus/>
        </div>
        <textarea value={textoFinal} onChange={e=>setTexto(e.target.value)} rows={12} style={{...sc_.inp,width:"100%",resize:"vertical",fontSize:12,lineHeight:1.65,background:"#fff"}}/>
        <div style={{display:"flex",gap:8}}>
          <Btn v="green" ch="✅ Salvar evolução do atendimento" s={{flex:1,padding:12,fontSize:13}} onClick={salvar}/>
          <Btn v="ghost" ch="📋 Copiar" s={{fontSize:11}} onClick={()=>navigator.clipboard?.writeText(textoFinal)}/>
          <Btn v="teal" ch="📤 Enviar" s={{fontSize:11}} onClick={()=>abrirPremium("Evolução — "+(pac?.nome||"paciente"),textoFinal,"prontuario")}/>
        </div>
      </div>}
    </div>
    <div style={sc_.card()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
        <H3 ch="Histórico do paciente" s={{margin:0}}/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{["Todos",...TIPOS].map(t=><button key={t} onClick={()=>setFiltro(t)} style={{...sc_.btn(filtro===t?"navy":"ghost",{fontSize:10,padding:"4px 9px"})}}>{t}</button>)}</div>
      </div>
      <div style={{display:"grid",gap:8}}>{lista.map(e=><div key={e.id} style={{borderLeft:`4px solid ${e.tipo==="QT"?T:e.tipo==="Intercorrência"?VM:G}`,background:"#F8FAFC",borderRadius:9,padding:"9px 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:4}}><strong style={{color:N,fontSize:12}}>{e.data} {e.hora} — {e.tipo}</strong><span style={{fontSize:10,color:"#94A3B8"}}>{e.autor}</span></div>
        <pre style={{whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",fontSize:11,lineHeight:1.55,color:"#374151",margin:0}}>{e.texto}</pre>
      </div>)}</div>
    </div>
  </div>;
}

function TriagemQTv17Frame({pac,addMsg,onEnviar}){
  const iframeRef=useRef(null);
  const [status,setStatus]=useState("");
  const getDoc=()=>{try{return iframeRef.current?.contentWindow?.document||null;}catch(e){return null;}};
  const syncPaciente=()=>{
    const d=getDoc(); const w=iframeRef.current?.contentWindow; if(!d||!w)return;
    const set=(id,val)=>{const el=d.getElementById(id); if(el&&val!==undefined&&val!==null&&String(val).trim()){el.value=String(val); el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true}));}};
    set("nome",pac?.nome||""); set("idade",pac?.idade||""); set("ciclo",pac?.ciclo||"");
    const proto=(pac?.trat||pac?.protocolo||pac?.proto||"").trim();
    if(proto){
      const row=d.getElementById("protoInputRow"); if(row)row.style.display="flex";
      set("protoCustom",proto);
      try{w.protoVal=proto; w.protoIsPoly=/\+|FOLFOX|FOLFIRI|FLOT|XELOX|DCF|AC|Carbo|Cisplatina/i.test(proto); w.buildResumo&&w.buildResumo(); w.autoConduta&&w.autoConduta();}catch(e){}
    }
    setStatus("Paciente carregado na triagem v17.");
  };
  const readResumo=()=>{
    const d=getDoc(); const w=iframeRef.current?.contentWindow; if(!d)return "";
    try{w?.buildResumo&&w.buildResumo();}catch(e){}
    return (d.getElementById("resBody")?.textContent||"").trim();
  };
  const enviarResumo=()=>{
    const resumo=readResumo();
    if(!resumo||/Preencha as/i.test(resumo)){alert("Preencha a triagem e gere o resumo antes de enviar ao medico.");return;}
    const nome=(resumo.match(/Nome\s*:\s*([^\n]+)/)||[])[1]?.trim()||pac?.nome||"Paciente";
    const ciclo=(resumo.match(/Ciclo\s*:\s*([^\n]+)/)||[])[1]?.trim()||"-";
    const conclusao=resumo.includes("ADIAR")?"ADIAR QUIMIOTERAPIA":resumo.includes("REFER")?"REFERIR AO MEDICO":resumo.includes("APTO")?"APTO PARA QT":"TRIAGEM RECEBIDA";
    const item={id:Date.now(),nome,ciclo,conclusao,data:TODAY(),hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),resumo,origem:"Triagem QT v17",alertas:conclusao.includes("ADIAR")||conclusao.includes("REFER")?[conclusao]:[]};
    onEnviar&&onEnviar(item);
    addMsg&&addMsg("Enfermagem","Medico",`Triagem QT v17 enviada: ${nome} - ${conclusao}`,"triagem");
    setStatus(`Resumo enviado ao medico: ${nome} - ${conclusao}`);
  };
  return <div style={{display:"grid",gap:10}}>
    <div style={sc_.card({display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:10,border:`2px solid ${T}33`})}>
      <div><strong style={{color:N,fontSize:13}}>Triagem QT v17 - Enfermagem</strong><div style={{fontSize:11,color:"#64748B"}}>Mesmo formato do app original. Use o botao abaixo para enviar o resumo ao medico.</div></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}><Btn v="ghost" ch="Carregar paciente" s={{fontSize:11}} onClick={syncPaciente}/><Btn v="gold" ch="Enviar resumo ao medico" s={{fontSize:11}} onClick={enviarResumo}/></div>
    </div>
    {status&&<div style={{fontSize:11,color:VE,fontWeight:800,background:"#EAF7EE",border:`1px solid ${VE}44`,borderRadius:9,padding:"7px 10px"}}>{status}</div>}
    <iframe ref={iframeRef} src="/triagem-qt-v17.html" title="Triagem QT v17" onLoad={syncPaciente} style={{width:"100%",height:"calc(100vh - 230px)",minHeight:760,border:"none",borderRadius:16,background:"#F1F5F9",boxShadow:"0 2px 12px rgba(15,23,42,.08)"}} allow="clipboard-read; clipboard-write; camera; microphone"/>
  </div>;
}
function TriagemEnfermagemFuncional({pac,addMsg,onEnviar}){
  const [d,setD]=useState({nome:pac?.nome||"",ciclo:"",proto:pac?.trat||"",pas:"",pad:"",fc:"",temp:"",spo2:"",neutro:"",plt:"",hgb:"",ecog:pac?.ecog||"",obs:"",enfermeira:""});
  const upD=(k,v)=>setD(x=>({...x,[k]:v}));
  const n=Number(String(d.neutro).replace(",",".")), p=Number(String(d.plt).replace(".","")), h=Number(String(d.hgb).replace(",",".")), temp=Number(String(d.temp).replace(",","."));
  const alertas=[]; if(n&&n<1500)alertas.push("Neutrófilos abaixo de 1.500"); if(p&&p<100000)alertas.push("Plaquetas abaixo de 100.000"); if(h&&h<8)alertas.push("Hb abaixo de 8"); if(temp&&temp>=37.8)alertas.push("Febre ≥ 37,8°C");
  const conclusao=alertas.length?"ATENÇÃO — comunicar médico antes da QT":"APTO — critérios mínimos preenchidos";
  const enviar=()=>{const triagem={...d,id:Date.now(),data:TODAY(),hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),conclusao,alertas};const resumo=`RESUMO TRIAGEM ENFERMAGEM — ${triagem.data} ${triagem.hora}\nPaciente: ${d.nome||"—"} · Ciclo: ${d.ciclo||"—"}\nProtocolo: ${d.proto||"—"}\nSinais: PA ${d.pas||"—"}/${d.pad||"—"} · FC ${d.fc||"—"} · Temp ${d.temp||"—"} · SpO2 ${d.spo2||"—"}\nLab: Neutro ${d.neutro||"—"} · PLT ${d.plt||"—"} · Hb ${d.hgb||"—"}\nECOG: ${d.ecog||"—"}\nConclusão: ${conclusao}\n${alertas.length?"Alertas: "+alertas.join("; "):"Sem alertas laboratoriais."}\nObs: ${d.obs||"—"}`;addMsg&&addMsg("Enfermagem","Médico",resumo,"triagem");onEnviar&&onEnviar({...triagem,resumo});alert("✅ Resumo da triagem enviado ao médico.");};
  const enterNext=e=>{if(e.key==="Enter"){e.preventDefault();const all=Array.from(document.querySelectorAll("input,select,textarea,button"));const i=all.indexOf(e.currentTarget);all[i+1]?.focus();}};
  return <div style={{display:"grid",gap:12}}>
    <div style={sc_.card({background:alertas.length?"#FFF7E6":"#EAF7EE",border:`2px solid ${alertas.length?AM:VE}`})}><H2 ch="🩺 Triagem de Enfermagem — uma tela"/><div style={{fontWeight:900,color:alertas.length?AM:VE,fontSize:13}}>{conclusao}</div>{alertas.length>0&&<div style={{fontSize:11,color:AM,marginTop:5}}>{alertas.join(" · ")}</div>}</div>
    <div style={sc_.card()}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"0 10px"}}>
        {[ ["Paciente","nome"],["Ciclo","ciclo"],["Protocolo","proto"],["Enfermeira","enfermeira"],["PAS","pas"],["PAD","pad"],["FC","fc"],["Temp","temp"],["SpO2","spo2"],["Neutrófilos","neutro"],["Plaquetas","plt"],["Hb","hgb"] ].map(([l,k])=><div key={k}><label style={{fontSize:10,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:3}}>{l}</label><input value={d[k]||""} onChange={e=>upD(k,e.target.value)} onKeyDown={enterNext} style={{...sc_.inp,fontSize:12,marginBottom:8}}/></div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"160px 1fr",gap:10}}><select value={d.ecog} onChange={e=>upD("ecog",e.target.value)} onKeyDown={enterNext} style={{...sc_.inp,fontSize:12}}><option value="">ECOG</option>{[0,1,2,3,4].map(x=><option key={x}>{x}</option>)}</select><input value={d.obs} onChange={e=>upD("obs",e.target.value)} onKeyDown={enterNext} placeholder="Observações da enfermagem..." style={{...sc_.inp,fontSize:12}}/></div>
      <Btn v="gold" ch="📤 Enviar resumo ao médico" s={{width:"100%",padding:12,fontSize:13,marginTop:10}} dis={!d.nome} onClick={enviar}/>
    </div>
  </div>;
}

function TriagemMedicoRecebe({triagens}){
  if(!triagens?.length)return <div style={{textAlign:"center",padding:28,color:"#94A3B8"}}><div style={{fontSize:32,marginBottom:8}}>📭</div><p style={{fontSize:12}}>Nenhum resumo de triagem recebido no momento.</p></div>;
  return <div style={{display:"grid",gap:10}}>
    <H2 ch="📥 Resumos de Triagem da Enfermagem"/>
    {triagens.map(t=><div key={t.id} style={sc_.card({border:`2px solid ${(t.alertas?.length||0)>0?AM:T}55`})}>
      <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:8}}><strong style={{color:N,fontSize:13}}>{t.nome||"Paciente"} — {t.ciclo||"—"}</strong><span style={{fontSize:10,color:"#94A3B8"}}>{t.data} {t.hora}</span></div>
      <Cbox text={t.resumo||`Paciente: ${t.nome}\nConclusão: ${t.conclusao}\nObs: ${t.obs||"—"}`} maxH={220}/>
    </div>)}
  </div>;
}

function DriveIntegracaoComp({pac,up,addMsg,dossie,setDossie}){return <DriveDossieComp pac={pac} dossie={dossie} setDossie={setDossie} addMsg={addMsg}/>;}
export default function App(){
  const [pg,setPg]=useState("landing");
  const [emergenciaAtiva,setEmergenciaAtiva]=useState(null);
  const [chatFlutAberto,setChatFlutAberto]=useState(false);
  const pacInicial=loadPacAtual()||{...PAC0};
  const [pac,setPac]=useState(()=>pacInicial);
  const [dossieOncologico,setDossieOncologico]=useState(()=>loadDossiePaciente(pacInicial)||criarDossieInicial(pacInicial));

  // ── INIT SUPABASE + carregar dados da nuvem ───────────────────────────────
  useEffect(()=>{
    (async()=>{
      const online = await dbInit();
      setSyncStatus(getSyncStatus());
      if(online){
        const [agenda,fila,histQT,triags] = await Promise.all([
          dbCarregarAgenda(), dbCarregarFila(), dbCarregarHistoricoQT(), dbCarregarTriagens(),
        ]);
        if(agenda?.length)  setAgendamentosRaw(agenda);
        if(fila?.length)    setListaEsperaRaw(fila);
        if(histQT?.length)  setHistoricoQTRaw(histQT);
        if(triags?.length)  setTriagensRaw(triags);
        setSyncStatus(getSyncStatus());
      }
    })();
  },[]);
  const up=(k,v)=>setPac(x=>{const novo={...x,[k]:v};savePacAtual(novo);dbSalvarPaciente(novo);return novo;});
  useEffect(()=>{setDossieOncologico(d=>{
    const salvo=loadDossiePaciente(pac);
    const base=mesmoPacienteDossie(d,pac)?(d||salvo||criarDossieInicial(pac)):(salvo||criarDossieInicial(pac));
    return {...base,paciente:{...(base?.paciente||{}),...pac},updatedAt:NOW()};
  });},[pac.pacID,pac.nome,pac.cpf,pac.cns,pac.nasc,pac.mae,pac.cidade,pac.tel,pac.diag,pac.cid,pac.tnm,pac.estadio,pac.bio,pac.ecog,pac.trat,pac.linha,pac.intencao,pac.peso,pac.altura,pac.queixa,pac.antec,pac.meds,pac.alerg,pac.anam_cirurgia,pac.anam_hist_fam]);
  useEffect(()=>{saveDossiePaciente(dossieOncologico);},[dossieOncologico]);
  const [medLogado,setMedLogado]=useState(false);
  const [medTab,setMedTab]=useState("dashboard");
  const [pronTab,setPronTab]=useState("consulta");
  const [cicloLiberado,setCicloLiberado]=useState(false);
  const [funcLogado,setFuncLogado]=useState(EQUIPE[0]);
  const [laudoLiberado,setLaudoLiberado]=useState(false);
  const [caixaEntrada,setCaixaEntrada]=useState([
    {id:1,de:"Dr. Silas Negrão",titulo:"Resultado de Hemograma — C1",conteudo:"HEMOGRAMA\nData: 15/05/2026\nHgb: 11,8 g/dL ✓\nNeutrófilos: 2.100/mm³ ✓\nPlaquetas: 176.000/mm³ ✓\n\nDr. Silas Negrão · CRM-PB 17341",dt:"15/05/2026 10:00",lida:false,tipo:"laudo"},
    {id:2,de:"Recepção",titulo:"Confirmação de Retorno",conteudo:"Retorno: 03/06/2026 às 09h00.\nHospital do Bem — Patos-PB.\nChegue 30 minutos antes.",dt:"14/05/2026 14:30",lida:true,tipo:"msg"},
  ]);
  const addCaixaEntrada=(entry)=>setCaixaEntrada(x=>[{...entry,id:Date.now(),dt:new Date().toLocaleString("pt-BR"),lida:false},...x]);
  const [historicoQT,setHistoricoQTRaw]=useState([]);
  const setHistoricoQT=v=>{const n=typeof v==="function"?v(historicoQT):v;setHistoricoQTRaw(n);dbSalvarHistoricoQT(n);};
  const [triagens,setTriagensRaw]=useState([]);
  const setTriagens=v=>{const n=typeof v==="function"?v(triagens):v;setTriagensRaw(n);dbSalvarTriagens(n);};
  const [apacs,setApacs]=useState([]);
  const [aiPatches,setAiPatchesRaw]=useState(()=>loadAiPatches());
  const setAiPatches=v=>{const n=typeof v==="function"?v(aiPatches):v;setAiPatchesRaw(n);saveAiPatches(n);};
  const [syncStatus,setSyncStatus]=useState({status:"local",label:"💾 Carregando...",cor:"#94A3B8"});
  const addHistQT=(entrada)=>setHistoricoQT(x=>[entrada,...x]);
  const [consultasDia,setConsultasDia]=useState([]);
  const [agendamentos,setAgendamentosRaw]=useState([]);
  const setAgendamentos=v=>{const n=typeof v==="function"?v(agendamentos):v;setAgendamentosRaw(n);dbSalvarAgenda(n);};
  const addAgendamento=(a)=>setAgendamentos(x=>[{...a,id:Date.now()},...x]);
  const [listaEspera,setListaEsperaRaw]=useState([]);
  const setListaEspera=v=>{const n=typeof v==="function"?v(listaEspera):v;setListaEsperaRaw(n);dbSalvarFila(n);};
  const [filaSeq,setFilaSeq]=useState(5);
  const addFila=(entrada)=>{
    const num=String(filaSeq).padStart(3,"0");
    const proto=(entrada.proto||"").toUpperCase();
    const prioridade=proto.includes("FOLFOX")||proto.includes("FOLFIRI")||proto.includes("FLOT")?"alta":proto.includes("PEMBRO")||proto.includes("CARBO")?"media":"baixa";
    const entry={...entrada,pacID:entrada.pacID||pac.pacID||genPacID(),num,prioridade};
    setListaEspera(x=>[entry,...x]);
    setConsultasDia(x=>[{...entry,status:"aguardando",checkin:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})},...x]);
    setFilaSeq(n=>n+1);
  };
  const [mensagens,setMensagens]=useState([
    {id:1,de:"Médico",para:"Farmácia",txt:"Ciclo C2D1 liberado. Preparar mFOLFOX6.",dt:"16/05/2026 08:30",lida:false,tipo:"ciclo"},
    {id:2,de:"Farmácia",para:"Médico",txt:"Estoque de Oxaliplatina abaixo do mínimo.",dt:"15/05/2026 14:20",lida:true,tipo:"alerta"},
  ]);
  const addMsg=useCallback((de,para,txt,tipo)=>{
    setMensagens(x=>[{id:Date.now(),de,para,txt,dt:new Date().toLocaleString("pt-BR"),lida:false,tipo},...x]);
    if(tipo==="emergencia") setEmergenciaAtiva({de,txt,hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})});
  },[]);
  const abrirAtendimento=useCallback((entrada={})=>{
    const base=entrada.paciente||entrada;
    const novoPac={...PAC0,...base,nome:base.nome||base.pac||base.paciente||"",trat:base.trat||base.proto||base.tipo||"",pacID:base.pacID||genPacID()};
    const salvo=loadDossiePaciente(novoPac)||criarDossieInicial(novoPac);
    const novo={...salvo,paciente:{...(salvo.paciente||{}),...novoPac},status:"em_consulta",updatedAt:NOW()};
    novo.evolucao={...(novo.evolucao||{}),rascunho:novo.evolucao?.rascunho||gerarTextoEvolucao(novo)};
    novo.apac=validarAPAC(novo);
    setPac(novoPac);savePacAtual(novoPac);dbSalvarPaciente(novoPac);
    setDossieOncologico(novo);
    setConsultasDia(x=>x.map(p=>((p.pacID&&p.pacID===novoPac.pacID)||p.nome===novoPac.nome)?{...p,status:"em_consulta",pacID:novoPac.pacID}:p));
    setMedTab("prontuario");setPronTab("consulta");
    addMsg("Sistema","Médico","🩺 Atendimento aberto: "+(novoPac.nome||"paciente")+". Dossiê carregado apenas para este paciente.","standby");
  },[addMsg]);
  const [sinPac,setSinPac]=useState([]);
  const [pacFluxo,setPacFluxo]=useState(null);
  const [pacTab,setPacTab]=useState("reacoes");
  const [timers]=useState(Object.fromEntries(MOCK_CADEIRAS.map(c=>[c.id,c.min*60])));
  const [upFiles,setUpFiles]=useState([]);
  const refCam=useRef(null);
  const refArq=useRef(null);
  const onCamRec=e=>{const f=Array.from(e.target.files||[]);setUpFiles(x=>[...x,...f.map(fl=>({ico:"📸",n:fl.name,tp:"Foto",obj:fl}))]);e.target.value=""};
  const onArqRec=e=>{const f=Array.from(e.target.files||[]);setUpFiles(x=>[...x,...f.map(fl=>({ico:"📄",n:fl.name,tp:"Doc",obj:fl}))]);e.target.value=""};

  const glosa=calcGlosa([],pac);
  const totalAlertas=MOCK_ALERTAS.length;
  const totalAl=totalAlertas;
  const goAlerta=()=>setMedTab("alertas");
  const NIV={verm:{label:"URGENTE"},amar:{label:"ATENÇÃO"},verd:{label:"OK"}};
    const resumoProntuario=`IDENTIFICAÇÃO\n${pac.nome||"___"}, ${pac.nasc||"__"}, ${pac.cidade||"___"}\nCPF: ${pac.cpf||"—"} · CNS: ${pac.cns||"—"}\n\nANTECEDENTES\n${pac.antec||"—"}.\nMedicações: ${pac.meds||"—"}. Alergias: ${pac.alerg||"—"}.${pac.exFisico?`\n\nEXAME FÍSICO\n${pac.exFisico}`:""}\n\nDIAGNÓSTICO ONCOLÓGICO\n${pac.diag||"—"} · CID: ${pac.cid||"—"} · TNM: ${pac.tnm||"—"} · Estádio: ${pac.estadio||"—"}\nBiomarcadores: ${pac.bio||"—"} · ECOG: ${pac.ecog||"—"}\n\nTRATAMENTO\n${pac.trat||"—"} · ${pac.linha||"—"} · ${pac.intencao||"—"}\n\n${HOSP}\n${AUTOR}`;

  const MT=[
    {id:"dashboard",ico:"🏠",l:"Dashboard"},
    {id:"alertas",ico:"🚨",l:`Alertas${totalAlertas>0?` (${totalAlertas})`:""}`,badge:true},
    {id:"pacientes",ico:"👥",l:"Pacientes"},
    {id:"prontuario",ico:"📋",l:"Prontuário"},
    {id:"quimio",ico:"💉",l:"Protocolos QT"},
    {id:"exames_med",ico:"🔬",l:"Novos Exames"},
    {id:"receitas",ico:"📝",l:"Receitas"},
    {id:"apac",ico:"📄",l:"APAC"},
    {id:"antiglosa",ico:"🛡",l:"Anti-Glosa"},
    {id:"salao",ico:"🛋️",l:"Salão"},
    {id:"balanco",ico:"💰",l:"Balanço"},
    {id:"triagem_recebe",ico:"📥",l:"Resumo Triagem"},
    {id:"drive_ia",ico:"☁️",l:"Drive → Prontuário"},
    {id:"consultas_dia",ico:"📅",l:"Consultas Hoje"},
    {id:"agenda_med",ico:"🗓",l:"Agendamento"},
    {id:"ia_hub",ico:"🤖",l:"IA Hub"},
    {id:"ia_agent",ico:"🧠",l:"Assistente IA"},
    {id:"ia_test",ico:"🔬",l:"Testar IA"},
    {id:"trials",ico:"🧬",l:"Trials"},
    {id:"stats",ico:"📊",l:"Estatísticas"},
    {id:"config",ico:"⚙️",l:"Configurações"},
  ];

  const renderMedico=()=>{
    const scAuto=pac.peso&&pac.altura?calcSC(pac.peso,pac.altura):null;
    switch(medTab){
      case "pacientes": return <GerenciarPacientes
          onAbrirPaciente={p=>abrirAtendimento(p)}
          onNovoPaciente={p=>{const novoPac={...PAC0,...p,pacID:p?.pacID||genPacID()};setPac(novoPac);savePacAtual(novoPac);setDossieOncologico(criarDossieInicial(novoPac));setMedTab("prontuario");setPronTab("consulta");}}/>;
      case "dashboard": return <DashboardMedico pac={pac} consultasDia={consultasDia} alertas={MOCK_ALERTAS} totalAlertas={totalAlertas} mensagens={mensagens} setMedTab={setMedTab} caixaEntrada={caixaEntrada} agendamentos={agendamentos} onAbrirAtendimento={abrirAtendimento}/>;
      case "alertas": return <div style={{display:"grid",gap:12}}>
        {MOCK_ALERTAS.map(a=><div key={a.id} style={{...sc_.card({border:`2px solid ${a.n==="verm"?VM:a.n==="amar"?AM:VE}33`})}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
            <span style={{fontSize:26}}>{a.n==="verm"?"🚨":a.n==="amar"?"⚠️":"ℹ️"}</span>
            <div style={{flex:1}}><h3 style={{color:N,margin:"0 0 2px",fontSize:15}}>{a.nome}</h3><p style={{color:"#64748B",fontSize:12,margin:"0 0 2px"}}>{a.diag}</p><p style={{color:a.n==="verm"?VM:a.n==="amar"?AM:VE,fontSize:13,fontWeight:700,margin:0}}>{a.sint} — {a.h}</p></div>
            <Bge t={a.n==="verm"?"bad":a.n==="amar"?"warn":"ok"} ch={NIV[a.n]?.label||a.n}/>
          </div>
          {a.n==="verm"&&<Cbox text={prescHosp(["febre"],{nome:a.nome,diag:a.diag})} maxH={140}/>}
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            <Btn v="teal" ch="📋 Copiar" s={{fontSize:10}} onClick={()=>navigator.clipboard?.writeText(prescHosp(["febre"],{nome:a.nome,diag:a.diag}))}/>
            <Btn v="navy" ch="📤 Enviar colega" s={{fontSize:10}} onClick={()=>{const d=["Dr. Carlos (plantão)","Dra. Ana (clínica)","Dr. Paulo (UTI)"][Math.floor(Math.random()*3)];if(addMsg)addMsg("Médico",d,`Encaminhamento: ${a.nome}. ${a.sint}.`,"msg");alert(`Enviado para ${d}`);}}/>
            <button style={{...sc_.btn("ghost",{fontSize:10,background:"#25D366",color:"#fff",border:"none"})}} onClick={()=>{const txt=encodeURIComponent(`🚨 *ALERTA ONCOLOGIA*\n\nPaciente: *${a.nome}*\nDiagnóstico: ${a.diag}\nSintoma: ${a.sint}\n\nHospital do Bem — Dr. Silas Negrão\nCRM-PB 17341 · ${new Date().toLocaleString("pt-BR")}`);window.open(`https://wa.me/?text=${txt}`,"_blank");}}>📲 WhatsApp</button>
            <Btn v="gold" ch="🖨 Imprimir" s={{fontSize:10}} onClick={()=>abrirPremium("Conduta — "+a.nome,prescHosp(["febre"],{nome:a.nome,diag:a.diag}),"prontuario")}/>
          </div>
        </div>)}
      </div>;
      case "prontuario": return <div>
        {aiPatches.length>0&&<div style={{marginBottom:12}}><ReviewBanner patches={aiPatches} onApply={({approvedFields,rejectedFields,editedFields,patchId})=>{approvedFields.forEach(({field,value})=>up&&up(field,value));setAiPatches(x=>x.filter(p=>p.id!==patchId));}} onDismiss={()=>setAiPatches([])}/></div>}
        <div style={{display:"flex",gap:6,marginBottom:14,borderBottom:`3px solid ${G}`,paddingBottom:8}}>
          {[{id:"consulta",l:"📝 Evolução"},{id:"timeline",l:"🕒 Timeline"}].map(t=><button key={t.id} onClick={()=>setPronTab(t.id)} style={{...sc_.btn(pronTab===t.id?"gold":"ghost",{fontSize:13,padding:"9px 20px"})}}>{t.l}</button>)}
          <button onClick={()=>{if(window.confirm("Limpar o atendimento atual da tela?")){const novoPac={...PAC0,pacID:genPacID()};setPac(novoPac);clearPacAtual?.();setDossieOncologico(criarDossieInicial(novoPac));setPronTab("consulta");}}} style={{...sc_.btn("ghost",{fontSize:11,padding:"7px 12px",marginLeft:"auto",color:"#94A3B8"})}}>🗑 Limpar atendimento</button>
        </div>
        {pronTab==="timeline"&&<div style={sc_.card()}><h3 style={{color:N,fontWeight:900,fontSize:14,marginBottom:12}}>🕒 Linha do Tempo — Exames e Evoluções</h3><EvolutionTimeline exams={pac?.exames_imagem||[]} triages={(pac?.evolucoes||[]).map(e=>{
          let dataHora;
          try{const [d,m,y]=(e.data||"01/01/2020").split("/");dataHora=new Date(`${y}-${m}-${d}T${e.hora||"00:00"}:00`).toISOString();}catch(_){dataHora=new Date().toISOString();}
          return {id:e.id||String(Date.now()),dataHora,tipo:e.tipo||"consulta",enfermeiroNome:e.autor||"Médico",queixaAtual:e.texto,sinaisAlarme:[],qtLiberada:null};
        }).concat(triagens)}/></div>}
        {pronTab==="consulta"&&<ProntuarioDossieUnico pac={pac} dossie={dossieOncologico} setDossie={setDossieOncologico} up={up} addMsg={addMsg} onAbrirAPAC={()=>setMedTab("apac")} onSalvarEvolucao={(evolucao)=>{
          const dt=new Date();
          const novaEv={id:Date.now(),data:dt.toLocaleDateString("pt-BR"),hora:dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),tipo:"Consulta médica",texto:evolucao,autor:"Dr. Silas Negrão — CRM-PB 17341",fonte:"dossie"};
          const novasEvolucoes=[novaEv,...(pac?.evolucoes||[])];
          up("evolucoes",novasEvolucoes);
          dbSalvarPaciente({...pac,evolucoes:novasEvolucoes});
          addMsg&&addMsg("Médico","Equipe","✅ Evolução do dossiê salva: "+(pac?.nome||"paciente")+".","msg");
        }}/>}
        {pronTab==="__dados_hidden"&&<div style={{display:"grid",gap:14}}>
        <div style={sc_.card()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <H2 ch="Dados Oncológicos" s={{margin:0}}/>
            <div style={{display:"flex",gap:6}}>
              <Btn v="teal" ch="🖨 Imprimir" s={{fontSize:10}} onClick={()=>abrirPremium("Prontuário — "+pac.nome,resumoProntuario,"prontuario")}/>
              <Btn v="ghost" ch="👥 Lista" s={{fontSize:10}} onClick={()=>setMedTab("pacientes")}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Diagnóstico *</label><input id="pron_diag" value={pac.diag||""} onChange={e=>{up("diag",e.target.value);const cid=getCID(e.target.value);if(cid)setTimeout(()=>up("cid",cid),200);}} placeholder="Ex: Adenocarcinoma de pulmão..." style={{...sc_.inp,width:"100%"}} onKeyDown={e=>e.key==="Enter"&&document.getElementById("pron_cid")?.focus()}/></div>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>CID-10 {pac.cid&&<span style={{fontSize:9,color:VE}}>✓ auto</span>}</label><input id="pron_cid" value={pac.cid||""} onChange={e=>up("cid",e.target.value)} placeholder="C34.1" style={{...sc_.inp,width:"100%"}}/></div>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>TNM</label><input value={pac.tnm||""} onChange={e=>{up("tnm",e.target.value);const est=getTNMEstadio(e.target.value);if(est)setTimeout(()=>up("estadio","Estádio "+est),200);}} placeholder="cT3N1M0" style={{...sc_.inp,width:"100%"}}/></div>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Estádio {pac.estadio&&<span style={{fontSize:9,color:VE}}>✓ auto</span>}</label><input value={pac.estadio||""} onChange={e=>up("estadio",e.target.value)} style={{...sc_.inp,width:"100%"}}/></div>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>ECOG</label><select value={pac.ecog||""} onChange={e=>up("ecog",e.target.value.split(" ")[0])} style={{...sc_.inp,fontSize:12}}><option value="">Selecionar...</option>{ECOG_OPTS.map((o,i)=><option key={i} value={String(i)}>{o}</option>)}</select></div>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Peso (kg)</label><input value={pac.peso||""} onChange={e=>up("peso",e.target.value)} type="number" style={{...sc_.inp,width:"100%"}}/></div>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Altura (cm) {pac.altura&&<span style={{fontSize:9,color:VE}}>✓</span>}</label><input value={pac.altura||""} onChange={e=>up("altura",e.target.value)} type="number" style={{...sc_.inp,width:"100%"}}/></div>
            <div>{scAuto&&<div style={{background:"#EAF7EE",borderRadius:8,padding:"6px 10px",border:`1px solid ${VE}`,fontSize:11,marginTop:22}}><strong style={{color:VE}}>SC = {scAuto} m²</strong></div>}</div>
          </div>
          <div style={{marginTop:10}}>
            <label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Biomarcadores</label>
            <BiomarcadoresSelector pac={pac} up={up}/>
          </div>
          <ExamesProntuario pac={pac} up={up}/>
          <Fld l="Tratamento proposto" val={pac.trat||""} set={v=>up("trat",v)} ta/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Linha</label><select value={pac.linha||""} onChange={e=>up("linha",e.target.value)} style={{...sc_.inp,fontSize:12}}><option value="">Selecionar...</option>{LINHA_OPTS.map(l=><option key={l}>{l}</option>)}</select></div>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Intenção</label><select value={pac.intencao||""} onChange={e=>up("intencao",e.target.value)} style={{...sc_.inp,fontSize:12}}><option value="">Selecionar...</option>{["Curativa","Paliativa","Neoadjuvante","Adjuvante","Perioperatória"].map(l=><option key={l}>{l}</option>)}</select></div>
          </div>
          <div style={{marginTop:8}}>
            <label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Exame Físico</label>
            <textarea value={pac.exFisico||""} onChange={e=>up("exFisico",e.target.value)} rows={3} placeholder="PA, FC, SpO₂, abdome, MMII..." style={{...sc_.inp,width:"100%",resize:"vertical",fontSize:12}}/>
          </div>
          <div style={{marginTop:10}}><BtnSalvar pac={pac} up={up}/></div>
        </div>
        <AbaExamesLaboratoriais pac={pac} up={up}/>
        <AbaExamesImagem pac={pac} up={up}/>
        </div>}
      </div>;
      case "quimio": return <PrescricaoQT pac={pac} up={up} addMsg={addMsg} ciclosHistorico={historicoQT} setCiclosHistorico={setHistoricoQT}/>;
      case "exames_med": return <div style={{display:"grid",gap:12}}>
        <div style={sc_.card()}>
          <H2 ch="📎 Novos Exames — Filtro IA"/>
          <p style={{color:"#64748B",fontSize:12,marginBottom:10}}>Todo documento enviado passa pelo filtro de IA antes de ser adicionado ao prontuário. Suporte a upload de arquivo ou colagem de texto.</p>
          <UploadComIA pac={pac} up={up} addMsg={addMsg} destino="prontuario" origem="Médico" onConcluido={(res,meta)=>{setDossieOncologico(d=>{const base=d||criarDossieInicial(pac);const doc={id:Date.now(),tipo:meta?.tipo||"Documento",nome:meta?.arquivos?.[0]?.n||"Novo exame",resumo:res,origem:"medico_upload",criadoEm:NOW()};const novo={...base,paciente:{...(base.paciente||{}),...pac},documentos:[doc,...(base.documentos||[])],resumoClaude:[base.resumoClaude,res].filter(Boolean).join("\n\n---\n"),status:"pronto_medico",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo),textoFinal:""};novo.apac=validarAPAC(novo);return novo;});alert("✅ Adicionado ao prontuário via IA.");}}/>
        </div>
        {pac?.docs_ia_resumo&&<div style={sc_.card()}><H2 ch="📋 Documentos Processados pela IA"/><Cbox text={pac.docs_ia_resumo} maxH={300}/></div>}
      </div>;
      case "receitas": return <div style={{display:"grid",gap:12}}><PrescreverDoenca pac={pac}/><ReceitasComp pac={pac} addCaixaEntrada={addCaixaEntrada} addMsg={addMsg}/></div>;
      case "apac": return <div><StatusDossieBar dossie={dossieOncologico}/><APACDossieChecklist dossie={dossieOncologico} setDossie={setDossieOncologico}/><APACSystem pac={{...pac,...(dossieOncologico?.apac?.campos||{})}} up={up} addMsg={addMsg} apacs={apacs} setApacs={setApacs}/></div>;
      case "balanco": return <GraficoProducao/>;
      case "salao": return <SalaoMedico timers={timers} addMsg={addMsg} setEmergenciaAtiva={setEmergenciaAtiva}/>;
      case "consultas_dia": return <div style={{display:"grid",gap:12}}>
        <ConsultasDiaComp consultasDia={consultasDia} setConsultasDia={setConsultasDia} onAbrirPac={abrirAtendimento}/>
        <div style={sc_.card({padding:12})}><H3 ch="🗂 Lista de Espera — Prioridade"/><ListaEsperaPrioridade listaEspera={listaEspera} setListaEspera={setListaEspera} onAbrirConsulta={abrirAtendimento}/></div>
      </div>;
      case "agenda_med": return <AgendamentoComp agendamentos={agendamentos} addAgendamento={addAgendamento} ismedico={true}/>;
      case "comunicacoes": return <DashboardComunicacao/>;
      case "ia_hub": return <IAHubComp pac={pac} addMsg={addMsg}/>;
      case "ia_agent": return <AssistenteIA pac={pac} up={up} addMsg={addMsg} funcLogado={funcLogado} onSalvarEvolucao={(evolucao)=>{
        const dt=new Date();
        const novaEv={id:Date.now(),data:dt.toLocaleDateString("pt-BR"),hora:dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),tipo:"Assistente IA",texto:evolucao,autor:"Dr. Silas Negrão — CRM-PB 17341",fonte:"ia"};
        const novasEvolucoes=[novaEv,...(pac?.evolucoes||[])];
        up("evolucoes",novasEvolucoes);
        dbSalvarPaciente({...pac,evolucoes:novasEvolucoes});
        addMsg&&addMsg("🤖 IA","Médico","✅ Documento gerado e enviado ao prontuário de "+(pac?.nome||"paciente")+".","msg");
        setMedTab("prontuario");
      }}/>;
      case "ia_test": return <IATestador pac={pac}/>;
      case "triagem_recebe": return <TriagemMedicoRecebe triagens={triagens}/>;
      case "antiglosa": return <AntiGlosaComp pac={pac} up={up}/>;
      case "drive_ia": return <DriveIntegracaoComp pac={pac} up={up} addMsg={addMsg} dossie={dossieOncologico} setDossie={setDossieOncologico}/>;
      case "buscar": return <BuscarPacienteComp pac={pac} up={up} setPac={setPac} listaEspera={listaEspera} agendamentos={agendamentos} consultasDia={consultasDia} setMedTab={setMedTab} setPronTab={setPronTab} onAbrirPaciente={abrirAtendimento}/>;
      case "trials": return <TrialsCompMelhorado pac={pac} addMsg={addMsg} mensagens={mensagens}/>;
      case "stats": return <EstatisticasComp pac={pac} consultasDia={consultasDia} historicoQT={historicoQT}/>;
      case "config": return <ConfiguracoesComp funcLogado={funcLogado} setFuncLogado={setFuncLogado}/>;
      default: return <div style={sc_.card({textAlign:"center",padding:24,color:"#94A3B8"})}><p>Selecione uma opção no menu lateral.</p></div>;
    }
  };

  if(pg==="landing") return (
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg,${N},#0b1e3a 60%,#122d55)`,display:"flex",flexDirection:"column",alignItems:"center",padding:"1.5rem 1rem 0",fontFamily:"Georgia,serif"}}>
      <div style={{position:"fixed",top:10,right:12,zIndex:1000}}><SeletorEquipe funcLogado={funcLogado} setFuncLogado={setFuncLogado}/></div>
      <div style={{width:"100%",maxWidth:600,marginTop:20}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{background:G,borderRadius:14,width:60,height:60,display:"grid",placeItems:"center",margin:"0 auto 10px",fontSize:26}}>⚕</div>
          <h1 style={{color:"#fff",fontSize:24,fontWeight:900,margin:"0 0 4px"}}>{APP_NOME}</h1>
          <p style={{color:G,fontSize:12,margin:"0 0 2px"}}>{HOSP}</p>
          <p style={{color:"rgba(255,255,255,.35)",fontSize:10}}>{HOSP2}</p>
          <div style={{marginTop:10,padding:"10px 18px",background:`rgba(184,134,11,.15)`,borderRadius:12,border:`1px solid ${G}55`,display:"inline-block"}}>
            <div style={{color:G,fontWeight:900,fontSize:14,letterSpacing:.5}}>✦ Criado por Dr. Silas Negrão Serra Jr.</div>
            <div style={{color:"rgba(255,255,255,.55)",fontSize:10,marginTop:2}}>CRM-PB 17341 · RQE Oncologia Clínica 9099</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:11}}>
          {[{icon:"👨‍⚕️",title:"Médico",sub:"Dashboard · Prontuário · QT",pg:"medico"},{icon:"💊",title:"Farmácia",sub:"Prescrições · Estoque",pg:"farmacia"},{icon:"🏥",title:"Recepção",sub:"Check-in · Agendamentos",pg:"recepcao"},{icon:"🩺",title:"Enfermagem",sub:"Salão · Triagem",pg:"enfermagem"},{icon:"🤝",title:"Assist. Social",sub:"Laudos · Benefícios",pg:"assistencia"},{icon:"🧑",title:"Portal Paciente",sub:"Reações · Documentos",pg:"paciente"}].map(b=><div key={b.pg} onClick={()=>setPg(b.pg)} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:14,padding:"14px 12px",cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.14)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.07)"}>
            <div style={{fontSize:26,marginBottom:7}}>{b.icon}</div>
            <div style={{color:"#fff",fontWeight:800,fontSize:14,marginBottom:2}}>{b.title}</div>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:10}}>{b.sub}</div>
          </div>)}
        </div>
        <APACDashboardWidget apacs={apacs} onAbrir={()=>{setPg("medico");setMedLogado(true);setMedTab("apac");}}/>
      </div>
    </div>
  );

  if(pg==="assistencia") return <AssistenciaSocialPage pac={pac} up={up} setPac={setPac} back={()=>setPg("landing")} laudoLiberado={laudoLiberado} setLaudoLiberado={setLaudoLiberado} alertCount={totalAl} onAlert={goAlerta}/>;
  if(pg==="farmacia") return <FarmaciaPage pac={pac} cicloLiberado={cicloLiberado} setCicloLiberado={setCicloLiberado} mensagens={mensagens} addMsg={addMsg} back={()=>setPg("landing")} alertCount={totalAl} onAlert={goAlerta}/>;
  if(pg==="recepcao") return <RecepcaoPage pac={pac} up={up} setPac={setPac} setPg={setPg} listaEspera={listaEspera} setListaEspera={setListaEspera} addFila={addFila} agendamentos={agendamentos} addAgendamento={addAgendamento} funcLogado={funcLogado} mensagens={mensagens} addMsg={addMsg} alertCount={totalAl} onAlert={goAlerta} dossie={dossieOncologico} setDossie={setDossieOncologico} onEnviar={()=>{
    // 1. Persiste paciente no banco
    dbSalvarPaciente(pac);
    savePacAtual(pac);
    // 2. Registra na fila de espera
    addFila({nome:pac.nome,proto:pac.trat||"Aguarda avaliação",ciclo:"Nova consulta",chegada:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),status:"aguardando",pacID:pac.pacID||""});
    // 3. Notifica médico no chat
    addMsg("Recepção","Médico",`⏳ STANDBY: ${pac.nome||"—"} aguardando atendimento médico${pac.queixa?` — Queixa: ${pac.queixa}`:""}. Clique na lista superior de atendimentos para abrir dossiê limpo.`,"standby");
    // 4. Abre módulo médico direto na aba Consulta
    setPg("medico");setMedLogado(true);setMedTab("prontuario");setPronTab("consulta");
  }}/>;
  if(pg==="enfermagem") return <EnfermagemPage pac={pac} mensagens={mensagens} addMsg={addMsg} addHistQT={addHistQT} back={()=>setPg("landing")} alertCount={totalAl} onAlert={goAlerta} onNovaTriagem={t=>{setTriagens(x=>[t,...x]);setDossieOncologico(d=>{const doc={id:Date.now(),tipo:"Triagem enfermagem",nome:"Triagem QT — "+(t?.nome||pac?.nome||"paciente"),resumo:t?.resumo||t?.conclusao||"Resumo de triagem recebido.",origem:"enfermagem",criadoEm:NOW()};const novo={...(d||criarDossieInicial(pac)),paciente:{...(d?.paciente||{}),...pac},documentos:[doc,...(d?.documentos||[])],status:"pronto_medico",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};novo.apac=validarAPAC(novo);return novo;});}}/>;
  if(pg==="comunicacao") return <ComunicacaoPage mensagens={mensagens} addMsg={addMsg} back={()=>setPg("landing")} alertCount={totalAl} onAlert={goAlerta}/>;

  if(pg==="medico"&&!medLogado) return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",padding:20}}>
      <div style={{...sc_.card({maxWidth:380,width:"100%",padding:28,textAlign:"center"})}}>
        <div style={{fontSize:44,marginBottom:12}}>👨‍⚕️</div>
        <H2 ch="Acesso Médico"/>
        <p style={{color:"#64748B",fontSize:13,marginBottom:18}}>Clique em Entrar para acessar o módulo médico.</p>
        <Btn v="gold" ch="Entrar" s={{width:"100%",fontSize:14,padding:12}} onClick={()=>setMedLogado(true)}/>
        <button onClick={()=>setPg("landing")} style={{...sc_.btn("ghost",{width:"100%",marginTop:8,fontSize:12})}}>← Voltar</button>
      </div>
    </div>
  );

  if(pg==="paciente"){
    const _pacID=pac.pacID||genPacID();const _caixa=caixaEntrada;const _addCaixa=addCaixaEntrada;const _mensagens2=mensagens;const _addMsg2=addMsg;const _laudoLib=laudoLiberado;const _addFila=addFila;

    const onCamRec=e=>{const f=Array.from(e.target.files||[]);setUpFiles(x=>[...x,...f.map(fl=>({ico:"📸",n:fl.name,tp:"Foto",obj:fl}))]);e.target.value="";};
    const onArqRec=e=>{const f=Array.from(e.target.files||[]);setUpFiles(x=>[...x,...f.map(fl=>({ico:"📄",n:fl.name,tp:"Doc",obj:fl}))]);e.target.value="";};
    if(!pacFluxo) return (
      <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
        <TopBar title="Portal do Paciente" back={()=>setPg("landing")} alertCount={totalAl} onAlert={goAlerta}/>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{textAlign:"center",maxWidth:440,width:"100%"}}>
            <div style={{fontSize:50,marginBottom:12}}>🧑</div>
            <h1 style={{color:N,fontSize:22,fontWeight:900,margin:"0 0 6px"}}>Portal do Paciente</h1>
            <p style={{color:"#64748B",fontSize:13,marginBottom:24}}>{HOSP}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div onClick={()=>setPacFluxo("primeira")} style={{...sc_.card({cursor:"pointer",padding:22,textAlign:"center",border:`2px solid ${T}`})}}><div style={{fontSize:34,marginBottom:8}}>👤</div><h2 style={{color:N,margin:"0 0 4px",fontSize:15}}>Primeira Consulta</h2><p style={{color:"#64748B",fontSize:11,margin:0}}>Cadastro e upload</p></div>
              <div onClick={()=>setPacFluxo("ja")} style={{...sc_.card({cursor:"pointer",padding:22,textAlign:"center",border:`2px solid ${G}`})}}><div style={{fontSize:34,marginBottom:8}}>📁</div><h2 style={{color:N,margin:"0 0 4px",fontSize:15}}>Já sou Paciente</h2><p style={{color:"#64748B",fontSize:11,margin:0}}>Mensagens e documentos</p></div>
            </div>
          </div>
        </div>
      </div>
    );
    if(pacFluxo==="primeira") return <PrimConsultaPaciente pac={pac} up={up} addMsg={_addMsg2} addCaixa={_addCaixa} addFila={_addFila} onDossieCriado={(entrada)=>setDossieOncologico(d=>{const docs=[...(entrada.documentos||[]),...(d?.documentos||[])];const novo={...(d||criarDossieInicial(pac)),paciente:{...(d?.paciente||{}),...(entrada.paciente||pac)},documentos:docs,status:"aguardando_recepcao",resumoClaude:entrada.resumoEntrada||d?.resumoClaude||"",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};novo.apac=validarAPAC(novo);return novo;})} onConcluido={()=>setPacFluxo(null)} back={()=>setPacFluxo(null)} alertCount={totalAl} onAlert={goAlerta}/>;
    const sinsSel2=SINAIS_T.filter(s=>sinPac.includes(s.id));
    const emerg2=sinsSel2.some(s=>s.n==="verm");const atenc2=!emerg2&&sinsSel2.some(s=>s.n==="amar");
    const PT=[{id:"reacoes",l:"⚡ Reações"},{id:"inbox",l:`📬 Msg${_caixa.filter(m=>!m.lida).length>0?" ("+_caixa.filter(m=>!m.lida).length+")":""}`},{id:"carteirinha",l:"🪪 Carteirinha"},{id:"segunda_via",l:"📄 2ª Via"},{id:"enviar_exames",l:"📤 Enviar Exame"},{id:"videos",l:"🎬 Vídeos"}];
    return (
      <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
        <TopBar title="Portal do Paciente" back={()=>setPacFluxo(null)} alertCount={totalAl} onAlert={goAlerta}/>
        <div style={{background:"rgba(27,54,93,.95)",padding:"4px 14px",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
          <span style={{color:G,fontWeight:900,fontSize:12,letterSpacing:.5}}>{_pacID}</span>
          {pac.nome&&<span style={{color:"rgba(255,255,255,.55)",fontSize:11}}>· {pac.nome}</span>}
        </div>
        <div style={{background:N,display:"flex",overflowX:"auto",borderBottom:`3px solid ${G}`,flexShrink:0}}>
          {PT.map(t=><button key={t.id} onClick={()=>setPacTab(t.id)} style={{border:"none",cursor:"pointer",padding:"9px 13px",fontSize:12,fontWeight:800,whiteSpace:"nowrap",background:pacTab===t.id?G:N,color:pacTab===t.id?"#fff":"rgba(255,255,255,.5)",flexShrink:0}}>{t.l}</button>)}
        </div>
        <div style={{flex:1,padding:16,overflowY:"auto"}}>
          {pacTab==="reacoes"&&<G2 ch={<>
            <div style={sc_.card()}>
              <H2 ch="Como você está se sentindo?"/>
              {SINAIS_T.map(s=>{const at=sinPac.includes(s.id);const cc={verm:VM,amar:AM,verd:VE}[s.n];return <label key={s.id} style={{display:"flex",gap:9,alignItems:"center",border:`1.5px solid ${at?cc:"#CBD5E1"}`,borderRadius:10,padding:"8px 11px",cursor:"pointer",background:at?cc+"11":"#fff",fontSize:13,fontWeight:700,marginBottom:5}}><input type="checkbox" checked={at} onChange={()=>setSinPac(x=>x.includes(s.id)?x.filter(i=>i!==s.id):[...x,s.id])}/>{s.txt}</label>;})}
            </div>
            <div>
              {sinPac.length===0&&<div style={sc_.card({textAlign:"center",padding:26})}><div style={{fontSize:40,marginBottom:8}}>✅</div><H2 ch="Sem sintomas"/></div>}
              {emerg2&&<div style={sc_.card({background:"#FDECEC",border:`2px solid ${VM}`})}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}><span style={{fontSize:32}}>🚨</span><h2 style={{color:VM,margin:0,fontSize:15}}>VÁ AO PRONTO-SOCORRO IMEDIATAMENTE</h2></div>
                <Cbox text={`${prescHosp(sinPac,pac)}\n\n${"─".repeat(40)}\nPaciente: ${pac.nome||"___"}\nDiagnóstico: ${pac.diag||"—"}\nProtocolo: ${pac.trat||"—"}\nAlergias: ${pac.alerg||"—"}`} maxH={240}/>
                <EmergPrintBtn sinPac={sinPac} pac={pac}/>
              </div>}
              {atenc2&&<AmareloBlocoReacoes sinPac={sinPac}/>}
              {!emerg2&&!atenc2&&sinPac.length>0&&<div style={sc_.card({background:"#EAF7EE",border:`1px solid ${VE}`})}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}><span style={{fontSize:32}}>💚</span><H2 ch="Orientações" s={{color:VE,margin:0}}/></div>
                {sinPac.map(id=>{const o=ORIENTACOES[id];if(!o)return null;return <div key={id} style={{background:"#fff",borderRadius:9,padding:"7px 10px",marginBottom:6}}><p style={{margin:0,fontSize:12,color:"#374151"}}>{o}</p></div>;})}
              </div>}
            </div>
          </>}/>}
          {pacTab==="inbox"&&<InboxPaciente pacID={_pacID} pac={pac} caixa={_caixa} setCaixa={setCaixaEntrada} mensagens={_mensagens2} addMsg={_addMsg2}/>}
          {pacTab==="carteirinha"&&<div style={{display:"grid",gap:12}}><CarteirinhaNova pac={pac}/><CarteirinhaTab pac={pac} pacID={_pacID} histQT={historicoQT} addFila={_addFila}/></div>}
          {pacTab==="segunda_via"&&<SegundaViaTab pac={pac} addCaixaEntrada={_addCaixa} laudoLiberado={_laudoLib}/>}
          {pacTab==="enviar_exames"&&<div style={sc_.card()}><H2 ch="📤 Enviar Exames ao Médico"/><p style={{color:"#64748B",fontSize:12,marginBottom:10}}>Todos os documentos são revisados pela IA antes de chegar ao médico.</p><UploadComIA pac={pac} up={up} addMsg={_addMsg2} destino="prontuario" origem="Paciente" onConcluido={()=>alert("✅ Documento enviado! O médico receberá um resumo gerado pela IA.")}/></div>}
          {pacTab==="videos"&&<VideosYouTube/>}
        </div>
      </div>
    );
  }

  const msgNaoLidasTotal=(mensagens||[]).filter(m=>m.para==="Médico"&&!m.lida).length;
  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif",position:"relative"}}>
      {emergenciaAtiva&&<div style={{position:"fixed",inset:0,background:"rgba(185,28,28,.97)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:"#fff",borderRadius:20,padding:30,maxWidth:480,width:"100%",textAlign:"center",boxShadow:"0 0 0 8px rgba(255,255,255,.2)"}}>
          <div style={{fontSize:60,marginBottom:8}}>🚨</div>
          <h1 style={{color:VM,fontSize:22,fontWeight:900,margin:"0 0 8px"}}>EMERGÊNCIA NO SALÃO</h1>
          <div style={{background:"#FFF5F5",border:`2px solid ${VM}`,borderRadius:12,padding:12,marginBottom:18}}>
            <p style={{fontSize:14,color:"#7F1D1D",fontWeight:700,margin:"0 0 3px"}}>{emergenciaAtiva.de}</p>
            <p style={{fontSize:13,color:"#374151",margin:0}}>{emergenciaAtiva.txt}</p>
            <p style={{fontSize:11,color:"#94A3B8",margin:"5px 0 0"}}>{emergenciaAtiva.hora}</p>
          </div>
          <div style={{display:"flex",gap:9}}>
            <Btn v="red" ch="🩺 Ir ao Salão Agora" s={{flex:1,fontSize:14,padding:12}} onClick={()=>{setMedTab("salao");setEmergenciaAtiva(null);}}/>
            <Btn v="ghost" ch="✕ Dispensar" s={{fontSize:12}} onClick={()=>setEmergenciaAtiva(null)}/>
          </div>
        </div>
      </div>}
      <div style={{background:N,color:"#fff",padding:"7px 14px",display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
        <button onClick={()=>setPg("landing")} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:15}}>←</button>
        <div style={{width:26,height:26,background:G,borderRadius:6,display:"grid",placeItems:"center",fontWeight:900,fontSize:12,flexShrink:0}}>A</div>
        <div style={{flex:1}}><div style={{fontWeight:900,fontSize:13}}>Oncologia Integrada</div><div style={{fontSize:9,color:"rgba(255,255,255,.35)"}}>Dr. Silas Negrão · {HOSP}</div></div>
        <div title={syncStatus.label} style={{fontSize:10,color:syncStatus.cor,background:"rgba(255,255,255,.08)",borderRadius:999,padding:"3px 9px",fontWeight:700,whiteSpace:"nowrap",cursor:"default"}}>{syncStatus.label}</div>
        <IAFloatingPanel/>
        <div style={{position:"relative",cursor:"pointer"}} onClick={()=>setChatFlutAberto(x=>!x)}>
          <div style={{background:"rgba(255,255,255,.1)",borderRadius:999,padding:"4px 10px",fontSize:11,fontWeight:700,color:"#fff"}}>💬</div>
          {msgNaoLidasTotal>0&&<span style={{position:"absolute",top:-4,right:-4,background:VM,color:"#fff",borderRadius:999,width:15,height:15,display:"grid",placeItems:"center",fontSize:9,fontWeight:900}}>{msgNaoLidasTotal}</span>}
        </div>
        {totalAlertas>0&&<div style={{background:VM,color:"#fff",padding:"4px 10px",borderRadius:999,fontSize:11,fontWeight:900,cursor:"pointer"}} onClick={()=>setMedTab("alertas")}>🚨 {totalAlertas}</div>}
      </div>
      {chatFlutAberto&&<div style={{position:"fixed",bottom:70,right:14,width:300,maxHeight:400,background:"#fff",borderRadius:14,boxShadow:"0 10px 36px rgba(0,0,0,.2)",zIndex:9998,display:"flex",flexDirection:"column",overflow:"hidden",border:`2px solid ${N}`}}>
        <div style={{background:N,color:"#fff",padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong style={{fontSize:12}}>💬 Chat Equipe</strong><button onClick={()=>setChatFlutAberto(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:15}}>✕</button></div>
        <div style={{flex:1,overflowY:"auto",padding:9,display:"flex",flexDirection:"column",gap:5,maxHeight:260}}>
          {(mensagens||[]).slice(0,8).map((m,i)=><div key={i} style={{background:m.de==="Médico"?"#EFF9FF":"#F1F5F9",borderRadius:9,padding:"5px 9px",fontSize:11}}>
            <span style={{fontWeight:700,color:N,fontSize:10}}>{m.de}→{m.para}</span>
            <p style={{margin:"2px 0 0",color:"#374151"}}>{String(m.txt||"").substring(0,70)}</p>
          </div>)}
        </div>
        <div style={{padding:"7px 9px",borderTop:"1px solid #F1F5F9",display:"flex",gap:6}}>
          <input id="chat_flut" placeholder="Mensagem..." style={{...sc_.inp,flex:1,fontSize:11}} onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){addMsg("Médico","Todos",e.target.value.trim(),"msg");e.target.value="";}}}/>
          <Btn v="teal" ch="→" s={{fontSize:12,padding:"4px 9px"}} onClick={()=>{const inp=document.getElementById("chat_flut");if(inp?.value.trim()){addMsg("Médico","Todos",inp.value.trim(),"msg");inp.value="";}}}/>
        </div>
      </div>}
      <AtendimentosStandbyBar pacientes={[...consultasDia,...listaEspera]} ativo={pac} onAbrir={abrirAtendimento} onNovo={()=>{const novoPac={...PAC0,pacID:genPacID()};setPac(novoPac);savePacAtual(novoPac);setDossieOncologico(criarDossieInicial(novoPac));setMedTab("prontuario");setPronTab("consulta");}}/>
      <div style={{flex:1,display:"grid",gridTemplateColumns:"180px 1fr",overflow:"hidden"}}>
        <nav style={{background:`linear-gradient(180deg,${N},#0b1d38)`,padding:"9px 6px",overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>
          {MT.map(t=><button key={t.id} onClick={()=>setMedTab(t.id)} style={{textAlign:"left",border:"none",background:medTab===t.id?"rgba(184,134,11,.85)":"rgba(255,255,255,.05)",color:medTab===t.id?"#fff":"rgba(255,255,255,.6)",padding:"8px 10px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:11,display:"flex",alignItems:"center",gap:6,fontFamily:"Georgia,serif",position:"relative"}}>
            <span style={{fontSize:12}}>{t.ico}</span>{t.l}
            {t.badge&&totalAlertas>0&&<span style={{position:"absolute",right:5,background:VM,color:"#fff",borderRadius:999,width:14,height:14,display:"grid",placeItems:"center",fontSize:8,fontWeight:900}}>{totalAlertas}</span>}
          </button>)}
          <div style={{marginTop:"auto",padding:"5px 2px"}}>
            <div style={{padding:"7px 8px",marginBottom:5,background:`rgba(184,134,11,.12)`,borderRadius:7,border:`1px solid ${G}33`}}>
              <div style={{color:G,fontSize:9,fontWeight:900,letterSpacing:.4}}>✦ Dr. Silas Negrão Serra Jr.</div>
              <div style={{color:"rgba(255,255,255,.35)",fontSize:8,marginTop:1}}>CRM-PB 17341 · RQE Oncol. 9099</div>
            </div>
            <button onClick={()=>{setMedLogado(false);setPg("landing");}} style={{...sc_.btn("ghost",{fontSize:10,padding:"5px",width:"100%",color:"rgba(255,255,255,.3)",background:"none",border:"1px solid rgba(255,255,255,.1)"})}}>Sair</button>
          </div>
        </nav>
        <main style={{overflowY:"auto",padding:13}}><div style={{maxWidth:1000,margin:"0 auto"}}>{renderMedico()}</div></main>
      </div>
      <Footer/>
    </div>
  );
}







