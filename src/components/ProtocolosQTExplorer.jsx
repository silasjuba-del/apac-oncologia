import React, { useMemo, useState } from "react";
import { PROTOCOLOS_SEED } from "../data/protocolos-seed.ts";
import {
  calcularBSA,
  calcularDosesProtocolo,
  gerarFasesParaCiclo,
  gerarPreMedicações,
  normalizarParaBusca,
  resolverFaseDoCiclo,
  validarDadosPaciente,
} from "../utils/protocolo-utils.ts";

const C = {
  navy: "#1B365D",
  teal: "#2B7A8C",
  gold: "#B8860B",
  green: "#15803D",
  red: "#B91C1C",
  gray: "#64748B",
  line: "#DDE3EC",
  bg: "#F5F7FA",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1.5px solid #CBD5E1",
  borderRadius: 10,
  padding: "9px 11px",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  color: C.navy,
  background: "#fff",
};

const baseSoro = [
  { grupo: "Soro / via", droga: "SF 0,9%", dose: "250 mL", via: "EV", timing: "Manter acesso venoso e lavar equipo antes/depois da QT", obrigatório: true },
];

function Badge({ children, tone = "navy" }) {
  const map = {
    navy: [C.navy, "#EBF2FF"],
    teal: [C.teal, "#EAF7FA"],
    gold: [C.gold, "#FDF8EE"],
    green: [C.green, "#ECFDF5"],
    red: [C.red, "#FEF2F2"],
  };
  const [fg, bg] = map[tone] || map.navy;
  return (
    <span style={{ background: bg, color: fg, border: `1px solid ${fg}22`, borderRadius: 999, padding: "3px 8px", fontSize: 10, fontWeight: 900 }}>
      {children}
    </span>
  );
}

function dataCurta() {
  return new Date().toLocaleDateString("pt-BR").replaceAll("/", "-");
}

function normalizarPremeds(grupos) {
  return grupos.flatMap((grupo) => [
    { tipo: "titulo", texto: grupo.título },
    ...(grupo.itens || []).map((item) => ({
      tipo: "item",
      grupo: grupo.título,
      droga: item.droga,
      dose: item.dose,
      via: item.via,
      timing: item.timing,
      obrigatório: item.obrigatório,
    })),
    ...(grupo.outrasObservações || []).map((obs) => ({ tipo: "obs", grupo: grupo.título, texto: obs })),
  ]);
}

function textoPrescricao({ protocolo, pac, bsa, cicloAtual, faseAtiva, resultados, premeds, reducao }) {
  const data = dataCurta();
  const faseNome = faseAtiva?.fase?.nome || protocolo.fases?.[0]?.nome || protocolo.nome;
  const linhasPremed = [...baseSoro, ...premeds.filter((p) => p.tipo === "item")];
  const linhasObs = premeds.filter((p) => p.tipo === "obs");

  return [
    "PRESCRICAO QT - VALIDACAO MEDICA",
    `Paciente: ${pac?.nome || "Paciente nao identificado"}`,
    `Protocolo: ${protocolo.nome}`,
    `Indicacao: ${protocolo.tipoCâncer} | ${protocolo.contexto || "contexto nao informado"}`,
    `Ciclo: C${cicloAtual} | Fase: ${faseNome} | Data: ${data} | SC: ${bsa.toFixed(2)} m2`,
    reducao ? `Modificacao: reducao de ${reducao}% na droga selecionada para este ciclo.` : "Modificacao: dose plena.",
    "",
    "SORO / PRE-MEDICACAO",
    ...linhasPremed.map((p) => `- ${p.droga} ${p.dose} ${p.via} | ${p.timing}${p.obrigatório ? " | obrigatorio" : ""}`),
    "",
    "QUIMIOTERAPIA",
    ...resultados.map((r) => `- ${r.droga}: ${r.dosePrescrita} -> ${r.doseAbsolutaArredondada} mg | ${r.metodoCalculo}${r.alertaCalculo ? ` | ${r.alertaCalculo}` : ""}`),
    "",
    "ORIENTACOES / OBSERVACOES",
    ...(linhasObs.length ? linhasObs.map((o) => `- ${o.texto}`) : ["- Conferir exames, alergias, peso, altura, funcao renal e liberacao medica antes da infusao."]),
  ].join("\n");
}

