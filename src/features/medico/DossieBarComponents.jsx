// ─────────────────────────────────────────────────────────────────────────────
// DossieBarComponents.jsx — StatusDossieBar, AtendimentosStandbyBar,
//   RecepcaoDossiePanel, DocumentosPosEvolucao
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { N, G, T, VE, VM, AM } from "../../utils/constants";
import { sc_, H2, Fld, Btn, NOW, abrirDoc, copiarTexto } from "../../components/ui/primitives";
import {
  criarDossieInicial, orquestrarDossieAtendimento,
  validarAPAC, gerarDocumentosSelecionados,
} from "../../utils/dossie";
import { criarDocumentoClinico, integrarDocumentosNoDossie } from "../../utils/pipeline";

const STATUS_DOSSIE=[
  {id:"pre_consulta",label:"Pré-consulta iniciada",cor:T},
  {id:"aguardando_recepcao",label:"Aguardando recepção",cor:AM},
  {id:"recepcao_conferencia",label:"Recepção em conferência",cor:G},
  {id:"documentos_anexados",label:"Documentos anexados",cor:T},
  {id:"claude_processando",label:"Claude processando",cor:AM},
  {id:"pronto_medico",label:"Pronto para médico",cor:VE},
  {id:"em_consulta",label:"Em consulta",cor:N},
  {id:"evolucao_salva",label:"Evolução salva",cor:VE},
  {id:"apac_validacao",label:"APAC em validação",cor:AM},
  {id:"apac_pronta",label:"APAC pronta",cor:VE},
  {id:"pendencia_administrativa",label:"Pendência administrativa",cor:VM},
];
const statusDossieMeta=id=>STATUS_DOSSIE.find(s=>s.id===id)||STATUS_DOSSIE[0];
export { statusDossieMeta };

const EXAMES_LAB_BASE=[
  ["hemograma","Hemograma completo"],
  ["ureia","Ureia"],
  ["creatinina","Creatinina"],
  ["tgo_tgp","TGO, TGP, FA, GGT e bilirrubinas"],
  ["eletronlitos","Sodio, potassio, calcio e magnesio"],
  ["glicemia","Glicemia"],
  ["albumina","Albumina e proteinas totais"],
  ["tsh_t4","TSH e T4 livre"],
  ["vitaminas","Vitamina D, B12 e ferritina"],
];
const MARCADORES_POR_CID=[
  {rx:/^C50/i,exames:["CEA","CA 15-3"]},
  {rx:/^C61/i,exames:["PSA total","PSA livre"]},
  {rx:/^C56|^C54|^C53/i,exames:["CA 125","CEA"]},
  {rx:/^C25|^C22|^C23|^C24/i,exames:["CA 19-9","CEA"]},
  {rx:/^C18|^C19|^C20/i,exames:["CEA"]},
  {rx:/^C16|^C15/i,exames:["CEA","CA 19-9"]},
];
const EXAMES_RADIO_BASE=[
  ["rx_torax","Radiografia de torax"],
  ["us_abdome","Ultrassonografia de abdome total"],
  ["us_mama","Ultrassonografia de mama"],
  ["tc_torax","Tomografia computadorizada de torax"],
  ["tc_abdome_pelve","Tomografia computadorizada de abdome e pelve"],
  ["tc_tap","Tomografia de torax, abdome e pelve"],
  ["rm_cranio","Ressonancia magnetica de cranio"],
  ["rm_pelve","Ressonancia magnetica de pelve"],
  ["rm_prostata","Ressonancia magnetica de prostata"],
  ["cintilo_ossea","Cintilografia ossea"],
  ["pet_ct","PET-CT"],
];

