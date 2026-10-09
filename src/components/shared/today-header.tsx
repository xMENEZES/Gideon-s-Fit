import Link from "next/link";
import { AlertTriangle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { capitalize, daysUntil, fullDate, shortDate, weekdayName } from "@/lib/today";

// Cabeçalho das telas diárias: título, dia da semana e data de hoje, uma linha com o período
// do protocolo e o botão que leva à tela completa (editar o plano, ou só vê-lo, no caso do aluno).
export function TodayHeader({
  title,
  today,
  endDate,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  today: string;
  endDate: string;
  actionHref: string;
  actionLabel: string;
  children?: React.ReactNode;
}) {
  const remaining = daysUntil(endDate, today);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {capitalize(weekdayName(today))}, {shortDate(today)}
          </p>
        </div>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={actionHref} />}>
          {actionLabel}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="size-3.5 shrink-0" />
        <span>Protocolo até {fullDate(endDate)}</span>
        {remaining < 0 ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle />
            Vencido há {Math.abs(remaining)} {Math.abs(remaining) === 1 ? "dia" : "dias"}
          </Badge>
        ) : (
          <span>
            (
            {remaining === 0
              ? "vence hoje"
              : `${remaining} ${remaining === 1 ? "dia restante" : "dias restantes"}`}
            )
          </span>
        )}
      </div>

      {children}
    </div>
  );
}
