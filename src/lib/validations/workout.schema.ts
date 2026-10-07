import { z } from "zod";

export const workoutDaySchema = z.object({
  name: z.string().min(2, "Dê um nome para o dia de treino").max(80, "No máximo 80 caracteres"),
});
export type WorkoutDayInput = z.infer<typeof workoutDaySchema>;

export const exerciseSchema = z.object({
  name: z.string().min(2, "Informe o nome do exercício").max(120, "No máximo 120 caracteres"),
  sets: z.coerce.number().int().min(1, "Mínimo 1 série").max(50),
  reps: z.string().min(1, "Informe as repetições (ex: 8-12)").max(40, "No máximo 40 caracteres"),
  restSeconds: z.coerce
    .number()
    .int()
    .min(5, "Mínimo 5 segundos")
    .max(3600, "Máximo 3600 segundos (60 minutos)"),
  // Campo em branco = sem carga recomendada (sem isso, "" virava 0 kg).
  recommendedLoadKg: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().min(0, "Informe um valor válido").optional()
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
