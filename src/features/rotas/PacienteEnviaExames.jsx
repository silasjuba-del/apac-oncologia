// === src/features/rotas/PacienteEnviaExames.jsx ===
// APACApp v1.1.10 — Rota /paciente/envia-exames
//
// Paciente envia hemograma + RELATA TOXICIDADES (CTCAE) — consenso 5 auditorias.
//
// Mudanças v1.1.10:
//   - Toxicidades não-hematológicas perguntadas SEMPRE (febre, diarreia,
//     mucosite, vômitos, neuropatia, sangramento, internação recente).
//   - Decisão final = mais grave entre hemograma E toxicidades.
//   - Wording reescrito: nunca "APTO". Mensagem subordinada à consulta médica.
//   - Persistência transitória: dados ficam em `_exame_paciente_*` (não vão
//     para `hb`/`neutrofilos_abs`/`plaquetas` direto). Enfermagem confirma
//     depois contra laudo físico.

import { useState, useCallback, useMemo } from 'react';
import {
  avaliarAptidaoQT,
  gerarCartaMedicoAssistente,
  parseNumeroBR,
} from '../oncoProUtils.js';

const N = '#1B365D'; const T = '#2B7A8C'; const G = '#B8860B';
const VE = '#15803D'; const VM = '#B91C1C'; const AM = '#B45309';
const BG = '#EEF2F7';

const card = { background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,.07)', border:'1px solid #E2E8F0', padding:20, marginBottom:16 };
const titulo = { fontSize:18, fontWeight:900, color:N, textTransform:'uppercase', letterSpacing:.6, borderBottom:`3px solid ${T}`, paddingBottom:7, margin:'0 0 14px' };
const inp = {
  width:'100%', padding:'14px 16px', borderRadius:10,
  border:'2px solid #CBD5E1', fontSize:18, fontWeight:700,
  fontFamily:'inherit', boxSizing:'border-box', color:N,
};
const lab = { display:'block', fontSize:14, fontWeight:800, color:N, marginBottom:6, letterSpacing:.3 };

const CORES_DECISAO = {
  APTO:        { bg:'#D1FAE5', border:VE,        texto:'#065F46', icone:'ℹ️' },
  ATRASO_1SEM: { bg:'#FEF3C7', border:AM,        texto:'#92400E', icone:'⏱️' },
  URGENCIA_PS: { bg:'#FEE2E2', border:VM,        texto:'#7F1D1D', icone:'🚨' },
  TRANSFUSAO:  { bg:'#FEE2E2', border:VM,        texto:'#7F1D1D', icone:'🚑' },
};

// Graus CTCAE simplificados em linguagem de paciente
const OPCOES_DIARREIA = [
  { v: 0, l: 'Sem diarreia ou normal' },
  { v: 1, l: 'Até 3 evacuações líquidas/dia' },
  { v: 2, l: '4 a 6 evacuações líquidas/dia' },
  { v: 3, l: '7 ou mais evacuações líquidas/dia' },
];
const OPCOES_MUCOSITE = [
  { v: 0, l: 'Sem feridas na boca' },
  { v: 1, l: 'Pequenas feridas, mas consigo comer normalmente' },
  { v: 2, l: 'Feridas com dor, mas ainda consigo comer (alimentos macios)' },
  { v: 3, l: 'Dor forte, NÃO consigo comer/beber direito' },
];
const OPCOES_VOMITOS = [
  { v: 0, l: 'Sem vômitos' },
  { v: 1, l: '1 a 2 vezes/dia' },
  { v: 2, l: '3 a 5 vezes/dia' },
  { v: 3, l: 'Mais de 5 vezes/dia ou desidratado(a)' },
];
const OPCOES_NEUROPATIA = [
  { v: 0, l: 'Sem formigamento' },
  { v: 1, l: 'Formigamento leve, sem atrapalhar' },
  { v: 2, l: 'Formigamento incomoda, dificulta abotoar/pegar coisas pequenas' },
  { v: 3, l: 'Não consigo segurar objetos, fraqueza muscular' },
];

