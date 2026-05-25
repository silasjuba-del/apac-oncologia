// ─────────────────────────────────────────────────────────────────────────────
// SegundaViaTab.jsx — Documentos de segunda via para o paciente oncológico
// Extraído de App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { N, T, G, AM, VM } from "../../utils/constants";
import { AUTOR, AUTOR2, HOSP } from "../../utils/constants";
import { sc_, H2, Btn, PrintModal } from "../../components/ui/primitives";

export default function SegundaViaTab({pac,addCaixaEntrada,laudoLiberado=false}){
  const [print,setPrint]=useState(null);
  const hoje=new Date().toLocaleDateString("pt-BR");
  const cabHosp=`H  HOSPITAL DO BEM\nUnidade Oncológica — Complexo Hospitalar Regional Dep. Janduhy Carneiro\n\nDr. Silas Negrão — CRM-PB 17341\n${"─".repeat(60)}\nNOME: ${pac.nome||"___"}  NASC.: ${pac.nasc||"______"}  CIDADE: ${pac.cidade||"__________"}  IDADE: ${pac.idade||"__"}\n${"─".repeat(60)}\n`;
  const receitaSint=`${cabHosp}RECEITA MÉDICA                    Data: ${hoje}\n\nVIA ORAL\n1. Pantoprazol 20 mg — jejum, tomar durante toda QT\n2. Ondansetrona 8 mg — 8/8h por 2 dias pós-QT\n3. Metoclopramida 10 mg — 8/8h por 2 dias pós-QT\n4. Dexametasona 4 mg — noite anterior + dia seguinte\n5. Loperamida 2 mg — 2 cp início, 1 cp/2h se diarreia\n6. Lactulose — 30 mL 12/12h se obstipação\n7. Simeticona 125 mg — 8/8h após refeições\n\nVIA ENDOVENOSA (UBS)\n1. Complexo B — IV SF 500 mL · 2. Ondansetrona 8 mg IV · 3. Noripurum IV · 4. Buscopan IV · 5. Dexametasona 10 mg IV\n\nObs: Nenhuma medicação está contraindicada.\n${"─".repeat(60)}\n${AUTOR} · ${AUTOR2}\n${HOSP}`;
  const examesLab=`${cabHosp}REQUISIÇÃO DE EXAMES              Data: ${hoje}\n\nCOLETAR ANTES DO PRÓXIMO CICLO\n                   CICLO 1      CICLO 2      CICLO 3\nHEMOGRAMA             X            X            X\nUREIA                 X            X            X\nCREATININA            X            X            X\nTGO (AST)             X            X            X\nTGP (ALT)             X            X            X\n\nFavor realizar 2 dias ANTES do próximo ciclo.\n${"─".repeat(60)}\n${AUTOR} · ${AUTOR2}\n${HOSP}`;
  const laudoPericial=`${cabHosp}RELATÓRIO MÉDICO ONCOLÓGICO\nDOCUMENTO PARA FINS PERICIAIS\n\nAtesto que o(a) paciente foi diagnosticado(a) com ${pac.diag||"neoplasia maligna"} e encontra-se em tratamento oncológico com quimioterapia.\n\nRecomendo afastamento por 6 meses.\n\nDireitos: INSS · FGTS · PIS/PASEP · IR isento · Transporte · Passe Livre\n${"─".repeat(60)}\n${AUTOR} · ${AUTOR2}\nData: ${hoje}\n${HOSP}`;
  const sinaisAlarme=`${cabHosp}SINAIS DE ALARME                  Data: ${hoje}\n\nVÁ AO PRONTO SOCORRO SE:\n■ FEBRE >37,8°C — IMEDIATAMENTE!\n■ Calafrios · Pus em cateter · Tosse+falta de ar\n■ Dor ao urinar · Sangramento · Confusão mental\n■ Sangue nas fezes/urina/vômitos · Dor forte\n■ Falta de ar súbita · Inchaço no rosto\n\nEM CASO DE DÚVIDA, VÁ AO PS — NÃO ESPERE!\n\nPressão:___/___ Vômitos: ( )Nenhum ( )1-2x ( )>3x\nDor (0-10): ( )0 ( )1-3 ( )4-6 ( )7-10\n${"─".repeat(60)}\n${AUTOR} · ${HOSP}`;
  const oriNutri=`${cabHosp}ORIENTAÇÃO NUTRICIONAL            Data: ${hoje}\n\n✓ PODE COMER:\nProteínas: frango/peixe/carne magra/ovos cozidos/feijão\nCarboidratos: arroz/macarrão/pão/batata/aveia\nFrutas: descascadas e lavadas · Vegetais: preferencialmente cozidos\nLíquidos: 2-3 L/dia água filtrada, caldos, sucos naturais\n\n✗ NÃO PODE:\nCarnes/ovos crus · Sushi · ÁLCOOL (qualquer) · Alimentos ultraprocessados\nQueijo fresco artesanal · Frituras excessivas · Refrigerantes\n\nDICAS: Fracionar (6×/dia) · Mastigar devagar · Lavar bem os alimentos\n${"─".repeat(60)}\n${AUTOR} · ${HOSP}`;
  const DOCS=[
    {ico:"💊",t:"Receita de Sintomáticos",sub:"Medicamentos VO + EV pós-QT",c:receitaSint},
    {ico:"🧪",t:"Requisição de Exames",sub:"Hemograma · Ureia · Creatinina · TGO · TGP",c:examesLab},
    {ico:"📋",t:"Laudo Pericial / Relatório",sub:"INSS · Afastamento · Direitos sociais",c:laudoPericial,gate:true},
    {ico:"🚨",t:"Sinais de Alarme",sub:"Quando ir ao Pronto-Socorro",c:sinaisAlarme},
    {ico:"🥗",t:"Orientação Nutricional",sub:"O que comer durante o tratamento",c:oriNutri},
  ];
  return <div style={{display:"grid",gap:11}}>
    {print&&<PrintModal titulo={print.t} conteudo={print.c} onClose={()=>setPrint(null)}/>}
    <div style={{...sc_.card({background:`linear-gradient(135deg,${N},#0d2347)`,padding:14})}}>
      <H2 ch="📄 Segunda Via de Documentos" s={{color:"#fff",margin:"0 0 3px"}}/><p style={{color:G,fontSize:10,margin:0}}>Documentos médicos a qualquer momento</p>
    </div>
    {DOCS.map((d,i)=><div key={i} style={{...sc_.card({border:`1px solid ${d.gate&&!laudoLiberado?VM+"44":N+"22"}`}),display:"flex",gap:12,alignItems:"center"}}>
      <div style={{width:46,height:46,background:`linear-gradient(135deg,${N},${T})`,borderRadius:12,display:"grid",placeItems:"center",fontSize:24,flexShrink:0}}>{d.ico}</div>
      <div style={{flex:1}}><strong style={{color:N,display:"block",fontSize:13}}>{d.t}</strong><small style={{color:"#64748B",fontSize:10}}>{d.sub}</small>{d.gate&&!laudoLiberado&&<span style={{display:"block",fontSize:9,color:VM,fontWeight:700,marginTop:2}}>🔒 Requer liberação da Assistência Social</span>}</div>
      <div style={{display:"flex",gap:5,flexDirection:"column"}}>
        {(!d.gate||laudoLiberado)?<><Btn v="gold" ch="🖨" s={{fontSize:11,padding:"6px 11px"}} onClick={()=>setPrint({t:d.t,c:d.c})}/><Btn v="ghost" ch="📋" s={{fontSize:10,padding:"5px 8px"}} onClick={()=>navigator.clipboard?.writeText(d.c)}/></>
          :<Btn v="ghost" ch="📱 Solicitar AS" s={{fontSize:10,background:AM+"22",color:AM}} onClick={()=>alert("Solicite à Assistência Social a liberação do seu laudo.")}/>}
      </div>
    </div>)}
  </div>;
}
