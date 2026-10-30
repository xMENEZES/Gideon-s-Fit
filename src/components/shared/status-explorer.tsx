"use client";

import { useState } from "react";
import { splitRecentDays, type MealDayStatus, type WorkoutEntry } from "@/lib/status";
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
import { RestDayButton } from "@/components/shared/rest-day-button";
import { StatusCalendar, type PeriodPreset } from "@/components/shared/status-calendar";
import {
  MealDayHistory,
  MissedDay,
  MoreDetails,
  StatTile,
  WorkoutDayHistory,
} from "@/components/shared/status-parts";

export type WorkoutPanel = {
  description: string;
  // null = sem protocolo de treino para mostrar. `done` = dias em que todos os exercícios de um dia
  // do protocolo foram registrados (resultado diário do banco); `rest` = dias de descanso marcados.
  data: { range: string[]; entries: Record<string, WorkoutEntry[]>; done: string[]; rest: string[] } | null;
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold">{children}</h3>;
}

// ---- Um dia: treino e refeições juntos ----

function DayCard({
  date,
  today,
  studentId,
  canMarkRest,
  workout,
  diet,
}: {
  date: string;
  today: string;
  studentId: string;
  canMarkRest: boolean;
  workout: WorkoutPanel | null;
  diet: DietPanel | null;
}) {
  const workoutData = workout?.data ?? null;
  const dietDay = diet?.data?.days.find((day) => day.date === date) ?? null;
  const entries = workoutData?.entries[date] ?? [];
  const inWorkoutRange = !!workoutData?.range.includes(date);
  const isRest = !!workoutData?.rest.includes(date);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {weekday(date)}, {formatDate(date)}
          {date === today && (
            <Badge variant="secondary" className="font-normal">
              Hoje
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Histórico de treino e refeições do dia.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {workout && (
          <section className="flex flex-col gap-2">
            <SectionTitle>Treino</SectionTitle>
            {!workoutData || !inWorkoutRange ? (
              <p className="text-sm text-muted-foreground">Sem protocolo de treino neste dia.</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isRest ? "Dia de descanso." : date === today ? "Ainda sem treino registrado hoje." : "Não treinou."}
              </p>
            ) : (
              <WorkoutDayHistory entries={entries} />
            )}
            {canMarkRest && inWorkoutRange && entries.length === 0 && (
              <RestDayButton studentId={studentId} date={date} rest={isRest} />
            )}
          </section>
        )}
        {diet && (
          <section className="flex flex-col gap-2">
            <SectionTitle>Refeições</SectionTitle>
            {!dietDay ? (
              <p className="text-sm text-muted-foreground">Sem protocolo alimentar neste dia.</p>
            ) : dietDay.total === 0 ? (
              <p className="text-sm text-muted-foreground">Este protocolo não tem refeições cadastradas.</p>
            ) : (
              <MealDayHistory day={dietDay} />
            )}
          </section>
        )}
        {dietDay?.inProgress && (
          <p className="text-xs text-muted-foreground">
            Hoje está em andamento e só entra nos totais e no aproveitamento quando o dia terminar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Um período: totais e só as ocorrências ----

function WorkoutPeriodCard({ panel, selection }: { panel: WorkoutPanel; selection: Selection }) {
  const data = panel.data;
  if (!data) return null;
  const summary = summarizeWorkoutSelection(data.range, data.entries, selection, data.rest);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Treino no período</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {summary.total === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum dia com protocolo neste período.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Treinados" value={String(summary.trained)} tone="good" />
            <StatTile label="Descanso" value={String(summary.rest)} />
            <StatTile
              label="Sem treino"
              value={String(Math.max(summary.total - summary.trained - summary.rest, 0))}
            />
            <StatTile label="Dias" value={String(summary.total)} />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Um dia conta como treinado quando há exercício registrado nele (carga ou sessão de cardio). Dias de
          descanso marcados não entram em &quot;Sem treino&quot;. Toque num dia para ver o detalhe.
        </p>
        {panel.note}
      </CardContent>
    </Card>
  );
}

function DietPeriodCard({ panel, selection }: { panel: DietPanel; selection: Selection }) {
  const data = panel.data;
  if (!data) return null;
  const summary = summarizeMealSelection(data.days, selection);
  const noClosedDay = summary.closedDays === 0;
  const hasInProgress = summary.days.some((day) => day.inProgress);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alimentação no período</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {data.days.length === 0 || data.mealsPerDay === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma refeição neste período.</p>
        ) : (
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
            <Occurrences days={summary.days} />
          </>
        )}
        {panel.note}
      </CardContent>
    </Card>
  );
}

function Occurrences({ days }: { days: MealDayStatus[] }) {
  const missed = missedDaysNewestFirst(days);
  if (missed.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma refeição marcada como não feita neste período.</p>;
  }
  const { recent, older } = splitRecentDays(missed, VISIBLE_OCCURRENCES);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        Refeições não feitas ({missed.length} {missed.length === 1 ? "dia" : "dias"})
      </p>
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

// Protocolo escolhido (treino ou alimentar): descrição e, havendo mais de um, a troca.
function ProtocolInfo({ label, description, chips }: { label: string; description: string; chips: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        <span className="font-medium">{label}:</span>{" "}
        <span className="text-muted-foreground">{description}</span>
      </p>
      {chips}
    </div>
  );
}

// Calendário + histórico da tela de Status. A seleção (um dia ou um período) vive aqui no
// cliente e é instantânea: os dados do período já vieram do servidor. A tela abre no dia de hoje.
export function StatusExplorer({
  today,
  studentId,
  canMarkRest,
  presets,
  workout,
  diet,
}: {
  today: string;
  studentId: string;
  // Só a própria pessoa marca dia de descanso (o profissional só vê).
  canMarkRest: boolean;
  presets: PeriodPreset[];
  workout: WorkoutPanel | null;
  diet: DietPanel | null;
}) {
  const [selection, setSelection] = useState<Selection | null>(null);

  // Dias com dados (treino e/ou alimentação) e as marcas de cada um.
  const mealByDate = new Map((diet?.data?.days ?? []).map((day) => [day.date, day]));
  const workoutRange = workout?.data?.range ?? [];
  const dates = [...new Set([...workoutRange, ...mealByDate.keys()])].sort();
  const inWorkoutRange = new Set(workoutRange);
  const doneDates = new Set(workout?.data?.done ?? []);
  const restDates = new Set(workout?.data?.rest ?? []);
  const marks: Record<string, DayMarks> = {};
  for (const date of dates) {
    marks[date] = dayMarks({
      date,
      today,
      inWorkoutRange: inWorkoutRange.has(date),
      trained: (workout?.data?.entries[date]?.length ?? 0) > 0,
      workoutDone: doneDates.has(date),
      rest: restDates.has(date),
      mealDay: mealByDate.get(date),
    });
  }

  // Sem escolha do usuário, vale hoje (ou o último dia com dados, se hoje estiver fora do período).
  const defaultDay = dates.includes(today) ? today : (dates.at(-1) ?? null);
  const chosen = selection && dates.some((date) => isInSelection(date, selection)) ? selection : null;
  const effective: Selection | null = chosen ?? (defaultDay ? { from: defaultDay, to: defaultDay } : null);
  const kind = selectionKind(effective);

  const protocolInfo = (workout || diet) && (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      {workout && <ProtocolInfo label="Treino" description={workout.description} chips={workout.chips} />}
      {diet && <ProtocolInfo label="Alimentar" description={diet.description} chips={diet.chips} />}
    </div>
  );

  return (
    <>
      {dates.length > 0 ? (
        <StatusCalendar
          // Recomeça no mês de hoje quando o período muda (os atalhos recarregam a página).
          key={`${dates[0]}|${dates[dates.length - 1]}`}
          today={today}
          first={dates[0]}
          last={dates[dates.length - 1]}
          marks={marks}
          selection={effective}
          clearable={!!chosen}
          onSelect={(date) => setSelection((current) => nextSelection(current, date))}
          onClear={() => setSelection(null)}
          presets={presets}
          footer={protocolInfo}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Nenhum protocolo para mostrar ainda.</CardDescription>
          </CardHeader>
          {protocolInfo && <CardContent>{protocolInfo}</CardContent>}
        </Card>
      )}

      {effective && kind === "day" && (
        <DayCard
          date={effective.from}
          today={today}
          studentId={studentId}
          canMarkRest={canMarkRest}
          workout={workout}
          diet={diet}
        />
      )}
      {effective && kind === "period" && (
        <>
          {workout && <WorkoutPeriodCard panel={workout} selection={effective} />}
          {diet && <DietPeriodCard panel={diet} selection={effective} />}
        </>
      )}
    </>
  );
}
