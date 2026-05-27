// ─────────────────────────────────────────────────────────────────────────────
// StepperMedico.jsx — Fluxo guiado por tipo de consulta (F2)
//
// Etapa 0: Seleção de tipo de consulta → abre encounter F0
// Etapas 1+: Adaptativas por tipo (RETORNO_QT tem Validar APAC, INTERCORRENCIA tem Conduta, etc.)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from "react";
import UploadSimples from "../../components/UploadSimples";
import { SYSTEM_PROMPT_6BLOCOS, buildUserPrompt6Blocos, MAX_TOKENS_6BLOCOS } from "../../agents/prompts";
import { N, G, T, VE, VM, AM } from "../../utils/constants";
import { sc_, Btn, NOW } from "../../components/ui/primitives";
import { validarAPAC } from "../../utils/dossie";
import { resolverAPACCompleta } from "../../utils/apacDeterministico";
import { APACDossieChecklist, APACEntradaRapida } from "./APACDossieComps";
import { DocumentosPosEvolucao } from "./DossieBarComponents";
import ProntuarioDossieUnico from "./ProntuarioDossieUnico";
import EncounterHeader from "../../components/EncounterHeader";
import { useEncounter } from "../../contexts/EncounterContext";
import {
  getEtapas, getMaxStep, podeAvancar, TIPO_DEFAULT,
  ENCOUNTER_TIPOS, ENCOUNTER_TIPO_LABELS,
} from "../../utils/stepperConfig";

// ── Cards de tipo de consulta ─────────────────────────────────────────────────

const TIPO_CONFIG = {
  [ENCOUNTER_TIPOS.RETORNO_QT]: {
    icone:    '💊',
    descricao: 'Retorno de quimioterapia — ciclo, evolução e APAC QT',
    cor:       '#1B365D',
    bg:        '#EFF6FF',
    border:    '#1B365D',
  },
  [ENCOUNTER_TIPOS.RETORNO_CLINICO]: {
    icone:    '🩺',
    descricao: 'Consulta clínica de seguimento — evolução sem APAC QT',
    cor:       '#065F46',
    bg:        '#ECFDF5',
    border:    '#065F46',
  },
  [ENCOUNTER_TIPOS.PRIMEIRA_CONSULTA]: {
    icone:    '📋',
    descricao: 'Primeira consulta — anamnese completa e APAC inicial',
    cor:       '#7C3AED',
    bg:        '#F5F3FF',
    border:    '#7C3AED',
  },
  [ENCOUNTER_TIPOS.INTERCORRENCIA]: {
    icone:    '⚡',
    descricao: 'Intercorrência urgente — conduta rápida sem APAC',
    cor:       '#991B1B',
    bg:        '#FFF5F5',
    border:    '#991B1B',
  },
};

const ATENDIMENTO_ETAPAS = [
  { id: "entrada", label: "Entrada", sub: "Recepção" },
  { id: "evolucao", label: "Evolução", sub: "Médico" },
  { id: "prescricao", label: "Prescrição", sub: "QT do dia" },
  { id: "exames", label: "Exames", sub: "Solicitações" },
  { id: "apac", label: "APAC", sub: "Autorização SUS" },
];

const PROTOCOLOS_QT_BUSCA = [
  "Docetaxel",
  "FOLFOX",
  "CAPOX",
  "FOLFIRI",
  "Cisplatina + etoposídeo",
  "Cisplatina semanal",
  "Carboplatina + paclitaxel",
  "Carboplatina + pemetrexede",
  "Paclitaxel semanal",
  "Gemcitabina + cisplatina",
  "Doxorrubicina + ciclofosfamida",
  "Trastuzumabe",
  "Pembrolizumabe",
  "Osimertinibe",
].sort();

const EXAMES_CONTROLE_OPCOES = [
  { id:"tomografia", label:"Tomografia", sedes:["Crânio","Tórax","Abdome","Pelve","Pescoço","Face","Coluna"] },
  { id:"ressonancia", label:"Ressonância", sedes:["Crânio","Mama","Próstata","Pelve","Abdome","Coluna","Face/Pescoço"] },
  { id:"ultrassom", label:"Ultrassom", sedes:["Mama","Axilas","Abdome total","Pelve","Tireoide","Partes moles","Doppler venoso MMII"] },
  { id:"cintilografia", label:"Cintilografia", sedes:["Óssea","Miocárdica","Tireoide","Paratireoide"] },
  { id:"petct", label:"PET-CT", sedes:["Corpo inteiro","Crânio","Tórax","Abdome","Pelve"] },
  { id:"mamografia", label:"Mamografia/US mama", sedes:["Bilateral","Mama direita","Mama esquerda","Axila direita","Axila esquerda"] },
  { id:"laboratorio", label:"Laboratório", sedes:["Hemograma","Função renal","Função hepática","Eletrólitos","Marcadores tumorais"] },
  { id:"patologia", label:"Patologia/IHQ", sedes:["Anatomopatológico","Imunohistoquímica","Biomarcadores","Painel molecular"] },
];

const OBJETIVOS_SOLICITACAO_EXAME = [
  {
    id: "estadiamento",
    label: "Estadiamento",
    texto: "Solicito exame para estadiamento oncológico inicial/complementar.",
  },
  {
    id: "resposta",
    label: "Avaliação de resposta",
    texto: "Solicito exame para avaliação de resposta ao tratamento oncológico.",
  },
  {
    id: "seguimento",
    label: "Seguimento",
    texto: "Solicito exame para seguimento oncológico e comparação com exames prévios.",
  },
];

function montarTextoSolicitacaoExame({ pac = {}, tipo = "", sedes = [], objetivo = "estadiamento" }) {
  const obj = OBJETIVOS_SOLICITACAO_EXAME.find(o => o.id === objetivo) || OBJETIVOS_SOLICITACAO_EXAME[0];
  const diagnostico = pac?.diag || pac?.diagnostico || pac?.tipo_tumor || "neoplasia em acompanhamento";
  const cid = pac?.cid ? `CID-10: ${pac.cid}` : "CID-10: a confirmar";
  const estadiamento = [pac?.tnm, pac?.estadio].filter(Boolean).join(" - ") || "estadiamento: a confirmar";
  const subtipo = [pac?.subtipo, pac?.histologia, pac?.morfologia, pac?.bio].filter(Boolean).join(" - ");
  const exame = [tipo, sedes.length ? sedes.join(", ") : ""].filter(Boolean).join(" - ");
  return [
    obj.texto,
    exame ? `Exame solicitado: ${exame}.` : "",
    `Contexto clínico: ${diagnostico}. ${cid}. ${estadiamento}.`,
    subtipo ? `Subtipo/biomarcadores: ${subtipo}.` : "",
    "Favor descrever lesões mensuráveis, sítios de doença, comparação com exames prévios quando disponíveis e impressão objetiva para decisão oncológica.",
  ].filter(Boolean).join("\n");
}

function idadePaciente(nasc = "") {
  const s = String(nasc || "").trim();
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (!m) return "";
  const ano = Number(m[3].length === 2 ? "19" + m[3] : m[3]);
  const dt = new Date(ano, Number(m[2]) - 1, Number(m[1]));
  if (Number.isNaN(dt.getTime())) return "";
  const hoje = new Date();
  let idade = hoje.getFullYear() - dt.getFullYear();
  const dm = hoje.getMonth() - dt.getMonth();
  if (dm < 0 || (dm === 0 && hoje.getDate() < dt.getDate())) idade--;
  return idade > 0 && idade < 130 ? String(idade) : "";
}

