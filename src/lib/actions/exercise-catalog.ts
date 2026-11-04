"use server";

import { quotaMessage } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUserId } from "@/lib/auth/session";
import { cleanCatalogName, isMuscleGroup, type CatalogItem } from "@/lib/exercise-catalog";

// Quem monta plano (profissional e Usuário Padrão). O banco confere de novo (RLS e função
// can_edit_plans): isto só dá a mensagem certa antes de chegar lá.
async function requirePlanEditor() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const profile = await getProfile();
  return profile && (profile.role === "trainer" || profile.role === "standard") ? userId : null;
}

// Nomes que a pessoa pode ver: os do sistema e os que ela guardou (o RLS já limita a isso).
// Erro vira lista vazia: o catálogo só sugere, nunca derruba a tela de montar o treino.
export async function listExerciseCatalog(): Promise<CatalogItem[]> {
  try {
    const userId = await requirePlanEditor();
    if (!userId) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("exercise_catalog")
      .select("id, owner_id, name, muscle_group")
      .order("name", { ascending: true });
    return (data ?? []).flatMap((row) =>
      isMuscleGroup(row.muscle_group)
        ? [{ id: row.id, name: row.name, group: row.muscle_group, own: row.owner_id !== null }]
        : []
    );
  } catch {
    return [];
  }
}

// Guarda um nome para a própria pessoa. Nome que ela já guardou conta como sucesso.
export async function saveCatalogName(rawName: string, group: string) {
  const userId = await requirePlanEditor();
  if (!userId) return { error: "Apenas quem monta treinos guarda nomes no catálogo." };

  const name = cleanCatalogName(rawName);
  if (!name) return { error: "O nome precisa ter de 2 a 120 caracteres." };
  if (!isMuscleGroup(group)) return { error: "Escolha o grupo muscular." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("exercise_catalog")
    .insert({ owner_id: userId, name, muscle_group: group });
  if (error && error.code !== "23505") {
    return { error: quotaMessage(error) ?? "Não foi possível guardar o nome no catálogo." };
  }
  return { success: true };
}

// Remove um nome que a própria pessoa guardou (o RLS impede apagar os do sistema e os de outras pessoas).
export async function deleteCatalogName(id: string) {
  const userId = await requirePlanEditor();
  if (!userId) return { error: "Apenas quem monta treinos gerencia o catálogo." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_catalog")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId)
    .select("id");
  if (error || !data?.length) return { error: "Não foi possível remover o nome." };
  return { success: true };
}
