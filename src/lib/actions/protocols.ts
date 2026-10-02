"use server";

import { revalidateModule } from "@/lib/actions/revalidate";
import { createClient } from "@/lib/supabase/server";
import {
  startProtocolSchema,
  updateProtocolNotesSchema,
  type StartProtocolInput,
  type UpdateProtocolNotesInput,
} from "@/lib/validations/protocol.schema";
import type { ProtocolType } from "@/lib/types/database.types";

export async function startNewProtocol(
  studentId: string,
  type: ProtocolType,
  input: StartProtocolInput
) {
  const parsed = startProtocolSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_new_protocol", {
    p_student_id: studentId,
    p_type: type,
    p_end_date: parsed.data.endDate,
    p_duplicate: parsed.data.duplicate,
  });

  if (error || !data) {
    return { error: "Não foi possível iniciar o novo protocolo. Tente novamente." };
  }

  revalidateModule(studentId, type === "workout" ? "treino" : "dieta");
  return { success: true, protocolId: data };
}

export async function updateProtocolNotes(
  studentId: string,
  protocolId: string,
  type: ProtocolType,
  input: UpdateProtocolNotesInput
) {
  const parsed = updateProtocolNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("protocols")
    .update({ notes: parsed.data.notes || null })
    .eq("id", protocolId);

  if (error) return { error: "Não foi possível salvar as observações." };

  revalidateModule(studentId, type === "workout" ? "treino" : "dieta");
  return { success: true };
}
