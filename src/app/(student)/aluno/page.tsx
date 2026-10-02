import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AlunoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: student } = await supabase
    .from("students")
    .select("has_workout, has_diet")
    .eq("profile_id", user!.id)
    .single();

  if (student?.has_diet && !student.has_workout) {
    redirect("/aluno/dieta");
  }
  redirect("/aluno/treino");
}
