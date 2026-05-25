import { useMemo, useState } from "react";
import "./BancadaOncologica.css";

// API_BASE resolvido via prop ou env; fallback para backend local
const DEFAULT_API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:3001").replace(/\/$/, "") + "/api/oncoagent";

function Badge({ children, tone = "neutral" }) {
  return <span className={`oa-badge oa-badge-${tone}`}>{children}</span>;
}

function DegradedChecklist({ outputs }) {
  if (!outputs) return null;

  const labels = {
    prontuario_preliminar: "Prontuário preliminar",
    apac_rascunho: "APAC rascunho",
    apac_conferencia: "APAC para conferência",
    prescricao_rascunho: "Prescrição rascunho",
    prescricao_validacao: "Prescrição para validação"
  };

  return (
    <div className="oa-degraded">
      {Object.entries(outputs).map(([key, item]) => {
        const blocked = item.status === "bloqueado";
        const degraded = item.status === "degradado";

        return (
          <div key={key} className={`oa-degraded-row ${blocked ? "blocked" : degraded ? "degraded" : "ok"}`}>
            <div className="oa-degraded-icon">{blocked ? "🔴" : degraded ? "🟡" : "✅"}</div>
            <div className="oa-degraded-main">
              <b>{labels[key] || key}</b>
              <span>Status: {item.status}</span>
              {item.missing?.length ? <small>Faltando: {item.missing.join(", ")}</small> : null}
              {item.blocking?.length ? <small>Bloqueadores: {item.blocking.join(", ")}</small> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function cleanText(text = "") {
  return String(text || "")
    .replace(/[•*_\`>#|]+/g, "")
    .replace(/[📋📄📎📥🧾🧬🧪🩺⚠️✅❌⏳💾📝☁️🤖]/g, "")
    .split("\n")
    .map((line) => line.replace(/^\s*[-–—]\s*/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function SummaryBlock({ text }) {
  const linhas = cleanText(text).split("\n").filter(Boolean);
  if (!linhas.length) return <p className="oa-muted">Sem resumo estruturado.</p>;
  return (
    <div className="oa-summary">
      <div className="oa-section-title">RESUMO</div>
      {linhas.slice(0, 6).map((line, i) => (
        <div key={i} className="oa-summary-line">{line}</div>
      ))}
    </div>
  );
}

function AgentColumn({ title, subtitle, icon, tone, result, loading }) {
  const status = loading ? "Analisando..." : result ? result.posicionamento : "Aguardando caso";

  return (
    <section className={`oa-agent oa-agent-${tone}`}>
      <header className="oa-agent-head">
        <div className="oa-avatar">{icon}</div>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
          <small>{status}</small>
        </div>
      </header>

      {loading ? (
        <div className="oa-thinking"><span></span><span></span><span></span><b>Processando parecer...</b></div>
      ) : result ? (
        <div className="oa-agent-body">
          <SummaryBlock text={result.resumo || result.justificativa} />

          {result.pendencias_criticas?.length ? (
            <div className="oa-alert"><b>Pendências críticas</b><ul>{result.pendencias_criticas.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          ) : null}

          {result.evidencias?.length ? (
            <div className="oa-evidence">
              <b>Evidências</b>
              {result.evidencias.slice(0, 2).map((ev, i) => (
                <div key={i} className="oa-evidence-card"><strong>{ev.estudo}</strong><span>{ev.resultado}</span></div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="oa-empty">Aguardando deliberação.</div>
      )}
    </section>
  );
}

export default function BancadaOncologica({ pac, apiUrl }) {
  const API_BASE = apiUrl ? `${apiUrl}/api/oncoagent` : DEFAULT_API_BASE;
  const [form, setForm] = useState({ caso: "", idade: "", ecog: "", tumor: "", estadio: "", cid10: "", protocoloPretendido: "" });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  const agentsById = useMemo(() => {
    const map = {};
    response?.result?.agents?.forEach((agent) => { map[agent.agente] = agent; });
    return map;
  }, [response]);

  function update(name, value) { setForm((prev) => ({ ...prev, [name]: value })); }

  async function submit() {
    setError(""); setLoading(true); setResponse(null);
    try {
      const res = await fetch(`${API_BASE}/deliberar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Erro ao deliberar caso.");
      setResponse(data);
    } catch (err) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const final = response?.result?.final;
  const degraded = response?.result?.degradedMode;
  const release = response?.result?.release;

  return (
    <main className="oa-page">
      <header className="oa-header">
        <div><div className="oa-eyebrow">Hospital do Bem · APACApp · OncoAgent v1.6</div><h1>Bancada Oncológica Assistida</h1><p>Coordenador + agentes especialistas + SIGTAP + modo degradado + auditoria final.</p></div>
        <div className="oa-status"><span></span>Parecer preliminar · validação médica obrigatória</div>
      </header>

      <section className="oa-case">
        <div className="oa-case-main"><label>Caso clínico</label><textarea value={form.caso} onChange={(e) => update("caso", e.target.value)} placeholder="Descreva diagnóstico, histologia, biomarcadores, estádio, ECOG, tratamento prévio, dúvida clínica e objetivo terapêutico." /></div>
        <div className="oa-case-side">
          <label>Idade</label><input value={form.idade} onChange={(e) => update("idade", e.target.value)} placeholder="ex: 61 anos" />
          <label>ECOG</label><select value={form.ecog} onChange={(e) => update("ecog", e.target.value)}><option value="">A definir</option><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option></select>
          <label>Tumor</label><input value={form.tumor} onChange={(e) => update("tumor", e.target.value)} placeholder="ex: CPNPC" />
          <label>Estádio</label><input value={form.estadio} onChange={(e) => update("estadio", e.target.value)} placeholder="ex: IV" />
          <label>CID-10</label><input value={form.cid10} onChange={(e) => update("cid10", e.target.value)} placeholder="ex: C34.9" />
          <label>Protocolo pretendido</label><input value={form.protocoloPretendido} onChange={(e) => update("protocoloPretendido", e.target.value)} placeholder="ex: carbo+pem+pembro" />
          <button disabled={loading || !form.caso.trim()} onClick={submit}>{loading ? "Deliberando..." : "Convocar bancada"}</button>
        </div>
      </section>

      {error ? <div className="oa-error">{error}</div> : null}

      {response ? (
        <section className="oa-release">
          <Badge tone={response.result.criticalBlock ? "danger" : "success"}>{response.result.criticalBlock ? "Bloqueio crítico / revisar" : "Sem bloqueio crítico"}</Badge>
          <Badge tone={release?.prontuario_preliminar ? "success" : "danger"}>Prontuário preliminar: {release?.prontuario_preliminar ? "liberado" : "bloqueado"}</Badge>
          <Badge tone={release?.apac_rascunho ? "success" : "warning"}>APAC rascunho: {release?.apac_rascunho ? "liberado" : "degradado/bloqueado"}</Badge>
          <Badge tone={release?.prescricao_rascunho ? "success" : "warning"}>Prescrição: {release?.prescricao_rascunho ? "rascunho liberado" : "bloqueada"}</Badge>
        </section>
      ) : null}

      <section className="oa-grid">
        <AgentColumn title="Clínica Oncológica" subtitle="Eficácia, cenário, linha terapêutica" icon="MD" tone="teal" loading={loading} result={agentsById.prontuario} />
        <AgentColumn title="Biologia Molecular / Trials" subtitle="Biomarcadores, evidência, estudos" icon="BM" tone="gold" loading={loading} result={agentsById.trials} />
        <AgentColumn title="APAC / SIGTAP" subtitle="Anti-glosa, código, acesso SUS" icon="AP" tone="blue" loading={loading} result={agentsById.apac_antiglosa || agentsById.sigtap} />
        <AgentColumn title="Toxicidade / Paliativo" subtitle="ECOG, QV, segurança" icon="TX" tone="red" loading={loading} result={agentsById.toxicidade_paliativo} />
      </section>

      <section className="oa-final">
        <h2>Parecer consolidado preliminar</h2>
        {final ? (<><SummaryBlock text={final.resumo || final.justificativa} />{final.pendencias_criticas?.length ? <div className="oa-alert"><b>PENDÊNCIAS CRÍTICAS</b><ul>{final.pendencias_criticas.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}{degraded ? <details><summary>Modo degradado / thresholds</summary><pre>{JSON.stringify(degraded.outputs, null, 2)}</pre></details> : null}</>) : <p className="oa-muted">O parecer consolidado aparecerá após a deliberação.</p>}
      </section>
    </main>
  );
}
