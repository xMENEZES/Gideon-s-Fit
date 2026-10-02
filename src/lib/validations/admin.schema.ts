import { z } from "zod";

export const inviteTrainerSchema = z.object({
  email: z.string().email("Informe um email válido"),
});
export type InviteTrainerInput = z.infer<typeof inviteTrainerSchema>;
