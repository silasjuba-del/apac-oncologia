// src/pages/ConferenciaAPAC.jsx
// APACApp — Conferência e validação anti-glosa da APAC Oncológica
// Hospital do Bem — Patos/PB — Dr. Silas Negrão — CRM-PB 17341
import { useState, useCallback } from 'react';
import { agenteAPAC } from '../agents/agenteAPAC.js';

const N = '#1B365D', T = '#2B7A8C', G = '#B8860B';

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function Secao({ titulo, icone, children, defaultAberta=true }) {
  const [aberta, setAberta] = useState(defaultAberta);
  return (
    <div style={{ background:'white', borderRadius:12, marginBottom:16, border:'1px solid #E5E7EB', overflow:'hidden' }}>
      <button type="button" onClick={()=>setAberta(a=>!a)} style={{
        width:'100%', padding:'14px 20px', background:'#F8FAFC',
        border:'none', borderBottom:aberta?'1px solid #E5E7EB':'none',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        cursor:'pointer', textAlign:'left',
      }}>
        <span style={{ fontWeight:700, fontSize:15, color:N }}>{icone} {titulo}</span>
        <span style={{ color:'#6B7280', fontSize:18 }}>{aberta?'▲':'▼'}</span>
      </button>
      {aberta&&<div style={{ padding:'16px 20px' }}>{children}</div>}
    </div>
  );
}

function CampoAPAC({ label, valor, obrigatorio, erro, onChange, tipo='text', opcoes, placeholder='' }) {
  const [focus, setFocus] = useState(false);
  const base = {
    width:'100%', padding:'10px 12px', fontSize:14, outline:'none',
    border:`2px solid ${erro?'#EF4444':focus?T:'#D1D5DB'}`,
    borderRadius:8, boxSizing:'border-box', fontFamily:'inherit', background:'white',
  };
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:13, fontWeight:700, color:N, marginBottom:4 }}>
        {label}{obrigatorio&&<span style={{ color:G, marginLeft:4 }}>*</span>}
      </label>
      {tipo==='select'&&opcoes
        ? <select value={valor||''} onChange={e=>onChange(e.target.value)} style={base} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}>
            <option value="">— Selecione —</option>
            {opcoes.map(o=><option key={o.valor} value={o.valor}>{o.label}</option>)}
          </select>
        : tipo==='textarea'
        ? <textarea value={valor||''} onChange={e=>onChange(e.target.value)} rows={3} placeholder={placeholder}
            style={{ ...base, resize:'vertical', lineHeight:1.5 }}
            onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} />
        : <input type={tipo} value={valor||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
            style={base} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} />
      }
      {erro&&<p style={{ fontSize:12, color:'#DC2626', margin:'4px 0 0', padding:'3px 8px', background:'#FEF2F2', borderRadius:4 }}>⛔ {erro}</p>}
    </div>
  );
}

function BadgeScore({ score, nivel }) {
  const cor = nivel==='Aprovada'?'#065F46':nivel==='Risco'?'#92400E':'#991B1B';
  const bg  = nivel==='Aprovada'?'#D1FAE5':nivel==='Risco'?'#FEF3C7':'#FEE2E2';
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:bg, border:`2px solid ${cor}`, borderRadius:12, padding:'10px 20px' }}>
      <span style={{ fontSize:28, fontWeight:900, color:cor }}>{score}</span>
      <div>
        <p style={{ margin:0, fontSize:11, color:cor, fontWeight:600 }}>SCORE ANTI-GLOSA</p>
        <p style={{ margin:0, fontSize:14, color:cor, fontWeight:700 }}>{nivel.toUpperCase()}</p>
      </div>
    </div>
  );
}

// ─── Opções fixas ─────────────────────────────────────────────────────────────
const OPT_INTENCAO = ['Curativa','Paliativa','Adjuvante','Neoadjuvante','Profilática'].map(v=>({valor:v,label:v}));
const OPT_LINHA    = ['1ª Linha','2ª Linha','3ª Linha','4ª Linha ou mais','Manutenção'].map(v=>({valor:v,label:v}));
const OPT_TIPO     = [{valor:'Inicial',label:'Inicial (1ª autorização)'},{valor:'Continuidade',label:'Continuidade (renovação)'},{valor:'Única',label:'Única'}];
const OPT_GRAU     = [{valor:'GX',label:'GX — Não avaliável'},{valor:'G1',label:'G1 — Bem diferenciado'},{valor:'G2',label:'G2 — Moderadamente diferenciado'},{valor:'G3',label:'G3 — Pouco diferenciado'},{valor:'G4',label:'G4 — Indiferenciado'}];
const OPT_LATERAL  = ['Direita','Esquerda','Bilateral','Não se aplica'].map(v=>({valor:v,label:v}));
const OPT_CARÁTER  = [{valor:'Eletivo',label:'Eletivo'},{valor:'Urgência',label:'Urgência'}];

// ─── Base de dados do Assistente Médico ───────────────────────────────────────

