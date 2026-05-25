import React, { useRef, useState } from "react";

const C = {
  navy: "#1B365D",
  teal: "#2B7A8C",
  gold: "#B8860B",
  red: "#A30000",
  white: "#FFFFFF",
  gray: "#6B7C93",
  light: "#F8FAFC",
  border: "#CBD5E1",
};

const DRIVE_PASTA_URL = "https://drive.google.com/drive/folders/1s10nG9xXO_UrnIdrU8gYC6PYz4uvN9EH";
const abrirDrive = () => window.open(DRIVE_PASTA_URL, "_blank", "noopener,noreferrer");

function detectarTipo(nome) {
  const n = String(nome || "").toLowerCase();
  if (n.includes("biop")) return "biópsia";
  if (n.includes("ihq") || n.includes("imuno")) return "imunohistoquímica";
  if (n.includes("tomo") || n.includes("tc")) return "tomografia";
  if (n.includes("pet")) return "PET-CT";
  if (n.includes("cintilo")) return "cintilografia";
  if (n.includes("resson") || /\brm\b/.test(n)) return "ressonância magnética";
  if (n.includes("mamo")) return "mamografia";
  if (n.includes("lab") || n.includes("hemo")) return "laboratório";
  return "exame";
}

export default function UploadSimples({ pacienteId, onAnalisar, titulo = "Laudos para análise" }) {
  const inputRef = useRef(null);
  const [arquivos, setArquivos] = useState([]);
  const [textoLivre, setTextoLivre] = useState("");
  const [drag, setDrag] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [driveAberto, setDriveAberto] = useState(false);

  const adicionar = files => {
    const novos = Array.from(files || []).filter(f =>
      ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(f.type) ||
      /\.(pdf|jpe?g|png|webp)$/i.test(f.name)
    );
    setArquivos(atual => {
      const vistos = new Set(atual.map(f => f.name + "_" + f.size));
      return [...atual, ...novos.filter(f => !vistos.has(f.name + "_" + f.size))];
    });
  };

  const remover = (idx, event) => {
    event.stopPropagation();
    setArquivos(atual => atual.filter((_, i) => i !== idx));
  };

  const enviar = async () => {
    if (!arquivos.length && !textoLivre.trim()) {
      setErro("Adicione pelo menos um PDF, imagem ou texto de exame.");
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      const formData = new FormData();
      if (pacienteId) formData.append("paciente_id", pacienteId);
      if (textoLivre.trim()) formData.append("texto_livre", textoLivre.trim());
      arquivos.forEach(file => {
        formData.append("laudos", file);
        formData.append("tipos", detectarTipo(file.name));
        formData.append("datas", new Date().toISOString().slice(0, 10));
      });
      await onAnalisar?.(formData, { arquivos, textoLivre });
    } catch (e) {
      setErro(e.message || "Falha ao enviar para análise.");
    } finally {
      setEnviando(false);
    }
  };

  const ativo = arquivos.length > 0 || textoLivre.trim();

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: C.navy }}>{titulo}</div>

      {/* Atalho Google Drive */}
      <div
        onClick={() => { abrirDrive(); setDriveAberto(true); }}
        style={{
          background: "linear-gradient(135deg,#1a73e8,#0d5db7)",
          borderRadius: 12, padding: "11px 16px",
          display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
        }}
      >
        <div style={{ background: "rgba(255,255,255,.2)", borderRadius: 8, width: 38, height: 38, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>☁️</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>📂 Abrir Pasta Drive — Laudos do Paciente</div>
          <div style={{ color: "rgba(255,255,255,.8)", fontSize: 11, marginTop: 2 }}>Clique → pasta abre em nova aba → baixe o arquivo → arraste abaixo</div>
        </div>
        <div style={{ color: "rgba(255,255,255,.9)", fontSize: 20, fontWeight: 900 }}>→</div>
      </div>
      {driveAberto && (
        <div style={{ background: "#EAF7EE", border: "1px solid #15803D", borderRadius: 9, padding: "8px 14px", fontSize: 12, color: "#15803D", fontWeight: 700 }}>
          ✓ Pasta Drive aberta! Baixe os arquivos e arraste abaixo ou clique na zona de upload.
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); adicionar(e.dataTransfer.files); }}
        style={{
          border: "2px dashed " + (drag ? C.teal : C.border),
          borderRadius: 12,
          padding: "22px 18px",
          textAlign: "center",
          cursor: "pointer",
          background: drag ? "#E0F2F1" : C.light,
          transition: "all .15s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          style={{ display: "none" }}
          onChange={e => { adicionar(e.target.files); e.target.value = ""; }}
        />
        <div style={{ fontWeight: 900, color: C.navy, fontSize: 15 }}>
          Arraste aqui ou <span onClick={() => inputRef.current?.click()} style={{ color: C.teal, textDecoration: "underline", cursor: "pointer" }}>clique para selecionar arquivo</span>
        </div>
        <div style={{ fontSize: 12, color: C.gray, marginTop: 5, fontWeight: 700 }}>
          PDF, JPG, PNG, WEBP · Ctrl+clique para múltiplos
        </div>
      </div>

      {arquivos.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          {arquivos.map((file, i) => (
            <div key={file.name + file.size} style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: "#FFFFFF",
              border: "1px solid " + C.border,
              borderRadius: 9,
              padding: "8px 10px",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: C.gray, fontWeight: 700 }}>{detectarTipo(file.name)}</div>
              </div>
              <button
                type="button"
                onClick={event => remover(i, event)}
                style={{ border: "none", background: C.red, color: C.white, borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontWeight: 900 }}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={textoLivre}
        onChange={e => setTextoLivre(e.target.value)}
        rows={4}
        placeholder="Opcional: cole aqui o texto do laudo, relatório ou resultado de exame."
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1.5px solid " + C.border,
          borderRadius: 10,
          padding: "10px 12px",
          fontSize: 14,
          fontFamily: "Segoe UI, Arial, sans-serif",
          resize: "vertical",
          outline: "none",
        }}
      />

      {erro && <div style={{ color: C.red, fontSize: 12, fontWeight: 800 }}>{erro}</div>}

      <button
        type="button"
        onClick={enviar}
        disabled={!ativo || enviando}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 10,
          padding: "14px 16px",
          background: ativo && !enviando ? C.navy : C.border,
          color: ativo && !enviando ? C.white : C.gray,
          fontWeight: 900,
          fontSize: 15,
          cursor: ativo && !enviando ? "pointer" : "not-allowed",
        }}
      >
        {enviando ? "Analisando com Claude..." : "Analisar com Claude"}
      </button>
    </div>
  );
}
