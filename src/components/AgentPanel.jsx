/**
 * AgentPanel.jsx — Painel de Agentes IA no App
 * Integrar: nova aba '🧠 Assistente IA' no módulo médico
 */
import { useState, useRef, useEffect } from "react";
import { sistemaAgentes } from "../agents/core.js";

const N="#1B365D",T="#2B7A8C",G="#B8860B",VE="#15803D",AM="#B45309",VM="#B91C1C";
const sc = {
  card:(e={})=>({background:"#fff",border:"1px solid #E2E8F0",borderRadius:13,padding:14,boxShadow:"0 2px 8px rgba(15,23,42,.06)",...e}),
  btn:(v,e={})=>({border:"none",cursor:"pointer",fontWeight:800,borderRadius:9,padding:"8px 14px",fontSize:12,fontFamily:"inherit",...({gold:{background:G,color:"#fff"},navy:{background:N,color:"#fff"},teal:{background:T,color:"#fff"},green:{background:VE,color:"#fff"},ghost:{background:"#F1F5F9",color:N,border:"1px solid #E2E8F0"}})[v]||{},...e}),
  inp:{width:"100%",border:"1px solid #CBD5E1",borderRadius:8,padding:"8px 10px",fontFamily:"inherit",fontSize:12,outline:"none",background:"#F8FAFC",color:"#1E293B"},
};

const COMANDOS_RAPIDOS = [
  { ico:"📋", cmd:"Preencher e completar prontuário automaticamente", agentes:["prontuario"] },
  { ico:"💉", cmd:"Sugerir melhor protocolo QT para este caso",        agentes:["protocolo","evidencias"] },
  { ico:"📄", cmd:"Gerar APAC completa e validar antiglosa",           agentes:["apac"] },
  { ico:"🖨️", cmd:"Gerar todos os documentos do paciente",             agentes:["documentos"] },
  { ico:"📚", cmd:"Buscar evidências clínicas para o tratamento",      agentes:["evidencias"] },
  { ico:"🚀", cmd:"Preparar tudo para a consulta",                     agentes:["prontuario","protocolo","apac","documentos"] },
];

const AGENTES_INFO = [
  { id:"prontuario",  emoji:"📋", nome:"Prontuário",   cor:N,  desc:"Preenche e atualiza" },
  { id:"protocolo",   emoji:"💉", nome:"Protocolo QT", cor:T,  desc:"Sugere + doses" },
  { id:"apac",        emoji:"📄", nome:"APAC SUS",     cor:G,  desc:"Preenche + valida" },
  { id:"triagem",     emoji:"🩺", nome:"Triagem",      cor:VE, desc:"Analisa pré-QT" },
  { id:"drive",       emoji:"📁", nome:"Drive",        cor:AM, desc:"Lê laudos PDF" },
  { id:"documentos",  emoji:"🖨️", nome:"Documentos",   cor:T,  desc:"Gera receitas/exames" },
  { id:"evidencias",  emoji:"📚", nome:"Evidências",   cor:"#7C3AED", desc:"Estudos clínicos" },
];

