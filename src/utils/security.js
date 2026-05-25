// ─────────────────────────────────────────────────────────────────────────────
// security.js — Verificação de identidade de paciente, dossie e storage helpers
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { chavePaciente } from '../features/oncoProUtils.js';
import { NOW } from '../components/ui/primitives';

function dossiePacienteKey(pac={}){
  const id=pac.pacID||pac.cpf||pac.cns||pac.nome||"sem_paciente";
  return "dossie_oncologico_"+String(id).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_");
}
function normalizaPacienteValor(v){return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();}
function digitosPacienteValor(v){return String(v||"").replace(/\D/g,"");}
function dataPacienteChave(v){
  const s=String(v||"").trim();
  if(!s)return "";
  const iso=s.match(/\b(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\b/);
  if(iso)return String(iso[3]).padStart(2,"0")+String(iso[2]).padStart(2,"0")+iso[1];
  const br=s.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
  if(br){
    const ano=br[3].length===2?("20"+br[3]):br[3];
    return String(br[1]).padStart(2,"0")+String(br[2]).padStart(2,"0")+ano;
  }
  const d=digitosPacienteValor(s);
  if(d.length===8&&Number(d.slice(0,4))>1900)return d.slice(6,8)+d.slice(4,6)+d.slice(0,4);
  return d;
}
function escapeRegexPaciente(v){return String(v||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
function palavrasNomePaciente(nome=""){
  return normalizaPacienteValor(nome).split(" ").filter(p=>p.length>=3&&!["das","dos","del","de","da","do","e"].includes(p));
}
function nomesPacienteCompativeis(a,b){
  const na=normalizaPacienteValor(a);
  const nb=normalizaPacienteValor(b);
  if(!na||!nb)return false;
  if(na===nb)return true;
  const ta=palavrasNomePaciente(a);
  const tb=palavrasNomePaciente(b);
  if(!ta.length||!tb.length)return false;
  if(ta.length===1||tb.length===1)return ta[0]===tb[0];
  return ta[0]===tb[0]&&ta[ta.length-1]===tb[tb.length-1];
}
function nomePacienteNoTexto(nome,texto){
  const n=normalizaPacienteValor(nome);
  const t=normalizaPacienteValor(texto);
  if(!n||!t)return false;
  if(new RegExp("(^| )"+escapeRegexPaciente(n)+"( |$)").test(t))return true;
  const partes=palavrasNomePaciente(nome);
  if(partes.length>=2){
    const primeiro=new RegExp("(^| )"+escapeRegexPaciente(partes[0])+"( |$)").test(t);
    const ultimo=new RegExp("(^| )"+escapeRegexPaciente(partes[partes.length-1])+"( |$)").test(t);
    return primeiro&&ultimo;
  }
  return partes[0]?.length>=5&&new RegExp("(^| )"+escapeRegexPaciente(partes[0])+"( |$)").test(t);
}
function extrairNomeIdentificadoProntuario(texto=""){
  const linhas=String(texto||"").split(/\n/).slice(0,28);
  const pats=[
    /\b(?:nome\s+completo|nome|paciente|identifica[cç][aã]o)\s*[:\-]\s*(.+)$/i,
    /\bPaciente\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][^,;\n]{2,90})/i,
  ];
  for(const linha of linhas){
    for(const re of pats){
      const m=String(linha).match(re);
      if(!m)continue;
      const nome=String(m[1]||"")
        .replace(/\s+(nasc(?:imento)?|data\s+de\s+nascimento|cpf|cns|cart[aã]o|idade|diagn[oó]stico|diag|cid)\b.*$/i,"")
        .replace(/[|;].*$/,"")
        .replace(/^[•*\-\s]+|[.,\s]+$/g,"")
        .trim();
      const partes=palavrasNomePaciente(nome);
      if(partes.length&& !/^(atual|selecionado|paciente|nao|não|sem)$/i.test(nome))return nome;
    }
  }
  return "";
}
function extrairCpfsProntuario(texto=""){
  return [...String(texto||"").matchAll(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g)]
    .map(m=>digitosPacienteValor(m[0])).filter(Boolean);
}
function extrairCnssProntuario(texto=""){
  return [...String(texto||"").matchAll(/\b\d{15}\b/g)]
    .map(m=>digitosPacienteValor(m[0])).filter(Boolean);
}
function extrairDatasNascimentoProntuario(texto=""){
  const out=[];
  const re=/\b(?:nasc(?:imento)?|data\s+de\s+nascimento|dn)\.?\s*[:\-]?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/gi;
  let m;
  while((m=re.exec(String(texto||""))))out.push(dataPacienteChave(m[1]));
  return out.filter(Boolean);
}
function coletarNomesPacientesLocais(){
  const nomes=[];
  const add=nome=>{const n=String(nome||"").trim();if(n&&!nomes.some(x=>nomesPacienteCompativeis(x,n)))nomes.push(n);};
  const visitar=(obj,prof=0)=>{
    if(!obj||prof>4)return;
    if(Array.isArray(obj)){obj.slice(0,120).forEach(x=>visitar(x,prof+1));return;}
    if(typeof obj!=="object")return;
    add(obj.nome||obj.paciente_nome||obj.pacNome);
    visitar(obj.paciente,prof+1);
    visitar(obj.pac,prof+1);
    visitar(obj.recepcao,prof+1);
    visitar(obj.dados,prof+1);
    if(Array.isArray(obj.evolucoes))obj.evolucoes.slice(0,10).forEach(x=>visitar(x,prof+1));
  };
  try{
    if(typeof localStorage==="undefined")return nomes;
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||"";
      if(!/(pac|paciente|dossie|consulta|fila)/i.test(k))continue;
      const raw=localStorage.getItem(k)||"";
      if(!/^\s*[\[{]/.test(raw)||raw.length>350000)continue;
      try{visitar(JSON.parse(raw));}catch(_){}
    }
  }catch(_){}
  return nomes;
}
// Cache de nomes locais — evita re-escanear localStorage a cada check (memoize por 30s)
let _nomesCacheTs=0;let _nomesCache=[];
function coletarNomesPacientesLocaisCache(){
  const agora=Date.now();
  if(agora-_nomesCacheTs<30000)return _nomesCache;
  _nomesCache=coletarNomesPacientesLocais();
  _nomesCacheTs=agora;
  return _nomesCache;
}
function prontuarioSecurityCheck({pac={},texto="",dossie=null,origem="Prontuário"}={}){
  const problemas=[];
  const alertas=[];
  const p={...(dossie?.paciente||{}),...(pac||{})};
  ["nome","pac","cpf","cns","nasc","data_nascimento"].forEach(k=>{if(!p[k]&&dossie?.paciente?.[k])p[k]=dossie.paciente[k];});
  const conteudo=String(texto||"");
  const nomeAtual=p.nome||p.pac||"";

  // ── Validações estruturais básicas ────────────────────────────────────────
  if(!normalizaPacienteValor(nomeAtual)){
    problemas.push("paciente ativo sem nome demográfico — selecione um paciente antes de salvar.");
  }
  if(!conteudo.trim()){
    problemas.push("texto vazio para gravação.");
  }

  // ── Dossiê de outro paciente ──────────────────────────────────────────────
  if(dossie&&normalizaPacienteValor(dossie?.paciente?.nome)&&!mesmoPacienteDossie(dossie,pac)){
    problemas.push(`dossiê carregado pertence a "${dossie.paciente?.nome||"outro paciente"}" — não ao paciente ativo "${nomeAtual}".`);
  }

  // ── Nome explícito no texto ───────────────────────────────────────────────
  const nomeIdentificado=extrairNomeIdentificadoProntuario(conteudo);
  if(nomeIdentificado&&nomeAtual&&!nomesPacienteCompativeis(nomeIdentificado,nomeAtual)){
    problemas.push(`nome no texto ("${nomeIdentificado}") ≠ paciente ativo ("${nomeAtual}") — possível contaminação de dados.`);
  }

  // ── Outros pacientes cadastrados no localStorage ──────────────────────────
  // Cache de 30s para não re-escanear todo o localStorage a cada keystroke
  const outroNome=coletarNomesPacientesLocaisCache()
    .filter(n=>!nomesPacienteCompativeis(n,nomeAtual))
    .find(n=>nomePacienteNoTexto(n,conteudo));
  if(outroNome){
    problemas.push(`texto menciona "${outroNome}" — outro paciente cadastrado no sistema. Verifique se o conteúdo é do paciente certo.`);
  }

  // ── CPF ───────────────────────────────────────────────────────────────────
  const cpfAtual=digitosPacienteValor(p.cpf);
  const cpfs=extrairCpfsProntuario(conteudo);
  if(cpfAtual&&cpfs.some(c=>c!==cpfAtual)){
    problemas.push(`CPF no texto (${cpfs.find(c=>c!==cpfAtual)}) ≠ CPF do paciente ativo.`);
  }
  if(!cpfAtual&&cpfs.length){
    problemas.push("texto contém CPF, mas o paciente ativo não tem CPF cadastrado para conferência.");
  }

  // ── CNS ───────────────────────────────────────────────────────────────────
  const cnsAtual=digitosPacienteValor(p.cns);
  const cnss=extrairCnssProntuario(conteudo);
  if(cnsAtual&&cnss.some(c=>c!==cnsAtual)){
    problemas.push(`CNS no texto (${cnss.find(c=>c!==cnsAtual)}) ≠ CNS do paciente ativo.`);
  }
  if(!cnsAtual&&cnss.length){
    problemas.push("texto contém número CNS (15 dígitos), mas o paciente ativo não tem CNS cadastrado para conferência.");
  }

  // ── Data de nascimento ────────────────────────────────────────────────────
  const nascAtual=dataPacienteChave(p.nasc||p.data_nascimento);
  const nascs=extrairDatasNascimentoProntuario(conteudo);
  if(nascAtual&&nascs.some(d=>d!==nascAtual)){
    problemas.push(`data de nascimento no texto (${nascs.find(d=>d!==nascAtual)}) ≠ data do paciente ativo (${nascAtual}).`);
  }
  if(!nascAtual&&nascs.length){
    problemas.push("texto menciona data de nascimento, mas o paciente ativo não tem nascimento cadastrado para conferência.");
  }

  return {
    ok: problemas.length===0,
    problemas,
    alertas,
    origem,
    pacienteAtual: nomeAtual,
    agente: "Prontuário Security v2",
    // Metadados para auditoria
    _meta: {
      ts: new Date().toISOString(),
      nomeIdentificado: nomeIdentificado||null,
      outroNomeDetectado: outroNome||null,
      cpfsDetectados: cpfs,
      cnssDetectados: cnss,
    }
  };
}
function mensagemProntuarioSecurity(res){
  const alertasStr=(res?.alertas||[]).length
    ? "\n⚠️ Avisos adicionais:\n"+(res.alertas.map(a=>"  • "+a).join("\n"))
    : "";
  return [
    "🚫 PRONTUÁRIO SECURITY — SALVAMENTO BLOQUEADO",
    "─".repeat(44),
    res?.pacienteAtual?`Paciente ativo : ${res.pacienteAtual}`:"",
    res?.origem      ?`Operação       : ${res.origem}`       :"",
    "",
    "Motivo(s) do bloqueio:",
    ...(res?.problemas||[]).map(p=>"  ❌ "+p),
    alertasStr,
    "",
    "Ação necessária: verifique se o conteúdo pertence ao paciente correto.",
    "Se trouxe um resumo de outra consulta/paciente, limpe o campo e gere novamente.",
    "Nenhum dado foi gravado no prontuário.",
  ].filter(v=>v!==undefined&&v!==null).join("\n");
}
function executarProntuarioSecurity(args,addMsg){
  const res=prontuarioSecurityCheck(args);
  if(res.ok)return true;
  const msg=mensagemProntuarioSecurity(res);
  try{addMsg&&addMsg("Prontuário Security","Médico",msg,"alerta");}catch(_){}
  console.error("[ProntuarioSecurity]",res);
  try{
    const ignorar=window.confirm(msg+"\n\n────────────────────────────────\n⚠️ Deseja IGNORAR o bloqueio e salvar assim mesmo?\nOK = Forçar   |   Cancelar = Abortar");
    if(ignorar){console.warn("[ProntuarioSecurity] IGNORADO pelo médico.",res);return true;}
  }catch(_){try{alert(msg);}catch(_){}}
  return false;
}
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
function lerStorageJSON(key,fallback){
  try{
    const raw=localStorage.getItem(key);
    return raw?JSON.parse(raw):fallback;
  }catch(_){return fallback;}
}
function salvarStorageJSON(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}
}
function limparModuloPacienteStorage(pac={}){
  try{
    const pKey=chavePaciente(pac);
    if(!pKey)return {entradas:0,resultados:0};
    const entradas=lerStorageJSON("apacapp_entradas_v117",[]);
    const entradasFiltradas=Array.isArray(entradas)?entradas.filter(e=>e?.pacienteKey!==pKey):[];
    salvarStorageJSON("apacapp_entradas_v117",entradasFiltradas);
    const resultados=lerStorageJSON("apacapp_resultados_agentes_v118",{});
    const tinhaResultado=!!resultados?.[pKey];
    if(resultados&&typeof resultados==="object"){
      delete resultados[pKey];
      salvarStorageJSON("apacapp_resultados_agentes_v118",resultados);
    }
    return {entradas:(Array.isArray(entradas)?entradas.length:0)-entradasFiltradas.length,resultados:tinhaResultado?1:0};
  }catch(_){return {entradas:0,resultados:0};}
}
function pacientePareceTeste(obj={}){
  const txt=normalizaPacienteValor([
    obj?.nome,obj?.pac,obj?.pacNome,obj?.paciente?.nome,obj?.cpf,obj?.cns,obj?.diag,obj?.observacao
  ].filter(Boolean).join(" "));
  return /\b(teste|paciente teste|codex|demo|mock|fulano|ciclano|beltrano)\b/.test(txt);
}
function limparPacientesTesteStorage(){
  const removidos={pacientes:0,dossies:0,fila:0,consultas:0,entradas:0,resultados:0};
  const ids=new Set();
  const keys=new Set();
  const nomes=[];
  const registrar=obj=>{
    if(!obj)return;
    if(obj.pacID)ids.add(String(obj.pacID));
    const k=chavePaciente(obj);
    if(k)keys.add(k);
    if(obj.nome)nomes.push(obj.nome);
  };
  const corresponde=obj=>{
    if(!obj)return false;
    const k=chavePaciente(obj)||obj?.pacienteKey;
    if(k&&keys.has(k))return true;
    if(obj.pacID&&ids.has(String(obj.pacID)))return true;
    const nome=obj.nome||obj.pac||obj.pacNome||obj?.paciente?.nome;
    return nomes.some(n=>nomesPacienteCompativeis(n,nome));
  };
  try{
    const pacientes=lerStorageJSON("onco_pacientes_v1",[]);
    if(Array.isArray(pacientes)){
      pacientes.filter(pacientePareceTeste).forEach(registrar);
      const filtrados=pacientes.filter(p=>!pacientePareceTeste(p));
      removidos.pacientes=pacientes.length-filtrados.length;
      salvarStorageJSON("onco_pacientes_v1",filtrados);
    }

    const listaDossies=lerStorageJSON("dossies_oncologicos_lista",[]);
    if(Array.isArray(listaDossies)){
      const removidosLista=listaDossies.filter(d=>pacientePareceTeste(d?.paciente||d));
      removidosLista.forEach(d=>{registrar(d?.paciente);if(d?.key)keys.add(d.key);});
      const filtrados=listaDossies.filter(d=>!pacientePareceTeste(d?.paciente||d));
      removidos.dossies+=listaDossies.length-filtrados.length;
      salvarStorageJSON("dossies_oncologicos_lista",filtrados);
    }

    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i)||"";
      if(!k.startsWith("dossie_oncologico_"))continue;
      const d=lerStorageJSON(k,null);
      if(d&&pacientePareceTeste(d?.paciente||d)){
        registrar(d?.paciente);
        localStorage.removeItem(k);
        removidos.dossies+=1;
      }
    }

    const fila=lerStorageJSON("onco_fila_v1",[]);
    if(Array.isArray(fila)){
      const filtrados=fila.filter(e=>!corresponde(e)&&!pacientePareceTeste(e));
      removidos.fila=fila.length-filtrados.length;
      salvarStorageJSON("onco_fila_v1",filtrados);
    }

    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||"";
      if(!k.startsWith("consultasDia_"))continue;
      const arr=lerStorageJSON(k,[]);
      if(!Array.isArray(arr))continue;
      const filtrados=arr.filter(e=>!corresponde(e)&&!pacientePareceTeste(e));
      removidos.consultas+=arr.length-filtrados.length;
      salvarStorageJSON(k,filtrados);
    }

    const entradas=lerStorageJSON("apacapp_entradas_v117",[]);
    if(Array.isArray(entradas)){
      const filtradas=entradas.filter(e=>!(e?.pacienteKey&&keys.has(e.pacienteKey))&&!pacientePareceTeste(e?.paciente||e));
      removidos.entradas=entradas.length-filtradas.length;
      salvarStorageJSON("apacapp_entradas_v117",filtradas);
    }

    const resultados=lerStorageJSON("apacapp_resultados_agentes_v118",{});
    if(resultados&&typeof resultados==="object"){
      keys.forEach(k=>{if(resultados[k]){delete resultados[k];removidos.resultados+=1;}});
      salvarStorageJSON("apacapp_resultados_agentes_v118",resultados);
    }
  }catch(_){}
  return removidos;
}
// ─── P0: CONTENÇÃO DE MISTURA DE PACIENTES ───────────────────────────────────

