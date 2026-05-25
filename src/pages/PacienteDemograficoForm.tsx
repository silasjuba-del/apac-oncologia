// === src/pages/PacienteDemograficoForm.tsx ===
// Formulario demografico APAC/PB para primeira consulta.

import React, { useMemo, useRef, useState } from "react";

const N = "#1B365D";
const G = "#B8860B";
const VE = "#15803D";
const SL = "#64748B";

type Sexo = "M" | "F" | "I" | "";
type SimNao = "sim" | "nao" | "";
type Zona = "urbana" | "rural" | "";

export type PacienteDemografico = {
  nomeCompleto: string;
  nomeSocial: string;
  numeroProntuario: string;
  cns: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  sexo: Sexo;
  racaCor: string;
  etnia: string;
  nomeMae: string;
  acompanhanteNome: string;
  responsavelNome: string;
  responsavelParentesco: string;
  responsavelTelefone: string;
  telefonePrincipal: string;
  telefoneCelular: string;
  telefoneAlternativo: string;
  whatsapp: SimNao;
  cep: string;
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  codigoIbgeMunicipio: string;
  uf: string;
  zona: Zona;
  confirmaVeracidade: boolean;
};

export type PayloadDemografico = ReturnType<typeof normalizarParaAPAC>;

interface Props {
  onEnviar?: (payload: PayloadDemografico) => void;
  initialData?: Partial<PacienteDemografico>;
}

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const ORDEM_CAMPOS: Array<keyof PacienteDemografico> = [
  "nomeCompleto","nomeSocial","numeroProntuario","cns","cpf","rg","dataNascimento",
  "sexo","racaCor","etnia","nomeMae","acompanhanteNome","responsavelNome",
  "responsavelParentesco","responsavelTelefone","telefonePrincipal","telefoneCelular",
  "whatsapp","telefoneAlternativo","cep","tipoLogradouro","logradouro","numero",
  "complemento","bairro","municipio","codigoIbgeMunicipio","uf","zona",
];

const TOTAL_OBRIGATORIOS = 14;

const INITIAL: PacienteDemografico = {
  nomeCompleto: "",
  nomeSocial: "",
  numeroProntuario: "",
  cns: "",
  cpf: "",
  rg: "",
  dataNascimento: "",
  sexo: "",
  racaCor: "",
  etnia: "",
  nomeMae: "",
  acompanhanteNome: "",
  responsavelNome: "",
  responsavelParentesco: "",
  responsavelTelefone: "",
  telefonePrincipal: "",
  telefoneCelular: "",
  telefoneAlternativo: "",
  whatsapp: "",
  cep: "",
  tipoLogradouro: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  municipio: "",
  codigoIbgeMunicipio: "",
  uf: "PB",
  zona: "",
  confirmaVeracidade: false,
};

const onlyDigits = (v: string) => String(v || "").replace(/\D/g, "");

function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function maskCNS(v: string) {
  return onlyDigits(v).slice(0, 15);
}

function maskCEP(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, "$1-$2");
}

function maskIBGE(v: string) {
  return onlyDigits(v).slice(0, 7);
}

function maskPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d.length <= 10
    ? d.replace(/^(\d{2})(\d{4})(\d)/, "($1) $2-$3")
    : d.replace(/^(\d{2})(\d{5})(\d)/, "($1) $2-$3");
}

