// ─────────────────────────────────────────────────────────────────────────────
// constants.js — Dados clínicos e identidade do app (extraído de App.jsx)
// ─────────────────────────────────────────────────────────────────────────────

// ── PALETA DE CORES ───────────────────────────────────────────────────────────
export const N="#1B365D", T="#2B7A8C", G="#B8860B", VE="#15803D", AM="#B45309", VM="#B91C1C", BG="#EEF2F7";

// ── IDENTIDADE DO APP ─────────────────────────────────────────────────────────
export const DRIVE_PASTA_URL="https://drive.google.com/drive/folders/1s10nG9xXO_UrnIdrU8gYC6PYz4uvN9EH";
export const abrirDrive=()=>window.open(DRIVE_PASTA_URL,"_blank","noopener,noreferrer");
export const AUTOR="Dr. Silas Negrão Serra Jr. — CRM-PB 17341";
export const AUTOR2="RQE Oncologia Clínica 9099 | RQE Clínica Médica 9098";
export const EQUIPE=[
  {id:"silas",  nome:"Dr. Silas Negrão Serra Jr.", cargo:"Oncologista Clínico", reg:"CRM-PB 17341 · RQE 9099",   tipo:"medico",     ico:"👨‍⚕️"},
  {id:"farm1",  nome:"Josenildo Santos",            cargo:"Farmacêutico",        reg:"CRF-PB 1234",               tipo:"farmacia",    ico:"💊"},
  {id:"enf1",   nome:"Ana Karla Lima",              cargo:"Enfermeira",          reg:"COREN-PB 5678",             tipo:"enfermagem",  ico:"🩺"},
  {id:"rec1",   nome:"Maria das Graças Silva",      cargo:"Recepcionista",       reg:"",                         tipo:"recepcao",    ico:"📋"},
  {id:"as1",    nome:"Carlos Roberto Oliveira",     cargo:"Assistente Social",   reg:"CRESS-PB 9012",             tipo:"assistencia", ico:"🤝"},
];
export const assinatura=(f)=>`${f?.nome||AUTOR}
${f?.cargo||""} ${f?.reg??""}`.trim();
export const HOSP="Hospital do Bem — Unidade Oncológica";
export const HOSP2="Complexo Hospitalar Regional Dep. Janduhy Carneiro — Patos/PB";
export const APP_NOME="Oncologia Integrada";

// ── SINAIS DE ALERTA / TRIAGEM ────────────────────────────────────────────────
export const SINAIS_T=[
  {id:"febre",txt:"Febre ≥ 37,8°C com calafrios",n:"verm"},{id:"disp",txt:"Dispneia ou dor no peito",n:"verm"},
  {id:"sang",txt:"Sangramento ativo",n:"verm"},{id:"conf",txt:"Confusão mental",n:"verm"},
  {id:"hipoTA",txt:"Pressão muito baixa / desmaio",n:"verm"},{id:"vomit",txt:"Vômitos > 4×/dia",n:"amar"},
  {id:"diarr",txt:"Diarreia ≥ 4 evacuações/dia",n:"amar"},{id:"dor",txt:"Dor intensa mal controlada",n:"amar"},
  {id:"mucosa",txt:"Mucosite com dificuldade de deglutição",n:"amar"},{id:"edema",txt:"Edema de membros ou face",n:"amar"},
  {id:"nausea",txt:"Náuseas / vômitos controlados",n:"verd"},{id:"anorex",txt:"Falta de apetite leve",n:"verd"},
  {id:"astenia",txt:"Cansaço / fadiga",n:"verd"},{id:"queda",txt:"Queda de cabelo",n:"verd"},
];
export const NIV={
  verm:{bg:"#FDECEC",cor:VM,label:"EMERGÊNCIA",instrucao:"Encaminhar ao pronto-socorro IMEDIATAMENTE"},
  amar:{bg:"#FFF7E6",cor:AM,label:"ATENÇÃO",instrucao:"Comunicar equipe médica no mesmo dia"},
  verd:{bg:"#EAF7EE",cor:VE,label:"LEVE",instrucao:"Orientações domiciliares — monitorar evolução"},
  neutro:{bg:"#F1F5F9",cor:"#94A3B8",label:"—",instrucao:"Selecione os sintomas abaixo"},
};
export const ORIENTACOES={
  nausea:"Tome ondansetrona 8 mg conforme prescrito. Refeições pequenas e frequentes. Evite gorduras e alimentos com odor forte. Gelo picado pode ajudar.",
  anorex:"Prefira alimentos nutritivos em pequenas quantidades: ovos, frango cozido, arroz, banana. Evite jejum prolongado.",
  astenia:"Esperado durante o tratamento. Descanse quando necessário. Hidratação: 2 litros/dia. Atividades leves são benéficas.",
  queda:"Temporária e reversível após o tratamento. Use chapéu ou turbante se preferir. Shampoo suave no couro cabeludo.",
};

