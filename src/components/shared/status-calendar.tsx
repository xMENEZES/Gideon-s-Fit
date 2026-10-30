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
  type CircleState,
  type DayMarks,
  type Selection,
} from "@/lib/status-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type PeriodPreset = { label: string; href: string; active: boolean };

const chipClass = "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors";

// Cores do calendário (verde, amarelo e vermelho de status, e azul para o descanso): são cores de
// significado e valem só aqui, o resto do app usa o roxo da marca. Sem estado = só o contorno.
const CIRCLE_CLASS: Record<CircleState, string> = {
  none: "border border-muted-foreground/60",
  complete: "bg-green-500",
  partial: "bg-amber-400",
  missed: "bg-red-500",
  rest: "bg-sky-400",
};

const WORKOUT_LABEL: Record<CircleState, string | null> = {
  none: null,
  complete: "treino completo",
  partial: "treino incompleto",
  missed: "nenhum exercício feito",
  rest: "dia de descanso",
};

const DIET_LABEL: Record<CircleState, string | null> = {
  none: null,
  complete: "alimentação completa",
  partial: "alimentação incompleta",
  missed: "nenhuma refeição feita",
  rest: null,
};

function describeDay(date: string, marks: DayMarks | undefined) {
  const parts = [formatDate(date)];
  const workout = marks && WORKOUT_LABEL[marks.workout];
  const diet = marks && DIET_LABEL[marks.diet];
  if (workout) parts.push(workout);
  if (diet) parts.push(diet);
  return parts.join(", ");
}

// Sempre dois círculos: o da esquerda é o treino, o da direita a alimentação.
function Dots({ marks }: { marks: DayMarks | undefined }) {
  return (
    <span className="flex h-2 items-center gap-1" aria-hidden="true">
      <span className={cn("size-2 rounded-full", CIRCLE_CLASS[marks?.workout ?? "none"])} />
      <span className={cn("size-2 rounded-full", CIRCLE_CLASS[marks?.diet ?? "none"])} />
    </span>
  );
}

function LegendDot({ state, label }: { state: CircleState; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("size-2 rounded-full", CIRCLE_CLASS[state])} /> {label}
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
  clearable = true,
  footer,
}: {
  today: string;
  first: string;
  last: string;
  marks: Record<string, DayMarks>;
  selection: Selection | null;
  onSelect: (date: string) => void;
  onClear: () => void;
  presets: PeriodPreset[];
  // Mostra "Limpar" só quando a seleção veio de um toque (o dia padrão não tem o que limpar).
  clearable?: boolean;
  // Conteúdo extra no fim do cartão (protocolo escolhido e troca de protocolo).
  footer?: React.ReactNode;
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
                preset.active ? "border-primary-ink bg-primary text-primary-foreground" : "border-border hover:bg-muted"
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
                    selected && "border-primary-ink bg-primary/15",
                    edge && "bg-primary/30 ring-2 ring-primary-ink",
                    date === today && !selected && "ring-2 ring-ring"
                  )}
                >
                  {Number(date.slice(8))}
                  <Dots marks={marks[date]} />
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <p>Em cada dia, o círculo da esquerda é o treino e o da direita é a alimentação.</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <LegendDot state="complete" label="completo" />
              <LegendDot state="partial" label="incompleto" />
              <LegendDot state="missed" label="nada feito" />
              <LegendDot state="rest" label="descanso" />
              <LegendDot state="none" label="sem avaliação" />
            </div>
            <p>A cor aparece quando o dia termina. Hoje e dias sem protocolo ficam só com o contorno.</p>
          </div>
        </div>

        {selection && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
            <span>
              Selecionado: <span className="font-medium">{selectionLabel(selection)}</span>
            </span>
            {clearable && (
              <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                Limpar
              </Button>
            )}
          </div>
        )}
        {footer}
      </CardContent>
    </Card>
  );
}