function validarCPF(cpf: string) {
  const c = onlyDigits(cpf);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(c[i]) * (10 - i);
  let digito = 11 - (soma % 11);
  if (digito >= 10) digito = 0;
  if (digito !== Number(c[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(c[i]) * (11 - i);
  digito = 11 - (soma % 11);
  if (digito >= 10) digito = 0;
  return digito === Number(c[10]);
}

const validarCNS = (cns: string) => onlyDigits(cns).length === 15;
const validarTelefone = (tel: string) => onlyDigits(tel).length >= 10;
const validarCEP = (cep: string) => onlyDigits(cep).length === 8;
const validarIBGE = (codigo: string) => onlyDigits(codigo).length === 7;

function calcularIdade(nasc: string) {
  if (!nasc) return "";
  const d = new Date(nasc);
  if (Number.isNaN(d.getTime())) return "";
  const hoje = new Date();
  let idade = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) idade--;
  return idade >= 0 ? String(idade) : "";
}

function normalizarTexto(v: string) {
  return String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\*\*/g, "")
    .toLowerCase()
    .trim();
}

function limparValor(v: string) {
  return String(v || "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.;]\s*$/g, "")
    .trim();
}

function extrairCampo(texto: string, labels: string[]) {
  const linhas = String(texto || "").split(/\r?\n/);
  const alvos = labels.map(normalizarTexto);
  for (const linhaOriginal of linhas) {
    const linha = linhaOriginal.replace(/^[\s>*\-•]+/, "").replace(/\*\*/g, "").trim();
    const idx = linha.indexOf(":");
    if (idx < 0) continue;
    const label = normalizarTexto(linha.slice(0, idx));
    if (alvos.some((alvo) => label.includes(alvo))) return limparValor(linha.slice(idx + 1));
  }
  return "";
}

function dataParaISO(v: string) {
  const s = limparValor(v);
  const br = s.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (br) {
    const dia = br[1].padStart(2, "0");
    const mes = br[2].padStart(2, "0");
    const ano = br[3].length === 2 ? `20${br[3]}` : br[3];
    return `${ano}-${mes}-${dia}`;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

function sexoParaCodigo(v: string): Sexo {
  const s = normalizarTexto(v);
  if (s.startsWith("m")) return "M";
  if (s.startsWith("f")) return "F";
  if (s) return "I";
  return "";
}

function parseRaca(v: string) {
  const s = normalizarTexto(v);
  if (s.includes("branca")) return "Branca";
  if (s.includes("preta")) return "Preta";
  if (s.includes("parda")) return "Parda";
  if (s.includes("amarela")) return "Amarela";
  if (s.includes("indigena")) return "Indigena";
  return limparValor(v);
}

function parseMunicipioUF(v: string) {
  const valor = limparValor(v);
  const match = valor.match(/^(.+?)\s*[-/]\s*([A-Z]{2})$/i);
  if (!match) return { municipio: valor, uf: "" };
  return { municipio: limparValor(match[1]), uf: match[2].toUpperCase() };
}

function parseEndereco(endereco: string) {
  const bruto = limparValor(endereco);
  const cep = bruto.match(/\b\d{5}-?\d{3}\b/)?.[0] || "";
  const uf = bruto.match(/[-/]\s*([A-Z]{2})\b/i)?.[1]?.toUpperCase() || "";
  const municipio = bruto.match(/,\s*([^,]+?)\s*[-/]\s*[A-Z]{2}\b/i)?.[1] || "";
  const bairro = bruto.match(/\bbairro\s+([^,()]+)/i)?.[1] || "";
  const numero = bruto.match(/\bn[uú]mero\s+([^,()]+)/i)?.[1]
    || bruto.match(/\bn[ºo.]?\s*([^,()]+)/i)?.[1]
    || "";
  const logradouro = limparValor(bruto.split(/,\s*(?:n[uú]mero|n[ºo.]?)/i)[0] || bruto);
  const tipo = logradouro.match(/^(rua|avenida|travessa|s[íi]tio|fazenda|rodovia|estrada)\b/i)?.[1] || "";
  return {
    cep: maskCEP(cep),
    uf,
    municipio: limparValor(municipio),
    bairro: limparValor(bairro),
    numero: limparValor(numero),
    logradouro,
    tipoLogradouro: tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase() : "",
  };
}

function avaliarPendencias(p: PacienteDemografico) {
  const pend: string[] = [];
  if (!p.nomeCompleto.trim()) pend.push("Nome completo");
  if (!validarCNS(p.cns)) pend.push("CNS / Cartao SUS com 15 digitos");
  if (!validarCPF(p.cpf)) pend.push("CPF valido");
  if (!p.dataNascimento) pend.push("Data de nascimento");
  if (!p.sexo) pend.push("Sexo");
  if (!p.racaCor) pend.push("Raca/cor");
  if (!p.nomeMae.trim()) pend.push("Nome da mae");
  if (!validarTelefone(p.telefonePrincipal)) pend.push("Telefone principal com DDD");
  if (!validarCEP(p.cep)) pend.push("CEP com 8 digitos");
  if (!p.logradouro.trim()) pend.push("Logradouro");
  if (!p.numero.trim()) pend.push("Numero ou S/N");
  if (!p.bairro.trim()) pend.push("Bairro");
  if (!p.municipio.trim()) pend.push("Municipio de residencia");
  if (!p.uf) pend.push("UF");
  return pend;
}

function montarEnderecoLinha(p: PacienteDemografico) {
  return [
    [p.tipoLogradouro, p.logradouro].filter(Boolean).join(" "),
    p.numero ? `nº ${p.numero}` : "",
    p.complemento,
    p.bairro ? `Bairro ${p.bairro}` : "",
    [p.municipio, p.uf].filter(Boolean).join(" / "),
    p.cep ? `CEP ${p.cep}` : "",
  ].filter(Boolean).join(", ");
}

function normalizarParaAPAC(p: PacienteDemografico) {
  const pendencias = avaliarPendencias(p);
  const nomeCompleto = p.nomeCompleto.trim().toUpperCase();
  const nomeMae = p.nomeMae.trim().toUpperCase();
  const telefonePrincipal = onlyDigits(p.telefonePrincipal);
  const telefoneCelular = onlyDigits(p.telefoneCelular);
  const telefoneAlternativo = onlyDigits(p.telefoneAlternativo);
  const telefoneResponsavel = onlyDigits(p.responsavelTelefone);
  const enderecoCompleto = montarEnderecoLinha(p);

  return {
    nomeCompleto,
    nomeSocial: p.nomeSocial.trim() || null,
    numeroProntuario: p.numeroProntuario.trim() || null,
    cns: onlyDigits(p.cns),
    cpf: onlyDigits(p.cpf),
    rg: p.rg.trim() || null,
    dataNascimento: p.dataNascimento,
    idade: calcularIdade(p.dataNascimento),
    sexo: p.sexo,
    racaCor: p.racaCor,
    etnia: p.etnia.trim() || null,
    nomeMae,
    naturalidade: { municipio: "", uf: "" },
    estadoCivil: "",
    profissao: "",
    identificacaoPaciente: {
      nomeCompleto,
      nomeSocial: p.nomeSocial.trim() || null,
      numeroProntuario: p.numeroProntuario.trim() || null,
      cns: onlyDigits(p.cns),
      cpf: onlyDigits(p.cpf),
      rg: p.rg.trim() || null,
      dataNascimento: p.dataNascimento,
      sexo: p.sexo,
      racaCor: p.racaCor,
      etnia: p.etnia.trim() || null,
      nomeMae,
    },
    responsavel: {
      nome: p.responsavelNome.trim() || null,
      acompanhanteNome: p.acompanhanteNome.trim() || null,
      parentesco: p.responsavelParentesco.trim() || null,
      telefone: telefoneResponsavel || null,
    },
    contato: {
      telefonePrincipal,
      telefoneCelular: telefoneCelular || null,
      whatsapp: p.whatsapp,
      telefoneAlternativo: telefoneAlternativo || null,
      telefoneResponsavel: telefoneResponsavel || null,
    },
    endereco: {
      cep: onlyDigits(p.cep),
      tipoLogradouro: p.tipoLogradouro,
      logradouro: p.logradouro.trim(),
      numero: p.numero.trim(),
      complemento: p.complemento.trim() || null,
      bairro: p.bairro.trim(),
      municipio: p.municipio.trim(),
      municipioResidencia: p.municipio.trim(),
      codigoIbgeMunicipio: onlyDigits(p.codigoIbgeMunicipio),
      codigoIBGEMunicipio: onlyDigits(p.codigoIbgeMunicipio),
      uf: p.uf,
      zona: p.zona,
      enderecoCompleto,
    },
    statusDemografico: {
      completo: pendencias.length === 0,
      pendencias,
      revisadoRecepcao: false,
    },
    origem: "portal_paciente" as const,
    criadoEm: new Date().toISOString(),
  };
}

export default function PacienteDemograficoForm({ onEnviar, initialData }: Props) {
  const [paciente, setPaciente] = useState<PacienteDemografico>(() => {
    let saved: Partial<PacienteDemografico> = {};
    try {
      const raw = localStorage.getItem("apacapp_pac_demografico");
      saved = raw ? JSON.parse(raw) : {};
    } catch {
      saved = {};
    }
    return { ...INITIAL, ...saved, ...initialData };
  });
  const [textoColado, setTextoColado] = useState("");
  const [enviado, setEnviado] = useState(false);
  const refs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>({});

  const pendencias = useMemo(() => avaliarPendencias(paciente), [paciente]);
  const idade = useMemo(() => calcularIdade(paciente.dataNascimento), [paciente.dataNascimento]);
  const completude = Math.round(((TOTAL_OBRIGATORIOS - Math.min(pendencias.length, TOTAL_OBRIGATORIOS)) / TOTAL_OBRIGATORIOS) * 100);

  function registrar(key: keyof PacienteDemografico) {
    return (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
      refs.current[String(key)] = el;
    };
  }

  function campoCompleto(key: keyof PacienteDemografico, value: PacienteDemografico[keyof PacienteDemografico]) {
    const v = String(value || "");
    if (key === "cns") return validarCNS(v);
    if (key === "cpf") return onlyDigits(v).length === 11;
    if (key === "cep") return validarCEP(v);
    if (key === "codigoIbgeMunicipio") return validarIBGE(v);
    if (["telefonePrincipal","telefoneCelular","telefoneAlternativo","responsavelTelefone"].includes(String(key))) return onlyDigits(v).length >= 10;
    if (["dataNascimento","sexo","racaCor","uf","zona","whatsapp","tipoLogradouro"].includes(String(key))) return !!v;
    return false;
  }

  function focarProximo(key: keyof PacienteDemografico) {
    const atual = ORDEM_CAMPOS.indexOf(key);
    const proximo = ORDEM_CAMPOS.slice(atual + 1).find((k) => refs.current[String(k)]);
    if (!proximo) return;
    window.setTimeout(() => refs.current[String(proximo)]?.focus(), 40);
  }

  function enterProximo(key: keyof PacienteDemografico) {
    return (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      focarProximo(key);
    };
  }

  function salvarLocal(novo: PacienteDemografico) {
    setPaciente(novo);
    localStorage.setItem("apacapp_pac_demografico", JSON.stringify(novo));
    setEnviado(false);
  }

  function up<K extends keyof PacienteDemografico>(key: K, value: PacienteDemografico[K], autoAvancar = false) {
    const novo = { ...paciente, [key]: value };
    salvarLocal(novo);
    if (autoAvancar && campoCompleto(key, value)) focarProximo(key);
  }

  function aplicarTextoColado() {
    if (!textoColado.trim()) {
      window.alert("Cole primeiro o texto com os dados do paciente.");
      return;
    }

    const naturalidade = parseMunicipioUF(extrairCampo(textoColado, ["naturalidade"]));
    const endereco = parseEndereco(extrairCampo(textoColado, ["endereco", "endereço"]));
    const telefone = extrairCampo(textoColado, ["telefone", "telefone principal", "telefone de contato"]);
    const cns = extrairCampo(textoColado, ["cartao nacional de saude", "cartão nacional de saúde", "cns", "cartao sus"]);
    const zonaRaw = normalizarTexto(extrairCampo(textoColado, ["zona urbana/rural", "zona"]));

    const novos: Partial<PacienteDemografico> = {
      nomeCompleto: extrairCampo(textoColado, ["nome completo", "nome do paciente", "paciente"]).toUpperCase(),
      nomeSocial: extrairCampo(textoColado, ["nome social", "apelido"]),
      numeroProntuario: extrairCampo(textoColado, ["numero do prontuario", "número do prontuário", "prontuario"]),
      cns: maskCNS(cns),
      cpf: maskCPF(extrairCampo(textoColado, ["cpf"])),
      rg: extrairCampo(textoColado, ["rg", "documento de identidade"]),
      dataNascimento: dataParaISO(extrairCampo(textoColado, ["data de nascimento", "nascimento", "nasc"])),
      sexo: sexoParaCodigo(extrairCampo(textoColado, ["sexo"])),
      racaCor: parseRaca(extrairCampo(textoColado, ["raca/cor", "raça/cor", "raca", "raça", "cor"])),
      etnia: extrairCampo(textoColado, ["etnia"]),
      nomeMae: extrairCampo(textoColado, ["filiacao (mae)", "filiação (mãe)", "nome da mae", "nome da mãe", "mae", "mãe"]).toUpperCase(),
      acompanhanteNome: extrairCampo(textoColado, ["nome acompanhante", "acompanhante"]),
      responsavelNome: extrairCampo(textoColado, ["nome do responsavel", "nome do responsável", "responsavel", "responsável"]),
      responsavelParentesco: extrairCampo(textoColado, ["parentesco do responsavel", "parentesco do responsável", "parentesco"]),
      responsavelTelefone: maskPhone(extrairCampo(textoColado, ["telefone do responsavel", "telefone do responsável"])),
      telefonePrincipal: maskPhone(telefone),
      telefoneCelular: maskPhone(extrairCampo(textoColado, ["telefone celular", "celular", "whatsapp"])),
      telefoneAlternativo: maskPhone(extrairCampo(textoColado, ["telefone alternativo", "telefone secundario", "telefone secundário"])),
      cep: maskCEP(extrairCampo(textoColado, ["cep"]) || endereco.cep),
      tipoLogradouro: extrairCampo(textoColado, ["tipo de logradouro"]) || endereco.tipoLogradouro,
      logradouro: extrairCampo(textoColado, ["logradouro", "rua"]) || endereco.logradouro,
      numero: extrairCampo(textoColado, ["numero", "número"]) || endereco.numero,
      complemento: extrairCampo(textoColado, ["complemento"]),
      bairro: extrairCampo(textoColado, ["bairro"]) || endereco.bairro,
      municipio: extrairCampo(textoColado, ["municipio de residencia", "município de residência", "cidade que mora", "municipio", "município"]) || endereco.municipio,
      codigoIbgeMunicipio: maskIBGE(extrairCampo(textoColado, ["codigo ibge", "código ibge", "cod ibge"])),
      uf: (extrairCampo(textoColado, ["uf", "estado"]) || endereco.uf || naturalidade.uf || paciente.uf).toUpperCase(),
      zona: zonaRaw.includes("rural") ? "rural" : zonaRaw.includes("urbana") ? "urbana" : "",
    };

    const filtrados = Object.fromEntries(Object.entries(novos).filter(([, valor]) => String(valor || "").trim() !== "")) as Partial<PacienteDemografico>;
    if (Object.keys(filtrados).length === 0) {
      window.alert("Nao encontrei campos reconheciveis no texto colado.");
      return;
    }
    salvarLocal({ ...paciente, ...filtrados });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paciente.nomeCompleto.trim()) {
      window.alert("Informe pelo menos o nome do paciente antes de enviar para a recepcao.");
      return;
    }
    const payload = normalizarParaAPAC(paciente);
    localStorage.setItem("apacapp_pac_demografico_payload", JSON.stringify(payload));
    setEnviado(true);
    onEnviar?.(payload);
  }

  function exportarJSON() {
    const payload = normalizarParaAPAC(paciente);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demografico-${onlyDigits(paciente.cpf) || "sem-cpf"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const inpStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "1.5px solid #CBD5E1",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    background: "#fff",
    color: "#0F172A",
  };
  const selStyle: React.CSSProperties = { ...inpStyle };

  return (
    <div style={{ background: "#F1F5F9", minHeight: "100vh", padding: "20px 16px", fontFamily: "inherit" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ background: N, borderRadius: 16, padding: "20px 24px", color: "#fff" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,.6)", marginBottom: 6 }}>
            APACApp - Hospital do Bem - Patos/PB
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}>Dados demograficos - padrao APAC/PB</h2>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,.78)" }}>
            Paciente preenche, recepcao revisa e o agente leva os dados para prontuario e APAC.
          </p>
          <div style={{ marginTop: 16, background: "rgba(255,255,255,.1)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              <span>Completude obrigatoria</span>
              <span style={{ color: completude >= 80 ? "#6EE7B7" : completude >= 50 ? G : "#FCA5A5", fontSize: 16 }}>{completude}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,.2)", overflow: "hidden" }}>
              <div style={{ height: 8, borderRadius: 99, width: `${completude}%`, background: completude >= 80 ? "#34D399" : completude >= 50 ? G : "#F87171", transition: "width .4s" }} />
            </div>
          </div>
        </div>

        <Sec title="Colar dados do paciente">
          <Fld label="Texto colado / laudo / identificacao" full>
            <textarea
              style={{ ...inpStyle, minHeight: 120, resize: "vertical", lineHeight: 1.45 }}
              value={textoColado}
              onChange={(e) => setTextoColado(e.target.value)}
              placeholder="Cole aqui dados como: Nome completo, CPF, CNS, nascimento, mae, telefone, endereco, municipio, codigo IBGE, UF e CEP."
            />
          </Fld>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={aplicarTextoColado} style={btnStyle(N)}>
              Inserir nos campos
            </button>
            <button type="button" onClick={() => setTextoColado("")} style={btnGhostStyle}>
              Limpar texto
            </button>
            <span style={{ alignSelf: "center", fontSize: 12, color: SL }}>
              Campos completos por mascara ou selecao avancam automaticamente; nos campos livres, use Enter para ir ao proximo.
            </span>
          </div>
        </Sec>

        {pendencias.length > 0 && (
          <div style={{ background: "#FFFBEB", border: "1.5px solid #FCD34D", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontWeight: 900, color: "#92400E", fontSize: 13, marginBottom: 6 }}>
              {pendencias.length} pendencia(s) obrigatoria(s)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
              {pendencias.map((p) => (
                <div key={p} style={{ fontSize: 11, color: "#78350F" }}>- {p}</div>
              ))}
            </div>
          </div>
        )}

        {enviado && (
          <div style={{ background: "#ECFDF5", border: "1.5px solid #6EE7B7", borderRadius: 12, padding: "14px 16px", color: VE, fontWeight: 900, fontSize: 13 }}>
            Cadastro demografico validado e enviado ao prontuario/APAC.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <Sec title="1. Identificacao do paciente">
            <Fld label="Nome completo do paciente *" full>
              <input ref={registrar("nomeCompleto")} style={inpStyle} value={paciente.nomeCompleto}
                onKeyDown={enterProximo("nomeCompleto")}
                onChange={(e) => up("nomeCompleto", e.target.value.toUpperCase())}
                placeholder="Ex.: FRANCISCA LUIZ DE SOUSA" />
            </Fld>
            <Fld label="Nome social / apelido">
              <input ref={registrar("nomeSocial")} style={inpStyle} value={paciente.nomeSocial}
                onKeyDown={enterProximo("nomeSocial")}
                onChange={(e) => up("nomeSocial", e.target.value)} />
            </Fld>
            <Fld label="Numero do prontuario">
              <input ref={registrar("numeroProntuario")} style={inpStyle} value={paciente.numeroProntuario}
                onKeyDown={enterProximo("numeroProntuario")}
                onChange={(e) => up("numeroProntuario", e.target.value)}
                placeholder="Se ja existir" />
            </Fld>
            <Fld label="CNS / Cartao SUS *">
              <input ref={registrar("cns")} style={inpStyle} value={paciente.cns}
                onKeyDown={enterProximo("cns")}
                onChange={(e) => up("cns", maskCNS(e.target.value), true)}
                placeholder="15 digitos" maxLength={15} />
              {paciente.cns && <MiniOk ok={validarCNS(paciente.cns)} textoOk="CNS valido" textoErro={`${onlyDigits(paciente.cns).length}/15 digitos`} />}
            </Fld>
            <Fld label="CPF *">
              <input ref={registrar("cpf")} style={inpStyle} value={paciente.cpf}
                onKeyDown={enterProximo("cpf")}
                onChange={(e) => up("cpf", maskCPF(e.target.value), onlyDigits(e.target.value).length >= 11)}
                placeholder="000.000.000-00" />
              {paciente.cpf && <MiniOk ok={validarCPF(paciente.cpf)} textoOk="CPF valido" textoErro="CPF invalido" />}
            </Fld>
            <Fld label="RG / documento">
              <input ref={registrar("rg")} style={inpStyle} value={paciente.rg}
                onKeyDown={enterProximo("rg")}
                onChange={(e) => up("rg", e.target.value)} />
            </Fld>
            <Fld label="Data de nascimento *">
              <input ref={registrar("dataNascimento")} style={inpStyle} type="date" value={paciente.dataNascimento}
                onKeyDown={enterProximo("dataNascimento")}
                onChange={(e) => up("dataNascimento", e.target.value, true)} />
              {idade && <div style={{ fontSize: 11, marginTop: 2, color: SL }}>Idade: {idade} anos</div>}
            </Fld>
            <Fld label="Sexo *">
              <select ref={registrar("sexo")} style={selStyle} value={paciente.sexo}
                onKeyDown={enterProximo("sexo")}
                onChange={(e) => up("sexo", e.target.value as Sexo, true)}>
                <option value="">Selecionar...</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="I">Intersexo / outro</option>
              </select>
            </Fld>
            <Fld label="Raca/cor *">
              <select ref={registrar("racaCor")} style={selStyle} value={paciente.racaCor}
                onKeyDown={enterProximo("racaCor")}
                onChange={(e) => up("racaCor", e.target.value, true)}>
                <option value="">Selecionar...</option>
                <option>Branca</option><option>Preta</option><option>Parda</option>
                <option>Amarela</option><option>Indigena</option><option>Nao informada</option>
              </select>
            </Fld>
            <Fld label="Etnia, se aplicavel">
              <input ref={registrar("etnia")} style={inpStyle} value={paciente.etnia}
                onKeyDown={enterProximo("etnia")}
                onChange={(e) => up("etnia", e.target.value)} />
            </Fld>
            <Fld label="Nome da mae *" full>
              <input ref={registrar("nomeMae")} style={inpStyle} value={paciente.nomeMae}
                onKeyDown={enterProximo("nomeMae")}
                onChange={(e) => up("nomeMae", e.target.value.toUpperCase())}
                placeholder="Nome completo da mae" />
            </Fld>
          </Sec>

          <Sec title="2. Responsavel / acompanhante">
            <Fld label="Nome do acompanhante">
              <input ref={registrar("acompanhanteNome")} style={inpStyle} value={paciente.acompanhanteNome}
                onKeyDown={enterProximo("acompanhanteNome")}
                onChange={(e) => up("acompanhanteNome", e.target.value)} />
            </Fld>
            <Fld label="Nome do responsavel">
              <input ref={registrar("responsavelNome")} style={inpStyle} value={paciente.responsavelNome}
                onKeyDown={enterProximo("responsavelNome")}
                onChange={(e) => up("responsavelNome", e.target.value)} />
            </Fld>
            <Fld label="Parentesco do responsavel">
              <input ref={registrar("responsavelParentesco")} style={inpStyle} value={paciente.responsavelParentesco}
                onKeyDown={enterProximo("responsavelParentesco")}
                onChange={(e) => up("responsavelParentesco", e.target.value)}
                placeholder="Ex.: filho(a), conjuge" />
            </Fld>
            <Fld label="Telefone do responsavel">
              <input ref={registrar("responsavelTelefone")} style={inpStyle} value={paciente.responsavelTelefone}
                onKeyDown={enterProximo("responsavelTelefone")}
                onChange={(e) => up("responsavelTelefone", maskPhone(e.target.value), onlyDigits(e.target.value).length >= 10)}
                placeholder="(83) 99999-9999" />
            </Fld>
          </Sec>

          <Sec title="3. Contatos telefonicos">
            <Fld label="Telefone principal *">
              <input ref={registrar("telefonePrincipal")} style={inpStyle} value={paciente.telefonePrincipal}
                onKeyDown={enterProximo("telefonePrincipal")}
                onChange={(e) => up("telefonePrincipal", maskPhone(e.target.value), onlyDigits(e.target.value).length >= 10)}
                placeholder="(83) 99999-9999" />
            </Fld>
            <Fld label="Telefone celular / WhatsApp">
              <input ref={registrar("telefoneCelular")} style={inpStyle} value={paciente.telefoneCelular}
                onKeyDown={enterProximo("telefoneCelular")}
                onChange={(e) => up("telefoneCelular", maskPhone(e.target.value), onlyDigits(e.target.value).length >= 10)}
                placeholder="(83) 99999-9999" />
            </Fld>
            <Fld label="Celular informado e WhatsApp?">
              <select ref={registrar("whatsapp")} style={selStyle} value={paciente.whatsapp}
                onKeyDown={enterProximo("whatsapp")}
                onChange={(e) => up("whatsapp", e.target.value as SimNao, true)}>
                <option value="">Selecionar...</option>
                <option value="sim">Sim</option>
                <option value="nao">Nao</option>
              </select>
            </Fld>
            <Fld label="Telefone alternativo">
              <input ref={registrar("telefoneAlternativo")} style={inpStyle} value={paciente.telefoneAlternativo}
                onKeyDown={enterProximo("telefoneAlternativo")}
                onChange={(e) => up("telefoneAlternativo", maskPhone(e.target.value), onlyDigits(e.target.value).length >= 10)}
                placeholder="Opcional" />
            </Fld>
          </Sec>

          <Sec title="4. Endereco residencial">
            <Fld label="CEP *">
              <input ref={registrar("cep")} style={inpStyle} value={paciente.cep}
                onKeyDown={enterProximo("cep")}
                onChange={(e) => up("cep", maskCEP(e.target.value), onlyDigits(e.target.value).length >= 8)}
                placeholder="58700-000" />
            </Fld>
            <Fld label="Tipo de logradouro">
              <select ref={registrar("tipoLogradouro")} style={selStyle} value={paciente.tipoLogradouro}
                onKeyDown={enterProximo("tipoLogradouro")}
                onChange={(e) => up("tipoLogradouro", e.target.value, true)}>
                <option value="">Selecionar...</option>
                <option>Rua</option><option>Avenida</option><option>Travessa</option>
                <option>Sitio</option><option>Fazenda</option><option>Rodovia</option>
                <option>Estrada</option><option>Outro</option>
              </select>
            </Fld>
            <Fld label="Logradouro *" full>
              <input ref={registrar("logradouro")} style={inpStyle} value={paciente.logradouro}
                onKeyDown={enterProximo("logradouro")}
                onChange={(e) => up("logradouro", e.target.value)}
                placeholder="Rua, avenida, sitio, fazenda..." />
            </Fld>
            <Fld label="Numero ou S/N *">
              <input ref={registrar("numero")} style={inpStyle} value={paciente.numero}
                onKeyDown={enterProximo("numero")}
                onChange={(e) => up("numero", e.target.value)}
                placeholder="S/N" />
            </Fld>
            <Fld label="Complemento">
              <input ref={registrar("complemento")} style={inpStyle} value={paciente.complemento}
                onKeyDown={enterProximo("complemento")}
                onChange={(e) => up("complemento", e.target.value)} />
            </Fld>
            <Fld label="Bairro *">
              <input ref={registrar("bairro")} style={inpStyle} value={paciente.bairro}
                onKeyDown={enterProximo("bairro")}
                onChange={(e) => up("bairro", e.target.value)} />
            </Fld>
            <Fld label="Cidade/municipio onde mora atualmente *">
              <input ref={registrar("municipio")} style={inpStyle} value={paciente.municipio}
                onKeyDown={enterProximo("municipio")}
                onChange={(e) => up("municipio", e.target.value)}
                placeholder="Ex.: Patos" />
            </Fld>
            <Fld label="Codigo IBGE do municipio">
              <input ref={registrar("codigoIbgeMunicipio")} style={inpStyle} value={paciente.codigoIbgeMunicipio}
                onKeyDown={enterProximo("codigoIbgeMunicipio")}
                onChange={(e) => up("codigoIbgeMunicipio", maskIBGE(e.target.value), true)}
                placeholder="Ex.: 2510808" maxLength={7} />
              <div style={{ fontSize: 10, marginTop: 2, color: SL }}>Opcional. A recepcao pode completar antes da APAC.</div>
            </Fld>
            <Fld label="UF *">
              <select ref={registrar("uf")} style={selStyle} value={paciente.uf}
                onKeyDown={enterProximo("uf")}
                onChange={(e) => up("uf", e.target.value, true)}>
                <option value="">UF</option>
                {UFS.map((uf) => <option key={uf}>{uf}</option>)}
              </select>
            </Fld>
            <Fld label="Zona urbana/rural">
              <select ref={registrar("zona")} style={selStyle} value={paciente.zona}
                onKeyDown={enterProximo("zona")}
                onChange={(e) => up("zona", e.target.value as Zona, true)}>
                <option value="">Selecionar...</option>
                <option value="urbana">Urbana</option>
                <option value="rural">Rural</option>
              </select>
            </Fld>
          </Sec>

          <Sec title="5. Conferencia">
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#F8FAFC", border: "1.5px solid #CBD5E1", borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}>
                <input type="checkbox" checked={paciente.confirmaVeracidade}
                  onChange={(e) => up("confirmaVeracidade", e.target.checked)}
                  style={{ marginTop: 2, flexShrink: 0, accentColor: N, width: 16, height: 16 }} />
                <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                  Confirmo que os dados foram informados pelo paciente/acompanhante e seguirao para revisao da recepcao antes da APAC.
                </span>
              </label>
            </div>
          </Sec>

          <div style={{ position: "sticky", bottom: 0, background: "#fff", borderRadius: 14, border: "1.5px solid #DDE3EC", padding: "14px 18px", boxShadow: "0 -4px 20px rgba(0,0,0,.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: N }}>
                {pendencias.length === 0 ? "Cadastro completo" : `${pendencias.length} pendencia(s)`}
              </div>
              <div style={{ fontSize: 11, color: SL, marginTop: 1 }}>
                {pendencias.length === 0 ? "Pronto para enviar a recepcao/APAC." : "Sera enviado para a recepcao completar as pendencias."}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={exportarJSON} style={btnGhostStyle}>
                Exportar JSON
              </button>
              <button type="submit" style={btnStyle(pendencias.length === 0 ? VE : G)}>
                {enviado ? "Enviado" : "Enviar para recepcao"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function MiniOk({ ok, textoOk, textoErro }: { ok: boolean; textoOk: string; textoErro: string }) {
  return (
    <div style={{ fontSize: 10, marginTop: 2, color: ok ? VE : "#EF4444" }}>
      {ok ? textoOk : textoErro}
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #DDE3EC", padding: "16px 20px", boxShadow: "0 1px 6px rgba(0,0,0,.04)" }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: N, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14, paddingBottom: 8, borderBottom: "2px solid #F1F5F9" }}>
        {title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
        {children}
      </div>
    </div>
  );
}

function Fld({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label style={{ gridColumn: full ? "1 / -1" : undefined, display: "block" }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: N, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function btnStyle(background: string): React.CSSProperties {
  return {
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
    background,
    color: "#fff",
    fontFamily: "inherit",
  };
}

const btnGhostStyle: React.CSSProperties = {
  border: "1.5px solid #CBD5E1",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 800,
  fontSize: 12,
  cursor: "pointer",
  background: "#fff",
  color: N,
  fontFamily: "inherit",
};
