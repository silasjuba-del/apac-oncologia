/**
 * apacValidator.js — Validação APAC SUS oncologia
 * Portado de OncoApp_v5/lib/apacValidator.ts
 * Dr. Silas Negrão Serra Jr. · CRM-PB 17341
 */

const RULES = [
  { field:"nome",          label:"Nome do paciente",       req:true },
  { field:"nasc",          label:"Data de nascimento",     req:true },
  { field:"mae",           label:"Nome da mãe",            req:true },
  { field:"cidade",        label:"Município",              req:true },
  { field:"cns",           label:"CNS (15 dígitos)",       req:true, validate:(v)=>typeof v==="string"&&v.replace(/\D/g,"").length===15 },
  { field:"cid",           label:"CID-10 principal",       req:true, validate:(v)=>typeof v==="string"&&/^[A-Z]\d{2}(\.\d)?$/.test(v) },
  { field:"cod_proc",      label:"Código SIGTAP",          req:true, validate:(v)=>typeof v==="string"&&v.replace(/\D/g,"").length>=10 },
  { field:"justif_apac",   label:"Justificativa clínica",  req:true, validate:(v)=>typeof v==="string"&&v.trim().length>=80 },
  { field:"estadio",       label:"Estadiamento",           req:true, validate:(v)=>typeof v==="string"&&v.trim().length>0 },
  { field:"trat",          label:"Esquema terapêutico",    req:true, validate:(v)=>typeof v==="string"&&v.trim().length>0 },
  { field:"diag",          label:"Diagnóstico principal",  req:true },
  { field:"tnm",           label:"TNM / Estadiamento",     req:false },
  { field:"bio",           label:"Biomarcadores",          req:false },
  { field:"ecog",          label:"ECOG",                   req:false },
  { field:"cpf",           label:"CPF",                    req:false },
  { field:"data_sol",      label:"Data de solicitação",    req:false },
];

export function validateAPAC(pac) {
  const camposFaltantes = [];
  const avisos = [];
  let okCount = 0;

  for (const rule of RULES) {
    const value = pac[rule.field];
    const isEmpty =
      value === null || value === undefined || value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      if (rule.req) camposFaltantes.push(rule.label);
      else avisos.push(rule.label);
      continue;
    }
    if (rule.validate && !rule.validate(value)) {
      if (rule.req) camposFaltantes.push(`${rule.label} — formato inválido`);
      else avisos.push(`${rule.label} — verificar formato`);
      continue;
    }
    okCount++;
  }

  const score = Math.round((okCount / RULES.length) * 100);
  return { valid: camposFaltantes.length === 0, score, camposFaltantes, avisos };
}

// Tabela CID-10 por localização tumoral
export const CID10 = {
  mama:       { codigo:"C50.9", descricao:"Neoplasia maligna da mama" },
  pulmao:     { codigo:"C34.1", descricao:"Neoplasia maligna do pulmão" },
  pulmão:     { codigo:"C34.1", descricao:"Neoplasia maligna do pulmão" },
  colon:      { codigo:"C18.9", descricao:"Neoplasia maligna do cólon" },
  cólon:      { codigo:"C18.9", descricao:"Neoplasia maligna do cólon" },
  reto:       { codigo:"C20",   descricao:"Neoplasia maligna do reto" },
  prostata:   { codigo:"C61",   descricao:"Neoplasia maligna da próstata" },
  próstata:   { codigo:"C61",   descricao:"Neoplasia maligna da próstata" },
  rim:        { codigo:"C64",   descricao:"Neoplasia maligna do rim" },
  bexiga:     { codigo:"C67.9", descricao:"Neoplasia maligna da bexiga" },
  estomago:   { codigo:"C16.9", descricao:"Neoplasia maligna do estômago" },
  estômago:   { codigo:"C16.9", descricao:"Neoplasia maligna do estômago" },
  gastrico:   { codigo:"C16.9", descricao:"Neoplasia maligna do estômago" },
  gástrico:   { codigo:"C16.9", descricao:"Neoplasia maligna do estômago" },
  esofago:    { codigo:"C15.9", descricao:"Neoplasia maligna do esôfago" },
  esôfago:    { codigo:"C15.9", descricao:"Neoplasia maligna do esôfago" },
  pancreas:   { codigo:"C25.9", descricao:"Neoplasia maligna do pâncreas" },
  pâncreas:   { codigo:"C25.9", descricao:"Neoplasia maligna do pâncreas" },
  ovario:     { codigo:"C56",   descricao:"Neoplasia maligna do ovário" },
  ovário:     { codigo:"C56",   descricao:"Neoplasia maligna do ovário" },
  colo_utero: { codigo:"C53.9", descricao:"Neoplasia maligna do colo do útero" },
  utero:      { codigo:"C54.9", descricao:"Neoplasia maligna do corpo do útero" },
  útero:      { codigo:"C54.9", descricao:"Neoplasia maligna do corpo do útero" },
  melanoma:   { codigo:"C43.9", descricao:"Melanoma maligno da pele" },
  linfoma:    { codigo:"C85.9", descricao:"Linfoma não-Hodgkin" },
  leucemia:   { codigo:"C91.1", descricao:"Leucemia linfocítica crônica" },
  tireoide:   { codigo:"C73",   descricao:"Neoplasia maligna da tireoide" },
  tireóide:   { codigo:"C73",   descricao:"Neoplasia maligna da tireoide" },
  figado:     { codigo:"C22.0", descricao:"Carcinoma hepatocelular" },
  fígado:     { codigo:"C22.0", descricao:"Carcinoma hepatocelular" },
  hepatico:   { codigo:"C22.0", descricao:"Carcinoma hepatocelular" },
  hepático:   { codigo:"C22.0", descricao:"Carcinoma hepatocelular" },
  cerebro:    { codigo:"C71.9", descricao:"Neoplasia maligna do encéfalo" },
  cérebro:    { codigo:"C71.9", descricao:"Neoplasia maligna do encéfalo" },
  osso:       { codigo:"C41.9", descricao:"Neoplasia maligna dos ossos" },
};

