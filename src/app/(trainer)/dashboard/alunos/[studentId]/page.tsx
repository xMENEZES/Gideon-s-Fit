import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function StudentBasePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("has_workout, has_diet")
    .eq("id", studentId)
    .single();

  if (!student) notFound();
  if (student.has_workout) redirect(`/dashboard/alunos/${studentId}/treino`);
  if (student.has_diet) redirect(`/dashboard/alunos/${studentId}/dieta`);
  notFound();
}