// ── SINTOMAS ONCOLÓGICOS ──────────────────────────────────────────────────────
export const SINTOMAS_ONCOLOGICOS=[
  {grupo:"Gerais",itens:[
    {id:"perda_peso",txt:"Perda de peso sem explicação"},
    {id:"falta_apetite",txt:"Falta de apetite persistente"},
    {id:"cansaco",txt:"Cansaço ou fraqueza fora do habitual"},
    {id:"febre_suor",txt:"Febre baixa, suor noturno ou calafrios"},
    {id:"dor_persistente",txt:"Dor persistente em qualquer local"},
  ]},
  {grupo:"Mama / axila",itens:[
    {id:"caroco_mama",txt:"Sentiu caroço no peito/mama"},
    {id:"caroco_axila",txt:"Caroço na axila"},
    {id:"alteracao_mamilo",txt:"Mamilo retraído, ferida ou saída de secreção"},
    {id:"pele_mama",txt:"Pele da mama vermelha, grossa ou tipo casca de laranja"},
  ]},
  {grupo:"Respiração / tórax",itens:[
    {id:"falta_ar",txt:"Falta de ar ou chiado"},
    {id:"tosse_persistente",txt:"Tosse persistente ou rouquidão"},
    {id:"sangue_escarro",txt:"Tosse com sangue"},
    {id:"dor_torax",txt:"Dor no peito ou nas costas ao respirar"},
  ]},
  {grupo:"Digestivo / intestino",itens:[
    {id:"sangue_fezes",txt:"Sangramento pelas fezes ou fezes pretas"},
    {id:"mudanca_intestino",txt:"Mudança do hábito intestinal"},
    {id:"dor_abdominal",txt:"Dor ou aumento do volume abdominal"},
    {id:"engasgo_disfagia",txt:"Dificuldade para engolir ou engasgos"},
    {id:"vomitos_persistentes",txt:"Náuseas ou vômitos persistentes"},
  ]},
  {grupo:"Urinário / próstata / ginecológico",itens:[
    {id:"dificuldade_urinar",txt:"Dificuldade para urinar ou jato fraco"},
    {id:"sangue_urina",txt:"Sangue na urina"},
    {id:"dor_pelvica",txt:"Dor pélvica persistente"},
    {id:"sangramento_vaginal",txt:"Sangramento vaginal fora do período ou após menopausa"},
    {id:"corrimento_ferida",txt:"Corrimento, ferida genital ou dor na relação"},
  ]},
  {grupo:"Pele / boca / cabeça e pescoço",itens:[
    {id:"ferida_nao_cicatriza",txt:"Ferida que não cicatriza"},
    {id:"pinta_mudou",txt:"Pinta/sinal que cresceu, mudou cor ou sangra"},
    {id:"caroco_pescoco",txt:"Caroço no pescoço, virilha ou outra região"},
    {id:"ferida_boca",txt:"Ferida na boca, língua ou garganta"},
  ]},
  {grupo:"Ossos / neurológico",itens:[
    {id:"dor_ossos",txt:"Dor nos ossos ou fratura sem trauma importante"},
    {id:"dor_cabeca",txt:"Dor de cabeça nova ou piorando"},
    {id:"convulsao",txt:"Convulsão, desmaio ou confusão mental"},
    {id:"fraqueza_lado",txt:"Fraqueza, formigamento ou perda de força"},
  ]},
];
export const TODOS_SINTOMAS_ONCOLOGICOS=SINTOMAS_ONCOLOGICOS.flatMap(g=>g.itens);

