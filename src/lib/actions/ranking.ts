"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUserId } from "@/lib/auth/session";

// O profissional liga ou desliga o ranking do time. O banco confere de novo (RLS): só o próprio
// profissional grava a própria configuração.
export async function setTeamRanking(enabled: boolean) {
  const userId = await getSessionUserId();
  const profile = await getProfile();
  if (!userId || !profile) return { error: "Não autenticado." };
  if (profile.role !== "trainer") return { error: "Apenas profissionais configuram o ranking do time." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("trainer_settings")
    .upsert(
      { trainer_id: userId, ranking_enabled: enabled, updated_at: new Date().toISOString() },
      { onConflict: "trainer_id" }
    );
  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/dashboard/mensagens");
  revalidatePath("/aluno", "layout");
  return { success: true };
}

// O aluno do time aceita ou deixa de participar do ranking (só ele altera a própria participação).
export async function setRankingParticipation(join: boolean) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Não autenticado." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_ranking_participation", { p_join: join });
  if (error) return { error: "Não foi possível salvar. Tente novamente." };
  if (!data) {
    return {
      error: join
        ? "O ranking do seu time não está ligado."
        : "Você não faz parte de um time.",
    };
  }

  revalidatePath("/aluno/ranking");
  revalidatePath("/dashboard/mensagens");
  return { success: true };
}