function miniButton(active=false){
  return {border:"1px solid "+(active?G:"#CBD5E1"),background:active?"#FFF8D8":"#fff",color:active?N:"#334155",borderRadius:8,padding:"7px 9px",fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"};
}

function MultiCheckDropdown({label,options,selected,onChange,placeholder="Selecionar",width=360,tone=T}){
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    if(!open)return;
    const close=(ev)=>{if(ref.current&&!ref.current.contains(ev.target))setOpen(false);};
    document.addEventListener("mousedown",close);
    return()=>document.removeEventListener("mousedown",close);
  },[open]);
  const selectedList=Array.isArray(selected)?selected:[];
  const toggle=(value)=>{
    const next=selectedList.includes(value)?selectedList.filter(v=>v!==value):[...selectedList,value];
    onChange&&onChange(next);
  };
  return <div ref={ref} style={{position:"relative",width:"min(100%,"+width+"px)"}}>
    <button type="button" onClick={()=>setOpen(v=>!v)} onDoubleClick={()=>setOpen(true)} style={{
      width:"100%",border:"1px solid "+(open?tone:"#CBD5E1"),background:"#fff",color:N,borderRadius:9,
      padding:"12px 13px",fontSize:13,fontWeight:950,cursor:"pointer",fontFamily:"inherit",
      display:"flex",justifyContent:"space-between",alignItems:"center",gap:8
    }}>
      <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}{selectedList.length?` (${selectedList.length})`:": "+placeholder}</span>
      <span style={{color:open?tone:"#64748B"}}>{open?"▲":"▼"}</span>
    </button>
    {open&&<div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:60,width:"min(560px,94vw)",background:"#fff",border:"1px solid #CBD5E1",borderRadius:12,boxShadow:"0 16px 34px rgba(15,23,42,.18)",overflow:"hidden"}}>
      <div style={{padding:"10px 12px",background:"#F8FAFC",borderBottom:"1px solid #E2E8F0",fontSize:11,fontWeight:950,color:"#64748B",textTransform:"uppercase",letterSpacing:.8}}>Clique, role e marque os itens desejados</div>
      <div style={{maxHeight:310,overflowY:"auto",padding:10,display:"grid",gap:7}}>
        {options.map(([value,text])=>{
          const checked=selectedList.includes(value);
          return <label key={value} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 11px",borderRadius:10,cursor:"pointer",background:checked?"#EAF7EE":"#fff",border:"1px solid "+(checked?VE+"66":"#E2E8F0"),fontSize:13,fontWeight:850,color:checked?VE:N,lineHeight:1.3}}>
            <input type="checkbox" checked={checked} onChange={()=>toggle(value)} style={{accentColor:VE,width:18,height:18,flexShrink:0}}/>
            <span>{text}</span>
          </label>;
        })}
      </div>
      <div style={{display:"flex",gap:7,padding:8,borderTop:"1px solid #E2E8F0",background:"#F8FAFC"}}>
        <button type="button" onClick={()=>onChange&&onChange([])} style={{...miniButton(),flex:1}}>Limpar</button>
        <button type="button" onClick={()=>setOpen(false)} style={{...miniButton(true),flex:1,background:N,color:"#fff",borderColor:N}}>Aplicar</button>
      </div>
    </div>}
  </div>;
}

