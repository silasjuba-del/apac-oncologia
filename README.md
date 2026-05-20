# Oncologia Integrada — APACApp v11 COMPLETO
**Dr. Silas Negrão Serra Jr. · CRM-PB 17341 · Hospital do Bem · Patos-PB**

## 46 Componentes / Funções

### Módulos Médico
- DashboardMedico, Prontuário, ProtocolosQT, ReceitasComp
- APACComp (antiglosa + envio financeiro), BalancoComp
- SalaoMedico (emergência sonora), TriagemMedicoComp
- ProgramaTerapeutico, AgendamentoComp
- TrialsCompMelhorado, EstatisticasComp, ConfiguracoesComp

### Módulos Equipe
- EnfermagemPage (salão + TriagemComp + AlertaDoseForm)
- FarmaciaPage (prescrições + estoque)
- RecepçãoPage (cadastro + lista de espera)
- AssistenciaSocialPage (laudos + evolução social)
- ComunicacaoPage (chat por setores)

### Portal do Paciente
- CarteirinhaTab + QR Code
- SegundaViaTab (receita + exames + laudo + alarme + nutri)
- InboxPaciente + chat por setor
- EnviarExamesTab (câmera + arquivo)
- TriagemComp (reações com alerta PS)

### Utilitários
- BiomarcadoresSelector (mama/pulmão/gástrico/próstata)
- ListaEsperaPrioridade, SeletorEquipe, MicCaptura
- PrintModal, BtnSalvar, Card, Tbl, Cbox, Bge
- gerarResumoProntuarioIA (Claude API)

## Instalação

```bash
# 1. Entrar na pasta
cd APACApp_ClaudeCode

# 2. Instalar dependências
npm install

# 3. Rodar em modo desenvolvimento
npm run dev
# Abre em http://localhost:5173

# 4. Build para produção
npm run build
```

## Migração para Claude Code

```bash
# Instalar Claude Code (requer Node 18+)
npm install -g @anthropic-ai/claude-code

# Entrar na pasta do projeto
cd APACApp_ClaudeCode

# Iniciar Claude Code
claude

# Exemplos de comandos no Claude Code:
# "adicione o módulo de telemedicina"
# "corrija o erro na linha 450 do App.jsx"
# "adicione autenticação por PIN para o médico"
# "implemente sincronização com Google Drive"
```

## Estrutura de Arquivos
```
APACApp_ClaudeCode/
├── src/
│   ├── App.jsx       ← Aplicação completa (46 componentes)
│   └── main.jsx      ← Entry point React
├── public/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Próximos passos com Claude Code
- Separar componentes em arquivos individuais (src/components/)
- Adicionar SQLite / backend Node+Express
- Integrar SISAC Onco via API
- Adicionar autenticação JWT
- Deploy no Hospital (rede local)
