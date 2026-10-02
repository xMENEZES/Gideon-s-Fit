import { z } from "zod";

export const studentSchema = z
  .object({
    email: z.string().email("Informe um email válido"),
    nickname: z.string().optional(),
    birthDate: z.string().optional(),
    notes: z.string().optional(),
    hasWorkout: z.boolean().default(true),
    hasDiet: z.boolean().default(true),
  })
  .refine((data) => data.hasWorkout || data.hasDiet, {
    message: "Habilite pelo menos Treino ou Dieta para o aluno",
    path: ["hasWorkout"],
  });

export type StudentInput = z.infer<typeof studentSchema>;
export type StudentFormInput = z.input<typeof studentSchema>;

export const studentSettingsSchema = z
  .object({
    nickname: z.string().optional(),
    hasWorkout: z.boolean(),
    hasDiet: z.boolean(),
  })
  .refine((data) => data.hasWorkout || data.hasDiet, {
    message: "Habilite pelo menos Treino ou Dieta para o aluno",
    path: ["hasWorkout"],
  });
export type StudentSettingsInput = z.infer<typeof studentSettingsSchema>;
