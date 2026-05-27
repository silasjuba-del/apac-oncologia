// === src/features/rotas/OrquestradorPreview.jsx ===
// APACApp v1.1.11 — Rota /medico/orquestrador
//
// ROTA 1: Paciente + Recepção → Orquestrador → Preview Editável → Enviar Agentes
//
// Fluxo:
//  1. Lê todas as entradas pendentes (paciente + recepção) do entradasStore
//  2. Chama IA para gerar resumo estruturado e editável
//  3. Médico revisa / edita cada seção
//  4. Clica "Enviar a todos os agentes" → pipeline completa
//  5. Agentes populam prontuário, APAC, prescrição automaticamente
//  6. Médico vê resultado por agente em tempo real

import { useState, useEffect, useCallback } from 'react';
import { executarAgentesLocais, executarAgentesIA } from '../agentes/agentRunner.js';
import { processarEntradasComAcumulador } from '../oncoProUtils.js';

const N = '#1B365D'; const T = '#2B7A8C'; const G = '#B8860B';
const VE = '#15803D'; const VM = '#B91C1C'; const BG = '#EEF2F7';

const sc = {
  card: (ex={}) => ({ background:'#fff', borderRadius:14, padding:20,
    boxShadow:'0 2px 10px rgba(27,54,93,.08)', ...ex }),
  btn: (v='gold', ex={}) => {
    const map = {
      gold:  { background:G,   color:'#fff' },
      teal:  { background:T,   color:'#fff' },
      navy:  { background:N,   color:'#fff' },
      green: { background:VE,  color:'#fff' },
      red:   { background:VM,  color:'#fff' },
      ghost: { background:'transparent', color:N, border:`1px solid ${N}44` },
    };
    return { ...map[v], borderRadius:9, padding:'9px 18px', fontWeight:800,
      fontSize:13, border:'none', cursor:'pointer', fontFamily:'inherit', ...ex };
  },
  inp: { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #D1D5DB',
    fontSize:13, fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' },
};

// ── Seções do resumo estruturado ─────────────────────────────────────────────
const SECOES = [
  { id:'identificacao', titulo:'🪪 Identificação',      campos:['nome','nasc','sexo','cpf','cns','mae','cidade','telefone'] },
  { id:'clinico',       titulo:'🩺 Dados Clínicos',     campos:['diag','cid','tnm','estadio','ecog','bio','trat','linha','intencao','grau_hist','subtipo','margens','data_biopsia'] },
  { id:'laudos',        titulo:'🔬 Laudos',              campos:['anatom','imagen','exames_resumo','textoColar'] },
  { id:'social',        titulo:'🏠 Determinantes Sociais', campos:['cidade_origem','necessita_tfd','necessita_transporte','necessita_assist_social','acompanhante_nome'] },
  { id:'anamnese',      titulo:'📋 Anamnese',           campos:['queixa_principal','medicacoes_em_uso','alergias','historia_familiar','comorbidades','tabagismo','etilismo'] },
];

const LABEL = {
  nome:'Nome completo', nasc:'Nascimento', sexo:'Sexo', cpf:'CPF', cns:'CNS',
  mae:'Nome da mãe', cidade:'Cidade', telefone:'Telefone',
  diag:'Diagnóstico histológico', cid:'CID-10', tnm:'TNM', estadio:'Estádio',
  ecog:'ECOG', bio:'Biomarcadores', trat:'Protocolo', linha:'Linha', intencao:'Intenção',
  grau_hist:'Grau histológico', subtipo:'Subtipo molecular', margens:'Margens cirúrgicas',
  data_biopsia:'Data da biópsia',
  anatom:'Anatomopatológico (AP)', imagen:'Imagem (TC/PET/RNM)', exames_resumo:'Resumo exames', textoColar:'Texto colado (recepção)',
  cidade_origem:'Cidade de Origem', necessita_tfd:'Precisa TFD?',
  necessita_transporte:'Precisa Transporte?', necessita_assist_social:'Assist. Social?',
  acompanhante_nome:'Acompanhante',
  queixa_principal:'Queixa principal', medicacoes_em_uso:'Medicações em uso',
  alergias:'Alergias', historia_familiar:'História familiar',
  comorbidades:'Comorbidades', tabagismo:'Tabagismo', etilismo:'Etilismo',
};

// ── Gera prompt para o orquestrador ──────────────────────────────────────────
function montarPromptOrquestrador(pac, entradas) {
  const camposStr = Object.entries(pac || {})
    .filter(([k, v]) => v && !k.startsWith('_') && !['evolucoes','pacID'].includes(k))
    .map(([k, v]) => `${k}: ${v}`).join('\n');

  const entradasStr = (entradas || []).map((e, i) =>
    `[Entrada ${i+1} — ${e.origem||'?'} — ${new Date(e.criadoEm||Date.now()).toLocaleDateString('pt-BR')}]\n` +
    Object.entries(e.payload || {}).map(([k,v]) => `  ${k}: ${v}`).join('\n')
  ).join('\n\n');

  return `Você é o Orquestrador Clínico do APACApp — oncologia do Hospital do Bem, Patos/PB.

Analise as entradas e dados do prontuário abaixo. Gere um RESUMO CLÍNICO ESTRUTURADO em JSON.
Use SOMENTE dados presentes. Para campos vazios use "". Não invente, não complete, não presuma.

DADOS JÁ NO PRONTUÁRIO:
${camposStr || '(nenhum)'}

ENTRADAS PENDENTES:
${entradasStr || '(nenhuma)'}

INSTRUÇÕES ADICIONAIS:
- anatom: texto do laudo anatomopatológico/biópsia completo disponível
- imagen: síntese objetiva dos exames de imagem (TC/PET/RNM/Eco/RX)
- diag: diagnóstico histológico definitivo (ex: "Adenocarcinoma ductal invasivo G2")
- data_biopsia: data da biópsia no formato DD/MM/AAAA
- estadio: estádio clínico/patológico (ex: "II", "IIIB", "IV")
- tnm: notação TNM completa (ex: "pT2N1M0")
- cid: somente o código CID-10 (ex: "C18.7")

Responda SOMENTE com o JSON abaixo, sem texto adicional:

{
  "identificacao": { "nome":"","nasc":"","sexo":"","cpf":"","cns":"","mae":"","cidade":"","telefone":"" },
  "clinico": { "diag":"","cid":"","tnm":"","estadio":"","ecog":"","bio":"","trat":"","linha":"","intencao":"","grau_hist":"","subtipo":"","margens":"","data_biopsia":"" },
  "laudos": { "anatom":"","imagen":"","exames_resumo":"" },
  "social": { "cidade_origem":"","necessita_tfd":"","necessita_transporte":"","necessita_assist_social":"","acompanhante_nome":"" },
  "anamnese": { "queixa_principal":"","medicacoes_em_uso":"","alergias":"","historia_familiar":"","comorbidades":"","tabagismo":"","etilismo":"" },
  "alertas_clinicos": [],
  "pendencias": [],
  "resumo_narrativo": ""
}`;
}

// ── Status badge de agente ────────────────────────────────────────────────────
function AgenteBadge({ id, status, mensagem, campos }) {
  const cores = {
    aguardando: { bg:'#F1F5F9', txt:'#64748B', borda:'#CBD5E1' },
    rodando:    { bg:'#FEF3C7', txt:'#92400E', borda:'#FDE68A' },
    concluido:  { bg:'#DCFCE7', txt:'#166534', borda:'#86EFAC' },
    falhou:     { bg:'#FEE2E2', txt:'#991B1B', borda:'#FCA5A5' },
  };
  const c = cores[status] || cores.aguardando;
  const ncampos = Object.keys(campos||{}).length;
  return (
    <div style={{ background:c.bg, border:`1px solid ${c.borda}`, borderRadius:9,
      padding:'8px 12px', display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:800, fontSize:12, color:c.txt }}>{id}</div>
        <div style={{ fontSize:11, color:c.txt, opacity:.8, marginTop:1 }}>{mensagem||''}</div>
      </div>
      {ncampos > 0 && (
        <span style={{ fontSize:10, fontWeight:800, background:VE+'22', color:VE,
          borderRadius:6, padding:'2px 7px' }}>
          +{ncampos} campo{ncampos>1?'s':''}
        </span>
      )}
      <span style={{ fontSize:11, fontWeight:900, color:c.txt }}>
        {{ aguardando:'⏳', rodando:'⚡', concluido:'✅', falhou:'❌' }[status]||'—'}
      </span>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function OrquestradorPreview({
  pac, up, chamarClaude, pacienteKey, entradasStore, resultadosAgentesStore, modoSimples=true,
}) {
  const [fase, setFase] = useState('idle'); // idle | gerando | preview | enviando | concluido
  const [resumoIA, setResumoIA]   = useState(null);   // objeto JSON das seções
  const [editado, setEditado]     = useState({});      // sobreposições do médico
  const [erroIA, setErroIA]       = useState('');
  const [alertas, setAlertas]     = useState([]);
  const [pendencias, setPendencias] = useState([]);
  const [resumoNarrativo, setResumoNarrativo] = useState('');
  const [estadosAgentes, setEstadosAgentes]   = useState({});
  const [consentimentoIA, setConsentimentoIA] = useState(false);
  const [logAgentes, setLogAgentes] = useState([]);

  const entradas = entradasStore?.entradasPendentes(pacienteKey) || [];
  const temEntradas = entradas.length > 0;

  // Merge: dados da IA + edições do médico
  const dadosMerge = resumoIA
    ? SECOES.reduce((acc, s) => {
        acc[s.id] = { ...(resumoIA[s.id]||{}), ...(editado[s.id]||{}) };
        return acc;
      }, {})
    : null;

  // ── Fase 1: Gerar preview com IA ────────────────────────────────────────────
  const gerarPreview = useCallback(async () => {
    setFase('gerando'); setErroIA('');
    try {
      const prompt = montarPromptOrquestrador(pac, entradas);
      const resposta = await chamarClaude(prompt, 1800);

      if (resposta.startsWith('⚠')) {
        setErroIA(resposta);
        setFase('idle');
        return;
      }

      // Tenta parsear JSON da resposta
      const clean = resposta.replace(/```json|```/g, '').trim();
      // Extrai o primeiro bloco JSON encontrado
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('IA não retornou JSON válido');

      const parsed = JSON.parse(jsonMatch[0]);
      setResumoIA(parsed);
      setAlertas(parsed.alertas_clinicos || []);
      setPendencias(parsed.pendencias || []);
      setResumoNarrativo(parsed.resumo_narrativo || '');
      setFase('preview');
    } catch (e) {
      setErroIA('Erro ao gerar preview: ' + (e.message || String(e)));
      setFase('idle');
    }
  }, [pac, entradas, chamarClaude]);

  // ── Fase 2: Enviar aos agentes ───────────────────────────────────────────────
  const enviarAgentes = useCallback(async () => {
    if (!dadosMerge) return;
    setFase('enviando');
    setLogAgentes([]);

    try {
      // Monta pac enriquecido — mapeia campos do preview para os nomes corretos do pac
      const pacEnriquecido = { ...(pac||{}) };
      // Mapeamento: campo do preview → campo do pac
      const MAP_CAMPOS = {
        queixa_principal: 'queixa',
        medicacoes_em_uso: 'meds',
        alergias: 'alerg',
        historia_familiar: 'anam_hist_fam',
        comorbidades: 'antec',
      };
      Object.values(dadosMerge).forEach(secao => {
        Object.entries(secao||{}).forEach(([k, v]) => {
          if (!v) return;
          const campo = MAP_CAMPOS[k] || k;
          // Só aplica se campo ainda vazio no pac
          if (!pacEnriquecido[campo]) pacEnriquecido[campo] = v;
        });
      });
      // Aplica imediatamente via up() campos estruturados do preview
      Object.entries(pacEnriquecido).forEach(([k, v]) => {
        if (v && !k.startsWith('_') && v !== pac?.[k]) up?.(k, v);
      });

      const { acumulado, contextoAgentes } = processarEntradasComAcumulador(
        entradas, pacEnriquecido, up,
      );

      // Agentes locais
      setLogAgentes(l => [...l, { msg:'▶ Agentes locais iniciando...', tipo:'info' }]);
      const locais = await executarAgentesLocais({ pac: acumulado, contextoAgentes });
      setEstadosAgentes(prev => ({ ...prev, ...locais.estados }));
      setLogAgentes(l => [...l, {
        msg:`✅ Agentes locais: ${Object.keys(locais.estados).length} processados`,
        tipo:'ok',
      }]);

      // Aplica campos auto-seguros via up()
      Object.entries(locais.acumulado || {}).forEach(([k, v]) => {
        if (v && !k.startsWith('_') && v !== pac?.[k]) {
          up?.(k, v);
        }
      });

      // Agentes IA (se consentimento)
      if (consentimentoIA && typeof chamarClaude === 'function') {
        setLogAgentes(l => [...l, { msg:'▶ Agentes IA iniciando...', tipo:'info' }]);
        const ia = await executarAgentesIA({
          pac: locais.acumulado, contextoAgentes, chamarClaude, consentimentoIA: true,
        });
        setEstadosAgentes(prev => ({ ...prev, ...ia.estados }));
        Object.entries(ia.acumulado || {}).forEach(([k, v]) => {
          if (v && !k.startsWith('_') && v !== pac?.[k]) up?.(k, v);
        });
        setLogAgentes(l => [...l, {
          msg:`✅ Agentes IA: ${Object.keys(ia.estados).length} processados`,
          tipo:'ok',
        }]);
      }

      // Persiste no store
      resultadosAgentesStore?.gravar(pacienteKey, {
        estadosAgentes,
        resumoPaciente: resumoNarrativo,
        geradoEm: new Date().toISOString(),
      });

      // Marca entradas como processadas
      entradas.forEach(e => entradasStore?.marcarProcessada(e.id, { status:'agentes_processados' }));

      setLogAgentes(l => [...l, { msg:'🎉 Pipeline concluída! Dados aplicados ao prontuário.', tipo:'sucesso' }]);
      setFase('concluido');
    } catch (e) {
      setLogAgentes(l => [...l, { msg:'❌ Erro: ' + (e.message||String(e)), tipo:'erro' }]);
      setFase('preview');
    }
  }, [dadosMerge, pac, entradas, up, chamarClaude, consentimentoIA,
      pacienteKey, entradasStore, resultadosAgentesStore, estadosAgentes, resumoNarrativo]);

  // ── Render: estado idle ──────────────────────────────────────────────────────
  if (fase === 'idle') return (
    <div style={{ background:BG, minHeight:'100vh', padding:'24px 16px' }}>
      <div style={{ maxWidth:800, margin:'0 auto', display:'grid', gap:16 }}>
        <div style={sc.card()}>
          <h2 style={{ margin:'0 0 4px', color:N, fontSize:22, fontWeight:900 }}>
            🧠 Orquestrador Clínico
          </h2>
          <p style={{ color:'#64748B', fontSize:13, margin:'0 0 20px' }}>
            Um ponto de entrada: consolida paciente + recepção, gera o resumo revisável e distribui em retroscena.
          </p>

          {/* Entradas pendentes */}
          <div style={{ background:'#F8FAFC', borderRadius:10, padding:14, marginBottom:16 }}>
            <div style={{ fontWeight:800, fontSize:12, color:N, textTransform:'uppercase',
              letterSpacing:.5, marginBottom:10 }}>
              Entradas pendentes ({entradas.length})
            </div>
            {entradas.length === 0 ? (
              <p style={{ color:'#94A3B8', fontSize:12, margin:0 }}>
                Nenhuma entrada pendente. O paciente ou a recepção ainda não enviaram dados.
              </p>
            ) : entradas.map((e, i) => (
              <div key={e.id||i} style={{ background:'#fff', border:'1px solid #E2E8F0',
                borderRadius:8, padding:'8px 12px', marginBottom:6,
                borderLeft:`4px solid ${e.origem==='paciente'?VE:e.origem==='recepcao'?T:G}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:800, fontSize:12, color:N }}>
                    {{paciente:'🪪 Paciente',recepcao:'📋 Recepção',enfermagem:'🩺 Enfermagem'}[e.origem]||e.origem}
                  </span>
                  <span style={{ fontSize:10, color:'#94A3B8' }}>
                    {e.rota?.replace('/','')?.replace('/','')||'—'}
                  </span>
                </div>
                <div style={{ fontSize:11, color:'#64748B', marginTop:3 }}>
                  {Object.keys(e.payload||{}).filter(k=>e.payload[k]).slice(0,5).join(', ')}
                  {Object.keys(e.payload||{}).length > 5 ? ` +${Object.keys(e.payload||{}).length-5}...` : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Dados existentes no pac */}
          {pac?.nome && (
            <div style={{ background:'#EFF9FF', borderRadius:10, padding:12, marginBottom:16,
              border:`1px solid ${T}33` }}>
              <div style={{ fontWeight:800, fontSize:12, color:T, marginBottom:6 }}>
                Dados já no prontuário
              </div>
              <div style={{ fontSize:12, color:'#374151', display:'grid',
                gridTemplateColumns:'1fr 1fr', gap:'3px 16px' }}>
                {[['Nome',pac.nome],['Diagnóstico',pac.diag],['CID',pac.cid],
                  ['Estádio',pac.estadio],['ECOG',pac.ecog],['Protocolo',pac.trat]]
                  .filter(([,v])=>v)
                  .map(([l,v])=>(
                    <div key={l}><strong>{l}:</strong> {v}</div>
                  ))}
              </div>
            </div>
          )}

          {erroIA && (
            <div style={{ background:'#FEE2E2', border:'1px solid #FCA5A5', borderRadius:8,
              padding:10, marginBottom:14, fontSize:12, color:VM }}>
              {erroIA}
            </div>
          )}

          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <button onClick={gerarPreview} disabled={!temEntradas && !pac?.nome}
              style={sc.btn('gold', { fontSize:14, padding:'11px 24px',
                opacity:(!temEntradas && !pac?.nome)?0.5:1 })}>
              ⚡ Gerar resumo
            </button>
            {!temEntradas && !pac?.nome && (
              <span style={{ fontSize:11, color:'#94A3B8' }}>
                Aguardando dados do paciente ou da recepção.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Render: gerando ──────────────────────────────────────────────────────────
  if (fase === 'gerando') return (
    <div style={{ background:BG, minHeight:'100vh', display:'grid',
      placeItems:'center', padding:24 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16,
          animation:'spin 1s linear infinite' }}>⚡</div>
        <h3 style={{ color:N, margin:'0 0 8px' }}>Orquestrador processando...</h3>
        <p style={{ color:'#64748B', fontSize:13 }}>
          Consolidando {entradas.length} entrada(s) + dados do prontuário
        </p>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  // ── Render: preview editável ──────────────────────────────────────────────────
  if (fase === 'preview' && dadosMerge) return (
    <div style={{ background:BG, minHeight:'100vh', padding:'20px 16px' }}>
      <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gap:14 }}>

        {/* Header */}
        <div style={sc.card({ background:N, color:'#fff' })}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            flexWrap:'wrap', gap:10 }}>
            <div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>
                🧠 Preview — Revise antes de enviar
              </h2>
              <p style={{ margin:'4px 0 0', fontSize:12, opacity:.8 }}>
                {pac?.nome||'Paciente'} · {entradas.length} entrada(s) consolidada(s)
              </p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setFase('idle')}
                style={sc.btn('ghost', { color:'#fff', borderColor:'#ffffff44', fontSize:12 })}>
                ← Voltar
              </button>
              <button onClick={gerarPreview}
                style={sc.btn('ghost', { color:'#fff', borderColor:'#ffffff44', fontSize:12 })}>
                🔄 Regerar
              </button>
            </div>
          </div>
        </div>

        {/* Resumo narrativo */}
        {resumoNarrativo && (
          <div style={sc.card({ border:`2px solid ${T}44`, background:'#F0F9FF' })}>
            <div style={{ fontWeight:800, fontSize:12, color:T, textTransform:'uppercase',
              letterSpacing:.5, marginBottom:8 }}>📝 Resumo narrativo</div>
            <p style={{ fontSize:13, color:'#1E293B', lineHeight:1.7, margin:0 }}>
              {resumoNarrativo}
            </p>
          </div>
        )}

        {/* Alertas clínicos */}
        {alertas.length > 0 && (
          <div style={sc.card({ border:`2px solid ${VM}44`, background:'#FFF5F5' })}>
            <div style={{ fontWeight:800, fontSize:12, color:VM, textTransform:'uppercase',
              letterSpacing:.5, marginBottom:8 }}>🚨 Alertas clínicos</div>
            {alertas.map((a,i)=>(
              <div key={i} style={{ fontSize:12, color:VM, marginBottom:4 }}>❗ {a}</div>
            ))}
          </div>
        )}

        {/* Pendências */}
        {pendencias.length > 0 && (
          <div style={sc.card({ border:`2px solid ${G}44`, background:'#FFFBEB' })}>
            <div style={{ fontWeight:800, fontSize:12, color:G, textTransform:'uppercase',
              letterSpacing:.5, marginBottom:8 }}>📥 Pendências identificadas</div>
            {pendencias.map((p,i)=>(
              <div key={i} style={{ fontSize:12, color:'#78350F', marginBottom:4 }}>• {p}</div>
            ))}
          </div>
        )}

        {/* Seções editáveis */}
        {SECOES.map(secao => {
          const dados = dadosMerge[secao.id] || {};
          const temDado = Object.values(dados).some(v => v);
          return (
            <div key={secao.id} style={sc.card({ opacity: temDado?1:0.6 })}>
              <div style={{ fontWeight:900, fontSize:13, color:N, textTransform:'uppercase',
                letterSpacing:.5, borderBottom:`2px solid ${G}`, paddingBottom:6,
                marginBottom:12 }}>
                {secao.titulo}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px' }}>
                {secao.campos.map(campo => {
                  const val = dados[campo] || '';
                  return (
                    <div key={campo}>
                      <label style={{ fontSize:10, fontWeight:800, color:'#64748B',
                        textTransform:'uppercase', display:'block', marginBottom:3 }}>
                        {LABEL[campo]||campo}
                      </label>
                      <input
                        value={val}
                        onChange={e => setEditado(prev => ({
                          ...prev,
                          [secao.id]: { ...(prev[secao.id]||{}), [campo]: e.target.value }
                        }))}
                        placeholder={`${LABEL[campo]||campo}...`}
                        style={{ ...sc.inp, fontSize:12, resize:'none',
                          background: editado[secao.id]?.[campo] ? '#FFFBEB' : '#fff',
                          border: editado[secao.id]?.[campo]
                            ? `1px solid ${G}`
                            : '1px solid #D1D5DB',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Painel de envio */}
        <div style={sc.card({ border:`2px solid ${G}`, background:'#FFFBEB' })}>
          <h3 style={{ margin:'0 0 12px', color:N, fontSize:16, fontWeight:900 }}>
            ✅ Confirmar processamento
          </h3>
          <p style={{ fontSize:12, color:'#64748B', margin:'0 0 14px' }}>
            O orquestrador distribui em retroscena para prontuário, APAC, prescrição e segurança.
          </p>

          {/* Toggle IA */}
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer',
            marginBottom:14, padding:'10px 14px', background:'#fff', borderRadius:8,
            border:`1px solid ${T}33` }}>
            <input type="checkbox" checked={consentimentoIA}
              onChange={e => setConsentimentoIA(e.target.checked)}
              style={{ width:16, height:16, accentColor:T }} />
            <div>
              <div style={{ fontWeight:800, fontSize:12, color:N }}>
                Usar Claude quando disponível
              </div>
              <div style={{ fontSize:11, color:'#64748B' }}>
                Gera justificativa APAC, inferência TNM/CID e biomarcadores via IA.
                Requer chave configurada no IA Hub.
              </div>
            </div>
          </label>

          <button onClick={enviarAgentes}
            style={sc.btn('green', { fontSize:14, padding:'12px 28px', width:'100%' })}>
            ✅ Confirmar e gerar prontuário
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render: enviando / concluido ─────────────────────────────────────────────
  if (fase === 'enviando' || fase === 'concluido') return (
    <div style={{ background:BG, minHeight:'100vh', padding:'24px 16px' }}>
      <div style={{ maxWidth:700, margin:'0 auto', display:'grid', gap:14 }}>
        <div style={sc.card({ textAlign:'center', background: fase==='concluido'?'#F0FDF4':'#fff' })}>
          <div style={{ fontSize:48, marginBottom:10 }}>
            {fase==='concluido' ? '🎉' : '⚡'}
          </div>
          <h2 style={{ color: fase==='concluido'?VE:N, margin:'0 0 6px', fontWeight:900 }}>
            {fase==='concluido' ? 'Prontuário preparado' : 'Orquestrador processando...'}
          </h2>
          <p style={{ color:'#64748B', fontSize:13, margin:0 }}>
            {fase==='concluido'
              ? 'Dados aplicados ao prontuário e ao dossiê. Agentes permaneceram em retroscena.'
              : 'Consolidando dados e executando checagens internas.'}
          </p>
          {fase==='concluido' && (
            <button onClick={()=>setFase('idle')} style={sc.btn('navy',{marginTop:16,fontSize:13})}>
              ← Nova Consulta
            </button>
          )}
        </div>

        {/* Log em tempo real */}
        {!modoSimples&&<div style={sc.card()}>
          <div style={{ fontWeight:900, fontSize:12, color:N, textTransform:'uppercase',
            letterSpacing:.5, marginBottom:10 }}>Log de Execução</div>
          <div style={{ display:'grid', gap:4 }}>
            {logAgentes.map((l,i)=>(
              <div key={i} style={{ fontSize:12, padding:'5px 10px', borderRadius:6,
                background: l.tipo==='sucesso'?'#DCFCE7':l.tipo==='erro'?'#FEE2E2':
                  l.tipo==='ok'?'#F0FDF4':'#F8FAFC',
                color: l.tipo==='sucesso'?VE:l.tipo==='erro'?VM:'#374151' }}>
                {l.msg}
              </div>
            ))}
          </div>
        </div>}

        {/* Status por agente */}
        {!modoSimples&&Object.keys(estadosAgentes).length > 0 && (
          <div style={sc.card()}>
            <div style={{ fontWeight:900, fontSize:12, color:N, textTransform:'uppercase',
              letterSpacing:.5, marginBottom:10 }}>Status dos Agentes</div>
            <div style={{ display:'grid', gap:6 }}>
              {Object.entries(estadosAgentes).map(([id, st]) => (
                <AgenteBadge key={id} id={id} {...st} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}
