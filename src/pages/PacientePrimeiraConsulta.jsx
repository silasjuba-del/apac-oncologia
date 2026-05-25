// src/pages/PacientePrimeiraConsulta.jsx
// APACApp — Primeira consulta para paciente leigo
// Hospital do Bem — Patos/PB — Dr. Silas Negrão
import { useState, useCallback, useRef, useEffect } from 'react';
import { validarCPF, validarCNS, validarTelefone, calcularIdade, formatarCPF, formatarTelefone, formatarCEP } from '../agents/agenteAPAC.js';

const N = '#1B365D', T = '#2B7A8C', G = '#B8860B';

const ETAPAS = [
  { id:1, label:'Identificação', icone:'👤' },
  { id:2, label:'Contatos telefônicos', icone:'📞' },
  { id:3, label:'Endereço',      icone:'📍' },
  { id:4, label:'Acompanhante',  icone:'🤝' },
  { id:5, label:'O que sente',   icone:'💬' },
  { id:6, label:'Saúde geral',   icone:'🏥' },
  { id:7, label:'Revisão',       icone:'✅' },
];

const CHAVE_RASCUNHO = 'apacapp_primeira_consulta_rascunho';
const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function estadoInicial() {
  return {
    nomeCompleto:'', dataNascimento:'', sexo:'', nomeMae:'',
    cpf:'', cns:'', rg:'', nomeSocial:'', racaCor:'',
    telefonePrincipal:'', whatsapp:'', telefoneRecado:'',
    nomeContatoRecado:'', parentescoContato:'',
    cep:'', logradouro:'', numero:'', complemento:'',
    bairro:'', cidade:'', estado:'PB', pontoReferencia:'',
    municipioOrigem:'', unidadeSaudeOrigem:'', quemEncaminhou:'',
    convenio:'SUS', possuiAcompanhante:false,
    nomeAcompanhante:'', telefoneAcompanhante:'', parentescoAcompanhante:'',
    queixaPrincipal:'',
    respostasClinicas:{
      sabeDiagnostico:'',
      temDor:false, localDor:'', perdeuPeso:false, comendoMenos:false,
      temFebre:false, temSangramento:false, temFaltaAr:false,
      temTosse:false, temVomitos:false, temDiarreia:false,
      temPrisaoVentre:false, urinandoNormal:true, evacuandoNormal:true,
      temFeridasCarocosInchacos:false, jaFezCirurgia:false, descricaoCirurgia:'',
      jaFicouInternado:false, usaRememediosDiarios:false, remediosDiarios:'',
      temAlergia:false, alergias:'',
      temHAS:false, temDM:false, temDoencaCoracao:false,
      temDoencaRins:false, temDoencaFigado:false,
      teveAVC:false, teveInfarto:false, teveTrombose:false,
      fuma:false, bebeAlcool:false, familiarComCancer:false, descricaoFamiliar:'',
    },
    consentimentoLGPD:false,
    criadoEm:new Date().toISOString(),
    atualizadoEm:new Date().toISOString(),
    status:'rascunho',
  };
}

// ─── Componentes reutilizáveis ────────────────────────────────────────────────

function Campo({ label, obrigatorio, dica, erro, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:'block', fontWeight:700, fontSize:16, color:N, marginBottom:4 }}>
        {label}{obrigatorio && <span style={{ color:G, marginLeft:4 }}>*</span>}
      </label>
      {dica && <p style={{ fontSize:13, color:'#6B7280', marginBottom:6, marginTop:0 }}>{dica}</p>}
      {children}
      {erro && <p style={{ fontSize:13, color:'#DC2626', marginTop:4, padding:'4px 8px', background:'#FEF2F2', borderRadius:4 }}>⚠️ {erro}</p>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type='text', maxLength, disabled, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <input value={value||''} onChange={onChange} placeholder={placeholder} type={type}
      maxLength={maxLength} disabled={disabled}
      style={{ width:'100%', padding:'12px 14px', fontSize:16,
        border:`2px solid ${focus?T:'#D1D5DB'}`, borderRadius:8,
        outline:'none', boxSizing:'border-box', fontFamily:'inherit',
        background:disabled?'#F9FAFB':'white', color:disabled?'#9CA3AF':'inherit',
      }}
      onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
      {...rest}
    />
  );
}

