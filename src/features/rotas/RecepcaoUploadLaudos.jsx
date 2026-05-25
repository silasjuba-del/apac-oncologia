// === src/features/rotas/RecepcaoUploadLaudos.jsx ===
// APACApp v1.2.1 — Upload simplificado: Texto/Arquivo + Drive Command

import { useState, useRef } from 'react';

const N = '#1B365D';
const T = '#2B7A8C';
const G = '#B8860B';
const VE = '#15803D';
const DRIVE_PASTA_URL = 'https://drive.google.com/drive/folders/1s10nG9xXO_UrnIdrU8gYC6PYz4uvN9EH';

export default function RecepcaoUploadLaudos({ pac, pacienteKey, onSubmit }) {
  const [aba, setAba] = useState('upload');
  const [texto, setTexto] = useState('');
  const [arquivos, setArquivos] = useState([]);
  const [enviado, setEnviado] = useState(false);
  const [nomeDrive, setNomeDrive] = useState(pac?.nome || '');
  const [prontuarioDrive, setProntuarioDrive] = useState(pac?.prontuario || pac?.pacID || '');
  const [copiado, setCopiado] = useState(false);
  const refArq = useRef(null);

  const comandoDrive = `DRIVE - ${nomeDrive.trim() || 'NOME DO PACIENTE'} - ${prontuarioDrive.trim() || 'PRONTUARIO'}`;

  const handleArquivos = (e) => {
    const fs = Array.from(e.target.files || []);
    setArquivos(x => [...x, ...fs.map(f => ({ nome: f.name, obj: f }))]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fs = Array.from(e.dataTransfer.files || []);
    setArquivos(x => [...x, ...fs.map(f => ({ nome: f.name, obj: f }))]);
  };

  const enviar = () => {
    const temConteudo = texto.trim().length >= 5 || arquivos.length > 0;
    if (!temConteudo) { alert('Adicione texto ou arquivo.'); return; }
    onSubmit?.({
      tipo: 'upload_laudos',
      conteudo: texto.trim(),
      arquivos: arquivos.map(a => a.nome),
      nome: `Upload — ${pac?.nome || 'paciente'}`,
    });
    setTexto('');
    setArquivos([]);
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
  };

  const copiar = () => {
    navigator.clipboard.writeText(comandoDrive).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const s = {
    tab: (a) => ({
      border: 'none', cursor: 'pointer', padding: '9px 18px',
      fontSize: 12, fontWeight: 800,
      background: aba === a ? G : N,
      color: aba === a ? '#fff' : 'rgba(255,255,255,.55)',
      flexShrink: 0,
    }),
    card: { background: '#fff', borderRadius: 14, border: '1px solid #DDE3EC', padding: '18px 20px' },
    inp: { width: '100%', boxSizing: 'border-box', border: '1.5px solid #CBD5E1', borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none' },
    btn: (cor) => ({ border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 900, fontSize: 13, cursor: 'pointer', background: cor, color: '#fff', fontFamily: 'inherit', width: '100%' }),
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Tab bar */}
      <div style={{ background: N, display: 'flex', borderRadius: 12, overflow: 'hidden', border: `2px solid ${G}55` }}>
        <button style={s.tab('upload')} onClick={() => setAba('upload')}>📎 Upload / Texto</button>
        <button style={s.tab('drive')} onClick={() => setAba('drive')}>☁️ Drive</button>
      </div>

      {/* ── ABA: UPLOAD / TEXTO ── */}
      {aba === 'upload' && (
        <div style={s.card}>
          <div style={{ fontSize: 12, fontWeight: 900, color: N, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 10 }}>
            Texto do laudo / resultado
          </div>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Cole o texto integral do laudo (AP, imagem, molecular, resultado clínico)..."
            style={{ ...s.inp, minHeight: 160, fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', marginBottom: 10 }}
          />

          <input ref={refArq} type="file" accept=".pdf,.doc,.docx,image/*" multiple style={{ display: 'none' }} onChange={handleArquivos} />

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T; }}
            onDragLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
            onDrop={e => { e.currentTarget.style.borderColor = '#CBD5E1'; handleDrop(e); }}
            onClick={() => refArq.current?.click()}
            style={{ border: '2px dashed #CBD5E1', borderRadius: 10, padding: '16px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', marginBottom: 8 }}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>Clique ou arraste arquivos (PDF, imagem)</div>
          </div>

          {/* File list */}
          {arquivos.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {arquivos.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: 8, padding: '5px 9px', marginBottom: 3, background: '#F8FAFC' }}>
                  <span style={{ fontSize: 13 }}>📄</span>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: N, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 13 }} onClick={() => setArquivos(x => x.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={enviar}
            disabled={texto.trim().length < 5 && arquivos.length === 0}
            style={{ ...s.btn(enviado ? VE : G), opacity: (texto.trim().length < 5 && arquivos.length === 0) ? .5 : 1 }}
          >
            {enviado ? '✅ Enviado ao médico!' : '📤 Gerar e enviar ao médico'}
          </button>
        </div>
      )}

      {/* ── ABA: DRIVE ── */}
      {aba === 'drive' && (
        <div style={s.card}>
          <div style={{ fontSize: 12, fontWeight: 900, color: N, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4 }}>☁️ Drive Command</div>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>
            Pasta fixa do Drive memorizada. Informe o nome → gera o comando para o Assistente IA.
          </p>

          {/* Folder link */}
          <div style={{ background: '#F5F7FA', border: '1px solid #DDE3EC', borderRadius: 9, padding: '9px 12px', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Pasta fixa</div>
            <a href={DRIVE_PASTA_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#2756A0', fontWeight: 700, wordBreak: 'break-all' }}>
              {DRIVE_PASTA_URL}
            </a>
          </div>

          {/* Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 900, color: N }}>
              Nome do Paciente
              <input value={nomeDrive} onChange={e => setNomeDrive(e.target.value)} placeholder="Ex.: MARIA SILVA" style={{ ...s.inp, marginTop: 4, display: 'block' }} />
            </label>
            <label style={{ fontSize: 11, fontWeight: 900, color: N }}>
              Prontuário
              <input value={prontuarioDrive} onChange={e => setProntuarioDrive(e.target.value)} placeholder="Ex.: OI-2026-0001" style={{ ...s.inp, marginTop: 4, display: 'block' }} />
            </label>
          </div>

          {/* Command */}
          <div style={{ background: '#0D1F3C', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <code style={{ color: G, fontFamily: 'monospace', fontSize: 13, fontWeight: 900, flex: 1, wordBreak: 'break-all' }}>{comandoDrive}</code>
            <button onClick={copiar} style={{ background: copiado ? VE : G, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {copiado ? '✓ Copiado!' : '📋 Copiar'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>Cole este comando no <b>Assistente IA</b> → ele localiza o arquivo e estrutura o prontuário.</p>
        </div>
      )}
    </div>
  );
}
