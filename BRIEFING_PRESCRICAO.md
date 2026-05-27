# BRIEFING — APACApp · Módulo Prescrição QT
> Envie este documento inteiro ao chat antes de pedir qualquer novo componente da aba Prescrição.

---

## 1 · STACK E AMBIENTE

| Item | Versão / Detalhe |
|---|---|
| Framework | React 18.2 — hooks, sem classes |
| Build | Vite 5.0 |
| Deploy | `npm run deploy` → gh-pages 6.3 → GitHub Pages |
| Estilo | CSS-in-JS via objetos `style={{}}` — **sem Tailwind, sem CSS Modules, sem styled-components** |
| Estado | `useState` / `useCallback` / `useMemo` / `useEffect` — **sem Redux, sem Zustand** |
| Módulos | ES Modules nativos — `import`/`export` — sem CommonJS |
| Testes | Vitest (não usar como prova de funcionamento — build + execução manual é evidência) |
| SO dev | Windows 11 — paths com `\`, separador de cmd com `&&` |
| Live URL | https://silasjuba-del.github.io/apac-oncologia/ |

**Regras de codificação obrigatórias:**
- Sem TypeScript — JS puro `.jsx` / `.js`
- Sem bibliotecas de UI externas (sem MUI, Ant Design, Chakra, etc.)
- Sem `import React from 'react'` — apenas named imports: `import { useState, useMemo } from 'react'`
- Exceto em `App.jsx` onde `React.lazy()` e `<React.Suspense>` são usados diretamente
- Emojis inline nos labels de UI são padrão do projeto — manter
- Sem `console.log` em produção — usar `console.warn`/`console.error` com prefixo `[NomeComponente]`

---

## 2 · ESTRUTURA DE ARQUIVOS — PRESCRIÇÃO

```
src/
├── App.jsx                          ← orquestrador central (NÃO criar novo arquivo aqui)
├── data/
│   └── protocolos_qt_catalogo_v0.3_curado_preliminar.json  ← catálogo ativo
├── utils/
│   ├── constants.js                 ← EQUIPE, PAC0, cores, HOSP
│   ├── dossie.js                    ← criarDossieInicial, gerarTextoEvolucao, validarAPAC
│   └── parse.js                     ← extrairCamposIA, extrairSecaoIA, etc.
└── features/
    └── prescricao/
        ├── PrescricaoQT.jsx         ← módulo v1 legado (não modificar)
        └── v2/
            ├── PrescricaoQTv2.jsx   ← orquestrador v2 (stepper 4 etapas)
            ├── PrescricaoQTDevPage.jsx  ← página de dev standalone
            ├── NovoProtocoloBuilder.jsx ← builder + busca web + drafts localStorage
            ├── index.jsx
            ├── components/
            │   ├── AlertaBloqueio.jsx
            │   ├── DrogaLinha.jsx
            │   └── ModalConfirmacao.jsx
            ├── lib/
            │   ├── calculadoraDose.js       ← biblioteca pura de cálculos
            │   ├── protocoloCatalogo.js     ← adapter + filtros do catálogo
            │   └── validacoesSeguranca.js   ← alertas clínicos por nível
            └── steps/
                ├── Step1Paciente.jsx
                ├── Step2Protocolo.jsx
                ├── Step3Calculos.jsx
                └── Step4Revisao.jsx
```

**Novos componentes da prescrição:** criar em `src/features/prescricao/v2/` ou `v2/components/`.
**Novos steps:** criar em `v2/steps/StepN<Nome>.jsx`.
**Novas libs puras:** criar em `v2/lib/<nome>.js` (sem React).

---

## 3 · INTEGRAÇÃO EM App.jsx — COMO ADICIONAR NOVA SUBTAB

### 3a. Lazy import (perto da linha 56)
```js
const MeuNovoComp = React.lazy(()=>import('./features/prescricao/v2/MeuNovoComp'));
```

### 3b. Adicionar ao SubTabsV4 (linha ~1618)
```jsx
<SubTabsV4
  tabs={[
    {id:"motor45",       ico:"🧮", label:"Motor v4.5"},
    {id:"prescricao_atual",ico:"💉",label:"Prescrição atual"},
    {id:"qt_v2",         ico:"🔬", label:"Prescrição v2 ⚠️"},
    {id:"novo_protocolo",ico:"➕", label:"Novo Protocolo"},
    {id:"minha_nova_aba",ico:"🆕", label:"Meu Módulo"},  // ← adicionar aqui
  ]}
  active={prescricaoTab2}
  onChange={setPrescricaoTab2}
