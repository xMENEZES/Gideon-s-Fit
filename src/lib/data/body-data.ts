import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";

export type BodyData = {
  birth_date: string;
  height_cm: number | null;
  weight_kg: number | null;
  consented_at: string;
  updated_at: string;
};

const COLUMNS = "birth_date, height_cm, weight_kg, consented_at, updated_at";

// Dados corporais da própria pessoa (null = ainda não informou). Memoizada por requisição.
export const getMyBodyData = cache(async (): Promise<BodyData | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("body_data").select(COLUMNS).eq("profile_id", userId).maybeSingle();
  return data;
});

// Dados corporais de um aluno, vistos pelo profissional. Quem decide o acesso é o banco (RLS):
// só aparecem os de alunos do time dele. null = o aluno ainda não informou (ou não é do time).
export const getStudentBodyData = cache(async (studentId: string): Promise<BodyData | null> => {
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("profile_id").eq("id", studentId).maybeSingle();
  if (!student) return null;

  const { data } = await supabase.from("body_data").select(COLUMNS).eq("profile_id", student.profile_id).maybeSingle();
  return data;
});
