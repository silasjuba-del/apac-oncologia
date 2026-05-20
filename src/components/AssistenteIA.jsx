import { useState, useRef } from "react";
import { promptExtrairJSON, validarCamposAPAC, promptGerarProntuario } from "../utils/promptProntuario.js";

const COLORS={navy:"#1B365D",teal:"#2B7A8C",gold:"#B8860B",red:"#A30000",green:"#1B5E20",light:"#F0F4F8",white:"#FFFFFF",gray:"#6B7C93",border:"#CBD5E0"};

const AGENTS=[
  {id:"dossie",  label:"📋 Dossiê",        kind:"prontuario", prompt:null /* 2 passos — promptProntuario.js */},
  {id:"receita", label:"💊 Receita",        kind:"documento",  prompt:"Você é assistente do Dr. Silas Negrão (CRM-PB 17341). Gere receita médica para este paciente oncológico com medicamentos sintomáticos habituais para o tratamento em curso (antieméticos, analgesia, corticoide se necessário). Inclua nome genérico, dose, via, frequência. Formato profissional. Sem markdown."},
  {id:"exames",  label:"🔬 Exames",         kind:"documento",  prompt:"Gere solicitação de exames oncológicos pertinentes ao caso. Inclua exames de estadiamento/seguimento indicados, laboratoriais de controle para o protocolo em uso e biomarcadores pendentes relevantes. Justifique clinicamente cada solicitação. Sem markdown."},
  {id:"alarme",  label:"⚠️ Sinais de Alarme",kind:"documento", prompt:"Gere orientações de sinais de alarme personalizadas para este paciente em tratamento oncológico. Inclua: sinais de emergência (febre, sangramento, dispneia), sinais de atenção (vômitos, diarreia, dor), orientações domiciliares e quando buscar atendimento. Linguagem acessível para o paciente. Sem markdown."},
  {id:"apac",    label:"📑 APAC",           kind:"apac",       prompt:"Preencha os campos da APAC-SUS para este paciente. Inclua: diagnóstico histológico, estadiamento TNM, CID-10, procedimento SIGTAP mais adequado, linha de tratamento, protocolo proposto, justificativa clínica detalhada (mínimo 3 linhas), laudos comprobatórios necessários. Aponte pendências críticas anti-glosa. Sem markdown."},
  {id:"tcle",    label:"📄 TCLE",           kind:"documento",  prompt:"Gere Termo de Consentimento Livre e Esclarecido para o tratamento oncológico proposto. Inclua: descrição do tratamento, benefícios esperados, riscos e efeitos colaterais principais, alternativas terapêuticas, direito de recusa e confidencialidade. Linguagem clara. Ao final, espaços para assinatura do paciente e médico. Sem markdown."},
];

function buildPatientBlock(pac){
  if(!pac?.nome)return "Nenhum paciente selecionado.";
  return [
    "DADOS DO PACIENTE",
    "Nome: "+(pac.nome||"")+" | Nasc: "+(pac.nasc||"")+" | CPF: "+(pac.cpf||"")+" | CNS: "+(pac.cns||""),
    "Cidade: "+(pac.cidade||"")+" | Mãe: "+(pac.mae||""),
    "Diagnóstico: "+(pac.diag||"")+" | CID: "+(pac.cid||"")+" | TNM: "+(pac.tnm||"")+" | Estádio: "+(pac.estadio||""),
    "Biomarcadores: "+(pac.bio||"")+" | ECOG: "+(pac.ecog||""),
    "Tratamento: "+(pac.trat||"")+" | Linha: "+(pac.linha||"")+" | Intenção: "+(pac.intencao||""),
    "Antecedentes: "+(pac.antec||""),
    "Medicações: "+(pac.meds||""),
    "Alergias: "+(pac.alerg||"")
  ].join("\n");
}

async function fileToBase64(file){
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]);r.onerror=reject;r.readAsDataURL(file);});
}

