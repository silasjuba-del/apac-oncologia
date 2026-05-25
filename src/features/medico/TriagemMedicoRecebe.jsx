// ─────────────────────────────────────────────────────────────────────────────
// TriagemMedicoRecebe.jsx — Médico recebe triagem de enfermagem, valida conduta
// Inclui: TriagemPrescricaoModal (modal interno)
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, G, T, VM, AM, VE } from "../../utils/constants";
import { sc_, H2, Btn, Bge, Cbox, TODAY } from "../../components/ui/primitives";
import { condutasDeResumoTriagem, textoPrescricaoTriagem, refsCondutas } from "../enfermagem/triagem-utils";

function TriagemPrescricaoModal({triagem,onClose,onSalvar}){
  const base=triagem?.prescricaoModelo||textoPrescricaoTriagem(triagem?.condutas||[]);
  const [txt,setTxt]=useState(base);
  return <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:18}}>
    <div style={{background:"#fff",border:`3px solid ${G}`,borderRadius:18,width:"min(980px,96vw)",maxHeight:"90vh",overflow:"auto",boxShadow:"0 28px 90px rgba(15,23,42,.35)"}}>
      <div style={{background:N,color:"#fff",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
        <div><strong style={{fontSize:18}}>Prescrição-modelo da triagem</strong><div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>{triagem?.nome||"Paciente"} · validação médica obrigatória</div></div>
        <button onClick={onClose} style={{border:"none",background:"rgba(255,255,255,.12)",color:"#fff",borderRadius:999,width:34,height:34,cursor:"pointer",fontWeight:900}}>×</button>
      </div>
      <div style={{padding:18,display:"grid",gap:12}}>
        <div style={{background:"#FFF7E6",border:`1px solid ${G}55`,borderRadius:10,padding:10,color:N,fontSize:12,fontWeight:800}}>
          Modelo institucional editável. Não é ordem automática de administração. Só vira documento definitivo após validação e assinatura médica.
        </div>
        <textarea value={txt} onChange={e=>setTxt(e.target.value)} rows={24} style={{...sc_.inp,fontFamily:"Arial, sans-serif",fontSize:14,lineHeight:1.55,resize:"vertical",background:"#fff"}}/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap"}}>
          <Btn v="ghost" ch="Copiar" onClick={()=>navigator.clipboard?.writeText(txt)}/>
          <Btn v="navy" ch="Fechar" onClick={onClose}/>
          <Btn v="gold" ch="Validar e salvar modelo" onClick={()=>onSalvar&&onSalvar(txt)}/>
        </div>
      </div>
    </div>
  </div>;
}
export default function TriagemMedicoRecebe({triagens,pac,addMsg,onValidar,onEnviarDiscussao}){
  const [presc,setPresc]=useState(null);
  const [validados,setValidados]=useState({});
  if(!triagens?.length)return <div style={{textAlign:"center",padding:28,color:"#94A3B8"}}><div style={{fontSize:32,marginBottom:8}}>📭</div><p style={{fontSize:12}}>Nenhum resumo de triagem recebido no momento.</p></div>;
  const validar=(t,txt)=>{
    setValidados(x=>({...x,[t.id]:true}));
    onValidar&&onValidar(t,txt||t.prescricaoModelo||"Conduta validada.");
    addMsg&&addMsg("Médico","Enfermagem",`Conduta da triagem validada para ${t.nome||pac?.nome||"paciente"}.`,"triagem");
    setPresc(null);
  };
  return <div style={{display:"grid",gap:12}}>
    {presc&&<TriagemPrescricaoModal triagem={presc} onClose={()=>setPresc(null)} onSalvar={txt=>validar(presc,txt)}/>}
    <div style={sc_.card({background:"#fff",border:`2px solid ${G}55`})}>
      <H2 ch="Resumo Triagem"/>
      <p style={{fontSize:12,color:"#64748B",margin:0}}>A enfermagem envia o resumo; o médico valida conduta, edita prescrição-modelo e pode levar o caso para discussão clínica com IA.</p>
    </div>
    {triagens.map(t=>{
      const condutas=t.condutas?.length?t.condutas:condutasDeResumoTriagem(t.resumo||"",t.alarmes||[]);
      const critico=condutas.some(c=>c.nivel==="critico");
      const alto=condutas.some(c=>c.nivel==="alto");
      const borda=critico?VM:alto?AM:T;
      return <div key={t.id} style={sc_.card({border:`2px solid ${borda}66`,background:critico?"#FFF5F5":"#fff"})}>
        <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",marginBottom:10}}>
          <div>
            <strong style={{color:N,fontSize:16,display:"block"}}>{t.nome||pac?.nome||"Paciente"} · {t.ciclo||"Ciclo não informado"}</strong>
            <span style={{fontSize:11,color:"#64748B"}}>{t.origem||"Triagem"} · {t.data||TODAY()} {t.hora||""}</span>
          </div>
          <Bge t={critico?"bad":alto?"warn":"ok"} ch={t.conclusao||"TRIAGEM RECEBIDA"}/>
        </div>
        <div style={{display:"grid",gap:10}}>
          <Cbox text={t.resumo||`Paciente: ${t.nome}\nConclusão: ${t.conclusao}\nObs: ${t.obs||"—"}`} maxH={200}/>
          {condutas.length>0&&<div style={{display:"grid",gap:8}}>
            {condutas.map(c=><div key={c.id} style={{border:`1px solid ${(c.nivel==="critico"?VM:c.nivel==="alto"?AM:G)}55`,borderRadius:12,padding:12,background:c.nivel==="critico"?"#FFF0F0":c.nivel==="alto"?"#FFF7E6":"#F8FAFC"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:6}}>
                <strong style={{color:c.nivel==="critico"?VM:N,fontSize:14}}>{c.titulo}</strong>
                <span style={{fontSize:10,fontWeight:900,color:c.nivel==="critico"?VM:AM,textTransform:"uppercase"}}>{c.gravidade}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><div style={{fontSize:10,fontWeight:900,color:G,textTransform:"uppercase",marginBottom:3}}>Enfermagem</div><p style={{fontSize:12,color:"#334155",margin:0,lineHeight:1.45}}>{c.acao}</p></div>
                <div><div style={{fontSize:10,fontWeight:900,color:G,textTransform:"uppercase",marginBottom:3}}>Referência ao médico</div><p style={{fontSize:12,color:"#334155",margin:0,lineHeight:1.45}}>{c.acionar}</p></div>
              </div>
              <div style={{marginTop:8,fontSize:11,color:"#64748B"}}><strong>Exames sugeridos:</strong> {c.exames.join(" · ")}</div>
            </div>)}
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{refsCondutas(condutas).map(r=><a key={r.url} href={r.url} target="_blank" rel="noreferrer" style={{fontSize:10,color:T,fontWeight:900,textDecoration:"none",border:`1px solid ${T}33`,borderRadius:999,padding:"4px 9px",background:"#EFF9FF"}}>{r.rotulo}</a>)}</div>
          </div>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <Btn v="ghost" ch="Ver prescrição-modelo" s={{fontSize:11}} onClick={()=>setPresc({...t,condutas,prescricaoModelo:t.prescricaoModelo||textoPrescricaoTriagem(condutas)})}/>
            <Btn v={validados[t.id]?"green":"gold"} ch={validados[t.id]?"Conduta validada":"Validar conduta"} s={{fontSize:11}} onClick={()=>validar({...t,condutas,prescricaoModelo:t.prescricaoModelo||textoPrescricaoTriagem(condutas)})}/>
            <Btn v="navy" ch="Enviar para Discussão Clínica" s={{fontSize:11}} onClick={()=>onEnviarDiscussao&&onEnviarDiscussao({...t,condutas,prescricaoModelo:t.prescricaoModelo||textoPrescricaoTriagem(condutas)})}/>
          </div>
        </div>
      </div>;
    })}
  </div>;
}
