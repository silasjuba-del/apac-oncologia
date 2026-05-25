/**
 * ══════════════════════════════════════════════════════════════════
 *  APAC_SYSTEM.jsx — Sistema Completo APAC SUS
 *  Modelo: Laudo Médico p/ Procedimentos de Alta Complexidade
 *  Dr. Silas Negrão Serra Jr. · CRM-PB 17341 · Hospital do Bem
 *
 *  FLUXO:
 *  Dados pac → Auto-preenchimento APAC → Checklist → Enviar Financeiro
 *  → Pendente → Aprovada ✅ / Reprovada ❌ → Antiglosa → Corrigir → Reenviar
 * ══════════════════════════════════════════════════════════════════
 *
 *  INTEGRAÇÃO NO CLAUDE CODE:
 *  1. Copiar para src/components/APACSystem.jsx
 *  2. No App.jsx, adicionar ao estado global:
 *     const [apacs, setApacs] = useState([])
 *     const [apacPendentes, setApacPendentes] = useState([])
 *  3. Importar e usar nos módulos conforme instruções no final
 */

import { useState, useRef, useEffect } from "react";

const N="#1B365D",T="#2B7A8C",G="#B8860B",VE="#15803D",AM="#B45309",VM="#B91C1C";
const AUTOR="Dr. Silas Negrão Serra Jr.",CRM="17341",UF="PB";
const HOSP="Hospital do Bem — Unidade Oncológica";
const HOSP2="Complexo Hospitalar Regional Dep. Janduhy Carneiro · Patos/PB";
const CNES_HOSP="2407748";
const TODAY=()=>new Date().toLocaleDateString("pt-BR");

const sc={
  card:(e={})=>({background:"#fff",border:"1px solid #E2E8F0",borderRadius:13,
    padding:14,boxShadow:"0 2px 8px rgba(15,23,42,.06)",...e}),
  btn:(v="ghost",e={})=>({border:"none",cursor:"pointer",fontWeight:800,
    borderRadius:9,padding:"8px 14px",fontSize:12,fontFamily:"inherit",
    ...({gold:{background:G,color:"#fff"},navy:{background:N,color:"#fff"},
       teal:{background:T,color:"#fff"},red:{background:VM,color:"#fff"},
       green:{background:VE,color:"#fff"},
       ghost:{background:"#F1F5F9",color:N,border:"1px solid #E2E8F0"},
       warn:{background:AM,color:"#fff"}})[v]||{},...e}),
  inp:{width:"100%",border:"1px solid #CBD5E1",borderRadius:6,padding:"6px 9px",
    fontFamily:"inherit",fontSize:11,outline:"none",background:"#fff",
    boxSizing:"border-box",color:"#1E293B"},
  campo:(destaque)=>({
    border:`1px solid ${destaque?"#B91C1C":"#94A3B8"}`,
    borderRadius:4,padding:"4px 8px",minHeight:28,fontSize:11,
    background:destaque?"#FEF2F2":"#FAFAFA",color:"#1E293B",
    cursor:"pointer",transition:"all .15s",
  }),
};
const Btn=({v="ghost",ch,s,onClick,dis})=>
  <button disabled={dis} onClick={onClick} style={{...sc.btn(v),opacity:dis?.5:1,...s}}>{ch}</button>;
const H2=({ch,s})=><h2 style={{color:N,fontSize:15,fontWeight:900,margin:"0 0 10px",...s}}>{ch}</h2>;
const H3=({ch,s})=><h3 style={{color:N,fontSize:12,fontWeight:800,margin:"0 0 6px",...s}}>{ch}</h3>;

/* ── Status colors ── */
const STATUS={
  rascunho:{l:"Rascunho",c:"#64748B",bg:"#F8FAFC",ico:"📝"},
  enviada: {l:"Enviada — Aguardando",c:AM,bg:"#FFFBEB",ico:"⏳"},
  aprovada:{l:"Aprovada ✅",c:VE,bg:"#EAF7EE",ico:"✅"},
  reprovada:{l:"Reprovada ❌",c:VM,bg:"#FEF2F2",ico:"❌"},
  corrigindo:{l:"Em Correção",c:T,bg:"#EFF9FF",ico:"✏️"},
};

/* ── CHECKLIST CAMPOS APAC ── */
const CAMPOS_APAC=[
  {id:"cnes",      secao:"Estabelecimento", label:"CNES do estabelecimento",       obrig:true,  campo:"cnes_hosp"},
  {id:"nome_pac",  secao:"Paciente",        label:"Nome completo do paciente",     obrig:true,  campo:"nome"},
  {id:"prontuario",secao:"Paciente",        label:"Nº do prontuário",              obrig:true,  campo:"pacID"},
  {id:"cns",       secao:"Paciente",        label:"Cartão Nacional de Saúde (CNS)",obrig:true,  campo:"cns"},
  {id:"nasc",      secao:"Paciente",        label:"Data de nascimento",            obrig:true,  campo:"nasc"},
  {id:"sexo",      secao:"Paciente",        label:"Sexo",                          obrig:true,  campo:"sexo"},
  {id:"mae",       secao:"Paciente",        label:"Nome da mãe",                   obrig:true,  campo:"mae"},
  {id:"tel",       secao:"Paciente",        label:"Telefone de contato",           obrig:false, campo:"tel"},
  {id:"endereco",  secao:"Paciente",        label:"Endereço completo",             obrig:false, campo:"endereco"},
  {id:"municipio", secao:"Paciente",        label:"Município de residência",       obrig:true,  campo:"cidade"},
  {id:"cod_proc",  secao:"Procedimento",    label:"Código do procedimento SIGTAP", obrig:true,  campo:"cod_proc"},
  {id:"nome_proc", secao:"Procedimento",    label:"Nome do procedimento",          obrig:true,  campo:"trat"},
  {id:"cid_princ", secao:"Justificativa",   label:"CID-10 Principal",              obrig:true,  campo:"cid"},
  {id:"cid_sec",   secao:"Justificativa",   label:"CID-10 Secundário",             obrig:false, campo:"cid_sec"},
  {id:"diag",      secao:"Justificativa",   label:"Descrição do diagnóstico",      obrig:true,  campo:"diag"},
  {id:"anamnese",  secao:"Justificativa",   label:"Resumo da anamnese e exame físico", obrig:true, campo:"exFisico"},
  {id:"exames",    secao:"Justificativa",   label:"Exames complementares realizados",obrig:true, campo:"exames_resumo"},
  {id:"justif",    secao:"Justificativa",   label:"Justificativa do procedimento", obrig:true,  campo:"justif_apac"},
  {id:"data_sol",  secao:"Solicitação",     label:"Data da solicitação",           obrig:true,  campo:"data_sol"},
  {id:"validade",  secao:"Autorização",     label:"Período de validade da APAC",   obrig:false, campo:"validade_apac"},
];

const MOTIVOS_GLOSA=[
  "CID-10 incompatível com o procedimento solicitado",
  "CNS do paciente inválido ou não cadastrado no CADSUS",
  "Ausência de laudo médico assinado e carimbado",
  "Dosagem fora dos limites da RENAME/CONITEC",
  "Intervalo entre ciclos não respeitado",
  "Hemograma pré-ciclo ausente ou com data superior a 7 dias",
  "Competência incorreta (mês/ano de referência)",
  "Código do procedimento não corresponde ao protocolo",
  "TCLE ausente ou não assinado",
  "Estabelecimento sem habilitação para o procedimento",
  "Documentação incompleta",
  "Outro (especificar nas observações)",
];

const SUPORTE_APAC = {
  filgrastim: {
    codigo: "",
    nome: "Filgrastim / G-CSF — confirmar código SIGTAP com faturamento",
  },
  zoledronico: {
    codigo: "0304040010",
    nome: "Ácido zoledrônico 4mg EV — suporte ósseo / hipercalcemia / metástase óssea",
  },
};

function valorLimpo(v) {
  const t = String(v ?? "").trim();
  if (!t) return "";
  if (/^(—|-|nao informado|não informado|a definir|sem dados)$/i.test(t)) return "";
  return t;
}

function primeiroValor(...vals) {
  return vals.map(valorLimpo).find(Boolean) || "";
}

function codigoLimpo(v) {
  return String(v || "").replace(/\D/g, "");
}

function textoContextoPaciente(pac = {}) {
  return [
    pac.trat, pac.conduta, pac.justif_apac, pac.exames_resumo, pac.docs_ia_resumo,
    pac.docs_drive_resumo, pac.obs_ia, pac.bio, pac.estadio, pac.diag,
    ...(Array.isArray(pac.evolucoes) ? pac.evolucoes.map(e => e?.texto || "") : []),
  ].filter(Boolean).join("\n").toLowerCase();
}

