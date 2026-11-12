import { describe, expect, it } from "vitest";
import { GENERATOR_EXERCISES, type Joint } from "./catalog";
import { generateWorkoutPlan, type GeneratedPlan } from "./generate";
import {
  CARDIO_SESSIONS,
  GeneratorInputError,
  GOALS,
  levelFromExperience,
  levelIndex,
  LOCATION_RULES,
  LOCATIONS,
  MAX_STRENGTH_DAYS,
  type GeneratorInput,
} from "./rules";

const TODAY = "2026-11-12";

const base: GeneratorInput = {
  birthDate: "1990-05-10", // 36 anos
  heightCm: 175,
  weightKg: 75,
  trainedBefore: false,
  daysPerWeek: 3,
  goal: "ganhar_massa",
  location: "academia",
  limitations: [],
  seed: 1,
};

const make = (over: Partial<GeneratorInput> = {}): GeneratedPlan => generateWorkoutPlan({ ...base, ...over }, TODAY);
const byName = new Map(GENERATOR_EXERCISES.map((e) => [e.name, e]));
const strength = (plan: GeneratedPlan) =>
  plan.days.flatMap((day) => day.exercises.filter((e) => e.kind === "strength"));
const cardio = (plan: GeneratedPlan) => plan.days.flatMap((day) => day.exercises.filter((e) => e.kind === "cardio"));

describe("generateWorkoutPlan: entradas", () => {
  it("recusa menor de 18 anos, com a mensagem certa", () => {
    expect(() => make({ birthDate: "2008-11-13" })).toThrow(GeneratorInputError);
    expect(() => make({ birthDate: "2008-11-13" })).toThrow("só para maiores de 18 anos");
  });

  it("recusa respostas inválidas", () => {
    expect(() => make({ daysPerWeek: 7 })).toThrow(GeneratorInputError);
    expect(() => make({ heightCm: 50 })).toThrow(GeneratorInputError);
    expect(() => make({ trainedBefore: true, trainingMonths: undefined })).toThrow(GeneratorInputError);
  });

  it("aceita exatamente 18 anos", () => {
    expect(() => make({ birthDate: "2008-11-12" })).not.toThrow();
  });
});

describe("generateWorkoutPlan: determinismo", () => {
  it("as mesmas respostas e a mesma semente dão o mesmo treino", () => {
    expect(make({ seed: 5 })).toEqual(make({ seed: 5 }));
  });

  it("sementes diferentes dão variações (ao menos uma muda o treino)", () => {
    const plans = [1, 2, 3, 4, 5, 6].map((seed) => JSON.stringify(make({ seed })));
    expect(new Set(plans).size).toBeGreaterThan(1);
  });

  it("sem semente, usa a semente 0 (resultado estável)", () => {
    const withoutSeed = generateWorkoutPlan({ ...base, seed: undefined }, TODAY);
    const withZero = generateWorkoutPlan({ ...base, seed: 0 }, TODAY);
    expect(withoutSeed).toEqual(withZero);
  });
});