/>
```

### 3c. Render condicional (logo após os outros `{prescricaoTab2==="..."}`)
```jsx
{prescricaoTab2==="minha_nova_aba" && (
  <React.Suspense fallback={<div style={{padding:24,textAlign:"center",color:"#64748B"}}>Carregando…</div>}>
    <MeuNovoComp
      pac={pac}
      up={up}
      funcLogado={funcLogado}
      dossie={dossieOncologico}
      setDossie={setDossieGuardado}
      addMsg={addMsg}
    />
  </React.Suspense>
)}
```

### 3d. Estado da aba (linha 355)
```js
const [prescricaoTab2, setPrescricaoTab2] = useState("motor45");
```
Reset automático para `"motor45"` já existe no `trocarPaciente` e `limpar`. Não precisa mexer.

---

## 4 · MODELO DE DADOS DO PACIENTE (objeto `pac`)

O objeto `pac` é passado como prop para todos os componentes filhos.
`up(campo, valor)` atualiza `pac` e persiste automaticamente.

### Campos usados na prescrição:
```js
pac.nome        // string — "João Silva"
pac.pacID       // string — ID único gerado
pac.nasc        // string — "DD/MM/AAAA"
pac.sexo        // string — "Masculino" | "Feminino"
pac.peso        // string|number — kg (ex: "72" ou 72)
pac.altura      // string|number — cm (ex: "165" ou 165)
pac.ecog        // string — "0"|"1"|"2"|"3"|"4"
pac.cid         // string — "C18.0"
pac.diag        // string — diagnóstico livre
pac.trat        // string — protocolo em uso
pac.linha       // string — "1a linha" | "2a linha" | "adjuvante" | etc.
pac.intencao    // string — "curativa" | "paliativa" | "neoadjuvante"
pac.cpf         // string
pac.cns         // string
pac.anatom      // string — laudo anatomopatológico
pac.imagen      // string — laudo de imagem
pac.obs_ia      // string — observações geradas por IA
```

### Mapeamento pac → pacienteInicial (PrescricaoQTv2):
```js
pacienteInicial: {
  nome:      pac.nome || '',
  prontuario: pac.pacID || pac.id || '',
  dataNasc:  pac.nasc && /^\d{2}\/\d{2}\/\d{4}$/.test(pac.nasc)
               ? pac.nasc.split("/").reverse().join("-")
               : (pac.nasc || ''),           // DD/MM/AAAA → AAAA-MM-DD
  sexo:      pac.sexo === "Feminino" ? "F"
           : pac.sexo === "Masculino" ? "M" : '',
  pesoKg:    Number(pac.peso)   || '',       // pac usa 'peso', v2 usa 'pesoKg'
  alturaCm:  Number(pac.altura) || '',       // pac usa 'altura', v2 usa 'alturaCm'
  ecog:      pac.ecog  || '',
  histologia: pac.diag || '',
}
```

---

## 5 · MODELO DE DADOS DO MÉDICO (objeto `funcLogado`)

```js
// Fonte: src/utils/constants.js — EQUIPE[0]
funcLogado = {
  id:     "silas",
  nome:   "Dr. Silas Negrão Serra Jr.",
  cargo:  "Oncologista Clínico",
  reg:    "CRM-PB 17341 · RQE 9099",   // CRM está em .reg, não em .crm
  tipo:   "medico",
  ico:    "👨‍⚕️"
}