/**
 * requireActivePatient — bloqueia qualquer save sem paciente identificado.
 * Um paciente é considerado ativo se tiver pelo menos um dos identificadores
 * primários: pacID, cpf ou cns.
 */
function requireActivePatient(pac) {
  return !!(pac?.pacID || pac?.cpf || pac?.cns);
}

/**
 * quarentenaLocalStorage — move para backup e apaga todos os dossiês e entradas
 * de módulo salvas no localStorage. Útil quando suspeita-se de dados contaminados.
 * Retorna o número de chaves removidas e o nome da chave de backup.
 */
function quarentenaLocalStorage() {
  try {
    const chaves = Object.keys(localStorage).filter(k =>
      k.startsWith("dossie_") || k.startsWith("apacapp_") || k === "dossie_oncologico_atual"
    );
    if (!chaves.length) return { removidas: 0, backup: null };
    const backup = {};
    chaves.forEach(k => { backup[k] = localStorage.getItem(k); localStorage.removeItem(k); });
    const backupKey = "_quarentena_" + Date.now();
    localStorage.setItem(backupKey, JSON.stringify({ ts: new Date().toISOString(), dados: backup }));
    return { removidas: chaves.length, backup: backupKey };
  } catch (_) {
    return { removidas: 0, backup: null };
  }
}

