// Motor do gerador de treino: dado o que a pessoa respondeu, escolhe os exercícios e sugere séries
// e repetições. Determinístico: as mesmas respostas e a mesma semente dão sempre o mesmo treino.
// Não grava nada (a gravação é outra etapa) e NÃO define descanso (decisão do dono do produto).

import { ageOn } from "@/lib/body-data";
import { todayBR } from "@/lib/dates";
import {
  GENERATOR_EXERCISES,
  type GeneratorExercise,
  type Joint,
  type Level,
  type MuscleGroup,
  type Pattern,
} from "./catalog";
import {
  avoidHighImpact,
  bmi,
  cardioActivities,
  cardioDayIndexes,
  cardioMinutes,
  CARDIO_SESSIONS,
  DAY_LABEL,
  DAY_SLOTS,
  GeneratorInputError,
  heartRateRange,
  isVeryNew,
  levelFromExperience,
  levelIndex,
  LOCATION_RULES,
  MAX_STRENGTH_DAYS,
  SENIOR_AGE,
  splitFor,
  validateGeneratorInput,
  volumeFor,
  type DayType,
  type GeneratorInput,
  type SlotId,
} from "./rules";

export type GeneratedStrengthExercise = {
  kind: "strength";
  name: string;
  group: MuscleGroup;
  sets: number;
  // "8-12" ou, nos exercícios por tempo, "30-45 s".
  reps: string;
  timed?: true;
};

export type GeneratedCardioExercise = {
  kind: "cardio";
  name: string;
  targetMinutes: number;
  notes: string;
};

export type GeneratedDay = {
  // Ex.: "A - Corpo inteiro".
  name: string;
  type: DayType;
  exercises: (GeneratedStrengthExercise | GeneratedCardioExercise)[];
};

export type GeneratedPlan = {
  level: Level;
  age: number;
  days: GeneratedDay[];
  // Avisos para mostrar junto do treino, em português.
  notes: string[];
};

// ---------------------------------------------------------------- Vagas

type Spec = { patterns?: readonly Pattern[]; group?: MuscleGroup; name?: RegExp };

const matches = (exercise: GeneratorExercise, spec: Spec): boolean =>
  (!spec.patterns || spec.patterns.includes(exercise.pattern)) &&
  (!spec.group || exercise.group === spec.group) &&
  (!spec.name || spec.name.test(exercise.name));

// Cada vaga tem o tipo de exercício que procura e, se não houver nenhum disponível (por local,
// nível ou dor), alternativas em ordem.
const SLOTS: Record<SlotId, { main: Spec; fallback: Spec[] }> = {
  agachar: { main: { patterns: ["agachar"] }, fallback: [{ patterns: ["avanco"] }] },
  avanco: { main: { patterns: ["avanco"] }, fallback: [{ patterns: ["agachar"] }] },
  hinge: { main: { patterns: ["dobrar_quadril"] }, fallback: [] },
  // Empurrar: peito (horizontal) e ombros (vertical) primeiro; outros empurrões só se faltar opção.
  push_h: { main: { patterns: ["empurrar_h"], group: "peito" }, fallback: [{ patterns: ["empurrar_h"] }] },
  push_v: {
    main: { patterns: ["empurrar_v"], group: "ombros" },
    fallback: [{ patterns: ["empurrar_v"] }, { patterns: ["empurrar_h"], group: "peito" }],
  },
  // Puxar: costas primeiro; ombros (face pull) só se faltar opção.
  pull_h: {
    main: { patterns: ["puxar_h"], group: "costas" },
    fallback: [
      { patterns: ["puxar_v"], group: "costas" },
      { group: "costas", patterns: ["isolado"] },
      { patterns: ["puxar_h"] },
    ],
  },
  pull_v: {
    main: { patterns: ["puxar_v"], group: "costas" },
    fallback: [{ patterns: ["puxar_h"], group: "costas" }],
  },
  core: { main: { patterns: ["core"] }, fallback: [] },
  biceps: { main: { group: "biceps" }, fallback: [] },
  triceps: { main: { group: "triceps", patterns: ["isolado"] }, fallback: [{ group: "triceps" }] },
  // Ombro isolado: o deltoide da frente já trabalha nos desenvolvimentos, então a elevação frontal
  // nunca é escolhida. Lateral nos dias de empurrar; posterior (e face pull) nos de puxar.
  ombro_lat: { main: { group: "ombros", patterns: ["isolado"], name: /lateral/i }, fallback: [] },
  ombro_post: {
    main: { group: "ombros", name: /inverso|posterior|face pull/i },
    fallback: [{ group: "ombros", patterns: ["isolado"], name: /lateral/i }],
  },
  peito_iso: { main: { group: "peito", patterns: ["isolado"] }, fallback: [] },
  coxa_iso: { main: { group: "coxas", patterns: ["isolado"] }, fallback: [] },
  gluteo_iso: { main: { group: "gluteos", patterns: ["isolado", "dobrar_quadril"] }, fallback: [] },
  panturrilha: { main: { group: "panturrilha" }, fallback: [] },
};