function StatusDossieBar({dossie}){
  const meta=statusDossieMeta(dossie?.status);
  const docs=dossie?.documentos?.length||0;
  const apac=dossie?.apac||validarAPAC(dossie||{});
  const agentes=dossie?.agentes||dossie?.orquestracao?.agentes||[];
  return <div style={{display:"grid",gap:8,marginBottom:12}}>
    <div style={{display:"grid",gridTemplateColumns:"1.1fr .7fr .7fr .9fr",gap:8}}>
      <div style={sc_.card({padding:"10px 12px",borderLeft:"5px solid "+meta.cor})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>Status do dossiê</div><div style={{fontSize:13,color:meta.cor,fontWeight:900}}>{meta.label}</div></div>
      <div style={sc_.card({padding:"10px 12px"})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>Documentos</div><div style={{fontSize:18,color:N,fontWeight:900}}>{docs}</div></div>
      <div style={sc_.card({padding:"10px 12px"})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>APAC</div><div style={{fontSize:13,color:apac.riscoGlosa==="alto"?VM:apac.riscoGlosa==="moderado"?AM:VE,fontWeight:900}}>{apac.riscoGlosa==="baixo"?"Baixo risco":apac.riscoGlosa==="moderado"?"Risco moderado":"Alto risco"}</div></div>
      <div style={sc_.card({padding:"10px 12px",background:"#FFFBEB",borderColor:G+"55"})}><div style={{fontSize:9,color:"#64748B",fontWeight:900,textTransform:"uppercase"}}>Orquestração</div><div style={{fontSize:12,color:G,fontWeight:900}}>{agentes.length?`${agentes.length} agentes ativos`:"aguardando upload"}</div></div>
    </div>
    {agentes.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:6}}>
      {agentes.map(a=><div key={a.id||a.nome} style={{background:a.status==="pendente"?"#FFF7E6":a.status==="standby"?"#F8FAFC":"#EAF7EE",border:"1px solid "+(a.status==="pendente"?AM:a.status==="standby"?"#CBD5E1":VE)+"55",borderRadius:9,padding:"7px 9px"}}>
        <div style={{fontSize:10,fontWeight:950,color:a.status==="pendente"?AM:a.status==="standby"?"#64748B":VE}}>{a.status==="standby"?"⏳":"✅"} {a.nome}</div>
        <div style={{fontSize:9,color:"#64748B",marginTop:2}}>{a.acao}</div>
      </div>)}
    </div>}
  </div>;
}

function AtendimentosStandbyBar({pacientes=[],ativo,onAbrir,onNovo}){
  const uniq=useMemo(()=>{
    const itens=[];
    (pacientes||[]).forEach(p=>{
      const nome=p?.nome||p?.pac||"";
      if(!nome)return;
      const key=p.pacID||p.cpf||nome;
      if(!itens.find(x=>(x.pacID||x.cpf||x.nome)===key))itens.push({...p,nome});
    });
    return itens;
  },[pacientes]);
  const primeiro=uniq[0]||null;
  const visiveis=useMemo(()=>uniq.slice(0,12),[uniq]);
  const handleAtender=useCallback((p=primeiro)=>{
    if(!p)return;
    onAbrir&&onAbrir(p);
  },[primeiro,onAbrir]);
  const handleNovo=useCallback(()=>{
    onNovo&&onNovo();
  },[onNovo]);
  return <div style={{background:"#F8FAFC",borderBottom:"1px solid #CBD5E1",padding:"7px 12px",display:"flex",gap:8,alignItems:"center",overflowX:"auto",flexShrink:0}}>
    <span style={{fontSize:10,color:G,fontWeight:900,textTransform:"uppercase",whiteSpace:"nowrap"}}>Standby / atendimentos</span>
    {uniq.length===0&&<span style={{fontSize:11,color:"#94A3B8",whiteSpace:"nowrap"}}>Aguardando check-in da recepção.</span>}
    {visiveis.map((p,i)=>{const active=(ativo?.pacID&&p.pacID===ativo.pacID)||(!ativo?.pacID&&ativo?.nome&&p.nome===ativo.nome);return <button type="button" key={`${p.pacID||p.cpf||p.nome||"pac"}-${i}`} onClick={()=>handleAtender(p)} style={{border:"1px solid "+(active?G:"#CBD5E1"),background:active?G:"#fff",color:active?"#fff":N,borderRadius:999,padding:"6px 10px",fontSize:11,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"Segoe UI, Arial, sans-serif"}}>
      {p.status==="aguardando"?"⏳ ":p.status==="em_consulta"?"🩺 ":""}{p.nome}{p.checkin?" · "+p.checkin:""}
    </button>;})}
    <button type="button" aria-label="Novo atendimento" onClick={handleNovo} style={{marginLeft:"auto",border:"1px solid "+G,background:"#FFFBEB",color:G,borderRadius:999,padding:"6px 10px",fontSize:11,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>+ Novo atendimento</button>
  </div>;
}
function RecepcaoDossiePanel({pac,dossie,setDossie,upFiles,addMsg,onEnviar}) {
  const [drive,setDrive]=useState("");
  const [desc,setDesc]=useState("");
  const [agentes,setAgentes]=useState([]);
  const vincular=()=>{
    const docs=[
      ...(upFiles||[]).map(f=>criarDocumentoClinico({tipo:f.tp||"Upload",nome:f.n,resumo:"",origem:"recepcao_upload"})),
    ];
    if(drive.trim()||desc.trim())docs.push(criarDocumentoClinico({tipo:"Google Drive",nome:drive||"Pasta Drive",resumo:desc,origem:"recepcao_drive",link:drive||null}));
    if(!docs.length){alert("Anexe arquivo, cole link do Drive ou descreva os documentos.");return;}
    // Pipeline canônico — integra todos os docs de uma vez
    // Para recepção usamos setDossie com orquestração após integrar
    const dossieBase=dossie||criarDossieInicial(pac);
    const dossieComRecepcao={...dossieBase,paciente:{...(dossieBase.paciente||{}),...pac},recepcao:{...(dossieBase.recepcao||{}),conferido:true,conferidoEm:NOW(),observacoes:desc}};
    const novoDossie=integrarDocumentosNoDossie(docs,{pac,dossie:dossieComRecepcao,setDossie,up:null,addMsg});
    if(novoDossie){
      // Orquestra agentes após integração
      setDossie&&setDossie(()=>orquestrarDossieAtendimento(novoDossie,"secretaria_vinculo"));
    }
    const ativados=["Prontuário IA","Anti-glosa APAC","Médico","Farmácia","Enfermagem","Secretaria"];
    setAgentes(ativados);
    addMsg&&addMsg("Secretaria","Todos","Dossiê atualizado: upload/documentos vinculados para "+(pac?.nome||"paciente")+". Agentes ativados: "+ativados.join(", ")+".","laudo");
    alert("Documentos vinculados ao dossiê.");
  };
  return <div style={sc_.card({border:"2px solid "+G+"55"})}>
    <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:8}}>
      <H2 ch="Dossiê Oncológico — Recepção" s={{margin:0,fontSize:14}}/>
      <span style={{fontSize:10,fontWeight:900,color:statusDossieMeta(dossie?.status).cor}}>{statusDossieMeta(dossie?.status).label}</span>
    </div>
    <p style={{fontSize:12,color:"#64748B",margin:"0 0 10px"}}>A recepção confirma dados demográficos e agrega laudos. Campos clínicos ficam com paciente/médico.</p>
    <Fld l="Pasta ou link do Google Drive" val={drive} set={setDrive} ph="https://drive.google.com/... ou nome da pasta"/>
    <Fld l="Descrição dos documentos" val={desc} set={setDesc} ph="Ex: biópsia, IHQ, TC, laboratório..." ta rows={3}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
      <Btn v="navy" ch="Vincular documentos ao dossiê" s={{padding:11}} onClick={vincular}/>
      <Btn v="gold" ch="Enviar dossiê ao médico" s={{padding:11}} onClick={()=>{vincular();onEnviar&&onEnviar();}}/>
    </div>
    {agentes.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginTop:10}}>
      {agentes.map(a=><div key={a} style={{background:"#EAF7EE",border:"1px solid "+VE+"44",borderRadius:8,padding:"7px 9px",fontSize:10,fontWeight:900,color:VE}}>✅ {a}</div>)}
    </div>}
  </div>;
}

