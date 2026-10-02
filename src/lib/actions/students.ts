"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  studentSchema,
  studentSettingsSchema,
  type StudentInput,
  type StudentSettingsInput,
} from "@/lib/validations/student.schema";

export async function createStudentAndInvite(input: StudentInput) {
  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // A conta Auth do aluno é criada primeiro (via convite); só inserimos o
  // registro em `students` se o convite for enviado com sucesso — evita
  // deixar alunos "pendentes" sem usuário vinculado. O próprio aluno define
  // nome e senha ao aceitar o convite (tela /definir-senha).
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { role: "student" },
      redirectTo: `${siteUrl}/auth/callback`,
    }
  );

  if (inviteError || !invited?.user) {
    const alreadyExists =
      inviteError?.status === 422 ||
      inviteError?.message?.toLowerCase().includes("already registered");
    const rateLimited =
      inviteError?.status === 429 || inviteError?.code === "over_email_send_rate_limit";
    return {
      error: alreadyExists
        ? "Este email já está cadastrado no sistema (talvez com outro profissional)."
        : rateLimited
          ? "Muitos convites enviados recentemente. Aguarde alguns minutos e tente novamente."
          : "Não foi possível enviar o convite para o aluno. Tente novamente.",
    };
  }

  const { error: insertError } = await supabase.from("students").insert({
    trainer_id: user.id,
    profile_id: invited.user.id,
    email: parsed.data.email,
    nickname: parsed.data.nickname || null,
    birth_date: parsed.data.birthDate || null,
    notes: parsed.data.notes || null,
    has_workout: parsed.data.hasWorkout,
    has_diet: parsed.data.hasDiet,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    return { error: "Não foi possível cadastrar o aluno. Tente novamente." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteStudent(studentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // RLS já restringe esta consulta ao aluno do próprio trainer logado —
  // se não pertencer a ele, a busca simplesmente não retorna nada.
  const { data: student, error: findError } = await supabase
    .from("students")
    .select("profile_id")
    .eq("id", studentId)
    .single();

  if (findError || !student) return { error: "Aluno não encontrado." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(student.profile_id);
  if (error) return { error: "Não foi possível remover o aluno." };

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
