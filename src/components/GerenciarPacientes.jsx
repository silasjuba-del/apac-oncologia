// src/components/GerenciarPacientes.jsx
// Lista + busca + novo + importar laudo → paciente real
import { useState, useEffect } from "react";
import { exportarTudo, importarTudo, loadPacientes } from "../utils/storage.js";
import { dbCarregarPacientes, dbSalvarPaciente, dbDeletarPaciente } from "../utils/db.js";

const N="#1B365D",T="#2B7A8C",G="#B8860B",VE="#15803D",VM="#B91C1C",AM="#B45309";
const genID = () => "OI-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-6);

const PAC_VAZIO = {
  nome:"", nasc:"", cpf:"", cns:"", cidade:"", tel:"", mae:"",
  diag:"", cid:"", tnm:"", estadio:"", ecog:"", trat:"", linha:"", intencao:"",
  bio:"", peso:"", altura:"", alerg:"", meds:"", antec:"", queixa:"",
  cod_proc:"0304010072", sexo:"", municipio_cod:"", cep:"", raca:"",
  exFisico:"", justif_apac:"", validade_apac:"",
};

export default function GerenciarPacientes({ onAbrirPaciente, onNovoPaciente }) {
  const [lista, setLista]         = useState([]);
  const [busca, setBusca]         = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [importando, setImportando] = useState(false);
  const [msg, setMsg]             = useState("");

  useEffect(() => {
    // Carrega local imediatamente, depois sincroniza com nuvem
    setLista(loadPacientes());
    dbCarregarPacientes().then(l => { if(l?.length) setLista(l); });
  }, []);

  const filtrados = lista.filter(p =>
    !busca ||
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.cpf?.includes(busca) ||
    p.cns?.includes(busca) ||
    p.diag?.toLowerCase().includes(busca.toLowerCase()) ||
    p.pacID?.includes(busca)
  ).sort((a, b) => (b._atualizado || 0) - (a._atualizado || 0));

  function novoPaciente() {
    const pac = { ...PAC_VAZIO, pacID: genID() };
    dbSalvarPaciente(pac);
    setLista(prev => [pac, ...prev]);
    onNovoPaciente?.(pac);
  }

  function abrirPaciente(pac) {
    onAbrirPaciente?.(pac);
  }

  function confirmarDelete(pacID) {
    dbDeletarPaciente(pacID);
    setLista(prev => prev.filter(p => p.pacID !== pacID));
    setConfirmDel(null);
    flash("Paciente removido.");
  }

  function flash(t) { setMsg(t); setTimeout(() => setMsg(""), 3000); }

  function exportarJSON() {
    const dados = exportarTudo();
    const blob  = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a"); a.href = url;
    a.download  = `oncologia_backup_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.json`;
    a.click(); URL.revokeObjectURL(url);
    flash("Backup exportado.");
  }

  function importarJSON(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const ok = importarTudo(ev.target.result);
      if (ok) { setLista(loadPacientes()); flash("✅ Dados importados com sucesso!"); }
      else flash("❌ Arquivo inválido.");
    };
    reader.readAsText(f);
    setImportando(false);
  }

  const cardStyle = {
    background:"#fff", border:"1px solid #E2E8F0", borderRadius:13,
    padding:"12px 16px", cursor:"pointer", transition:"box-shadow .15s",
    display:"flex", alignItems:"center", gap:14,
  };

  return (
    <div style={{ display:"grid", gap:14 }}>
      {/* Barra superior */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="🔍  Buscar por nome, CPF, CNS, diagnóstico..."
          style={{ flex:1, minWidth:200, border:`1px solid #CBD5E1`, borderRadius:9, padding:"9px 14px", fontSize:13, outline:"none", background:"#F8FAFC" }}
        />
        <button onClick={novoPaciente}
          style={{ background:VE, color:"#fff", border:"none", borderRadius:9, padding:"9px 18px", fontWeight:800, fontSize:13, cursor:"pointer" }}>
          + Novo Paciente
        </button>
        <button onClick={exportarJSON}
          style={{ background:T, color:"#fff", border:"none", borderRadius:9, padding:"9px 14px", fontWeight:700, fontSize:12, cursor:"pointer" }}>
          ⬇ Backup
        </button>
        <label style={{ background:"#F1F5F9", color:N, border:`1px solid #CBD5E1`, borderRadius:9, padding:"9px 14px", fontWeight:700, fontSize:12, cursor:"pointer" }}>
          ⬆ Importar
          <input type="file" accept=".json" style={{ display:"none" }} onChange={importarJSON} />
        </label>
      </div>

      {/* Flash */}
      {msg && <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:9, padding:"8px 16px", color:VE, fontWeight:600, fontSize:13 }}>{msg}</div>}

      {/* Stats */}
      <div style={{ display:"flex", gap:10 }}>
        {[
          { l:"Total de pacientes", v:lista.length, c:N },
          { l:"Em tratamento ativo", v:lista.filter(p=>p.trat&&p.linha).length, c:T },
          { l:"APAC pendente", v:lista.filter(p=>p.diag&&!p.justif_apac).length, c:AM },
        ].map(s => (
          <div key={s.l} style={{ flex:1, background:"#fff", border:`1px solid #E2E8F0`, borderRadius:11, padding:"10px 14px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:"#94A3B8" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>👤</div>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>
            {busca ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado ainda"}
          </div>
          <div style={{ fontSize:13 }}>
            {busca ? "Tente outro termo de busca." : "Clique em \"+ Novo Paciente\" para começar."}
          </div>
        </div>
      )}

      {filtrados.map(p => (
        <div key={p.pacID} style={cardStyle}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,23,42,.1)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
          onClick={() => abrirPaciente(p)}
        >
          {/* Avatar */}
          <div style={{ width:44, height:44, borderRadius:"50%", background: p.diag ? `linear-gradient(135deg,${N},${T})` : "#E2E8F0",
            display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:16, flexShrink:0 }}>
            {p.nome ? p.nome[0].toUpperCase() : "?"}
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:14, color:N, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {p.nome || <span style={{ color:"#94A3B8" }}>Nome não informado</span>}
            </div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>
              {p.diag || <span style={{ color:"#CBD5E1" }}>Diagnóstico não informado</span>}
            </div>
            <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>
              {[p.pacID, p.estadio&&`Est. ${p.estadio}`, p.ecog&&`ECOG ${p.ecog}`, p.linha].filter(Boolean).join("  ·  ")}
            </div>
          </div>

          {/* Status */}
          <div style={{ flexShrink:0, textAlign:"right" }}>
            {p.trat && (
              <div style={{ fontSize:10, background: T+"22", color:T, borderRadius:20, padding:"2px 10px", fontWeight:700, marginBottom:4 }}>
                {p.linha || "Tratamento"}
              </div>
            )}
            {p._atualizado && (
              <div style={{ fontSize:9, color:"#CBD5E1" }}>
                {new Date(p._atualizado).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>

          {/* Botão deletar */}
          <button
            onClick={e => { e.stopPropagation(); setConfirmDel(p.pacID); }}
            style={{ background:"none", border:"none", color:"#CBD5E1", cursor:"pointer", fontSize:16, padding:"4px 8px", flexShrink:0 }}
            title="Remover paciente"
          >✕</button>
        </div>
      ))}

      {/* Modal confirmar delete */}
      {confirmDel && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:16, padding:28, maxWidth:380, width:"90%", boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ fontWeight:900, color:VM, fontSize:16, marginBottom:8 }}>⚠️ Remover paciente?</div>
            <p style={{ fontSize:13, color:"#64748B", marginBottom:20 }}>
              Todos os dados deste paciente serão excluídos permanentemente do dispositivo. Esta ação não pode ser desfeita.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => confirmarDelete(confirmDel)}
                style={{ flex:1, background:VM, color:"#fff", border:"none", borderRadius:9, padding:"10px", fontWeight:800, fontSize:13, cursor:"pointer" }}>
                Sim, remover
              </button>
              <button onClick={() => setConfirmDel(null)}
                style={{ flex:1, background:"#F1F5F9", color:N, border:"1px solid #E2E8F0", borderRadius:9, padding:"10px", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
