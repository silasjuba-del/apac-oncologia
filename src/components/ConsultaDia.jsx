// src/components/ConsultaDia.jsx
// Fluxo: Recepção → Médico completa → Conclui → Timeline
// PATCH v2 — C5d: polling de análise Claude via usePollingAnalise
import { useState, useCallback } from "react";
import { usePollingAnalise } from "../utils/usePollingAnalise.js";

const N="#1B365D",T="#2B7A8C",G="#B8860B",VE="#15803D",VM="#B91C1C",AM="#B45309";

const CAMPOS_CLINICOS = [
  { k:"diag",     l:"Diagnóstico *",         ph:"Ex: Adenocarcinoma de pulmão...",  req:true },
  { k:"cid",      l:"CID-10",                ph:"C34.1" },
  { k:"tnm",      l:"TNM",                   ph:"cT3N1M0" },
  { k:"estadio",  l:"Estádio",               ph:"IV" },
  { k:"ecog",     l:"ECOG",                  ph:"0–4" },
  { k:"trat",     l:"Tratamento proposto",   ph:"Ex: mFOLFOX6..." },
  { k:"linha",    l:"Linha de tratamento",   ph:"1ª linha paliativa" },
  { k:"intencao", l:"Intenção",              ph:"Paliativa / Curativa / Neoadj." },
];

