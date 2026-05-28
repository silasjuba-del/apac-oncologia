# BRIEFING GERAL — APACApp · Oncologia Integrada
> Cole este documento no início de qualquer sessão antes de pedir modificações no app.
> Para trabalhar especificamente na aba Prescrição, use também: BRIEFING_PRESCRICAO.md
> Raw: https://raw.githubusercontent.com/silasjuba-del/apac-oncologia/main/BRIEFING_APP.md

---

## 1 · O QUE É O APP

**APACApp** é um sistema de oncologia clínica usado exclusivamente pelo Dr. Silas Negrão Serra Jr. no Hospital do Bem — Unidade Oncológica e no Complexo Hospitalar Regional Dep. Janduhy Carneiro (Patos/PB).

**Função principal:** fluxo completo do paciente oncológico — recepção → triagem → prontuário → prescrição QT → APAC → farmácia → enfermagem, com suporte de IA integrado.

**Usuário único no momento:** o próprio médico. App em desenvolvimento ativo — funcionalidade e segurança têm prioridade sobre estética.

---

## 2 · STACK TÉCNICA

| Item | Detalhe |
|---|---|
| Framework | React 18.2 — apenas hooks, sem classes |
| Build | Vite 5.0 |
| Deploy | `npm run deploy` → gh-pages → GitHub Pages |
| Banco | Supabase (`@supabase/supabase-js ^2.106.0`) — tabelas: `pacientes`, `configuracoes` |
| Estilo | CSS-in-JS inline `style={{}}` — **sem Tailwind, sem CSS Modules, sem libs UI** |
| Estado | `useState`/`useCallback`/`useMemo`/`useEffect` — **sem Redux, sem Zustand** |
| Módulos | ES Modules — `import`/`export` — sem CommonJS |
| Testes | Vitest — 402 testes, 0 falhas |
| CI | GitHub Actions — lint + build + testes em cada push |
| SO dev | Windows 11 — caminhos com `\` |
| Live URL | https://silasjuba-del.github.io/apac-oncologia/ |
| Repo | https://github.com/silasjuba-del/apac-oncologia |

**Regras obrigatórias de código:**
- Sem TypeScript — JS puro `.jsx` / `.js`
- Sem libs de UI externas
- `import { useState } from 'react'` — nunca `import React from 'react'` (exceto `App.jsx` que usa `React.lazy`)
- Emojis nos labels são padrão — manter
- Sem `console.log` — usar `console.warn`/`console.error` com prefixo `[Componente]`

---

## 3 · ESTRUTURA DE ARQUIVOS

```
src/
├── App.jsx                     ← 1.842 linhas — orquestrador central — NÃO criar subcomponentes aqui
├── main.jsx                    ← entry point
├── lib/
│   └── supabase.js             ← cliente Supabase
├── components/
│   ├── AppShell.jsx            ← layout, TopBar, SubTabs, TABS_PERFIL, ETAPAS_FLUXO
│   ├── ui/primitives.jsx       ← NOW(), TODAY(), Btn, Card, H2, Tbl, etc.
│   ├── SeletorAPAC.jsx         ← SIGTAP catalogo
│   └── shared/                 ← AgendamentoComp, ListaEsperaPrioridade, etc.
├── data/
│   └── protocolos_qt_catalogo_v0.3_curado_preliminar.json
├── features/
│   ├── medico/                 ← DashboardMedico, FilaDiaMedico, StepperMedico, etc.
│   ├── prescricao/
│   │   ├── PrescricaoQT.jsx    ← módulo v1 legado
│   │   └── v2/                 ← módulo v2 ativo (ver BRIEFING_PRESCRICAO.md)
│   ├── enfermagem/             ← SalaoMedico, EnfermagemPage
│   ├── farmacia/               ← FarmaciaPage
│   ├── recepcao/               ← RecepcaoPage, ReceitasComp
│   ├── paciente/               ← InboxPaciente
│   ├── comunicacao/            ← ComunicacaoPage
│   ├── faturamento/            ← AntiGlosaComp
│   ├── carteirinha/            ← CarteirinhaTab
│   ├── assistencia-social/     ← AssistenciaSocialPage
│   ├── agentes/                ← pipeline de IA
│   └── rotas/                  ← AppRoutes
└── utils/
    ├── constants.js            ← EQUIPE, PAC0, cores, HOSP, PROTOS, PERIODOS
    ├── dossie.js               ← criarDossieInicial, gerarTextoEvolucao, validarAPAC
    ├── security.js             ← executarProntuarioSecurity, loadDossiePaciente
    ├── parse.js                ← extrairCamposIA, extrairSecaoIA, extrairEvolucaoIA
    ├── db.js                   ← dbSalvarPaciente, dbBuscarPacientes
    ├── storage.js              ← savePacAtual, loadPacAtual, saveDossiePaciente
    ├── encounterMachine.js     ← openEncounter, closeEncounter, createEncounter
    ├── api.js                  ← chamarClaude, createBoundClaude, AGENT_INTENTS
    ├── validators.js           ← validações de formulário
    └── stepperConfig.js        ← configuração do stepper adaptativo
