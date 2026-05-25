// ─────────────────────────────────────────────────────────────────────────────
// EvolucoesProntuario.jsx — Evolução estruturada + histórico do prontuário
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { N, G, T, VE, VM, AUTOR } from "../../utils/constants";
import { sc_, H2, H3, Btn, NOW, TODAY, abrirDoc } from "../../components/ui/primitives";
import { autoPreencherCamposLaudos } from "../../utils/dossie";
import { executarProntuarioSecurity, marcarEvolucoesNaoValidadas } from "../../utils/security";

// ─── EVOLUÇÕES DO PRONTUÁRIO ──────────────────────────────────────────────────
function resumoAtendimentoEstruturado(pac,novaTexto=""){
  const labs=(pac?.exames_lab||[])[0]?.valores||{};
  const docs=pac?.docs_ia_resumo||pac?.docs_drive_resumo||"";
  const d=new Date().toLocaleDateString("pt-BR");
  const ll=[
    "EVOLUÇÃO ONCOLÓGICA — "+d,
    "Paciente: "+(pac?.nome||"___")+" · Nasc.: "+(pac?.nasc||"___")+" · Cidade: "+(pac?.cidade||"___"),
    "","1. QUEIXA / CONTEXTO",pac?.queixa||"—","",
    "2. ANTECEDENTES E MEDICAÇÕES",
    "Antecedentes: "+(pac?.antec||"—"),
    "Medicações: "+(pac?.meds||"—"),
    "Alergias: "+(pac?.alerg||"—"),
    "História familiar: "+(pac?.anam_hist_fam||"—"),
    "Cirurgias prévias: "+(pac?.anam_cirurgia||"—"),
    "","3. DIAGNÓSTICO ONCOLÓGICO",pac?.diag||"—",
    "CID: "+(pac?.cid||"—")+" · TNM: "+(pac?.tnm||"—")+" · Estádio: "+(pac?.estadio||"—"),
    "Biomarcadores: "+(pac?.bio||"—")+" · ECOG: "+(pac?.ecog||"—"),
    "","4. EXAME FÍSICO / FUNCIONAL",pac?.exFisico||"—",
    "","5. LABORATÓRIO / EXAMES",
    "Neutrófilos: "+(labs.Neutro||labs.neutro||"—")+" · Hb: "+(labs.Hgb||labs.hgb||"—")+" · Plaquetas: "+(labs.PLT||labs.plt||"—"),
    "Documentos/IA: "+(docs?docs.substring(0,900):"—"),
    "","6. TRATAMENTO / CONDUTA","Tratamento: "+(pac?.trat||"—"),
    "Linha: "+(pac?.linha||"—")+" · Intenção: "+(pac?.intencao||"—"),
    "","7. EVOLUÇÃO DO DIA",
    novaTexto||"Paciente avaliado(a). Manter seguimento oncológico conforme plano terapêutico e resultados laboratoriais.",
    "",AUTOR];
  return ll.join("\n");
}
function EvolucoesProntuario({pac,up,addMsg}){
  const [evolucoes,setEvolucoes]=useState(pac?.evolucoes||[]);
  // Sincroniza quando troca de paciente ou quando dados clínicos chegam da pré-consulta
  useEffect(()=>{setEvolucoes(pac?.evolucoes||[]);},[pac?.pacID,pac?.evolucoes?.length]);
  // Auto-preenche campos clínicos (diag, estadio, biomarcadores…) a partir do texto de AP/imagem
  useEffect(()=>{autoPreencherCamposLaudos(pac,up);},[pac?.anatom,pac?.imagen,pac?.pacID]);
  const [texto,setTexto]=useState("");
  const [tipo,setTipo]=useState("Consulta");
  const [filtro,setFiltro]=useState("Todos");
  const [editando,setEditando]=useState(false);
  const textoFinal=resumoAtendimentoEstruturado(pac,texto);
  const salvar=()=>{
    if(!executarProntuarioSecurity({pac,texto:textoFinal,origem:"Evolução do atendimento"},addMsg))return;
    const ev={id:Date.now(),data:TODAY(),hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),tipo,autor:AUTOR,texto:textoFinal};
    const novos=[ev,...evolucoes];
    setEvolucoes(novos);up&&up("evolucoes",novos);setTexto("");setEditando(false);
    addMsg&&addMsg("Médico","Equipe",`Nova evolução salva: ${pac?.nome||"paciente"}`,"prontuario");
  };
  // P0 — marca evoluções sem origem rastreável como "não validadas"
  const listaBase=filtro==="Todos"?evolucoes:evolucoes.filter(e=>e.tipo===filtro);
  const lista=marcarEvolucoesNaoValidadas(listaBase);
  const TIPOS=["Consulta","Primeira consulta","QT","Retorno","Intercorrência","Exame/Laudo","Telemedicina","Outro"];
  return <div style={{display:"grid",gap:12}}>
    <div style={sc_.card({border:`2px solid ${G}66`,background:"#FFFBEB"})}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
        <div><H2 ch="📋 Evolução estruturada do atendimento" s={{margin:0}}/><p style={{fontSize:12,color:"#64748B",margin:"3px 0 0"}}>Todas as informações do paciente ficam juntas em um resumo único, com histórico por data desde a primeira consulta.</p></div>
        <Btn v="gold" ch={editando?"Ocultar":"+ Evoluir agora"} s={{fontSize:12,whiteSpace:"nowrap"}} onClick={()=>setEditando(x=>!x)}/>
      </div>
      {editando&&<div style={{display:"grid",gap:9}}>
        <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:8}}>
          <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...sc_.inp,fontSize:12}}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select>
          <input value={texto} onChange={e=>setTexto(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)salvar();}} placeholder="Digite apenas a evolução do dia; o sistema agrega diagnóstico, exames, tratamento e histórico automaticamente..." style={{...sc_.inp,fontSize:12}} autoFocus/>
        </div>
        <textarea value={textoFinal} onChange={e=>setTexto(e.target.value)} rows={12} style={{...sc_.inp,width:"100%",resize:"vertical",fontSize:12,lineHeight:1.65,background:"#fff"}}/>
        <div style={{display:"flex",gap:8}}>
          <Btn v="green" ch="✅ Salvar evolução do atendimento" s={{flex:1,padding:12,fontSize:13}} onClick={salvar}/>
          <Btn v="ghost" ch="📋 Copiar" s={{fontSize:11}} onClick={()=>navigator.clipboard?.writeText(textoFinal)}/>
          <Btn v="teal" ch="📤 Enviar" s={{fontSize:11}} onClick={()=>abrirDoc("Evolução — "+(pac?.nome||"paciente"),textoFinal)}/>
        </div>
      </div>}
    </div>
    <div style={sc_.card()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
        <H3 ch="Histórico do paciente" s={{margin:0}}/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{["Todos",...TIPOS].map(t=><button key={t} onClick={()=>setFiltro(t)} style={{...sc_.btn(filtro===t?"navy":"ghost",{fontSize:10,padding:"4px 9px"})}}>{t}</button>)}</div>
      </div>
      <div style={{display:"grid",gap:10}}>{lista.map(e=>{
        const cor=e.tipo==="QT"?T:e.tipo==="Intercorrência"?VM:e.tipo==="Primeira consulta"?VE:G;
        const linhas=String(e.texto||"").split("\n");
        return <div key={e.id} style={{borderLeft:`5px solid ${cor}`,background:"#FAFCFF",borderRadius:"0 12px 12px 0",padding:"12px 16px",boxShadow:"0 2px 8px rgba(27,54,93,.06)"}}>
          {/* Cabeçalho */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:10}}>
            <div>
              <div style={{fontWeight:900,color:cor,fontSize:14,letterSpacing:.3}}>{e.tipo}</div>
              <div style={{fontSize:11,color:"#64748B",marginTop:1}}>{e.data}{e.hora?" · "+e.hora:""}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
              <div style={{fontSize:10,color:"#94A3B8"}}>{e.autor}</div>
              {/* P0 — badge para evoluções sem origem rastreável */}
              {e._validado===false&&<div title={`Origem: ${e._fonteOriginal}`} style={{fontSize:9,fontWeight:900,background:"#FFF7E6",color:"#B45309",border:"1px solid #B4530944",borderRadius:5,padding:"2px 6px",whiteSpace:"nowrap"}}>⚠ não validada</div>}
            </div>
          </div>
          {/* Corpo com parsing de seções */}
          <div style={{display:"grid",gap:2}}>
            {linhas.map((linha,i)=>{
              const l=String(linha||"").trim();
              if(!l)return null;
              // ===SEÇÃO=== — título grande, negrito, maiúsculas
              if(/^===.+===$/.test(l)){
                const titulo=l.replace(/^===|===$/g,"").trim();
                return <div key={i} style={{fontWeight:900,fontSize:18,color:N,textTransform:"uppercase",letterSpacing:.5,marginTop:i>0?14:2,marginBottom:4,paddingBottom:5,borderBottom:"3px solid "+G}}>{titulo}</div>;
              }
              // Cabeçalho de seção legado
              if(/^(\d+\.\s+[A-ZÁÊÃÕÜ\s\/]+|[A-ZÁÊÃÕÜ\s]{5,}[—:])/.test(l)){
                return <div key={i} style={{fontWeight:900,fontSize:14,color:N,textTransform:"uppercase",marginTop:i>0?10:0,marginBottom:2,paddingBottom:3,borderBottom:"1px solid "+cor+"44"}}>{l}</div>;
              }
              // Linha com bullet e chave: valor (ex: "• Diagnóstico: CEC")
              const bulletMatch=l.match(/^•\s*([^:]{1,40}):\s*(.+)$/);
              if(bulletMatch){
                return <div key={i} style={{fontSize:12,color:"#374151",lineHeight:1.6,display:"flex",gap:6,alignItems:"baseline"}}>
                  <span style={{fontWeight:800,color:N,minWidth:0,flexShrink:0}}>• {bulletMatch[1]}:</span>
                  <span style={{flex:1}}>{bulletMatch[2]}</span>
                </div>;
              }
              // Linha com chave: valor sem bullet
              if(l.includes(":")){
                const colon=l.indexOf(":");
                const chave=l.slice(0,colon).trim();
                const val=l.slice(colon+1).trim();
                if(chave&&val&&!val.startsWith("//")&&chave.length<40){
                  return <div key={i} style={{fontSize:12,color:"#374151",lineHeight:1.6,display:"flex",gap:6,alignItems:"baseline"}}>
                    <span style={{fontWeight:800,color:N,minWidth:0,flexShrink:0}}>• {chave}:</span>
                    <span style={{flex:1}}>{val}</span>
                  </div>;
                }
              }
              // Linha simples
              return <div key={i} style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{l.startsWith("•")?l:"• "+l}</div>;
            }).filter(Boolean)}
          </div>
        </div>;
      })}</div>
    </div>
  </div>;
}
export { resumoAtendimentoEstruturado, EvolucoesProntuario };
