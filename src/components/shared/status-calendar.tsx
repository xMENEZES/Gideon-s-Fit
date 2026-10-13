"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAYS, formatDate } from "@/lib/status-format";
import {
  clampMonth,
  isInSelection,
  monthCells,
  monthLabel,
  monthOf,
  selectionLabel,
  shiftMonth,
  type DayMarks,
  type DietMark,
  type Selection,
} from "@/lib/status-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type PeriodPreset = { label: string; href: string; active: boolean };

const chipClass = "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors";

const DIET_LABEL: Record<Exclude<DietMark, null>, string> = {
  complete: "alimentação completa",
  missed: "alimentação com refeição não feita",
  pending: "alimentação sem registro",
  progress: "alimentação em andamento",
};

function describeDay(date: string, marks: DayMarks | undefined) {
  const parts = [formatDate(date)];
  if (marks?.workout) parts.push("treinou");
  if (marks?.diet) parts.push(DIET_LABEL[marks.diet]);
  return parts.join(", ");
}

function Dots({ marks }: { marks: DayMarks | undefined }) {
  if (!marks || (!marks.workout && !marks.diet)) return <span className="h-1.5" />;
  return (
    <span className="flex h-1.5 items-center gap-0.5">
      {marks.workout && <span className="size-1.5 rounded-full bg-sky-400" />}
      {marks.diet === "complete" && <span className="size-1.5 rounded-full bg-primary" />}
      {marks.diet === "missed" && <span className="size-1.5 rounded-full bg-destructive" />}
      {marks.diet === "pending" && <span className="size-1.5 rounded-full border border-muted-foreground" />}
      {marks.diet === "progress" && <span className="size-1.5 rounded-full border border-primary" />}
    </span>
  );
}

// Calendário do mês da tela de Status: toque num dia para ver o dia; toque em outro para ver o
// período entre os dois. Só os dias com dados (de `first` a `last`) podem ser tocados.
export function StatusCalendar({
  today,
  first,
  last,
  marks,
  selection,
  onSelect,
  onClear,
  presets,
}: {
  today: string;
  first: string;
  last: string;
  marks: Record<string, DayMarks>;
  selection: Selection | null;
  onSelect: (date: string) => void;
  onClear: () => void;
  presets: PeriodPreset[];
}) {
  const [month, setMonth] = useState(() => clampMonth(monthOf(today), first, last));
  const cells = monthCells(month);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário</CardTitle>
        <CardDescription>
          Toque num dia para ver o detalhe dele. Toque em outro dia para ver o período entre os dois.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Link
              key={preset.label}
              href={preset.href}
              scroll={false}
              className={cn(
                chipClass,
                preset.active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
              )}
            >
              {preset.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:max-w-md">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Mês anterior"
              disabled={month <= monthOf(first)}
              onClick={() => setMonth((current) => shiftMonth(current, -1))}
            >
              <ChevronLeft />
            </Button>
            <p className="text-sm font-medium">{monthLabel(month)}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Próximo mês"
              disabled={month >= monthOf(last)}
              onClick={() => setMonth((current) => shiftMonth(current, 1))}
            >
              <ChevronRight />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {WEEKDAYS.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              if (!date) return <span key={`blank-${index}`} />;
              const available = date >= first && date <= last;
              const selected = isInSelection(date, selection);
              const edge = selection && (date === selection.from || date === selection.to);
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!available}
                  onClick={() => onSelect(date)}
                  aria-pressed={selected}
                  aria-label={describeDay(date, marks[date])}
                  className={cn(
                    "flex h-10 flex-col items-center justify-center gap-0.5 rounded-md border text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    available ? "border-border hover:bg-muted" : "border-transparent opacity-30",
                    selected && "border-primary bg-primary/15",
                    edge && "bg-primary/30 ring-2 ring-primary",
                    date === today && !selected && "ring-2 ring-ring"
                  )}
                >
                  {Number(date.slice(8))}
                  <Dots marks={available ? marks[date] : undefined} />
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-sky-400" /> treino
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-primary" /> alimentação completa
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-destructive" /> não feita
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full border border-muted-foreground" /> sem registro
            </span>
          </div>
        </div>

        {selection && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
            <span>
              Selecionado: <span className="font-medium">{selectionLabel(selection)}</span>
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              Limpar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
