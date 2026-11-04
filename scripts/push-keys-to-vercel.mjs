// Grava as chaves VAPID (aviso por notificação push) nas variáveis de ambiente da Vercel, lendo-as
// dos arquivos locais que já as guardam. Rode no PowerShell, na pasta do projeto:
//
//   node scripts/push-keys-to-vercel.mjs
//
//   Preview    <- chaves de TESTES (.env.staging)
//   Production <- chaves de PRODUCAO (.env.prod.backup)
//
// As chaves não aparecem na tela: os valores vão por stdin e a saída é mascarada. A chave privada
// vai como "sensitive" (a Vercel não a mostra depois). Se uma variável já existir, o comando dela
// falha e o script para; apague a antiga no painel da Vercel e rode de novo.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NAMES = [
  { name: "NEXT_PUBLIC_VAPID_PUBLIC_KEY", sensitive: false },
  { name: "VAPID_PRIVATE_KEY", sensitive: true },
  { name: "VAPID_SUBJECT", sensitive: false },
];
const TARGETS = [
  { target: "preview", file: ".env.staging" },
  { target: "production", file: ".env.prod.backup" },
];

function load(file) {
  return Object.fromEntries(
    fs
      .readFileSync(path.join(ROOT, file), "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim().replace(/^"|"$/g, "")])
  );
}

for (const { target, file } of TARGETS) {
  const env = load(file);
  for (const { name, sensitive } of NAMES) {
    const value = env[name];
    if (!value) throw new Error(`${name} não está em ${file}`);
    const args = ["vercel", "env", "add", name, target];
    if (sensitive) args.push("--sensitive");
    args.push("--yes");
    const result = spawnSync("npx", args, { cwd: ROOT, input: value + "\n", encoding: "utf8", shell: true, timeout: 120000 });
    const mask = (text) => (text || "").split(value).join("***").trim();
    console.log(`${target} ${name}${sensitive ? " (sensitive)" : ""}: código ${result.status}`);
    if (result.status !== 0) {
      const out = (mask(result.stdout) + "\n" + mask(result.stderr)).split("\n").map((l) => l.trim()).filter((l) => l && !/npm warn/i.test(l));
      console.log(out.slice(0, 6).join("\n"));
      process.exit(result.status || 1);
    }
  }
}
console.log("Pronto: as chaves de testes (Preview) e de produção (Production) estão na Vercel.");
