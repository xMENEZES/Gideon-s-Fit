import { describe, expect, it } from "vitest";
import {
  EXPERIENCE_OPTIONS,
  generatorAnswersSchema,
  MAX_PROTOCOL_NOTES,
  planDates,
  planNotes,
  toGeneratorInput,
  workoutPayload,
  type GeneratorAnswers,
} from "./answers";
import { generateWorkoutPlan } from "./generate";
import { GOALS, isVeryNew, levelFromExperience, LOCATIONS, type Goal } from "./rules";

const TODAY = "2026-11-12";
const body = { birthDate: "1990-05-10", heightCm: 175, weightKg: 72.5 };
const valid: GeneratorAnswers = {
  experience: "6_a_12_meses",
  daysPerWeek: 3,
  goal: "ganhar_massa",
  location: "academia",
  limitations: [],
  seed: 0,
};
const messages = (input: unknown) => {
  const result = generatorAnswersSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("generatorAnswersSchema", () => {
  it("aceita respostas válidas", () => {
    expect(generatorAnswersSchema.safeParse(valid).success).toBe(true);
    expect(generatorAnswersSchema.safeParse({ ...valid, limitations: ["joelho", "coluna"], daysPerWeek: 6 }).success).toBe(true);
  });

  it("limites de dias por semana (2 a 6, inteiro)", () => {
    expect(messages({ ...valid, daysPerWeek: 1 })).toContain("Escolha de 2 a 6 dias por semana");
    expect(messages({ ...valid, daysPerWeek: 7 })).toContain("Escolha de 2 a 6 dias por semana");
    expect(messages({ ...valid, daysPerWeek: 3.5 })).toContain("Escolha os dias por semana");
    expect(messages({ ...valid, daysPerWeek: "3" })).toContain("Escolha os dias por semana");
    expect(generatorAnswersSchema.safeParse({ ...valid, daysPerWeek: 2 }).success).toBe(true);
    expect(generatorAnswersSchema.safeParse({ ...valid, daysPerWeek: 6 }).success).toBe(true);
  });

  it("recusa experiência, objetivo, local e dores que não existem", () => {
    expect(messages({ ...valid, experience: "um_dia" })).toContain("Escolha há quanto tempo você treina");
    expect(messages({ ...valid, goal: "voar" })).toContain("Escolha o seu objetivo");
    expect(messages({ ...valid, location: "lua" })).toContain("Escolha onde você treina");
    expect(messages({ ...valid, limitations: ["pescoço"] })).toContain("Dor ou lesão: escolha entre joelho, ombro e coluna");
    expect(messages({ ...valid, limitations: ["joelho", "joelho"] })).toContain("Dor ou lesão repetida");
    expect(messages({ ...valid, limitations: ["joelho", "ombro", "coluna", "joelho"] }).length).toBeGreaterThan(0);
  });

  it("a semente é um inteiro de 0 até 2.147.483.647", () => {
    expect(generatorAnswersSchema.safeParse({ ...valid, seed: -1 }).success).toBe(false);
    expect(generatorAnswersSchema.safeParse({ ...valid, seed: 1.5 }).success).toBe(false);
    expect(generatorAnswersSchema.safeParse({ ...valid, seed: 2_147_483_648 }).success).toBe(false);
    expect(generatorAnswersSchema.safeParse({ ...valid, seed: 2_147_483_647 }).success).toBe(true);
  });

  it("exige todos os campos", () => {
    expect(generatorAnswersSchema.safeParse({}).success).toBe(false);
    expect(generatorAnswersSchema.safeParse({ ...valid, seed: undefined }).success).toBe(false);
  });
});

describe("faixas de experiência", () => {
  const levelOf = (value: string) => {
    const option = EXPERIENCE_OPTIONS.find((o) => o.value === value)!;
    return levelFromExperience(option.trainedBefore, option.months);
  };

  it("viram o nível certo", () => {
    expect(levelOf("nunca")).toBe("iniciante");
    expect(levelOf("menos_3_meses")).toBe("iniciante");
    expect(levelOf("3_a_6_meses")).toBe("iniciante");
    expect(levelOf("6_a_12_meses")).toBe("intermediario");
    expect(levelOf("1_a_2_anos")).toBe("intermediario");
    expect(levelOf("mais_2_anos")).toBe("avancado");
  });

  it("só quem nunca treinou ou treina há menos de 3 meses é 'muito novo'", () => {
    const veryNew = (value: string) => {
      const option = EXPERIENCE_OPTIONS.find((o) => o.value === value)!;
      return isVeryNew(option.trainedBefore, option.months);
    };
    expect(veryNew("nunca")).toBe(true);
    expect(veryNew("menos_3_meses")).toBe(true);
    expect(veryNew("3_a_6_meses")).toBe(false);
  });
});

describe("toGeneratorInput", () => {
  it("junta as respostas com os dados de Meus Dados", () => {
    expect(toGeneratorInput({ ...valid, limitations: ["ombro"], seed: 4 }, body)).toEqual({
      ...body,
      trainedBefore: true,
      trainingMonths: 9,
      daysPerWeek: 3,
      goal: "ganhar_massa",
      location: "academia",
      limitations: ["ombro"],
      seed: 4,
    });
  });

  it("quem nunca treinou não leva meses", () => {
    const input = toGeneratorInput({ ...valid, experience: "nunca" }, body);
    expect(input.trainedBefore).toBe(false);
    expect(input.trainingMonths).toBeUndefined();
  });
});

describe("planDates", () => {
  it("o treino dura 8 semanas (56 dias)", () => {
    expect(planDates("2026-11-12")).toEqual({ startDate: "2026-11-12", endDate: "2027-01-07" });
    expect(planDates("2028-01-10").endDate).toBe("2028-03-06"); // atravessa fevereiro de ano bissexto
  });
});

describe("o que vai para o banco", () => {
  const plan = generateWorkoutPlan(
    { ...toGeneratorInput({ ...valid, goal: "emagrecer", daysPerWeek: 4 }, body), seed: 3 },
    TODAY
  );

  it("traz nome do dia e exercícios, sem nenhum descanso", () => {
    const payload = workoutPayload(plan);
    expect(payload).toHaveLength(plan.days.length);
    expect(payload[0].name).toBe(plan.days[0].name);
    for (const day of payload) {
      for (const exercise of day.exercises) {
        expect(Object.keys(exercise).some((key) => /rest|descanso/i.test(key))).toBe(false);
        if (exercise.kind === "strength") {
          expect(Object.keys(exercise).sort()).toEqual(["kind", "name", "reps", "sets"]);
        } else {
          expect(Object.keys(exercise).sort()).toEqual(["kind", "name", "notes", "targetMinutes"]);
        }
      }
    }
    // O cardio entra no fim de alguns dias.
    expect(payload.flatMap((d) => d.exercises).filter((e) => e.kind === "cardio")).toHaveLength(3);
  });

  it("é JSON puro (serializa sem perder nada)", () => {
    expect(JSON.parse(JSON.stringify(workoutPayload(plan)))).toEqual(workoutPayload(plan));
  });

  it("as observações trazem o aviso principal e cabem no limite do banco, em qualquer resposta", () => {
    expect(planNotes(plan).startsWith("Este treino é uma sugestão automática")).toBe(true);
    let longest = 0;
    for (const goal of GOALS as readonly Goal[])
      for (const location of LOCATIONS)
        for (const limitations of [[], ["joelho", "ombro", "coluna"] as const])
          for (const experience of ["nunca", "mais_2_anos"] as const)
            for (const birthDate of ["1990-05-10", "1950-01-01"]) {
              const input = toGeneratorInput(
                { ...valid, goal, location, limitations: [...limitations], experience, daysPerWeek: 6 },
                { ...body, birthDate, weightKg: 120 }
              );
              const notes = planNotes(generateWorkoutPlan(input, TODAY));
              longest = Math.max(longest, notes.length);
              expect(notes.length).toBeLessThanOrEqual(MAX_PROTOCOL_NOTES);
            }
    expect(longest).toBeGreaterThan(300);
  });

  it("corta os avisos que não cabem, sempre mantendo os primeiros inteiros", () => {
    const cut = planNotes({ level: "iniciante", age: 30, days: [], notes: ["a".repeat(1500), "b".repeat(1500), "c"] });
    expect(cut).toBe("a".repeat(1500));
    expect(planNotes({ level: "iniciante", age: 30, days: [], notes: ["um", "dois"] })).toBe("um\n\ndois");
  });
});
