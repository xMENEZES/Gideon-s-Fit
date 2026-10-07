"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Exclusão definitiva da PRÓPRIA conta. Só vale para a sessão logada e exige que a pessoa
// digite o e-mail da conta. Apagar o usuário de autenticação remove em cascata o perfil, os
// vínculos, os protocolos, as refeições, as cargas e os registros.
//
// Profissional com time: antes de apagar, os alunos do time são desvinculados e voltam a ser
// Usuários Padrão (a conta deles continua; só o que o profissional montou para eles é apagado,
// como em "Remover aluno").
export async function deleteMyAccount(confirmEmail: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Não autenticado." };

  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return { error: "O e-mail digitado não confere com o da sua conta." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { error: "Conta não encontrada." };
  if (profile.role === "admin") {
    return { error: "A conta de administrador não pode ser excluída por aqui." };
  }

  if (profile.role === "trainer") {
    const { data: team, error: teamError } = await admin
      .from("students")
      .select("id, profile_id")
      .eq("trainer_id", user.id)
      .neq("profile_id", user.id);
    if (teamError) return { error: "Não foi possível preparar a exclusão. Tente novamente." };

    if (team?.length) {
      const { error: detachError } = await admin
        .from("students")
        .delete()
        .in("id", team.map((member) => member.id));
      if (detachError) return { error: "Não foi possível desvincular o seu time. Tente novamente." };

      await admin
        .from("profiles")
        .update({ role: "standard" })
        .in("id", team.map((member) => member.profile_id))
        .eq("role", "student");
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { error: "Não foi possível excluir a conta. Tente novamente em instantes." };
  }

  // A sessão já não vale mais; isto só limpa os cookies deste navegador.
  try {
    await supabase.auth.signOut();
  } catch {
    // sem efeito: a conta já foi excluída
  }
  return { success: true };
}
