import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type { MealWithOptions } from "@/components/shared/meal-card";
import type { InitialMealLog } from "@/components/shared/diet-day-tracker";
import type { WorkoutDayWithExercises } from "@/components/shared/workout-day-card";

type Client = SupabaseClient<Database>;

export type ProtocolSummary = {
  id: string;
  start_date: string;
  end_date: string;
  notes: string | null;
};

// Protocolo de treino ativo com dias, exercícios e cargas numa única consulta
// (antes eram duas em sequência: protocolo e depois os dias).
export async function loadActiveWorkout(supabase: Client, studentId: string) {
  const { data, error } = await supabase
    .from("protocols")
    .select(
      "id, start_date, end_date, notes, workout_days(id, name, sort_order, exercises(id, name, sets, reps, rest_seconds, recommended_load_kg, video_url, notes, sort_order, exercise_load_logs(logged_at, weight_kg)))"
    )
    .eq("student_id", studentId)
    .eq("type", "workout")
    .eq("is_active", true)
    .order("sort_order", { referencedTable: "workout_days", ascending: true })
    .order("sort_order", { referencedTable: "workout_days.exercises", ascending: true })
    .maybeSingle();

  const { workout_days, ...protocol } = (data ?? {}) as Partial<ProtocolSummary> & {
    workout_days?: WorkoutDayWithExercises[];
  };

  return {
    protocol: data ? (protocol as ProtocolSummary) : null,
    days: data ? (workout_days ?? []) : null,
    failed: !!error,
  };
}

// Protocolo alimentar ativo com refeições, opções e alimentos numa única consulta.
// Com `logsFrom`/`logsTo`, traz também os registros de "fiz / não fiz" desse intervalo
// (usado nas telas de quem marca as refeições).
export async function loadActiveDiet(
  supabase: Client,
  studentId: string,
  logs?: { from: string; to: string }
) {
  const itemsSelect =
    "meal_options(id, label, sort_order, meal_items(id, food_name, quantity, unit, notes, sort_order))";

  const query = supabase
    .from("protocols")
    .select(
      logs
        ? `id, start_date, end_date, notes, meals(id, name, suggested_time, sort_order, ${itemsSelect}, meal_logs(log_date, done, note))`
        : `id, start_date, end_date, notes, meals(id, name, suggested_time, sort_order, ${itemsSelect})`
    )
    .eq("student_id", studentId)
    .eq("type", "diet")
    .eq("is_active", true)
    .order("sort_order", { referencedTable: "meals", ascending: true })
    .order("sort_order", { referencedTable: "meals.meal_options", ascending: true });

  const { data, error } = await (logs
    ? query
        .gte("meals.meal_logs.log_date", logs.from)
        .lte("meals.meal_logs.log_date", logs.to)
        .maybeSingle()
    : query.maybeSingle());

  type MealRow = MealWithOptions & {
    meal_logs?: { log_date: string; done: boolean; note: string | null }[];
  };
  const { meals: rawMeals, ...protocol } = (data ?? {}) as unknown as Partial<ProtocolSummary> & {
    meals?: MealRow[];
  };

  const mealRows = data ? (rawMeals ?? []) : null;
  const initialLogs: InitialMealLog[] = (mealRows ?? []).flatMap((meal) =>
    (meal.meal_logs ?? []).map((log) => ({ meal_id: meal.id, ...log }))
  );

  return {
    protocol: data ? (protocol as ProtocolSummary) : null,
    meals: mealRows as MealWithOptions[] | null,
    logs: initialLogs,
    failed: !!error,
  };
}
