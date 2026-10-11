// Sequências e selos (gamificação). Funções puras, testadas em streaks.test.ts.
//
// Regras (decididas com o usuário):
// - Treino: conta só os dias em que concluiu o treino; a sequência quebra no 3º dia seguido
//   sem treinar (dois dias de folga, como um fim de semana, não quebram).
// - Dieta: conta só os dias de dieta completa; quebra no 2º dia seguido incompleto (um dia
//   isolado, como a refeição livre, não quebra).
// - Treino + Dieta: conta os dias com os dois feitos; quebra quando qualquer uma das duas
//   sequências quebrar.
// - O dia de hoje ainda está em andamento: soma se já estiver concluído, mas nunca quebra.
import type { SealLine } from "@/lib/types/database.types";
import { addDays } from "@/lib/dates";

export const MILESTONES = [3, 7, 14, 30, 60, 100, 200] as const;
export const SEAL_LINES: SealLine[] = ["workout", "diet", "both"];

// Quantos dias seguidos sem cumprir quebram a sequência de cada linha.
const BREAK_AFTER = { workout: 3, diet: 2 } as const;

export type ScoreRow = { score_date: string; workout_done: boolean; diet_done: boolean };

export type LineStreak = {
  // Dias contados na sequência de agora (0 = quebrada ou ainda não começou).
  current: number;
  // Maior sequência já alcançada.
  best: number;
  // Marco -> primeira data em que a sequência chegou nele.
  reached: Partial<Record<number, string>>;
};

export type Streaks = Record<SealLine, LineStreak>;

function emptyLine(): LineStreak {
  return { current: 0, best: 0, reached: {} };
}

export function computeStreaks(rows: ScoreRow[], today: string): Streaks {
  const result: Streaks = { workout: emptyLine(), diet: emptyLine(), both: emptyLine() };
  if (rows.length === 0) return result;

  const byDate = new Map(rows.map((row) => [row.score_date, row]));
  const first = rows.reduce((min, row) => (row.score_date < min ? row.score_date : min), rows[0].score_date);
  if (first > today) return result;

  const run = { workout: 0, diet: 0, both: 0 };
  let missedWorkout = 0;
  let missedDiet = 0;

  const bump = (line: SealLine, date: string) => {
    run[line] += 1;
    const streak = result[line];
    if (run[line] > streak.best) streak.best = run[line];
    for (const milestone of MILESTONES) {
      if (run[line] >= milestone && streak.reached[milestone] === undefined) streak.reached[milestone] = date;
    }
  };

  for (let date = first; date <= today; date = addDays(date, 1)) {
    const row = byDate.get(date);
    const workout = !!row?.workout_done;
    const diet = !!row?.diet_done;
    const inProgress = date === today;

    if (workout) missedWorkout = 0;
    else if (!inProgress) missedWorkout += 1;
    if (diet) missedDiet = 0;
    else if (!inProgress) missedDiet += 1;

    // Quebras: valem para o treino, para a dieta e para o conjunto dos dois.
    const workoutBroken = missedWorkout >= BREAK_AFTER.workout;
    const dietBroken = missedDiet >= BREAK_AFTER.diet;
    if (workoutBroken) run.workout = 0;
    if (dietBroken) run.diet = 0;
    if (workoutBroken || dietBroken) run.both = 0;

    if (workout) bump("workout", date);
    if (diet) bump("diet", date);
    if (workout && diet) bump("both", date);
  }

  result.workout.current = run.workout;
  result.diet.current = run.diet;
  result.both.current = run.both;
  return result;
}

export type EarnedSeal = { line: SealLine; milestone: number };
export type SealToAward = EarnedSeal & { earned_on: string };

// Selos que a pessoa já alcançou e ainda não têm registro (o selo, uma vez conquistado, fica).
export function sealsToAward(streaks: Streaks, existing: EarnedSeal[]): SealToAward[] {
  const have = new Set(existing.map((seal) => `${seal.line}:${seal.milestone}`));
  const missing: SealToAward[] = [];
  for (const line of SEAL_LINES) {
    for (const milestone of MILESTONES) {
      const date = streaks[line].reached[milestone];
      if (date !== undefined && !have.has(`${line}:${milestone}`)) {
        missing.push({ line, milestone, earned_on: date });
      }
    }
  }
  return missing;
}
