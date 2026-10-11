import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, IncentiveEvent } from "@/lib/types/database.types";
import { bodiesFor, dietDayComplete, workoutDayComplete, type DayProgress } from "@/lib/incentive";

type Client = SupabaseClient<Database>;

// Como está o dia de hoje em cada módulo: true = concluído, false = em andamento,
// null = a pessoa não tem protocolo pronto naquele módulo. Duas consultas enxutas, só com
// os registros da data (os filtros dos recursos embutidos não eliminam os pais).
export async function loadDayProgress(supabase: Client, studentId: string, today: string): Promise<DayProgress> {
  const [workout, diet] = await Promise.all([
    supabase
      .from("protocols")
      .select("id, workout_days(id, exercises(id, exercise_load_logs(logged_at)))")
      .eq("student_id", studentId)
      .eq("type", "workout")
      .eq("is_active", true)
      .eq("workout_days.exercises.exercise_load_logs.logged_at", today)
      .maybeSingle(),
    supabase
      .from("protocols")
      .select("id, meals(id, meal_logs(log_date, done))")
      .eq("student_id", studentId)
      .eq("type", "diet")
      .eq("is_active", true)
      .eq("meals.meal_logs.log_date", today)
      .maybeSingle(),
  ]);

  type WorkoutShape = { workout_days?: Parameters<typeof workoutDayComplete>[0] };
  type DietShape = { meals?: Parameters<typeof dietDayComplete>[0] };
  const workoutDays = (workout.data as unknown as WorkoutShape | null)?.workout_days;
  const meals = (diet.data as unknown as DietShape | null)?.meals;

  const hasExercises = !!workoutDays?.some((day) => (day.exercises?.length ?? 0) > 0);
  const hasMeals = (meals?.length ?? 0) > 0;

  return {
    workout: hasExercises ? workoutDayComplete(workoutDays, today) : null,
    diet: hasMeals ? dietDayComplete(meals, today) : null,
  };
}

// Mensagens do evento que valem para quem consulta (as do profissional do time, se houver
// alguma ativa; senão as do sistema). O RLS já esconde as de outros profissionais.
export async function loadIncentiveBodies(
  supabase: Client,
  event: IncentiveEvent,
  trainerId: string | null
): Promise<string[]> {
  const { data } = await supabase
    .from("incentive_messages")
    .select("owner_id, event, body, active")
    .eq("event", event)
    .eq("active", true)
    .order("created_at", { ascending: true });
  return bodiesFor(data ?? [], event, trainerId);
}
