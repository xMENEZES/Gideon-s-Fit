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

// Cada dia do calendário tem dois círculos fixos: o da esquerda é o treino e o da direita a
// alimentação. Estado de cada um:
//   complete = verde (treino completo ou todas as refeições feitas)
//   partial  = amarelo (fez uma parte, não importa quanto faltou)
//   missed   = vermelho (nada feito)
//   rest     = azul (só no treino: dia de descanso marcado pela pessoa)
//   none     = só o contorno, sem avaliação (hoje, dia sem protocolo daquele tipo)
export type CircleState = "none" | "complete" | "partial" | "missed" | "rest";
export type DayMarks = { workout: CircleState; diet: CircleState };

export type DayMarksInput = {
  date: string;
  today: string;
  // O dia está dentro do período do protocolo de treino mostrado.
  inWorkoutRange: boolean;
  // Há exercício registrado no dia.
  trained: boolean;
  // Todos os exercícios de um mesmo dia do protocolo foram registrados (resultado diário do banco).
  workoutDone: boolean;
  // A pessoa marcou o dia como descanso.
  rest: boolean;
  mealDay: Pick<MealDayStatus, "total" | "done"> | undefined;
};

// A cor só vale depois que o dia termina: hoje (e qualquer data a partir dele) fica sem cor.
export function dayMarks(input: DayMarksInput): DayMarks {
  const { date, today, inWorkoutRange, trained, workoutDone, rest, mealDay } = input;
  if (date >= today) return { workout: "none", diet: "none" };

  let workout: CircleState = "none";
  if (inWorkoutRange) {
    if (trained) workout = workoutDone ? "complete" : "partial";
    else workout = rest ? "rest" : "missed";
  }

  let diet: CircleState = "none";
  if (mealDay && mealDay.total > 0) {
    if (mealDay.done >= mealDay.total) diet = "complete";
    else diet = mealDay.done > 0 ? "partial" : "missed";
  }
  return { workout, diet };
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
  selection: Selection | null,
  restDates: string[] = []
): { total: number; trained: number; rest: number; trainedDatesNewestFirst: string[] } {
  const inside = selection ? range.filter((date) => isInSelection(date, selection)) : range;
  const trainedDates = inside.filter((date) => (entriesByDate[date]?.length ?? 0) > 0);
  // Descanso só conta no dia em que não houve treino (se houve, vale o treino).
  const rest = inside.filter((date) => restDates.includes(date) && !trainedDates.includes(date));
  return {
    total: inside.length,
    trained: trainedDates.length,
    rest: rest.length,
    trainedDatesNewestFirst: [...trainedDates].sort().reverse(),
  };
}