// ---------------------------------------------------------------- Aleatoriedade com semente

// mulberry32: gerador pequeno e determinístico.
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ---------------------------------------------------------------- Montagem

const LETTERS = "ABCDEF";

// Abaixo disso, o dia é considerado "magro" e o treino traz um aviso.
const MIN_EXERCISES_PER_DAY = 4;

export function generateWorkoutPlan(input: GeneratorInput, today: string = todayBR()): GeneratedPlan {
  const problem = validateGeneratorInput(input, today);
  if (problem) throw new GeneratorInputError(problem);

  const age = ageOn(input.birthDate, today) as number;
  const level = levelFromExperience(input.trainedBefore, input.trainingMonths);
  const split = splitFor(level, input.daysPerWeek);
  const strengthDays = split.length;
  const avoidImpact = avoidHighImpact(age, bmi(input.heightCm, input.weightKg));
  const place = LOCATION_RULES[input.location];
  const limited = new Set<Joint>(input.limitations);
  const random = createRandom(input.seed ?? 0);

  // Exercícios que a pessoa pode fazer: o que o local oferece, o nível (a partir de 60 anos, até o
  // intermediário), e sem as articulações com dor. Exercícios de impacto (saltos) não entram nos
  // dias de força: são de condicionamento.
  const maxExerciseLevel = Math.min(levelIndex(level), age >= SENIOR_AGE ? levelIndex("intermediario") : 2);
  const pool = GENERATOR_EXERCISES.filter(
    (exercise) =>
      place.equipment.includes(exercise.equipment) &&
      (place.bench || !exercise.needsBench) &&
      levelIndex(exercise.minLevel) <= maxExerciseLevel &&
      !exercise.joints.some((joint) => limited.has(joint)) &&
      exercise.impact === "baixo"
  );

  const usedInPlan = new Set<string>();
  const missingSlots = new Set<SlotId>();

  // Escolhe o exercício de uma vaga: prefere os que ainda não apareceram no treino, depois os de nível
  // mais alto dentre os permitidos; entre equivalentes, decide pela semente.
  function pick(slotId: SlotId, usedToday: Set<string>): GeneratorExercise | null {
    const slot = SLOTS[slotId];
    for (const spec of [slot.main, ...slot.fallback]) {
      const candidates = pool.filter((exercise) => matches(exercise, spec) && !usedToday.has(exercise.name));
      if (candidates.length === 0) continue;
      const fresh = candidates.filter((exercise) => !usedInPlan.has(exercise.name));
      // Na academia, peso do corpo fica em segundo plano (há máquinas e halteres), exceto no abdômen.
      const bodyweightLast = (exercise: GeneratorExercise): number =>
        input.location === "academia" && exercise.equipment === "corpo" && exercise.pattern !== "core" ? 1 : 0;
      const ordered = shuffle(fresh.length > 0 ? fresh : candidates, random).sort(
        (a, b) => bodyweightLast(a) - bodyweightLast(b) || levelIndex(b.minLevel) - levelIndex(a.minLevel)
      );
      return ordered[0];
    }
    return null;
  }

  const volumeContext = { level, goal: input.goal, age, strengthDays };

  const days: GeneratedDay[] = split.map((type, index) => {
    const usedToday = new Set<string>();
    const exercises: GeneratedDay["exercises"] = [];
    for (const slotId of DAY_SLOTS[type]) {
      const exercise = pick(slotId, usedToday);
      if (!exercise) {
        missingSlots.add(slotId);
        continue;
      }
      usedToday.add(exercise.name);
      usedInPlan.add(exercise.name);
      const { sets, reps } = volumeFor(exercise, volumeContext);
      exercises.push({
        kind: "strength",
        name: exercise.name,
        group: exercise.group,
        sets,
        reps,
        ...(exercise.timed ? { timed: true as const } : {}),
      });
    }
    return { name: `${LETTERS[index]} - ${DAY_LABEL[type]}`, type, exercises };
  });

  // Cardio no fim de alguns dias de força, espalhado pela semana.
  const sessions = CARDIO_SESSIONS[input.goal];
  if (sessions > 0) {
    const activities = shuffle(
      cardioActivities(level, input.location, { avoidImpact, kneeLimitation: limited.has("joelho") }),
      random
    );
    const heart = heartRateRange(age, level, input.goal);
    const minutes = cardioMinutes(input.goal, level, age);
    cardioDayIndexes(sessions, days.length).forEach((dayIndex, session) => {
      days[dayIndex].exercises.push({
        kind: "cardio",
        name: activities[session % activities.length],
        targetMinutes: minutes,
        notes:
          `Intensidade moderada: tente ficar entre ${heart.min} e ${heart.max} bpm ` +
          `(estimativa pela idade) ou num ritmo em que ainda consiga conversar.`,
      });
    });
  }

  const thinDay = days.some(
    (day) => day.exercises.filter((exercise) => exercise.kind === "strength").length < MIN_EXERCISES_PER_DAY
  );
  return { level, age, days, notes: buildNotes(input, { level, age, avoidImpact, strengthDays, missingSlots, thinDay }) };
}

