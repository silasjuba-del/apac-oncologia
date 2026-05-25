// === src/features/rotas/RecepcaoCadastro.jsx ===
// APACApp v1.1.6 — Rota /recepcao/cadastro
//
// Recepção corrige/completa dados administrativos. Fonte = 'recepcao'
// (prioridade 80 — sobrescreve paciente, NÃO sobrescreve médico).
//
// Validação local de CPF e CNS antes de emitir.

import { useState, useEffect } from 'react';
import { validarCPF, validarCNS } from '../oncoProUtils.js';

const N = '#1B365D'; const T = '#2B7A8C'; const G = '#B8860B';
const VE = '#15803D'; const VM = '#B91C1C'; const BG = '#EEF2F7';

const inputStyle = {
  width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #D1D5DB',
  fontSize:14, fontFamily:'inherit',
};
const labelStyle = {
  fontSize:12, fontWeight:700, color:N, marginBottom:4, display:'block',
};

export default function RecepcaoCadastro({ pac, pacienteKey, onSubmit }) {
  // Inicia com valores do paciente (se já houver)
  const [form, setForm] = useState({
    nome: pac?.nome || '',
    nasc: pac?.nasc || '',
    sexo: pac?.sexo || '',
    mae: pac?.mae || '',
    cpf: pac?.cpf || '',
    cns: pac?.cns || '',
    cidade: pac?.cidade || '',
    telefone: pac?.telefone || '',
    endereco: pac?.endereco || '',
  });
  const [enviado, setEnviado] = useState(false);

  // Sincroniza com pac quando muda
  useEffect(() => {
    setForm(f => ({
      nome: pac?.nome ?? f.nome,
      nasc: pac?.nasc ?? f.nasc,
      sexo: pac?.sexo ?? f.sexo,
      mae:  pac?.mae  ?? f.mae,
      cpf:  pac?.cpf  ?? f.cpf,
      cns:  pac?.cns  ?? f.cns,
      cidade: pac?.cidade ?? f.cidade,
      telefone: pac?.telefone ?? f.telefone,
      endereco: pac?.endereco ?? f.endereco,
    }));
    setEnviado(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteKey]);

  const up = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const cpfValido = !form.cpf || validarCPF(form.cpf);
  const cnsValido = !form.cns || validarCNS(form.cns);
  const podeEnviar = form.nome.trim().length >= 3 && form.nasc && cpfValido && cnsValido;

  const enviar = () => {
    if (!podeEnviar) return;
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      const s = String(v).trim();
      if (s) payload[k] = s;
    });
    onSubmit?.({
      origem: 'recepcao',
      rota: '/recepcao/cadastro',
      pacienteKey: pacienteKey || `paciente-${Date.now()}`,
      payload,
      ator: 'recepcao',
    });
    setEnviado(true);
    setTimeout(() => setEnviado(false), 2500);
  };

  return (
    <div style={{ background:BG, minHeight:'100vh', padding:'20px 16px' }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <div style={{ marginBottom:14 }}>
          <p style={{ margin:0, fontSize:11, color:T, fontWeight:700, letterSpacing:1 }}>APACApp · RECEPÇÃO</p>
          <h2 style={{ margin:'4px 0 0', fontSize:22, fontWeight:900, color:N }}>
            🪪 Cadastro do paciente
          </h2>
          <p style={{ margin:'6px 0 0', fontSize:13, color:'#6B7280' }}>
            Confira e complete os dados. Após salvar, os agentes locais rodam automaticamente.
          </p>
        </div>

        <div style={{
          background:'#fff', borderRadius:14, padding:24,
          boxShadow:'0 2px 10px rgba(0,0,0,.07)',
        }}>
          <Secao titulo="Identificação">
            <Campo label="Nome completo *">
              <input style={inputStyle} value={form.nome} onChange={up('nome')} />
            </Campo>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>
              <Campo label="Data de nascimento *">
                <input style={inputStyle} type="date" value={form.nasc} onChange={up('nasc')} />
              </Campo>
              <Campo label="Sexo">
                <select style={inputStyle} value={form.sexo} onChange={up('sexo')}>
                  <option value="">—</option>
                  <option value="F">Feminino</option>
                  <option value="M">Masculino</option>
                </select>
              </Campo>
            </div>
            <Campo label="Nome da mãe">
              <input style={{ ...inputStyle, marginTop:10 }} value={form.mae} onChange={up('mae')} />
            </Campo>
          </Secao>

          <Secao titulo="Documentos">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Campo label="CPF">
                <input style={{ ...inputStyle, borderColor: cpfValido ? '#D1D5DB' : VM }}
                  value={form.cpf} onChange={up('cpf')} placeholder="11 dígitos" />
                {!cpfValido && <p style={{ fontSize:11, color:VM, margin:'4px 0 0' }}>⚠ CPF inválido</p>}
              </Campo>
              <Campo label="CNS (Cartão SUS) *">
                <input style={{ ...inputStyle, borderColor: cnsValido ? '#D1D5DB' : VM }}
                  value={form.cns} onChange={up('cns')} placeholder="15 dígitos" />
                {!cnsValido && <p style={{ fontSize:11, color:VM, margin:'4px 0 0' }}>⚠ CNS inválido</p>}
              </Campo>
            </div>
          </Secao>

          <Secao titulo="Contato">
            <Campo label="Cidade">
              <input style={inputStyle} value={form.cidade} onChange={up('cidade')} placeholder="Ex: Patos-PB" />
            </Campo>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10, marginTop:10 }}>
              <Campo label="Telefone">
                <input style={inputStyle} value={form.telefone} onChange={up('telefone')} placeholder="(83) 99999-9999" />
              </Campo>
              <Campo label="Endereço">
                <input style={inputStyle} value={form.endereco} onChange={up('endereco')} />
              </Campo>
            </div>
          </Secao>

          <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:18 }}>
            <button onClick={enviar} disabled={!podeEnviar} style={{
              flex:1, padding:'12px 20px', borderRadius:10,
              background: podeEnviar ? G : '#9CA3AF',
              color:'#fff', fontWeight:900, fontSize:15, border:'none',
              cursor: podeEnviar ? 'pointer' : 'not-allowed',
            }}>
              💾 Salvar cadastro
            </button>
            {enviado && (
              <span style={{ color:VE, fontWeight:700, fontSize:13 }}>
                ✓ Enviado aos agentes
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Secao({ titulo, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <h3 style={{
        fontSize:13, fontWeight:800, color:N, textTransform:'uppercase',
        letterSpacing:.5, borderBottom:`2px solid ${G}`, paddingBottom:5, margin:'0 0 12px',
      }}>{titulo}</h3>
      {children}
    </div>
  );
}

function Campo({ label, children }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}
