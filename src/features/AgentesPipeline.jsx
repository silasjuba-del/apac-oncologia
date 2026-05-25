// === src/features/AgentesPipeline.jsx ===
// APACApp — Central de Validação Médica v1.1.7
// Dr. Silas Negrão — Hospital do Bem, Patos/PB
//
// v1.1.6 — AUTOMAÇÃO DE ROTAS E ENTRADA DE DADOS
//   ✓ Aceita `entradasPendentes` (eventos vindos de outras rotas)
//   ✓ Hook useAgentesAutomaticos roda pipeline LOCAL automaticamente quando
//     novos dados chegam (debounce 600ms, anti-loop por fingerprint)
//   ✓ Pipeline IA só auto-executa se houver consentimento E laudo não estruturado
//   ✓ Pendências agrupadas por destinatário (recepção / enfermagem / médico)
//   ✓ Botão "Executar locais" permanece como reprocessamento manual
//
// v1.1.5 — Agentes orientados à economia de tempo médico
//   ✓ Aplicação automática de campos administrativos seguros
//   ✓ Sugestões clínicas com "Aceitar todas" em 1 clique
//   ✓ Conflito só para divergência REAL (não formatação)
//   ✓ Consentimento IA por sessão/paciente (uma vez só)
//
// FILOSOFIA: o app automatiza desde que o DADO NASCE, não só depois que o
// médico abre a aba. Recepção salva → pipeline roda. Laudo entra → pipeline roda.
//
// USO no App.jsx:
//   <AgentesPipeline
//     pac={pac} up={up} chamarClaude={chamarClaude}
//     entradasPendentes={entradasPendentes}     // ← v1.1.6
//     onEntradaProcessada={fn}                  // ← v1.1.6
//   />

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  parseNumeroBR, normalizarAlturaCm, normalizarPesoKg, normalizarCreatinina,
  normalizarSexo, calcularIdade, calcularBSA, calcularIMC, calcularClCr,
  fmtNum, chavePaciente,
  upAuditavel, upAuditavelSeguro, isCampoConfirmado, marcarCampoConfirmado,
  inferirCID, inferirSIGTAP, inferirProtocolo,
  validarCIDSIGTAP, validarCPF, validarCNS,
  validarAPACBase, calcularNivelAPAC, BLOQUEANTES_APAC,
  extrairTNM, extrairEstadio, extrairBiomarcadores, extrairGrau,
  extrairCreatinina, extrairPesoAltura,
  montarPromptExtracao, extrairJSONComSchema, montarPromptJustificativaAPAC,
  criticidadeCampo, valoresEquivalentes,
  // ✓ v1.1.6
  processarEntradaDado, agruparPendenciasPorSetor,
  PENDENCIA_RECEPCAO, PENDENCIA_ENFERMAGEM, PENDENCIA_MEDICO,
  TIPO_AGENTE_LOCAL, TIPO_AGENTE_IA,
} from './oncoProUtils.js';

// ═══ Paleta APACApp ═════════════════════════════════════════════════════════
const N  = '#1B365D'; const T  = '#2B7A8C'; const G  = '#B8860B';
const VE = '#15803D'; const VM = '#B91C1C'; const AM = '#B45309';
const AZ = '#1E40AF'; const ROXO = '#7C3AED';
const BG = '#EEF2F7';

// ═══ Estilos ═════════════════════════════════════════════════════════════════
const card = { background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,.07)', border:'1px solid #E2E8F0', padding:20, marginBottom:16 };
const titulo = { fontSize:18, fontWeight:900, color:N, textTransform:'uppercase', letterSpacing:.6, borderBottom:`3px solid ${G}`, paddingBottom:7, margin:'0 0 14px' };
const btnPri = { background:G, color:'#fff', fontWeight:900, borderRadius:10, padding:'10px 20px', border:'none', cursor:'pointer', fontSize:14 };
const btnSec = { background:'#fff', color:N, fontWeight:700, borderRadius:10, padding:'8px 16px', border:`2px solid ${N}`, cursor:'pointer', fontSize:13 };
const btnVE  = { background:VE, color:'#fff', fontWeight:900, borderRadius:10, padding:'10px 20px', border:'none', cursor:'pointer', fontSize:14 };
const btnVM  = { background:VM, color:'#fff', fontWeight:900, borderRadius:10, padding:'10px 20px', border:'none', cursor:'pointer', fontSize:14 };

// ═══ DEFINIÇÃO DOS 9 AGENTES ═════════════════════════════════════════════════
// (Mesma lógica da v1.1.4 — agentes recebem `acumulado` que já contém output
// dos agentes anteriores via acumulador local no executarPipeline)