function DocumentosPosEvolucao({dossie,setDossie,addMsg,onAbrirAPAC}){
  const [sel,setSel]=useState({sintomaticos:true,antiemeticos:true,analgesia:false,medicacao_ev:false,exames:true,dieta:false,alarme:true,termo:false});
  const [docs,setDocs]=useState(dossie?.documentosGerados||[]);
  const cidPaciente=String(dossie?.paciente?.cid||dossie?.paciente?.cid_sugerido||"");
  const marcadoresSugeridos=useMemo(()=>MARCADORES_POR_CID.find(m=>m.rx.test(cidPaciente))?.exames||[],[cidPaciente]);
  const [labsSel,setLabsSel]=useState(()=>Object.fromEntries([...EXAMES_LAB_BASE.map(([k])=>[k,true]),...marcadoresSugeridos.map(m=>["marc_"+m,true])]));
  const [radioSel,setRadioSel]=useState({});
  const [manualLabs,setManualLabs]=useState("");
  const labOptions=useMemo(()=>[
    ...EXAMES_LAB_BASE,
    ...marcadoresSugeridos.map(m=>["marc_"+m,"Marcador tumoral: "+m]),
  ],[marcadoresSugeridos]);
  const labKeysSelecionadas=useMemo(()=>labOptions.filter(([k])=>!!labsSel[k]).map(([k])=>k),[labOptions,labsSel]);
  const radioKeysSelecionadas=useMemo(()=>EXAMES_RADIO_BASE.filter(([k])=>!!radioSel[k]).map(([k])=>k),[radioSel]);
  const atualizarLabs=(keys)=>setLabsSel(()=>Object.fromEntries(keys.map(k=>[k,true])));
  const atualizarRadio=(keys)=>setRadioSel(()=>Object.fromEntries(keys.map(k=>[k,true])));
  const opts=[
    ["sintomaticos","Receita sintomáticos"],["antiemeticos","Receita antieméticos"],["analgesia","Receita analgesia"],["medicacao_ev","Medicação EV"],["exames","Solicitação de exames"],["dieta","Orientações dietéticas"],["alarme","Sinais de alarme"],["termo","Termo de consentimento"],
  ];
  const textoPedidoLaboratorio=()=>{
    const exames=[
      ...EXAMES_LAB_BASE.filter(([k])=>labsSel[k]).map(([,l])=>l),
      ...marcadoresSugeridos.filter(m=>labsSel["marc_"+m]).map(m=>"Marcador tumoral: "+m),
    ];
    if(manualLabs.trim())exames.push(manualLabs.trim());
    return [
      "Paciente: "+(dossie?.paciente?.nome||""),
      "Solicito exames laboratoriais:",
      ...exames.map(e=>"- "+e),
      "",
      "Observacao: correlacionar com quadro clinico e tratamento oncologico em curso.",
    ].join("\n");
  };
  const textoPedidoRadiologico=(label)=>[
    "Paciente: "+(dossie?.paciente?.nome||""),
    "Solicito: "+label,
    "Indicacao: controle/estadiamento oncologico conforme diagnostico e conduta medica.",
    "Codigo SUS: conferir no faturamento.",
  ].join("\n");
  const gerarPedidosExames=()=>{
    const extras=[];
    const temLab=EXAMES_LAB_BASE.some(([k])=>labsSel[k])||marcadoresSugeridos.some(m=>labsSel["marc_"+m])||manualLabs.trim();
    if(temLab)extras.push({id:"labs-"+Date.now(),titulo:"Solicitacao de exames laboratoriais",texto:textoPedidoLaboratorio()});
    EXAMES_RADIO_BASE.filter(([k])=>radioSel[k]).forEach(([k,l],i)=>extras.push({id:"radio-"+k+"-"+Date.now()+"-"+i,titulo:"Solicitacao - "+l,texto:textoPedidoRadiologico(l)}));
    if(!extras.length){alert("Selecione pelo menos um exame laboratorial ou radiologico.");return;}
    const novos=[...extras,...docs];
    setDocs(novos);
    setDossie&&setDossie(d=>({...d,documentosGerados:novos,status:"documentos_exames_gerados",updatedAt:NOW()}));
  };
  const imprimirExamesSeparados=()=>{
    const temLab=EXAMES_LAB_BASE.some(([k])=>labsSel[k])||marcadoresSugeridos.some(m=>labsSel["marc_"+m])||manualLabs.trim();
    if(temLab)abrirDoc("Solicitacao de exames laboratoriais",textoPedidoLaboratorio());
    EXAMES_RADIO_BASE.filter(([k])=>radioSel[k]).forEach(([,l],i)=>setTimeout(()=>abrirDoc("Solicitacao - "+l,textoPedidoRadiologico(l)),(temLab?i+1:i)*300));
  };
  const gerar=()=>{
    const novos=gerarDocumentosSelecionados(dossie,sel);
    setDocs(novos);
    const apac=validarAPAC(dossie);
    setDossie&&setDossie(d=>({...d,documentosGerados:novos,apac,status:"evolucao_salva",updatedAt:NOW()}));
    addMsg&&addMsg("Médico","Equipe","Evolução salva e documentos gerados para "+(dossie?.paciente?.nome||"paciente")+".","msg");
  };
  const editarDoc=(id,texto)=>setDocs(x=>x.map(doc=>doc.id===id?{...doc,texto}:doc));
  const imprimirTodos=()=>abrirDoc("Documentos do atendimento — "+(dossie?.paciente?.nome||"paciente"),
    docs.map((doc,i)=>`${i+1}. ${doc.titulo}\n\n${doc.texto}`).join("\n\n"+"=".repeat(72)+"\n\n"));
  return <div style={sc_.card({border:"2px solid "+VE+"55"})}>
    <H2 ch="Gerar documentos após salvar" s={{fontSize:14}}/>
    <details open style={{background:"#F8FAFC",border:"1px solid #C7D7EA",borderRadius:10,padding:10,marginBottom:10}}>
      <summary style={{cursor:"pointer",fontSize:13,fontWeight:950,color:N}}>Pedidos de exames: laboratorio e radiologia</summary>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
        <div style={{background:"#fff",border:"1px solid #DDE3EC",borderRadius:9,padding:10}}>
          <div style={{fontSize:11,fontWeight:950,color:T,textTransform:"uppercase",marginBottom:7}}>Laboratoriais / marcadores</div>
          <MultiCheckDropdown
            label="Selecionar exames"
            options={labOptions}
            selected={labKeysSelecionadas}
            onChange={atualizarLabs}
            placeholder="abrir lista"
            tone={T}
          />
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8,minHeight:22}}>
            {labOptions.filter(([k])=>labsSel[k]).map(([k,l])=><span key={k} style={{background:"#EAF7EE",color:VE,border:"1px solid "+VE+"44",borderRadius:999,padding:"2px 7px",fontSize:10,fontWeight:850}}>{l}</span>)}
            {!labKeysSelecionadas.length&&<span style={{fontSize:11,color:"#94A3B8"}}>Nenhum exame selecionado.</span>}
          </div>
          <textarea value={manualLabs} onChange={e=>setManualLabs(e.target.value)} rows={3} placeholder="Exames adicionais ou observacoes manuais..." style={{...sc_.inp,width:"100%",resize:"vertical",fontSize:11.5,marginTop:8}}/>
        </div>
        <div style={{background:"#fff",border:"1px solid #DDE3EC",borderRadius:9,padding:10}}>
          <div style={{fontSize:11,fontWeight:950,color:T,textTransform:"uppercase",marginBottom:7}}>Exames radiologicos</div>
          <MultiCheckDropdown
            label="Selecionar imagens"
            options={EXAMES_RADIO_BASE}
            selected={radioKeysSelecionadas}
            onChange={atualizarRadio}
            placeholder="abrir lista"
            tone={T}
          />
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8,minHeight:22}}>
            {EXAMES_RADIO_BASE.filter(([k])=>radioSel[k]).map(([k,l])=><span key={k} style={{background:"#F0F9FF",color:T,border:"1px solid "+T+"44",borderRadius:999,padding:"2px 7px",fontSize:10,fontWeight:850}}>{l}</span>)}
            {!radioKeysSelecionadas.length&&<span style={{fontSize:11,color:"#94A3B8"}}>Nenhuma imagem selecionada.</span>}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <Btn v="teal" ch="Gerar pedidos de exames" s={{flex:1,padding:9,fontSize:11}} onClick={gerarPedidosExames}/>
        <Btn v="ghost" ch="Imprimir exames separados" s={{flex:1,padding:9,fontSize:11}} onClick={imprimirExamesSeparados}/>
      </div>
    </details>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
      {opts.map(([k,l])=><label key={k} style={{display:"flex",gap:7,alignItems:"center",fontSize:11,fontWeight:800,color:N,background:sel[k]?"#EAF7EE":"#F8FAFC",border:"1px solid "+(sel[k]?VE:"#CBD5E1"),borderRadius:8,padding:"7px 9px",cursor:"pointer"}}><input type="checkbox" checked={!!sel[k]} onChange={()=>setSel(x=>({...x,[k]:!x[k]}))} style={{accentColor:VE}}/>{l}</label>)}
    </div>
    <div style={{display:"flex",gap:8}}>
      <Btn v="green" ch="Gerar selecionados" s={{flex:1,padding:11}} onClick={gerar}/>
      <Btn v="navy" ch="Imprimir todos" s={{flex:1,padding:11}} dis={!docs.length} onClick={imprimirTodos}/>
      <Btn v="teal" ch="Imprimir separados" s={{flex:1,padding:11}} dis={!docs.length} onClick={()=>docs.forEach((doc,i)=>setTimeout(()=>abrirDoc(doc.titulo,doc.texto),i*350))}/>
      <Btn v="gold" ch="Abrir APAC anti-glosa" s={{flex:1,padding:11}} onClick={()=>{setDossie&&setDossie(d=>({...d,apac:validarAPAC(d),status:"apac_validacao"}));onAbrirAPAC&&onAbrirAPAC();}}/>
    </div>
    {docs.length>0&&<div style={{display:"grid",gap:8,marginTop:12}}>{docs.map((doc,i)=><div key={`${doc.id||doc.titulo||"doc"}-${i}`} style={{background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:10,padding:10}}>
      <strong style={{fontSize:12,color:N}}>{doc.titulo}</strong>
      <textarea value={doc.texto||""} onChange={e=>editarDoc(doc.id,e.target.value)} rows={9} style={{...sc_.inp,width:"100%",resize:"vertical",fontFamily:"Georgia, serif",fontSize:12,lineHeight:1.7,marginTop:7}}/>
      <div style={{display:"flex",gap:6,marginTop:6}}>
        <Btn v="ghost" ch="Imprimir" s={{fontSize:10}} onClick={()=>abrirDoc(doc.titulo,doc.texto)}/>
        <Btn v="teal" ch="Copiar" s={{fontSize:10}} onClick={()=>copiarTexto(doc.texto||"")}/>
      </div>
    </div>)}</div>}
  </div>;
}
export { StatusDossieBar, AtendimentosStandbyBar, RecepcaoDossiePanel, DocumentosPosEvolucao };
