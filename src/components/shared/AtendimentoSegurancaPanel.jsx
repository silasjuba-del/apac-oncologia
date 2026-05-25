// ─────────────────────────────────────────────────────────────────────────────
// AtendimentoSegurancaPanel.jsx — Tela de conclusão/segurança de atendimento
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { N, G, T } from "../../utils/constants";
import { sc_, H2, Bge } from "../../components/ui/primitives";

export default function AtendimentoSegurancaPanel({pac,dossie,onConcluir,onNovo,onLimparTestes}){
  const docs=dossie?.documentos?.length||0;
  const evolucoes=pac?.evolucoes?.length||0;
  const nome=pac?.nome||"Nenhum paciente ativo";
  const detalhe=[pac?.nasc&&("Nasc.: "+pac.nasc),pac?.cpf&&("CPF: "+pac.cpf),pac?.cns&&("CNS: "+pac.cns),pac?.pacID&&("ID: "+pac.pacID)].filter(Boolean).join(" · ");
  return <div style={{display:"grid",gap:14}}>
    <div style={sc_.card({border:`2px solid ${G}55`,background:"#FFFBEB"})}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,fontWeight:900,color:G,textTransform:"uppercase",letterSpacing:.8}}>Segurança do atendimento</div>
          <h2 style={{margin:"4px 0",fontSize:24,color:N,fontWeight:950}}>Concluir ou iniciar atendimento limpo</h2>
          <p style={{margin:"4px 0 0",fontSize:13,color:"#475569",maxWidth:820}}>
            Esta tela fecha o contexto ativo antes de abrir outro paciente. Prontuários e prescrições já salvos continuam vinculados ao paciente correto.
          </p>
        </div>
        <Bge t={pac?.nome?"ok":"warn"} ch={pac?.nome?"Paciente ativo":"Sem paciente"}/>
      </div>
    </div>

    <div style={sc_.card()}>
      <H2 ch="Paciente em atendimento" s={{marginTop:0}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
        <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:12}}>
          <div style={{fontSize:11,fontWeight:900,color:"#64748B",textTransform:"uppercase"}}>Nome</div>
          <div style={{fontSize:18,fontWeight:900,color:N,marginTop:3}}>{nome}</div>
          {detalhe&&<div style={{fontSize:11,color:"#64748B",marginTop:4}}>{detalhe}</div>}
        </div>
        <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:12}}>
          <div style={{fontSize:11,fontWeight:900,color:"#64748B",textTransform:"uppercase"}}>Documentos no dossiê</div>
          <div style={{fontSize:22,fontWeight:950,color:T,marginTop:3}}>{docs}</div>
        </div>
        <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:12}}>
          <div style={{fontSize:11,fontWeight:900,color:"#64748B",textTransform:"uppercase"}}>Evoluções gravadas</div>
          <div style={{fontSize:22,fontWeight:950,color:T,marginTop:3}}>{evolucoes}</div>
        </div>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
      <button onClick={onConcluir} style={{...sc_.btn("green",{padding:18,textAlign:"left",borderRadius:12})}}>
        <div style={{fontSize:18}}>✅ Concluir atendimento</div>
        <div style={{fontSize:12,fontWeight:700,opacity:.9,marginTop:4}}>Salva o dossiê atual, marca como concluído, limpa abas ativas e abre atendimento vazio.</div>
      </button>
      <button onClick={onNovo} style={{...sc_.btn("navy",{padding:18,textAlign:"left",borderRadius:12})}}>
        <div style={{fontSize:18}}>🧼 Novo atendimento</div>
        <div style={{fontSize:12,fontWeight:700,opacity:.9,marginTop:4}}>Zera a tela e os rascunhos do módulo para impedir mistura entre pacientes.</div>
      </button>
      <button onClick={onLimparTestes} style={{...sc_.btn("red",{padding:18,textAlign:"left",borderRadius:12})}}>
        <div style={{fontSize:18}}>🧹 Limpar pacientes de teste</div>
        <div style={{fontSize:12,fontWeight:700,opacity:.9,marginTop:4}}>Remove apenas registros com nomes de teste/demo/codex; não apaga prontuários reais.</div>
      </button>
    </div>
  </div>;
}
