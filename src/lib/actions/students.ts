"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  studentSettingsSchema,
  type StudentSettingsInput,
} from "@/lib/validations/student.schema";

// Tira a pessoa do time: apaga o vínculo (e, em cascata, os protocolos que o
// profissional montou para ela) e devolve o papel de Usuário Padrão. A conta
// da pessoa NÃO é apagada — ela pode ter outros dados e entrou por conta própria.
export async function deleteStudent(studentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // RLS já restringe esta consulta ao aluno do próprio trainer logado —
  // se não pertencer a ele, a busca simplesmente não retorna nada.
  const { data: student, error: findError } = await supabase
    .from("students")
    .select("profile_id, trainer_id")
    .eq("id", studentId)
    .single();

  if (findError || !student) return { error: "Aluno não encontrado." };
  if (student.trainer_id !== user.id || student.profile_id === user.id) {
    return { error: "Aluno não encontrado." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("students").delete().eq("id", studentId);
  if (error) return { error: "Não foi possível remover o aluno." };

  await admin
    .from("profiles")
    .update({ role: "standard" })
    .eq("id", student.profile_id)
    .eq("role", "student");

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateStudentSettings(studentId: string, input: StudentSettingsInput) {
  const parsed = studentSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      nickname: parsed.data.nickname || null,
      has_workout: parsed.data.hasWorkout,
      has_diet: parsed.data.hasDiet,
    })
    .eq("id", studentId);

  if (error) return { error: "Não foi possível atualizar o aluno." };

  revalidatePath(`/dashboard/alunos/${studentId}`);
  revalidatePath(`/dashboard/alunos/${studentId}/treino`);
  revalidatePath(`/dashboard/alunos/${studentId}/dieta`);
  revalidatePath("/dashboard");
  return { success: true };
}