describe("generateWorkoutPlan: cenários", () => {
  it("nunca inclui descanso entre as séries (fica por conta de quem treina)", () => {
    const plan = make({ daysPerWeek: 5, goal: "emagrecer", trainedBefore: true, trainingMonths: 30 });
    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        expect(Object.keys(exercise).some((key) => /rest|descanso/i.test(key))).toBe(false);
      }
    }
    expect(plan.notes.join(" ")).toContain("Descanso entre as séries: ajuste pelo que você sentir");
  });

  it("sempre traz o aviso de que não substitui um profissional", () => {
    expect(make().notes[0]).toContain("não substitui a avaliação de um profissional");
  });

  it("iniciante com 3 dias: corpo inteiro A, B e C, cada dia com 6 exercícios", () => {
    const plan = make();
    expect(plan.level).toBe("iniciante");
    expect(plan.days.map((d) => d.name)).toEqual(["A - Corpo inteiro", "B - Corpo inteiro", "C - Corpo inteiro"]);
    for (const day of plan.days) expect(day.exercises).toHaveLength(6);
  });

  it("quem nunca treinou ou treina há menos de 3 meses recebe o aviso de adaptação", () => {
    expect(make().notes.join(" ")).toContain("Nas duas primeiras semanas");
    expect(make({ trainedBefore: true, trainingMonths: 2 }).notes.join(" ")).toContain("Nas duas primeiras semanas");
    expect(make({ trainedBefore: true, trainingMonths: 3 }).notes.join(" ")).not.toContain("Nas duas primeiras semanas");
  });

  it("limita os dias de força pelo nível e avisa", () => {
    const beginner = make({ daysPerWeek: 6 });
    expect(beginner.days).toHaveLength(4);
    expect(beginner.notes.join(" ")).toContain("no máximo 4 dias por semana");
    const advanced = make({ daysPerWeek: 6, trainedBefore: true, trainingMonths: 36 });
    expect(advanced.days).toHaveLength(6);
    expect(advanced.notes.join(" ")).not.toContain("no máximo");
  });

  it("séries e repetições seguem o objetivo", () => {
    const plan = (goal: GeneratorInput["goal"]) =>
      make({ goal, trainedBefore: true, trainingMonths: 12, daysPerWeek: 4 });
    const firstSquat = (p: GeneratedPlan) => strength(p).find((e) => byName.get(e.name)?.pattern === "agachar")!;
    expect(firstSquat(plan("ganhar_massa"))).toMatchObject({ sets: 3, reps: "8-12" });
    expect(firstSquat(plan("emagrecer"))).toMatchObject({ sets: 3, reps: "12-15" });
  });

  it("cardio: ganhar massa não tem; emagrecer tem 3 sessões; condicionamento tem 2", () => {
    expect(cardio(make({ goal: "ganhar_massa" }))).toHaveLength(0);
    expect(cardio(make({ goal: "emagrecer" }))).toHaveLength(3);
    expect(cardio(make({ goal: "condicionamento" }))).toHaveLength(2);
    const sessions = cardio(make({ goal: "emagrecer", daysPerWeek: 2 }));
    expect(sessions).toHaveLength(2); // nunca mais sessões que dias
    for (const session of sessions) {
      expect(session).toMatchObject({ kind: "cardio", targetMinutes: 20 });
      expect((session as { notes: string }).notes).toMatch(/entre \d+ e \d+ bpm/);
    }
  });

  it("impacto a evitar (IMC 30 ou mais, ou 60 anos): sem corrida e com aviso", () => {
    const heavy = make({ heightCm: 170, weightKg: 100, goal: "emagrecer", trainedBefore: true, trainingMonths: 36, seed: 3 });
    expect(cardio(heavy).map((c) => c.name)).not.toContain("Corrida");
    expect(heavy.notes.join(" ")).toContain("impacto");
    const senior = make({ birthDate: "1960-01-01", goal: "emagrecer", trainedBefore: true, trainingMonths: 36 });
    expect(cardio(senior).map((c) => c.name)).not.toContain("Corrida");
    expect(senior.notes.join(" ")).toContain("conversar com um médico");
  });

  it("a partir de 60 anos nenhum exercício é de nível avançado, mesmo para quem é avançado", () => {
    const plan = make({ birthDate: "1960-01-01", trainedBefore: true, trainingMonths: 60, daysPerWeek: 6, seed: 9 });
    expect(plan.level).toBe("avancado");
    for (const e of strength(plan)) expect(byName.get(e.name)!.minLevel).not.toBe("avancado");
  });

  it("dor no joelho: nenhum exercício que sobrecarrega o joelho, e sem corrida", () => {
    const plan = make({ limitations: ["joelho"], goal: "emagrecer", trainedBefore: true, trainingMonths: 36, seed: 4 });
    for (const e of strength(plan)) expect(byName.get(e.name)!.joints).not.toContain("joelho");
    expect(cardio(plan).map((c) => c.name)).not.toContain("Corrida");
    expect(plan.notes.join(" ")).toContain("joelho");
  });

  it("em casa sem equipamento: só peso do corpo, e avisa que falta exercício de puxar", () => {
    const plan = make({ location: "casa_sem_equipamento" });
    for (const e of strength(plan)) expect(byName.get(e.name)!.equipment).toBe("corpo");
    expect(plan.notes.join(" ")).toContain("quase não há exercícios de puxar");
  });

  it("em casa com halteres: sem máquinas, polias, barras nem banco", () => {
    const plan = make({ location: "casa_halteres", trainedBefore: true, trainingMonths: 36, daysPerWeek: 5, seed: 8 });
    for (const e of strength(plan)) {
      const info = byName.get(e.name)!;
      expect(["corpo", "halter", "kettlebell"]).toContain(info.equipment);
      expect(info.needsBench).toBeUndefined();
    }
  });

  it("exercícios por tempo trazem segundos nas repetições", () => {
    const plan = make({ location: "casa_sem_equipamento", seed: 2 });
    for (const e of strength(plan)) {
      if (byName.get(e.name)!.timed) expect(e.reps).toMatch(/^\d+-\d+ s$/);
    }
  });

  it("na academia o peso do corpo fica em segundo plano (exceto abdômen)", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const plan = make({ trainedBefore: true, trainingMonths: 12, daysPerWeek: 4, seed });
      for (const e of strength(plan)) {
        const info = byName.get(e.name)!;
        if (info.pattern !== "core") expect(info.equipment, e.name).not.toBe("corpo");
      }
    }
  });

  it("nunca escolhe elevação frontal nem exercícios de salto (nada de impacto nos dias de força)", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const plan = make({ trainedBefore: true, trainingMonths: 40, daysPerWeek: 6, seed });
      for (const e of strength(plan)) {
        expect(e.name).not.toMatch(/^Elevação frontal/i);
        expect(byName.get(e.name)!.impact).toBe("baixo");
      }
    }
  });
});

