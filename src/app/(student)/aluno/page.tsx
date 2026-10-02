import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";

export default async function AlunoPage() {
  const supabase = await createClient();
  const userId = await getSessionUserId();

  const { data: student } = await supabase
    .from("students")
    .select("has_workout, has_diet")
    .eq("profile_id", userId!)
    .neq("trainer_id", userId!)
    .single();

  if (student?.has_diet && !student.has_workout) {
    redirect("/aluno/dieta");
  }
  redirect("/aluno/treino");
}
