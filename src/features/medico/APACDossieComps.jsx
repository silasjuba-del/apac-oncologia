// ─────────────────────────────────────────────────────────────────────────────
// APACDossieComps.jsx — APACDossieChecklist, APACEntradaRapida
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { N, T, VE, VM, AM } from "../../utils/constants";
import { getCIDPorSede } from "../../utils/constants";
import { SIGTAP as SIGTAP_CATALOGO } from "../../components/SeletorAPAC.jsx";
import { sc_, H2, Btn, NOW } from "../../components/ui/primitives";
import {
  criarDossieInicial, validarAPAC, gerarTextoEvolucao,
} from "../../utils/dossie";
import { normalizaPacienteValor } from "../../utils/security";
import {
  extrairCamposIA, extrairSecaoIA, extrairValorResumo,
} from "../../utils/parse";
import { resolverAPACCompleta, CAMPOS_APAC, STATUS_META } from "../../utils/apacDeterministico";

function APACDossieChecklist({dossie,setDossie}){
  const apac=validarAPAC(dossie||{});
  const pac=dossie?.paciente||{};
  // P3 — resolucao deterministica por campo
  const resolucao=apac.resolucao||resolverAPACCompleta(pac,dossie||{});
  const [expandido,setExpandido]=useState(false);
  const [campoEdit,setCampoEdit]=useState(null);
  const [valorEdit,setValorEdit]=useState("");
  useEffect(()=>{if(!(pac?.pacID||pac?.cpf||pac?.cns)){return;}setDossie&&setDossie(d=>({...d,apac,status:apac.completa?"apac_pronta":"apac_validacao",updatedAt:NOW()}));},[apac.pendencias.length]);
  const cor=apac.riscoGlosa==="alto"?VM:apac.riscoGlosa==="moderado"?AM:VE;
  const {scoreAntiGlosa,inconsistencias,inferidos}=resolucao;
  const iniciarEdicao=(campo,valor)=>{setCampoEdit(campo);setValorEdit(String(valor||""));};
  const salvarCampo=()=>{
    if(!campoEdit)return;
    const valor=valorEdit.trim();
    setDossie&&setDossie(d=>{
      const base=d||{};
      const novo={...base,paciente:{...(base.paciente||{}),[campoEdit]:valor},updatedAt:NOW()};
      novo.apac=validarAPAC(novo);
      return novo;
    });
    setCampoEdit(null);
  };
  return <div style={sc_.card({border:"2px solid "+cor+"55",marginBottom:12})}>
    {/* Header */}
    <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:8}}>
      <H2 ch="APAC — Validador Anti-Glosa" s={{margin:0,fontSize:14}}/>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <span style={{fontSize:11,fontWeight:900,color:scoreAntiGlosa>=80?VE:scoreAntiGlosa>=50?AM:VM}}>Score: {scoreAntiGlosa}/100</span>
        <span style={{background:cor,color:"#fff",borderRadius:999,padding:"5px 12px",fontSize:10,fontWeight:900}}>{apac.riscoGlosa==="baixo"?"APAC pronta":apac.riscoGlosa==="moderado"?"Pendências moderadas":"Pendências críticas"}</span>
      </div>
    </div>
    {/* Grid de campos com status P3 */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:8}}>
      {CAMPOS_APAC.map(({campo,label,req})=>{
        const r=resolucao.campos?.[campo]||{status:"ausente",fonte:null,valor:null};
        const meta=STATUS_META[r.status]||STATUS_META.ausente;
        const editando=campoEdit===campo;
        return <div key={campo} onClick={()=>!editando&&iniciarEdicao(campo,r.valor)} style={{background:meta.bg,border:"1px solid "+meta.cor+"44",borderRadius:10,padding:"9px 10px",position:"relative",cursor:"pointer",minHeight:72}}>
          <div style={{fontSize:11,color:"#64748B",fontWeight:950,textTransform:"uppercase",marginBottom:4}}>{label}{req?<span style={{color:VM}}> *</span>:""}</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:14}}>{meta.icone}</span>
            <span style={{fontSize:13,color:meta.cor,fontWeight:950}}>{meta.label}</span>
          </div>
          {editando ? <div onClick={e=>e.stopPropagation()} style={{marginTop:6,display:"grid",gap:6}}>
            <textarea value={valorEdit} onChange={e=>setValorEdit(e.target.value)} rows={campo==="justif_apac"?4:2} autoFocus style={{width:"100%",boxSizing:"border-box",border:"1px solid "+meta.cor+"66",borderRadius:8,padding:"7px 9px",fontSize:13,color:N,fontFamily:"inherit",resize:"vertical",outline:"none",background:"#fff"}}/>
            <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
              <button type="button" onClick={()=>setCampoEdit(null)} style={{border:"1px solid #CBD5E1",background:"#fff",color:"#475569",borderRadius:8,padding:"5px 9px",fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
              <button type="button" onClick={salvarCampo} style={{border:"none",background:VE,color:"#fff",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>Salvar</button>
            </div>
          </div> : r.valor&&<div style={{fontSize:12,color:"#334155",fontWeight:800,marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}} title={String(r.valor)}>{String(r.valor).slice(0,54)}{String(r.valor).length>54?"…":""}</div>}
          {r.fonte&&<div style={{fontSize:8,color:"#94A3B8",marginTop:1}}>{r.fonte}</div>}
          {r.status==="inconsistente"&&r.valorAlternativo&&<div style={{fontSize:8,color:"#7C3AED",marginTop:1}} title={"IA sugere: "+r.valorAlternativo}>IA: {String(r.valorAlternativo).slice(0,18)}</div>}
        </div>;
      })}
    </div>
    {/* Alertas resumidos */}
    {inconsistencias.length>0&&<div style={{background:"#EDE9FE",border:"1px solid #7C3AED44",borderRadius:8,padding:"7px 10px",marginBottom:6,fontSize:11,color:"#7C3AED",fontWeight:800}}>
      ⚠️ Inconsistências — revise: {inconsistencias.join(", ")}
    </div>}
    {inferidos.length>0&&<div style={{background:"#FEF3C7",border:"1px solid "+AM+"44",borderRadius:8,padding:"7px 10px",marginBottom:6,fontSize:11,color:AM,fontWeight:800}}>
      🤖 Inferidos por IA — confirme antes de imprimir: {inferidos.join(", ")}
    </div>}
    {apac.pendencias.length===0?<p style={{fontSize:12,color:VE,fontWeight:800,margin:0}}>Checklist completo. APAC liberada para impressão.</p>:
      <p style={{fontSize:11,color:VM,fontWeight:800,margin:0}}>Pendências obrigatórias: {apac.pendencias.join(" · ")}</p>}
  </div>;
}

function APACEntradaRapida({pac,up,dossie,setDossie,addMsg}){
  const grupos=Object.keys(SIGTAP_CATALOGO||{}).filter(k=>k!=="SUPORTE_OSSEO");
  const grupoInicial=grupos.find(g=>String(pac?.local_cancer||pac?.diag||"").toLowerCase().includes(String(SIGTAP_CATALOGO[g]?.label||"").toLowerCase().split(" ")[0]))||"";
  const [grupo,setGrupo]=useState(grupoInicial);
  const [procCodigo,setProcCodigo]=useState("");
  const [linha,setLinha]=useState(pac?.linha||"");
  const [intencao,setIntencao]=useState(pac?.intencao||"");
  const [manual,setManual]=useState({tumor:pac?.local_cancer||"",cid:pac?.cid||"",protocolo:pac?.trat||"",sigtap:pac?.cod_proc||""});
  const [textoColado,setTextoColado]=useState("");
  const [previewColagem,setPreviewColagem]=useState("");
  const procedimentos=grupo?SIGTAP_CATALOGO[grupo]?.procedimentos||[]:[];
  const proc=procedimentos.find(p=>p.codigo===procCodigo)||null;
  const procedimentosFlat=grupos.flatMap(g=>(SIGTAP_CATALOGO[g]?.procedimentos||[]).map(p=>({...p,grupo:g,labelGrupo:SIGTAP_CATALOGO[g]?.label})));
  const textoProntuarioAtual=()=>[
    dossie?.evolucao?.textoFinal,
    dossie?.evolucao?.rascunho,
    dossie?.resumoClaude,
    ...(dossie?.documentos||[]).map(doc=>[doc.tipo,doc.nome,doc.resumo||doc.texto||doc.conteudo].filter(Boolean).join(" - ")),
  ].filter(Boolean).join("\n\n");
  const aplicarCampos=(override={})=>{
    const tumor=override.tumor||manual.tumor||SIGTAP_CATALOGO[grupo]?.label||pac?.local_cancer||"";
    const cid=override.cid||manual.cid||getCIDPorSede(tumor)?.cid||pac?.cid||"";
    const protocolo=override.protocolo||manual.protocolo||proc?.descricao||pac?.trat||"";
    const sigtap=String(override.sigtap||manual.sigtap||proc?.codigo||pac?.cod_proc||"").replace(/\D/g,"");
    const diag=override.diag||pac?.diag||`${tumor?`Neoplasia maligna - ${tumor}`:"Neoplasia maligna"}`;
    const linhaFinal=override.linha||linha||proc?.linha||pac?.linha||"";
    const intencaoFinal=override.intencao||intencao||pac?.intencao||"";
    const justificativa=override.justif_apac||pac?.justif_apac||`Solicitação de tratamento oncológico para ${diag}${cid?` (${cid})`:""}, protocolo ${protocolo}.`;
    const campos={local_cancer:tumor,cid,diag,trat:protocolo,cod_proc:sigtap,procedimento_sigtap:sigtap,linha:linhaFinal,intencao:intencaoFinal,justif_apac:justificativa,tnm:override.tnm||pac?.tnm||"",estadio:override.estadio||pac?.estadio||"",bio:override.bio||pac?.bio||"",ecog:override.ecog||pac?.ecog||""};
    Object.entries(campos).forEach(([k,v])=>{if(v)up&&up(k,v);});
    setDossie&&setDossie(d=>{
      const base=d||criarDossieInicial({...pac,...campos});
      const novo={...base,paciente:{...(base.paciente||{}),...pac,...campos},status:"apac_validacao",updatedAt:NOW()};
      novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};
      novo.apac=validarAPAC(novo);
      return novo;
    });
    addMsg&&addMsg("APAC","Médico",`Campos APAC atualizados: ${protocolo||"protocolo"} · SIGTAP ${sigtap||"pendente"} · CID ${cid||"pendente"}`,"msg");
  };
  const aplicar=()=>aplicarCampos();
  const analisarTextoColado=(textoFonte)=>{
    const txt=String((textoFonte ?? textoColado) || "").trim();
    if(!txt){alert("Cole a evolução, resumo ou tratamento antes de analisar.");return;}
    const camposIA=extrairCamposIA(txt);
    const cidTexto=(txt.match(/\bC\d{2}(?:\.\d)?\b/i)||[])[0]||"";
    const sigtapTexto=(txt.match(/\b03\d{8}\b/)||[])[0]||"";
    const tumor=camposIA.local_cancer||extrairValorResumo(txt,["sede tumoral","topografia","local do câncer","local do cancer","sítio tumoral","sitio tumoral"])||manual.tumor||pac?.local_cancer||"";
    const cid=(camposIA.cid||cidTexto||getCIDPorSede(tumor)?.cid||manual.cid||pac?.cid||"").toUpperCase();
    const diag=camposIA.diag||extrairValorResumo(txt,["diagnóstico","diagnostico","tipo de tumor","histologia"])||pac?.diag||"";
    const protocolo=camposIA.trat||extrairValorResumo(txt,["protocolo","esquema","tratamento proposto","tratamento","conduta"])||manual.protocolo||pac?.trat||"";
    const linhaTexto=extrairValorResumo(txt,["linha terapêutica","linha terapeutica","linha de tratamento","linha"])||linha||pac?.linha||"";
    const intencaoTexto=extrairValorResumo(txt,["intenção terapêutica","intencao terapeutica","finalidade","intenção","intencao"])||intencao||pac?.intencao||"";
    const achadoProc=sigtapTexto?procedimentosFlat.find(p=>String(p.codigo||"").replace(/\D/g,"")===sigtapTexto):procedimentosFlat.find(p=>{
      const alvo=normalizaPacienteValor([p.descricao,p.indicacao,p.labelGrupo].filter(Boolean).join(" "));
      const fonte=normalizaPacienteValor([protocolo,diag,tumor].filter(Boolean).join(" "));
      return alvo&&fonte&&fonte.split(" ").filter(w=>w.length>4).some(w=>alvo.includes(w));
    });
    const grupoDetectado=achadoProc?.grupo||grupos.find(g=>{const chave=normalizaPacienteValor(SIGTAP_CATALOGO[g]?.label||"").split(" ")[0];return !!chave&&normalizaPacienteValor(tumor||diag).includes(chave);})||grupo;
    const sigtap=String(sigtapTexto||achadoProc?.codigo||manual.sigtap||"").replace(/\D/g,"");
    if(grupoDetectado)setGrupo(grupoDetectado);
    if(achadoProc?.codigo)setProcCodigo(achadoProc.codigo);
    setLinha(linhaTexto);
    setIntencao(intencaoTexto);
    setManual({tumor:tumor||manual.tumor,cid,protocolo:protocolo||achadoProc?.descricao||manual.protocolo,sigtap});
    const justif=extrairSecaoIA(txt,/^JUSTIFICATIVA(?:\s+CL[ÍI]NICA)?\s*:?\s*/i)||extrairValorResumo(txt,["justificativa clínica","justificativa clinica","justificativa"])||"";
    const override={tumor,cid,diag,protocolo:protocolo||achadoProc?.descricao||"",sigtap,linha:linhaTexto,intencao:intencaoTexto,justif_apac:justif,tnm:extrairValorResumo(txt,["tnm"]),estadio:camposIA.estadio||extrairValorResumo(txt,["estadiamento","estágio","estagio"]),bio:camposIA.bio||extrairValorResumo(txt,["biomarcadores","biomarcador"]),ecog:camposIA.ecog||extrairValorResumo(txt,["ecog"])};
    aplicarCampos(override);
    setPreviewColagem([
      `Diagnóstico: ${diag||"pendente"}`,
      `CID-10: ${cid||"pendente"}`,
      `Sítio tumoral: ${tumor||"pendente"}`,
      `Linha/intenção: ${[linhaTexto,intencaoTexto].filter(Boolean).join(" / ")||"pendente"}`,
      `Protocolo: ${override.protocolo||"pendente"}`,
      `SIGTAP: ${sigtap||"pendente"}`,
    ].join("\n"));
  };
  const usarProntuarioAtual=()=>{
    const fonte=textoProntuarioAtual();
    if(!fonte.trim()){alert("Ainda não há prontuário/resumo disponível para preencher a APAC.");return;}
    setTextoColado(fonte);
    analisarTextoColado(fonte);
  };
  return <div style={sc_.card({border:"2px solid "+T+"44",background:"#F8FAFC"})}>
    <H2 ch="APAC — inserção rápida pelo médico" s={{fontSize:14,margin:"0 0 6px"}}/>
    <p style={{fontSize:12,color:"#64748B",margin:"0 0 12px"}}>Use por clique/rolagem ou digite livremente. Ao concluir, o agente preenche CID, tratamento, SIGTAP e justificativa para revisão.</p>
    <div style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:12,padding:10,marginBottom:12}}>
      <label style={{fontSize:11,fontWeight:900,color:N,textTransform:"uppercase"}}>Colar evolução/tratamento para preencher APAC</label>
      <textarea value={textoColado} onChange={e=>setTextoColado(e.target.value)} placeholder="Cole aqui a evolução completa, resumo externo, tratamento proposto ou discussão do caso. O agente extrai diagnóstico, CID, linha, intenção, protocolo e SIGTAP quando houver." rows={9} style={{...sc_.inp,width:"100%",resize:"vertical",marginTop:6,fontSize:13,lineHeight:1.55,minHeight:220}}/>
      <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center",flexWrap:"wrap"}}>
        <Btn v="navy" ch="Analisar texto e preencher APAC" s={{padding:"9px 14px"}} onClick={()=>analisarTextoColado()}/>
        <Btn v="teal" ch="Usar prontuário atual" s={{padding:"9px 14px"}} onClick={usarProntuarioAtual}/>
        <Btn v="ghost" ch="Limpar" s={{padding:"9px 12px"}} onClick={()=>{setTextoColado("");setPreviewColagem("");}}/>
      </div>
      {previewColagem&&<pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:11,lineHeight:1.6,background:"#F8FAFC",border:"1px solid #DDE3EC",borderRadius:9,padding:"8px 10px",margin:"8px 0 0",color:N}}>{previewColagem}</pre>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div>
        <label style={{fontSize:11,fontWeight:900,color:N,textTransform:"uppercase"}}>Tumores</label>
        <select value={grupo} onChange={e=>{setGrupo(e.target.value);setProcCodigo("");setManual(m=>({...m,tumor:SIGTAP_CATALOGO[e.target.value]?.label||m.tumor}));}} style={{...sc_.inp,width:"100%",marginTop:4}}>
          <option value="">Rolar e selecionar...</option>{grupos.map(g=><option key={g} value={g}>{SIGTAP_CATALOGO[g].label}</option>)}
        </select>
        <input value={manual.tumor} onChange={e=>setManual(m=>({...m,tumor:e.target.value}))} placeholder="Ou digite o sítio tumoral" style={{...sc_.inp,width:"100%",marginTop:6}}/>
      </div>
      <div>
        <label style={{fontSize:11,fontWeight:900,color:N,textTransform:"uppercase"}}>Neoplasia / CID</label>
        <input value={manual.cid} onChange={e=>setManual(m=>({...m,cid:e.target.value.toUpperCase()}))} placeholder="Ex: C50.4, C34.9, C18.9" style={{...sc_.inp,width:"100%",marginTop:4}}/>
        <div style={{fontSize:10,color:"#64748B",marginTop:4}}>Sugestão automática: {getCIDPorSede(manual.tumor||SIGTAP_CATALOGO[grupo]?.label)?.cid||"—"}</div>
      </div>
      <div>
        <label style={{fontSize:11,fontWeight:900,color:N,textTransform:"uppercase"}}>Linha</label>
        <select value={linha} onChange={e=>setLinha(e.target.value)} style={{...sc_.inp,width:"100%",marginTop:4}}>
          <option value="">Rolar e selecionar...</option>{["Adjuvante","Neoadjuvante","1ª linha","2ª linha","3ª linha","Manutenção","Concomitante à radioterapia"].map(o=><option key={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label style={{fontSize:11,fontWeight:900,color:N,textTransform:"uppercase"}}>Intenção terapêutica</label>
        <select value={intencao} onChange={e=>setIntencao(e.target.value)} style={{...sc_.inp,width:"100%",marginTop:4}}>
          <option value="">Rolar e selecionar...</option>{["Curativa","Paliativa","Adjuvante","Neoadjuvante","Perioperatória","Controle de sintomas"].map(o=><option key={o}>{o}</option>)}
        </select>
      </div>
      <div style={{gridColumn:"1 / -1"}}>
        <label style={{fontSize:11,fontWeight:900,color:N,textTransform:"uppercase"}}>Protocolo / procedimento SIGTAP</label>
        <select value={procCodigo} onChange={e=>{setProcCodigo(e.target.value);const p=procedimentos.find(x=>x.codigo===e.target.value);if(p)setManual(m=>({...m,protocolo:p.descricao,sigtap:p.codigo}));}} style={{...sc_.inp,width:"100%",marginTop:4}}>
          <option value="">Rolar e selecionar protocolo...</option>{procedimentos.map(p=><option key={p.codigo} value={p.codigo}>{p.codigo} — {p.descricao} — {p.indicacao}</option>)}
        </select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 180px",gap:8,marginTop:6}}>
          <input value={manual.protocolo} onChange={e=>setManual(m=>({...m,protocolo:e.target.value}))} placeholder="Ou digite o protocolo/procedimento" style={{...sc_.inp,width:"100%"}}/>
          <input value={manual.sigtap} onChange={e=>setManual(m=>({...m,sigtap:e.target.value}))} placeholder="Código SIGTAP" style={{...sc_.inp,width:"100%"}}/>
        </div>
      </div>
    </div>
    <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
      <Btn v="gold" ch="Concluir e preencher APAC" s={{padding:"10px 16px"}} onClick={aplicar}/>
    </div>
  </div>;
}
export { APACDossieChecklist, APACEntradaRapida };
