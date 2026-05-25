// === src/features/rotas/MedicoPrescricao.jsx ===
// APACApp v1.1.9 — Rota /medico/prescricao
//
// Auditoria 8 mudança #3: módulo formal de prescrição.
//
// Fluxo:
//   1. Agente cria rascunho_agente baseado em pac.trat sugerido
//   2. Médico revisa, ajusta drogas/doses → vira rascunho_medico
//   3. Médico clica "Assinar prescrição" → validada_medico (SOBERANA)
//
// SEGURANÇA: validarPrescricaoRascunho roda ANTES da assinatura. Se houver
// bloqueio (capec ClCr<30, dose cumulativa atingida etc.), médico não consegue
// assinar sem digitar justificativa ≥ 20 chars.

import { useState, useMemo, useCallback } from 'react';
import {
  criarPrescricaoRascunho, validarPrescricaoRascunho,
  confirmarPrescricaoMedico, STATUS_PRESCRICAO,
  fmtNum,
} from '../oncoProUtils.js';

const N = '#1B365D'; const T = '#2B7A8C'; const G = '#B8860B';
const VE = '#15803D'; const VM = '#B91C1C'; const AM = '#B45309';
const BG = '#EEF2F7';

const card = { background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,.07)', border:'1px solid #E2E8F0', padding:20, marginBottom:16 };
const titulo = { fontSize:18, fontWeight:900, color:N, textTransform:'uppercase', letterSpacing:.6, borderBottom:`3px solid ${G}`, paddingBottom:7, margin:'0 0 14px' };
const lab = { display:'block', fontSize:12, fontWeight:700, color:N, marginBottom:4, letterSpacing:.3 };
const inp = { width:'100%', padding:'8px 10px', borderRadius:6, border:'1.5px solid #CBD5E1', fontSize:13, fontFamily:'inherit', boxSizing:'border-box' };