// Extração do CRM para PrescricaoQTv2:
crm: (funcLogado?.reg || '').match(/CRM[^·\n]*/i)?.[0]?.trim() || ''
// → "CRM-PB 17341"
```

---

## 6 · DOSSIÊ ONCOLÓGICO — como salvar documentos

```js
// Padrão usado em todos os onSalvar/onPrescricaoGerada:
setDossieOncologico(d => {
  const base = d || criarDossieInicial(pac);
  const doc = {
    id:        Date.now(),
    tipo:      "Prescrição QT v2",          // string livre — tipo do documento
    nome:      `${protocolo.nome} — ...`,   // título exibido no dossiê
    resumo:    `texto multilinha\ncom \n campos`,
    origem:    "prescricao_qt_v2",          // slug de rastreabilidade
    criadoEm:  NOW(),                       // import { NOW } from './components/ui/primitives'
    auditoria: prescricao.auditoria || null,
  };
  return {
    ...base,
    documentos: [doc, ...(base.documentos || [])],
    status:     "pronto_medico",
    updatedAt:  NOW(),
  };
});

// ATENÇÃO: usar setDossieGuardado (não setDossieOncologico direto)
// setDossieGuardado verifica se há atendimento aberto — proteção de segurança
// setDossieOncologico direto → só para reset/criarDossieInicial
```

---

## 7 · CATÁLOGO v0.3 — SCHEMA DOS PROTOCOLOS

```jsonc
// src/data/protocolos_qt_catalogo_v0.3_curado_preliminar.json
{
  "schemaVersion": "qt-protocol-catalog-curado-v0.3",
  "geradoEm": "ISO string",
  "lastSafetyAuditAt": "ISO string",
  "protocolos": [
    {
      "id": "capox",
      "nomeExibicao": "CAPOX",
      "nomeCanonico": "capox",
      "tumores": ["coloretal"],               // array de slugs
      "farmacos": [
        {
          "nome": "oxaliplatina",
          "farmaco": "oxaliplatina",          // alias — OBRIGATÓRIO (igual a nome)
          "doseValor": 130,
          "doseUnidade": "mg/m²",             // ver lista em §8
          "via": "IV",
          "diasAdm": [1],
          "doseMaxima": 0,                    // 0 = sem limite definido
          "reducaoNaoAplicavel": false        // true = dose fixa (prednisona, etc.)
        }
      ],
      "cicloDias": 21,
      "periodicidadeExtraida": "A cada 21 dias",
      "cid10Sugeridos": ["C18", "C19", "C20"],
      "cid10Bloqueados": [],                 // CIDs onde o protocolo é CONTRAINDICADO
      "linhasTratamento": ["1a linha", "adjuvante"],
      "fonte": "NEJM 2004",
      "status": "revisao_medica",            // ver §9
      "prescricaoPermitida": false,          // SEMPRE false — regra imutável
      "versaoCatalogo": "v0.3"
    }
  ]
}
```

---

## 8 · UNIDADES DE DOSE SUPORTADAS (calculadoraDose.js)

| Código | Descrição |
|---|---|
| `mg/m²` | miligramas por metro quadrado de BSA |
| `mg/kg` | miligramas por kg de peso |
| `mg` | dose fixa em miligramas |
| `AUC` | Calvert formula: `Dose = AUC × (ClCr + 25)` — exige ClCr |
| `UI/m²` | Unidades Internacionais por m² |
| `UI/kg` | Unidades Internacionais por kg |
| `UI` | Unidades Internacionais dose fixa |
| `mg/m²/dia` | miligramas por m² por dia (temozolomida) |
| `%` | percentual — sem cálculo automático |

**BSA:** fórmula Mosteller `√(alturaCm × pesoKg / 3600)`
- Range válido: 0.8 – 2.8 m²
- Fora do range → erro explícito, não calcula

**Cockcroft-Gault (ClCr):**
- Peso ajustado para obesos: `pesoIdeal + 0.4 × max(0, pesoReal − pesoIdeal)`
- `pesoIdeal` (Devine): homem `50 + 2.3 × max(0, (alturaCm−152.4)/2.54)`, mulher `45.5 + ...`
- IMC ≥ 30 → usa `min(pesoReal, pesoAjustado)`
- ClCr cap ≤ 125 para Calvert (Jodrell & Newell)
- ClCr < 15 → bloqueia Calvert

---

## 9 · STATUS DOS PROTOCOLOS

| Status | Prescritível | Visível | Descrição |
|---|---|---|---|
| `draft` | ❌ Não | ✅ Com badge ⚠️ | Nunca entrou em revisão |
| `revisao_medica` | ✅ Com CRM | ✅ Normal | Em revisão médica ativa |
| `aprovado` | ✅ | ✅ | Aprovado formalmente (nenhum existe ainda) |
| `bloqueado` | ❌ | ❌ | Ocultado da lista |
| `quarentena_fragmento_pdf` | ❌ | ❌ | Dado de origem suspeito |
| `excluido_nao_qt_pura` | ❌ | ❌ | Excluído por não ser QT pura |

```js
// Constantes em protocoloCatalogo.js:
STATUS_PRESCRITIVEL    = ['revisao_medica', 'aprovado']
STATUS_VISIVEL_COM_AVISO = ['draft']
STATUS_BLOQUEADO       = ['bloqueado', 'quarentena_fragmento_pdf', 'excluido_nao_qt_pura']
```

---

## 10 · ALERTAS CLÍNICOS — NIVEL (validacoesSeguranca.js)

```js
NIVEL = {
  CRITICO: 'critico',  // bloqueia o botão "Próximo" / "Confirmar"
  GRAVE:   'grave',    // exige justificativa escrita (≥10 chars)
  AVISO:   'aviso',    // aviso amarelo — não bloqueia
  INFO:    'info',     // informativo — cinza
}

