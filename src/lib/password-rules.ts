// Regras de senha do app (cadastro, definição e redefinição). Funções puras, testadas em
// password-rules.test.ts.
//
// Espelham a política configurada no Supabase Auth (letra maiúscula, letra minúscula, número e
// símbolo, com os mesmos conjuntos de caracteres do servidor) e acrescentam o tamanho e o
// bloqueio de senhas comuns. A validação do app só orienta a pessoa e evita uma ida ao servidor:
// quem manda é o servidor, porque o navegador pode ser contornado chamando a API direto.
// O login NÃO usa estas regras: quem já tem senha antiga e fraca precisa continuar entrando.

export const PASSWORD_MIN = 8;
// O servidor guarda a senha com bcrypt, que só lê os 72 primeiros bytes.
export const PASSWORD_MAX = 72;

// Os mesmos conjuntos do servidor: só letras ASCII contam como maiúscula e minúscula, e o
// símbolo é um destes caracteres.
const LOWER = /[a-z]/;
const UPPER = /[A-Z]/;
const DIGIT = /[0-9]/;
const SYMBOL = /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/;

export type PasswordRuleId = "length" | "lower" | "upper" | "digit" | "symbol";

export const PASSWORD_RULES: { id: PasswordRuleId; label: string; missing: string; test: (value: string) => boolean }[] = [
  { id: "length", label: `Pelo menos ${PASSWORD_MIN} caracteres`, missing: `${PASSWORD_MIN} caracteres`, test: (v) => v.length >= PASSWORD_MIN },
  { id: "lower", label: "Uma letra minúscula", missing: "letra minúscula", test: (v) => LOWER.test(v) },
  { id: "upper", label: "Uma letra maiúscula", missing: "letra maiúscula", test: (v) => UPPER.test(v) },
  { id: "digit", label: "Um número", missing: "número", test: (v) => DIGIT.test(v) },
  { id: "symbol", label: "Um símbolo (ex.: ! @ # $ %)", missing: "símbolo", test: (v) => SYMBOL.test(v) },
];

export function passwordChecks(value: string) {
  return PASSWORD_RULES.map((rule) => ({ id: rule.id, label: rule.label, ok: rule.test(value) }));
}

// Bases (só as letras, em minúsculas) de senhas muito usadas, em português e inglês. Pega também as
// variações com número e símbolo, como "Senha@123" ou "Password1!".
const COMMON_BASES = new Set([
  "password", "passwrd", "passw", "senha", "senhas", "senhasenha", "senhaforte", "minhasenha", "mudar", "mudarsenha", "trocar",
  "temporaria", "temp", "teste", "test", "qwerty", "qwertyuiop", "qwertyui", "asdfgh", "asdfghjkl", "zxcvbn", "abc", "abcd",
  "abcde", "abcdef", "abcdefg", "abcdefgh", "admin", "administrador", "root", "user", "usuario", "login", "welcome", "bemvindo",
  "letmein", "iloveyou", "teamo", "amor", "brasil", "brazil", "futebol", "flamengo", "corinthians", "palmeiras", "saopaulo",
  "santos", "vasco", "gremio", "cruzeiro", "monkey", "dragon", "football", "master", "academia", "treino", "fitness",
  "musculacao", "gideon", "gideons", "gideonfit", "gideonsfit",
]);

export function isCommonPassword(value: string): boolean {
  const base = value.toLowerCase().replace(/[^a-z]/g, "");
  if (!base) return false;
  if (COMMON_BASES.has(base)) return true;
  // uma letra só repetida ("aaaaaaaa")
  return base.length >= 4 && /^(.)\1+$/.test(base);
}

// A primeira coisa a corrigir na senha, em uma frase para a pessoa; nulo quando está tudo certo.
export function passwordProblem(value: string): string | null {
  if (value.length > PASSWORD_MAX) return `Use no máximo ${PASSWORD_MAX} caracteres.`;
  const missing = PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.missing);
  if (missing.length) return `A senha precisa de: ${missing.join(", ")}.`;
  if (isCommonPassword(value)) return "Essa senha é muito comum. Escolha outra, mais difícil de adivinhar.";
  return null;
}
