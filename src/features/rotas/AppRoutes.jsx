// === src/features/rotas/AppRoutes.jsx ===
// APACApp v1.1.11 — Roteador com Orquestrador + PacienteDrawer
//
// ROTA 1: /medico/orquestrador — preview editável → enviar a todos os agentes
// ROTA 2: clique no nome do paciente → PacienteDrawer (resumo IA + dados + agentes)

import { useState, useEffect, useCallback, useRef } from 'react';
import { chavePaciente } from '../oncoProUtils.js';
import { useEntradasStore } from './useEntradasStore.js';
import { useAutomacaoEntradas } from './useAutomacaoEntradas.js';
import { useAgentesResultadoStore } from '../agentes/useAgentesResultadoStore.js';
import { PacienteDrawer, BotaoNomePaciente, usePacienteResumo } from './PacienteDrawer.jsx';
import OrquestradorPreview from './OrquestradorPreview.jsx';

import PacientePrimeiraConsulta from './PacientePrimeiraConsulta.jsx';
import RecepcaoCadastro from './RecepcaoCadastro.jsx';
import RecepcaoUploadLaudos from './RecepcaoUploadLaudos.jsx';
import RecepcaoPendencias from './RecepcaoPendencias.jsx';
import EnfermagemTriagem from './EnfermagemTriagem.jsx';
import EnfermagemPendencias from './EnfermagemPendencias.jsx';
import MedicoCentralValidacao from './MedicoCentralValidacao.jsx';
import MedicoNovosExames from './MedicoNovosExames.jsx';
import MedicoPrescricao from './MedicoPrescricao.jsx';
import PacienteEnviaExames from './PacienteEnviaExames.jsx';
import OncologiaIntegradaPro from '../OncologiaIntegradaPro.jsx';

const N  = '#1B365D'; const T  = '#2B7A8C'; const G  = '#B8860B';
const BG = '#EEF2F7';

const ROTA_DEFAULT = '/medico/orquestrador';

const ROTAS = [
  { path:'/medico/orquestrador', label:'Orquestrador', icone:'🧠', setor:'medico' },
  { path:'/medico/upload',       label:'Upload',       icone:'📤', setor:'medico' },
  { path:'/medico/prescricao',   label:'Prescrição',   icone:'💊', setor:'medico' },
  { path:'/medico/novos-exames', label:'Exames',       icone:'🔬', setor:'medico' },
];

const SETORES = {
  medico:     { cor: '#1B365D', label: 'Médico'     },
  paciente:   { cor: '#065F46', label: 'Paciente'   },
  recepcao:   { cor: '#7C2D12', label: 'Recepção'   },
  enfermagem: { cor: '#1E40AF', label: 'Enfermagem' },
};

