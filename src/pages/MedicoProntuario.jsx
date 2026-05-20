// client/src/pages/MedicoProntuario.jsx v4
// Tela médica — sem Drive, upload direto + Claude

import { useState, useEffect, useRef, useCallback } from "react";
import UploadSimples from "../components/UploadSimples.jsx";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:3001").replace(/\/$/, "");

const C = {
  navy:"#1B365D", teal:"#2B7A8C", gold:"#B8860B",
  red:"#A30000", green:"#1B5E20",
  light:"#F0F4F8", white:"#FFFFFF", gray:"#6B7C93", border:"#CBD5E0",
};

// ─── Tipos de exame ───────────────────────────────────────────
const TIPOS_EXAME = [
  "biópsia","tomografia","PET-CT","cintilografia",
  "ressonância magnética","raio-X","laboratório","outro",
];

// ─── Parser do dossiê Claude ===SEÇÃO=== ─────────────────────
function parseDossie(texto) {
  if (!texto) return [];
  const blocos = [];
  const partes = texto.split(/===(.+?)===/g);
  for (let i = 1; i < partes.length; i += 2) {
    blocos.push({ titulo: partes[i].trim(), conteudo: (partes[i+1]||"").trim() });
  }
  return blocos;
}

// ─── Renderiza bloco do dossiê com formatação oncológica ──────
function BlocoDossie({ titulo, conteudo }) {
  const isOnco   = titulo === "DADOS ONCOLÓGICOS";
  const isVazio  = titulo === "CONDUTA" || titulo === "LABORATÓRIO E EXAME FÍSICO";
  const isObs    = titulo === "OBS CLAUDE";
  const isExames = titulo === "EXAMES";
  const corBorda = isObs ? C.gold : isOnco ? C.teal : C.navy;

  const linhas = conteudo.split("\n").filter(Boolean);

  return (
    <div style={{ marginBottom:20, borderLeft:`4px solid ${corBorda}`, paddingLeft:14 }}>
      <div style={{ fontSize:15, fontWeight:"bold", color:corBorda, textTransform:"uppercase",
        letterSpacing:1, marginBottom:10, paddingBottom:4, borderBottom:`1px solid ${C.light}` }}>
        {titulo}
      </div>

      {isVazio ? (
        <div style={{ background:"#FFFEF0", border:`1px dashed ${C.gold}`, borderRadius:6,
          padding:"10px 14px", fontSize:13, color:C.gray, fontStyle:"italic" }}>
          [ Preenchimento médico ]
        </div>
      ) : (
        <div>
          {linhas.map((linha, i) => {
            const isDiag  = /^diagnóstico:/i.test(linha);
            const isEstad = /^estadiamento:/i.test(linha);
            const isBio   = /^biomarcadores:/i.test(linha);
            const isSubt  = /^subtipo molecular:/i.test(linha);
            const isPend  = isObs && /^pendências:/i.test(linha);

            if (isDiag || isEstad) {
              const sep = linha.indexOf(":");
              return (
                <div key={i} style={{ marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:"bold", color:C.navy }}>
                    {linha.substring(0, sep)}:{" "}
                  </span>
                  <span style={{ fontSize:15, fontWeight:"bold", color:C.teal,
                    textTransform:"uppercase", letterSpacing:.5 }}>
                    {linha.substring(sep+1).trim()}
                  </span>
                </div>
              );
            }
            if (isBio || isSubt) {
              const sep = linha.indexOf(":");
              return (
                <div key={i} style={{ marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:"bold", color:C.navy }}>
                    {linha.substring(0, sep)}:{" "}
                  </span>
                  <span style={{ fontSize:13, fontWeight:"bold", color:"#1a202c" }}>
                    {linha.substring(sep+1).trim()}
                  </span>
                </div>
              );
            }
            if (isPend) return (
              <div key={i} style={{ fontSize:13, color:C.red, fontWeight:"bold", marginBottom:5 }}>
                ⚠ {linha}
              </div>
            );
            if (isExames && linha.startsWith("•")) return (
              <div key={i} style={{ background:C.light, borderRadius:6, padding:"8px 12px",
                marginBottom:8, fontSize:13, lineHeight:1.6 }}>
                {linha.replace("• ","")}
              </div>
            );
            if (linha.includes(":")) {
              const sep = linha.indexOf(":");
              return (
                <div key={i} style={{ marginBottom:6, fontSize:13, lineHeight:1.6 }}>
                  <span style={{ fontWeight:"bold", color:C.navy }}>{linha.substring(0,sep)}:</span>{" "}
                  <span style={{ color:"#1a202c" }}>{linha.substring(sep+1).trim()||"Não informado."}</span>
                </div>
              );
            }
            return (
              <div key={i} style={{ fontSize:13, lineHeight:1.7, color:"#1a202c", marginBottom:4 }}>
                {linha}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Documentos geráveis ──────────────────────────────────────
const DOCS = [
  { id:"sintomatic",  label:"Receita sintomáticos"          },
  { id:"antiemetico", label:"Receita antieméticos"          },
  { id:"analgesia",   label:"Receita analgesia"             },
  { id:"ev",          label:"Medicação endovenosa"          },
  { id:"exames",      label:"Solicitação de exames"         },
  { id:"dieta",       label:"Orientações dietéticas"        },
  { id:"alarme",      label:"Sinais de alarme"              },
  { id:"tcle",        label:"Termo de consentimento (TCLE)" },
];

// ═════════════════════════════════════════════════════════════
export default function MedicoProntuario() {
  const [busca,        setBusca]       = useState("");
  const [sugestoes,    setSugestoes]   = useState([]);
  const [paciente,     setPaciente]    = useState(null);
  const [laudos,       setLaudos]      = useState([]);
  const [metaLaudos,   setMetaLaudos]  = useState([]);
  const [textoLivre,   setTextoLivre]  = useState("");
  const [dossieId,     setDossieId]    = useState(null);
  const [dossieStatus, setStatus]      = useState("idle");
  const [blocos,       setBlocos]      = useState([]);
  const [dossieRaw,    setDossieRaw]   = useState("");
  const [evolucao,     setEvolucao]    = useState("");
  const [evolucaoId,   setEvolucaoId]  = useState(null);
  const [salvando,     setSalvando]    = useState(false);
  const [fase,         setFase]        = useState("upload");
  const [docsSelec,    setDocsSelec]   = useState([]);
  const [drag,         setDrag]        = useState(false);
  const pollingRef = useRef(null);
  const fileRef    = useRef();

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  // ── Busca paciente ────────────────────────────────────────
  async function buscarPacientes(q) {
    setBusca(q);
    if (q.length < 2) { setSugestoes([]); return; }
    try {
      const r = await fetch(`${API_URL}/api/paciente/busca?q=${encodeURIComponent(q)}`);
      setSugestoes(await r.json());
    } catch { setSugestoes([]); }
  }

  function selecionarPaciente(p) {
    setPaciente(p);
    setSugestoes([]);
    setBusca(p.nome);
    setFase("upload");
    setLaudos([]);
    setMetaLaudos([]);
    setTextoLivre("");
    setBlocos([]);
    setEvolucao("");
    setDossieId(null);
    setStatus("idle");
    if (pollingRef.current) clearInterval(pollingRef.current);
  }

  // ── Drag & Drop ───────────────────────────────────────────
  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false);
    const files = Array.from(e.dataTransfer.files)
      .filter(f => ["application/pdf","image/jpeg","image/png","image/webp"].includes(f.type));
    adicionarArquivos(files);
  }, []);

  function adicionarArquivos(files) {
    setLaudos(l => [...l, ...files]);
    setMetaLaudos(m => [
      ...m,
      ...files.map(f => ({
        tipo: detectarTipo(f.name),
        data: new Date().toISOString().substring(0,10),
      })),
    ]);
  }

  function removerArquivo(i) {
    setLaudos(l => l.filter((_,j) => j!==i));
    setMetaLaudos(m => m.filter((_,j) => j!==i));
  }

  function detectarTipo(nome) {
    const n = nome.toLowerCase();
    if (n.includes("biop"))    return "biópsia";
    if (n.includes("tomog"))   return "tomografia";
    if (n.includes("pet"))     return "PET-CT";
    if (n.includes("cintilo")) return "cintilografia";
    if (n.includes("rm"))      return "ressonância magnética";
    if (n.includes("lab") || n.includes("hemo")) return "laboratório";
    return "exame";
  }

  // ── Enviar para Claude ────────────────────────────────────
  async function analisar() {
    if (!paciente) return;
    if (!laudos.length && !textoLivre.trim()) {
      alert("Adicione pelo menos um laudo ou cole o texto do exame.");
      return;
    }
    setStatus("processando");
    setFase("dossie");
    setBlocos([]);

    try {
      const fd = new FormData();
      fd.append("paciente_id", paciente.id);
      if (textoLivre.trim()) fd.append("texto_livre", textoLivre);
      laudos.forEach((f, i) => {
        fd.append("laudos", f);
        fd.append("tipos", metaLaudos[i]?.tipo || "exame");
        fd.append("datas", metaLaudos[i]?.data || "");
      });

      const r    = await fetch(`${API_URL}/api/dossie/gerar`, { method:"POST", body:fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setDossieId(data.dossieId);

      // Polling a cada 4s
      pollingRef.current = setInterval(async () => {
        try {
          const s = await fetch(`${API_URL}/api/dossie/status/${data.dossieId}`).then(r => r.json());
          if (s.status_analise === "concluido") {
            clearInterval(pollingRef.current);
            setDossieRaw(s.resumo_claude);
            setBlocos(parseDossie(s.resumo_claude));
            setEvolucao(s.resumo_claude);
            setStatus("concluido");
          } else if (s.status_analise === "erro") {
            clearInterval(pollingRef.current);
            setStatus("erro");
          }
        } catch { clearInterval(pollingRef.current); setStatus("erro"); }
      }, 4000);

    } catch (e) {
      setStatus("erro");
      alert("Erro: " + e.message);
    }
  }

  // ── Salvar evolução ───────────────────────────────────────
  async function salvarEvolucao() {
    if (!paciente) return;
    setSalvando(true);
    try {
      const r = await fetch(`${API_URL}/api/medico/evolucao/salvar`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ paciente_id: paciente.id, dossie_id: dossieId, texto_evolucao: evolucao }),
      });
      const d = await r.json();
      setEvolucaoId(d.evolucaoId);
      setFase("docs");
    } finally { setSalvando(false); }
  }

  function toggleDoc(id) {
    setDocsSelec(s => s.includes(id) ? s.filter(x => x!==id) : [...s, id]);
  }

  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#EEF2F7", fontFamily:"Helvetica,Arial,sans-serif" }}>

      {/* ── Painel esquerdo ── */}
      <div style={{ width:260, background:C.white, borderRight:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ background:C.navy, padding:"18px 16px" }}>
          <div style={{ color:C.white, fontWeight:"bold", fontSize:15 }}>🏥 NOVA CONSULTA</div>
          <div style={{ color:"#a0b4cc", fontSize:12, marginTop:2 }}>Dr. Silas Negrão</div>
        </div>
        <div style={{ padding:12 }}>
          <div style={{ position:"relative" }}>
            <input value={busca} onChange={e => buscarPacientes(e.target.value)}
              placeholder="🔍 Nome ou CPF"
              style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`,
                borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
            {sugestoes.length > 0 && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:10,
                background:C.white, border:`1px solid ${C.border}`, borderRadius:8,
                boxShadow:"0 4px 12px rgba(0,0,0,.1)", maxHeight:240, overflowY:"auto" }}>
                {sugestoes.map(p => (
                  <button key={p.id} onClick={() => selecionarPaciente(p)}
                    style={{ width:"100%", textAlign:"left", padding:"10px 12px", border:"none",
                      borderBottom:`1px solid ${C.light}`, cursor:"pointer", background:C.white,
                      color:C.navy }}>
                    <div style={{ fontWeight:"bold", fontSize:13 }}>{p.nome}</div>
                    <div style={{ fontSize:11, color:C.gray, marginTop:2 }}>{p.cidade} | {p.status}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Painel principal ── */}
      <div style={{ flex:1, overflowY:"auto", padding:24 }}>

        {!paciente && (
          <div style={{ textAlign:"center", padding:60, color:C.gray }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
            <div style={{ fontSize:16 }}>Busque um paciente para iniciar</div>
          </div>
        )}

        {paciente && (
          <>
            {/* Header */}
            <div style={{ background:C.navy, borderRadius:10, padding:"16px 24px",
              display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <div style={{ color:C.white, fontWeight:"bold", fontSize:18 }}>
                  {paciente.nome?.toUpperCase()}
                </div>
                <div style={{ color:"#a0b4cc", fontSize:13 }}>
                  {paciente.cidade} | {paciente.diagnostico_cid || "diagnóstico pendente"}
                </div>
              </div>
              {dossieStatus === "processando" && (
                <div style={{ color:"#a0b4cc", fontSize:13 }}>
                  <span style={{ display:"inline-block", width:14, height:14, border:"2px solid #a0b4cc",
                    borderTopColor:"transparent", borderRadius:"50%", animation:"spin .7s linear infinite",
                    verticalAlign:"middle", marginRight:6 }} />
                  Claude analisando…
                </div>
              )}
            </div>

            {/* ── FASE: UPLOAD ── */}
            {fase === "upload" && (
              <div style={{ background:C.white, borderRadius:10, padding:24, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:15, fontWeight:"bold", color:C.navy, marginBottom:20 }}>
                  📂 Laudos para análise
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current.click()}
                  style={{ border:`2px dashed ${drag ? C.teal : C.border}`, borderRadius:10,
                    padding:"32px 20px", textAlign:"center", cursor:"pointer",
                    background: drag ? "#E0F2F1" : C.light, marginBottom:16, transition:"all .15s" }}>
                  <input ref={fileRef} type="file" multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    style={{ display:"none" }}
                    onChange={e => adicionarArquivos(Array.from(e.target.files))} />
                  <div style={{ fontSize:36, marginBottom:8 }}>📄</div>
                  <div style={{ fontWeight:"bold", color:C.navy, fontSize:14 }}>
                    Arraste os laudos ou clique para selecionar
                  </div>
                  <div style={{ fontSize:12, color:C.gray, marginTop:4 }}>
                    PDF, JPG, PNG — biópsia, tomografia, PET-CT, cintilografia, labs
                  </div>
                </div>

                {/* Lista de arquivos */}
                {laudos.map((f, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                    background:C.light, borderRadius:8, padding:"10px 14px", marginBottom:8 }}>
                    <span style={{ fontSize:20 }}>📄</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:"bold", color:C.navy }}>{f.name}</div>
                      <div style={{ display:"flex", gap:8, marginTop:6 }}>
                        <select value={metaLaudos[i]?.tipo||"exame"}
                          onChange={e => setMetaLaudos(m => m.map((x,j) => j===i ? {...x,tipo:e.target.value} : x))}
                          style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${C.border}`,
                            fontSize:12, background:C.white }}>
                          {TIPOS_EXAME.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input type="date" value={metaLaudos[i]?.data||""}
                          onChange={e => setMetaLaudos(m => m.map((x,j) => j===i ? {...x,data:e.target.value} : x))}
                          style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${C.border}`,
                            fontSize:12 }} />
                      </div>
                    </div>
                    <button onClick={() => removerArquivo(i)}
                      style={{ background:C.red, color:C.white, border:"none", borderRadius:6,
                        padding:"4px 10px", cursor:"pointer", fontSize:13 }}>✕</button>
                  </div>
                ))}

                {/* Texto livre */}
                <div style={{ marginTop:16 }}>
                  <label style={{ fontSize:13, fontWeight:"bold", color:C.navy,
                    display:"block", marginBottom:6 }}>
                    Ou cole o texto do laudo aqui
                  </label>
                  <textarea value={textoLivre} onChange={e => setTextoLivre(e.target.value)}
                    rows={5}
                    placeholder="Cole aqui o texto de qualquer laudo, relatório ou resultado de exame…"
                    style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${C.border}`,
                      borderRadius:8, fontSize:13, resize:"vertical", boxSizing:"border-box",
                      fontFamily:"inherit" }} />
                </div>

                <button onClick={analisar}
                  disabled={!laudos.length && !textoLivre.trim()}
                  style={{ width:"100%", marginTop:16, padding:"14px 0",
                    background: (laudos.length || textoLivre.trim()) ? C.navy : C.border,
                    color: (laudos.length || textoLivre.trim()) ? C.white : C.gray,
                    border:"none", borderRadius:8, fontSize:15, fontWeight:"bold", cursor:"pointer" }}>
                  🔬 Analisar com Claude
                </button>
              </div>
            )}

            {/* ── FASE: DOSSIÊ / EVOLUÇÃO / DOCS / APAC ── */}
            {(fase === "dossie" || fase === "evolucao" || fase === "docs" || fase === "apac") && (
              <div>

                {/* Loading */}
                {dossieStatus === "processando" && (
                  <div style={{ background:C.white, borderRadius:10, padding:40,
                    textAlign:"center", border:`1px solid ${C.border}`, marginBottom:20 }}>
                    <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
                    <div style={{ fontWeight:"bold", color:C.navy, fontSize:15, marginBottom:8 }}>
                      Claude está analisando os laudos…
                    </div>
                    <div style={{ color:C.gray, fontSize:13 }}>
                      Extraindo diagnóstico, estadiamento e biomarcadores
                    </div>
                    <div style={{ height:4, background:C.light, borderRadius:2, marginTop:20, overflow:"hidden" }}>
                      <div style={{ height:"100%", background:C.teal, borderRadius:2, width:"60%",
                        animation:"progress 2s ease-in-out infinite alternate" }} />
                    </div>
                  </div>
                )}

                {/* Erro */}
                {dossieStatus === "erro" && (
                  <div style={{ background:"#fee2e2", border:`1px solid ${C.red}`, borderRadius:10,
                    padding:20, marginBottom:20, textAlign:"center" }}>
                    <div style={{ color:C.red, fontWeight:"bold", marginBottom:8 }}>
                      ⚠ Falha na análise
                    </div>
                    <div style={{ color:"#7f1d1d", fontSize:13 }}>
                      Verifique a chave ANTHROPIC_API_KEY no servidor e tente novamente.
                    </div>
                    <button onClick={() => { setFase("upload"); setStatus("idle"); }}
                      style={{ marginTop:14, padding:"9px 20px", background:C.navy, color:C.white,
                        border:"none", borderRadius:8, cursor:"pointer" }}>
                      ← Voltar e tentar novamente
                    </button>
                  </div>
                )}

                {/* Resumo Claude */}
                {dossieStatus === "concluido" && blocos.length > 0 && (
                  <>
                    <div style={{ background:C.white, borderRadius:10, padding:24,
                      border:`1px solid ${C.border}`, marginBottom:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                        <div style={{ fontSize:15, fontWeight:"bold", color:C.navy }}>
                          📋 RESUMO CLAUDE
                        </div>
                        <button onClick={() => setFase("upload")}
                          style={{ padding:"7px 14px", border:`1px solid ${C.border}`,
                            borderRadius:8, fontSize:13, cursor:"pointer", background:C.white }}>
                          ← Novo upload
                        </button>
                      </div>
                      {blocos.map((b, i) => <BlocoDossie key={i} titulo={b.titulo} conteudo={b.conteudo} />)}
                    </div>

                    {/* Evolução médica */}
                    <div style={{ background:C.white, borderRadius:10, border:`1px solid ${C.border}`,
                      overflow:"hidden", marginBottom:16 }}>
                      <div style={{ background:"#F7F9FC", padding:"12px 20px",
                        borderBottom:`1px solid ${C.border}`, display:"flex",
                        justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ fontSize:14, fontWeight:"bold", color:C.navy }}>
                          ✏️ EVOLUÇÃO MÉDICA
                        </div>
                        <div style={{ fontSize:12, color:C.gray }}>
                          Edite livremente — texto pré-preenchido pelo Claude
                        </div>
                      </div>
                      <textarea value={evolucao} onChange={e => setEvolucao(e.target.value)}
                        style={{ width:"100%", minHeight:400, padding:20, border:"none", outline:"none",
                          fontSize:13, lineHeight:1.8, fontFamily:"Courier New, monospace",
                          resize:"vertical", boxSizing:"border-box", color:"#1a202c",
                          background:"#FAFCFD" }} />
                      <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`,
                        display:"flex", gap:10, justifyContent:"flex-end" }}>
                        <button onClick={salvarEvolucao} disabled={salvando}
                          style={{ padding:"11px 28px", background:C.navy, color:C.white,
                            border:"none", borderRadius:8, fontWeight:"bold", fontSize:14,
                            cursor:"pointer" }}>
                          {salvando ? "Salvando…" : "💾 Salvar evolução"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Gerar documentos */}
                {fase === "docs" && (
                  <div style={{ background:C.white, borderRadius:10, padding:24,
                    border:`1px solid ${C.border}`, marginBottom:16 }}>
                    <div style={{ fontSize:15, fontWeight:"bold", color:C.navy, marginBottom:16 }}>
                      📄 GERAR DOCUMENTOS
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                      {DOCS.map(d => (
                        <label key={d.id} style={{ display:"flex", alignItems:"center", gap:10,
                          padding:"10px 14px", border:`1.5px solid ${docsSelec.includes(d.id) ? C.teal : C.border}`,
                          borderRadius:8, cursor:"pointer",
                          background: docsSelec.includes(d.id) ? "#E0F2F1" : C.white }}>
                          <input type="checkbox" checked={docsSelec.includes(d.id)}
                            onChange={() => toggleDoc(d.id)} style={{ width:16, height:16 }} />
                          <span style={{ fontSize:13, color:C.navy }}>{d.label}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <button
                        onClick={() => { setDocsSelec(DOCS.map(d => d.id)); alert("Gerando todos os documentos…"); }}
                        style={{ flex:1, padding:"12px 0", background:C.teal, color:C.white,
                          border:"none", borderRadius:8, fontWeight:"bold", fontSize:14, cursor:"pointer" }}>
                        🖨️ Imprimir todos
                      </button>
                      <button
                        disabled={!docsSelec.length}
                        onClick={() => alert(`Gerando: ${docsSelec.join(", ")}`)}
                        style={{ flex:1, padding:"12px 0",
                          background: docsSelec.length ? C.navy : C.border,
                          color: docsSelec.length ? C.white : C.gray,
                          border:"none", borderRadius:8, fontWeight:"bold", fontSize:14, cursor:"pointer" }}>
                        📋 Imprimir selecionados ({docsSelec.length})
                      </button>
                    </div>
                    <button onClick={() => setFase("apac")}
                      style={{ width:"100%", marginTop:10, padding:"12px 0",
                        background:C.gold, color:C.white, border:"none",
                        borderRadius:8, fontWeight:"bold", fontSize:14, cursor:"pointer" }}>
                      📑 Gerar APAC →
                    </button>
                  </div>
                )}

                {/* APAC simplificada */}
                {fase === "apac" && (
                  <APACPanel paciente={paciente} evolucaoId={evolucaoId} dossieRaw={dossieRaw} />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress { from { width:20%; } to { width:80%; } }
      `}</style>
    </div>
  );
}

// ─── Painel APAC ──────────────────────────────────────────────
function APACPanel({ paciente, evolucaoId, dossieRaw }) {
  const [campos, setCampos] = useState({
    nome:"", cpf:"", cns:"", nome_mae:"", municipio:"",
    cid10:"", diagnostico_histologico:"", data_biopsia:"",
    estadiamento:"", procedimento_sigtap:"", linha_tratamento:"",
    protocolo:"", justificativa_clinica:"", laudos_comprobatorios:"",
    peso:"", altura:"", superficie_corporal:"",
    funcao_renal:"", funcao_hepatica:"",
  });
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (paciente) {
      setCampos(c => ({
        ...c,
        nome:    paciente.nome    || "",
        cpf:     paciente.cpf     || "",
        cns:     paciente.cns     || "",
        nome_mae:paciente.nome_mae|| "",
        municipio:paciente.cidade || "",
      }));
    }
  }, [paciente]);

  async function gerarAPAC() {
    setGerando(true);
    try {
      const r = await fetch(`${API_URL}/api/apac/gerar`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ evolucao_id: evolucaoId, paciente_id: paciente.id }),
      });
      const d = await r.json();
      if (d.campos) setCampos(x => ({ ...x, ...d.campos }));
    } finally { setGerando(false); }
  }

  const OBRIG = ["nome","cpf","cns","nome_mae","municipio","cid10",
    "diagnostico_histologico","data_biopsia","estadiamento",
    "procedimento_sigtap","linha_tratamento","protocolo","justificativa_clinica"];

  const pendencias = OBRIG.filter(k => !campos[k]?.trim());
  const risco = pendencias.length === 0 ? "baixo" : pendencias.length <= 3 ? "medio" : "alto";
  const riscoLabel = { baixo:"✅ RISCO BAIXO", medio:"⚠ RISCO MÉDIO", alto:"⛔ RISCO ALTO" };
  const riscoCor   = { baixo:C.green, medio:C.gold, alto:C.red };

  return (
    <div style={{ background:C.white, borderRadius:10, border:`1px solid ${C.border}`, overflow:"hidden" }}>
      <div style={{ background:C.navy, padding:"14px 20px", display:"flex", justifyContent:"space-between" }}>
        <div style={{ color:C.white, fontWeight:"bold", fontSize:16 }}>📑 APAC — SUS</div>
        <button onClick={gerarAPAC} disabled={gerando}
          style={{ padding:"7px 18px", background:C.teal, color:C.white, border:"none",
            borderRadius:8, fontWeight:"bold", fontSize:13, cursor:"pointer" }}>
          {gerando ? "Preenchendo…" : "🤖 Preencher com Claude"}
        </button>
      </div>

      <div style={{ padding:20 }}>
        {/* Status anti-glosa */}
        <div style={{ background: riscoCor[risco]+"20", border:`2px solid ${riscoCor[risco]}`,
          borderRadius:8, padding:"12px 16px", marginBottom:20,
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:"bold", color:riscoCor[risco], fontSize:15 }}>
              {riscoLabel[risco]} DE GLOSA
            </div>
            <div style={{ fontSize:12, color:C.gray, marginTop:3 }}>
              {pendencias.length === 0
                ? "Todos os campos obrigatórios preenchidos."
                : `${pendencias.length} campo(s) obrigatório(s) em aberto`}
            </div>
          </div>
          <div style={{ fontSize:24, fontWeight:"bold", color:riscoCor[risco] }}>
            {Math.round(((OBRIG.length - pendencias.length) / OBRIG.length) * 100)}%
          </div>
        </div>

        {/* Campos APAC */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {[
            ["nome","Nome completo"], ["cpf","CPF"], ["cns","CNS / Cartão SUS"],
            ["nome_mae","Nome da mãe"], ["municipio","Município"],
            ["cid10","CID-10"], ["diagnostico_histologico","Diagnóstico histológico"],
            ["data_biopsia","Data da biópsia"], ["estadiamento","Estadiamento TNM"],
            ["procedimento_sigtap","Procedimento SIGTAP"],
            ["linha_tratamento","Linha de tratamento"], ["protocolo","Protocolo"],
            ["peso","Peso (kg)"], ["altura","Altura (cm)"],
            ["funcao_renal","Função renal"], ["funcao_hepatica","Função hepática"],
          ].map(([k, lab]) => {
            const falta = OBRIG.includes(k) && !campos[k]?.trim();
            return (
              <div key={k}>
                <label style={{ fontSize:12, fontWeight:"bold", display:"block", marginBottom:4,
                  color: falta ? C.red : C.navy }}>
                  {falta ? "⚠ " : "✓ "}{lab}
                </label>
                <input value={campos[k]||""} onChange={e => setCampos(x => ({...x,[k]:e.target.value}))}
                  style={{ width:"100%", padding:"8px 10px",
                    border:`1.5px solid ${falta ? C.red : C.border}`,
                    borderRadius:7, fontSize:13, boxSizing:"border-box" }} />
              </div>
            );
          })}
          <div style={{ gridColumn:"1 / -1" }}>
            <label style={{ fontSize:12, fontWeight:"bold", display:"block", marginBottom:4,
              color: !campos.justificativa_clinica?.trim() ? C.red : C.navy }}>
              {!campos.justificativa_clinica?.trim() ? "⚠ " : "✓ "}Justificativa clínica
            </label>
            <textarea value={campos.justificativa_clinica||""}
              onChange={e => setCampos(x => ({...x,justificativa_clinica:e.target.value}))}
              rows={3}
              style={{ width:"100%", padding:"8px 10px",
                border:`1.5px solid ${!campos.justificativa_clinica?.trim() ? C.red : C.border}`,
                borderRadius:7, fontSize:13, resize:"vertical", boxSizing:"border-box" }} />
          </div>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={() => {
            fetch(`${API_URL}/api/apac/${evolucaoId || 0}`, {
              method:"PUT", headers:{"Content-Type":"application/json"},
              body:JSON.stringify(campos),
            });
            alert("APAC salva com sucesso!");
          }} style={{ flex:1, padding:"12px 0", background:C.navy, color:C.white,
            border:"none", borderRadius:8, fontWeight:"bold", fontSize:14, cursor:"pointer" }}>
            💾 Salvar APAC
          </button>
          <button onClick={() => window.print()}
            style={{ padding:"12px 20px", background:C.teal, color:C.white,
              border:"none", borderRadius:8, fontWeight:"bold", fontSize:14, cursor:"pointer" }}>
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
