import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { addDays } from "@/lib/dates";

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
  weight_kg: number;
  reps_done: number | null;
};

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
    .select("protocol_id, name, exercises(name, exercise_load_logs(logged_at, weight_kg, reps_done))")
    .in("protocol_id", protocolIds);

  for (const day of data ?? []) {
    const entries = byProtocol.get(day.protocol_id) ?? [];
    for (const exercise of day.exercises ?? []) {
      for (const log of exercise.exercise_load_logs ?? []) {
        entries.push({
          date: log.logged_at,
          day: day.name,
          exercise: exercise.name,
          weight_kg: Number(log.weight_kg),
          reps_done: log.reps_done,
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

export type MealDayStatus = {
  date: string;
  total: number;
  done: number;
  missed: { meal: string; note: string | null }[];
  unmarked: number;
};

export type MealStatus = {
  days: MealDayStatus[];
  mealsPerDay: number;
  doneTotal: number;
  missedTotal: number;
  unmarkedTotal: number;
  expectedTotal: number;
  percent: number;
  partial: boolean;
};

export function buildMealStatus(period: ProtocolPeriod, today: string, meals: MealRow[]): MealStatus {
  let last: string | null = null;
  for (const meal of meals) {
    for (const date of meal.logs.keys()) if (!last || date > last) last = date;
  }
  const range = daysBetween(period.start_date, periodEnd(period, today, last));

  let doneTotal = 0;
  let missedTotal = 0;
  const days = range.map<MealDayStatus>((date) => {
    const day: MealDayStatus = { date, total: meals.length, done: 0, missed: [], unmarked: 0 };
    for (const meal of meals) {
      const log = meal.logs.get(date);
      if (!log) day.unmarked += 1;
      else if (log.done) day.done += 1;
      else day.missed.push({ meal: meal.name, note: log.note });
    }
    doneTotal += day.done;
    missedTotal += day.missed.length;
    return day;
  });

  const expectedTotal = meals.length * range.length;
  return {
    days,
    mealsPerDay: meals.length,
    doneTotal,
    missedTotal,
    unmarkedTotal: expectedTotal - doneTotal - missedTotal,
    expectedTotal,
    percent: expectedTotal ? Math.round((doneTotal / expectedTotal) * 100) : 0,
    partial: period.is_active && today <= period.end_date,
  };
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
  to: string
): MealStatus {
  let doneTotal = 0;
  let missedTotal = 0;
  let expectedTotal = 0;
  const days: MealDayStatus[] = [];

  for (const date of daysBetween(from, to)) {
    const period = protocolInEffect(periods, date);
    if (!period) continue;
    const meals = mealsByProtocol.get(period.id) ?? [];

    const day: MealDayStatus = { date, total: meals.length, done: 0, missed: [], unmarked: 0 };
    for (const meal of meals) {
      const log = meal.logs.get(date);
      if (!log) day.unmarked += 1;
      else if (log.done) day.done += 1;
      else day.missed.push({ meal: meal.name, note: log.note });
    }
    doneTotal += day.done;
    missedTotal += day.missed.length;
    expectedTotal += meals.length;
    days.push(day);
  }

  return {
    days,
    mealsPerDay: Math.max(0, ...days.map((day) => day.total)),
    doneTotal,
    missedTotal,
    unmarkedTotal: expectedTotal - doneTotal - missedTotal,
    expectedTotal,
    percent: expectedTotal ? Math.round((doneTotal / expectedTotal) * 100) : 0,
    partial: false,
  };
}
