import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, getSessionUserId } from "@/lib/auth/session";

// O plano próprio do Usuário Padrão é uma linha em `students` em que ele é, ao
// mesmo tempo, o "profissional" e o "aluno" (trainer_id = profile_id). Assim as
// regras de acesso e as telas de edição existentes funcionam sem mudanças. A
// linha é criada na primeira visita à área "Meu plano".
export const getSoloStudentId = cache(async (): Promise<string | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const find = () =>
    supabase
      .from("students")
      .select("id")
      .eq("trainer_id", userId)
      .eq("profile_id", userId)
      .maybeSingle();

  const { data: existing } = await find();
  if (existing) return existing.id;

  const profile = await getProfile();
  if (profile?.role !== "standard") return null;

  const admin = createAdminClient();
  const { data: owner } = await admin.from("profiles").select("email").eq("id", userId).single();
  if (!owner) return null;

  const { data: created, error } = await admin
    .from("students")
    .insert({
      trainer_id: userId,
      profile_id: userId,
      email: owner.email,
      has_workout: true,
      has_diet: true,
    })
    .select("id")
    .single();

  if (created) return created.id;

  // Outra requisição pode ter criado a linha no mesmo instante.
  if (error) {
    const { data: raced } = await find();
    return raced?.id ?? null;
  }
  return null;
});
