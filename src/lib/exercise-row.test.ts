import { describe, expect, it } from "vitest";
import { exerciseFields } from "@/lib/exercise-row";
import { exerciseSchema } from "@/lib/validations/workout.schema";

function parse(input: Record<string, unknown>) {
  const result = exerciseSchema.safeParse(input);
  if (!result.success) throw new Error(result.error.issues[0]?.message);
  return result.data;
}

describe("exerciseFields", () => {
  it("musculação: grava séries, repetições, descanso e carga; sem metas de cardio", () => {
    const fields = exerciseFields(
      parse({ name: "Supino", sets: "4", reps: "8-12", restSeconds: "90", recommendedLoadKg: "20", notes: "devagar" })
    );
    expect(fields).toEqual({
      name: "Supino",
      video_url: null,
      notes: "devagar",
      sets: 4,
      reps: "8-12",
      rest_seconds: 90,
      recommended_load_kg: 20,
      target_minutes: null,
      target_distance_km: null,
    });
  });

  it("cardio: grava só as metas; sem séries, repetições, descanso nem carga", () => {
    const fields = exerciseFields(
      parse({ kind: "cardio", name: "Corrida", targetMinutes: "30", targetDistanceKm: "5", sets: "3", reps: "10", restSeconds: "60" })
    );
    expect(fields).toEqual({
      name: "Corrida",
      video_url: null,
      notes: null,
      sets: null,
      reps: null,
      recommended_load_kg: null,
      target_minutes: 30,
      target_distance_km: 5,
    });
    expect("rest_seconds" in fields).toBe(false);
  });

  it("cardio só com distância deixa os minutos nulos", () => {
    const fields = exerciseFields(parse({ kind: "cardio", name: "Bicicleta", targetDistanceKm: "12.5" }));
    expect(fields).toMatchObject({ target_minutes: null, target_distance_km: 12.5 });
  });

  it("link de vídeo e observações em branco viram nulos", () => {
    const fields = exerciseFields(parse({ name: "Remada", sets: "3", reps: "10", restSeconds: "60", videoUrl: "", notes: "" }));
    expect(fields).toMatchObject({ video_url: null, notes: null });
  });
});
