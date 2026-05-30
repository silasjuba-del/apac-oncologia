#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const stagedOnly = args.has("--staged");
const trackedOnly = args.has("--tracked");
const historyMode = args.has("--history");

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  "uploads",
  "server/node_modules",
  "server/data",
  ".claude",
  ".netlify",
  ".vercel",
]);

const BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip", ".7z",
  ".gz", ".mp4", ".mov", ".avi", ".db", ".sqlite", ".woff", ".woff2",
]);

const PLACEHOLDER = /(\.\.\.|placeholder|example|your-|your_|sua[_ -]?chave|changeme|<[^>]+>|^$)/i;
const SAFE_ENV_REFERENCE = /^(?:\$\{|process\.env\.|import\.meta\.env\.|env\.|undefined|null)/i;

const RULES = [
  { name: "Anthropic API key", re: /sk-ant-[A-Za-z0-9_-]{40,}/g },
  { name: "OpenAI project key", re: /sk-proj-[A-Za-z0-9_-]{40,}/g },
  { name: "OpenAI API key", re: /(?<![A-Za-z0-9_-])sk-[A-Za-z0-9]{32,}/g },
  { name: "Google API key", re: /AIza[0-9A-Za-z_-]{30,}/g },
  { name: "GitHub token", re: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}/g },
  { name: "GitHub fine-grained token", re: /github_pat_[A-Za-z0-9_]{40,}/g },
  { name: "Private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/g },
  { name: "Google service account JSON", re: /"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----/g },
];

const ASSIGNMENT_RULES = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_API_KEY",
  "XAI_API_KEY",
  "GROK_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_SERVICE_ACCOUNT_JSON",
  "NPM_TOKEN",
];

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

function scanHistory() {
  const strictRe = [
    "sk-ant-[A-Za-z0-9_-]{40,}",
    "sk-proj-[A-Za-z0-9_-]{40,}",
    "(?<![A-Za-z0-9_-])sk-[A-Za-z0-9]{32,}",
    "AIza[0-9A-Za-z_-]{30,}",
    "(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}",
    "github_pat_[A-Za-z0-9_]{40,}",
  ].join("|");
  const commits = runGit(["rev-list", "--all"]).split(/\r?\n/).filter(Boolean);
  const hits = [];
  for (const commit of commits) {
    let out = "";
    try {
      out = runGit([
        "grep", "-I", "-n", "-E", strictRe, commit, "--",
        ":!node_modules", ":!server/node_modules", ":!dist", ":!coverage",
        ":!*.png", ":!*.jpg", ":!*.jpeg", ":!*.pdf", ":!*.zip",
      ]);
    } catch {
      continue;
    }
    for (const line of out.split(/\r?\n/).filter(Boolean)) {
      const parts = line.split(":");
      const file = parts[1] || "";
      if (file.replace(/\\/g, "/") === "scripts/scan-secrets.mjs") continue;
      const text = parts.slice(3).join(":");
      if (!PLACEHOLDER.test(text)) hits.push({ commit: commit.slice(0, 12), file, line: parts[2] });
    }
  }
  if (hits.length) {
    console.error("\nSECURITY BLOCK: possible secrets found in Git history.\n");
    hits.forEach(h => console.error(`- ${h.commit} ${h.file}:${h.line}`));
    console.error("\nRotate affected credentials; deleting a later file does not invalidate old exposed keys.\n");
    process.exit(1);
  }
  console.log(`History secret scan OK (${commits.length} commits checked).`);
  process.exit(0);
}

if (historyMode) scanHistory();

function listFiles() {
  if (stagedOnly) {
    return runGit(["diff", "--cached", "--name-only", "--diff-filter=ACMR"])
      .split(/\r?\n/)
      .filter(Boolean);
  }
  if (trackedOnly) {
    return runGit(["ls-files"])
      .split(/\r?\n/)
      .filter(Boolean);
  }
  return runGit(["ls-files", "--cached", "--others", "--exclude-standard"])
    .split(/\r?\n/)
    .filter(Boolean);
}

function isSkipped(file) {
  const normalized = file.replace(/\\/g, "/");
  const ext = path.extname(normalized).toLowerCase();
  if (BINARY_EXT.has(ext)) return true;
  return normalized.split("/").some((_, idx, parts) => SKIP_DIRS.has(parts.slice(0, idx + 1).join("/")));
}

function getContent(file) {
  if (stagedOnly) {
    try {
      return runGit(["show", `:${file}`]);
    } catch {
      return "";
    }
  }
  if (!existsSync(file)) return "";
  const st = statSync(file);
  if (st.size > 2_000_000) return "";
  return readFileSync(file, "utf8");
}

function mask(value) {
  const clean = String(value || "").trim();
  if (clean.length <= 10) return "***";
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

function findHits(file, content) {
  if (file.replace(/\\/g, "/") === "scripts/scan-secrets.mjs") return [];
  const hits = [];
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      for (const match of line.matchAll(rule.re)) {
        if (!PLACEHOLDER.test(match[0])) {
          hits.push({ file, line: idx + 1, rule: rule.name, sample: mask(match[0]) });
        }
      }
    }

    for (const key of ASSIGNMENT_RULES) {
      const re = new RegExp(`(?:^|\\s|["'])${key}\\s*[:=]\\s*["']?([^"'#\\s]+)`, "i");
      const m = line.match(re);
      if (!m) continue;
      const value = m[1] || "";
      if (value.length >= 20 && !PLACEHOLDER.test(value) && !SAFE_ENV_REFERENCE.test(value)) {
        hits.push({ file, line: idx + 1, rule: `${key} assignment`, sample: mask(value) });
      }
    }
  });
  return hits;
}

const files = listFiles().filter(f => !isSkipped(f));
const hits = files.flatMap(file => findHits(file, getContent(file)));

if (hits.length) {
  console.error("\nSECURITY BLOCK: possible secrets found. Remove/rotate before committing.\n");
  for (const h of hits) {
    console.error(`- ${h.file}:${h.line} ${h.rule} ${h.sample}`);
  }
  console.error("\nNo full secret was printed. If a real key was committed before, rotate it in the provider console.\n");
  process.exit(1);
}

console.log(`Secret scan OK (${files.length} files checked).`);