function buildNotes(
  input: GeneratorInput,
  context: {
    level: Level;
    age: number;
    avoidImpact: boolean;
    strengthDays: number;
    missingSlots: Set<SlotId>;
    thinDay: boolean;
  }
): string[] {
  const { level, age, avoidImpact, strengthDays, missingSlots, thinDay } = context;
  const notes: string[] = [
    "Este treino é uma sugestão automática, feita com base nas suas respostas. Ele não substitui a avaliação de um profissional de educação física ou de um médico. Se sentir dor, pare e procure orientação.",
    "Descanso entre as séries: ajuste pelo que você sentir durante o treino.",
    "Carga: escolha um peso com o qual as últimas repetições fiquem difíceis, mas ainda com boa execução. Aumente aos poucos.",
  ];

  if (isVeryNew(input.trainedBefore, input.trainingMonths)) {
    notes.push("Nas duas primeiras semanas, faça uma série a menos em cada exercício, para o corpo se adaptar.");
  }
  if (input.daysPerWeek > MAX_STRENGTH_DAYS[level]) {
    notes.push(
      `Para o seu nível, o treino de força tem no máximo ${strengthDays} dias por semana. Use os outros dias para caminhar ou descansar.`
    );
  }
  if (input.limitations.length > 0) {
    notes.push(
      `Evitamos os exercícios que mais sobrecarregam: ${input.limitations.join(", ")}. Se a dor continuar, procure um profissional de saúde.`
    );
  }
  if (avoidImpact) {
    notes.push("Exercícios de impacto (saltos) e corrida foram evitados no seu treino.");
  }
  if (age >= 60) {
    notes.push("Recomendamos conversar com um médico antes de começar.");
  }
  if (thinDay) {
    notes.push(
      "Com o equipamento e as limitações que você informou, há poucos exercícios disponíveis e alguns se repetem. Vale procurar um profissional para um treino sob medida."
    );
  }
  if (missingSlots.has("pull_h") || missingSlots.has("pull_v")) {
    notes.push(
      "Sem equipamento, quase não há exercícios de puxar (costas). Com um elástico de resistência ou uma barra fixa de porta, o treino fica mais completo."
    );
  }
  return notes;
}
