// ─────────────────────────────────────────────────────────────────────────────
// ReceitasComp.jsx — Receitas e orientações para o paciente em QT
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, T } from "../../utils/constants";
import { AUTOR, AUTOR2, HOSP } from "../../utils/constants";
import { sc_, Btn, PrintModal } from "../../components/ui/primitives";

export default function ReceitasComp({pac,addCaixaEntrada}){
  const [print,setPrint]=useState(null);
  const hoje=new Date().toLocaleDateString("pt-BR");
  const cab=`${AUTOR} · ${AUTOR2}\n${HOSP}\n${"─".repeat(50)}\nNome: ${pac.nome||"___"}  Data: ${hoje}\n${"─".repeat(50)}\n\n`;
  const DOCS=[
    {ico:"💊",t:"Sintomáticos VO",c:cab+`RECEITA MÉDICA — VIA ORAL\n\n1. Pantoprazol 20mg — jejum durante QT\n2. Ondansetrona 8mg — 8/8h × 2d pós-QT\n3. Metoclopramida 10mg — 8/8h × 2d\n4. Dexametasona 4mg — noite ant. + dia seguinte\n5. Loperamida 2mg — 2cp início + 1cp/2h (diarreia)\n6. Lactulose 30mL — 12/12h (obstipação)\n7. Simeticona 125mg — 8/8h pós refeições`},
    {ico:"💉",t:"Sintomáticos EV (UBS)",c:cab+`RECEITA MÉDICA — VIA ENDOVENOSA\n\n1. Complexo B — IV SF 500mL 3h\n2. Ondansetrona 8mg — IV SF 100mL 15min\n3. Metoclopramida 10mg — IV SF 100mL\n4. Noripurum — IV SF 250mL 30min\n5. Buscopan — IV SF 250mL\n6. Dexametasona 10mg — IV lento`},
    {ico:"🧪",t:"Exames Laboratoriais",c:cab+`REQUISIÇÃO DE EXAMES\n\nREALIZAR 2 DIAS ANTES DO PRÓXIMO CICLO:\n\n          CICLO 1   CICLO 2   CICLO 3\nHemograma    X         X         X\nUreia         X         X         X\nCreatinina    X         X         X\nTGO (AST)     X         X         X\nTGP (ALT)     X         X         X`},
    {ico:"🚨",t:"Sinais de Alarme",c:cab+`SINAIS DE ALARME\n\nVÁ AO PRONTO SOCORRO SE:\n■ FEBRE acima de 37,8°C — IMEDIATAMENTE!\n■ Calafrios intensos / pus no cateter\n■ Falta de ar ou dificuldade respiratória\n■ Dor ao urinar / sangramento anormal\n■ Confusão mental ou desmaio\n■ Vômitos > 5x/dia ou diarreia > 6x/dia\n■ Dor forte que não melhora\n\nEM CASO DE DÚVIDA — VÁ AO PS, NÃO ESPERE!`},
    {ico:"🥗",t:"Orientação Nutricional",c:cab+`ORIENTAÇÃO NUTRICIONAL\n\n✓ PODE: Frango/peixe/ovos cozidos · Feijão · Arroz/batata · Frutas descascadas · Vegetais cozidos · 2-3L água/dia\n\n✗ NÃO PODE: Carnes cruas/sushi · ÁLCOOL · Ultraprocessados · Queijo artesanal fresco\n\nDICAS: 6 refeições pequenas · Mastigar devagar · Lavar bem os alimentos`},
  ];
  return <div style={{display:"grid",gap:9}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    {DOCS.map((d,i)=><div key={i} style={{...sc_.card(),display:"flex",gap:9,alignItems:"center",padding:11}}>
      <div style={{width:38,height:38,background:`linear-gradient(135deg,${N},${T})`,borderRadius:9,display:"grid",placeItems:"center",fontSize:18,flexShrink:0}}>{d.ico}</div>
      <strong style={{color:N,flex:1,fontSize:12}}>{d.t}</strong>
      <div style={{display:"flex",gap:5}}>
        <Btn v="gold" ch="🖨" s={{fontSize:11,padding:"5px 8px"}} onClick={()=>setPrint({t:d.t,c:d.c})}/>
        <Btn v="ghost" ch="📋" s={{fontSize:10,padding:"5px 7px"}} onClick={()=>navigator.clipboard?.writeText(d.c)}/>
      </div>
    </div>)}
  </div>;
}