const NEOPLASIAS_DB = [
  { sitio:'Mama', icone:'🎀', cor:'#DB2777', itens:[
    { cid:'C50.9', nome:'Carcinoma de mama NE', morfo:'8500/3', diag:'Carcinoma ductal invasivo de mama', lat:'Direita' },
    { cid:'C50.9', nome:'Carcinoma de mama NE (esq)', morfo:'8500/3', diag:'Carcinoma ductal invasivo de mama', lat:'Esquerda' },
    { cid:'C50.9', nome:'Carcinoma lobular invasivo', morfo:'8520/3', diag:'Carcinoma lobular invasivo de mama', lat:'Direita' },
    { cid:'C50.9', nome:'Carcinoma ductal in situ', morfo:'8500/2', diag:'Carcinoma ductal in situ (CDIS) de mama', lat:'Direita' },
    { cid:'C50.9', nome:'Carcinoma triplo-negativo', morfo:'8500/3', diag:'Carcinoma ductal invasivo de mama triplo-negativo (ER-, PR-, HER2-)', lat:'Direita' },
    { cid:'C50.9', nome:'Carcinoma HER2 positivo', morfo:'8500/3', diag:'Carcinoma ductal invasivo de mama HER2 superexpresso', lat:'Direita' },
    { cid:'C50.9', nome:'Carcinoma luminal A', morfo:'8500/3', diag:'Carcinoma ductal invasivo de mama Luminal A (ER+, PR+, HER2-, Ki67 baixo)', lat:'Direita' },
  ]},
  { sitio:'Pulmão', icone:'🫁', cor:'#0284C7', itens:[
    { cid:'C34.1', nome:'Adenocarcinoma lobo superior', morfo:'8140/3', diag:'Adenocarcinoma de pulmão, lobo superior', lat:'Direita' },
    { cid:'C34.9', nome:'Adenocarcinoma NE', morfo:'8140/3', diag:'Adenocarcinoma de pulmão, não especificado', lat:'Não se aplica' },
    { cid:'C34.9', nome:'Carcinoma escamocelular', morfo:'8070/3', diag:'Carcinoma escamocelular de pulmão', lat:'Não se aplica' },
    { cid:'C34.9', nome:'Carcinoma de pequenas células', morfo:'8041/3', diag:'Carcinoma de pequenas células de pulmão (CPPC)', lat:'Não se aplica' },
    { cid:'C34.9', nome:'Carcinoma não-pequenas células', morfo:'8046/3', diag:'Carcinoma de pulmão de não-pequenas células (CPNPC)', lat:'Não se aplica' },
    { cid:'C34.9', nome:'Carcinoma de grandes células', morfo:'8012/3', diag:'Carcinoma de grandes células de pulmão', lat:'Não se aplica' },
  ]},
  { sitio:'Estômago', icone:'🫀', cor:'#B45309', itens:[
    { cid:'C16.9', nome:'Adenocarcinoma gástrico NE', morfo:'8140/3', diag:'Adenocarcinoma de estômago, não especificado', lat:'Não se aplica' },
    { cid:'C16.9', nome:'Adenoca gástrico tipo difuso (Lauren)', morfo:'8490/3', diag:'Adenocarcinoma de células pouco coesas, pouco diferenciado, tipo difuso (Lauren)', lat:'Não se aplica' },
    { cid:'C16.9', nome:'Adenoca gástrico tipo intestinal (Lauren)', morfo:'8144/3', diag:'Adenocarcinoma gástrico do tipo intestinal (Lauren), moderadamente diferenciado', lat:'Não se aplica' },
    { cid:'C16.0', nome:'Adenoca cárdia gástrica', morfo:'8140/3', diag:'Adenocarcinoma da cárdia (junção esofagogástrica)', lat:'Não se aplica' },
    { cid:'C16.3', nome:'Adenoca antro/piloro', morfo:'8140/3', diag:'Adenocarcinoma gástrico de antro/piloro', lat:'Não se aplica' },
    { cid:'C16.9', nome:'Linfoma gástrico MALT', morfo:'9699/3', diag:'Linfoma de zona marginal extraganglionar tipo MALT, gástrico', lat:'Não se aplica' },
    { cid:'C16.9', nome:'GIST gástrico', morfo:'8936/3', diag:'Tumor estromal gastrointestinal (GIST) de estômago', lat:'Não se aplica' },
  ]},
  { sitio:'Cólon / Reto', icone:'🟤', cor:'#92400E', itens:[
    { cid:'C18.9', nome:'Adenocarcinoma de cólon NE', morfo:'8140/3', diag:'Adenocarcinoma de cólon, não especificado', lat:'Não se aplica' },
    { cid:'C18.7', nome:'Adenocarcinoma de sigmóide', morfo:'8140/3', diag:'Adenocarcinoma de cólon sigmóide', lat:'Não se aplica' },
    { cid:'C19.9', nome:'Adenocarcinoma de junção retossigmóide', morfo:'8140/3', diag:'Adenocarcinoma de junção retossigmóide', lat:'Não se aplica' },
    { cid:'C20.9', nome:'Adenocarcinoma de reto NE', morfo:'8140/3', diag:'Adenocarcinoma de reto, não especificado', lat:'Não se aplica' },
    { cid:'C18.0', nome:'Adenocarcinoma de ceco', morfo:'8140/3', diag:'Adenocarcinoma de ceco', lat:'Não se aplica' },
  ]},
  { sitio:'Próstata', icone:'♂', cor:'#1D4ED8', itens:[
    { cid:'C61.9', nome:'Adenocarcinoma de próstata', morfo:'8140/3', diag:'Adenocarcinoma de próstata', lat:'Não se aplica' },
    { cid:'C61.9', nome:'Adenoca próstata Gleason 7 (3+4)', morfo:'8140/3', diag:'Adenocarcinoma de próstata, Gleason 7 (3+4), Grupo Prognóstico 2', lat:'Não se aplica' },
    { cid:'C61.9', nome:'Adenoca próstata Gleason 8', morfo:'8140/3', diag:'Adenocarcinoma de próstata, Gleason 8 (4+4), Grupo Prognóstico 4', lat:'Não se aplica' },
    { cid:'C61.9', nome:'Adenoca próstata alto risco', morfo:'8140/3', diag:'Adenocarcinoma de próstata de alto risco (Gleason ≥8 e/ou PSA >20 e/ou T3)', lat:'Não se aplica' },
    { cid:'C61.9', nome:'Carcinoma próstata metastático', morfo:'8140/3', diag:'Adenocarcinoma de próstata metastático hormônio-sensível (mHSPC)', lat:'Não se aplica' },
  ]},
  { sitio:'Colo do útero', icone:'♀', cor:'#BE185D', itens:[
    { cid:'C53.9', nome:'Carcinoma escamocelular de colo', morfo:'8070/3', diag:'Carcinoma escamocelular de colo do útero', lat:'Não se aplica' },
    { cid:'C53.9', nome:'Adenocarcinoma de colo uterino', morfo:'8140/3', diag:'Adenocarcinoma de colo do útero', lat:'Não se aplica' },
    { cid:'C53.9', nome:'Carcinoma colo uterino localmente avançado', morfo:'8070/3', diag:'Carcinoma escamocelular de colo uterino localmente avançado (IIB-IVA)', lat:'Não se aplica' },
  ]},
  { sitio:'Útero / Endométrio', icone:'🔴', cor:'#9D174D', itens:[
    { cid:'C54.1', nome:'Adenocarcinoma endometrial NE', morfo:'8380/3', diag:'Adenocarcinoma endometrióide de endométrio', lat:'Não se aplica' },
    { cid:'C54.1', nome:'Adenoca endometrial seroso', morfo:'8441/3', diag:'Adenocarcinoma seroso de endométrio (alto grau)', lat:'Não se aplica' },
    { cid:'C55.9', nome:'Sarcoma uterino', morfo:'8805/3', diag:'Sarcoma uterino, não especificado', lat:'Não se aplica' },
  ]},
  { sitio:'Ovário', icone:'⭕', cor:'#7C3AED', itens:[
    { cid:'C56.9', nome:'Adenocarcinoma seroso de ovário', morfo:'8441/3', diag:'Adenocarcinoma seroso de alto grau de ovário (HGSC)', lat:'Bilateral' },
    { cid:'C56.9', nome:'Carcinoma de ovário NE', morfo:'8010/3', diag:'Carcinoma de ovário, não especificado', lat:'Não se aplica' },
    { cid:'C56.9', nome:'Adenoca endometrioides de ovário', morfo:'8380/3', diag:'Adenocarcinoma endometrioides de ovário', lat:'Não se aplica' },
  ]},
  { sitio:'Pâncreas', icone:'🟡', cor:'#D97706', itens:[
    { cid:'C25.9', nome:'Adenocarcinoma ductal de pâncreas', morfo:'8500/3', diag:'Adenocarcinoma ductal de pâncreas, não especificado', lat:'Não se aplica' },
    { cid:'C25.0', nome:'Adenoca cabeça do pâncreas', morfo:'8500/3', diag:'Adenocarcinoma ductal de pâncreas — cabeça', lat:'Não se aplica' },
    { cid:'C25.1', nome:'Adenoca corpo do pâncreas', morfo:'8500/3', diag:'Adenocarcinoma ductal de pâncreas — corpo', lat:'Não se aplica' },
    { cid:'C25.2', nome:'Adenoca cauda do pâncreas', morfo:'8500/3', diag:'Adenocarcinoma ductal de pâncreas — cauda', lat:'Não se aplica' },
    { cid:'C25.9', nome:'Tumor neuroendócrino de pâncreas', morfo:'8150/3', diag:'Tumor neuroendócrino pancreático (PanNET), grau 2', lat:'Não se aplica' },
  ]},
  { sitio:'Fígado', icone:'🟠', cor:'#C2410C', itens:[
    { cid:'C22.0', nome:'Carcinoma hepatocelular (CHC)', morfo:'8170/3', diag:'Carcinoma hepatocelular (CHC)', lat:'Não se aplica' },
    { cid:'C22.1', nome:'Colangiocarcinoma intra-hepático', morfo:'8160/3', diag:'Colangiocarcinoma intra-hepático (CCA)', lat:'Não se aplica' },
    { cid:'C22.9', nome:'Carcinoma de vias biliares NE', morfo:'8160/3', diag:'Carcinoma de vias biliares, não especificado', lat:'Não se aplica' },
  ]},
  { sitio:'Rim', icone:'🫘', cor:'#0F766E', itens:[
    { cid:'C64.9', nome:'Carcinoma de células claras de rim', morfo:'8310/3', diag:'Carcinoma de células claras de rim (ccRCC)', lat:'Direita' },
    { cid:'C64.9', nome:'Carcinoma papilar de rim', morfo:'8260/3', diag:'Carcinoma papilar de rim (pRCC)', lat:'Direita' },
    { cid:'C65.9', nome:'Carcinoma de pelve renal', morfo:'8120/3', diag:'Carcinoma urotelial de pelve renal', lat:'Não se aplica' },
  ]},
  { sitio:'Bexiga', icone:'🔵', cor:'#1E40AF', itens:[
    { cid:'C67.9', nome:'Carcinoma urotelial de bexiga', morfo:'8120/3', diag:'Carcinoma urotelial invasivo de bexiga', lat:'Não se aplica' },
    { cid:'C67.9', nome:'Carcinoma bexiga superficial', morfo:'8120/2', diag:'Carcinoma urotelial de bexiga sem invasão muscular (NMIBC)', lat:'Não se aplica' },
  ]},
  { sitio:'Tireoide', icone:'🦋', cor:'#0891B2', itens:[
    { cid:'C73.9', nome:'Carcinoma papilar de tireoide', morfo:'8260/3', diag:'Carcinoma papilar de tireoide', lat:'Não se aplica' },
    { cid:'C73.9', nome:'Carcinoma folicular de tireoide', morfo:'8330/3', diag:'Carcinoma folicular de tireoide', lat:'Não se aplica' },
    { cid:'C73.9', nome:'Carcinoma medular de tireoide', morfo:'8510/3', diag:'Carcinoma medular de tireoide', lat:'Não se aplica' },
    { cid:'C73.9', nome:'Carcinoma anaplásico de tireoide', morfo:'8020/3', diag:'Carcinoma anaplásico (indiferenciado) de tireoide', lat:'Não se aplica' },
  ]},
  { sitio:'Linfoma', icone:'🔮', cor:'#6D28D9', itens:[
    { cid:'C81.9', nome:'Linfoma de Hodgkin NE', morfo:'9650/3', diag:'Linfoma de Hodgkin clássico, não especificado', lat:'Não se aplica' },
    { cid:'C83.3', nome:'Linfoma difuso grandes células B (DLBCL)', morfo:'9680/3', diag:'Linfoma difuso de grandes células B (DLBCL), NOS', lat:'Não se aplica' },
    { cid:'C85.9', nome:'Linfoma não-Hodgkin NE', morfo:'9591/3', diag:'Linfoma não-Hodgkin, não especificado', lat:'Não se aplica' },
    { cid:'C82.9', nome:'Linfoma folicular NE', morfo:'9690/3', diag:'Linfoma folicular, não especificado', lat:'Não se aplica' },
    { cid:'C91.0', nome:'Leucemia linfocítica aguda (LLA)', morfo:'9835/3', diag:'Leucemia linfoblástica aguda (LLA), não especificado', lat:'Não se aplica' },
    { cid:'C91.1', nome:'Leucemia linfocítica crônica (LLC)', morfo:'9823/3', diag:'Leucemia linfocítica crônica de células B (LLC-B)', lat:'Não se aplica' },
    { cid:'C92.0', nome:'Leucemia mieloide aguda (LMA)', morfo:'9861/3', diag:'Leucemia mieloide aguda (LMA), não especificada', lat:'Não se aplica' },
    { cid:'C92.1', nome:'Leucemia mieloide crônica (LMC)', morfo:'9875/3', diag:'Leucemia mieloide crônica, BCR-ABL1 positiva (LMC-FC)', lat:'Não se aplica' },
    { cid:'C90.0', nome:'Mieloma múltiplo', morfo:'9732/3', diag:'Mieloma múltiplo (plasmocitoma generalizado)', lat:'Não se aplica' },
  ]},
  { sitio:'Cabeça e Pescoço', icone:'👄', cor:'#DC2626', itens:[
    { cid:'C01.9', nome:'Carcinoma de base de língua', morfo:'8070/3', diag:'Carcinoma escamocelular de base de língua', lat:'Não se aplica' },
    { cid:'C09.9', nome:'Carcinoma de amígdala/orofaringe', morfo:'8070/3', diag:'Carcinoma escamocelular de orofaringe', lat:'Não se aplica' },
    { cid:'C10.9', nome:'Carcinoma de orofaringe NE', morfo:'8070/3', diag:'Carcinoma escamocelular de orofaringe, não especificado', lat:'Não se aplica' },
    { cid:'C32.9', nome:'Carcinoma de laringe NE', morfo:'8070/3', diag:'Carcinoma escamocelular de laringe, não especificado', lat:'Não se aplica' },
    { cid:'C11.9', nome:'Carcinoma de nasofaringe', morfo:'8070/3', diag:'Carcinoma nasofaríngeo, não especificado', lat:'Não se aplica' },
  ]},
  { sitio:'Esôfago', icone:'🔴', cor:'#991B1B', itens:[
    { cid:'C15.9', nome:'Carcinoma escamocelular de esôfago', morfo:'8070/3', diag:'Carcinoma escamocelular de esôfago', lat:'Não se aplica' },
    { cid:'C15.9', nome:'Adenocarcinoma de esôfago', morfo:'8140/3', diag:'Adenocarcinoma de esôfago (esôfago de Barrett)', lat:'Não se aplica' },
    { cid:'C15.9', nome:'Carcinoma de JEG', morfo:'8140/3', diag:'Adenocarcinoma de junção esofagogástrica (Siewert II)', lat:'Não se aplica' },
  ]},
  { sitio:'Melanoma', icone:'🌑', cor:'#1C1917', itens:[
    { cid:'C43.9', nome:'Melanoma cutâneo NE', morfo:'8720/3', diag:'Melanoma maligno cutâneo, não especificado', lat:'Não se aplica' },
    { cid:'C43.9', nome:'Melanoma cutâneo espalhamento superficial', morfo:'8743/3', diag:'Melanoma maligno cutâneo de espalhamento superficial', lat:'Não se aplica' },
    { cid:'C43.9', nome:'Melanoma nodular', morfo:'8721/3', diag:'Melanoma nodular', lat:'Não se aplica' },
    { cid:'C69.2', nome:'Melanoma de uveal/ocular', morfo:'8720/3', diag:'Melanoma maligno de coroide/uveal', lat:'Não se aplica' },
  ]},
  { sitio:'Sarcoma', icone:'🦴', cor:'#78350F', itens:[
    { cid:'C49.9', nome:'Sarcoma de partes moles NE', morfo:'8800/3', diag:'Sarcoma de partes moles, não especificado', lat:'Não se aplica' },
    { cid:'C40.9', nome:'Osteossarcoma', morfo:'9180/3', diag:'Osteossarcoma convencional', lat:'Não se aplica' },
    { cid:'C49.9', nome:'Leiomiossarcoma', morfo:'8890/3', diag:'Leiomiossarcoma, não especificado', lat:'Não se aplica' },
    { cid:'C49.9', nome:'Lipossarcoma', morfo:'8850/3', diag:'Lipossarcoma, não especificado', lat:'Não se aplica' },
    { cid:'C49.9', nome:'GIST (partes moles)', morfo:'8936/3', diag:'Tumor estromal gastrointestinal (GIST), alto risco', lat:'Não se aplica' },
  ]},
  { sitio:'Sistema Nervoso', icone:'🧠', cor:'#4338CA', itens:[
    { cid:'C71.9', nome:'Glioblastoma (GBM)', morfo:'9440/3', diag:'Glioblastoma multiforme (GBM) IDH-selvagem', lat:'Não se aplica' },
    { cid:'C71.9', nome:'Astrocitoma grau 3 (IDH mut)', morfo:'9401/3', diag:'Astrocitoma IDH-mutante grau 3', lat:'Não se aplica' },
    { cid:'C71.9', nome:'Meningioma anaplásico', morfo:'9530/3', diag:'Meningioma anaplásico (grau 3)', lat:'Não se aplica' },
  ]},
];