function enderecoAPAC(pac = {}, campos = {}) {
  const composto = [
    pac.tipo_logradouro,
    pac.logradouro,
    pac.numero ? "nº " + pac.numero : "",
    pac.bairro ? "Bairro " + pac.bairro : "",
  ].filter(Boolean).join(", ");
  return primeiroValor(pac.endereco, composto, campos.endereco);
}

function examesResumoAPAC(pac = {}, campos = {}) {
  const imagem = Array.isArray(pac.exames_imagem)
    ? pac.exames_imagem.map(e => `${e.data || e.dataExame || ""} ${e.nome || e.tipo || "Exame"}: ${e.resumo || e.resultado || e.laudo || ""}`.trim()).filter(Boolean).join("\n")
    : "";
  const labs = Array.isArray(pac.lab_rows)
    ? pac.lab_rows.filter(r => r.neutro || r.plt || r.hgb || r.creat).map(r => `Lab ${r.data || ""}: Neutro ${r.neutro || "—"}; PLT ${r.plt || "—"}; Hb ${r.hgb || "—"}; Creat ${r.creat || "—"}`).join("\n")
    : "";
  return primeiroValor(
    pac.exames_resumo,
    imagem,
    pac.anatom,
    pac.imagen,
    pac.docs_ia_resumo,
    pac.docs_drive_resumo,
    labs,
    campos.exames_resumo
  );
}

function modeloExameFisicoAPAC(pac = {}, campos = {}) {
  return primeiroValor(pac.exFisico, campos.exFisico) || [
    "Paciente em regular estado geral, vígil e responsivo, hipotrófico, eupneico, acianótico e anictérico.",
    "Aparelho cardiovascular: BNF em 2 tempos, sem sopros audíveis.",
    "Aparelho respiratório: murmúrio vesicular presente em todos os campos, sem sinais de esforço respiratório.",
    "Abdome flácido, indolor à palpação, sem sinais de irritação peritoneal.",
    "MMII com edema discreto, sem sinais clínicos de trombose venosa profunda no momento.",
    `Performance status ECOG ${valorLimpo(pac.ecog) || "__"}, compatível com terapia sistêmica após validação médica.`,
  ].join("\n");
}

function justificativaAPAC(pac = {}, campos = {}) {
  const diag = primeiroValor(pac.diag, campos.diag, "neoplasia maligna");
  const cid = primeiroValor(pac.cid, campos.cid);
  const estadio = primeiroValor(pac.estadio, pac.tnm, campos.estadiamento);
  const trat = primeiroValor(pac.trat, campos.trat, "tratamento sistêmico oncológico");
  const linha = primeiroValor(pac.linha, campos.linha_protocolo);
  const intencao = primeiroValor(pac.intencao, campos.intencao);
  return primeiroValor(pac.justif_apac, pac.conduta, campos.justif_apac) || [
    `Necessidade de tratamento quimioterápico/sistêmico devido a ${diag}${cid ? ` (${cid})` : ""}.`,
    estadio ? `Estadiamento/risco informado: ${estadio}.` : "",
    `Protocolo/procedimento solicitado: ${trat}${linha ? `, ${linha}` : ""}${intencao ? `, intenção ${intencao}` : ""}.`,
    "Solicitação baseada em avaliação clínica, laudos anexados e indicação terapêutica oncológica, com validação médica antes do envio à farmácia/faturamento.",
  ].filter(Boolean).join(" ");
}

