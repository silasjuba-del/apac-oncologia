/**
 * IATestador.jsx — Painel de teste das rotas IA com casos reais
 * Dr. Silas Negrão Serra Jr. · CRM-PB 17341
 */
import { useState } from "react";
import { IA } from "../services/ia.js";

const N="#1B365D",T="#2B7A8C",G="#B8860B",VE="#15803D",AM="#B45309",VM="#B91C1C";
const sc = {
  card: (e={}) => ({background:"#fff",border:"1px solid #E2E8F0",borderRadius:13,padding:14,...e}),
  btn: (v="ghost",e={}) => ({border:"none",cursor:"pointer",fontWeight:800,borderRadius:9,
    padding:"8px 14px",fontSize:12,fontFamily:"inherit",
    ...({gold:{background:G,color:"#fff"},navy:{background:N,color:"#fff"},
       teal:{background:T,color:"#fff"},green:{background:VE,color:"#fff"},
       ghost:{background:"#F1F5F9",color:N,border:"1px solid #E2E8F0"}})[v]||{},...e}),
  inp: {width:"100%",border:"1px solid #CBD5E1",borderRadius:8,padding:"8px 10px",
    fontFamily:"inherit",fontSize:12,outline:"none",background:"#F8FAFC",color:"#1E293B"},
};
const Btn = ({v,ch,s,onClick,dis,loading}) =>
  <button disabled={dis||loading} onClick={onClick}
    style={{...sc.btn(v),opacity:(dis||loading)?.5:1,...s}}>
    {loading ? "⏳ Aguardando IA..." : ch}
  </button>;

const CASOS = {
  mama: {
    nome:"Maria Aparecida Santos", nasc:"12/03/1965", cpf:"123.456.789-00",
    cns:"700012345678901", cidade:"Patos-PB", tel:"(83) 99999-0000",
    mae:"Ana Santos", peso:"65", altura:"162",
    diag:"Adenocarcinoma de mama invasivo ductal RH+/HER2− bilateral",
    cid:"C50.9", tnm:"cT2N1M0", estadio:"Estádio III",
    ecog:"1", linha:"Neoadjuvante", intencao:"Curativa",
    bio:"RE 90% · RP 70% · HER2− (IHQ 1+) · Ki-67 35%",
    trat:"AC → Paclitaxel semanal",
    antec:"HAS, DM2, cirurgia prévia: cesárea (2002)",
    meds:"Losartana 50mg 1×/dia, Metformina 850mg 12/12h",
    alerg:"Dipirona (rash cutâneo)",
    exFisico:"PA 130/85, FC 78, SPO₂ 97%. Nódulo em QSE mama D 2,3cm endurecido. Linfonodo axilar D palpável 1,5cm.",
    conduta:"Neoadjuvância com AC q21d × 4 → Paclitaxel 80mg/m² semanal × 12. Reavaliação após 4 ciclos.",
    queixa:"Caroço no seio direito há 4 meses. Sem dor. Notou que aumentou.",
  },
  colon: {
    nome:"João Carlos Ferreira", nasc:"05/08/1958", cidade:"Patos-PB",
    peso:"78", altura:"170", diag:"Adenocarcinoma de cólon direito metastático",
    cid:"C18.2", tnm:"pT3N2M1b", estadio:"Estádio IV",
    ecog:"1", linha:"1ª linha", intencao:"Paliativa",
    bio:"RAS wt · BRAF wt · MSS · HER2− · PD-L1 1%",
    trat:"mFOLFOX6 + Bevacizumabe",
    antec:"HAS, sedentário, ex-tabagista (20 anos/maço)",
    meds:"Atenolol 50mg, AAS 100mg", alerg:"Nenhuma",
    exFisico:"PA 140/90, FC 82. Abdome: hepatomegalia 3cm abaixo RCD. Sem dor.",
    conduta:"mFOLFOX6 + Beva q14d. Solicitar RAS/BRAF/MSI em parafina. TC restadiar após 4 ciclos.",
    queixa:"Dor abdominal direita há 2 meses, perda de 8kg.",
  },
  pulmao: {
    nome:"Ana Beatriz Costa", nasc:"22/11/1970", cidade:"Campina Grande-PB",
    peso:"58", altura:"158", diag:"Adenocarcinoma de pulmão esquerdo",
    cid:"C34.1", tnm:"cT2bN2M1c", estadio:"Estádio IVB",
    ecog:"2", linha:"1ª linha", intencao:"Paliativa",
    bio:"EGFR Exon 19 del+ · ALK− · ROS1− · PD-L1 15%",
    trat:"Osimertinibe 80mg/dia",
    antec:"Não tabagista. Bronquite recorrente.",
    meds:"Salbutamol SN, Budesonida inalatória",
    alerg:"Penicilina",
    exFisico:"PA 110/70, FC 90, SPO₂ 93%. Diminuição MV base ESQ. Linfonodos supraclaviculares D.",
    conduta:"Iniciar Osimertinibe 80mg/dia. Avaliar ZNS em 6 semanas.",
    queixa:"Tosse seca persistente há 3 meses. Dispneia aos esforços. Dor no ombro esquerdo.",
  },
};

