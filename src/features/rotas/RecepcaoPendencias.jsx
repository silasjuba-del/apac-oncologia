// === src/features/rotas/RecepcaoPendencias.jsx ===
// APACApp v1.1.7 — Rota /recepcao/pendencias
//
// Auditor 6 (critério 7): "A recepção e enfermagem deveriam ter suas próprias
// caixas de trabalho. O médico não deve entrar em pendência administrativa."
//
// Esta rota mostra TODAS as pendências cadastrais (CPF inválido, CNS inválido,
// nome incompleto, mãe vazia, etc.) que foram detectadas pelos agentes locais
// e roteadas para a recepção via `destinatarioPendencia(campo) === 'recepcao'`.

import { useState, useCallback, useMemo } from 'react';
import {
  validarAPACBase, destinatarioPendencia, PENDENCIA_RECEPCAO,
} from '../oncoProUtils.js';

const N = '#1B365D'; const T = '#2B7A8C'; const G = '#B8860B';
const VE = '#15803D'; const VM = '#B91C1C'; const ROXO = '#7C3AED';
const BG = '#EEF2F7';

const card = { background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,.07)', border:'1px solid #E2E8F0', padding:20, marginBottom:16 };
const titulo = { fontSize:18, fontWeight:900, color:N, textTransform:'uppercase', letterSpacing:.6, borderBottom:`3px solid ${ROXO}`, paddingBottom:7, margin:'0 0 14px' };
const inp = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #CBD5E1', fontSize:14, fontWeight:600, fontFamily:'inherit', boxSizing:'border-box' };
const lab = { display:'block', fontSize:12, fontWeight:700, color:N, marginBottom:4, letterSpacing:.3 };
const btnPri = { background:ROXO, color:'#fff', fontWeight:900, borderRadius:10, padding:'10px 16px', border:'none', cursor:'pointer', fontSize:14 };

export default function RecepcaoPendencias({ pac, pacienteKey, onSubmit }) {
  const [valores, setValores] = useState({});
  const [enviado, setEnviado] = useState(false);

  // Calcula pendências do paciente atual filtradas para recepção
  const pendenciasRecepcao = useMemo(() => {
    if (!pac) return [];
    const validacoes = validarAPACBase(pac);
    return validacoes.filter(v => destinatarioPendencia(v.campo) === 'recepcao');
  }, [pac]);

  const enviar = useCallback(() => {
    const payload = {};
    Object.entries(valores).forEach(([k, v]) => {
      const s = String(v || '').trim();
      if (s) payload[k] = s;
    });
    if (Object.keys(payload).length === 0) return;
    onSubmit?.({
      origem: 'recepcao',
      rota: '/recepcao/pendencias',
      pacienteKey: pacienteKey || `tmp-${Date.now()}`,
      payload,
      ator: 'recepcao',
    });
    setEnviado(true);
    setValores({});
  }, [valores, pacienteKey, onSubmit]);

  return (
    <div style={{ background:BG, minHeight:'100vh', padding:'20px 16px' }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <div style={{ marginBottom:14 }}>
          <p style={{ margin:0, fontSize:11, color:ROXO, fontWeight:700, letterSpacing:1 }}>APACApp · v1.1.7</p>
          <h1 style={{ margin:'4px 0 0', fontSize:24, fontWeight:900, color:N }}>🪪 Recepção — Pendências</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>
            Campos cadastrais que o sistema detectou como faltantes ou inválidos. Resolva aqui — não interrompe o médico.
          </p>
          {pac?.nome && (
            <p style={{ margin:'8px 0 0', fontSize:13, fontWeight:700, color:N, background:'#fff', padding:'8px 12px', borderRadius:8, border:'1px solid #E2E8F0' }}>
              👤 Paciente: {pac.nome}{pac.cns ? ` · CNS ${pac.cns}` : ''}
            </p>
          )}
        </div>

        {pendenciasRecepcao.length === 0 ? (
          <div style={{ ...card, background:'#ECFDF5', borderColor:'#A7F3D0' }}>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#065F46' }}>
              ✓ Nenhuma pendência cadastral para este paciente.
            </p>
            <p style={{ margin:'6px 0 0', fontSize:12, color:'#047857' }}>
              Todos os campos administrativos estão preenchidos e válidos.
            </p>
          </div>
        ) : (
          <div style={card}>
            <h3 style={titulo}>
              📋 {pendenciasRecepcao.length} pendência(s) cadastral(is)
            </h3>
            {pendenciasRecepcao.map((p, i) => (
              <div key={i} style={{
                marginBottom:14, padding:12, background:'#F8FAFC',
                borderLeft:`3px solid ${p.critico ? VM : ROXO}`, borderRadius:6,
              }}>
                <label style={lab}>
                  {p.label || p.campo}
                  {p.critico && <span style={{ color:VM, fontSize:10, marginLeft:6 }}>● BLOQUEIA APAC</span>}
                </label>
                <p style={{ margin:'2px 0 8px', fontSize:12, color:'#6B7280' }}>
                  Tipo: {p.tipo || 'campo vazio'}
                </p>
                <input
                  type="text"
                  value={valores[p.campo] || ''}
                  onChange={e => setValores(v => ({ ...v, [p.campo]: e.target.value }))}
                  placeholder={`Digite ${p.label || p.campo}...`}
                  style={inp}
                />
              </div>
            ))}

            <button
              onClick={enviar}
              disabled={Object.keys(valores).length === 0}
              style={{
                ...btnPri,
                marginTop:8, width:'100%',
                opacity: Object.keys(valores).length === 0 ? 0.5 : 1,
                cursor: Object.keys(valores).length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ✓ Resolver {Object.keys(valores).length} pendência(s)
            </button>
            {enviado && (
              <p style={{ marginTop:10, padding:8, fontSize:12, color:'#065F46', background:'#D1FAE5', borderRadius:6, fontWeight:600 }}>
                ✓ Pendências enviadas. Os campos serão aplicados automaticamente.
              </p>
            )}
          </div>
        )}

        <div style={{ ...card, background:'#F0F9FF', borderColor:'#BAE6FD' }}>
          <p style={{ margin:0, fontSize:12, color:'#075985' }}>
            ℹ️ Suas correções têm <strong>prioridade alta</strong> (fonte 80) — sobrescrevem automaticamente o que o paciente declarou.
          </p>
        </div>
      </div>
    </div>
  );
}
