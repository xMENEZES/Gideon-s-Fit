// Regras da tela diária (treino e alimentação). Funções puras, testadas em today.test.ts.

type DayLike = {
  id: string;
  exercises?: { exercise_load_logs?: { logged_at: string }[] }[] | null;
};

// "Protocolo pronto" para a tela diária de treino: ao menos 1 exercício em algum dia.
export function hasWorkoutContent(days: DayLike[] | null | undefined): boolean {
  return !!days?.some((day) => (day.exercises?.length ?? 0) > 0);
}

// Para a alimentação: ao menos 1 refeição.
export function hasDietContent(meals: unknown[] | null | undefined): boolean {
  return (meals?.length ?? 0) > 0;
}

export type WorkoutDaySuggestion = {
  dayId: string | null;
  // today: já há carga registrada hoje nesse dia; next: o dia seguinte ao último treinado;
  // first: ainda não há nenhum registro (começa pelo primeiro dia).
  reason: "today" | "next" | "first" | "none";
  lastDayId: string | null;
  lastDate: string | null;
};

// Dia de treino sugerido para hoje:
// 1. se já há carga registrada hoje em algum dia, é esse (o último deles na ordem do protocolo);
// 2. senão, o dia seguinte ao último treinado (volta ao primeiro depois do último);
// 3. sem nenhum registro, o primeiro dia.
// Registros com data futura são ignorados. Em empate de datas, vale o dia mais adiante na ordem.
export function suggestWorkoutDay(days: DayLike[], today: string): WorkoutDaySuggestion {
  if (!days.length) return { dayId: null, reason: "none", lastDayId: null, lastDate: null };

  const lastLogByDay = days.map((day) => {
    let last: string | null = null;
    for (const exercise of day.exercises ?? []) {
      for (const log of exercise.exercise_load_logs ?? []) {
        if (log.logged_at <= today && (!last || log.logged_at > last)) last = log.logged_at;
      }
    }
    return last;
  });

  const todayIndex = lastLogByDay.lastIndexOf(today);
  if (todayIndex >= 0) {
    return { dayId: days[todayIndex].id, reason: "today", lastDayId: days[todayIndex].id, lastDate: today };
  }

  let lastDate: string | null = null;
  for (const date of lastLogByDay) if (date && (!lastDate || date > lastDate)) lastDate = date;

  if (!lastDate) return { dayId: days[0].id, reason: "first", lastDayId: null, lastDate: null };

  const lastIndex = lastLogByDay.lastIndexOf(lastDate);
  const next = days[(lastIndex + 1) % days.length];
  return { dayId: next.id, reason: "next", lastDayId: days[lastIndex].id, lastDate };
}

const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

export function weekdayName(iso: string): string {
  return WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()];
}

// Só a primeira letra em maiúscula ("sexta-feira" -> "Sexta-feira").
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "2026-10-09" -> "09/10"
export function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

// "2026-10-09" -> "09/10/2026"
export function fullDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

// Dias entre hoje e uma data (negativo se já passou). Sem fuso: trabalha só com datas.
export function daysUntil(date: string, today: string): number {
  const toUtc = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(date) - toUtc(today)) / 86_400_000);
}
