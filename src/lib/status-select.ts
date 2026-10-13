// Seleção de dia ou período no calendário do Status, calendário do mês e resumos da seleção.
// Funções puras, testadas em status-select.test.ts.
import { addDays } from "@/lib/dates";
import { MONTH_NAMES, formatDate, formatShort, weekday } from "@/lib/status-format";
import { summarizeMeals, type MealDayStatus, type MealStatus } from "@/lib/status";

// Um dia (from = to) ou um período (from < to). null = sem seleção.
export type Selection = { from: string; to: string };

// Toque num dia do calendário:
// - sem seleção: seleciona o dia;
// - com um dia selecionado: tocar nele limpa; tocar em outro seleciona o período entre os dois
//   (em qualquer ordem);
// - com um período selecionado: o toque recomeça, selecionando só aquele dia.
export function nextSelection(current: Selection | null, tapped: string): Selection | null {
  if (!current) return { from: tapped, to: tapped };
  if (current.from === current.to) {
    if (tapped === current.from) return null;
    return tapped < current.from ? { from: tapped, to: current.from } : { from: current.from, to: tapped };
  }
  return { from: tapped, to: tapped };
}

export function isInSelection(date: string, selection: Selection | null): boolean {
  return !!selection && date >= selection.from && date <= selection.to;
}

export function selectionKind(selection: Selection | null): "none" | "day" | "period" {
  if (!selection) return "none";
  return selection.from === selection.to ? "day" : "period";
}

// "ter, 13/10/2026" ou "09/10 a 13/10/2026 (5 dias)"
export function selectionLabel(selection: Selection): string {
  if (selection.from === selection.to) return `${weekday(selection.from)}, ${formatDate(selection.from)}`;
  let days = 1;
  for (let date = selection.from; date < selection.to; date = addDays(date, 1)) days += 1;
  return `${formatShort(selection.from)} a ${formatDate(selection.to)} (${days} dias)`;
}

// ---- Calendário do mês ("YYYY-MM") ----

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7);
}

// "2026-10" -> "Outubro de 2026"
export function monthLabel(month: string): string {
  const [year, number] = month.split("-").map(Number);
  const name = MONTH_NAMES[number - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`;
}

// Mantém o mês dentro do que existe de dados (do mês de `first` ao mês de `last`).
export function clampMonth(month: string, first: string, last: string): string {
  const min = monthOf(first);
  const max = monthOf(last);
  if (month < min) return min;
  if (month > max) return max;
  return month;
}

// Células do mês: nulos até o dia da semana do dia 1 (domingo = 0) e depois cada data.
export function monthCells(month: string): (string | null)[] {
  const [year, number] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: first.getUTCDay() }, () => null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(`${month}-${String(day).padStart(2, "0")}`);
  return cells;
}

// ---- Marcas de cada dia ----

export type DietMark = "complete" | "missed" | "pending" | "progress" | null;
export type DayMarks = { workout: boolean; diet: DietMark };

// Treino: houve registro no dia. Alimentação: todas feitas (complete), alguma "não fez"
// (missed), dia encerrado sem tudo marcado (pending) ou hoje ainda em andamento (progress).
export function dayMarks(
  trained: boolean,
  mealDay: Pick<MealDayStatus, "total" | "done" | "missed" | "inProgress"> | undefined
): DayMarks {
  let diet: DietMark = null;
  if (mealDay && mealDay.total > 0) {
    if (mealDay.done === mealDay.total) diet = "complete";
    else if (mealDay.inProgress) diet = "progress";
    else if (mealDay.missed.length > 0) diet = "missed";
    else diet = "pending";
  }
  return { workout: trained, diet };
}

// ---- Resumos da seleção (mesmas regras do Status inteiro) ----

export function mealDaysIn(days: MealDayStatus[], selection: Selection | null): MealDayStatus[] {
  return selection ? days.filter((day) => isInSelection(day.date, selection)) : days;
}

// Totais da alimentação para a seleção: só dias encerrados entram na conta.
export function summarizeMealSelection(days: MealDayStatus[], selection: Selection | null): MealStatus {
  const inside = mealDaysIn(days, selection);
  return summarizeMeals(inside, Math.max(0, ...days.map((day) => day.total)), false);
}

// Dias com refeição "não feita" (para listar os motivos), do mais novo para o mais antigo.
export function missedDaysNewestFirst(days: MealDayStatus[]): MealDayStatus[] {
  return days.filter((day) => day.missed.length > 0).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function summarizeWorkoutSelection(
  range: string[],
  entriesByDate: Record<string, unknown[]>,
  selection: Selection | null
): { total: number; trained: number; trainedDatesNewestFirst: string[] } {
  const inside = selection ? range.filter((date) => isInSelection(date, selection)) : range;
  const trainedDates = inside.filter((date) => (entriesByDate[date]?.length ?? 0) > 0);
  return {
    total: inside.length,
    trained: trainedDates.length,
    trainedDatesNewestFirst: [...trainedDates].sort().reverse(),
  };
}