// ── PROTOCOLOS BÁSICOS ────────────────────────────────────────────────────────
export const PROTOS=[
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

// ── BANCO DE PROTOCOLOS POR TUMOR ─────────────────────────────────────────────
export const PROTOCOLOS_DB={
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
export function detectarTumor(diag=""){const d=diag.toLowerCase();for(const[key,tumor]of Object.entries(PROTOCOLOS_DB)){if(tumor.palavras.some(p=>d.includes(p)))return{key,...tumor};}return null;}
export function listarProtocolos(tumorKey){const tumor=PROTOCOLOS_DB[tumorKey];if(!tumor)return[];return tumor.grupos.flatMap(g=>g.protos.map(p=>({...p,grupo:g.nome})));}

// ── PERÍODOS / REDUÇÕES ───────────────────────────────────────────────────────
export const PERIODOS=[
  {id:"semanal",label:"Semanal (D1 a cada 7 dias)"},{id:"q14d",label:"A cada 14 dias (D1 q14d)"},
  {id:"q21d",label:"A cada 21 dias (D1 q21d)"},{id:"d1d8q21",label:"D1 e D8 a cada 21 dias"},
  {id:"d1d8d15q28",label:"D1, D8 e D15 a cada 28 dias"},{id:"d1d14q21",label:"D1 a D14 a cada 21 dias (VO)"},
  {id:"diario",label:"Diário contínuo (VO)"},{id:"custom",label:"Outro (especificar)"},
];
export const REDUCOES=[
  {pct:0,label:"Dose plena (100%)",cor:VE},{pct:10,label:"Redução de 10%",cor:AM},
  {pct:20,label:"Redução de 20%",cor:"#F97316"},{pct:25,label:"Redução de 25%",cor:VM},
];

// ── EXAMES / IMAGEM / TRIAGEM ─────────────────────────────────────────────────
export const EXAMES_LAB_TEMPLATE=[
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
export const TIPOS_IMAGEM=["Tomografia Computadorizada (TC)","Ressonância Magnética (RM)","PET-CT","Cintilografia Óssea","Ultrassonografia","Radiografia","Mamografia","Ecocardiograma","Biópsia / Anatomia Patológica","Mielograma","Outro"];
export const PASSOS_TRIAGEM=[{n:1,l:"Identificação"},{n:2,l:"Sinais Vitais"},{n:3,l:"Laboratorial"},{n:4,l:"ECOG / Estado"},{n:5,l:"CTCAE"},{n:6,l:"Conclusão"}];
export const CTCAE_ITEMS=[
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

// ── DOCUMENTAÇÃO / GLOSA ──────────────────────────────────────────────────────
export const DOCS_OBR=[
  {id:"d1",n:"Documento de identificação (CPF)",peso:1},{id:"d2",n:"Cartão SUS / CNS",peso:1},
  {id:"d3",n:"Anatomopatológico",peso:3},{id:"d4",n:"Imuno-histoquímica / biomarcadores",peso:2},
  {id:"d5",n:"Imagem basal com estadiamento",peso:3},{id:"d6",n:"TNM / estadiamento descrito",peso:3},
  {id:"d7",n:"CID-10 compatível",peso:2},{id:"d8",n:"Linha de tratamento documentada",peso:2},
  {id:"d9",n:"Protocolo, dose e periodicidade",peso:3},{id:"d10",n:"Assinatura / carimbo médico",peso:1},
];
export const ESTOQUE=[
  {f:"Oxaliplatina 50 mg",amp:24,uso:6},{f:"5-FU 500 mg",amp:48,uso:8},
  {f:"Leucovorina 100 mg",amp:30,uso:4},{f:"Carboplatina 450 mg",amp:12,uso:3},
  {f:"Paclitaxel 300 mg",amp:8,uso:2},{f:"Pembrolizumabe 100 mg",amp:6,uso:2},
  {f:"Doxorrubicina 50 mg",amp:15,uso:3},
];
export const MOCK_ALERTAS=[
  {id:1,nome:"Maria Aparecida Santos",diag:"Adenocarcinoma cólon IV",sint:"Febre 38,5°C + calafrios",n:"verm",h:"08:14"},
  {id:2,nome:"José Francisco Lima",diag:"Ca próstata metastático",sint:"Vômitos persistentes",n:"amar",h:"09:32"},
  {id:3,nome:"Ana Maria Rodrigues",diag:"Ca mama RH+ HER2−",sint:"Astenia intensa",n:"verd",h:"10:05"},
];
export const MOCK_CADEIRAS=[
  {id:"P01",pac:"Maria A. Santos",proto:"mFOLFOX6",min:145,st:"ocup"},
  {id:"P02",pac:"João P. Ferreira",proto:"Carboplatina+Paclitaxel",min:80,st:"ocup"},
  {id:"P03",pac:"Ana R. Costa",proto:"AC",min:200,st:"ocup"},
  {id:"P04",pac:"Preparo em curso",proto:"Pembrolizumabe",min:0,st:"prep"},
  {id:"P05",pac:"—",proto:"—",min:0,st:"livre"},
  {id:"P06",pac:"—",proto:"—",min:0,st:"livre"},
];
export const TRIALS=[
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

// ── PACIENTE — ESTADO INICIAL ─────────────────────────────────────────────────
export const genPacID=()=>"OI-"+new Date().getFullYear()+"-"+String(Math.floor(Math.random()*9000)+1000);
export const PAC0={nome:"",nome_social:"",nasc:"",idade:"",cpf:"",cns:"",rg:"",prontuario:"",cidade:"",naturalidade:"",local_cancer:"",cid_sugerido:"",tel:"",telefone_celular:"",whatsapp:"",telefone_alternativo:"",mae:"",responsavel_nome:"",responsavel_parentesco:"",responsavel_telefone:"",acompanhante_nome:"",queixa:"",antec:"",meds:"",alerg:"",sexo:"",convenio:"",diag:"",cid:"",tnm:"",estadio:"",bio:"",ecog:"",trat:"",linha:"",intencao:"",pacID:genPacID(),peso:"",altura:"",exFisico:"",hipFunc:"",anam_remedio_doenca:"",anam_cirurgia:"",anam_hist_fam:"",docs_drive_resumo:"",cod_proc:"0304010072",cid_sec:"",cid_causas:"",exames_resumo:"",justif_apac:"",validade_apac:"",raca:"",etnia:"",endereco:"",tipo_logradouro:"",logradouro:"",numero:"",complemento:"",bairro:"",municipio_cod:"2512903",uf:"PB",cep:"58700-000",zona:"",data_sol:""};
export const calcSC=(peso,altura)=>{const p=Number(peso),h=Number(altura);if(!p||!h)return null;return Math.sqrt(p*h/3600).toFixed(2);};
export const calcProxCiclo=(proto,dataBase)=>{const d=new Date(dataBase||Date.now());const p=(proto||"").toUpperCase();let dias=21;if(/FOLFOX|FOLFIRI|FOLFOXIRI|XELOX/.test(p))dias=14;if(/SEMANAL|WEEKLY/.test(p))dias=7;if(/TAMOX|ANASTRO|LETRO|EXEMESTA/.test(p))dias=30;if(/TRIPTORE|LECTRUM/.test(p))dias=28;d.setDate(d.getDate()+dias);return d.toLocaleDateString("pt-BR");};
export const MOCK_PAC={nome:"Maria Aparecida dos Santos",nasc:"12/03/1964",idade:"62",cpf:"000.000.000-00",cns:"000 0000 0000 0000",cidade:"Patos-PB",tel:"(83) 99999-0000",mae:"Francisca Maria dos Santos",queixa:"Perda ponderal e dor abdominal.",antec:"HAS controlada.",meds:"Losartana 50 mg/dia.",alerg:"Nega.",diag:"Adenocarcinoma cólon sigmoide metastático — fígado.",cid:"C18.7",tnm:"cT3N1M1",estadio:"Estádio IV",bio:"RAS wt · BRAF wt · MSS",ecog:"1",trat:"mFOLFOX6 ± cetuximabe",linha:"1ª linha paliativa",intencao:"Paliativa — possibilidade de conversão"};

// ── BIOMARCADORES ─────────────────────────────────────────────────────────────
export const BIOM={
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

// ── CID-10 ────────────────────────────────────────────────────────────────────
export const CID_DB={
  "adenocarcinoma cólon":"C18.9","adenocarcinoma reto":"C20","adenocarcinoma gástrico":"C16.9",
  "adenocarcinoma pâncreas":"C25.9","adenocarcinoma pulmão":"C34.1","carcinoma pulmão":"C34.1",
  "adenocarcinoma mama":"C50.9","carcinoma mama":"C50.9","adenocarcinoma ovário":"C56",
  "carcinoma ovário":"C56","carcinoma próstata":"C61","adenocarcinoma próstata":"C61",
  "carcinoma esôfago":"C15.9","carcinoma esôfago/jeg":"C16.0","carcinoma cabeça pescoço":"C14.8",
  "carcinoma bexiga":"C67.9","carcinoma rim":"C64","carcinoma colo útero":"C53.9",
  "carcinoma endométrio":"C54.1","melanoma":"C43.9","carcinoma tireóide":"C73",
  "linfoma":"C85.9","leucemia":"C95.9","mieloma":"C90.0","carcinoma hepatocelular":"C22.0",
};
export const getCID=(diag)=>{const d=(diag||"").toLowerCase();return Object.entries(CID_DB).find(([k])=>d.includes(k))?.[1]||"";};
export const CID_SEDE_DB=[
  {cid:"C50.9",sede:"Mama",keys:["mama","seio","mamaria","mamário"]},
  {cid:"C34.9",sede:"Pulmão",keys:["pulmao","pulmão","bronquio","brônquio","torax","tórax"]},
  {cid:"C18.9",sede:"Cólon / intestino grosso",keys:["colon","cólon","intestino","sigmoide","ceco"]},
  {cid:"C20",sede:"Reto",keys:["reto","retal"]},
  {cid:"C61",sede:"Próstata",keys:["prostata","próstata"]},
  {cid:"C53.9",sede:"Colo do útero",keys:["colo do utero","colo do útero","cervix","cérvix"]},
  {cid:"C56",sede:"Ovário",keys:["ovario","ovário"]},
  {cid:"C16.9",sede:"Estômago",keys:["estomago","estômago","gastrico","gástrico"]},
  {cid:"C25.9",sede:"Pâncreas",keys:["pancreas","pâncreas","pancreatico","pancreático"]},
  {cid:"C67.9",sede:"Bexiga",keys:["bexiga","urotelial"]},
  {cid:"C64",sede:"Rim",keys:["rim","renal"]},
  {cid:"C22.0",sede:"Fígado",keys:["figado","fígado","hepatico","hepático","hepatocelular"]},
  {cid:"C15.9",sede:"Esôfago",keys:["esofago","esôfago"]},
  {cid:"C43.9",sede:"Pele / melanoma",keys:["melanoma","pele"]},
  {cid:"C73",sede:"Tireoide",keys:["tireoide","tireóide"]},
  {cid:"C85.9",sede:"Linfoma",keys:["linfoma","linfonodo","ganglio","gânglio"]},
  {cid:"C90.0",sede:"Mieloma",keys:["mieloma"]},
  {cid:"C79.5",sede:"Metástase óssea",keys:["osso","ossea","óssea","ossos"]},
];
export const getCIDPorSede=(sede="")=>{
  const normalizar=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  const d=normalizar(sede);
  return CID_SEDE_DB.find(x=>x.keys.some(k=>d.includes(normalizar(k))))||null;
};
export const getTNMEstadio=(tnm)=>{if(!tnm)return"";const t=tnm.toUpperCase();if(t.includes("M1"))return"IV";if(t.match(/T[34]|N[23]/))return"III";if(t.match(/T2|N1/))return"II";return"I";};
export const ECOG_OPTS=["0 — Ativo, sem restrição","1 — Restrição leve, deambula","2 — Acamado <50% do dia","3 — Acamado >50% do dia","4 — Completamente incapacitado"];
export const LINHA_OPTS=["1ª linha","2ª linha","3ª linha","4ª linha ou mais","Neoadjuvante","Adjuvante","Perioperatório","Paliativo"];

// ── FARMÁCIA — ESTOQUE ────────────────────────────────────────────────────────
export const ESTOQUE_IV=[
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
export const MEDS_ORAIS=[
  {id:"cap500",n:"Capecitabina 500 mg",dose:"500 mg/cp",un:"cp",estoque:840,minimo:200},
  {id:"tamox20",n:"Tamoxifeno 20 mg",dose:"20 mg/cp",un:"cp",estoque:180,minimo:60},
  {id:"anast1",n:"Anastrozol 1 mg",dose:"1 mg/cp",un:"cp",estoque:90,minimo:30},
  {id:"letro25",n:"Letrozol 2,5 mg",dose:"2,5 mg/cp",un:"cp",estoque:60,minimo:30},
  {id:"bica50",n:"Bicalutamida 50 mg",dose:"50 mg/cp",un:"cp",estoque:120,minimo:30},
  {id:"pred5",n:"Prednisona 5 mg",dose:"5 mg/cp",un:"cp",estoque:200,minimo:50},
  {id:"onda8",n:"Ondansetrona 8 mg",dose:"8 mg/cp",un:"cp",estoque:150,minimo:40},
  {id:"dexa4",n:"Dexametasona 4 mg",dose:"4 mg/cp",un:"cp",estoque:10,minimo:20},
];
