"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateModule } from "@/lib/actions/revalidate";
import { quotaMessage } from "@/lib/quota";
import { todayBR } from "@/lib/dates";
import { exerciseFields } from "@/lib/exercise-row";
import {
  workoutDaySchema,
  exerciseSchema,
  loadLogSchema,
  cardioLogSchema,
  type WorkoutDayInput,
  type ExerciseInput,
  type LoadLogInput,
  type CardioLogInput,
} from "@/lib/validations/workout.schema";

type Client = Awaited<ReturnType<typeof createClient>>;

// Tipo do exercício (as regras de acesso já limitam à pessoa dona do plano).
async function exerciseKind(supabase: Client, exerciseId: string) {
  const { data } = await supabase.from("exercises").select("kind").eq("id", exerciseId).maybeSingle();
  return data?.kind ?? null;
}

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
    kind: parsed.data.kind,
    ...exerciseFields(parsed.data),
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
    .update(exerciseFields(parsed.data))
    .eq("id", exerciseId)
    // O tipo não muda: só edita se o exercício for do mesmo tipo que o formulário enviou.
    .eq("kind", parsed.data.kind)
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

  const kind = await exerciseKind(supabase, exerciseId);
  if (!kind) return { error: "Exercício não encontrado." };
  if (kind !== "strength") return { error: "Este exercício é de cardio: registre a sessão." };

  const { error } = await supabase.from("exercise_load_logs").insert({
    exercise_id: exerciseId,
    weight_kg: parsed.data.weightKg,
    reps_done: parsed.data.repsDone ?? null,
    // Sempre hoje, no dia de Brasília (o banco usa UTC e viraria o dia às 21h). A data não vem
    // do cliente: o histórico de treino não aceita datas passadas nem futuras.
    logged_at: todayBR(),
    notes: parsed.data.notes || null,
    created_by: user.id,
  });

  if (error) return { error: "Não foi possível registrar a carga." };

  revalidateModule(studentId, "treino");
  return { success: true };
}

// Sessão de cardio realizada (duração e/ou distância), no histórico do exercício.
export async function createCardioLog(
  studentId: string,
  exerciseId: string,
  input: CardioLogInput
) {
  const parsed = cardioLogSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const kind = await exerciseKind(supabase, exerciseId);
  if (!kind) return { error: "Exercício não encontrado." };
  if (kind !== "cardio") return { error: "Este exercício é de musculação: registre a carga." };

  const { error } = await supabase.from("exercise_load_logs").insert({
    exercise_id: exerciseId,
    duration_minutes: parsed.data.durationMinutes ?? null,
    distance_km: parsed.data.distanceKm ?? null,
    // Sempre hoje, no dia de Brasília (o banco usa UTC e viraria o dia às 21h). A data não vem
    // do cliente: o histórico de treino não aceita datas passadas nem futuras.
    logged_at: todayBR(),
    notes: parsed.data.notes || null,
    created_by: user.id,
  });

  if (error) return { error: "Não foi possível registrar a sessão." };

  revalidateModule(studentId, "treino");
  return { success: true };
}
