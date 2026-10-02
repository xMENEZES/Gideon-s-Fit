"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, getSessionUserId } from "@/lib/auth/session";

// Sem 0/O/1/I para o código ser fácil de ler e digitar.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

function randomCode() {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

async function requireTrainer() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const profile = await getProfile();
  return profile?.role === "trainer" && profile.onboarded ? userId : null;
}

export async function generateTeamCode() {
  const trainerId = await requireTrainer();
  if (!trainerId) return { error: "Apenas profissionais podem gerar o código do time." };

  const admin = createAdminClient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await admin
      .from("team_codes")
      .upsert(
        { trainer_id: trainerId, code: randomCode(), created_at: new Date().toISOString() },
        { onConflict: "trainer_id" }
      );
    if (!error) {
      revalidatePath("/dashboard");
      return { success: true };
    }
    if (error.code !== "23505") break; // só tenta de novo se o código sorteado já existir
  }
  return { error: "Não foi possível gerar o código. Tente novamente." };
}

export async function requestToJoinTeam(rawCode: string) {
  const userId = await getSessionUserId();
  const profile = await getProfile();
  if (!userId || !profile) return { error: "Não autenticado." };
  if (profile.role === "student") return { error: "Você já faz parte de um time." };
  if (profile.role !== "standard") {
    return { error: "Apenas Usuários Padrão podem entrar no time de um profissional." };
  }

  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== CODE_LENGTH) return { error: "Código inválido." };

  const admin = createAdminClient();

  // Toda tentativa conta, acertando ou errando: impede adivinhar códigos.
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("team_join_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }
  await admin.from("team_join_attempts").insert({ user_id: userId });

  const { data: team } = await admin
    .from("team_codes")
    .select("trainer_id")
    .eq("code", code)
    .maybeSingle();
  if (!team) return { error: "Código inválido." };

  const { data: trainer } = await admin
    .from("profiles")
    .select("full_name, role")
    .eq("id", team.trainer_id)
    .single();
  if (!trainer || trainer.role !== "trainer") return { error: "Código inválido." };

  const { data: existing } = await admin
    .from("team_join_requests")
    .select("id")
    .eq("trainer_id", team.trainer_id)
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (!existing) {
    const { error } = await admin
      .from("team_join_requests")
      .insert({ trainer_id: team.trainer_id, user_id: userId });
    if (error) return { error: "Não foi possível enviar a solicitação." };
  }

  revalidatePath("/meu-plano/time");
  revalidatePath("/dashboard");
  return { success: true, trainerName: trainer.full_name };
}

export async function cancelJoinRequest(requestId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Não autenticado." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_join_requests")
    .delete()
    .eq("id", requestId)
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) return { error: "Não foi possível cancelar a solicitação." };

  revalidatePath("/meu-plano/time");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function decideJoinRequest(requestId: string, decision: "approve" | "reject") {
  const trainerId = await requireTrainer();
  if (!trainerId) return { error: "Apenas profissionais podem decidir solicitações." };

  const admin = createAdminClient();
  const { data: request } = await admin
    .from("team_join_requests")
    .select("id, user_id")
    .eq("id", requestId)
    .eq("trainer_id", trainerId)
    .eq("status", "pending")
    .maybeSingle();

  if (!request) return { error: "Solicitação não encontrada." };

  const decidedAt = new Date().toISOString();

  if (decision === "reject") {
    const { error } = await admin
      .from("team_join_requests")
      .update({ status: "rejected", decided_at: decidedAt })
      .eq("id", request.id);
    if (error) return { error: "Não foi possível recusar a solicitação." };

    revalidatePath("/dashboard");
    revalidatePath("/meu-plano/time");
    return { success: true };
  }

  const { data: requester } = await admin
    .from("profiles")
    .select("email, role")
    .eq("id", request.user_id)
    .single();

  if (!requester || requester.role !== "standard") {
    await admin
      .from("team_join_requests")
      .update({ status: "rejected", decided_at: decidedAt })
      .eq("id", request.id);
    revalidatePath("/dashboard");
    return { error: "Essa pessoa já não pode entrar no time (ela já está em outro time)." };
  }

  const { error: insertError } = await admin.from("students").insert({
    trainer_id: trainerId,
    profile_id: request.user_id,
    email: requester.email,
    has_workout: true,
    has_diet: true,
  });
  if (insertError) return { error: "Não foi possível adicionar a pessoa ao time." };

  await admin
    .from("profiles")
    .update({ role: "student" })
    .eq("id", request.user_id)
    .eq("role", "standard");

  await admin
    .from("team_join_requests")
    .update({ status: "approved", decided_at: decidedAt })
    .eq("id", request.id);

  // Quem entrou num time não pode ter outras solicitações abertas.
  await admin
    .from("team_join_requests")
    .update({ status: "rejected", decided_at: decidedAt })
    .eq("user_id", request.user_id)
    .eq("status", "pending");

  revalidatePath("/dashboard");
  return { success: true };
}

// O aluno sai do time por conta própria. Mesmo efeito de "Remover aluno" feito
// pelo profissional: apaga o vínculo (e, em cascata, o que o profissional montou)
// e devolve o papel de Usuário Padrão — o plano próprio dele reaparece.
export async function leaveTeam() {
  const userId = await getSessionUserId();
  const profile = await getProfile();
  if (!userId || !profile) return { error: "Não autenticado." };
  if (profile.role !== "student") return { error: "Você não faz parte de nenhum time." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("students")
    .delete()
    .eq("profile_id", userId)
    .neq("trainer_id", userId);
  if (error) return { error: "Não foi possível sair do time. Tente novamente." };

  await admin.from("profiles").update({ role: "standard" }).eq("id", userId).eq("role", "student");

  revalidatePath("/dashboard");
  return { success: true };
}