export default function PacienteEnviaExames({ pac, pacienteKey, onSubmit }) {
  // Hemograma
  const [hb, setHb] = useState('');
  const [neutrofilos, setNeutrofilos] = useState('');
  const [plaquetas, setPlaquetas] = useState('');
  // Toxicidades CTCAE (v1.1.10)
  const [temperatura, setTemperatura] = useState('');
  const [diarreiaGrau, setDiarreiaGrau] = useState(0);
  const [mucositeGrau, setMucositeGrau] = useState(0);
  const [vomitosGrau, setVomitosGrau] = useState(0);
  const [neuropatiaGrau, setNeuropatiaGrau] = useState(0);
  const [sangramento, setSangramento] = useState(false);
  const [internacaoRecente, setInternacaoRecente] = useState(false);

  const [enviado, setEnviado] = useState(false);
  const [avaliacao, setAvaliacao] = useState(null);

  // Avaliação em tempo real
  const previa = useMemo(() => {
    const algumValor = hb || neutrofilos || plaquetas;
    if (!algumValor) return null;
    const sintomas = {
      febre_temp: parseNumeroBR(temperatura),
      diarreia_grau: diarreiaGrau,
      mucosite_grau: mucositeGrau,
      vomitos_grau: vomitosGrau,
      neuropatia_grau: neuropatiaGrau,
      sangramento_ativo: sangramento,
      internacao_recente: internacaoRecente,
      // legado
      febre: parseNumeroBR(temperatura) >= 37.8,
      sangramento,
    };
    return avaliarAptidaoQT(
      { hb, neutrofilos, plaquetas },
      sintomas,
    );
  }, [hb, neutrofilos, plaquetas, temperatura, diarreiaGrau, mucositeGrau, vomitosGrau, neuropatiaGrau, sangramento, internacaoRecente]);

  const enviar = useCallback(() => {
    if (!previa || !previa.decisaoFinal) return;

    const cartaTexto = gerarCartaMedicoAssistente({
      pac, avaliacao: previa,
      dataExame: new Date().toLocaleDateString('pt-BR'),
    });

    // v1.1.10 (consenso 5 auditorias): NÃO persiste direto no pac.
    // Dados ficam como TRANSITÓRIO até enfermagem/médico confirmar.
    onSubmit?.({
      origem: 'paciente',
      rota: '/paciente/envia-exames',
      payload: {
        // TUDO transitório (prefixo `_exame_paciente_`)
        _exame_paciente_data: new Date().toISOString(),
        _exame_paciente_decisao: previa.decisaoFinal,
        _exame_paciente_hb: parseNumeroBR(hb),
        _exame_paciente_neutrofilos: parseNumeroBR(neutrofilos),
        _exame_paciente_plaquetas: parseNumeroBR(plaquetas),
        _exame_paciente_temperatura: parseNumeroBR(temperatura),
        _exame_paciente_diarreia_grau: diarreiaGrau,
        _exame_paciente_mucosite_grau: mucositeGrau,
        _exame_paciente_vomitos_grau: vomitosGrau,
        _exame_paciente_neuropatia_grau: neuropatiaGrau,
        _exame_paciente_sangramento: sangramento,
        _exame_paciente_internacao_recente: internacaoRecente,
        _exame_paciente_carta: cartaTexto,
        _exame_paciente_acoes: JSON.stringify(previa.acoesAutomaticas),
        // Status para enfermagem/médico confirmarem:
        _exame_paciente_status: 'pendente_conferencia',
        // Resumo de sintomas (para o painel do médico)
        sintomas_relatados: [
          temperatura && `Temp: ${temperatura}°C`,
          diarreiaGrau > 0 && `Diarreia G${diarreiaGrau}`,
          mucositeGrau > 0 && `Mucosite G${mucositeGrau}`,
          vomitosGrau > 0 && `Vômitos G${vomitosGrau}`,
          neuropatiaGrau > 0 && `Neuropatia G${neuropatiaGrau}`,
          sangramento && 'Sangramento ativo',
          internacaoRecente && 'Internação recente',
        ].filter(Boolean).join(' | '),
      },
      ator: 'paciente',
    });
    setAvaliacao(previa);
    setEnviado(true);
  }, [previa, pac, hb, neutrofilos, plaquetas, temperatura, diarreiaGrau, mucositeGrau, vomitosGrau, neuropatiaGrau, sangramento, internacaoRecente, onSubmit]);

  // Tela de RESPOSTA AUTOMÁTICA após envio
  if (enviado && avaliacao) {
    const cores = CORES_DECISAO[avaliacao.decisaoFinal] || CORES_DECISAO.APTO;
    return (
      <div style={{ background:BG, minHeight:'100vh', padding:'20px 16px' }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          {/* Rótulo institucional (Aud Gemini + 9) */}
          <div style={{
            background:'#F8FAFC', border:'1px solid #E2E8F0',
            borderRadius:8, padding:'10px 14px', marginBottom:14,
            fontSize:12, color:'#475569',
          }}>
            <strong style={{ color:N }}>Pré-triagem automatizada</strong> — Hospital do Bem,
            Unidade Oncológica. <strong>NÃO substitui</strong> avaliação médica presencial.
            A decisão final sobre fazer ou não a quimioterapia é sempre do médico oncologista.
          </div>

          <div style={{
            background:cores.bg, border:`3px solid ${cores.border}`,
            borderRadius:14, padding:24, marginBottom:16,
          }}>
            <div style={{ fontSize:48, marginBottom:8 }}>{cores.icone}</div>
            {/* v1.1.10 (consenso 5 auditorias): NUNCA usar "APTO" */}
            <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:cores.texto, lineHeight:1.3 }}>
              {avaliacao.decisaoFinal === 'APTO' &&
                'Seus exames foram recebidos'}
              {avaliacao.decisaoFinal === 'ATRASO_1SEM' &&
                'NÃO compareça à quimioterapia esta semana'}
              {avaliacao.decisaoFinal === 'URGENCIA_PS' &&
                'PROCURE ATENDIMENTO MÉDICO IMEDIATAMENTE'}
              {avaliacao.decisaoFinal === 'TRANSFUSAO' &&
                'EMERGÊNCIA — vá ao hospital AGORA'}
            </h2>

            {avaliacao.decisaoFinal === 'APTO' && (
              <p style={{ margin:'12px 0 0', fontSize:14, color:cores.texto, fontWeight:600, lineHeight:1.6 }}>
                Pelos valores informados, <strong>não há motivo automático</strong> para adiar
                sua quimioterapia.
                <br /><br />
                <strong>A decisão final é sempre do médico oncologista</strong> e pode mudar
                conforme o exame clínico no dia do tratamento.
                <br /><br />
                Compareça normalmente, <strong>salvo</strong> se você apresentar:
                febre, sangramento, falta de ar, diarreia intensa, feridas na boca que
                impedem alimentação, ou qualquer piora clínica importante.
                Nestes casos, procure o PS da sua cidade ANTES de viajar para a quimioterapia.
              </p>
            )}
          </div>

          <div style={card}>
            <h3 style={titulo}>📋 Orientações</h3>
            <pre style={{
              whiteSpace:'pre-wrap', fontFamily:'inherit',
              fontSize:16, lineHeight:1.5, color:N, margin:0,
            }}>{avaliacao.mensagemPaciente || 'Mantenha o cronograma de tratamento. Sua equipe de origem entrará em contato se necessário.'}</pre>
          </div>

          {avaliacao.cartaAssistente && (
            <div style={{ ...card, background:'#FFFBEB', borderColor:AM }}>
              <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#7F1D1D' }}>
                📄 Uma carta foi <strong>gerada</strong> para apresentar ao médico assistente
                ou pronto-socorro da sua cidade.
              </p>
              <p style={{ margin:'6px 0 0', fontSize:12, color:'#92400E' }}>
                Imprima ou mostre esta tela no atendimento médico. A equipe do
                Hospital do Bem também será notificada.
              </p>
            </div>
          )}

          {avaliacao.acoesAutomaticas.length > 0 && (
            <div style={card}>
              <h3 style={titulo}>🔁 Próximos passos</h3>
              {avaliacao.acoesAutomaticas.map((a, i) => (
                <p key={i} style={{ margin:'6px 0', fontSize:14, color:N }}>
                  • {a.descricao}
                </p>
              ))}
              <p style={{ margin:'10px 0 0', fontSize:11, color:'#6B7280', fontStyle:'italic' }}>
                O reagendamento será confirmado pela recepção do Hospital do Bem.
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setEnviado(false); setAvaliacao(null);
              setHb(''); setNeutrofilos(''); setPlaquetas('');
              setTemperatura(''); setDiarreiaGrau(0); setMucositeGrau(0);
              setVomitosGrau(0); setNeuropatiaGrau(0);
              setSangramento(false); setInternacaoRecente(false);
            }}
            style={{ width:'100%', padding:'12px', borderRadius:8, fontSize:14, fontWeight:700, background:'#F3F4F6', border:'1px solid #D1D5DB', color:N, cursor:'pointer' }}
          >
            Enviar outro exame
          </button>
        </div>
      </div>
    );
  }

  // Formulário
  const coresPrev = previa?.decisaoFinal ? CORES_DECISAO[previa.decisaoFinal] : null;

  return (
    <div style={{ background:BG, minHeight:'100vh', padding:'20px 16px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ marginBottom:14 }}>
          <p style={{ margin:0, fontSize:11, color:T, fontWeight:700, letterSpacing:1 }}>APACApp · v1.1.10</p>
          <h1 style={{ margin:'4px 0 0', fontSize:26, fontWeight:900, color:N }}>📷 Enviar exames</h1>
          <p style={{ margin:'4px 0 0', fontSize:14, color:'#6B7280' }}>
            Antes do dia da quimioterapia, informe seus exames e como está se sentindo.
            Você receberá uma <strong>pré-triagem automatizada</strong> — a avaliação médica
            no dia continua sendo necessária.
          </p>
        </div>

        <div style={card}>
          <h3 style={titulo}>🩸 Hemograma</h3>

          <div style={{ marginBottom:16 }}>
            <label style={lab}>Hemoglobina (Hb)</label>
            <input type="text" value={hb} onChange={e => setHb(e.target.value)} placeholder="Ex: 11,5" style={inp} />
            <p style={{ margin:'4px 0 0', fontSize:11, color:'#6B7280' }}>g/dL</p>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={lab}>Neutrófilos (segmentados absolutos)</label>
            <input type="text" value={neutrofilos} onChange={e => setNeutrofilos(e.target.value)} placeholder="Ex: 1800" style={inp} />
            <p style={{ margin:'4px 0 0', fontSize:11, color:'#6B7280' }}>/mm³</p>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={lab}>Plaquetas</label>
            <input type="text" value={plaquetas} onChange={e => setPlaquetas(e.target.value)} placeholder="Ex: 180000" style={inp} />
            <p style={{ margin:'4px 0 0', fontSize:11, color:'#6B7280' }}>/mm³</p>
          </div>
        </div>

        {/* v1.1.10 (consenso 5 auditorias): TOXICIDADES SEMPRE PERGUNTADAS */}
        <div style={card}>
          <h3 style={titulo}>🩺 Como você está se sentindo?</h3>
          <p style={{ margin:'0 0 14px', fontSize:13, color:'#6B7280' }}>
            Essas respostas são tão importantes quanto o hemograma. Responda com sinceridade.
          </p>

          <div style={{ marginBottom:14 }}>
            <label style={lab}>Está com febre? Qual a temperatura?</label>
            <input
              type="text"
              value={temperatura}
              onChange={e => setTemperatura(e.target.value)}
              placeholder="Ex: 37,5 (deixe vazio se sem febre)"
              style={inp}
            />
          </div>

          <ToxicidadeSelector label="Diarreia (evacuações líquidas hoje?)" valor={diarreiaGrau} setValor={setDiarreiaGrau} opcoes={OPCOES_DIARREIA} />
          <ToxicidadeSelector label="Feridas/dor na boca (mucosite)?" valor={mucositeGrau} setValor={setMucositeGrau} opcoes={OPCOES_MUCOSITE} />
          <ToxicidadeSelector label="Vômitos hoje?" valor={vomitosGrau} setValor={setVomitosGrau} opcoes={OPCOES_VOMITOS} />
          <ToxicidadeSelector label="Formigamento ou fraqueza nas mãos/pés?" valor={neuropatiaGrau} setValor={setNeuropatiaGrau} opcoes={OPCOES_NEUROPATIA} />

          <div style={{ marginTop:14, padding:12, background:'#FFFBEB', borderRadius:8, border:'1px solid #FCD34D' }}>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input
                type="checkbox"
                checked={sangramento}
                onChange={e => setSangramento(e.target.checked)}
                style={{ width:24, height:24, cursor:'pointer' }}
              />
              <span style={{ fontSize:15, fontWeight:700, color:'#92400E' }}>
                Tenho sangramento agora (gengiva, urina, fezes, manchas roxas)
              </span>
            </label>
          </div>

          <div style={{ marginTop:10, padding:12, background:'#F3F4F6', borderRadius:8, border:'1px solid #D1D5DB' }}>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input
                type="checkbox"
                checked={internacaoRecente}
                onChange={e => setInternacaoRecente(e.target.checked)}
                style={{ width:24, height:24, cursor:'pointer' }}
              />
              <span style={{ fontSize:15, fontWeight:600, color:N }}>
                Estive internado(a) nos últimos 7 dias
              </span>
            </label>
          </div>
        </div>

        {/* Prévia em tempo real */}
        {previa && previa.decisaoFinal && coresPrev && (
          <div style={{
            background:coresPrev.bg, border:`2px solid ${coresPrev.border}`,
            borderRadius:12, padding:16, marginBottom:16,
          }}>
            <div style={{ fontSize:14, fontWeight:800, color:coresPrev.texto, marginBottom:4 }}>
              {coresPrev.icone} Pré-triagem:
              {previa.decisaoFinal === 'APTO' && ' Sem motivo automático para adiar'}
              {previa.decisaoFinal === 'ATRASO_1SEM' && ' Não compareça esta semana — retorno em 7 dias'}
              {previa.decisaoFinal === 'URGENCIA_PS' && ' URGÊNCIA — vá ao PS'}
              {previa.decisaoFinal === 'TRANSFUSAO' && ' EMERGÊNCIA — avaliação imediata'}
            </div>
            <div style={{ fontSize:12, color:coresPrev.texto, opacity:0.8 }}>
              {previa.parametros.filter(p => p.decisao).map(p =>
                `${p.parametro}: ${p.valor ?? '—'} → ${p.decisao}`
              ).join(' · ')}
            </div>
          </div>
        )}

        <button
          onClick={enviar}
          disabled={!previa?.decisaoFinal}
          style={{
            width:'100%', padding:'16px', borderRadius:12,
            fontSize:16, fontWeight:900,
            background: previa?.decisaoFinal ? G : '#D1D5DB',
            color:'#fff', border:'none',
            cursor: previa?.decisaoFinal ? 'pointer' : 'not-allowed',
          }}
        >
          📨 Enviar e receber pré-triagem
        </button>

        <p style={{ margin:'10px 0 0', fontSize:11, color:'#9CA3AF', textAlign:'center', lineHeight:1.5 }}>
          ⚠️ Pré-triagem automatizada do Hospital do Bem. Não substitui avaliação médica presencial.
          Em caso de emergência (febre alta, sangramento, falta de ar grave), procure o PS imediatamente.
        </p>
      </div>
    </div>
  );
}

function ToxicidadeSelector({ label, valor, setValor, opcoes }) {
  return (
    <div style={{ marginBottom:14 }}>
      <p style={{ margin:'0 0 6px', fontSize:14, fontWeight:800, color:'#1B365D' }}>{label}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {opcoes.map(op => (
          <label key={op.v} style={{
            display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
            background: valor === op.v ? '#EEF2F7' : '#fff',
            border: `1.5px solid ${valor === op.v ? '#1B365D' : '#E2E8F0'}`,
            borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600,
            color: valor === op.v ? '#1B365D' : '#4B5563',
          }}>
            <input
              type="radio"
              checked={valor === op.v}
              onChange={() => setValor(op.v)}
              style={{ width:16, height:16, cursor:'pointer' }}
            />
            {op.l}
          </label>
        ))}
      </div>
    </div>
  );
}
