import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";
import { StatusReport, type StatusSearchParams } from "@/components/shared/status-report";

export default async function AlunoStatusPage({
  searchParams,
}: {
  searchParams: Promise<StatusSearchParams>;
}) {
  const supabase = await createClient();
  const userId = await getSessionUserId();

  const { data: student } = await supabase
    .from("students")
    .select("id, has_workout, has_diet")
    .eq("profile_id", userId!)
    .neq("trainer_id", userId!)
    .single();

  if (!student) {
    return <p className="py-12 text-center text-muted-foreground">Nenhum status disponível.</p>;
  }

  return (
    <StatusReport
      studentId={student.id}
      basePath="/aluno/status"
      searchParams={await searchParams}
      showWorkout={student.has_workout}
      showDiet={student.has_diet}
    />
  );
}
