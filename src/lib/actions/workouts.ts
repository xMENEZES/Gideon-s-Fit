"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateModule } from "@/lib/actions/revalidate";
import { quotaMessage } from "@/lib/quota";
import { todayBR } from "@/lib/dates";
import {
  workoutDaySchema,
  exerciseSchema,
  loadLogSchema,
  type WorkoutDayInput,
  type ExerciseInput,
  type LoadLogInput,
} from "@/lib/validations/workout.schema";

export async function createWorkoutDay(
  studentId: string,
  protocolId: string,
  input: WorkoutDayInput
) {
  const parsed = workoutDaySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("workout_days").insert({
    protocol_id: protocolId,
    name: parsed.data.name,
  });

  if (error) return { error: quotaMessage(error) ?? "Não foi possível criar o dia de treino." };

  revalidateModule(studentId, "treino");
  return { success: true };
}

export async function deleteWorkoutDay(studentId: string, workoutDayId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_days").delete().eq("id", workoutDayId);
  if (error) return { error: "Não foi possível remover o dia de treino." };

  revalidateModule(studentId, "treino");
  return { success: true };
}

export async function createExercise(
  studentId: string,
  workoutDayId: string,
  input: ExerciseInput
) {
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("exercises").insert({
    workout_day_id: workoutDayId,
    name: parsed.data.name,
    sets: parsed.data.sets,
    reps: parsed.data.reps,
    rest_seconds: parsed.data.restSeconds,
    recommended_load_kg: parsed.data.recommendedLoadKg ?? null,
    video_url: parsed.data.videoUrl || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { error: quotaMessage(error) ?? "Não foi possível adicionar o exercício." };

  revalidateModule(studentId, "treino");
  return { success: true };
}

export async function deleteExercise(studentId: string, exerciseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);
  if (error) return { error: "Não foi possível remover o exercício." };

  revalidateModule(studentId, "treino");
  return { success: true };
}

export async function updateWorkoutDay(
  studentId: string,
  workoutDayId: string,
  input: WorkoutDayInput
) {
  const parsed = workoutDaySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_days")
    .update({ name: parsed.data.name })
    .eq("id", workoutDayId)
    .select("id");

  if (error || !data?.length) return { error: "Não foi possível atualizar o dia de treino." };

  revalidateModule(studentId, "treino");
  return { success: true };
}

export async function updateExercise(
  studentId: string,
  exerciseId: string,
  input: ExerciseInput
) {
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .update({
      name: parsed.data.name,
      sets: parsed.data.sets,
      reps: parsed.data.reps,
      rest_seconds: parsed.data.restSeconds,
      recommended_load_kg: parsed.data.recommendedLoadKg ?? null,
      video_url: parsed.data.videoUrl || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", exerciseId)
    .select("id");

  if (error || !data?.length) return { error: "Não foi possível atualizar o exercício." };

  revalidateModule(studentId, "treino");
  return { success: true };
}

// Chamada pelo próprio aluno, na tela dele — registra o que ele realmente
// levantou naquele treino, construindo o histórico de carga do exercício.
export async function createLoadLog(
  studentId: string,
  exerciseId: string,
  input: LoadLogInput
) {
  const parsed = loadLogSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.from("exercise_load_logs").insert({
    exercise_id: exerciseId,
    weight_kg: parsed.data.weightKg,
    reps_done: parsed.data.repsDone ?? null,
    // Sem data escolhida, vale o dia de Brasília (o banco usa UTC e viraria o dia às 21h).
    logged_at: parsed.data.loggedAt || todayBR(),
    notes: parsed.data.notes || null,
    created_by: user.id,
  });

  if (error) return { error: "Não foi possível registrar a carga." };

  revalidateModule(studentId, "treino");
  return { success: true };
}
