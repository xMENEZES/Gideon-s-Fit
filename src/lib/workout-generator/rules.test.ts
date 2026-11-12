import { describe, expect, it } from "vitest";
import { GENERATOR_EXERCISES, type GeneratorExercise } from "./catalog";
import {
  avoidHighImpact,
  bmi,
  cardioActivities,
  cardioDayIndexes,
  cardioMinutes,
  heartRateRange,
  isVeryNew,
  levelFromExperience,
  MAX_STRENGTH_DAYS,
  roleOf,
  splitFor,
  validateGeneratorInput,
  volumeFor,
  type GeneratorInput,
} from "./rules";

const TODAY = "2026-11-12";

const exercise = (name: string): GeneratorExercise => {
  const found = GENERATOR_EXERCISES.find((e) => e.name === name);
  if (!found) throw new Error(`exercício de teste não existe: ${name}`);
  return found;
};

describe("levelFromExperience", () => {
  it("nunca treinou ou menos de 6 meses: iniciante", () => {
    expect(levelFromExperience(false)).toBe("iniciante");
    expect(levelFromExperience(false, 60)).toBe("iniciante"); // sem treino prévio, o tempo é ignorado
    expect(levelFromExperience(true, 0)).toBe("iniciante");
    expect(levelFromExperience(true, 5)).toBe("iniciante");
  });

  it("de 6 meses a menos de 2 anos: intermediário", () => {
    expect(levelFromExperience(true, 6)).toBe("intermediario");
    expect(levelFromExperience(true, 23)).toBe("intermediario");
  });

  it("2 anos ou mais: avançado", () => {
    expect(levelFromExperience(true, 24)).toBe("avancado");
    expect(levelFromExperience(true, 120)).toBe("avancado");
  });

  it("isVeryNew vale para quem nunca treinou ou treina há menos de 3 meses", () => {
    expect(isVeryNew(false)).toBe(true);
    expect(isVeryNew(true, 2)).toBe(true);
    expect(isVeryNew(true, 3)).toBe(false);
  });
});

describe("splitFor", () => {
  it("2 dias: corpo inteiro duas vezes", () => {
    expect(splitFor("intermediario", 2)).toEqual(["full_a", "full_b"]);
  });

  it("3 dias: corpo inteiro (avançado: empurrar, puxar e pernas)", () => {
    expect(splitFor("iniciante", 3)).toEqual(["full_a", "full_b", "full_c"]);
    expect(splitFor("intermediario", 3)).toEqual(["full_a", "full_b", "full_c"]);
    expect(splitFor("avancado", 3)).toEqual(["push", "pull", "legs"]);
  });

  it("4, 5 e 6 dias", () => {
    expect(splitFor("avancado", 4)).toEqual(["upper_a", "lower_a", "upper_b", "lower_b"]);
    expect(splitFor("avancado", 5)).toEqual(["upper_a", "lower_a", "push", "pull", "legs"]);
    expect(splitFor("avancado", 6)).toEqual(["push", "pull", "legs", "push", "pull", "legs"]);
  });

  it("respeita o máximo de dias de força do nível", () => {
    expect(MAX_STRENGTH_DAYS).toEqual({ iniciante: 4, intermediario: 5, avancado: 6 });
    expect(splitFor("iniciante", 6)).toHaveLength(4);
    expect(splitFor("iniciante", 5)).toHaveLength(4);
    expect(splitFor("intermediario", 6)).toHaveLength(5);
    expect(splitFor("avancado", 6)).toHaveLength(6);
  });
});