/**
 * evolucoesNaoValidadas — filtra evoluções sem origem rastreável.
 * Uma evolução é considerada suspeita se não tiver campo `fonte` ou se `fonte`
 * não estiver na lista de rotas seguras.
 */
const FONTES_SEGURAS = new Set([
  "dossie","ia_discussao","prontuario_dragdrop","medico_resumo_externo",
  "prescricao_qt","medico_upload","ia","recepcao_drive",
]);
function marcarEvolucoesNaoValidadas(evolucoes = []) {
  return evolucoes.map(ev => ({
    ...ev,
    _validado: !!(ev.fonte && FONTES_SEGURAS.has(ev.fonte)),
    _fonteOriginal: ev.fonte || "desconhecida",
  }));
}

export {
  dossiePacienteKey, normalizaPacienteValor, digitosPacienteValor,
  dataPacienteChave, escapeRegexPaciente, palavrasNomePaciente,
  nomesPacienteCompativeis, nomePacienteNoTexto,
  extrairNomeIdentificadoProntuario, extrairCpfsProntuario,
  extrairCnssProntuario, extrairDatasNascimentoProntuario,
  coletarNomesPacientesLocais, coletarNomesPacientesLocaisCache,
  prontuarioSecurityCheck, mensagemProntuarioSecurity, executarProntuarioSecurity,
  mesmoPacienteDossie, loadDossiePaciente, saveDossiePaciente,
  lerStorageJSON, salvarStorageJSON, limparModuloPacienteStorage,
  pacientePareceTeste, limparPacientesTesteStorage,
  requireActivePatient, quarentenaLocalStorage, marcarEvolucoesNaoValidadas,
  FONTES_SEGURAS,
};
