// === src/features/rotas/PacienteDrawer.jsx ===
// APACApp v1.1.11 — Drawer lateral: clica no nome → vê TUDO
//
// ROTA 2: Paciente + Recepção → IA Resume automático → Prontuário
//         → Médico clica no nome → Abre painel com todas as informações
//
// Componentes exportados:
//  · PacienteDrawer     — painel lateral deslizante com resumo completo
//  · usePacienteResumo  — hook que gera/recupera resumo automático via IA
//  · BotaoNomePaciente  — botão que abre o drawer (usa-se na navbar)

import { useState, useEffect, useCallback, useRef } from 'react';

const N = '#1B365D'; const T = '#2B7A8C'; const G = '#B8860B';
const VE = '#15803D'; const VM = '#B91C1C'; const AM = '#B45309';

// ─── Hook: gera resumo automático via IA quando há dados novos ────────────────
/**
 * Gera e cacheia o resumo do paciente.
 * Só regenera se pac.nome mudou ou se forceRefresh=true.
 *
 * @returns { resumo, gerando, gerarAgora }
 */
export function usePacienteResumo({ pac, chamarClaude, entradasStore, pacienteKey }) {
  const [resumo, setResumo]   = useState(() => {
    // Recupera do localStorage se existir
    try {
      const cached = localStorage.getItem(`resumo_ia_${pacienteKey||pac?.nome}`);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return null;
  });
  const [gerando, setGerando] = useState(false);
  const geradoParaRef         = useRef(null);

  const gerarAgora = useCallback(async () => {
    if (!pac?.nome || typeof chamarClaude !== 'function') return;
    setGerando(true);

    const entradas = entradasStore?.entradasPendentes(pacienteKey) || [];
    const camposChave = ['nome','nasc','sexo','cpf','cns','mae','cidade','telefone',
      'diag','cid','tnm','estadio','ecog','bio','trat','linha','intencao',
      'queixa_principal','alergias','medicacoes_em_uso','comorbidades',
      'necessita_tfd','necessita_transporte','necessita_assist_social'];

    const dadosPac = camposChave
      .filter(k => pac[k])
      .map(k => `${k}: ${pac[k]}`)
      .join('\n');

    const dadosEntradas = entradas.length
      ? '\n\nENTRADAS RECENTES:\n' + entradas.map(e =>
          Object.entries(e.payload||{}).map(([k,v])=>`${k}: ${v}`).join('\n')
        ).join('\n---\n')
      : '';

    const prompt = `Você é assistente oncológico. Gere um resumo clínico conciso e estruturado do paciente abaixo.

DADOS:
${dadosPac}${dadosEntradas}

Responda em JSON:
{
  "nome_completo": "",
  "idade_anos": 0,
  "linha_clinica": "frase de 1 linha: diagnóstico + estádio + protocolo",
  "status_atual": "ativo em tratamento | aguardando início | first visit | ...",
  "alertas": ["lista de alertas clínicos importantes"],
  "pendencias": ["pendências administrativas ou clínicas"],
  "secoes": {
    "identificacao": "texto livre com dados demográficos",
    "diagnostico": "texto livre com dados oncológicos",
    "tratamento": "texto livre com protocolo, ciclos, doses",
    "social": "texto livre com determinantes sociais",
    "anamnese": "queixas, medicações, alergias",
    "proximos_passos": "o que fazer na próxima consulta"
  },
  "score_completude": 0
}`;

    try {
      const resp = await chamarClaude(prompt, 1200);
      if (resp.startsWith('⚠')) {
        setGerando(false);
        return;
      }
      const clean = resp.replace(/```json|```/g,'').trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON inválido');
      const parsed = JSON.parse(jsonMatch[0]);
      parsed._geradoEm = new Date().toISOString();
      parsed._pacNome  = pac.nome;
      setResumo(parsed);
      // Cacheia no localStorage
      try {
        localStorage.setItem(
          `resumo_ia_${pacienteKey||pac.nome}`,
          JSON.stringify(parsed)
        );
      } catch (_) {}
      geradoParaRef.current = pac.nome;
    } catch (e) {
      console.warn('[PacienteResumo]', e.message);
    } finally {
      setGerando(false);
    }
  }, [pac, chamarClaude, entradasStore, pacienteKey]);

  // Auto-gera quando paciente muda e ainda não tem resumo (ou é de outro paciente)
  useEffect(() => {
    if (!pac?.nome) return;
    if (gerando) return;
    const resumoDesatualizado = !resumo || resumo._pacNome !== pac.nome;
    if (resumoDesatualizado && typeof chamarClaude === 'function') {
      // Delay de 1.5s — espera dados estabilizarem
      const t = setTimeout(gerarAgora, 1500);
      return () => clearTimeout(t);
    }
  }, [pac?.nome, pacienteKey]); // eslint-disable-line

  return { resumo, gerando, gerarAgora };
}

// ─── Componente: PacienteDrawer ───────────────────────────────────────────────
/**
 * Drawer lateral que mostra TUDO sobre o paciente.
 *
 * Props:
 *  · aberto         — boolean
 *  · fechar         — function
 *  · pac            — objeto paciente
 *  · resumo         — objeto JSON gerado por usePacienteResumo
 *  · gerando        — boolean
 *  · gerarAgora     — function
 *  · entradasStore  — para mostrar histórico de entradas
 *  · pacienteKey    — chave do paciente
 *  · resultadosAgentesStore — para mostrar resultados dos agentes
 *  · navegar        — function(path) para ir a uma rota
 */
export function PacienteDrawer({
  aberto, fechar, pac, resumo, gerando, gerarAgora,
  entradasStore, pacienteKey, resultadosAgentesStore, navegar,
}) {
  const [aba, setAba] = useState('resumo');
  const entradas = entradasStore?.entradasPendentes(pacienteKey) || [];
  const resultados = resultadosAgentesStore?.ler(pacienteKey) || null;

  const idade = pac?.nasc ? (() => {
    try {
      const [d,m,a] = pac.nasc.includes('/')
        ? pac.nasc.split('/').map(Number)
        : [pac.nasc.slice(8,10), pac.nasc.slice(5,7), pac.nasc.slice(0,4)].map(Number);
      const n = new Date(a, m-1, d);
      const diff = Date.now() - n.getTime();
      return Math.floor(diff / (365.25*24*3600*1000));
    } catch { return null; }
  })() : null;

  // Fecha com ESC
  useEffect(() => {
    if (!aberto) return;
    const handler = e => { if (e.key === 'Escape') fechar(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [aberto, fechar]);

  if (!aberto) return null;

  const ABAS = [
    { id:'resumo',    label:'📊 Resumo' },
    { id:'dados',     label:'🪪 Dados' },
    { id:'entradas',  label:`📥 Entradas (${entradas.length})` },
    { id:'agentes',   label:'🤖 Agentes' },
  ];

  return (
    <>
      {/* Overlay */}
      <div onClick={fechar} style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
        zIndex:1000, backdropFilter:'blur(2px)',
      }}/>

      {/* Drawer */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width: Math.min(580, window.innerWidth - 32),
        background:'#fff', zIndex:1001,
        boxShadow:'-4px 0 32px rgba(27,54,93,.18)',
        display:'flex', flexDirection:'column',
        animation:'slideIn .2s ease-out',
      }}>
        <style>{`
          @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
        `}</style>

        {/* Header do drawer */}
        <div style={{ background:N, padding:'16px 20px', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:900, fontSize:20, color:'#fff',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {pac?.nome || '—'}
              </div>
              {resumo?.linha_clinica ? (
                <div style={{ fontSize:12, color:'rgba(255,255,255,.8)', marginTop:3 }}>
                  {resumo.linha_clinica}
                </div>
              ) : (
                <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', marginTop:3 }}>
                  {[pac?.diag, pac?.estadio, pac?.trat].filter(Boolean).join(' · ') || 'Dados incompletos'}
                </div>
              )}
              {/* Badges */}
              <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                {idade && (
                  <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px',
                    borderRadius:999, background:'rgba(255,255,255,.15)', color:'#fff' }}>
                    {idade} anos
                  </span>
                )}
                {pac?.ecog !== undefined && (
                  <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px',
                    borderRadius:999, background:'rgba(255,255,255,.15)', color:'#fff' }}>
                    ECOG {pac.ecog}
                  </span>
                )}
                {resumo?.status_atual && (
                  <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px',
                    borderRadius:999, background:G, color:'#fff' }}>
                    {resumo.status_atual}
                  </span>
                )}
                {gerando && (
                  <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px',
                    borderRadius:999, background:'rgba(255,255,255,.2)', color:'#fff' }}>
                    ⚡ Gerando resumo...
                  </span>
                )}
              </div>
            </div>
            <button onClick={fechar} style={{
              background:'rgba(255,255,255,.15)', border:'none', color:'#fff',
              borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16,
              fontWeight:900, flexShrink:0, marginLeft:12,
            }}>✕</button>
          </div>
        </div>

        {/* Abas */}
        <div style={{ background:N, borderTop:'1px solid rgba(255,255,255,.1)',
          display:'flex', gap:2, padding:'0 12px', flexShrink:0 }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={()=>setAba(a.id)} style={{
              background: aba===a.id ? G : 'transparent',
              border:'none', color:'#fff', padding:'8px 12px', fontSize:11,
              fontWeight:800, cursor:'pointer', borderRadius:'6px 6px 0 0',
              opacity: aba===a.id ? 1 : 0.65, fontFamily:'inherit',
            }}>{a.label}</button>
          ))}
        </div>

        {/* Conteúdo scrollável */}
        <div style={{ flex:1, overflowY:'auto', padding:16 }}>

          {/* ── ABA: RESUMO ── */}
          {aba === 'resumo' && (
            <div style={{ display:'grid', gap:12 }}>
              {!resumo && !gerando && (
                <div style={{ background:'#F8FAFC', borderRadius:12, padding:20,
                  textAlign:'center' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🤖</div>
                  <p style={{ color:'#64748B', fontSize:13, margin:'0 0 14px' }}>
                    Nenhum resumo gerado ainda para este paciente.
                  </p>
                  <button onClick={gerarAgora}
                    style={{ background:G, color:'#fff', border:'none',
                      borderRadius:8, padding:'9px 20px', fontWeight:800,
                      fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                    ⚡ Gerar Resumo com IA
                  </button>
                </div>
              )}

              {gerando && (
                <div style={{ background:'#FEF3C7', borderRadius:12, padding:16,
                  textAlign:'center', border:`1px solid ${G}44` }}>
                  <div style={{ fontSize:24 }}>⚡</div>
                  <p style={{ color:AM, fontSize:12, margin:'4px 0 0', fontWeight:700 }}>
                    Gerando resumo clínico...
                  </p>
                </div>
              )}

              {resumo && !gerando && (
                <>
                  {/* Score de completude */}
                  {resumo.score_completude > 0 && (
                    <div style={{ background:'#F8FAFC', borderRadius:10, padding:12,
                      display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:11, color:N, marginBottom:4 }}>
                          Completude do prontuário
                        </div>
                        <div style={{ background:'#E2E8F0', borderRadius:999, height:8, overflow:'hidden' }}>
                          <div style={{
                            width: `${resumo.score_completude}%`,
                            height:'100%',
                            background: resumo.score_completude >= 80 ? VE
                              : resumo.score_completude >= 50 ? G : VM,
                            transition:'width .5s ease',
                          }}/>
                        </div>
                      </div>
                      <div style={{ fontWeight:900, fontSize:18,
                        color: resumo.score_completude >= 80 ? VE
                          : resumo.score_completude >= 50 ? G : VM }}>
                        {resumo.score_completude}%
                      </div>
                    </div>
                  )}

                  {/* Alertas */}
                  {resumo.alertas?.length > 0 && (
                    <div style={{ background:'#FFF5F5', borderRadius:10, padding:12,
                      border:`1px solid ${VM}33` }}>
                      <div style={{ fontWeight:800, fontSize:11, color:VM,
                        textTransform:'uppercase', marginBottom:7 }}>🚨 Alertas</div>
                      {resumo.alertas.map((a,i)=>(
                        <div key={i} style={{ fontSize:12, color:VM, marginBottom:3 }}>❗ {a}</div>
                      ))}
                    </div>
                  )}

                  {/* Pendências */}
                  {resumo.pendencias?.length > 0 && (
                    <div style={{ background:'#FFFBEB', borderRadius:10, padding:12,
                      border:`1px solid ${G}44` }}>
                      <div style={{ fontWeight:800, fontSize:11, color:AM,
                        textTransform:'uppercase', marginBottom:7 }}>📥 Pendências</div>
                      {resumo.pendencias.map((p,i)=>(
                        <div key={i} style={{ fontSize:12, color:AM, marginBottom:3 }}>• {p}</div>
                      ))}
                    </div>
                  )}

                  {/* Seções do resumo */}
                  {Object.entries(resumo.secoes||{}).map(([id, texto]) => {
                    if (!texto) return null;
                    const tituloMap = {
                      identificacao:'🪪 Identificação', diagnostico:'🩺 Diagnóstico',
                      tratamento:'💊 Tratamento', social:'🏠 Social',
                      anamnese:'📋 Anamnese', proximos_passos:'➡️ Próximos Passos',
                    };
                    return (
                      <div key={id} style={{ background:'#FAFCFF', borderRadius:10,
                        padding:12, border:'1px solid #E2E8F0' }}>
                        <div style={{ fontWeight:800, fontSize:11, color:T,
                          textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>
                          {tituloMap[id]||id}
                        </div>
                        <p style={{ fontSize:12, color:'#374151', lineHeight:1.7, margin:0 }}>
                          {texto}
                        </p>
                      </div>
                    );
                  })}

                  {/* Data de geração */}
                  <div style={{ fontSize:10, color:'#94A3B8', textAlign:'right' }}>
                    Gerado em {resumo._geradoEm
                      ? new Date(resumo._geradoEm).toLocaleString('pt-BR')
                      : '—'}
                    <button onClick={gerarAgora} style={{
                      background:'none', border:'none', color:T, fontSize:10,
                      cursor:'pointer', marginLeft:8, fontFamily:'inherit',
                    }}>🔄 Atualizar</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ABA: DADOS ── */}
          {aba === 'dados' && (
            <div style={{ display:'grid', gap:10 }}>
              {[
                { titulo:'Identificação', campos:[
                  ['Nome',pac?.nome],['Nascimento',pac?.nasc],['Sexo',pac?.sexo==='F'?'Feminino':'Masculino'],
                  ['CPF',pac?.cpf],['CNS',pac?.cns],['Mãe',pac?.mae],
                  ['Cidade',pac?.cidade],['Telefone',pac?.tel||pac?.telefone],
                ]},
                { titulo:'Clínico', campos:[
                  ['Diagnóstico',pac?.diag],['CID',pac?.cid],['TNM',pac?.tnm],
                  ['Estádio',pac?.estadio],['Biomarcadores',pac?.bio],
                  ['ECOG',pac?.ecog],['Protocolo',pac?.trat],['Linha',pac?.linha],
                  ['Intenção',pac?.intencao],['Alergias',pac?.alerg],
                ]},
                { titulo:'Antropometria', campos:[
                  ['Peso',pac?.peso?pac.peso+' kg':null],
                  ['Altura',pac?.altura?pac.altura+' cm':null],
                  ['SC',pac?.sc?pac.sc+' m²':null],
                ]},
              ].map(grupo => {
                const itens = grupo.campos.filter(([,v])=>v);
                if (!itens.length) return null;
                return (
                  <div key={grupo.titulo} style={{ background:'#FAFCFF',
                    borderRadius:10, padding:12, border:'1px solid #E2E8F0' }}>
                    <div style={{ fontWeight:800, fontSize:11, color:N,
                      textTransform:'uppercase', letterSpacing:.5, marginBottom:8,
                      borderBottom:`2px solid ${G}`, paddingBottom:5 }}>
                      {grupo.titulo}
                    </div>
                    <div style={{ display:'grid', gap:4 }}>
                      {itens.map(([l,v])=>(
                        <div key={l} style={{ display:'flex', gap:8, fontSize:12 }}>
                          <span style={{ fontWeight:700, color:'#64748B', minWidth:110,
                            flexShrink:0 }}>{l}:</span>
                          <span style={{ color:'#1E293B' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ABA: ENTRADAS ── */}
          {aba === 'entradas' && (
            <div style={{ display:'grid', gap:8 }}>
              {entradas.length === 0 ? (
                <p style={{ color:'#94A3B8', fontSize:12, textAlign:'center', marginTop:24 }}>
                  Nenhuma entrada pendente.
                </p>
              ) : entradas.map((e,i)=>{
                const cor = { paciente:VE, recepcao:T, enfermagem:'#7C3AED' }[e.origem]||G;
                const itens = Object.entries(e.payload||{}).filter(([,v])=>v);
                return (
                  <div key={e.id||i} style={{ background:'#FAFCFF', borderRadius:10,
                    padding:12, border:`1px solid #E2E8F0`,
                    borderLeft:`4px solid ${cor}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontWeight:800, fontSize:12, color:cor }}>
                        {{ paciente:'🪪 Paciente', recepcao:'📋 Recepção',
                          enfermagem:'🩺 Enfermagem' }[e.origem]||e.origem}
                      </span>
                      <span style={{ fontSize:10, color:'#94A3B8' }}>
                        {e.criadoEm
                          ? new Date(e.criadoEm).toLocaleString('pt-BR')
                          : e.rota}
                      </span>
                    </div>
                    <div style={{ display:'grid', gap:2 }}>
                      {itens.slice(0,8).map(([k,v])=>(
                        <div key={k} style={{ display:'flex', gap:8, fontSize:11 }}>
                          <span style={{ fontWeight:700, color:'#64748B',
                            minWidth:100, flexShrink:0 }}>{k}:</span>
                          <span style={{ color:'#374151' }}>
                            {String(v).slice(0,80)}{String(v).length>80?'…':''}
                          </span>
                        </div>
                      ))}
                      {itens.length > 8 && (
                        <div style={{ fontSize:10, color:'#94A3B8' }}>
                          + {itens.length-8} campos...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ABA: AGENTES ── */}
          {aba === 'agentes' && (
            <div style={{ display:'grid', gap:8 }}>
              {!resultados ? (
                <div style={{ textAlign:'center', padding:24 }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🤖</div>
                  <p style={{ color:'#94A3B8', fontSize:12 }}>
                    Nenhum resultado de agentes para este paciente ainda.
                  </p>
                  {navegar && (
                    <button onClick={()=>{ fechar(); navegar('/medico/orquestrador'); }}
                      style={{ background:G, color:'#fff', border:'none',
                        borderRadius:8, padding:'9px 20px', fontWeight:800,
                        fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                      Ir para o Orquestrador
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {resultados.atualizadoEm && (
                    <div style={{ fontSize:10, color:'#94A3B8', textAlign:'right' }}>
                      Processado: {new Date(resultados.atualizadoEm).toLocaleString('pt-BR')}
                    </div>
                  )}
                  {Object.entries(resultados.estadosAgentes||{}).map(([id, st])=>{
                    const cores = {
                      concluido:'#DCFCE7', falhou:'#FEE2E2', aguardando:'#F1F5F9',
                    };
                    const ncampos = Object.keys(st.campos||{}).length;
                    return (
                      <div key={id} style={{ background: cores[st.status]||'#F1F5F9',
                        borderRadius:9, padding:'9px 12px',
                        border:'1px solid #E2E8F0' }}>
                        <div style={{ display:'flex', justifyContent:'space-between',
                          alignItems:'center' }}>
                          <span style={{ fontWeight:800, fontSize:12, color:N }}>{id}</span>
                          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                            {ncampos>0 && (
                              <span style={{ fontSize:10, fontWeight:800,
                                background:VE+'22', color:VE, borderRadius:5, padding:'1px 6px' }}>
                                +{ncampos} campos
                              </span>
                            )}
                            <span style={{ fontSize:12 }}>
                              {{ concluido:'✅', falhou:'❌', aguardando:'⏳' }[st.status]||'—'}
                            </span>
                          </div>
                        </div>
                        {st.mensagem && (
                          <div style={{ fontSize:11, color:'#64748B', marginTop:3 }}>
                            {st.mensagem}
                          </div>
                        )}
                        {ncampos > 0 && (
                          <div style={{ marginTop:6, display:'flex', gap:4, flexWrap:'wrap' }}>
                            {Object.entries(st.campos).slice(0,6).map(([k,v])=>(
                              <span key={k} style={{ fontSize:10, background:'#fff',
                                border:'1px solid #E2E8F0', borderRadius:5,
                                padding:'2px 7px', color:'#374151' }}>
                                {k}: {String(v).slice(0,20)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer com ações rápidas */}
        <div style={{ borderTop:'1px solid #E2E8F0', padding:'12px 16px',
          display:'flex', gap:8, flexShrink:0, flexWrap:'wrap', background:'#F8FAFC' }}>
          {navegar && ([
            { label:'🎯 Central Médica',  path:'/medico/central-validacao' },
            { label:'💊 Prescrição',      path:'/medico/prescricao' },
            { label:'🧠 Orquestrador',    path:'/medico/orquestrador' },
          ]).map(item => (
            <button key={item.path} onClick={()=>{ fechar(); navegar(item.path); }}
              style={{ background:'#fff', border:`1px solid ${N}33`, color:N,
                borderRadius:7, padding:'6px 12px', fontSize:11, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit' }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Botão do nome do paciente (para a navbar) ────────────────────────────────
/**
 * Substitui o simples <span> do nome na navbar por um botão que abre o drawer.
 */
export function BotaoNomePaciente({ nome, onClick, gerando }) {
  return (
    <button onClick={onClick} style={{
      background:'rgba(255,255,255,.12)',
      border:'1px solid rgba(255,255,255,.2)',
      color:'#fff', borderRadius:8, padding:'4px 12px',
      cursor:'pointer', fontFamily:'inherit', fontWeight:800,
      fontSize:13, display:'flex', alignItems:'center', gap:7,
      transition:'background .15s',
    }}
    onMouseEnter={e => e.target.style.background='rgba(255,255,255,.2)'}
    onMouseLeave={e => e.target.style.background='rgba(255,255,255,.12)'}
    title="Clique para ver todos os dados do paciente">
      {gerando
        ? <span style={{ fontSize:12 }}>⚡</span>
        : <span style={{ fontSize:12 }}>👤</span>}
      {nome}
      <span style={{ fontSize:10, opacity:.7 }}>▼</span>
    </button>
  );
}