```

---

## 4 · ROLES E ABAS POR PERFIL

O app muda de interface conforme o `funcLogado.tipo`:

### Médico (`tipo: "medico"`)
| Tab ID | Label | Componente |
|---|---|---|
| `quimio` / `prescricao` | Prescrição | subtabs (ver §6) |
| `dashboard` | Dashboard | DashboardMedico |
| `fila` | Atendimentos | FilaDiaMedico |
| `pacientes` | Pacientes | GerenciarPacientes |
| `prontuario` | Prontuário | StepperMedico (subtabs) |
| `ia_agent` | Assistente IA | AssistenteIA |
| `apac` | APAC | APACSystem + ferramentas |
| `triagem_recebe` | Triagem (recebe) | TriagemMedicoRecebe |
| `discussao_clinica` | Discussão IA | DiscussaoClinicaIA |
| `upload_modulo` | Upload IA | UploadModuloComp |
| `trials` | Clinical Trials | TrialsCompMelhorado |
| `stats` | Estatísticas | EstatisticasComp |
| `admin` | Admin | painel admin |

### Recepção (`tipo: "recepcao"`)
`buscar` · `conferencia` · `documentos` · `fila`

### Enfermagem (`tipo: "enfermagem"`)
`salao` · `triagem` · `sinais` · `toxicidade`

### Farmácia (`tipo: "farmacia"`)
`liberacoes` · `checagem` · `estoque`

### Assistência Social (`tipo: "assistencia"`)
`tfd` · `beneficios`

---

## 5 · FLUXO DO PACIENTE (ETAPAS_FLUXO)

```
pre_consulta → aguardando_recepcao → recepcao_conferencia → documentos_anexados
→ claude_processando → pronto_medico → em_consulta → evolucao_salva
→ apac_validacao → apac_pronta
```

O status do dossiê (`dossie.status`) segue este enum. A `PatientBar` no topo exibe o stepper visualmente.

---

## 6 · ABA PRESCRIÇÃO — SUBTABS ATUAIS

```
prescricaoTab2 (estado em App.jsx linha 355):
  "motor45"          → ProtocolosQTExplorer    (explorador v4.5)
  "prescricao_atual" → PrescricaoQT            (módulo v1 legado)
  "qt_v2"            → PrescricaoQTv2          (stepper 4 etapas + catálogo v0.3)
  "novo_protocolo"   → NovoProtocoloBuilder    (criador + busca web + drafts)
