"use client";

import { useState } from "react";
import { splitRecentDays, visibleMealDays, VISIBLE_TRAINED_DAYS, type MealDayStatus, type WorkoutEntry } from "@/lib/status";
import { formatDate, weekday } from "@/lib/status-format";
import {
  dayMarks,
  isInSelection,
  missedDaysNewestFirst,
  nextSelection,
  selectionKind,
  summarizeMealSelection,
  summarizeWorkoutSelection,
  type DayMarks,
  type Selection,
} from "@/lib/status-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusCalendar, type PeriodPreset } from "@/components/shared/status-calendar";
import { MealDayCard, MissedDay, MoreDetails, StatTile, TrainedDay } from "@/components/shared/status-parts";

export type WorkoutPanel = {
  description: string;
  // null = sem protocolo de treino para mostrar.
  data: { range: string[]; entries: Record<string, WorkoutEntry[]> } | null;
  // Troca de protocolo (quando há mais de um) e nota do período, já montados no servidor.
  chips: React.ReactNode;
  note: React.ReactNode;
};

export type DietPanel = {
  description: string;
  data: { days: MealDayStatus[]; mealsPerDay: number } | null;
  chips: React.ReactNode;
  note: React.ReactNode;
};

// Quantas ocorrências ("não fez") aparecem de cara num período; o resto fica recolhido.
const VISIBLE_OCCURRENCES = 5;

function WorkoutCard({
  panel,
  selection,
}: {
  panel: WorkoutPanel;
  selection: Selection | null;
}) {
  const data = panel.data;
  const kind = selectionKind(selection);
  const summary = data ? summarizeWorkoutSelection(data.range, data.entries, selection) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocolo de treino</CardTitle>
        <CardDescription>{panel.description}</CardDescription>
      </CardHeader>
      {data && summary && (
        <CardContent className="flex flex-col gap-4">
          {panel.chips}

          {data.range.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dia com protocolo neste período.</p>
          ) : kind === "day" && selection ? (
            <WorkoutDay date={selection.from} range={data.range} entries={data.entries} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatTile label="Dias treinados" value={String(summary.trained)} tone="good" />
                <StatTile label="Dias no período" value={String(summary.total)} />
                <StatTile label="Sem treino" value={String(Math.max(summary.total - summary.trained, 0))} />
              </div>
              {kind === "none" && summary.trainedDatesNewestFirst.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Últimos dias treinados</p>
                  {splitRecentDays(summary.trainedDatesNewestFirst, VISIBLE_TRAINED_DAYS).recent.map(
                    (date, position) => (
                      <TrainedDay key={date} date={date} entries={data.entries[date]} open={position === 0} />
                    )
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Um dia conta como treinado quando há exercício registrado nele (carga ou sessão de cardio).
                {kind === "none" && " Para ver um dia específico, toque nele no calendário."}
              </p>
            </>
          )}
          {kind === "none" && panel.note}
        </CardContent>
      )}
    </Card>
  );
}

function WorkoutDay({
  date,
  range,
  entries,
}: {
  date: string;
  range: string[];
  entries: Record<string, WorkoutEntry[]>;
}) {
  if (!range.includes(date)) {
    return <p className="text-sm text-muted-foreground">Sem protocolo de treino neste dia.</p>;
  }
  const day = entries[date] ?? [];
  if (day.length === 0) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
        <span className="text-sm font-medium">
          {weekday(date)}, {formatDate(date)}
        </span>
        <Badge variant="secondary" className="font-normal">
          Não treinou
        </Badge>
      </div>
    );
  }
  return <TrainedDay date={date} entries={day} open />;
}

function DietCard({ panel, selection }: { panel: DietPanel; selection: Selection | null }) {
  const data = panel.data;
  const kind = selectionKind(selection);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocolo alimentar</CardTitle>
        <CardDescription>{panel.description}</CardDescription>
      </CardHeader>
      {data && (
        <CardContent className="flex flex-col gap-4">
          {panel.chips}
          <DietBody days={data.days} mealsPerDay={data.mealsPerDay} selection={selection} kind={kind} />
          {kind === "none" && panel.note}
        </CardContent>
      )}
    </Card>
  );
}

