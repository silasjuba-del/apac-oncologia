// ─────────────────────────────────────────────────────────────────────────────
// PrescreverDoenca.jsx — Prescrição por patologia com impressão de receita
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, G, HOSP, AUTOR, AUTOR2 } from "../../utils/constants";
import { sc_ } from "../../components/ui/primitives";

const DOENCAS_RX=[
  /* ── ONCOLOGIA ─────────────────────────────────────────────── */
  {id:"dor_onco",    ico:"💊",cat:"onco",nome:"Dor Oncológica",           items:[{n:"Dipirona 1g",d:"1 comp",f:"6/6h",dur:"Contínuo",v:"VO"},{n:"Codeína 30mg",d:"1 comp",f:"6/6h SN",dur:"Conf. dor",v:"VO"},{n:"Tramadol 50mg",d:"1 cap",f:"8/8h",dur:"B2",v:"VO"},{n:"Gabapentina 300mg",d:"1 cap",f:"8/8h",dur:"Neuropatia",v:"VO"}]},
  {id:"nausea_qt",   ico:"🤢",cat:"onco",nome:"Náuseas Pós-QT",           items:[{n:"Ondansetrona 8mg",d:"1 comp",f:"8/8h",dur:"2d pós-QT",v:"VO"},{n:"Dexametasona 4mg",d:"1 comp",f:"12/12h",dur:"2d pós-QT",v:"VO"},{n:"Metoclopramida 10mg",d:"1 comp",f:"8/8h",dur:"2d",v:"VO"},{n:"Lorazepam 1mg",d:"1 comp",f:"noite",dur:"2d",v:"VO"}]},
  {id:"infec_qt",    ico:"🦠",cat:"onco",nome:"Infecção Imunossuprimido",  items:[{n:"Ciprofloxacino 500mg",d:"1 comp",f:"12/12h",dur:"7d",v:"VO"},{n:"Fluconazol 150mg",d:"1 cap",f:"dose única",dur:"1d",v:"VO"},{n:"SMX+TMP 800/160mg",d:"1 comp",f:"12/12h",dur:"Profilaxia PCP",v:"VO"}]},
  {id:"const_qt",    ico:"💩",cat:"onco",nome:"Constipação / Diarreia QT", items:[{n:"Lactulose 30mL",d:"1 dose",f:"12/12h",dur:"SN",v:"VO"},{n:"Bisacodil 5mg",d:"1 comp",f:"noite",dur:"SN",v:"VO"},{n:"Loperamida 2mg",d:"2 comp → 1 comp",f:"diarreia",dur:"máx 16mg/d",v:"VO"}]},
  {id:"mucosite",    ico:"🦷",cat:"onco",nome:"Mucosite Oral",             items:[{n:"Nistatina suspensão 100.000UI/mL",d:"5mL bochechar e deglutir",f:"6/6h",dur:"7-14d",v:"VO"},{n:"Benzidamina 0,15% solução",d:"15mL bochecho",f:"8/8h",dur:"7d",v:"Tópico"},{n:"Sucralfato 1g",d:"1 comp suspender em 10mL",f:"6/6h",dur:"7d",v:"VO"}]},
  {id:"neutropenia",  ico:"🩸",cat:"onco",nome:"Neutropenia Febril",        items:[{n:"Piperacilina+Tazobactam 4,5g",d:"1 dose IV (hospital)",f:"6/6h",dur:"Até apirexia 72h",v:"IV"},{n:"Ciprofloxacino 500mg",d:"1 comp (ambulatorial baixo risco)",f:"12/12h",dur:"7d",v:"VO"},{n:"Amoxicilina+Clavulanato 875mg",d:"1 comp",f:"12/12h",dur:"7d",v:"VO"}]},
  {id:"hipercalcemia",ico:"🧪",cat:"onco",nome:"Hipercalcemia Maligna",     items:[{n:"Ácido zoledrônico 4mg (hospital)",d:"Infusão IV 15min",f:"Dose única",dur:"Repetir em 4 sem. se necessário",v:"IV"},{n:"Hidratação SF 0,9%",d:"2-3L/dia",f:"Contínuo IV",dur:"24-48h",v:"IV"},{n:"Prednisona 40mg",d:"1 comp",f:"1×/dia (manhã)",dur:"Conforme protocolo",v:"VO"}]},
  {id:"caquexia",    ico:"🥗",cat:"onco",nome:"Caquexia / Anorexia",       items:[{n:"Acetato de Megestrol 160mg",d:"1 comp",f:"1×/dia",dur:"Contínuo",v:"VO"},{n:"Dexametasona 4mg",d:"1 comp",f:"1×/dia (manhã)",dur:"Curto prazo",v:"VO"},{n:"Metoclopramida 10mg",d:"1 comp",f:"30min AC",dur:"Contínuo",v:"VO"}]},
  {id:"dispneia_pal",ico:"🌬️",cat:"onco",nome:"Dispneia Paliativa",         items:[{n:"Morfina 10mg",d:"2,5-5mg",f:"4/4h e SN",dur:"Titular conforme resposta",v:"VO/SC"},{n:"Lorazepam 1mg",d:"0,5mg",f:"8/8h e SN",dur:"Ansiedade associada",v:"VO"},{n:"Metoclopramida 10mg",d:"1 comp",f:"8/8h",dur:"Contínuo",v:"VO"}]},
  {id:"tvp",         ico:"🦵",cat:"onco",nome:"TVP / Anticoagulação",       items:[{n:"Enoxaparina 1mg/kg",d:"Dose conforme peso",f:"12/12h SC",dur:"10d mínimo",v:"SC"},{n:"Rivaroxabana 15mg",d:"1 comp (AC)",f:"12/12h × 21d",dur:"Manutenção 20mg/d",v:"VO"},{n:"Apixabana 10mg",d:"1 comp (AC)",f:"12/12h × 7d",dur:"Manutenção 5mg 12/12h",v:"VO"}]},
  {id:"candidose",   ico:"🍄",cat:"onco",nome:"Candidíase Oral/Esof.",      items:[{n:"Fluconazol 150mg",d:"1 cap",f:"1×/dia",dur:"14d oral/21d esofágica",v:"VO"},{n:"Nistatina 100.000UI/mL",d:"5mL bochechar",f:"6/6h",dur:"7-14d (oral leve)",v:"Tópico"}]},
  {id:"lise_tumoral", ico:"⚠️",cat:"onco",nome:"Síndrome Lise Tumoral",     items:[{n:"Alopurinol 300mg",d:"1 comp",f:"1×/dia",dur:"Iniciar 2d antes QT",v:"VO"},{n:"Hidratação SF 0,9%",d:"2-3L/dia",f:"Contínuo",dur:"Período de risco",v:"IV"},{n:"Rasburicase 0,2mg/kg",d:"Dose IV (hospital)",f:"1×/dia",dur:"5-7d",v:"IV"}]},
  /* ── CLÍNICA GERAL ─────────────────────────────────────────── */
  {id:"sinusite",    ico:"👃",cat:"geral",nome:"Sinusite",                  items:[{n:"Amoxicilina+Clavulanato 875mg",d:"1 comp",f:"12/12h",dur:"7d",v:"VO"},{n:"Loratadina 10mg",d:"1 comp",f:"1×/dia",dur:"7d",v:"VO"},{n:"Prednisona 20mg",d:"1 comp",f:"1×/dia manhã",dur:"5d",v:"VO"}]},
  {id:"itu",         ico:"🔵",cat:"geral",nome:"ITU",                        items:[{n:"Ciprofloxacino 500mg",d:"1 comp",f:"12/12h",dur:"7d",v:"VO"},{n:"Fenazopiridina 200mg",d:"1 comp",f:"8/8h",dur:"2d",v:"VO"},{n:"Dipirona 1g",d:"1 comp",f:"6/6h SN",dur:"SN",v:"VO"}]},
  {id:"gastrite",    ico:"🫃",cat:"geral",nome:"Gastrite / DRGE",            items:[{n:"Pantoprazol 40mg",d:"1 comp em jejum",f:"1×/dia",dur:"30d",v:"VO"},{n:"Domperidona 10mg",d:"1 comp AC",f:"8/8h",dur:"14d",v:"VO"},{n:"Metoclopramida 10mg",d:"1 comp",f:"8/8h",dur:"7d",v:"VO"}]},
  {id:"has",         ico:"❤️",cat:"geral",nome:"HAS",                        items:[{n:"Losartana 50mg",d:"1 comp",f:"1×/dia",dur:"Contínuo",v:"VO"},{n:"Hidroclorotiazida 25mg",d:"1 comp manhã",f:"1×/dia",dur:"Contínuo",v:"VO"},{n:"Anlodipino 5mg",d:"1 comp",f:"1×/dia",dur:"Contínuo",v:"VO"}]},
  {id:"dm2",         ico:"🩸",cat:"geral",nome:"Diabetes (DM2)",             items:[{n:"Metformina 850mg",d:"1 comp AC",f:"12/12h",dur:"Contínuo",v:"VO"},{n:"Glibenclamida 5mg",d:"1 comp café",f:"1×/dia",dur:"Contínuo",v:"VO"}]},
  {id:"febre",       ico:"🌡️",cat:"geral",nome:"Febre / Analgesia",          items:[{n:"Paracetamol 750mg",d:"1 comp",f:"6/6h (máx 4g/d)",dur:"3-5d",v:"VO"},{n:"Ibuprofeno 600mg",d:"1 comp AC",f:"8/8h",dur:"3-5d",v:"VO"},{n:"Dipirona 500mg/mL",d:"20-40gt",f:"6/6h SN",dur:"SN",v:"VO"}]},
  {id:"alergia",     ico:"🌸",cat:"geral",nome:"Alergia / Urticária",        items:[{n:"Loratadina 10mg",d:"1 comp",f:"1×/dia",dur:"7-14d",v:"VO"},{n:"Prednisona 20mg",d:"1 comp manhã",f:"1×/dia",dur:"5d",v:"VO"},{n:"Ranitidina 150mg",d:"1 comp",f:"12/12h",dur:"7d",v:"VO"}]},
  {id:"ansiedade",   ico:"🧠",cat:"geral",nome:"Ansiedade / Insônia",        items:[{n:"Alprazolam 0,5mg",d:"1 comp",f:"noite",dur:"30d C-IV",v:"VO"},{n:"Melatonina 3mg",d:"1 comp 30min antes",f:"1×/dia",dur:"30d",v:"VO"},{n:"Sertralina 50mg",d:"1 comp",f:"1×/dia (manhã)",dur:"Contínuo",v:"VO"}]},
  {id:"rinite",      ico:"🌬️",cat:"geral",nome:"Rinite Alérgica",            items:[{n:"Furoato de fluticasona spray nasal",d:"2 jatos/narina",f:"1×/dia",dur:"30d",v:"Nasal"},{n:"Cetirizina 10mg",d:"1 comp",f:"1×/dia",dur:"30d",v:"VO"},{n:"Montelucaste 10mg",d:"1 comp noite",f:"1×/dia",dur:"30d",v:"VO"}]},
  {id:"bronquite",   ico:"🫁",cat:"geral",nome:"Bronquite / Tosse",          items:[{n:"Amoxicilina 500mg",d:"1 comp",f:"8/8h",dur:"7d",v:"VO"},{n:"Salbutamol spray",d:"2 jatos",f:"6/6h SN",dur:"5-7d",v:"Inalado"},{n:"Dextrometorfano 15mg",d:"1 comp",f:"8/8h noite",dur:"5d",v:"VO"}]},
  {id:"faringite",   ico:"🗣️",cat:"geral",nome:"Faringite / Amigdalite",    items:[{n:"Amoxicilina 500mg",d:"1 comp",f:"8/8h",dur:"10d",v:"VO"},{n:"Ibuprofeno 600mg",d:"1 comp AC",f:"8/8h",dur:"5d",v:"VO"},{n:"Benzidamina 0,15% spray",d:"4-8 jatos",f:"3/3h",dur:"7d",v:"Tópico"}]},
  {id:"conjuntivite", ico:"👁️",cat:"geral",nome:"Conjuntivite",              items:[{n:"Tobramicina 0,3% colírio",d:"1-2 gotas",f:"6/6h",dur:"7d",v:"Ocular"},{n:"Dexametasona 0,1% colírio",d:"1-2 gotas",f:"6/6h",dur:"5-7d (bacteriana)",v:"Ocular"}]},
  {id:"lombalgia",   ico:"🦴",cat:"geral",nome:"Lombalgia",                   items:[{n:"Ibuprofeno 600mg",d:"1 comp AC",f:"8/8h",dur:"5-7d",v:"VO"},{n:"Ciclobenzaprina 5mg",d:"1 comp",f:"8/8h",dur:"5-7d",v:"VO"},{n:"Paracetamol 750mg",d:"1 comp",f:"6/6h SN",dur:"5d",v:"VO"}]},
  {id:"osteoporose", ico:"🦷",cat:"geral",nome:"Osteoporose",                items:[{n:"Alendronato 70mg",d:"1 comp em jejum em pé 30min",f:"1×/semana",dur:"Contínuo",v:"VO"},{n:"Cálcio 500mg + Vit D 1000UI",d:"1 comp",f:"1×/dia",dur:"Contínuo",v:"VO"}]},
  {id:"hipotireoid", ico:"🦋",cat:"geral",nome:"Hipotireoidismo",            items:[{n:"Levotiroxina 50mcg",d:"1 comp jejum",f:"1×/dia",dur:"Contínuo (dosar TSH em 6 sem.)",v:"VO"}]},
  {id:"gota",        ico:"🦶",cat:"geral",nome:"Gota / Hiperuricemia",       items:[{n:"Colchicina 0,5mg",d:"1 comp",f:"12/12h (aguda: 3d)",dur:"Profilaxia: 1×/dia",v:"VO"},{n:"Alopurinol 300mg",d:"1 comp",f:"1×/dia",dur:"Contínuo",v:"VO"},{n:"Indometacina 25mg",d:"1 comp AC",f:"8/8h",dur:"5-7d aguda",v:"VO"}]},
  {id:"pneumonia",   ico:"🫁",cat:"geral",nome:"Pneumonia Comunitária",      items:[{n:"Amoxicilina+Clavulanato 875mg",d:"1 comp",f:"12/12h",dur:"7d",v:"VO"},{n:"Azitromicina 500mg",d:"1 comp",f:"1×/dia",dur:"5d (atípica)",v:"VO"},{n:"Prednisona 40mg",d:"1 comp manhã",f:"1×/dia",dur:"5d (grave)",v:"VO"}]},
  {id:"icc",         ico:"💙",cat:"geral",nome:"Insuf. Cardíaca",            items:[{n:"Furosemida 40mg",d:"1-2 comp",f:"1×/dia (manhã)",dur:"Contínuo",v:"VO"},{n:"Espironolactona 25mg",d:"1 comp",f:"1×/dia",dur:"Contínuo",v:"VO"},{n:"Carvedilol 6,25mg",d:"1 comp AC",f:"12/12h",dur:"Contínuo",v:"VO"}]},
  {id:"depressao",   ico:"💭",cat:"geral",nome:"Depressão",                  items:[{n:"Sertralina 50mg",d:"1 comp manhã",f:"1×/dia",dur:"Contínuo (avaliar 4-6 sem.)",v:"VO"},{n:"Fluoxetina 20mg",d:"1 comp manhã",f:"1×/dia",dur:"Contínuo",v:"VO"}]},
  {id:"enxaqueca",   ico:"🤯",cat:"geral",nome:"Enxaqueca",                  items:[{n:"Sumatriptana 50mg",d:"1 comp ao início",f:"SN (máx 2/24h)",dur:"Crise",v:"VO"},{n:"Ibuprofeno 600mg",d:"1 comp AC",f:"8/8h",dur:"SN crise",v:"VO"},{n:"Propranolol 40mg",d:"1 comp",f:"12/12h",dur:"Profilaxia contínua",v:"VO"}]},
  {id:"dislipidemia",ico:"🫀",cat:"geral",nome:"Dislipidemia",               items:[{n:"Sinvastatina 20mg",d:"1 comp",f:"noite",dur:"Contínuo",v:"VO"},{n:"Atorvastatina 20mg",d:"1 comp",f:"1×/dia",dur:"Contínuo",v:"VO"},{n:"Rosuvastatina 10mg",d:"1 comp",f:"1×/dia",dur:"Contínuo",v:"VO"}]},
  {id:"dpoc",        ico:"🫁",cat:"geral",nome:"DPOC / Broncoespasmo",        items:[{n:"Salbutamol spray",d:"2 jatos",f:"6/6h SN",dur:"Crise",v:"Inalado"},{n:"Brometo de ipratrópio spray",d:"2 jatos",f:"6/6h",dur:"7-14d",v:"Inalado"},{n:"Prednisona 40mg",d:"2 comp 20mg",f:"1×/dia manhã",dur:"5d",v:"VO"}]},
  {id:"dor_neuropatica",ico:"⚡",cat:"geral",nome:"Dor Neuropática",          items:[{n:"Gabapentina 300mg",d:"1 cap",f:"noite; titular até 8/8h",dur:"Contínuo",v:"VO"},{n:"Pregabalina 75mg",d:"1 cap",f:"12/12h",dur:"Contínuo",v:"VO"},{n:"Amitriptilina 25mg",d:"1 comp",f:"noite",dur:"Contínuo",v:"VO"}]},
  {id:"anemia_ferro",ico:"🩸",cat:"geral",nome:"Anemia Ferropriva",           items:[{n:"Sulfato ferroso 40mg Fe++",d:"1 comp",f:"1-2×/dia",dur:"3 meses após Hb normalizar",v:"VO"},{n:"Ácido fólico 5mg",d:"1 comp",f:"1×/dia",dur:"30-90d",v:"VO"},{n:"Vitamina B12 1000mcg",d:"1 amp",f:"IM semanal ×4; mensal depois",dur:"Conforme deficiência",v:"IM"}]},
  {id:"herpes_zoster",ico:"🔥",cat:"geral",nome:"Herpes Zoster",             items:[{n:"Aciclovir 800mg",d:"1 comp",f:"5×/dia",dur:"7d",v:"VO"},{n:"Valaciclovir 1g",d:"1 comp",f:"8/8h",dur:"7d",v:"VO"},{n:"Gabapentina 300mg",d:"1 cap",f:"noite; titular",dur:"Dor neuropática",v:"VO"}]},
  {id:"celulite",    ico:"🦠",cat:"geral",nome:"Celulite / Pele",             items:[{n:"Cefalexina 500mg",d:"1 cap",f:"6/6h",dur:"7d",v:"VO"},{n:"Amoxicilina+Clavulanato 875mg",d:"1 comp",f:"12/12h",dur:"7d",v:"VO"},{n:"Dipirona 1g",d:"1 comp",f:"6/6h SN",dur:"Dor/febre",v:"VO"}]},
  {id:"constipacao_geral",ico:"🚽",cat:"geral",nome:"Constipação",            items:[{n:"Lactulose 667mg/mL",d:"15-30mL",f:"12/12h",dur:"SN",v:"VO"},{n:"Polietilenoglicol",d:"1 sachê",f:"1×/dia",dur:"SN",v:"VO"},{n:"Bisacodil 5mg",d:"1-2 comp",f:"noite",dur:"SN",v:"VO"}]},
  {id:"vertigem",    ico:"🌀",cat:"geral",nome:"Vertigem / Labirintite",      items:[{n:"Betaistina 24mg",d:"1 comp",f:"12/12h",dur:"30d",v:"VO"},{n:"Dimenidrinato 50mg",d:"1 comp",f:"8/8h SN",dur:"3-5d",v:"VO"},{n:"Metoclopramida 10mg",d:"1 comp",f:"8/8h SN",dur:"3d",v:"VO"}]},
];
export default function PrescreverDoenca({pac}){
  const [sel,setSel]=useState(null);
  const [itensSel,setItensSel]=useState([]);
  const [busca,setBusca]=useState("");
  const [catFiltro,setCatFiltro]=useState("todos");
  const hoje=new Date().toLocaleDateString("pt-BR");
  const cab=`RECEITA MÉDICA\nData: ${hoje}\n${"═".repeat(50)}\n${HOSP}\n${AUTOR}\n${AUTOR2}\n${"═".repeat(50)}\nPaciente: ${pac?.nome||"___"}\nDiagnóstico: ${pac?.diag||"___"}\nAlergias: ${pac?.alerg||"Nenhuma conhecida"}\n${"─".repeat(50)}\n\n`;
  const toggle=(item)=>setItensSel(x=>x.some(i=>i.n===item.n)?x.filter(i=>i.n!==item.n):[...x,item]);
  const abrirImpressao=()=>{
    if(!itensSel.length)return;
    const corpo=cab+itensSel.map((m,i)=>`${i+1}. ${m.n}\n   Dose: ${m.d} · Frequência: ${m.f} · Duração: ${m.dur} · Via: ${m.v}`).join("\n\n")+`\n\n${"─".repeat(50)}\n${AUTOR}\nCRM-PB 17341\n\n_______________________\nAssinatura e carimbo`;
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Georgia,serif;padding:28px;font-size:13px;line-height:1.8}.btn{background:#B8860B;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:13px;cursor:pointer}@media print{.btn{display:none}}</style></head><body><pre>${corpo}</pre><button class="btn" onclick="window.print()">🖨️ Imprimir</button></body></html>`;
    const w=window.open("","_blank","width=700,height=600");
    if(w){w.document.open();w.document.write(html);w.document.close();}
  };
  const filtradas=[...DOENCAS_RX].reverse().filter(d=>{
    const matchBusca=!busca||d.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCat=catFiltro==="todos"||d.cat===catFiltro;
    return matchBusca&&matchCat;
  });
  return <div style={{display:"grid",gap:10}}>
    {/* ── RECEITA (topo) ── */}
    {itensSel.length>0
      ?<div style={{...sc_.card({border:`2px solid ${G}55`,background:"#FFFBEB",padding:"12px 14px"})}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>📋</span>
              <div>
                <div style={{fontSize:13,fontWeight:950,color:N}}>Receita — {pac?.nome||"Paciente"}</div>
                <div style={{fontSize:10,color:"#64748B",fontWeight:700}}>{hoje} · {itensSel.length} medicamento{itensSel.length>1?"s":""}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setItensSel([])} style={{...sc_.btn("ghost",{fontSize:10,padding:"5px 9px"})}}>✕ Limpar</button>
              <button onClick={abrirImpressao} style={{...sc_.btn("gold",{fontSize:11,padding:"6px 14px"})}}>🖨 Imprimir Receita</button>
            </div>
          </div>
          <div style={{display:"grid",gap:4}}>
            {itensSel.map((item,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",border:`1px solid ${G}33`,borderRadius:8,padding:"6px 10px"}}>
              <div>
                <span style={{fontSize:11,fontWeight:950,color:N}}>{i+1}. {item.n}</span>
                <span style={{fontSize:10,color:"#64748B",marginLeft:8}}>{item.d} · {item.f} · {item.dur}</span>
              </div>
              <button onClick={()=>toggle(item)} style={{border:"none",background:"none",color:"#94A3B8",cursor:"pointer",fontSize:14,padding:2}}>×</button>
            </div>)}
          </div>
        </div>
      :<div style={{background:"#F8FAFC",border:"1.5px dashed #CBD5E1",borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:10,color:"#94A3B8"}}>
          <span style={{fontSize:22}}>📋</span>
          <div><div style={{fontSize:12,fontWeight:800}}>Receita vazia</div><div style={{fontSize:10,fontWeight:700}}>Selecione uma condição abaixo e marque os medicamentos</div></div>
        </div>}
    {/* ── FILTROS + BUSCA ── */}
    <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Buscar..." style={{...sc_.inp,fontSize:12,flex:"1 1 160px",padding:"7px 10px"}}/>
      {[["todos","Todas"],["onco","🩺 Oncologia"],["geral","🏥 Clínica Geral"]].map(([v,l])=><button key={v} onClick={()=>setCatFiltro(v)} style={{border:`1.5px solid ${catFiltro===v?G:"#E2E8F0"}`,background:catFiltro===v?G+"15":"#F8FAFC",borderRadius:999,padding:"5px 12px",fontWeight:catFiltro===v?900:700,fontSize:11,cursor:"pointer",fontFamily:"inherit",color:catFiltro===v?G:N}}>{l}</button>)}
    </div>
    {/* ── PRESCRIÇÃO SELECIONADA ── */}
    {sel&&<div style={{...sc_.card({border:`2px solid ${G}44`,background:"#F0FDF4",padding:"10px 14px"})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:13,fontWeight:950,color:N}}>{sel.ico} {sel.nome}</div>
        <div style={{display:"flex",gap:5}}>
          <button onClick={()=>setItensSel(x=>{const novos=sel.items.filter(i=>!x.some(e=>e.n===i.n));return[...x,...novos];})} style={{...sc_.btn("ghost",{fontSize:10,padding:"4px 8px"})}}>☑ Todos</button>
          <button onClick={()=>setSel(null)} style={{...sc_.btn("ghost",{fontSize:10,padding:"4px 8px"})}}>✕</button>
        </div>
      </div>
      <div style={{display:"grid",gap:5}}>
        {sel.items.map((item,i)=>{const at=itensSel.some(x=>x.n===item.n);return <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",border:`1.5px solid ${at?G:"#E2E8F0"}`,borderRadius:9,padding:"7px 10px",background:at?G+"0A":"#fff",cursor:"pointer"}} onClick={()=>toggle(item)}>
          <input type="checkbox" checked={at} onChange={()=>toggle(item)} style={{width:13,height:13,accentColor:G,marginTop:2,flexShrink:0}}/>
          <div style={{flex:1}}>
            <strong style={{color:N,fontSize:11}}>{item.n}</strong>
            <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:2}}>
              {[["Dose",item.d],["Freq",item.f],["Dur",item.dur],["Via",item.v]].map(([l,v])=><span key={l} style={{background:"#F1F5F9",color:"#475569",padding:"1px 6px",borderRadius:999,fontSize:9,fontWeight:800}}>{l}: {v}</span>)}
            </div>
          </div>
        </div>;})}
      </div>
    </div>}
    {/* ── GRID DE DOENÇAS (invertido) ── */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6}}>
      {filtradas.map(d=><button key={d.id} onClick={()=>setSel(sel?.id===d.id?null:d)}
        style={{border:`2px solid ${sel?.id===d.id?G:d.cat==="onco"?"#DDD6FE":"#E2E8F0"}`,background:sel?.id===d.id?G+"18":d.cat==="onco"?"#FAFAFA":"#F8FAFC",borderRadius:11,padding:"8px 5px",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all .13s"}}>
        <div style={{fontSize:20,marginBottom:3,lineHeight:1}}>{d.ico}</div>
        <div style={{fontSize:9.5,fontWeight:800,color:sel?.id===d.id?G:d.cat==="onco"?"#6D28D9":N,lineHeight:1.25}}>{d.nome}</div>
        {d.cat==="onco"&&<div style={{fontSize:7.5,color:"#A78BFA",fontWeight:700,marginTop:2}}>onco</div>}
      </button>)}
    </div>
  </div>;
}
