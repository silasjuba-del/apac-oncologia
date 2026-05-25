// === src/features/rotas/MedicoNovosExames.jsx ===
// APACApp v1.1.8 — Rota /medico/novos-exames
//
// Médico, durante acompanhamento, inclui novos exames de imagem (TC/RM/PET)
// ou laboratoriais. Os agentes locais extraem TNM, biomarcadores e resumem
// para a evolução automaticamente.
//
// Diferença vs /recepcao/upload-laudos:
//   - Aqui a fonte é 'medico' (prioridade 90, soberana)
//   - O resumo do exame vai direto para `evolucao_resumo_exame`
//     (campo que aparece na próxima evolução médica)

import { useState, useCallback } from 'react';

const N = '#1B365D'; const T = '#2B7A8C'; const G = '#B8860B';
const VE = '#15803D'; const VM = '#B91C1C';
const BG = '#EEF2F7';

const card = { background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,.07)', border:'1px solid #E2E8F0', padding:20, marginBottom:16 };
const titulo = { fontSize:18, fontWeight:900, color:N, textTransform:'uppercase', letterSpacing:.6, borderBottom:`3px solid ${G}`, paddingBottom:7, margin:'0 0 14px' };
const inp = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #CBD5E1', fontSize:14, fontWeight:600, fontFamily:'inherit', boxSizing:'border-box' };
const lab = { display:'block', fontSize:12, fontWeight:700, color:N, marginBottom:4, letterSpacing:.3 };
const btnPri = { background:G, color:'#fff', fontWeight:900, borderRadius:10, padding:'12px 24px', border:'none', cursor:'pointer', fontSize:15 };

const TIPOS_EXAME = [
  { v: 'tc',                l: '📷 TC (Tomografia)',      grupo: 'imagem' },
  { v: 'rm',                l: '🧲 RM (Ressonância)',      grupo: 'imagem' },
  { v: 'pet',               l: '⚛️ PET-CT',                grupo: 'imagem' },
  { v: 'us',                l: '🌊 Ultrassom',             grupo: 'imagem' },
  { v: 'cintilografia',     l: '☢️ Cintilografia',         grupo: 'imagem' },
  { v: 'rx',                l: '📸 Raio-X',                grupo: 'imagem' },
  { v: 'lab_geral',         l: '🧪 Lab — bioquímica',      grupo: 'laboratorio' },
  { v: 'hemograma',         l: '🩸 Hemograma',             grupo: 'laboratorio' },
  { v: 'marcador_tumoral',  l: '🎯 Marcadores tumorais',   grupo: 'laboratorio' },
  { v: 'anatomia',          l: '🔬 Anatomia patológica',   grupo: 'laboratorio' },
];

