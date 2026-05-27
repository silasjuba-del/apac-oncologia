// ─────────────────────────────────────────────────────────────────────────────
// PrescricaoQTDevPage.jsx
// Página de desenvolvimento/teste para o módulo PrescricaoQTv2.
//
// NÃO é rota de produção.
// NÃO integrar ao fluxo clínico do APACApp.
// Serve para validação local, demonstração e auditoria do módulo isolado.
//
// BUG-08 (mitigação): imports estáticos sempre entram no bundle se este arquivo
// for importado por qualquer coisa. Proteção real: não importar em App.jsx.
// A guarda import.meta.env.PROD abaixo é runtime — falha se chegou em produção.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
// Imports estáticos devem ficar no topo (ES module hoisting)
import catalogoV03 from '../../../data/protocolos_qt_catalogo_v0.3_curado_preliminar.json';
import PrescricaoQTv2 from './PrescricaoQTv2';
import { STATUS_BLOQUEADO } from './lib/protocoloCatalogo';

// BUG-08 fix: guarda runtime — este módulo nunca deve executar em produção
if (import.meta.env.PROD) {
  // eslint-disable-next-line no-console
  console.error('[PrescricaoQTDevPage] Carregado em PRODUÇÃO — remover import antes do deploy!');
  // Não throw aqui para não quebrar o bundle silenciosamente, mas logar para audit
}

// Médico fictício para testes — CRM real deve ser digitado no modal
const MEDICO_DEV = {
  nome: 'Dr. Revisor Dev',
  crm: '',  // BUG-09: intencionalmente vazio — modal de confirmação exige CRM real
};

const totalProtocolos  = catalogoV03?.protocolos?.length || 0;
// BUG-10 fix: usar STATUS_BLOQUEADO importado, não array literal inline
const prescritiveis    = (catalogoV03?.protocolos || [])
  .filter(p => !STATUS_BLOQUEADO.includes(p.status));
const bloqueados       = totalProtocolos - prescritiveis.length;

export default function PrescricaoQTDevPage() {
  // BUG-09 fix: confirmação explícita do usuário antes de abrir o módulo
  // (não delegar segurança 100% ao modal filho de CRM)
  const [confirmado, setConfirmado] = useState(false);

  if (import.meta.env.PROD) {
    return (
      <div style={{ background: '#FEF2F2', border: '2px solid #DC2626', borderRadius: 12, padding: 24, margin: 16, textAlign: 'center', color: '#991B1B' }}>
        <strong>⛔ PrescricaoQTDevPage carregada em PRODUÇÃO</strong><br />
        Remover este componente das rotas de produção imediatamente.
      </div>
    );
  }

  if (!confirmado) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#F1F5F9', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div style={{ background: '#FEF3C7', border: '2px solid #D97706', borderRadius: 14, padding: 24, maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#92400E', marginBottom: 8 }}>
            Ambiente de Desenvolvimento
          </div>
          <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6, marginBottom: 16 }}>
            Este módulo usa o <strong>catálogo v0.3-curado</strong> com{' '}
            <strong>{totalProtocolos} protocolos</strong> (nenhum aprovado formalmente).
            <br /><br />
            <strong>Nenhuma prescrição gerada aqui tem validade clínica.</strong>
            <br />
            Todos os protocolos com <code>prescricaoPermitida: false</code>.
            <br /><br />
            Para prosseguir, o CRM do médico responsável deverá ser digitado no modal de confirmação.
          </div>
          <button
            onClick={() => setConfirmado(true)}
            style={{
              background: '#D97706', color: '#fff', border: 'none', borderRadius: 9,
              padding: '10px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Entendi — entrar no modo de desenvolvimento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', background: '#F1F5F9', padding: 16 }}>
      {/* BUG-11 fix: banner sticky para permanecer visível durante scroll */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 9999,
        background: '#FEF3C7', border: '2px dashed #D97706', borderRadius: 10,
        padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400E',
        display: 'flex', gap: 10, alignItems: 'flex-start',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <span style={{ fontSize: 18 }}>⚙️</span>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 2 }}>DESENVOLVIMENTO — módulo isolado sem integração ao APACApp</div>
          <div>
            Catálogo <strong>v0.3-curado</strong>: {totalProtocolos} protocolos ·{' '}
            <strong style={{ color: '#15803D' }}>{prescritiveis.length} selecionáveis</strong> ·{' '}
            <strong style={{ color: '#B91C1C' }}>{bloqueados} bloqueados</strong>
          </div>
          <div style={{ marginTop: 2 }}>
            Nenhum aprovado formalmente · Conduta final é sempre do médico responsável.
          </div>
        </div>
      </div>

      {/* ── Módulo ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <PrescricaoQTv2
          catalogoJson={catalogoV03}
          medico={MEDICO_DEV}
        />
      </div>

      {/* ── Rodapé dev ── */}
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 10, color: '#94A3B8' }}>
        PrescricaoQTv2 · módulo standalone · catálogo curado v0.3 · sem integração ao prontuário
      </div>
    </div>
  );
}
