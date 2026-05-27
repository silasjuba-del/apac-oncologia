// ─────────────────────────────────────────────────────────────────────────────
// index.jsx — Barrel de exportações do módulo PrescricaoQTv2
//
// USO (sem integrar ao App):
//   import PrescricaoQTv2 from './features/prescricao/v2'
//   import catalogoJson   from '../../../data/protocolos_qt_catalogo_v02.json'
//   <PrescricaoQTv2 catalogoJson={catalogoJson} medico={{ nome: 'Dr. X', crm: 'CRM-PB 17341' }} />
//
// NÃO importar em App.jsx até auditoria e aprovação clínica da v0.3.
// ─────────────────────────────────────────────────────────────────────────────
export { default } from './PrescricaoQTv2';

// Exportar utilitários para testes e auditoria
export { calcBSA, calcBSASafe, calcCalvert, calcCalvertSafe, calcCrCl, calcCrClSafe, calcProtocoloCompleto, DOSE_CUMULATIVA_MAXIMA } from './lib/calculadoraDose';
export { validarCompleto, validarStatusProtocolo, validarRequisitosFarmacos, NIVEL } from './lib/validacoesSeguranca';
export { carregarCatalogo, buscarProtocolos, labelStatus, filtrarProtocolosPrescritiveis } from './lib/protocoloCatalogo';