describe("volumeFor (séries e repetições)", () => {
  const ctx = (over: Partial<Parameters<typeof volumeFor>[1]> = {}) => ({
    level: "intermediario" as const,
    goal: "ganhar_massa" as const,
    age: 30,
    strengthDays: 4,
    ...over,
  });

  it("classifica o papel do exercício", () => {
    expect(roleOf(exercise("Supino reto com barra"))).toBe("principal");
    expect(roleOf(exercise("Rosca direta com barra"))).toBe("acessorio");
    expect(roleOf(exercise("Prancha"))).toBe("core");
  });

  it("ganhar massa: séries e repetições crescem em peso com o nível", () => {
    const squat = exercise("Agachamento livre com barra");
    expect(volumeFor(squat, ctx({ level: "iniciante" }))).toEqual({ sets: 3, reps: "10-12" });
    expect(volumeFor(squat, ctx({ level: "intermediario" }))).toEqual({ sets: 3, reps: "8-12" });
    expect(volumeFor(squat, ctx({ level: "avancado" }))).toEqual({ sets: 4, reps: "6-10" });
  });

  it("exercícios de uma articulação têm menos séries e mais repetições", () => {
    const curl = exercise("Rosca direta com barra");
    expect(volumeFor(curl, ctx({ level: "iniciante" }))).toEqual({ sets: 2, reps: "12-15" });
    expect(volumeFor(curl, ctx({ level: "intermediario" }))).toEqual({ sets: 3, reps: "10-15" });
    expect(volumeFor(curl, ctx({ level: "avancado" }))).toEqual({ sets: 3, reps: "8-12" });
  });

  it("emagrecer e condicionamento usam faixas mais altas e iguais entre si", () => {
    const squat = exercise("Agachamento livre com barra");
    const curl = exercise("Rosca direta com barra");
    for (const goal of ["emagrecer", "condicionamento"] as const) {
      expect(volumeFor(squat, ctx({ goal }))).toEqual({ sets: 3, reps: "12-15" });
      expect(volumeFor(curl, ctx({ goal }))).toEqual({ sets: 3, reps: "15-20" });
      expect(volumeFor(squat, ctx({ goal, level: "avancado" }))).toEqual({ sets: 4, reps: "10-15" });
    }
  });

  it("abdômen: repetições fixas, ou segundos nos exercícios por tempo", () => {
    expect(volumeFor(exercise("Abdominal supra"), ctx())).toEqual({ sets: 3, reps: "15-20" });
    expect(volumeFor(exercise("Prancha"), ctx({ level: "iniciante" }))).toEqual({ sets: 2, reps: "20-30 s" });
    expect(volumeFor(exercise("Prancha"), ctx({ level: "intermediario" }))).toEqual({ sets: 3, reps: "30-45 s" });
    expect(volumeFor(exercise("Prancha"), ctx({ level: "avancado" }))).toEqual({ sets: 3, reps: "45-60 s" });
  });

  it("com só 2 dias por semana, o principal de quem não é iniciante ganha 1 série", () => {
    const squat = exercise("Agachamento livre com barra");
    expect(volumeFor(squat, ctx({ strengthDays: 2 })).sets).toBe(4);
    expect(volumeFor(squat, ctx({ strengthDays: 3 })).sets).toBe(3);
    expect(volumeFor(squat, ctx({ strengthDays: 2, level: "iniciante" })).sets).toBe(3);
    expect(volumeFor(exercise("Rosca direta com barra"), ctx({ strengthDays: 2 })).sets).toBe(3);
  });

  it("a partir de 60 anos: no máximo 3 séries e 12 a 15 repetições", () => {
    const squat = exercise("Agachamento livre com barra");
    expect(volumeFor(squat, ctx({ age: 60, level: "avancado" }))).toEqual({ sets: 3, reps: "12-15" });
    expect(volumeFor(squat, ctx({ age: 59, level: "avancado" })).sets).toBe(4);
    expect(volumeFor(exercise("Abdominal supra"), ctx({ age: 60 }))).toEqual({ sets: 3, reps: "12-15" });
  });

  it("a partir de 50 anos a faixa de repetições não desce de 8", () => {
    const squat = exercise("Agachamento livre com barra");
    expect(volumeFor(squat, ctx({ age: 49, level: "avancado" })).reps).toBe("6-10");
    expect(volumeFor(squat, ctx({ age: 50, level: "avancado" })).reps).toBe("8-12");
    expect(volumeFor(squat, ctx({ age: 50, level: "intermediario" })).reps).toBe("8-12");
  });
});

describe("perfil físico", () => {
  it("calcula o IMC", () => {
    expect(bmi(170, 72.25)).toBeCloseTo(25, 1);
    expect(bmi(100, 30)).toBeCloseTo(30, 5);
  });

  it("evita impacto a partir de IMC 30 ou 60 anos", () => {
    expect(avoidHighImpact(30, 29.9)).toBe(false);
    expect(avoidHighImpact(30, 30)).toBe(true);
    expect(avoidHighImpact(59, 25)).toBe(false);
    expect(avoidHighImpact(60, 25)).toBe(true);
  });
});