function lerRotaAtual() {
  if (typeof window === 'undefined') return ROTA_DEFAULT;
  const h = window.location.hash.replace(/^#/, '');
  if (h && h.startsWith('/')) return h;
  return ROTA_DEFAULT;
}

/**
 * Chave de paciente estável entre renders (v1.1.8 — auditor 7).
 */
function usePacienteKeyEstavel(pac) {
  const tempKeyRef = useRef(null);
  const chaveReal = chavePaciente(pac);
  if (chaveReal) {
    tempKeyRef.current = null;
    return chaveReal;
  }
  if (!tempKeyRef.current) {
    const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    tempKeyRef.current = `tmp:${id}`;
  }
  return tempKeyRef.current;
}

export default function AppRoutes({ pac, up, chamarClaude, onVoltar }) {
  const [rotaAtual, setRotaAtual]   = useState(() => lerRotaAtual());
  const [drawerAberto, setDrawerAberto] = useState(false);
  const entradasStore          = useEntradasStore();
  const resultadosAgentesStore = useAgentesResultadoStore();
  const pacienteKey            = usePacienteKeyEstavel(pac);

  // Rota 2: hook de resumo automático via IA
  const { resumo, gerando, gerarAgora } = usePacienteResumo({
    pac, chamarClaude, entradasStore, pacienteKey,
  });

  // Automação em retroscena (v1.1.8)
  useAutomacaoEntradas({
    pac, up, entradasStore, resultadosAgentesStore, pacienteKey,
  });

  // Sincroniza com hash
  useEffect(() => {
    const handler = () => setRotaAtual(lerRotaAtual());
    if (typeof window !== 'undefined') window.addEventListener('hashchange', handler);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('hashchange', handler); };
  }, []);

  const navegar = useCallback((path) => {
    if (typeof window !== 'undefined') window.location.hash = path;
    setRotaAtual(path);
  }, []);

  useEffect(() => {
    if (!ROTAS.some(r => r.path === rotaAtual)) navegar(ROTA_DEFAULT);
  }, [rotaAtual, navegar]);

  const onSubmit = useCallback((args) => {
    return entradasStore.emitir({ ...args, pacienteKey });
  }, [entradasStore, pacienteKey]);

  const totalPendentes = entradasStore.entradasPendentes(pacienteKey).length;
  const rotaInfo = ROTAS.find(r => r.path === rotaAtual);
  const setorAtual = rotaInfo?.setor || 'medico';
  const corSetor = SETORES[setorAtual]?.cor || N;

  return (
    <div style={{ minHeight:'100vh', background:BG }}>
      {/* Aviso técnico discreto */}
      <div style={{
        background:'#F8FAFC', color:'#64748B',
        padding:'6px 16px', fontSize:11, fontWeight:700,
        textAlign:'center', borderBottom:'1px solid #E2E8F0',
      }}>
        Módulo v1.1 simplificado: orquestrador único, agentes em retroscena e validação médica antes de salvar.
      </div>

      {/* Barra de navegação */}
      <nav style={{
        background: corSetor, color:'#fff', padding:'10px 16px',
        position:'sticky', top:0, zIndex:100,
        boxShadow:'0 2px 8px rgba(0,0,0,.18)',
      }}>
        <div style={{ maxWidth:1300, margin:'0 auto', display:'flex',
          alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>

          {/* Logo + paciente */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {onVoltar && (
              <button onClick={onVoltar} style={{
                background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.3)',
                borderRadius:8, padding:'5px 11px', fontSize:12, fontWeight:700, cursor:'pointer',
              }}>← App</button>
            )}
            <span style={{ fontSize:13, fontWeight:900, color:G, letterSpacing:.8 }}>APACApp v1.1.11</span>
            {/* Rota 2: nome clicável → abre drawer com tudo */}
            {pac?.nome
              ? <BotaoNomePaciente
                  nome={pac.nome}
                  gerando={gerando}
                  onClick={() => setDrawerAberto(true)}
                />
              : <span style={{ fontSize:12, color:'rgba(255,255,255,.5)' }}>sem paciente</span>
            }
          </div>

          {/* Botões essenciais */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {ROTAS.map(r => {
              const ativa = rotaAtual === r.path;
              return (
                <button key={r.path} onClick={() => navegar(r.path)} style={{
                  background: ativa ? G : 'rgba(255,255,255,.12)',
                  color: '#fff', border: ativa ? 'none' : '1px solid rgba(255,255,255,.25)',
                  borderRadius:7, padding:'7px 12px', fontSize:12, fontWeight:800,
                  cursor:'pointer', whiteSpace:'nowrap',
                }}>
                  {r.icone} {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Badge de pendentes: sem abrir painel paralelo */}
        {totalPendentes > 0 && (
          <div style={{ maxWidth:1300, margin:'6px auto 0', textAlign:'right' }}>
            <span style={{ background:'rgba(255,255,255,.14)', color:'#fff', borderRadius:7,
              padding:'4px 12px', fontSize:11, fontWeight:800 }}>
              {totalPendentes} entrada(s) serão distribuídas pelo orquestrador
            </span>
          </div>
        )}
      </nav>

      {/* Rota 2: Drawer do paciente (flutua sobre qualquer rota) */}
      <PacienteDrawer
        aberto={drawerAberto}
        fechar={() => setDrawerAberto(false)}
        pac={pac}
        resumo={resumo}
        gerando={gerando}
        gerarAgora={gerarAgora}
        entradasStore={entradasStore}
        pacienteKey={pacienteKey}
        resultadosAgentesStore={resultadosAgentesStore}
        navegar={navegar}
      />

      {/* Conteúdo das rotas */}
      <main>
        {/* Rota 1: Orquestrador com preview editável */}
        {rotaAtual === '/medico/orquestrador' && (
          <OrquestradorPreview
            pac={pac} up={up} chamarClaude={chamarClaude}
            pacienteKey={pacienteKey}
            entradasStore={entradasStore}
            resultadosAgentesStore={resultadosAgentesStore}
          />
        )}
        {rotaAtual === '/medico/upload' && (
          <div style={{ maxWidth:980, margin:'18px auto', padding:'0 16px' }}>
            <div style={{
              background:'#fff', border:'1px solid #E2E8F0', borderRadius:12,
              padding:16, marginBottom:12, boxShadow:'0 2px 10px rgba(15,23,42,.05)',
            }}>
              <div style={{ fontSize:12, fontWeight:900, color:N, textTransform:'uppercase', letterSpacing:.6 }}>
                Upload do módulo
              </div>
              <h2 style={{ margin:'4px 0', color:'#0F172A', fontSize:22, fontWeight:950 }}>
                Entrada de laudos no mesmo padrão do dossiê
              </h2>
              <p style={{ margin:'4px 0 0', color:'#64748B', fontSize:13 }}>
                Tudo que entrar aqui vai para o orquestrador com a mesma linguagem da secretaria e do Drive.
              </p>
            </div>
            <RecepcaoUploadLaudos pac={pac} pacienteKey={pacienteKey} onSubmit={onSubmit} />
          </div>
        )}
        {rotaAtual === '/paciente/primeira-consulta' && (
          <PacientePrimeiraConsulta pacienteKey={pacienteKey} onSubmit={onSubmit} />
        )}
        {rotaAtual === '/paciente/envia-exames' && (
          <PacienteEnviaExames pac={pac} pacienteKey={pacienteKey} onSubmit={onSubmit} />
        )}
        {rotaAtual === '/recepcao/cadastro' && (
          <RecepcaoCadastro pac={pac} pacienteKey={pacienteKey} onSubmit={onSubmit} />
        )}
        {rotaAtual === '/recepcao/upload-laudos' && (
          <RecepcaoUploadLaudos pac={pac} pacienteKey={pacienteKey} onSubmit={onSubmit} />
        )}
        {rotaAtual === '/recepcao/pendencias' && (
          <RecepcaoPendencias pac={pac} pacienteKey={pacienteKey} onSubmit={onSubmit} />
        )}
        {rotaAtual === '/enfermagem/triagem' && (
          <EnfermagemTriagem pac={pac} pacienteKey={pacienteKey} onSubmit={onSubmit} />
        )}
        {rotaAtual === '/enfermagem/pendencias' && (
          <EnfermagemPendencias pac={pac} pacienteKey={pacienteKey} onSubmit={onSubmit} />
        )}
        {rotaAtual === '/medico/central-validacao' && (
          <MedicoCentralValidacao
            pac={pac} up={up} chamarClaude={chamarClaude}
            pacienteKey={pacienteKey}
            entradasStore={entradasStore}
            resultadosAgentesStore={resultadosAgentesStore}
          />
        )}
        {rotaAtual === '/medico/prescricao' && (
          <MedicoPrescricao pac={pac} up={up} pacienteKey={pacienteKey} />
        )}
        {rotaAtual === '/medico/novos-exames' && (
          <MedicoNovosExames pac={pac} pacienteKey={pacienteKey} onSubmit={onSubmit} />
        )}
        {rotaAtual === '/medico/oncologia' && (
          <OncologiaIntegradaPro pac={pac} up={up} chamarClaude={chamarClaude} />
        )}
      </main>
    </div>
  );
}
