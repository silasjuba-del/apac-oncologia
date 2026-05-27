// ─────────────────────────────────────────────────────────────────────────────
// ProntuarioDossieUnico.jsx — Prontuário em página única com editor rich-text
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { N, G, T, VE, VM } from "../../utils/constants";
import { sc_, Btn, NOW, TODAY, limparMarkdown, copiarTexto } from "../../components/ui/primitives";
import { _apiUrl, _backendHeaders, _clinicKeyHeaders } from "../../utils/api";
import { mesmoPacienteDossie, executarProntuarioSecurity, normalizaPacienteValor } from "../../utils/security";
import { SYSTEM_PROMPT_6BLOCOS, buildUserPrompt6Blocos, MAX_TOKENS_6BLOCOS } from "../../agents/prompts";
import {
  criarDossieInicial, validarAPAC, gerarDossieClaude, gerarTextoEvolucao,
} from "../../utils/dossie";
import {
  limparPlaceholderConsulta, extrairCamposIA, extrairValorResumo,
  extrairSecaoIA, extrairEvolucaoIA, extrairExamesRealizadosTexto, EXAME_REAL_RE,
} from "../../utils/parse";
import { criarDocumentoClinico, integrarDocumentoNoDossie } from "../../utils/pipeline";
import UploadSimples from "../../components/UploadSimples.jsx";
import { DocumentosPosEvolucao } from "./DossieBarComponents";
const AssistenteIA = React.lazy(()=>import("../../components/AssistenteIA.jsx"));
import { CommandPalette } from "../../components/clinical";
import {
  CID_OPTIONS,
  PROTOCOL_OPTIONS,
} from "../../domain/oncologyOptions.js";

// ── F5: Cabeçalho oncológico compacto ────────────────────────────────────────
function LinhaOncologica({pac}){
  if(!pac?.diag&&!pac?.trat)return null;
  const chips=[
    pac?.diag&&{label:pac.diag,cor:N,txt:"#fff"},
    (pac?.cid||pac?.cid_sugerido)&&{label:pac?.cid||pac?.cid_sugerido,cor:"#0F4C81",txt:"#fff"},
    pac?.trat&&{label:pac.trat,cor:"#1D4ED8",txt:"#fff"},
    (pac?.ecog!=null&&pac?.ecog!=="")&&{label:"ECOG "+pac.ecog,cor:"#0369A1",txt:"#fff"},
    pac?.estadio&&{label:"Est. "+pac.estadio,cor:"#7C3AED",txt:"#fff"},
    pac?.tnm&&{label:pac.tnm,cor:"#374151",txt:"#fff"},
  ].filter(Boolean);
  return(
    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",background:"#F8FAFC",border:"1px solid #D7E1EF",borderRadius:8,padding:"7px 10px"}}>
      <span style={{fontSize:10,fontWeight:900,color:"#1E40AF",textTransform:"uppercase",letterSpacing:1.2,whiteSpace:"nowrap",marginRight:4}}>● Oncologia</span>
      {chips.map((c,i)=><span key={i} style={{background:c.cor,color:c.txt,borderRadius:14,padding:"2px 9px",fontSize:10.5,fontWeight:800,whiteSpace:"nowrap",lineHeight:1.35}}>{c.label}</span>)}
    </div>
  );
}

// ── F5: Seção editável (EF, Labs, Conduta, Observações) ──────────────────────
function SecaoEditavel({titulo,valor,onChange,onBlur,placeholder,rows=3,corBorda,extra,textareaId,onEnterNext}){
  return(
    <div style={{background:"#fff",border:"1px solid #DDE3EC",borderRadius:"0 0 7px 7px",marginTop:-1}}>
      <div style={{fontSize:12,fontWeight:900,color:"#fff",textTransform:"uppercase",letterSpacing:.8,padding:"7px 12px",background:corBorda||N,borderRadius:"7px 7px 0 0"}}>{titulo}</div>
      <textarea
        id={textareaId}
        value={valor}
        onChange={e=>onChange(e.target.value)}
        onBlur={onBlur}
        rows={rows}
        placeholder={placeholder}
        onKeyDown={e=>{
          if(e.key==="Enter"&&!e.shiftKey&&onEnterNext){
            e.preventDefault();
            const next=document.getElementById(onEnterNext);
            if(next){const ta=next.querySelector("textarea,input");ta?ta.focus():next.scrollIntoView({behavior:"smooth",block:"start"});}
          }
        }}
        style={{width:"100%",border:"none",padding:"11px 13px",fontFamily:"Segoe UI,Arial,sans-serif",fontSize:14,lineHeight:1.5,color:"#1E293B",resize:"vertical",background:"#fff",outline:"none",boxSizing:"border-box"}}/>
      {extra}
    </div>
  );
}

const MODELOS_EXAME_FISICO=[
  {id:"ecog0",nome:"ECOG 0 - apto pleno",texto:"Regular/bom estado geral, lucido e orientado, eupneico, eutrofico, eucardico, acianotico, anicterico, hidratado. BNF2T sem sopros. MV presente bilateralmente sem ruidos adventicios. Abdome flacido, indolor, RHA presentes, sem massas palpaveis. MMII sem edema ou empastamento. ECOG 0, clinicamente compativel com terapia sistemica."},
  {id:"ecog1",nome:"ECOG 1 - sintomatico leve",texto:"Regular estado geral, lucido e responsivo, eupneico em repouso, hidratado, acianotico. BNF2T. MV presente sem ruidos adventicios significativos. Abdome flacido, indolor, RHA presentes. MMII sem empastamento, edema discreto se presente. ECOG 1, apto a tratamento sistemico com monitorizacao clinica."},
  {id:"ecog2",nome:"ECOG 2 - fragil / avaliar dose",texto:"Estado geral regular, lucido, responsivo, sem sinais de desconforto respiratorio em repouso. Mucosas discretamente hipocoradas se aplicavel. BNF2T. MV presente bilateralmente. Abdome flacido, doloroso/indolor conforme exame, RHA presentes. MMII avaliar edema/empastamento. ECOG 2, considerar ajuste de dose e reavaliar tolerancia antes de terapia sistemica."},
  {id:"ecog3",nome:"ECOG 3 - alto risco",texto:"Estado geral comprometido, dependente para autocuidado parcial/importante, lucido ou sonolento conforme exame. Avaliar sinais de desidratacao, dispneia, infeccao, dor e instabilidade clinica. Ausculta cardiopulmonar e abdomen conforme exame. MMII avaliar edema/empastamento. ECOG 3, alto risco para terapia sistemica; discutir suporte, internacao ou tratamento proporcional."},
];

const ATALHOS_LAB=[
  {label:"Labs permissivos",modeloData:true,texto:"Hemograma, funcao hepatica e renal sem alteracoes clinicamente relevantes - permissivo ao tratamento."},
  {label:"Todos normais",modeloData:true,texto:"Hemograma, ureia, creatinina, funcao hepatica, eletrolitos e marcadores avaliados dentro dos limites de normalidade para o contexto clinico."},
  {label:"Marcadores normais",modeloData:true,texto:"Marcadores tumorais sem elevacao clinicamente relevante nesta avaliacao."},
  {label:"CEA/CA15-3 normais",modeloData:true,texto:"CEA e CA 15-3 dentro dos limites de normalidade."},
  {label:"PSA normal/baixo",modeloData:true,texto:"PSA em nivel baixo/sem elevacao relevante para progressao nesta avaliacao."},
  {label:"CA-125 normal",modeloData:true,texto:"CA-125 dentro dos limites de normalidade."},
  {label:"CA19-9 normal",modeloData:true,texto:"CA 19-9 dentro dos limites de normalidade."},
  {label:"Hb < 8",texto:"Hb < 8 g/dL - avaliar sintomas, sangramento, transfusao e adiamento/ajuste de tratamento."},
  {label:"Hb 8-10",texto:"Hb 8-10 g/dL - anemia moderada; correlacionar sintomas e protocolo."},
  {label:"Hb > 10",texto:"Hb > 10 g/dL - sem limitacao hematologica por hemoglobina para QT, se demais parametros adequados."},
  {label:"Neut < 1000",texto:"Neutrofilos < 1000/mm3 - neutropenia; adiar QT e avaliar G-CSF conforme protocolo/risco."},
  {label:"Neut 1000-1500",texto:"Neutrofilos 1000-1500/mm3 - limiar baixo; considerar risco, protocolo, dose e sinais infecciosos."},
  {label:"Neut > 1500",texto:"Neutrofilos > 1500/mm3 - parametro hematologico usualmente permissivo para QT."},
  {label:"Plaquetas < 75k",texto:"Plaquetas < 75.000/mm3 - trombocitopenia; avaliar sangramento e adiar/ajustar terapia."},
  {label:"Plaquetas > 100k",texto:"Plaquetas > 100.000/mm3 - parametro usualmente permissivo para QT."},
  {label:"Creatinina OK",texto:"Funcao renal preservada para protocolo proposto, ajustar conforme droga e clearance."},
  {label:"TGO/TGP OK",texto:"Funcao hepatica sem limitacao laboratorial relevante para o protocolo, se bilirrubinas adequadas."},
];

const PROTOCOLOS_QT_OPCOES=[
  "Docetaxel",
  "AC seguido de paclitaxel",
  "Trastuzumabe +/- quimioterapia",
  "FOLFOX",
  "CAPOX",
  "FOLFIRI",
  "Carboplatina + paclitaxel",
  "Pemetrexede + cisplatina",
  "Gemcitabina + cisplatina",
  "Gemcitabina + carboplatina",
  "Paclitaxel semanal",
  "Capecitabina",
  "Pembrolizumabe",
  "Nivolumabe",
  "Abiraterona",
  "Enzalutamida",
];

