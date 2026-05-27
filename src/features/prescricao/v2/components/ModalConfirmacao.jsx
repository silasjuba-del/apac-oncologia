// ─────────────────────────────────────────────────────────────────────────────
// ModalConfirmacao.jsx
// Confirmação EXPLÍCITA e DUPLA do médico antes de gerar prescrição.
//
// AUDITORIA OBRIGATÓRIA — pontos cardinais:
//   1. Botão "Confirmar" só habilita após checklist completo
//   2. Justificativa obrigatória se houver alerta GRAVE
//   3. CRM do médico deve ser digitado (não auto-preenchido)
//   4. Texto de confirmação é fixo e não editável pelo usuário
//   5. Confirmação gera trilha imutável no objeto prescricao
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import { NIVEL } from '../lib/validacoesSeguranca';

const N  = '#1B365D';
const VM = '#B91C1C';
const VE = '#15803D';
const AM = '#B45309';

// Checklist fixo que o médico deve marcar antes de confirmar
const CHECKLIST_FIXO = [
  {
    id: 'id_paciente',
    texto: 'Confirmei a identidade do paciente (nome completo, prontuário e data de nascimento)',
  },
  {
    id: 'doses_verificadas',
    texto: 'Verifiquei doses, via e dias de administração contra o protocolo fonte (PDF)',
  },
  {
    id: 'exames_ok',
    texto: 'Revisei exames basais (hemograma, bioquímica, função renal/hepática) e estão adequados',
  },
  {
    id: 'draft_ciencia',
    texto: 'Estou ciente que este catálogo está em versão DRAFT — nenhum protocolo foi aprovado formalmente',
  },
  {
    id: 'responsabilidade',
    texto: 'Assumo responsabilidade médica pela prescrição e confirmo que a conduta é clinicamente adequada para este paciente',
  },
];

function validarCrmDigitado(valor) {
  const normalizado = String(valor || '').trim().toUpperCase().replace(/\s+/g, ' ');
  const numeros = normalizado.match(/\d+/)?.[0] || '';

  if (!numeros || /^0+$/.test(numeros)) return false;

  return (
    /^CRM[-/\s]?[A-Z]{2}[-/\s]?\d{3,6}$/.test(normalizado) ||
    /^CRM[-/\s]?\d{3,6}[-/\s]?[A-Z]{2}$/.test(normalizado) ||
    /^[A-Z]{2}[-/\s]?\d{3,6}$/.test(normalizado) ||
    /^\d{3,6}[-/\s]?[A-Z]{2}$/.test(normalizado)
  );
}

/**
 * Props:
 *   protocolo        — protocolo selecionado
 *   paciente         — dados do paciente
 *   alertas          — array de alertas de validarCompleto()
 *   exigeJustificativa — boolean (graves presentes)
 *   medico           — { nome, crm } (pré-preenchido mas CRM deve ser confirmado)
 *   onConfirmar      — callback({ justificativa, checklistMarcado, crm, timestamp })
 *   onCancelar       — callback()
 */