function oncologiaLinha(pac = {}, dossie = {}) {
  const p = dossie?.paciente || {};
  const tumor = pac.diag || pac.diagnostico || p.diag || p.diagnostico || pac.tipo_tumor || "Tipo de tumor pendente";
  const tnm = pac.tnm || p.tnm || "";
  const estadio = pac.estadio || p.estadio || "";
  const subtipo = pac.subtipo || pac.histologia || pac.morfologia || p.subtipo || p.histologia || "";
  return [tumor, tnm, estadio && ("EC: " + estadio), subtipo].filter(Boolean).join(" · ");
}

function HeaderPacienteAtendimento({ pac, dossie, up }) {
  const [aberto, setAberto] = useState(false);
  const idade = pac?.idade || idadePaciente(pac?.nasc);
  const cidade = pac?.cidade || pac?.municipio || pac?.cidadeAtual || "";
  const campos = [
    {label:"Nome",         key:"nome",    val:pac?.nome},
    {label:"CPF",          key:"cpf",     val:pac?.cpf},
    {label:"CNS",          key:"cns",     val:pac?.cns},
    {label:"Nascimento",   key:"nasc",    val:pac?.nasc},
    {label:"Mãe",          key:"mae",     val:pac?.mae},
    {label:"Município",    key:"cidade",  val:pac?.cidade || pac?.municipio},
    {label:"Queixa",       key:"queixa",  val:pac?.queixa},
    {label:"Diagnóstico",  key:"diag",    val:pac?.diag},
    {label:"CID-10",       key:"cid",     val:pac?.cid},
    {label:"Estadiamento", key:"estadio", val:pac?.estadio || pac?.tnm},
    {label:"ECOG",         key:"ecog",    val:pac?.ecog},
    {label:"Alergias",     key:"alerg",   val:pac?.alerg},
  ];
  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 5,
      background: "#F3F6FA",
      border: "1px solid #D7E1EF",
      borderRadius: 12,
      padding: "10px 14px",
      marginBottom: 10,
      boxShadow: "0 4px 16px rgba(15,23,42,.06)",
    }}>
      <div style={{fontSize:10,fontWeight:950,color:"#64748B",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>
        Dados do paciente
      </div>
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        style={{
          width:"100%",
          display:"grid",
          gridTemplateColumns:"minmax(220px,1.6fr) 110px 150px minmax(160px,1fr) auto",
          gap:10,
          alignItems:"center",
          textAlign:"left",
          border:"1px solid #DDE3EC",
          borderLeft:"6px solid #2B7A8C",
          background:"#FFFFFF",
          borderRadius:12,
          padding:"10px 14px",
          cursor:"pointer",
          fontFamily:"inherit",
          boxShadow:"0 4px 14px rgba(15,23,42,.04)",
        }}
      >
        <div>
          <div style={{fontSize:9,fontWeight:950,color:"#64748B",textTransform:"uppercase",letterSpacing:1}}>Paciente</div>
          <div style={{fontSize:17,fontWeight:950,color:N,textTransform:"uppercase",lineHeight:1.15}}>{pac?.nome || "Paciente não selecionado"}</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:950,color:"#64748B",textTransform:"uppercase"}}>Idade</div>
          <div style={{fontSize:14,fontWeight:900,color:N}}>{idade ? idade + " anos" : "—"}</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:950,color:"#64748B",textTransform:"uppercase"}}>Nascimento</div>
          <div style={{fontSize:14,fontWeight:900,color:N}}>{pac?.nasc || "—"}</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:950,color:"#64748B",textTransform:"uppercase"}}>Residência</div>
          <div style={{fontSize:14,fontWeight:900,color:N,textTransform:"uppercase"}}>{cidade || "—"}</div>
        </div>
        <div style={{fontSize:12,fontWeight:950,color:"#2B7A8C",whiteSpace:"nowrap"}}>{aberto ? "Fechar" : "Ver dados"}</div>
      </button>
      {aberto && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
          {campos.map(({label,key,val}) => (
            <div key={label} style={{
              background:val?"#F8FAFC":"#FFF7E6",
              border:"1px solid "+(val?"#E2E8F0":"#B8860B44"),
              borderRadius:8,padding:"8px 12px",
            }}>
              <div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase",marginBottom:2}}>{label}</div>
              <input
                value={val||""}
                onChange={e=>up&&up(key,e.target.value)}
                placeholder="Clique para preencher"
                style={{width:"100%",border:"none",outline:"none",background:"transparent",fontSize:12,color:val?N:"#B8860B",fontWeight:val?800:600,fontFamily:"inherit",padding:0}}
              />
            </div>
          ))}
        </div>
      )}
      <div style={{marginTop:8,fontSize:14,fontWeight:950,color:N,textTransform:"uppercase",letterSpacing:.2,lineHeight:1.25}}>
        {oncologiaLinha(pac, dossie)}
      </div>
    </div>
  );
}

