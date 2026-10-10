import { z } from "zod";

export const workoutDaySchema = z.object({
  name: z.string().min(2, "Dê um nome para o dia de treino").max(80, "No máximo 80 caracteres"),
});
export type WorkoutDayInput = z.infer<typeof workoutDaySchema>;

// Campo numérico em branco vale "não informado" (sem isso, "" virava 0).
const emptyToUndefined = (value: unknown) => (value === "" || value == null ? undefined : value);

// Exercício de musculação ("strength") ou de cardio ("cardio"). Os campos de cada tipo são
// exigidos no final (superRefine), para o formulário poder usar o mesmo conjunto de campos.
export const exerciseSchema = z
  .object({
    kind: z.enum(["strength", "cardio"]).default("strength"),
    // O tamanho mínimo é conferido no final, com a mensagem de cada tipo.
    name: z.string().max(120, "No máximo 120 caracteres"),
    sets: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1, "Mínimo 1 série").max(50).optional()
    ),
    reps: z.string().trim().max(40, "No máximo 40 caracteres").optional(),
    restSeconds: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number()
        .int()
        .min(5, "Mínimo 5 segundos")
        .max(3600, "Máximo 3600 segundos (60 minutos)")
        .optional()
    ),
    // Campo em branco = sem carga recomendada (sem isso, "" virava 0 kg).
    recommendedLoadKg: z.preprocess(
      emptyToUndefined,
      z.coerce.number().min(0, "Informe um valor válido").optional()
    ),
    // Metas do cardio: duração e/ou distância (pelo menos uma).
    targetMinutes: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number()
        .int()
        .min(1, "Mínimo 1 minuto")
        .max(1440, "Máximo 1440 minutos (24 horas)")
        .optional()
    ),
    targetDistanceKm: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number()
        .gt(0, "Informe uma distância maior que zero")
        .max(1000, "Máximo 1000 km")
        .optional()
    ),
    // Só http e https: o formato de URL do zod também aceitaria "javascript:" e similares.
    videoUrl: z
      .string()
      .trim()
      .url("Informe um link válido")
      .max(2048, "Link muito longo")
      .refine((value) => /^https?:\/\//i.test(value), "O link deve começar com http:// ou https://")
      .optional()
      .or(z.literal("")),
    notes: z.string().max(1000, "No máximo 1000 caracteres").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.name.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: value.kind === "cardio" ? "Escolha a atividade" : "Informe o nome do exercício",
      });
    }
    if (value.kind === "cardio") {
      if (value.targetMinutes === undefined && value.targetDistanceKm === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["targetMinutes"],
          message: "Informe a duração ou a distância",
        });
      }
      return;
    }
    if (value.sets === undefined) {
      ctx.addIssue({ code: "custom", path: ["sets"], message: "Mínimo 1 série" });
    }
    if (!value.reps) {
      ctx.addIssue({ code: "custom", path: ["reps"], message: "Informe as repetições (ex: 8-12)" });
    }
    if (value.restSeconds === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["restSeconds"],
        message: "Informe o descanso (mínimo 5 segundos)",
      });
    }
  });
export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type ExerciseFormInput = z.input<typeof exerciseSchema>;

export const loadLogSchema = z.object({
  weightKg: z.coerce.number().min(0, "Informe a carga em kg"),
  repsDone: z.coerce.number().int().min(0).optional(),
  loggedAt: z.string().optional(),
  notes: z.string().max(500, "No máximo 500 caracteres").optional(),
});
export type LoadLogInput = z.infer<typeof loadLogSchema>;
export type LoadLogFormInput = z.input<typeof loadLogSchema>;

// Sessão de cardio: duração e/ou distância realizadas (pelo menos uma).
export const cardioLogSchema = z
  .object({
    durationMinutes: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number()
        .int()
        .min(1, "Mínimo 1 minuto")
        .max(1440, "Máximo 1440 minutos (24 horas)")
        .optional()
    ),
    distanceKm: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number()
        .gt(0, "Informe uma distância maior que zero")
        .max(1000, "Máximo 1000 km")
        .optional()
    ),
    loggedAt: z.string().optional(),
    notes: z.string().max(500, "No máximo 500 caracteres").optional(),
  })
  .refine((value) => value.durationMinutes !== undefined || value.distanceKm !== undefined, {
    path: ["durationMinutes"],
    message: "Informe a duração ou a distância",
  });
export type CardioLogInput = z.infer<typeof cardioLogSchema>;
export type CardioLogFormInput = z.input<typeof cardioLogSchema>;
