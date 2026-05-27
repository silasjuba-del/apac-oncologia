// ─────────────────────────────────────────────────────────────────────────────
// UploadComIA.jsx — Upload e análise de documentos com IA (PDF/imagem/texto)
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef } from "react";
import { N, T, G, VE } from "../../utils/constants";
import { abrirDrive } from "../../utils/constants";
import { sc_, Btn, ResumoBullets, copiarTexto } from "../../components/ui/primitives";
import { _apiUrl, _backendHeaders, chamarGPT } from "../../utils/api";
import { executarProntuarioSecurity } from "../../utils/security";

export default function UploadComIA({pac,up,addMsg,destino="prontuario",origem="Médico",onConcluido}){
  const [arqs,setArqs]=useState([]);
  const [loading,setLoading]=useState(false);
  const [resultado,setResultado]=useState(null);
  const [txtColar,setTxtColar]=useState("");
  const [abaUp,setAbaUp]=useState("upload");
  const [caminhoLocal,setCaminhoLocal]=useState("");
  const [drag,setDrag]=useState(false);
  const [driveAberto,setDriveAberto]=useState(false);
  const refA=useRef(null);const refC=useRef(null);
  const addArquivos=files=>setArqs(x=>{
    const lista=Array.from(files||[]).map(f=>({ico:f.type?.includes("image")?"📸":"📄",n:f.name,tipo:f.type?.includes("image")?"Imagem":"Documento",obj:f}));
    const seen=new Set(x.map(a=>a.n+"_"+(a.obj?.size||0)));
    return [...x,...lista.filter(a=>!seen.has(a.n+"_"+(a.obj?.size||0)))];
  });
  const onArq=e=>{addArquivos(e.target.files);e.target.value="";};
  const onCam=e=>{addArquivos(e.target.files);e.target.value="";};
  const onDrop=e=>{e.preventDefault();setDrag(false);addArquivos(e.dataTransfer.files);setAbaUp("upload");};
  const arquivoBase64=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||"").split(",")[1]||"");r.onerror=reject;r.readAsDataURL(file);});
  const tipoPorNome=nome=>{const n=String(nome||"").toLowerCase();if(n.includes("biop"))return "biópsia";if(n.includes("ihq")||n.includes("imuno"))return "imunohistoquímica";if(n.includes("tomo")||n.includes("tc"))return "tomografia";if(n.includes("resson")||/\\brm\\b/.test(n))return "ressonância";if(n.includes("mamog"))return "mamografia";if(n.includes("pet"))return "PET-CT";if(n.includes("lab")||n.includes("hemo"))return "laboratório";return "exame";};
  const nomeArquivoLocal=caminho=>String(caminho||"").replace(/^file:\/\/\/?/i,"").split(/[\\/]/).filter(Boolean).pop()||"arquivo local";
  const registrarResultado=(res,meta={})=>{
    if(destino==="prontuario"&&!executarProntuarioSecurity({pac,texto:res,origem:"Upload com IA"},addMsg))return;
    setResultado(res);
    if(up&&destino==="lab")up("exames_lab_texto",res);
    else if(up&&destino==="imagem")up("exames_imagem_texto",res);
    else if(up)up("docs_ia_resumo",(pac?.docs_ia_resumo||"")+"\n\n---\n"+res);
    onConcluido&&onConcluido(res,meta);
    if(addMsg)addMsg(origem,"Médico",`📎 Documento enviado via IA — ${pac?.nome||"paciente"} · Destino: ${destino}`,"laudo");
  };
  const processarCaminhoLocal=async()=>{
    if(!caminhoLocal.trim()){alert("Cole o caminho local do PDF/imagem.");return;}
    setLoading(true);
    try{
      const nome=nomeArquivoLocal(caminhoLocal);
      const r=await fetch(_apiUrl()+"/api/dossie/ler-local",{method:"POST",headers:_backendHeaders(),body:JSON.stringify({paciente_id:Number(pac?.id||pac?.paciente_id)||null,paciente:pac||{},recepcao:{},caminho:caminhoLocal.trim(),tipo:tipoPorNome(nome),data:new Date().toISOString().slice(0,10)})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok)throw new Error(d.message||("HTTP "+r.status));
      registrarResultado(d.text||d.resumo||d.resumoLaudo||"",{arquivos:[{n:nome,tipo:"Caminho local",caminho:caminhoLocal}],texto:"",destino,origem,tipo:"Caminho local"});
    }catch(e){
      const msg="⚠ Falha ao ler caminho local: "+e.message;
      setResultado(msg);
    }finally{setLoading(false);}
  };
  const processar=async()=>{
    const texto=abaUp==="colar"?txtColar:arqs.map(a=>a.n).join("; ");
    if(!texto.trim()&&arqs.length===0){alert("Envie um arquivo, arraste um documento ou cole um texto.");return;}
    setLoading(true);
    const keys=JSON.parse(localStorage.getItem("ia_keys")||"{}");
    const filesPayload=[];
    for(const a of arqs){
      if(a.obj){
        const mimeType=a.obj.type||(/\.pdf$/i.test(a.n)?"application/pdf":"application/octet-stream");
        if(["application/pdf","image/jpeg","image/png","image/webp"].includes(mimeType)){
          filesPayload.push({name:a.n,mimeType,base64:await arquivoBase64(a.obj)});
        }
      }
    }
    const prompt=`Você é um assistente médico especializado em oncologia. Leia integralmente os PDFs/imagens anexados e/ou o texto abaixo. Gere UM ÚNICO resumo estruturado para o prontuário oncológico. Não invente dados. Não defina conduta.
Formato obrigatório, sem markdown e sem parágrafos longos:

DADOS CLÍNICOS:
Antecedentes patológicos:
Medicações de uso contínuo:
Alergias:
Cirurgias prévias:
Calendário vacinal:
Histórico familiar:

DADOS ONCOLÓGICOS:
Tipo de tumor:
Sede tumoral:
Estadiamento/TNM:
Estágio:
Subtipo:
Biomarcadores:
CID-10:
ECOG:

LAUDOS EM CRONOLOGIA:
• DD/MM/AA - TIPO DO EXAME - resumo com foco oncológico em uma linha. Exemplo: 03/03/26 - TC TÓRAX - Massa pulmonar em segmento inferior medindo 8,2 cm, linfonodo mediastinal direito 2,3 cm (outros achados: nefrolitíase direita, colelitíase).

PENDÊNCIAS:
• Uma pendência objetiva por linha.

Paciente: ${pac?.nome||"—"} · Nascimento: ${pac?.nasc||"—"} · Diagnóstico: ${pac?.diag||"—"}

Arquivos anexados: ${arqs.map(a=>a.n).join(", ")||"nenhum"}
Texto colado:
${abaUp==="colar"?txtColar:""}`;
    let res="";
    try{
      const r=await fetch(_apiUrl()+"/api/claude/resumo",{method:"POST",headers:_backendHeaders(),body:JSON.stringify({prompt,maxTokens:1200,files:filesPayload})});
      const d=await r.json().catch(()=>({}));
      if(r.ok&&d.ok)res=d.text||"";
      else res="⚠ "+(d.message||("Falha ao ler PDF no backend: HTTP "+r.status));
    }catch(e){res="⚠ Backend Claude indisponível: "+e.message;}
    if((!res||String(res).startsWith("⚠"))&&keys.openai&&!filesPayload.length){try{res=await chamarGPT(prompt,keys.openai,600);}catch(e){}}
    if(!res)res=`📋 RESUMO IA — ${new Date().toLocaleDateString("pt-BR")}

Documento(s): ${arqs.map(a=>a.n).join(", ")||txtColar.substring(0,120)}

Paciente: ${pac?.nome||"—"}

Análise: Documento recebido e registrado no prontuário.
Destino: ${destino}
Origem: ${origem}

[Sem chave Claude configurada — o PDF foi anexado, mas seu conteúdo ainda não foi lido]`;
    registrarResultado(res,{arquivos:arqs,texto:txtColar,destino,origem,tipo:abaUp==="colar"?"Texto colado":"Upload"});
    setLoading(false);
  };
  return <div style={{display:"grid",gap:10}}>
    <div style={{display:"flex",gap:6,background:N,borderRadius:10,padding:4,marginBottom:2}}>
      {[["upload","📎 Upload / Arrastar"],["colar","📋 Colar Texto"]].map(([id,l])=><button key={id} onClick={()=>setAbaUp(id)} style={{flex:1,border:"none",cursor:"pointer",borderRadius:7,padding:"7px",fontSize:11,fontWeight:800,fontFamily:"inherit",background:abaUp===id?G:N,color:abaUp===id?"#fff":"rgba(255,255,255,.5)"}}>{l}</button>)}
    </div>
    {abaUp==="upload"&&<>
      <input ref={refC} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={onCam}/>
      <input ref={refA} type="file" accept=".pdf,.doc,.docx,image/*" multiple style={{display:"none"}} onChange={onArq}/>
      {/* Banner atalho Drive */}
      <div style={{background:"linear-gradient(135deg,#1a73e8,#0d5db7)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>{abrirDrive();setDriveAberto(true);}}>
        <div style={{background:"rgba(255,255,255,.18)",borderRadius:8,width:36,height:36,display:"grid",placeItems:"center",fontSize:20,flexShrink:0}}>☁️</div>
        <div style={{flex:1}}>
          <div style={{color:"#fff",fontWeight:900,fontSize:12}}>Abrir Pasta do Drive — Laudos</div>
          <div style={{color:"rgba(255,255,255,.75)",fontSize:10}}>Clique → Drive abre em nova aba → baixe o arquivo → arraste aqui</div>
        </div>
        <div style={{color:"rgba(255,255,255,.9)",fontSize:18}}>→</div>
      </div>
      {driveAberto&&<div style={{background:"#EAF7EE",border:`1px solid ${VE}`,borderRadius:9,padding:"8px 12px",fontSize:11,color:VE,fontWeight:700}}>✓ Pasta aberta! Baixe os arquivos e arraste abaixo ou clique em "Arquivo Local".</div>}
      <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={onDrop} style={{border:"2px dashed "+(drag?VE:G),borderRadius:14,padding:10,background:drag?"#EAF7EE":"#FFFBEB"}}>
        <div style={{fontSize:12,color:N,fontWeight:900,textAlign:"center",marginBottom:8}}>Arraste PDF/imagem aqui ou escolha uma origem</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div onClick={()=>refC.current?.click()} style={{border:`1px solid ${T}55`,borderRadius:12,padding:"12px 6px",textAlign:"center",cursor:"pointer",background:"#F0F9FF"}}><div style={{fontSize:22,marginBottom:3}}>📷</div><strong style={{color:T,fontSize:10}}>Câmera</strong></div>
          <div onClick={()=>refA.current?.click()} style={{border:`1px solid ${G}55`,borderRadius:12,padding:"12px 6px",textAlign:"center",cursor:"pointer",background:"#fff"}}><div style={{fontSize:22,marginBottom:3}}>📁</div><strong style={{color:G,fontSize:10}}>Arquivo Local</strong></div>
          <div onClick={()=>{abrirDrive();setDriveAberto(true);}} style={{border:"1.5px solid #1a73e8",borderRadius:12,padding:"12px 6px",textAlign:"center",cursor:"pointer",background:"#EEF4FF"}}><div style={{fontSize:22,marginBottom:3}}>☁️</div><strong style={{color:"#1a73e8",fontSize:10}}>Drive</strong></div>
        </div>
      </div>
      {arqs.length>0&&<div>{arqs.map((a,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",border:"1px solid #CBD5E1",borderRadius:9,padding:"5px 9px",marginBottom:4}}><span>{a.ico}</span><span style={{flex:1,fontSize:11,fontWeight:700}}>{a.n}</span><button style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8"}} onClick={()=>setArqs(x=>x.filter((_,j)=>j!==i))}>✕</button></div>)}</div>}
      <div style={{marginTop:10,borderTop:"1px solid #CBD5E1",paddingTop:10}}>
        <label style={{fontSize:11,fontWeight:900,color:N,display:"block",marginBottom:5}}>📂 Ou cole o caminho do PDF aberto no computador</label>
        <div style={{display:"flex",gap:6}}>
          <input value={caminhoLocal} onChange={e=>setCaminhoLocal(e.target.value)} placeholder={"C:\\Users\\silas\\OneDrive\\Área de Trabalho\\prontuarios\\PACIENTE.pdf"} style={{...sc_.inp,flex:1,fontSize:11,fontFamily:"Consolas, Courier New, monospace"}}/>
          <Btn v="teal" ch={loading?"Lendo...":"Analisar"} dis={loading||!caminhoLocal.trim()} s={{whiteSpace:"nowrap"}} onClick={processarCaminhoLocal}/>
        </div>
        <p style={{fontSize:10,color:"#64748B",margin:"5px 0 0"}}>Cole também endereços file:///C:/... O backend só lê Desktop/OneDrive, Downloads ou Documentos.</p>
      </div>
    </>}
    {abaUp==="colar"&&<textarea value={txtColar} onChange={e=>setTxtColar(e.target.value)} rows={6} placeholder="Cole aqui o laudo, resultado de exame ou qualquer texto clínico..." style={{...sc_.inp,resize:"vertical",fontSize:13,fontFamily:"Segoe UI, Arial, sans-serif"}}/>}
    {resultado&&<div style={{background:"#EAF7EE",border:`1px solid ${VE}`,borderRadius:10,padding:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><strong style={{color:VE,fontSize:12}}>Resumo IA pronto</strong><Btn v="ghost" ch="Copiar" s={{fontSize:10}} onClick={()=>copiarTexto(resultado)}/></div>
      <ResumoBullets texto={resultado} maxH={220}/>
    </div>}
    <Btn v="gold" ch={loading?"Processando com IA...":"Enviar para IA e inserir no dossiê"} dis={loading} s={{width:"100%",padding:11}} onClick={processar}/>
  </div>;
}
