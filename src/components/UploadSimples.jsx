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
      setErro("Adicione pelo menos um PDF/imagem ou cole o texto do exame.");
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
      <div style={{ fontSize: 13, fontWeight: 900, color: C.navy }}>{titulo}</div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); adicionar(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${drag ? C.teal : C.border}`,
          borderRadius: 12,
          padding: "30px 18px",
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
        <div style={{ fontSize: 34, marginBottom: 8 }}>📄</div>
        <div style={{ fontWeight: 900, color: C.navy, fontSize: 14 }}>
          Clique ou arraste PDF/imagem aqui
        </div>
        <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>
          PDF, JPG, PNG, WEBP · Ctrl+clique para múltiplos arquivos
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
              border: `1px solid ${C.border}`,
              borderRadius: 9,
              padding: "8px 10px",
            }}>
              <span style={{ fontSize: 17 }}>📎</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 10, color: C.gray }}>{detectarTipo(file.name)}</div>
              </div>
              <button
                type="button"
                onClick={event => remover(i, event)}
                style={{ border: "none", background: C.red, color: C.white, borderRadius: 7, padding: "3px 9px", cursor: "pointer", fontWeight: 900 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={textoLivre}
        onChange={e => setTextoLivre(e.target.value)}
        rows={4}
        placeholder="Opcional: cole aqui o texto do laudo, relatório ou resultado de exame..."
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: `1.5px solid ${C.border}`,
          borderRadius: 10,
          padding: "10px 12px",
          fontSize: 13,
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
          fontSize: 14,
          cursor: ativo && !enviando ? "pointer" : "not-allowed",
        }}
      >
        {enviando ? "Analisando com Claude..." : "Analisar com Claude"}
      </button>
    </div>
  );
}
