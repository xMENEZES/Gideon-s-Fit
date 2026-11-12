// Dados corporais ("Meus Dados" no Perfil): regras de idade, limites e cálculos. Funções puras,
// sem acesso a banco, para valer igual no formulário, no servidor e nos testes. As mesmas regras
// existem no banco (migração 0037), que é quem de fato barra o que não vale.

// Os dados são de saúde (LGPD): só para maiores de 18 anos, e a idade máxima evita datas absurdas.
export const MIN_AGE = 18;
export const MAX_AGE = 100;

export const HEIGHT_CM = { min: 100, max: 250 } as const;
export const WEIGHT_KG = { min: 30, max: 300 } as const;

type DateParts = { year: number; month: number; day: number };

// "YYYY-MM-DD" estrito: rejeita dia que não existe (31/02) em vez de "corrigir" para outra data.
function parseIsoDate(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Mesma regra do Postgres para "data - interval 'N years'": 29/02 vira 28/02 em ano não bissexto.
function shiftYears(date: DateParts, years: number): string {
  const year = date.year + years;
  const day = date.month === 2 && date.day === 29 && !isLeapYear(year) ? 28 : date.day;
  return `${pad(year, 4)}-${pad(date.month)}-${pad(day)}`;
}

export type BirthDateStatus = "ok" | "invalid" | "underage" | "too_old";

// Situação de uma data de nascimento em relação a "hoje" (ambas "YYYY-MM-DD", data de Brasília).
// Vale exatamente o que o banco aceita: a pessoa precisa ter feito 18 anos até hoje e ter até 100.
export function birthDateStatus(birthDate: string, today: string): BirthDateStatus {
  const birth = parseIsoDate(birthDate);
  const now = parseIsoDate(today);
  if (!birth || !now) return "invalid";
  // Comparação de texto "YYYY-MM-DD" equivale à comparação de datas.
  if (birthDate > shiftYears(now, -MIN_AGE)) return "underage";
  if (birthDate < shiftYears(now, -MAX_AGE)) return "too_old";
  return "ok";
}

// Idade completa em anos em "today"; null se alguma das datas for inválida.
export function ageOn(birthDate: string, today: string): number | null {
  const birth = parseIsoDate(birthDate);
  const now = parseIsoDate(today);
  if (!birth || !now) return null;
  const hadBirthday = now.month > birth.month || (now.month === birth.month && now.day >= birth.day);
  const age = now.year - birth.year - (hadBirthday ? 0 : 1);
  return age < 0 ? null : age;
}

// Limites para o campo de data do formulário (atributos min e max).
export function birthDateBounds(today: string): { min: string; max: string } | null {
  const now = parseIsoDate(today);
  if (!now) return null;
  return { min: shiftYears(now, -MAX_AGE), max: shiftYears(now, -MIN_AGE) };
}

// Aceita vírgula ou ponto como separador decimal ("72,5" ou "72.5"). Devolve null se não for número.
export function parseDecimal(raw: string): number | null {
  const text = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

// Peso na exibição: "72,5 kg" (vírgula, como o usuário escreve).
export function weightLabel(weightKg: number | string): string {
  return `${String(weightKg).replace(".", ",")} kg`;
}

// "dd/mm/aaaa" a partir de "YYYY-MM-DD" (sem passar por fuso horário).
export function formatBirthDate(birthDate: string): string {
  const parts = parseIsoDate(birthDate);
  return parts ? `${pad(parts.day)}/${pad(parts.month)}/${pad(parts.year, 4)}` : birthDate;
}
