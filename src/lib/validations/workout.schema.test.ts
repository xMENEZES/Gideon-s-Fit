import { describe, expect, it } from "vitest";
import { cardioLogSchema, exerciseSchema, loadLogSchema } from "@/lib/validations/workout.schema";

function issues(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((i) => `${String(i.path[0])}: ${i.message}`) ?? []);
}

const strength = { name: "Supino reto", sets: "4", reps: "8-12", restSeconds: "60" };

describe("exerciseSchema: musculação", () => {
  it("aceita um exercício completo e assume kind=strength", () => {
    const result = exerciseSchema.safeParse(strength);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ kind: "strength", sets: 4, reps: "8-12", restSeconds: 60 });
    }
  });

  it("exige séries, repetições e descanso", () => {
    const result = exerciseSchema.safeParse({
      name: "Supino reto",
      kind: "strength",
      sets: "",
      reps: "",
      restSeconds: "",
    });
    expect(issues(result)).toEqual([
      "sets: Mínimo 1 série",
      "reps: Informe as repetições (ex: 8-12)",
      "restSeconds: Informe o descanso (mínimo 5 segundos)",
    ]);
  });

  it("exige o nome do exercício", () => {
    expect(issues(exerciseSchema.safeParse({ ...strength, name: "" }))).toEqual([
      "name: Informe o nome do exercício",
    ]);
    expect(issues(exerciseSchema.safeParse({ ...strength, name: " a " }))).toEqual([
      "name: Informe o nome do exercício",
    ]);
  });

  it("carga recomendada em branco vira 'sem carga' (e não 0)", () => {
    const blank = exerciseSchema.safeParse({ ...strength, recommendedLoadKg: "" });
    expect(blank.success && blank.data.recommendedLoadKg).toBeUndefined();
    const withLoad = exerciseSchema.safeParse({ ...strength, recommendedLoadKg: "12.5" });
    expect(withLoad.success && withLoad.data.recommendedLoadKg).toBe(12.5);
  });

  it("mantém os limites e a regra do link de vídeo", () => {
    expect(issues(exerciseSchema.safeParse({ ...strength, sets: "51" })).join()).toMatch(/sets/);
    expect(issues(exerciseSchema.safeParse({ ...strength, restSeconds: "4" }))).toContain(
      "restSeconds: Mínimo 5 segundos"
    );
    expect(exerciseSchema.safeParse({ ...strength, videoUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...strength, videoUrl: "https://youtu.be/dQw4w9WgXcQ" }).success).toBe(
      true
    );
    expect(exerciseSchema.safeParse({ ...strength, videoUrl: "" }).success).toBe(true);
  });
});

describe("exerciseSchema: cardio", () => {
  const base = { kind: "cardio", name: "Corrida" };

  it("aceita só duração", () => {
    const result = exerciseSchema.safeParse({ ...base, targetMinutes: "30" });
    expect(result.success && result.data.targetMinutes).toBe(30);
  });

  it("aceita só distância (com decimais)", () => {
    const result = exerciseSchema.safeParse({ ...base, targetDistanceKm: "5.5" });
    expect(result.success && result.data.targetDistanceKm).toBe(5.5);
  });

  it("aceita duração e distância juntas, sem séries nem repetições", () => {
    const result = exerciseSchema.safeParse({
      ...base,
      targetMinutes: "45",
      targetDistanceKm: "8",
      sets: "",
      reps: "",
      restSeconds: "",
    });
    expect(result.success).toBe(true);
  });

  it("exige a atividade", () => {
    expect(issues(exerciseSchema.safeParse({ ...base, name: "", targetMinutes: "30" }))).toEqual([
      "name: Escolha a atividade",
    ]);
  });

  it("recusa cardio sem nenhuma meta", () => {
    expect(issues(exerciseSchema.safeParse({ ...base, targetMinutes: "", targetDistanceKm: "" }))).toEqual([
      "targetMinutes: Informe a duração ou a distância",
    ]);
  });

  it("recusa metas fora dos limites", () => {
    expect(exerciseSchema.safeParse({ ...base, targetMinutes: "0" }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...base, targetMinutes: "1441" }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...base, targetDistanceKm: "0" }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...base, targetDistanceKm: "1001" }).success).toBe(false);
  });

  it("aceita os extremos válidos", () => {
    expect(exerciseSchema.safeParse({ ...base, targetMinutes: "1" }).success).toBe(true);
    expect(exerciseSchema.safeParse({ ...base, targetMinutes: "1440" }).success).toBe(true);
    expect(exerciseSchema.safeParse({ ...base, targetDistanceKm: "0.1" }).success).toBe(true);
    expect(exerciseSchema.safeParse({ ...base, targetDistanceKm: "1000" }).success).toBe(true);
  });
});

