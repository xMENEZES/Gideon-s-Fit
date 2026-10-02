"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteTrainerSchema, type InviteTrainerInput } from "@/lib/validations/admin.schema";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? user : null;
}

export async function inviteTrainer(input: InviteTrainerInput) {
  const parsed = inviteTrainerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const caller = await requireAdmin();
  if (!caller) return { error: "Apenas o administrador pode convidar profissionais." };

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { role: "trainer" },
    redirectTo: `${siteUrl}/auth/callback`,
  });

  if (inviteError) {
    const alreadyExists =
      inviteError.status === 422 || inviteError.message?.toLowerCase().includes("already registered");
    const rateLimited =
      inviteError.status === 429 || inviteError.code === "over_email_send_rate_limit";
    return {
      error: alreadyExists
        ? "Este email já está cadastrado no sistema."
        : rateLimited
          ? "Muitos convites enviados recentemente. Aguarde alguns minutos e tente novamente."
          : "Não foi possível enviar o convite. Tente novamente.",
    };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteTrainer(trainerId: string) {
  const caller = await requireAdmin();
  if (!caller) return { error: "Apenas o administrador pode remover profissionais." };

  const admin = createAdminClient();

  const { count, error: countError } = await admin
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("trainer_id", trainerId);

  if (countError) return { error: "Não foi possível verificar os alunos deste profissional." };
  if (count && count > 0) {
    return { error: "Remova os alunos deste profissional antes de excluí-lo." };
  }

  const { error } = await admin.auth.admin.deleteUser(trainerId);
  if (error) return { error: "Não foi possível remover o profissional." };

  revalidatePath("/admin");
  return { success: true };
}

export async function adminDeleteStudent(studentId: string) {
  const caller = await requireAdmin();
  if (!caller) return { error: "Apenas o administrador pode remover alunos por aqui." };

  const admin = createAdminClient();
  const { data: student, error: findError } = await admin
    .from("students")
    .select("profile_id, trainer_id")
    .eq("id", studentId)
    .single();

  if (findError || !student) return { error: "Aluno não encontrado." };

  const { error } = await admin.auth.admin.deleteUser(student.profile_id);
  if (error) return { error: "Não foi possível remover o aluno." };

  revalidatePath(`/admin/profissionais/${student.trainer_id}`);
  revalidatePath("/admin");
  return { success: true };
}