describe("cardio", () => {
  it("duração por objetivo e nível, com teto de 25 min a partir de 60 anos", () => {
    expect(cardioMinutes("emagrecer", "iniciante", 30)).toBe(20);
    expect(cardioMinutes("emagrecer", "avancado", 30)).toBe(30);
    expect(cardioMinutes("condicionamento", "avancado", 30)).toBe(25);
    expect(cardioMinutes("emagrecer", "avancado", 60)).toBe(25);
    expect(cardioMinutes("condicionamento", "iniciante", 60)).toBe(15);
  });

  it("atividades: esteira e bicicleta só na academia; corrida só de intermediário em diante e sem impacto a evitar", () => {
    const free = { avoidImpact: false, kneeLimitation: false };
    expect(cardioActivities("iniciante", "academia", free)).toEqual(["Caminhada", "Esteira", "Bicicleta ergométrica"]);
    expect(cardioActivities("intermediario", "academia", free)).toEqual(["Caminhada", "Esteira", "Bicicleta ergométrica", "Corrida"]);
    expect(cardioActivities("avancado", "casa_sem_equipamento", free)).toEqual(["Caminhada", "Corrida"]);
    expect(cardioActivities("avancado", "casa_halteres", free)).toEqual(["Caminhada", "Corrida"]);
    expect(cardioActivities("avancado", "academia", { avoidImpact: true, kneeLimitation: false })).not.toContain("Corrida");
    expect(cardioActivities("avancado", "academia", { avoidImpact: false, kneeLimitation: true })).not.toContain("Corrida");
  });

  it("frequência cardíaca pela estimativa 220 - idade", () => {
    expect(heartRateRange(40, "iniciante", "emagrecer")).toEqual({ min: 90, max: 108 }); // 50% a 60% de 180
    expect(heartRateRange(40, "intermediario", "emagrecer")).toEqual({ min: 108, max: 126 }); // 60% a 70%
    expect(heartRateRange(40, "avancado", "condicionamento")).toEqual({ min: 117, max: 135 }); // 65% a 75%
  });

  it("espalha as sessões de cardio pelos dias", () => {
    expect(cardioDayIndexes(2, 3)).toEqual([0, 2]);
    expect(cardioDayIndexes(3, 3)).toEqual([0, 1, 2]);
    expect(cardioDayIndexes(3, 4)).toEqual([0, 2, 3]);
    expect(cardioDayIndexes(2, 2)).toEqual([0, 1]);
    expect(cardioDayIndexes(3, 2)).toHaveLength(2); // nunca mais sessões que dias
    expect(cardioDayIndexes(0, 4)).toEqual([]);
  });
});

describe("validateGeneratorInput", () => {
  const valid: GeneratorInput = {
    birthDate: "1990-05-10",
    heightCm: 175,
    weightKg: 72.5,
    trainedBefore: true,
    trainingMonths: 12,
    daysPerWeek: 3,
    goal: "ganhar_massa",
    location: "academia",
    limitations: [],
  };
  const check = (over: Partial<GeneratorInput>) => validateGeneratorInput({ ...valid, ...over }, TODAY);

  it("aceita respostas válidas", () => {
    expect(check({})).toBeNull();
    expect(check({ trainedBefore: false, trainingMonths: undefined })).toBeNull();
  });

  it("só para maiores de 18 anos", () => {
    expect(check({ birthDate: "2008-11-12" })).toBeNull();
    expect(check({ birthDate: "2008-11-13" })).toBe("O gerador de treino é só para maiores de 18 anos.");
    expect(check({ birthDate: "abc" })).toBe("Informe uma data de nascimento válida.");
    expect(check({ birthDate: "1900-01-01" })).toBe("Informe uma data de nascimento válida.");
  });

  it("limites de altura, peso e dias por semana", () => {
    expect(check({ heightCm: 99 })).toBe("Altura entre 100 e 250 cm.");
    expect(check({ heightCm: 251 })).toBe("Altura entre 100 e 250 cm.");
    expect(check({ heightCm: 175.5 })).toBe("Altura entre 100 e 250 cm.");
    expect(check({ weightKg: 29.9 })).toBe("Peso entre 30 e 300 kg.");
    expect(check({ weightKg: 300.1 })).toBe("Peso entre 30 e 300 kg.");
    expect(check({ weightKg: Number.NaN })).toBe("Peso entre 30 e 300 kg.");
    expect(check({ daysPerWeek: 1 })).toBe("Escolha de 2 a 6 dias por semana.");
    expect(check({ daysPerWeek: 7 })).toBe("Escolha de 2 a 6 dias por semana.");
    expect(check({ daysPerWeek: 3.5 })).toBe("Escolha de 2 a 6 dias por semana.");
    expect(check({ daysPerWeek: 2 })).toBeNull();
    expect(check({ daysPerWeek: 6 })).toBeNull();
  });

  it("quem já treinou precisa informar quantos meses (0 a 600)", () => {
    expect(check({ trainedBefore: true, trainingMonths: undefined })).toBe("Informe há quantos meses você treina.");
    expect(check({ trainingMonths: -1 })).toBe("Informe há quantos meses você treina.");
    expect(check({ trainingMonths: 601 })).toBe("Informe há quantos meses você treina.");
    expect(check({ trainingMonths: 1.5 })).toBe("Informe há quantos meses você treina.");
    expect(check({ trainingMonths: 0 })).toBeNull();
    expect(check({ trainingMonths: 600 })).toBeNull();
  });

  it("objetivo, local e limitações precisam ser opções válidas", () => {
    expect(check({ goal: "x" as never })).toBe("Escolha o seu objetivo.");
    expect(check({ location: "x" as never })).toBe("Escolha onde você treina.");
    expect(check({ limitations: ["pescoço" as never] })).toBe("Dor ou lesão: escolha entre joelho, ombro e coluna.");
    expect(check({ limitations: ["joelho", "ombro", "coluna"] })).toBeNull();
  });
});