async function copyToClipboard(text){
  const t=String(text||"");
  try{await navigator.clipboard.writeText(t);return true;}
  catch(_){const ta=document.createElement("textarea");ta.value=t;ta.style.position="fixed";ta.style.left="-9999px";document.body.appendChild(ta);ta.select();const ok=document.execCommand("copy");document.body.removeChild(ta);return ok;}
}

async function callClaude({apiKey,prompt,userText,files,maxTokens=2200}){
  const fileList=(files||[]).map(f=>"Arquivo: "+f.name+" · "+(f.type||"tipo desconhecido")+" · "+Math.round((f.size||0)/1024)+" KB").join("\n");
  if(!apiKey){
    const api=(import.meta.env.VITE_API_URL||"http://127.0.0.1:3001").replace(/\/$/,"");
    const filesPayload=[];
    for(const f of files||[]){
      const mimeType=f.type||(/\.pdf$/i.test(f.name)?"application/pdf":"application/octet-stream");
      if(["application/pdf","image/jpeg","image/png","image/webp"].includes(mimeType)) filesPayload.push({name:f.name,mimeType,base64:await fileToBase64(f)});
    }
    const resp=await fetch(api+"/api/claude/resumo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:[prompt,userText,fileList].filter(Boolean).join("\n\n"),maxTokens,files:filesPayload})});
    const data=await resp.json().catch(()=>({}));
    if(!resp.ok||!data.ok)throw new Error(data.message||"Claude backend indisponível.");
    return data.text||"";
  }
  const content=[];
  for(const file of files||[]){
    try{content.push({type:"document",source:{type:"base64",media_type:file.type||"application/pdf",data:await fileToBase64(file)}});}
    catch(_){content.push({type:"text",text:"Arquivo não lido: "+file.name});}
  }
  content.push({type:"text",text:[userText,fileList].filter(Boolean).join("\n\n")||"Sem texto adicional."});
  const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-5",max_tokens:maxTokens,system:prompt,messages:[{role:"user",content}]})});
  const data=await resp.json().catch(()=>({}));
  if(!resp.ok)throw new Error(data.error?.message||data.message||("Erro Claude "+resp.status));
  return data.content?.[0]?.text||"";
}

export default function AssistenteIA({pac,addMsg,onSalvarEvolucao}){
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem("anthropic_key")||"");
  const [keyInput,setKeyInput]=useState("");
  const [files,setFiles]=useState([]);
  const [drag,setDrag]=useState(false);
  const [texto,setTexto]=useState("");
  const [agentId,setAgentId]=useState("dossie");
  const [output,setOutput]=useState("");
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState("");
  const [err,setErr]=useState("");
  const inputRef=useRef(null);
  const agent=AGENTS.find(a=>a.id===agentId)||AGENTS[0];

  const addFiles=fl=>setFiles(prev=>{
    const novos=Array.from(fl||[]).filter(f=>/pdf|image|text|word|document/.test(f.type||"")||/\.(pdf|png|jpg|jpeg|webp|doc|docx|txt)$/i.test(f.name));
    const seen=new Set(prev.map(f=>f.name+"_"+f.size));
    return [...prev,...novos.filter(f=>!seen.has(f.name+"_"+f.size))];
  });

  async function run(){
    setLoading(true);setErr("");setMsg("");setOutput("");
    try{
      if(agentId==="dossie"){
        // ── Passo 1: Extrair JSON estruturado ───────────────────
        setMsg("⏳ Passo 1/2 — Extraindo dados dos laudos...");
        const p1=promptExtrairJSON(pac?.nome||"Paciente", texto||"");
        const resJSON=await callClaude({apiKey,prompt:p1,userText:"",files,maxTokens:1800});
        let dados={};
        try{
          const clean=resJSON.replace(/```json[\s\S]*?```|```/g,"").trim();
          const match=clean.match(/\{[\s\S]*\}/);
          dados=JSON.parse(match?.[0]||clean);
        }catch{
          throw new Error("Erro ao interpretar JSON do Passo 1. Verifique os laudos e tente novamente.");
        }
        // ── Passo 1b: Validar campos críticos para APAC ─────────
        const faltando=validarCamposAPAC(dados);
        const aviso=faltando.length>0
          ? `⚠ CAMPOS CRÍTICOS AUSENTES PARA APAC: ${faltando.join(" · ")}\n${"─".repeat(60)}\n\n`
          : "";
        // ── Passo 2: Gerar prontuário textual ───────────────────
        setMsg("⏳ Passo 2/2 — Gerando prontuário oncológico...");
        const p2=promptGerarProntuario(pac?.nome||"Paciente","upload direto",dados);
        const resPron=await callClaude({apiKey,prompt:p2,userText:"",files:[],maxTokens:3500});
        setOutput(aviso+resPron);
        setMsg("✅ Dossiê gerado em 2 etapas. Revise antes de enviar ao prontuário.");
      }else{
        const prompt=["Você é assistente clínico do Dr. Silas Negrão, Hospital do Bem, Patos-PB.",buildPatientBlock(pac),agent.prompt].join("\n\n");
        const res=await callClaude({apiKey,prompt,userText:texto,files});
        setOutput(res);
        setMsg("✅ Agente executado: "+agent.label);
      }
    }catch(e){setErr(e.message);}
    finally{setLoading(false);}
  }

  function enviar(){
    if(!output.trim())return;
    onSalvarEvolucao&&onSalvarEvolucao(output);
    addMsg&&addMsg("Assistente IA","Médico","Documento enviado ao prontuário de "+(pac?.nome||"paciente")+".","ia");
    setMsg("Enviado ao prontuário.");
  }

  const btn=(color,disabled=false)=>({border:"none",cursor:disabled?"not-allowed":"pointer",opacity:disabled?.55:1,background:color,color:"#fff",borderRadius:9,padding:"9px 12px",fontWeight:800,fontFamily:"Segoe UI, Arial, sans-serif"});

  return <div style={{maxWidth:960,margin:"0 auto",display:"grid",gap:12,fontFamily:"Segoe UI, Arial, sans-serif"}}>
    <div style={{background:"linear-gradient(135deg,#1B365D,#0d2347)",borderRadius:14,padding:16,color:"#fff"}}>
      <div style={{color:COLORS.gold,fontSize:11,fontWeight:900,textTransform:"uppercase"}}>Assistente IA por agente único</div>
      <h2 style={{margin:"4px 0 2px",fontSize:22}}>Documentos → Claude → Prontuário</h2>
      <div style={{fontSize:12,opacity:.72}}>{pac?.nome||"Nenhum paciente selecionado"} · o resultado substitui o anterior para evitar mistura de agentes.</div>
    </div>

    {!apiKey&&<div style={{background:"#FFF7E6",border:"1px solid #B8860B55",borderRadius:12,padding:12}}>
      <strong style={{color:COLORS.navy}}>Claude via backend</strong>
      <p style={{fontSize:12,color:COLORS.gray,margin:"4px 0 8px"}}>Se o backend tiver ANTHROPIC_API_KEY, não precisa chave aqui. A chave local continua opcional.</p>
      <div style={{display:"flex",gap:8}}>
        <input value={keyInput} onChange={e=>setKeyInput(e.target.value)} placeholder="sk-ant-... opcional" style={{flex:1,border:"1px solid #CBD5E1",borderRadius:8,padding:9}}/>
        <button style={btn(COLORS.gold,!keyInput)} disabled={!keyInput} onClick={()=>{localStorage.setItem("anthropic_key",keyInput.trim());setApiKey(keyInput.trim());setKeyInput("");}}>Salvar</button>
      </div>
    </div>}

    <div style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:14,padding:14}}>
      <div style={{fontSize:12,fontWeight:900,color:COLORS.navy,marginBottom:8}}>1. Selecione somente um agente</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8}}>
        {AGENTS.map(a=><button key={a.id} onClick={()=>{setAgentId(a.id);setOutput("");}} style={{border:"1px solid "+(agentId===a.id?COLORS.gold:COLORS.border),background:agentId===a.id?COLORS.gold:"#fff",color:agentId===a.id?"#fff":COLORS.navy,borderRadius:10,padding:"10px 8px",fontWeight:900,cursor:"pointer"}}>{a.label}</button>)}
      </div>
    </div>

    <div style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:14,padding:14}}>
      <div style={{fontSize:12,fontWeight:900,color:COLORS.navy,marginBottom:8}}>2. Arraste documentos ou cole texto</div>
      <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files);}} onClick={()=>inputRef.current?.click()} style={{border:"2px dashed "+(drag?COLORS.green:COLORS.gold),borderRadius:14,padding:18,textAlign:"center",background:drag?"#E8F5E9":"#FFFBEB",cursor:"pointer",marginBottom:10}}>
        <div style={{fontSize:30}}>📎</div>
        <strong style={{color:COLORS.navy}}>Arraste PDF/imagem aqui</strong>
        <div style={{fontSize:12,color:COLORS.gray}}>ou clique para selecionar</div>
      </div>
      <input ref={inputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx" style={{display:"none"}} onChange={e=>{addFiles(e.target.files);e.target.value="";}}/>
      {files.length>0&&<div style={{display:"grid",gap:5,marginBottom:10}}>{files.map((f,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",border:"1px solid #E2E8F0",borderRadius:8,padding:"6px 8px",fontSize:12}}><span>📄</span><span style={{flex:1}}>{f.name}</span><button onClick={()=>setFiles(x=>x.filter((_,j)=>j!==i))} style={{border:"none",background:"transparent",cursor:"pointer",color:COLORS.gray}}>×</button></div>)}</div>}
      <textarea value={texto} onChange={e=>setTexto(e.target.value)} rows={6} placeholder="Cole laudo, observação, link do Drive ou texto clínico..." style={{width:"100%",boxSizing:"border-box",border:"1px solid #CBD5E1",borderRadius:10,padding:12,fontSize:14,fontFamily:"Segoe UI, Arial, sans-serif",resize:"vertical"}}/>
      <button style={{...btn(COLORS.navy,loading),width:"100%",marginTop:10,padding:12}} disabled={loading} onClick={run}>{loading?"Processando...":"Executar agente selecionado: "+agent.label}</button>
    </div>

    {err&&<div style={{background:"#FFEBEE",border:"1px solid #A3000044",borderRadius:10,padding:10,color:COLORS.red,fontWeight:800}}>⚠ {err}</div>}
    {msg&&<div style={{background:"#E8F5E9",border:"1px solid #1B5E2044",borderRadius:10,padding:10,color:COLORS.green,fontWeight:800}}>{msg}</div>}

    <div style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:14,padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:8}}>
        <strong style={{color:COLORS.navy}}>Resultado editável</strong>
        <span style={{fontSize:11,color:COLORS.gray}}>Fonte maior, sans, pronta para validar.</span>
      </div>
      <textarea value={output} onChange={e=>setOutput(e.target.value)} rows={16} placeholder="O resultado do agente selecionado aparecerá aqui." style={{width:"100%",boxSizing:"border-box",border:"1px solid #CBD5E1",borderRadius:10,padding:14,fontSize:15,lineHeight:1.6,fontFamily:"Segoe UI, Arial, sans-serif",fontWeight:600,resize:"vertical",color:COLORS.navy,background:"#FFFEFB"}}/>
      <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
        <button style={{...btn(COLORS.green,!output.trim()),flex:1}} disabled={!output.trim()} onClick={enviar}>Enviar ao prontuário</button>
        <button style={btn(COLORS.teal,!output.trim())} disabled={!output.trim()} onClick={async()=>{await copyToClipboard(output);setMsg("Texto copiado.");}}>Copiar</button>
        <button style={btn(COLORS.red,!output.trim())} disabled={!output.trim()} onClick={()=>setOutput("")}>Limpar</button>
      </div>
    </div>
  </div>;
}
