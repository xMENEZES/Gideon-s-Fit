import { z } from "zod";

export const studentSettingsSchema = z
  .object({
    nickname: z.string().optional(),
    hasWorkout: z.boolean(),
    hasDiet: z.boolean(),
  })
  .refine((data) => data.hasWorkout || data.hasDiet, {
    message: "Habilite pelo menos Protoc. Treino ou Protoc. Alimentar para o aluno",
    path: ["hasWorkout"],
  });
export type StudentSettingsInput = z.infer<typeof studentSettingsSchema>;
