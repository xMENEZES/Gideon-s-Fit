import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { addDays } from "@/lib/dates";
import { formatCardioAmount } from "@/lib/cardio";

type Client = SupabaseClient<Database>;

export type ProtocolPeriod = {
  id: string;
  type: "workout" | "diet";
  start_date: string;
  end_date: string;
  is_active: boolean;
};

export type WorkoutEntry = {
  date: string;
  day: string;
  exercise: string;
  // Musculação registra carga; cardio registra duração e/ou distância (carga nula).
  weight_kg: number | null;
  reps_done: number | null;
  // Exercício conjugado: o texto completo ("10 + 15" e "12 + 10"); os numéricos guardam o primeiro valor.
  weight_text?: string | null;
  reps_text?: string | null;
  duration_minutes: number | null;
  distance_km: number | null;
};

// Um registro, sem o nome do exercício: "30 kg x 10" ou "32 min, 5 km".
export function describeWorkoutSet(entry: WorkoutEntry): string {
  if (entry.weight_kg != null) {
    const reps = entry.reps_text ?? entry.reps_done;
    return `${entry.weight_text ?? entry.weight_kg} kg${reps ? ` x ${reps}` : ""}`;
  }
  return formatCardioAmount(entry.duration_minutes, entry.distance_km);
}

// "Supino: 30 kg x 10" ou "Corrida: 32 min, 5 km".
export function describeWorkoutEntry(entry: WorkoutEntry): string {
  return `${entry.exercise}: ${describeWorkoutSet(entry)}`;
}

export type WorkoutDayGroup = { day: string; exercises: { name: string; sets: string[] }[] };

// Registros de um dia agrupados por dia do protocolo e por exercício, na ordem em que aparecem:
// cada exercício lista as suas séries ("30 kg x 10", "30 kg x 8"...).
export function groupWorkoutEntries(entries: WorkoutEntry[]): WorkoutDayGroup[] {
  const groups: WorkoutDayGroup[] = [];
  for (const entry of entries) {
    let group = groups.find((item) => item.day === entry.day);
    if (!group) {
      group = { day: entry.day, exercises: [] };
      groups.push(group);
    }
    let exercise = group.exercises.find((item) => item.name === entry.exercise);
    if (!exercise) {
      exercise = { name: entry.exercise, sets: [] };
      group.exercises.push(exercise);
    }
    exercise.sets.push(describeWorkoutSet(entry));
  }
  return groups;
}

export type MealRow = {
  id: string;
  name: string;
  logs: Map<string, { done: boolean; note: string | null }>;
};

const MAX_DAYS = 400;