// Alerta shape:
{ nivel: NIVEL.CRITICO, codigo: 'ECOG_ALTO', mensagem: 'ECOG 4 — prescrição contraindicada.' }

// Verificar bloqueio:
const temCritico = validacao.alertas.some(a => a.nivel === NIVEL.CRITICO);
```

---

## 11 · FUNÇÕES UTILITÁRIAS DISPONÍVEIS

### primitives.js (import de `./components/ui/primitives`)
```js
NOW()       // → "2025-05-27T14:30:00.000Z" (ISO string)
TODAY()     // → "27/05/2025" (DD/MM/AAAA)
sc_(obj)    // style conditional — retorna string de classes
```

### calculadoraDose.js
```js
calcBSA(pesoKg, alturaCm)                         // → number | throws
calcBSASafe(pesoKg, alturaCm)                      // → { bsa, erro }
calcCrCl(idade, pesoKg, alturaCm, creatinina, sexo)
calcCrClSafe(...)                                  // → { crclMlMin, pesoUsado, erro }
calcCalvert(auc, crclMlMin)                        // → mg | throws
calcDoseFarmaco(farmaco, { bsa, pesoKg, crclMlMin, reducaoPct })
calcProtocoloCompleto(protocolo, paciente)         // → { linhas, erros, avisosCriticos }
verificarDoseCumulativa(nomeFarmaco, doseCiclo, doseAcumulada, bsa)
```

### protocoloCatalogo.js
```js
carregarCatalogo(rawJson)           // → { ok, protocolos, erros, versao, schemaV3 }
filtrarProtocolosPrescritiveis(arr) // remove STATUS_BLOQUEADO
buscarProtocolos(arr, termo)        // busca em nome + tumor + farmacos
agruparPorTumor(arr)                // → { [tumorLabel]: protocolo[] }
labelStatus(status)                 // → { label, cor, icone }
gerarHashProtocolo(protocolo, dataISO) // djb2 hex para auditoria
```

### validacoesSeguranca.js
```js
validarStatusProtocolo(protocolo)
validarViaAdministracao(protocolo)
validarRequisitosFarmacos(protocolo, paciente)
validarCompleto(protocolo, paciente)  // → { alertas: Alerta[] }
```

---

## 12 · PALETA DE CORES (padrão do projeto)

```js
// Fonte: src/utils/constants.js + uso interno nos componentes v2
const N   = '#1B365D';  // Navy — títulos, headers, botão primário
const VE  = '#15803D';  // Verde — sucesso, aprovado, dose plena
const VM  = '#B91C1C';  // Vermelho — crítico, bloqueado, erro
const AM  = '#B45309';  // Âmbar — aviso, draft, redução
const AZ  = '#1D4ED8';  // Azul — informativo, links, revisao_medica