const PROTOCOLOS_DB = [
  { grupo:'Mama', icone:'🎀', itens:[
    { nome:'AC × 4 → Paclitaxel semanal × 12', texto:'AC (Doxorrubicina 60 mg/m² D1 + Ciclofosfamida 600 mg/m² D1) a cada 21 dias × 4 ciclos → Paclitaxel 80 mg/m² D1 semanal × 12 semanas' },
    { nome:'AC × 4 → Paclitaxel + Trastuzumabe (HER2+)', texto:'AC (Doxorrubicina 60 mg/m² + Ciclofosfamida 600 mg/m² D1) a cada 21 dias × 4 ciclos → Paclitaxel 80 mg/m² D1 semanal × 12 semanas + Trastuzumabe 4 mg/kg ataque, 2 mg/kg/sem × 12 semanas, depois 6 mg/kg a cada 21 dias × 14 ciclos' },
    { nome:'Paclitaxel + Pertuzumabe + Trastuzumabe (PHESGO)', texto:'Pertuzumabe + Trastuzumabe SC (PHESGO) + Paclitaxel 80 mg/m² D1 semanal × 12 semanas (neoadjuvante HER2+)' },
    { nome:'CMF × 6 (adjuvante)', texto:'CMF: Ciclofosfamida 100 mg/m² VO D1-D14 + Metotrexato 40 mg/m² EV D1 e D8 + 5-FU 600 mg/m² EV D1 e D8, a cada 28 dias × 6 ciclos' },
    { nome:'Capecitabina (resíduo pós-neoadjuvante)', texto:'Capecitabina 1250 mg/m² 2×/dia VO D1-D14 a cada 21 dias × 8 ciclos (adjuvante pós-NCT — CREATE-X)' },
    { nome:'Olaparibe (BRCA mut metastático)', texto:'Olaparibe 300 mg VO 2×/dia contínuo (mBC HER2-negativo com mutação germline BRCA1/2 — OlympiAD)' },
    { nome:'Palbociclibe + Letrozol (luminal metastático)', texto:'Palbociclibe 125 mg VO D1-D21 + Letrozol 2,5 mg/dia VO contínuo a cada 28 dias (1ª linha RH+/HER2- metastático)' },
    { nome:'Eribulina (linha avançada)', texto:'Eribulina 1,4 mg/m² EV D1 e D8 a cada 21 dias' },
  ]},
  { grupo:'Estômago', icone:'🫀', itens:[
    { nome:'FLOT × 4 (neoadjuvante) + FLOT × 4 (adjuvante)', texto:'FLOT: Docetaxel 50 mg/m² D1 + Oxaliplatina 85 mg/m² D1 + Leucovorina 200 mg/m² D1 + 5-FU 2600 mg/m² IC 24h D1, a cada 14 dias × 4 ciclos pré-op e × 4 ciclos pós-op' },
    { nome:'FOLFOX6 (paliativo 1ª linha)', texto:'Oxaliplatina 85 mg/m² D1 + Leucovorina 400 mg/m² D1 + 5-FU 400 mg/m² bólus D1 + 5-FU 2400 mg/m² IC 46h, a cada 14 dias' },
    { nome:'XELOX / CAPOX (paliativo 1ª linha)', texto:'Oxaliplatina 130 mg/m² D1 + Capecitabina 1000 mg/m² 2×/dia VO D1-D14, a cada 21 dias' },
    { nome:'Ramucirumabe + Paclitaxel (2ª linha)', texto:'Ramucirumabe 8 mg/kg EV D1 e D15 + Paclitaxel 80 mg/m² EV D1, D8 e D15, a cada 28 dias' },
    { nome:'Nivolumabe + XELOX (1ª linha HER2-neg)', texto:'Nivolumabe 360 mg EV D1 + Oxaliplatina 130 mg/m² D1 + Capecitabina 1000 mg/m² 2×/dia D1-D14, a cada 21 dias (CheckMate-649)' },
    { nome:'Trastuzumabe + XELOX (1ª linha HER2+)', texto:'Trastuzumabe 8 mg/kg ataque, 6 mg/kg EV D1 + Oxaliplatina 130 mg/m² D1 + Capecitabina 1000 mg/m² 2×/dia D1-D14, a cada 21 dias (ToGA)' },
    { nome:'Trifluridina/Tipiracil (Lonsurf — ≥3ª linha)', texto:'Trifluridina/Tipiracil 35 mg/m² 2×/dia VO D1-D5 e D8-D12, a cada 28 dias' },
    { nome:'Irinotecan (2ª/3ª linha)', texto:'Irinotecan 150-180 mg/m² EV D1 e D15, a cada 28 dias' },
  ]},
  { grupo:'Cólon / Reto', icone:'🟤', itens:[
    { nome:'FOLFOX4 (adjuvante / 1ª linha)', texto:'Oxaliplatina 85 mg/m² D1 + Leucovorina 200 mg/m² D1 e D2 + 5-FU 400 mg/m² bólus D1-D2 + 5-FU 600 mg/m² IC 22h D1-D2, a cada 14 dias × 12 ciclos' },
    { nome:'FOLFIRI (1ª/2ª linha metastático)', texto:'Irinotecan 180 mg/m² D1 + Leucovorina 400 mg/m² D1 + 5-FU 400 mg/m² bólus D1 + 5-FU 2400 mg/m² IC 46h, a cada 14 dias' },
    { nome:'FOLFOXIRI + Bevacizumabe (1ª linha mCRC agressivo)', texto:'Oxaliplatina 85 mg/m² D1 + Irinotecan 165 mg/m² D1 + Leucovorina 200 mg/m² D1 + 5-FU 3200 mg/m² IC 48h + Bevacizumabe 5 mg/kg D1, a cada 14 dias' },
    { nome:'CAPOX (adjuvante / 1ª linha)', texto:'Oxaliplatina 130 mg/m² D1 + Capecitabina 1000 mg/m² 2×/dia D1-D14, a cada 21 dias × 8 ciclos' },
    { nome:'Capecitabina (adjuvante idoso / intolerante)', texto:'Capecitabina 1250 mg/m² 2×/dia VO D1-D14, a cada 21 dias × 8 ciclos' },
    { nome:'Pembrolizumabe (1ª linha MSI-H/dMMR)', texto:'Pembrolizumabe 200 mg EV D1, a cada 21 dias (mCRC MSI-H — KEYNOTE-177)' },
    { nome:'Trifluridina/Tipiracil + Bevacizumabe (≥3ª linha)', texto:'Trifluridina/Tipiracil 35 mg/m² 2×/dia VO D1-D5 e D8-D12 + Bevacizumabe 5 mg/kg D1 e D15, a cada 28 dias (SUNLIGHT)' },
    { nome:'Quimiorradioterapia neoadjuvante reto (longa)', texto:'Capecitabina 825 mg/m² 2×/dia VO nos dias de radioterapia + RT 50 Gy (25 frações) — aguardar 6-8 semanas para cirurgia' },
  ]},
  { grupo:'Pulmão CPNPC', icone:'🫁', itens:[
    { nome:'Carboplatina + Paclitaxel (1ª linha sem driver)', texto:'Carboplatina AUC 6 D1 + Paclitaxel 200 mg/m² D1, a cada 21 dias × 4-6 ciclos' },
    { nome:'Pemetrexede + Carboplatina (adenoca — 1ª linha)', texto:'Pemetrexede 500 mg/m² D1 + Carboplatina AUC 5 D1, a cada 21 dias × 4 ciclos → manutenção Pemetrexede 500 mg/m² D1 a cada 21 dias até progressão' },
    { nome:'Pembrolizumabe monot. (PD-L1 ≥50% — 1ª linha)', texto:'Pembrolizumabe 200 mg EV D1, a cada 21 dias (KEYNOTE-024/042)' },
    { nome:'Pembrolizumabe + Pemetrexede + Platina (1ª linha)', texto:'Pembrolizumabe 200 mg D1 + Pemetrexede 500 mg/m² D1 + Carboplatina AUC 5 D1, a cada 21 dias × 4 ciclos → manutenção Pembrolizumabe + Pemetrexede' },
    { nome:'Osimertinibe (EGFR mut — 1ª linha)', texto:'Osimertinibe 80 mg VO 1×/dia contínuo (EGFR ex19del/L858R — FLAURA)' },
    { nome:'Alectinibe (ALK+ — 1ª linha)', texto:'Alectinibe 600 mg VO 2×/dia contínuo (ALK+ — ALEX)' },
    { nome:'Docetaxel (2ª linha)', texto:'Docetaxel 75 mg/m² EV D1, a cada 21 dias' },
    { nome:'Durvalumabe manutenção (estágio III irressecável)', texto:'Durvalumabe 10 mg/kg EV D1 e D15, a cada 28 dias × 12 meses (pós-quimiorradioterapia definitiva — PACIFIC)' },
  ]},
  { grupo:'Mama (hormônio-sensível)', icone:'🎀', itens:[
    { nome:'Abemaciclib + Letrozol (1ª linha RH+/HER2-)', texto:'Abemaciclib 150 mg VO 2×/dia contínuo + Letrozol 2,5 mg/dia VO contínuo, a cada 28 dias (MONARCH-3)' },
    { nome:'Ribociclibe + Letrozol (1ª linha RH+/HER2-)', texto:'Ribociclibe 600 mg VO D1-D21 + Letrozol 2,5 mg/dia VO contínuo, a cada 28 dias (MONALEESA-2)' },
    { nome:'Exemestano + Everolimus (2ª linha)', texto:'Everolimus 10 mg/dia VO contínuo + Exemestano 25 mg/dia VO contínuo (BOLERO-2)' },
  ]},
  { grupo:'Próstata', icone:'♂', itens:[
    { nome:'Docetaxel + Prednisona (mCRPC 1ª linha)', texto:'Docetaxel 75 mg/m² EV D1 + Prednisona 5 mg VO 2×/dia, a cada 21 dias × 10 ciclos' },
    { nome:'Cabazitaxel + Prednisona (mCRPC 2ª linha)', texto:'Cabazitaxel 25 mg/m² EV D1 + Prednisona 10 mg/dia VO contínuo, a cada 21 dias' },
    { nome:'Abiraterona + Prednisona (mCRPC)', texto:'Abiraterona 1000 mg VO 1×/dia em jejum + Prednisona 5 mg VO 2×/dia, contínuo' },
    { nome:'Enzalutamida (mCRPC pós-docetaxel)', texto:'Enzalutamida 160 mg VO 1×/dia contínuo' },
    { nome:'Docetaxel × 6 + ADT (mHSPC)', texto:'Docetaxel 75 mg/m² D1 + Prednisona 5 mg 2×/dia, a cada 21 dias × 6 ciclos + ADT contínua (CHAARTED/STAMPEDE)' },
  ]},
  { grupo:'Colo do útero', icone:'♀', itens:[
    { nome:'Cisplatina semanal + RT (concomitante)', texto:'Cisplatina 40 mg/m² EV D1 semanal × 5 ciclos concomitante à radioterapia 45-50 Gy' },
    { nome:'Carboplatina + Paclitaxel + Bevacizumabe (metastático)', texto:'Carboplatina AUC 5 D1 + Paclitaxel 175 mg/m² D1 + Bevacizumabe 15 mg/kg D1, a cada 21 dias (GOG-240)' },
    { nome:'Pembrolizumabe + Quimio (1ª linha mCEC PD-L1+)', texto:'Pembrolizumabe 200 mg D1 + Carboplatina AUC 5 D1 + Paclitaxel 175 mg/m² D1 ± Bevacizumabe 15 mg/kg D1, a cada 21 dias (KEYNOTE-826)' },
  ]},
  { grupo:'Linfoma / Hematologia', icone:'🔮', itens:[
    { nome:'RCHOP (DLBCL 1ª linha)', texto:'Rituximabe 375 mg/m² D1 + Ciclofosfamida 750 mg/m² D1 + Doxorrubicina 50 mg/m² D1 + Vincristina 1,4 mg/m² (máx 2 mg) D1 + Prednisona 100 mg VO D1-D5, a cada 21 dias × 6-8 ciclos' },
    { nome:'ABVD (Linfoma Hodgkin 1ª linha)', texto:'Doxorrubicina 25 mg/m² D1 e D15 + Bleomicina 10 UI/m² D1 e D15 + Vinblastina 6 mg/m² D1 e D15 + Dacarbazina 375 mg/m² D1 e D15, a cada 28 dias × 4-6 ciclos' },
    { nome:'BEP (tumores germinativos)', texto:'Bleomicina 30 UI EV D1, D8 e D15 + Etoposido 100 mg/m² D1-D5 + Cisplatina 20 mg/m² D1-D5, a cada 21 dias × 3-4 ciclos' },
    { nome:'Imatinibe (LMC FC)', texto:'Imatinibe 400 mg VO 1×/dia contínuo (LMC em fase crônica)' },
    { nome:'Ibrutinibe (LLC/linfoma manto)', texto:'Ibrutinibe 420 mg VO 1×/dia contínuo (LLC ou linfoma do manto)' },
    { nome:'Bortezomibe + Ciclofosfamida + Dexametasona (mieloma)', texto:'VCD: Bortezomibe 1,3 mg/m² SC D1, D8, D15, D22 + Ciclofosfamida 300 mg/m² VO D1, D8, D15, D22 + Dexametasona 40 mg VO D1, D8, D15, D22, a cada 28 dias × 4-6 ciclos' },
    { nome:'Daratumumabe + VMP (mieloma 1ª linha)', texto:'Daratumumabe 16 mg/kg EV D1,8,15,22 (ciclo 1-2), D1,15 (ciclo 3-6), D1 (ciclo ≥7) + Bortezomibe + Melfalan + Prednisona × 9 ciclos' },
  ]},
  { grupo:'Pâncreas', icone:'🟡', itens:[
    { nome:'FOLFIRINOX (1ª linha metastático PS0-1)', texto:'Oxaliplatina 85 mg/m² D1 + Irinotecan 180 mg/m² D1 + Leucovorina 400 mg/m² D1 + 5-FU 400 mg/m² bólus D1 + 5-FU 2400 mg/m² IC 46h, a cada 14 dias' },
    { nome:'Gemcitabina + nab-Paclitaxel (1ª linha)', texto:'Gemcitabina 1000 mg/m² + nab-Paclitaxel 125 mg/m² EV D1, D8 e D15, a cada 28 dias' },
    { nome:'Gemcitabina monoterapia (2ª linha / PS2)', texto:'Gemcitabina 1000 mg/m² EV D1, D8 e D15, a cada 28 dias' },
    { nome:'Gemcitabina + Capecitabina (adjuvante)', texto:'Gemcitabina 1000 mg/m² EV D1, D8 e D15 + Capecitabina 830 mg/m² 2×/dia VO D1-D21, a cada 28 dias × 6 ciclos (ESPAC-4)' },
    { nome:'Olaparibe manutenção (BRCA mut metastático)', texto:'Olaparibe 300 mg VO 2×/dia contínuo (manutenção após platina — POLO)' },
  ]},
  { grupo:'Fígado / Vias Biliares', icone:'🟠', itens:[
    { nome:'Sorafenibe (CHC 1ª linha — SHARP)', texto:'Sorafenibe 400 mg VO 2×/dia contínuo (CHC Child-Pugh A, BCLC B/C)' },
    { nome:'Atezolizumabe + Bevacizumabe (CHC 1ª linha — IMbrave150)', texto:'Atezolizumabe 1200 mg EV D1 + Bevacizumabe 15 mg/kg EV D1, a cada 21 dias' },
    { nome:'Durvalumabe + Tremelimumabe (CHC — HIMALAYA)', texto:'Durvalumabe 1500 mg + Tremelimumabe 300 mg D1 (dose única) → Durvalumabe 1500 mg EV D1, a cada 28 dias' },
    { nome:'Gemcitabina + Cisplatina (colangiocarcinoma 1ª linha)', texto:'Gemcitabina 1000 mg/m² EV D1 e D8 + Cisplatina 25 mg/m² EV D1 e D8, a cada 21 dias × 8 ciclos' },
    { nome:'Gemcitabina + Cisplatina + Durvalumabe (CCA — TOPAZ-1)', texto:'Gemcitabina 1000 mg/m² D1 e D8 + Cisplatina 25 mg/m² D1 e D8 + Durvalumabe 1500 mg D1, a cada 21 dias × 8 ciclos → Durvalumabe manutenção' },
    { nome:'Pemigatinibe (CCA FGFR2 — 2ª linha)', texto:'Pemigatinibe 13,5 mg VO D1-D14, a cada 21 dias (CCA intra-hepático com fusão/rearranjo FGFR2)' },
  ]},
  { grupo:'Rim / Bexiga', icone:'🫘', itens:[
    { nome:'Sunitinibe (RCC 1ª linha)', texto:'Sunitinibe 50 mg VO D1-D28, a cada 42 dias (esquema 4/2)' },
    { nome:'Nivolumabe + Ipilimumabe (RCC 1ª linha risco inter/alto)', texto:'Nivolumabe 3 mg/kg + Ipilimumabe 1 mg/kg EV D1, a cada 21 dias × 4 ciclos → Nivolumabe 480 mg D1, a cada 28 dias' },
    { nome:'Pembrolizumabe + Axitinibe (RCC 1ª linha)', texto:'Pembrolizumabe 200 mg EV D1, a cada 21 dias + Axitinibe 5 mg VO 2×/dia contínuo (KEYNOTE-426)' },
    { nome:'Carboplatina + Gencitabina (bexiga 1ª linha PS≥2)', texto:'Carboplatina AUC 4,5 D1 + Gemcitabina 1000 mg/m² D1 e D8, a cada 21 dias × 4-6 ciclos' },
    { nome:'Cisplatina + Gemcitabina (bexiga 1ª linha)', texto:'Cisplatina 70 mg/m² D1 + Gemcitabina 1000 mg/m² D1 e D8, a cada 21 dias × 4-6 ciclos' },
    { nome:'Pembrolizumabe (bexiga 2ª linha)', texto:'Pembrolizumabe 200 mg EV D1, a cada 21 dias (pós-platina — KEYNOTE-045)' },
  ]},
  { grupo:'Ovário', icone:'⭕', itens:[
    { nome:'Carboplatina + Paclitaxel (1ª linha)', texto:'Carboplatina AUC 5-6 D1 + Paclitaxel 175 mg/m² EV D1, a cada 21 dias × 6 ciclos ± Bevacizumabe 15 mg/kg D1 → manutenção Bevacizumabe' },
    { nome:'Olaparibe manutenção (BRCA mut ou HRD+ — 1ª linha)', texto:'Olaparibe 300 mg VO 2×/dia contínuo × 24 meses (SOLO-1)' },
    { nome:'Niraparibe manutenção (resposta platina)', texto:'Niraparibe 200-300 mg VO 1×/dia contínuo (manutenção pós-platina)' },
    { nome:'Carboplatina + Gemcitabina + Bevacizumabe (platino-sensível)', texto:'Carboplatina AUC 4 D1 + Gemcitabina 1000 mg/m² D1 e D8 + Bevacizumabe 15 mg/kg D1, a cada 21 dias → manutenção Bevacizumabe' },
    { nome:'Doxorrubicina lipossomal (platino-resistente)', texto:'Doxorrubicina lipossomal peguilada (PLD) 40 mg/m² EV D1, a cada 28 dias' },
  ]},
];