const CATEGORIAS_LAUDOS=[
  {id:"todos",label:"Todos",rx:/./i},
  {id:"tomografias",label:"Tomografias",rx:/\b(TC|tomograf)/i},
  {id:"ultrassons",label:"Ultrassons",rx:/\b(US|USG|ultrass)/i},
  {id:"ressonancias",label:"Ressonâncias",rx:/\b(RM|resson)/i},
  {id:"cintilografias",label:"Cintilografias",rx:/cintil/i},
  {id:"petct",label:"PET-CT",rx:/PET/i},
  {id:"mamografia",label:"Mamografia/US mama",rx:/mamog|mama|ultrass|usg/i},
  {id:"laboratorio",label:"Laboratório",rx:/hemograma|creatinina|ureia|tgo|tgp|bilirrub|cea|ca\s*-?\s*125|ca\s*-?\s*19|psa|laborat/i},
  {id:"patologia",label:"Patologia/IHQ",rx:/anatomopat|an[aá]tomo|bi[oó]psia|imuno|ihq|pdl1|her2|ki/i},
];

const EXAME_MODALIDADES=[
  {id:"tomografias",nome:"Tomografia",sedes:["Cranio","Torax","Abdomen","Pelve","Torax/abdomen/pelve","Pescoco","Coluna","Face"]},
  {id:"ultrassons",nome:"Ultrassom",sedes:["Mama","Abdomen total","Pelve","Tireoide","Partes moles","Doppler venoso MMII","Prostata"]},
  {id:"ressonancias",nome:"Ressonancia",sedes:["Cranio","Mama","Pelve","Abdomen","Coluna","Prostata","Face/Pescoco"]},
  {id:"cintilografias",nome:"Cintilografia",sedes:["Ossea","Miocardica","Tireoide","Renal"]},
  {id:"petct",nome:"PET-CT",sedes:["Corpo inteiro","Cranio-corpo","PSMA","FDG"]},
  {id:"mamografia",nome:"Mamografia",sedes:["Bilateral","Mama direita","Mama esquerda"]},
  {id:"laboratorio",nome:"Laboratorio",sedes:["Hemograma","Funcao renal/hepatica","Marcadores tumorais","Painel completo"]},
  {id:"patologia",nome:"Patologia/IHQ",sedes:["Biopsia","Peca cirurgica","Imuno-histoquimica","Biomarcadores"]},
];

