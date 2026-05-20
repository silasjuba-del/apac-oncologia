// src/components/EvolutionTimeline.jsx
// Adapted from OncoApp_v5/components/clinical/EvolutionTimeline.tsx
const N = "#1B365D", T = "#2B7A8C", G = "#B8860B", VE = "#15803D", VM = "#B91C1C";

export default function EvolutionTimeline({ exams = [], triages = [] }) {
  const items = [
    ...exams.map(e => ({ date: new Date(e.data || e.dataExame || Date.now()), type: "exam", data: e })),
    ...triages.map(t => ({ date: new Date(t.dataHora || t.data || Date.now()), type: "triage", data: t })),
  ].sort((a, b) => b.date - a.date);

  if (!items.length) return (
    <p style={{ textAlign: "center", color: "#9ca3af", fontStyle: "italic", padding: "24px 0", fontSize: 13 }}>
      Nenhum exame ou evolução registrado.
    </p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 72, flexShrink: 0, textAlign: "right", paddingTop: 4 }}>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>
              {item.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </div>
            <div style={{ fontSize: 9, color: "#d1d5db" }}>{item.date.getFullYear()}</div>
          </div>
          <div style={{ flex: 1, borderLeft: `4px solid ${item.type === "triage" ? T : G}`, paddingLeft: 14, paddingBottom: 16 }}>
            {item.type === "exam" ? <ExamCard e={item.data} /> : <TriageCard t={item.data} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExamCard({ e }) {
  const nome = e.nome || e.tipo || e.nomeExame || "Exame";
  const resumo = e.resumo || e.resultado || e.laudo || "";
  const achados = e.achadosPrincipais || e.achados || [];
  const fonte = e.fonte || e.responsavel || "";
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, color: N }}>{nome}</div>
      {resumo && <p style={{ fontSize: 13, color: "#4b5563", marginTop: 4, lineHeight: 1.5 }}>{resumo}</p>}
      {achados.length > 0 && (
        <ul style={{ marginTop: 4, paddingLeft: 18 }}>
          {achados.map((a, i) => <li key={i} style={{ fontSize: 11, color: "#6b7280" }}>{a}</li>)}
        </ul>
      )}
      {fonte && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6, textTransform: "uppercase" }}>Fonte: {fonte}</div>}
    </div>
  );
}

function TriageCard({ t }) {
  const vitals = [
    t.pa && `PA ${t.pa}`,
    t.fc && `FC ${t.fc}`,
    t.temperatura && `T ${t.temperatura}°C`,
    t.saturacao && `SpO2 ${t.saturacao}%`,
    t.ecog != null && `ECOG ${t.ecog}`,
  ].filter(Boolean).join(" — ");

  const alarmes = t.sinaisAlarme || [];
  const qtLiberada = t.qtLiberada;
  const autor = t.enfermeiroNome || t.enfermeiro || t.autor || "Equipe";
  const tipo = t.tipo || "consulta";
  const isMedico = tipo.toLowerCase().includes("consul") || tipo.toLowerCase().includes("evolu") || autor.toLowerCase().includes("dr.");
  const cardColor = isMedico ? "#1B365D" : "#2B7A8C";
  const cardLabel = isMedico ? `Evolução Médica — ${autor}` : `Triagem Enfermagem — ${autor}`;

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, color: cardColor }}>{cardLabel}</div>
      <p style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>{vitals || "Sinais vitais não registrados"}</p>
      {t.queixaAtual && <p style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>Queixa: {t.queixaAtual}</p>}
      {alarmes.length > 0 && (
        <p style={{ fontSize: 12, color: VM, marginTop: 4, fontWeight: 600 }}>Alarmes: {alarmes.join(" — ")}</p>
      )}
      {qtLiberada != null && (
        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: qtLiberada ? VE : VM }}>
          QT: {qtLiberada ? `LIBERADA${t.autorizadoPor ? " pelo médico" : ""}` : ` BLOQUEADA — ${t.qtBloqueadaPor || "aguarda médico"}`}
        </div>
      )}
    </div>
  );
}
