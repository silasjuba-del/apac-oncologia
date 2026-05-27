// ─────────────────────────────────────────────────────────────────────────────
// parse.js — Extração de campos clínicos e exames a partir de texto livre
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { limparMarkdown } from '../components/ui/primitives';
import { normalizaPacienteValor, escapeRegexPaciente } from './security';

function extrairCamposIA(txt=""){
  const out={};
  const linhas=String(txt||"").split("\n");
  linhas.forEach(l=>{
    const m=l.match(/^\*{0,2}(DIAGN[OÓ]STICO|HISTOLOGIA|TIPO DE TUMOR|SEDE TUMORAL|CID[\s-]*10|CID|ESTADIAMENTO|TNM|EST[ÁA]GIO|SUBTIPO|BIOMARCADORES?|PROTOCOLO|ESQUEMA|ECOG|QUEIXA|SINTOMAS?|CONDUTA|PENDÊNCIAS?|OBSERVAÇÕES?)\*{0,2}\s*:+\s*(.+)/i);
    if(!m)return;
    const chave=m[1].toUpperCase().trim();
    const val=m[2].replace(/\*+/g,"").trim();
    if(chave.includes("DIAGN")||chave.includes("HISTOL")||chave.includes("TIPO DE TUMOR"))out.diag=val;
    else if(chave.includes("SEDE TUMORAL"))out.local_cancer=val;
    else if(chave.startsWith("CID"))out.cid=val.replace(/\s/g,"").toUpperCase();
    else if(chave.includes("ESTAD")||chave.includes("ESTÁG")||chave.includes("ESTAG")||chave.includes("TNM"))out.estadio=val;
    else if(chave.includes("SUBTIPO"))out.subtipo=val;
    else if(chave.includes("BIO"))out.bio=val;
    else if(chave.includes("PROTO")||chave.includes("ESQUEMA"))out.trat=val;
    else if(chave.includes("ECOG"))out.ecog=val;
    else if(chave.includes("QUEIXA")||chave.includes("SINTOMA"))out.queixa=val;
  });
  return out;
}
export const EXAME_REAL_RE=/\b(TC|TOMOGRAF|RM|RESSON|PET[\s-]?CT|PET\b|USG|ULTRASS|MAMOG|RX|RAIO[\s-]?X|CINTIL|ENDOSCOP|COLONOSCOP|ECOCARD|ECOGRAF|ANATOMOPAT|AN[ÁA]TOMO|BI[ÓO]PSIA|IMUNO|IHQ|HEMOGRAMA|CREATININA|UREIA|TGO|TGP|BILIRRUB|CEA|CA[\s-]?125|CA[\s-]?19|PSA|LABORAT)/i;
const TITULOS_IA_RE=/^(DADOS\s+ANAGR[ÁA]FICOS|RESUMO\s+CL[ÍI]NICO|DADOS\s+CL[ÍI]NICOS|DADOS\s+ONCOL[ÓO]GICOS|LAUDOS?\s+EM\s+CRONOLOGIA|LABORAT[ÓO]RIO(?:\s+E\s+EXAME\s+F[ÍI]SICO)?|EXAME\s+F[ÍI]SICO|DIAGN[OÓ]STICO|CID[\s-]*10|CID|ESTADIAMENTO|TNM|BIOMARCADORES?|PROTOCOLO|ESQUEMA|ECOG|QUEIXA|SINTOMAS?|EXAMES?(?:\s+REALIZADOS?)?|EVOLU[CÇ][AÃ]O|PEND[ÊE]NCIAS?(?:\s+APAC)?|OBSERVA[CÇ][OÕ]ES?|CONDUTA)\s*:?\s*$/i;
const ORIGEM_DOC_EXAME_RE=/^(AN[ÁA]LISE\s+IA\s+RECEP[CÇ][AÃ]O|IA\s+DOCUMENTOS|RESUMO\s+IA|UPLOAD|DOCUMENTO|DOCUMENTOS?|RMADA|PROGRAMADA|CADASTRO\s+DEMOGR[ÁA]FICO|PRIMEIRA\s+CONSULTA)$/i;
function textoLinhaLimpa(txt=""){
  return limparMarkdown(txt)
    .replace(/[📋📄📎📥🧾🧬🧪🩺⚠️✅❌⏳💾📝☁️🤖]/g,"")
    .replace(/^\s*[•\-–—]\s*/gm,"")
    .replace(/\s+/g," ")
    .trim();
}
function formatarDataExame(raw=""){
  const s=String(raw||"").trim();
  let m=s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if(m)return `${m[3]}/${m[2]}/${m[1]}`;
  m=s.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
  if(m)return `${String(m[1]).padStart(2,"0")}/${String(m[2]).padStart(2,"0")}/${m[3]}`;
  return "";
}
function linhaEhTituloIA(l=""){
  const clean=limparMarkdown(String(l||""))
    .replace(/^\s*[•\-–—]\s*/,"")
    .replace(/^[=\s]+/,"")
    .replace(/[=\s:]+$/,"")
    .replace(/\s+/g," ")
    .trim();
  return TITULOS_IA_RE.test(clean);
}
function extrairSecaoIA(texto="",tituloRe){
  const linhas=limparMarkdown(texto).split("\n");
  const out=[];
  let ativo=false;
  for(const raw of linhas){
    const linha=String(raw||"").replace(/^\s*[•\-–—]\s*/,"").trim();
    if(!linha)continue;
    const temTitulo=tituloRe.test(linha);
    if(temTitulo){
      ativo=true;
      const apos=linha.replace(tituloRe,"").replace(/^[:\s]+/,"").trim();
      if(apos)out.push(apos);
      continue;
    }
    if(ativo&&linhaEhTituloIA(linha))break;
    if(ativo)out.push(linha);
  }
  return out.map(textoLinhaLimpa).filter(Boolean).join("\n").trim();
}
function extrairEvolucaoIA(texto=""){
  return extrairSecaoIA(texto,/^EVOLU[CÇ][AÃ]O\s*:?\s*/i);
}
function parseLinhaExameReal(raw="",fallback={}){
  let linha=textoLinhaLimpa(raw)
    .replace(/^EXAMES?(?:\s+REALIZADOS?)?\s*:?\s*/i,"")
    .replace(/^(tipo de documento|achados principais|conclus[aã]o|impress[aã]o|resumo)\s*:?\s*/i,"")
    .trim();
  if(linhaEhTituloIA(linha))return null;
  if(!linha)return null;
  const dataLinha=formatarDataExame(linha);
  let data=dataLinha||formatarDataExame(fallback.dataExame||fallback.data||fallback.criadoEm||fallback.createdAt)||"Data não informada";
  if(dataLinha)linha=linha.replace(/\b\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}\b/,"").replace(/^\s*[:\-–—]\s*/,"").trim();
  if(!linha||linhaEhTituloIA(linha))return null;

  let exame="",resumo="";
  const m=linha.match(/((?:TC|TOMOGRAFIA|RM|RESSON[ÂA]NCIA|PET[\s-]?CT|PET|USG|ULTRASSOM|MAMOGRAFIA|RX|RAIO[\s-]?X|CINTILOGRAFIA|ENDOSCOPIA|COLONOSCOPIA|ECOCARDIOGRAMA|ANATOMOPATOL[ÓO]GICO|BI[ÓO]PSIA|IMUNO(?:HISTO)?QU[ÍI]MICA|IHQ|HEMOGRAMA|LABORAT[ÓO]RIO)[^:;–—-]{0,90})\s*[:;–—-]\s*(.+)$/i);
  if(m){exame=m[1];resumo=m[2];}
  else{
    const partes=linha.split(/\s*(?:[:;]| – | — | - )\s*/).filter(Boolean);
    if(partes.length>=2){
      const idxExame=partes.findIndex(p=>EXAME_REAL_RE.test(p)&&!ORIGEM_DOC_EXAME_RE.test(textoLinhaLimpa(p).toUpperCase()));
      if(idxExame>=0){
        exame=partes[idxExame];
        resumo=partes.slice(idxExame+1).join(": ");
        if(!resumo&&idxExame===0)resumo=partes.slice(1).join(": ");
        if(!resumo&&idxExame>0&&!ORIGEM_DOC_EXAME_RE.test(textoLinhaLimpa(partes[0]).toUpperCase()))resumo=partes.slice(0,idxExame).join(" - ");
      }else{
        exame=partes[0];resumo=partes.slice(1).join(": ");
      }
    }
    else if(EXAME_REAL_RE.test(linha)){
      const fb=textoLinhaLimpa(fallback.exame||fallback.tipo||fallback.nome||"");
      if(!fb||ORIGEM_DOC_EXAME_RE.test(fb.toUpperCase()))return null;
      exame=fb;resumo=linha;
    }
  }
  exame=textoLinhaLimpa(exame||fallback.exame||fallback.tipo||fallback.nome||"");
  resumo=textoLinhaLimpa(resumo||fallback.resumo||"");
  if(ORIGEM_DOC_EXAME_RE.test(exame.toUpperCase())&&EXAME_REAL_RE.test(resumo)){
    return parseLinhaExameReal(resumo,{...fallback,tipo:"",nome:"",resumo:""});
  }
  if(ORIGEM_DOC_EXAME_RE.test(exame.toUpperCase()))return null;
  if(!resumo||linhaEhTituloIA(exame)||linhaEhTituloIA(resumo))return null;
  if(/^(analisado pelo backend|documento recebido|sem documentos enviados)\.?$/i.test(resumo))return null;
  if(!EXAME_REAL_RE.test([exame,resumo].join(" ")))return null;
  if(/cl[ií]nico orquestrado|validar em consulta|dados enviados pelo paciente|primeira consulta|pend[eê]ncia apac|conduta m[eé]dica/i.test([exame,resumo].join(" ")))return null;
  if(resumo.length>280)resumo=resumo.slice(0,280).replace(/\s+\S*$/,"").trim()+".";
  return {data,exame:exame.toUpperCase(),resumo};
}
function extrairExamesRealizadosTexto(texto="",fallback={}){
  const linhas=limparMarkdown(texto).split("\n");
  const out=[];
  let emExames=false;
  for(const raw of linhas){
    const l=String(raw||"").replace(/^\s*[•\-–—]\s*/,"").trim();
    if(!l)continue;
    const semMarcador=limparMarkdown(l).replace(/^[=\s]+/,"").replace(/[=\s:]+$/,"").trim();
    if(/^(EXAMES?(?:\s+REALIZADOS?)?|LAUDOS?\s+EM\s+CRONOLOGIA)\s*:?\s*$/i.test(semMarcador)){emExames=true;continue;}
    if(linhaEhTituloIA(l)){if(emExames)break;continue;}
    if(!emExames&&!EXAME_REAL_RE.test(l)&&!formatarDataExame(l))continue;
    const item=parseLinhaExameReal(l,fallback);
    if(item)out.push(item);
  }
  if(!out.length&&linhas.filter(l=>String(l||"").trim()).length<=2){
    const item=parseLinhaExameReal(texto,fallback);
    if(item)out.push(item);
  }
  return out;
}
function coletarExamesRealizados(dossie={},paciente={}){
  const fontes=[
    {texto:paciente?.anatom,tipo:"Anatomopatológico"},
    {texto:paciente?.imagen,tipo:"Imagem"},
    {texto:paciente?.exames_resumo,tipo:"Exames"},
    {texto:paciente?.docs_ia_resumo,tipo:"IA documentos"},
    {texto:dossie?.resumoClaude,tipo:"Resumo IA"},
    ...((dossie?.documentos||[]).map(doc=>({texto:[doc.resumo,doc.conteudo,doc.texto].filter(Boolean).join("\n"),...doc}))),
  ];
  const vistos=new Set();
  const exames=[];
  for(const f of fontes){
    if(!f?.texto)continue;
    for(const item of extrairExamesRealizadosTexto(f.texto,f)){
      const chave=normalizaPacienteValor(`${item.data}|${item.exame}|${item.resumo}`).slice(0,180);
      if(vistos.has(chave))continue;
      vistos.add(chave);
      exames.push(item);
    }
  }
  return exames;
}
function formatarLinhaExameRealizado(x){
  const resumo=String(x.resumo||"")
    .replace(/\s+/g," ")
    .replace(/\b(achados?\s+adicionais?|outros?\s+achados?)\s*[:\-]\s*/ig,"(")
    .trim();
  return `${x.data || "Data não informada"} - ${x.exame || "Exame"} - ${resumo}`.replace(/\s+-\s+$/,"").trim();
}
function ordemDataExame(data=""){
  const m=String(data||"").match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if(!m)return 99999999;
  const ano=m[3].length===2?Number("20"+m[3]):Number(m[3]);
  return ano*10000+Number(m[2])*100+Number(m[1]);
}
function primeiraMaiuscula(txt=""){
  const t=String(txt||"").trim();
  return t?t.charAt(0).toUpperCase()+t.slice(1):"";
}
function limparPlaceholderConsulta(txt=""){
  return String(txt||"")
    .replace(/:\s*(?:a\s+definir\s+na\s+consulta|a\s+definir)\b/gi,": ")
    .replace(/\b(?:a\s+definir\s+na\s+consulta|a\s+definir)\b/gi,"")
    .replace(/[ \t]+$/gm,"")
    .replace(/\s+([.;,])/g,"$1");
}
function extrairValorResumo(texto="",rotulos=[]){
  const linhas=limparMarkdown(texto).split("\n").map(l=>l.replace(/^\s*[•\-–—]\s*/,"").trim()).filter(Boolean);
  for(const rotulo of rotulos){
    const re=new RegExp("^"+escapeRegexPaciente(rotulo)+"\\s*:\\s*(.*)$","i");
    const rotuloNorm=normalizaPacienteValor(rotulo);
    for(let i=0;i<linhas.length;i++){
      const m=linhas[i].match(re);
      if(m){
        const direto=textoLinhaLimpa(m[1]||"");
        if(direto)return direto;
      }
      if(normalizaPacienteValor(linhas[i])===rotuloNorm){
        const prox=linhas[i+1]&&!linhaEhTituloIA(linhas[i+1])?textoLinhaLimpa(linhas[i+1]):"";
        if(prox)return prox;
      }
    }
  }
  return "";
}
export {
  extrairCamposIA,
  textoLinhaLimpa, formatarDataExame, linhaEhTituloIA,
  extrairSecaoIA, extrairEvolucaoIA,
  parseLinhaExameReal, extrairExamesRealizadosTexto,
  coletarExamesRealizados, formatarLinhaExameRealizado,
  ordemDataExame, primeiraMaiuscula, limparPlaceholderConsulta, extrairValorResumo,
};
