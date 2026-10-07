import { notFound } from "next/navigation";
import { getTrainerStudent } from "@/lib/data/students";
import { StatusReport, type StatusSearchParams } from "@/components/shared/status-report";

export default async function AlunoStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<StatusSearchParams>;
}) {
  const { studentId } = await params;
  // Mesma leitura do layout da ficha, compartilhada (sem consulta extra).
  const student = await getTrainerStudent(studentId);
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
