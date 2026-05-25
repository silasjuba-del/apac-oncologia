// ─────────────────────────────────────────────────────────────────────────────
// DiscussaoClinicaIA.jsx — Banca de discussão clínica com agentes IA
// Inclui: AGENTES_DISC_CLINICA, fallbackParecerAgente (helpers locais)
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, G, T, VM } from "../../utils/constants";
import { sc_, H2, H3, Btn, NOW } from "../../components/ui/primitives";
import { chamarClaude } from "../../utils/api";
import { condutasDeResumoTriagem } from "../enfermagem/triagem-utils";

const AGENTES_DISC_CLINICA=[
  {id:"oncologista",nome:"Oncologista clínico",foco:"tratamento sistêmico, toxicidade, urgência oncológica e segurança para quimioterapia"},
  {id:"radio",nome:"Radioterapeuta",foco:"indicação de radioterapia, urgências radioterápicas, controle local e riscos anatômicos"},
  {id:"cirurgiao",nome:"Cirurgião oncológico",foco:"abdome agudo, infecção, sangramento, cateter, complicações cirúrgicas e necessidade de abordagem invasiva"}
];
function fallbackParecerAgente(agente,triagem){
  const condutas=triagem?.condutas||condutasDeResumoTriagem(triagem?.resumo||"",triagem?.alarmes||[]);
  const alarmes=condutas.map(c=>c.titulo).join(", ")||"sem alarme estruturado";
  return `IMPRESSÃO CLÍNICA\n${agente.nome}: caso recebido com ${alarmes}. A prioridade é confirmar gravidade, estabilidade clínica e risco infeccioso/toxicológico.\n\nRISCO / URGÊNCIA\n${condutas.some(c=>c.nivel==="critico")?"Alto, com necessidade de avaliação médica imediata.":"Moderado a alto, conforme sinais vitais, laboratório e evolução."}\n\nLACUNAS DE INFORMAÇÃO\nSinais vitais atuais, hemograma com neutrófilos/plaquetas, função renal/hepática, medicações recentes e data do último ciclo.\n\nPROPOSTA PARA DISCUSSÃO\nValidar conduta médica, definir exames prioritários, suspender ou liberar QT somente após avaliação, e registrar decisão no prontuário.\n\nALERTA DE SEGURANÇA\nEste parecer é apoio à discussão clínica e não substitui decisão médica.`;
}
export default function DiscussaoClinicaIA({pac,dossie,triagens,triagemSelecionada,addMsg,onSalvar}){
  const triagem=triagemSelecionada||triagens?.[0]||null;
  const [pergunta,setPergunta]=useState("Qual a melhor conduta e prioridade para este caso considerando segurança oncológica?");
  const [rodando,setRodando]=useState(false);
  const [pareceres,setPareceres]=useState([]);
  const [sintese,setSintese]=useState("");
  const [erro,setErro]=useState("");
  const caso=`PACIENTE\n${pac?.nome||"Paciente nao informado"} · Diagnostico: ${pac?.diag||"nao informado"} · Protocolo: ${pac?.trat||"nao informado"} · ECOG: ${pac?.ecog||"nao informado"}\n\nTRIAGEM\n${triagem?.resumo||"Sem triagem selecionada."}\n\nCONDUTAS VINCULADAS\n${(triagem?.condutas||[]).map(c=>`${c.titulo}: ${c.resumo}`).join("\n")||"Sem conduta estruturada."}\n\nDOSSIE\n${dossie?.resumoClaude||dossie?.evolucao?.textoFinal||dossie?.evolucao?.rascunho||"Sem resumo do dossie."}`;
  const gerar=async()=>{
    setRodando(true);setErro("");setPareceres([]);setSintese("");
    try{
      const novos=[];
      for(const ag of AGENTES_DISC_CLINICA){
        const prompt=`Você é ${ag.nome}. Analise o caso como apoio à reunião clínica, sem substituir decisão médica. Foco: ${ag.foco}.\n\nResponda em português com estes títulos: IMPRESSÃO CLÍNICA, RISCO / URGÊNCIA, LACUNAS DE INFORMAÇÃO, PROPOSTA PARA DISCUSSÃO, ALERTA DE SEGURANÇA.\n\nPERGUNTA: ${pergunta}\n\n${caso}`;
        let txt=await chamarClaude(prompt,900);
        if(!txt||/^⚠|erro/i.test(txt))txt=fallbackParecerAgente(ag,triagem);
        novos.push({...ag,texto:txt});
        setPareceres([...novos]);
      }
      const promptSintese=`Você preside uma discussão clínica de oncologia. Gere uma síntese final curta, para validação do médico, com decisão pendente explícita. Não prescreva como ordem automática.\n\nPergunta: ${pergunta}\n\nPareceres:\n${novos.map(p=>`${p.nome}\n${p.texto}`).join("\n\n")}\n\nCaso:\n${caso}`;
      let final=await chamarClaude(promptSintese,900);
      if(!final||/^⚠|erro/i.test(final))final=`SÍNTESE PARA VALIDAÇÃO MÉDICA\nCaso discutido por oncologia clínica, radioterapia e cirurgia oncológica. Priorizar segurança clínica, revisar sinais vitais e exames críticos, validar se há necessidade de emergência/internação, e registrar decisão final do médico no prontuário.\n\nPENDÊNCIAS\nHemograma com diferencial, função renal/hepática, avaliação do foco do sintoma e confirmação de estabilidade.\n\nOBSERVAÇÃO\nDocumento de apoio à decisão médica.`;
      setSintese(final);
    }catch(e){setErro(e.message||"Erro ao gerar discussão clínica.");}
    finally{setRodando(false);}
  };
  const salvar=()=>{
    const texto=`DISCUSSÃO CLÍNICA IA - ${NOW()}\nPaciente: ${pac?.nome||"—"}\nPergunta: ${pergunta}\n\n${pareceres.map(p=>`${p.nome.toUpperCase()}\n${p.texto}`).join("\n\n")}\n\nSÍNTESE FINAL\n${sintese}`;
    onSalvar&&onSalvar(texto);
    addMsg&&addMsg("Discussão Clínica IA","Médico","Discussão clínica salva no prontuário de "+(pac?.nome||"paciente")+".","msg");
  };
  return <div style={{display:"grid",gap:12}}>
    <div style={sc_.card({border:`2px solid ${G}55`,background:"#fff"})}>
      <H2 ch="Discussão Clínica com IA"/>
      <p style={{fontSize:12,color:"#64748B",margin:"0 0 10px"}}>Banca de apoio com oncologista clínico, radioterapeuta e cirurgião oncológico. O resultado é salvo como discussão, sem substituir a decisão médica.</p>
      <textarea value={pergunta} onChange={e=>setPergunta(e.target.value)} rows={3} style={{...sc_.inp,fontSize:13,background:"#fff",resize:"vertical"}}/>
      <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
        <Btn v="gold" ch={rodando?"Gerando pareceres...":"Gerar pareceres"} dis={rodando} onClick={gerar}/>
        {sintese&&<Btn v="green" ch="Salvar no prontuário" onClick={salvar}/>}
      </div>
      {erro&&<div style={{marginTop:8,color:VM,fontSize:12,fontWeight:800}}>{erro}</div>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
      {AGENTES_DISC_CLINICA.map(ag=>{
        const p=pareceres.find(x=>x.id===ag.id);
        return <div key={ag.id} style={sc_.card({minHeight:180,border:`1px solid ${G}44`})}>
          <strong style={{color:N,fontSize:14}}>{ag.nome}</strong>
          <p style={{fontSize:11,color:"#64748B",margin:"4px 0 10px"}}>{ag.foco}</p>
          <pre style={{whiteSpace:"pre-wrap",fontFamily:"Arial, sans-serif",fontSize:12,lineHeight:1.55,color:"#334155",margin:0}}>{p?.texto|| (rodando?"Aguardando parecer...":"Clique em gerar pareceres.")}</pre>
        </div>;
      })}
    </div>
    {sintese&&<div style={sc_.card({border:`2px solid ${N}33`,background:"#F8FAFC"})}>
      <H3 ch="Síntese final para validação médica"/>
      <pre style={{whiteSpace:"pre-wrap",fontFamily:"Arial, sans-serif",fontSize:14,lineHeight:1.6,color:N,fontWeight:700,margin:0}}>{sintese}</pre>
    </div>}
  </div>;
}
