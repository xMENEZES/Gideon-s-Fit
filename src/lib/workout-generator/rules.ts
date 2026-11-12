// Regras do gerador de treino: nível, divisão dos dias, séries e repetições, cardio e validação.
// Tudo aqui é função pura (sem banco, sem relógio), para valer igual na tela, no servidor e nos testes.
// Os números abaixo são o primeiro rascunho (12/11/2026) e aguardam revisão de um profissional de
// educação física: estão juntos, num arquivo só, justamente para serem fáceis de ajustar.
//
// O DESCANSO entre as séries NÃO faz parte do gerador, por decisão do dono do produto: cada pessoa
// ajusta pelo que sente durante o treino.

import { birthDateStatus, HEIGHT_CM, MIN_AGE, WEIGHT_KG } from "@/lib/body-data";
import type { Equipment, GeneratorExercise, Joint, Level, MuscleGroup } from "./catalog";

// ---------------------------------------------------------------- Entradas

export const GOALS = ["ganhar_massa", "emagrecer", "condicionamento"] as const;
export type Goal = (typeof GOALS)[number];

export const LOCATIONS = ["academia", "casa_halteres", "casa_sem_equipamento"] as const;
export type Location = (typeof LOCATIONS)[number];

export const JOINTS: readonly Joint[] = ["joelho", "ombro", "coluna"];

export const MIN_DAYS = 2;
export const MAX_DAYS = 6;
export const MAX_TRAINING_MONTHS = 600;

export type GeneratorInput = {
  birthDate: string; // "YYYY-MM-DD"
  heightCm: number;
  weightKg: number;
  trainedBefore: boolean;
  // Há quantos meses treina (ou treinou de forma regular). Só vale se trainedBefore.
  trainingMonths?: number;
  daysPerWeek: number;
  goal: Goal;
  location: Location;
  // Dor ou lesão: os exercícios que sobrecarregam essas articulações não entram.
  limitations: Joint[];
  // Muda a escolha entre exercícios equivalentes ("gerar outra variação"). Mesma semente, mesmo treino.
  seed?: number;
};

// O que cada local de treino oferece. "casa_halteres" assume SEM banco.
export const LOCATION_RULES: Record<Location, { equipment: readonly Equipment[]; bench: boolean }> = {
  academia: {
    equipment: ["corpo", "halter", "barra", "maquina", "polia", "smith", "kettlebell", "estrutura", "acessorio"],
    bench: true,
  },
  casa_halteres: { equipment: ["corpo", "halter", "kettlebell"], bench: false },
  casa_sem_equipamento: { equipment: ["corpo"], bench: false },
};

export class GeneratorInputError extends Error {}

// Primeira mensagem de erro (em português) ou null se as respostas valem.
export function validateGeneratorInput(input: GeneratorInput, today: string): string | null {
  const status = birthDateStatus(input.birthDate, today);
  if (status === "underage") return `O gerador de treino é só para maiores de ${MIN_AGE} anos.`;
  if (status !== "ok") return "Informe uma data de nascimento válida.";

  if (!Number.isInteger(input.heightCm) || input.heightCm < HEIGHT_CM.min || input.heightCm > HEIGHT_CM.max) {
    return `Altura entre ${HEIGHT_CM.min} e ${HEIGHT_CM.max} cm.`;
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg < WEIGHT_KG.min || input.weightKg > WEIGHT_KG.max) {
    return `Peso entre ${WEIGHT_KG.min} e ${WEIGHT_KG.max} kg.`;
  }
  if (typeof input.trainedBefore !== "boolean") return "Informe se você já treinou.";
  if (input.trainedBefore) {
    const months = input.trainingMonths;
    if (months === undefined || !Number.isInteger(months) || months < 0 || months > MAX_TRAINING_MONTHS) {
      return "Informe há quantos meses você treina.";
    }
  }
  if (!Number.isInteger(input.daysPerWeek) || input.daysPerWeek < MIN_DAYS || input.daysPerWeek > MAX_DAYS) {
    return `Escolha de ${MIN_DAYS} a ${MAX_DAYS} dias por semana.`;
  }
  if (!GOALS.includes(input.goal)) return "Escolha o seu objetivo.";
  if (!LOCATIONS.includes(input.location)) return "Escolha onde você treina.";
  if (!Array.isArray(input.limitations) || input.limitations.some((joint) => !JOINTS.includes(joint))) {
    return "Dor ou lesão: escolha entre joelho, ombro e coluna.";
  }
  return null;
}

// ---------------------------------------------------------------- Nível e perfil

export const LEVEL_ORDER: readonly Level[] = ["iniciante", "intermediario", "avancado"];
export const levelIndex = (level: Level): number => LEVEL_ORDER.indexOf(level);

// Nunca treinou ou treina há menos de 6 meses: iniciante. De 6 meses a menos de 2 anos:
// intermediário. Dois anos ou mais: avançado.
export function levelFromExperience(trainedBefore: boolean, trainingMonths = 0): Level {
  if (!trainedBefore || trainingMonths < 6) return "iniciante";
  if (trainingMonths < 24) return "intermediario";
  return "avancado";
}

