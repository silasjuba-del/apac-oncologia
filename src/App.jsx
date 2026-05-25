import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import FarmaciaPage from './features/farmacia/FarmaciaPage';
import EnfermagemPage from './features/enfermagem/EnfermagemPage';
import RecepcaoPage from './features/recepcao/RecepcaoPage';
import AgendamentoComp from './components/shared/AgendamentoComp';
import ListaEsperaPrioridade from './components/shared/ListaEsperaPrioridade';
import ConsultasDiaComp from './components/shared/ConsultasDiaComp';
import CarteirinhaTab from './features/carteirinha/CarteirinhaTab';
import SegundaViaTab from './features/recepcao/SegundaViaTab';
import InboxPaciente from './features/paciente/InboxPaciente';
import ComunicacaoPage from './features/comunicacao/ComunicacaoPage';
import AssistenciaSocialPage from './features/assistencia-social/AssistenciaSocialPage';
import DashboardMedico from './features/medico/DashboardMedico';
import FilaDiaMedico from './features/medico/FilaDiaMedico';
import EstatisticasComp from './features/medico/EstatisticasComp';
import PrescricaoQT from './features/prescricao/PrescricaoQT';
import ReceitasComp from './features/recepcao/ReceitasComp';
import SalaoMedico from './features/enfermagem/SalaoMedico';
import SeletorEquipe from './components/shared/SeletorEquipe';
import TrialsCompMelhorado from './features/medico/TrialsCompMelhorado';
import AbaExamesImagem from './features/medico/AbaExamesImagem';
import AntiGlosaComp from './features/faturamento/AntiGlosaComp';
import TriagemMedicoRecebe from './features/medico/TriagemMedicoRecebe';
const DiscussaoClinicaIA=React.lazy(()=>import('./features/medico/DiscussaoClinicaIA'));
import BuscarPacienteComp from './features/medico/BuscarPacienteComp';
import DashboardComunicacao from './features/comunicacao/DashboardComunicacao';
import ExamesProntuario from './features/medico/ExamesProntuario';
import PrescreverDoenca from './features/medico/PrescreverDoenca';
import GraficoProducao from './features/medico/GraficoProducao';
import AtendimentoSegurancaPanel from './components/shared/AtendimentoSegurancaPanel';
import {
  sc_, sc, TODAY, NOW,
  Btn, Card, H2, H3, H3b, Fld, Bge, G2, Tbl, Cbox, CampoLinhaCadastro, CampoCadastro,
  ResumoBullets, linhasResumoBullets, resumoBulletsTexto,
  TopBar, Footer, TopBarOld, FooterOld, PrintModal, MicCaptura, ChatAba,
  copiarTexto, limparMarkdown, gerarHTML, abrirDoc,
} from './components/ui/primitives';
import PacienteDemograficoForm from './pages/PacienteDemograficoForm';
import ConferenciaAPAC from './pages/ConferenciaAPAC.jsx';
import AppRoutes from './features/rotas/AppRoutes.jsx';
import AberturaScreen from './components/AberturaScreen.jsx';
import AppShell, { SubTabs as SubTabsV4, BtnV4, AlertBanner as AlertBannerV4, CompletudeMeter, StatusBadge as StatusBadgeV4, TABS_PERFIL } from './components/AppShell.jsx';
import SeletorAPAC, { SIGTAP as SIGTAP_CATALOGO } from './components/SeletorAPAC.jsx';
import MedicoProntuario from './pages/MedicoProntuario.jsx';
import AssistenteIA from './components/AssistenteIA.jsx';
import BancadaOncologica from './components/oncoagent/BancadaOncologica.jsx';
import UploadSimples from './components/UploadSimples.jsx';
import { APACSystem, APACDashboardWidget } from './components/APACSystem.jsx';
import AgentPanel from './components/AgentPanel.jsx';
import IATestador from './components/IATestador.jsx';
import ReviewBanner from './components/ReviewBanner.jsx';
import EvolutionTimeline from './components/EvolutionTimeline.jsx';
import GerenciarPacientes from './components/GerenciarPacientes.jsx';
import ConsultaDia from './components/ConsultaDia.jsx';
import ProtocolosQTExplorer from './components/ProtocolosQTExplorer.jsx';
import { chavePaciente } from './features/oncoProUtils.js';
import BiomarcadoresSelector from './components/shared/BiomarcadoresSelector';
import {
  normalizaPacienteValor, executarProntuarioSecurity, mesmoPacienteDossie,
  loadDossiePaciente, saveDossiePaciente, limparModuloPacienteStorage,
  limparPacientesTesteStorage, pacientePareceTeste,
  requireActivePatient, quarentenaLocalStorage, marcarEvolucoesNaoValidadas,
} from './utils/security';
import {
  extrairCamposIA, extrairSecaoIA, extrairEvolucaoIA, extrairExamesRealizadosTexto,
  coletarExamesRealizados, formatarLinhaExameRealizado, ordemDataExame,
  primeiraMaiuscula, limparPlaceholderConsulta, extrairValorResumo,
} from './utils/parse';
import {
  criarDossieInicial, gerarTextoEvolucao, validarAPAC, autoPreencherCamposLaudos,
  orquestrarDossieAtendimento, gerarDocumentosSelecionados, gerarDossieClaude,
} from './utils/dossie';
import UploadComIA from './features/medico/UploadComIA';
import {
  statusDossieMeta,
  StatusDossieBar, AtendimentosStandbyBar,
  RecepcaoDossiePanel, DocumentosPosEvolucao,
} from './features/medico/DossieBarComponents';
import { APACDossieChecklist, APACEntradaRapida } from './features/medico/APACDossieComps';
const DriveDossieComp=React.lazy(()=>import('./features/medico/DriveDossieComp'));
import { resumoAtendimentoEstruturado, EvolucoesProntuario } from './features/medico/EvolucoesProntuario';
const ProntuarioDossieUnico=React.lazy(()=>import('./features/medico/ProntuarioDossieUnico'));
const StepperMedico=React.lazy(()=>import('./features/medico/StepperMedico'));
const PrimConsultaPaciente=React.lazy(()=>import('./features/medico/PrimConsultaPaciente'));
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
// ── CONSTANTES CENTRALIZADAS ─────────────────────────────────────────────────
import {
  N, T, G, VE, AM, VM, BG,
  DRIVE_PASTA_URL, abrirDrive, AUTOR, AUTOR2, EQUIPE, assinatura, HOSP, HOSP2, APP_NOME,
  SINAIS_T, NIV, ORIENTACOES, SINTOMAS_ONCOLOGICOS, TODOS_SINTOMAS_ONCOLOGICOS,
  PROTOS, PROTOCOLOS_DB, detectarTumor, listarProtocolos,
  PERIODOS, REDUCOES, EXAMES_LAB_TEMPLATE, TIPOS_IMAGEM, PASSOS_TRIAGEM, CTCAE_ITEMS,
  DOCS_OBR, ESTOQUE, MOCK_ALERTAS, MOCK_CADEIRAS, TRIALS,
  genPacID, PAC0, calcSC, calcProxCiclo, MOCK_PAC,
  BIOM, CID_DB, getCID, CID_SEDE_DB, getCIDPorSede, getTNMEstadio, ECOG_OPTS, LINHA_OPTS,
  ESTOQUE_IV, MEDS_ORAIS,
} from './utils/constants';
import { _getApiKey, _apiUrl, chamarClaude, chamarGPT, chamarGemini, chamarGrok } from './utils/api';

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
// ─── FOOTER ───────────────────────────────────────────────────────────────────

function BtnSalvar({pac}){const [ok,setOk]=useState(false);return <Btn v="gold" ch={ok?"✓ Salvo!":"💾 Salvar"} s={{flex:1,background:ok?"#15803D":"#B8860B"}} onClick={()=>{setOk(true);setTimeout(()=>setOk(false),2000);}}/>;} 
function EmergPrintBtn({pac,txt}){return <Btn v="red" ch="🖨 Imprimir" s={{fontSize:10}} onClick={()=>abrirDoc("Emergência",txt||"")}/>;} 
function AmareloBlocoReacoes({sins,pac}){const ss=sins||[];return <div style={{background:"#FFF7E6",border:"1px solid #B45309",borderRadius:10,padding:"8px 12px"}}>{ss.map(id=>{const o=ORIENTACOES[id];return o?<div key={id} style={{fontSize:11,padding:"3px 0"}}>• {o}</div>:null;})}</div>;}
function ConfiguracoesComp({pac,up,funcLogado,onQuarentena}){
  const [msg,setMsg]=useState("");
  const temPaciente=requireActivePatient(pac);
  const fazerQuarentena=()=>{
    if(!window.confirm("⚠ Isso vai apagar TODOS os dossiês e entradas de módulo salvos localmente.\nUm backup será criado antes da limpeza.\n\nConfirmar quarentena de dados locais?"))return;
    const r=quarentenaLocalStorage();
    const txt=r.removidas>0
      ?`✅ Quarentena concluída. ${r.removidas} chave(s) removida(s). Backup salvo em: ${r.backup}`
      :"ℹ Nenhum dado local encontrado para limpar.";
    setMsg(txt);
    onQuarentena&&onQuarentena();
  };
  const limparTestes=()=>{
    limparPacientesTesteStorage?.();
    setMsg("✅ Pacientes de teste removidos do armazenamento local.");
  };
  return <div style={{padding:12,display:"grid",gap:14,maxWidth:520}}>
    <h2 style={{color:"#1B365D",fontSize:16,fontWeight:900,margin:0}}>⚙️ Configurações e Segurança</h2>
    {/* Status do paciente ativo */}
    <div style={{background:temPaciente?"#EAF7EE":"#FFF7E6",border:"1px solid "+(temPaciente?"#15803D":"#B45309")+"55",borderRadius:10,padding:"10px 14px"}}>
      <div style={{fontSize:12,fontWeight:900,color:temPaciente?"#15803D":"#B45309",marginBottom:4}}>
        {temPaciente?"✅ Paciente ativo identificado":"⚠ Nenhum paciente ativo"}
      </div>
      <div style={{fontSize:11,color:"#64748B"}}>
        {temPaciente
          ?`${pac?.nome||"—"} · ID: ${pac?.pacID||"—"} · CPF: ${pac?.cpf||"—"} · CNS: ${pac?.cns||"—"}`
          :"Selecione um paciente antes de salvar dados clínicos."}
      </div>
    </div>
    {/* P0 — Quarentena de dados locais */}
    <div style={{background:"#FFF5F5",border:"1px solid #FECACA",borderRadius:10,padding:"12px 14px"}}>
      <div style={{fontSize:13,fontWeight:900,color:"#7B1D3A",marginBottom:4}}>🔒 P0 — Contenção de dados</div>
      <p style={{fontSize:11,color:"#64748B",margin:"0 0 10px",lineHeight:1.5}}>
        Se houver suspeita de mistura de dados entre pacientes, use a quarentena para limpar o armazenamento local. Um backup é criado automaticamente antes da limpeza.
      </p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <Btn v="red" ch="🛑 Quarentena: limpar dados locais" s={{fontSize:11,padding:"8px 12px"}} onClick={fazerQuarentena}/>
        <Btn v="ghost" ch="🧹 Remover pacientes de teste" s={{fontSize:11,padding:"8px 12px"}} onClick={limparTestes}/>
      </div>
      {msg&&<div style={{marginTop:10,fontSize:11,color:"#374151",background:"#F8FAFC",border:"1px solid #DDE3EC",borderRadius:8,padding:"8px 10px",lineHeight:1.5}}>{msg}</div>}
    </div>
    <p style={{fontSize:11,color:"#94A3B8",margin:0}}>v1.0 — APACApp Oncologia · Hospital do Bem · Patos-PB</p>
  </div>;
}