export default function IATestador({ pac }) {
  const [abaIA, setAbaIA] = useState("resumo");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  const [erro, setErro] = useState("");
  const [casoSel, setCasoSel] = useState("mama");
  const [pacTeste, setPacTeste] = useState(CASOS.mama);
  const [pergunta, setPergunta] = useState("");
  const [apiKey, setApiKey] = useState(localStorage.getItem("anthropic_key") || "");
  const [keyConfigurada, setKeyConfigurada] = useState(!!localStorage.getItem("anthropic_key"));

  const exec = async (fn) => {
    setLoading(true); setErro(""); setResultado("");
    try {
      if (apiKey) window.__ANTHROPIC_KEY__ = apiKey;
      const r = await fn();
      setResultado(typeof r === "string" ? r : JSON.stringify(r, null, 2));
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  const salvarKey = () => {
    localStorage.setItem("anthropic_key", apiKey);
    window.__ANTHROPIC_KEY__ = apiKey;
    setKeyConfigurada(true);
    alert("✅ API Key salva no navegador!");
  };

  const usarCaso = (k) => {
    setCasoSel(k);
    setPacTeste(CASOS[k]);
    setResultado(""); setErro("");
  };

  const ABAS = [
    ["resumo",    "📋 Resumir Prontuário"],
    ["protocolo", "💉 Sugerir Protocolo"],
    ["apac",      "📄 Justif. APAC"],
    ["triagem",   "🩺 Analisar Triagem"],
    ["evolucao",  "📝 Gerar Evolução"],
    ["duvida",    "🤔 Dúvida Clínica"],
    ["caso",      "🏥 Gerar Caso"],
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* HEADER */}
      <div style={{ ...sc.card({ background: `linear-gradient(135deg,${N},#0d2347)`, border: "none" }) }}>
        <div style={{ color: G, fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>
          Testes com IA real · Claude API
        </div>
        <h2 style={{ color: "#fff", fontSize: 15, fontWeight: 900, margin: "0 0 3px" }}>🤖 Painel de Testes IA</h2>
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: 11 }}>
          Teste as rotas com casos clínicos reais de oncologia
        </p>
      </div>

      {/* CONFIGURAÇÃO DA API KEY */}
      {!keyConfigurada ? (
        <div style={{ ...sc.card({ background: "#FFFBEB", border: `2px solid ${AM}44` }) }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>🔑</span>
            <div>
              <strong style={{ color: N, display: "block", fontSize: 13 }}>Configure sua API Key</strong>
              <span style={{ fontSize: 11, color: "#64748B" }}>
                Obtenha em: console.anthropic.com → API Keys
              </span>
            </div>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            style={{ ...sc.inp, marginBottom: 8, fontFamily: "monospace" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn v="gold" ch="💾 Salvar Key" s={{ flex: 1 }} dis={!apiKey.startsWith("sk-")} onClick={salvarKey} />
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
              style={{ ...sc.btn("ghost"), textDecoration: "none", display: "flex", alignItems: "center" }}>
              ↗ Obter Key
            </a>
          </div>
          <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 6 }}>
            🔒 A key fica salva apenas no seu navegador. Não é enviada para nenhum servidor nosso.
          </p>
        </div>
      ) : (
        <div style={{ ...sc.card({ background: "#EAF7EE", border: `1px solid ${VE}44` }), display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px" }}>
          <span style={{ color: VE, fontWeight: 700, fontSize: 12 }}>✅ API Key configurada</span>
          <button onClick={() => { localStorage.removeItem("anthropic_key"); setKeyConfigurada(false); setApiKey(""); }}
            style={{ ...sc.btn("ghost", { fontSize: 10, padding: "3px 9px", color: "#94A3B8" }) }}>Trocar</button>
        </div>
      )}

      {/* SELETOR DE CASO */}
      <div style={sc.card()}>
        <strong style={{ color: N, fontSize: 12, display: "block", marginBottom: 8 }}>🏥 Casos Clínicos de Teste</strong>
        <div style={{ display: "flex", gap: 6 }}>
          {[["mama","🎀 Mama RH+/HER2−"],["colon","🔵 Cólon Metastático"],["pulmao","🫁 Pulmão EGFR+"]].map(([k, l]) => (
            <button key={k} onClick={() => usarCaso(k)}
              style={{ ...sc.btn(casoSel === k ? "navy" : "ghost", { flex: 1, fontSize: 11, padding: "7px 6px" }) }}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 10px", fontSize: 11 }}>
          <strong style={{ color: N }}>{pacTeste.nome}</strong>
          <span style={{ color: "#64748B", marginLeft: 8 }}>{pacTeste.diag}</span>
          <div style={{ color: "#94A3B8", fontSize: 10, marginTop: 2 }}>
            {pacTeste.estadio} · {pacTeste.bio?.slice(0, 50)} · ECOG {pacTeste.ecog}
          </div>
        </div>
      </div>

      {/* ABAS DE TESTES */}
      <div style={{ background: N, display: "flex", overflowX: "auto", borderRadius: 11, overflow: "hidden" }}>
        {ABAS.map(([id, l]) => (
          <button key={id} onClick={() => { setAbaIA(id); setResultado(""); setErro(""); }}
            style={{ border: "none", cursor: "pointer", padding: "8px 10px", fontSize: 10,
              fontWeight: 800, flex: "0 0 auto", fontFamily: "inherit", whiteSpace: "nowrap",
              background: abaIA === id ? G : N, color: abaIA === id ? "#fff" : "rgba(255,255,255,.45)" }}>
            {l}
          </button>
        ))}
      </div>

      {/* PAINEL DE CADA ROTA */}
      <div style={sc.card()}>
        {abaIA === "resumo" && (
          <div>
            <strong style={{ color: N, fontSize: 13, display: "block", marginBottom: 6 }}>📋 Resumir Prontuário Oncológico</strong>
            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>
              Claude analisa todos os dados do paciente e gera um resumo clínico estruturado para o prontuário.
            </p>
            <Btn v="gold" ch="🤖 Gerar Resumo com IA" s={{ width: "100%", padding: 11, fontSize: 13 }}
              loading={loading} onClick={() => exec(() => IA.resumirProntuario(pacTeste))} />
          </div>
        )}

        {abaIA === "protocolo" && (
          <div>
            <strong style={{ color: N, fontSize: 13, display: "block", marginBottom: 6 }}>💉 Sugerir Protocolo QT</strong>
            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>
              Claude analisa diagnóstico, biomarcadores e ECOG para sugerir os 3 melhores protocolos com justificativa e evidência.
            </p>
            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11 }}>
              <div><strong>Diagnóstico:</strong> {pacTeste.diag}</div>
              <div><strong>Biomarcadores:</strong> {pacTeste.bio}</div>
              <div><strong>ECOG:</strong> {pacTeste.ecog} · <strong>Linha:</strong> {pacTeste.linha}</div>
            </div>
            <Btn v="gold" ch="🤖 Sugerir Protocolos" s={{ width: "100%", padding: 11, fontSize: 13 }}
              loading={loading} onClick={() => exec(() => IA.sugerirProtocolo(pacTeste.diag, pacTeste.estadio, pacTeste.bio, pacTeste.ecog, pacTeste.linha))} />
          </div>
        )}

        {abaIA === "apac" && (
          <div>
            <strong style={{ color: N, fontSize: 13, display: "block", marginBottom: 6 }}>📄 Gerar Justificativa APAC</strong>
            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>
              Gera o texto da justificativa clínica para o campo da APAC SUS, com referência à diretriz CONITEC/SBOC.
            </p>
            <Btn v="gold" ch="🤖 Gerar Justificativa APAC" s={{ width: "100%", padding: 11, fontSize: 13 }}
              loading={loading} onClick={() => exec(() => IA.gerarJustificativaAPAC(pacTeste))} />
          </div>
        )}

        {abaIA === "triagem" && (
          <div>
            <strong style={{ color: N, fontSize: 13, display: "block", marginBottom: 6 }}>🩺 Analisar Triagem Pré-QT</strong>
            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>
              Claude avalia os dados da triagem e sugere conduta ao médico.
            </p>
            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px" }}>
                {[["PA","120/80 mmHg"],["FC","78 bpm"],["Temp","37,2°C"],["SPO₂","97%"],
                  ["Neutro","1.800/mm³"],["PLT","142.000/mm³"],["Hgb","10,8 g/dL"],["ECOG","1"]].map(([l,v]) => (
                  <div key={l} style={{ fontSize: 10 }}><span style={{ color: "#64748B" }}>{l}:</span> <strong>{v}</strong></div>
                ))}
              </div>
            </div>
            <Btn v="gold" ch="🤖 Analisar com IA" s={{ width: "100%", padding: 11, fontSize: 13 }}
              loading={loading} onClick={() => exec(() => IA.analisarTriagem({
                pas:"120", pad:"80", fc:"78", temp:"37,2", spo2:"97",
                neutro:"1800", plt:"142000", hgb:"10.8", creat:"0.9",
                ecog:"1", proto: pacTeste.trat, ciclo: "C1D1",
                ctcae: { nausea:"G0", vomito:"G0", diarreia:"G1", fadiga:"G1", neuropatia:"G0" },
              }))} />
          </div>
        )}

        {abaIA === "evolucao" && (
          <div>
            <strong style={{ color: N, fontSize: 13, display: "block", marginBottom: 6 }}>📝 Gerar Evolução Médica</strong>
            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>
              Gera evolução no formato SOAP para inserir no prontuário.
            </p>
            <Btn v="gold" ch="🤖 Gerar Evolução" s={{ width: "100%", padding: 11, fontSize: 13 }}
              loading={loading} onClick={() => exec(() => IA.gerarEvolucao(pacTeste, {
                queixa: "Tolerou bem o ciclo anterior. Apresentou náusea G1 nos 2 primeiros dias.",
                pa:"120/80", fc:"76", temp:"36,5", peso: pacTeste.peso,
                neutro:"2100", plt:"178000", hgb:"11,2",
                cicloAtual: "C3D1",
              }))} />
          </div>
        )}

        {abaIA === "duvida" && (
          <div>
            <strong style={{ color: N, fontSize: 13, display: "block", marginBottom: 6 }}>🤔 Dúvida Clínica</strong>
            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>
              Faça uma pergunta clínica sobre o caso. Claude responde com embasamento em evidências.
            </p>
            <textarea value={pergunta} onChange={e => setPergunta(e.target.value)} rows={3}
              placeholder={`Ex: Qual a melhor estratégia terapêutica para ${pacTeste.diag} com ${pacTeste.bio}?`}
              style={{ ...sc.inp, resize: "vertical", marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {[
                "Quando considerar bevacizumabe neste caso?",
                "Critérios para redução de dose no próximo ciclo?",
                "Qual a evidência para manutenção após 1ª linha?",
                "Como manejar toxicidade G2 neste protocolo?",
              ].map(q => (
                <button key={q} onClick={() => setPergunta(q)}
                  style={{ ...sc.btn("ghost", { fontSize: 10, padding: "3px 9px" }) }}>{q.slice(0, 35)}...</button>
              ))}
            </div>
            <Btn v="gold" ch="🤖 Responder" s={{ width: "100%", padding: 11, fontSize: 13 }}
              loading={loading} dis={!pergunta.trim()} onClick={() => exec(() => IA.duvidasClinicas(pergunta, pacTeste))} />
          </div>
        )}

        {abaIA === "caso" && (
          <div>
            <strong style={{ color: N, fontSize: 13, display: "block", marginBottom: 6 }}>🏥 Gerar Caso Clínico de Teste</strong>
            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>
              Gera um caso clínico oncológico realista com todos os dados estruturados para testar o prontuário.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
              {[["mama","🎀 Mama"],["colon","🔵 Cólon"],["pulmao","🫁 Pulmão"],["prostata","🔵 Próstata"],["pancreas","🟠 Pâncreas"]].map(([k, l]) => (
                <Btn key={k} v="ghost" ch={l} s={{ fontSize: 11 }} loading={loading}
                  onClick={() => exec(() => IA.gerarCasoTeste(k))} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RESULTADO */}
      {(resultado || erro || loading) && (
        <div style={sc.card({ border: `1px solid ${erro ? VM : resultado ? VE : T}44` })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ color: N, fontSize: 12 }}>
              {loading ? "⏳ Claude processando..." : erro ? "❌ Erro" : "✅ Resposta da IA"}
            </strong>
            {resultado && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => navigator.clipboard?.writeText(resultado)}
                  style={{ ...sc.btn("ghost", { fontSize: 10, padding: "3px 9px" }) }}>📋 Copiar</button>
                <button onClick={() => setResultado("")}
                  style={{ ...sc.btn("ghost", { fontSize: 10, padding: "3px 9px" }) }}>✕</button>
              </div>
            )}
          </div>
          {loading && (
            <div style={{ textAlign: "center", padding: 20, color: T }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              <p style={{ fontSize: 12 }}>Claude está analisando o caso...</p>
            </div>
          )}
          {erro && <div style={{ color: VM, fontSize: 12, lineHeight: 1.6 }}>{erro}<br/><br/><span style={{ color: "#94A3B8", fontSize: 11 }}>Verifique se a API Key está correta e com créditos disponíveis.</span></div>}
          {resultado && (
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "Georgia,serif", fontSize: 11.5, lineHeight: 1.7, color: "#374151", maxHeight: 400, overflowY: "auto" }}>
              {resultado}
            </pre>
          )}
        </div>
      )}

      <div style={{ ...sc.card({ padding: "8px 12px", background: "#F8FAFC" }), fontSize: 10, color: "#94A3B8", lineHeight: 1.6 }}>
        💰 <strong>Custo estimado por chamada:</strong> ~$0.01–0.05 (R$ 0,05–0,28) dependendo do tamanho.<br/>
        100 chamadas/dia ≈ $1–5/dia ≈ R$ 5–28/dia · Plano Anthropic: a partir de $5/mês de crédito.
      </div>
    </div>
  );
}
