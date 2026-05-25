// ─────────────────────────────────────────────────────────────────────────────
// InboxPaciente.jsx — Caixa de entrada e chat do paciente com a equipe
// Extraído de App.jsx — abrirPremium → abrirDoc (fix de bug pré-existente)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, T, G, VE, VM } from "../../utils/constants";
import { sc_, Btn, abrirDoc } from "../../components/ui/primitives";

export default function InboxPaciente({pacID,pac,caixa,setCaixa,mensagens,addMsg}){
  const [selecionado,setSelecionado]=useState(null);
  const [chatDest,setChatDest]=useState("Recepção");
  const [chatTxt,setChatTxt]=useState("");
  const [aba,setAba]=useState("inbox");
  const [msg,setMsg]=useState("");
  const marcarLida=(id)=>setCaixa(x=>x.map(m=>m.id===id?{...m,lida:true}:m));
  const enviarMsg=()=>{if(!chatTxt.trim())return;if(addMsg)addMsg("Paciente",chatDest,chatTxt,"msg");setMsg(`✓ Mensagem enviada`);setTimeout(()=>setMsg(""),2000);setChatTxt("");};
  const TIPO_COR={laudo:T,receita:G,msg:N,alerta:VM};
  const TIPO_ICO={laudo:"🧪",receita:"💊",msg:"✉️",alerta:"🚨"};
  return <div style={{display:"grid",gap:12}}>
    <div style={{background:N,display:"flex",borderRadius:12,overflow:"hidden"}}>
      {[{id:"inbox",l:"📬 Mensagens"},{id:"chat",l:"💬 Falar com Equipe"}].map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{border:"none",cursor:"pointer",padding:"9px 16px",fontSize:12,fontWeight:800,flex:1,background:aba===a.id?G:N,color:aba===a.id?"#fff":"rgba(255,255,255,.55)"}}>{a.l}</button>)}
    </div>
    {aba==="inbox"&&<div>
      <div style={{background:`linear-gradient(135deg,${N},${T})`,borderRadius:12,padding:"9px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"center"}}>
        <div style={{width:36,height:36,background:G,borderRadius:"50%",display:"grid",placeItems:"center",fontWeight:900,color:"#fff",fontSize:12,flexShrink:0}}>{pacID?.slice(-4)}</div>
        <div style={{flex:1}}><div style={{color:G,fontWeight:900,fontSize:12}}>{pacID}</div><div style={{color:"rgba(255,255,255,.6)",fontSize:10}}>{pac.nome||"Paciente"}</div></div>
        <div style={{background:(caixa||[]).filter(m=>!m.lida).length>0?VM:"rgba(255,255,255,.15)",color:"#fff",borderRadius:999,padding:"2px 9px",fontSize:10,fontWeight:900}}>{(caixa||[]).filter(m=>!m.lida).length} nova{(caixa||[]).filter(m=>!m.lida).length!==1?"s":""}</div>
      </div>
      {selecionado===null
        ?<div style={{display:"grid",gap:8}}>
          {(caixa||[]).length===0&&<div style={{textAlign:"center",padding:24,color:"#94A3B8"}}><div style={{fontSize:32,marginBottom:6}}>📬</div><p>Nenhuma mensagem ainda.</p></div>}
          {(caixa||[]).map(m=><div key={m.id} onClick={()=>{setSelecionado(m);marcarLida(m.id);}} style={{border:`1.5px solid ${m.lida?"#CBD5E1":TIPO_COR[m.tipo]||N}`,borderRadius:13,padding:"10px 13px",cursor:"pointer",background:m.lida?"#F8FAFC":"#fff"}}>
            <div style={{display:"flex",gap:9,alignItems:"center"}}>
              <span style={{fontSize:20,flexShrink:0}}>{TIPO_ICO[m.tipo]||"✉️"}</span>
              <div style={{flex:1}}><strong style={{color:N,fontSize:12}}>{m.titulo}</strong>{!m.lida&&<span style={{background:TIPO_COR[m.tipo]||N,color:"#fff",padding:"1px 7px",borderRadius:999,fontSize:8,fontWeight:900,marginLeft:6}}>NOVA</span>}<div style={{color:"#64748B",fontSize:9,marginTop:1}}>{m.de} · {m.dt}</div></div>
            </div>
          </div>)}
        </div>
        :<div>
          <button onClick={()=>setSelecionado(null)} style={{...sc_.btn("ghost",{fontSize:11,marginBottom:9})}}>← Voltar</button>
          <div style={sc_.card()}>
            <strong style={{color:N,display:"block",fontSize:14,marginBottom:4}}>{selecionado.titulo}</strong>
            <small style={{color:"#64748B",fontSize:10,display:"block",marginBottom:10}}>De: {selecionado.de} · {selecionado.dt}</small>
            <pre style={{whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",fontSize:12,lineHeight:1.7,color:"#1E293B",background:"#F8FAFC",borderRadius:9,padding:12}}>{selecionado.conteudo}</pre>
            <div style={{display:"flex",gap:7,marginTop:10}}>
              <Btn v="teal" ch="📋 Copiar" s={{fontSize:11}} onClick={()=>navigator.clipboard?.writeText(selecionado.conteudo)}/>
              <Btn v="navy" ch="🖨 Imprimir" s={{fontSize:11}} onClick={()=>abrirDoc(selecionado.titulo,selecionado.conteudo)}/>
            </div>
          </div>
        </div>}
    </div>}
    {aba==="chat"&&<div>
      <div style={{display:"flex",gap:7,marginBottom:10}}>
        {["Recepção","Enfermagem","Assistência Social"].map(d=><button key={d} onClick={()=>setChatDest(d)} style={{...sc_.btn(chatDest===d?"navy":"ghost",{fontSize:11,flex:1})}}>{d==="Recepção"?"📋 Recepção":d==="Enfermagem"?"🩺 Enfermagem":"🤝 Assist. Social"}</button>)}
      </div>
      <div style={sc_.card()}>
        {msg&&<p style={{fontSize:11,color:VE,padding:"4px 8px",background:"#EAF7EE",borderRadius:6,marginBottom:6}}>{msg}</p>}
        <div style={{maxHeight:200,overflowY:"auto",marginBottom:9,display:"flex",flexDirection:"column",gap:6}}>
          {(mensagens||[]).filter(m=>(m.de==="Paciente"&&m.para===chatDest)||(m.de===chatDest&&m.para==="Paciente")).slice(0,10).map((m,i)=><div key={i} style={{display:"flex",flexDirection:m.de==="Paciente"?"row-reverse":"row",gap:7}}>
            <div style={{maxWidth:"75%",background:m.de==="Paciente"?T:"#F1F5F9",color:m.de==="Paciente"?"#fff":"#374151",borderRadius:11,padding:"7px 11px",fontSize:12}}>
              <div style={{fontSize:8,opacity:.6,marginBottom:2}}>{m.de} · {m.dt?.split(" ")[1]||""}</div>{m.txt}
            </div>
          </div>)}
          {(mensagens||[]).filter(m=>m.de==="Paciente"&&m.para===chatDest).length===0&&<p style={{color:"#94A3B8",fontSize:11,textAlign:"center",padding:14}}>Inicie uma conversa com {chatDest}</p>}
        </div>
        <div style={{display:"flex",gap:7}}>
          <input value={chatTxt} onChange={e=>setChatTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enviarMsg()} placeholder={`Mensagem para ${chatDest}...`} style={{...sc_.inp,flex:1,fontSize:12}}/>
          <Btn v="teal" ch="Enviar" s={{fontSize:11}} onClick={enviarMsg}/>
        </div>
      </div>
      <div style={{...sc_.card({marginTop:8,background:chatDest==="Recepção"?"#EFF9FF":chatDest==="Enfermagem"?"#EAF7EE":"#FFFBEB",border:`1px solid ${chatDest==="Recepção"?T:chatDest==="Enfermagem"?VE:G}`})}}>
        <small style={{fontWeight:700,color:N,display:"block",marginBottom:5}}>Mensagens rápidas:</small>
        {(chatDest==="Recepção"?["Quero agendar retorno","Confirmar consulta agendada","Preciso remarcar meu horário","Qual o status do meu exame?","Preciso mais informações sobre o tratamento","Tive reação — quando posso ligar?"]:
          chatDest==="Enfermagem"?["Estou com náuseas após a QT","Tenho dúvida sobre meu medicamento","Sinto dor no local da punção","Quando será meu próximo ciclo?","Preciso de orientação sobre efeitos colaterais"]:
          ["Preciso de suporte financeiro","Dificuldade para vir às consultas","Quero informações sobre TFD","Preciso do laudo para INSS","Quero falar com o assistente social"]
        ).map((txt,i)=><button key={i} onClick={()=>{if(addMsg){addMsg("Paciente",chatDest,txt,"msg");setMsg(`✓ "${txt.substring(0,30)}"`);setTimeout(()=>setMsg(""),2000);}}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",textAlign:"left",border:`1px solid ${chatDest==="Recepção"?T+"44":chatDest==="Enfermagem"?VE+"44":G+"44"}`,borderRadius:8,padding:"7px 10px",marginBottom:4,cursor:"pointer",background:"#fff",fontSize:11,fontFamily:"inherit",color:N,fontWeight:600}}><span>{txt}</span><span style={{color:chatDest==="Recepção"?T:chatDest==="Enfermagem"?VE:G,fontSize:13}}>→</span></button>)}
      </div>
    </div>}
  </div>;
}
