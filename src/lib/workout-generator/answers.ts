// Respostas do assistente "Gerar treino" e o que vai para o banco. Funções puras (sem banco nem
// relógio), para valer igual na tela, no servidor e nos testes.
//
// As respostas NÃO são guardadas em tabela: só o treino gerado fica gravado. A data de nascimento,
// a altura e o peso vêm de Meus Dados (lidos pelo servidor), nunca do que o celular envia.

import { z } from "zod";
import { addDays } from "@/lib/dates";
import type { GeneratedPlan } from "./generate";
import { GOALS, JOINTS, LOCATIONS, MAX_DAYS, MIN_DAYS, type GeneratorInput } from "./rules";

// "Já treinou? Há quanto tempo?" numa escolha só. O valor guardado é um mês representativo da faixa
// (o nível só depende de 6 e de 24 meses).
export const EXPERIENCE_OPTIONS = [
  { value: "nunca", label: "Nunca treinei", trainedBefore: false, months: 0 },
  { value: "menos_3_meses", label: "Menos de 3 meses", trainedBefore: true, months: 1 },
  { value: "3_a_6_meses", label: "De 3 a 6 meses", trainedBefore: true, months: 4 },
  { value: "6_a_12_meses", label: "De 6 meses a 1 ano", trainedBefore: true, months: 9 },
  { value: "1_a_2_anos", label: "De 1 a 2 anos", trainedBefore: true, months: 18 },
  { value: "mais_2_anos", label: "Mais de 2 anos", trainedBefore: true, months: 36 },
] as const;

export type ExperienceValue = (typeof EXPERIENCE_OPTIONS)[number]["value"];
const EXPERIENCE_VALUES = EXPERIENCE_OPTIONS.map((option) => option.value) as [ExperienceValue, ...ExperienceValue[]];

export const MAX_SEED = 2_147_483_647;

export const generatorAnswersSchema = z.object({
  experience: z.enum(EXPERIENCE_VALUES, "Escolha há quanto tempo você treina"),
  daysPerWeek: z
    .number("Escolha os dias por semana")
    .int("Escolha os dias por semana")
    .min(MIN_DAYS, `Escolha de ${MIN_DAYS} a ${MAX_DAYS} dias por semana`)
    .max(MAX_DAYS, `Escolha de ${MIN_DAYS} a ${MAX_DAYS} dias por semana`),
  goal: z.enum(GOALS, "Escolha o seu objetivo"),
  location: z.enum(LOCATIONS, "Escolha onde você treina"),
  limitations: z
    .array(z.enum(JOINTS, "Dor ou lesão: escolha entre joelho, ombro e coluna"), "Dor ou lesão: escolha entre joelho, ombro e coluna")
    .max(JOINTS.length)
    .refine((list) => new Set(list).size === list.length, "Dor ou lesão repetida"),
  // Muda a escolha entre exercícios equivalentes ("gerar outra variação").
  seed: z.number().int().min(0).max(MAX_SEED),
});
export type GeneratorAnswers = z.infer<typeof generatorAnswersSchema>;

// Dados de Meus Dados que o gerador usa.
export type BodyForGenerator = { birthDate: string; heightCm: number; weightKg: number };

export function toGeneratorInput(answers: GeneratorAnswers, body: BodyForGenerator): GeneratorInput {
  const experience = EXPERIENCE_OPTIONS.find((option) => option.value === answers.experience)!;
  return {
    birthDate: body.birthDate,
    heightCm: body.heightCm,
    weightKg: body.weightKg,
    trainedBefore: experience.trainedBefore,
    trainingMonths: experience.trainedBefore ? experience.months : undefined,
    daysPerWeek: answers.daysPerWeek,
    goal: answers.goal,
    location: answers.location,
    limitations: answers.limitations,
    seed: answers.seed,
  };
}

// O treino gerado dura 8 semanas (56 dias a partir de hoje).
export const PLAN_WEEKS = 8;
export function planDates(today: string): { startDate: string; endDate: string } {
  return { startDate: today, endDate: addDays(today, PLAN_WEEKS * 7) };
}

// Observações do protocolo: os avisos do gerador, separados por linha em branco. O banco aceita até
// 2000 caracteres, e os avisos mais importantes vêm primeiro.
export const MAX_PROTOCOL_NOTES = 2000;
export function planNotes(plan: GeneratedPlan): string {
  const kept: string[] = [];
  let length = 0;
  for (const note of plan.notes) {
    const next = length + (kept.length > 0 ? 2 : 0) + note.length;
    if (next > MAX_PROTOCOL_NOTES) break;
    kept.push(note);
    length = next;
  }
  return kept.join("\n\n");
}

// Formato que a função create_generated_workout (migração 0038) recebe. Não leva descanso.
export type WorkoutPayloadDay = {
  name: string;
  exercises: (
    | { kind: "strength"; name: string; sets: number; reps: string }
    | { kind: "cardio"; name: string; targetMinutes: number; notes: string }
  )[];
};

export function workoutPayload(plan: GeneratedPlan): WorkoutPayloadDay[] {
  return plan.days.map((day) => ({
    name: day.name,
    exercises: day.exercises.map((exercise) =>
      exercise.kind === "strength"
        ? { kind: "strength" as const, name: exercise.name, sets: exercise.sets, reps: exercise.reps }
        : {
            kind: "cardio" as const,
            name: exercise.name,
            targetMinutes: exercise.targetMinutes,
            notes: exercise.notes,
          }
    ),
  }));
}