export default function StepperMedico({
  pac, dossie, setDossie, up, addMsg,
  onSalvarEvolucao, onAbrirAPAC, onLimpar,
}) {
  const { encounter, openEncounterSession, isOpen } = useEncounter();

  const tipoInicial = encounter?.tipo || TIPO_DEFAULT;
  const [tipo, setTipo] = useState(tipoInicial);
  const [step, setStep] = useState(0);
  const maxStep = ATENDIMENTO_ETAPAS.length - 1;

  const apac = useMemo(() => validarAPAC(dossie || {}), [
    dossie?.paciente?.cid,
    dossie?.paciente?.diag,
    dossie?.paciente?.cns,
    dossie?.paciente?.nome,
    dossie?.documentos?.length,
    dossie?.evolucao?.textoFinal,
  ]);

  const resolucao = useMemo(
    () => apac.resolucao || resolverAPACCompleta(dossie?.paciente || pac || {}, dossie || {}),
    [apac, dossie, pac]
  );

  const temPaciente = !!(pac?.pacID || pac?.cpf || pac?.cns);
  const temEncounter = isOpen;

  const handleSelectTipo = (novoTipo) => {
    setTipo(novoTipo);
    if (temPaciente && !isOpen) {
      const patId = pac?.pacID || pac?.cpf || pac?.cns;
      openEncounterSession(String(patId), novoTipo);
    }
  };

  const abrirProntuarioDoTipo = (tipoEscolhido = tipo) => {
    const escolhido = typeof tipoEscolhido === "string" ? tipoEscolhido : tipo;
    handleSelectTipo(escolhido);
    setStep(1);
  };

  const concluido = useMemo(() => {
    const done = ["entrada"];
    if (dossie?.evolucao?.textoFinal || dossie?.evolucao?.rascunho) done.push("evolucao");
    if ((dossie?.documentos || []).length > 0 || (dossie?.documentosGerados || []).length > 0) done.push("exames");
    if (pac?.trat || dossie?.prescricao?.protocolo || dossie?.prescricao?.salvaEm) done.push("prescricao");
    if (dossie?.apac?.salvaEm || dossie?.apac?.campos || resolucao?.scoreAntiGlosa >= 80) done.push("apac");
    return done;
  }, [dossie, pac?.trat, resolucao?.scoreAntiGlosa]);

  const avancar = () => {
    setStep(s => Math.min(s + 1, maxStep));
  };

  const voltar = () => setStep(s => Math.max(s - 1, 0));

  const finalizar = () => {
    if (step < maxStep) {
      setStep(maxStep);
      return;
    }
    if (onLimpar && window.confirm("Finalizar atendimento e abrir novo atendimento limpo?")) {
      onLimpar();
    }
  };

  const renderEtapa = () => {
    const id = ATENDIMENTO_ETAPAS[step]?.id;

    switch (id) {
      case "entrada":
        return (
          <EtapaEntradaAtendimento
            pac={pac}
            tipo={tipo}
            onSelectTipo={handleSelectTipo}
            onOpenSelected={abrirProntuarioDoTipo}
            up={up}
            addMsg={addMsg}
            dossie={dossie}
            setDossie={setDossie}
          />
        );

      case "evolucao":
        return (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              background: "#FFFFFF",
              border: "1px solid #D7E1EF",
              borderRadius: 12,
              padding: 10,
            }}>
              {[
                {label:"Dados clinicos",    id:"pron-dados-clinicos"},
                {label:"Dados oncologicos", id:"pron-dados-oncologicos"},
                {label:"Exame clinico",     id:"pron-exame-fisico"},
                {label:"Labs",              id:"pron-labs"},
                {label:"Conduta",           id:"pron-conduta"},
              ].map(({label, id}, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  style={{
                    background: i < 2 ? "#EFF6FF" : i === 2 ? "#EAF2FF" : i === 3 ? "#ECFDF5" : "#F8FAFC",
                    border: "1px solid #D7E1EF",
                    borderRadius: 999,
                    padding: "7px 12px",
                    fontSize: 12,
                    fontWeight: 950,
                    color: N,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <ProntuarioDossieUnico
              pac={pac}
              dossie={dossie}
              setDossie={setDossie}
              up={up}
              addMsg={addMsg}
              onSalvarEvolucao={onSalvarEvolucao}
              onAbrirAPAC={() => setStep(4)}
              actionsInStepper
            />
          </div>
        );

      case "exames":
        return (
          <EtapaExamesAtendimento
            pac={pac}
            dossie={dossie}
            setDossie={setDossie}
            addMsg={addMsg}
          />
        );

      case "prescricao":
        return <EtapaPrescricaoAtendimento pac={pac} up={up} addMsg={addMsg} />;

      case "apac":
        return (
          <div style={{ display: "grid", gap: 14 }}>
            <APACDossieChecklist dossie={dossie} setDossie={setDossie} />
            {resolucao?.inferidos?.length > 0 && (
              <div style={{
                background: "#FFFBEB",
                border: "1px solid " + AM + "55",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12,
                color: AM,
                fontWeight: 800,
              }}>
                Campos inferidos por IA: {resolucao.inferidos.join(" · ")}
              </div>
            )}
            {resolucao?.inconsistencias?.length > 0 && (
              <div style={{
                background: "#F5F3FF",
                border: "1px solid #7C3AED55",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12,
                color: "#6D28D9",
                fontWeight: 800,
              }}>
                Inconsistencias para revisar: {resolucao.inconsistencias.join(" · ")}
              </div>
            )}
            <APACEntradaRapida pac={pac} up={up} dossie={dossie} setDossie={setDossie} addMsg={addMsg} />
            <div style={sc_.card({ padding: 14, border: "1px solid #D7E1EF" })}>
              <div style={{ fontSize: 12, fontWeight: 950, color: N, textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>
                Envio financeiro
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>
                Revise pendencias e finalize somente apos conferencia medica.
              </div>
              <Btn v="gold" ch="Concluir e enviar financeiro" s={{ padding: "11px 16px", fontSize: 13 }} onClick={onAbrirAPAC} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "grid", gap: 0 }}>
      <HeaderPacienteAtendimento pac={pac} dossie={dossie} up={up} />

      <AtendimentoTimelineBar
        step={step}
        onStep={setStep}
        concluido={concluido}
        onFinalizar={finalizar}
      />

      {!temPaciente && step > 0 && (
        <div style={{
          background: "#FEF2F2",
          border: "1px solid " + VM + "55",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 12,
          fontSize: 12,
          color: VM,
          fontWeight: 800,
        }}>
          Selecione um paciente para continuar esta etapa.
        </div>
      )}

      {!temEncounter && step > 1 && (
        <div style={{
          background: "#FFF7E6",
          border: "1px solid " + AM + "55",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 12,
          fontSize: 12,
          color: AM,
          fontWeight: 800,
        }}>
          Atendimento nao iniciado. Volte em Entrada e selecione o tipo de consulta para abrir o atendimento.
        </div>
      )}

      <div style={{ minHeight: 320 }}>
        {renderEtapa()}
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        paddingTop: 12,
        borderTop: "1px solid #E2E8F0",
      }}>
        <Btn
          v="ghost"
          ch="← Voltar"
          s={{ padding: "9px 18px", fontSize: 12, visibility: step === 0 ? "hidden" : "visible" }}
          onClick={voltar}
        />
        <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 800 }}>
          {step + 1} / {ATENDIMENTO_ETAPAS.length} — {ATENDIMENTO_ETAPAS[step]?.label}
        </div>
        {step < maxStep ? (
          <Btn
            v="navy"
            ch="Proximo →"
            s={{ padding: "9px 18px", fontSize: 12 }}
            dis={step === 0 && !temPaciente}
            onClick={avancar}
          />
        ) : (
          <Btn
            v="green"
            ch="Finalizar atendimento"
            s={{ padding: "9px 18px", fontSize: 12 }}
            onClick={finalizar}
          />
        )}
      </div>
    </div>
  );
}

function AtendimentoTimelineBar({ step, onStep, concluido, onFinalizar }) {
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"1fr 220px",
      gap:18,
      background:"#283B63",
      color:"#fff",
      borderRadius:0,
      padding:"16px 20px",
      marginBottom:12,
      minHeight:120,
      alignItems:"stretch",
      overflowX:"auto",
    }}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(150px,1fr))",gap:0,minWidth:780}}>
        {ATENDIMENTO_ETAPAS.map((etapa,i)=>{
          const ativo=i===step;
          const done=i<step || concluido?.includes(etapa.id);
          return (
            <button
              key={etapa.id}
              type="button"
              onClick={()=>onStep(i)}
              style={{
                position:"relative",
                display:"grid",
                gridTemplateColumns:"54px 1fr",
                gap:12,
                alignItems:"start",
                textAlign:"left",
                border:"none",
                borderLeft:ativo?"4px solid "+G:"1px solid transparent",
                background:ativo?"rgba(255,255,255,.10)":"transparent",
                color:"#fff",
                padding:"10px 14px",
                cursor:"pointer",
                fontFamily:"inherit",
                minHeight:96,
              }}
            >
              <span style={{
                width:38,height:38,borderRadius:"50%",
                display:"grid",placeItems:"center",
                background:done?T:ativo?G:"transparent",
                border:done||ativo?"none":"2px solid rgba(255,255,255,.35)",
                color:done||ativo?"#fff":"#E2E8F0",
                fontSize:17,fontWeight:950,
              }}>{done?"✓":i}</span>
              <span>
                <span style={{display:"block",fontSize:16,fontWeight:950,lineHeight:1.1}}>{etapa.label}</span>
                <span style={{display:"block",fontSize:13,color:"rgba(255,255,255,.62)",fontWeight:800,marginTop:6,lineHeight:1.35}}>{etapa.sub}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div style={{display:"grid",gap:10,alignContent:"center"}}>
        <button
          type="button"
          onClick={onFinalizar}
          style={{
            border:"none",
            borderRadius:8,
            background:step===ATENDIMENTO_ETAPAS.length-1?"#F0C44A":"rgba(255,255,255,.16)",
            color:step===ATENDIMENTO_ETAPAS.length-1?N:"rgba(255,255,255,.65)",
            padding:"16px 12px",
            fontSize:15,
            fontWeight:950,
            letterSpacing:.7,
            cursor:"pointer",
            fontFamily:"inherit",
            textTransform:"uppercase",
          }}
        >
          Finalizar atendimento
        </button>
        <div style={{fontSize:12,color:"rgba(255,255,255,.58)",fontWeight:750,textAlign:"center",lineHeight:1.35}}>
          Complete as etapas antes de finalizar
        </div>
      </div>
    </div>
  );
}

// ── Etapa 0 — Seleção de tipo de consulta ────────────────────────────────────

function EtapaTipo({ tipo, onSelectTipo, onOpenSelected, pac }) {
  const cfgAtual = TIPO_CONFIG[tipo] || TIPO_CONFIG[TIPO_DEFAULT];
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
        Selecione o tipo de consulta para {pac?.nome ? <strong>{pac.nome}</strong> : "o paciente"}:
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {Object.entries(TIPO_CONFIG).map(([t, cfg]) => {
          const selecionado = tipo === t;
          return (
            <button
              key={t}
              onClick={() => onSelectTipo(t)}
              onDoubleClick={() => { onSelectTipo(t); onOpenSelected && onOpenSelected(t); }}
              style={{
                display:       "flex",
                flexDirection: "column",
                alignItems:    "flex-start",
                gap:           6,
                padding:       "14px 16px",
                border:        `2px solid ${selecionado ? cfg.border : "#E2E8F0"}`,
                borderRadius:  12,
                background:    selecionado ? cfg.bg : "#FAFAFA",
                cursor:        "pointer",
                textAlign:     "left",
                transition:    "all .15s",
                boxShadow:     selecionado ? `0 2px 8px ${cfg.border}33` : "none",
              }}
            >
              <div style={{ fontSize: 24 }}>{cfg.icone}</div>
              <div style={{
                fontSize:   13,
                fontWeight: 900,
                color:      selecionado ? cfg.cor : "#1E293B",
              }}>
                {ENCOUNTER_TIPO_LABELS[t]}
              </div>
              <div style={{
                fontSize:  11,
                color:     selecionado ? cfg.cor : "#64748B",
                lineHeight: 1.4,
              }}>
                {cfg.descricao}
              </div>
              {selecionado && (
                <div style={{
                  marginTop:  4,
                  fontSize:   10,
                  fontWeight: 900,
                  color:      cfg.cor,
                  background: cfg.border + "22",
                  borderRadius: 8,
                  padding:    "3px 8px",
                }}>
                  ✓ Selecionado
                </div>
              )}
            </button>
          );
        })}
      </div>
      {!pac?.pacID && !pac?.cpf && !pac?.cns && (
        <div style={{
          background: "#FEF2F2", border: "1px solid " + VM + "55",
          borderRadius: 8, padding: "10px 14px",
          fontSize: 12, color: VM, fontWeight: 700,
        }}>
          ⚠️ Nenhum paciente ativo. Selecione um paciente antes de iniciar o atendimento.
        </div>
      )}
      {(pac?.pacID || pac?.cpf || pac?.cns) && (
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,
          background:cfgAtual.bg,border:"1px solid "+cfgAtual.border+"55",
          borderRadius:12,padding:"10px 12px",
        }}>
          <div style={{fontSize:12,color:cfgAtual.cor,fontWeight:900}}>
            Atalho: abrir direto como {ENCOUNTER_TIPO_LABELS[tipo]}
          </div>
          <button
            type="button"
            onClick={onOpenSelected}
            style={{
              border:"none",background:cfgAtual.cor,color:"#fff",borderRadius:10,
              padding:"8px 14px",fontSize:12,fontWeight:900,cursor:"pointer",
              fontFamily:"inherit",whiteSpace:"nowrap",
            }}
          >
            Abrir prontuário →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Etapa Paciente ────────────────────────────────────────────────────────────

function calcularIdadePaciente(nasc = "") {
  const s = String(nasc || "").trim();
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (!m) return "";
  const ano = Number(m[3].length === 2 ? "19" + m[3] : m[3]);
  const dt = new Date(ano, Number(m[2]) - 1, Number(m[1]));
  if (Number.isNaN(dt.getTime())) return "";
  const hoje = new Date();
  let idade = hoje.getFullYear() - dt.getFullYear();
  const diffMes = hoje.getMonth() - dt.getMonth();
  if (diffMes < 0 || (diffMes === 0 && hoje.getDate() < dt.getDate())) idade--;
  return idade > 0 && idade < 130 ? String(idade) : "";
}

function EtapaPaciente({ pac, up }) {
  const [aberto, setAberto] = useState(false);
  const campos = [
    {label:"Nome",         key:"nome",    val:pac?.nome},
    {label:"CPF",          key:"cpf",     val:pac?.cpf},
    {label:"CNS",          key:"cns",     val:pac?.cns},
    {label:"Nascimento",   key:"nasc",    val:pac?.nasc},
    {label:"Mãe",          key:"mae",     val:pac?.mae},
    {label:"Município",    key:"cidade",  val:pac?.cidade || pac?.municipio},
    {label:"Queixa",       key:"queixa",  val:pac?.queixa},
    {label:"Diagnóstico",  key:"diag",    val:pac?.diag},
    {label:"CID-10",       key:"cid",     val:pac?.cid},
    {label:"Estadiamento", key:"estadio", val:pac?.estadio || pac?.tnm},
    {label:"ECOG",         key:"ecog",    val:pac?.ecog},
    {label:"Alergias",     key:"alerg",   val:pac?.alerg},
  ];
  const temPaciente = !!(pac?.pacID || pac?.cpf || pac?.cns);
  const idade = pac?.idade || calcularIdadePaciente(pac?.nasc);
  const cidade = pac?.cidade || pac?.municipio || pac?.naturalidade || "";
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {!temPaciente && (
        <div style={{
          background: "#FEF2F2", border: "1px solid " + VM + "55",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          fontSize: 13, color: VM, fontWeight: 800,
        }}>
          ⚠️ Nenhum paciente ativo. Selecione um paciente na barra de atendimentos para continuar.
        </div>
      )}
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "minmax(220px, 1.6fr) 110px 150px minmax(160px, 1fr) auto",
          gap: 10,
          alignItems: "center",
          textAlign: "left",
          border: "1px solid #DDE3EC",
          borderLeft: "6px solid " + G,
          background: "#FFFFFF",
          borderRadius: 12,
          padding: "10px 14px",
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 4px 14px rgba(15,23,42,.04)",
        }}
      >
        <div>
          <div style={{ fontSize: 9, fontWeight: 950, color: "#64748B", textTransform: "uppercase", letterSpacing: 1 }}>Paciente</div>
          <div style={{ fontSize: 17, fontWeight: 950, color: N, textTransform: "uppercase", lineHeight: 1.15 }}>{pac?.nome || "Paciente não selecionado"}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 950, color: "#64748B", textTransform: "uppercase" }}>Idade</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: N }}>{idade ? idade + " anos" : "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 950, color: "#64748B", textTransform: "uppercase" }}>Nascimento</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: N }}>{pac?.nasc || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 950, color: "#64748B", textTransform: "uppercase" }}>Residência</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: N, textTransform: "uppercase" }}>{cidade || "—"}</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 950, color: G, whiteSpace: "nowrap" }}>{aberto ? "Fechar dados" : "Ver dados"}</div>
      </button>

      {aberto && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {campos.map(({label, key, val}) => (
          <div key={label} style={{
            background: val ? "#F8FAFC" : "#FFF7E6",
            border: "1px solid " + (val ? "#E2E8F0" : AM + "44"),
            borderRadius: 8, padding: "8px 12px",
          }}>
            <div style={{ fontSize: 9, color: "#64748B", fontWeight: 900, textTransform: "uppercase", marginBottom: 2 }}>
              {label}
            </div>
            <input
              value={val || ""}
              onChange={e=>up&&up(key,e.target.value)}
              placeholder="Clique para preencher"
              style={{
                width:"100%",border:"none",outline:"none",background:"transparent",
                fontSize:12,color:val?N:AM,fontWeight:val?800:600,
                fontFamily:"inherit",padding:0,
              }}
            />
          </div>
        ))}
      </div>}
    </div>
  );
}

