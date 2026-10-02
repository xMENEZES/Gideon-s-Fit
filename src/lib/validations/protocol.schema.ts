import { z } from "zod";

export const startProtocolSchema = z.object({
  endDate: z.string().min(1, "Informe a data de término"),
  duplicate: z.boolean(),
});
export type StartProtocolInput = z.infer<typeof startProtocolSchema>;
export type StartProtocolFormInput = z.input<typeof startProtocolSchema>;

export const updateProtocolNotesSchema = z.object({
  notes: z.string().optional(),
});
export type UpdateProtocolNotesInput = z.infer<typeof updateProtocolNotesSchema>;
export type UpdateProtocolNotesFormInput = z.input<typeof updateProtocolNotesSchema>;