// v1.1.8 (auditor 7): AGENTES é exportado para uso pelo agentRunner.js
// — runner roda em retroscena, independente da Central estar montada.
export const AGENTES = [
  // ─── LOCAIS ──────────────────────────────────────────────────────────────
  {
    id: 'antropometria',
    nome: 'Antropometria',
    icone: '📏',
    tipo: TIPO_AGENTE_LOCAL,
    condicaoPara: () => true,
    executar: async (acumulado) => {
      let peso = normalizarPesoKg(acumulado.peso);
      let altura = normalizarAlturaCm(acumulado.altura);
      if ((!peso || !altura) && (acumulado._texto_laudos || acumulado.docs_drive_resumo)) {
        const r = extrairPesoAltura(acumulado._texto_laudos || acumulado.docs_drive_resumo || '');
        if (r.peso && !peso) peso = r.peso;
        if (r.altura && !altura) altura = r.altura;
      }
      if (!peso || !altura) {
        return { sucesso:false, mensagem:`Falta ${[!peso&&'peso',!altura&&'altura'].filter(Boolean).join(' e ')}`, destinatario:'enfermagem' };
      }
      const bsa = calcularBSA(altura, peso);
      const imc = calcularIMC(peso, altura);
      return {
        sucesso:true,
        campos: { peso: String(peso), altura: String(altura), _bsa: bsa, _imc: imc },
        mensagem: `BSA ${fmtNum(bsa,2)} m² · IMC ${fmtNum(imc,1)}`,
        confianca: 'alta',
      };
    },
  },
  {
    id: 'funcao-renal',
    nome: 'Função Renal',
    icone: '🩺',
    tipo: TIPO_AGENTE_LOCAL,
    condicaoPara: () => true,
    executar: async (acumulado) => {
      let creatinina = normalizarCreatinina(acumulado.creatinina);
      if (!creatinina && acumulado._texto_laudos) {
        creatinina = extrairCreatinina(acumulado._texto_laudos);
      }
      const peso = normalizarPesoKg(acumulado.peso);
      const altura = normalizarAlturaCm(acumulado.altura);
      const sexo = normalizarSexo(acumulado.sexo);
      const idade = calcularIdade(acumulado.nasc);
      if (!creatinina) return { sucesso:false, mensagem:'Creatinina ausente', destinatario:'enfermagem' };
      if (!peso || !altura || !sexo || idade == null) {
        return { sucesso:false, mensagem:'Faltam dados para ClCr', destinatario:'enfermagem' };
      }
      const info = calcularClCr({ creatinina, peso, altura, idade, sexo });
      if (!info) return { sucesso:false, mensagem:'Cálculo ClCr falhou' };
      const alertas = [];
      if (info.obeso) alertas.push('IMC ≥ 30');
      if (info.caquetico) alertas.push('IMC < 18,5 — revisar manualmente');
      if (info.capAplicado) alertas.push('ClCr capado 125');
      return {
        sucesso:true,
        campos:{ creatinina: String(creatinina), _clcr: info.clcr, _clcr_info: info },
        mensagem:`ClCr ${fmtNum(info.clcr,0)} mL/min${alertas.length?` · ${alertas.join(' · ')}`:''}`,
        confianca: info.caquetico ? 'media' : 'alta',
      };
    },
  },
  {
    id: 'patologia-local',
    nome: 'Patologia',
    icone: '🔬',
    tipo: TIPO_AGENTE_LOCAL,
    condicaoPara: () => true,
    executar: async (acumulado) => {
      const texto = acumulado._texto_laudos || acumulado.docs_drive_resumo || acumulado.docs_ia_resumo || acumulado.diag || '';
      if (!texto.trim()) return { sucesso:false, mensagem:'Sem texto para analisar' };
      const campos = {};
      const tnm = extrairTNM(texto);
      const estadio = extrairEstadio(texto);
      const grau = extrairGrau(texto);
      const bio = extrairBiomarcadores(texto);
      if (tnm) campos.tnm = `T${tnm.t}N${tnm.n}M${tnm.m}`;
      if (estadio) campos.estadio = estadio;
      if (grau) campos.grau_hist = grau;
      Object.assign(campos, bio);
      if (Object.keys(campos).length === 0) return { sucesso:false, mensagem:'Nada extraído por regex local' };
      return {
        sucesso:true,
        campos,
        mensagem: `Encontrado: ${Object.keys(campos).join(', ')}`,
        confianca: tnm ? 'alta' : 'media',
      };
    },
  },
  {
    id: 'cid-local',
    nome: 'CID-10',
    icone: '🔢',
    tipo: TIPO_AGENTE_LOCAL,
    condicaoPara: (pac) => pac?.diag,
    executar: async (acumulado) => {
      if (acumulado.cid && /^C\d{2}/i.test(acumulado.cid)) {
        return { sucesso:true, campos:{}, mensagem:`CID já preenchido: ${acumulado.cid}`, confianca:'alta' };
      }
      const local = inferirCID(acumulado.diag);
      if (local) return {
        sucesso:true,
        campos:{ cid: local.cid, local_cancer: local.sitio },
        mensagem:`CID ${local.cid} (${local.sitio})`,
        confianca: local.confianca,
      };
      return { sucesso:false, mensagem:'CID não inferido da tabela local — tente IA' };
    },
  },
  {
    id: 'sigtap',
    nome: 'SIGTAP',
    icone: '📋',
    tipo: TIPO_AGENTE_LOCAL,
    condicaoPara: (pac) => pac?.cid && pac?.intencao,
    executar: async (acumulado) => {
      if (acumulado.cod_proc && /^\d{10}$/.test(acumulado.cod_proc)) {
        return { sucesso:true, campos:{}, mensagem:`SIGTAP já preenchido: ${acumulado.cod_proc}`, confianca:'alta' };
      }
      const sug = inferirSIGTAP(acumulado.cid, acumulado.intencao);
      if (!sug) return { sucesso:false, mensagem:`Sem SIGTAP local para ${acumulado.cid}+${acumulado.intencao}` };
      return {
        sucesso:true,
        campos:{ cod_proc: sug.codigo, _proc_nome: sug.nome },
        mensagem:`${sug.codigo} — ${sug.nome}`,
        confianca:'alta',
      };
    },
  },
  {
    id: 'protocolo',
    nome: 'Protocolo QT',
    icone: '💊',
    tipo: TIPO_AGENTE_LOCAL,
    condicaoPara: (pac) => pac?.cid && pac?.intencao,
    executar: async (acumulado) => {
      if (acumulado.trat) return { sucesso:true, campos:{}, mensagem:`Protocolo já definido: ${acumulado.trat}`, confianca:'alta' };
      const sug = inferirProtocolo({
        cid: acumulado.cid, estadio: acumulado.estadio, linha: acumulado.linha,
        intencao: acumulado.intencao, her2: acumulado.her2,
      });
      if (!sug) return { sucesso:false, mensagem:'Sem protocolo padrão — decisão médica' };
      return {
        sucesso:true,
        campos:{ trat: sug.nome, _protocolo_id: sug.id },
        mensagem:`${sug.nome} — ${sug.motivo}`,
        confianca:'media',
      };
    },
  },
  {
    id: 'anti-glosa',
    nome: 'Anti-glosa APAC',
    icone: '🛡️',
    tipo: TIPO_AGENTE_LOCAL,
    condicaoPara: () => true,
    executar: async (acumulado) => {
      const validacoes = validarAPACBase(acumulado);
      const nivel = calcularNivelAPAC(validacoes);
      const correcoes = {};
      const incompat = validacoes.find(v => v.campo === 'cid_sigtap' && v.tipo === 'incompativel' && !v.manual);
      if (incompat) {
        const sug = inferirSIGTAP(acumulado.cid, acumulado.intencao);
        if (sug) correcoes.cod_proc = sug.codigo;
      }
      const bloqueantes = validacoes.filter(v => v.critico && BLOQUEANTES_APAC.has(v.campo));
      const totalBloq = BLOQUEANTES_APAC.size;
      const score = Math.round(((totalBloq - bloqueantes.length) / totalBloq) * 100);
      return {
        sucesso:true,
        campos:{
          _apac_score: score, _apac_status: nivel,
          _apac_validacoes: validacoes, _apac_bloqueantes: bloqueantes,
          _apac_correcoes: correcoes,
        },
        mensagem:`${nivel} — ${score}/100`,
        confianca:'alta',
      };
    },
  },

  // ─── IA ──────────────────────────────────────────────────────────────────
  {
    id: 'patologia-ia',
    nome: 'Patologia IA',
    icone: '🤖',
    tipo: TIPO_AGENTE_IA,
    condicaoPara: () => true,
    executar: async (acumulado, { chamarClaude }) => {
      const texto = acumulado._texto_laudos || acumulado.docs_drive_resumo || acumulado.docs_ia_resumo || acumulado.diag || '';
      if (!texto.trim()) return { sucesso:false, mensagem:'Sem texto' };
      const schema = { tnm:'string|null', estadio:'string|null', grau:'string|null', re:'string|null', rp:'string|null', her2:'string|null', ki67:'string|null', pdl1:'string|null' };
      try {
        const prompt = montarPromptExtracao(texto, schema);
        const resposta = await chamarClaude(prompt, 500);
        const json = extrairJSONComSchema(resposta, Object.keys(schema));
        if (!json) return { sucesso:false, mensagem:'IA não retornou JSON válido' };
        const campos = {};
        if (json.tnm) campos.tnm = json.tnm;
        if (json.estadio) campos.estadio = json.estadio;
        if (json.grau) campos.grau_hist = json.grau;
        if (json.re)   campos.re   = json.re;
        if (json.rp)   campos.rp   = json.rp;
        if (json.her2) campos.her2 = json.her2;
        if (json.ki67) campos.ki67 = json.ki67;
        if (json.pdl1) campos.pdl1 = json.pdl1;
        if (Object.keys(campos).length === 0) return { sucesso:false, mensagem:'IA não extraiu nada' };
        return { sucesso:true, campos, mensagem:`IA extraiu: ${Object.keys(campos).join(', ')}`, confianca:'media' };
      } catch (e) { return { sucesso:false, mensagem:'IA: ' + e.message }; }
    },
  },
  {
    id: 'apac-justificativa',
    nome: 'Justificativa APAC IA',
    icone: '📝',
    tipo: TIPO_AGENTE_IA,
    condicaoPara: (pac) => pac?.diag && pac?.cid && pac?.trat,
    executar: async (acumulado, { chamarClaude }) => {
      try {
        const prompt = montarPromptJustificativaAPAC(acumulado);
        const resposta = await chamarClaude(prompt, 400);
        const limpo = (resposta || '').replace(/[#*_`]/g, '').replace(/^[\s\n]+|[\s\n]+$/g, '');
        if (!limpo || limpo.length < 30) return { sucesso:false, mensagem:'IA vazia' };
        return { sucesso:true, campos:{ apac_justificativa: limpo }, mensagem:`Justificativa pronta (${limpo.length} chars)`, confianca:'media' };
      } catch (e) { return { sucesso:false, mensagem:'IA: ' + e.message }; }
    },
  },
];

// ═══ HELPER: classificar resultado dos agentes ═══════════════════════════════
// Após executar pipeline, classifica os campos sugeridos em:
//   - aplicadosAuto: já aplicados ao paciente (administrativos seguros)
//   - sugestoesClinicas: aguardam validação do médico (clínicos)
//   - conflitosReais: valor sugerido difere DE VERDADE do atual (não só formato)
//   - bloqueiosSoberania: campos confirmados por médico que agente tentaria sobrescrever

function classificarResultados(estados, pac) {
  const aplicadosAuto = [];          // já aplicados
  const sugestoesClinicas = [];      // 1 clique para aceitar tudo
  const conflitosReais = [];         // modal de conflito
  const bloqueiosSoberania = [];     // médico confirmou, agente quer mudar

  Object.entries(estados).forEach(([agenteId, estado]) => {
    if (estado?.status !== 'concluido' || !estado.campos) return;
    const agente = AGENTES.find(a => a.id === agenteId);

    Object.entries(estado.campos)
      .filter(([k]) => !k.startsWith('_'))
      .forEach(([campo, valorNovo]) => {
        const valorAtual = pac?.[campo];
        const confirmado = isCampoConfirmado(pac, campo);
        const cArt = criticidadeCampo(campo);

        // Soberania médica: pula se valor é equivalente, conflita se diverge
        if (confirmado) {
          if (valoresEquivalentes(valorAtual, valorNovo)) return; // ignora silenciosamente
          bloqueiosSoberania.push({ campo, valorAtual, valorNovo, agente: agente?.nome, agenteId, confianca: estado.confianca });
          return;
        }

        // Sem valor atual: aplica conforme criticidade
        if (!valorAtual || String(valorAtual).trim() === '') {
          if (cArt === 'auto_seguro' || cArt === 'auto_se_vazio') {
            aplicadosAuto.push({ campo, valorNovo, agente: agente?.nome, agenteId, confianca: estado.confianca, motivo: cArt });
          } else if (cArt === 'sugerir') {
            sugestoesClinicas.push({ campo, valorAtual: '', valorNovo, agente: agente?.nome, agenteId, confianca: estado.confianca });
          }
          // 'nunca_auto' → nem mostra como sugestão
          return;
        }

        // Tem valor atual diferente: depende da criticidade
        if (valoresEquivalentes(valorAtual, valorNovo)) return; // mesmo conteúdo, só formatação diferente

        if (cArt === 'auto_seguro') {
          // Administrativo: aceita versão mais completa (mais longa) sem perguntar
          // Ex: "Patos" + "Patos-PB" → fica "Patos-PB"
          const escolhido = String(valorNovo).length > String(valorAtual).length ? valorNovo : valorAtual;
          if (escolhido !== valorAtual) {
            aplicadosAuto.push({ campo, valorNovo: escolhido, agente: agente?.nome, agenteId, confianca: estado.confianca, motivo: 'auto_seguro_completo' });
          }
          return;
        }

        if (cArt === 'auto_se_vazio') {
          // Antropométrico já preenchido: não sobrescreve, só alerta
          return;
        }

        // sugerir ou nunca_auto com conflito real → modal
        if (cArt === 'sugerir') {
          conflitosReais.push({ campo, valorAtual, valorNovo, agente: agente?.nome, agenteId, confianca: estado.confianca });
        }
      });
  });

  return { aplicadosAuto, sugestoesClinicas, conflitosReais, bloqueiosSoberania };
}

// ═══ HELPER: pendências agrupadas por destinatário ═══════════════════════════

function agruparPendencias(estados) {
  const pendencias = { recepcao: [], enfermagem: [], medico: [] };
  Object.entries(estados).forEach(([agenteId, estado]) => {
    if (estado?.status !== 'falhou' && estado?.status !== 'concluido') return;
    if (estado.status === 'falhou' && estado.destinatario) {
      pendencias[estado.destinatario].push({ agenteId, mensagem: estado.mensagem });
    }
  });
  return pendencias;
}

// ═══ COMPONENTES ═════════════════════════════════════════════════════════════

function ChipConfianca({ confianca }) {
  if (!confianca) return null;
  const cfg = { alta:{cor:VE,l:'Alta'}, media:{cor:AM,l:'Média'}, baixa:{cor:VM,l:'Baixa'} };
  const c = cfg[confianca] || cfg.media;
  return (
    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600, background:'#fff', color:c.cor, border:`1px solid ${c.cor}` }}>
      {c.l}
    </span>
  );
}