function sigtapPorProtocolo(nome) {
  const n = (nome || '').toLowerCase();
  const MAP = [
    [['folfox'], '03.04.02.025-0'],
    [['folfiri'], '03.04.02.026-8'],
    [['capecitabina', 'xelox', 'cape'], '03.04.02.027-6'],
    [['irinotecano 180'], '03.04.02.028-4'],
    [['ac ', 'act', 'ac-t'], '03.04.02.014-4'],
    [['paclitaxel'], '03.04.02.019-5'],
    [['docetaxel'], '03.04.02.020-9'],
    [['carboplatina + paclitaxel', 'carbo + pacli'], '03.04.02.030-6'],
    [['carboplatina + pemetrexede'], '03.04.02.031-4'],
    [['carboplatina + etoposideo', 'carbo + etopo'], '03.04.02.032-2'],
    [['anastrozol'], '03.04.01.001-0'],
    [['tamoxifeno'], '03.04.01.002-9'],
    [['letrozol'], '03.04.01.003-7'],
    [['flot'], '03.04.02.060-8'],
    [['gemox', 'gemcitabina + oxali'], '03.04.02.065-9'],
    [['cisplatina semanal', 'cisplatina 40'], '03.04.02.050-0'],
  ];
  for (const [keys, cod] of MAP) {
    if (keys.some(k => n.includes(k))) return cod;
  }
  return '03.04.02.099-9';
}