export default function AgentPanel({ pac, up, addMsg, setHistoricoQT, setApacs, onStorePatch }) {
  const [cmd, setCmd]         = useState("");
  const [exec, setExec]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs]       = useState([]);
  const [aba, setAba]         = useState("chat");
  const [hist, setHist]       = useState([]);
  const [apiKey, setApiKey]   = useState(localStorage.getItem("anthropic_key") || "");
  const [keyOk, setKeyOk]     = useState(!!localStorage.getItem("anthropic_key"));
  const [showKey, setShowKey] = useState(false);
  const inputRef = useRef(null);
  const logsRef  = useRef(null);

  const salvarKey = () => {
    if (!apiKey.trim().startsWith("sk-ant")) {
      alert("Chave inválida. Deve começar com sk-ant-...");
      return;
    }
    localStorage.setItem("anthropic_key", apiKey.trim());
    window.__ANTHROPIC_KEY__ = apiKey.trim();
    setKeyOk(true); setShowKey(false);
    addMsg && addMsg("🤖 IA", "Médico", "✅ API Key configurada. Assistente IA pronto para uso!", "msg");
  };

  useEffect(() => {
    logsRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [logs]);

  const executar = async (comando) => {
    if (!comando.trim()) return;
    setLoading(true); setLogs([]); setExec(null);
    setLogs([{ agente:"🧠 Orquestrador", status:"iniciando", msg:`"${comando}"` }]);
    try {
      const resultado = await sistemaAgentes.executarComando(comando, pac);
      setExec(resultado);
      setLogs(resultado.logs || []);
      setHist(h => [resultado, ...h]);
      aplicarResultados(resultado);
    } catch (e) {
      setLogs(l => [...l, { agente:"Sistema", status:"erro", msg: e.message }]);
    } finally {
      setLoading(false);
      setCmd("");
    }
  };

  const aplicarResultados = (resultado) => {
    const r = resultado.resultados;

    if (r.prontuario?.atualizacoes) {
      const atualizacoes = r.prontuario.atualizacoes;
      const campos = Object.keys(atualizacoes);
      if (onStorePatch) {
        // Campos demograficos auto-aprovados; campos clinicos/oncológicos vão para revisão
        const AUTO_APPROVE = new Set(["nome","dataNascimento","nomeMae","municipio","uf","cns","cpf","telefone","email","peso","altura"]);
        const fieldPatches = campos.map(k => ({
          field: k,
          currentValue: pac?.[k] ?? null,
          suggestedValue: atualizacoes[k],
          confidence: AUTO_APPROVE.has(k) ? 0.95 : 0.82,
          rationale: `Campo preenchido automaticamente pelo agente de prontuário.`,
          requiresMedicalReview: !AUTO_APPROVE.has(k),
        }));
        const autoApproved = campos.filter(k => AUTO_APPROVE.has(k));
        onStorePatch({
          id: "patch-" + Date.now(),
          triggerEventType: "AGENT_PRONTUARIO",
          summary: `Agente IA sugeriu atualizações em ${campos.length} campo(s): ${campos.slice(0,4).join(", ")}${campos.length>4?" ...":""}`,
          urgentAlerts: r.prontuario?.alertas || [],
          fieldPatches,
          apacPatches: [],
          fieldsAutoApproved: autoApproved,
        });
        // Auto-apply demografia immediately
        autoApproved.forEach(k => up && up(k, atualizacoes[k]));
        addMsg && addMsg("🤖 Agente", "Médico",
          `📋 ${campos.length} campo(s) aguardando revisão médica. ${autoApproved.length} campos demográficos aplicados automaticamente.`, "msg");
      } else {
        Object.entries(atualizacoes).forEach(([k, v]) => up && up(k, v));
        addMsg && addMsg("🤖 Agente", "Médico",
          `📋 Prontuário atualizado: ${campos.join(", ")}`, "msg");
      }
    }

    if (r.protocolo?.protocolos?.length) {
      const p = r.protocolo.protocolos[0];
      up && up("trat", p.nome);
      addMsg && addMsg("🤖 Agente", "Médico",
        `💉 Protocolo sugerido: ${p.nome}\n${p.justificativa}\nEstudo: ${p.estudo_referencia || "—"}`, "msg");
    }

    if (r.apac?.camposAPAC) {
      setApacs && setApacs(x => {
        const nova = { id:"APAC-"+Date.now(), pacID:pac?.nome, status:"rascunho",
          campos: r.apac.camposAPAC, alertasGlosa: r.apac.alertasGlosa || [],
          dataCriacao: new Date().toLocaleDateString("pt-BR"), historico:[] };
        return [...(x||[]).filter(a=>a.pacID!==pac?.nome), nova];
      });
      addMsg && addMsg("🤖 Agente", "Financeiro", `📄 APAC auto-preenchida para ${pac?.nome}`, "apac");
    }

    if (r.documentos?.documentos) {
      const nDocs = Object.keys(r.documentos.documentos).length;
      addMsg && addMsg("🤖 Agente", "Médico", `🖨️ ${nDocs} documentos gerados. Acesse a aba Documentos.`, "msg");
    }
  };

  const statusCor = { ok:"#15803D", erro:"#B91C1C", executando:"#2B7A8C", iniciando:"#B8860B" };

  return (
    <div style={{ display:"grid", gap:12 }}>
      {/* API Key Banner */}
      {!keyOk && (
        <div style={sc.card({ background:"#FFF7E6", border:`2px solid ${AM}55` })}>
          <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:24 }}>🔑</span>
            <div style={{ flex:1 }}>
              <strong style={{ color:N, display:"block", fontSize:13, marginBottom:4 }}>
                Configure a API Key Anthropic para ativar a IA
              </strong>
              <p style={{ color:"#64748B", fontSize:11, margin:"0 0 10px" }}>
                Obtenha em: <strong>console.anthropic.com</strong> → API Keys → Create Key
              </p>
              <div style={{ display:"flex", gap:7 }}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  style={{ ...sc.inp, flex:1 }}
                />
                <button onClick={salvarKey} style={{ ...sc.btn("gold"), padding:"8px 14px" }}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={sc.card({ background:`linear-gradient(135deg,${N},#0d2347)`, border:"none" })}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:G, fontSize:10, fontWeight:900, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>
              Sistema Multi-Agente · Claude API
            </div>
            <h2 style={{ color:"#fff", fontSize:15, fontWeight:900, margin:"0 0 2px" }}>
              🧠 Assistente Oncológico IA
            </h2>
            <p style={{ color:"rgba(255,255,255,.4)", fontSize:11 }}>
              {pac?.nome ? `Paciente: ${pac.nome}` : "Nenhum paciente selecionado"}
              {pac?.diag ? ` · ${pac.diag.slice(0,35)}` : ""}
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
            <div style={{ background: !keyOk ? VM+"33" : loading ? AM+"33" : VE+"33", color: !keyOk ? VM : loading ? AM : VE, padding:"3px 10px", borderRadius:999, fontSize:10, fontWeight:900 }}>
              {!keyOk ? "⚠ API Key não configurada" : loading ? "⏳ Agentes ativos" : "● Pronto"}
            </div>
            <button onClick={() => setShowKey(v => !v)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,.3)", fontSize:9 }}>
              {keyOk ? "🔑 Reconfigurar key" : ""}
            </button>
          </div>
        </div>
        {showKey && keyOk && (
          <div style={{ marginTop:12, display:"flex", gap:7 }}>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Nova chave sk-ant-..." style={{ ...sc.inp, flex:1, background:"rgba(255,255,255,.1)", color:"#fff", border:"1px solid rgba(255,255,255,.2)" }}/>
            <button onClick={salvarKey} style={{ ...sc.btn("gold"), padding:"8px 14px" }}>Salvar</button>
          </div>
        )}
      </div>

      {/* Abas */}
      <div style={{ background:N, display:"flex", borderRadius:11, overflow:"hidden" }}>
        {[["chat","💬 Chat"],["agentes","🤖 Agentes"],["historico","📋 Histórico"]].map(([id,l]) => (
          <button key={id} onClick={() => setAba(id)}
            style={{ border:"none", cursor:"pointer", padding:"8px", fontSize:11, fontWeight:800,
              flex:1, fontFamily:"inherit", background:aba===id?G:N,
              color:aba===id?"#fff":"rgba(255,255,255,.5)" }}>{l}</button>
        ))}
      </div>

      {/* CHAT */}
      {aba === "chat" && (
        <div style={{ display:"grid", gap:10 }}>
          <div style={sc.card()}>
            <div style={{ fontSize:11, fontWeight:800, color:N, marginBottom:8 }}>⚡ Comandos Rápidos</div>
            <div style={{ display:"grid", gap:6 }}>
              {COMANDOS_RAPIDOS.map((c, i) => (
                <button key={i} onClick={() => executar(c.cmd)} disabled={loading}
                  style={{ ...sc.btn("ghost", { textAlign:"left", display:"flex", gap:9, alignItems:"center", padding:"8px 11px", opacity:loading?.5:1 }) }}>
                  <span style={{ fontSize:18 }}>{c.ico}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:N }}>{c.cmd}</div>
                    <div style={{ fontSize:9, color:"#94A3B8" }}>Agentes: {c.agentes.join(", ")}</div>
                  </div>
                  {loading ? <span style={{ fontSize:10, color:AM }}>⏳</span>
                           : <span style={{ color:"#CBD5E1" }}>→</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={sc.card()}>
            <div style={{ fontSize:11, fontWeight:800, color:N, marginBottom:8 }}>💬 Comando Personalizado</div>
            <div style={{ display:"flex", gap:8 }}>
              <textarea
                ref={inputRef}
                value={cmd}
                onChange={e => setCmd(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); executar(cmd); } }}
                placeholder="Digite um comando... Ex: Analisar o caso e sugerir conduta"
                rows={2}
                style={{ ...sc.inp, flex:1, resize:"none" }}
              />
              <button onClick={() => executar(cmd)} disabled={!cmd.trim() || loading}
                style={{ ...sc.btn("gold"), padding:"0 14px", alignSelf:"stretch", opacity:(!cmd.trim()||loading)?.5:1 }}>
                {loading ? "⏳" : "→"}
              </button>
            </div>
            <div style={{ fontSize:9, color:"#94A3B8", marginTop:5 }}>
              Enter para enviar · Shift+Enter para nova linha
            </div>
          </div>

          {logs.length > 0 && (
            <div style={sc.card({ background:"#0f172a", border:`1px solid ${T}44` })}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ color:G, fontSize:11, fontWeight:800 }}>
                  {loading ? "⏳ Agentes processando..." : "✅ Execução concluída"}
                </div>
                {exec && <span style={{ color:"#94A3B8", fontSize:10 }}>{exec.duracao}</span>}
              </div>
              {logs.map((log, i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:5 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:statusCor[log.status]||"#64748B", flexShrink:0, marginTop:4 }}/>
                  <div>
                    <span style={{ color:G, fontWeight:700, fontSize:11 }}>{log.agente}</span>
                    <span style={{ color:"#64748B", fontSize:10, marginLeft:6 }}>{log.msg}</span>
                  </div>
                </div>
              ))}
              <div ref={logsRef}/>
            </div>
          )}

          {exec && !loading && (
            <ResultadoAgentes resultado={exec} pac={pac} />
          )}
        </div>
      )}

      {/* AGENTES */}
      {aba === "agentes" && (
        <div style={{ display:"grid", gap:9 }}>
          <p style={{ fontSize:11, color:"#64748B" }}>Clique em um agente para executá-lo diretamente com o paciente atual.</p>
          {AGENTES_INFO.map(ag => (
            <div key={ag.id} style={sc.card({ border:`1px solid ${ag.cor}33` })}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ width:44, height:44, background:ag.cor, borderRadius:11, display:"grid", placeItems:"center", fontSize:22, flexShrink:0 }}>
                  {ag.emoji}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, color:N, fontSize:13 }}>{ag.nome}</div>
                  <div style={{ fontSize:10, color:"#64748B" }}>{ag.desc}</div>
                </div>
                <button onClick={() => executar(`Executar agente ${ag.nome}`)} disabled={loading}
                  style={{ ...sc.btn("ghost", { fontSize:11, padding:"5px 12px" }), borderColor:ag.cor, color:ag.cor }}>
                  {loading ? "⏳" : "▶ Executar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HISTÓRICO */}
      {aba === "historico" && (
        <div>
          {hist.length === 0 ? (
            <div style={{ textAlign:"center", padding:28, color:"#94A3B8" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
              <p style={{ fontSize:12 }}>Nenhum comando executado ainda.</p>
            </div>
          ) : hist.map((h, i) => (
            <div key={i} style={{ ...sc.card({ marginBottom:8 }) }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <strong style={{ color:N, fontSize:12 }}>{h.comando?.slice(0,60)}</strong>
                <span style={{ fontSize:9, color:"#94A3B8" }}>{h.duracao}</span>
              </div>
              <div style={{ fontSize:10, color:"#64748B" }}>
                Agentes: {h.agentes?.join(", ")} · {h.timestamp}
              </div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:5 }}>
                {h.agentes?.map(a => {
                  const ai = AGENTES_INFO.find(x => x.id === a);
                  const ok = !h.resultados?.[a]?.erro;
                  return <span key={a} style={{ background:(ok?VE:VM)+"22", color:ok?VE:VM, padding:"1px 7px", borderRadius:999, fontSize:9, fontWeight:900 }}>
                    {ai?.emoji} {ai?.nome} {ok?"✓":"✗"}
                  </span>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultadoAgentes({ resultado, pac }) {
  const [verMais, setVerMais] = useState(null);
  const r = resultado.resultados;
  if (!r) return null;

  return (
    <div style={{ display:"grid", gap:9 }}>
      {r.prontuario?.atualizacoes && Object.keys(r.prontuario.atualizacoes).length > 0 && (
        <div style={{ background:"#EAF7EE", border:`1px solid ${VE}44`, borderRadius:11, padding:12 }}>
          <div style={{ fontWeight:800, color:VE, fontSize:12, marginBottom:6 }}>
            📋 Prontuário Atualizado ({Object.keys(r.prontuario.atualizacoes).length} campos)
          </div>
          {Object.entries(r.prontuario.atualizacoes).map(([k, v]) => (
            <div key={k} style={{ fontSize:11, marginBottom:3 }}>
              <span style={{ color:"#64748B" }}>{k}:</span>{" "}
              <span style={{ color:"#1B365D", fontWeight:600 }}>{String(v).slice(0,80)}</span>
            </div>
          ))}
        </div>
      )}

      {r.protocolo?.protocolos?.length > 0 && (
        <div style={{ background:"#EFF9FF", border:`1px solid ${T}44`, borderRadius:11, padding:12 }}>
          <div style={{ fontWeight:800, color:T, fontSize:12, marginBottom:6 }}>💉 Protocolo Sugerido</div>
          {r.protocolo.protocolos.map((p, i) => (
            <div key={i} style={{ marginBottom:6 }}>
              <strong style={{ color:"#1B365D" }}>{p.nome}</strong>
              <span style={{ color:"#64748B", fontSize:10, marginLeft:8 }}>{p.periodo}</span>
              <div style={{ fontSize:11, color:"#374151", marginTop:2 }}>{p.justificativa}</div>
              {p.estudo_referencia && <div style={{ fontSize:10, color:T, marginTop:1 }}>📚 {p.estudo_referencia}</div>}
            </div>
          ))}
          {r.protocolo.doses?.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:6 }}>
              {r.protocolo.doses.map((d, i) => (
                <span key={i} style={{ background:N+"11", color:N, padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700 }}>
                  {d.farmaco}: {d.doseCalc}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {r.apac?.camposAPAC && (
        <div style={{ background:"#FFFBEB", border:`1px solid ${VE}44`, borderRadius:11, padding:12 }}>
          <div style={{ fontWeight:800, color:VE, fontSize:12, marginBottom:4 }}>📄 APAC Preenchida Automaticamente</div>
          {r.apac.alertasGlosa?.length > 0 && (
            <div style={{ background:"#FEF2F2", border:`1px solid ${VM}44`, borderRadius:8, padding:"6px 10px", marginBottom:6, fontSize:11, color:VM }}>
              ⚠️ Riscos de glosa: {r.apac.alertasGlosa.join(" · ")}
            </div>
          )}
          <div style={{ fontSize:10, color:VE, fontWeight:700 }}>
            ✅ {Object.keys(r.apac.camposAPAC).length} campos preenchidos · Acesse aba APAC SUS
          </div>
        </div>
      )}

      {r.evidencias?.evidencias && (
        <div style={{ background:"#F5F3FF", border:`1px solid #7C3AED44`, borderRadius:11, padding:12 }}>
          <div style={{ fontWeight:800, color:"#7C3AED", fontSize:12, marginBottom:6 }}>📚 Evidências Clínicas</div>
          <div style={{ fontSize:11, color:"#374151", lineHeight:1.7, maxHeight: verMais === "ev" ? "none" : 100, overflow:"hidden" }}>
            {r.evidencias.evidencias}
          </div>
          <button onClick={() => setVerMais(verMais === "ev" ? null : "ev")}
            style={{ border:"none", cursor:"pointer", background:"none", color:"#7C3AED", fontSize:10, fontWeight:700, marginTop:4, padding:0 }}>
            {verMais === "ev" ? "▲ Ver menos" : "▼ Ver mais"}
          </button>
        </div>
      )}

      {r.documentos?.documentos && (
        <div style={{ background:"#EAF7EE", border:`1px solid ${VE}44`, borderRadius:11, padding:12 }}>
          <div style={{ fontWeight:800, color:VE, fontSize:12, marginBottom:6 }}>
            🖨️ {Object.keys(r.documentos.documentos).length} Documentos Gerados
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {Object.keys(r.documentos.documentos).map(tipo => (
              <button key={tipo}
                onClick={() => {
                  const corpo = r.documentos.documentos[tipo];
                  const w = window.open("","_blank","width=700,height=600");
                  if(w){w.document.open();w.document.write(`<pre style="font-family:Georgia;padding:24px;font-size:12px;line-height:1.8">${corpo}</pre><button onclick="window.print()" style="background:#B8860B;color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:12px;cursor:pointer;margin-top:12px">🖨️ Imprimir</button>`);w.document.close();}
                }}
                style={{ background:VE, color:"#fff", border:"none", borderRadius:7, padding:"4px 10px", fontSize:10, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
                🖨️ {tipo.replace("_"," ")}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