```

**Para adicionar nova subtab de prescrição:**
1. Criar componente em `src/features/prescricao/v2/`
2. Lazy import em App.jsx (perto da linha 56)
3. Adicionar `{id,ico,label}` no array do `SubTabsV4` (linha ~1618)
4. Adicionar bloco `{prescricaoTab2==="id"&&<React.Suspense>…</React.Suspense>}`

---

## 7 · EQUIPE (EQUIPE em constants.js)

```js
{ id:"silas",  nome:"Dr. Silas Negrão Serra Jr.", cargo:"Oncologista Clínico",
  reg:"CRM-PB 17341 · RQE 9099", tipo:"medico", ico:"👨‍⚕️" }   ← EQUIPE[0] — funcLogado padrão
{ id:"farm1",  nome:"Josenildo Santos",   cargo:"Farmacêutico",   reg:"CRF-PB 1234",   tipo:"farmacia" }
{ id:"enf1",   nome:"Ana Karla Lima",     cargo:"Enfermeira",     reg:"COREN-PB 5678", tipo:"enfermagem" }
{ id:"rec1",   nome:"Maria das Graças",   cargo:"Recepcionista",  reg:"",              tipo:"recepcao" }
{ id:"as1",    nome:"Carlos Roberto",     cargo:"Assistente Social",reg:"CRESS-PB 9012",tipo:"assistencia" }
```

Extração do CRM: `(funcLogado?.reg||'').match(/CRM[^·\n]*/i)?.[0]?.trim()` → `"CRM-PB 17341"`

---

## 8 · MODELO DO PACIENTE (objeto `pac`)

Baseado em `PAC0` (constants.js). Campos mais usados:

```js
pac.nome          // "João Silva"
pac.pacID         // ID único (genPacID())
pac.nasc          // "DD/MM/AAAA"
pac.sexo          // "Masculino" | "Feminino"
pac.cpf / pac.cns
pac.peso          // kg — string ou number (NÃO é pesoKg)
pac.altura        // cm — string ou number (NÃO é alturaCm)
pac.ecog          // "0"|"1"|"2"|"3"|"4"
pac.cid           // "C18.0"
pac.diag          // diagnóstico livre
pac.trat          // protocolo em uso
pac.linha         // "1a linha" | "adjuvante" | etc.
pac.intencao      // "curativa" | "paliativa" | "neoadjuvante"
pac.anatom        // laudo anatomopatológico
pac.imagen        // laudo de imagem
pac.obs_ia        // observações geradas por IA
pac.re/rp/her2/ki67/grau_hist/margens  // marcadores tumorais
pac.cod_proc      // código SIGTAP (padrão "0304010072")
```

**`up(campo, valor)`** — atualiza `pac` e persiste no Supabase + localStorage.

---

## 9 · DOSSIÊ ONCOLÓGICO

```js
// Estrutura básica do dossie:
{
  paciente:    { ...pac },          // snapshot do paciente
  status:      "pronto_medico",     // ETAPAS_FLUXO id
  documentos:  [ doc, ... ],        // array de documentos gerados
  evolucao:    { rascunho, assinada, dataAssinatura },
  apac:        { campos, validacoes, completude },
  updatedAt:   "ISO string",
}

// Documento padrão:
{
  id:       Date.now(),
  tipo:     "Evolução médica",      // string livre
  nome:     "Texto curto do doc",
  resumo:   "Texto multilinha",
  origem:   "slug_de_origem",
  criadoEm: NOW(),
}
```

**Salvar documento:** sempre via `setDossieGuardado` (não `setDossieOncologico` direto).
`setDossieGuardado` verifica se há atendimento aberto — é o portão de segurança clínica.

---

## 10 · PRIMITIVAS UI DISPONÍVEIS

```js
// import de './components/ui/primitives'
NOW()       // → ISO string com hora atual
TODAY()     // → "DD/MM/AAAA"
Btn         // botão padrão
Card        // card com bordas
H2, H3      // headings
Tbl         // tabela
Fld         // campo de formulário
G2          // grid 2 colunas
Cbox        // checkbox
TopBar, Footer   // layout
PrintModal       // modal de impressão
MicCaptura       // captura de voz
ChatAba          // aba de chat
copiarTexto(str) // copia para clipboard
```

---

## 11 · PALETA DE CORES

```js
// constants.js exporta:
N  = "#1B365D"  // Navy — primário, títulos, botão principal
T  = "#2B7A8C"  // Teal — secundário
G  = "#B8860B"  // Gold — destaques, atendimento
VE = "#15803D"  // Verde — sucesso, aprovado
AM = "#B45309"  // Âmbar — aviso, draft
VM = "#B91C1C"  // Vermelho — crítico, erro, bloqueado
BG = "#EEF2F7"  // Fundo geral

// Bordas e backgrounds de card (padrão v2):
border: "#E2E8F0"
cardBg: "#F8FAFC"
```

---

## 12 · INTEGRAÇÃO COM IA (api.js)

```js
// Intenções disponíveis:
AGENT_INTENTS = {
  RESUMO_LAUDO:         "resumo_laudo",
  EVOLUCAO:             "evolucao",
  APAC:                 "apac",
  DISCUSSAO_CLINICA:    "discussao_clinica",
  TRIAGEM:              "triagem",
}