// Background e bordas
const BG  = '#F8FAFC';  // fundo de cards
const BD  = '#E2E8F0';  // bordas
```

---

## 13 · SEGURANÇA — REGRAS IMUTÁVEIS

1. **`prescricaoPermitida: false`** em TODOS os protocolos — não alterar sem revisão médica formal
2. **Footer obrigatório** em todo módulo clínico: `"Módulo em desenvolvimento — não integrado ao prontuário ou farmácia."`
3. **CRM obrigatório** para confirmar prescrição — validar `crm.trim().length >= 5`
4. **Nunca calcular dose** sem BSA validado (0.8–2.8 m²)
5. **ClCr obrigatório** para fármacos com `doseUnidade === 'AUC'` — não usar default
6. **NIVEL.CRITICO** bloqueia completamente o botão de avanço — sem bypass
7. **Nenhum protocolo** com `status === 'draft'` é prescritível — visível com badge ⚠️ apenas
8. **`setDossieGuardado`** (não `setDossieOncologico` direto) para salvar documentos clínicos

---

## 14 · PROTOCOLOS ATIVOS NO CATÁLOGO (v0.3 — maio 2025)

| ID | Nome | Tumor | Status |
|---|---|---|---|
| `capox` | CAPOX | Coloretal | revisao_medica |
| `mfolfox6` | mFOLFOX6 | Coloretal | revisao_medica |
| `folfiri` | FOLFIRI | Coloretal | revisao_medica |
| `carboplatina-paclitaxel` | Carboplatina + Paclitaxel | Pulmão/Ovário | revisao_medica |
| `ac-mama` | AC (Doxorrubicina + Ciclofosfamida) | Mama | revisao_medica |
| `tc-mama` | TC (Docetaxel + Ciclofosfamida) | Mama | revisao_medica |
| `docetaxel-prostata` | Docetaxel + Prednisona | Próstata | revisao_medica |
| `cisplatina-gencitabina` | Cisplatina + Gencitabina | Bexiga/Pulmão | revisao_medica |
| `tmz-*` | Temozolomida (3 variantes) | SNC | bloqueado |
| `cisgema-biliar-abc02` | CisGema biliar (ABC-02) | Biliar | bloqueado |

Total: 13 protocolos · 8 selecionáveis · 5 bloqueados · 0 aprovados

---

## 15 · SUBTABS ATUAIS DA ABA PRESCRIÇÃO

```
motor45        → ProtocolosQTExplorer    (explorador de protocolos v4.5)
prescricao_atual → PrescricaoQT          (módulo v1 legado)
qt_v2          → PrescricaoQTv2          (stepper 4 etapas + catálogo v0.3)
novo_protocolo → NovoProtocoloBuilder    (criador + busca web + drafts)
```

**Estado:** `const [prescricaoTab2, setPrescricaoTab2] = useState("motor45")` (App.jsx linha 355)

---

## 16 · PADRÃO DE NOVO COMPONENTE (template mínimo)

```jsx
// src/features/prescricao/v2/MeuModulo.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Descrição do módulo
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';

// Props esperadas quando integrado via App.jsx:
// pac        — objeto paciente (ver §4)
// up         — (campo, valor) => void — atualiza pac
// funcLogado — objeto médico logado (ver §5)
// dossie     — dossieOncologico
// setDossie  — setDossieGuardado (não setDossieOncologico)
// addMsg     — (de, para, texto, tipo) => void

export default function MeuModulo({ pac, up, funcLogado, dossie, setDossie, addMsg }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      {/* conteúdo */}
      <div style={{ marginTop: 16, fontSize: 9, color: '#94A3B8', textAlign: 'center' }}>
        Módulo em desenvolvimento — não integrado ao prontuário ou farmácia.
      </div>
    </div>
  );
}
```

---

## 17 · FLUXO DE DESENVOLVIMENTO

```
1. Crie o componente em src/features/prescricao/v2/
2. npm run build  →  deve passar sem erros
3. Adicione lazy import + subtab + render condicional em App.jsx (ver §3)
4. npm run build  →  confirmar chunk role-prescricao cresce razoavelmente
5. git add ... && git commit -m "feat(prescricao): ..."
6. git push && npm run deploy
7. Testar em https://silasjuba-del.github.io/apac-oncologia/
```

**Build limpo esperado:** `✓ built in ~5-10s` sem warnings críticos.
**109 warnings legados** de outros módulos são normais — ignorar.

---

*Gerado em 2025-05-27 · APACApp Oncologia Integrada · Hospital do Bem — Patos/PB*