const EXAMES_FISICOS_DB = [
  { label:'Regular EG — Gástrico/Digestivo', texto:'Regular estado geral, BNF2T, murmúrio vesicular levemente reduzido bilateralmente, abdômen globoso, flácido, indolor no momento da palpação, sem sinais de peritonismo, vigil e responsivo.' },
  { label:'Regular EG — Geral (oncológico)', texto:'Regular estado geral, descorado (2+/4+), hidratado, acianótico, anictérico, afebril, eupneico em ar ambiente. BNF2T, MV presente bilateralmente sem ruídos adventícios. Abdômen plano, flácido, indolor, RHA presentes. MMII sem edemas. Vigil, orientado, responsivo.' },
  { label:'Bom EG — Ambulatorial', texto:'Bom estado geral, corado, hidratado, acianótico, anictérico, afebril, eupneico. BNF2T, MV bem ventilado bilateralmente. Abdômen plano, flácido, indolor à palpação superficial e profunda, sem visceromegalias, RHA presentes. Sem edemas periféricos. Vigil, orientado e colaborativo.' },
  { label:'Mau EG — Paciente debilitado', texto:'Mau estado geral, hipocorado (3+/4+), desidratado (+/4+), acianótico, ictérico (1+/4+), febril (Ta: 38,2°C), taquicárdico (FC 108 bpm). BNF2T, MV reduzido na base esquerda. Abdômen distendido, tenso, doloroso difusamente, sinal de Blumberg ausente. MMII com edema (2+/4+). Sonolento, mas orientado.' },
  { label:'ECOG 2 — Limitação moderada', texto:'Regular estado geral, emagrecido, ECOG 2 (limitado para atividades físicas moderadas, em pé mais de 50% do dia). BNF2T, MV presente bilateralmente. Abdômen levemente distendido, doloroso à palpação profunda em hipocôndrio direito. Sem edemas MMII. Vigil e colaborativo.' },
  { label:'ECOG 3 — Acamado > 50% do dia', texto:'Regular a mau estado geral, emagrecido acentuado, ECOG 3 (capaz de cuidar de si mesmo, acamado ou em cadeira > 50% do dia). Mucosite grau 2. BNF2T, MV reduzido em bases. Abdômen com ascite de moderado volume (+/4+). MMII com edema (2+/4+). Vigil, comunicativo.' },
  { label:'Caquexia oncológica', texto:'Mau estado geral, caquético, IMC estimado < 16 kg/m², marcante perda de peso relatada (> 10% em 6 meses). Mucosite grau 1-2. BNF2T, taquicárdico. Abdômen com hepatomegalia palpável a 4 cm do RCD, doloroso. Ascite volumosa. MMII com edema (3+/4+). Confuso, mas responsivo a estímulos.' },
  { label:'Pós-cirúrgico — Abdômen operado', texto:'Regular estado geral, corado, hidratado. Ferida operatória em região epigástrica/abdominal com cicatrização satisfatória, sem sinais de infecção local. BNF2T, MV presente bilateralmente. Abdômen com sinal de incisão prévia, flácido, levemente doloroso à palpação profunda em região periumbilical. RHA presentes hipoativos. Sem ascite. Vigil, orientado.' },
  { label:'Neutropenia febril', texto:'Regular estado geral, febril (Ta: 38,8°C), taquicárdico (FC 112 bpm), PA: 100/60 mmHg, SpO2: 95% AA. Palidez cutâneo-mucosa intensa. BNF2T, MV reduzido em base direita com macicez à percussão. Abdômen flácido, indolor, sem visceromegalias. Mucosa oral com úlceras (mucosite grau 3). MMII sem edemas. Vigil, ansioso.' },
  { label:'Exame sumário oncológico', texto:'EG: regular. Descorado (+/4+). Sem linfonodomegalias palpáveis. Mamas: sem nódulos. Abdômen: sem visceromegalias. MMII: sem edemas. Neurológico: preservado. PS/ECOG a definir conforme consulta.' },
];