function miniButtonStyle(active=false){
  return {border:"1px solid "+(active?G:"#CBD5E1"),background:active?"#FFF8D8":"#fff",color:active?N:"#334155",borderRadius:8,padding:"6px 9px",fontSize:11.5,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"};
}

function MultiCheckDropdown({label,options,selected,onChange,onApply,placeholder="Selecionar...",width=320}){
  const [open,setOpen]=useState(false);
  const boxRef=useRef(null);
  useEffect(()=>{
    if(!open)return;
    const onDown=(ev)=>{if(boxRef.current&&!boxRef.current.contains(ev.target))setOpen(false);};
    document.addEventListener("mousedown",onDown);
    return()=>document.removeEventListener("mousedown",onDown);
  },[open]);
  const values=Array.isArray(selected)?selected:[];
  const count=values.length;
  const normOpt=(opt)=>typeof opt==="string"?{value:opt,label:opt}:opt;
  const toggle=(value)=>{
    const next=values.includes(value)?values.filter(v=>v!==value):[...values,value];
    onChange&&onChange(next);
  };
  const aplicar=()=>{
    onApply&&onApply(values);
    setOpen(false);
  };
  return <div ref={boxRef} style={{position:"relative",width:"min(100%,"+width+"px)"}}>
    <button type="button" onClick={()=>setOpen(v=>!v)} style={{
      width:"100%",border:"1px solid "+(open?T:"#CBD5E1"),background:"#fff",color:N,borderRadius:8,
      padding:"8px 10px",fontSize:12,fontWeight:950,cursor:"pointer",fontFamily:"inherit",
      display:"flex",alignItems:"center",justifyContent:"space-between",gap:8
    }}>
      <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {label}{count?` (${count})`:": "+placeholder}
      </span>
      <span style={{fontSize:14,color:open?T:"#64748B"}}>{open?"▲":"▼"}</span>
    </button>
    {open&&<div style={{
      position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:50,width:"min(420px,92vw)",
      background:"#fff",border:"1px solid #CBD5E1",borderRadius:10,boxShadow:"0 14px 34px rgba(15,23,42,.18)",overflow:"hidden"
    }}>
      <div style={{padding:"8px 10px",background:"#F8FAFC",borderBottom:"1px solid #E2E8F0",fontSize:10.5,fontWeight:950,color:"#64748B",textTransform:"uppercase",letterSpacing:.8}}>
        Clique, role e marque os itens desejados
      </div>
      <div style={{maxHeight:230,overflowY:"auto",padding:8,display:"grid",gap:5}}>
        {options.map(raw=>{
          const opt=normOpt(raw);
          const checked=values.includes(opt.value);
          return <label key={opt.value} style={{
            display:"flex",alignItems:"center",gap:8,padding:"8px 9px",borderRadius:8,cursor:"pointer",
            background:checked?"#EAF7EE":"#fff",border:"1px solid "+(checked?VE+"66":"#E2E8F0"),
            fontSize:12,fontWeight:850,color:checked?VE:N,lineHeight:1.25
          }}>
            <input type="checkbox" checked={checked} onChange={()=>toggle(opt.value)} style={{accentColor:VE,width:15,height:15,flexShrink:0}}/>
            <span>{opt.label}</span>
          </label>;
        })}
      </div>
      <div style={{display:"flex",gap:7,padding:8,borderTop:"1px solid #E2E8F0",background:"#F8FAFC"}}>
        <button type="button" onClick={()=>onChange&&onChange([])} style={{...miniButtonStyle(),flex:1}}>Limpar</button>
        <button type="button" onClick={aplicar} style={{...miniButtonStyle(true),flex:1,background:N,color:"#fff",borderColor:N}}>Aplicar</button>
      </div>
    </div>}
  </div>;
}

function calcularIdadeLocal(nasc=""){
  const raw=String(nasc||"").trim();
  if(!raw)return "";
  const m=raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if(!m)return "";
  const ano=Number(m[3].length===2?"19"+m[3]:m[3]);
  const dt=new Date(ano,Number(m[2])-1,Number(m[1]));
  if(Number.isNaN(dt.getTime()))return "";
  const hoje=new Date();
  let idade=hoje.getFullYear()-dt.getFullYear();
  const mes=hoje.getMonth()-dt.getMonth();
  if(mes<0||(mes===0&&hoje.getDate()<dt.getDate()))idade--;
  return idade>0&&idade<130?String(idade):"";
}

function LaudoSubCaixa({ doc, idx, onUpdate, onApagar }) {
  const [dataVal, setDataVal] = useState(String(doc.data || doc.criadoEm || "").split(",")[0].trim());
  const [tipoVal, setTipoVal] = useState(doc.tipo || doc.nome || "");
  const [resumoVal, setResumoVal] = useState(doc.resumo || doc.conteudo || doc.texto || "");
  useEffect(() => {
    setDataVal(String(doc.data || doc.criadoEm || "").split(",")[0].trim());
    setTipoVal(doc.tipo || doc.nome || "");
    setResumoVal(doc.resumo || doc.conteudo || doc.texto || "");
  }, [doc.id]);
  const inpBase = { width:"100%",border:"none",outline:"none",fontSize:12,fontWeight:800,color:"#0F172A",background:"transparent",fontFamily:"inherit",padding:0 };
  return (
    <div style={{ borderTop: idx > 0 ? "1px solid #E2E8F0" : "none" }}>
      <div style={{ display:"grid", gridTemplateColumns:"130px 1fr auto", gap:0 }}>
        <div style={{ borderRight:"1px solid #E2E8F0", padding:"7px 12px", background:"#F8FAFC" }}>
          <div style={{ fontSize:9,fontWeight:900,color:"#94A3B8",textTransform:"uppercase",letterSpacing:.8,marginBottom:3 }}>Data</div>
          <input value={dataVal} onChange={e=>setDataVal(e.target.value)} onBlur={()=>onUpdate&&onUpdate("data",dataVal)} placeholder="DD/MM/AAAA" style={inpBase}/>
        </div>
        <div style={{ padding:"7px 12px", background:"#F8FAFC" }}>
          <div style={{ fontSize:9,fontWeight:900,color:"#94A3B8",textTransform:"uppercase",letterSpacing:.8,marginBottom:3 }}>Exame</div>
          <input value={tipoVal} onChange={e=>setTipoVal(e.target.value)} onBlur={()=>{onUpdate&&onUpdate("tipo",tipoVal);onUpdate&&onUpdate("nome",tipoVal);}} placeholder="Nome / modalidade do exame" style={inpBase}/>
        </div>
        <button type="button" onClick={onApagar} style={{ border:"none",background:"transparent",color:"#CBD5E1",cursor:"pointer",padding:"0 12px",fontSize:16,lineHeight:1,alignSelf:"stretch",display:"flex",alignItems:"center" }} title="Remover laudo">✕</button>
      </div>
      <textarea
        value={resumoVal}
        onChange={e=>setResumoVal(e.target.value)}
        onBlur={()=>onUpdate&&onUpdate("resumo",resumoVal)}
        rows={3}
        placeholder="Resumo — achados oncologicamente relevantes (sem técnica radiológica)..."
        style={{ width:"100%",border:"none",borderTop:"1px solid #EEF2F8",outline:"none",resize:"vertical",fontFamily:"Segoe UI,Arial,sans-serif",fontSize:13,lineHeight:1.55,padding:"9px 12px",boxSizing:"border-box",background:"#fff",color:"#334155" }}
      />
    </div>
  );
}

export default function ProntuarioDossieUnico({pac,dossie,setDossie,up,addMsg,onSalvarEvolucao,onAbrirAPAC,actionsInStepper=false,tipoConsulta=""}){
  const editorRef=useRef(null);
  const [processando,setProcessando]=useState(false);
  const [salvo,setSalvo]=useState(!!dossie?.evolucao?.textoFinal);
  const dossieAtual=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
  const [pagina,setPagina]=useState(()=>montarPaginaProntuario(dossieAtual,pac).html);
  const [texto,setTexto]=useState(()=>montarPaginaProntuario(dossieAtual,pac).texto);
  const [resumoExterno,setResumoExterno]=useState("");
  // F5 — painéis dedicados
  const [exFisico,setExFisico]=useState(pac?.exFisico||"");
  const [labsTxt,setLabsTxt]=useState(pac?.labs_txt||"");
  const [condutaTxt,setCondutaTxt]=useState(pac?.conduta||"");
  const [obsTxt,setObsTxt]=useState(pac?.obs_medico||"");
  const [trialInfo,setTrialInfo]=useState(pac?.trial_info||"");
  const [mostrarAgentes,setMostrarAgentes]=useState(false);
  const [mostrarModelosEF,setMostrarModelosEF]=useState(false);
  const [mostrarLabs,setMostrarLabs]=useState(false);
  const [mostrarQT,setMostrarQT]=useState(false);
  const [cidConduta,setCidConduta]=useState(pac?.cid||pac?.cid_sugerido||"");
  const [protocoloConduta,setProtocoloConduta]=useState(pac?.trat||"");
  const [qtSelecionadas,setQtSelecionadas]=useState(()=>pac?.trat?[pac.trat]:[]);
  const [novoLaudoTipo,setNovoLaudoTipo]=useState("");
  const [novoLaudoResumo,setNovoLaudoResumo]=useState("Sem evidencia de doença oncologica ativa/progressiva no exame descrito.");
  const [novoLaudoCat,setNovoLaudoCat]=useState("tomografias");
  const [novoLaudoModalidade,setNovoLaudoModalidade]=useState("tomografias");
  const [novoLaudoSede,setNovoLaudoSede]=useState("Torax");
  const [editandoLaudoId,setEditandoLaudoId]=useState(null);
  const [previewIATexto,setPreviewIATexto]=useState("");
  // Laudos visíveis apenas em consultas de retorno
  const isRetorno=!!(tipoConsulta&&/RETORNO/i.test(tipoConsulta))||(!!pac?.trat&&!tipoConsulta);
  const [ultimoLaudoId,setUltimoLaudoId]=useState(null);
  const [filtroLaudos,setFiltroLaudos]=useState("todos");
  const [previewRecepcao,setPreviewRecepcao]=useState("");
  // sincronizar painéis quando pac muda (ex: nova triagem selecionada)
  useEffect(()=>{
    setExFisico(v=>v||(pac?.exFisico||""));
    setLabsTxt(v=>v||(pac?.labs_txt||""));
    setCondutaTxt(v=>v||(pac?.conduta||""));
    setObsTxt(v=>v||(pac?.obs_medico||""));
    setTrialInfo(v=>v||(pac?.trial_info||""));
    setCidConduta(pac?.cid||pac?.cid_sugerido||"");
    setProtocoloConduta(pac?.trat||"");
    setQtSelecionadas(pac?.trat?[pac.trat]:[]);
  },[pac?.pacID]);
  useEffect(()=>{
    const doc=(dossieAtual?.documentos||[]).find(d=>/recep|secret/i.test(String(d?.origem||d?.tipo||d?.nome||"")));
    setPreviewRecepcao(v=>v||(doc?.resumo||doc?.conteudo||doc?.texto||""));
  },[dossieAtual?.documentos?.length,pac?.pacID]);

  const aplicarCamposClinicos=useCallback((campos={})=>{
    const limpos=Object.fromEntries(Object.entries(campos).filter(([,v])=>v!==undefined&&v!==null&&String(v).trim()!==""));
    if(!Object.keys(limpos).length)return;
    Object.entries(limpos).forEach(([k,v])=>up&&up(k,v));
    setDossie&&setDossie(d=>{
      const base=mesmoPacienteDossie(d,pac)?(d||criarDossieInicial(pac)):criarDossieInicial(pac);
      const novo={...base,paciente:{...(base.paciente||{}),...pac,...limpos},status:"prontuario_campos_clinicos",updatedAt:NOW()};
      novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};
      novo.apac=validarAPAC(novo);
      return novo;
    });
    setSalvo(false);
  },[pac,setDossie,up]);
  function esc(v=""){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
  function valor(v){
    const t=limparPlaceholderConsulta(v).trim();
    if(!t)return "";
    if(/^(—|-|nao informado|não informado|aguarda avaliação|aguarda avaliacao|sem dados)$/i.test(t))return "";
    return t;
  }
  function limpar(txt=""){
    return limparPlaceholderConsulta(txt)
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
    const raw=doc.resumo||doc.conteudo||doc.texto||"";
    // Remove identification headers injected by Claude
    const limpo=raw
      .replace(/^(para prontu[aá]rio oncol[oó]gico|identifica[cç][aã]o|===.*?===|---.*?---)\s*/gim,"")
      .replace(/\b(Nome|CPF|CNS|Nascimento|Data de nascimento|Idade|Sexo|Naturalidade|Resid[eê]ncia|Endere[cç]o)\s*:\s*[^\n]+\n?/gi,"")
      .replace(/^\s*\n/gm,"")
      .trim();
    return curta(limpo||raw,200);
  }
  // Verifica se documento é um exame médico real (não dump de identificação)
  function isExameReal(doc={}){
    const tipo=String(doc.tipo||doc.nome||"").toLowerCase();
    const origem=String(doc.origem||"").toLowerCase();
    // Rejeitar uploads de identificação/resumo geral
    if(/^upload\s*(recep|pac|geral)/i.test(tipo))return false;
    if(origem==="paciente"&&!(/biop|tomo|pet|resson|lab|imag|mamog|eco|rx|rx|cintil|patolog/i.test(tipo)))return false;
    // Aceitar qualquer doc com keyword de exame
    if(/biop|tomo|pet|resson|mamog|lab|hemograma|anatomopat|imagem|eco|cintil|rx|patolog|resona/i.test(tipo))return true;
    // Aceitar docs de origem médica/drive
    if(/medico|drive|ia_disc|ia_triag|enferm|prontuario/i.test(origem))return true;
    // Aceitar prescrição QT
    if(/prescri|ciclo|qt/i.test(tipo))return true;
    return true; // default: mostrar
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
      .filter(l=>l&&!EXAME_REAL_RE.test(l)&&!/^evolu[cç][aã]o/i.test(l)&&!/^conduta/i.test(l)&&!/^observa/i.test(l)&&!/^prontu[aá]rio/i.test(l)&&!/^para prontu[aá]rio/i.test(l)&&!/^data\s*:/i.test(l)&&!/^paciente\s*:/i.test(l)&&!/^identifica/i.test(l)&&!/^diagn[oó]stico$/i.test(l)&&!/^dados/i.test(l)&&!/^exames?$/i.test(l)&&!/^oncol[oó]gico$/i.test(l))
      .slice(0,6)
      .map(l=>curta(l,210));
  }
  function montarPaginaProntuario(d=dossieAtual,p=pac){
    const valido=mesmoPacienteDossie(d,p);
    const base=valido?d:criarDossieInicial(p);
    const px={...(base?.paciente||{}),...(p||{})};
    const textoPadrao=gerarTextoEvolucao({...base,paciente:px});
    const secStyle="font-size:14px;font-weight:950;color:"+N+";text-transform:uppercase;letter-spacing:.8px;margin:18px 0 7px;border-bottom:2px solid "+G+";padding:0 0 4px;";
    const secStyleMaior="font-size:16px;font-weight:950;color:"+N+";text-transform:uppercase;letter-spacing:.8px;margin:20px 0 8px;border-bottom:2.5px solid "+G+";padding:0 0 5px;";
    const linhaStyle="font-size:14px;line-height:1.6;font-weight:400;color:#1E293B;margin:3px 0;";
    const campoStyle="font-size:14px;line-height:1.6;color:#24364f;margin:3px 0;font-weight:400;";
    const exameStyle="font-size:13.5px;line-height:1.5;color:#24364f;margin:8px 0;padding:0;background:#FAFCFF;border:1px solid #DDE6F0;border-left:4px solid "+T+";border-radius:0 8px 8px 0;overflow:hidden;";
    const folhaStyle="background:#fff;border:1px solid #E2E8F0;border-radius:4px;padding:26px 30px;box-shadow:0 4px 14px rgba(15,23,42,.05);";
    // F5: CONDUTA e OBSERVAÇÕES são painéis dedicados — excluídos do contentEditable
    const titulosBase=["DADOS ANAGRÁFICOS","RESUMO CLÍNICO","DADOS CLÍNICOS","DADOS ONCOLÓGICOS","LAUDOS EM CRONOLOGIA"];
    const limparTituloLinha=l=>limparPlaceholderConsulta(l).replace(/^[=\s]+/g,"").replace(/[=\s:]+$/g,"").replace(/\s+/g," ").trim();
    const tituloDaLinha=l=>{
      const clean=limparTituloLinha(l).toUpperCase();
      return titulosBase.find(t=>clean.startsWith(t));
    };
    const linhas=textoPadrao.split("\n");
    const partes=[
      "<div style='"+folhaStyle+"'>",
      "<div style='font-size:16px;font-weight:950;color:"+N+";text-transform:uppercase;letter-spacing:.7px;margin-bottom:2px;'>Evolução Médica</div>",
      "<div style='font-size:15px;font-weight:900;color:#334155;margin-bottom:14px;'>"+esc(px.nome||"Paciente não selecionado")+"</div>",
    ];
    let secAtual="";
    linhas.forEach((raw)=>{
      const linha=limparPlaceholderConsulta(raw).trim();
      if(/^(CONDUTA|OBSERVA[ÇC][ÕO]ES?|PEND[ÊE]NCIAS|SUGEST[ÕO]ES)\s*:?\s*$/i.test(linha))return;
      if(/^(PEND[ÊE]NCIAS|SUGEST[ÕO]ES)\s*:/i.test(linha))return;
      const tituloSecao=tituloDaLinha(linha);
      if(tituloSecao){
        secAtual=tituloSecao;
        const tituloLimpo=limparTituloLinha(linha).toUpperCase();
        const estiloSecao=(tituloSecao==="DADOS CLÍNICOS"||tituloSecao==="DADOS ONCOLÓGICOS")?secStyleMaior:secStyle;
        const idSec=tituloSecao==="DADOS CLÍNICOS"?" id='pron-dados-clinicos'":tituloSecao==="DADOS ONCOLÓGICOS"?" id='pron-dados-oncologicos'":"";
        partes.push("<div"+idSec+" style='"+estiloSecao+"'>"+esc(tituloLimpo||tituloSecao)+"</div>");
        // F5: CONDUTA removida do contentEditable — renderizada como painel dedicado abaixo
        return;
      }
      if(!linha){
        partes.push("<div style='height:10px;'></div>");
        return;
      }
      // F5: Exame físico é painel dedicado — pula linha no contentEditable
      if(/^exame\s+f[ií]sico\s*:/i.test(linha))return;
      const semBullet=linha.replace(/^•\s*/,"");
      const isLaudoLinha=secAtual==="LAUDOS EM CRONOLOGIA"&&(
        /\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\s+-/.test(semBullet)||
        /^data\s+(n[ãa]o\s+informad[ao]|desconhecid[ao])/i.test(semBullet)||
        /^(anatomopat|an[aá]tomo|bi[oó]psia|imuno|ihq|tc|tomograf|rm|resson|mamog|pet|usg|hemograma|creatinina|cid|rx)/i.test(semBullet)
      );
      if(isLaudoLinha){
        const partes2=semBullet.split(/\s+-\s+/);
        const data=partes2[0]||"";
        const exame=partes2[1]||"";
        const rest=partes2.slice(2);
        const dataLabelNovo=/^data\s+/i.test(data)?"Sem data":data;
        partes.push("<div style='"+exameStyle+"'><div style='background:#F1F5F9;padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:13.5px;font-weight:950;color:"+N+";text-transform:uppercase;'>"+esc(dataLabelNovo+(exame?" - "+exame:""))+"</div><div style='padding:9px 10px;background:#fff;border-radius:0 0 7px 0;font-size:14px;color:#475569;min-height:34px;'>"+esc(rest.length?rest.join(" - "):"Resumo: ")+"</div><div style='padding:5px 10px;background:#F8FAFC;border-top:1px solid #EEF2F7;font-size:10.5px;color:#64748B;text-transform:uppercase;font-weight:900;letter-spacing:.5px;'>APAC: exames complementares / laudos comprobatorios</div></div>");
        return;
      }
      if(/^[A-Za-zÀ-ÿ0-9 /()-]+:\s*/.test(linha)){
        const idx=linha.indexOf(":");
        const label=linha.slice(0,idx+1);
        const valorCampo=limparPlaceholderConsulta(linha.slice(idx+1)).trim();
        const labelMaior=(secAtual==="DADOS CLÍNICOS"||secAtual==="DADOS ONCOLÓGICOS");
        const boxStyle="display:grid;grid-template-columns:"+(labelMaior?"220px":"190px")+" 1fr;gap:10px;align-items:flex-start;background:"+(valorCampo?"#FFFFFF":"#F8FAFC")+";border:1px solid #E2E8F0;border-radius:8px;padding:7px 10px;margin:5px 0;";
        const labelStyle="color:"+N+";font-weight:950;text-transform:uppercase;font-size:"+(labelMaior?"14px":"13px")+";letter-spacing:.3px;";
        const valorStyle="font-size:"+(labelMaior?"14.5px":"14px")+";font-weight:500;color:#24364f;line-height:1.55;";
        partes.push("<div style='"+boxStyle+"'><div style='"+labelStyle+"'>"+esc(label.toUpperCase())+"</div><div style='"+valorStyle+"'>"+esc(valorCampo||"")+"</div></div>");
        return;
      }
      partes.push("<div style='"+linhaStyle+"'>"+esc(linha.replace(/^•\s*/,""))+"</div>");
    });
    partes.push("</div>");
    const html=partes.join("");
    return {html,texto:htmlParaTexto(html)};
  }
  async function copiarProntuario(){
    const htmlAtual=editorRef.current?.innerHTML||pagina||"";
    const textoEditor=htmlParaTexto(htmlAtual);
    const textoCompleto=[
      textoEditor,
      exFisico&&("EXAME FISICO:\n"+exFisico),
      labsTxt&&("LABORATORIO:\n"+labsTxt),
      condutaTxt&&("CONDUTA:\n"+condutaTxt),
      obsTxt&&("OBSERVACOES:\n"+obsTxt),
      trialInfo&&("ENSAIO CLINICO / TRIAL:\n"+trialInfo),
    ].filter(Boolean).join("\n\n");
    const ok=await copiarTexto(textoCompleto);
    if(ok)addMsg&&addMsg("Médico","Prontuário","Prontuário copiado para a área de transferência.","msg");
  }
  function aplicarPagina(d=dossieAtual,p=pac){
    const pg=montarPaginaProntuario(d,p);
    setPagina(pg.html);
    setTexto(pg.texto);
    setSalvo(!!d?.evolucao?.textoFinal);
    setTimeout(()=>{if(editorRef.current)editorRef.current.innerHTML=pg.html;},0);
  }
  useEffect(()=>{aplicarPagina(dossieAtual,pac);},[
    dossie?.id,dossie?.resumoClaude,dossie?.documentos?.length,dossie?.paciente?.diag,dossie?.paciente?.queixa,
    pac?.pacID,pac?.nome,pac?.cpf,pac?.cns,pac?.nasc,
    pac?.diag,pac?.cid,pac?.local_cancer,pac?.queixa,pac?.antec,pac?.meds,pac?.alerg,
    pac?.anam_cirurgia,pac?.anam_hist_fam,pac?.sintomas_atuais,pac?.trat,pac?.bio,pac?.estadio,pac?.ecog,
    pac?.docs_ia_resumo,pac?.anatom,pac?.imagen,pac?.exames_resumo,
  ]);
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
      if(!executarProntuarioSecurity({pac,texto:[limpo.resumoClaude,limpo.evolucao?.rascunho].filter(Boolean).join("\n\n"),dossie:limpo,origem:"Dossiê Claude"},addMsg))return;
      setDossie&&setDossie(limpo);
      aplicarPagina(limpo,pac);
      setSalvo(false);
    }finally{setProcessando(false);}
  };
  const adicionarResumoDocumento=(res,meta={})=>{
    const dossieBase=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
    const doc=criarDocumentoClinico({
      tipo:meta.tipo||"Documento",
      nome:meta.arquivos?.[0]?.n||"Documento analisado",
      resumo:limpar(res),
      origem:"prontuario_dragdrop",
      extra:{exames:extrairExamesRealizadosTexto(res),evolucaoClaude:extrairEvolucaoIA(res)},
    });
    const novoDossie=integrarDocumentoNoDossie(doc,{pac,dossie:dossieBase,setDossie,up,addMsg});
    if(novoDossie){aplicarPagina(novoDossie,novoDossie.paciente||pac);setSalvo(false);}
  };
  const aplicarResumoExterno=()=>{
    const res=limparMarkdown(resumoExterno||"").trim();
    if(!res){alert("Cole primeiro o resumo gerado no GPT/Claude.");return;}
    if(!executarProntuarioSecurity({pac,texto:res,dossie,origem:"Resumo externo colado"},addMsg))return;
    const camposIA=extrairCamposIA(res);
    const camposClinicos={
      antec:extrairValorResumo(res,["antecedentes patológicos","antecedentes patologicos","antecedentes"]),
      meds:extrairValorResumo(res,["medicações de uso contínuo","medicacoes de uso continuo","medicações","medicacoes"]),
      alerg:extrairValorResumo(res,["alergias","alergia"]),
      anam_cirurgia:extrairValorResumo(res,["cirurgias prévias","cirurgias previas","cirurgias"]),
      anam_hist_fam:extrairValorResumo(res,["histórico familiar","historico familiar","histórico familiar oncológico","historico familiar oncologico"]),
      vacinas:extrairValorResumo(res,["calendário vacinal","calendario vacinal","vacinas"]),
      exFisico:extrairValorResumo(res,["exame físico","exame fisico"]),
      exames_resumo:extrairSecaoIA(res,/^LAUDOS?\s+EM\s+CRONOLOGIA\s*:?\s*/i),
      justif_apac:extrairSecaoIA(res,/^DADOS\s+ONCOL[ÓO]GICOS\s*:?\s*/i)||extrairValorResumo(res,["justificativa"]),
    };
    const sigtap=res.match(/\b03\.?\d{2}\.?\d{2}\.?\d{3}[-.]?\d\b/)?.[0]?.replace(/\D/g,"")||"";
    const protocolo=extrairValorResumo(res,["protocolo","esquema","tratamento","nome do procedimento"]);
    const pacienteAtualizado={
      ...pac,
      ...Object.fromEntries(Object.entries({...camposIA,...camposClinicos}).filter(([,v])=>v&&String(v).trim())),
      cod_proc:sigtap||pac.cod_proc||"",
      trat:protocolo||camposIA.trat||pac.trat||"",
    };
    Object.entries(pacienteAtualizado).forEach(([k,v])=>{if(v&&pac?.[k]!==v)up&&up(k,v);});
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pacienteAtualizado)):criarDossieInicial(pacienteAtualizado);
    const doc={id:Date.now(),tipo:"Resumo externo GPT/Claude",nome:"Resumo completo colado pelo médico",resumo:res,origem:"medico_resumo_externo",criadoEm:NOW(),exames:extrairExamesRealizadosTexto(res),evolucaoClaude:extrairEvolucaoIA(res)};
    const novo={...base,paciente:{...(base.paciente||{}),...pacienteAtualizado},documentos:[doc,...(base.documentos||[])],resumoClaude:res,status:"pronto_medico",updatedAt:NOW()};
    novo.evolucao={...(novo.evolucao||{}),rascunho:montarPaginaProntuario(novo,pacienteAtualizado).texto,textoFinal:""};
    novo.apac=validarAPAC(novo);
    setDossie&&setDossie(novo);
    aplicarPagina(novo,pacienteAtualizado);
    setResumoExterno("");
    setSalvo(false);
    addMsg&&addMsg("Médico","APAC","Resumo externo inserido: campos clínicos, evolução e APAC foram atualizados para revisão.","msg");
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
      // Prompt 6-BLOCOS canônico — importado de src/agents/prompts.js
      const sysPrompt = SYSTEM_PROMPT_6BLOCOS;
      const userPrompt = buildUserPrompt6Blocos(
        textoLivre,
        {
          nome:    pac?.nome,
          nasc:    pac?.nasc,
          diag:    pac?.diag,
          cid:     pac?.cid,
          estadio: pac?.estadio,
          trat:    pac?.trat,
          anatom:  pac?.anatom,
          imagen:  pac?.imagen,
          bio:     pac?.bio,
          ecog:    pac?.ecog,
        },
        arquivos.map(f=>f.name)
      );
      let resumo="";
      let backendOk=false;
      try{
        formData.set("paciente_json",JSON.stringify(pac||{}));
        formData.set("recepcao_json",JSON.stringify({}));
        formData.set("prompt_modelo",sysPrompt);
        const r=await fetch(_apiUrl()+"/api/dossie/gerar",{method:"POST",headers:_clinicKeyHeaders(),body:formData});
        const data=await r.json().catch(()=>({}));
        if(r.ok&&data.ok&&data.status==="concluido"){
          resumo=data.resumo||data.text||"";
          backendOk=!!resumo;
        }else if(r.ok&&data.ok&&data.dossieId){
          for(let tent=0;tent<30;tent++){
            await new Promise(resolve=>setTimeout(resolve,2000));
            const pacienteIdStatus=Number(pac?.id||pac?.paciente_id)||"";
            const s=await fetch(_apiUrl()+"/api/dossie/status/"+data.dossieId+"?paciente_id="+encodeURIComponent(pacienteIdStatus),{headers:_clinicKeyHeaders()}).then(x=>x.json()).catch(()=>({}));
            if(s.status_analise==="concluido"){resumo=s.resumo_claude||"";backendOk=!!resumo;break;}
            if(s.status_analise==="erro")throw new Error(s.erro_analise||"Falha na análise do backend.");
          }
        }else if(r.status!==400){
          throw new Error(data.message||("Backend HTTP "+r.status));
        }
      }catch(_){}
      if(!backendOk&&!apiKeyLocal){
        try{
          const r=await fetch(_apiUrl()+"/api/claude/resumo",{method:"POST",headers:_backendHeaders(),body:JSON.stringify({system:sysPrompt,prompt:userPrompt,maxTokens:MAX_TOKENS_6BLOCOS,files:filesBase64})});
          const data=await r.json().catch(()=>({}));
          if(r.ok&&data.ok){resumo=data.text||"";backendOk=true;}
        }catch(_){}
      }
      if(!backendOk){
        if(!apiKeyLocal)throw new Error("Backend Claude indisponível.");
        const content=filesBase64.map(f=>f.mimeType==="application/pdf"?{type:"document",source:{type:"base64",media_type:f.mimeType,data:f.base64}}:{type:"image",source:{type:"base64",media_type:f.mimeType,data:f.base64}});
        content.push({type:"text",text:userPrompt});
        const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":apiKeyLocal,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-5",max_tokens:MAX_TOKENS_6BLOCOS,system:sysPrompt,messages:[{role:"user",content}]})});
        const data=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(data.error?.message||("Erro Claude "+r.status));
        resumo=data.content?.[0]?.text||"";
      }
      if(!resumo.trim())throw new Error("Claude não retornou resumo.");
      resumo=limparMarkdown(resumo);
      if(!executarProntuarioSecurity({pac,texto:resumo,dossie,origem:"Upload/análise IA"},addMsg))return;
      // Extrair campos e popular pac via up()
      const camposDoc=extrairCamposIA(resumo);
      if(up&&Object.keys(camposDoc).length){Object.entries(camposDoc).forEach(([k,v])=>{if(v&&!pac?.[k])up(k,v);});}
      adicionarResumoDocumento(resumo,{arquivos:arquivos.map(f=>({n:f.name,tipo:f.type})),texto:textoLivre,destino:"prontuario",origem:"Médico",tipo:"Upload simples"});
    }finally{setProcessando(false);}
  };
  // F5: sincroniza painéis dedicados de volta ao pac antes de salvar
  const sincronizarPaineisAoPac=useCallback(()=>{
    if(exFisico&&exFisico!==pac?.exFisico)up&&up("exFisico",exFisico);
    if(labsTxt&&labsTxt!==pac?.labs_txt)up&&up("labs_txt",labsTxt);
    if(condutaTxt&&condutaTxt!==pac?.conduta)up&&up("conduta",condutaTxt);
    if(obsTxt&&obsTxt!==pac?.obs_medico)up&&up("obs_medico",obsTxt);
    if(trialInfo&&trialInfo!==pac?.trial_info)up&&up("trial_info",trialInfo);
  },[exFisico,labsTxt,condutaTxt,obsTxt,trialInfo,pac,up]);

  const salvar=()=>{
    sincronizarPaineisAoPac();
    const htmlAtual=editorRef.current?.innerHTML||pagina;
    const textoPrincipal=htmlParaTexto(htmlAtual);
    // F5: monta texto completo unindo contentEditable + painéis dedicados
    const secoes=[
      textoPrincipal,
      exFisico.trim()&&"EXAME FÍSICO\n"+exFisico.trim(),
      labsTxt.trim()&&"LABORATÓRIO\n"+labsTxt.trim(),
      condutaTxt.trim()&&"CONDUTA\n"+condutaTxt.trim(),
      (obsTxt.trim()||trialInfo.trim())&&[
        "OBSERVAÇÕES",
        obsTxt.trim(),
        trialInfo.trim()&&("Ensaio clínico / Trial: "+trialInfo.trim()),
      ].filter(Boolean).join("\n"),
    ].filter(Boolean);
    const textoFinal=secoes.join("\n\n");
    if(!executarProntuarioSecurity({pac,texto:textoFinal,dossie,origem:"Salvar evolução médica"},addMsg))return;
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
    const pacComPaineisF5={...pac,exFisico,labs_txt:labsTxt,conduta:condutaTxt,obs_medico:obsTxt,trial_info:trialInfo};
    const novo={...base,paciente:{...(base.paciente||{}),...pacComPaineisF5},status:"evolucao_salva",evolucao:{...(base.evolucao||{}),html:htmlAtual,rascunho:textoFinal,textoFinal,salvaEm:NOW()},updatedAt:NOW()};
    novo.apac=validarAPAC(novo);
    const okCallback=onSalvarEvolucao?onSalvarEvolucao(textoFinal):true;
    if(okCallback===false)return;
    setDossie&&setDossie(novo);
    up&&up("obs_ultima_evolucao",textoFinal);
    setTexto(textoFinal);
    setPagina(htmlAtual);
    setSalvo(true);
  };
  const limparPagina=()=>{
    const pg=montarPaginaProntuario({paciente:{...pac},documentos:[],resumoClaude:"",evolucao:{textoFinal:"",rascunho:""}},pac);
    setPagina(pg.html);setTexto(pg.texto);setSalvo(false);
    setTimeout(()=>{if(editorRef.current)editorRef.current.innerHTML=pg.html;},0);
  };
  useEffect(()=>{
    const handler=(ev)=>{
      const acao=ev?.detail?.acao;
      if(!acao)return;
      if(acao==="claude")organizar();
      if(acao==="agentes")setMostrarAgentes(v=>!v);
      if(acao==="copiar")copiarProntuario();
      if(acao==="limpar")limparPagina();
      if(acao==="salvar")salvar();
      if(acao==="apac"){setDossie&&setDossie(d=>({...d,apac:validarAPAC(d),status:"apac_validacao"}));onAbrirAPAC&&onAbrirAPAC();}
    };
    window.addEventListener("apacapp:prontuario:acao",handler);
    return()=>window.removeEventListener("apacapp:prontuario:acao",handler);
  });
  const documentosDossie=(dossieAtual?.documentos||[]).filter(docPacienteAtual);
  const categoriaLaudoAtiva=CATEGORIAS_LAUDOS.find(c=>c.id===filtroLaudos)||CATEGORIAS_LAUDOS[0];
  const laudosFiltrados=documentosDossie.filter(doc=>{
    if(filtroLaudos==="todos")return true;
    const texto=[doc.tipo,doc.nome,doc.resumo,doc.conteudo,doc.texto].filter(Boolean).join(" ");
    return categoriaLaudoAtiva.rx.test(texto);
  });
  const atualizarLaudo=useCallback((docId,campo,val)=>{
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
    const docs=(base.documentos||[]).map(d=>String(d.id)===String(docId)?{...d,[campo]:val,...(campo==="tipo"?{nome:val}:{})}:d);
    const novo={...base,documentos:docs,updatedAt:NOW()};
    novo.evolucao={...(novo.evolucao||{}),rascunho:montarPaginaProntuario(novo,pac).texto,textoFinal:""};
    setDossie&&setDossie(novo);
    setSalvo(false);
  },[dossie,pac,setDossie]);

  const adicionarLaudoVazio=useCallback(()=>{
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
    const doc={id:"LAUDO-"+Date.now(),tipo:"",nome:"",data:TODAY(),resumo:"",origem:"medico_laudo_manual",criadoEm:NOW()};
    const novo={...base,documentos:[...(base.documentos||[]),doc],updatedAt:NOW()};
    setDossie&&setDossie(novo);
    setSalvo(false);
  },[dossie,pac,setDossie]);

  const apagarDocumentoDossie=(doc)=>{
    if(!doc?.id)return;
    if(!window.confirm("Apagar este documento/resumo do dossiê deste atendimento?"))return;
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):dossieAtual;
    const docs=(base.documentos||[]).filter(x=>String(x.id)!==String(doc.id));
    const novo={
      ...base,
      documentos:docs,
      resumoClaude:docs.map(x=>x?.resumo||x?.conteudo||x?.texto||"").filter(Boolean).join("\n\n"),
      updatedAt:NOW(),
    };
    novo.evolucao={...(novo.evolucao||{}),rascunho:montarPaginaProntuario(novo,pac).texto,textoFinal:""};
    novo.apac=validarAPAC(novo);
    setDossie&&setDossie(novo);
    aplicarPagina(novo,pac);
    setSalvo(false);
  };
  const anexarLinha=(valorAtual,linha)=>{
    const atual=String(valorAtual||"").trim();
    return atual?[atual,linha].join("\n"):linha;
  };
  const aplicarModeloExameFisico=(modelo)=>{
    const novo=anexarLinha(exFisico,modelo.texto);
    setExFisico(novo);
    up&&up("exFisico",novo);
    setMostrarModelosEF(false);
    setSalvo(false);
  };
  const aplicarAtalhoLab=(atalho)=>{
    const textoAtalho=atalho.modeloData?(TODAY()+" - "+atalho.texto):atalho.texto;
    const novo=anexarLinha(labsTxt,textoAtalho);
    setLabsTxt(novo);
    up&&up("labs_txt",novo);
    setSalvo(false);
  };
  const aplicarProtocoloConduta=()=>{
    const cid=String(cidConduta||"").toUpperCase().trim();
    const protocoloSelecionado=qtSelecionadas.length?qtSelecionadas.join("; "):"";
    const protocolo=String(protocoloConduta||protocoloSelecionado||"").trim();
    if(!cid&&!protocolo){alert("Informe o CID e/ou o protocolo de QT antes de inserir na conduta.");return;}
    const linha="QT proposta: "+[cid&&("CID "+cid),protocolo&&("protocolo "+protocolo)].filter(Boolean).join(" - ")+".";
    const novo=anexarLinha(condutaTxt,linha);
    setCondutaTxt(novo);
    up&&up("conduta",novo);
    if(protocolo)up&&up("trat",protocolo);
    if(cid)up&&up("cid",cid);
    setMostrarQT(false);
    setSalvo(false);
  };
  const modalidadeAtual=EXAME_MODALIDADES.find(x=>x.id===novoLaudoModalidade)||EXAME_MODALIDADES[0];
  const sedesModalidade=modalidadeAtual?.sedes||[];
  const nomeLaudoMontado=[modalidadeAtual?.nome||"",novoLaudoSede||""].filter(Boolean).join(" - ");
  const iniciarEdicaoLaudo=(doc)=>{
    if(!doc)return;
    setEditandoLaudoId(doc.id||null);
    setNovoLaudoCat(doc.categoria||filtroLaudos||"tomografias");
    setNovoLaudoModalidade(doc.categoria||"tomografias");
    setNovoLaudoSede("");
    setNovoLaudoTipo(doc.tipo||doc.nome||"");
    setNovoLaudoResumo(doc.resumo||doc.conteudo||doc.texto||"");
  };
  const limparEditorLaudo=()=>{
    setEditandoLaudoId(null);
    setNovoLaudoTipo("");
    setNovoLaudoResumo("Sem evidencia de doença oncologica ativa/progressiva no exame descrito.");
    setNovoLaudoModalidade("tomografias");
    setNovoLaudoCat("tomografias");
    setNovoLaudoSede("Torax");
  };
  const desfazerUltimoLaudo=()=>{
    if(!ultimoLaudoId)return;
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
    const docs=(base.documentos||[]).filter(x=>String(x.id)!==String(ultimoLaudoId));
    const novo={...base,documentos:docs,updatedAt:NOW()};
    novo.evolucao={...(novo.evolucao||{}),rascunho:montarPaginaProntuario(novo,pac).texto,textoFinal:""};
    novo.apac=validarAPAC(novo);
    setDossie&&setDossie(novo);
    aplicarPagina(novo,pac);
    setUltimoLaudoId(null);
    setSalvo(false);
  };
  const inserirLaudoManual=()=>{
    const tipo=String(novoLaudoTipo||nomeLaudoMontado||"").trim();
    const resumo=String(novoLaudoResumo||"").trim();
    if(!tipo){alert("Informe o nome do exame antes de inserir.");return;}
    if(!resumo){alert("Descreva o resumo do laudo ou mantenha o modelo sem evidência.");return;}
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
    const doc={
      id:editandoLaudoId||"LAUDO-"+Date.now(),
      tipo,
      nome:tipo,
      data:TODAY(),
      resumo:`${TODAY()} - ${tipo} - ${resumo}`,
      origem:"medico_laudo_manual",
      categoria:novoLaudoCat,
      criadoEm:NOW(),
    };
    const docsBase=base.documentos||[];
    const docsNovo=editandoLaudoId?docsBase.map(x=>String(x.id)===String(editandoLaudoId)?{...x,...doc}:x):[doc,...docsBase];
    const novo={...base,documentos:docsNovo,status:"laudo_manual_validado",updatedAt:NOW()};
    novo.evolucao={...(novo.evolucao||{}),rascunho:montarPaginaProntuario(novo,pac).texto,textoFinal:""};
    novo.apac=validarAPAC(novo);
    setDossie&&setDossie(novo);
    aplicarPagina(novo,pac);
    setUltimoLaudoId(doc.id);
    limparEditorLaudo();
    setFiltroLaudos(novoLaudoCat==="laboratorio"?"laboratorio":"todos");
    setSalvo(false);
  };
  const confirmarPreviewRecepcao=()=>{
    const textoPreview=limparMarkdown(previewRecepcao||"").trim();
    if(!textoPreview)return;
    if(!executarProntuarioSecurity({pac,texto:textoPreview,dossie,origem:"Preview recepcao"},addMsg))return;
    const base=mesmoPacienteDossie(dossie,pac)?(dossie||criarDossieInicial(pac)):criarDossieInicial(pac);
    const docs=base.documentos||[];
    const idx=docs.findIndex(d=>/recep|secret/i.test(String(d?.origem||d?.tipo||d?.nome||"")));
    const novoDoc={id:idx>=0?docs[idx].id:Date.now(),tipo:"Preview recepcao validado",nome:"Resumo editavel da recepcao",resumo:textoPreview,origem:"recepcao_preview_validado",criadoEm:NOW()};
    const novosDocs=idx>=0?docs.map((d,i)=>i===idx?{...d,...novoDoc}:d):[novoDoc,...docs];
    const novo={...base,documentos:novosDocs,resumoClaude:textoPreview,status:"preview_recepcao_validado",updatedAt:NOW()};
    novo.evolucao={...(novo.evolucao||{}),rascunho:montarPaginaProntuario(novo,pac).texto,textoFinal:""};
    novo.apac=validarAPAC(novo);
    setDossie&&setDossie(novo);
    aplicarPagina(novo,pac);
    addMsg&&addMsg("Recepcao","Prontuario","Preview da recepcao confirmado para revisao medica.","msg");
    setSalvo(false);
  };
  const panelBase={border:"1px solid #DDE3EC",borderRadius:8,overflow:"hidden",background:"#fff"};
  const idadePaciente=String(pac?.idade||calcularIdadeLocal(pac?.nasc)||"").trim();
  const formatarIdadeTexto=(valor="")=>{
    const s=String(valor||"").trim();
    if(!s)return "";
    if(/anos?/i.test(s))return s.replace(/\s+/g," ");
    const m=s.match(/^(\d{1,3})(.*)$/);
    if(m)return `${m[1]} anos${m[2]?` ${m[2].trim()}`:""}`.replace(/\s+/g," ").trim();
    return s;
  };
  const idadeTexto=formatarIdadeTexto(idadePaciente);
  const limparTituloTumor=(raw="")=>{
    let s=String(raw||"").trim();
    const nomePaciente=String(pac?.nome||"").trim();
    if(nomePaciente)s=s.replace(new RegExp(nomePaciente.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"ig"),"");
    s=s.replace(/\bDN\s*\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/ig,"");
    s=s.replace(/\b\d{1,3}\s*anos?(?:\s*\([^)]*\))?/gi,"");
    const partes=s.split(/\s+[-–—]\s+/).map(x=>x.trim()).filter(Boolean);
    const parteTumoral=partes.find(p=>/\b(adenocarcinoma|carcinoma|neoplasia|tumor|linfoma|leucemia|melanoma|sarcoma|mama|prostata|pr[óo]stata|pulm[ãa]o|ov[aá]rio|reto|colon|c[oó]lon)\b/i.test(p));
    if(parteTumoral)s=parteTumoral;
    const idx=s.search(/\b(adenocarcinoma|carcinoma|neoplasia|tumor|linfoma|leucemia|melanoma|sarcoma)\b/i);
    if(idx>0)s=s.slice(idx);
    return s.replace(/\b\d+\s*anos\b/gi,"").replace(/\s+-\s+$/,"").replace(/\s{2,}/g," ").trim();
  };
  const tumorTitulo=limparTituloTumor(pac?.diag||pac?.local_cancer||"Tumor nao definido");
  const tumorSubtitulo=[
    pac?.cid||pac?.cid_sugerido,
    pac?.tnm,
    pac?.estadio,
    pac?.bio,
    pac?.ecog!==undefined&&pac?.ecog!==""?("ECOG "+pac.ecog):"",
  ].filter(Boolean).join(" · ");
  const resumoCabecalho=[
    tumorTitulo&&tumorTitulo!=="Tumor nao definido"?tumorTitulo:"",
    pac?.tnm||"",
    pac?.estadio?("EC: "+pac.estadio):"",
    pac?.subtipo||pac?.bio||"",
    pac?.metastases?("Metastases: "+pac.metastases):"",
    pac?.gleason?("Gleason "+pac.gleason):"",
    pac?.psa?("PSA: "+pac.psa):"",
  ].filter(Boolean).join(" - ");
  const commandPaletteCommands=useMemo(()=>[
    {id:"cmd-claude",title:"Resumir com Claude",subtitle:"Organizar dossie e evolucao para revisao medica",group:"IA",keywords:"resumo dossie claude",run:organizar},
    {id:"cmd-agentes",title:"Mostrar/ocultar agentes IA",subtitle:"Dossie, labs, exame fisico, QT/APAC",group:"IA",keywords:"agentes painel",run:()=>setMostrarAgentes(v=>!v)},
    {id:"cmd-copiar",title:"Copiar prontuario",subtitle:"Copia evolucao completa com paineis dedicados",group:"Prontuario",keywords:"copiar evolucao",run:copiarProntuario},
    {id:"cmd-salvar",title:"Salvar evolucao",subtitle:"Fecha texto validado no atendimento atual",group:"Prontuario",keywords:"salvar evolucao",run:salvar},
    {id:"cmd-apac",title:"Abrir APAC anti-glosa",subtitle:"Recalcula pendencias e abre validacao",group:"APAC",keywords:"apac sigtap glosa",run:()=>{setDossie&&setDossie(d=>({...d,apac:validarAPAC(d),status:"apac_validacao"}));onAbrirAPAC&&onAbrirAPAC();}},
    {id:"cmd-limpar",title:"Limpar pagina",subtitle:"Regera folha branca do prontuario",group:"Prontuario",keywords:"limpar pagina",run:limparPagina},
    ...CID_OPTIONS.map(opt=>({
      id:"cid-"+opt.value,
      title:`CID ${opt.value} - ${opt.label}`,
      subtitle:"Aplicar CID ao caso e recalcular APAC",
      group:"CID",
      keywords:[opt.value,opt.label,...(opt.keywords||[])].join(" "),
      run:()=>aplicarCamposClinicos({cid:opt.value,diag:pac?.diag||opt.label}),
    })),
    ...PROTOCOL_OPTIONS.map(opt=>({
      id:"prot-"+opt.value,
      title:`Protocolo: ${opt.label}`,
      subtitle:"Aplicar protocolo ao plano terapeutico",
      group:"Protocolo",
      keywords:[opt.value,opt.label,...(opt.keywords||[])].join(" "),
      run:()=>aplicarCamposClinicos({trat:opt.value}),
    })),
  ],[aplicarCamposClinicos,onAbrirAPAC,pac?.diag,setDossie]);
  return <div style={{display:"grid",gap:10}}>
    <CommandPalette commands={commandPaletteCommands}/>

    {/* ── Cabeçalho de ações ─────────────────────────────────────────────── */}
    <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{flex:1}}>
        <div style={{fontSize:11,color:G,fontWeight:950,textTransform:"uppercase",letterSpacing:1}}>Prontuario medico</div>
        <div style={{fontSize:25,fontWeight:950,color:N,lineHeight:1.05}}>Evolucao</div>
        <div style={{fontSize:16,fontWeight:950,color:"#475569"}}>{pac?.nome||"Paciente nao selecionado"}{pac?.nasc?" · DN "+pac.nasc:""}{idadeTexto?" · "+idadeTexto:""}</div>
      </div>
      {!actionsInStepper&&<>
      <Btn v="navy" ch={processando?"Claude":"Claude"} dis={processando} s={{padding:"7px 10px",fontSize:11,borderRadius:8}} onClick={organizar}/>
      <button type="button" style={miniButtonStyle(mostrarAgentes)} onClick={()=>setMostrarAgentes(v=>!v)}>Agentes IA</button>
      <Btn v="teal" ch="Copiar" s={{padding:"7px 10px",fontSize:11,borderRadius:8}} onClick={copiarProntuario}/>
      <Btn v="ghost" ch="Limpar" s={{padding:"7px 10px",fontSize:11,borderRadius:8}} onClick={limparPagina}/>
      <Btn v="green" ch="Salvar" s={{padding:"7px 10px",fontSize:11,borderRadius:8}} onClick={salvar}/>
      <Btn v="gold" ch="APAC" s={{padding:"7px 10px",fontSize:11,borderRadius:8}} onClick={()=>{setDossie&&setDossie(d=>({...d,apac:validarAPAC(d),status:"apac_validacao"}));onAbrirAPAC&&onAbrirAPAC();}}/>
      </>}
    </div>

    {/* ── F5: Cabeçalho oncológico compacto ─────────────────────────────── */}
    {mostrarAgentes&&<div style={{background:"#fff",border:"1px solid #DDE6F0",borderRadius:12,padding:10,display:"grid",gap:8}}>
      <div style={{fontSize:12,fontWeight:950,color:N,textTransform:"uppercase",letterSpacing:.8}}>Assistente IA nesta pagina</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:7}}>
        <button type="button" style={miniButtonStyle()} onClick={organizar}>Dossie</button>
        <button type="button" style={miniButtonStyle()} onClick={()=>setResumoExterno(v=>v||"Cole aqui resumo externo para o agente organizar em DADOS CLINICOS, DADOS ONCOLOGICOS e LAUDOS EM CRONOLOGIA.")}>Resumo externo</button>
        <button type="button" style={miniButtonStyle()} onClick={()=>setMostrarLabs(v=>!v)}>Labs</button>
        <button type="button" style={miniButtonStyle()} onClick={()=>setMostrarModelosEF(v=>!v)}>Exame fisico</button>
        <button type="button" style={miniButtonStyle()} onClick={()=>setMostrarQT(v=>!v)}>QT/APAC</button>
        <button type="button" style={miniButtonStyle()} onClick={()=>{setObsTxt(anexarLinha(obsTxt,"Sinais de alarme orientados: febre, dispneia/dor toracica, sangramento, confusao mental, vomitos persistentes, diarreia importante, dor intensa ou piora do estado geral."));setSalvo(false);}}>Sinais alarme</button>
      </div>
    </div>}

    <div style={{background:"#fff",border:"1px solid #D7E1EF",borderLeft:"6px solid "+G,borderRadius:10,padding:"12px 16px",display:"grid",gap:4,boxShadow:"0 6px 16px rgba(15,23,42,.05)"}}>
      <div style={{fontSize:11,fontWeight:950,color:"#64748B",textTransform:"uppercase",letterSpacing:1}}>Tipo de tumor / estágio / subtipo</div>
      <div style={{fontSize:28,fontWeight:950,color:N,lineHeight:1.12,textTransform:"uppercase"}}>{resumoCabecalho||"Tumor, estágio e subtipo pendentes"}</div>
      {tumorSubtitulo&&<div style={{fontSize:13,fontWeight:900,color:"#475569"}}>{tumorSubtitulo}</div>}
    </div>

    {/* ── Preview pós-IA: revisar antes de incluir no prontuário ─────── */}
    {previewIATexto&&<div style={{background:"#F0F9FF",border:"2px solid "+T,borderRadius:12,padding:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:14,fontWeight:900,color:T}}>📄 Preview — Revise antes de incluir no prontuário</div>
        <button onClick={()=>setPreviewIATexto("")} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#94A3B8",lineHeight:1}}>✕</button>
      </div>
      <pre style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:9,padding:14,fontSize:12.5,lineHeight:1.65,color:"#1E293B",whiteSpace:"pre-wrap",wordBreak:"break-word",maxHeight:340,overflow:"auto",fontFamily:"Segoe UI, Arial, sans-serif",margin:0}}>{previewIATexto}</pre>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button
          onClick={()=>copiarTexto(previewIATexto)}
          style={{flex:1,padding:"10px 14px",borderRadius:9,background:"#F1F5F9",border:"1px solid #CBD5E1",fontWeight:800,fontSize:13,cursor:"pointer",color:N,fontFamily:"inherit"}}
        >📋 Copiar</button>
        <button
          onClick={()=>{const ok=onSalvarEvolucao&&onSalvarEvolucao(previewIATexto);if(ok!==false)setPreviewIATexto("");}}
          style={{flex:2,padding:"10px 14px",borderRadius:9,background:T,border:"none",fontWeight:900,fontSize:13,cursor:"pointer",color:"#fff",fontFamily:"inherit"}}
        >📥 Migrar para prontuário</button>
      </div>
    </div>}

    {/* ── Laudos em Cronologia — sub-caixas editáveis ──────────────── */}
    <div style={{...panelBase,borderRadius:8}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,fontWeight:900,color:"#fff",textTransform:"uppercase",letterSpacing:.8,padding:"7px 14px",background:"#2B7A8C",borderRadius:"7px 7px 0 0"}}>
        <span>Laudos em Cronologia</span>
        <button
          type="button"
          onClick={adicionarLaudoVazio}
          style={{background:"rgba(255,255,255,.18)",border:"none",borderRadius:6,padding:"3px 11px",fontSize:12,fontWeight:900,cursor:"pointer",color:"#fff",fontFamily:"inherit"}}
        >+ Laudo</button>
      </div>
      {documentosDossie.length===0&&(
        <div style={{padding:"18px 14px",fontSize:12,color:"#94A3B8",fontStyle:"italic",textAlign:"center"}}>
          Nenhum laudo registrado — clique em + Laudo para adicionar ou importe via IA.
        </div>
      )}
      {documentosDossie.map((doc,i)=>(
        <LaudoSubCaixa
          key={`${doc.id||doc.criadoEm||doc.nome||"laudo"}-${i}`}
          doc={doc}
          idx={i}
          onUpdate={(campo,val)=>atualizarLaudo(doc.id,campo,val)}
          onApagar={()=>apagarDocumentoDossie(doc)}
        />
      ))}
    </div>

    {/* ── Editor principal (DADOS ANAGRÁFICOS, CLÍNICOS, ONCOLÓGICOS, LAUDOS) ── */}
    {previewRecepcao&&<details open style={{background:"#fff",border:"1px solid #D8E5F2",borderLeft:"4px solid "+T,borderRadius:10,padding:12}}>
      <summary style={{cursor:"pointer",fontSize:15,fontWeight:950,color:N}}>Preview editavel da recepcao antes de migrar ao prontuario</summary>
      <p style={{fontSize:12,color:"#64748B",margin:"8px 0"}}>Revise o texto recebido da recepcao. Ao confirmar, ele fica registrado como modelo validado e atualiza o prontuario para revisao medica.</p>
      <textarea value={previewRecepcao} onChange={e=>setPreviewRecepcao(e.target.value)} rows={7} style={{...sc_.inp,width:"100%",resize:"vertical",fontFamily:"Segoe UI, Arial, sans-serif",fontSize:13.5,lineHeight:1.55}}/>
      <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
        <button type="button" style={{...miniButtonStyle(true),background:"#E8F7EE",borderColor:"#8BC28F",color:"#1F6F35"}} onClick={confirmarPreviewRecepcao}>Confirmar no prontuario</button>
        <button type="button" style={miniButtonStyle()} onClick={()=>setPreviewRecepcao("")}>Ocultar preview</button>
      </div>
    </details>}

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
        minHeight:560,
        padding:"30px 38px",
        fontFamily:"Segoe UI, Arial, sans-serif",
        fontSize:15,
        lineHeight:1.6,
        boxShadow:"0 8px 22px rgba(15,23,42,.06)",
        outline:"none",
      }}
    />

    {/* ── F5: Painéis dedicados (EF, Labs, Conduta, Observações) ─────────── */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {/* Exame Físico */}
      <div id="pron-exame-fisico" style={panelBase}>
        <SecaoEditavel
          titulo="Exame Físico"
          valor={exFisico}
          onChange={v=>{setExFisico(v);setSalvo(false);}}
          onBlur={()=>up&&up("exFisico",exFisico)}
          placeholder="PS geral, ECOG, peso/alt/SC, mucosas, linfonodos, mamas, abd, MMII..."
          rows={5}
          corBorda="#0369A1"
          textareaId="ta-exame-fisico"
          onEnterNext="pron-labs"
          extra={<div style={{borderTop:"1px solid #E2E8F0",background:"#F8FAFC",padding:8}}>
            <button type="button" style={miniButtonStyle(mostrarModelosEF)} onClick={()=>setMostrarModelosEF(v=>!v)}>Modelos por ECOG</button>
            {mostrarModelosEF&&<div style={{display:"grid",gap:6,marginTop:8,maxHeight:220,overflowY:"auto"}}>
              {MODELOS_EXAME_FISICO.map(m=><button key={m.id} type="button" style={{textAlign:"left",border:"1px solid #CBD5E1",background:"#fff",borderRadius:8,padding:"8px 10px",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>aplicarModeloExameFisico(m)}>
                <div style={{fontSize:12,fontWeight:950,color:N}}>{m.nome}</div>
                <div style={{fontSize:11.5,color:"#64748B",lineHeight:1.35,marginTop:3}}>{m.texto.slice(0,150)}...</div>
              </button>)}
            </div>}
          </div>}
        />
      </div>
      {/* Laboratório */}
      <div id="pron-labs" style={panelBase}>
        <SecaoEditavel
          titulo="Laboratório / Hemograma"
          valor={labsTxt}
          onChange={v=>{setLabsTxt(v);setSalvo(false);}}
          onBlur={()=>up&&up("labs_txt",labsTxt)}
          placeholder={"Hb _ · Leuco _ · Neut _ · Plt _\nCreat _ · TGO _ · TGP _ · FA _\nOutros: "}
          rows={5}
          corBorda="#0F766E"
          textareaId="ta-labs"
          onEnterNext="pron-conduta"
          extra={<div style={{borderTop:"1px solid #E2E8F0",background:"#F0FDFA",padding:8}}>
            <button type="button" style={miniButtonStyle(mostrarLabs)} onClick={()=>setMostrarLabs(v=>!v)}>Atalhos por faixa</button>
            {mostrarLabs&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
              {ATALHOS_LAB.map(a=><button key={a.label} type="button" style={miniButtonStyle()} onClick={()=>aplicarAtalhoLab(a)}>{a.label}</button>)}
            </div>}
          </div>}
        />
      </div>
    </div>

    {/* Conduta */}
    <div id="pron-conduta" style={panelBase}>
      <SecaoEditavel
        titulo="Conduta"
        valor={condutaTxt}
        onChange={v=>{setCondutaTxt(v);setSalvo(false);}}
        onBlur={()=>up&&up("conduta",condutaTxt)}
        placeholder="Manter/iniciar protocolo... Exames solicitados... Retorno em..."
        rows={4}
        corBorda={N}
        textareaId="ta-conduta"
        onEnterNext="pron-obs-section"
        extra={<div style={{borderTop:"1px solid #E2E8F0",background:"#F8FAFC",padding:8}}>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <button type="button" style={miniButtonStyle(mostrarQT)} onClick={()=>setMostrarQT(v=>!v)}>Inserir QT na conduta</button>
            <input value={cidConduta} onChange={e=>setCidConduta(e.target.value.toUpperCase())} placeholder="CID: C61, C50, C18..." style={{border:"1px solid #CBD5E1",borderRadius:8,padding:"7px 9px",fontSize:12,fontWeight:900,color:N,width:150,fontFamily:"inherit",outline:"none",background:"#fff"}}/>
            <input value={protocoloConduta} onChange={e=>setProtocoloConduta(e.target.value)} placeholder="Protocolo QT: Docetaxel, FOLFOX, CAPOX..." style={{border:"1px solid #CBD5E1",borderRadius:8,padding:"7px 9px",fontSize:12,fontWeight:900,color:N,minWidth:270,flex:"1 1 270px",fontFamily:"inherit",outline:"none",background:"#fff"}}/>
          </div>
          {mostrarQT&&<div style={{display:"grid",gap:6,marginTop:8}}>
            <div style={{display:"grid",gap:6}}>
              <MultiCheckDropdown
                label="Protocolos de QT"
                options={PROTOCOLOS_QT_OPCOES}
                selected={qtSelecionadas}
                onChange={setQtSelecionadas}
                onApply={(vals)=>setProtocoloConduta(vals.join("; "))}
                placeholder="abrir lista"
                width={420}
              />
              <div style={{fontSize:10.5,color:"#64748B",fontWeight:800}}>Use o menu: clique para abrir, role a lista, marque uma ou mais opções e aplique. O campo ao lado continua editável livremente.</div>
              <button type="button" onClick={aplicarProtocoloConduta} style={{border:"none",background:N,color:"#fff",borderRadius:8,padding:"8px 12px",fontSize:12,fontWeight:950,cursor:"pointer",fontFamily:"inherit",justifySelf:"start"}}>Confirmar QT na conduta</button>
            </div>
          </div>}
        </div>}
      />
    </div>

    {/* Observações + Trials */}
    <div id="pron-obs-section" style={panelBase}>
      <div style={{fontSize:12,fontWeight:900,color:"#fff",textTransform:"uppercase",letterSpacing:1,padding:"7px 16px",background:"#7C3AED",borderRadius:"8px 8px 0 0"}}>Observações</div>
      <textarea value={obsTxt} onChange={e=>{setObsTxt(e.target.value);setSalvo(false);}} onBlur={()=>up&&up("obs_medico",obsTxt)} rows={3}
        placeholder="Observações clínicas, intercorrências, comunicações relevantes..."
        style={{width:"100%",border:"none",borderBottom:"1px solid #E2E8F0",padding:"11px 13px",fontFamily:"Segoe UI,Arial,sans-serif",fontSize:14,lineHeight:1.5,color:"#1E293B",resize:"vertical",background:"#fff",outline:"none",boxSizing:"border-box"}}/>
      <div style={{padding:"8px 12px 4px",display:"flex",alignItems:"center",gap:8,background:"#FAF5FF",borderTop:"1px solid #E9D5FF"}}>
        <span style={{fontSize:11,fontWeight:900,color:"#7C3AED",textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap"}}>🔬 Ensaio clínico / Trial</span>
        <input value={trialInfo} onChange={e=>{setTrialInfo(e.target.value);setSalvo(false);}} onBlur={()=>up&&up("trial_info",trialInfo)}
          placeholder="Protocolo, fase, elegibilidade, contato do pesquisador..."
          style={{flex:1,border:"1px solid #D8B4FE",borderRadius:7,padding:"6px 10px",fontFamily:"Segoe UI,Arial,sans-serif",fontSize:12,color:N,background:"#fff",outline:"none"}}/>
      </div>
      <div style={{height:10}}/>
    </div>

    {salvo&&<DocumentosPosEvolucao dossie={dossie} setDossie={setDossie} addMsg={addMsg} onAbrirAPAC={onAbrirAPAC}/>}
  </div>;
}
