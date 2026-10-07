"use server";

import { revalidatePath } from "next/cache";
import { quotaMessage } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUserId } from "@/lib/auth/session";
import { addDays, isIsoDate, todayBR } from "@/lib/dates";
import { revalidateModule } from "@/lib/actions/revalidate";
import type { ProtocolType } from "@/lib/types/database.types";

const NAME_MAX = 80;
const MAX_STUDENTS_PER_BATCH = 50;

async function requireTrainer() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const profile = await getProfile();
  return profile?.role === "trainer" && profile.onboarded ? userId : null;
}

function cleanName(raw: string) {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) return { error: "Informe um nome para o modelo." as const };
  if (name.length > NAME_MAX) return { error: `O nome pode ter no máximo ${NAME_MAX} caracteres.` as const };
  return { name };
}

function validateEndDate(endDate: string) {
  const today = todayBR();
  if (!isIsoDate(endDate)) return "Informe a data de término.";
  if (endDate < today) return "A data de término não pode ser anterior a hoje.";
  if (endDate > addDays(today, 3 * 365)) return "A data de término está muito distante.";
  return null;
}

function moduleOf(type: ProtocolType) {
  return type === "workout" ? ("treino" as const) : ("dieta" as const);
}

export async function createTemplate(type: ProtocolType, rawName: string) {
  const userId = await requireTrainer();
  if (!userId) return { error: "Apenas profissionais podem criar modelos." };
  const cleaned = cleanName(rawName);
  if ("error" in cleaned) return { error: cleaned.error };

  const today = todayBR();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("protocols")
    .insert({
      owner_trainer_id: userId,
      template_name: cleaned.name,
      type,
      start_date: today,
      end_date: today,
      is_active: false,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error || !data) return { error: quotaMessage(error) ?? "Não foi possível criar o modelo." };

  revalidatePath("/dashboard/modelos");
  return { success: true, templateId: data.id };
}

export async function renameTemplate(templateId: string, rawName: string) {
  const userId = await requireTrainer();
  if (!userId) return { error: "Apenas profissionais podem editar modelos." };
  const cleaned = cleanName(rawName);
  if ("error" in cleaned) return { error: cleaned.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("protocols")
    .update({ template_name: cleaned.name })
    .eq("id", templateId)
    .eq("owner_trainer_id", userId);
  if (error) return { error: "Não foi possível renomear o modelo." };

  revalidatePath("/dashboard/modelos");
  revalidatePath(`/dashboard/modelos/${templateId}`);
  return { success: true };
}

export async function deleteTemplate(templateId: string) {
  const userId = await requireTrainer();
  if (!userId) return { error: "Apenas profissionais podem excluir modelos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("protocols")
    .delete()
    .eq("id", templateId)
    .eq("owner_trainer_id", userId);
  if (error) return { error: "Não foi possível excluir o modelo." };

  revalidatePath("/dashboard/modelos");
  return { success: true };
}

// Guarda uma cópia do protocolo de um aluno como modelo reutilizável.
export async function saveAsTemplate(protocolId: string, rawName: string) {
  const userId = await requireTrainer();
  if (!userId) return { error: "Apenas profissionais podem criar modelos." };
  const cleaned = cleanName(rawName);
  if ("error" in cleaned) return { error: cleaned.error };

  const supabase = await createClient();

  const { data: source } = await supabase
    .from("protocols")
    .select("type, notes")
    .eq("id", protocolId)
    .maybeSingle();
  if (!source) return { error: "Protocolo não encontrado." };

  const today = todayBR();
  const { data: template, error: insertError } = await supabase
    .from("protocols")
    .insert({
      owner_trainer_id: userId,
      template_name: cleaned.name,
      type: source.type,
      start_date: today,
      end_date: today,
      is_active: false,
      created_by: userId,
      notes: source.notes,
    })
    .select("id")
    .single();
  if (insertError || !template) {
    console.error("saveAsTemplate (criar modelo) falhou:", insertError?.message ?? "sem retorno");
    return { error: quotaMessage(insertError) ?? "Não foi possível salvar o modelo." };
  }

  const { error: copyError } = await supabase.rpc("copy_protocol_content", {
    p_source: protocolId,
    p_target: template.id,
  });
  if (copyError) {
    console.error("saveAsTemplate (copiar conteúdo) falhou:", copyError.message);
    // Não deixa um modelo vazio pela metade.
    await supabase.from("protocols").delete().eq("id", template.id).eq("owner_trainer_id", userId);
    return { error: "Não foi possível salvar o modelo." };
  }

  revalidatePath("/dashboard/modelos");
  return { success: true, templateId: template.id };
}

// Aplica um protocolo (modelo ou de outro aluno) a vários alunos de uma vez. Para cada
// aluno, o protocolo ativo do mesmo tipo vai para o histórico e o novo já nasce
// editável. Falhas isoladas não impedem os demais.
export async function applyToStudents(
  sourceProtocolId: string,
  type: ProtocolType,
  studentIds: string[],
  endDate: string
) {
  const userId = await requireTrainer();
  if (!userId) return { error: "Apenas profissionais podem atribuir protocolos." };

  const dateError = validateEndDate(endDate);
  if (dateError) return { error: dateError };

  const ids = [...new Set(studentIds)];
  if (!ids.length) return { error: "Escolha pelo menos um aluno." };
  if (ids.length > MAX_STUDENTS_PER_BATCH) {
    return { error: `Escolha no máximo ${MAX_STUDENTS_PER_BATCH} alunos por vez.` };
  }

  const supabase = await createClient();
  let applied = 0;
  let failed = 0;
  for (const studentId of ids) {
    const { error } = await supabase.rpc("apply_protocol", {
      p_source_protocol_id: sourceProtocolId,
      p_student_id: studentId,
      p_end_date: endDate,
    });
    if (error) {
      console.error("applyToStudents falhou:", error.message);
      failed += 1;
    } else {
      applied += 1;
      revalidateModule(studentId, moduleOf(type));
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/status");
  if (!applied) return { error: "Não foi possível atribuir o protocolo. Tente novamente." };
  return { success: true, applied, failed };
}

// Usado na tela do aluno: inicia o protocolo a partir de um modelo ou do protocolo
// ativo de outro aluno do mesmo profissional.
export async function startFromSource(
  studentId: string,
  type: ProtocolType,
  source: { kind: "template"; id: string } | { kind: "student"; id: string },
  endDate: string
) {
  const userId = await requireTrainer();
  if (!userId) return { error: "Apenas profissionais podem fazer isso." };

  const dateError = validateEndDate(endDate);
  if (dateError) return { error: dateError };

  const supabase = await createClient();

  let sourceProtocolId = source.id;
  if (source.kind === "student") {
    const { data } = await supabase
      .from("protocols")
      .select("id")
      .eq("student_id", source.id)
      .eq("type", type)
      .eq("is_active", true)
      .maybeSingle();
    if (!data) return { error: "Esse aluno não tem um protocolo ativo deste tipo." };
    sourceProtocolId = data.id;
  }

  const { data, error } = await supabase.rpc("apply_protocol", {
    p_source_protocol_id: sourceProtocolId,
    p_student_id: studentId,
    p_end_date: endDate,
  });
  if (error || !data) {
    console.error("startFromSource falhou:", error?.message ?? "sem retorno");
    return { error: "Não foi possível iniciar o protocolo. Tente novamente." };
  }

  revalidateModule(studentId, moduleOf(type));
  revalidatePath("/dashboard/status");
  return { success: true, protocolId: data };
}
