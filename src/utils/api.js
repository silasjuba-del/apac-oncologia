// ─────────────────────────────────────────────────────────────────────────────
// api.js — Funções de comunicação com a API Claude / OpenAI / Gemini / Grok
// Extraído de App.jsx para importação direta em componentes
// ─────────────────────────────────────────────────────────────────────────────

export function _getApiKey(){
  // 1) chave global injetada via window
  if(window.__ANTHROPIC_KEY__) return window.__ANTHROPIC_KEY__;
  // 2) chave direta no localStorage (atalho)
  const direta=localStorage.getItem("anthropic_key");
  if(direta) return direta;
  // 3) chave salva no IA Hub (ia_keys.claude)
  try{const hub=JSON.parse(localStorage.getItem("ia_keys")||"{}");if(hub.claude)return hub.claude;}catch(_){}
  return "";
}

export function _apiUrl(){const u=import.meta.env.VITE_API_URL||"http://127.0.0.1:3001";return u==="/"?"":u.replace(/\/$/,"");}

/**
 * _backendHeaders — cabeçalhos padrão para chamadas ao backend clínico.
 * Inclui x-clinic-key (P0-Security) quando VITE_CLINIC_API_KEY estiver definida.
 * Define também em .env: VITE_CLINIC_API_KEY=<mesma que CLINIC_API_KEY no server/.env>
 */
export function _clinicKeyHeaders(extra={}){
  const h={...extra};
  const key=import.meta.env.VITE_CLINIC_API_KEY||window.__CLINIC_KEY__||"";
  if(key)h["x-clinic-key"]=key;
  return h;
}

export function _backendHeaders(extra={}){
  return _clinicKeyHeaders({"Content-Type":"application/json",...extra});
}

export async function chamarClaude(prompt,maxTokens=1200){
  let backendMsg="";
  try{
    const r=await fetch(_apiUrl()+"/api/claude/resumo",{method:"POST",headers:_backendHeaders(),body:JSON.stringify({prompt,maxTokens})});
    const d=await r.json().catch(()=>({}));
    if(r.ok&&d.ok)return d.text||"";
    backendMsg=d.message||("HTTP "+r.status);
  }catch(e){
    backendMsg="Backend indisponível: "+e.message;
  }

  const apiKey=_getApiKey();
  if(!apiKey){
    return "⚠ Chave Claude não configurada. Acesse: Menu → IA Hub → Extensores → campo 'Claude API Key' e cole sua chave da Anthropic (console.anthropic.com). (detalhe: "+backendMsg+")";
  }

  try{
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-5",max_tokens:maxTokens,messages:[{role:"user",content:prompt}]})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)return "Erro Claude: "+(d.error?.message||d.message||("HTTP "+r.status));
    return d.content?.[0]?.text||"";
  }catch(e){return "Erro de conexão Claude: "+e.message;}
}

export async function chamarGPT(prompt,apiKey,maxTokens=600){
  try{const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},body:JSON.stringify({model:"gpt-4o",messages:[{role:"user",content:prompt}],max_tokens:maxTokens})});const d=await r.json();return d.choices?.[0]?.message?.content||"Sem resposta";}
  catch(e){return "Erro GPT: "+e.message;}
}

export async function chamarGemini(prompt,apiKey,maxTokens=600){
  try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:maxTokens}})});const d=await r.json();return d.candidates?.[0]?.content?.parts?.[0]?.text||"Sem resposta";}
  catch(e){return "Erro Gemini: "+e.message;}
}

export async function chamarGrok(prompt,apiKey,maxTokens=600){
  try{const r=await fetch("https://api.x.ai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},body:JSON.stringify({model:"grok-3",messages:[{role:"user",content:prompt}],max_tokens:maxTokens})});const d=await r.json();return d.choices?.[0]?.message?.content||"Sem resposta";}
  catch(e){return "Erro Grok: "+e.message;}
}
