import { Check, ChevronDown, Minus, X } from "lucide-react";
import { groupWorkoutEntries, type MealDayStatus, type WorkoutEntry } from "@/lib/status";
import { formatDate, weekday } from "@/lib/status-format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Peças visuais da tela de Status, usadas pelo painel interativo (status-explorer.tsx).
// Todo texto que vem do usuário (nome de exercício e de refeição, anotação) quebra de linha:
// sem isso, nomes longos estouravam a largura no celular.

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
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-border px-3 py-2">
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

// Treino do dia: por dia do protocolo e exercício, com cada série registrada.
export function WorkoutDayHistory({ entries }: { entries: WorkoutEntry[] }) {
  const groups = groupWorkoutEntries(entries);
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div key={group.day} className="flex flex-col gap-2">
          {groups.length > 1 && (
            <p className="break-words text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.day}
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {group.exercises.map((exercise) => (
              <li key={exercise.name} className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2">
                <p className="break-words text-sm font-medium">{exercise.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.sets.map((set, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="h-auto max-w-full whitespace-normal break-words py-0.5 text-left font-normal"
                    >
                      {set}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Refeições do dia, uma por linha: ✓ feita, ✕ não feita (com o motivo) ou sem registro.
export function MealDayHistory({ day }: { day: MealDayStatus }) {
  const donePct = day.total ? (day.done / day.total) * 100 : 0;
  const missedPct = day.total ? (day.missed.length / day.total) * 100 : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {day.done} de {day.total} {day.total === 1 ? "feita" : "feitas"}
        </span>
        {day.inProgress && (
          <Badge variant="secondary" className="font-normal">
            Em andamento
          </Badge>
        )}
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-primary" style={{ width: `${donePct}%` }} />
        <div className="bg-destructive" style={{ width: `${missedPct}%` }} />
      </div>
      <ul className="flex flex-col gap-1.5">
        {day.meals.map((meal, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                meal.state === "done" && "bg-primary text-primary-foreground",
                meal.state === "missed" && "bg-destructive text-white",
                meal.state === "none" && "border border-border text-muted-foreground"
              )}
              aria-label={
                meal.state === "done" ? "feita" : meal.state === "missed" ? "não feita" : "sem registro"
              }
            >
              {meal.state === "done" && <Check className="size-3.5" />}
              {meal.state === "missed" && <X className="size-3.5" />}
              {meal.state === "none" && <Minus className="size-3.5" />}
            </span>
            <span className="min-w-0 break-words">
              {meal.name}
              {meal.note && <span className="italic text-muted-foreground"> ({meal.note})</span>}
            </span>
          </li>
        ))}
      </ul>
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
          <li key={index} className="break-words text-muted-foreground">
            <span className="font-medium text-destructive">Não fez:</span> {missed.meal}
            {missed.note && <span className="italic"> ({missed.note})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
