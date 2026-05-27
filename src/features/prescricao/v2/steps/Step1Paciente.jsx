// ─────────────────────────────────────────────────────────────────────────────
// Step1Paciente.jsx
// Coleta e valida dados do paciente necessários para cálculo de dose QT.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import { calcBSASafe, calcCrClSafe } from '../lib/calculadoraDose';

const N  = '#1B365D';
const VE = '#15803D';
const VM = '#B91C1C';
const AM = '#B45309';

const CAMPOS = [
  { id: 'nome',       label: 'Nome completo',          tipo: 'text',   obrig: true,  ph: 'Nome do paciente' },
  { id: 'prontuario', label: 'Prontuário / ID',         tipo: 'text',   obrig: true,  ph: 'Número do prontuário' },
  { id: 'dataNasc',   label: 'Data de nascimento',      tipo: 'date',   obrig: true,  ph: '' },
  { id: 'sexo',       label: 'Sexo biológico',          tipo: 'select', obrig: true,  opts: [{ v: '', l: 'Selecionar...' }, { v: 'M', l: 'Masculino' }, { v: 'F', l: 'Feminino' }] },
  { id: 'pesoKg',     label: 'Peso atual (kg)',          tipo: 'number', obrig: true,  ph: 'ex: 70', min: 10, max: 250, step: 0.1 },
  { id: 'alturaCm',   label: 'Altura (cm)',              tipo: 'number', obrig: true,  ph: 'ex: 170', min: 50, max: 250 },
  { id: 'ecog',       label: 'ECOG / Performance Status',tipo: 'select', obrig: true,  opts: [
    { v: '', l: 'Selecionar...' },
    { v: '0', l: '0 — Assintomático, atividade normal' },
    { v: '1', l: '1 — Sintomático, deambula, trabalho leve' },
    { v: '2', l: '2 — Deambula >50% do dia, autocuidado preservado' },
    { v: '3', l: '3 — Restrito ao leito >50% do dia' },
    { v: '4', l: '4 — Acamado, dependente total' },
  ]},
  { id: 'creatinina',   label: 'Creatinina sérica (mg/dL)',  tipo: 'number', obrig: false, ph: 'ex: 0.9', step: 0.01, min: 0.1, max: 20 },
  { id: 'histologia',   label: 'Histologia tumoral',         tipo: 'text',   obrig: false, ph: 'ex: Adenocarcinoma, Escamoso, CPCP' },
  { id: 'feve',         label: 'FEVE última (%) — se antraciclina',  tipo: 'number', obrig: false, ph: 'ex: 65', min: 10, max: 80 },
  { id: 'neuropatiaGrau',label: 'Neuropatia periférica (grau 0-4)', tipo: 'select', obrig: false, opts: [
    { v: '', l: 'Não avaliado' },
    { v: '0', l: 'Grau 0 — Ausente' },
    { v: '1', l: 'Grau 1 — Leve, sem limitação' },
    { v: '2', l: 'Grau 2 — Moderada, limita ADL instrumentais' },
    { v: '3', l: 'Grau 3 — Grave, limita autocuidado' },
    { v: '4', l: 'Grau 4 — Ameaça à vida' },
  ]},
];

/**
 * Props:
 *   dadosPaciente — estado pai
 *   onChange      — callback(novosDados)
 *   onProximo     — callback()
 */
