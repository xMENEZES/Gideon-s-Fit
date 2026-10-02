"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUserId } from "@/lib/auth/session";

// Único caminho para definir o perfil no primeiro acesso (ex.: login com Google).
// Usa o service role porque o usuário não tem permissão de alterar `role`, e só
// funciona enquanto `onboarded = false` — depois disso o perfil não muda mais
// por aqui, então não serve para se promover depois.
export async function chooseProfile(role: "trainer" | "standard") {
  if (role !== "trainer" && role !== "standard") {
    return { error: "Perfil inválido." };
  }

  const userId = await getSessionUserId();
  if (!userId) return { error: "Não autenticado." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ role, onboarded: true })
    .eq("id", userId)
    .eq("onboarded", false)
    .select("id");

  if (error) return { error: "Não foi possível salvar o perfil." };
  if (!data?.length) return { error: "O perfil já foi definido para esta conta." };

  return { success: true };
}