export default function ModalConfirmacao({
  protocolo,
  paciente,
  alertas = [],
  exigeJustificativa = false,
  medico = {},
  onConfirmar,
  onCancelar,
}) {
  const [checklist, setChecklist] = useState(
    Object.fromEntries(CHECKLIST_FIXO.map(c => [c.id, false]))
  );
  const [justificativa, setJustificativa] = useState('');
  const [crmDigitado, setCrmDigitado] = useState('');
  const [erroEnvio, setErroEnvio] = useState('');

  const todosMarcados = CHECKLIST_FIXO.every(c => checklist[c.id]);
  const justOK = !exigeJustificativa || justificativa.trim().length >= 20;
  const crmOK  = validarCrmDigitado(crmDigitado);

  const podeConfirmar = todosMarcados && justOK && crmOK;

  const handleConfirmar = useCallback(() => {
    if (!podeConfirmar) {
      setErroEnvio('Preencha todos os itens do checklist e o CRM antes de confirmar.');
      return;
    }
    setErroEnvio('');
    onConfirmar?.({
      justificativa: justificativa.trim(),
      checklistMarcado: { ...checklist },
      crm: crmDigitado.trim(),
      medicoNome: medico.nome || '',
      timestamp: new Date().toISOString(),
      catalogoVersao: protocolo.versaoCatalogo || 'v0.2',
      protocoloId: protocolo.id,
      protocoloStatus: protocolo.status,
    });
  }, [podeConfirmar, justificativa, checklist, crmDigitado, medico, protocolo, onConfirmar]);

  const alertasGraves   = alertas.filter(a => a.nivel === NIVEL.GRAVE);
  const alertasCriticos = alertas.filter(a => a.nivel === NIVEL.CRITICO);

  // Se tem crítico, não deve ter chegado aqui — bloquear mesmo assim
  if (alertasCriticos.length > 0) {
    return (
      <div style={estilos.overlay}>
        <div style={{ ...estilos.modal, border: '2px solid #DC2626' }}>
          <div style={estilos.header('#DC2626')}>
            <span style={{ fontSize: 24 }}>⛔</span>
            <div>
              <div style={estilos.titulo}>Prescrição bloqueada</div>
              <div style={estilos.subtitulo}>Resolva os bloqueantes antes de prosseguir</div>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            {alertasCriticos.map((a, i) => (
              <div key={i} style={{ color: VM, fontSize: 12, marginBottom: 6, padding: '6px 10px', background: '#FEF2F2', borderRadius: 7 }}>
                ⛔ {a.mensagem}
              </div>
            ))}
            <button onClick={onCancelar} style={estilos.btnCancelar}>
              Voltar e corrigir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={estilos.overlay}>
      <div style={estilos.modal}>
        {/* Header */}
        <div style={estilos.header(N)}>
          <span style={{ fontSize: 24 }}>🔐</span>
          <div>
            <div style={estilos.titulo}>Confirmação médica obrigatória</div>
            <div style={estilos.subtitulo}>
              {protocolo.nome} · {paciente.nome || 'Paciente não identificado'}
            </div>
          </div>
        </div>

        <div style={{ padding: 16, maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Alertas graves */}
          {alertasGraves.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {alertasGraves.map((a, i) => (
                <div
                  key={i}
                  style={{ background: '#FFF7ED', border: '1px solid #D97706', borderRadius: 8, padding: '7px 10px', marginBottom: 5 }}
                >
                  <div style={{ color: AM, fontSize: 11, fontWeight: 700 }}>⚠️ {a.mensagem}</div>
                </div>
              ))}
            </div>
          )}

          {/* Checklist */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: N, textTransform: 'uppercase', marginBottom: 8 }}>
              Checklist de segurança — marque cada item
            </div>
            {CHECKLIST_FIXO.map(item => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '8px 10px',
                  border: `1.5px solid ${checklist[item.id] ? VE : '#CBD5E1'}`,
                  borderRadius: 8,
                  marginBottom: 6,
                  cursor: 'pointer',
                  background: checklist[item.id] ? '#F0FDF4' : '#F8FAFC',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={checklist[item.id]}
                  onChange={e =>
                    setChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))
                  }
                  style={{ accentColor: VE, width: 16, height: 16, flexShrink: 0, marginTop: 1 }}
                />
                <span style={{ fontSize: 12, color: checklist[item.id] ? '#166534' : '#374151', lineHeight: 1.4 }}>
                  {item.texto}
                </span>
              </label>
            ))}
          </div>

          {/* Justificativa (obrigatória se graves) */}
          {exigeJustificativa && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: AM, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                ⚠️ Justificativa obrigatória (mín. 20 caracteres) *
              </label>
              <textarea
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
                rows={3}
                placeholder="Descreva a justificativa clínica para prosseguir com este protocolo apesar dos alertas..."
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: `1.5px solid ${justOK ? VE : AM}`,
                  padding: '8px 10px',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 10, color: justOK ? VE : AM, marginTop: 2 }}>
                {justificativa.length}/20 caracteres mínimos
              </div>
            </div>
          )}

          {/* CRM */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: N, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Digite seu CRM para confirmar *
            </label>
            <input
              type="text"
              value={crmDigitado}
              onChange={e => setCrmDigitado(e.target.value)}
              placeholder={`CRM do médico prescribente (ex: CRM-PB 17341)`}
              style={{
                width: '100%',
                borderRadius: 8,
                border: `1.5px solid ${crmOK ? VE : '#CBD5E1'}`,
                padding: '8px 10px',
                fontSize: 12,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            {medico.crm && (
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                CRM cadastrado: {medico.crm} — redigite para confirmar
              </div>
            )}
            {crmDigitado && !crmOK && (
              <div style={{ fontSize: 10, color: VM, marginTop: 2 }}>
                Formato inválido. Use CRM-PB 17341, PB 17341 ou 17341-PB.
              </div>
            )}
          </div>

          {/* Aviso do catálogo */}
          <div
            style={{
              background: '#FFF7ED',
              border: '1px solid #D97706',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 14,
              fontSize: 11,
              color: AM,
            }}
          >
            <strong>Catálogo v0.2 — DRAFT:</strong> Nenhum protocolo nesta versão foi aprovado formalmente.
            A conduta final é sempre do médico responsável.
          </div>

          {/* Erro de envio */}
          {erroEnvio && (
            <div style={{ color: VM, fontSize: 12, marginBottom: 8, fontWeight: 700 }}>
              ⛔ {erroEnvio}
            </div>
          )}

          {/* Botões */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCancelar} style={estilos.btnCancelar}>
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!podeConfirmar}
              style={{
                ...estilos.btnConfirmar,
                opacity: podeConfirmar ? 1 : 0.4,
                cursor: podeConfirmar ? 'pointer' : 'not-allowed',
              }}
            >
              ✅ Confirmar e gerar prescrição
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const estilos = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
  },
  modal: {
    background: '#fff',
    borderRadius: 14,
    width: '100%',
    maxWidth: 540,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  header: (cor) => ({
    background: `linear-gradient(135deg, ${cor}, ${cor}dd)`,
    padding: '14px 16px',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  }),
  titulo: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 900,
    margin: 0,
  },
  subtitulo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  btnCancelar: {
    flex: 1,
    padding: '10px 16px',
    background: '#F1F5F9',
    border: 'none',
    borderRadius: 9,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    color: '#374151',
    fontFamily: 'inherit',
  },
  btnConfirmar: {
    flex: 2,
    padding: '10px 16px',
    background: '#15803D',
    border: 'none',
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 900,
    color: '#fff',
    fontFamily: 'inherit',
    transition: 'opacity 0.2s',
  },
};