describe("loadLogSchema (musculação)", () => {
  it("exige a carga e aceita 0", () => {
    expect(loadLogSchema.safeParse({ weightKg: "20" }).success).toBe(true);
    expect(loadLogSchema.safeParse({ weightKg: "0" }).success).toBe(true);
  });

  it("aceita exercício conjugado (mais de um valor com +) na carga e nas repetições", () => {
    expect(loadLogSchema.safeParse({ weightKg: "10 + 15", repsDone: "12 + 10" }).success).toBe(true);
    expect(loadLogSchema.safeParse({ weightKg: "7,5+10" }).success).toBe(true);
    expect(loadLogSchema.safeParse({ weightKg: 20, repsDone: 10 }).success).toBe(true);
  });

  it("recusa carga e repetições que não são números", () => {
    expect(loadLogSchema.safeParse({ weightKg: "" }).success).toBe(false);
    expect(loadLogSchema.safeParse({ weightKg: "pesado" }).success).toBe(false);
    expect(loadLogSchema.safeParse({ weightKg: "10 + " }).success).toBe(false);
    expect(loadLogSchema.safeParse({ weightKg: "20", repsDone: "dez" }).success).toBe(false);
    expect(loadLogSchema.safeParse({ weightKg: "20", repsDone: "7,5" }).success).toBe(false);
  });

  it("ignora uma data enviada: o registro vale sempre para hoje", () => {
    const load = loadLogSchema.safeParse({ weightKg: "20", loggedAt: "2020-01-01" });
    expect(load.success && "loggedAt" in load.data).toBe(false);
    const cardio = cardioLogSchema.safeParse({ durationMinutes: "20", loggedAt: "2099-01-01" });
    expect(cardio.success && "loggedAt" in cardio.data).toBe(false);
  });
});

describe("cardioLogSchema (sessão de cardio)", () => {
  it("aceita duração, distância ou os dois", () => {
    expect(cardioLogSchema.safeParse({ durationMinutes: "32" }).success).toBe(true);
    expect(cardioLogSchema.safeParse({ distanceKm: "5" }).success).toBe(true);
    const both = cardioLogSchema.safeParse({ durationMinutes: "32", distanceKm: "5.2" });
    expect(both.success && both.data).toMatchObject({ durationMinutes: 32, distanceKm: 5.2 });
  });

  it("recusa sessão sem duração nem distância", () => {
    expect(issues(cardioLogSchema.safeParse({ durationMinutes: "", distanceKm: "" }))).toEqual([
      "durationMinutes: Informe a duração ou a distância",
    ]);
  });

  it("respeita os limites e o tamanho da observação", () => {
    expect(cardioLogSchema.safeParse({ durationMinutes: "0" }).success).toBe(false);
    expect(cardioLogSchema.safeParse({ distanceKm: "-1" }).success).toBe(false);
    expect(cardioLogSchema.safeParse({ durationMinutes: "10", notes: "x".repeat(501) }).success).toBe(false);
  });
});
