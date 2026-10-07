import { getOwnTeamStudent } from "@/lib/data/students";
import { StatusReport, type StatusSearchParams } from "@/components/shared/status-report";

export default async function AlunoStatusPage({
  searchParams,
}: {
  searchParams: Promise<StatusSearchParams>;
}) {
  const student = await getOwnTeamStudent();

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
