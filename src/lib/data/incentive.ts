import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { SealLine } from "@/lib/types/database.types";
import { dietDayComplete, workoutDayComplete } from "@/lib/incentive";

// Consultas das telas do dia (mensagens de incentivo e selos). Todas têm cache por requisição
// (`cache` do React): a mesma consulta pedida por mais de um componente da mesma tela roda uma
// vez só, e a tela pode DISPARÁ-LAS cedo (warmDailyScreen), em paralelo com a consulta do
// protocolo, em vez de esperar a página carregar para só então começar. Erros viram valor
// vazio: o incentivo nunca derruba a tela.

// Selos já conquistados pelo plano (a celebração usa os de hoje; o ícone do topo, o maior de cada linha).
export const getEarnedSeals = cache(
  async (studentId: string): Promise<{ line: SealLine; milestone: number; earned_on: string }[]> => {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("achievements")
        .select("line, milestone, earned_on")
        .eq("student_id", studentId)
        .order("milestone", { ascending: true });
      return data ?? [];
    } catch {
      return [];
    }
  }
);

// Todas as mensagens de incentivo ativas que a pessoa pode ver (as do sistema e as do
// profissional do time); quem escolhe qual vale é bodiesFor (lib/incentive.ts).
export const getIncentiveMessages = cache(async () => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("incentive_messages")
      .select("owner_id, event, body, active")
      .eq("active", true)
      .order("created_at", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
});

// Treino de hoje concluído? true/false, ou null se a pessoa não tem treino pronto. Só os
// registros da data vêm do banco (os filtros dos recursos embutidos não eliminam os pais).
export const getWorkoutProgress = cache(async (studentId: string, today: string): Promise<boolean | null> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("protocols")
      .select("id, workout_days(id, exercises(id, exercise_load_logs(logged_at)))")
      .eq("student_id", studentId)
      .eq("type", "workout")
      .eq("is_active", true)
      .eq("workout_days.exercises.exercise_load_logs.logged_at", today)
      .maybeSingle();
    const days = (data as unknown as { workout_days?: Parameters<typeof workoutDayComplete>[0] } | null)
      ?.workout_days;
    const hasExercises = !!days?.some((day) => (day.exercises?.length ?? 0) > 0);
    return hasExercises ? workoutDayComplete(days, today) : null;
  } catch {
    return null;
  }
});

// Alimentação de hoje concluída? true/false, ou null se a pessoa não tem refeições.
export const getDietProgress = cache(async (studentId: string, today: string): Promise<boolean | null> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("protocols")
      .select("id, meals(id, meal_logs(log_date, done))")
      .eq("student_id", studentId)
      .eq("type", "diet")
      .eq("is_active", true)
      .eq("meals.meal_logs.log_date", today)
      .maybeSingle();
    const meals = (data as unknown as { meals?: Parameters<typeof dietDayComplete>[0] } | null)?.meals;
    return (meals?.length ?? 0) > 0 ? dietDayComplete(meals, today) : null;
  } catch {
    return null;
  }
});

// Dispara, sem esperar, o que o incentivo da tela vai precisar: selos, mensagens e o andamento
// do OUTRO módulo (o do próprio módulo a tela já calcula com os dados que carrega). Chamar
// logo que o aluno é conhecido faz essas consultas andarem junto com a do protocolo.
export function warmDailyScreen(studentId: string, today: string, module: "workout" | "diet") {
  void getEarnedSeals(studentId);
  void getIncentiveMessages();
  void (module === "workout" ? getDietProgress(studentId, today) : getWorkoutProgress(studentId, today));
}