// Quem está começando (nunca treinou ou menos de 3 meses) ganha um aviso de adaptação.
export const isVeryNew = (trainedBefore: boolean, trainingMonths = 0): boolean =>
  !trainedBefore || trainingMonths < 3;

// Quantos dias de força por semana o nível comporta. Se a pessoa pedir mais, o treino traz esse
// máximo e um aviso (os outros dias servem para cardio leve e descanso).
export const MAX_STRENGTH_DAYS: Record<Level, number> = { iniciante: 4, intermediario: 5, avancado: 6 };

export function bmi(heightCm: number, weightKg: number): number {
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

// Idade a partir da qual o treino é mais leve e sem impacto.
export const SENIOR_AGE = 60;
// A partir desta idade a faixa de repetições não desce de 8 (cargas muito altas ficam de fora).
export const MIDDLE_AGE = 50;
// IMC a partir do qual os exercícios de impacto (saltos) não entram.
export const HIGH_IMPACT_BMI = 30;

export const avoidHighImpact = (age: number, bodyMassIndex: number): boolean =>
  age >= SENIOR_AGE || bodyMassIndex >= HIGH_IMPACT_BMI;

// ---------------------------------------------------------------- Divisão dos dias

export type DayType =
  | "full_a" | "full_b" | "full_c"
  | "upper_a" | "upper_b" | "lower_a" | "lower_b"
  | "push" | "pull" | "legs";

export const DAY_LABEL: Record<DayType, string> = {
  full_a: "Corpo inteiro",
  full_b: "Corpo inteiro",
  full_c: "Corpo inteiro",
  upper_a: "Superior",
  upper_b: "Superior",
  lower_a: "Inferior",
  lower_b: "Inferior",
  push: "Empurrar",
  pull: "Puxar",
  legs: "Pernas",
};

// 2 dias: corpo inteiro. 3 dias: corpo inteiro (avançado: empurrar, puxar e pernas). 4 dias:
// superior e inferior duas vezes. 5 dias: superior, inferior e empurrar, puxar, pernas. 6 dias:
// empurrar, puxar e pernas duas vezes.
export function splitFor(level: Level, requestedDays: number): DayType[] {
  const days = Math.min(requestedDays, MAX_STRENGTH_DAYS[level]);
  switch (days) {
    case 2:
      return ["full_a", "full_b"];
    case 3:
      return level === "avancado" ? ["push", "pull", "legs"] : ["full_a", "full_b", "full_c"];
    case 4:
      return ["upper_a", "lower_a", "upper_b", "lower_b"];
    case 5:
      return ["upper_a", "lower_a", "push", "pull", "legs"];
    default:
      return ["push", "pull", "legs", "push", "pull", "legs"];
  }
}

// Vagas que cada dia precisa preencher, na ordem (os exercícios principais primeiro).
export type SlotId =
  | "agachar" | "avanco" | "hinge" | "push_h" | "push_v" | "pull_h" | "pull_v" | "core"
  | "biceps" | "triceps" | "ombro_lat" | "ombro_post" | "peito_iso" | "coxa_iso" | "gluteo_iso" | "panturrilha";

export const DAY_SLOTS: Record<DayType, readonly SlotId[]> = {
  full_a: ["agachar", "push_h", "pull_v", "hinge", "ombro_lat", "core"],
  full_b: ["avanco", "push_v", "pull_h", "gluteo_iso", "triceps", "core"],
  full_c: ["agachar", "push_h", "pull_h", "hinge", "biceps", "core"],
  upper_a: ["push_h", "pull_v", "push_v", "pull_h", "biceps", "triceps"],
  upper_b: ["pull_h", "push_h", "pull_v", "push_v", "ombro_post", "triceps", "core"],
  lower_a: ["agachar", "hinge", "avanco", "coxa_iso", "panturrilha", "core"],
  lower_b: ["hinge", "agachar", "gluteo_iso", "coxa_iso", "panturrilha", "core"],
  push: ["push_h", "push_v", "peito_iso", "ombro_lat", "triceps", "triceps"],
  pull: ["pull_v", "pull_h", "pull_h", "ombro_post", "biceps", "core"],
  legs: ["agachar", "hinge", "avanco", "coxa_iso", "gluteo_iso", "panturrilha"],
};

// ---------------------------------------------------------------- Séries e repetições

export type Role = "principal" | "acessorio" | "core";

export function roleOf(exercise: GeneratorExercise): Role {
  if (exercise.pattern === "core") return "core";
  if (exercise.pattern === "isolado") return "acessorio";
  return "principal";
}

const SETS: Record<Role, Record<Level, number>> = {
  principal: { iniciante: 3, intermediario: 3, avancado: 4 },
  acessorio: { iniciante: 2, intermediario: 3, avancado: 3 },
  core: { iniciante: 2, intermediario: 3, avancado: 3 },
};

// Repetições por objetivo e papel. Emagrecer e condicionamento usam faixas mais altas.
const REPS_MASS: Record<"principal" | "acessorio", Record<Level, string>> = {
  principal: { iniciante: "10-12", intermediario: "8-12", avancado: "6-10" },
  acessorio: { iniciante: "12-15", intermediario: "10-15", avancado: "8-12" },
};
const REPS_LIGHT: Record<"principal" | "acessorio", Record<Level, string>> = {
  principal: { iniciante: "12-15", intermediario: "12-15", avancado: "10-15" },
  acessorio: { iniciante: "12-15", intermediario: "15-20", avancado: "15-20" },
};
const REPS_CORE = "15-20";
const REPS_TIMED: Record<Level, string> = { iniciante: "20-30 s", intermediario: "30-45 s", avancado: "45-60 s" };

export type VolumeContext = { level: Level; goal: Goal; age: number; strengthDays: number };

// Séries e repetições sugeridas para um exercício, a partir das respostas da pessoa:
// - nível: mais séries e faixas de repetição mais pesadas conforme a experiência;
// - objetivo: ganhar massa usa faixas mais pesadas; emagrecer e condicionamento, mais leves;
// - dias por semana: com só 2 dias (cada músculo treinado 2 vezes), os exercícios principais de quem
//   não é iniciante ganham 1 série;
// - idade: a partir de 60 anos, no máximo 3 séries e repetições de 12 a 15; a partir de 50, a faixa
//   de repetições não desce de 8.
export function volumeFor(
  exercise: GeneratorExercise,
  context: VolumeContext
): { sets: number; reps: string } {
  const { level, goal, age, strengthDays } = context;
  const role = roleOf(exercise);

  let sets = SETS[role][level];
  if (role === "principal" && strengthDays <= 2 && level !== "iniciante") sets += 1;
  if (age >= SENIOR_AGE) sets = Math.min(sets, 3);

  if (exercise.timed) return { sets, reps: REPS_TIMED[level] };
  if (role === "core") return { sets, reps: age >= SENIOR_AGE ? "12-15" : REPS_CORE };

  const table = goal === "ganhar_massa" ? REPS_MASS : REPS_LIGHT;
  let reps = table[role][level];
  if (age >= SENIOR_AGE) reps = "12-15";
  else if (age >= MIDDLE_AGE && Number(reps.split("-")[0]) < 8) reps = "8-12";
  return { sets, reps };
}

// ---------------------------------------------------------------- Cardio

export type CardioActivity = "Caminhada" | "Esteira" | "Bicicleta ergométrica" | "Corrida";

// Sessões de cardio por semana (somadas aos dias de força, no fim do treino).
export const CARDIO_SESSIONS: Record<Goal, number> = { ganhar_massa: 0, condicionamento: 2, emagrecer: 3 };

const CARDIO_MINUTES: Record<Goal, Record<Level, number>> = {
  ganhar_massa: { iniciante: 15, intermediario: 20, avancado: 20 },
  condicionamento: { iniciante: 15, intermediario: 20, avancado: 25 },
  emagrecer: { iniciante: 20, intermediario: 30, avancado: 30 },
};

export function cardioMinutes(goal: Goal, level: Level, age: number): number {
  const minutes = CARDIO_MINUTES[goal][level];
  return age >= SENIOR_AGE ? Math.min(minutes, 25) : minutes;
}

// Atividades de cardio que a pessoa pode fazer. Corrida só de intermediário em diante, e fica de fora
// com impacto a evitar ou dor no joelho.
export function cardioActivities(
  level: Level,
  location: Location,
  options: { avoidImpact: boolean; kneeLimitation: boolean }
): CardioActivity[] {
  const activities: CardioActivity[] = ["Caminhada"];
  if (location === "academia") activities.push("Esteira", "Bicicleta ergométrica");
  if (level !== "iniciante" && !options.avoidImpact && !options.kneeLimitation) activities.push("Corrida");
  return activities;
}

// Faixa de frequência cardíaca sugerida (batimentos por minuto), pela estimativa 220 - idade.
// Iniciante: 50% a 60%. Emagrecer: 60% a 70%. Condicionamento: 65% a 75%.
export function heartRateRange(age: number, level: Level, goal: Goal): { min: number; max: number } {
  const maxRate = 220 - age;
  const [low, high] = level === "iniciante" ? [0.5, 0.6] : goal === "condicionamento" ? [0.65, 0.75] : [0.6, 0.7];
  return { min: Math.round(maxRate * low), max: Math.round(maxRate * high) };
}

// Posições (0 a days-1) em que as sessões de cardio entram, espalhadas ao longo da semana.
export function cardioDayIndexes(sessions: number, days: number): number[] {
  const count = Math.min(sessions, days);
  return Array.from({ length: count }, (_, i) => Math.round(((i + 0.5) * days) / count - 0.5));
}

export const GROUP_LABEL: Record<MuscleGroup, string> = {
  peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps", triceps: "Tríceps",
  antebraco: "Antebraço", abdomen: "Abdômen", gluteos: "Glúteos", coxas: "Coxas",
  panturrilha: "Panturrilha", corpo_todo: "Corpo todo",
};