function montarCamposAutomaticosAPAC(pac = {}, campos = {}) {
  const contexto = textoContextoPaciente(pac);
  const usaFilgrastim = /filgrastim|g[\s-]?csf|neutropenia|dose[\s-]?densa/.test(contexto);
  const usaZoledronico = /zoledr|zometa|met[aá]stase[s]?\s+[oó]ssea|m1\s+[oó]sseo|hipercalcemia/.test(contexto);
  const proc2 = usaFilgrastim ? SUPORTE_APAC.filgrastim : usaZoledronico ? SUPORTE_APAC.zoledronico : null;
  const proc3 = usaFilgrastim && usaZoledronico ? SUPORTE_APAC.zoledronico : null;
  return {
    nome: primeiroValor(pac.nome, campos.nome),
    pacID: primeiroValor(pac.pacID, pac.prontuario, campos.pacID),
    cns: primeiroValor(pac.cns, campos.cns),
    nasc: primeiroValor(pac.nasc, pac.data_nascimento, campos.nasc),
    sexo: primeiroValor(pac.sexo, campos.sexo),
    raca: primeiroValor(pac.raca, pac.raca_cor, campos.raca),
    mae: primeiroValor(pac.mae, campos.mae),
    tel: primeiroValor(pac.tel, pac.telefone_celular, pac.whatsapp, campos.tel),
    endereco: enderecoAPAC(pac, campos),
    cidade: primeiroValor(pac.municipioResidencia, pac.cidade, pac.municipio, campos.cidade),
    municipio_cod: primeiroValor(pac.municipio_cod, pac.codigo_ibge, campos.municipio_cod),
    uf: primeiroValor(pac.uf, campos.uf, "PB"),
    cep: primeiroValor(pac.cep, campos.cep),
    cod_proc: primeiroValor(codigoLimpo(pac.cod_proc), codigoLimpo(campos.cod_proc), "0304010072"),
    trat: primeiroValor(pac.trat, campos.trat, "Tratamento sistêmico oncológico"),
    qtde: primeiroValor(pac.qtde, campos.qtde, "1"),
    cid: primeiroValor(pac.cid, pac.cid_sugerido, campos.cid),
    cid_sec: primeiroValor(pac.cid_sec, campos.cid_sec),
    cid_causas: primeiroValor(pac.cid_causas, campos.cid_causas),
    diag: primeiroValor(pac.diag, campos.diag),
    exFisico: modeloExameFisicoAPAC(pac, campos),
    exames_resumo: examesResumoAPAC(pac, campos),
    justif_apac: justificativaAPAC(pac, campos),
    cod_proc_2: proc2 ? proc2.codigo : primeiroValor(campos.cod_proc_2),
    trat_2: proc2 ? proc2.nome : primeiroValor(campos.trat_2),
    qtde_2: proc2 ? "1" : primeiroValor(campos.qtde_2),
    cod_proc_3: proc3 ? proc3.codigo : primeiroValor(campos.cod_proc_3),
    trat_3: proc3 ? proc3.nome : primeiroValor(campos.trat_3),
    qtde_3: proc3 ? "1" : primeiroValor(campos.qtde_3),
    prof_solicitante: primeiroValor(campos.prof_solicitante, AUTOR),
    data_sol: primeiroValor(pac.data_sol, campos.data_sol, TODAY()),
    nome_executante: primeiroValor(campos.nome_executante, HOSP),
    cnes_executante: primeiroValor(campos.cnes_executante, CNES_HOSP),
  };
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — APAC SYSTEM
══════════════════════════════════════════════════════════════════ */
export function APACSystem({ pac, up, addMsg, apacs, setApacs }) {
  const [aba, setAba] = useState("formulario");
  const [apacAtual, setApacAtual] = useState(null);
  const [campoEdit, setCampoEdit] = useState(null); // campo sendo editado no checklist

  /* Inicializar ou carregar APAC do paciente; re-sincroniza campos clínicos quando chegam da IA */
  useEffect(() => {
    if (!pac?.nome) return;
    const existente = (apacs || []).find(a => a.pacID === (pac.pacID || pac.nome));
    const auto = montarCamposAutomaticosAPAC(pac, existente?.campos || {});
    if (existente) {
      // Mesclar novos dados do pac sem sobrescrever edits do usuário
      const mescla = { ...existente, campos: { ...existente.campos } };
      const merge = (k, v) => { if (valorLimpo(v) && !valorLimpo(mescla.campos[k])) mescla.campos[k] = v; };
      Object.entries(auto).forEach(([k, v]) => merge(k, v));
      setApacAtual(mescla);
      setApacs && setApacs(x => x.map(a => a.id === mescla.id ? mescla : a));
    } else criarNovaAPAC();
  }, [pac?.nome, pac?.pacID, pac?.diag, pac?.cid, pac?.trat, pac?.estadio, pac?.cod_proc, pac?.endereco, pac?.cidade, pac?.municipio_cod, pac?.cep, pac?.exFisico, pac?.exames_resumo, pac?.justif_apac, pac?.docs_ia_resumo, pac?.docs_drive_resumo]);

  const criarNovaAPAC = () => {
    const auto = montarCamposAutomaticosAPAC(pac, {});
    const nova = {
      id: "APAC-" + Date.now(),
      pacID: pac?.pacID || pac?.nome || "novo",
      status: "rascunho",
      dataCriacao: TODAY(),
      dataEnvio: null,
      dataResposta: null,
      historico: [],
      motivosGlosa: [],
      obsFinanceiro: "",
      campos: {
        // Auto-preenchimento dos dados do prontuário
        cnes_hosp: CNES_HOSP,
        nome_estabelecimento: HOSP,
        nome: pac?.nome || "",
        pacID: pac?.pacID || "OI-2026-" + Math.floor(1000 + Math.random() * 9000),
        cns: pac?.cns || "",
        nasc: pac?.nasc || "",
        sexo: pac?.sexo || "",
        raca: pac?.raca || "",
        mae: pac?.mae || "",
        responsavel: pac?.responsavel || "",
        tel: pac?.tel || "",
        endereco: pac?.endereco || "",
        municipio_cod: pac?.municipio_cod || "",
        cidade: pac?.cidade || "",
        uf: "PB",
        cep: pac?.cep || "",
        // Procedimento
        cod_proc: pac?.cod_proc || "0304010072",
        trat: pac?.trat || "",
        qtde: pac?.qtde || "1",
        // Justificativa
        cid: pac?.cid || "",
        cid_sec: pac?.cid_sec || "",
        cid_causas: pac?.cid_causas || "",
        diag: pac?.diag || "",
        exFisico: pac?.exFisico || "",
        exames_resumo: (pac?.anatom || "") + (pac?.imagen ? "\nImagem: " + pac.imagen : "") + (pac?.lab_rows?.filter(r => r.neutro)?.map(r => `\nLab ${r.data}: Neutro=${r.neutro} PLT=${r.plt} Hgb=${r.hgb}`)?.join("") || ""),
        justif_apac: pac?.justif_apac || pac?.conduta || "",
        // Solicitação
        prof_solicitante: AUTOR,
        crm_solicitante: "CRM-" + UF + " " + CRM,
        data_sol: TODAY(),
        // Autorização
        prof_autorizador: "",
        num_autorizacao: "",
        data_autorizacao: "",
        validade_apac: "",
        // Executante
        nome_executante: HOSP,
        cnes_executante: CNES_HOSP,
        ...auto,
      },
    };
    setApacAtual(nova);
    setApacs && setApacs(x => [...(x || []).filter(a => a.pacID !== nova.pacID), nova]);
  };

  const aplicarCamposAutomaticos = (campos, origem = "Preenchimento automático") => {
    if (!apacAtual) return;
    const limpos = Object.fromEntries(Object.entries(campos || {}).filter(([, v]) => valorLimpo(v)));
    const atualizado = {
      ...apacAtual,
      campos: { ...apacAtual.campos, ...limpos },
      historico: [...(apacAtual.historico || []), { dt: TODAY(), acao: origem, por: AUTOR }],
    };
    setApacAtual(atualizado);
    setApacs && setApacs(x => x.map(a => a.id === atualizado.id ? atualizado : a));
    Object.entries(limpos).forEach(([k, v]) => up && up(k, v));
    addMsg && addMsg("APAC", "Médico", `${origem}: ${Object.keys(limpos).length} campo(s) preenchido(s).`, "apac");
  };

  const salvarCampo = (chave, valor) => {
    if (!apacAtual) return;
    const atualizado = { ...apacAtual, campos: { ...apacAtual.campos, [chave]: valor } };
    setApacAtual(atualizado);
    setApacs && setApacs(x => x.map(a => a.id === atualizado.id ? atualizado : a));
    up && up(chave, valor);
    setCampoEdit(null);
  };

  const enviarFinanceiro = () => {
    if (!apacAtual) return;
    const faltando = CAMPOS_APAC.filter(c => c.obrig && !apacAtual.campos[c.campo]);
    if (faltando.length > 0) {
      alert(`⚠️ Campos obrigatórios faltando:\n${faltando.map(c => `• ${c.label}`).join("\n")}`);
      setAba("checklist");
      return;
    }
    const atualizado = {
      ...apacAtual,
      status: "enviada",
      dataEnvio: TODAY(),
      historico: [...(apacAtual.historico || []), { dt: TODAY(), acao: "Enviada ao Financeiro", por: AUTOR }],
    };
    setApacAtual(atualizado);
    setApacs && setApacs(x => x.map(a => a.id === atualizado.id ? atualizado : a));
    addMsg && addMsg("Médico", "Financeiro",
      `📋 APAC ENVIADA PARA ANÁLISE\nPaciente: ${apacAtual.campos.nome}\nCID: ${apacAtual.campos.cid}\nProtocolo: ${apacAtual.campos.trat}\nID: ${apacAtual.id}\nData: ${TODAY()}`,
      "apac"
    );
    alert("✅ APAC enviada ao Financeiro!\nAguardando análise...");
    setAba("status");
  };

  const ABAS_APAC = [
    ["auto",       "🤖 Preenchimento automático"],
    ["formulario", "📄 Formulário APAC"],
    ["checklist",  "✅ Checklist"],
    ["status",     "📊 Status"],
    ["antiglosa",  apacAtual?.status === "reprovada" ? "⚠️ Antiglosa" : "🛡 Antiglosa"],
    ["historico",  "📋 Histórico"],
  ];

  if (!pac?.nome) return (
    <div style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
      <p style={{ fontSize: 13 }}>Selecione um paciente para gerar a APAC.</p>
    </div>
  );

  const st = STATUS[apacAtual?.status || "rascunho"];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Header status */}
      <div style={{ ...sc.card({ background: `linear-gradient(135deg,${N},#0d2347)`, border: "none" }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: G, fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>
              Laudo Médico p/ Procedimentos de Alta Complexidade
            </div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{apacAtual?.campos?.nome || pac?.nome}</div>
            <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11, marginTop: 2 }}>
              {apacAtual?.id} · CID: {apacAtual?.campos?.cid || "—"} · {apacAtual?.campos?.trat || "—"}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 3 }}>{st.ico}</div>
            <div style={{ background: st.bg, color: st.c, fontWeight: 900, fontSize: 11, padding: "3px 10px", borderRadius: 999 }}>{st.l}</div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div style={{ background: N, display: "flex", borderRadius: 11, overflow: "hidden" }}>
        {ABAS_APAC.map(([id, l]) => (
          <button key={id} onClick={() => setAba(id)} style={{
            border: "none", cursor: "pointer", padding: "8px 10px", fontSize: 10,
            fontWeight: 800, flex: 1, fontFamily: "inherit", whiteSpace: "nowrap",
            background: aba === id ? G : N,
            color: aba === id ? "#fff" : "rgba(255,255,255,.5)",
          }}>{l}</button>
        ))}
      </div>

      {aba === "auto" && (
        <PreenchimentoAutomaticoAPAC
          pac={pac}
          apac={apacAtual}
          onAplicar={aplicarCamposAutomaticos}
          onIrFormulario={() => setAba("formulario")}
        />
      )}
      {aba === "formulario" && (
        <FormularioAPAC
          apac={apacAtual}
          onSalvar={salvarCampo}
          campoEdit={campoEdit}
          setCampoEdit={setCampoEdit}
          onEnviar={enviarFinanceiro}
          status={apacAtual?.status}
        />
      )}
      {aba === "checklist" && (
        <ChecklistAPAC
          apac={apacAtual}
          onEditarCampo={(c) => { setCampoEdit(c); setAba("formulario"); }}
          onEnviar={enviarFinanceiro}
          status={apacAtual?.status}
        />
      )}
      {aba === "status" && (
        <StatusAPAC
          apac={apacAtual}
          addMsg={addMsg}
          setApacAtual={setApacAtual}
          setApacs={setApacs}
          onCorrigir={() => setAba("antiglosa")}
        />
      )}
      {aba === "antiglosa" && (
        <AntiglosaAPAC
          apac={apacAtual}
          setApacAtual={setApacAtual}
          setApacs={setApacs}
          addMsg={addMsg}
          onReenviar={() => { enviarFinanceiro(); setAba("status"); }}
          onEditarCampo={(c) => { setCampoEdit(c); setAba("formulario"); }}
        />
      )}
      {aba === "historico" && <HistoricoAPAC apac={apacAtual} />}
    </div>
  );
}