function EtapaEntradaAtendimento({ pac, tipo, onSelectTipo, onOpenSelected, up, addMsg, dossie, setDossie }) {
  const [analisando, setAnalisando] = useState(false);
  const [erroIA, setErroIA] = useState("");

  const analisarEntrada = async (formData, { arquivos = [], textoLivre = "" } = {}) => {
    setAnalisando(true);
    setErroIA("");
    try {
      const apiKey = localStorage.getItem("anthropic_key") || "";
      if (!apiKey) { setErroIA("API Key não configurada. Configure em Configurações."); return; }

      const filesBase64 = [];
      for (const file of arquivos) {
        const mimeType = file.type || (/\.pdf$/i.test(file.name) ? "application/pdf" : "application/octet-stream");
        if (["application/pdf","image/jpeg","image/png","image/webp"].includes(mimeType)) {
          const b64 = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(String(r.result || "").split(",")[1] || "");
            r.onerror = rej;
            r.readAsDataURL(file);
          });
          filesBase64.push({ name: file.name, mimeType, base64: b64 });
        }
      }

      const userPrompt = buildUserPrompt6Blocos(textoLivre, {
        nome: pac?.nome, nasc: pac?.nasc, diag: pac?.diag, cid: pac?.cid,
        estadio: pac?.estadio, trat: pac?.trat, bio: pac?.bio, ecog: pac?.ecog,
      }, arquivos.map(f => f.name));

      const content = filesBase64.map(f =>
        f.mimeType === "application/pdf"
          ? { type: "document", source: { type: "base64", media_type: f.mimeType, data: f.base64 } }
          : { type: "image", source: { type: "base64", media_type: f.mimeType, data: f.base64 } }
      );
      content.push({ type: "text", text: userPrompt });

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: MAX_TOKENS_6BLOCOS,
          system: SYSTEM_PROMPT_6BLOCOS,
          messages: [{ role: "user", content }],
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error?.message || ("Erro Claude " + r.status));

      const resumo = data.content?.[0]?.text || "";
      if (!resumo.trim()) throw new Error("Claude não retornou resumo.");

      // 1. Salva no pac (para exibição local na entrada)
      up && up("docs_ia_resumo", resumo);
      up && up("resumo_recepcao", resumo);

      // 2. Integra como documento no dossie → a evolução o enxerga imediatamente
      if (setDossie) {
        const nomeArqs = arquivos.length ? arquivos.map(f => f.name).join(", ") : "Prontuário 6 blocos";
        const novoDoc = {
          id: "IAE-" + Date.now(),
          tipo: "Prontuário IA — Entrada",
          nome: nomeArqs,
          resumo,
          origem: "ia_entrada",
          criadoEm: NOW(),
        };
        setDossie(prev => {
          const base = prev || { paciente: pac, documentos: [], evolucao: {}, resumoClaude: "" };
          return {
            ...base,
            paciente: { ...(base.paciente || {}), ...pac },
            documentos: [novoDoc, ...(base.documentos || [])],
            resumoClaude: resumo,
            status: "pronto_medico",
            updatedAt: NOW(),
          };
        });
      }

      addMsg && addMsg("IA Entrada", "Médico", "Prontuário 6 blocos gerado e integrado à evolução.", "msg");
    } catch (e) {
      setErroIA(e.message || "Erro ao analisar documentos.");
    } finally {
      setAnalisando(false);
    }
  };

  return (
    <div style={{display:"grid",gap:14}}>
      <section style={{background:"#fff",border:"1px solid #D7E1EF",borderRadius:12,padding:14}}>
        <div style={{fontSize:12,fontWeight:950,color:"#1B365D",textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>
          Entrada — recepção e tipo de atendimento
        </div>
        <EtapaTipo tipo={tipo} onSelectTipo={onSelectTipo} onOpenSelected={onOpenSelected} pac={pac}/>
      </section>

      <section style={{background:"#fff",border:"1px solid #D7E1EF",borderRadius:12,padding:14}}>
        <div style={{fontSize:12,fontWeight:950,color:"#1B365D",textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>
          Assistente IA — documentos e laudos
        </div>
        <div style={{fontSize:12,color:"#64748B",marginBottom:10,lineHeight:1.45}}>
          Envie PDFs de laudos ou cole o resumo enviado pela recepção. O prontuário 6 blocos será gerado antes da consulta.
        </div>
        {erroIA && (
          <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#991B1B",fontWeight:800,marginBottom:10}}>
            {erroIA}
          </div>
        )}
        {analisando && (
          <div style={{background:"#EFF6FF",border:"1px solid #93C5FD",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#1D4ED8",fontWeight:800,marginBottom:10}}>
            ⏳ Gerando prontuário 6 blocos…
          </div>
        )}
        <UploadSimples
          pacienteId={pac?.pacID || pac?.cpf || ""}
          onAnalisar={analisarEntrada}
          titulo="Laudos, documentos ou texto clínico"
        />
        {(pac?.docs_ia_resumo || pac?.resumo_recepcao) && (
          <details style={{marginTop:12}}>
            <summary style={{fontSize:12,fontWeight:900,color:"#2B7A8C",cursor:"pointer"}}>
              ✅ Prontuário IA gerado — clique para visualizar
            </summary>
            <pre style={{
              marginTop:8,
              background:"#F8FAFC",
              border:"1px solid #E2E8F0",
              borderRadius:8,
              padding:"10px 12px",
              fontSize:11,
              color:"#1E293B",
              whiteSpace:"pre-wrap",
              fontFamily:"Segoe UI, Arial, sans-serif",
              lineHeight:1.55,
              maxHeight:320,
              overflowY:"auto",
            }}>
              {pac.docs_ia_resumo || pac.resumo_recepcao}
            </pre>
          </details>
        )}
      </section>
    </div>
  );
}

function EtapaExamesAtendimento({ pac, dossie, setDossie, addMsg }) {
  const [tipoExame, setTipoExame] = useState(EXAMES_CONTROLE_OPCOES[0]?.id || "");
  const [sedes, setSedes] = useState([]);
  const [objetivoExame, setObjetivoExame] = useState("estadiamento");
  const [resumo, setResumo] = useState("");
  const tipoAtual = EXAMES_CONTROLE_OPCOES.find(e => e.id === tipoExame) || EXAMES_CONTROLE_OPCOES[0];
  const contextoSolicitacao = {
    ...((dossie || {}).paciente || {}),
    ...((dossie || {}).dadosOncologicos || {}),
    ...(dossie || {}),
    ...(pac || {}),
  };
  const textoSolicitacao = montarTextoSolicitacaoExame({
    pac: contextoSolicitacao,
    tipo: tipoAtual?.label || "",
    sedes,
    objetivo: objetivoExame,
  });
  const textoFinalSolicitacao = resumo.trim() || textoSolicitacao;

  const toggleSede = (sede) => {
    setSedes(prev => prev.includes(sede) ? prev.filter(s => s !== sede) : [...prev, sede]);
  };

  const incluirExame = () => {
    if (!tipoAtual) return;
    const nome = [tipoAtual.label, sedes.join(", ")].filter(Boolean).join(" - ");
    const novo = {
      id: `exame-${Date.now()}`,
      data: new Date().toISOString(),
      tipo: nome,
      nome,
      resumo: textoFinalSolicitacao,
      fonte: "Médico",
      origem: "solicitacao_exame",
      categoria: tipoAtual.id,
      sedes,
      objetivo: objetivoExame,
    };
    setDossie && setDossie(prev => ({
      ...(prev || {}),
      documentos: [...((prev || {}).documentos || []), novo],
      atualizadoEm: NOW(),
    }));
    addMsg && addMsg("Exames", "Médico", `Exame solicitado: ${nome}`, "msg");
    setResumo("");
    setSedes([]);
    setObjetivoExame("estadiamento");
  };

  return (
    <div style={{display:"grid",gap:14}}>
      <section style={sc_.card({padding:14,border:"1px solid #D7E1EF"})}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:10}}>
          <div>
            <div style={{fontSize:12,fontWeight:950,color:N,textTransform:"uppercase",letterSpacing:.8}}>Exames</div>
            <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Solicite exames com contexto oncológico automático para radiologia. A descrição de laudos permanece no retorno clínico.</div>
          </div>
          <span style={{background:"#EAF7FA",color:T,border:"1px solid #B9D9E2",borderRadius:999,padding:"5px 10px",fontSize:11,fontWeight:900}}>
            Solicitação ao radiologista
          </span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:12,alignItems:"start"}}>
          <div style={{display:"grid",gap:8}}>
            <label style={{fontSize:10,fontWeight:950,color:"#64748B",textTransform:"uppercase",letterSpacing:.8}}>Tipo de exame</label>
            <select
              value={tipoExame}
              onChange={e => { setTipoExame(e.target.value); setSedes([]); setResumo(""); }}
              style={{...sc_.inp,width:"100%",fontSize:13,fontWeight:900,color:N}}
            >
              {EXAMES_CONTROLE_OPCOES.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
            <div style={{fontSize:11,color:"#64748B",lineHeight:1.45}}>
              O kit de documentos oncológicos fica apenas na aba Documentos. Aqui ficam solicitações de exames com diagnóstico e estadiamento do caso.
            </div>
          </div>

          <div style={{display:"grid",gap:10}}>
            <div>
              <div style={{fontSize:10,fontWeight:950,color:"#64748B",textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>Objetivo da solicitação</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {OBJETIVOS_SOLICITACAO_EXAME.map(obj => {
                  const ativo = objetivoExame === obj.id;
                  return (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => { setObjetivoExame(obj.id); setResumo(""); }}
                      style={{
                        border:"1px solid " + (ativo ? G : "#CBD5E1"),
                        background: ativo ? "#E8F7EE" : "#FFFFFF",
                        color: ativo ? G : N,
                        borderRadius:999,
                        padding:"8px 12px",
                        fontSize:12,
                        fontWeight:950,
                        cursor:"pointer",
                        fontFamily:"inherit",
                      }}
                    >
                      {obj.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:950,color:"#64748B",textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>Sede anatômica</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {(tipoAtual?.sedes || []).map(sede => {
                  const ativo = sedes.includes(sede);
                  return (
                    <button
                      key={sede}
                      type="button"
                      onClick={() => toggleSede(sede)}
                      style={{
                        border:"1px solid " + (ativo ? T : "#CBD5E1"),
                        background: ativo ? "#EAF7FA" : "#FFFFFF",
                        color: ativo ? T : N,
                        borderRadius:999,
                        padding:"7px 10px",
                        fontSize:12,
                        fontWeight:900,
                        cursor:"pointer",
                        fontFamily:"inherit",
                      }}
                    >
                      {ativo ? "✓ " : ""}{sede}
                    </button>
                  );
                })}
              </div>
            </div>
            <textarea
              value={resumo || textoSolicitacao}
              onChange={e => setResumo(e.target.value)}
              style={{...sc_.inp,width:"100%",minHeight:150,resize:"vertical",fontSize:13,lineHeight:1.5}}
              placeholder="Texto da solicitação ao radiologista..."
            />
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <button type="button" onClick={() => setResumo("")} style={{border:"1px solid #CBD5E1",background:"#fff",color:N,borderRadius:9,padding:"8px 11px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>
                Regerar texto do caso
              </button>
              <button type="button" onClick={incluirExame} style={{marginLeft:"auto",border:"none",background:T,color:"#fff",borderRadius:10,padding:"9px 16px",fontSize:12,fontWeight:950,cursor:"pointer",fontFamily:"inherit"}}>
                Incluir solicitação
              </button>
            </div>
          </div>
        </div>
      </section>
      <section style={sc_.card({padding:14,border:"1px solid #D7E1EF"})}>
        <div style={{fontSize:12,fontWeight:950,color:N,textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>
          Documentos e laudos vinculados
        </div>
        <DocumentosPosEvolucao dossie={dossie} setDossie={setDossie} addMsg={addMsg}/>
      </section>
    </div>
  );
}

function EtapaPrescricaoAtendimento({ pac, up, addMsg }) {
  const [busca,setBusca]=useState("");
  const [protocolo,setProtocolo]=useState(pac?.trat || "");
  const encontrados=PROTOCOLOS_QT_BUSCA.filter(p=>p.toLowerCase().includes(busca.toLowerCase())).slice(0,8);
  const confirmar=()=>{
    if(!protocolo.trim()){alert("Selecione ou digite um protocolo.");return;}
    up&&up("trat",protocolo);
    addMsg&&addMsg("Prescrição","Médico","Protocolo selecionado para prescrição: "+protocolo,"msg");
  };
  return (
    <div style={{display:"grid",gap:14}}>
      <section style={sc_.card({padding:14,border:"1px solid #D7E1EF"})}>
        <div style={{fontSize:12,fontWeight:950,color:N,textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>
          Prescrição — quimioterapia
        </div>
        <div style={{fontSize:12,color:"#64748B",lineHeight:1.45,marginBottom:10}}>
          Digite iniciais do quimioterápico ou protocolo. A prescrição completa continua sendo validada na aba própria, mas esta etapa registra a escolha do dia.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"minmax(180px,280px) 1fr auto",gap:10,alignItems:"center"}}>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Ex.: cis, doce, folfox" style={{...sc_.inp,width:"100%",fontSize:13,fontWeight:850}}/>
          <input value={protocolo} onChange={e=>setProtocolo(e.target.value)} placeholder="Protocolo QT escolhido pelo médico" style={{...sc_.inp,width:"100%",fontSize:13,fontWeight:850}}/>
          <Btn v="green" ch="Concluir" s={{padding:"10px 16px",fontSize:12}} onClick={confirmar}/>
        </div>
        {busca&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:8,marginTop:10}}>
          {encontrados.map(p=><button key={p} type="button" onClick={()=>setProtocolo(p)} style={{border:"1px solid #CBD5E1",background:"#fff",borderRadius:9,padding:"9px 11px",fontSize:12,fontWeight:900,color:N,textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>{p}</button>)}
          {encontrados.length===0&&<div style={{fontSize:12,color:"#64748B",fontWeight:800}}>Nenhum protocolo local encontrado. Digite manualmente.</div>}
        </div>}
      </section>
      <section style={sc_.card({padding:14,border:"1px solid #D7E1EF"})}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[
            ["Doses","Serão carregadas após protocolo"],
            ["Pré-medicação","Conferir na prescrição"],
            ["Ciclos","Definir número liberado"],
            ["Ajustes","Peso · Altura · Redução"],
          ].map(([t,v])=><div key={t} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:"10px 12px"}}>
            <div style={{fontSize:10,fontWeight:950,color:"#64748B",textTransform:"uppercase"}}>{t}</div>
            <div style={{fontSize:13,fontWeight:900,color:N,marginTop:4}}>{v}</div>
          </div>)}
        </div>
      </section>
    </div>
  );
}

// ── Etapa Conduta Urgente (INTERCORRENCIA) ────────────────────────────────────

function EtapaConduta({ pac, dossie, addMsg }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{
        background: "#FFF5F5", border: "1px solid #FCA5A5",
        borderRadius: 10, padding: "12px 16px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#991B1B", marginBottom: 6 }}>
          ⚡ Intercorrência — Conduta urgente
        </div>
        <div style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.6 }}>
          Paciente: <strong>{pac?.nome || "—"}</strong><br />
          Diagnóstico: {pac?.diag || "—"} · CID: {pac?.cid || "—"}<br />
          Protocolo: {pac?.trat || "—"} · ECOG: {pac?.ecog || "—"}
        </div>
      </div>
      <DocumentosPosEvolucao dossie={dossie} addMsg={addMsg} />
    </div>
  );
}

// ── Etapa Concluir ────────────────────────────────────────────────────────────

function EtapaConcluir({ pac, dossie, apac, resolucao, onSalvarEvolucao, onAbrirAPAC, onNovo }) {
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(!!dossie?.evolucao?.textoFinal);

  const docsGerados   = dossie?.documentosGerados || [];
  const evolucaoFinal = dossie?.evolucao?.textoFinal || dossie?.evolucao?.rascunho || "";

  const handleSalvar = async () => {
    if (!evolucaoFinal.trim()) { alert("Escreva a evolução antes de salvar."); return; }
    setSalvando(true);
    const ok = onSalvarEvolucao && await onSalvarEvolucao(evolucaoFinal);
    setSalvando(false);
    if (ok !== false) setSalvo(true);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Resumo */}
      <div style={sc_.card({ border: "2px solid " + VE + "55" })}>
        <div style={{ fontSize: 13, fontWeight: 900, color: N, marginBottom: 10 }}>
          Resumo do atendimento — {pac?.nome || "Paciente"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          <div style={{ background: "#EAF7EE", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: "#64748B", fontWeight: 900, textTransform: "uppercase" }}>Score APAC</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: resolucao?.scoreAntiGlosa >= 80 ? VE : resolucao?.scoreAntiGlosa >= 50 ? AM : VM }}>
              {resolucao?.scoreAntiGlosa ?? "—"}/100
            </div>
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: "#64748B", fontWeight: 900, textTransform: "uppercase" }}>Documentos</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: N }}>{dossie?.documentos?.length || 0}</div>
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: "#64748B", fontWeight: 900, textTransform: "uppercase" }}>Docs gerados</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: N }}>{docsGerados.length}</div>
          </div>
        </div>
        {resolucao?.pendencias?.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: VM, fontWeight: 800 }}>
            Pendências APAC: {resolucao.pendencias.join(" · ")}
          </div>
        )}
        {resolucao?.inconsistencias?.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#7C3AED", fontWeight: 800 }}>
            Inconsistências: {resolucao.inconsistencias.join(" · ")}
          </div>
        )}
      </div>

      {/* Evolução */}
      <div style={sc_.card()}>
        <div style={{ fontSize: 12, fontWeight: 900, color: N, marginBottom: 8 }}>
          Evolução médica {salvo ? "✅ Salva" : "(rascunho)"}
        </div>
        <textarea
          readOnly
          value={evolucaoFinal}
          rows={6}
          style={{ ...sc_.inp, width: "100%", resize: "vertical", fontFamily: "Georgia, serif", fontSize: 12, lineHeight: 1.7 }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn
            v={salvo ? "ghost" : "green"}
            ch={salvando ? "Salvando..." : salvo ? "✅ Evolução salva" : "Salvar evolução"}
            s={{ flex: 1, padding: 11 }}
            dis={salvando || !evolucaoFinal.trim()}
            onClick={handleSalvar}
          />
          <Btn v="gold" ch="Abrir APAC anti-glosa" s={{ flex: 1, padding: 11 }} onClick={onAbrirAPAC} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn v="ghost" ch="🗑 Novo atendimento" s={{ fontSize: 11, padding: "8px 14px" }} onClick={onNovo} />
      </div>
    </div>
  );
}