function LinhaSugestao({ item, onAceitar, onIgnorar, aceito }) {
  const sobrescreve = item.valorAtual && String(item.valorAtual).trim() !== '';
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'8px 10px', borderRadius:8, marginBottom:6, gap:8, flexWrap:'wrap',
      background: aceito ? '#D1FAE5' : (sobrescreve ? '#FEF3C7' : '#F8FAFC'),
      border:`1px solid ${aceito ? VE : (sobrescreve ? '#FDE68A' : '#E5E7EB')}`,
    }}>
      <div style={{ flex:'1 1 200px', minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, flexWrap:'wrap' }}>
          <strong style={{ fontSize:13, color:N }}>{item.campo}</strong>
          <ChipConfianca confianca={item.confianca} />
          {sobrescreve && (
            <span style={{ fontSize:10, color:AM, fontWeight:700 }}>↻ substituir</span>
          )}
        </div>
        <div style={{ fontSize:12, color:'#374151', wordBreak:'break-word' }}>
          {sobrescreve && (
            <span style={{ color:'#92400E', textDecoration:'line-through', marginRight:6 }}>
              {String(item.valorAtual).substring(0, 80)}
            </span>
          )}
          <strong style={{ color: aceito ? '#065F46' : AZ }}>
            {String(item.valorNovo).substring(0, 120)}
          </strong>
        </div>
        <div style={{ fontSize:10, color:'#6B7280', marginTop:2 }}>{item.agente}</div>
      </div>
      <div style={{ display:'flex', gap:4 }}>
        {!aceito && (
          <>
            <button onClick={() => onAceitar(item)} style={{
              padding:'4px 10px', background:VE, color:'#fff', border:'none',
              borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer',
            }}>✓ Aceitar</button>
            <button onClick={() => onIgnorar(item)} style={{
              padding:'4px 10px', background:'#fff', color:'#6B7280', border:'1px solid #D1D5DB',
              borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
            }}>Ignorar</button>
          </>
        )}
        {aceito && <span style={{ fontSize:11, color:VE, fontWeight:700, padding:'4px 0' }}>✓ aceito</span>}
      </div>
    </div>
  );
}

// ═══ MODAL DE CONFLITO REAL — só para divergência clínica relevante ══════════

