import { z } from "zod";

export const workoutDaySchema = z.object({
  name: z.string().min(2, "Dê um nome para o dia de treino"),
});
export type WorkoutDayInput = z.infer<typeof workoutDaySchema>;

export const exerciseSchema = z.object({
  name: z.string().min(2, "Informe o nome do exercício"),
  sets: z.coerce.number().int().min(1, "Mínimo 1 série").max(50),
  reps: z.string().min(1, "Informe as repetições (ex: 8-12)"),
  restSeconds: z.coerce
    .number()
    .int()
    .min(5, "Mínimo 5 segundos")
    .max(3600, "Máximo 3600 segundos (60 minutos)"),
  recommendedLoadKg: z.coerce
    .number()
    .min(0, "Informe um valor válido")
    .optional(),
  videoUrl: z
    .string()
    .trim()
    .url("Informe um link válido")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});
export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type ExerciseFormInput = z.input<typeof exerciseSchema>;

export const updateExerciseRestSchema = exerciseSchema.pick({ restSeconds: true });
export type UpdateExerciseRestInput = z.infer<typeof updateExerciseRestSchema>;
export type UpdateExerciseRestFormInput = z.input<typeof updateExerciseRestSchema>;

export const updateRecommendedLoadSchema = z.object({
  recommendedLoadKg: z.coerce.number().min(0, "Informe um valor válido"),
});
export type UpdateRecommendedLoadInput = z.infer<typeof updateRecommendedLoadSchema>;
export type UpdateRecommendedLoadFormInput = z.input<typeof updateRecommendedLoadSchema>;

export const loadLogSchema = z.object({
  weightKg: z.coerce.number().min(0, "Informe a carga em kg"),
  repsDone: z.coerce.number().int().min(0).optional(),
  loggedAt: z.string().optional(),
  notes: z.string().optional(),
});
export type LoadLogInput = z.infer<typeof loadLogSchema>;
export type LoadLogFormInput = z.input<typeof loadLogSchema>;
