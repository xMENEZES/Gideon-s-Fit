import { pointsLabel, type RankedRow } from "@/lib/ranking";
import { cn } from "@/lib/utils";

// Lista de posições do ranking do mês. Usada na tela do aluno (que destaca a própria linha) e na do
// profissional (nenhuma linha é "você").
export function RankingList({ rows }: { rows: RankedRow[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((row) => (
        <li
          key={`${row.position}-${row.display_name}-${row.is_me}`}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-3 py-2",
            row.is_me ? "border-primary-ink bg-primary/10" : "border-border"
          )}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              row.position === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
            aria-label={`${row.position}º lugar`}
          >
            {row.position}º
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">
            {row.display_name}
            {row.is_me && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(você)</span>}
          </span>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{pointsLabel(row.total_points)}</span>
        </li>
      ))}
    </ol>
  );
}