// ── Barra de progresso ────────────────────────────────────────────────────────

function StepBar({ step, onStep, etapas, apacScore, onAction }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      background: "#F8FAFC", borderBottom: "1px solid #E2E8F0",
      padding: "10px 16px", marginBottom: 16, borderRadius: "10px 10px 0 0",
      overflowX: "auto",
    }}>
      {etapas.map((e, i) => {
        const ativo     = i === step;
        const concluido = i < step;
        const cor       = concluido ? VE : ativo ? G : "#CBD5E1";
        const txtCor    = concluido ? VE : ativo ? G : "#94A3B8";
        return (
          <React.Fragment key={e.id}>
            <button
              onClick={() => onStep(i)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 3, border: "none", cursor: "pointer",
                padding: "4px 10px", borderRadius: 8,
                background: ativo ? "#EFF6FF" : "transparent",
                outline: "none", flexShrink: 0,
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: concluido ? VE : ativo ? G : "#F1F5F9",
                border: "2px solid " + cor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: concluido ? 14 : 15, color: concluido ? "#fff" : ativo ? "#fff" : "#94A3B8",
                fontWeight: 900, transition: "all .2s",
              }}>
                {concluido ? "✓" : e.icone}
              </div>
              <span style={{ fontSize: 10, fontWeight: 900, color: txtCor, whiteSpace: "nowrap" }}>
                {e.label}
              </span>
              {/* Badge score APAC na etapa validar */}
              {e.id === "validar" && apacScore != null && (
                <span style={{
                  fontSize: 9, fontWeight: 900,
                  color: apacScore >= 80 ? VE : apacScore >= 50 ? AM : VM,
                }}>
                  {apacScore}/100
                </span>
              )}
            </button>
            {i < etapas.length - 1 && (
              <div style={{
                flex: "0 0 16px", height: 2, minWidth: 8,
                background: i < step ? VE : "#E2E8F0",
                transition: "background .3s",
              }} />
            )}
          </React.Fragment>
        );
      })}
      {step > 0 && onAction && (
        <div style={{
          marginLeft: "auto",
          display: "flex",
          gap: 7,
          alignItems: "center",
          flexShrink: 0,
          paddingLeft: 12,
        }}>
          {[
            ["claude", "Claude", "#1B365D", "#fff"],
            ["agentes", "Agentes IA", "#fff", N],
            ["copiar", "Copiar", T, "#fff"],
            ["limpar", "Limpar", "#fff", N],
            ["salvar", "Salvar", VE, "#fff"],
            ["apac", "APAC", G, "#fff"],
          ].map(([id, label, bg, color]) => (
            <button
              key={id}
              type="button"
              onClick={() => onAction(id)}
              style={{
                border: bg === "#fff" ? "1px solid #CBD5E1" : "none",
                background: bg,
                color,
                borderRadius: 9,
                padding: "7px 11px",
                fontSize: 11,
                fontWeight: 900,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                boxShadow: bg === "#fff" ? "none" : "0 2px 8px rgba(15,23,42,.08)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

function LegacyStepperMedico({
  pac, dossie, setDossie, up, addMsg,
  onSalvarEvolucao, onAbrirAPAC, onLimpar,
}) {
  const { encounter, openEncounterSession, isOpen } = useEncounter();

  // Tipo: começa pelo tipo já inferido do encounter ativo, ou default
  const tipoInicial = encounter?.tipo || TIPO_DEFAULT;
  const [tipo, setTipo]  = useState(tipoInicial);
  const [step, setStep]  = useState(0);

  // Etapas dinâmicas conforme tipo selecionado
  const etapas  = useMemo(() => getEtapas(tipo),  [tipo]);
  const maxStep = useMemo(() => etapas.length - 1, [etapas]);

  // Derivados memoizados APAC
  const apac = useMemo(() => validarAPAC(dossie || {}), [
    dossie?.paciente?.cid, dossie?.paciente?.diag, dossie?.paciente?.cns,
    dossie?.paciente?.nome, dossie?.documentos?.length, dossie?.evolucao?.textoFinal,
  ]);
  const resolucao = useMemo(() =>
    apac.resolucao || resolverAPACCompleta(dossie?.paciente || pac || {}, dossie || {}),
    [apac]
  );

  const temPaciente = !!(pac?.pacID || pac?.cpf || pac?.cns);
  const temEncounter = isOpen;

  // Ao selecionar tipo no step 0 → abre encounter se paciente identificado
  const handleSelectTipo = (novoTipo) => {
    setTipo(novoTipo);
    if (temPaciente && !isOpen) {
      const patId = pac?.pacID || pac?.cpf || pac?.cns;
      openEncounterSession(String(patId), novoTipo);
    }
  };
  const abrirProntuarioDoTipo = (tipoEscolhido = tipo) => {
    handleSelectTipo(tipoEscolhido);
    const etapasDoTipo = getEtapas(tipoEscolhido);
    const idx = etapasDoTipo.findIndex(e => e.id === "evolucao");
    setStep(idx > -1 ? idx : Math.min(1, etapasDoTipo.length - 1));
  };
  const acaoProntuarioTopo = (acao) => {
    globalThis.dispatchEvent?.(new globalThis.CustomEvent("apacapp:prontuario:acao", { detail: { acao } }));
  };

  const avancar = () => {
    const check = podeAvancar({ step, tipo, temPaciente, temEncounter });
    if (!check.ok) { alert(check.motivo); return; }
    setStep(s => Math.min(s + 1, maxStep));
  };
  const voltar  = () => setStep(s => Math.max(s - 1, 0));

  const primeiro = step === 0;
  const ultimo   = step === maxStep;
  const etapaAtual = etapas[step];

  // ── Render de cada etapa ────────────────────────────────────────────────────
  const renderEtapa = () => {
    const id = etapaAtual?.id;

    switch (id) {
      case 'tipo':
        return <EtapaTipo tipo={tipo} onSelectTipo={handleSelectTipo} onOpenSelected={abrirProntuarioDoTipo} pac={pac} />;

      case 'paciente':
        return (
          <div style={{ display: "grid", gap: 14 }}>
            <EtapaPaciente pac={pac} up={up} />
            <ProntuarioDossieUnico
              pac={pac}
              dossie={dossie}
              setDossie={setDossie}
              up={up}
              addMsg={addMsg}
              onSalvarEvolucao={onSalvarEvolucao}
              onAbrirAPAC={() => {
                const iApac = etapas.findIndex(e => e.id === 'apac');
                if (iApac > -1) setStep(iApac);
              }}
              actionsInStepper
            />
          </div>
        );

      case 'evolucao':
        return (
          <ProntuarioDossieUnico
            pac={pac}
            dossie={dossie}
            setDossie={setDossie}
            up={up}
            addMsg={addMsg}
            onSalvarEvolucao={onSalvarEvolucao}
            onAbrirAPAC={() => {
              const iApac = etapas.findIndex(e => e.id === 'apac');
              if (iApac > -1) setStep(iApac);
            }}
            actionsInStepper
          />
        );

      case 'validar':
        return (
          <div style={{ display: "grid", gap: 12 }}>
            <APACDossieChecklist dossie={dossie} setDossie={setDossie} />
            {resolucao.inferidos?.length > 0 && (
              <div style={{
                background: "#FFFBEB", border: "1px solid " + AM + "44",
                borderRadius: 10, padding: "10px 14px", fontSize: 12, color: AM, fontWeight: 700,
              }}>
                🤖 Campos <strong>inferidos por IA</strong> — confirmar antes de imprimir APAC:<br />
                <span style={{ fontWeight: 900 }}>{resolucao.inferidos.join(" · ")}</span>
              </div>
            )}
            {resolucao.inconsistencias?.length > 0 && (
              <div style={{
                background: "#EDE9FE", border: "1px solid #7C3AED44",
                borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#7C3AED", fontWeight: 700,
              }}>
                ⚠️ <strong>Inconsistências</strong> — verificar:<br />
                <span style={{ fontWeight: 900 }}>{resolucao.inconsistencias.join(" · ")}</span>
              </div>
            )}
          </div>
        );

      case 'apac':
        return (
          <div style={{ display: "grid", gap: 16 }}>
            <APACEntradaRapida pac={pac} up={up} dossie={dossie} setDossie={setDossie} addMsg={addMsg} />
            <DocumentosPosEvolucao dossie={dossie} setDossie={setDossie} addMsg={addMsg} onAbrirAPAC={onAbrirAPAC} />
          </div>
        );

      case 'conduta':
        return <EtapaConduta pac={pac} dossie={dossie} addMsg={addMsg} />;

      case 'concluir':
        return (
          <EtapaConcluir
            pac={pac}
            dossie={dossie}
            apac={apac}
            resolucao={resolucao}
            onSalvarEvolucao={onSalvarEvolucao}
            onAbrirAPAC={onAbrirAPAC}
            onNovo={onLimpar}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "grid", gap: 0 }}>
      {/* F0 — Cabeçalho de auditoria clínica */}
      <div style={{ marginBottom: 8 }}>
        <EncounterHeader pac={pac} compact />
      </div>

      {/* Barra de progresso adaptativa */}
      <StepBar
        step={step}
        onStep={setStep}
        etapas={etapas}
        apacScore={resolucao?.scoreAntiGlosa}
        onAction={acaoProntuarioTopo}
      />

      {/* Aviso sem paciente nas etapas clínicas */}
      {!temPaciente && step > 0 && (
        <div style={{
          background: "#FEF2F2", border: "1px solid " + VM + "55",
          borderRadius: 10, padding: "10px 14px", marginBottom: 12,
          fontSize: 12, color: VM, fontWeight: 800,
        }}>
          ⚠️ Selecione um paciente para continuar esta etapa.
        </div>
      )}

      {/* Aviso sem encounter nas etapas clínicas (após paciente) */}
      {!temEncounter && step > 1 && (
        <div style={{
          background: "#FFF7E6", border: "1px solid " + AM + "55",
          borderRadius: 10, padding: "10px 14px", marginBottom: 12,
          fontSize: 12, color: AM, fontWeight: 800,
        }}>
          ⚠️ Atendimento não iniciado. Volte ao passo "Tipo" e selecione o tipo de consulta para abrir o atendimento.
        </div>
      )}

      {/* Conteudo da etapa */}
      <div style={{ minHeight: 320 }}>
        {renderEtapa()}
      </div>

      {/* Navegação */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 20, paddingTop: 14, borderTop: "1px solid #E2E8F0",
      }}>
        <Btn
          v="ghost"
          ch="← Voltar"
          s={{ padding: "9px 18px", fontSize: 12, visibility: primeiro ? "hidden" : "visible" }}
          onClick={voltar}
        />
        <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>
          {step + 1} / {etapas.length} — {etapaAtual?.label}
        </div>
        {!ultimo ? (
          <Btn
            v="navy"
            ch="Próximo →"
            s={{ padding: "9px 18px", fontSize: 12 }}
            dis={step === 0 && !temPaciente}
            onClick={avancar}
          />
        ) : (
          <div style={{ width: 100 }} />
        )}
      </div>
    </div>
  );
}
