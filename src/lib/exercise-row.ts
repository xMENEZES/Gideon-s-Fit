import type { ExerciseInput } from "@/lib/validations/workout.schema";

// Campos do exercício que vão para o banco, conforme o tipo. Cardio não guarda séries,
// repetições, descanso nem carga; musculação não guarda metas de duração e distância.
// O tipo (`kind`) não entra aqui: ele é gravado só na criação e nunca muda.
export function exerciseFields(data: ExerciseInput) {
  const common = {
    name: data.name,
    video_url: data.videoUrl || null,
    notes: data.notes || null,
  };

  if (data.kind === "cardio") {
    return {
      ...common,
      sets: null,
      reps: null,
      recommended_load_kg: null,
      target_minutes: data.targetMinutes ?? null,
      target_distance_km: data.targetDistanceKm ?? null,
    };
  }

  return {
    ...common,
    sets: data.sets ?? null,
    reps: data.reps ?? null,
    rest_seconds: data.restSeconds,
    recommended_load_kg: data.recommendedLoadKg ?? null,
    target_minutes: null,
    target_distance_km: null,
  };
}
