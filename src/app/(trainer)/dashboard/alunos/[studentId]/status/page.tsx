import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusReport, type StatusSearchParams } from "@/components/shared/status-report";

export default async function AlunoStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<StatusSearchParams>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("has_workout, has_diet")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  return (
    <StatusReport
      studentId={studentId}
      basePath={`/dashboard/alunos/${studentId}/status`}
      searchParams={await searchParams}
      showWorkout={student.has_workout}
      showDiet={student.has_diet}
    />
  );
}