// Todos os dias entre duas datas "YYYY-MM-DD", inclusive. Vazio se o fim vem antes do início.
export function daysBetween(start: string, end: string): string[] {
  const days: string[] = [];
  let current = start;
  while (current <= end && days.length < MAX_DAYS) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

// Protocolo ativo: vai até hoje (inclusive se estiver vencido e a pessoa seguir usando).
// Protocolo encerrado: vai até o fim previsto ou até o último registro, o que vier depois.
function periodEnd(period: ProtocolPeriod, today: string, lastActivity: string | null) {
  if (period.is_active) return today;
  return lastActivity && lastActivity > period.end_date ? lastActivity : period.end_date;
}

export async function loadWorkoutEntries(supabase: Client, protocolIds: string[]) {
  const byProtocol = new Map<string, WorkoutEntry[]>();
  if (!protocolIds.length) return byProtocol;

  const { data } = await supabase
    .from("workout_days")
    .select("protocol_id, name, exercises(name, exercise_load_logs(logged_at, weight_kg, weight_text, reps_done, reps_text, duration_minutes, distance_km))")
    .in("protocol_id", protocolIds);

  for (const day of data ?? []) {
    const entries = byProtocol.get(day.protocol_id) ?? [];
    for (const exercise of day.exercises ?? []) {
      for (const log of exercise.exercise_load_logs ?? []) {
        entries.push({
          date: log.logged_at,
          day: day.name,
          exercise: exercise.name,
          weight_kg: log.weight_kg == null ? null : Number(log.weight_kg),
          weight_text: log.weight_text,
          reps_done: log.reps_done,
          reps_text: log.reps_text,
          duration_minutes: log.duration_minutes,
          distance_km: log.distance_km == null ? null : Number(log.distance_km),
        });
      }
    }
    byProtocol.set(day.protocol_id, entries);
  }
  return byProtocol;
}

export async function loadMealRows(supabase: Client, protocolIds: string[]) {
  const byProtocol = new Map<string, MealRow[]>();
  if (!protocolIds.length) return byProtocol;

  const { data } = await supabase
    .from("meals")
    .select("id, protocol_id, name, meal_logs(log_date, done, note)")
    .in("protocol_id", protocolIds)
    .order("sort_order", { ascending: true });

  for (const meal of data ?? []) {
    const rows = byProtocol.get(meal.protocol_id) ?? [];
    rows.push({
      id: meal.id,
      name: meal.name,
      logs: new Map((meal.meal_logs ?? []).map((log) => [log.log_date, { done: log.done, note: log.note }])),
    });
    byProtocol.set(meal.protocol_id, rows);
  }
  return byProtocol;
}

export type WorkoutStatus = {
  range: string[];
  entriesByDate: Map<string, WorkoutEntry[]>;
  trainedCount: number;
  partial: boolean;
};

export function buildWorkoutStatus(
  period: ProtocolPeriod,
  today: string,
  entries: WorkoutEntry[]
): WorkoutStatus {
  const last = entries.reduce<string | null>((max, e) => (!max || e.date > max ? e.date : max), null);
  const range = daysBetween(period.start_date, periodEnd(period, today, last));
  const inRange = new Set(range);

  const entriesByDate = new Map<string, WorkoutEntry[]>();
  for (const entry of entries) {
    if (!inRange.has(entry.date)) continue;
    entriesByDate.set(entry.date, [...(entriesByDate.get(entry.date) ?? []), entry]);
  }

  return {
    range,
    entriesByDate,
    trainedCount: entriesByDate.size,
    partial: period.is_active && today <= period.end_date,
  };
}

// Situação de cada refeição no dia: feita, "não fez" (com a anotação) ou sem registro.
export type MealDayItem = { name: string; state: "done" | "missed" | "none"; note: string | null };

export type MealDayStatus = {
  date: string;
  total: number;
  done: number;
  missed: { meal: string; note: string | null }[];
  unmarked: number;
  // Cada refeição do dia, na ordem do protocolo (para mostrar o histórico do dia).
  meals: MealDayItem[];
  // Dia ainda em andamento (hoje): aparece na lista, mas só entra nos totais e na
  // porcentagem depois que o dia terminar.
  inProgress: boolean;
};

export type MealStatus = {
  days: MealDayStatus[];
  mealsPerDay: number;
  doneTotal: number;
  missedTotal: number;
  unmarkedTotal: number;
  expectedTotal: number;
  percent: number;
  // Quantos dias já encerrados entraram na conta (0 no primeiro dia de um protocolo novo).
  closedDays: number;
  partial: boolean;
};

function buildMealDay(date: string, today: string, meals: MealRow[]): MealDayStatus {
  const day: MealDayStatus = {
    date,
    total: meals.length,
    done: 0,
    missed: [],
    unmarked: 0,
    meals: [],
    inProgress: date >= today,
  };
  for (const meal of meals) {
    const log = meal.logs.get(date);
    if (!log) {
      day.unmarked += 1;
      day.meals.push({ name: meal.name, state: "none", note: null });
    } else if (log.done) {
      day.done += 1;
      day.meals.push({ name: meal.name, state: "done", note: null });
    } else {
      day.missed.push({ meal: meal.name, note: log.note });
      day.meals.push({ name: meal.name, state: "missed", note: log.note });
    }
  }
  return day;
}

// Totais e porcentagem consideram só os dias encerrados.
export function summarizeMeals(days: MealDayStatus[], mealsPerDay: number, partial: boolean): MealStatus {
  const closed = days.filter((day) => !day.inProgress);
  const doneTotal = closed.reduce((sum, day) => sum + day.done, 0);
  const missedTotal = closed.reduce((sum, day) => sum + day.missed.length, 0);
  const expectedTotal = closed.reduce((sum, day) => sum + day.total, 0);

  return {
    days,
    mealsPerDay,
    doneTotal,
    missedTotal,
    unmarkedTotal: expectedTotal - doneTotal - missedTotal,
    expectedTotal,
    percent: expectedTotal ? Math.round((doneTotal / expectedTotal) * 100) : 0,
    closedDays: closed.length,
    partial,
  };
}

export function buildMealStatus(period: ProtocolPeriod, today: string, meals: MealRow[]): MealStatus {
  let last: string | null = null;
  for (const meal of meals) {
    for (const date of meal.logs.keys()) if (!last || date > last) last = date;
  }
  const range = daysBetween(period.start_date, periodEnd(period, today, last));
  const days = range.map((date) => buildMealDay(date, today, meals));

  return summarizeMeals(days, meals.length, period.is_active && today <= period.end_date);
}

// ---- Intervalo livre de datas (pode atravessar protocolos) ----

export function clampRange(from: string, to: string, today: string) {
  const end = to > today ? today : to;
  const start = from > end ? end : from;
  return { from: start, to: end };
}

// Protocolo em vigor num dia: o que começou mais recentemente até aquela data.
function protocolInEffect(periods: ProtocolPeriod[], date: string) {
  let found: ProtocolPeriod | null = null;
  for (const period of periods) {
    if (period.start_date <= date && (!found || period.start_date > found.start_date)) {
      found = period;
    }
  }
  return found;
}

export function buildWorkoutRangeStatus(
  periods: ProtocolPeriod[],
  entriesByProtocol: Map<string, WorkoutEntry[]>,
  from: string,
  to: string
): WorkoutStatus {
  const range = daysBetween(from, to).filter((date) => protocolInEffect(periods, date));
  const inRange = new Set(range);

  const entriesByDate = new Map<string, WorkoutEntry[]>();
  for (const entries of entriesByProtocol.values()) {
    for (const entry of entries) {
      if (!inRange.has(entry.date)) continue;
      entriesByDate.set(entry.date, [...(entriesByDate.get(entry.date) ?? []), entry]);
    }
  }

  return { range, entriesByDate, trainedCount: entriesByDate.size, partial: false };
}

export function buildMealRangeStatus(
  periods: ProtocolPeriod[],
  mealsByProtocol: Map<string, MealRow[]>,
  from: string,
  to: string,
  today: string
): MealStatus {
  const days: MealDayStatus[] = [];

  for (const date of daysBetween(from, to)) {
    const period = protocolInEffect(periods, date);
    if (!period) continue;
    days.push(buildMealDay(date, today, mealsByProtocol.get(period.id) ?? []));
  }

  return summarizeMeals(days, Math.max(0, ...days.map((day) => day.total)), false);
}

// Lista do Status sem rolagem infinita: ficam à vista só os dias mais recentes e o resto vai
// para "Dias anteriores". `daysNewestFirst` já vem do mais novo para o mais antigo.
export function splitRecentDays<T>(daysNewestFirst: T[], visible: number): { recent: T[]; older: T[] } {
  const count = Math.max(visible, 0);
  return { recent: daysNewestFirst.slice(0, count), older: daysNewestFirst.slice(count) };
}

// Alimentação: o dia de hoje (em andamento) e o último dia encerrado. Sem dia em andamento (período
// que já terminou), só o último dia.
export function visibleMealDays(daysNewestFirst: { inProgress: boolean }[]): number {
  return daysNewestFirst[0]?.inProgress ? 2 : 1;
}

// Treino: os 2 últimos dias treinados.
export const VISIBLE_TRAINED_DAYS = 2;