export default function MedicoNovosExames({ pac, pacienteKey, onSubmit }) {
  const [tipo, setTipo] = useState('tc');
  const [dataExame, setDataExame] = useState('');
  const [conclusao, setConclusao] = useState('');
  const [textoExame, setTextoExame] = useState('');
  const [enviado, setEnviado] = useState(false);

  const enviar = useCallback(() => {
    if (!textoExame.trim() && !conclusao.trim()) return;

    const tipoInfo = TIPOS_EXAME.find(t => t.v === tipo) || TIPOS_EXAME[0];
    const isImagem = tipoInfo.grupo === 'imagem';

    // Texto completo passa pelos agentes via campo transitório _texto_laudos
    // Conclusão vai direto para evolução
    const payload = {
      _texto_laudos: textoExame.trim() || conclusao.trim(),
      _laudo_tipo: isImagem ? 'imagem' : (tipo === 'anatomia' ? 'anatomia_patologica' : 'laboratorio'),
      _exame_tipo_especifico: tipo,
      _exame_data: dataExame,
      // Vai para evolução (campo clínico, fonte médico)
      evolucao_resumo_exame: `${tipoInfo.l} (${dataExame || 'data não informada'}): ${conclusao.trim() || textoExame.trim().substring(0, 200)}`,
    };

    onSubmit?.({
      origem: 'medico',  // ← fonte 90 (auditor 6: médico é dono)
      rota: '/medico/novos-exames',
      payload,
      ator: 'medico',
    });
    setEnviado(true);
    setTextoExame('');
    setConclusao('');
  }, [tipo, dataExame, conclusao, textoExame, onSubmit]);

  return (
    <div style={{ background:BG, minHeight:'100vh', padding:'20px 16px' }}>
      <div style={{ maxWidth:780, margin:'0 auto' }}>
        <div style={{ marginBottom:14 }}>
          <p style={{ margin:0, fontSize:11, color:T, fontWeight:700, letterSpacing:1 }}>APACApp · v1.1.10</p>
          <h1 style={{ margin:'4px 0 0', fontSize:24, fontWeight:900, color:N }}>🔬 Novos Exames (Acompanhamento)</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>
            Inclua exames de imagem ou laboratoriais recentes. O agente patologia-local extrairá
            TNM/biomarcadores se aplicável, e a conclusão entrará automaticamente na próxima evolução.
          </p>
          {pac?.nome && (
            <p style={{ margin:'8px 0 0', fontSize:13, fontWeight:700, color:N, background:'#fff', padding:'8px 12px', borderRadius:8, border:'1px solid #E2E8F0' }}>
              👤 {pac.nome}
              {pac.diag ? ` · ${pac.diag}` : ''}
              {pac.trat ? ` · ${pac.trat}` : ''}
            </p>
          )}
        </div>

        <div style={card}>
          <h3 style={titulo}>Tipo de exame</h3>

          {/* Grupo imagem */}
          <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:0.5 }}>
            IMAGEM
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
            {TIPOS_EXAME.filter(t => t.grupo === 'imagem').map(op => (
              <button key={op.v} onClick={() => setTipo(op.v)} style={{
                padding:'8px 12px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer',
                border:'2px solid', borderColor: tipo === op.v ? N : '#CBD5E1',
                background: tipo === op.v ? N : '#fff', color: tipo === op.v ? '#fff' : N,
              }}>{op.l}</button>
            ))}
          </div>

          {/* Grupo lab */}
          <p style={{ margin:'8px 0 4px', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:0.5 }}>
            LABORATÓRIO / PATOLOGIA
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
            {TIPOS_EXAME.filter(t => t.grupo === 'laboratorio').map(op => (
              <button key={op.v} onClick={() => setTipo(op.v)} style={{
                padding:'8px 12px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer',
                border:'2px solid', borderColor: tipo === op.v ? N : '#CBD5E1',
                background: tipo === op.v ? N : '#fff', color: tipo === op.v ? '#fff' : N,
              }}>{op.l}</button>
            ))}
          </div>

          <div style={{ marginTop:14 }}>
            <label style={lab}>Data do exame</label>
            <input
              type="text"
              value={dataExame}
              onChange={e => setDataExame(e.target.value)}
              placeholder="dd/mm/aaaa"
              style={inp}
            />
          </div>

          <div style={{ marginTop:12 }}>
            <label style={lab}>Conclusão / Impressão (resumo curto)</label>
            <input
              type="text"
              value={conclusao}
              onChange={e => setConclusao(e.target.value)}
              placeholder="Ex: doença estável; resposta parcial; progressão hepática..."
              style={inp}
            />
            <p style={{ margin:'4px 0 0', fontSize:11, color:'#6B7280' }}>
              Este texto entra automaticamente na próxima evolução médica.
            </p>
          </div>

          <div style={{ marginTop:14 }}>
            <label style={lab}>Texto completo do laudo (opcional)</label>
            <textarea
              value={textoExame}
              onChange={e => setTextoExame(e.target.value)}
              placeholder="Cole o texto completo. O agente extrairá automaticamente: TNM, lesões mensuráveis, biomarcadores, valores anormais..."
              style={{ ...inp, minHeight:160, fontFamily:'inherit', resize:'vertical' }}
            />
          </div>

          <button
            onClick={enviar}
            disabled={!conclusao.trim() && !textoExame.trim()}
            style={{
              ...btnPri, width:'100%', marginTop:14,
              opacity: (!conclusao.trim() && !textoExame.trim()) ? 0.5 : 1,
              cursor: (!conclusao.trim() && !textoExame.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            ⚕️ Incluir exame e atualizar evolução
          </button>

          {enviado && (
            <div style={{ marginTop:12, padding:10, background:'#D1FAE5', border:`1px solid ${VE}`, borderRadius:8, fontSize:13, color:'#065F46', fontWeight:600 }}>
              ✓ Exame incluído. Resumo adicionado à evolução. Agentes locais processarão o conteúdo em segundo plano.
            </div>
          )}
        </div>

        <div style={{ ...card, background:'#F0F9FF', borderColor:'#BAE6FD' }}>
          <p style={{ margin:0, fontSize:12, color:'#075985' }}>
            ℹ️ <strong>Fonte:</strong> exames incluídos por aqui têm fonte médico (prioridade 90).
            Sobrescrevem dados anteriores de agente/IA, mas não campos confirmados por outros médicos.
          </p>
        </div>
      </div>
    </div>
  );
}