export default function MedicoPrescricao({ pac, up, pacienteKey }) {
  // Cria rascunho inicial a partir de pac.trat (se houver protocolo sugerido)
  const [prescricao, setPrescricao] = useState(() => {
    const drogasIniciais = parsearProtocoloEmDrogas(pac?.trat);
    return criarPrescricaoRascunho(pac, {
      protocolo: pac?.trat || '',
      ciclo: pac?._ciclo_atual ? Number(pac._ciclo_atual) : 1,
      drogas: drogasIniciais,
      intencao: pac?.intencao,
      linha: pac?.linha,
    });
  });

  const [justificativa, setJustificativa] = useState('');
  const [assumeResponsabilidade, setAssumeResponsabilidade] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Validação contínua
  const validacao = useMemo(
    () => validarPrescricaoRascunho(prescricao, pac),
    [prescricao, pac],
  );

  const temBloqueio = validacao.bloqueios.some(b => b.bloqueante);
  // v1.1.10 (Aud B): 40 chars + checkbox de responsabilidade
  const justificativaSuficiente = justificativa.trim().length >= 40;
  const podeAssinar = !temBloqueio || (justificativaSuficiente && assumeResponsabilidade);

  const atualizarDroga = useCallback((idx, campo, valor) => {
    setPrescricao(p => ({
      ...p,
      drogas: p.drogas.map((d, i) => i === idx ? { ...d, [campo]: valor } : d),
      status: STATUS_PRESCRICAO.RASCUNHO_MEDICO,
    }));
  }, []);

  const removerDroga = useCallback((idx) => {
    setPrescricao(p => ({
      ...p,
      drogas: p.drogas.filter((_, i) => i !== idx),
      status: STATUS_PRESCRICAO.RASCUNHO_MEDICO,
    }));
  }, []);

  const adicionarDroga = useCallback(() => {
    setPrescricao(p => ({
      ...p,
      drogas: [...p.drogas, { nome: '', dose: '', doseUnid: 'mg/m²', via: 'EV', dia: 'D1' }],
      status: STATUS_PRESCRICAO.RASCUNHO_MEDICO,
    }));
  }, []);

  // v1.1.10 — toggles de suporte clínico (hidratação, mesna, etc.)
  const toggleSuporte = useCallback((campo) => {
    setPrescricao(p => ({ ...p, [campo]: !p[campo], status: STATUS_PRESCRICAO.RASCUNHO_MEDICO }));
  }, []);

  const assinar = useCallback(() => {
    const r = confirmarPrescricaoMedico(prescricao, pac, {
      medicoCRM: 'CRM-PB 17341',
      justificativaOverride: justificativa,
      assumeResponsabilidade,
    });
    if (!r.aplicada) {
      setFeedback({ tipo: 'erro', mensagem: `Não foi possível assinar: ${r.motivo}` });
      return;
    }
    setPrescricao(r.prescricao);
    setFeedback({ tipo: 'sucesso', mensagem: 'Prescrição assinada e validada formalmente.' });
    if (typeof up === 'function' && r.prescricao.protocolo) {
      up('trat', r.prescricao.protocolo);
      const cAtual = pac?._camposAuditaveis || {};
      up('_camposAuditaveis', {
        ...cAtual,
        trat: {
          ...(cAtual.trat || {}),
          confirmado: true,
          fonte: 'medico',
          atualizadoEm: new Date().toISOString(),
          prescricaoId: r.prescricao.id,
        },
      });
    }
  }, [prescricao, pac, justificativa, assumeResponsabilidade, up]);

  const validada = prescricao.status === STATUS_PRESCRICAO.VALIDADA_MEDICO;

  return (
    <div style={{ background:BG, minHeight:'100vh', padding:'20px 16px' }}>
      <div style={{ maxWidth:920, margin:'0 auto' }}>
        <div style={{ marginBottom:14 }}>
          <p style={{ margin:0, fontSize:11, color:T, fontWeight:700, letterSpacing:1 }}>APACApp · v1.1.10</p>
          <h1 style={{ margin:'4px 0 0', fontSize:24, fontWeight:900, color:N }}>💊 Prescrição Oncológica</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>
            Revise o rascunho gerado pelos agentes. Edite o que precisar. A assinatura
            final é SOBERANA — agentes não podem mais sobrescrever.
          </p>
          {pac?.nome && (
            <p style={{ margin:'8px 0 0', fontSize:13, fontWeight:700, color:N, background:'#fff', padding:'8px 12px', borderRadius:8, border:'1px solid #E2E8F0' }}>
              👤 {pac.nome}
              {pac.diag ? ` · ${pac.diag}` : ''}
              {pac.cid ? ` · ${pac.cid}` : ''}
            </p>
          )}
        </div>

        {/* Status */}
        {validada ? (
          <div style={{ ...card, background:'#D1FAE5', border:`3px solid ${VE}` }}>
            <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:'#065F46' }}>
              ✓ Prescrição assinada
            </h2>
            <p style={{ margin:'6px 0 0', fontSize:12, color:'#047857' }}>
              Validada em {new Date(prescricao.validadoEm).toLocaleString('pt-BR')} por {prescricao.validadoPor}.
              {prescricao.justificativaOverride && (
                <span> <strong>Override registrado:</strong> {prescricao.justificativaOverride}</span>
              )}
            </p>
          </div>
        ) : (
          <div style={card}>
            <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>
              Status: <strong>{prescricao.status === STATUS_PRESCRICAO.RASCUNHO_AGENTE
                ? '📝 Rascunho do agente (aguardando revisão médica)'
                : '✏️ Rascunho do médico (em edição)'}</strong>
            </p>
          </div>
        )}

        {/* Snapshot dos dados do paciente */}
        <div style={card}>
          <h3 style={titulo}>📊 Dados de cálculo (snapshot)</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))', gap:8 }}>
            <Mini label="Peso"        valor={prescricao.snapshot.peso ? `${fmtNum(prescricao.snapshot.peso, 1)} kg` : '—'} />
            <Mini label="Altura"      valor={prescricao.snapshot.altura ? `${prescricao.snapshot.altura} cm` : '—'} />
            <Mini label="BSA"         valor={prescricao.snapshot.bsa ? `${fmtNum(prescricao.snapshot.bsa, 2)} m²` : '—'} />
            <Mini label="ClCr"        valor={prescricao.snapshot.clcr ? `${fmtNum(prescricao.snapshot.clcr?.clcr || prescricao.snapshot.clcr, 0)} mL/min` : '—'} />
            <Mini label="ECOG"        valor={prescricao.snapshot.ecog ?? '—'} />
            <Mini label="Idade"       valor={prescricao.snapshot.idade ?? '—'} />
          </div>
        </div>

        {/* Drogas */}
        <div style={card}>
          <h3 style={titulo}>💊 Drogas — Ciclo {prescricao.ciclo}</h3>
          {prescricao.drogas.length === 0 ? (
            <p style={{ margin:'10px 0', fontSize:13, color:VM, fontWeight:700 }}>
              ⚠️ Nenhuma droga no rascunho. Adicione manualmente abaixo.
            </p>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#F1F5F9' }}>
                    <th style={th}>Droga</th>
                    <th style={th}>Dose</th>
                    <th style={th}>Unid</th>
                    <th style={th}>Via</th>
                    <th style={th}>Dia</th>
                    {!validada && <th style={th}></th>}
                  </tr>
                </thead>
                <tbody>
                  {prescricao.drogas.map((d, i) => (
                    <tr key={i}>
                      <td style={td}>
                        {validada ? d.nome : (
                          <input value={d.nome || ''} onChange={e => atualizarDroga(i, 'nome', e.target.value)} style={inp} />
                        )}
                      </td>
                      <td style={td}>
                        {validada ? d.dose : (
                          <input value={d.dose || ''} onChange={e => atualizarDroga(i, 'dose', e.target.value)} style={{ ...inp, width:80 }} />
                        )}
                      </td>
                      <td style={td}>
                        {validada ? d.doseUnid : (
                          <select value={d.doseUnid || 'mg/m²'} onChange={e => atualizarDroga(i, 'doseUnid', e.target.value)} style={{ ...inp, width:90 }}>
                            <option>mg/m²</option>
                            <option>mg/kg</option>
                            <option>mg</option>
                            <option>AUC</option>
                          </select>
                        )}
                      </td>
                      <td style={td}>
                        {validada ? d.via : (
                          <select value={d.via || 'EV'} onChange={e => atualizarDroga(i, 'via', e.target.value)} style={{ ...inp, width:70 }}>
                            <option>EV</option><option>VO</option><option>IM</option><option>SC</option>
                          </select>
                        )}
                      </td>
                      <td style={td}>
                        {validada ? d.dia : (
                          <input value={d.dia || ''} onChange={e => atualizarDroga(i, 'dia', e.target.value)} style={{ ...inp, width:60 }} placeholder="D1" />
                        )}
                      </td>
                      {!validada && (
                        <td style={td}>
                          <button onClick={() => removerDroga(i)} style={{ background:VM, color:'#fff', border:'none', borderRadius:4, padding:'4px 8px', fontSize:11, cursor:'pointer' }}>×</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!validada && (
            <button onClick={adicionarDroga} style={{ marginTop:10, padding:'6px 12px', background:'#fff', border:`1.5px solid ${T}`, color:T, borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}>
              + Adicionar droga
            </button>
          )}
        </div>

        {/* v1.1.10 — Suporte clínico (toggles para evitar bloqueios) */}
        {!validada && (
          <div style={card}>
            <h3 style={titulo}>🩹 Suporte clínico (resolve bloqueios automáticos)</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:10 }}>
              <SuporteToggle
                label="Hidratação EV documentada (≥2L)"
                ativo={prescricao.hidratacaoIV}
                onClick={() => toggleSuporte('hidratacaoIV')}
                obs="Obrigatório com cisplatina ClCr<60"
              />
              <SuporteToggle
                label="Mesna prescrita"
                ativo={prescricao.mesna}
                onClick={() => toggleSuporte('mesna')}
                obs="Obrigatório com ifosfamida; recomendado em ciclofosfamida ≥1g/m²"
              />
              <SuporteToggle
                label="Consentimento risco fetal documentado"
                ativo={prescricao.consentimentoRiscoFetal}
                onClick={() => toggleSuporte('consentimentoRiscoFetal')}
                obs="Obrigatório em gestantes que recebem QT"
              />
            </div>

            {/* v1.1.10 — Justificativa ECOG ≥ 3 */}
            {parseFloat(pac?.ecog) >= 3 && (
              <div style={{ marginTop:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:800, color:VM, marginBottom:6 }}>
                  ⚠️ Justificativa para ECOG ≥ 3 (paciente acamado/grave)
                </label>
                <textarea
                  value={prescricao.justificativaECOG || ''}
                  onChange={e => setPrescricao(p => ({ ...p, justificativaECOG: e.target.value }))}
                  placeholder="Ex: paciente em cuidados paliativos, QT exclusivamente para alívio sintomático após discussão multidisciplinar..."
                  style={{ ...inp, minHeight:60, fontFamily:'inherit', resize:'vertical' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Validação */}
        {(validacao.bloqueios.length > 0 || validacao.alertas.length > 0) && (
          <div style={card}>
            <h3 style={titulo}>🛡️ Validação de segurança</h3>
            {validacao.bloqueios.map((b, i) => (
              <div key={`b${i}`} style={{
                padding:10, marginBottom:8, background:'#FEE2E2',
                border:`2px solid ${VM}`, borderRadius:8,
              }}>
                <p style={{ margin:0, fontSize:12, fontWeight:800, color:'#7F1D1D' }}>
                  ⛔ BLOQUEIO: {b.droga ? `${b.droga} — ` : ''}{b.mensagem}
                </p>
              </div>
            ))}
            {validacao.alertas.map((a, i) => (
              <div key={`a${i}`} style={{
                padding:10, marginBottom:8, background:'#FEF3C7',
                border:`1px solid ${AM}`, borderRadius:8,
              }}>
                <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#92400E' }}>
                  ⚠️ ALERTA: {a.droga ? `${a.droga} — ` : ''}{a.mensagem}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* v1.1.10 (Aud B): Override 40 chars + checkbox responsabilidade */}
        {!validada && temBloqueio && (
          <div style={{ ...card, background:'#FFFBEB', borderColor:VM, borderWidth:2 }}>
            <h3 style={titulo}>⚠️ Override de bloqueio (auditoria registrada)</h3>
            <p style={{ margin:'0 0 8px', fontSize:12, color:'#7F1D1D', fontWeight:600 }}>
              Há bloqueios clínicos que impedem a assinatura automática.
              Para assinar mesmo assim:
            </p>
            <label style={{ fontSize:12, fontWeight:700, color:N, display:'block', marginBottom:4 }}>
              1️⃣ Justifique clinicamente (mínimo 40 caracteres):
            </label>
            <textarea
              value={justificativa}
              onChange={e => setJustificativa(e.target.value)}
              placeholder="Ex: paciente acompanhado com nefrologia, ClCr estável apesar dos números laboratoriais; benefício do tratamento supera o risco renal..."
              style={{ ...inp, minHeight:80, fontFamily:'inherit', resize:'vertical' }}
            />
            <p style={{ margin:'4px 0 14px', fontSize:11, color: justificativaSuficiente ? VE : VM, fontWeight:700 }}>
              {justificativa.trim().length}/40 caracteres {justificativaSuficiente ? '✓' : '— insuficiente'}
            </p>

            <label style={{
              display:'flex', alignItems:'flex-start', gap:10,
              padding:'10px 12px', background:'#fff', border:`2px solid ${VM}`,
              borderRadius:8, cursor:'pointer',
            }}>
              <input
                type="checkbox"
                checked={assumeResponsabilidade}
                onChange={e => setAssumeResponsabilidade(e.target.checked)}
                style={{ marginTop:3, width:18, height:18, cursor:'pointer' }}
              />
              <span style={{ fontSize:12, fontWeight:700, color:'#7F1D1D', lineHeight:1.5 }}>
                2️⃣ Assumo responsabilidade clínica por este desvio do protocolo.
                Esta ação ficará registrada com meu CRM/RQE, data e hora.
              </span>
            </label>
          </div>
        )}

        {feedback && (
          <div style={{ ...card, background: feedback.tipo === 'sucesso' ? '#D1FAE5' : '#FEE2E2', borderColor: feedback.tipo === 'sucesso' ? VE : VM }}>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color: feedback.tipo === 'sucesso' ? '#065F46' : '#7F1D1D' }}>
              {feedback.tipo === 'sucesso' ? '✓' : '✗'} {feedback.mensagem}
            </p>
          </div>
        )}

        {/* Botão de assinar */}
        {!validada && (
          <button
            onClick={assinar}
            disabled={!podeAssinar || prescricao.drogas.length === 0}
            style={{
              width:'100%', padding:'16px', borderRadius:12,
              fontSize:16, fontWeight:900,
              background: (podeAssinar && prescricao.drogas.length > 0) ? VE : '#D1D5DB',
              color:'#fff', border:'none',
              cursor: (podeAssinar && prescricao.drogas.length > 0) ? 'pointer' : 'not-allowed',
            }}
          >
            🔒 Assinar prescrição (SOBERANA — agentes não sobrescrevem)
          </button>
        )}
      </div>
    </div>
  );
}

// Helpers
const th = { padding:8, textAlign:'left', fontSize:11, fontWeight:700, color:N, letterSpacing:.3, borderBottom:'2px solid #E2E8F0' };
const td = { padding:6, borderBottom:'1px solid #F1F5F9', verticalAlign:'middle' };

function Mini({ label, valor }) {
  return (
    <div style={{ padding:8, background:'#F8FAFC', borderRadius:6, border:'1px solid #E2E8F0' }}>
      <p style={{ margin:0, fontSize:10, fontWeight:700, color:'#6B7280' }}>{label.toUpperCase()}</p>
      <p style={{ margin:'2px 0 0', fontSize:13, fontWeight:700, color:N }}>{valor}</p>
    </div>
  );
}

// v1.1.10 — Toggle de suporte clínico (hidratação, mesna, etc.)
function SuporteToggle({ label, ativo, onClick, obs }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:'10px 12px',
        background: ativo ? '#D1FAE5' : '#fff',
        border: `2px solid ${ativo ? '#15803D' : '#CBD5E1'}`,
        borderRadius:8, cursor:'pointer',
        textAlign:'left', fontFamily:'inherit',
      }}
    >
      <p style={{ margin:0, fontSize:13, fontWeight:800, color: ativo ? '#065F46' : '#1B365D' }}>
        {ativo ? '✓ ' : '○ '}{label}
      </p>
      {obs && (
        <p style={{ margin:'2px 0 0', fontSize:10, color: ativo ? '#047857' : '#6B7280' }}>
          {obs}
        </p>
      )}
    </button>
  );
}

/**
 * Parsing simples de string de protocolo em drogas.
 * Ex: "AC × 4 → Paclitaxel × 12 semanal" → 2 drogas placeholder
 *
 * Heurística mínima: separa por →, /, +, " e " e cria entrada por token relevante.
 * Médico ajusta dose/unid manualmente.
 */
function parsearProtocoloEmDrogas(textoProtocolo) {
  if (!textoProtocolo) return [];
  const tokens = String(textoProtocolo)
    .split(/→|→|->|\/|\sou\s|,\s|;\s/i)
    .map(t => t.trim())
    .filter(Boolean);
  return tokens.map(t => ({
    nome: t.replace(/×\s*\d+|\d+\s*ciclos?/gi, '').trim(),
    dose: '',
    doseUnid: 'mg/m²',
    via: 'EV',
    dia: 'D1',
  })).slice(0, 8);  // máx 8 drogas auto
}
