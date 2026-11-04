import { getTeamStatusSummaries } from "@/lib/data/team-status";
import { dietSummaryText, workoutSummaryText } from "@/lib/status-summary";
import { Skeleton } from "@/components/ui/skeleton";

// Resumo do status de um aluno dentro do card da lista. Fica num <Suspense> na lista: os nomes
// aparecem na hora e os números chegam quando as consultas terminam.
export async function StudentStatusSummary({ studentId }: { studentId: string }) {
  const summary = (await getTeamStatusSummaries()).get(studentId);

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-border pt-3 text-sm">
      <div className="flex min-w-0 flex-col">
        <dt className="text-xs text-muted-foreground">Treino</dt>
        <dd className="font-medium">{workoutSummaryText(summary?.workout ?? null)}</dd>
      </div>
      <div className="flex min-w-0 flex-col">
        <dt className="text-xs text-muted-foreground">Alimentar</dt>
        <dd className="font-medium">{dietSummaryText(summary?.diet ?? null)}</dd>
      </div>
    </dl>
  );
}

export function StudentStatusSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
