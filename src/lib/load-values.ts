// Carga e repetições de um exercício conjugado: o aluno escreve mais de um valor, separados por
// "+" (ex.: "10 + 15" kg e "12 + 10" repetições). O primeiro valor continua nas colunas numéricas
// (gráfico, carga atual, dia treinado); o texto completo vai para weight_text / reps_text.

export const MAX_CONJUGATED_PARTS = 4;

export type ParsedLoadValue = {
  // Primeiro valor (vai para a coluna numérica).
  first: number;
  // Texto padronizado ("10 + 15"); nulo quando há um valor só.
  text: string | null;
};

// "10 + 15" -> {first: 10, text: "10 + 15"}; "20" -> {first: 20, text: null}.
// Aceita vírgula ou ponto decimal (cargas) e espaços livres. Repetições são só inteiros.
export function parseLoadValue(raw: string, kind: "weight" | "reps"): ParsedLoadValue | null {
  const parts = raw
    .split("+")
    .map((part) => part.trim().replace(",", "."));
  if (parts.length === 0 || parts.length > MAX_CONJUGATED_PARTS) return null;

  const pattern = kind === "weight" ? /^\d+(\.\d+)?$/ : /^\d+$/;
  if (!parts.every((part) => pattern.test(part))) return null;

  const numbers = parts.map(Number);
  if (numbers.some((value) => !Number.isFinite(value))) return null;
  if (kind === "weight" && numbers.some((value) => value > 9999)) return null;
  if (kind === "reps" && numbers.some((value) => value > 9999)) return null;

  return {
    first: numbers[0],
    text: numbers.length > 1 ? parts.join(" + ") : null,
  };
}

// Texto a mostrar: o conjugado ("10 + 15") ou o valor simples.
export function loadLabel(value: number | string | null, text: string | null | undefined): string {
  return text ?? String(value ?? "");
}
