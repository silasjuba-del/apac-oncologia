import { useState, useRef } from "react";
import { promptExtrairJSON, validarCamposAPAC, promptGerarProntuario } from "../utils/promptProntuario.js";

const COLORS={navy:"#1B365D",teal:"#2B7A8C",gold:"#B8860B",red:"#A30000",green:"#1B5E20",light:"#F0F4F8",white:"#FFFFFF",gray:"#6B7C93",border:"#CBD5E0"};

// ── Calculadora SC (Mosteller) ─────────────────────────────────
function calcSC(peso,altura){
  const p=parseFloat(peso),h=parseFloat(altura);
  if(!p||!h||p<=0||h<=0)return null;
  return Math.sqrt((p*h)/3600);
}

// ── Agentes disponíveis ────────────────────────────────────────
const AGENTS=[
  {id:"dossie",    label:"📋 Dossiê",           kind:"prontuario", prompt:null},
  {id:"protocolo", label:"💉 Protocolo QT",      kind:"protocolo",  prompt:null},
  {id:"receita",   label:"💊 Receita",           kind:"documento",  prompt:"Você é assistente do Dr. Silas Negrão (CRM-PB 17341). Gere receita médica para este paciente oncológico com medicamentos sintomáticos habituais para o tratamento em curso (antieméticos, analgesia, corticoide se necessário). Inclua nome genérico, dose, via, frequência. Formato profissional. Sem markdown."},
  {id:"exames",    label:"🔬 Exames",            kind:"documento",  prompt:"Gere solicitação de exames oncológicos pertinentes ao caso. Inclua exames de estadiamento/seguimento indicados, laboratoriais de controle para o protocolo em uso e biomarcadores pendentes relevantes. Justifique clinicamente cada solicitação. Sem markdown."},
  {id:"alarme",    label:"⚠️ Sinais de Alarme",  kind:"documento",  prompt:"Gere orientações de sinais de alarme personalizadas para este paciente em tratamento oncológico. Inclua: sinais de emergência (febre, sangramento, dispneia), sinais de atenção (vômitos, diarreia, dor), orientações domiciliares e quando buscar atendimento. Linguagem acessível para o paciente. Sem markdown."},
  {id:"apac",      label:"📑 APAC",              kind:"apac",       prompt:"Preencha os campos da APAC-SUS para este paciente. Inclua: diagnóstico histológico, estadiamento TNM, CID-10, procedimento SIGTAP mais adequado, linha de tratamento, protocolo proposto, justificativa clínica detalhada (mínimo 3 linhas), laudos comprobatórios necessários. Aponte pendências críticas anti-glosa. Sem markdown."},
  {id:"tcle",      label:"📄 TCLE",              kind:"documento",  prompt:"Gere Termo de Consentimento Livre e Esclarecido para o tratamento oncológico proposto. Inclua: descrição do tratamento, benefícios esperados, riscos e efeitos colaterais principais, alternativas terapêuticas, direito de recusa e confidencialidade. Linguagem clara. Ao final, espaços para assinatura do paciente e médico. Sem markdown."},
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
    const api=_apiBase();
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

function _apiBase(){
  const u=import.meta.env.VITE_API_URL||"http://127.0.0.1:3001";
  return u==="/"?"":u.replace(/\/$/,"");
}

// ── Componente Calculadora QT ──────────────────────────────────
function CalculadoraQT({pac,qtParams,setQtParams,sc}){
  const N=COLORS.navy,T=COLORS.teal,G=COLORS.gold;
  const inp={border:"1px solid #CBD5E1",borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"Segoe UI,Arial,sans-serif",width:"100%",boxSizing:"border-box"};
  const lbl={fontSize:11,fontWeight:900,color:N,textTransform:"uppercase",display:"block",marginBottom:4};
  return(
    <div style={{background:"linear-gradient(135deg,#EFF9FF,#F0FFF4)",border:"1px solid "+T+"44",borderRadius:14,padding:14}}>
      <div style={{fontSize:13,fontWeight:900,color:T,marginBottom:12}}>💉 Parâmetros do Protocolo</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:12}}>
        <div>
          <label style={lbl}>Peso (kg)</label>
          <input type="number" min="20" max="250" step="0.1" value={qtParams.peso} onChange={e=>setQtParams(p=>({...p,peso:e.target.value}))} placeholder="Ex: 68.5" style={inp}/>
        </div>
        <div>
          <label style={lbl}>Altura (cm)</label>
          <input type="number" min="100" max="220" step="1" value={qtParams.altura} onChange={e=>setQtParams(p=>({...p,altura:e.target.value}))} placeholder="Ex: 162" style={inp}/>
        </div>
        <div>
          <label style={lbl}>SC (m²)</label>
          <div style={{...inp,background:sc?"#EAF7EE":"#F8F8F8",color:sc?"#1B5E20":COLORS.gray,fontWeight:900,display:"flex",alignItems:"center"}}>
            {sc?sc.toFixed(2)+" m²":"Auto-calc"}
          </div>
        </div>
        <div>
          <label style={lbl}>Creatinina (mg/dL)</label>
          <input type="number" min="0.1" max="20" step="0.01" value={qtParams.creatinina} onChange={e=>setQtParams(p=>({...p,creatinina:e.target.value}))} placeholder="Ex: 0.9" style={inp}/>
        </div>
        <div>
          <label style={lbl}>ECOG</label>
          <select value={qtParams.ecog} onChange={e=>setQtParams(p=>({...p,ecog:e.target.value}))} style={inp}>
            {["0","1","2","3"].map(v=><option key={v} value={v}>ECOG {v}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Linha</label>
          <select value={qtParams.linha} onChange={e=>setQtParams(p=>({...p,linha:e.target.value}))} style={inp}>
            {["1ª linha","2ª linha","3ª linha","Neoadjuvante","Adjuvante","Paliativo exclusivo"].map(v=><option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Intenção</label>
          <select value={qtParams.intencao} onChange={e=>setQtParams(p=>({...p,intencao:e.target.value}))} style={inp}>
            {["Curativa","Adjuvante","Neoadjuvante","Paliativa","Controle de doença"].map(v=><option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Ciclo nº</label>
          <input type="number" min="1" max="30" value={qtParams.ciclo} onChange={e=>setQtParams(p=>({...p,ciclo:e.target.value}))} placeholder="1" style={inp}/>
        </div>
      </div>
      <div>
        <label style={lbl}>Comorbidades relevantes / contraindicações</label>
        <input value={qtParams.comorbidades} onChange={e=>setQtParams(p=>({...p,comorbidades:e.target.value}))} placeholder="Ex: IRC moderada, cardiopatia, neuropatia periférica..." style={inp}/>
      </div>
      {sc&&(
        <div style={{marginTop:10,background:"#EAF7EE",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#1B5E20",fontWeight:700}}>
          ✅ SC calculada (Mosteller): <strong>{sc.toFixed(4)} m²</strong>
          {qtParams.creatinina&&<span style={{marginLeft:16}}>· Creatinina: <strong>{qtParams.creatinina} mg/dL</strong></span>}
        </div>
      )}
    </div>
  );
}

// ── Prompt Protocolo QT ────────────────────────────────────────
function buildPromptProtocolo(pac, qtParams, sc){
  const scStr=sc?sc.toFixed(4)+" m²":"não calculada (informe peso e altura)";
  return `Você é assistente oncológico clínico do Dr. Silas Negrão (CRM-PB 17341), Oncologista Clínico, Hospital do Bem — Unidade Oncológica, Patos-PB. Especialidade: Oncologia clínica com foco em protocolos SUS/INCA/SBOC.

DADOS DO PACIENTE:
Nome: ${pac?.nome||"—"} | Nasc: ${pac?.nasc||"—"} | Peso: ${qtParams.peso||"—"} kg | Altura: ${qtParams.altura||"—"} cm
Superfície Corporal (SC Mosteller): ${scStr}
Creatinina: ${qtParams.creatinina||"não informada"} mg/dL
ECOG: ${qtParams.ecog||pac?.ecog||"não informado"}
Diagnóstico: ${pac?.diag||"—"} | CID: ${pac?.cid||"—"} | TNM: ${pac?.tnm||"—"} | Estádio: ${pac?.estadio||"—"}
Subtipo molecular / biomarcadores: ${pac?.bio||"—"}
Linha de tratamento: ${qtParams.linha||"1ª linha"}
Intenção terapêutica: ${qtParams.intencao||"Curativa"}
Ciclo número: ${qtParams.ciclo||"1"}
Comorbidades / contraindicações: ${qtParams.comorbidades||"nenhuma informada"}
Tratamento atual: ${pac?.trat||"—"}
Medicações em uso: ${pac?.meds||"—"}
Alergias: ${pac?.alerg||"nega"}

INSTRUÇÕES:
1. Selecione o protocolo de quimioterapia mais indicado conforme diretrizes INCA/SBOC/NCCN vigentes
2. Priorize protocolos disponíveis no SUS (RENAME/INCA)
3. Se SC disponível, calcule as DOSES REAIS de cada droga (dose/m² × SC)
4. Indique o AUC de carboplatina usando Calvert se aplicável (ClCr por Cockcroft-Gault se creatinina informada)
5. NÃO defina conduta definitiva — apresente como sugestão para validação médica
6. Alerte contraindicações baseadas nas comorbidades informadas

GERE EXATAMENTE NESTE FORMATO:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROTOCOLO SUGERIDO: [NOME DO PROTOCOLO]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Referência: [Diretriz INCA/SBOC/NCCN versão e ano]
CID-10: [código]
SIGTAP: [código do procedimento]
Disponibilidade SUS: [Sim / Não / Parcial — quais drogas]
Ciclo: [frequência, ex: a cada 21 dias]
Nº de ciclos previsto: [quantidade]
Intenção: [Adjuvante / Neoadjuvante / Curativa / Paliativa]

━━━ DROGAS E DOSES ━━━
[Para cada droga:]
DROGA: [Nome genérico (nome comercial)]
  Dose padrão: [X mg/m² ou AUC X] | Via: [IV/VO] | Dia(s): [D1, D1-D5, etc]
  SC do paciente: [valor] m²
  ► DOSE CALCULADA: [X mg] (arredondar para múltiplos práticos de diluição)
  Diluição: [SF/SG + volume + tempo de infusão]
  Observações: [estabilidade, fotossensibilidade, filtro etc]

━━━ PRÉ-MEDICAÇÃO ━━━
[Lista com dose, via e horário de cada pré-medicação]
Antieméticos: [classificação do potencial emético + esquema antiemético ASCO/MASCC]
Hidratação: [volume, velocidade, duração]
Corticoide: [se indicado]
Outros: [ondansetrona, dexametasona, difenidramina, ranitidina — conforme protocolo]

━━━ CRONOGRAMA DO CICLO ━━━
[Tabela dia a dia: Dia | Droga | Dose | Via | Duração]

━━━ SUPORTE E PROFILAXIAS ━━━
G-CSF: [indicação, dose, dias]
Anticoagulação: [se risco TEV elevado]
Suporte renal: [hidratação/mesna se necessário]
Controle de toxicidade: [principais medidas preventivas]

━━━ EXAMES PRÉ-CICLO (obrigatórios) ━━━
[Lista: hemograma + critérios de corte, função renal, hepática, cardíaca se necessário]

━━━ TOXICIDADES PRINCIPAIS ━━━
[Para cada droga: toxicidades grau 3-4 esperadas + conduta resumida]
Dose-limiting toxicity: [qual é]
Critério de suspensão: [quando suspender]
Redução de dose: [25% ou 50% se — listar condições]

━━━ ALERTAS DESTE PACIENTE ━━━
[Alertas personalizados baseados nas comorbidades, ECOG, alergias e medicações informadas]
[Se ECOG ≥ 2: avaliar redução de dose]
[Interações medicamentosas relevantes]

━━━ ALTERNATIVAS ━━━
[1-2 protocolos alternativos se o sugerido for contraindicado ou indisponível no SUS]

━━━ OBS MÉDICO ━━━
[Espaço em branco para o Dr. Silas validar, ajustar e assinar]
Data: ___/___/______  Ciclo nº: ___  SC utilizada: ___ m²
Assinatura: _________________________________ CRM-PB 17341

⚠ ESTE DOCUMENTO É UMA SUGESTÃO GERADA POR IA. VALIDAÇÃO E PRESCRIÇÃO MÉDICA OBRIGATÓRIAS.`;
}

// ── Componente principal ───────────────────────────────────────
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
  const [qtParams,setQtParams]=useState({peso:pac?.peso||"",altura:pac?.altura||"",creatinina:"",ecog:pac?.ecog||"0",linha:"1ª linha",intencao:"Curativa",ciclo:"1",comorbidades:""});
  const inputRef=useRef(null);
  const agent=AGENTS.find(a=>a.id===agentId)||AGENTS[0];

  const sc=calcSC(qtParams.peso,qtParams.altura);

  const addFiles=fl=>setFiles(prev=>{
    const novos=Array.from(fl||[]).filter(f=>/pdf|image|text|word|document/.test(f.type||"")||/\.(pdf|png|jpg|jpeg|webp|doc|docx|txt)$/i.test(f.name));
    const seen=new Set(prev.map(f=>f.name+"_"+f.size));
    return [...prev,...novos.filter(f=>!seen.has(f.name+"_"+f.size))];
  });

  async function run(){
    setLoading(true);setErr("");setMsg("");setOutput("");
    try{
      if(agentId==="dossie"){
        setMsg("⏳ Passo 1/2 — Extraindo dados dos laudos...");
        const p1=promptExtrairJSON(pac?.nome||"Paciente",texto||"");
        const resJSON=await callClaude({apiKey,prompt:p1,userText:"",files,maxTokens:1800});
        let dados={};
        try{
          const clean=resJSON.replace(/```json[\s\S]*?```|```/g,"").trim();
          const match=clean.match(/\{[\s\S]*\}/);
          dados=JSON.parse(match?.[0]||clean);
        }catch{
          throw new Error("Erro ao interpretar JSON do Passo 1. Verifique os laudos e tente novamente.");
        }
        const faltando=validarCamposAPAC(dados);
        const aviso=faltando.length>0?`⚠ CAMPOS CRÍTICOS AUSENTES PARA APAC: ${faltando.join(" · ")}\n${"─".repeat(60)}\n\n`:"";
        setMsg("⏳ Passo 2/2 — Gerando prontuário oncológico...");
        const p2=promptGerarProntuario(pac?.nome||"Paciente","upload direto",dados);
        const resPron=await callClaude({apiKey,prompt:p2,userText:"",files:[],maxTokens:3500});
        setOutput(aviso+resPron);
        setMsg("✅ Dossiê gerado em 2 etapas. Revise antes de enviar ao prontuário.");

      }else if(agentId==="protocolo"){
        if(!pac?.diag&&!pac?.nome){throw new Error("Selecione um paciente com diagnóstico preenchido antes de gerar o protocolo.");}
        if(!qtParams.peso||!qtParams.altura){setMsg("⚠ Peso e altura não informados — o Claude vai sugerir o protocolo mas sem calcular doses reais.");}
        else{setMsg("⏳ Calculando doses e gerando protocolo QT...");}
        const prompt=buildPromptProtocolo(pac,qtParams,sc);
        const obs=texto.trim()?"\n\nOBSERVAÇÕES ADICIONAIS DO MÉDICO:\n"+texto:"";
        const res=await callClaude({apiKey,prompt:prompt+obs,userText:"",files,maxTokens:4000});
        setOutput(res);
        setMsg("✅ Protocolo gerado. VALIDAÇÃO MÉDICA OBRIGATÓRIA antes de prescrever.");

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
    {/* Header */}
    <div style={{background:"linear-gradient(135deg,#1B365D,#0d2347)",borderRadius:14,padding:16,color:"#fff"}}>
      <div style={{color:COLORS.gold,fontSize:11,fontWeight:900,textTransform:"uppercase"}}>Assistente IA por agente único</div>
      <h2 style={{margin:"4px 0 2px",fontSize:22}}>Documentos → Claude → Prontuário</h2>
      <div style={{fontSize:12,opacity:.72}}>{pac?.nome||"Nenhum paciente selecionado"} · o resultado substitui o anterior para evitar mistura de agentes.</div>
    </div>

    {/* Chave opcional */}
    {!apiKey&&<div style={{background:"#FFF7E6",border:"1px solid #B8860B55",borderRadius:12,padding:12}}>
      <strong style={{color:COLORS.navy}}>Claude via backend</strong>
      <p style={{fontSize:12,color:COLORS.gray,margin:"4px 0 8px"}}>Se o backend tiver ANTHROPIC_API_KEY, não precisa chave aqui. A chave local continua opcional.</p>
      <div style={{display:"flex",gap:8}}>
        <input value={keyInput} onChange={e=>setKeyInput(e.target.value)} placeholder="sk-ant-... opcional" style={{flex:1,border:"1px solid #CBD5E1",borderRadius:8,padding:9}}/>
        <button style={btn(COLORS.gold,!keyInput)} disabled={!keyInput} onClick={()=>{localStorage.setItem("anthropic_key",keyInput.trim());setApiKey(keyInput.trim());setKeyInput("");}}>Salvar</button>
      </div>
    </div>}

    {/* Seleção de agente */}
    <div style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:14,padding:14}}>
      <div style={{fontSize:12,fontWeight:900,color:COLORS.navy,marginBottom:8}}>1. Selecione o agente</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
        {AGENTS.map(a=>{
          const isProto=a.id==="protocolo";
          const ativo=agentId===a.id;
          return <button key={a.id} onClick={()=>{setAgentId(a.id);setOutput("");}} style={{border:"1px solid "+(ativo?(isProto?"#0F9D58":COLORS.gold):(isProto?"#0F9D5844":COLORS.border)),background:ativo?(isProto?"#0F9D58":COLORS.gold):(isProto?"#F0FFF4":"#fff"),color:ativo?"#fff":(isProto?"#0F9D58":COLORS.navy),borderRadius:10,padding:"10px 8px",fontWeight:900,cursor:"pointer",fontSize:12}}>{a.label}</button>;
        })}
      </div>
      {agentId==="protocolo"&&<div style={{marginTop:10,background:"#E8F5E9",border:"1px solid #0F9D5833",borderRadius:8,padding:"7px 10px",fontSize:11,color:"#1B5E20",fontWeight:700}}>
        💉 O Claude vai sugerir o protocolo mais adequado para o diagnóstico, calcular as doses reais pela SC e gerar cronograma completo com pré-medicações e toxicidades.
      </div>}
    </div>

    {/* Calculadora QT — só aparece quando protocolo está selecionado */}
    {agentId==="protocolo"&&(
      <CalculadoraQT pac={pac} qtParams={qtParams} setQtParams={setQtParams} sc={sc}/>
    )}

    {/* Área de upload e texto */}
    <div style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:14,padding:14}}>
      <div style={{fontSize:12,fontWeight:900,color:COLORS.navy,marginBottom:8}}>
        {agentId==="protocolo"?"2. Observações adicionais (opcional)":"2. Arraste documentos ou cole texto"}
      </div>
      {agentId!=="protocolo"&&<>
        <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files);}} onClick={()=>inputRef.current?.click()} style={{border:"2px dashed "+(drag?COLORS.green:COLORS.gold),borderRadius:14,padding:18,textAlign:"center",background:drag?"#E8F5E9":"#FFFBEB",cursor:"pointer",marginBottom:10}}>
          <div style={{fontSize:30}}>📎</div>
          <strong style={{color:COLORS.navy}}>Arraste PDF/imagem aqui</strong>
          <div style={{fontSize:12,color:COLORS.gray}}>ou clique para selecionar</div>
        </div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx" style={{display:"none"}} onChange={e=>{addFiles(e.target.files);e.target.value="";}}/>
        {files.length>0&&<div style={{display:"grid",gap:5,marginBottom:10}}>{files.map((f,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",border:"1px solid #E2E8F0",borderRadius:8,padding:"6px 8px",fontSize:12}}><span>📄</span><span style={{flex:1}}>{f.name}</span><button onClick={()=>setFiles(x=>x.filter((_,j)=>j!==i))} style={{border:"none",background:"transparent",cursor:"pointer",color:COLORS.gray}}>×</button></div>)}</div>}
      </>}
      <textarea value={texto} onChange={e=>setTexto(e.target.value)} rows={agentId==="protocolo"?3:6}
        placeholder={agentId==="protocolo"
          ? "Ex: paciente com neuropatia prévia, prefere regime semanal, usa cateter totalmente implantado..."
          : "Cole laudo, observação, link do Drive ou texto clínico..."}
        style={{width:"100%",boxSizing:"border-box",border:"1px solid #CBD5E1",borderRadius:10,padding:12,fontSize:14,fontFamily:"Segoe UI, Arial, sans-serif",resize:"vertical"}}/>
      <button style={{...btn(agentId==="protocolo"?"#0F9D58":COLORS.navy,loading),width:"100%",marginTop:10,padding:12,fontSize:15}} disabled={loading} onClick={run}>
        {loading?(agentId==="protocolo"?"Calculando doses e gerando protocolo...":"Processando..."):(agentId==="protocolo"?"💉 Gerar Protocolo QT + Calculadora de Dose":"Executar agente: "+agent.label)}
      </button>
    </div>

    {/* Alertas */}
    {err&&<div style={{background:"#FFEBEE",border:"1px solid #A3000044",borderRadius:10,padding:10,color:COLORS.red,fontWeight:800}}>⚠ {err}</div>}
    {msg&&<div style={{background:msg.includes("⚠")?"#FFF7E6":"#E8F5E9",border:"1px solid "+(msg.includes("⚠")?"#B8860B":"#1B5E20")+"44",borderRadius:10,padding:10,color:msg.includes("⚠")?COLORS.gold:COLORS.green,fontWeight:800}}>{msg}</div>}

    {/* Resultado */}
    <div style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:14,padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:8}}>
        <strong style={{color:COLORS.navy}}>
          {agentId==="protocolo"?"📋 Protocolo gerado — valide antes de prescrever":"Resultado editável"}
        </strong>
        {agentId==="protocolo"&&output&&<span style={{fontSize:10,background:"#FFEBEE",color:COLORS.red,borderRadius:6,padding:"3px 8px",fontWeight:900}}>⚠ VALIDAÇÃO MÉDICA OBRIGATÓRIA</span>}
      </div>
      <textarea value={output} onChange={e=>setOutput(e.target.value)} rows={agentId==="protocolo"?22:16}
        placeholder={agentId==="protocolo"?"O protocolo sugerido aparecerá aqui com doses calculadas...":"O resultado do agente selecionado aparecerá aqui."}
        style={{width:"100%",boxSizing:"border-box",border:"1px solid #CBD5E1",borderRadius:10,padding:14,fontSize:agentId==="protocolo"?13:15,lineHeight:1.7,fontFamily:agentId==="protocolo"?"Consolas, Courier New, monospace":"Segoe UI, Arial, sans-serif",fontWeight:600,resize:"vertical",color:COLORS.navy,background:"#FFFEFB"}}/>
      <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
        <button style={{...btn(COLORS.green,!output.trim()),flex:1}} disabled={!output.trim()} onClick={enviar}>Enviar ao prontuário</button>
        <button style={btn(COLORS.teal,!output.trim())} disabled={!output.trim()} onClick={async()=>{await copyToClipboard(output);setMsg("Texto copiado.");}}>Copiar</button>
        <button style={btn(COLORS.red,!output.trim())} disabled={!output.trim()} onClick={()=>setOutput("")}>Limpar</button>
      </div>
    </div>
  </div>;
}