// ─── Componente Assistente Médico (Aba) ────────────────────────────────────────
function AssistenteMedicoAba({ onSelecionarNeoplasia, onSelecionarProtocolo, onSelecionarExame, apac }) {
  const [secao, setSecao] = useState('neoplasia'); // 'neoplasia' | 'protocolo' | 'exame'
  const [neoplSitioAberto, setNeoplSitioAberto] = useState(null);
  const [protoGrupoAberto, setProtoGrupoAberto] = useState(null);
  const [flash, setFlash] = useState(null);

  const confirmar = (tipo, label) => {
    setFlash(`✅ ${label}`);
    setTimeout(() => setFlash(null), 2500);
  };

  const btnSec = (key, label) => (
    <button type="button" onClick={() => setSecao(key)} style={{
      flex: 1, padding: '9px 4px', border: 'none', borderRadius: 8, fontSize: 12,
      fontWeight: 700, cursor: 'pointer',
      background: secao === key ? N : 'transparent',
      color: secao === key ? 'white' : '#475569',
    }}>{label}</button>
  );

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      {/* Cabeçalho */}
      <div style={{ background: N, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: G }}>🩺 Assistente Médico</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginLeft: 4 }}>Clique para preencher a APAC automaticamente</span>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 2, padding: '8px 10px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
        {btnSec('neoplasia', '🎯 Sítio da Neoplasia')}
        {btnSec('protocolo', '💊 Protocolo de QT')}
        {btnSec('exame', '🩺 Exame Físico')}
      </div>

      {/* Flash feedback */}
      {flash && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '8px 18px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #A7F3D0' }}>
          {flash}
        </div>
      )}

      <div style={{ padding: 14, maxHeight: 520, overflowY: 'auto' }}>

        {/* ── SÍTIO DA NEOPLASIA ── */}
        {secao === 'neoplasia' && (
          <div>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, marginTop: 0 }}>
              Selecione o sítio → escolha o subtipo → preenche CID-10, diagnóstico, morfologia e lateralidade.
            </p>
            {NEOPLASIAS_DB.map(grupo => (
              <div key={grupo.sitio} style={{ marginBottom: 8, border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                <button type="button" onClick={() => setNeoplSitioAberto(neoplSitioAberto === grupo.sitio ? null : grupo.sitio)}
                  style={{ width: '100%', padding: '10px 14px', background: neoplSitioAberto === grupo.sitio ? grupo.cor : '#F8FAFC',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: neoplSitioAberto === grupo.sitio ? 'white' : '#1F2937' }}>
                    {grupo.icone} {grupo.sitio}
                  </span>
                  <span style={{ fontSize: 11, color: neoplSitioAberto === grupo.sitio ? 'rgba(255,255,255,.7)' : '#9CA3AF' }}>
                    {grupo.itens.length} subtipos {neoplSitioAberto === grupo.sitio ? '▲' : '▼'}
                  </span>
                </button>
                {neoplSitioAberto === grupo.sitio && (
                  <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, background: '#FAFAFA' }}>
                    {grupo.itens.map((item, i) => (
                      <button key={i} type="button" onClick={() => { onSelecionarNeoplasia(item); confirmar('neoplasia', item.nome); }}
                        style={{ padding: '9px 12px', background: 'white', border: `1px solid ${grupo.cor}40`,
                          borderLeft: `4px solid ${grupo.cor}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                          transition: 'background .12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = `${grupo.cor}12`}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#111827' }}>{item.nome}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                          CID: <strong style={{ color: grupo.cor }}>{item.cid}</strong> · Morfologia: <strong>{item.morfo}</strong>
                          {item.lat !== 'Não se aplica' && <> · Lat: <strong>{item.lat}</strong></>}
                        </div>
                        <div style={{ fontSize: 11, color: '#374151', marginTop: 3, fontStyle: 'italic' }}>{item.diag}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── PROTOCOLO DE QT ── */}
        {secao === 'protocolo' && (
          <div>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, marginTop: 0 }}>
              Escolha o grupo tumoral → selecione o protocolo → preenche "Esquema terapêutico" na APAC.
            </p>
            {PROTOCOLOS_DB.map(grupo => (
              <div key={grupo.grupo} style={{ marginBottom: 8, border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                <button type="button" onClick={() => setProtoGrupoAberto(protoGrupoAberto === grupo.grupo ? null : grupo.grupo)}
                  style={{ width: '100%', padding: '10px 14px', background: protoGrupoAberto === grupo.grupo ? T : '#F8FAFC',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: protoGrupoAberto === grupo.grupo ? 'white' : '#1F2937' }}>
                    {grupo.icone} {grupo.grupo}
                  </span>
                  <span style={{ fontSize: 11, color: protoGrupoAberto === grupo.grupo ? 'rgba(255,255,255,.7)' : '#9CA3AF' }}>
                    {grupo.itens.length} protocolos {protoGrupoAberto === grupo.grupo ? '▲' : '▼'}
                  </span>
                </button>
                {protoGrupoAberto === grupo.grupo && (
                  <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, background: '#FAFAFA' }}>
                    {grupo.itens.map((proto, i) => (
                      <button key={i} type="button" onClick={() => { onSelecionarProtocolo(proto.texto); confirmar('protocolo', proto.nome); }}
                        style={{ padding: '9px 12px', background: 'white', border: `1px solid ${T}40`,
                          borderLeft: `4px solid ${T}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#111827' }}>{proto.nome}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3, lineHeight: 1.5 }}>{proto.texto}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── EXAME FÍSICO ── */}
        {secao === 'exame' && (
          <div>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, marginTop: 0 }}>
              Clique em um modelo → preenche "Resumo da Anamnese e Exame Físico" na APAC. Você pode editar após inserção.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EXAMES_FISICOS_DB.map((ef, i) => (
                <button key={i} type="button" onClick={() => { onSelecionarExame(ef.texto); confirmar('exame', ef.label); }}
                  style={{ padding: '11px 14px', background: 'white', border: '1px solid #E5E7EB',
                    borderLeft: `4px solid #059669`, borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ECFDF5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#065F46', marginBottom: 4 }}>🩺 {ef.label}</div>
                  <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>{ef.texto}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ConferenciaAPAC({ apacInicial, pac, onSalvar, onVoltar }) {
  const [apac, setApac] = useState(()=>{
    // Se receber dados do pac, preenche automaticamente
    const novo = agenteAPAC.criarNovaAPAC('Inicial');
    if(pac){
      const dataNascimento=pac.nasc&&/^\d{2}\/\d{2}\/\d{4}$/.test(pac.nasc)?pac.nasc.split('/').reverse().join('-'):(pac.nasc||'');
      const sexo=pac.sexo==='Feminino'?'F':pac.sexo==='Masculino'?'M':(pac.sexo||'F');
      const enderecoResidencia=pac.endereco||[
        [pac.tipo_logradouro,pac.logradouro].filter(Boolean).join(' '),
        pac.numero?`nº ${pac.numero}`:'',
        pac.complemento||'',
        pac.bairro?`Bairro ${pac.bairro}`:'',
      ].filter(Boolean).join(', ');
      return agenteAPAC.preencherDoProntuario(novo,{
        paciente:{ nomePaciente:pac.nome||'', cns:pac.cns||'', dataNascimento,
          sexo, nomeMaeResponsavel:pac.mae||pac.responsavel_nome||'',
          municipioResidencia:pac.cidade||'', uf:pac.uf||'PB', cep:pac.cep||'',
          telefoneContato:pac.tel||pac.telefone_celular||pac.responsavel_telefone||'', enderecoResidencia,
          numeroProntuario:pac.prontuario||pac.pacID||'', codigoIBGEMunicipio:pac.municipio_cod||'2510600',
        },
        cid10:pac.cid||pac.cid_sugerido||'',
        diagnosticoHP:pac.diag||'',
        tnm:pac.estadio?{t:pac.tnm?.split(/N/i)[0]?.replace(/T/i,'')||'',n:pac.tnm?.match(/N(\w+)/i)?.[1]||'',m:pac.tnm?.match(/M(\w+)/i)?.[1]||'',estadio:pac.estadio||''}:undefined,
        intencao:pac.intencao||'Curativa',
        linha:pac.linha||'1ª Linha',
        esquema:pac.trat||'',
      });
    }
    return apacInicial||novo;
  });
  const [aba, setAba] = useState('editor');
  const [salvo, setSalvo] = useState(false);

  const { score, nivel, erros } = agenteAPAC.calcularScoreAntiGlosa(apac);
  const bloqueantes = erros.filter(e=>e.nivel==='Bloqueante');
  const alertas     = erros.filter(e=>e.nivel==='Alerta');

  const setPaciente    = useCallback((campo,valor)=>{ setApac(a=>({...a,paciente:{...a.paciente,[campo]:valor}})); setSalvo(false); },[]);
  const setClinicos    = useCallback((campo,valor)=>{ setApac(a=>({...a,dadosClinicos:{...a.dadosClinicos,[campo]:valor}})); setSalvo(false); },[]);
  const setAutorizacao = useCallback((campo,valor)=>{ setApac(a=>({...a,autorizacao:{...a.autorizacao,[campo]:valor}})); setSalvo(false); },[]);

  const adicionarProc = ()=>setApac(a=>({...a,procedimentos:[...a.procedimentos,{codigo:'',nome:'',quantidade:1,tipo:a.procedimentos.length===0?'Principal':'Secundário'}]}));
  const removerProc   = idx=>setApac(a=>({...a,procedimentos:a.procedimentos.filter((_,i)=>i!==idx)}));
  const setProc = (idx,campo,valor)=>setApac(a=>({...a,procedimentos:a.procedimentos.map((p,i)=>i===idx?{...p,[campo]:valor}:p)}));

  const erroField = campo => erros.find(e=>e.campo===campo)?.mensagem;

  const salvar = ()=>{
    if(bloqueantes.length>0){ alert(`APAC com ${bloqueantes.length} campo(s) obrigatório(s) não preenchido(s).`); return; }
    console.info('[APACApp] APAC salva:',agenteAPAC.exportarJSON(apac));
    setSalvo(true);
    setApac(a=>({...a,autorizacao:{...a.autorizacao,status:'Pendente'}}));
    if(onSalvar)onSalvar(apac);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F0F9FF', fontFamily:"'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background:N, padding:'14px 20px', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {onVoltar&&<button onClick={onVoltar} style={{ background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'white', padding:'8px 14px', borderRadius:8, fontSize:13, cursor:'pointer', fontWeight:600 }}>← Voltar</button>}
            <div>
              <p style={{ color:'#93C5FD', fontSize:11, margin:0 }}>APACApp — Hospital do Bem · CNES 2605473</p>
              <h1 style={{ color:'white', fontSize:17, fontWeight:700, margin:'2px 0 0' }}>📋 Conferência da APAC Oncológica</h1>
            </div>
          </div>
          <BadgeScore score={score} nivel={nivel} />
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 16px 80px' }}>

        {/* Painel anti-glosa */}
        {(bloqueantes.length>0||alertas.length>0)&&(
          <div style={{ background:bloqueantes.length>0?'#FEF2F2':'#FFFBEB', border:`1px solid ${bloqueantes.length>0?'#FECACA':'#FDE68A'}`, borderRadius:12, padding:16, marginBottom:20 }}>
            <p style={{ fontWeight:700, fontSize:14, margin:'0 0 10px', color:bloqueantes.length>0?'#991B1B':'#92400E' }}>
              {bloqueantes.length>0?`⛔ ${bloqueantes.length} campo(s) bloqueante(s) — APAC não pode ser enviada`:`⚠️ ${alertas.length} alerta(s) — verificar antes de enviar`}
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {[...bloqueantes,...alertas].map((e,i)=>(
                <span key={i} style={{ fontSize:12, padding:'3px 10px', borderRadius:20, fontWeight:600,
                  background:e.nivel==='Bloqueante'?'#FEE2E2':'#FEF3C7',
                  color:e.nivel==='Bloqueante'?'#991B1B':'#92400E',
                  border:`1px solid ${e.nivel==='Bloqueante'?'#FECACA':'#FDE68A'}`,
                }}>
                  {e.mensagem}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Abas */}
        <div style={{ display:'flex', gap:2, marginBottom:20, background:'#E2E8F0', borderRadius:10, padding:4 }}>
          {[
            {key:'assistente',label:'🩺 Assistente'},
            {key:'editor',label:'✏️ Editor da APAC'},
            {key:'laudo',label:'📄 Visualizar Laudo'},
            {key:'json',label:'⬇️ Exportar JSON'},
          ].map(a=>(
            <button key={a.key} type="button" onClick={()=>setAba(a.key)} style={{
              flex:1, padding:10, border:'none', borderRadius:8, fontSize:13, fontWeight:700,
              cursor:'pointer', transition:'all 0.15s',
              background:aba===a.key?(a.key==='assistente'?'#059669':N):'transparent',
              color:aba===a.key?'white':'#475569',
            }}>{a.label}</button>
          ))}
        </div>

        {/* ── ABA ASSISTENTE ──────────────────────────────────────────────── */}
        {aba==='assistente'&&(
          <AssistenteMedicoAba
            apac={apac}
            onSelecionarNeoplasia={item=>{
              setClinicos('cid10Principal', item.cid);
              setClinicos('diagnosticoHistopatologico', item.diag);
              setClinicos('morfologiaCIDO', item.morfo);
              if(item.lat && item.lat!=='Não se aplica') setClinicos('lateralidade', item.lat);
              // Ativa aba editor para ver resultado
            }}
            onSelecionarProtocolo={texto=>{
              setClinicos('esquemaTerapeutico', texto);
            }}
            onSelecionarExame={texto=>{
              setClinicos('resumoAnamneseExameFisico', texto);
            }}
          />
        )}

        {/* ── ABA EDITOR ──────────────────────────────────────────────────── */}
        {aba==='editor'&&(
          <div>
            {/* Tipo e Competência */}
            <Secao titulo="Tipo e Competência" icone="📅">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <CampoAPAC label="Tipo de APAC" valor={apac.autorizacao.tipoAPAC} obrigatorio tipo="select" opcoes={OPT_TIPO} onChange={v=>setAutorizacao('tipoAPAC',v)} />
                <CampoAPAC label="Caráter" valor={apac.autorizacao.caraterAtendimento} tipo="select" opcoes={OPT_CARÁTER} onChange={v=>setAutorizacao('caraterAtendimento',v)} />
                <CampoAPAC label="Competência (MM/AAAA)" valor={apac.autorizacao.competencia} obrigatorio placeholder="06/2026" onChange={v=>setAutorizacao('competencia',v)} />
                <CampoAPAC label="Data da solicitação" valor={apac.autorizacao.datasolicitacao} tipo="date" onChange={v=>setAutorizacao('datasolicitacao',v)} />
                <CampoAPAC label="Início da validade" valor={apac.autorizacao.periodoValidadeInicio} tipo="date" onChange={v=>setAutorizacao('periodoValidadeInicio',v)} />
                <CampoAPAC label="Fim da validade" valor={apac.autorizacao.periodoValidadeFim} tipo="date" onChange={v=>setAutorizacao('periodoValidadeFim',v)} />
              </div>
            </Secao>

            {/* Paciente */}
            <Secao titulo="Dados do Paciente" icone="👤">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <CampoAPAC label="Nome completo" valor={apac.paciente.nomePaciente} obrigatorio onChange={v=>setPaciente('nomePaciente',v)} erro={erroField('nomePaciente')} />
                </div>
                <CampoAPAC label="CNS (15 dígitos)" valor={apac.paciente.cns} obrigatorio onChange={v=>setPaciente('cns',v.replace(/\D/g,'').slice(0,15))} erro={erroField('cns')} />
                <CampoAPAC label="Nº Prontuário" valor={apac.paciente.numeroProntuario} onChange={v=>setPaciente('numeroProntuario',v)} />
                <CampoAPAC label="Data de nascimento" valor={apac.paciente.dataNascimento} obrigatorio tipo="date" onChange={v=>setPaciente('dataNascimento',v)} erro={erroField('dataNascimento')} />
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:700, color:N, marginBottom:4 }}>Sexo <span style={{ color:G }}>*</span></label>
                  <div style={{ display:'flex', gap:8 }}>
                    {[{v:'F',l:'♀ Feminino'},{v:'M',l:'♂ Masculino'}].map(op=>(
                      <button key={op.v} type="button" onClick={()=>setPaciente('sexo',op.v)} style={{
                        flex:1, padding:10, border:'2px solid', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer',
                        borderColor:apac.paciente.sexo===op.v?T:'#D1D5DB',
                        background:apac.paciente.sexo===op.v?T:'white',
                        color:apac.paciente.sexo===op.v?'white':'#374151',
                      }}>{op.l}</button>
                    ))}
                  </div>
                </div>
                <CampoAPAC label="Nome da mãe" valor={apac.paciente.nomeMaeResponsavel} obrigatorio onChange={v=>setPaciente('nomeMaeResponsavel',v)} erro={erroField('nomeMaeResponsavel')} />
                <CampoAPAC label="Telefone" valor={apac.paciente.telefoneContato||''} onChange={v=>setPaciente('telefoneContato',v)} />
                <CampoAPAC label="Município de residência" valor={apac.paciente.municipioResidencia} obrigatorio onChange={v=>setPaciente('municipioResidencia',v)} />
                <CampoAPAC label="Código IBGE" valor={apac.paciente.codigoIBGEMunicipio} placeholder="Ex: 2510600" onChange={v=>setPaciente('codigoIBGEMunicipio',v)} />
                <CampoAPAC label="UF" valor={apac.paciente.uf} onChange={v=>setPaciente('uf',v)} />
                <CampoAPAC label="CEP" valor={apac.paciente.cep} onChange={v=>setPaciente('cep',v)} />
                <div style={{ gridColumn:'1/-1' }}>
                  <CampoAPAC label="Endereço completo" valor={apac.paciente.enderecoResidencia} onChange={v=>setPaciente('enderecoResidencia',v)} />
                </div>
              </div>
            </Secao>

            {/* Procedimentos */}
            <Secao titulo="Procedimentos SIGTAP" icone="🔢">
              {apac.procedimentos.length===0&&<p style={{ color:'#EF4444', fontSize:13, fontWeight:600 }}>⛔ Adicione pelo menos 1 procedimento principal.</p>}
              {apac.procedimentos.map((proc,idx)=>(
                <div key={idx} style={{ background:'#F8FAFC', borderRadius:10, padding:14, marginBottom:12, border:`2px solid ${proc.tipo==='Principal'?T:'#E5E7EB'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <span style={{ fontSize:12, fontWeight:700, padding:'2px 10px', borderRadius:20, background:proc.tipo==='Principal'?T:'#F3F4F6', color:proc.tipo==='Principal'?'white':'#374151' }}>{proc.tipo}</span>
                    <button type="button" onClick={()=>removerProc(idx)} style={{ background:'none', border:'none', color:'#EF4444', cursor:'pointer', fontSize:14, fontWeight:700 }}>✕ Remover</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr auto', gap:10 }}>
                    <CampoAPAC label="Código SIGTAP" valor={proc.codigo} onChange={v=>setProc(idx,'codigo',v.replace(/\D/g,'').slice(0,10))} erro={!proc.codigo?'Obrigatório':undefined} />
                    <CampoAPAC label="Nome do procedimento" valor={proc.nome} onChange={v=>setProc(idx,'nome',v)} />
                    <div>
                      <label style={{ display:'block', fontSize:13, fontWeight:700, color:N, marginBottom:4 }}>Qtd</label>
                      <input type="number" min={1} value={proc.quantidade} onChange={e=>setProc(idx,'quantidade',parseInt(e.target.value)||1)}
                        style={{ width:60, padding:'10px 8px', border:'2px solid #D1D5DB', borderRadius:8, fontSize:14 }} />
                    </div>
                  </div>
                </div>
              ))}
              {apac.procedimentos.length<6&&(
                <button type="button" onClick={adicionarProc} style={{ padding:'10px 20px', background:T, color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', marginTop:4 }}>
                  + Adicionar procedimento
                </button>
              )}
            </Secao>

            {/* Dados Clínicos */}
            <Secao titulo="Dados Clínicos Oncológicos" icone="🔬">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <CampoAPAC label="CID-10 Principal" valor={apac.dadosClinicos.cid10Principal} obrigatorio onChange={v=>setClinicos('cid10Principal',v.toUpperCase())} erro={erroField('cid10Principal')} />
                <CampoAPAC label="CID-10 Secundário" valor={apac.dadosClinicos.cid10Secundario||''} onChange={v=>setClinicos('cid10Secundario',v.toUpperCase())} />
                <div style={{ gridColumn:'1/-1' }}>
                  <CampoAPAC label="Diagnóstico histopatológico" valor={apac.dadosClinicos.diagnosticoHistopatologico} obrigatorio onChange={v=>setClinicos('diagnosticoHistopatologico',v)} erro={erroField('diagnosticoHistopatologico')} />
                </div>
                <CampoAPAC label="Morfologia CID-O" valor={apac.dadosClinicos.morfologiaCIDO} obrigatorio placeholder="Ex: 8500/3" onChange={v=>setClinicos('morfologiaCIDO',v)} erro={erroField('morfologiaCIDO')} />
                <CampoAPAC label="Data do diagnóstico HP" valor={apac.dadosClinicos.datadiagnostico} obrigatorio tipo="date" onChange={v=>setClinicos('datadiagnostico',v)} erro={erroField('datadiagnostico')} />
                <CampoAPAC label="Grau histopatológico" valor={apac.dadosClinicos.grauHistopatologico||''} tipo="select" opcoes={OPT_GRAU} onChange={v=>setClinicos('grauHistopatologico',v)} />
                <CampoAPAC label="Lateralidade" valor={apac.dadosClinicos.lateralidade||''} tipo="select" opcoes={OPT_LATERAL} onChange={v=>setClinicos('lateralidade',v)} />
              </div>
              {/* TNM */}
              <div style={{ background:'#EFF6FF', borderRadius:10, padding:14, marginTop:8, border:'1px solid #BFDBFE' }}>
                <p style={{ fontWeight:700, fontSize:13, color:'#1E40AF', margin:'0 0 10px' }}>📊 Estadiamento TNM (UICC)</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
                  {[{label:'T',campo:'tnmT',ph:'T1, T2...'},{label:'N',campo:'tnmN',ph:'N0, N1...'},{label:'M',campo:'tnmM',ph:'M0, M1'},{label:'Estádio',campo:'estadioClinco',ph:'I, IIA, IV...'}].map(({label,campo,ph})=>(
                    <div key={campo}>
                      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#1E40AF', marginBottom:4 }}>{label} <span style={{ color:G }}>*</span></label>
                      <input value={apac.dadosClinicos[campo]||''} onChange={e=>setClinicos(campo,e.target.value.toUpperCase())} placeholder={ph}
                        style={{ width:'100%', padding:'10px 8px', fontSize:14, textAlign:'center', border:`2px solid ${erroField(campo)?'#EF4444':'#BFDBFE'}`, borderRadius:8, fontWeight:700, boxSizing:'border-box', outline:'none' }} />
                    </div>
                  ))}
                </div>
              </div>
            </Secao>

            {/* Conduta */}
            <Secao titulo="Conduta Oncológica" icone="💊">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <CampoAPAC label="Intenção terapêutica" valor={apac.dadosClinicos.intencaoTerapeutica} obrigatorio tipo="select" opcoes={OPT_INTENCAO} onChange={v=>setClinicos('intencaoTerapeutica',v)} erro={erroField('intencaoTerapeutica')} />
                <CampoAPAC label="Linha terapêutica" valor={apac.dadosClinicos.linhaTerapeutica} obrigatorio tipo="select" opcoes={OPT_LINHA} onChange={v=>setClinicos('linhaTerapeutica',v)} erro={erroField('linhaTerapeutica')} />
                <div style={{ gridColumn:'1/-1' }}>
                  <CampoAPAC label="Esquema terapêutico (protocolo e drogas)" valor={apac.dadosClinicos.esquemaTerapeutico} obrigatorio tipo="textarea" placeholder="Ex: AC × 4 → Paclitaxel × 4 ciclos — ou use aba Assistente" onChange={v=>setClinicos('esquemaTerapeutico',v)} erro={erroField('esquemaTerapeutico')} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <CampoAPAC label="Resumo da Anamnese e Exame Físico" valor={apac.dadosClinicos.resumoAnamneseExameFisico||''} obrigatorio tipo="textarea" placeholder="Ex: Regular EG, BNF2T, MV levemente reduzido... — ou use aba Assistente" onChange={v=>setClinicos('resumoAnamneseExameFisico',v)} erro={erroField('resumoAnamneseExameFisico')} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <CampoAPAC label="Justificativa clínica" valor={apac.dadosClinicos.justificativaClinica} obrigatorio tipo="textarea" placeholder="Justificativa conforme PCDT/CONITEC..." onChange={v=>setClinicos('justificativaClinica',v)} erro={erroField('justificativaClinica')} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <CampoAPAC label="Exames complementares realizados" valor={apac.dadosClinicos.observacoesClinicas} tipo="textarea" onChange={v=>setClinicos('observacoesClinicas',v)} />
                </div>
              </div>
            </Secao>

            {/* Profissional */}
            <Secao titulo="Profissional Solicitante" icone="👨‍⚕️">
              <div style={{ background:'#F0F9FF', borderRadius:10, padding:14, border:'1px solid #BAE6FD' }}>
                <p style={{ margin:0, fontWeight:700, color:N, fontSize:14 }}>{apac.profissionalSolicitante.nome}</p>
                <p style={{ margin:'4px 0 0', color:'#475569', fontSize:13 }}>CRM-PB {apac.profissionalSolicitante.crm} — {apac.profissionalSolicitante.especialidade}</p>
                <p style={{ margin:'2px 0 0', color:'#6B7280', fontSize:12 }}>CNES Hospital do Bem: 2605473 — Patos/PB · CBO: {apac.profissionalSolicitante.cbo}</p>
              </div>
            </Secao>

            {/* Botão salvar sticky */}
            <div style={{ position:'sticky', bottom:0, background:'rgba(240,249,255,.97)', padding:'14px 0', backdropFilter:'blur(8px)' }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ flex:1, fontSize:13, fontWeight:600, color:nivel==='Aprovada'?'#065F46':nivel==='Risco'?'#92400E':'#991B1B' }}>
                  {nivel==='Aprovada'&&'✅ APAC pronta para envio'}
                  {nivel==='Risco'&&`⚠️ ${alertas.length} alerta(s) — verifique antes de enviar`}
                  {nivel==='Bloqueada'&&`⛔ ${bloqueantes.length} campo(s) obrigatório(s) pendente(s)`}
                </div>
                <button type="button" onClick={salvar} style={{
                  padding:'14px 28px', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700,
                  cursor:bloqueantes.length>0?'not-allowed':'pointer', minWidth:180,
                  background:bloqueantes.length>0?'#9CA3AF':salvo?'#065F46':N,
                }}>
                  {salvo?'✅ APAC Salva':bloqueantes.length>0?`⛔ ${bloqueantes.length} pendência(s)`:'💾 Salvar APAC'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ABA LAUDO ──────────────────────────────────────────────────── */}
        {aba==='laudo'&&(
          <div style={{ background:'white', borderRadius:12, padding:28, border:'1px solid #E5E7EB', fontFamily:'monospace' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <h3 style={{ margin:0, color:N, fontFamily:'inherit' }}>Prévia do Laudo APAC</h3>
              <button type="button" onClick={()=>{ const t=agenteAPAC.gerarTextoLaudo(apac); navigator.clipboard?.writeText(t).then(()=>alert('Laudo copiado!')); }}
                style={{ padding:'8px 16px', background:T, color:'white', border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontWeight:700 }}>
                📋 Copiar laudo
              </button>
            </div>
            <pre style={{ whiteSpace:'pre-wrap', fontSize:12, lineHeight:1.6, color:'#1F2937', background:'#F9FAFB', borderRadius:8, padding:16, overflowX:'auto' }}>
              {agenteAPAC.gerarTextoLaudo(apac)}
            </pre>
          </div>
        )}

        {/* ── ABA JSON ──────────────────────────────────────────────────── */}
        {aba==='json'&&(
          <div style={{ background:'white', borderRadius:12, padding:28, border:'1px solid #E5E7EB' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <h3 style={{ margin:0, color:N }}>Exportar para SIA/SUS</h3>
              <button type="button" onClick={()=>{
                const json=JSON.stringify(agenteAPAC.exportarJSON(apac),null,2);
                const blob=new Blob([json],{type:'application/json'});
                const url=URL.createObjectURL(blob);
                const el=document.createElement('a');
                el.href=url; el.download=`APAC_${(apac.paciente.nomePaciente||'paciente').replace(/\s/g,'_')}.json`;
                el.click();
              }} style={{ padding:'8px 16px', background:N, color:'white', border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontWeight:700 }}>
                ⬇️ Baixar JSON
              </button>
            </div>
            <div style={{ background:'#F8FAFC', borderRadius:8, padding:16 }}>
              <p style={{ fontSize:12, color:'#6B7280', margin:'0 0 12px' }}>Score anti-glosa: <strong style={{ color:nivel==='Aprovada'?'#065F46':nivel==='Risco'?'#92400E':'#991B1B' }}>{score}/100 — {nivel}</strong></p>
              <pre style={{ fontSize:11, lineHeight:1.5, color:'#1F2937', overflowX:'auto', maxHeight:500, overflow:'auto', margin:0 }}>
                {JSON.stringify(agenteAPAC.exportarJSON(apac),null,2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