// Tabela SIGTAP por localização
export const SIGTAP = {
  mama:     { nome:"Quimioterapia do Câncer de Mama",              codigo:"03.04.02.002-3" },
  pulmao:   { nome:"Quimioterapia do Câncer de Pulmão",            codigo:"03.04.02.008-2" },
  pulmão:   { nome:"Quimioterapia do Câncer de Pulmão",            codigo:"03.04.02.008-2" },
  colon:    { nome:"Quimioterapia do Câncer de Cólon e Reto",      codigo:"03.04.02.004-0" },
  cólon:    { nome:"Quimioterapia do Câncer de Cólon e Reto",      codigo:"03.04.02.004-0" },
  reto:     { nome:"Quimioterapia do Câncer de Cólon e Reto",      codigo:"03.04.02.004-0" },
  prostata: { nome:"Quimioterapia do Câncer de Próstata",          codigo:"03.04.02.010-4" },
  próstata: { nome:"Quimioterapia do Câncer de Próstata",          codigo:"03.04.02.010-4" },
  rim:      { nome:"Quimioterapia do Câncer de Rim",               codigo:"03.04.02.024-4" },
  bexiga:   { nome:"Quimioterapia do Câncer de Bexiga",            codigo:"03.04.02.020-1" },
  estomago: { nome:"Quimioterapia do Câncer de Estômago",          codigo:"03.04.02.006-6" },
  estômago: { nome:"Quimioterapia do Câncer de Estômago",          codigo:"03.04.02.006-6" },
  gastrico: { nome:"Quimioterapia do Câncer de Estômago",          codigo:"03.04.02.006-6" },
  gástrico: { nome:"Quimioterapia do Câncer de Estômago",          codigo:"03.04.02.006-6" },
  esofago:  { nome:"Quimioterapia do Câncer de Esôfago",           codigo:"03.04.02.005-8" },
  esôfago:  { nome:"Quimioterapia do Câncer de Esôfago",           codigo:"03.04.02.005-8" },
  pancreas: { nome:"Quimioterapia do Câncer de Pâncreas",          codigo:"03.04.02.007-4" },
  pâncreas: { nome:"Quimioterapia do Câncer de Pâncreas",          codigo:"03.04.02.007-4" },
  ovario:   { nome:"Quimioterapia do Câncer de Ovário",            codigo:"03.04.02.011-2" },
  ovário:   { nome:"Quimioterapia do Câncer de Ovário",            codigo:"03.04.02.011-2" },
  colo_utero:{ nome:"Quimioterapia do Câncer do Colo do Útero",    codigo:"03.04.02.012-0" },
  utero:    { nome:"Quimioterapia do Câncer do Útero",             codigo:"03.04.02.013-9" },
  útero:    { nome:"Quimioterapia do Câncer do Útero",             codigo:"03.04.02.013-9" },
  melanoma: { nome:"Quimioterapia do Melanoma Maligno",            codigo:"03.04.02.021-0" },
  linfoma:  { nome:"Quimioterapia dos Linfomas",                   codigo:"03.04.02.016-3" },
  leucemia: { nome:"Quimioterapia das Leucemias",                  codigo:"03.04.02.015-5" },
  tireoide: { nome:"Quimioterapia do Câncer de Tireoide",          codigo:"03.04.02.018-0" },
  tireóide: { nome:"Quimioterapia do Câncer de Tireoide",          codigo:"03.04.02.018-0" },
};

// Lookups automáticos pelo texto do diagnóstico
export function getCIDFromDiag(diag) {
  if (!diag) return null;
  const d = diag.toLowerCase();
  for (const [key, val] of Object.entries(CID10)) {
    if (d.includes(key)) return val.codigo;
  }
  return null;
}

export function getSIGTAPFromDiag(diag) {
  if (!diag) return null;
  const d = diag.toLowerCase();
  for (const [key, val] of Object.entries(SIGTAP)) {
    if (d.includes(key)) return val;
  }
  return null;
}
