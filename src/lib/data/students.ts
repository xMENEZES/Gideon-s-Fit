import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";

// Leituras memoizadas por requisição: o layout e a página que precisam do mesmo aluno
// compartilham uma única consulta ao banco em vez de repeti-la.

// Vínculo de time do próprio usuário (aluno de um profissional).
export const getOwnTeamStudent = cache(async () => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, has_workout, has_diet")
    .eq("profile_id", userId)
    .neq("trainer_id", userId)
    .maybeSingle();
  return data;
});

// Aluno visto pelo profissional (o RLS já limita aos alunos dele).
export const getTrainerStudent = cache(async (studentId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, nickname, email, has_workout, has_diet, profiles!students_profile_id_fkey(full_name)")
    .eq("id", studentId)
    .maybeSingle();
  return data;
});
