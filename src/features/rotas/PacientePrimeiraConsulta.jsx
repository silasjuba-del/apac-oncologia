// === src/features/rotas/PacientePrimeiraConsulta.jsx ===
// APACApp v1.1.6 — Rota /paciente/primeira-consulta
//
// O paciente preenche dados básicos antes da consulta. Fonte = 'paciente'
// (prioridade 50 — qualquer valor da recepção sobrescreve depois).
//
// Filosofia: paciente DIGITA, recepção CORRIGE, médico VALIDA.

import { useState } from 'react';

const N = '#1B365D'; const T = '#2B7A8C'; const G = '#B8860B';
const VE = '#15803D'; const BG = '#EEF2F7';

const inputStyle = {
  width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #D1D5DB',
  fontSize:14, marginBottom:10, fontFamily:'inherit',
};
const labelStyle = {
  fontSize:12, fontWeight:700, color:N, marginBottom:4, display:'block',
};

export default function PacientePrimeiraConsulta({ pacienteKey, onSubmit }) {
  const [form, setForm] = useState({
    nome:'', nasc:'', sexo:'', mae:'', cpf:'', cns:'',
    cidade:'', telefone:'', endereco:'',
    // v1.1.10 (Aud Gemini): determinantes sociais — abandono evitável
    cidade_origem:'',
    telefone_recado:'',
    ubs_origem:'',
    quem_encaminhou:'',
    acompanhante_nome:'',
    acompanhante_telefone:'',
    necessita_tfd:'',           // 'sim'/'nao'/'nao_sei'
    necessita_transporte:'',    // idem
    necessita_assist_social:'', // idem
    // v1.1.10 (Aud A): fatores de risco
    raca_cor:'',
    tabagismo:'',
    etilismo:'',
    comorbidades:'',
    queixa_principal:'', medicacoes_em_uso:'', alergias:'',
    historia_familiar:'',
  });
  const [enviado, setEnviado] = useState(false);

  const up = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const podeEnviar = form.nome.trim().length >= 3 && form.nasc;

  const enviar = () => {
    if (!podeEnviar) return;
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      const s = String(v).trim();
      if (s) payload[k] = s;
    });
    onSubmit?.({
      origem: 'paciente',
      rota: '/paciente/primeira-consulta',
      pacienteKey: pacienteKey || `paciente-${Date.now()}`,
      payload,
      ator: form.nome,
    });
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div style={{ background:BG, minHeight:'100vh', padding:'40px 16px' }}>
        <div style={{ maxWidth:600, margin:'0 auto', background:'#fff',
          padding:32, borderRadius:14, textAlign:'center',
          boxShadow:'0 2px 10px rgba(0,0,0,.07)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>✓</div>
          <h2 style={{ color:VE, margin:'0 0 8px', fontSize:22, fontWeight:900 }}>
            Dados enviados
          </h2>
          <p style={{ color:'#374151', fontSize:14, margin:'0 0 16px' }}>
            Seus dados foram enviados para a recepção. Por favor, aguarde ser chamado(a).
          </p>
          <p style={{ color:'#6B7280', fontSize:12 }}>
            Hospital do Bem — Unidade Oncológica · Patos/PB
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:BG, minHeight:'100vh', padding:'20px 16px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ marginBottom:16, textAlign:'center' }}>
          <p style={{ margin:0, fontSize:11, color:T, fontWeight:700, letterSpacing:1 }}>APACApp · PACIENTE</p>
          <h2 style={{ margin:'4px 0 0', fontSize:24, fontWeight:900, color:N }}>
            🪪 Primeira Consulta — Cadastro Inicial
          </h2>
          <p style={{ margin:'8px 0 0', fontSize:13, color:'#6B7280' }}>
            Preencha os dados abaixo. A recepção vai conferir e completar.
          </p>
        </div>

        <div style={{
          background:'#fff', borderRadius:14, padding:24,
          boxShadow:'0 2px 10px rgba(0,0,0,.07)',
        }}>
          <Secao titulo="Identificação">
            <Campo label="Nome completo *" obrigatorio>
              <input style={inputStyle} value={form.nome} onChange={up('nome')} placeholder="Nome completo" />
            </Campo>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Campo label="Data de nascimento *" obrigatorio>
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
              <input style={inputStyle} value={form.mae} onChange={up('mae')} placeholder="Nome completo da mãe" />
            </Campo>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Campo label="CPF">
                <input style={inputStyle} value={form.cpf} onChange={up('cpf')} placeholder="000.000.000-00" inputMode="numeric" />
              </Campo>
              <Campo label="CNS (Cartão SUS)">
                <input style={inputStyle} value={form.cns} onChange={up('cns')} placeholder="15 dígitos" inputMode="numeric" />
              </Campo>
            </div>
          </Secao>

          <Secao titulo="Contato e endereço">
            <Campo label="Cidade">
              <input style={inputStyle} value={form.cidade} onChange={up('cidade')} placeholder="Ex: Patos-PB" />
            </Campo>
            <Campo label="Telefone">
              <input style={inputStyle} value={form.telefone} onChange={up('telefone')} placeholder="(83) 99999-9999" inputMode="tel" />
            </Campo>
            <Campo label="Endereço">
              <input style={inputStyle} value={form.endereco} onChange={up('endereco')} placeholder="Rua, número, bairro" />
            </Campo>
          </Secao>

          <Secao titulo="Informações para a consulta">
            <Campo label="O que está sentindo / motivo da consulta">
              <textarea style={{ ...inputStyle, minHeight:80, resize:'vertical' }} value={form.queixa_principal} onChange={up('queixa_principal')} placeholder="Descreva seus sintomas" />
            </Campo>
            <Campo label="Medicações que usa">
              <textarea style={{ ...inputStyle, minHeight:60, resize:'vertical' }} value={form.medicacoes_em_uso} onChange={up('medicacoes_em_uso')} placeholder="Liste as medicações" />
            </Campo>
            <Campo label="⚠️ Alergias a medicamentos">
              <input style={inputStyle} value={form.alergias} onChange={up('alergias')} placeholder="Ex: dipirona, penicilina, sulfa" />
            </Campo>
            <Campo label="Câncer na família (pai, mãe, irmãos, filhos)">
              <textarea style={{ ...inputStyle, minHeight:50, resize:'vertical' }} value={form.historia_familiar} onChange={up('historia_familiar')} placeholder="Ex: mãe – câncer de mama aos 50 anos" />
            </Campo>
          </Secao>

          {/* v1.1.10 (Aud Gemini): Determinantes sociais — TFD, transporte, assistência social */}
          <Secao titulo="Como chegar ao tratamento">
            <Campo label="Cidade de origem (de onde vem)">
              <input style={inputStyle} value={form.cidade_origem} onChange={up('cidade_origem')} placeholder="Ex: Sousa-PB" />
            </Campo>
            <Campo label="UBS / Posto de Saúde de origem">
              <input style={inputStyle} value={form.ubs_origem} onChange={up('ubs_origem')} placeholder="Ex: UBS Centro - Sousa" />
            </Campo>
            <Campo label="Quem encaminhou (médico/serviço)">
              <input style={inputStyle} value={form.quem_encaminhou} onChange={up('quem_encaminhou')} placeholder="Ex: Dr. João - Hospital Regional" />
            </Campo>
            <Campo label="Telefone de recado (parente/vizinho que avisa o paciente)">
              <input style={inputStyle} value={form.telefone_recado} onChange={up('telefone_recado')} placeholder="(83) 99999-9999" inputMode="tel" />
            </Campo>
            <Campo label="Acompanhante (nome)">
              <input style={inputStyle} value={form.acompanhante_nome} onChange={up('acompanhante_nome')} placeholder="Nome do acompanhante" />
            </Campo>
            <Campo label="Telefone do acompanhante">
              <input style={inputStyle} value={form.acompanhante_telefone} onChange={up('acompanhante_telefone')} placeholder="(83) 99999-9999" inputMode="tel" />
            </Campo>

            <Campo label="Precisa de Tratamento Fora de Domicílio (TFD)?">
              <select style={inputStyle} value={form.necessita_tfd} onChange={up('necessita_tfd')}>
                <option value="">— Selecione —</option>
                <option value="sim">Sim — moro longe de Patos</option>
                <option value="nao">Não — moro em Patos</option>
                <option value="nao_sei">Não sei o que é</option>
              </select>
            </Campo>
            <Campo label="Precisa de ajuda com transporte para vir à quimioterapia?">
              <select style={inputStyle} value={form.necessita_transporte} onChange={up('necessita_transporte')}>
                <option value="">— Selecione —</option>
                <option value="sim">Sim, preciso de transporte</option>
                <option value="nao">Não, tenho como vir</option>
              </select>
            </Campo>
            <Campo label="Precisa de assistência social (auxílio, benefício, alimentação)?">
              <select style={inputStyle} value={form.necessita_assist_social} onChange={up('necessita_assist_social')}>
                <option value="">— Selecione —</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
                <option value="nao_sei">Não sei</option>
              </select>
            </Campo>
          </Secao>

          {/* v1.1.10 (Aud A): Fatores de risco e história */}
          <Secao titulo="Fatores de risco">
            <Campo label="Raça/cor (autodeclarada — IBGE/SUS)">
              <select style={inputStyle} value={form.raca_cor} onChange={up('raca_cor')}>
                <option value="">— Selecione —</option>
                <option value="branca">Branca</option>
                <option value="preta">Preta</option>
                <option value="parda">Parda</option>
                <option value="amarela">Amarela</option>
                <option value="indigena">Indígena</option>
              </select>
            </Campo>
            <Campo label="Fuma ou já fumou?">
              <select style={inputStyle} value={form.tabagismo} onChange={up('tabagismo')}>
                <option value="">— Selecione —</option>
                <option value="nunca">Nunca fumei</option>
                <option value="ex_fumante">Ex-fumante (parei)</option>
                <option value="fumante_ativo">Fumante ativo</option>
              </select>
            </Campo>
            <Campo label="Bebe bebida alcoólica?">
              <select style={inputStyle} value={form.etilismo} onChange={up('etilismo')}>
                <option value="">— Selecione —</option>
                <option value="nunca">Nunca</option>
                <option value="social">Social (final de semana)</option>
                <option value="frequente">Frequente (quase todo dia)</option>
              </select>
            </Campo>
            <Campo label="Outras doenças (diabetes, pressão alta, problema do coração, etc.)">
              <textarea style={{ ...inputStyle, minHeight:50, resize:'vertical' }} value={form.comorbidades} onChange={up('comorbidades')} placeholder="Ex: diabetes, hipertensão" />
            </Campo>
          </Secao>

          <button onClick={enviar} disabled={!podeEnviar} style={{
            width:'100%', padding:'14px 20px', borderRadius:10,
            background: podeEnviar ? G : '#9CA3AF',
            color:'#fff', fontWeight:900, fontSize:15, border:'none',
            cursor: podeEnviar ? 'pointer' : 'not-allowed', marginTop:12,
          }}>
            Enviar dados para a recepção
          </button>
          {!podeEnviar && <p style={{ fontSize:11, color:'#6B7280', margin:'8px 0 0', textAlign:'center' }}>
            * Nome completo e data de nascimento são obrigatórios.
          </p>}
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
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
