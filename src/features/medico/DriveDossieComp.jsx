// ─────────────────────────────────────────────────────────────────────────────
// DriveDossieComp.jsx — Integração Drive → Dossiê via backend / IA
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { N, G, T, VE, VM, AM } from "../../utils/constants";
import { sc_, H2, H3, Fld, Btn, NOW, ResumoBullets } from "../../components/ui/primitives";
import { _apiUrl } from "../../utils/api";
import {
  criarDossieInicial, gerarTextoEvolucao, validarAPAC, gerarDossieClaude,
} from "../../utils/dossie";
import { executarProntuarioSecurity } from "../../utils/security";
import { StatusDossieBar } from "./DossieBarComponents";

export default function DriveDossieComp({pac,dossie,setDossie,addMsg}){
  const API_URL=_apiUrl();
  const pacienteBusca=[pac?.nome,pac?.cpf,pac?.cns,pac?.pacID].filter(Boolean).join(" ");
  const [url,setUrl]=useState(pac?.drive_folder||pacienteBusca);
  const [texto,setTexto]=useState("");
  const [tipo,setTipo]=useState("Laudo/Exame");
  const [loading,setLoading]=useState(false);
  const [buscando,setBuscando]=useState(false);
  const [resultado,setResultado]=useState("");
  const [achados,setAchados]=useState(null);
  const [erro,setErro]=useState("");
  const [selecionados,setSelecionados]=useState(new Set());

  useEffect(()=>{setUrl(pac?.drive_folder||pacienteBusca);},[pac?.pacID,pac?.nome,pac?.cpf,pac?.cns,pac?.drive_folder]);

  const toggleSel=id=>setSelecionados(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const selTodos=()=>setSelecionados(new Set((achados?.files||[]).map(f=>f.id)));
  const selNenhum=()=>setSelecionados(new Set());

  const buscarDrive=async()=>{
    if(!url.trim()){alert("Informe nome, CPF, ID ou link da pasta Drive.");return;}
    setBuscando(true);setErro("");setAchados(null);setSelecionados(new Set());
    try{
      const r=await fetch(API_URL+"/api/drive/search?q="+encodeURIComponent(url.trim()));
      const d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.message||"Falha ao buscar no Drive.");
      setAchados(d);
      if(d.folder?.name)setUrl(d.folder.name);
      if(!d.folder)setErro("Nenhuma pasta encontrada. Confira se a pasta foi compartilhada com o e-mail da service account.");
    }catch(e){
      setErro("Drive indisponível: "+e.message+". Mantive o modo manual por texto/link.");
    }finally{setBuscando(false);}
  };

  const analisar=async()=>{
    const consultaDrive=(url||pacienteBusca||"").trim();
    const conteudo=(consultaDrive?("Paciente/pasta Drive: "+consultaDrive+"\n"):"")+texto;
    if(!consultaDrive&&!texto.trim()&&selecionados.size===0){alert("Informe ou selecione um paciente antes de gerar o resumo.");return;}
    if(selecionados.size>5){alert("Selecione no máximo 5 arquivos por vez para análise.");return;}
    setLoading(true);setErro("");
    try{
      const arquivoIds=selecionados.size>0?Array.from(selecionados):null;
      const r=await fetch(API_URL+"/api/dossie/drive",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({paciente:pac||{},recepcao:{drive_folder:consultaDrive},drive_folder:consultaDrive,texto,tipo,arquivoIds})
      });
      const data=await r.json();
      if(!r.ok||!data.ok)throw new Error(data.message||"Falha no backend Drive/Claude.");
      const docs=(data.arquivos||[]).map(a=>({id:a.id,tipo:a.tipoProvavel||tipo,nome:a.name,link:a.webViewLink,origem:"google_drive",criadoEm:a.createdTime||NOW(),resumo:"Analisado pelo backend"}));
      if(texto.trim())docs.push({id:Date.now(),tipo,nome:"Texto colado",conteudo:texto,origem:"texto_manual",criadoEm:NOW()});
      const novo={...(dossie||criarDossieInicial(pac)),paciente:{...(dossie?.paciente||{}),...pac,drive_folder:consultaDrive},documentos:[...docs,...(dossie?.documentos||[])],resumoClaude:data.resumo,status:"pronto_medico",updatedAt:NOW()};
      novo.evolucao={...(novo.evolucao||{}),rascunho:gerarTextoEvolucao(novo)};
      novo.apac=validarAPAC(novo);
      if(!executarProntuarioSecurity({pac,texto:[data.resumo,novo.evolucao?.rascunho].filter(Boolean).join("\n\n"),dossie:novo,origem:"Drive IA"},addMsg))return;
      setDossie&&setDossie(novo);
      setResultado(data.resumo);
      setAchados(prev=>({...prev,folder:data.folder||prev?.folder,files:data.arquivos?.length?data.arquivos:(prev?.files||[])}));
      addMsg&&addMsg("Sistema","Médico","Drive analisado por backend/Claude e vinculado ao dossiê de "+(pac?.nome||"paciente")+".","laudo");
    }catch(e){
      const doc={id:Date.now(),tipo,nome:consultaDrive||tipo,link:consultaDrive,conteudo:texto,origem:"drive_manual",criadoEm:NOW()};
      const base={...(dossie||criarDossieInicial(pac)),paciente:{...(dossie?.paciente||{}),...pac,drive_folder:consultaDrive},documentos:[doc,...(dossie?.documentos||[])],status:"documentos_anexados",updatedAt:NOW()};
      const novo=await gerarDossieClaude(base);
      if(!executarProntuarioSecurity({pac,texto:[novo?.resumoClaude,novo?.evolucao?.rascunho].filter(Boolean).join("\n\n"),dossie:novo,origem:"Drive IA fallback"},addMsg))return;
      setDossie&&setDossie(novo);
      setResultado(novo.resumoClaude);
      setErro("Backend não respondeu. Usei o fallback local do app: "+e.message);
      addMsg&&addMsg("Sistema","Médico","Drive analisado em modo local e vinculado ao dossiê de "+(pac?.nome||"paciente")+".","laudo");
    }finally{setLoading(false);}
  };

  const arquivosLista=achados?.files||[];
  const nSel=selecionados.size;

  return <div style={{display:"grid",gap:12}}>
    <StatusDossieBar dossie={dossie}/>
    <div style={sc_.card()}>
      <H2 ch="Drive → Gerar resumo"/>
      <p style={{fontSize:12,color:"#64748B",marginTop:-4}}>A pasta da equipe já está configurada. Confira o paciente e clique para o Claude buscar os laudos, resumir e inserir no dossiê.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,alignItems:"end"}}>
        <Fld l="Paciente" val={url} set={setUrl} ph="Nome do paciente"/>
        <Btn v="navy" ch={loading?"Gerando resumo...":"🧠 Gerar resumo"} s={{padding:"12px 22px",fontSize:13,whiteSpace:"nowrap"}} dis={loading||!String(url||pacienteBusca||"").trim()} onClick={analisar}/>
      </div>
      <details style={{marginTop:8}}>
        <summary style={{cursor:"pointer",fontSize:11,color:"#64748B",fontWeight:800}}>Opções avançadas</summary>
        <div style={{display:"grid",gap:8,marginTop:8}}>
          <Fld l="Observação complementar" val={texto} set={setTexto} ph="Opcional: detalhe data, tipo de exame ou observação para a IA..." ta rows={2}/>
          <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:10}}>
            <div><label style={{fontSize:11,fontWeight:800,color:N,textTransform:"uppercase",display:"block",marginBottom:4}}>Tipo provável</label><select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...sc_.inp,fontSize:12}}>{["Biópsia","Imunohistoquímica","Tomografia","Ressonância","Mamografia","Ultrassom","Cintilografia","PET-CT","Laboratório","Documento pessoal","Laudo/Exame"].map(x=><option key={x}>{x}</option>)}</select></div>
            <Btn v="ghost" ch={buscando?"Buscando...":"Buscar arquivos"} s={{padding:12}} dis={buscando} onClick={buscarDrive}/>
          </div>
        </div>
      </details>
      {erro&&<div style={{background:"#FFF7E6",border:"1px solid "+AM+"55",borderRadius:9,padding:"8px 10px",fontSize:11,color:AM,fontWeight:800}}>{erro}</div>}
      {arquivosLista.length>0&&<div style={{background:"#F8FAFF",border:"1px solid #CBD5E1",borderRadius:10,padding:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:900,color:VE}}>📁 {achados?.folder?.name} — {arquivosLista.length} arquivo(s)</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={selTodos} style={{fontSize:10,padding:"3px 8px",borderRadius:5,border:"1px solid #CBD5E1",background:"#fff",cursor:"pointer",color:N}}>Todos</button>
            <button onClick={selNenhum} style={{fontSize:10,padding:"3px 8px",borderRadius:5,border:"1px solid #CBD5E1",background:"#fff",cursor:"pointer",color:"#64748B"}}>Nenhum</button>
          </div>
        </div>
        <p style={{fontSize:10,color:"#64748B",margin:"0 0 8px"}}>✅ Selecione os arquivos deste paciente (máx. 5 por análise). Arquivos &gt;4MB não serão baixados.</p>
        <div style={{display:"grid",gap:4,maxHeight:280,overflowY:"auto"}}>
          {arquivosLista.map(f=>{
            const sel=selecionados.has(f.id);
            const grande=parseInt(f.size||"0")>4*1024*1024;
            return <div key={f.id} onClick={()=>!grande&&toggleSel(f.id)} style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:grande?"#94A3B8":sel?VE:N,background:sel?"#EAF7EE":"#fff",border:"1px solid "+(sel?VE+"88":"#CBD5E1"),borderRadius:7,padding:"5px 8px",cursor:grande?"not-allowed":"pointer",opacity:grande?0.6:1}}>
              <span style={{fontSize:14}}>{sel?"☑":"☐"}</span>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
              <span style={{fontSize:10,color:"#94A3B8",whiteSpace:"nowrap"}}>{Math.round(parseInt(f.size||"0")/1024)}KB{grande?" ⚠️ grande":""}</span>
            </div>;
          })}
        </div>
        {nSel>0&&<div style={{marginTop:8,fontSize:11,fontWeight:800,color:VE}}>{nSel} arquivo(s) selecionado(s) para análise</div>}
      </div>}
    </div>
    {resultado&&<div style={sc_.card({border:"2px solid "+VE+"55"})}><H3 ch="Resumo IA inserido no dossiê"/><ResumoBullets texto={resultado} maxH={360}/></div>}
  </div>;
}