// Varredura: milhares de combinações de respostas, conferindo as regras que nunca podem falhar.
// Os problemas são juntados e conferidos no fim (milhares de `expect` isolados seriam lentos).
describe("generateWorkoutPlan: varredura de combinações", () => {
  const experiences: { trainedBefore: boolean; trainingMonths?: number }[] = [
    { trainedBefore: false },
    { trainedBefore: true, trainingMonths: 12 },
    { trainedBefore: true, trainingMonths: 48 },
  ];
  const limitationSets: Joint[][] = [[], ["joelho"], ["ombro"], ["coluna"], ["joelho", "ombro", "coluna"]];
  const birthDates = ["1996-03-15", "1971-03-15", "1961-03-15"]; // 30, 55 e 65 anos
  const bodies = [
    { heightCm: 175, weightKg: 75 },
    { heightCm: 165, weightKg: 110 }, // IMC alto
  ];
  const CARDIO_NAMES = ["Caminhada", "Esteira", "Bicicleta ergométrica", "Corrida"];

  it(
    "todo treino gerado respeita local, nível, dor, idade, impacto e formato",
    () => {
      const problems: string[] = [];
      let plans = 0;

      for (const experience of experiences)
        for (const daysPerWeek of [2, 3, 4, 5, 6])
          for (const goal of GOALS)
            for (const location of LOCATIONS)
              for (const limitations of limitationSets)
                for (const birthDate of birthDates)
                  for (const body of bodies)
                    for (const seed of [0, 7]) {
                      const input: GeneratorInput = { ...base, ...experience, ...body, daysPerWeek, goal, location, limitations, birthDate, seed };
                      const plan = generateWorkoutPlan(input, TODAY);
                      plans++;
                      const where = JSON.stringify({ ...experience, daysPerWeek, goal, location, limitations, birthDate, body, seed });
                      const check = (ok: boolean, message: string) => {
                        if (!ok && problems.length < 20) problems.push(`${message} | ${where}`);
                      };

                      const level = levelFromExperience(experience.trainedBefore, experience.trainingMonths);
                      const senior = birthDate === "1961-03-15";
                      const maxLevel = Math.min(levelIndex(level), senior ? levelIndex("intermediario") : 2);
                      const avoidImpact = senior || body.weightKg / (body.heightCm / 100) ** 2 >= 30;
                      const place = LOCATION_RULES[location];

                      check(plan.level === level, `nível ${plan.level}`);
                      check(plan.days.length === Math.min(daysPerWeek, MAX_STRENGTH_DAYS[level]), `dias ${plan.days.length}`);
                      check(plan.notes.length >= 3, "poucos avisos");

                      plan.days.forEach((day, index) => {
                        check(day.name.startsWith(`${"ABCDEF"[index]} - `), `nome do dia ${day.name}`);
                        const names = new Set<string>();
                        for (const exercise of day.exercises) {
                          check(!Object.keys(exercise).some((key) => /rest|descanso/i.test(key)), "tem descanso");
                          if (exercise.kind === "strength") {
                            const info = byName.get(exercise.name);
                            if (!info) {
                              check(false, `${exercise.name} não existe`);
                              continue;
                            }
                            check(place.equipment.includes(info.equipment), `${exercise.name}: equipamento ${info.equipment} fora do local`);
                            check(place.bench || !info.needsBench, `${exercise.name}: exige banco`);
                            check(levelIndex(info.minLevel) <= maxLevel, `${exercise.name}: nível alto demais`);
                            check(!limitations.some((joint) => info.joints.includes(joint)), `${exercise.name}: sobrecarrega articulação com dor`);
                            check(info.impact === "baixo", `${exercise.name}: impacto`);
                            check(exercise.sets >= 1 && exercise.sets <= 5, `${exercise.name}: séries ${exercise.sets}`);
                            check(/^\d+-\d+( s)?$/.test(exercise.reps), `${exercise.name}: repetições "${exercise.reps}"`);
                            check(exercise.reps.endsWith(" s") === Boolean(info.timed), `${exercise.name}: formato por tempo`);
                            check(!names.has(exercise.name), `${exercise.name}: repetido no mesmo dia`);
                            names.add(exercise.name);
                          } else {
                            check(CARDIO_NAMES.includes(exercise.name), `cardio ${exercise.name}`);
                            check(location === "academia" || ["Caminhada", "Corrida"].includes(exercise.name), `cardio ${exercise.name} sem equipamento`);
                            if (exercise.name === "Corrida") {
                              check(!avoidImpact && !limitations.includes("joelho") && level !== "iniciante", "corrida indevida");
                            }
                            check(exercise.targetMinutes >= 15 && exercise.targetMinutes <= (senior ? 25 : 30), `cardio ${exercise.targetMinutes} min`);
                          }
                        }
                      });

                      check(cardio(plan).length === Math.min(CARDIO_SESSIONS[goal], plan.days.length), "sessões de cardio");

                      // Academia e sem dor: dias cheios e, nos planos curtos, sem repetir exercício na semana.
                      if (location === "academia" && limitations.length === 0) {
                        for (const day of plan.days) {
                          const n = day.exercises.filter((e) => e.kind === "strength").length;
                          check(n >= 5, `${day.name} só com ${n} exercícios`);
                        }
                        if (plan.days.length <= 4) {
                          const all = strength(plan).map((e) => e.name);
                          check(new Set(all).size === all.length, "exercício repetido na semana");
                        }
                      }
                    }

      expect(problems).toEqual([]);
      expect(plans).toBe(3 * 5 * 3 * 3 * 5 * 3 * 2 * 2);
    },
    60_000
  );
});
