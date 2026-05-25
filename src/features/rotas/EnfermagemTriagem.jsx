// === src/features/rotas/EnfermagemTriagem.jsx ===
// APACApp v1.1.6 — Rota /enfermagem/triagem
//
// Enfermagem mede peso, altura, creatinina, ECOG, PA. Fonte = 'enfermagem'
// (prioridade 75 — sobrescreve paciente e IA, NÃO sobrescreve recepção/médico).
//
// Mostra cálculos derivados (BSA, IMC, ClCr estimado) em tempo real.

import { useState, useMemo } from 'react';
import {
  normalizarPesoKg, normalizarAlturaCm, normalizarCreatinina,
  calcularBSA, calcularIMC, calcularClCr, calcularIdade,
  normalizarSexo, fmtNum,
} from '../oncoProUtils.js';

const N = '#1B365D'; const T = '#2B7A8C'; const G = '#B8860B';
const VE = '#15803D'; const AM = '#B45309'; const BG = '#EEF2F7';

const inputStyle = {
  width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #D1D5DB',
  fontSize:14, fontFamily:'inherit',
};
const labelStyle = { fontSize:12, fontWeight:700, color:N, marginBottom:4, display:'block' };

export default function EnfermagemTriagem({ pac, pacienteKey, onSubmit }) {
  const [form, setForm] = useState({
    peso: pac?.peso || '',
    altura: pac?.altura || '',
    creatinina: pac?.creatinina || '',
    ecog: pac?.ecog || '',
    pa_sistolica: pac?.pa_sistolica || '',
    pa_diastolica: pac?.pa_diastolica || '',
    observacoes_enfermagem: '',
  });
  const [enviado, setEnviado] = useState(false);

  const up = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Cálculos derivados em tempo real
  const calc = useMemo(() => {
    const peso = normalizarPesoKg(form.peso);
    const altura = normalizarAlturaCm(form.altura);
    const cr = normalizarCreatinina(form.creatinina);
    const sexo = normalizarSexo(pac?.sexo);
    const idade = calcularIdade(pac?.nasc);
    const bsa = (peso && altura) ? calcularBSA(altura, peso) : null;
    const imc = (peso && altura) ? calcularIMC(peso, altura) : null;
    const clcr = (cr && peso && altura && sexo && idade != null)
      ? calcularClCr({ creatinina:cr, peso, altura, idade, sexo })
      : null;
    return { peso, altura, cr, bsa, imc, clcr };
  }, [form.peso, form.altura, form.creatinina, pac?.sexo, pac?.nasc]);

  const podeEnviar = (calc.peso && calc.altura) || calc.cr || form.ecog;

  const enviar = () => {
    if (!podeEnviar) return;
    const payload = {};
    if (calc.peso) payload.peso = String(calc.peso);
    if (calc.altura) payload.altura = String(calc.altura);
    if (calc.cr) payload.creatinina = String(calc.cr);
    if (form.ecog !== '') payload.ecog = form.ecog;
    if (form.pa_sistolica) payload.pa_sistolica = form.pa_sistolica;
    if (form.pa_diastolica) payload.pa_diastolica = form.pa_diastolica;
    if (form.observacoes_enfermagem.trim()) payload.observacoes_enfermagem = form.observacoes_enfermagem.trim();

    onSubmit?.({
      origem: 'enfermagem',
      rota: '/enfermagem/triagem',
      pacienteKey,
      payload,
      ator: 'enfermagem',
    });
    setEnviado(true);
    setTimeout(() => setEnviado(false), 2500);
  };

  return (
    <div style={{ background:BG, minHeight:'100vh', padding:'20px 16px' }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <div style={{ marginBottom:14 }}>
          <p style={{ margin:0, fontSize:11, color:T, fontWeight:700, letterSpacing:1 }}>APACApp · ENFERMAGEM</p>
          <h2 style={{ margin:'4px 0 0', fontSize:22, fontWeight:900, color:N }}>
            🩺 Triagem clínica
          </h2>
          {pac?.nome && (
            <p style={{ margin:'6px 0 0', fontSize:13, color:'#374151' }}>
              Paciente: <strong>{pac.nome}</strong>
            </p>
          )}
        </div>

        <div style={{ background:'#fff', borderRadius:14, padding:24, boxShadow:'0 2px 10px rgba(0,0,0,.07)' }}>

          <Secao titulo="Antropometria">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Campo label="Peso (kg)">
                <input style={inputStyle} value={form.peso} onChange={up('peso')} inputMode="decimal" placeholder="Ex: 65,5" />
              </Campo>
              <Campo label="Altura (cm ou m)">
                <input style={inputStyle} value={form.altura} onChange={up('altura')} inputMode="decimal" placeholder="Ex: 165 ou 1,65" />
              </Campo>
            </div>
            {(calc.bsa || calc.imc) && (
              <div style={{ marginTop:10, padding:10, background:'#F0F9FF', borderRadius:8, fontSize:12, color:N }}>
                {calc.bsa && <span><strong>BSA:</strong> {fmtNum(calc.bsa, 2)} m² · </span>}
                {calc.imc && <span><strong>IMC:</strong> {fmtNum(calc.imc, 1)}</span>}
              </div>
            )}
          </Secao>

          <Secao titulo="Função renal">
            <Campo label="Creatinina (mg/dL)">
              <input style={inputStyle} value={form.creatinina} onChange={up('creatinina')} inputMode="decimal" placeholder="Ex: 0,9" />
            </Campo>
            {calc.clcr && (
              <div style={{ marginTop:10, padding:10, background:'#F0F9FF', borderRadius:8, fontSize:12, color:N }}>
                <strong>ClCr estimado:</strong> {fmtNum(calc.clcr.clcr, 0)} mL/min
                {calc.clcr.capAplicado && <span style={{ color:AM, marginLeft:6 }}> (capado em 125)</span>}
                {calc.clcr.obeso && <span style={{ color:AM, marginLeft:6 }}> · obeso (peso ajustado)</span>}
                {calc.clcr.caquetico && <span style={{ color:AM, marginLeft:6 }}> · caquético</span>}
              </div>
            )}
            {form.creatinina && !calc.clcr && (
              <p style={{ marginTop:6, fontSize:11, color:AM }}>
                Para calcular ClCr é preciso peso, altura, idade e sexo do paciente.
              </p>
            )}
          </Secao>

          <Secao titulo="Performance Status">
            <Campo label="ECOG">
              <select style={inputStyle} value={form.ecog} onChange={up('ecog')}>
                <option value="">—</option>
                <option value="0">0 — Atividade normal</option>
                <option value="1">1 — Sintomas leves</option>
                <option value="2">2 — Encama menos de 50% do tempo</option>
                <option value="3">3 — Encama mais de 50% do tempo</option>
                <option value="4">4 — Acamado</option>
              </select>
            </Campo>
          </Secao>

          <Secao titulo="Pressão arterial">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Campo label="Sistólica (mmHg)">
                <input style={inputStyle} value={form.pa_sistolica} onChange={up('pa_sistolica')} inputMode="numeric" />
              </Campo>
              <Campo label="Diastólica (mmHg)">
                <input style={inputStyle} value={form.pa_diastolica} onChange={up('pa_diastolica')} inputMode="numeric" />
              </Campo>
            </div>
          </Secao>

          <Secao titulo="Observações">
            <textarea style={{ ...inputStyle, minHeight:60, resize:'vertical' }}
              value={form.observacoes_enfermagem} onChange={up('observacoes_enfermagem')}
              placeholder="Toxicidades, queixas, alertas..." />
          </Secao>

          <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:18 }}>
            <button onClick={enviar} disabled={!podeEnviar} style={{
              flex:1, padding:'12px 20px', borderRadius:10,
              background: podeEnviar ? G : '#9CA3AF',
              color:'#fff', fontWeight:900, fontSize:15, border:'none',
              cursor: podeEnviar ? 'pointer' : 'not-allowed',
            }}>
              💾 Registrar triagem
            </button>
            {enviado && (
              <span style={{ color:VE, fontWeight:700, fontSize:13 }}>✓ Enviado</span>
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
function Campo({ label, children }) { return <div><label style={labelStyle}>{label}</label>{children}</div>; }