// Criar chamada vinculada ao paciente:
const chamar = createBoundClaude(pac, AGENT_INTENTS.RESUMO_LAUDO)
await chamar({ texto: "..." })
```

---

## 13 · SEGURANÇA — REGRAS DO SISTEMA

1. **`setDossieGuardado`** sempre (não `setDossieOncologico`) para salvar dados clínicos
2. **`executarProntuarioSecurity`** validado antes de qualquer salvamento com texto de IA
3. **Nenhuma prescrição QT tem validade clínica** no app — `prescricaoPermitida: false` em todos protocolos
4. **CRM obrigatório** para confirmar prescrição (`crm.trim().length >= 5`)
5. **Dados sensíveis** nunca em URL params ou query strings
6. **`PrescricaoQTDevPage`** nunca importada em App.jsx — apenas para desenvolvimento standalone
7. **`if (import.meta.env.PROD)`** guarda em módulos de desenvolvimento
8. **109 warnings** de legacy são normais — não tratar como erro

---

## 14 · SUPABASE — TABELAS ATIVAS

| Tabela | Uso |
|---|---|
| `pacientes` | Dados completos do paciente (upsert por `pac_id`) |
| `configuracoes` | Configurações globais (chave/valor) |

Acesso via `src/utils/db.js`. Fallback local via `localStorage` quando offline.

---

## 15 · COMO ADICIONAR QUALQUER NOVO MÓDULO

```
1. Criar arquivo em src/features/<area>/<NomeComp>.jsx
2. Lazy import em App.jsx (bloco de imports lazy ~linha 40-60):
   const NomeComp = React.lazy(()=>import('./features/<area>/NomeComp'))
3. Adicionar case no switch ou bloco condicional adequado
4. npm run build  →  confirmar build limpo
5. git add + git commit -m "feat(<area>): descrição"
6. git push && npm run deploy
7. Testar em https://silasjuba-del.github.io/apac-oncologia/
```

**Template mínimo de componente:**
```jsx
import { useState } from 'react';
// Props padrão quando integrado via App.jsx:
// pac, up, funcLogado, dossie, setDossie, addMsg
export default function NomeComp({ pac, up, funcLogado, dossie, setDossie, addMsg }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      {/* conteúdo */}
    </div>
  );
}
```

---

## 16 · ESTADO ATUAL DO PROJETO (maio 2025)

### Módulos funcionais:
- ✅ Prontuário médico com stepper adaptativo
- ✅ Prescrição QT v1 (motor v4.5) + v2 (catálogo v0.3, 13 protocolos)
- ✅ APAC automática com validações e checklist
- ✅ Assistente IA integrado ao prontuário
- ✅ Dossiê oncológico com trilha de auditoria
- ✅ Dashboard + fila de atendimentos
- ✅ Upload de laudos com análise por IA
- ✅ Discussão clínica com IA
- ✅ Triagem QT com enfermagem
- ✅ Novo Protocolo Builder (formulário + busca web + drafts)

### Em desenvolvimento / próximos passos:
- 🔧 Catálogo QT v0.3 com revisão médica formal (0/13 aprovados)
- 🔧 Integração farmácia com prescrição v2
- 🔧 Enfermagem: monitoramento de ciclos em tempo real

### Débito técnico conhecido:
- 109 warnings legados em módulos antigos (não bloqueia build)
- App.jsx com 1.842 linhas — refatoração gradual planejada

---

## 17 · COMMITS RECENTES

```
d733901  docs: briefing técnico do módulo Prescrição
0844564  feat(prescricao): nova aba Novo Protocolo com formulário + busca web
f6c58af  feat(prescricao): integra PrescricaoQTv2 como subtab dev
a7de454  fix(prescricaoQTv2): correções Codex — renal/Calvert/catálogo
41d9ed1  fix(prescricaoQTv2): BUG-15/16 + CLINIC-01/04
11ebacf  fix(prescricaoQTv2): BUG-12..17 + adapter v0.3
8af1343  feat: módulo PrescricaoQTv2 standalone
7843559  feat(F2): stepper adaptativo por tipo de consulta
b1c0cda  feat(F1): lifecycle do encounter
53bb2df  feat(F0): contrato de identidade clínica
```

---

## 18 · LINKS RÁPIDOS

| Recurso | URL |
|---|---|
| App live | https://silasjuba-del.github.io/apac-oncologia/ |
| Repositório | https://github.com/silasjuba-del/apac-oncologia |
| Este briefing (raw) | https://raw.githubusercontent.com/silasjuba-del/apac-oncologia/main/BRIEFING_APP.md |
| Briefing Prescrição (raw) | https://raw.githubusercontent.com/silasjuba-del/apac-oncologia/main/BRIEFING_PRESCRICAO.md |
| Caminho local | `C:\Users\silas\OneDrive\Área de Trabalho\APACApp_dev\APACApp_ClaudeCode` |

---

*Gerado em 2025-05-27 · APACApp Oncologia Integrada · Dr. Silas Negrão Serra Jr. · CRM-PB 17341 · Patos/PB*