function ModalConflito({ conflitos, soberania, onResolver, onCancelar }) {
  const todos = [
    ...soberania.map(c => ({ ...c, bloqueio: 'confirmado_medico' })),
    ...conflitos.map(c => ({ ...c, bloqueio: null })),
  ];
  const [resolucoes, setResolucoes] = useState({});
  // v1.1.7: justificativas por campo (obrigatório para override)
  const [justificativas, setJustificativas] = useState({});

  // v1.1.7: pode aplicar só se todas as decisões estão tomadas E override tem justificativa ≥ 20
  const todosDecidiram = todos.every(c => resolucoes[c.campo]);
  const overridesValidos = todos.every(c => {
    if (resolucoes[c.campo] !== 'substituir-com-override') return true;
    const j = justificativas[c.campo] || '';
    return j.trim().length >= 20;
  });
  const podeAplicar = todosDecidiram && overridesValidos;

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000, padding:20,
    }}>
      <div style={{ background:'#fff', borderRadius:14, padding:24, maxWidth:780, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
        <h3 style={{ ...titulo, marginTop:0 }}>⚠️ Divergência clínica — decisão necessária</h3>
        <p style={{ fontSize:13, color:'#6B7280', margin:'0 0 14px' }}>
          {todos.length} campo(s) clínico(s) divergem entre o valor atual e o sugerido pelo agente.
        </p>
        {soberania.length > 0 && (
          <div style={{ background:'#FEE2E2', border:`1px solid ${VM}`, borderRadius:8, padding:10, marginBottom:14, fontSize:12, color:'#7F1D1D' }}>
            <strong>🔒 Soberania médica:</strong> alguns campos foram CONFIRMADOS por médico antes.
            Override exige justificativa ≥ 20 caracteres (auditoria).
          </div>
        )}

        {todos.map((c, i) => {
          const confirmado = c.bloqueio === 'confirmado_medico';
          const overrideEscolhido = resolucoes[c.campo] === 'substituir-com-override';
          const justificativa = justificativas[c.campo] || '';
          const justificativaInsuficiente = overrideEscolhido && justificativa.trim().length < 20;

          return (
            <div key={i} style={{
              background:'#F8FAFC', borderRadius:10, padding:12, marginBottom:10,
              border:`2px solid ${
                resolucoes[c.campo]
                  ? (overrideEscolhido ? (justificativaInsuficiente ? VM : AM) : VE)
                  : (confirmado ? VM : '#E2E8F0')
              }`,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:8 }}>
                <strong style={{ color:N, fontSize:14 }}>
                  {c.campo}
                  {confirmado && <span style={{ marginLeft:8, fontSize:10, padding:'2px 6px', borderRadius:8, fontWeight:700, background:'#FEE2E2', color:VM }}>🔒 CONFIRMADO PELO MÉDICO</span>}
                </strong>
                <span style={{ fontSize:11, color:'#6B7280' }}>por: <strong>{c.agente}</strong></span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                <div style={{ background:'#FEF3C7', padding:8, borderRadius:6, border:'1px solid #FDE68A' }}>
                  <p style={{ margin:0, fontSize:10, color:'#92400E', fontWeight:700 }}>ATUAL{confirmado ? ' (CONFIRMADO)' : ''}</p>
                  <p style={{ margin:'2px 0 0', fontSize:13, color:'#78350F', fontWeight:600 }}>{String(c.valorAtual).substring(0, 100)}</p>
                </div>
                <div style={{ background:'#DBEAFE', padding:8, borderRadius:6, border:'1px solid #BFDBFE' }}>
                  <p style={{ margin:0, fontSize:10, color:'#1E40AF', fontWeight:700 }}>SUGERIDO</p>
                  <p style={{ margin:'2px 0 0', fontSize:13, color:'#1E3A8A', fontWeight:600 }}>{String(c.valorNovo).substring(0, 100)}</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {confirmado ? [
                  { v:'manter', label:'🔒 Manter (recomendado)', cor:VE },
                  { v:'substituir-com-override', label:'⚠️ Override (exige justificativa)', cor:VM },
                ].map(op => (
                  <button key={op.v} onClick={() => setResolucoes(r => ({ ...r, [c.campo]: op.v }))} style={{
                    flex:'1 1 auto', padding:'6px 10px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', border:'2px solid',
                    borderColor: resolucoes[c.campo] === op.v ? op.cor : '#D1D5DB',
                    background: resolucoes[c.campo] === op.v ? op.cor : '#fff',
                    color: resolucoes[c.campo] === op.v ? '#fff' : '#374151',
                  }}>{op.label}</button>
                )) : [
                  { v:'manter', label:'Manter', cor:AM },
                  { v:'substituir', label:'Substituir', cor:AZ },
                ].map(op => (
                  <button key={op.v} onClick={() => setResolucoes(r => ({ ...r, [c.campo]: op.v }))} style={{
                    flex:'1 1 auto', padding:'6px 10px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', border:'2px solid',
                    borderColor: resolucoes[c.campo] === op.v ? op.cor : '#D1D5DB',
                    background: resolucoes[c.campo] === op.v ? op.cor : '#fff',
                    color: resolucoes[c.campo] === op.v ? '#fff' : '#374151',
                  }}>{op.label}</button>
                ))}
              </div>

              {/* v1.1.7: campo de justificativa obrigatório para override */}
              {overrideEscolhido && (
                <div style={{ marginTop:10, padding:10, background:'#FFFBEB', border:`1px solid ${VM}`, borderRadius:6 }}>
                  <p style={{ margin:'0 0 6px', fontSize:11, fontWeight:700, color:'#7F1D1D' }}>
                    ⚠️ Justifique a sobrescrita (mín. 20 caracteres) — será registrada em auditoria:
                  </p>
                  <textarea
                    value={justificativa}
                    onChange={e => setJustificativas(j => ({ ...j, [c.campo]: e.target.value }))}
                    placeholder="Ex: laudo de patologia revisado por 2º patologista confirma mudança..."
                    style={{
                      width:'100%', minHeight:60, fontSize:12, padding:8, borderRadius:6,
                      border:`1.5px solid ${justificativaInsuficiente ? VM : '#D1D5DB'}`,
                      fontFamily:'inherit', resize:'vertical', boxSizing:'border-box',
                    }}
                  />
                  <p style={{ margin:'4px 0 0', fontSize:10, color: justificativaInsuficiente ? VM : '#6B7280' }}>
                    {justificativa.trim().length}/20 caracteres
                    {justificativaInsuficiente && ' — insuficiente'}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:14 }}>
          <button onClick={onCancelar} style={btnSec}>Cancelar</button>
          <button
            onClick={() => onResolver(resolucoes, justificativas)}
            disabled={!podeAplicar}
            style={{
              ...btnPri,
              opacity: podeAplicar ? 1 : 0.5,
              cursor: podeAplicar ? 'pointer' : 'not-allowed',
            }}
          >✓ Aplicar decisões</button>
        </div>
      </div>
    </div>
  );
}

// ═══ HOOK: useAgentesAutomaticos (v1.1.6) ═════════════════════════════════════
// Auto-executa pipeline LOCAL quando novas EntradaDado chegam.
// Anti-loop por fingerprint, debounce 600ms.
// IA só dispara se houver consentimento E laudo não estruturado.

function useAgentesAutomaticos({
  pac, entradasPendentes, consentimentoIA,
  executarPipelineLocal, executarPipelineIA,
}) {
  const ultimaExecucaoRef = useRef('');

  useEffect(() => {
    if (!pac) return;
    if (!pac?.nome && !pac?.id && !pac?.cns) return;
    if (!Array.isArray(entradasPendentes) || entradasPendentes.length === 0) return;

    // Fingerprint anti-loop: id + status de cada entrada
    const fingerprint = entradasPendentes.map(e => `${e.id}:${e.status}`).join('|');
    if (fingerprint === ultimaExecucaoRef.current) return;
    ultimaExecucaoRef.current = fingerprint;

    // Debounce: aguarda 600ms estabilizar antes de disparar
    const t = setTimeout(() => {
      executarPipelineLocal?.({ modo: 'auto', origem: 'novas_entradas' });

      // IA só roda se houver consentimento E há laudo não estruturado
      const haLaudoNaoEstruturado = entradasPendentes.some(e =>
        e.origem === 'drive_ocr' ||
        e.origem === 'upload_laudo' ||
        e.payload?._texto_laudos
      );
      if (consentimentoIA && haLaudoNaoEstruturado) {
        executarPipelineIA?.({ modo: 'auto_com_consentimento', origem: 'laudos' });
      }
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pac?.id, pac?.cns, entradasPendentes, consentimentoIA]);
}

// ═══ COMPONENTE PRINCIPAL — CENTRAL DE VALIDAÇÃO ═════════════════════════════

export default function AgentesPipeline({
  pac, up, chamarClaude,
  // ✓ v1.1.6 — integração com AppShell
  entradasPendentes = [],
  onEntradaProcessada = null,
  fila = null,                          // {entradas, marcarProcessada, ...}
  consentimentoIA: consentimentoIAExterno,
  setConsentimentoIA: setConsentimentoIAExterno,
  registrarDisparadores = null,         // recebe {local, ia} para autoexecução
  // v1.1.8 — Central é só painel (auditor 7)
  estadosAgentesPersistidos = null,     // resultados do agentRunner em retroscena
  resumoPaciente = null,                // queixa/medicações/alergias do paciente
}) {
  // v1.1.8: começa com estados persistidos se houver (resultados do runner)
  const [estados, setEstados] = useState(estadosAgentesPersistidos || {});
  const [executando, setExecutando] = useState(false);
  const [log, setLog] = useState([]);
  const [consentimentoIAInterno, setConsentimentoIAInterno] = useState(false);
  // Suporta consentimento controlado externamente (via AppShell) ou interno
  const consentimentoIA = consentimentoIAExterno !== undefined ? consentimentoIAExterno : consentimentoIAInterno;
  const setConsentimentoIA = setConsentimentoIAExterno || setConsentimentoIAInterno;
  const [conflitosAbertos, setConflitosAbertos] = useState(null);
  const [sugestoesAceitas, setSugestoesAceitas] = useState({});  // {campo: true}
  const [sugestoesIgnoradas, setSugestoesIgnoradas] = useState({});

  // Lista de campos que já foram aplicados automaticamente (para feedback visual)
  const [aplicadosAutoLog, setAplicadosAutoLog] = useState([]);

  // ✓ v1.1.6: Set de entradas já processadas (anti-replay)
  const entradasProcessadasRef = useRef(new Set());

  const pacKey = chavePaciente(pac);

  // v1.1.8: quando estadosAgentesPersistidos muda (novo paciente ou agentes
  // rodaram em retroscena), atualiza estados locais sem perder os anteriores.
  useEffect(() => {
    if (estadosAgentesPersistidos && Object.keys(estadosAgentesPersistidos).length > 0) {
      setEstados(prev => ({ ...prev, ...estadosAgentesPersistidos }));
    }
  }, [estadosAgentesPersistidos]);

  // Reset ao trocar paciente
  useEffect(() => {
    setEstados({});
    setLog([]);
    setConsentimentoIA(false);
    setConflitosAbertos(null);
    setSugestoesAceitas({});
    setSugestoesIgnoradas({});
    setAplicadosAutoLog([]);
    entradasProcessadasRef.current = new Set();  // v1.1.6
  }, [pacKey]);

  const addLog = useCallback((msg) => {
    setLog(l => [...l.slice(-29), { hora: new Date().toLocaleTimeString('pt-BR'), msg }]);
  }, []);

  // ═══ v1.1.9 (auditor 9 #3.1): REMOVIDO useEffect que processa entradas ═════
  // Antes (v1.1.6-v1.1.8): a Central também processava entradasPendentes,
  // duplicando o trabalho do AppShell e podendo aplicar campos 2x.
  //
  // Agora: a Central NÃO processa nada. Apenas exibe os resultados que o
  // AppShell + agentRunner já produziram em retroscena.
  // (entradasPendentes ainda é usada para CONTAGEM/EXIBIÇÃO apenas.)

  // Executa pipeline (LOCAL ou IA) com acumulador local
  // v1.1.7: opts permite o orquestrador (useAutomacaoEntradas) passar
  // basePac (acumulado de várias entradas) e contextoAgentes (_texto_laudos etc.)
  const executarPipeline = useCallback(async (filtroTipo, opts = {}) => {
    const agentesDeste = AGENTES.filter(a => a.tipo === filtroTipo);
    if (filtroTipo === TIPO_AGENTE_IA && !chamarClaude) return;
    if (filtroTipo === TIPO_AGENTE_IA && !consentimentoIA) return;

    // v1.1.7: prioriza basePac do orquestrador (já tem campos das entradas
    // recém-processadas). Cai em pac se não vier.
    let acumulado = { ...(opts.basePac || pac) };

    // v1.1.7: contextoAgentes inclui campos `_xxx` (_texto_laudos) que NÃO vão
    // para o prontuário mas precisam alimentar os agentes (agora não são mais
    // perdidos como na v1.1.6).
    if (opts.contextoAgentes) Object.assign(acumulado, opts.contextoAgentes);

    Object.values(estados).forEach(e => {
      if (e?.campos) Object.assign(acumulado, e.campos);
    });

    const ctx = { chamarClaude };
    const novos = {};

    for (const agente of agentesDeste) {
      if (!agente.condicaoPara(acumulado)) {
        novos[agente.id] = { status:'aguardando', mensagem:'Pré-requisitos faltando' };
        continue;
      }
      novos[agente.id] = { status:'processando' };
      setEstados(s => ({ ...s, [agente.id]: novos[agente.id] }));

      try {
        // eslint-disable-next-line no-await-in-loop
        const r = await agente.executar(acumulado, ctx);
        if (r.sucesso) {
          if (r.campos) Object.assign(acumulado, r.campos);
          novos[agente.id] = { status:'concluido', mensagem:r.mensagem, campos:r.campos||{}, confianca:r.confianca };
        } else {
          novos[agente.id] = { status:'falhou', mensagem:r.mensagem, destinatario:r.destinatario };
        }
      } catch (e) {
        novos[agente.id] = { status:'falhou', mensagem:'Erro: '+e.message };
      }
      setEstados(s => ({ ...s, [agente.id]: novos[agente.id] }));
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 50));
    }
  }, [pac, estados, chamarClaude, consentimentoIA]);

  // Aplica automaticamente os campos seguros após pipeline
  const aplicarAutomaticos = useCallback((aplicadosAuto) => {
    if (!aplicadosAuto || aplicadosAuto.length === 0) return;
    const aplicados = [];
    aplicadosAuto.forEach(item => {
      const r = upAuditavelSeguro(up, pac, item.campo, item.valorNovo, {
        fonte:'agente', agente:item.agente, confianca:item.confianca,
        aplicadoPor:'sistema (auto)',
      });
      if (r.aplicado) aplicados.push(item);
    });
    setAplicadosAutoLog(prev => [...prev, ...aplicados]);
    addLog(`✓ ${aplicados.length} campo(s) aplicado(s) automaticamente (administrativo/antropométrico)`);
  }, [pac, up, addLog]);

  // v1.1.7: executarTudo aceita opts (basePac, contextoAgentes) para o
  // orquestrador do AppShell passar dados frescos da fila.
  const executarTudo = useCallback(async (opts = {}) => {
    if (executando) return;
    setExecutando(true);
    addLog(opts.modo === 'auto' ? '▶ Auto (entradas novas)...' : '▶ Executando agentes locais...');
    await executarPipeline(TIPO_AGENTE_LOCAL, opts);
    addLog('✓ Agentes locais concluídos');
    setExecutando(false);
  }, [executando, executarPipeline, addLog]);

  // Após pipeline rodar, aplicar automáticos imediatamente
  const estadosRef = useRef(estados);
  estadosRef.current = estados;
  useEffect(() => {
    // Se há novos resultados concluídos não aplicados ainda
    const { aplicadosAuto } = classificarResultados(estados, pac);
    const naoAplicadosAinda = aplicadosAuto.filter(a =>
      !aplicadosAutoLog.some(x => x.campo === a.campo && x.valorNovo === a.valorNovo)
    );
    if (naoAplicadosAinda.length > 0) {
      aplicarAutomaticos(naoAplicadosAinda);
    }
  // eslint-disable-next-line
  }, [estados]);

  const executarIA = useCallback(async () => {
    if (executando || !consentimentoIA) return;
    setExecutando(true);
    addLog('🤖 Executando agentes IA...');
    await executarPipeline(TIPO_AGENTE_IA);
    addLog('✓ Agentes IA concluídos');
    setExecutando(false);
  }, [executando, consentimentoIA, executarPipeline, addLog]);

  // ═══ v1.1.9 (auditor 9 #3.1): REMOVIDO useAgentesAutomaticos ════════════════
  // Antes: Central rodava agentes automaticamente quando entradas chegavam,
  // duplicando o que o agentRunner já faz em retroscena.
  // Agora: agentes só rodam via agentRunner (AppShell). Central pode rodar
  // manualmente via botão "Executar agentes locais" se médico quiser
  // re-executar — isso fica como ferramenta, não como motor automático.

  // ═══ v1.1.6: expor disparadores ao AppShell ═════════════════════════════
  // Permite que o shell coordene execução com a fila externa.
  useEffect(() => {
    if (typeof registrarDisparadores === 'function') {
      registrarDisparadores({ local: executarTudo, ia: executarIA });
    }
  }, [registrarDisparadores, executarTudo, executarIA]);

  // Classificação atual
  const { aplicadosAuto, sugestoesClinicas, conflitosReais, bloqueiosSoberania } = useMemo(
    () => classificarResultados(estados, pac),
    [estados, pac]
  );

  // Sugestões filtradas (não aceitas, não ignoradas)
  const sugestoesPendentes = sugestoesClinicas.filter(s =>
    !sugestoesAceitas[s.campo] && !sugestoesIgnoradas[s.campo]
  );

  // Pendências agrupadas
  const pendencias = useMemo(() => agruparPendencias(estados), [estados]);

  // Status APAC do agente anti-glosa
  const estadoAntiGlosa = estados['anti-glosa'];
  const apacStatus = estadoAntiGlosa?.campos?._apac_status || null;
  const apacScore = estadoAntiGlosa?.campos?._apac_score ?? null;
  const apacBloqueantes = estadoAntiGlosa?.campos?._apac_bloqueantes || [];

  // Handlers
  const aceitarSugestao = useCallback((item) => {
    const r = upAuditavelSeguro(up, pac, item.campo, item.valorNovo, {
      fonte:'agente', agente:item.agente, confianca:item.confianca,
      aplicadoPor:'médico (aceitou sugestão)',
    });
    if (r.aplicado) {
      setSugestoesAceitas(s => ({ ...s, [item.campo]: true }));
      addLog(`✓ ${item.campo}: aceito (${item.agente})`);
    }
  }, [pac, up, addLog]);

  const ignorarSugestao = useCallback((item) => {
    setSugestoesIgnoradas(s => ({ ...s, [item.campo]: true }));
    addLog(`○ ${item.campo}: ignorado`);
  }, [addLog]);

  const aceitarTodasSugestoes = useCallback(() => {
    sugestoesPendentes.forEach(item => aceitarSugestao(item));
  }, [sugestoesPendentes, aceitarSugestao]);

  const abrirConflitos = useCallback(() => {
    if (conflitosReais.length === 0 && bloqueiosSoberania.length === 0) return;
    setConflitosAbertos({ conflitos: conflitosReais, soberania: bloqueiosSoberania });
  }, [conflitosReais, bloqueiosSoberania]);

  const resolverConflitos = useCallback((resolucoes, justificativas = {}) => {
    let aplicados = 0;
    [...bloqueiosSoberania.map(c => ({ ...c, bloqueio:'confirmado_medico' })), ...conflitosReais].forEach(c => {
      const decisao = resolucoes[c.campo];
      if (decisao === 'manter') return;
      if (decisao === 'substituir') {
        const r = upAuditavelSeguro(up, pac, c.campo, c.valorNovo, {
          fonte:'agente', agente:c.agente, confianca:c.confianca,
          aplicadoPor:'médico (substituiu valor anterior)',
        });
        if (r.aplicado) aplicados++;
      }
      if (decisao === 'substituir-com-override') {
        // v1.1.7: justificativa obrigatória vai para auditoria
        const justificativa = (justificativas[c.campo] || '').trim();
        if (justificativa.length < 20) {
          addLog(`✗ Override de "${c.campo}" rejeitado: justificativa < 20 caracteres`);
          return;
        }
        const r = upAuditavelSeguro(up, pac, c.campo, c.valorNovo, {
          fonte:'agente', agente:c.agente, confianca:c.confianca,
          aplicadoPor:'médico (override de campo confirmado)',
          overrideMedico: true,
          justificativaOverride: justificativa,  // ← v1.1.7
        });
        if (r.aplicado) {
          aplicados++;
          addLog(`⚠️ Override aplicado em "${c.campo}". Justificativa registrada.`);
        }
      }
    });
    setConflitosAbertos(null);
    addLog(`✓ ${aplicados} conflito(s) resolvido(s)`);
  }, [pac, up, conflitosReais, bloqueiosSoberania, addLog]);

  // Contadores
  const totalAgentes = AGENTES.length;
  const concluidos = Object.values(estados).filter(e => e?.status === 'concluido').length;
  const houveExecucao = concluidos > 0;
  const totalAplicadosAuto = aplicadosAutoLog.length;
  const totalSugestoes = sugestoesClinicas.length;
  const totalAceitas = Object.keys(sugestoesAceitas).length;
  const totalConflitos = conflitosReais.length + bloqueiosSoberania.length;
  // v1.1.7 (auditor 6, critério 7): médico SÓ vê pendências DELE.
  // Recepção/enfermagem têm suas próprias caixas — não interrompem o médico.
  const pendenciasDoMedico = pendencias.medico.length;
  const pendenciasOutrosSetores = pendencias.recepcao.length + pendencias.enfermagem.length;

  return (
    <div style={{ background:BG, minHeight:'100vh', padding:'20px 16px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {conflitosAbertos && (
          <ModalConflito
            conflitos={conflitosAbertos.conflitos}
            soberania={conflitosAbertos.soberania}
            onResolver={resolverConflitos}
            onCancelar={() => setConflitosAbertos(null)}
          />
        )}

        {/* Header compacto */}
        <div style={{ marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div>
            <p style={{ margin:0, fontSize:11, color:T, fontWeight:700, letterSpacing:1 }}>APACApp · PIPELINE v1.1.10</p>
            <h2 style={{ margin:'4px 0 0', fontSize:22, fontWeight:900, color:N }}>
              🎯 Central de Validação
            </h2>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:N }}>{pac?.nome || '⚠️ Carregar paciente'}</p>
            {pac?.cns && <p style={{ margin:0, fontSize:11, color:'#6B7280' }}>CNS: {pac.cns}</p>}
          </div>
        </div>

        {/* v1.1.9 (auditoria 8 #2b): BOTÃO ÚNICO — quando há trabalho pronto */}
        {houveExecucao && (totalSugestoes > 0 || totalConflitos > 0 || pendenciasDoMedico > 0) && (
          <div style={{
            ...card,
            background:'linear-gradient(135deg, #1B365D 0%, #2B7A8C 100%)',
            color:'#fff', padding:20, marginBottom:14,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14 }}>
              <div>
                <p style={{ margin:0, fontSize:11, color:'#FCD34D', fontWeight:700, letterSpacing:1 }}>
                  📋 PRONTO PARA AUDITORIA
                </p>
                <h3 style={{ margin:'4px 0 0', fontSize:18, fontWeight:900, color:'#fff' }}>
                  {totalSugestoes > 0 && `${sugestoesPendentes.length} sugestão(ões)`}
                  {totalSugestoes > 0 && totalConflitos > 0 && ' · '}
                  {totalConflitos > 0 && `${totalConflitos} conflito(s)`}
                  {pendenciasDoMedico > 0 && ` · ${pendenciasDoMedico} pendência(s) clínica(s)`}
                </h3>
                <p style={{ margin:'4px 0 0', fontSize:12, color:'#CBD5E1' }}>
                  Aceite as sugestões pendentes e siga para assinar a prescrição.
                </p>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {sugestoesPendentes.length > 0 && (
                  <button
                    onClick={aceitarTodasSugestoes}
                    style={{
                      background:'#fff', color:N, fontWeight:900,
                      padding:'12px 18px', borderRadius:10, border:'none',
                      fontSize:13, cursor:'pointer',
                    }}
                  >
                    ✓ Aceitar todas ({sugestoesPendentes.length})
                  </button>
                )}
                <button
                  onClick={() => { if (typeof window !== 'undefined') window.location.hash = '/medico/prescricao'; }}
                  style={{
                    background:G, color:'#fff', fontWeight:900,
                    padding:'12px 20px', borderRadius:10, border:'none',
                    fontSize:14, cursor:'pointer', boxShadow:'0 2px 8px rgba(184,134,11,0.4)',
                  }}
                >
                  💊 Ir para Prescrição →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quando tudo está em ordem (raro mas possível) — botão único de assinar */}
        {houveExecucao && totalSugestoes === 0 && totalConflitos === 0 && pendenciasDoMedico === 0 && (
          <div style={{ ...card, background:'#D1FAE5', border:`3px solid ${VE}`, padding:20, marginBottom:14, textAlign:'center' }}>
            <h3 style={{ margin:0, fontSize:18, fontWeight:900, color:'#065F46' }}>
              ✓ Tudo validado — pronto para prescrever
            </h3>
            <p style={{ margin:'6px 0 14px', fontSize:13, color:'#047857' }}>
              Não há sugestões, conflitos nem pendências clínicas. Siga para a prescrição.
            </p>
            <button
              onClick={() => { if (typeof window !== 'undefined') window.location.hash = '/medico/prescricao'; }}
              style={{
                background:G, color:'#fff', fontWeight:900,
                padding:'14px 28px', borderRadius:10, border:'none',
                fontSize:15, cursor:'pointer',
              }}
            >
              💊 Ir para Prescrição →
            </button>
          </div>
        )}

        {/* BOTÃO ÚNICO — antes de executar */}
        {!houveExecucao && (
          <div style={{ ...card, textAlign:'center', padding:32 }}>
            <h3 style={{ ...titulo, borderBottom:'none', justifyContent:'center', textAlign:'center', margin:'0 0 8px' }}>
              Pronto para revisar este paciente
            </h3>
            <p style={{ fontSize:14, color:'#6B7280', margin:'0 0 20px' }}>
              Agentes locais vão calcular BSA, ClCr, sugerir CID e SIGTAP, extrair patologia e validar APAC.
              Tudo administrativo seguro será aplicado <strong>automaticamente</strong>.
            </p>
            <button onClick={executarTudo} disabled={!pac?.nome || executando} style={{
              ...btnPri, fontSize:16, padding:'14px 32px',
              opacity: (!pac?.nome || executando) ? 0.5 : 1,
              cursor: (!pac?.nome || executando) ? 'not-allowed' : 'pointer',
            }}>
              {executando ? '⚙️ Executando...' : '▶️ Executar agentes locais'}
            </button>
            <p style={{ fontSize:11, color:'#9CA3AF', margin:'12px 0 0' }}>
              Agentes locais rodam offline, sem custo, sem envio de dados.
            </p>
          </div>
        )}

        {/* RESUMO PÓS-EXECUÇÃO — central de validação */}
        {houveExecucao && (
          <>
            {/* Status APAC + Score */}
            {apacStatus && (
              <div style={{
                ...card,
                background: apacStatus.startsWith('BLOQUEADA') ? '#FEE2E2'
                          : apacStatus === 'RISCO' ? '#FEF3C7'
                          : apacStatus === 'APROVADA COM ALERTAS' ? '#FFFBEB'
                          : '#D1FAE5',
                border:`2px solid ${apacStatus.startsWith('BLOQUEADA') ? VM
                                : apacStatus === 'RISCO' ? AM
                                : apacStatus === 'APROVADA COM ALERTAS' ? AM : VE}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
                  <div>
                    <p style={{ margin:0, fontSize:11, color:'#6B7280', fontWeight:700, letterSpacing:1 }}>STATUS APAC</p>
                    <p style={{ margin:'4px 0 0', fontSize:24, fontWeight:900,
                      color: apacStatus.startsWith('BLOQUEADA') ? VM : apacStatus === 'RISCO' ? AM : apacStatus === 'APROVADA COM ALERTAS' ? AM : VE,
                    }}>{apacStatus}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ margin:0, fontSize:11, color:'#6B7280', fontWeight:700 }}>SCORE</p>
                    <p style={{ margin:'4px 0 0', fontSize:32, fontWeight:900, color:N }}>{apacScore}<span style={{ fontSize:14, fontWeight:600, color:'#6B7280' }}>/100</span></p>
                  </div>
                </div>
                {apacBloqueantes.length > 0 && (
                  <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid rgba(0,0,0,0.1)' }}>
                    <p style={{ margin:0, fontSize:12, fontWeight:700, color:VM }}>⛔ Bloqueios:</p>
                    <ul style={{ margin:'4px 0 0', paddingLeft:18, fontSize:12, color:'#7F1D1D' }}>
                      {apacBloqueantes.slice(0, 5).map((b, i) => <li key={i}>{b.label || b.campo}</li>)}
                      {apacBloqueantes.length > 5 && <li>... e mais {apacBloqueantes.length - 5}</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* v1.1.8 — PAINEL: dados informados pelo paciente
                (auditor 7 item 3.3 — queixa, alergias, medicações em uso) */}
            {resumoPaciente && Object.keys(resumoPaciente).length > 0 && (
              <div style={{
                ...card, background:'#F0FDFA', borderColor:'#5EEAD4',
                borderLeft:`6px solid ${T}`,
              }}>
                <h3 style={{ ...titulo, color:T, borderBottomColor:T }}>
                  🗣️ Dados informados pelo paciente
                </h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:10 }}>
                  {resumoPaciente.queixa_principal && (
                    <div>
                      <p style={{ margin:0, fontSize:10, fontWeight:700, color:'#0F766E', letterSpacing:0.5 }}>QUEIXA PRINCIPAL</p>
                      <p style={{ margin:'2px 0 0', fontSize:13, color:N, fontWeight:600 }}>{resumoPaciente.queixa_principal}</p>
                    </div>
                  )}
                  {resumoPaciente.medicacoes_em_uso && (
                    <div>
                      <p style={{ margin:0, fontSize:10, fontWeight:700, color:'#0F766E', letterSpacing:0.5 }}>MEDICAÇÕES EM USO</p>
                      <p style={{ margin:'2px 0 0', fontSize:13, color:N, fontWeight:600 }}>{resumoPaciente.medicacoes_em_uso}</p>
                    </div>
                  )}
                  {resumoPaciente.alergias && (
                    <div>
                      <p style={{ margin:0, fontSize:10, fontWeight:700, color:VM, letterSpacing:0.5 }}>⚠️ ALERGIAS</p>
                      <p style={{ margin:'2px 0 0', fontSize:13, color:VM, fontWeight:700 }}>{resumoPaciente.alergias}</p>
                    </div>
                  )}
                  {resumoPaciente.historia_familiar && (
                    <div>
                      <p style={{ margin:0, fontSize:10, fontWeight:700, color:'#0F766E', letterSpacing:0.5 }}>HISTÓRIA FAMILIAR</p>
                      <p style={{ margin:'2px 0 0', fontSize:13, color:N, fontWeight:600 }}>{resumoPaciente.historia_familiar}</p>
                    </div>
                  )}
                  {resumoPaciente.sintomas && (
                    <div>
                      <p style={{ margin:0, fontSize:10, fontWeight:700, color:'#0F766E', letterSpacing:0.5 }}>SINTOMAS</p>
                      <p style={{ margin:'2px 0 0', fontSize:13, color:N, fontWeight:600 }}>{resumoPaciente.sintomas}</p>
                    </div>
                  )}
                </div>
                <p style={{ margin:'10px 0 0', fontSize:11, color:'#0F766E', fontStyle:'italic' }}>
                  Dados informados pelo próprio paciente — não substituem anamnese formal.
                </p>
              </div>
            )}

            {/* RESUMO DOS AGENTES — 1 card só */}
            <div style={card}>
              <h3 style={titulo}>📋 Resumo da revisão</h3>

              {/* Linha de stats — v1.1.7: médico só vê o que é dele */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10, marginBottom:14 }}>
                <Stat icone="✅" cor={VE} valor={totalAplicadosAuto} label="aplicados automaticamente" />
                <Stat icone="💡" cor={AZ} valor={totalSugestoes} label="sugestões clínicas" sub={totalAceitas > 0 ? `${totalAceitas} aceitas` : null} />
                <Stat icone="⚠️" cor={AM} valor={totalConflitos} label="conflitos para revisar" />
                <Stat icone="📋" cor={N} valor={pendenciasDoMedico} label="pendências clínicas (suas)" />
              </div>

              {/* Aplicados automaticamente — colapsável */}
              {totalAplicadosAuto > 0 && (
                <details style={{ marginBottom:10 }}>
                  <summary style={{ cursor:'pointer', fontSize:13, fontWeight:700, color:VE, padding:'6px 0' }}>
                    ✓ {totalAplicadosAuto} aplicados automaticamente — ver detalhes
                  </summary>
                  <div style={{ marginTop:8, padding:'8px 12px', background:'#ECFDF5', borderRadius:8 }}>
                    {aplicadosAutoLog.map((a, i) => (
                      <div key={i} style={{ fontSize:11, color:'#065F46', marginBottom:3 }}>
                        <strong>{a.campo}</strong>: {String(a.valorNovo).substring(0, 60)} <span style={{ color:'#6B7280' }}>· {a.agente}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Sugestões clínicas — UMA TELA, todas visíveis */}
              {sugestoesPendentes.length > 0 && (
                <div style={{ marginTop:14, padding:12, background:'#EFF6FF', borderRadius:10, border:'1px solid #BFDBFE' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:8 }}>
                    <strong style={{ fontSize:14, color:AZ }}>💡 Sugestões clínicas — {sugestoesPendentes.length}</strong>
                    <button onClick={aceitarTodasSugestoes} style={{ ...btnVE, padding:'6px 14px', fontSize:12 }}>
                      ✓ Aceitar todas
                    </button>
                  </div>
                  <p style={{ margin:'0 0 10px', fontSize:11, color:'#6B7280' }}>
                    Campos clínicos sugeridos. Aceite individualmente ou em lote.
                  </p>
                  {sugestoesPendentes.map((s, i) => (
                    <LinhaSugestao
                      key={s.campo + i}
                      item={s}
                      onAceitar={aceitarSugestao}
                      onIgnorar={ignorarSugestao}
                      aceito={false}
                    />
                  ))}
                </div>
              )}

              {/* Aceitas (feedback visual) */}
              {totalAceitas > 0 && (
                <details style={{ marginTop:10 }}>
                  <summary style={{ cursor:'pointer', fontSize:12, color:VE, fontWeight:700, padding:'4px 0' }}>
                    ✓ {totalAceitas} sugestão(ões) aceita(s)
                  </summary>
                  <div style={{ marginTop:6 }}>
                    {Object.keys(sugestoesAceitas).map(campo => {
                      const s = sugestoesClinicas.find(x => x.campo === campo);
                      if (!s) return null;
                      return <LinhaSugestao key={campo} item={s} onAceitar={()=>{}} onIgnorar={()=>{}} aceito={true} />;
                    })}
                  </div>
                </details>
              )}

              {/* Conflitos reais → botão único para abrir modal */}
              {totalConflitos > 0 && (
                <div style={{ marginTop:14, padding:12, background:'#FEF3C7', borderRadius:10, border:`1px solid #FDE68A` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                    <div>
                      <strong style={{ fontSize:14, color:AM }}>⚠️ {totalConflitos} conflito(s) clínico(s)</strong>
                      <p style={{ margin:'4px 0 0', fontSize:11, color:'#92400E' }}>
                        Divergência real entre valor atual e sugerido. Sua decisão é necessária.
                      </p>
                    </div>
                    <button onClick={abrirConflitos} style={{ ...btnVM, padding:'8px 16px', fontSize:13 }}>
                      Revisar conflitos
                    </button>
                  </div>
                </div>
              )}

              {/* v1.1.7 (auditor 6 critério 7):
                  - Pendências do médico: mostradas com destaque
                  - Pendências de outros setores: aviso de rodapé pequeno,
                    informando que JÁ foram roteadas, sem listar campo a campo
                    (não é tarefa do médico revisar) */}
              {pendenciasDoMedico > 0 && (
                <div style={{ marginTop:14 }}>
                  <BoxPendencia titulo="📋 Pendências clínicas suas" itens={pendencias.medico} cor={N} />
                </div>
              )}

              {pendenciasOutrosSetores > 0 && (
                <p style={{
                  marginTop:14, padding:'8px 12px', fontSize:11,
                  color:'#6B7280', background:'#F3F4F6', borderRadius:6,
                  borderLeft:`3px solid ${ROXO}`,
                }}>
                  ℹ️ {pendenciasOutrosSetores} pendência(s) cadastrais já roteada(s) para
                  {pendencias.recepcao.length > 0 && ` recepção (${pendencias.recepcao.length})`}
                  {pendencias.recepcao.length > 0 && pendencias.enfermagem.length > 0 && ' e'}
                  {pendencias.enfermagem.length > 0 && ` enfermagem (${pendencias.enfermagem.length})`}.
                  Não exigem ação sua.
                </p>
              )}
            </div>

            {/* Pipeline IA — só aparece SE médico quiser ir além do local */}
            <div style={{ ...card, background:'#FAF5FF', border:`1px solid #DDD6FE` }}>
              <h3 style={{ ...titulo, color:ROXO, borderBottomColor:ROXO }}>🤖 Análise por IA (opcional)</h3>
              <p style={{ margin:'0 0 10px', fontSize:12, color:'#6B7280' }}>
                Os agentes locais já cobriram a maioria dos campos. A IA pode extrair biomarcadores
                adicionais de laudos não estruturados e gerar a justificativa APAC formal.
              </p>
              <label style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:10, cursor:'pointer', fontSize:12, color:'#374151' }}>
                <input type="checkbox" checked={consentimentoIA} onChange={e => setConsentimentoIA(e.target.checked)} style={{ marginTop:2, width:16, height:16, accentColor:ROXO }} />
                <span>Autorizo envio de dados clínicos deste paciente à IA <strong>nesta sessão</strong> (uma vez só — não pergunta novamente).</span>
              </label>
              <button onClick={executarIA} disabled={!consentimentoIA || executando || !chamarClaude} style={{
                background: consentimentoIA && !executando && chamarClaude ? ROXO : '#9CA3AF',
                color:'#fff', fontWeight:900, borderRadius:10, padding:'10px 20px', border:'none',
                cursor: (consentimentoIA && !executando && chamarClaude) ? 'pointer' : 'not-allowed',
                fontSize:14,
              }}>
                {executando ? '⚙️ Executando...' : '🤖 Executar agentes IA'}
              </button>
              {!chamarClaude && <p style={{ margin:'6px 0 0', fontSize:11, color:VM }}>⚠️ IA indisponível neste ambiente.</p>}
            </div>

            {/* Repetir tudo */}
            <div style={{ textAlign:'center', marginTop:14 }}>
              <button onClick={() => { setEstados({}); setSugestoesAceitas({}); setSugestoesIgnoradas({}); setAplicadosAutoLog([]); }} style={btnSec}>
                ↻ Limpar e executar de novo
              </button>
            </div>
          </>
        )}

        {/* Log compacto */}
        {log.length > 0 && (
          <details style={{ marginTop:14 }}>
            <summary style={{ cursor:'pointer', fontSize:12, color:'#6B7280', fontWeight:700 }}>📋 Log de execução</summary>
            <div style={{ marginTop:8, maxHeight:200, overflowY:'auto', background:'#F8FAFC', padding:12, borderRadius:8, fontFamily:'monospace', fontSize:11 }}>
              {log.map((l, i) => (
                <div key={i} style={{ marginBottom:2, color:'#374151' }}>
                  <span style={{ color:'#9CA3AF' }}>{l.hora}</span> {l.msg}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// ═══ COMPONENTES AUXILIARES ══════════════════════════════════════════════════

function Stat({ icone, cor, valor, label, sub }) {
  return (
    <div style={{ padding:'10px 12px', background:'#F8FAFC', borderRadius:8, border:'1px solid #E5E7EB' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:18 }}>{icone}</span>
        <strong style={{ fontSize:22, fontWeight:900, color:cor }}>{valor}</strong>
      </div>
      <p style={{ margin:'2px 0 0', fontSize:11, color:'#6B7280', fontWeight:600 }}>{label}</p>
      {sub && <p style={{ margin:'2px 0 0', fontSize:10, color:cor, fontWeight:600 }}>{sub}</p>}
    </div>
  );
}

function BoxPendencia({ titulo, itens, cor }) {
  return (
    <div style={{ padding:10, background:'#fff', borderRadius:8, border:`1px solid ${cor}` }}>
      <p style={{ margin:'0 0 6px', fontSize:12, fontWeight:800, color:cor }}>{titulo}</p>
      <ul style={{ margin:0, paddingLeft:16, fontSize:11, color:'#374151' }}>
        {itens.map((it, i) => <li key={i}>{it.mensagem}</li>)}
      </ul>
    </div>
  );
}
