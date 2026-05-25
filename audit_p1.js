// audit_p1.js — P1: Mapa de save paths com classificação de cobertura real
// ─────────────────────────────────────────────────────────────────────────────
// COBERTURA EXISTENTE:
//   Nível A — executarProntuarioSecurity (check explícito no arquivo)
//   Nível B — up()/setDossie via App.jsx (requireActivePatient + setDossieGuardado)
//             → arquivos que só usam up()/addMsg/setDossie recebidos como props
//   Nível C — intencional sem guard (API key, novoPaciente, routing UI)
//   DESCOBERTO — localStorage com dados de paciente / dbSalvarPaciente direto
const fs   = require("fs");
const path = require("path");
const SRC  = path.join(__dirname, "src");

const SAVE_PATTERNS = [
  { pat: /setDossie\s*\(|setDossie&&setDossie/, label: "setDossie()" },
  { pat: /\bup\s*\(["']?[\w_]+["']?,/, label: "up(campo," },
  { pat: /localStorage\.setItem\s*\(/, label: "localStorage.setItem" },
  { pat: /dbSalvarPaciente\s*\(/, label: "dbSalvarPaciente()" },
  { pat: /savePacAtual\s*\(/, label: "savePacAtual()" },
  { pat: /setAtendimentos\s*\(/, label: "setAtendimentos()" },
  { pat: /salvarEvolucao|function salvar\b/, label: "salvar()" },
];

// Nível A: arquivo tem guard explícito
const HAS_EXPLICIT_SECURITY = /executarProntuarioSecurity|requireActivePatient|setDossieGuardado/;
// Nível B: arquivo só usa up()/setDossie/addMsg como props de App.jsx (cobertos em cascata)
const ONLY_PROP_SAVES = /\bup\s*&&\s*up\b|\bsetDossie\s*&&\s*setDossie\b/;

// Arquivos classificados como Nível C (intencionais, não dados de paciente)
const NIVEL_C = new Set([
  "src/components/AgentPanel.jsx",              // localStorage API key apenas
  "src/components/IATestador.jsx",              // localStorage API key apenas
  "src/features/agentes/useAgentesResultadoStore.js", // store de agente, não prontuário
  "src/features/rotas/useEntradasStore.js",     // routing UI
  "src/utils/db.js",                            // função base de storage
  "src/utils/storage.js",                       // função base de storage
  "src/components/ui/primitives.jsx",           // addMsg de chat UI
  "src/components/GerenciarPacientes.jsx",      // novoPaciente() — cria NOVO registro com genID()
  "src/pages/PacienteDemograficoForm.tsx",      // rascunho demográfico — chave única, limpa pelo P0 quarantine
  "src/pages/PacientePrimeiraConsulta.jsx",     // localStorage draft de primeira consulta
  "src/features/rotas/PacienteDrawer.jsx",      // localStorage de UI state (drawer, não prontuário)
  "src/pages/MedicoProntuario.jsx",             // salvarEvolucao usa API própria com paciente.id
  "src/features/enfermagem/SalaoMedico.jsx",    // addMsg emergência, não escreve no prontuário
  "src/features/enfermagem/TriagemQTFrame.jsx", // addMsg triagem, não escreve no prontuário
  "src/features/medico/TriagemMedicoRecebe.jsx",// addMsg conduta triagem, não escreve no prontuário
  "src/features/medico/TrialsCompMelhorado.jsx",// addMsg incluir trial, não escreve no prontuário
]);

// Padrões que indicam dado de paciente real (risco real se sem guard)
const DADO_PACIENTE = /localStorage\.setItem\s*\(\s*["']apacapp_|dbSalvarPaciente\s*\(\s*pac\b|savePacAtual\s*\(\s*pac/;

function walkDir(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, results);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const files = walkDir(SRC);
const cobertosA = [], cobertosB = [], cobertosC = [], descobertos = [];

for (const fp of files) {
  const rel = fp.replace(/.*[/\\]src[/\\]/, "src/").replace(/\\/g, "/");
  const src = fs.readFileSync(fp, "utf8");
  const lines = src.split("\n");
  const hits = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { pat, label } of SAVE_PATTERNS) {
      if (pat.test(line)) hits.push({ n: i + 1, label, s: line.trim().slice(0, 90) });
    }
  }

  if (!hits.length) continue;

  if (NIVEL_C.has(rel)) {
    cobertosC.push({ file: rel, hits });
  } else if (HAS_EXPLICIT_SECURITY.test(src)) {
    cobertosA.push({ file: rel, hits });
  } else if (!DADO_PACIENTE.test(src) && ONLY_PROP_SAVES.test(src)) {
    // Somente usa up()/setDossie como props → coberto pelo guard de App.jsx
    cobertosB.push({ file: rel, hits });
  } else {
    descobertos.push({ file: rel, hits, temDadoPaciente: DADO_PACIENTE.test(src) });
  }
}

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("  P1 AUDIT — Classificação real de cobertura de save paths");
console.log("═══════════════════════════════════════════════════════════════\n");

if (descobertos.length === 0) {
  console.log("✅ Nenhum save path descoberto!\n");
} else {
  const criticos = descobertos.filter(r => r.temDadoPaciente);
  const revisar  = descobertos.filter(r => !r.temDadoPaciente);

  if (criticos.length) {
    console.log(`🔴 CRÍTICO — ${criticos.length} arquivo(s) com dados de paciente sem guard:\n`);
    for (const r of criticos) {
      console.log(`  📄 ${r.file}`);
      r.hits.filter(h => /localStorage|dbSalvar|savePac/.test(h.label))
            .forEach(h => console.log(`     L${h.n}: [${h.label}] ${h.s}`));
      console.log();
    }
  }

  if (revisar.length) {
    console.log(`🟡 REVISAR (${revisar.length} arquivos) — usa up()/setDossie mas não só como props:\n`);
    for (const r of revisar) {
      console.log(`  📄 ${r.file} (${r.hits.length} hits)`);
    }
    console.log();
  }
}

console.log("─────────────────────────────────────────────────────────────");
console.log(`✅ Nível A — Guard explícito (${cobertosA.length} arquivos):`);
cobertosA.forEach(r => console.log("   " + r.file));

console.log(`\n✅ Nível B — Cobertos via App.jsx (up/setDossieGuardado) (${cobertosB.length} arquivos):`);
cobertosB.forEach(r => {
  const labels = [...new Set(r.hits.map(h => h.label))].join(", ");
  console.log("   " + r.file + "  [" + labels + "]");
});

console.log(`\n✅ Nível C — Intencional sem guard (${cobertosC.length} arquivos):`);
cobertosC.forEach(r => console.log("   " + r.file));

const total = cobertosA.length + cobertosB.length + cobertosC.length + descobertos.length;
console.log("\n═══════════════════════════════════════════════════════════════");
console.log(`TOTAL: ${total} arquivos com saves`);
console.log(`  A(explícito): ${cobertosA.length}  B(cascata): ${cobertosB.length}  C(intencional): ${cobertosC.length}  DESCOBERTO: ${descobertos.length}`);
console.log("═══════════════════════════════════════════════════════════════\n");