export default function ConsultaDia({ pac, up, addMsg, onConcluir }) {
  const [evolucao, setEvolucao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [analiseStatus, setAnaliseStatus] = useState(pac?._analise_status || null);

  // C5d: polling — só ativo quando backend estiver configurado e análise em curso
  const pacienteIdBackend = pac?._backend_id || null;   // id SQLite do backend, se houver
  const onConcluida = useCallback((dados) => {
    if (dados?.resumoEvolucao) setEvolucao(dados.resumoEvolucao);
    setAnaliseStatus("concluida");
  }, []);
  const onErro = useCallback((msg) => {
    setAnaliseStatus("erro");
    setEvolucao(prev => prev || `⚠ ${msg}\n\nEscreva a evolução manualmente.`);
  }, []);

  usePollingAnalise({
    pacienteId:    pacienteIdBackend,
    analiseStatus: analiseStatus || pac?._analise_status,
    onConcluida,
    onErro,
  });
  const [concluido, setConcluido] = useState(false);
  const [aba, setAba] = useState("recebido"); // recebido | clinico | evolucao

  // Dados vindos da recepção
  const dadosRec = [
    { l:"Nome",           v: pac?.nome },
    { l:"Nasc.",          v: pac?.nasc },
    { l:"CPF",            v: pac?.cpf },
    { l:"CNS",            v: pac?.cns },
    { l:"Cidade",         v: pac?.cidade },
    { l:"Telefone",       v: pac?.tel },
    { l:"Queixa",         v: pac?.queixa },
    { l:"Medicamentos",   v: pac?.meds },
    { l:"Alergias",       v: pac?.alerg },
    { l:"Antecedentes",   v: pac?.antec || pac?.anam_remedio_doenca },
    { l:"Hist. Familiar", v: pac?.anam_hist_fam },
    { l:"Cirurgias",      v: pac?.anam_cirurgia },
  ].filter(d => d.v && d.v !== "Não" && d.v !== "—");

  const camposFaltantes = CAMPOS_CLINICOS.filter(c => !pac?.[c.k]);

  function concluir() {
    if (!evolucao.trim()) { alert("Escreva a evolução do dia antes de concluir."); return; }
    setSalvando(true);
    setTimeout(() => {
      onConcluir?.(evolucao);
      setConcluido(true);
      setSalvando(false);
    }, 600);
  }

  if (concluido) return (
    <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:14, padding:28, textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:10 }}>✅</div>
      <h3 style={{ color:VE, fontWeight:900, margin:"0 0 6px" }}>Consulta concluída!</h3>
      <p style={{ color:"#4b5563", fontSize:13 }}>Evolução salva e adicionada à Timeline do paciente.</p>
    </div>
  );

  return (
    <div style={{ display:"grid", gap:14 }}>

      {/* Header com info do paciente */}
      <div style={{ background:`linear-gradient(135deg,${N},#0d2347)`, borderRadius:14, padding:"14px 18px", color:"#fff" }}>
        <div style={{ fontSize:9, color:G, fontWeight:900, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Consulta do dia — {new Date().toLocaleDateString("pt-BR")}</div>
        <div style={{ fontWeight:900, fontSize:17 }}>{pac?.nome || <span style={{ opacity:.4 }}>Nenhum paciente selecionado</span>}</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginTop:2 }}>
          {[pac?.nasc && `Nasc. ${pac.nasc}`, pac?.cidade, pac?.cid].filter(Boolean).join("  ·  ")}
        </div>
        {camposFaltantes.length > 0 && (
          <div style={{ marginTop:8, background:"rgba(184,134,11,.25)", borderRadius:8, padding:"6px 10px", fontSize:11, color:G, fontWeight:700 }}>
            ⚠️ {camposFaltantes.length} campo(s) clínico(s) pendente(s)
          </div>
        )}
      </div>

      {/* Abas */}
      <div style={{ display:"flex", gap:6 }}>
        {[
          { id:"recebido", l:"📥 Dados da Recepção" },
          { id:"clinico",  l:`🩺 Dados Clínicos${camposFaltantes.length>0?` (${camposFaltantes.length})`:""}` },
          { id:"evolucao", l:"📝 Evolução do Dia" },
        ].map(t => (
          <button key={t.id} onClick={() => setAba(t.id)}
            style={{ flex:1, border:"none", borderRadius:9, padding:"9px 6px", fontSize:12, fontWeight:800, cursor:"pointer",
              background: aba===t.id ? N : "#F1F5F9", color: aba===t.id ? "#fff" : N }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ABA: Dados recebidos da recepção */}
      {aba==="recebido" && (
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:13, padding:16 }}>
          <h3 style={{ color:N, fontWeight:900, fontSize:13, marginBottom:12 }}>📥 Informações trazidas pelo paciente</h3>
          {dadosRec.length === 0
            ? <p style={{ color:"#94A3B8", fontSize:13, fontStyle:"italic" }}>Nenhum dado recebido da recepção ainda.</p>
            : <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px" }}>
                {dadosRec.map(d => (
                  <div key={d.l}>
                    <div style={{ fontSize:9, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", marginBottom:2 }}>{d.l}</div>
                    <div style={{ fontSize:13, color:"#111827", fontWeight:600 }}>{d.v}</div>
                  </div>
                ))}
              </div>}
          <button onClick={() => setAba("clinico")}
            style={{ marginTop:16, width:"100%", background:G, color:"#fff", border:"none", borderRadius:10, padding:"10px", fontWeight:800, fontSize:13, cursor:"pointer" }}>
            Completar dados clínicos →
          </button>
        </div>
      )}

      {/* ABA: Dados clínicos faltantes */}
      {aba==="clinico" && (
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:13, padding:16 }}>
          <h3 style={{ color:N, fontWeight:900, fontSize:13, marginBottom:4 }}>🩺 Complete os dados clínicos</h3>
          <p style={{ color:"#64748B", fontSize:12, marginBottom:14 }}>
            {camposFaltantes.length === 0
              ? "✅ Todos os campos clínicos estão preenchidos."
              : `${camposFaltantes.length} campo(s) pendente(s) — preencha antes de concluir.`}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            {CAMPOS_CLINICOS.map(c => (
              <div key={c.k} style={{ marginBottom:10 }}>
                <label style={{ fontSize:10, fontWeight:800, color: !pac?.[c.k] ? VM : N, textTransform:"uppercase", display:"block", marginBottom:3 }}>
                  {c.l} {!pac?.[c.k] && "⚠"}
                </label>
                <input
                  value={pac?.[c.k] || ""}
                  onChange={e => up(c.k, e.target.value)}
                  placeholder={c.ph}
                  style={{ width:"100%", border:`1px solid ${!pac?.[c.k]?"#fca5a5":"#CBD5E1"}`,
                    borderRadius:8, padding:"7px 10px", fontSize:12, outline:"none",
                    background: !pac?.[c.k] ? "#fef2f2" : "#F8FAFC", boxSizing:"border-box" }}
                />
              </div>
            ))}
          </div>
          <button onClick={() => setAba("evolucao")}
            style={{ marginTop:8, width:"100%", background:VE, color:"#fff", border:"none", borderRadius:10, padding:"10px", fontWeight:800, fontSize:13, cursor:"pointer" }}>
            Ir para evolução do dia →
          </button>
        </div>
      )}

      {/* ABA: Evolução do dia */}
      {aba==="evolucao" && (
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:13, padding:16 }}>
          <h3 style={{ color:N, fontWeight:900, fontSize:13, marginBottom:4 }}>📝 Evolução do Dia</h3>
          <p style={{ color:"#64748B", fontSize:12, marginBottom:10 }}>
            Registre o raciocínio clínico, conduta e plano do dia. Será salvo na Timeline.
          </p>

          {/* Modelo rápido */}
          <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
            {[
              { l:"Início consulta", t:`Paciente ${pac?.nome||"—"}, ${pac?.nasc||""}, ${pac?.cidade||""}.\nQueixa: ${pac?.queixa||"—"}.\nECOG: ${pac?.ecog||"—"}. Peso: ${pac?.peso||"—"} kg.\n\nExame físico: ` },
              { l:"Diagnóstico",     t:`Diagnóstico: ${pac?.diag||"—"}.\nEstádio: ${pac?.estadio||"—"}. TNM: ${pac?.tnm||"—"}.\nBiomarcadores: ${pac?.bio||"—"}.\n\nConduta: ` },
              { l:"Resultado exame", t:`Revisão de exame:\n\nAchados: \n\nConduta: ` },
            ].map(m => (
              <button key={m.l} onClick={() => setEvolucao(p => p ? p + "\n\n" + m.t : m.t)}
                style={{ fontSize:11, background:"#F1F5F9", color:N, border:"1px solid #CBD5E1", borderRadius:7, padding:"5px 10px", cursor:"pointer", fontWeight:700 }}>
                + {m.l}
              </button>
            ))}
          </div>

          <textarea
            value={evolucao}
            onChange={e => setEvolucao(e.target.value)}
            rows={10}
            placeholder={`Evolução médica — ${new Date().toLocaleDateString("pt-BR")}\n\nPaciente: ${pac?.nome||"—"}\nDiagnóstico: ${pac?.diag||"—"}\n\nSubjetivo:\n\nObjetivo:\n\nAvaliação:\n\nPlano:`}
            style={{ width:"100%", border:"1px solid #CBD5E1", borderRadius:10, padding:"10px 12px",
              fontSize:13, resize:"vertical", outline:"none", fontFamily:"Georgia,serif",
              background:"#FAFAFA", lineHeight:1.6, boxSizing:"border-box" }}
          />

          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button onClick={() => setAba("clinico")}
              style={{ background:"#F1F5F9", color:N, border:"1px solid #CBD5E1", borderRadius:10, padding:"10px 16px", fontWeight:700, fontSize:12, cursor:"pointer" }}>
              ← Voltar
            </button>
            <button onClick={concluir} disabled={salvando || !evolucao.trim()}
              style={{ flex:1, background: evolucao.trim() ? VE : "#94A3B8", color:"#fff", border:"none",
                borderRadius:10, padding:"12px", fontWeight:900, fontSize:14, cursor: evolucao.trim() ? "pointer" : "not-allowed" }}>
              {salvando ? "Salvando..." : "✅ Concluir consulta e salvar na Timeline"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