function DriveIntegracaoComp({pac,up,addMsg,dossie,setDossie}){return <DriveDossieComp pac={pac} dossie={dossie} setDossie={setDossie} addMsg={addMsg}/>;}
export default function App(){
  const [showAbertura,setShowAbertura]=useState(true);
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
  // P0 — guard: nenhum campo salva sem paciente identificado
  const up=(k,v)=>{
    if(!requireActivePatient(pac)){
      console.warn("[P0] up() bloqueado — nenhum paciente ativo identificado. Campo:",k);
      return;
    }
    setPac(x=>{const novo={...x,[k]:v};savePacAtual(novo);dbSalvarPaciente(novo);return novo;});
  };
  // P1 — setDossie guardado: bloqueia escrita no dossie sem paciente ativo (espelha up())
  const setDossieGuardado=(fn)=>{
    if(!requireActivePatient(pac)){console.warn("[P1] setDossie bloqueado — sem paciente ativo");return;}
    setDossieOncologico(fn);
  };
  // Auto-preenche campos clínicos sempre que anatom/imagen forem alterados (alimenta APAC + evolução)
  useEffect(()=>{autoPreencherCamposLaudos(pac,up);},[pac.anatom,pac.imagen]);
  useEffect(()=>{setDossieOncologico(d=>{
    const salvo=loadDossiePaciente(pac);
    const base=mesmoPacienteDossie(d,pac)?(d||salvo||criarDossieInicial(pac)):(salvo||criarDossieInicial(pac));
    return {...base,paciente:{...(base?.paciente||{}),...pac},updatedAt:NOW()};
  });},[pac.pacID,pac.nome,pac.cpf,pac.cns,pac.nasc,pac.mae,pac.cidade,pac.tel,pac.diag,pac.cid,pac.tnm,pac.estadio,pac.bio,pac.ecog,pac.trat,pac.linha,pac.intencao,pac.peso,pac.altura,pac.queixa,pac.antec,pac.meds,pac.alerg,pac.anam_cirurgia,pac.anam_hist_fam,pac.anatom,pac.imagen,pac.obs_ia,pac.re,pac.rp,pac.her2,pac.ki67,pac.grau_hist,pac.margens,pac.data_biopsia]);
  useEffect(()=>{saveDossiePaciente(dossieOncologico);},[dossieOncologico]);
  // P0 — ao trocar de paciente, limpa entradas de módulo do paciente anterior
  useEffect(()=>{
    if(pac?.pacID) limparModuloPacienteStorage(pac);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[pac?.pacID]);
  const [medLogado,setMedLogado]=useState(false);
  const [medTab,setMedTab]=useState("dashboard");
  const [medTab2,setMedTab2]=useState("dashboard");
  const [pronTab2,setPronTab2]=useState("evolucao"); // sub-tabs do prontuário no novo shell
  const [adminTab2,setAdminTab2]=useState("config"); // sub-tabs do admin no novo shell
  const [enfermagemTab2,setEnfermagemTab2]=useState("triagem"); // sub-tabs da enfermagem na lateral
  const [prescricaoTab2,setPrescricaoTab2]=useState("motor45"); // sub-tabs da prescrição QT
  const [pronTab,setPronTab]=useState("consulta");
  const [cicloLiberado,setCicloLiberado]=useState(false);
  const [funcLogado,setFuncLogado]=useState(EQUIPE[0]);
  const [laudoLiberado,setLaudoLiberado]=useState(false);
  useEffect(()=>{
    if(adminTab2==="salao"||adminTab2==="triagens")setAdminTab2("config");
  },[adminTab2]);
  const [caixaEntrada,setCaixaEntrada]=useState([
    {id:1,de:"Dr. Silas Negrão",titulo:"Resultado de Hemograma — C1",conteudo:"HEMOGRAMA\nData: 15/05/2026\nHgb: 11,8 g/dL ✓\nNeutrófilos: 2.100/mm³ ✓\nPlaquetas: 176.000/mm³ ✓\n\nDr. Silas Negrão · CRM-PB 17341",dt:"15/05/2026 10:00",lida:false,tipo:"laudo"},
    {id:2,de:"Recepção",titulo:"Confirmação de Retorno",conteudo:"Retorno: 03/06/2026 às 09h00.\nHospital do Bem — Patos-PB.\nChegue 30 minutos antes.",dt:"14/05/2026 14:30",lida:true,tipo:"msg"},
  ]);
  const addCaixaEntrada=(entry)=>setCaixaEntrada(x=>[{...entry,id:Date.now(),dt:new Date().toLocaleString("pt-BR"),lida:false},...x]);
  const [historicoQT,setHistoricoQTRaw]=useState([]);
  const setHistoricoQT=v=>{const n=typeof v==="function"?v(historicoQT):v;setHistoricoQTRaw(n);dbSalvarHistoricoQT(n);};
  const [triagens,setTriagensRaw]=useState([]);
  const setTriagens=v=>{const n=typeof v==="function"?v(triagens):v;setTriagensRaw(n);dbSalvarTriagens(n);};
  const [triagemDiscussao,setTriagemDiscussao]=useState(null);
  const [apacs,setApacs]=useState([]);
  const [aiPatches,setAiPatchesRaw]=useState(()=>loadAiPatches());
  const setAiPatches=v=>{const n=typeof v==="function"?v(aiPatches):v;setAiPatchesRaw(n);saveAiPatches(n);};
  const [syncStatus,setSyncStatus]=useState({status:"local",label:"💾 Carregando...",cor:"#94A3B8"});
  const addHistQT=(entrada)=>setHistoricoQT(x=>[entrada,...x]);
  const [consultasDia,setConsultasDiaRaw]=useState(()=>{
    try{const k="consultasDia_"+new Date().toLocaleDateString("pt-BR");const s=localStorage.getItem(k);return s?JSON.parse(s):[];}catch(_){return[];}
  });
  const setConsultasDia=v=>{const n=typeof v==="function"?v(consultasDia):v;setConsultasDiaRaw(n);try{const k="consultasDia_"+new Date().toLocaleDateString("pt-BR");localStorage.setItem(k,JSON.stringify(n));}catch(_){}};

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
    setMedTab2("prontuario");setPronTab2("evolucao");
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
  const eventoQTPertenceAoPaciente=useCallback((h)=>{
      if(!pac?.pacID&&!pac?.nome)return false;
      if(pac?.pacID&&h?.pacID)return String(h.pacID)===String(pac.pacID);
      if(h?.pacNome&&pac?.nome)return nomesPacienteCompativeis(h.pacNome,pac.nome);
      return false;
  },[pac?.pacID,pac?.nome]);
  const historicoQTPaciente=useMemo(()=>(
    (historicoQT||[]).filter(eventoQTPertenceAoPaciente)
  ),[historicoQT,eventoQTPertenceAoPaciente]);
  const setHistoricoQTPaciente=useCallback((valor)=>{
    const atualizados=typeof valor==="function"?valor(historicoQTPaciente):valor;
    const listaAtualizada=Array.isArray(atualizados)?atualizados:[];
    setHistoricoQT(prev=>{
      const outros=(prev||[]).filter(h=>!eventoQTPertenceAoPaciente(h));
      return [...listaAtualizada,...outros];
    });
  },[historicoQTPaciente,eventoQTPertenceAoPaciente]);

  const adicionarDocumentoPadraoDossie=useCallback((res,meta={},origem="medico_upload")=>{
    const texto=String(res||"").trim();
    if(!texto){alert("Nenhum resumo foi gerado para inserir no prontuário.");return false;}
    if(!executarProntuarioSecurity({pac,texto,dossie:dossieOncologico,origem:meta?.tipo||"Upload IA"},addMsg))return false;
    setDossieOncologico(d=>{
      const base=mesmoPacienteDossie(d,pac)?(d||criarDossieInicial(pac)):criarDossieInicial(pac);
      const evolucaoClaude=extrairEvolucaoIA(texto);
      const camposIA=extrairCamposIA(texto);
      const doc={
        id:Date.now(),
        tipo:meta?.tipo||"Documento",
        nome:meta?.arquivos?.[0]?.n||"Novo exame",
        resumo:texto,
        origem,
        criadoEm:NOW(),
        exames:extrairExamesRealizadosTexto(texto),
        evolucaoClaude,
      };
      const pacienteBase={...(base.paciente||{}),...pac};
      const camposNovos=Object.fromEntries(Object.entries(camposIA).filter(([k,val])=>val&&!String(pacienteBase[k]||"").trim()));
      const novo={
        ...base,
        paciente:{...pacienteBase,...camposNovos},
        documentos:[doc,...(base.documentos||[])],
        resumoClaude:[base.resumoClaude,texto].filter(Boolean).join("\n\n---\n"),
        status:"pronto_medico",
        updatedAt:NOW(),
      };
      novo.evolucao={...(novo.evolucao||{}),rascunho:evolucaoClaude||gerarTextoEvolucao(novo),textoFinal:""};
      novo.apac=validarAPAC(novo);
      return novo;
    });
    return true;
  },[pac,dossieOncologico,addMsg]);

  const prepararPacienteEmBranco=()=>({...PAC0,pacID:genPacID(),status:"novo"});
  const zerarContextoAtivo=useCallback((motivo="novo_atendimento")=>{
    const anterior=pac;
    limparModuloPacienteStorage(anterior);
    try{
      clearPacAtual?.();
      localStorage.removeItem("dossie_oncologico_atual");
      localStorage.removeItem("apacapp_primeira_consulta_rascunho");
      if(window.location.hash)window.location.hash="";
    }catch(_){}
    const np=prepararPacienteEmBranco();
    setPac(np);
    setDossieOncologico(criarDossieInicial(np));
    setUpFiles([]);
    setTriagemDiscussao(null);
    setLaudoLiberado(false);
    setCicloLiberado(false);
    setAiPatches([]);
    setPronTab2("evolucao");
    setPrescricaoTab2("motor45");
    setEnfermagemTab2("triagem");
    setMedTab2("prontuario");
    addMsg&&addMsg("Prontuário Security","Médico",`Contexto ativo limpo (${motivo}). Nenhum dado do paciente anterior será usado no próximo atendimento.`,"msg");
  },[pac,addMsg]);

  const concluirAtendimentoAtual=useCallback(()=>{
    if(!pac?.nome){alert("Não há paciente ativo para concluir.");return;}
    if(!window.confirm(`Concluir atendimento de ${pac.nome}? O prontuário será preservado e a tela será limpa.`))return;
    if(!window.confirm("Dupla checagem: confirme que laudos, exames e prescrições desta tela pertencem a este paciente."))return;
    const base=mesmoPacienteDossie(dossieOncologico,pac)?(dossieOncologico||criarDossieInicial(pac)):criarDossieInicial(pac);
    const finalizado={
      ...base,
      paciente:{...(base.paciente||{}),...pac,status:"atendimento_concluido"},
      status:"atendimento_concluido",
      concluidoEm:NOW(),
      updatedAt:NOW(),
    };
    saveDossiePaciente(finalizado);
    dbSalvarPaciente({...pac,status:"atendimento_concluido",ultimoAtendimentoEncerradoEm:NOW()});
    setConsultasDia(x=>x.map(item=>((item.pacID&&item.pacID===pac.pacID)||nomesPacienteCompativeis(item.nome||item.pac||"",pac.nome))?{...item,status:"atendido",encerradoEm:NOW()}:item));
    setListaEspera(x=>x.map(item=>((item.pacID&&item.pacID===pac.pacID)||nomesPacienteCompativeis(item.nome||item.pac||"",pac.nome))?{...item,status:"atendido",encerradoEm:NOW()}:item));
    zerarContextoAtivo("atendimento_concluido");
    alert("Atendimento concluído. Tela limpa para novo paciente.");
  },[pac,dossieOncologico,setConsultasDia,setListaEspera,zerarContextoAtivo]);

  const novoAtendimentoLimpo=useCallback(()=>{
    if(pac?.nome&&!window.confirm(`Iniciar novo atendimento e limpar a tela de ${pac.nome}? O prontuário salvo permanece preservado.`))return;
    if(pac?.nome){
      const base=mesmoPacienteDossie(dossieOncologico,pac)?(dossieOncologico||criarDossieInicial(pac)):criarDossieInicial(pac);
      saveDossiePaciente({...base,paciente:{...(base.paciente||{}),...pac},updatedAt:NOW()});
      dbSalvarPaciente(pac);
    }
    zerarContextoAtivo("novo_atendimento");
  },[pac,dossieOncologico,zerarContextoAtivo]);

  const limparDadosTeste=useCallback(()=>{
    if(!window.confirm("Remover apenas pacientes marcados como teste/demo/codex? Prontuários reais não serão apagados."))return;
    const r=limparPacientesTesteStorage();
    setListaEspera(x=>x.filter(e=>!pacientePareceTeste(e)));
    setConsultasDia(x=>x.filter(e=>!pacientePareceTeste(e)));
    if(pacientePareceTeste(pac))zerarContextoAtivo("limpeza_dados_teste");
    alert(`Limpeza concluída: ${r.pacientes} paciente(s), ${r.dossies} dossiê(s), ${r.fila} fila(s), ${r.consultas} consulta(s), ${r.entradas} entrada(s) de módulo.`);
  },[pac,setListaEspera,setConsultasDia,zerarContextoAtivo]);

  const glosa=calcGlosa([],pac);
  const totalAlertas=MOCK_ALERTAS.length;
  const totalAl=totalAlertas;
  const goAlerta=()=>setMedTab("alertas");
  const NIV={verm:{label:"URGENTE"},amar:{label:"ATENÇÃO"},verd:{label:"OK"}};
    const resumoProntuario=`IDENTIFICAÇÃO\n${pac.nome||"___"}, ${pac.nasc||"__"}, ${pac.cidade||"___"}\nCPF: ${pac.cpf||"—"} · CNS: ${pac.cns||"—"}\n\nANTECEDENTES\n${pac.antec||"—"}.\nMedicações: ${pac.meds||"—"}. Alergias: ${pac.alerg||"—"}.${pac.exFisico?`\n\nEXAME FÍSICO\n${pac.exFisico}`:""}\n\nDIAGNÓSTICO ONCOLÓGICO\n${pac.diag||"—"} · CID: ${pac.cid||"—"} · TNM: ${pac.tnm||"—"} · Estádio: ${pac.estadio||"—"}\nBiomarcadores: ${pac.bio||"—"} · ECOG: ${pac.ecog||"—"}\n\nTRATAMENTO\n${pac.trat||"—"} · ${pac.linha||"—"} · ${pac.intencao||"—"}\n\n${HOSP}\n${AUTOR}`;
  const apagarItemTimeline=useCallback((item)=>{
    if(!item)return;
    if(!window.confirm("Apagar este registro da timeline deste paciente?"))return;
    if(item.type==="exam"){
      const novos=(pac?.exames_imagem||[]).filter((_,idx)=>idx!==item.index);
      up("exames_imagem",novos);
      dbSalvarPaciente({...pac,exames_imagem:novos});
      return;
    }
    const data=item.data||{};
    if(data.__source==="triagem"){
      const id=String(data.id||"");
      const novos=(triagens||[]).filter((t,idx)=>id?String(t.id)!==id:idx!==item.index);
      setTriagens(novos);
      return;
    }
    const id=String(data.id||"");
    const novos=(pac?.evolucoes||[]).filter((e,idx)=>id?String(e.id)!==id:idx!==item.index);
    up("evolucoes",novos);
    dbSalvarPaciente({...pac,evolucoes:novos});
  },[pac,triagens,up]);

  const MT=[
    {id:"dashboard",ico:"🏠",l:"Dashboard"},
    {id:"alertas",ico:"🚨",l:`Alertas${totalAlertas>0?` (${totalAlertas})`:""}`,badge:true},
    {id:"pacientes",ico:"👥",l:"Pacientes"},
    {id:"prontuario",ico:"📋",l:"Prontuário"},
    {id:"quimio",ico:"💉",l:"Prescrição médica"},
    {id:"exames_med",ico:"🔬",l:"Novos Exames"},
    {id:"receitas",ico:"📝",l:"Receitas"},
    {id:"apac",ico:"📄",l:"APAC"},
    {id:"antiglosa",ico:"🛡",l:"Anti-Glosa"},
    {id:"salao",ico:"🛋️",l:"Salão"},
    {id:"balanco",ico:"💰",l:"Balanço"},
    {id:"triagem_recebe",ico:"📥",l:"Resumo Triagem"},
    {id:"discussao_clinica",ico:"⚖️",l:"Discussão Clínica"},
    {id:"drive_ia",ico:"☁️",l:"Drive → Prontuário"},
    {id:"consultas_dia",ico:"📅",l:"Consultas Hoje"},
    {id:"agenda_med",ico:"🗓",l:"Agendamento"},
    {id:"ia_hub",ico:"🤖",l:"IA Hub"},
    {id:"ia_agent",ico:"🧠",l:"Assistente IA"},
    {id:"oncoagent",ico:"🔬",l:"OncoAgent"},
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
            <Btn v="gold" ch="🖨 Imprimir" s={{fontSize:10}} onClick={()=>abrirDoc("Conduta — "+a.nome,prescHosp(["febre"],{nome:a.nome,diag:a.diag}))}/>
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
          return {id:e.id||String(Date.now()),__source:"evolucao",dataHora,tipo:e.tipo||"consulta",enfermeiroNome:e.autor||"Médico",queixaAtual:e.texto,sinaisAlarme:[],qtLiberada:null};
        }).concat((triagens||[]).map(t=>({...t,__source:"triagem"})))} onDelete={apagarItemTimeline}/></div>}
        {pronTab==="consulta"&&<ProntuarioDossieUnico pac={pac} dossie={dossieOncologico} setDossie={setDossieGuardado} up={up} addMsg={addMsg} onAbrirAPAC={()=>setMedTab("apac")} onSalvarEvolucao={(evolucao)=>{
          if(!executarProntuarioSecurity({pac,texto:evolucao,dossie:dossieOncologico,origem:"Salvar evolução do dossiê"},addMsg))return false;
          const dt=new Date();
          const novaEv={id:Date.now(),data:dt.toLocaleDateString("pt-BR"),hora:dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),tipo:"Consulta médica",texto:evolucao,autor:"Dr. Silas Negrão — CRM-PB 17341",fonte:"dossie"};
          const novasEvolucoes=[novaEv,...(pac?.evolucoes||[])];
          up("evolucoes",novasEvolucoes);
          dbSalvarPaciente({...pac,evolucoes:novasEvolucoes});
          addMsg&&addMsg("Médico","Equipe","✅ Evolução do dossiê salva: "+(pac?.nome||"paciente")+".","msg");
          return true;
        }}/>}
        {pronTab==="__dados_hidden"&&<div style={{display:"grid",gap:14}}>
        <div style={sc_.card()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <H2 ch="Dados Oncológicos" s={{margin:0}}/>
            <div style={{display:"flex",gap:6}}>
              <Btn v="teal" ch="🖨 Imprimir" s={{fontSize:10}} onClick={()=>abrirDoc("Prontuário — "+pac.nome,resumoProntuario)}/>
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
      case "quimio": return <PrescricaoQT pac={pac} up={up} addMsg={addMsg} ciclosHistorico={historicoQTPaciente} setCiclosHistorico={setHistoricoQTPaciente} onSalvoCiclos={(proto,ciclos)=>{setDossieOncologico(d=>{const base=d||criarDossieInicial(pac);const doc={id:Date.now(),tipo:"Prescrição QT",nome:`${proto.nome} — ${ciclos.length} ciclos liberados`,resumo:`Protocolo: ${proto.nome}\nCiclos: ${ciclos.length}\nInício: ${ciclos[0]?.data||"—"}\nFármacos: ${proto.drugs?.map(dr=>dr.n).join(", ")||"—"}`,origem:"prescricao_qt",criadoEm:NOW()};const novo={...base,paciente:{...(base.paciente||{}),...pac},documentos:[doc,...(base.documentos||[])],status:"pronto_medico",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};novo.apac=validarAPAC(novo);return novo;});}}/>;
      case "exames_med": return <div style={{display:"grid",gap:12}}>
        <div style={sc_.card()}>
          <H2 ch="📎 Novos Exames — Filtro IA"/>
          <p style={{color:"#64748B",fontSize:12,marginBottom:10}}>Todo documento enviado passa pelo filtro de IA antes de ser adicionado ao prontuário. Suporte a upload de arquivo ou colagem de texto.</p>
          <UploadComIA pac={pac} up={up} addMsg={addMsg} destino="prontuario" origem="Médico" onConcluido={(res,meta)=>{if(adicionarDocumentoPadraoDossie(res,meta,"medico_upload"))alert("✅ Adicionado ao prontuário via IA.");}}/>
        </div>
        {pac?.docs_ia_resumo&&<div style={sc_.card()}><H2 ch="📋 Documentos Processados pela IA"/><Cbox text={pac.docs_ia_resumo} maxH={300}/></div>}
      </div>;
      case "receitas": return <div style={{display:"grid",gap:12}}><PrescreverDoenca pac={pac}/><ReceitasComp pac={pac} addCaixaEntrada={addCaixaEntrada} addMsg={addMsg}/></div>;
      case "apac": return <div style={{display:"grid",gap:14}}><StatusDossieBar dossie={dossieOncologico}/><APACDossieChecklist dossie={dossieOncologico} setDossie={setDossieGuardado}/><APACEntradaRapida pac={pac} up={up} dossie={dossieOncologico} setDossie={setDossieGuardado} addMsg={addMsg}/><APACSystem pac={{...pac,...(dossieOncologico?.apac?.campos||{})}} up={up} addMsg={addMsg} apacs={apacs} setApacs={setApacs}/></div>;
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
        if(!executarProntuarioSecurity({pac,texto:evolucao,dossie:dossieOncologico,origem:"Assistente IA"},addMsg))return false;
        const dt=new Date();
        const novaEv={id:Date.now(),data:dt.toLocaleDateString("pt-BR"),hora:dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),tipo:"Assistente IA",texto:evolucao,autor:"Dr. Silas Negrão — CRM-PB 17341",fonte:"ia"};
        const novasEvolucoes=[novaEv,...(pac?.evolucoes||[])];
        up("evolucoes",novasEvolucoes);
        dbSalvarPaciente({...pac,evolucoes:novasEvolucoes});
        addMsg&&addMsg("🤖 IA","Médico","✅ Documento gerado e enviado ao prontuário de "+(pac?.nome||"paciente")+".","msg");
        setMedTab("prontuario");
        return true;
      }}/>;
      case "oncoagent": return <BancadaOncologica pac={pac} apiUrl={(import.meta.env.VITE_API_URL||"http://127.0.0.1:3001").replace(/\/$/,"")}/>;
      case "ia_test": return <IATestador pac={pac}/>;
      case "triagem_recebe": return <TriagemMedicoRecebe triagens={triagens} pac={pac} addMsg={addMsg} onEnviarDiscussao={t=>{setTriagemDiscussao(t);setMedTab("discussao_clinica");}} onValidar={(t,txt)=>{setDossieOncologico(d=>{const base=d||criarDossieInicial(pac);const doc={id:Date.now(),tipo:"Conduta triagem validada",nome:"Conduta validada — "+(t?.nome||pac?.nome||"paciente"),resumo:txt||t?.resumo||"Conduta validada.",origem:"medico_triagem",criadoEm:NOW(),triagemId:t?.id};const novo={...base,paciente:{...(base.paciente||{}),...pac},documentos:[doc,...(base.documentos||[])],status:"pronto_medico",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};novo.apac=validarAPAC(novo);return novo;});}}/>;
      case "discussao_clinica": return <DiscussaoClinicaIA pac={pac} dossie={dossieOncologico} triagens={triagens} triagemSelecionada={triagemDiscussao} addMsg={addMsg} onSalvar={(texto)=>{if(!executarProntuarioSecurity({pac,texto,dossie:dossieOncologico,origem:"Discussão clínica IA"},addMsg))return false;const dt=new Date();const novaEv={id:Date.now(),data:dt.toLocaleDateString("pt-BR"),hora:dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),tipo:"Discussão clínica IA",texto,autor:"Dr. Silas Negrão — CRM-PB 17341",fonte:"ia_discussao"};const novasEvolucoes=[novaEv,...(pac?.evolucoes||[])];up("evolucoes",novasEvolucoes);dbSalvarPaciente({...pac,evolucoes:novasEvolucoes});setDossieOncologico(d=>{const base=d||criarDossieInicial(pac);const doc={id:Date.now()+1,tipo:"Discussão clínica IA",nome:"Discussão clínica — "+(pac?.nome||"paciente"),resumo:texto,origem:"ia_discussao",criadoEm:NOW()};const novo={...base,paciente:{...(base.paciente||{}),...pac},documentos:[doc,...(base.documentos||[])],status:"em_consulta",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};novo.apac=validarAPAC(novo);return novo;});return true;}}/>;
      case "antiglosa": return <AntiGlosaComp pac={pac} up={up}/>;
      case "drive_ia": return <DriveIntegracaoComp pac={pac} up={up} addMsg={addMsg} dossie={dossieOncologico} setDossie={setDossieGuardado}/>;
      case "buscar": return <BuscarPacienteComp pac={pac} up={up} setPac={setPac} listaEspera={listaEspera} agendamentos={agendamentos} consultasDia={consultasDia} setMedTab={setMedTab} setPronTab={setPronTab} onAbrirPaciente={abrirAtendimento}/>;
      case "trials": return <TrialsCompMelhorado pac={pac} addMsg={addMsg} mensagens={mensagens}/>;
      case "stats": return <EstatisticasComp pac={pac} consultasDia={consultasDia} historicoQT={historicoQT}/>;
      case "config": return <ConfiguracoesComp funcLogado={funcLogado} setFuncLogado={setFuncLogado}/>;
      default: return <div style={sc_.card({textAlign:"center",padding:24,color:"#94A3B8"})}><p>Selecione uma opção no menu lateral.</p></div>;
    }
  };

  const PERFIS_LANDING=[
    {icon:"👨‍⚕️",title:"Médico",sub:"Dashboard · Prontuário · QT · APAC",pg:"medico",   bar1:"#0D1F3C",bar2:"#D4A017"},
    {icon:"💊",  title:"Farmácia",sub:"Prescrições · Estoque · Ciclos",    pg:"farmacia",  bar1:"#1B365D",bar2:"#B8860B"},
    {icon:"🏥",  title:"Recepção", sub:"Check-in · Agenda · Triagem",       pg:"recepcao",  bar1:"#2756A0",bar2:"#D4A017"},
    {icon:"🩺",  title:"Enfermagem",sub:"Salão · Infusões · Triagem",       pg:"enfermagem",bar1:"#1B365D",bar2:"#B8860B"},
    {icon:"🤝",  title:"Assist. Social",sub:"Laudos · Benefícios · LOAS",  pg:"assistencia",bar1:"#7B1D3A",bar2:"#D4A017"},
    {icon:"🧑",  title:"Portal Paciente",sub:"Reações · Documentos",        pg:"paciente",  bar1:"#374151",bar2:"#B8860B"},
  ];
  if(showAbertura) return <AberturaScreen onConcluir={()=>setShowAbertura(false)}/>;

  // ── ROTAS NOVAS (preview) ────────────────────────────────────────────────────
  if(pg==="paciente_form") return (
    <div style={{minHeight:"100vh",background:"#F1F5F9"}}>
      <div style={{background:"#1B365D",padding:"10px 20px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>setPg("landing")} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>← Voltar</button>
        <span style={{color:"rgba(255,255,255,.7)",fontSize:12}}>Seleção de Perfil → 1ª Consulta</span>
      </div>
      <PacienteDemograficoForm
        initialData={{
          nomeCompleto:pac.nome||"",
          nomeSocial:pac.nome_social||"",
          numeroProntuario:pac.prontuario||pac.pacID||"",
          cns:pac.cns||"",
          cpf:pac.cpf||"",
          rg:pac.rg||"",
          dataNascimento:pac.nasc&&/^\d{2}\/\d{2}\/\d{4}$/.test(pac.nasc)?pac.nasc.split("/").reverse().join("-"):(pac.nasc||""),
          nomeMae:pac.mae||"",
          sexo:(pac.sexo==="Feminino"?"F":pac.sexo==="Masculino"?"M":""),
          racaCor:pac.raca||"",
          etnia:pac.etnia||"",
          acompanhanteNome:pac.acompanhante_nome||"",
          responsavelNome:pac.responsavel_nome||"",
          responsavelParentesco:pac.responsavel_parentesco||"",
          responsavelTelefone:pac.responsavel_telefone||"",
          telefonePrincipal:pac.tel||"",
          telefoneCelular:pac.telefone_celular||"",
          telefoneAlternativo:pac.telefone_alternativo||"",
          whatsapp:pac.whatsapp||"",
          cep:pac.cep||"",
          tipoLogradouro:pac.tipo_logradouro||"",
          logradouro:pac.logradouro||pac.endereco||"",
          numero:pac.numero||"",
          complemento:pac.complemento||"",
          bairro:pac.bairro||"",
          municipio:pac.cidade||"",
          codigoIbgeMunicipio:pac.municipio_cod||"",
          uf:pac.uf||"PB",
          zona:pac.zona||"",
        }}
        onEnviar={(d)=>{
          const nascBR=d.dataNascimento?d.dataNascimento.split("-").reverse().join("/"):"";
          const sexoLabel=d.sexo==="F"?"Feminino":d.sexo==="M"?"Masculino":"";
          const nomeEntrada=d.nomeCompleto.trim();
          const mesmoPacienteAtivo=!!(nomeEntrada&&pac?.nome&&nomesPacienteCompativeis(pac.nome,nomeEntrada));
          const basePaciente=mesmoPacienteAtivo?pac:{...PAC0,pacID:genPacID()};
          const pacIDConsulta=mesmoPacienteAtivo?(pac.pacID||genPacID()):basePaciente.pacID;
          const pacienteCompleto={
            ...basePaciente, pacID:pacIDConsulta,
            nome:nomeEntrada||basePaciente.nome,
            nasc:nascBR||basePaciente.nasc,
            sexo:sexoLabel||basePaciente.sexo,
            cpf:d.cpf||basePaciente.cpf,
            cns:d.cns||basePaciente.cns,
            rg:d.rg||basePaciente.rg||"",
            mae:d.nomeMae||basePaciente.mae,
            cidade:d.endereco?.municipio||basePaciente.cidade,
            tel:d.contato?.telefonePrincipal||basePaciente.tel,
            telefone_celular:d.contato?.telefoneCelular||basePaciente.telefone_celular||"",
            telefone_alternativo:d.contato?.telefoneAlternativo||basePaciente.telefone_alternativo||"",
            whatsapp:d.contato?.whatsapp||basePaciente.whatsapp||"",
            cep:d.endereco?.cep||basePaciente.cep,
            municipio_cod:d.endereco?.codigoIbgeMunicipio||d.endereco?.codigoIBGEMunicipio||basePaciente.municipio_cod||"",
            uf:d.endereco?.uf||basePaciente.uf||"PB",
            endereco:d.endereco?.enderecoCompleto||basePaciente.endereco||"",
            tipo_logradouro:d.endereco?.tipoLogradouro||basePaciente.tipo_logradouro||"",
            logradouro:d.endereco?.logradouro||basePaciente.logradouro||"",
            numero:d.endereco?.numero||basePaciente.numero||"",
            complemento:d.endereco?.complemento||basePaciente.complemento||"",
            bairro:d.endereco?.bairro||basePaciente.bairro||"",
            zona:d.endereco?.zona||basePaciente.zona||"",
            naturalidade:(d.naturalidade?.municipio||"")+(d.naturalidade?.uf?" / "+d.naturalidade.uf:""),
            raca:d.racaCor||basePaciente.raca||"",
            etnia:d.etnia||basePaciente.etnia||"",
            nome_social:d.nomeSocial||basePaciente.nome_social||"",
            prontuario:d.numeroProntuario||basePaciente.prontuario||pacIDConsulta,
            acompanhante_nome:d.responsavel?.acompanhanteNome||basePaciente.acompanhante_nome||"",
            responsavel_nome:d.responsavel?.nome||basePaciente.responsavel_nome||"",
            responsavel_parentesco:d.responsavel?.parentesco||basePaciente.responsavel_parentesco||"",
            responsavel_telefone:d.responsavel?.telefone||basePaciente.responsavel_telefone||"",
            estado_civil:d.estadoCivil||basePaciente.estado_civil||"",
            profissao:d.profissao||basePaciente.profissao||"",
            status:"aguardando_recepcao",
          };
          setPac(pacienteCompleto);savePacAtual(pacienteCompleto);dbSalvarPaciente(pacienteCompleto);
          setDossieOncologico(dos=>{
            const base=dos&&mesmoPacienteDossie(dos,pacienteCompleto)?dos:criarDossieInicial(pacienteCompleto);
            const resumo=[
              "CADASTRO DEMOGRÁFICO — 1ª CONSULTA",
              "Paciente: "+(pacienteCompleto.nome||"—")+" · Nasc.: "+(pacienteCompleto.nasc||"—"),
              "CPF: "+(pacienteCompleto.cpf||"—")+" · CNS: "+(pacienteCompleto.cns||"—"),
              "Mãe: "+(pacienteCompleto.mae||"—")+" · Sexo: "+(pacienteCompleto.sexo||"—"),
              "Cidade: "+(pacienteCompleto.cidade||"—")+" · CEP: "+(pacienteCompleto.cep||"—"),
              "Raça/cor: "+(pacienteCompleto.raca||"—")+" · Estado civil: "+(pacienteCompleto.estado_civil||"—"),
            ].join("\n");
            const doc={id:Date.now(),tipo:"Cadastro Demográfico",nome:"Dados demográficos — preenchimento pelo paciente",resumo,origem:"paciente_demografico",criadoEm:NOW()};
            const novo={...base,paciente:{...(base.paciente||{}),...pacienteCompleto},documentos:[doc,...(base.documentos||[])],resumoClaude:[base.resumoClaude,resumo].filter(Boolean).join("\n\n---\n"),status:"aguardando_recepcao",updatedAt:NOW()};
            novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo),textoFinal:""};
            novo.apac=validarAPAC(novo);
            return novo;
          });
          addFila({nome:pacienteCompleto.nome,proto:"Cadastro demográfico",chegada:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),status:"aguardando_recepcao",origem:"paciente",pacID:pacienteCompleto.pacID});
          addMsg("Paciente","Recepção","Cadastro demográfico enviado: "+(pacienteCompleto.nome||"paciente")+". Dados APAC preenchidos automaticamente.","msg");
          setPg("recepcao");
        }}
      />
    </div>
  );
  if(pg==="conferencia_apac") return (
    <ConferenciaAPAC
      pac={pac}
      onSalvar={(apac)=>{ console.info("[APACApp] APAC salva via rota"); }}
      onVoltar={()=>setPg("landing")}
    />
  );

  // ── MÓDULOS v1.1.10 ──────────────────────────────────────────────────────────
  if(pg==="modulos") return (
    <AppRoutes
      pac={pac}
      up={up}
      chamarClaude={chamarClaude}
      onVoltar={()=>{ if(typeof window!=="undefined") window.location.hash=""; setPg("landing"); }}
    />
  );

  if(pg==="landing") return (
    <div style={{minHeight:"100vh",background:"#F5F7FA",display:"flex",flexDirection:"column",fontFamily:"'Segoe UI',Arial,sans-serif"}}>
      <style>{`
        @keyframes lcardIn {
          from { opacity:0; transform:translateY(22px) scale(.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .lcard-v4 {
          animation: lcardIn .38s cubic-bezier(.4,0,.2,1) both;
          transition: transform .18s cubic-bezier(.4,0,.2,1), box-shadow .18s, border-color .18s;
        }
        .lcard-v4:hover {
          transform: translateY(-4px) scale(1.025) !important;
          box-shadow: 0 14px 36px rgba(27,54,93,.18) !important;
          border-color: #D4A017 !important;
        }
        @keyframes heroBadgeIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Seletor de equipe fixo */}
      <div style={{position:"fixed",top:10,right:12,zIndex:1000}}>
        <SeletorEquipe funcLogado={funcLogado} setFuncLogado={setFuncLogado}/>
      </div>

      {/* Hero banner */}
      <div style={{background:"linear-gradient(135deg,#0D1F3C 0%,#1B365D 55%,#2756A0 100%)",padding:"36px 20px 32px",textAlign:"center",boxShadow:"0 4px 24px rgba(13,31,60,.35)"}}>
        <div style={{background:"linear-gradient(135deg,#B8860B,#D4A017)",borderRadius:20,width:72,height:72,display:"grid",placeItems:"center",margin:"0 auto 14px",fontSize:32,boxShadow:"0 6px 20px rgba(184,134,11,.45)",animation:"heroBadgeIn .5s ease both"}}>⚕</div>
        <h1 style={{color:"#fff",fontSize:28,fontWeight:900,margin:"0 0 5px",letterSpacing:.4}}>{APP_NOME}</h1>
        <p style={{color:"#D4A017",fontSize:13,margin:"0 0 3px",fontWeight:700}}>{HOSP}</p>
        <p style={{color:"rgba(255,255,255,.4)",fontSize:11,margin:"0 0 16px"}}>{HOSP2}</p>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 18px",background:"rgba(184,134,11,.18)",borderRadius:24,border:"1px solid rgba(212,160,23,.35)",animation:"heroBadgeIn .6s .15s ease both",opacity:0,animationFillMode:"forwards"}}>
          <span style={{color:"#D4A017",fontSize:12,fontWeight:800}}>✦ Dr. Silas Negrão Serra Jr.</span>
          <span style={{color:"rgba(255,255,255,.45)",fontSize:11}}>CRM-PB 17341 · RQE 9099</span>
        </div>
      </div>

      {/* Cards de perfil */}
      <div style={{flex:1,maxWidth:680,width:"100%",margin:"0 auto",padding:"28px 16px 32px"}}>
        <p style={{color:"#374151",fontSize:13,fontWeight:600,marginBottom:18,textAlign:"center",letterSpacing:.3,textTransform:"uppercase"}}>Selecione o perfil de acesso</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:22}}>
          {PERFIS_LANDING.map((b,i)=>(
            <div key={b.pg} className="lcard-v4"
              style={{background:"#fff",border:"1.5px solid #DDE3EC",borderRadius:16,overflow:"hidden",cursor:"pointer",boxShadow:"0 2px 10px rgba(13,31,60,.07)",animationDelay:`${i*0.07}s`}}
              onClick={()=>setPg(b.pg)}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px) scale(1.025)";e.currentTarget.style.boxShadow="0 14px 36px rgba(27,54,93,.18)";e.currentTarget.style.borderColor="#D4A017";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 10px rgba(13,31,60,.07)";e.currentTarget.style.borderColor="#DDE3EC";}}>
              {/* Faixa colorida superior */}
              <div style={{height:5,background:`linear-gradient(90deg,${b.bar1},${b.bar2})`}}/>
              <div style={{padding:"14px 16px 16px"}}>
                <div style={{fontSize:30,marginBottom:9,lineHeight:1}}>{b.icon}</div>
                <div style={{color:"#0A0F1E",fontWeight:800,fontSize:15,marginBottom:3}}>{b.title}</div>
                <div style={{color:"#6B7280",fontSize:11,lineHeight:1.4}}>{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <APACDashboardWidget apacs={apacs} onAbrir={()=>{setPg("medico");setMedLogado(true);setMedTab("apac");}}/>
      </div>

      {/* Rodapé discreto */}
      <div style={{textAlign:"center",padding:"14px 0 20px",color:"#9CA3AF",fontSize:10,borderTop:"1px solid #E5E7EB"}}>
        {APP_NOME} · {HOSP} · 2025–2026
      </div>
    </div>
  );

  if(pg==="assistencia") return <AssistenciaSocialPage pac={pac} up={up} setPac={setPac} back={()=>setPg("landing")} laudoLiberado={laudoLiberado} setLaudoLiberado={setLaudoLiberado} alertCount={totalAl} onAlert={goAlerta}/>;
  if(pg==="farmacia") return <FarmaciaPage pac={pac} cicloLiberado={cicloLiberado} setCicloLiberado={setCicloLiberado} mensagens={mensagens} addMsg={addMsg} back={()=>setPg("landing")} alertCount={totalAl} onAlert={goAlerta}/>;
  if(pg==="recepcao") return <RecepcaoPage pac={pac} up={up} setPac={setPac} setPg={setPg} listaEspera={listaEspera} setListaEspera={setListaEspera} addFila={addFila} agendamentos={agendamentos} addAgendamento={addAgendamento} funcLogado={funcLogado} mensagens={mensagens} addMsg={addMsg} alertCount={totalAl} onAlert={goAlerta} dossie={dossieOncologico} setDossie={setDossieGuardado} onEnviar={(destino="prontuario")=>{
    const pacientePronto={...pac,status:"pronto_medico",pacID:pac.pacID||genPacID()};
    dbSalvarPaciente(pacientePronto);
    savePacAtual(pacientePronto);
    setPac(pacientePronto);
    setDossieOncologico(d=>{
      const base=d&&mesmoPacienteDossie(d,pacientePronto)?d:criarDossieInicial(pacientePronto);
      const novo=orquestrarDossieAtendimento({...base,paciente:{...(base.paciente||{}),...pacientePronto},status:"recepcao_conferencia",updatedAt:NOW()},"recepcao_confirmacao");
      return {...novo,status:"pronto_medico",updatedAt:NOW()};
    });
    setListaEspera(x=>x.map(item=>((item.pacID&&item.pacID===pacientePronto.pacID)||item.nome===pacientePronto.nome)?{...item,status:"em_consulta",pacID:pacientePronto.pacID}:item));
    setConsultasDia(x=>{
      const existe=x.some(item=>(item.pacID&&item.pacID===pacientePronto.pacID)||item.nome===pacientePronto.nome);
      const item={nome:pacientePronto.nome,proto:pacientePronto.trat||"Primeira consulta",ciclo:"Nova consulta",chegada:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),status:"em_consulta",pacID:pacientePronto.pacID||""};
      return existe?x.map(p=>((p.pacID&&p.pacID===pacientePronto.pacID)||p.nome===pacientePronto.nome)?{...p,...item}:p):[item,...x];
    });
    addMsg("Recepção","Médico",`Prontuário pronto: ${pacientePronto.nome||"paciente"}${pacientePronto.queixa?` — Queixa: ${pacientePronto.queixa}`:""}. ${destino==="modulos_v11"?"Abrindo módulos v1.1 dentro da aba médica.":"Abrindo direto na evolução médica."}`,"standby");
    setPg("medico");setMedLogado(true);
    setMedTab("prontuario");setPronTab("consulta");
    if(destino==="modulos_v11")setMedTab2("modulos_v11");
    else {setMedTab2("prontuario");setPronTab2("evolucao");}
  }} extrairCamposIA={extrairCamposIA} extrairEvolucaoIA={extrairEvolucaoIA} extrairExamesRealizadosTexto={extrairExamesRealizadosTexto} criarDossieInicial={criarDossieInicial} orquestrarDossieAtendimento={orquestrarDossieAtendimento} apiUrl={_apiUrl}/>;
  if(pg==="enfermagem") return <EnfermagemPage pac={pac} mensagens={mensagens} addMsg={addMsg} addHistQT={addHistQT} back={()=>setPg("landing")} alertCount={totalAl} onAlert={goAlerta} onNovaTriagem={t=>{setTriagens(x=>[t,...x]);setDossieOncologico(d=>{const base=d||criarDossieInicial(pac);const condutas=t?.condutas?.length?t.condutas:condutasDeResumoTriagem(t?.resumo||"",t?.alarmes||[]);const doc={id:Date.now(),tipo:"Triagem enfermagem",nome:"Triagem QT — "+(t?.nome||pac?.nome||"paciente"),resumo:t?.resumo||t?.conclusao||"Resumo de triagem recebido.",origem:"enfermagem",criadoEm:NOW(),condutas,alarmes:t?.alarmes||[]};const novo={...base,paciente:{...(base?.paciente||{}),...pac},documentos:[doc,...(base?.documentos||[])],status:"pronto_medico",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};novo.apac=validarAPAC(novo);return novo;});}}/>;
  if(pg==="comunicacao") return <ComunicacaoPage mensagens={mensagens} addMsg={addMsg} back={()=>setPg("landing")} alertCount={totalAl} onAlert={goAlerta}/>;

  if(pg==="medico"&&!medLogado) return (
    <div style={{minHeight:"100vh",background:"#F5F7FA",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',Arial,sans-serif",padding:20}}>
      <div style={{background:"#fff",border:"1.5px solid #DDE3EC",borderRadius:20,overflow:"hidden",maxWidth:380,width:"100%",boxShadow:"0 8px 32px rgba(13,31,60,.12)"}}>
        <div style={{height:6,background:"linear-gradient(90deg,#0D1F3C,#D4A017)"}}/>
        <div style={{padding:"32px 28px 28px",textAlign:"center"}}>
          <div style={{background:"linear-gradient(135deg,#B8860B,#D4A017)",borderRadius:16,width:64,height:64,display:"grid",placeItems:"center",margin:"0 auto 14px",fontSize:28,boxShadow:"0 4px 14px rgba(184,134,11,.35)"}}>👨‍⚕️</div>
          <h2 style={{color:"#0A0F1E",fontWeight:900,fontSize:18,margin:"0 0 6px"}}>Acesso Médico</h2>
          <p style={{color:"#6B7280",fontSize:13,marginBottom:22}}>Módulo clínico — Dr. Silas Negrão Serra Jr.</p>
          <button onClick={()=>setMedLogado(true)} style={{width:"100%",padding:"12px 0",background:"linear-gradient(135deg,#B8860B,#D4A017)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 3px 12px rgba(184,134,11,.35)",marginBottom:10}}>Entrar →</button>
          <button onClick={()=>setPg("landing")} style={{width:"100%",padding:"10px 0",background:"transparent",border:"1.5px solid #DDE3EC",borderRadius:10,color:"#374151",fontWeight:600,fontSize:13,cursor:"pointer"}}>← Voltar ao Início</button>
        </div>
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
    if(pacFluxo==="primeira") return <PrimConsultaPaciente pac={pac} up={up} addMsg={_addMsg2} addCaixa={_addCaixa} addFila={_addFila} onDossieCriado={(entrada)=>{
      // Mescla dados do paciente; mapeia local_cancer → diag e cid_sugerido → cid
      const ep=entrada.paciente||{};
      const sedeCID=getCIDPorSede(ep.local_cancer||ep.local_cancer);
      const diagAuto=ep.diag||ep.local_cancer||(sedeCID?.sede?"Neoplasia de "+sedeCID.sede:"")||"";
      const cidAuto=ep.cid||ep.cid_sugerido||sedeCID?.cid||getCID(diagAuto)||"";
      const pacMesclado={
        ...pac,...ep,
        // Campos clínicos: dados do paciente (ep) têm prioridade sobre valores antigos (pac)
        diag:diagAuto||pac.diag||"",
        cid:cidAuto||pac.cid||"",
        local_cancer:ep.local_cancer||pac.local_cancer||"",
        queixa:ep.queixa||pac.queixa||"",
        sintomas_atuais:ep.sintomas_atuais||pac.sintomas_atuais||"",
        antec:ep.antec||pac.antec||"",
        meds:ep.meds||pac.meds||"",
        alerg:ep.alerg||pac.alerg||"",
        anam_cirurgia:ep.anam_cirurgia||pac.anam_cirurgia||"",
        anam_hist_fam:ep.anam_hist_fam||pac.anam_hist_fam||"",
        vacinas:ep.vacinas||pac.vacinas||"",
        // Dados demográficos: ep tem prioridade
        nome:ep.nome||pac.nome||"",
        nasc:ep.nasc||pac.nasc||"",
        cpf:ep.cpf||pac.cpf||"",
        cns:ep.cns||pac.cns||"",
        rg:ep.rg||pac.rg||"",
        mae:ep.mae||pac.mae||"",
        cidade:ep.cidade||pac.cidade||"",
        tel:ep.tel||pac.tel||"",
        telefone_celular:ep.telefone_celular||pac.telefone_celular||"",
        telefone_alternativo:ep.telefone_alternativo||pac.telefone_alternativo||"",
        sexo:ep.sexo||pac.sexo||"",
        raca:ep.raca_cor||ep.raca||pac.raca||"",
        etnia:ep.etnia||pac.etnia||"",
        nome_social:ep.nome_social||pac.nome_social||"",
        prontuario:ep.prontuario||pac.prontuario||pac.pacID||"",
        acompanhante_nome:ep.acompanhante_nome||pac.acompanhante_nome||"",
        responsavel_nome:ep.responsavel_nome||pac.responsavel_nome||"",
        responsavel_parentesco:ep.responsavel_parentesco||pac.responsavel_parentesco||"",
        responsavel_telefone:ep.responsavel_telefone||pac.responsavel_telefone||"",
        cep:ep.cep||pac.cep||"",
        tipo_logradouro:ep.tipo_logradouro||pac.tipo_logradouro||"",
        logradouro:ep.logradouro||pac.logradouro||"",
        numero:ep.numero||pac.numero||"",
        complemento:ep.complemento||pac.complemento||"",
        bairro:ep.bairro||pac.bairro||"",
        municipio_cod:ep.municipio_cod||pac.municipio_cod||"",
        uf:ep.uf||pac.uf||"PB",
        zona:ep.zona||pac.zona||"",
        endereco:ep.endereco||pac.endereco||"",
      };
      setPac(pacMesclado);savePacAtual(pacMesclado);dbSalvarPaciente(pacMesclado);
      // Atualiza dossiê oncológico com documentos e status recepção
      setDossieOncologico(d=>{
        const docs=[...(entrada.documentos||[]).map(doc=>({...doc,origem:doc.origem||"paciente"})),...(d?.documentos||[])];
        const novo={...(d||criarDossieInicial(pacMesclado)),paciente:{...(d?.paciente||{}),...pacMesclado},documentos:docs,status:"aguardando_recepcao",resumoClaude:limparMarkdown(entrada.resumoEntrada||d?.resumoClaude||""),updatedAt:NOW()};
        novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo),textoFinal:""};
        novo.apac=validarAPAC(novo);
        return novo;
      });
    }} onConcluido={()=>setPacFluxo(null)} back={()=>setPacFluxo(null)} alertCount={totalAl} onAlert={goAlerta}/>;
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
          {pacTab==="carteirinha"&&<div style={{display:"grid",gap:12}}><CarteirinhaNova pac={pac}/><CarteirinhaTab pac={pac} pacID={_pacID} histQT={historicoQTPaciente} addFila={_addFila}/></div>}
          {pacTab==="segunda_via"&&<SegundaViaTab pac={pac} addCaixaEntrada={_addCaixa} laudoLiberado={_laudoLib}/>}
          {pacTab==="enviar_exames"&&<div style={sc_.card()}><H2 ch="📤 Enviar Exames ao Médico"/><p style={{color:"#64748B",fontSize:12,marginBottom:10}}>Todos os documentos são revisados pela IA antes de chegar ao médico.</p><UploadComIA pac={pac} up={up} addMsg={_addMsg2} destino="prontuario" origem="Paciente" onConcluido={()=>alert("✅ Documento enviado! O médico receberá um resumo gerado pela IA.")}/></div>}
          {pacTab==="videos"&&<VideosYouTube/>}
        </div>
      </div>
    );
  }

  // ── UploadModuloComp — porta única do médico: Drive por nome + upload direto ──
  function UploadModuloComp({ pac, up, addMsg, chamarClaude, dossieOncologico, setDossieOncologico, adicionarDocumentoPadraoDossie, setMedTab2 }) {
    const DRIVE_PASTA_URL = 'https://drive.google.com/drive/folders/1s10nG9xXO_UrnIdrU8gYC6PYz4uvN9EH';
    const [nomePacDrive, setNomePacDrive] = React.useState(pac?.nome || '');
    const [textoDrive, setTextoDrive] = React.useState('');
    const [buscandoDrive, setBuscandoDrive] = React.useState(false);
    const [erroDrive, setErroDrive] = React.useState('');
    const [resumoDrive, setResumoDrive] = React.useState('');

    const gerarResumoDrive = async () => {
      const nome=(nomePacDrive||pac?.nome||'').trim();
      setErroDrive('');
      setResumoDrive('');
      if(!nome){
        setErroDrive('Informe o nome do paciente para buscar na pasta fixa.');
        return;
      }
      setBuscandoDrive(true);
      try{
        const payload={
          paciente:{...(pac||{}),nome},
          recepcao:{drive_folder:DRIVE_PASTA_URL,busca_paciente:nome},
          drive_folder:DRIVE_PASTA_URL,
          texto:textoDrive||`Buscar no Drive os documentos do paciente ${nome}.`,
          tipo:'Drive por nome',
          arquivoIds:null,
          modelo_resumo:'Resumo único: DADOS CLÍNICOS; DADOS ONCOLÓGICOS; LAUDOS EM CRONOLOGIA no formato DD/MM/AA - TIPO DO EXAME - achado oncológico objetivo; PENDÊNCIAS. Sem markdown e sem resumos duplicados.',
        };
        const r=await fetch(_apiUrl()+"/api/dossie/drive",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify(payload),
        });
        const data=await r.json().catch(()=>({}));
        if(!r.ok||data.ok===false)throw new Error(data.message||data.error||`Backend HTTP ${r.status}`);
        const resumo=data.resumo||data.text||data.resumo_claude||"";
        if(!resumo)throw new Error("O backend respondeu sem resumo.");
        if(!executarProntuarioSecurity({pac:{...(pac||{}),nome},texto:resumo,dossie:dossieOncologico,origem:"Drive médico por nome"},addMsg))return;
        setDossieOncologico(d=>{
          const base=mesmoPacienteDossie(d,pac)?(d||criarDossieInicial(pac)):criarDossieInicial({...pac,nome});
          const docs=(data.arquivos||[]).map((a,i)=>({
            id:Date.now()+i,
            tipo:a.tipo||"Drive",
            nome:a.nome||a.name||`Documento Drive ${i+1}`,
            resumo:a.resumo||resumo,
            origem:"medico_drive",
            criadoEm:NOW(),
            exames:extrairExamesRealizadosTexto(a.resumo||resumo),
            evolucaoClaude:extrairEvolucaoIA(a.resumo||resumo),
          }));
          const docFallback=docs.length?[]:[{
            id:Date.now(),
            tipo:"Drive",
            nome:"Resumo Drive - "+nome,
            resumo,
            origem:"medico_drive",
            criadoEm:NOW(),
            exames:extrairExamesRealizadosTexto(resumo),
            evolucaoClaude:extrairEvolucaoIA(resumo),
          }];
          const novo={
            ...base,
            paciente:{...(base.paciente||{}),...(pac||{}),nome},
            documentos:[...docs,...docFallback,...(base.documentos||[])],
            resumoClaude:[base.resumoClaude,resumo].filter(Boolean).join("\n\n---\n"),
            status:"pronto_medico",
            updatedAt:NOW(),
          };
          novo.evolucao={...(novo.evolucao||{}),rascunho:extrairEvolucaoIA(resumo)||gerarTextoEvolucao(novo),textoFinal:""};
          novo.apac=validarAPAC(novo);
          return novo;
        });
        setResumoDrive(resumo);
        addMsg&&addMsg("Drive","Médico",`Documentos de ${nome} processados e migrados para evolução no padrão do dossiê.`,"msg");
        setMedTab2&&setMedTab2("prontuario");
      }catch(err){
        setErroDrive(err.message||"Não foi possível puxar os documentos do Drive.");
      }finally{
        setBuscandoDrive(false);
      }
    };

    return (
      <div style={{display:'grid',gap:14}}>
        <div style={{background:'#fff',border:'1px solid #DDE3EC',borderRadius:14,padding:'16px 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{fontSize:22}}>☁️</span>
            <div>
              <div style={{fontSize:12,fontWeight:900,color:'#1B365D',textTransform:'uppercase',letterSpacing:.6}}>Upload Médico</div>
              <div style={{fontSize:18,fontWeight:900,color:'#0A0F1E',lineHeight:1.2}}>Buscar no Drive pelo nome do paciente</div>
            </div>
          </div>
          <p style={{fontSize:12,color:'#64748B',margin:'4px 0 14px'}}>
            Pasta fixa da equipe. O app envia o nome ao backend, monta o resumo no padrão do dossiê e migra para a evolução.
          </p>

          <div style={{background:'#F5F7FA',border:'1px solid #DDE3EC',borderRadius:10,padding:'10px 14px',marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:900,color:'#64748B',textTransform:'uppercase',letterSpacing:.6,marginBottom:4}}>Pasta Drive (fixa)</div>
            <a href={DRIVE_PASTA_URL} target="_blank" rel="noopener noreferrer"
              style={{fontSize:12,color:'#2756A0',fontWeight:700,wordBreak:'break-all'}}>
              {DRIVE_PASTA_URL}
            </a>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10,marginBottom:12}}>
            <label style={{fontSize:11,fontWeight:900,color:'#1B365D'}}>
              Nome do Paciente
              <input
                value={nomePacDrive}
                onChange={e => setNomePacDrive(e.target.value)}
                placeholder="Ex.: MARIA SILVA"
                style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:4,border:'1.5px solid #CBD5E1',borderRadius:8,padding:'8px 10px',fontSize:13,fontFamily:'inherit',outline:'none',color:'#0A0F1E',background:'#fff'}}
              />
            </label>
            <label style={{fontSize:11,fontWeight:900,color:'#1B365D'}}>
              Observação opcional para filtrar documentos
              <textarea
                value={textoDrive}
                onChange={e => setTextoDrive(e.target.value)}
                placeholder="Ex.: priorizar laudos recentes, anatomopatológico e tomografias"
                style={{display:'block',width:'100%',minHeight:76,boxSizing:'border-box',marginTop:4,border:'1.5px solid #CBD5E1',borderRadius:8,padding:'8px 10px',fontSize:13,fontFamily:'inherit',outline:'none',color:'#0A0F1E',background:'#fff',resize:'vertical'}}
              />
            </label>
          </div>

          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <button
              onClick={gerarResumoDrive}
              disabled={buscandoDrive}
              style={{background:buscandoDrive?'#94A3B8':'linear-gradient(135deg,#1B365D,#2756A0)',color:'#fff',border:'none',borderRadius:10,padding:'10px 16px',fontSize:13,fontWeight:900,cursor:buscandoDrive?'wait':'pointer',fontFamily:'inherit'}}>
              {buscandoDrive ? 'Processando Drive...' : 'Buscar no Drive e gerar resumo'}
            </button>
            <button onClick={()=>setMedTab2('prontuario')} style={{background:'#F8FAFC',border:'1px solid #DDE3EC',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#1B365D',fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>Abrir evolução</button>
          </div>
          {erroDrive&&<div style={{marginTop:10,background:'#FCE8EF',border:'1px solid #7B1D3A44',borderRadius:8,padding:'8px 10px',fontSize:12,color:'#7B1D3A',fontWeight:800}}>{erroDrive}</div>}
          {resumoDrive&&<div style={{marginTop:12,background:'#F8FAFC',border:'1px solid #DDE3EC',borderRadius:10,padding:12}}>
            <div style={{fontSize:11,fontWeight:900,color:'#1B365D',textTransform:'uppercase',marginBottom:6}}>Resumo importado</div>
            <Cbox text={resumoDrive} maxH={180}/>
          </div>}
        </div>

        <div style={{background:'#fff',border:'1px solid #DDE3EC',borderRadius:14,padding:'14px 18px'}}>
          <div style={{fontSize:12,fontWeight:900,color:'#1B365D',textTransform:'uppercase',letterSpacing:.6,marginBottom:4}}>Upload direto</div>
          <p style={{fontSize:12,color:'#64748B',margin:'0 0 10px'}}>Ou cole/arraste o texto do laudo abaixo — segue o mesmo padrão do dossiê.</p>
          <UploadComIA pac={pac} up={up} addMsg={addMsg} destino="prontuario" origem="Módulo"
            onConcluido={(res,meta)=>{if(adicionarDocumentoPadraoDossie(res,meta,'modulo_upload'))alert('✅ Documento inserido no padrão do dossiê.');}}/>
        </div>
      </div>
    );
  }

  // ── renderMedico2: 7 tabs v4 com AppShell ─────────────────────────────────
  const goDashV4=(id)=>{
    if(id==="dashboard"||id==="alertas")return setMedTab2("dashboard");
    if(id==="pacientes"||id==="buscar_paciente")return setMedTab2("pacientes");
    if(id==="triagem_recebe"||id==="enfermagem_triagem"){setMedTab2("enfermagem");setEnfermagemTab2("triagem");return;}
    if(id==="enfermagem_salao"){setMedTab2("enfermagem");setEnfermagemTab2("salao");return;}
    if(id==="discussao_clinica")return setMedTab2("discussao_clinica");
    if(id==="consultas_dia"||id==="fila")return setMedTab2("fila");
    if(id==="quimio"||id==="prescricao")return setMedTab2("prescricao");
    if(id==="drive_ia"||id==="drive")return setMedTab2("upload_modulo");
    if(id==="receitas"){setMedTab2("prontuario");setPronTab2("receitas");return;}
    if(id==="exames_med"||id==="exames")return setMedTab2("upload_modulo");
    if(id==="upload_modulo")return setMedTab2("upload_modulo");
    if(id==="concluir_atendimento"||id==="novo_atendimento")return setMedTab2(id);
    if(id==="prontuario"){setMedTab2("prontuario");setPronTab2("evolucao");return;}
    if(id==="apac")return setMedTab2("apac");
    if(id==="ia"||id==="ia_hub")return setMedTab2("ia");
    if(id==="modulos"||id==="modulos_v11")return setMedTab2("upload_modulo");
    if(id==="salao"||id==="stats"||id==="agenda_med"||id==="config"||id==="balanco"){
      setMedTab2("admin");
      setAdminTab2(id==="salao"?"salao":id==="stats"?"stats":id==="agenda_med"?"agenda":id==="balanco"?"balanco":"config");
      return;
    }
    setMedTab2("fila");
  };
  const atendimentosMedicos=[
    ...(listaEspera||[]).map(p=>({...p,status:p.status||"aguardando",proto:p.proto||p.trat||"Primeira consulta"})),
    ...(consultasDia||[])
  ];

  const renderMedico2=()=>{
    switch(medTab2){
      case "dashboard": return <DashboardMedico pac={pac} consultasDia={atendimentosMedicos} alertas={MOCK_ALERTAS} mensagens={mensagens} setMedTab={goDashV4} caixaEntrada={caixaEntrada} agendamentos={agendamentos} onAbrirAtendimento={(p)=>{abrirAtendimento(p);setMedTab2("prontuario");setPronTab2("evolucao");}}/>;
      case "fila": return <FilaDiaMedico consultasDia={atendimentosMedicos} alertas={MOCK_ALERTAS} setMedTab={goDashV4} onAbrirAtendimento={(p)=>{abrirAtendimento(p);setMedTab2("prontuario");setPronTab2("evolucao");}}/>;
      case "pacientes": return <GerenciarPacientes onAbrirPaciente={p=>{abrirAtendimento(p);setMedTab2("prontuario");setPronTab2("evolucao");}} onNovoPaciente={p=>{const np={...PAC0,...p,pacID:p?.pacID||genPacID()};setPac(np);savePacAtual(np);setDossieOncologico(criarDossieInicial(np));setMedTab2("prontuario");setPronTab2("evolucao");}}/>;
      case "upload_modulo": return <UploadModuloComp pac={pac} up={up} addMsg={addMsg} chamarClaude={chamarClaude} dossieOncologico={dossieOncologico} setDossieOncologico={setDossieOncologico} adicionarDocumentoPadraoDossie={adicionarDocumentoPadraoDossie} setMedTab2={setMedTab2}/>;
      case "concluir_atendimento":
      case "novo_atendimento": return <AtendimentoSegurancaPanel pac={pac} dossie={dossieOncologico} onConcluir={concluirAtendimentoAtual} onNovo={novoAtendimentoLimpo} onLimparTestes={limparDadosTeste}/>;
      case "prontuario": return(
        <div>
          {aiPatches.length>0&&<div style={{marginBottom:12}}><ReviewBanner patches={aiPatches} onApply={({approvedFields,patchId})=>{approvedFields.forEach(({field,value})=>up&&up(field,value));setAiPatches(x=>x.filter(p=>p.id!==patchId));}} onDismiss={()=>setAiPatches([])}/></div>}
          <SubTabsV4 tabs={[{id:"evolucao",ico:"📝",label:"Evolução"},{id:"receitas",ico:"📄",label:"Receitas"},{id:"timeline",ico:"🕒",label:"Timeline"}]} active={["drive","exames"].includes(pronTab2)?"evolucao":pronTab2} onChange={setPronTab2}/>
          {["evolucao","drive","exames"].includes(pronTab2)&&<StepperMedico pac={pac} dossie={dossieOncologico} setDossie={setDossieGuardado} up={up} addMsg={addMsg} onAbrirAPAC={()=>setMedTab2("apac")} onLimpar={()=>{if(window.confirm("Limpar atendimento?")){const np={...PAC0,pacID:genPacID()};setPac(np);clearPacAtual?.();setDossieOncologico(criarDossieInicial(np));}}} onSalvarEvolucao={(evolucao)=>{if(!executarProntuarioSecurity({pac,texto:evolucao,dossie:dossieOncologico,origem:"Salvar evolução do dossiê"},addMsg))return false;const dt=new Date();const nv={id:Date.now(),data:dt.toLocaleDateString("pt-BR"),hora:dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),tipo:"Consulta médica",texto:evolucao,autor:"Dr. Silas Negrão — CRM-PB 17341",fonte:"dossie"};const ne=[nv,...(pac?.evolucoes||[])];up("evolucoes",ne);dbSalvarPaciente({...pac,evolucoes:ne});addMsg&&addMsg("Médico","Equipe","✅ Evolução salva.","msg");return true;}}/> }
          {pronTab2==="drive"&&<DriveIntegracaoComp pac={pac} up={up} addMsg={addMsg} dossie={dossieOncologico} setDossie={setDossieGuardado}/>}
          {pronTab2==="exames"&&<div style={{background:"#fff",border:"1px solid #DDE3EC",borderRadius:14,padding:"16px 20px"}}><div style={{fontWeight:800,fontSize:14,color:"#0A0F1E",marginBottom:10}}>📎 Novos Exames via IA</div><UploadComIA pac={pac} up={up} addMsg={addMsg} destino="prontuario" origem="Médico" onConcluido={(res,meta)=>{if(adicionarDocumentoPadraoDossie(res,meta,"medico_upload"))alert("✅ Adicionado ao prontuário.");}}/></div>}
          {pronTab2==="receitas"&&<div style={{display:"grid",gap:12}}><PrescreverDoenca pac={pac}/><ReceitasComp pac={pac} addCaixaEntrada={addCaixaEntrada} addMsg={addMsg}/></div>}
          {pronTab2==="timeline"&&<div style={{background:"#fff",border:"1px solid #DDE3EC",borderRadius:14,padding:"16px 20px"}}><h3 style={{color:"#1B365D",fontWeight:800,fontSize:14,marginBottom:12}}>🕒 Linha do Tempo</h3><EvolutionTimeline exams={pac?.exames_imagem||[]} triages={(pac?.evolucoes||[]).map(e=>{let dh;try{const[d,m,y]=(e.data||"01/01/2020").split("/");dh=new Date(`${y}-${m}-${d}T${e.hora||"00:00"}:00`).toISOString();}catch(_){dh=new Date().toISOString();}return{id:e.id||String(Date.now()),__source:"evolucao",dataHora:dh,tipo:e.tipo||"consulta",enfermeiroNome:e.autor||"Médico",queixaAtual:e.texto,sinaisAlarme:[],qtLiberada:null};}).concat((triagens||[]).map(t=>({...t,__source:"triagem"})))} onDelete={apagarItemTimeline}/></div>}
        </div>
      );
      case "prescricao": return(
        <div>
          <SubTabsV4 tabs={[{id:"motor45",ico:"🧮",label:"Motor v4.5"},{id:"prescricao_atual",ico:"💉",label:"Prescrição atual"}]} active={prescricaoTab2} onChange={setPrescricaoTab2}/>
          {prescricaoTab2==="motor45"&&<ProtocolosQTExplorer pac={pac} up={up} addMsg={addMsg} historicoQT={historicoQTPaciente} setHistoricoQT={setHistoricoQTPaciente}/>}
          {prescricaoTab2==="prescricao_atual"&&<PrescricaoQT pac={pac} up={up} addMsg={addMsg} ciclosHistorico={historicoQTPaciente} setCiclosHistorico={setHistoricoQTPaciente} onSalvoCiclos={(proto,ciclos)=>{setDossieOncologico(d=>{const base=d||criarDossieInicial(pac);const doc={id:Date.now(),tipo:"Prescrição QT",nome:`${proto.nome} — ${ciclos.length} ciclos liberados`,resumo:`Protocolo: ${proto.nome}\nCiclos: ${ciclos.length}\nInício: ${ciclos[0]?.data||"—"}\nFármacos: ${proto.drugs?.map(dr=>dr.n).join(", ")||"—"}`,origem:"prescricao_qt",criadoEm:NOW()};const novo={...base,paciente:{...(base.paciente||{}),...pac},documentos:[doc,...(base.documentos||[])],status:"pronto_medico",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};novo.apac=validarAPAC(novo);return novo;});}}/>}
        </div>
      );
      case "apac": return(
        <div style={{display:"grid",gap:14}}>
          <StatusDossieBar dossie={dossieOncologico}/>
          <APACDossieChecklist dossie={dossieOncologico} setDossie={setDossieGuardado}/>
          <APACEntradaRapida pac={pac} up={up} dossie={dossieOncologico} setDossie={setDossieGuardado} addMsg={addMsg}/>
          <SeletorAPAC
            pac={pac}
            onSelecionar={(sel)=>{
              const procs=sel.procedimentos||[];
              const principal=procs[0]||{};
              if(principal.codigo)up("cod_proc",principal.codigo);
              if(principal.descricao)up("diag",principal.descricao);
              if(principal.linha)up("linha",principal.linha);
              if(principal.indicacao)up("conduta",(pac.conduta?pac.conduta+"\n":"")+principal.indicacao);
              const codigos=procs.map(p=>p.codigo).filter(Boolean).join(", ");
              const descricoes=procs.map(p=>p.descricao).filter(Boolean).join("; ");
              addMsg&&addMsg("APAC","Médico",`APAC preenchida: ${descricoes} | SIGTAP: ${codigos}`,"msg");
            }}
          />
          <APACSystem pac={{...pac,...(dossieOncologico?.apac?.campos||{})}} up={up} addMsg={addMsg} apacs={apacs} setApacs={setApacs}/>
          <AntiGlosaComp pac={pac} up={up}/>
        </div>
      );
      case "enfermagem": return(
        <div>
          <SubTabsV4 tabs={[{id:"triagem",ico:"🩺",label:"Triagem"},{id:"salao",ico:"🛋️",label:"Salão"}]} active={enfermagemTab2} onChange={setEnfermagemTab2}/>
          {enfermagemTab2==="triagem"&&<TriagemMedicoRecebe triagens={triagens} pac={pac} addMsg={addMsg} onEnviarDiscussao={t=>{setTriagemDiscussao(t);setMedTab2("discussao_clinica");}} onValidar={(t,txt)=>{setDossieOncologico(d=>{const base=d||criarDossieInicial(pac);const doc={id:Date.now(),tipo:"Conduta triagem validada",nome:"Conduta validada — "+(t?.nome||pac?.nome||"paciente"),resumo:txt||t?.resumo||"Conduta validada.",origem:"medico_triagem",criadoEm:NOW(),triagemId:t?.id};const novo={...base,paciente:{...(base.paciente||{}),...pac},documentos:[doc,...(base.documentos||[])],status:"pronto_medico",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};novo.apac=validarAPAC(novo);return novo;});}}/>}
          {enfermagemTab2==="salao"&&<SalaoMedico timers={timers} addMsg={addMsg} setEmergenciaAtiva={setEmergenciaAtiva}/>}
        </div>
      );
      case "triagem_recebe": return <TriagemMedicoRecebe triagens={triagens} pac={pac} addMsg={addMsg} onEnviarDiscussao={t=>{setTriagemDiscussao(t);setMedTab2("discussao_clinica");}} onValidar={(t,txt)=>{setDossieOncologico(d=>{const base=d||criarDossieInicial(pac);const doc={id:Date.now(),tipo:"Conduta triagem validada",nome:"Conduta validada — "+(t?.nome||pac?.nome||"paciente"),resumo:txt||t?.resumo||"Conduta validada.",origem:"medico_triagem",criadoEm:NOW(),triagemId:t?.id};const novo={...base,paciente:{...(base.paciente||{}),...pac},documentos:[doc,...(base.documentos||[])],status:"pronto_medico",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};novo.apac=validarAPAC(novo);return novo;});}}/>;
      case "discussao_clinica": return <DiscussaoClinicaIA pac={pac} dossie={dossieOncologico} triagens={triagens} triagemSelecionada={triagemDiscussao} addMsg={addMsg} onSalvar={(texto)=>{if(!executarProntuarioSecurity({pac,texto,dossie:dossieOncologico,origem:"Discussão clínica IA"},addMsg))return false;const dt=new Date();const novaEv={id:Date.now(),data:dt.toLocaleDateString("pt-BR"),hora:dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),tipo:"Discussão clínica IA",texto,autor:"Dr. Silas Negrão — CRM-PB 17341",fonte:"ia_discussao"};const novasEvolucoes=[novaEv,...(pac?.evolucoes||[])];up("evolucoes",novasEvolucoes);dbSalvarPaciente({...pac,evolucoes:novasEvolucoes});setDossieOncologico(d=>{const base=d||criarDossieInicial(pac);const doc={id:Date.now()+1,tipo:"Discussão clínica IA",nome:"Discussão clínica — "+(pac?.nome||"paciente"),resumo:texto,origem:"ia_discussao",criadoEm:NOW()};const novo={...base,paciente:{...(base.paciente||{}),...pac},documentos:[doc,...(base.documentos||[])],status:"em_consulta",updatedAt:NOW()};novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};novo.apac=validarAPAC(novo);return novo;});return true;}}/>;
      case "ia": return <AssistenteIA pac={pac} up={up} addMsg={addMsg} funcLogado={funcLogado} onSalvarEvolucao={(evolucao)=>{if(!executarProntuarioSecurity({pac,texto:evolucao,dossie:dossieOncologico,origem:"Assistente IA"},addMsg))return false;const dt=new Date();const nv={id:Date.now(),data:dt.toLocaleDateString("pt-BR"),hora:dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),tipo:"Assistente IA",texto:evolucao,autor:"Dr. Silas Negrão — CRM-PB 17341",fonte:"ia"};const ne=[nv,...(pac?.evolucoes||[])];up("evolucoes",ne);dbSalvarPaciente({...pac,evolucoes:ne});addMsg&&addMsg("🤖 IA","Médico","✅ Gerado.","msg");setMedTab2("prontuario");return true;}}/>;
      case "modulos_v11": return <div style={{display:"grid",gap:12}}>
        <div style={{background:"#fff",border:"1px solid #DDE3EC",borderRadius:14,padding:"12px 16px"}}>
          <div style={{fontSize:12,fontWeight:900,color:"#1B365D",textTransform:"uppercase",letterSpacing:.6}}>Ferramentas avançadas</div>
          <div style={{fontSize:18,fontWeight:900,color:"#0A0F1E",marginTop:2}}>Módulos v1.1 dentro da aba médica</div>
          <p style={{fontSize:12,color:"#64748B",margin:"6px 0 0"}}>Uso opcional. O fluxo principal permanece: paciente + recepção → prontuário pronto na evolução médica.</p>
        </div>
        <AppRoutes pac={pac} up={up} chamarClaude={chamarClaude} onVoltar={()=>setMedTab2("prontuario")}/>
      </div>;
      case "admin": return(
        <div>
          <SubTabsV4 tabs={[{id:"config",ico:"⚙️",label:"Config"},{id:"stats",ico:"📊",label:"Stats"},{id:"balanco",ico:"💰",label:"Balanço"},{id:"agenda",ico:"🗓",label:"Agenda"}]} active={adminTab2} onChange={setAdminTab2}/>
          {adminTab2==="config"&&<ConfiguracoesComp funcLogado={funcLogado} setFuncLogado={setFuncLogado}/>}
          {adminTab2==="stats"&&<EstatisticasComp pac={pac} consultasDia={consultasDia} historicoQT={historicoQT}/>}
          {adminTab2==="balanco"&&<GraficoProducao/>}
          {adminTab2==="agenda"&&<AgendamentoComp agendamentos={agendamentos} addAgendamento={addAgendamento} ismedico={true}/>}
        </div>
      );
      default: return null;
    }
  };

  const msgNaoLidasTotal=(mensagens||[]).filter(m=>m.para==="Médico"&&!m.lida).length;
  return(
    <React.Suspense fallback={null}>
    <>
      {/* Overlay emergência */}
      {emergenciaAtiva&&<div style={{position:"fixed",inset:0,background:"rgba(123,29,58,.97)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:"#fff",borderRadius:20,padding:30,maxWidth:480,width:"100%",textAlign:"center",boxShadow:"0 0 0 8px rgba(255,255,255,.12)"}}>
          <div style={{fontSize:60,marginBottom:8}}>🚨</div>
          <h1 style={{color:"#7B1D3A",fontSize:22,fontWeight:900,margin:"0 0 8px"}}>EMERGÊNCIA NO SALÃO</h1>
          <div style={{background:"#FCE8EF",border:"2px solid #7B1D3A",borderRadius:12,padding:12,marginBottom:18}}>
            <p style={{fontSize:14,color:"#4A0020",fontWeight:700,margin:"0 0 3px"}}>{emergenciaAtiva.de}</p>
            <p style={{fontSize:13,color:"#374151",margin:0}}>{emergenciaAtiva.txt}</p>
            <p style={{fontSize:11,color:"#94A3B8",margin:"5px 0 0"}}>{emergenciaAtiva.hora}</p>
          </div>
          <div style={{display:"flex",gap:9}}>
            <button onClick={()=>{setMedTab2("enfermagem");setEnfermagemTab2("salao");setEmergenciaAtiva(null);}} style={{flex:1,background:"linear-gradient(135deg,#7B1D3A,#9B2335)",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🩺 Ir ao Salão</button>
            <button onClick={()=>setEmergenciaAtiva(null)} style={{background:"transparent",color:"#6B7280",border:"1px solid #DDE3EC",borderRadius:10,padding:"12px 16px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
          </div>
        </div>
      </div>}
      {/* Shell principal */}
      <AppShell
        perfil="medico"
        activeTab={medTab2}
        onTabChange={id=>{setMedTab2(id);if(id==="prontuario")setPronTab2("evolucao");if(id==="enfermagem")setEnfermagemTab2("triagem");}}
        pac={pac}
        fluxoStatus={pac?.status||"pronto_medico"}
        onTrocarPerfil={()=>{setMedLogado(false);setPg("landing");}}
        alertCount={totalAlertas}
        msgCount={msgNaoLidasTotal}
        headerRight={
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
            <button title="Concluir atendimento" onClick={()=>setMedTab2("concluir_atendimento")} style={{background:"#ECFDF5",border:"1px solid #15803D44",borderRadius:8,padding:"5px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit",color:"#15803D",fontWeight:900}}>✅ Concluir</button>
            <button title="Novo atendimento" onClick={()=>setMedTab2("novo_atendimento")} style={{background:"#FDF8EE",border:"1px solid #B8860B44",borderRadius:8,padding:"5px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit",color:"#B8860B",fontWeight:900}}>🧼 Nova Consulta</button>
            <button title="Buscar paciente" onClick={()=>setMedTab2("pacientes")} style={{background:"#FFFFFF",border:"1px solid #DDE3EC",borderRadius:8,padding:"5px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit",color:"#1B365D",fontWeight:800}}>🔎 Paciente</button>
            <button title="Chat da equipe" onClick={()=>setChatFlutAberto(x=>!x)} style={{position:"relative",background:"#EBF2FF",border:"1px solid #2756A033",borderRadius:8,padding:"5px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit",color:"#1B365D",fontWeight:800}}>
              💬 Chat{msgNaoLidasTotal>0&&<span style={{position:"absolute",top:-5,right:-5,background:"#7B1D3A",color:"#fff",borderRadius:999,width:16,height:16,display:"grid",placeItems:"center",fontSize:9,fontWeight:900}}>{msgNaoLidasTotal}</span>}
            </button>
            <button title="Laboratório" onClick={()=>setMedTab2("upload_modulo")} style={{background:"#FFFFFF",border:"1px solid #DDE3EC",borderRadius:8,padding:"5px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit",color:"#1B365D",fontWeight:800}}>🧪 Lab</button>
            <button title="Radiologia" onClick={()=>setMedTab2("upload_modulo")} style={{background:"#FFFFFF",border:"1px solid #DDE3EC",borderRadius:8,padding:"5px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit",color:"#1B365D",fontWeight:800}}>🩻 Radio</button>
            <button title="Enfermagem - triagem" onClick={()=>{setMedTab2("enfermagem");setEnfermagemTab2("triagem");}} style={{background:"#FDF8EE",border:"1px solid #B8860B55",borderRadius:8,padding:"5px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit",color:"#1B365D",fontWeight:800}}>🩺 Triagem</button>
            <div title={syncStatus.label} style={{fontSize:10,color:syncStatus.cor,background:"#F5F7FA",borderRadius:8,padding:"4px 8px",fontWeight:700,border:"1px solid #DDE3EC"}}>{syncStatus.label}</div>
          </div>
        }
      >
        {renderMedico2()}
      </AppShell>
      {/* Chat flutuante */}
      {chatFlutAberto&&<div style={{position:"fixed",bottom:20,right:20,width:320,maxHeight:420,background:"#fff",borderRadius:16,boxShadow:"0 12px 40px rgba(0,0,0,.18)",zIndex:9998,display:"flex",flexDirection:"column",overflow:"hidden",border:"2px solid #1B365D"}}>
        <div style={{background:"linear-gradient(90deg,#0D1F3C,#1B365D)",color:"#fff",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong style={{fontSize:13}}>💬 Chat Equipe</strong><button onClick={()=>setChatFlutAberto(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:16}}>✕</button></div>
        <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:6,maxHeight:280}}>
          {(mensagens||[]).slice(0,8).map((m,i)=><div key={i} style={{background:m.de==="Médico"?"#EBF2FF":"#F5F7FA",borderRadius:10,padding:"6px 10px",fontSize:12}}><span style={{fontWeight:700,color:"#1B365D",fontSize:10}}>{m.de}→{m.para}</span><p style={{margin:"2px 0 0",color:"#374151"}}>{String(m.txt||"").substring(0,80)}</p></div>)}
        </div>
        <div style={{padding:"8px 10px",borderTop:"1px solid #EEF2F8",display:"flex",gap:6}}>
          <input id="chat_v4" placeholder="Mensagem..." style={{flex:1,border:"1.5px solid #DDE3EC",borderRadius:8,padding:"7px 10px",fontSize:12,fontFamily:"inherit",outline:"none"}} onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){addMsg("Médico","Todos",e.target.value.trim(),"msg");e.target.value="";}}}/>
          <button onClick={()=>{const inp=document.getElementById("chat_v4");if(inp?.value.trim()){addMsg("Médico","Todos",inp.value.trim(),"msg");inp.value="";}}} style={{background:"linear-gradient(135deg,#1B365D,#2756A0)",color:"#fff",border:"none",borderRadius:8,padding:"7px 12px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>→</button>
        </div>
      </div>}
    </>
    </React.Suspense>
  );
}







