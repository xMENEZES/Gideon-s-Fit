// Regras das mensagens de incentivo. Funções puras, testadas em incentive.test.ts.
import type { IncentiveEvent } from "@/lib/types/database.types";

// Eventos que o profissional pode personalizar. "streak" (sequência) existe no banco e entra
// na tela de mensagens junto com as sequências.
export const EDITABLE_EVENTS: IncentiveEvent[] = ["workout", "diet", "day"];

export const EVENT_LABELS: Record<IncentiveEvent, { title: string; hint: string }> = {
  workout: { title: "Treino concluído", hint: "Quando todos os exercícios do dia de treino foram registrados." },
  diet: { title: "Alimentação concluída", hint: "Quando todas as refeições do dia foram marcadas como feitas." },
  day: { title: "Dia completo", hint: "Quando o treino e a alimentação do dia foram concluídos." },
  streak: { title: "Sequência", hint: "Quando a pessoa alcança uma sequência de dias." },
};

export const MESSAGE_MIN = 3;
export const MESSAGE_MAX = 140;

type DayLike = {
  exercises?: { exercise_load_logs?: { logged_at: string }[] | null }[] | null;
};

// Treino concluído: em algum dia do protocolo, TODOS os exercícios têm registro na data
// (musculação ou cardio). Dia sem exercícios não conta.
export function workoutDayComplete(days: DayLike[] | null | undefined, date: string): boolean {
  return !!days?.some((day) => {
    const exercises = day.exercises ?? [];
    return (
      exercises.length > 0 &&
      exercises.every((exercise) => (exercise.exercise_load_logs ?? []).some((log) => log.logged_at === date))
    );
  });
}

type MealLike = { meal_logs?: { log_date: string; done: boolean }[] | null };

// Alimentação concluída: todas as refeições do protocolo marcadas como "fiz" na data.
export function dietDayComplete(meals: MealLike[] | null | undefined, date: string): boolean {
  if (!meals?.length) return false;
  return meals.every((meal) => (meal.meal_logs ?? []).some((log) => log.log_date === date && log.done));
}

export type DayProgress = { workout: boolean | null; diet: boolean | null };

// Qual mensagem mostrar na tela de um módulo: null = ainda não concluiu (ou o módulo não
// existe). Com treino e alimentação ambos concluídos, vale a de "dia completo".
export function eventFor(module: "workout" | "diet", progress: DayProgress): IncentiveEvent | null {
  const mine = module === "workout" ? progress.workout : progress.diet;
  if (!mine) return null;
  return progress.workout && progress.diet ? "day" : module;
}

type MessageLike = { owner_id: string | null; event: IncentiveEvent; body: string; active: boolean };

// Mensagens do evento que valem para quem consulta: as do profissional (se ele tiver alguma
// ativa para o evento) ou, caso contrário, as do sistema. `trainerId` nulo = plano próprio.
export function bodiesFor(messages: MessageLike[], event: IncentiveEvent, trainerId: string | null): string[] {
  const active = messages.filter((message) => message.event === event && message.active);
  const own = trainerId ? active.filter((message) => message.owner_id === trainerId) : [];
  const chosen = own.length > 0 ? own : active.filter((message) => message.owner_id === null);
  return chosen.map((message) => message.body);
}

// Escolha estável: a mesma pessoa vê a mesma frase no mesmo dia (não muda ao recarregar).
export function pickMessage(bodies: string[], seed: string): string | null {
  if (bodies.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return bodies[hash % bodies.length];
}

// Troca {nome} e {sequencia}. Sem valor, o trecho some (e os espaços sobrando também).
export function fillMessage(template: string, vars: { nome?: string; sequencia?: number }): string {
  const nome = vars.nome?.trim();
  return (nome ? template.replace(/\{nome\}/gi, nome) : template.replace(/\s*,?\s*\{nome\}/gi, ""))
    .replace(/\{sequencia\}/gi, vars.sequencia === undefined ? "" : String(vars.sequencia))
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/^[,\s]+/, "")
    .trim();
}

// Primeiro nome para o {nome}: apelido, se houver, senão a primeira palavra do nome completo.
export function firstName(fullName: string | null | undefined, nickname?: string | null): string {
  const nick = nickname?.trim();
  if (nick) return nick;
  return fullName?.trim().split(/\s+/)[0] ?? "";
}