function SimNao({ valor, onChange, labelSim='Sim', labelNao='Não' }) {
  return (
    <div style={{ display:'flex', gap:12 }}>
      {[true,false].map(v=>(
        <button key={String(v)} type="button" onClick={()=>onChange(v)} style={{
          flex:1, padding:'12px 0', fontSize:16, fontWeight:700, borderRadius:8,
          cursor:'pointer', border:'2px solid',
          borderColor:valor===v?T:'#D1D5DB',
          background:valor===v?T:'white',
          color:valor===v?'white':'#374151',
        }}>
          {v?labelSim:labelNao}
        </button>
      ))}
    </div>
  );
}

function PerguntaSimNao({ pergunta, campo, dados, onChange, extra }) {
  const valor = dados[campo];
  return (
    <div style={{ background:'#F9FAFB', borderRadius:10, padding:'14px 16px', marginBottom:12, border:'1px solid #E5E7EB' }}>
      <p style={{ fontWeight:600, fontSize:15, color:N, margin:'0 0 10px' }}>{pergunta}</p>
      <SimNao valor={valor} onChange={v=>onChange(campo,v)} />
      {valor && extra}
    </div>
  );
}

function Microfone({ onTranscricao }) {
  const [status, setStatus] = useState('inativo');
  const [suportado] = useState(()=>typeof window!=='undefined'&&('SpeechRecognition' in window||'webkitSpeechRecognition' in window));
  const recRef = useRef(null);
  const iniciar = useCallback(()=>{
    if(!suportado)return;
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang='pt-BR'; rec.continuous=true; rec.interimResults=false;
    rec.onresult = e=>{ const t=Array.from(e.results).map(r=>r[0].transcript).join(' '); onTranscricao(t); };
    rec.onend = ()=>setStatus(s=>s==='ouvindo'?'concluido':s);
    rec.onerror = ()=>setStatus('inativo');
    recRef.current=rec; rec.start(); setStatus('ouvindo');
  },[suportado,onTranscricao]);
  if(!suportado)return <p style={{ fontSize:13, color:'#6B7280', fontStyle:'italic' }}>🎤 Dispositivo não suporta voz. Digite normalmente.</p>;
  return (
    <div style={{ marginTop:10, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
      {status==='inativo'&&<button type="button" onClick={iniciar} style={{ padding:'10px 20px', background:N, color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>🎤 Falar em vez de digitar</button>}
      {status==='ouvindo'&&<>
        <span style={{ color:'#DC2626', fontWeight:700, fontSize:14 }}>🔴 Ouvindo...</span>
        <button type="button" onClick={()=>{recRef.current?.stop();setStatus('pausado');}} style={{ padding:'8px 16px', background:'#F59E0B', color:'white', border:'none', borderRadius:8, fontSize:14, cursor:'pointer' }}>⏸ Pausar</button>
        <button type="button" onClick={()=>{recRef.current?.stop();setStatus('concluido');}} style={{ padding:'8px 16px', background:'#6B7280', color:'white', border:'none', borderRadius:8, fontSize:14, cursor:'pointer' }}>⏹ Parar</button>
      </>}
      {status==='pausado'&&<>
        <span style={{ color:'#92400E', fontWeight:700, fontSize:14 }}>⏸ Pausado</span>
        <button type="button" onClick={()=>{recRef.current?.start();setStatus('ouvindo');}} style={{ padding:'8px 16px', background:T, color:'white', border:'none', borderRadius:8, fontSize:14, cursor:'pointer' }}>▶️ Retomar</button>
        <button type="button" onClick={()=>{recRef.current?.stop();setStatus('concluido');}} style={{ padding:'8px 16px', background:'#6B7280', color:'white', border:'none', borderRadius:8, fontSize:14, cursor:'pointer' }}>⏹ Encerrar</button>
      </>}
      {status==='concluido'&&<>
        <span style={{ color:'#065F46', fontWeight:700, fontSize:14 }}>✅ Concluído</span>
        <button type="button" onClick={()=>setStatus('inativo')} style={{ padding:'8px 16px', background:N, color:'white', border:'none', borderRadius:8, fontSize:14, cursor:'pointer' }}>🎤 Gravar novamente</button>
      </>}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PacientePrimeiraConsulta({ onEnviar, onVoltar }) {
  const [etapa, setEtapa] = useState(1);
  const [dados, setDados] = useState(()=>{
    try { const s=localStorage.getItem(CHAVE_RASCUNHO); if(s)return JSON.parse(s); } catch{}
    return estadoInicial();
  });
  const [erros, setErros] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [naoSeiCampos, setNaoSeiCampos] = useState(new Set());

  useEffect(()=>{
    try { localStorage.setItem(CHAVE_RASCUNHO,JSON.stringify({...dados,atualizadoEm:new Date().toISOString()})); } catch{}
  },[dados]);

  const set = useCallback((campo,valor)=>{
    setDados(d=>({...d,[campo]:valor,atualizadoEm:new Date().toISOString()}));
    setErros(e=>{const c={...e};delete c[campo];return c;});
  },[]);

  const setClinico = useCallback((campo,valor)=>{
    setDados(d=>({...d,respostasClinicas:{...d.respostasClinicas,[campo]:valor}}));
  },[]);

  const toggleNaoSei = campo=>setNaoSeiCampos(s=>{const n=new Set(s);n.has(campo)?n.delete(campo):n.add(campo);return n;});

  const idade = calcularIdade(dados.dataNascimento);

  const validarEtapa = e=>{
    const errs={};
    if(e===1){
      if(!dados.nomeCompleto.trim())errs.nomeCompleto='Nome completo é necessário.';
      if(!dados.dataNascimento)errs.dataNascimento='Data de nascimento é necessária.';
      if(!dados.sexo)errs.sexo='Informe o sexo.';
      if(!dados.nomeMae.trim()&&!naoSeiCampos.has('nomeMae'))errs.nomeMae='Nome da mãe obrigatório, ou marque "Não sei informar".';
      if(dados.cpf&&!validarCPF(dados.cpf))errs.cpf='CPF inválido.';
      if(dados.cns&&!validarCNS(dados.cns))errs.cns='CNS inválido. Deve ter 15 números.';
    }
    if(e===2){
      if(!dados.telefonePrincipal)errs.telefonePrincipal='Telefone é necessário.';
      else if(!validarTelefone(dados.telefonePrincipal))errs.telefonePrincipal='Telefone inválido.';
    }
    if(e===3){
      if(!dados.cidade.trim())errs.cidade='Cidade é necessária.';
      if(!dados.estado)errs.estado='Estado é necessário.';
    }
    setErros(errs);
    return Object.keys(errs).length===0;
  };

  const avancar = ()=>{ if(validarEtapa(etapa))setEtapa(e=>Math.min(e+1,ETAPAS.length)); };
  const voltar  = ()=>setEtapa(e=>Math.max(e-1,1));

  const enviar = ()=>{
    if(!dados.consentimentoLGPD){ setErros({consentimentoLGPD:'Necessário autorizar o uso dos dados.'}); return; }
    const payload={
      origem:'paciente', tipo:'primeira_consulta', status:'aguardando_revisao_recepcao',
      dadosDemograficos:{ nomeCompleto:dados.nomeCompleto, dataNascimento:dados.dataNascimento,
        sexo:dados.sexo, nomeMae:dados.nomeMae, cpf:dados.cpf, cns:dados.cns,
        telefonePrincipal:dados.telefonePrincipal, whatsapp:dados.whatsapp,
        cidade:dados.cidade, estado:dados.estado, cep:dados.cep,
        municipioOrigem:dados.municipioOrigem, quemEncaminhou:dados.quemEncaminhou,
        convenio:dados.convenio, possuiAcompanhante:dados.possuiAcompanhante,
        nomeAcompanhante:dados.nomeAcompanhante, consentimentoLGPD:true,
        dataConsentimento:new Date().toISOString(),
      },
      queixaPrincipal:dados.queixaPrincipal,
      respostasClinicasLeigas:dados.respostasClinicas,
      criadoEm:dados.criadoEm, atualizadoEm:new Date().toISOString(),
    };
    console.info('[APACApp] Payload primeira consulta:', payload);
    localStorage.removeItem(CHAVE_RASCUNHO);
    if(onEnviar) onEnviar(payload);
    setEnviado(true);
  };

  // ── Tela de sucesso ──────────────────────────────────────────────────────────
  if(enviado){
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F0F9FF', padding:24 }}>
        <div style={{ background:'white', borderRadius:16, padding:40, maxWidth:440, textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,.10)' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
          <h2 style={{ color:N, fontSize:24, marginBottom:12 }}>Dados enviados com sucesso!</h2>
          <p style={{ color:'#374151', fontSize:16, lineHeight:1.6 }}>Suas informações foram enviadas para a recepção do Hospital do Bem. Em breve você será chamado para conferência.</p>
          <p style={{ color:'#6B7280', fontSize:14, marginTop:16 }}>🏥 Hospital do Bem — Unidade Oncológica — Patos/PB</p>
          {onVoltar&&<button onClick={onVoltar} style={{ marginTop:20, padding:'12px 24px', background:N, color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>← Voltar ao sistema</button>}
        </div>
      </div>
    );
  }

  const card  = { background:'white', borderRadius:16, padding:24, maxWidth:600, margin:'0 auto', boxShadow:'0 2px 12px rgba(0,0,0,.07)' };
  const btnOk = { width:'100%', padding:16, background:N, color:'white', border:'none', borderRadius:10, fontSize:17, fontWeight:700, cursor:'pointer', marginTop:8 };
  const btnBk = { width:'100%', padding:14, background:'transparent', color:'#6B7280', border:'2px solid #E5E7EB', borderRadius:10, fontSize:15, cursor:'pointer', marginTop:8 };

  return (
    <div style={{ minHeight:'100vh', background:'#F0F9FF', fontFamily:"'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background:N, padding:'16px 20px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'#93C5FD', fontSize:12, margin:0 }}>Hospital do Bem — Unidade Oncológica</p>
            <h1 style={{ color:'white', fontSize:18, fontWeight:700, margin:'4px 0 0' }}>Primeira Consulta</h1>
          </div>
          {onVoltar&&<button onClick={onVoltar} style={{ background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'white', padding:'8px 16px', borderRadius:8, fontSize:13, cursor:'pointer', fontWeight:600 }}>← Voltar</button>}
        </div>
      </div>

      {/* Barra de progresso */}
      <div style={{ background:'#E2E8F0', padding:'0 0 0' }}>
        <div style={{ maxWidth:600, margin:'0 auto', padding:'12px 20px' }}>
          <div style={{ display:'flex', gap:4, marginBottom:8 }}>
            {ETAPAS.map(e=>(
              <div key={e.id} style={{ flex:1, height:4, borderRadius:2, background:e.id<=etapa?T:'#CBD5E1', transition:'background 0.3s' }} />
            ))}
          </div>
          <p style={{ fontSize:13, color:'#475569', margin:0 }}>
            {ETAPAS[etapa-1]?.icone} Etapa {etapa} de {ETAPAS.length}: <strong>{ETAPAS[etapa-1]?.label}</strong>
          </p>
        </div>
      </div>

      <div style={{ padding:'20px 16px 40px', maxWidth:600, margin:'0 auto' }}>

        {/* ETAPA 1 — IDENTIFICAÇÃO */}
        {etapa===1&&(
          <div style={card}>
            <h2 style={{ color:N, fontSize:20, marginTop:0 }}>👤 Identificação</h2>
            <p style={{ color:'#6B7280', fontSize:14, marginTop:-8, marginBottom:20 }}>Preencha com seus dados pessoais. Se não souber alguma informação, marque "Não sei informar".</p>

            <Campo label="Nome completo" obrigatorio erro={erros.nomeCompleto}>
              <Inp value={dados.nomeCompleto} onChange={e=>set('nomeCompleto',e.target.value)} placeholder="Como aparece nos seus documentos" />
            </Campo>
            <Campo label="Nome social" dica="Preencha se preferir ser chamado por outro nome.">
              <Inp value={dados.nomeSocial} onChange={e=>set('nomeSocial',e.target.value)} placeholder="Opcional" />
            </Campo>
            <Campo label="Data de nascimento" obrigatorio erro={erros.dataNascimento}>
              <Inp type="date" value={dados.dataNascimento} onChange={e=>set('dataNascimento',e.target.value)} max={new Date().toISOString().split('T')[0]} />
              {idade!==null&&<p style={{ fontSize:14, color:T, marginTop:4 }}>Idade calculada: <strong>{idade} anos</strong></p>}
            </Campo>
            <Campo label="Sexo" obrigatorio erro={erros.sexo}>
              <div style={{ display:'flex', gap:12 }}>
                {[{v:'F',l:'♀ Feminino'},{v:'M',l:'♂ Masculino'}].map(op=>(
                  <button key={op.v} type="button" onClick={()=>set('sexo',op.v)} style={{
                    flex:1, padding:'12px 0', fontSize:15, fontWeight:700, borderRadius:8, cursor:'pointer', border:'2px solid',
                    borderColor:dados.sexo===op.v?T:'#D1D5DB', background:dados.sexo===op.v?T:'white', color:dados.sexo===op.v?'white':'#374151',
                  }}>{op.l}</button>
                ))}
              </div>
            </Campo>
            <Campo label="Nome completo da mãe ou responsável" obrigatorio erro={erros.nomeMae}>
              <Inp value={naoSeiCampos.has('nomeMae')?'':dados.nomeMae} onChange={e=>set('nomeMae',e.target.value)} placeholder="Nome da sua mãe ou responsável" disabled={naoSeiCampos.has('nomeMae')} />
              <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, cursor:'pointer', fontSize:14, color:'#6B7280' }}>
                <input type="checkbox" checked={naoSeiCampos.has('nomeMae')} onChange={()=>toggleNaoSei('nomeMae')} />Não sei informar
              </label>
            </Campo>
            <Campo label="CPF" dica="Se não tiver CPF, deixe em branco." erro={erros.cpf}>
              <Inp value={dados.cpf} onChange={e=>set('cpf',formatarCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
            </Campo>
            <Campo label="Cartão SUS (CNS)" dica="São 15 números no verso do Cartão SUS." erro={erros.cns}>
              <Inp value={dados.cns} onChange={e=>set('cns',e.target.value.replace(/\D/g,'').slice(0,15))} placeholder="000 0000 0000 0000" maxLength={15} />
            </Campo>
            <Campo label="RG" dica="Opcional.">
              <Inp value={dados.rg||''} onChange={e=>set('rg',e.target.value)} placeholder="Número do RG" />
            </Campo>
            <button style={btnOk} onClick={avancar}>Continuar →</button>
          </div>
        )}

        {/* ETAPA 2 — CONTATO */}
        {etapa===2&&(
          <div style={card}>
            <h2 style={{ color:N, fontSize:20, marginTop:0 }}>📞 Contatos telefônicos</h2>
            <Campo label="Telefone principal" obrigatorio erro={erros.telefonePrincipal}>
              <Inp type="tel" value={dados.telefonePrincipal} onChange={e=>set('telefonePrincipal',formatarTelefone(e.target.value))} placeholder="(83) 99999-9999" />
            </Campo>
            <Campo label="WhatsApp" dica="Se diferente do telefone principal.">
              <Inp type="tel" value={dados.whatsapp||''} onChange={e=>set('whatsapp',formatarTelefone(e.target.value))} placeholder="(83) 99999-9999" />
            </Campo>
            <Campo label="Telefone para recado">
              <Inp type="tel" value={dados.telefoneRecado||''} onChange={e=>set('telefoneRecado',formatarTelefone(e.target.value))} placeholder="(83) 99999-9999" />
            </Campo>
            <Campo label="Nome do contato de recado">
              <Inp value={dados.nomeContatoRecado||''} onChange={e=>set('nomeContatoRecado',e.target.value)} placeholder="Nome de quem atende o telefone de recado" />
            </Campo>
            <Campo label="Parentesco do contato">
              <Inp value={dados.parentescoContato||''} onChange={e=>set('parentescoContato',e.target.value)} placeholder="Ex: filha, esposo, irmã" />
            </Campo>
            <div style={{ display:'flex', gap:12, marginTop:16 }}>
              <button style={btnBk} onClick={voltar}>← Voltar</button>
              <button style={btnOk} onClick={avancar}>Continuar →</button>
            </div>
          </div>
        )}

        {/* ETAPA 3 — ENDEREÇO */}
        {etapa===3&&(
          <div style={card}>
            <h2 style={{ color:N, fontSize:20, marginTop:0 }}>📍 Endereço</h2>
            <Campo label="CEP" dica="Se não souber, preencha só a cidade.">
              <Inp value={dados.cep} onChange={e=>set('cep',formatarCEP(e.target.value))} placeholder="00000-000" maxLength={9} />
            </Campo>
            <Campo label="Rua / logradouro">
              <Inp value={dados.logradouro} onChange={e=>set('logradouro',e.target.value)} placeholder="Nome da rua" />
            </Campo>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}><Campo label="Número"><Inp value={dados.numero} onChange={e=>set('numero',e.target.value)} placeholder="Nº" /></Campo></div>
              <div style={{ flex:2 }}><Campo label="Complemento"><Inp value={dados.complemento||''} onChange={e=>set('complemento',e.target.value)} placeholder="Apto, casa..." /></Campo></div>
            </div>
            <Campo label="Bairro"><Inp value={dados.bairro} onChange={e=>set('bairro',e.target.value)} placeholder="Nome do bairro" /></Campo>
            <Campo label="Cidade" obrigatorio erro={erros.cidade}><Inp value={dados.cidade} onChange={e=>set('cidade',e.target.value)} placeholder="Sua cidade" /></Campo>
            <Campo label="Estado" obrigatorio erro={erros.estado}>
              <select value={dados.estado} onChange={e=>set('estado',e.target.value)} style={{ width:'100%', padding:'12px 14px', fontSize:16, border:'2px solid #D1D5DB', borderRadius:8, background:'white', boxSizing:'border-box' }}>
                {ESTADOS_BR.map(uf=><option key={uf} value={uf}>{uf}</option>)}
              </select>
            </Campo>
            <Campo label="Ponto de referência" dica="Ajuda a encontrar sua casa se necessário.">
              <Inp value={dados.pontoReferencia||''} onChange={e=>set('pontoReferencia',e.target.value)} placeholder="Ex: perto do mercado tal, em frente à praça" />
            </Campo>
            <div style={{ display:'flex', gap:12, marginTop:16 }}>
              <button style={btnBk} onClick={voltar}>← Voltar</button>
              <button style={btnOk} onClick={avancar}>Continuar →</button>
            </div>
          </div>
        )}

        {/* ETAPA 4 — ACOMPANHANTE */}
        {etapa===4&&(
          <div style={card}>
            <h2 style={{ color:N, fontSize:20, marginTop:0 }}>🤝 Acompanhante</h2>
            <Campo label="Você vai com acompanhante?">
              <SimNao valor={dados.possuiAcompanhante} onChange={v=>set('possuiAcompanhante',v)} />
            </Campo>
            {dados.possuiAcompanhante&&<>
              <Campo label="Nome do acompanhante"><Inp value={dados.nomeAcompanhante||''} onChange={e=>set('nomeAcompanhante',e.target.value)} placeholder="Nome completo" /></Campo>
              <Campo label="Telefone do acompanhante"><Inp type="tel" value={dados.telefoneAcompanhante||''} onChange={e=>set('telefoneAcompanhante',formatarTelefone(e.target.value))} placeholder="(83) 99999-9999" /></Campo>
              <Campo label="Parentesco"><Inp value={dados.parentescoAcompanhante||''} onChange={e=>set('parentescoAcompanhante',e.target.value)} placeholder="Ex: filha, esposo, amigo" /></Campo>
            </>}
            <Campo label="Quem encaminhou você para a consulta?" dica="Se veio por médico, UBS ou hospital.">
              <Inp value={dados.quemEncaminhou||''} onChange={e=>set('quemEncaminhou',e.target.value)} placeholder="Ex: Dr. João da UBS Centro" />
            </Campo>
            <div style={{ display:'flex', gap:12, marginTop:16 }}>
              <button style={btnBk} onClick={voltar}>← Voltar</button>
              <button style={btnOk} onClick={avancar}>Continuar →</button>
            </div>
          </div>
        )}

        {/* ETAPA 5 — O QUE SENTE */}
        {etapa===5&&(
          <div style={card}>
            <h2 style={{ color:N, fontSize:20, marginTop:0 }}>💬 O que você está sentindo</h2>
            <p style={{ color:'#6B7280', fontSize:14, marginBottom:20 }}>Escreva com suas próprias palavras. Não precisa usar termos médicos.</p>
            <Campo label="Diga o que você está sentindo agora" dica="Descreva seus sintomas, quando começaram e o que motivou a consulta.">
              <textarea value={dados.queixaPrincipal} onChange={e=>set('queixaPrincipal',e.target.value)}
                placeholder="Ex: Tem uns 3 meses que sinto um caroço no seio direito e às vezes dói..." rows={5}
                style={{ width:'100%', padding:'12px 14px', fontSize:16, border:'2px solid #D1D5DB', borderRadius:8, outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.5 }}
                onFocus={e=>e.target.style.borderColor=T} onBlur={e=>e.target.style.borderColor='#D1D5DB'}
              />
              <Microfone onTranscricao={t=>set('queixaPrincipal',dados.queixaPrincipal?dados.queixaPrincipal+' '+t:t)} />
            </Campo>
            <Campo label="Você já sabe o que trouxe você para a oncologia?" dica="Se tiver diagnóstico, mencione.">
              <Inp value={dados.respostasClinicas.sabeDiagnostico||''} onChange={e=>setClinico('sabeDiagnostico',e.target.value)} placeholder="Ex: O médico falou que pode ser um tumor no intestino" />
            </Campo>
            <div style={{ display:'flex', gap:12, marginTop:24 }}>
              <button style={btnBk} onClick={voltar}>← Voltar</button>
              <button style={btnOk} onClick={avancar}>Continuar →</button>
            </div>
          </div>
        )}

        {/* ETAPA 6 — SAÚDE GERAL */}
        {etapa===6&&(
          <div style={card}>
            <h2 style={{ color:N, fontSize:20, marginTop:0 }}>🏥 Saúde geral</h2>
            <p style={{ color:'#6B7280', fontSize:14, marginBottom:20 }}>Responda sobre como você está se sentindo agora e seu histórico de saúde.</p>
            {[
              { campo:'temDor', pergunta:'Você sente dor?', extra:<div style={{ marginTop:10 }}><Inp value={dados.respostasClinicas.localDor||''} onChange={e=>setClinico('localDor',e.target.value)} placeholder="Onde você sente dor?" /></div> },
              { campo:'perdeuPeso', pergunta:'Você perdeu peso sem querer?' },
              { campo:'comendoMenos', pergunta:'Está comendo menos que o normal?' },
              { campo:'temFebre', pergunta:'Tem tido febre?' },
              { campo:'temSangramento', pergunta:'Tem tido sangramentos?' },
              { campo:'temFaltaAr', pergunta:'Está com falta de ar?' },
              { campo:'temTosse', pergunta:'Tem tosse que não passa?' },
              { campo:'temVomitos', pergunta:'Está com vômitos?' },
              { campo:'temDiarreia', pergunta:'Está com diarreia?' },
              { campo:'temFeridasCarocosInchacos', pergunta:'Tem feridas, caroços ou inchaços?' },
            ].map(({campo,pergunta,extra})=>(
              <PerguntaSimNao key={campo} campo={campo} pergunta={pergunta} dados={dados.respostasClinicas} onChange={setClinico} extra={extra} />
            ))}
            <h3 style={{ color:N, fontSize:16, marginTop:24, marginBottom:12 }}>Doenças que você já tem:</h3>
            {[
              { campo:'temHAS', pergunta:'Tem pressão alta?' },
              { campo:'temDM', pergunta:'Tem diabetes?' },
              { campo:'temDoencaCoracao', pergunta:'Tem doença do coração?' },
              { campo:'temDoencaRins', pergunta:'Tem doença dos rins?' },
              { campo:'temDoencaFigado', pergunta:'Tem doença do fígado?' },
              { campo:'teveAVC', pergunta:'Já teve AVC (derrame)?' },
              { campo:'teveInfarto', pergunta:'Já teve infarto?' },
              { campo:'teveTrombose', pergunta:'Já teve trombose?' },
            ].map(({campo,pergunta})=>(
              <PerguntaSimNao key={campo} campo={campo} pergunta={pergunta} dados={dados.respostasClinicas} onChange={setClinico} />
            ))}
            <PerguntaSimNao campo="jaFezCirurgia" pergunta="Já fez alguma cirurgia?" dados={dados.respostasClinicas} onChange={setClinico} extra={
              <div style={{ marginTop:10 }}><Inp value={dados.respostasClinicas.descricaoCirurgia||''} onChange={e=>setClinico('descricaoCirurgia',e.target.value)} placeholder="Qual cirurgia? Quando?" /></div>
            } />
            <PerguntaSimNao campo="usaRememediosDiarios" pergunta="Usa remédios todos os dias?" dados={dados.respostasClinicas} onChange={setClinico} extra={
              <div style={{ marginTop:10 }}><textarea value={dados.respostasClinicas.remediosDiarios||''} onChange={e=>setClinico('remediosDiarios',e.target.value)} placeholder="Liste os remédios que usa" rows={3} style={{ width:'100%', padding:'10px', fontSize:15, border:'2px solid #D1D5DB', borderRadius:8, boxSizing:'border-box', fontFamily:'inherit' }} /></div>
            } />
            <PerguntaSimNao campo="temAlergia" pergunta="Tem alergia a algum remédio?" dados={dados.respostasClinicas} onChange={setClinico} extra={
              <div style={{ marginTop:10 }}><Inp value={dados.respostasClinicas.alergias||''} onChange={e=>setClinico('alergias',e.target.value)} placeholder="A que você tem alergia?" /></div>
            } />
            <PerguntaSimNao campo="fuma" pergunta="Fuma ou já fumou?" dados={dados.respostasClinicas} onChange={setClinico} />
            <PerguntaSimNao campo="bebeAlcool" pergunta="Bebe bebida alcoólica?" dados={dados.respostasClinicas} onChange={setClinico} />
            <PerguntaSimNao campo="familiarComCancer" pergunta="Alguém da sua família já teve câncer?" dados={dados.respostasClinicas} onChange={setClinico} extra={
              <div style={{ marginTop:10 }}><Inp value={dados.respostasClinicas.descricaoFamiliar||''} onChange={e=>setClinico('descricaoFamiliar',e.target.value)} placeholder="Quem? Que tipo de câncer?" /></div>
            } />
            <div style={{ display:'flex', gap:12, marginTop:24 }}>
              <button style={btnBk} onClick={voltar}>← Voltar</button>
              <button style={btnOk} onClick={avancar}>Revisar →</button>
            </div>
          </div>
        )}

        {/* ETAPA 7 — REVISÃO */}
        {etapa===7&&(
          <div style={card}>
            <h2 style={{ color:N, fontSize:20, marginTop:0 }}>✅ Revisão final</h2>
            {[
              { titulo:'👤 Identificação', itens:[
                ['Nome', dados.nomeCompleto],
                ['Nascimento', dados.dataNascimento+(idade?` (${idade} anos)`:'')],
                ['Sexo', dados.sexo==='F'?'Feminino':dados.sexo==='M'?'Masculino':'-'],
                ['CPF', dados.cpf||'Não informado'],['CNS', dados.cns||'Não informado'],
              ]},
              { titulo:'📞 Contatos telefônicos', itens:[['Telefone',dados.telefonePrincipal||'Não informado'],['WhatsApp',dados.whatsapp||'Não informado']]},
              { titulo:'📍 Endereço', itens:[['Cidade/UF',dados.cidade?`${dados.cidade} / ${dados.estado}`:'Não informado'],['CEP',dados.cep||'Não informado']]},
              { titulo:'💬 Queixa principal', itens:[['',dados.queixaPrincipal||'Não informado']]},
            ].map(({titulo,itens})=>(
              <div key={titulo} style={{ background:'#F8FAFC', borderRadius:10, padding:16, marginBottom:12, border:'1px solid #E2E8F0' }}>
                <p style={{ fontWeight:700, color:N, margin:'0 0 8px', fontSize:14 }}>{titulo}</p>
                {itens.map(([label,valor],i)=>(
                  <div key={i} style={{ display:'flex', gap:8, fontSize:14, marginBottom:4 }}>
                    {label&&<span style={{ color:'#6B7280', minWidth:80 }}>{label}:</span>}
                    <span style={{ color:'#111827', fontWeight:500 }}>{valor||'—'}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:16, marginBottom:16 }}>
              <p style={{ fontSize:14, color:'#92400E', margin:'0 0 12px', fontWeight:600 }}>📋 Autorização de uso dos dados</p>
              <p style={{ fontSize:13, color:'#78350F', margin:'0 0 12px', lineHeight:1.6 }}>Autorizo o uso das informações preenchidas para organização do meu atendimento, cadastro hospitalar e preparação dos documentos necessários ao tratamento.</p>
              <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', fontSize:14, color:N, fontWeight:600 }}>
                <input type="checkbox" checked={dados.consentimentoLGPD} onChange={e=>set('consentimentoLGPD',e.target.checked)} style={{ marginTop:2, width:18, height:18, accentColor:T }} />
                Sim, autorizo o uso dos meus dados para atendimento no Hospital do Bem.
              </label>
              {erros.consentimentoLGPD&&<p style={{ color:'#DC2626', fontSize:13, marginTop:8 }}>⚠️ {erros.consentimentoLGPD}</p>}
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button style={btnBk} onClick={voltar}>← Corrigir</button>
              <button onClick={enviar} disabled={!dados.consentimentoLGPD}
                style={{ ...btnOk, background:dados.consentimentoLGPD?'#065F46':'#9CA3AF', cursor:dados.consentimentoLGPD?'pointer':'not-allowed' }}>
                📤 Enviar para a recepção
              </button>
            </div>
            <button type="button" style={{ width:'100%', marginTop:12, padding:12, background:'transparent', color:'#6B7280', border:'none', fontSize:14, cursor:'pointer', textDecoration:'underline' }}
              onClick={()=>alert('Rascunho salvo!')}>
              💾 Salvar rascunho e continuar depois
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