function PreenchimentoAutomaticoAPAC({ pac, apac, onAplicar, onIrFormulario }) {
  const [abaAuto, setAbaAuto] = useState("todos");
  const auto = montarCamposAutomaticosAPAC(pac, apac?.campos || {});
  const [manual, setManual] = useState({
    cod2: auto.cod_proc_2 || "",
    trat2: auto.trat_2 || "",
    qtde2: auto.qtde_2 || "1",
    cod3: auto.cod_proc_3 || "",
    trat3: auto.trat_3 || "",
    qtde3: auto.qtde_3 || "1",
  });

  const bloco = {
    endereco: {
      titulo: "Endereço",
      campos: {
        endereco: auto.endereco,
        cidade: auto.cidade,
        municipio_cod: auto.municipio_cod,
        uf: auto.uf,
        cep: auto.cep,
      },
      texto: [
        `Endereço: ${auto.endereco || "pendente"}`,
        `Município: ${auto.cidade || "pendente"}`,
        `IBGE: ${auto.municipio_cod || "pendente"}`,
        `UF/CEP: ${auto.uf || "PB"} / ${auto.cep || "pendente"}`,
      ].join("\n"),
    },
    anamnese: {
      titulo: "Resumo da anamnese e exame físico",
      campos: { exFisico: auto.exFisico },
      texto: auto.exFisico,
    },
    exames: {
      titulo: "Exames complementares realizados",
      campos: { exames_resumo: auto.exames_resumo },
      texto: auto.exames_resumo || "Nenhum exame estruturado encontrado. Cole/adicione laudos no dossiê ou preencha manualmente.",
    },
    justificativa: {
      titulo: "Justificativa do procedimento",
      campos: { diag: auto.diag, cid: auto.cid, justif_apac: auto.justif_apac },
      texto: auto.justif_apac,
    },
    procedimento: {
      titulo: "Procedimento principal",
      campos: { cod_proc: auto.cod_proc, trat: auto.trat, qtde: auto.qtde },
      texto: [`Código: ${auto.cod_proc || "pendente"}`, `Procedimento: ${auto.trat || "pendente"}`, `QTDE: ${auto.qtde || "1"}`].join("\n"),
    },
    suporte: {
      titulo: "Procedimentos 2/3 — suporte",
      campos: {
        cod_proc_2: manual.cod2,
        trat_2: manual.trat2,
        qtde_2: manual.qtde2,
        cod_proc_3: manual.cod3,
        trat_3: manual.trat3,
        qtde_3: manual.qtde3,
      },
      texto: [
        `Procedimento 2: ${manual.cod2 || "código pendente"} — ${manual.trat2 || "não definido"}`,
        `Procedimento 3: ${manual.cod3 || "código pendente"} — ${manual.trat3 || "não definido"}`,
        "Obs.: confirme códigos de suporte com faturamento/SIGTAP antes do envio final.",
      ].join("\n"),
    },
  };

  const todos = Object.assign({}, ...Object.values(bloco).map(b => b.campos));
  const tabs = [
    ["todos", "Todos"],
    ["endereco", "Endereço"],
    ["anamnese", "Anamnese/exame"],
    ["exames", "Exames"],
    ["justificativa", "Justificativa"],
    ["procedimento", "Procedimento"],
    ["suporte", "Código 2/3"],
  ];
  const atual = abaAuto === "todos"
    ? { titulo: "Preencher todos os blocos", campos: todos, texto: Object.values(bloco).map(b => `=== ${b.titulo} ===\n${b.texto}`).join("\n\n") }
    : bloco[abaAuto];

  const aplicar = () => {
    onAplicar && onAplicar(atual.campos, `Preenchimento automático — ${atual.titulo}`);
    onIrFormulario && onIrFormulario();
  };

  return (
    <div style={sc.card({ border: `2px solid ${T}55`, background: "#F8FAFC" })}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <H2 ch="🤖 Preenchimento automático da APAC" s={{ margin: 0, fontSize: 15 }} />
          <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 12 }}>
            O agente usa paciente, recepção, dossiê, evolução, prescrição e laudos já inseridos. Você pode preencher tudo ou uma caixa por vez.
          </p>
        </div>
        <button onClick={() => onAplicar && onAplicar(todos, "Preenchimento automático completo")} style={{ ...sc.btn("gold", { fontSize: 11, whiteSpace: "nowrap" }) }}>
          Preencher tudo
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setAbaAuto(id)} style={{
            ...sc.btn(abaAuto === id ? "navy" : "ghost", { fontSize: 10, padding: "6px 10px" }),
          }}>{label}</button>
        ))}
      </div>

      {abaAuto === "suporte" && (
        <div style={{ background: "#fff", border: "1px solid #CBD5E1", borderRadius: 10, padding: 10, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <button onClick={() => setManual(m => ({ ...m, trat2: SUPORTE_APAC.filgrastim.nome, qtde2: "1" }))} style={sc.btn("ghost", { fontSize: 10 })}>Inserir Filgrastim</button>
            <button onClick={() => setManual(m => ({ ...m, cod2: SUPORTE_APAC.zoledronico.codigo, trat2: SUPORTE_APAC.zoledronico.nome, qtde2: "1" }))} style={sc.btn("ghost", { fontSize: 10 })}>Inserir ácido zoledrônico no proc. 2</button>
            <button onClick={() => setManual(m => ({ ...m, cod3: SUPORTE_APAC.zoledronico.codigo, trat3: SUPORTE_APAC.zoledronico.nome, qtde3: "1" }))} style={sc.btn("ghost", { fontSize: 10 })}>Inserir ácido zoledrônico no proc. 3</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 60px", gap: 8, marginBottom: 6 }}>
            <input value={manual.cod2} onChange={e => setManual(m => ({ ...m, cod2: e.target.value }))} placeholder="Código 2" style={sc.inp} />
            <input value={manual.trat2} onChange={e => setManual(m => ({ ...m, trat2: e.target.value }))} placeholder="Nome do procedimento 2" style={sc.inp} />
            <input value={manual.qtde2} onChange={e => setManual(m => ({ ...m, qtde2: e.target.value }))} placeholder="Qtde" style={sc.inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 60px", gap: 8 }}>
            <input value={manual.cod3} onChange={e => setManual(m => ({ ...m, cod3: e.target.value }))} placeholder="Código 3" style={sc.inp} />
            <input value={manual.trat3} onChange={e => setManual(m => ({ ...m, trat3: e.target.value }))} placeholder="Nome do procedimento 3" style={sc.inp} />
            <input value={manual.qtde3} onChange={e => setManual(m => ({ ...m, qtde3: e.target.value }))} placeholder="Qtde" style={sc.inp} />
          </div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #CBD5E1", borderRadius: 10, padding: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: N, textTransform: "uppercase", marginBottom: 6 }}>{atual.titulo}</div>
        <pre style={{ whiteSpace: "pre-wrap", margin: 0, color: "#334155", fontSize: 12, lineHeight: 1.65, fontFamily: "inherit" }}>{atual.texto || "Sem dados suficientes para este bloco."}</pre>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
        <button onClick={aplicar} style={{ ...sc.btn("green", { padding: "9px 14px" }) }}>Aplicar este bloco na APAC</button>
        <button onClick={onIrFormulario} style={{ ...sc.btn("ghost", { padding: "9px 14px" }) }}>Ir para formulário</button>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   FORMULÁRIO APAC — Visual fiel ao modelo SUS
══════════════════════════════════════════════════════════════════ */
function FormularioAPAC({ apac, onSalvar, campoEdit, setCampoEdit, onEnviar, status }) {
  const [vals, setVals] = useState(apac?.campos || {});
  useEffect(() => { setVals(apac?.campos || {}); }, [apac?.id, apac?.campos]);

  const preencher = (chave) => () => setCampoEdit(chave);
  const faltando = (chave) => !vals[chave];

  const CampoClicavel = ({ chave, placeholder, altura = 28, largura = "100%", fontSize = 11 }) => {
    const vazio = faltando(chave);
    const editando = campoEdit === chave;
    if (editando) return (
      <div style={{ position: "relative", width: largura }}>
        <input
          autoFocus
          value={vals[chave] || ""}
          onChange={e => setVals(v => ({ ...v, [chave]: e.target.value }))}
          onBlur={() => onSalvar(chave, vals[chave] || "")}
          onKeyDown={e => { if (e.key === "Enter") onSalvar(chave, vals[chave] || ""); if (e.key === "Escape") setCampoEdit(null); }}
          placeholder={placeholder || "Digite aqui..."}
          style={{ ...sc.inp, height: altura, fontSize, border: `2px solid ${T}` }}
        />
        <div style={{ position: "absolute", right: 4, top: -18, fontSize: 9, color: T, fontWeight: 700 }}>
          Enter para salvar · Esc para cancelar
        </div>
      </div>
    );
    return (
      <div
        onClick={preencher(chave)}
        title={vazio ? "⚠️ Campo obrigatório — clique para preencher" : "Clique para editar"}
        style={{
          ...sc.campo(vazio),
          height: altura, width: largura, display: "flex", alignItems: "center",
          cursor: "pointer", fontSize,
        }}
      >
        {vals[chave]
          ? <span style={{ color: "#1E293B" }}>{vals[chave]}</span>
          : <span style={{ color: vazio ? VM : "#94A3B8", fontSize: fontSize - 1, fontStyle: "italic" }}>
              {vazio ? "⚠ Obrigatório — clique para preencher" : placeholder || "—"}
            </span>
        }
      </div>
    );
  };

  const CampoTextarea = ({ chave, placeholder, altura = 60 }) => {
    const vazio = faltando(chave);
    const editando = campoEdit === chave;
    if (editando) return (
      <textarea
        autoFocus
        value={vals[chave] || ""}
        onChange={e => setVals(v => ({ ...v, [chave]: e.target.value }))}
        onBlur={() => onSalvar(chave, vals[chave] || "")}
        placeholder={placeholder}
        rows={3}
        style={{ ...sc.inp, height: altura, fontSize: 11, resize: "vertical", border: `2px solid ${T}` }}
      />
    );
    return (
      <div onClick={preencher(chave)} style={{ ...sc.campo(vazio), height: altura, cursor: "pointer", fontSize: 11, overflowY: "auto" }}>
        {vals[chave]
          ? <span style={{ color: "#1E293B", whiteSpace: "pre-wrap" }}>{vals[chave]}</span>
          : <span style={{ color: vazio ? VM : "#94A3B8", fontStyle: "italic", fontSize: 10 }}>{vazio ? "⚠ Obrigatório — clique para preencher" : placeholder || "—"}</span>
        }
      </div>
    );
  };

  const labelStyle = { fontSize: 8, color: "#64748B", fontWeight: 700, textTransform: "uppercase", marginBottom: 2, display: "block" };
  const secaoStyle = { background: "#1E293B", color: "#fff", textAlign: "center", padding: "5px", fontSize: 11, fontWeight: 900, letterSpacing: 0.5, marginBottom: 6, marginTop: 10, borderRadius: 2 };

  const bloqueado = status === "enviada" || status === "aprovada";

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {bloqueado && (
        <div style={{ background: AM + "22", border: `1px solid ${AM}`, borderRadius: 9, padding: "8px 12px", color: AM, fontWeight: 700, fontSize: 12 }}>
          ⚠️ APAC {status === "enviada" ? "enviada e em análise" : "aprovada"} — edição bloqueada. Use a aba Antiglosa para corrigir se necessário.
        </div>
      )}

      {/* CABEÇALHO SUS */}
      <div style={{ ...sc.card({ padding: 0, overflow: "hidden", border: "2px solid #1E293B" }) }}>
        {/* Topo — logo SUS + título */}
        <div style={{ display: "flex", borderBottom: "2px solid #1E293B" }}>
          <div style={{ border: "2px solid #1E293B", borderLeft: 0, borderTop: 0, borderBottom: 0, padding: "8px 12px", background: "#fff", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: "#1E293B", color: "#fff", fontWeight: 900, fontSize: 14, padding: "4px 8px", borderRadius: 3 }}>SUS</div>
            <div style={{ fontSize: 8, lineHeight: 1.3, color: "#1E293B" }}>
              <div style={{ fontWeight: 700 }}>Ministério</div>
              <div>da Saúde</div>
            </div>
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px", background: "#fff" }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: "#1E293B", lineHeight: 1.3 }}>
              LAUDO MÉDICO PARA PROCEDIMENTOS DE ALTA<br />COMPLEXIDADE — APAC
            </div>
          </div>
        </div>

        <div style={{ padding: "0 8px 8px" }}>
          {/* ESTABELECIMENTO SOLICITANTE */}
          <div style={secaoStyle}>IDENTIFICAÇÃO DO ESTABELECIMENTO DE SAÚDE (SOLICITANTE)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0 8px", marginBottom: 6 }}>
            <div>
              <span style={labelStyle}>1 - Nome do Estabelecimento de Saúde Solicitante</span>
              <CampoClicavel chave="nome_estabelecimento" placeholder={HOSP}/>
            </div>
            <div style={{ width: 90 }}>
              <span style={labelStyle}>2 - CNES</span>
              <CampoClicavel chave="cnes_hosp" placeholder="0000000"/>
            </div>
          </div>

          {/* IDENTIFICAÇÃO DO PACIENTE */}
          <div style={secaoStyle}>IDENTIFICAÇÃO DO PACIENTE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "0 8px", marginBottom: 5 }}>
            <div>
              <span style={labelStyle}>3 - Nome do Paciente</span>
              <CampoClicavel chave="nome"/>
            </div>
            <div>
              <span style={labelStyle}>4 - Nº do Prontuário</span>
              <CampoClicavel chave="pacID"/>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "160px 100px 80px 80px", gap: "0 8px", marginBottom: 5 }}>
            <div>
              <span style={labelStyle}>5 - CNS (Cartão Nacional de Saúde)</span>
              <CampoClicavel chave="cns" placeholder="000 0000 0000 0000"/>
            </div>
            <div>
              <span style={labelStyle}>6 - Data de Nascimento</span>
              <CampoClicavel chave="nasc" placeholder="dd/mm/aaaa"/>
            </div>
            <div>
              <span style={labelStyle}>7 - Sexo</span>
              <select
                value={vals.sexo || ""}
                onChange={e => { setVals(v => ({ ...v, sexo: e.target.value })); onSalvar("sexo", e.target.value); }}
                style={{ ...sc.inp, height: 28, fontSize: 11 }}
              >
                <option value="">—</option>
                <option value="M">Masc</option>
                <option value="F">Fem</option>
              </select>
            </div>
            <div>
              <span style={labelStyle}>8 - Raça/Cor</span>
              <select value={vals.raca || ""} onChange={e => { setVals(v => ({ ...v, raca: e.target.value })); onSalvar("raca", e.target.value); }} style={{ ...sc.inp, height: 28, fontSize: 11 }}>
                <option value="">—</option>
                {["Branca","Preta","Parda","Amarela","Indígena"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "0 8px", marginBottom: 5 }}>
            <div>
              <span style={labelStyle}>9 - Nome da Mãe</span>
              <CampoClicavel chave="mae"/>
            </div>
            <div>
              <span style={labelStyle}>10 - Telefone de Contato</span>
              <CampoClicavel chave="tel" placeholder="(83) 9____-____"/>
            </div>
          </div>
          <div style={{ marginBottom: 5 }}>
            <span style={labelStyle}>13 - Endereço (Rua, Nº, Bairro)</span>
            <CampoClicavel chave="endereco"/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 50px 80px", gap: "0 8px", marginBottom: 5 }}>
            <div>
              <span style={labelStyle}>14 - Município de Residência</span>
              <CampoClicavel chave="cidade"/>
            </div>
            <div>
              <span style={labelStyle}>15 - Cód. IBGE</span>
              <CampoClicavel chave="municipio_cod" placeholder="2512903"/>
            </div>
            <div>
              <span style={labelStyle}>16 - UF</span>
              <CampoClicavel chave="uf" placeholder="PB"/>
            </div>
            <div>
              <span style={labelStyle}>17 - CEP</span>
              <CampoClicavel chave="cep" placeholder="58700-000"/>
            </div>
          </div>

          {/* PROCEDIMENTO SOLICITADO */}
          <div style={secaoStyle}>PROCEDIMENTO SOLICITADO</div>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: "grid", gridTemplateColumns: "130px 1fr 60px", gap: "0 8px", marginBottom: 5 }}>
              <div>
                <span style={labelStyle}>Código do Procedimento {n > 1 ? n : ""}</span>
                <CampoClicavel chave={n === 1 ? "cod_proc" : `cod_proc_${n}`} placeholder="03040100xx"/>
              </div>
              <div>
                <span style={labelStyle}>Nome do Procedimento</span>
                <CampoClicavel chave={n === 1 ? "trat" : `trat_${n}`} placeholder="Nome do procedimento"/>
              </div>
              <div>
                <span style={labelStyle}>QTDE</span>
                <CampoClicavel chave={n === 1 ? "qtde" : `qtde_${n}`} placeholder="1"/>
              </div>
            </div>
          ))}

          {/* JUSTIFICATIVA */}
          <div style={secaoStyle}>JUSTIFICATIVA DO(S) PROCEDIMENTO(S) SOLICITADO(S)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 130px", gap: "0 8px", marginBottom: 5 }}>
            <div>
              <span style={labelStyle}>Descrição do Diagnóstico</span>
              <CampoClicavel chave="diag" altura={32}/>
            </div>
            <div>
              <span style={labelStyle}>CID 10 Principal</span>
              <CampoClicavel chave="cid" placeholder="C18.9"/>
            </div>
            <div>
              <span style={labelStyle}>CID 10 Secundário</span>
              <CampoClicavel chave="cid_sec" placeholder="Z79.899"/>
            </div>
            <div>
              <span style={labelStyle}>CID 10 Causas Associadas</span>
              <CampoClicavel chave="cid_causas" placeholder="E11, I10..."/>
            </div>
          </div>
          <div style={{ marginBottom: 5 }}>
            <span style={labelStyle}>Resumo da Anamnese e Exame Físico</span>
            <CampoTextarea chave="exFisico" placeholder="Paciente com..." altura={64}/>
          </div>
          <div style={{ marginBottom: 5 }}>
            <span style={labelStyle}>Exames Complementares Realizados</span>
            <CampoTextarea chave="exames_resumo" placeholder="Lab: hemograma, função hepática... Imagem: TC..." altura={64}/>
          </div>
          <div style={{ marginBottom: 5 }}>
            <span style={labelStyle}>Justificativa do Procedimento</span>
            <CampoTextarea chave="justif_apac" placeholder="Paciente portador de... indicando tratamento com..." altura={80}/>
          </div>

          {/* SOLICITAÇÃO */}
          <div style={secaoStyle}>SOLICITAÇÃO</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: "0 8px", marginBottom: 5 }}>
            <div>
              <span style={labelStyle}>Nome do Profissional Solicitante</span>
              <CampoClicavel chave="prof_solicitante"/>
            </div>
            <div>
              <span style={labelStyle}>Data da Solicitação</span>
              <CampoClicavel chave="data_sol" placeholder="dd/mm/aaaa"/>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
              <div style={{ border: "1px solid #94A3B8", borderRadius: 4, padding: "4px 12px", fontSize: 10, color: "#64748B", background: "#FAFAFA" }}>
                Assinatura e Carimbo<br />
                <span style={{ color: N, fontWeight: 700 }}>{AUTOR}</span><br />
                <span style={{ color: "#64748B", fontSize: 9 }}>CRM-PB {CRM}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "80px 160px", gap: "0 8px", marginBottom: 5 }}>
            <div>
              <span style={labelStyle}>Documento</span>
              <div style={{ ...sc.campo(false), height: 28, fontSize: 10, color: "#64748B" }}>( x ) CRM</div>
            </div>
            <div>
              <span style={labelStyle}>Número do Documento (CRM)</span>
              <div style={{ ...sc.campo(false), height: 28, fontSize: 11 }}>{CRM}/{UF}</div>
            </div>
          </div>

          {/* AUTORIZAÇÃO */}
          <div style={secaoStyle}>AUTORIZAÇÃO</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 160px", gap: "0 8px", marginBottom: 5 }}>
            <div>
              <span style={labelStyle}>Nome do Profissional Autorizador</span>
              <CampoClicavel chave="prof_autorizador" placeholder="Preenchido pelo Financeiro/Regulação"/>
            </div>
            <div>
              <span style={labelStyle}>Cód. Órgão Emissor</span>
              <CampoClicavel chave="cod_orgao" placeholder=""/>
            </div>
            <div>
              <span style={labelStyle}>Número da Autorização (APAC)</span>
              <CampoClicavel chave="num_autorizacao" placeholder="Preenchido após aprovação"/>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px 160px", gap: "0 8px", marginBottom: 5 }}>
            <div>
              <span style={labelStyle}>Data da Autorização</span>
              <CampoClicavel chave="data_autorizacao" placeholder="dd/mm/aaaa"/>
            </div>
            <div>
              <span style={labelStyle}>Período de Validade da APAC</span>
              <CampoClicavel chave="validade_apac" placeholder="dd/mm/aaaa a dd/mm/aaaa"/>
            </div>
          </div>

          {/* EXECUTANTE */}
          <div style={secaoStyle}>IDENTIFICAÇÃO DO ESTABELECIMENTO DE SAÚDE (EXECUTANTE)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: "0 8px" }}>
            <div>
              <span style={labelStyle}>Nome do Estabelecimento de Saúde Executante</span>
              <CampoClicavel chave="nome_executante"/>
            </div>
            <div>
              <span style={labelStyle}>CNES Executante</span>
              <CampoClicavel chave="cnes_executante"/>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      {!bloqueado && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => window.print()} style={{ ...sc.btn("ghost", { flex: 1, fontSize: 11 }) }}>🖨️ Imprimir APAC</button>
          <button onClick={onEnviar} style={{ ...sc.btn("gold", { flex: 2, padding: 11, fontSize: 13, fontWeight: 900 }) }}>
            📤 Enviar ao Financeiro para Análise
          </button>
        </div>
      )}

      <div style={{ fontSize: 9, color: "#94A3B8", textAlign: "center" }}>
        💡 Clique em qualquer campo para editar · Campos em vermelho são obrigatórios
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   CHECKLIST APAC — Campos obrigatórios com atalho para preenchimento
══════════════════════════════════════════════════════════════════ */
function ChecklistAPAC({ apac, onEditarCampo, onEnviar, status }) {
  const campos = apac?.campos || {};
  const secoes = [...new Set(CAMPOS_APAC.map(c => c.secao))];
  const totalObrig = CAMPOS_APAC.filter(c => c.obrig).length;
  const preenchidos = CAMPOS_APAC.filter(c => c.obrig && campos[c.campo]).length;
  const pct = Math.round((preenchidos / totalObrig) * 100);
  const pronto = preenchidos === totalObrig;

  return (
    <div style={{ display: "grid", gap: 11 }}>
      {/* Progress */}
      <div style={sc.card({ background: pronto ? "#EAF7EE" : "#FFFBEB", border: `1px solid ${pronto ? VE : AM}44` })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14, color: pronto ? VE : AM }}>{pct}% preenchido</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>{preenchidos}/{totalObrig} campos obrigatórios</div>
          </div>
          {pronto && status === "rascunho" && (
            <button onClick={onEnviar} style={{ ...sc.btn("gold", { fontSize: 12, padding: "8px 16px" }) }}>
              📤 Enviar ao Financeiro
            </button>
          )}
        </div>
        <div style={{ height: 8, background: "#E2E8F0", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: "100%", width: pct + "%", background: pronto ? VE : pct > 50 ? AM : VM, borderRadius: 999, transition: "width .3s" }}/>
        </div>
      </div>

      {/* Por seção */}
      {secoes.map(secao => {
        const itens = CAMPOS_APAC.filter(c => c.secao === secao);
        const ok = itens.filter(c => campos[c.campo]).length;
        return (
          <div key={secao} style={sc.card()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <H3 ch={secao} s={{ margin: 0 }}/>
              <span style={{
                background: ok === itens.length ? VE + "22" : VM + "22",
                color: ok === itens.length ? VE : VM,
                padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 900
              }}>{ok}/{itens.length}</span>
            </div>
            <div style={{ display: "grid", gap: 5 }}>
              {itens.map(c => {
                const preenchido = !!campos[c.campo];
                return (
                  <div key={c.id} style={{
                    display: "flex", gap: 9, alignItems: "center",
                    border: `1.5px solid ${preenchido ? VE + "44" : c.obrig ? VM + "44" : "#E2E8F0"}`,
                    borderRadius: 8, padding: "7px 10px",
                    background: preenchido ? "#F0FDF4" : c.obrig ? "#FFF5F5" : "#F8FAFC",
                    cursor: preenchido ? "default" : "pointer",
                  }}
                    onClick={() => !preenchido && onEditarCampo(c.campo)}
                  >
                    <span style={{ fontSize: 16 }}>{preenchido ? "✅" : c.obrig ? "⚠️" : "○"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: N }}>{c.label}</div>
                      {preenchido
                        ? <div style={{ fontSize: 10, color: "#64748B", marginTop: 1 }}>{String(campos[c.campo]).slice(0, 60)}{String(campos[c.campo]).length > 60 ? "..." : ""}</div>
                        : <div style={{ fontSize: 10, color: c.obrig ? VM : "#94A3B8", marginTop: 1 }}>{c.obrig ? "⚠ Obrigatório — clique para preencher" : "Opcional"}</div>
                      }
                    </div>
                    {!preenchido && (
                      <button onClick={() => onEditarCampo(c.campo)} style={{ ...sc.btn("teal", { fontSize: 10, padding: "3px 9px", flexShrink: 0 }) }}>
                        ✏️ Preencher
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   STATUS DA APAC — Canal com Financeiro
══════════════════════════════════════════════════════════════════ */
function StatusAPAC({ apac, addMsg, setApacAtual, setApacs, onCorrigir }) {
  const [msgFin, setMsgFin] = useState("");
  const [msgs, setMsgs] = useState(apac?.msgs_financeiro || []);
  const st = STATUS[apac?.status || "rascunho"];

  // Simular aprovação/reprovação (em produção: receber via webhook ou polling)
  const simularAprovacao = () => {
    const atualizado = {
      ...apac,
      status: "aprovada",
      dataResposta: TODAY(),
      campos: { ...apac.campos, num_autorizacao: "APAC-" + Math.floor(100000 + Math.random() * 900000), data_autorizacao: TODAY() },
      historico: [...(apac.historico || []), { dt: TODAY(), acao: "✅ Aprovada pelo Financeiro", por: "Financeiro" }],
    };
    setApacAtual(atualizado);
    setApacs && setApacs(x => x.map(a => a.id === atualizado.id ? atualizado : a));
    addMsg && addMsg("Financeiro", "Médico", `✅ APAC APROVADA!\nPaciente: ${apac.campos?.nome}\nNº Autorização: ${atualizado.campos.num_autorizacao}\nVálida a partir de: ${TODAY()}`, "apac");
    setMsgs(x => [...x, { de: "Financeiro", txt: `✅ APAC aprovada. Nº: ${atualizado.campos.num_autorizacao}`, dt: TODAY() }]);
  };

  const simularReprovacao = () => {
    const motivos = [MOTIVOS_GLOSA[0], MOTIVOS_GLOSA[8]];
    const atualizado = {
      ...apac,
      status: "reprovada",
      dataResposta: TODAY(),
      motivosGlosa: motivos,
      obsFinanceiro: "CID incompatível e TCLE não localizado no processo.",
      historico: [...(apac.historico || []), { dt: TODAY(), acao: "❌ Reprovada — pendência antiglosa", por: "Financeiro" }],
    };
    setApacAtual(atualizado);
    setApacs && setApacs(x => x.map(a => a.id === atualizado.id ? atualizado : a));
    addMsg && addMsg("Financeiro", "Médico", `❌ APAC REPROVADA\nPaciente: ${apac.campos?.nome}\nMotivo: ${motivos[0]}\nAcesse a aba Antiglosa para corrigir.`, "apac");
    setMsgs(x => [...x, { de: "Financeiro", txt: `❌ APAC reprovada. Ver aba Antiglosa.`, dt: TODAY() }]);
  };

  const enviarMsg = () => {
    if (!msgFin.trim()) return;
    const nova = { de: "Médico", txt: msgFin, dt: TODAY() };
    setMsgs(x => [...x, nova]);
    addMsg && addMsg("Médico", "Financeiro", msgFin, "msg");
    setMsgFin("");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Status card */}
      <div style={{ ...sc.card({ background: st.bg, border: `2px solid ${st.c}44`, textAlign: "center", padding: 20 }) }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{st.ico}</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: st.c }}>{st.l}</div>
        {apac?.dataEnvio && <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Enviada em: {apac.dataEnvio}</div>}
        {apac?.dataResposta && <div style={{ fontSize: 11, color: "#64748B" }}>Resposta em: {apac.dataResposta}</div>}
        {apac?.status === "aprovada" && apac?.campos?.num_autorizacao && (
          <div style={{ background: VE, color: "#fff", borderRadius: 9, padding: "8px 16px", marginTop: 10, fontWeight: 900, fontSize: 13 }}>
            Nº Autorização: {apac.campos.num_autorizacao}
          </div>
        )}
        {apac?.status === "reprovada" && (
          <button onClick={onCorrigir} style={{ ...sc.btn("warn", { marginTop: 10, fontSize: 12, padding: "8px 18px" }) }}>
            ✏️ Ir para Antiglosa — Corrigir e Reenviar
          </button>
        )}
      </div>

      {/* Simulação (dev) */}
      {apac?.status === "enviada" && (
        <div style={sc.card({ background: "#F8FAFC", border: "1px dashed #CBD5E1" })}>
          <H3 ch="🔧 Simular resposta do Financeiro (desenvolvimento)" s={{ color: "#94A3B8" }}/>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={simularAprovacao} style={{ ...sc.btn("green", { flex: 1, fontSize: 11 }) }}>✅ Simular Aprovação</button>
            <button onClick={simularReprovacao} style={{ ...sc.btn("red", { flex: 1, fontSize: 11 }) }}>❌ Simular Reprovação</button>
          </div>
        </div>
      )}

      {/* Canal Médico ↔ Financeiro */}
      <div style={sc.card({ border: `1px solid ${G}44` })}>
        <H3 ch="💬 Canal Médico ↔ Financeiro" />
        <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 9 }}>
          {[{ de: "Sistema", txt: "Canal APAC ativo. Médico e Financeiro conectados.", dt: apac?.dataCriacao || TODAY(), tipo: "sistema" },
            ...(msgs || [])].map((m, i) => {
              const eu = m.de === "Médico";
              return (
                <div key={i} style={{ display: "flex", flexDirection: eu ? "row-reverse" : "row", gap: 5 }}>
                  <div style={{ maxWidth: "80%" }}>
                    <div style={{ fontSize: 8, color: "#94A3B8", marginBottom: 1, textAlign: eu ? "right" : "left" }}>{m.de} · {m.dt}</div>
                    <div style={{ background: eu ? N : m.de === "Financeiro" ? "#EAF7EE" : "#F1F5F9", color: eu ? "#fff" : "#374151", borderRadius: eu ? "11px 11px 3px 11px" : "11px 11px 11px 3px", padding: "6px 10px", fontSize: 11, lineHeight: 1.5 }}>{m.txt}</div>
                  </div>
                </div>
              );
            })}
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <input value={msgFin} onChange={e => setMsgFin(e.target.value)} onKeyDown={e => e.key === "Enter" && enviarMsg()}
            placeholder="Mensagem ao Financeiro..." style={{ ...sc.inp, flex: 1 }}/>
          <button onClick={enviarMsg} style={{ ...sc.btn("navy", { padding: "6px 12px" }) }}>→</button>
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   ANTIGLOSA — Médico corrige e reenvia
══════════════════════════════════════════════════════════════════ */
function AntiglosaAPAC({ apac, setApacAtual, setApacs, addMsg, onReenviar, onEditarCampo }) {
  const [obs, setObs] = useState("");
  const [correcoes, setCorrecoes] = useState({});

  if (!apac) return null;
  const motivos = apac.motivosGlosa || [];

  const marcarCorrigido = (motivo) => {
    setCorrecoes(x => ({ ...x, [motivo]: !x[motivo] }));
  };

  const todosCorrigidos = motivos.every(m => correcoes[m]);

  const reenviar = () => {
    if (!todosCorrigidos && motivos.length > 0) {
      alert("⚠️ Confirme que todos os itens foram corrigidos antes de reenviar.");
      return;
    }
    const atualizado = {
      ...apac,
      status: "enviada",
      dataEnvio: TODAY(),
      correcoes,
      obsCorrecao: obs,
      motivosGlosa: [],
      historico: [...(apac.historico || []), {
        dt: TODAY(),
        acao: `✏️ Corrigido e reenviado. ${obs ? "Obs: " + obs : ""}`,
        por: AUTOR
      }],
    };
    setApacAtual(atualizado);
    setApacs && setApacs(x => x.map(a => a.id === atualizado.id ? atualizado : a));
    addMsg && addMsg("Médico", "Financeiro",
      `✏️ APAC CORRIGIDA E REENVIADA\nPaciente: ${apac.campos?.nome}\nItens corrigidos: ${Object.keys(correcoes).filter(k => correcoes[k]).length}\nObs: ${obs || "—"}`,
      "apac"
    );
    onReenviar && onReenviar();
    alert("✅ APAC corrigida e reenviada ao Financeiro!");
  };

  return (
    <div style={{ display: "grid", gap: 11 }}>
      {/* Glosa recebida */}
      <div style={{ ...sc.card({ background: "#FEF2F2", border: `2px solid ${VM}44` }) }}>
        <H2 ch="❌ Motivos da Reprovação (Glosa)" s={{ color: VM }}/>
        {apac.obsFinanceiro && (
          <div style={{ background: "#fff", borderRadius: 8, padding: "8px 11px", marginBottom: 10, fontSize: 11, color: "#374151", border: `1px solid ${VM}22` }}>
            <strong style={{ color: VM }}>Observação do Financeiro: </strong>{apac.obsFinanceiro}
          </div>
        )}
        {motivos.length === 0 && <p style={{ color: "#94A3B8", fontSize: 12 }}>Nenhum motivo de glosa registrado.</p>}
        {motivos.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", border: `1.5px solid ${correcoes[m] ? VE + "44" : VM + "44"}`, borderRadius: 9, padding: "9px 11px", marginBottom: 6, background: correcoes[m] ? "#EAF7EE" : "#FFF5F5" }}>
            <input type="checkbox" checked={!!correcoes[m]} onChange={() => marcarCorrigido(m)} style={{ width: 15, height: 15, accentColor: VE, marginTop: 2, flexShrink: 0 }}/>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, color: correcoes[m] ? N : VM, fontWeight: correcoes[m] ? 700 : 400, textDecoration: correcoes[m] ? "line-through" : "none" }}>{m}</span>
              {correcoes[m] && <div style={{ fontSize: 10, color: VE, fontWeight: 700, marginTop: 2 }}>✅ Corrigido</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Guia de correção por tipo de glosa */}
      <div style={sc.card()}>
        <H3 ch="📋 O que corrigir — Guia rápido"/>
        <div style={{ display: "grid", gap: 5 }}>
          {[
            { motivo: "CID-10 incompatível", acao: "cid", label: "Corrigir CID-10 Principal", campo: "cid" },
            { motivo: "CNS inválido", acao: "cns", label: "Corrigir CNS do paciente", campo: "cns" },
            { motivo: "Laudo ausente", acao: "exFisico", label: "Completar Anamnese e Exame Físico", campo: "exFisico" },
            { motivo: "TCLE ausente", acao: "justif_apac", label: "Juntar TCLE assinado + completar Justificativa", campo: "justif_apac" },
            { motivo: "Hemograma ausente", acao: "exames_resumo", label: "Completar Exames Complementares", campo: "exames_resumo" },
            { motivo: "Código do procedimento", acao: "cod_proc", label: "Corrigir Código SIGTAP", campo: "cod_proc" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 9px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: 10, color: "#64748B", flex: 1 }}>{item.label}</span>
              <button onClick={() => onEditarCampo(item.campo)} style={{ ...sc.btn("teal", { fontSize: 10, padding: "3px 9px" }) }}>
                ✏️ Corrigir
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Observação da correção */}
      <div style={sc.card()}>
        <H3 ch="📝 Observação sobre a correção"/>
        <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} placeholder="Descreva as correções realizadas para o Financeiro..." style={{ ...sc.inp, resize: "vertical", marginBottom: 9 }}/>
        <button onClick={reenviar} style={{ ...sc.btn("gold", { width: "100%", padding: 11, fontSize: 13, fontWeight: 900 }) }}>
          📤 Corrigido — Reenviar ao Financeiro
        </button>
        {!todosCorrigidos && motivos.length > 0 && (
          <p style={{ textAlign: "center", color: AM, fontSize: 11, marginTop: 5 }}>
            ⚠️ Marque todos os itens como corrigidos antes de reenviar
          </p>
        )}
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   HISTÓRICO DA APAC
══════════════════════════════════════════════════════════════════ */
function HistoricoAPAC({ apac }) {
  const hist = apac?.historico || [];
  return (
    <div style={sc.card()}>
      <H2 ch="📋 Histórico da APAC"/>
      {hist.length === 0
        ? <p style={{ color: "#94A3B8", fontSize: 12 }}>Nenhuma movimentação registrada.</p>
        : <div style={{ display: "grid", gap: 0, position: "relative" }}>
            <div style={{ position: "absolute", left: 10, top: 0, bottom: 0, width: 2, background: "#E2E8F0" }}/>
            {hist.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 14, position: "relative" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: N, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 9, color: "#fff", zIndex: 1, marginTop: 2 }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, color: N, fontSize: 12 }}>{h.acao}</div>
                  <div style={{ fontSize: 10, color: "#64748B" }}>{h.por} · {h.dt}</div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   DASHBOARD WIDGET — Pendências APAC (para o Dashboard principal)
   Integrar: exibir no dashboard/landing com as APACs pendentes
══════════════════════════════════════════════════════════════════ */
export function APACDashboardWidget({ apacs, onAbrir }) {
  const pendentes = (apacs || []).filter(a => a.status === "enviada" || a.status === "reprovada");
  const aprovadas = (apacs || []).filter(a => a.status === "aprovada");
  const rascunhos = (apacs || []).filter(a => a.status === "rascunho");

  if (!apacs?.length) return null;

  return (
    <div style={sc.card({ border: `1px solid ${pendentes.some(a => a.status === "reprovada") ? VM : G}44` })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <H3 ch="📄 APAC — Painel" s={{ margin: 0 }}/>
        <div style={{ display: "flex", gap: 5 }}>
          {[["rascunho", "#64748B", rascunhos.length], ["enviada", AM, pendentes.filter(a => a.status === "enviada").length], ["reprovada", VM, pendentes.filter(a => a.status === "reprovada").length], ["aprovada", VE, aprovadas.length]].map(([st, c, n]) => n > 0 && (
            <span key={st} style={{ background: c + "22", color: c, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 900 }}>
              {STATUS[st]?.ico} {n}
            </span>
          ))}
        </div>
      </div>

      {pendentes.filter(a => a.status === "reprovada").map(a => (
        <div key={a.id} style={{ display: "flex", gap: 9, alignItems: "center", border: `2px solid ${VM}44`, borderRadius: 9, padding: "8px 11px", marginBottom: 6, background: "#FFF5F5", cursor: "pointer" }} onClick={() => onAbrir && onAbrir(a)}>
          <span style={{ fontSize: 18 }}>❌</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: N, fontSize: 12 }}>{a.campos?.nome}</strong>
            <div style={{ fontSize: 10, color: VM, fontWeight: 700 }}>APAC reprovada — corrigir e reenviar</div>
            <div style={{ fontSize: 9, color: "#94A3B8" }}>{a.motivosGlosa?.[0] || "Ver antiglosa"}</div>
          </div>
          <button style={{ ...sc.btn("warn", { fontSize: 10, padding: "4px 9px" }) }}>Corrigir →</button>
        </div>
      ))}

      {pendentes.filter(a => a.status === "enviada").map(a => (
        <div key={a.id} style={{ display: "flex", gap: 9, alignItems: "center", border: `1px solid ${AM}44`, borderRadius: 9, padding: "8px 11px", marginBottom: 5, background: "#FFFBEB" }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: N, fontSize: 12 }}>{a.campos?.nome}</strong>
            <div style={{ fontSize: 10, color: AM }}>Aguardando análise do Financeiro</div>
            <div style={{ fontSize: 9, color: "#94A3B8" }}>Enviada em {a.dataEnvio}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   INSTRUÇÕES PARA CLAUDE CODE
══════════════════════════════════════════════════════════════════
COMANDO (copiar e colar no Claude Code):

"Integre src/components/APACSystem.jsx ao App.jsx:

1. ESTADO GLOBAL — adicionar no App():
   const [apacs, setApacs] = useState([])

2. MÓDULO MÉDICO — tab 'apac':
   Importar: import { APACSystem } from './components/APACSystem.jsx'
   No switch medTab: case 'apac':
     return <APACSystem pac={pac} up={up} addMsg={addMsg} apacs={apacs} setApacs={setApacs}/>

3. DASHBOARD / LANDING — pendências:
   Importar: import { APACDashboardWidget } from './components/APACSystem.jsx'
   Na landing page, abaixo dos cards de navegação:
   <APACDashboardWidget apacs={apacs} onAbrir={(a) => { setPg('medico'); setMedTab('apac'); }}/>

4. MENU MÉDICO — garantir que tab 'apac' existe:
   Adicionar em ABAS_M: ['apac', '📄 APAC SUS']

5. NOTIFICAÇÕES — quando addMsg receber tipo 'apac':
   Se msg.de === 'Financeiro' e msg.para === 'Médico':
     Mostrar badge de notificação no ícone APAC do menu médico
     Se conteúdo inclui 'reprovada': incrementar contador de alertas no dashboard

6. AUTO-PREENCHIMENTO — quando médico preenche prontuário:
   Os dados já são passados via prop 'pac' e preenchidos automaticamente
   Adicionar ao up() no App: sincronizar campos novos (exames_resumo, justif_apac, cod_proc)

CAMPOS ESPECIAIS — adicionar ao estado PAC0:
  cod_proc: '0304010072',   // código SIGTAP padrão
  cid_sec: '',
  cid_causas: '',
  exames_resumo: '',
  justif_apac: '',
  validade_apac: '',
  sexo: '',
  raca: '',
  endereco: '',
  municipio_cod: '2512903', // Patos-PB
  cep: '58700-000',
  pacID: '',
  data_sol: '',
"
*/