export default function ProtocolosQTExplorer({ pac, addMsg, up, historicoQT = [], setHistoricoQT }) {
  const [sitio, setSitio] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [protocoloId, setProtocoloId] = useState(PROTOCOLOS_SEED[0]?.id || "");
  const [cicloAtual, setCicloAtual] = useState(1);
  const [dados, setDados] = useState({
    alturaCm: Number(pac?.altura) || 165,
    pesoKg: Number(pac?.peso) || 70,
    creatininaMgDl: Number(pac?.creatinina) || 0.9,
    idadeAnos: Number(pac?.idade) || 60,
    sexo: pac?.sexo === "M" ? "M" : "F",
  });
  const [reducao, setReducao] = useState(0);
  const [drogaReducao, setDrogaReducao] = useState("0:0");
  const [prescricao, setPrescricao] = useState(null);
  const [paginaFinal, setPaginaFinal] = useState(false);
  const [enviadoFarmacia, setEnviadoFarmacia] = useState(false);
  const [registradoConduta, setRegistradoConduta] = useState(false);
  const [premedOverrides, setPremedOverrides] = useState({});
  const [premedEditando, setPremedEditando] = useState(null);
  const [ciclosLib, setCiclosLib] = useState(null);

  const sitios = useMemo(() => ["Todos", ...Array.from(new Set(PROTOCOLOS_SEED.map((p) => p.tipoCâncer))).sort()], []);

  const protocolos = useMemo(() => {
    const q = normalizarParaBusca(busca.trim());
    return PROTOCOLOS_SEED.filter((p) => {
      const drogas = p.fases.flatMap((f) => f.drogas.map((d) => d.nome)).join(" ");
      const alvoFarmaco = normalizarParaBusca([p.nome, drogas].join(" "));
      const alvoCompleto = normalizarParaBusca([p.nome, p.tipoCâncer, p.contexto, p.trialReferência, p.statusHER2, p.statusHR, drogas].filter(Boolean).join(" "));

      if (q) return alvoFarmaco.includes(q) || alvoCompleto.includes(q);
      return sitio === "Todos" || p.tipoCâncer === sitio;
    });
  }, [busca, sitio]);

  const protocolo = useMemo(
    () => protocolos.find((p) => p.id === protocoloId) || protocolos[0] || PROTOCOLOS_SEED.find((p) => p.id === protocoloId) || PROTOCOLOS_SEED[0],
    [protocoloId, protocolos],
  );

  const modificacoes = useMemo(() => {
    if (!protocolo || !reducao) return [];
    const [faseIndex, drogaIndex] = drogaReducao.split(":").map(Number);
    return [{
      id: "preview-reducao",
      tipo: "redução_dose",
      faseIndex: Number.isFinite(faseIndex) ? faseIndex : 0,
      drogaIndex: Number.isFinite(drogaIndex) ? drogaIndex : 0,
      drogaNome: protocolo.fases?.[faseIndex || 0]?.drogas?.[drogaIndex || 0]?.nome || "Droga",
      percentualReducao: reducao,
      escopo: "ciclo_atual",
      cicloReferencia: cicloAtual,
      justificativa: "Previa de reducao para conferencia",
      criadoEm: new Date().toISOString(),
    }];
  }, [cicloAtual, drogaReducao, protocolo, reducao]);

  const faseAtiva = useMemo(() => protocolo ? resolverFaseDoCiclo(protocolo, cicloAtual) : null, [protocolo, cicloAtual]);
  const fases = useMemo(() => protocolo ? gerarFasesParaCiclo(protocolo, cicloAtual, modificacoes) : [], [cicloAtual, modificacoes, protocolo]);
  const alertas = useMemo(() => validarDadosPaciente(dados), [dados]);
  const resultados = useMemo(() => protocolo ? calcularDosesProtocolo(fases, dados, cicloAtual, faseAtiva || undefined) : [], [cicloAtual, dados, faseAtiva, fases, protocolo]);
  const premeds = useMemo(() => protocolo ? normalizarPremeds(gerarPreMedicações(protocolo)) : [], [protocolo]);
  const premedsFinal = useMemo(() =>
    premeds.map((p, i) => {
      if (p.tipo !== "item") return p;
      const key = `${p.droga}__${i}`;
      const ovr = premedOverrides[key] || {};
      return { ...p, dose: ovr.dose ?? p.dose, via: ovr.via ?? p.via, _ativo: ovr.ativo !== false };
    }).filter((p) => p.tipo !== "item" || p._ativo !== false),
  [premeds, premedOverrides]);
  const bsa = useMemo(() => calcularBSA(Number(dados.alturaCm) || 0, Number(dados.pesoKg) || 0), [dados.alturaCm, dados.pesoKg]);

  const opcoesDrogas = useMemo(() => {
    if (!protocolo) return [];
    return protocolo.fases.flatMap((fase, faseIndex) => fase.drogas.map((droga, drogaIndex) => ({
      id: `${faseIndex}:${drogaIndex}`,
      fase: fase.nome,
      nome: droga.nome,
      dose: `${droga.dose} ${droga.unidade}`,
      dias: droga.dias,
    })));
  }, [protocolo]);

  const selecionarProtocolo = (id) => {
    setProtocoloId(id);
    setCicloAtual(1);
    setReducao(0);
    setDrogaReducao("0:0");
    setPrescricao(null);
    setPaginaFinal(false);
    setEnviadoFarmacia(false);
    setRegistradoConduta(false);
    setPremedOverrides({});
    setPremedEditando(null);
    setCiclosLib(null);
  };

  const gerarPrescricao = () => {
    if (!protocolo || resultados.length === 0) {
      alert("Nao ha drogas calculadas para este ciclo/fase.");
      return;
    }
    const texto = textoPrescricao({ protocolo, pac, bsa, cicloAtual, faseAtiva, resultados, premeds: premedsFinal, reducao });
    const nova = {
      id: Date.now(),
      data: dataCurta(),
      protocolo: protocolo.nome,
      indicacao: `${protocolo.tipoCâncer} | ${protocolo.contexto || ""}`.trim(),
      ciclo: `C${cicloAtual}`,
      fase: faseAtiva?.fase?.nome || protocolo.fases?.[0]?.nome || protocolo.nome,
      texto,
      resultados,
      premeds: [...baseSoro, ...premedsFinal.filter((p) => p.tipo === "item")],
      ciclosLiberados: ciclosLib,
    };
    setPrescricao(nova);
    setPaginaFinal(true);
    setEnviadoFarmacia(false);
    setRegistradoConduta(false);
  };

  const confirmarFarmacia = () => {
    if (!prescricao || enviadoFarmacia) return;
    addMsg?.("Médico", "Farmácia", `Prescrição para validação/liberação: ${prescricao.protocolo} ${prescricao.ciclo} - ${pac?.nome || "paciente"}.`, "ciclo");
    setEnviadoFarmacia(true);
  };

  const confirmarTimelineConduta = () => {
    if (!prescricao || registradoConduta) return;
    const textoConduta = `Iniciado ${prescricao.ciclo} de ${prescricao.protocolo} na data ${prescricao.data}. Prescrição QT validada em rascunho, com pré-medicação e soro incluídos.`;
    const eventoQT = {
      id: prescricao.id,
      data: prescricao.data,
      ciclo: prescricao.ciclo,
      protocolo: prescricao.protocolo,
      fase: prescricao.fase,
      pacID: pac?.pacID || "",
      pacNome: pac?.nome || "",
      status: "prescricao_validada",
      prescricao: prescricao.texto,
    };
    setHistoricoQT?.([eventoQT, ...(historicoQT || [])]);
    // Auto-fill SIGTAP na APAC
    const sigtapCod = sigtapPorProtocolo(prescricao.protocolo);
    up?.("cod_proc", sigtapCod);
    up?.("trat", prescricao.protocolo);
    up?.("procedimento_sigtap", sigtapCod);
    if (!pac?.linha) up?.("linha", prescricao.fase || "1ª linha");
    addMsg?.("Médico", "APAC", `SIGTAP preenchido automaticamente: ${sigtapCod} — ${prescricao.protocolo}. Verifique na aba APAC.`, "msg");
    const evolucao = {
      id: Date.now() + 1,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      tipo: "Conduta médica",
      texto: textoConduta,
      autor: "Dr. Silas Negrão - CRM-PB 17341",
      fonte: "protocolo_qt_v45",
    };
    up?.("evolucoes", [evolucao, ...(pac?.evolucoes || [])]);
    addMsg?.("Médico", "Equipe", textoConduta, "msg");
    setRegistradoConduta(true);
  };

  const concluir = () => {
    confirmarFarmacia();
    confirmarTimelineConduta();
  };

  const liberarProximoCiclo = () => {
    confirmarFarmacia();
    confirmarTimelineConduta();
    const max = protocolo?.totalCiclos && protocolo.totalCiclos > 0 ? protocolo.totalCiclos : 99;
    setCicloAtual((v) => Math.min(max, v + 1));
    setPrescricao(null);
    setPaginaFinal(false);
    setEnviadoFarmacia(false);
    setRegistradoConduta(false);
  };

  if (!protocolo) return <div style={{ padding: 20, color: C.gray }}>Nenhum protocolo carregado.</div>;

  if (paginaFinal && prescricao) {
    return (
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ background: "#fff", border: `2px solid ${C.gold}55`, borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: C.gold, fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: 0.8 }}>Página final</div>
              <h2 style={{ margin: "3px 0 4px", color: C.navy, fontSize: 21, fontWeight: 950 }}>Resumo da prescrição para validação</h2>
              <div style={{ color: C.gray, fontSize: 12 }}>Revise e modifique se desejar. Ao concluir, a farmácia recebe e a conduta entra na timeline/evolução.</div>
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              <Badge tone={enviadoFarmacia ? "green" : "gold"}>{enviadoFarmacia ? "farmácia enviada" : "pendente farmácia"}</Badge>
              <Badge tone={registradoConduta ? "green" : "gold"}>{registradoConduta ? "conduta registrada" : "pendente conduta"}</Badge>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <Badge tone="navy">{prescricao.protocolo}</Badge>
            <Badge tone="teal">{prescricao.ciclo}</Badge>
            <Badge tone="gold">{prescricao.indicacao}</Badge>
          </div>

          <textarea
            value={prescricao.texto}
            onChange={(e) => setPrescricao((p) => ({ ...p, texto: e.target.value }))}
            rows={22}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "Consolas, Courier New, monospace", lineHeight: 1.55, fontSize: 12 }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10, marginTop: 10 }}>
            <button onClick={confirmarFarmacia} style={{ background: enviadoFarmacia ? C.green : C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "11px 12px", fontWeight: 950, cursor: "pointer" }}>
              {enviadoFarmacia ? "Enviado à farmácia" : "Confirmar envio à farmácia"}
            </button>
            <button onClick={confirmarTimelineConduta} style={{ background: registradoConduta ? C.green : C.gold, color: "#fff", border: "none", borderRadius: 10, padding: "11px 12px", fontWeight: 950, cursor: "pointer" }}>
              {registradoConduta ? "Timeline e evolução OK" : "Confirmar timeline + evolução"}
            </button>
            <button onClick={concluir} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "11px 12px", fontWeight: 950, cursor: "pointer" }}>
              Concluir
            </button>
            <button onClick={liberarProximoCiclo} style={{ background: C.teal, color: "#fff", border: "none", borderRadius: 10, padding: "11px 12px", fontWeight: 950, cursor: "pointer" }}>
              Liberar próximo ciclo
            </button>
          </div>

          <button onClick={() => setPaginaFinal(false)} style={{ marginTop: 10, background: "#fff", color: C.navy, border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", fontWeight: 900, cursor: "pointer" }}>
            Voltar para editar protocolo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: 0.8 }}>Motor de protocolos v4.5</div>
            <h2 style={{ margin: "3px 0 4px", color: C.navy, fontSize: 21, fontWeight: 950 }}>Protocolos por sítio ou por fármaco</h2>
            <div style={{ color: C.gray, fontSize: 12 }}>Clique no sítio para filtrar por órgão. Digite um fármaco para listar todos os protocolos que o contêm.</div>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <Badge tone="green">{protocolos.length} protocolo{protocolos.length === 1 ? "" : "s"}</Badge>
            <Badge tone="teal">SC {bsa.toFixed(2)} m2</Badge>
            <Badge tone={alertas.some((a) => a.nivel === "erro") ? "red" : "gold"}>{alertas.length || "sem"} alerta(s)</Badge>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sitios.map((s) => (
              <button key={s} onClick={() => { setSitio(s); setBusca(""); setPrescricao(null); }} style={{
                border: `1.5px solid ${sitio === s ? C.gold : C.line}`,
                background: sitio === s ? "#FDF8EE" : "#fff",
                color: sitio === s ? C.gold : C.navy,
                borderRadius: 999,
                padding: "7px 11px",
                fontSize: 11,
                fontWeight: 950,
                cursor: "pointer",
                fontFamily: "inherit",
              }}>{s}</button>
            ))}
          </div>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar fármaco ou protocolo: cisplatina, paclitaxel, AC, FOLFOX..." style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, .9fr) minmax(360px, 1.4fr)", gap: 14, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
            <h3 style={{ margin: "0 0 8px", color: C.navy, fontSize: 15 }}>Protocolos disponíveis</h3>
            <div style={{ color: C.gray, fontSize: 11, marginBottom: 8 }}>
              {busca ? `Busca livre/fármaco: ${busca}` : `Sítio: ${sitio}`}
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto", display: "grid", gap: 7, paddingRight: 4 }}>
              {protocolos.map((p) => {
                const ativo = p.id === protocolo.id;
                return (
                  <button key={p.id} onClick={() => selecionarProtocolo(p.id)} style={{
                    textAlign: "left",
                    border: `1.5px solid ${ativo ? C.gold : C.line}`,
                    background: ativo ? "#FDF8EE" : "#fff",
                    borderRadius: 10,
                    padding: "9px 10px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}>
                    <div style={{ color: ativo ? C.gold : C.navy, fontWeight: 950, fontSize: 12 }}>{p.nome}</div>
                    <div style={{ color: C.gray, fontSize: 10, marginTop: 2 }}>{p.tipoCâncer} · {p.contexto || "sem contexto"} · {p.trialReferência || "sem trial"}</div>
                  </button>
                );
              })}
              {protocolos.length === 0 && <div style={{ color: C.gray, fontSize: 12, padding: 12, textAlign: "center" }}>Nenhum protocolo encontrado.</div>}
            </div>
          </div>

          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
            <h3 style={{ margin: "0 0 8px", color: C.navy, fontSize: 15 }}>Dados para cálculo</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 900, color: C.navy }}>Altura cm<input type="number" value={dados.alturaCm} onChange={(e) => setDados((d) => ({ ...d, alturaCm: Number(e.target.value) }))} style={{ ...inputStyle, marginTop: 3 }} /></label>
              <label style={{ fontSize: 11, fontWeight: 900, color: C.navy }}>Peso kg<input type="number" value={dados.pesoKg} onChange={(e) => setDados((d) => ({ ...d, pesoKg: Number(e.target.value) }))} style={{ ...inputStyle, marginTop: 3 }} /></label>
              <label style={{ fontSize: 11, fontWeight: 900, color: C.navy }}>Creatinina<input type="number" step="0.1" value={dados.creatininaMgDl} onChange={(e) => setDados((d) => ({ ...d, creatininaMgDl: Number(e.target.value) }))} style={{ ...inputStyle, marginTop: 3 }} /></label>
              <label style={{ fontSize: 11, fontWeight: 900, color: C.navy }}>Idade<input type="number" value={dados.idadeAnos} onChange={(e) => setDados((d) => ({ ...d, idadeAnos: Number(e.target.value) }))} style={{ ...inputStyle, marginTop: 3 }} /></label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {["F", "M"].map((sexo) => <button key={sexo} onClick={() => setDados((d) => ({ ...d, sexo }))} style={{ flex: 1, border: "none", borderRadius: 9, padding: 9, background: dados.sexo === sexo ? C.navy : C.bg, color: dados.sexo === sexo ? "#fff" : C.navy, fontWeight: 900, cursor: "pointer" }}>{sexo === "F" ? "Feminino" : "Masculino"}</button>)}
            </div>
          </div>

          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
            <h3 style={{ margin: "0 0 8px", color: C.navy, fontSize: 15 }}>Ajuste opcional</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <button onClick={() => setCicloAtual((v) => Math.max(1, v - 1))} style={{ width: 36, height: 36, border: `1px solid ${C.line}`, borderRadius: 9, background: "#fff", cursor: "pointer" }}>-</button>
              <div style={{ flex: 1, textAlign: "center", background: C.bg, borderRadius: 9, padding: 8, color: C.navy, fontWeight: 950 }}>Ciclo {cicloAtual}</div>
              <button onClick={() => setCicloAtual((v) => Math.min(protocolo.totalCiclos && protocolo.totalCiclos > 0 ? protocolo.totalCiclos : 99, v + 1))} style={{ width: 36, height: 36, border: `1px solid ${C.line}`, borderRadius: 9, background: "#fff", cursor: "pointer" }}>+</button>
            </div>
            <div style={{ maxHeight: 160, overflowY: "auto", display: "grid", gap: 6, marginBottom: 8 }}>
              {opcoesDrogas.map((o) => {
                const ativo = drogaReducao === o.id;
                return (
                  <button key={o.id} onClick={() => setDrogaReducao(o.id)} style={{
                    textAlign: "left",
                    border: `1.5px solid ${ativo ? C.teal : C.line}`,
                    background: ativo ? "#EAF7FA" : "#fff",
                    borderRadius: 9,
                    padding: "7px 9px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}>
                    <div style={{ color: ativo ? C.teal : C.navy, fontWeight: 950, fontSize: 12 }}>{o.nome}</div>
                    <div style={{ color: C.gray, fontSize: 10 }}>{o.fase} · {o.dose} · {o.dias || "D1"}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {[0, 15, 20, 25].map((pct) => <button key={pct} onClick={() => setReducao(pct)} style={{ border: `1.5px solid ${reducao === pct ? C.gold : C.line}`, borderRadius: 9, padding: "8px 4px", background: reducao === pct ? "#FDF8EE" : "#fff", color: reducao === pct ? C.gold : C.gray, fontWeight: 900, cursor: "pointer" }}>{pct === 0 ? "Plena" : `-${pct}%`}</button>)}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
              <div>
                <h3 style={{ margin: 0, color: C.navy, fontSize: 18 }}>{protocolo.nome}</h3>
                <div style={{ color: C.gray, fontSize: 12, marginTop: 3 }}>Indicação: {protocolo.tipoCâncer} · {protocolo.contexto} · {protocolo.trialReferência || "sem trial informado"}</div>
              </div>
              <button onClick={gerarPrescricao} style={{ background: C.gold, color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 950, cursor: "pointer" }}>Gerar prescrição</button>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              <Badge tone="teal">Fase ativa: {faseAtiva?.fase?.nome || "não definida"}</Badge>
              <Badge tone="navy">Ciclo da fase: {faseAtiva?.cicloDentroDaFase || cicloAtual}</Badge>
              <Badge tone="gold">{protocolo.potencialEmetogênico}</Badge>
              <Badge tone={protocolo.riscoAnafilático === "Alto" ? "red" : "green"}>Anafilaxia: {protocolo.riscoAnafilático}</Badge>
            </div>

            {alertas.length > 0 && <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>{alertas.map((a, i) => <div key={i} style={{ background: a.nivel === "erro" ? "#FEF2F2" : "#FFF7ED", border: `1px solid ${a.nivel === "erro" ? C.red : "#FDBA74"}`, borderRadius: 9, padding: "7px 9px", color: a.nivel === "erro" ? C.red : "#9A3412", fontSize: 12, fontWeight: 800 }}>{a.mensagem}</div>)}</div>}

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: C.bg }}>{["Droga", "Prescrita", "Dose final", "Método", "Observação"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 9px", color: C.navy, fontSize: 11 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {resultados.map((r, i) => <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "9px", fontWeight: 900, color: C.navy }}>{r.droga}</td>
                    <td style={{ padding: "9px", color: C.gray }}>{r.dosePrescrita}</td>
                    <td style={{ padding: "9px", color: r.metodoCalculo === "retirada" ? C.red : C.green, fontWeight: 950 }}>{r.doseAbsolutaArredondada} mg</td>
                    <td style={{ padding: "9px", color: C.teal, fontWeight: 800 }}>{r.metodoCalculo}</td>
                    <td style={{ padding: "9px", color: C.gray }}>{r.alertaCalculo || r.observacao || "-"}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginTop: 14 }}>
              {/* Pre-medicação editável */}
              <div style={{ background: C.bg, borderRadius: 12, padding: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ color: C.navy, fontSize: 12 }}>Pré-medicação</strong>
                  <span style={{ color: C.gray, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: .4 }}>✏ clique para editar · ✕ desativar</span>
                </div>
                <div style={{ display: "grid", gap: 5 }}>
                  {[...baseSoro, ...premeds.filter((p) => p.tipo === "item")].map((p, i) => {
                    const key = `${p.droga}__${i}`;
                    const ovr = premedOverrides[key] || {};
                    const ativo = ovr.ativo !== false;
                    const dose = ovr.dose ?? p.dose;
                    const via = ovr.via ?? p.via;
                    const editando = premedEditando === key;
                    const isBase = i < baseSoro.length;
                    return (
                      <div key={key} style={{ background: ativo ? "#fff" : "#F8FAFC", border: `1px solid ${ativo ? C.line : "#CBD5E1"}`, borderRadius: 9, padding: "6px 8px", fontSize: 12, opacity: ativo ? 1 : 0.5, transition: "all .15s" }}>
                        {editando ? (
                          <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                            <b style={{ color: C.navy, minWidth: 80, fontSize: 11 }}>{p.droga}</b>
                            <input value={dose} onChange={e => setPremedOverrides(o => ({ ...o, [key]: { ...o[key], dose: e.target.value } }))}
                              placeholder="Dose" style={{ width: 70, border: "1px solid #CBD5E1", borderRadius: 6, padding: "2px 5px", fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                            <input value={via} onChange={e => setPremedOverrides(o => ({ ...o, [key]: { ...o[key], via: e.target.value } }))}
                              placeholder="Via" style={{ width: 40, border: "1px solid #CBD5E1", borderRadius: 6, padding: "2px 5px", fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                            <button onClick={() => setPremedEditando(null)} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 10, cursor: "pointer", fontWeight: 900 }}>✓</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <b style={{ color: C.navy }}>{p.droga}</b>
                              <span style={{ color: C.gray }}> · {dose} · {via}</span>
                              {p.obrigatório && <span style={{ color: C.teal, fontSize: 9, fontWeight: 900, marginLeft: 4 }}>●</span>}
                            </div>
                            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                              <button onClick={() => { setPremedEditando(key); setPremedOverrides(o => ({ ...o, [key]: { dose, via, ativo, ...(o[key] || {}) } })); }}
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.teal, lineHeight: 1, padding: "1px 3px" }} title="Editar">✏</button>
                              {!isBase && (
                                <button onClick={() => setPremedOverrides(o => ({ ...o, [key]: { ...o[key], ativo: !ativo } }))}
                                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: ativo ? C.red : C.green, lineHeight: 1, padding: "1px 3px" }} title={ativo ? "Desativar" : "Ativar"}>
                                  {ativo ? "✕" : "+"}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Observações dos premeds */}
                {premeds.filter(p => p.tipo === "obs").length > 0 && (
                  <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                    {premeds.filter(p => p.tipo === "obs").map((p, i) => (
                      <div key={i} style={{ fontSize: 10, color: C.gray, fontStyle: "italic", paddingLeft: 6, borderLeft: `2px solid ${C.line}` }}>{p.texto}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fases do protocolo */}
              <div style={{ background: C.bg, borderRadius: 12, padding: 11 }}>
                <strong style={{ color: C.navy, fontSize: 12 }}>Fases do protocolo</strong>
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  {fases.map((f) => <div key={f.nome} style={{ background: f.ativaNoCiclo ? "#ECFDF5" : "#fff", border: `1px solid ${f.ativaNoCiclo ? C.green : C.line}`, borderRadius: 9, padding: "7px 9px", fontSize: 12 }}>
                    <b style={{ color: f.ativaNoCiclo ? C.green : C.navy }}>{f.nome}</b>
                    <span style={{ color: C.gray }}> · ciclos {f.cicloInicioFase}{f.cicloFimFase === -1 ? "+" : `-${f.cicloFimFase}`}</span>
                  </div>)}
                </div>

                {/* ── Liberar Ciclos ── */}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <strong style={{ color: C.navy, fontSize: 12 }}>📅 Liberar Ciclos</strong>
                    {ciclosLib && (
                      <span style={{ background: "#ECFDF5", color: C.green, border: `1px solid ${C.green}33`, borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 900 }}>
                        ✅ {ciclosLib} ciclos
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {["3-4", "4", "6", "8", "10", "12"].map(op => (
                      <button key={op} onClick={() => setCiclosLib(ciclosLib === op ? null : op)} style={{
                        border: `1.5px solid ${ciclosLib === op ? C.green : C.line}`,
                        background: ciclosLib === op ? "#ECFDF5" : "#fff",
                        color: ciclosLib === op ? C.green : C.navy,
                        borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 800,
                        cursor: "pointer", fontFamily: "inherit", transition: "all .12s",
                      }}>{op}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
