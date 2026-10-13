import { ChevronDown } from "lucide-react";
import { describeWorkoutEntry, type MealDayStatus, type WorkoutEntry } from "@/lib/status";
import { formatDate, weekday } from "@/lib/status-format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Peças visuais da tela de Status, usadas pelo painel interativo (status-explorer.tsx).

export function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-lg font-semibold",
          tone === "good" && "text-primary",
          tone === "bad" && "text-destructive"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// "Mais N ...": lista recolhida para o que passa do limite à vista.
export function MoreDetails({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </details>
  );
}

// Um dia treinado, recolhível: data, quantos exercícios e registros e, aberto, cada registro.
export function TrainedDay({ date, entries, open }: { date: string; entries: WorkoutEntry[]; open: boolean }) {
  const exercises = new Set(entries.map((entry) => entry.exercise)).size;
  return (
    <details open={open} className="group rounded-lg border border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="whitespace-nowrap text-sm font-medium">
          {weekday(date)}, {formatDate(date)}
        </span>
        <span className="flex items-center gap-1.5 text-right text-xs text-muted-foreground">
          {exercises} {exercises === 1 ? "exercício" : "exercícios"} · {entries.length}{" "}
          {entries.length === 1 ? "registro" : "registros"}
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="flex flex-wrap gap-1.5 px-3 pb-2">
        {entries.map((entry, index) => (
          <Badge key={index} variant="secondary" className="font-normal">
            {describeWorkoutEntry(entry)}
          </Badge>
        ))}
      </div>
    </details>
  );
}

// Um dia da alimentação: feitas, barra de progresso e o que ficou "não feito" ou sem registro.
export function MealDayCard({ day }: { day: MealDayStatus }) {
  const donePct = day.total ? (day.done / day.total) * 100 : 0;
  const missedPct = day.total ? (day.missed.length / day.total) * 100 : 0;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          {weekday(day.date)}, {formatDate(day.date)}
          {day.inProgress && (
            <Badge variant="secondary" className="font-normal">
              Em andamento
            </Badge>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {day.done} de {day.total} {day.total === 1 ? "feita" : "feitas"}
        </p>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-primary" style={{ width: `${donePct}%` }} />
        <div className="bg-destructive" style={{ width: `${missedPct}%` }} />
      </div>
      {(day.missed.length > 0 || day.unmarked > 0) && (
        <ul className="flex flex-col gap-1 text-sm">
          {day.missed.map((missed, index) => (
            <li key={index} className="text-muted-foreground">
              <span className="font-medium text-destructive">Não fez:</span> {missed.meal}
              {missed.note && <span className="italic"> ({missed.note})</span>}
            </li>
          ))}
          {day.unmarked > 0 && (
            <li className="text-muted-foreground">
              {day.unmarked}{" "}
              {day.inProgress
                ? day.unmarked === 1
                  ? "refeição ainda sem registro"
                  : "refeições ainda sem registro"
                : day.unmarked === 1
                  ? "refeição sem registro"
                  : "refeições sem registro"}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// Ocorrência de um período: só o que ficou "não feito", com o motivo.
export function MissedDay({ day }: { day: MealDayStatus }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2 text-sm">
      <p className="font-medium">
        {weekday(day.date)}, {formatDate(day.date)}
      </p>
      <ul className="flex flex-col gap-1">
        {day.missed.map((missed, index) => (
          <li key={index} className="text-muted-foreground">
            <span className="font-medium text-destructive">Não fez:</span> {missed.meal}
            {missed.note && <span className="italic"> ({missed.note})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
