import { getSoloStudentId } from "@/lib/team/solo";
import { StatusReport, type StatusSearchParams } from "@/components/shared/status-report";

export default async function MeuStatusPage({
  searchParams,
}: {
  searchParams: Promise<StatusSearchParams>;
}) {
  const studentId = await getSoloStudentId();
  if (!studentId) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Não foi possível carregar o seu status. Tente novamente.
      </p>
    );
  }

  return (
    <StatusReport
      studentId={studentId}
      basePath="/meu-plano/status"
      searchParams={await searchParams}
    />
  );
}