function DietBody({
  days,
  mealsPerDay,
  selection,
  kind,
}: {
  days: MealDayStatus[];
  mealsPerDay: number;
  selection: Selection | null;
  kind: "none" | "day" | "period";
}) {
  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum dia com protocolo alimentar neste período.</p>;
  }
  if (mealsPerDay === 0) {
    return <p className="text-sm text-muted-foreground">Este protocolo não tem refeições cadastradas.</p>;
  }

  // Um dia: só o detalhe dele.
  if (kind === "day" && selection) {
    const day = days.find((item) => item.date === selection.from);
    if (!day) return <p className="text-sm text-muted-foreground">Sem protocolo alimentar neste dia.</p>;
    return (
      <>
        <MealDayCard day={day} />
        {day.inProgress && (
          <p className="text-xs text-muted-foreground">
            Hoje está em andamento e só entra nos totais e no aproveitamento quando o dia terminar.
          </p>
        )}
      </>
    );
  }

  const summary = summarizeMealSelection(days, selection);
  const noClosedDay = summary.closedDays === 0;
  const hasInProgress = summary.days.some((day) => day.inProgress);
  const newestFirst = [...summary.days].reverse();

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Refeições feitas"
          value={noClosedDay ? "-" : `${summary.doneTotal} de ${summary.expectedTotal}`}
          tone="good"
        />
        <StatTile label="Aproveitamento" value={noClosedDay ? "-" : `${summary.percent}%`} tone="good" />
        <StatTile
          label="Não feitas"
          value={noClosedDay ? "-" : String(summary.missedTotal)}
          tone={summary.missedTotal ? "bad" : undefined}
        />
        <StatTile label="Sem registro" value={noClosedDay ? "-" : String(summary.unmarkedTotal)} />
      </div>
      {hasInProgress && (
        <p className="text-xs text-muted-foreground">
          {noClosedDay
            ? "Ainda não há dia encerrado: o aproveitamento aparece quando o dia de hoje terminar."
            : "Hoje está em andamento e só entra nos totais e no aproveitamento quando o dia terminar."}
        </p>
      )}

      {kind === "none" ? (
        // Sem seleção: hoje (em andamento) e o último dia encerrado; o resto está no calendário.
        <div className="flex flex-col gap-2">
          {splitRecentDays(newestFirst, visibleMealDays(newestFirst)).recent.map((day) => (
            <MealDayCard key={day.date} day={day} />
          ))}
          <p className="text-xs text-muted-foreground">Para ver outro dia, toque nele no calendário.</p>
        </div>
      ) : (
        // Período: só as ocorrências, isto é, os dias com refeição "não feita" e o motivo.
        <Occurrences days={summary.days} />
      )}
    </>
  );
}

function Occurrences({ days }: { days: MealDayStatus[] }) {
  const missed = missedDaysNewestFirst(days);
  if (missed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhuma refeição marcada como não feita neste período.</p>
    );
  }
  const { recent, older } = splitRecentDays(missed, VISIBLE_OCCURRENCES);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Refeições não feitas ({missed.length} {missed.length === 1 ? "dia" : "dias"})</p>
      {recent.map((day) => (
        <MissedDay key={day.date} day={day} />
      ))}
      {older.length > 0 && (
        <MoreDetails label={`Mais ${older.length} ${older.length === 1 ? "dia" : "dias"}`}>
          {older.map((day) => (
            <MissedDay key={day.date} day={day} />
          ))}
        </MoreDetails>
      )}
    </div>
  );
}

// Calendário + cards de treino e de alimentação da tela de Status. A seleção (um dia ou um
// período) vive aqui no cliente e é instantânea: os dados do período já vieram do servidor.
export function StatusExplorer({
  today,
  presets,
  workout,
  diet,
}: {
  today: string;
  presets: PeriodPreset[];
  workout: WorkoutPanel | null;
  diet: DietPanel | null;
}) {
  const [selection, setSelection] = useState<Selection | null>(null);

  // Dias com dados (treino e/ou alimentação) e as marcas de cada um.
  const mealByDate = new Map((diet?.data?.days ?? []).map((day) => [day.date, day]));
  const workoutRange = workout?.data?.range ?? [];
  const dates = [...new Set([...workoutRange, ...mealByDate.keys()])].sort();
  const marks: Record<string, DayMarks> = {};
  for (const date of dates) {
    marks[date] = dayMarks((workout?.data?.entries[date]?.length ?? 0) > 0, mealByDate.get(date));
  }

  return (
    <>
      {dates.length > 0 && (
        <StatusCalendar
          // Recomeça no mês de hoje quando o período muda (os atalhos recarregam a página).
          key={`${dates[0]}|${dates[dates.length - 1]}`}
          today={today}
          first={dates[0]}
          last={dates[dates.length - 1]}
          marks={marks}
          selection={selection && dates.some((date) => isInSelection(date, selection)) ? selection : null}
          onSelect={(date) => setSelection((current) => nextSelection(current, date))}
          onClear={() => setSelection(null)}
          presets={presets}
        />
      )}
      {workout && <WorkoutCard panel={workout} selection={selection} />}
      {diet && <DietCard panel={diet} selection={selection} />}
    </>
  );
}
