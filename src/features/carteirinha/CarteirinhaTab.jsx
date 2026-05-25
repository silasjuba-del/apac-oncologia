// ─────────────────────────────────────────────────────────────────────────────
// CarteirinhaTab.jsx — Carteirinha do paciente oncológico + histórico QT
// Extraído de App.jsx — abrirPremium → abrirDoc (fix de bug pré-existente)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, G, T, VE, HOSP, AUTOR, calcProxCiclo } from "../../utils/constants";
import { sc_, Btn, H2, PrintModal, abrirDoc } from "../../components/ui/primitives";

export default function CarteirinhaTab({pac,pacID,histQT,addFila}){
  const [print,setPrint]=useState(null);
  const [qrZoom,setQrZoom]=useState(false);
  const hoje=new Date().toLocaleDateString("pt-BR");
  const qtFiltrado=(histQT||[]).filter(h=>!h.pacID||h.pacID===pacID||h.pacID==="");
  const proxData=qtFiltrado[0]?.proxCiclo||calcProxCiclo(pac.trat,new Date());
  const txtCarteirinha=`CARTEIRINHA — ${pacID}\nNome: ${pac.nome||"___"}\nNasc: ${pac.nasc||"___"} · CPF: ${pac.cpf||"___"}\nCidade: ${pac.cidade||"___"} · Mãe: ${pac.mae||"___"}\nCNS: ${pac.cns||"___"}\n\nHISTÓRICO QT:\n${qtFiltrado.map(q=>`${q.data} · ${q.protocolo} · Ciclo ${q.ciclo}`).join("\n")}\n\nPróximo ciclo: ${proxData} (confirmar com secretaria)\n\n${HOSP} · ${AUTOR}`;
  return <div style={{display:"grid",gap:14}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <div style={{background:`linear-gradient(135deg,${N} 0%,#0d2347 60%,#1a3a6e)`,borderRadius:20,padding:"20px 22px",boxShadow:"0 12px 40px rgba(0,0,0,.35)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,background:"rgba(184,134,11,.1)",borderRadius:"50%"}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <div><div style={{color:G,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Oncologia Integrada</div><div style={{color:"rgba(255,255,255,.5)",fontSize:8}}>{HOSP} · Patos/PB</div></div>
        <div style={{background:G,borderRadius:8,padding:"3px 9px",fontSize:9,fontWeight:900,color:"#fff"}}>CARTEIRINHA</div>
      </div>
      <div style={{textAlign:"center",marginBottom:10,paddingBottom:8,borderBottom:"1px solid rgba(255,255,255,.15)"}}>
        <div style={{fontSize:11,fontWeight:900,color:"rgba(255,255,255,.4)",letterSpacing:3}}>H</div>
        <div style={{fontSize:14,fontWeight:900,color:"#fff",letterSpacing:1}}>HOSPITAL DO BEM</div>
        <div style={{fontSize:8,color:G,letterSpacing:1}}>UNIDADE ONCOLÓGICA · PATOS/PB</div>
      </div>
      <div style={{color:G,fontSize:20,fontWeight:900,marginBottom:3}}>{pacID}</div>
      <div style={{color:"#fff",fontSize:16,fontWeight:700,marginBottom:2}}>{pac.nome||"Nome do Paciente"}</div>
      <div style={{color:"rgba(255,255,255,.5)",fontSize:10,marginBottom:10}}>{pac.nasc||"Nascimento"} · {pac.cpf||"CPF"}</div>
      <div style={{borderTop:"1px solid rgba(255,255,255,.15)",paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{color:G,fontSize:9,fontWeight:700,textTransform:"uppercase"}}>Mãe</div>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>{pac.mae||"—"}</div>
          <div style={{color:G,fontSize:9,fontWeight:700,textTransform:"uppercase",marginTop:4}}>CNS</div>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>{pac.cns||"—"}</div>
          <div style={{color:G,fontSize:9,fontWeight:700,textTransform:"uppercase",marginTop:4}}>Cidade</div>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>{pac.cidade||"—"}</div>
        </div>
        <div style={{textAlign:"center",cursor:"pointer"}} onClick={()=>setQrZoom(z=>!z)}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pacID+"|"+(pac.nome||"")+"|"+(pac.trat||"")+"|"+proxData)}`} alt="QR" style={{width:qrZoom?240:120,height:qrZoom?240:120,borderRadius:10,background:"#fff",padding:6,transition:"all .3s",boxShadow:qrZoom?"0 0 0 8px "+G+",0 16px 48px rgba(0,0,0,.5)":"0 4px 12px rgba(0,0,0,.2)"}}/>
          <div style={{color:qrZoom?G:"rgba(255,255,255,.5)",fontSize:qrZoom?10:8,marginTop:3,fontWeight:qrZoom?900:400}}>{qrZoom?"📲 Pronto para escanear":"Toque para ampliar"}</div>
        </div>
      </div>
    </div>
    {qtFiltrado.length>0&&<div style={{background:`linear-gradient(135deg,${VE},#052e16)`,borderRadius:14,padding:"12px 16px",color:"#fff"}}>
      <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:2,color:"rgba(255,255,255,.6)",marginBottom:3}}>Próximo Ciclo Previsto</div>
      <div style={{fontSize:20,fontWeight:900}}>{proxData}</div>
      <div style={{color:"rgba(255,255,255,.5)",fontSize:10,marginTop:3}}>⚠️ Confirmar data e horário com a secretaria antes de vir</div>
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      <Btn v="teal" ch="📲 Check-in com 1 Clique" s={{fontSize:13,padding:12,fontWeight:900}} onClick={()=>{if(addFila){addFila({nome:pac.nome||"Paciente",proto:pac.trat,ciclo:"C1D1",pacID});alert(`✅ Check-in realizado!\n${pac.nome||"Paciente"}\nAguarde ser chamado.`);}}}/>
      <Btn v="gold" ch="🖨 Imprimir Carteirinha" s={{fontSize:12,padding:12}} onClick={()=>abrirDoc("Carteirinha — "+pacID,txtCarteirinha)}/>
    </div>
    <div style={sc_.card()}>
      <H2 ch="💉 Histórico de Quimioterapia"/>
      {qtFiltrado.length===0?<p style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:16}}>Nenhuma infusão registrada ainda.</p>
        :<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>{["Data","Protocolo","Ciclo","Próximo Ciclo"].map(cc=><th key={cc} style={{background:N,color:"#fff",padding:"6px 8px",textAlign:"left",fontSize:10}}>{cc}</th>)}</tr></thead>
          <tbody>{qtFiltrado.map((h,i)=><tr key={i} style={{background:i%2?"#F8FAFC":"#fff"}}>
            <td style={{padding:"7px 8px",fontSize:11,fontWeight:700,color:N}}>{h.data}</td>
            <td style={{padding:"7px 8px",fontSize:11,color:T,fontWeight:700}}>{h.protocolo}</td>
            <td style={{padding:"7px 8px",fontSize:11}}>{h.ciclo}</td>
            <td style={{padding:"7px 8px"}}><div style={{fontSize:11,fontWeight:700,color:VE}}>{h.proxCiclo}</div><div style={{fontSize:9,color:"#94A3B8",fontStyle:"italic"}}>⚠ Confirmar com secretaria</div></td>
          </tr>)}</tbody>
        </table></div>}
    </div>
  </div>;
}