export default function Step1Paciente({ dadosPaciente = {}, onChange, onProximo }) {
  const [dados, setDados] = useState(dadosPaciente);
  const [tocados, setTocados] = useState({});

  const set = useCallback((campo, valor) => {
    const novos = { ...dados, [campo]: valor };

    // Calcular idade a partir de dataNasc
    if (campo === 'dataNasc' && valor) {
      const nasc = new Date(valor);
      const hoje = new Date();
      const idade = hoje.getFullYear() - nasc.getFullYear() -
        (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0);
      novos.idade = idade > 0 ? idade : null;
    }

    setDados(novos);
    onChange?.(novos);
  }, [dados, onChange]);

  const marcarTocado = (campo) => setTocados(p => ({ ...p, [campo]: true }));

  // Calcular BSA em tempo real
  const bsaRes = dados.pesoKg && dados.alturaCm
    ? calcBSASafe(Number(dados.pesoKg), Number(dados.alturaCm))
    : { bsa: null, erro: null };

  // Calcular ClCr em tempo real
  const crclRes =
    dados.creatinina && dados.idade && dados.sexo
      ? calcCrClSafe(dados.idade, Number(dados.pesoKg), Number(dados.alturaCm), Number(dados.creatinina), dados.sexo)
      : { crcl: null, erro: null };

  // Validar obrigatórios
  const camposObrigFaltando = CAMPOS.filter(
    c => c.obrig && (!dados[c.id] || dados[c.id] === '')
  );
  const podeProximo = camposObrigFaltando.length === 0 && !bsaRes.erro && !crclRes.erro;

  const aviso_ecog_alto = dados.ecog && Number(dados.ecog) >= 3;

  return (
    <div>
      <div style={estilos.sectionHeader}>
        <span style={{ fontSize: 20 }}>👤</span>
        <div>
          <div style={estilos.sectionTitulo}>Paciente e Dados Clínicos Basais</div>
          <div style={estilos.sectionSub}>Todos os campos marcados com * são obrigatórios para cálculo de dose</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px 12px', marginBottom: 14 }}>
        {CAMPOS.map(campo => (
          <div key={campo.id} style={{ gridColumn: campo.id === 'nome' ? 'span 2' : 'span 1' }}>
            <label style={estilos.label}>
              {campo.label} {campo.obrig && <span style={{ color: VM }}>*</span>}
            </label>

            {campo.tipo === 'select' ? (
              <select
                value={dados[campo.id] || ''}
                onChange={e => set(campo.id, e.target.value)}
                onBlur={() => marcarTocado(campo.id)}
                style={{
                  ...estilos.input,
                  border: `1.5px solid ${tocados[campo.id] && campo.obrig && !dados[campo.id] ? VM : '#CBD5E1'}`,
                }}
              >
                {campo.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            ) : (
              <input
                type={campo.tipo}
                value={dados[campo.id] || ''}
                placeholder={campo.ph}
                min={campo.min}
                max={campo.max}
                step={campo.step}
                onChange={e => set(campo.id, campo.tipo === 'number' ? Number(e.target.value) || '' : e.target.value)}
                onBlur={() => marcarTocado(campo.id)}
                style={{
                  ...estilos.input,
                  border: `1.5px solid ${tocados[campo.id] && campo.obrig && !dados[campo.id] ? VM : '#CBD5E1'}`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Painel de cálculo em tempo real */}
      {(bsaRes.bsa || bsaRes.erro || crclRes.crcl || crclRes.erro) && (
        <div style={estilos.painelCalculo}>
          <div style={{ fontWeight: 800, fontSize: 11, color: N, textTransform: 'uppercase', marginBottom: 8 }}>
            Parâmetros calculados
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={estilos.metrica(bsaRes.erro ? VM : VE)}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', opacity: 0.8 }}>BSA (Mosteller)</div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>
                {bsaRes.erro ? '⛔' : `${bsaRes.bsa} m²`}
              </div>
              {bsaRes.erro && <div style={{ fontSize: 9 }}>{bsaRes.erro}</div>}
            </div>

            {(crclRes.crcl || crclRes.erro) && (
              <div style={estilos.metrica(crclRes.erro ? VM : '#1D4ED8')}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', opacity: 0.8 }}>ClCr (C-G)</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{crclRes.erro ? '⛔' : `${crclRes.crcl} mL/min`}</div>
                {crclRes.erro && <div style={{ fontSize: 9 }}>{crclRes.erro}</div>}
              </div>
            )}

            {dados.idade && (
              <div style={estilos.metrica('#374151')}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', opacity: 0.8 }}>Idade</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{dados.idade} anos</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aviso ECOG alto */}
      {aviso_ecog_alto && (
        <div style={estilos.aviso(AM)}>
          ⚠️ ECOG {dados.ecog}: maioria dos protocolos citotóxicos não indicados para PS ≥ 3.
          Documentar decisão médica se prosseguir.
        </div>
      )}

      {/* Campos obrigatórios faltando */}
      {camposObrigFaltando.length > 0 && Object.keys(tocados).length > 0 && (
        <div style={estilos.aviso(VM)}>
          Campos obrigatórios pendentes: {camposObrigFaltando.map(c => c.label).join(', ')}
        </div>
      )}

      <button
        onClick={onProximo}
        disabled={!podeProximo}
        style={{
          ...estilos.btnProximo,
          opacity: podeProximo ? 1 : 0.4,
          cursor: podeProximo ? 'pointer' : 'not-allowed',
        }}
      >
        Próximo: Selecionar Protocolo →
      </button>
    </div>
  );
}

const estilos = {
  sectionHeader: {
    display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16,
    padding: '12px 14px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0',
  },
  sectionTitulo: { fontSize: 14, fontWeight: 900, color: N },
  sectionSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  label: { fontSize: 10, fontWeight: 700, color: N, textTransform: 'uppercase', display: 'block', marginBottom: 3 },
  input: {
    width: '100%', borderRadius: 8, padding: '8px 10px', fontSize: 12,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff',
  },
  painelCalculo: {
    background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10,
    padding: '10px 14px', marginBottom: 12,
  },
  metrica: (cor) => ({
    background: '#fff', border: `2px solid ${cor}44`, borderRadius: 9,
    padding: '8px 14px', color: cor, minWidth: 100,
  }),
  aviso: (cor) => ({
    background: cor === VM ? '#FEF2F2' : '#FFF7ED',
    border: `1px solid ${cor}`,
    borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: cor,
  }),
  btnProximo: {
    background: N, color: '#fff', border: 'none', borderRadius: 10,
    padding: '12px 24px', fontSize: 13, fontWeight: 900, fontFamily: 'inherit',
    width: '100%', marginTop: 8, transition: 'opacity 0.2s',
  },
};
