import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addDays, isIsoDate, todayBR } from "@/lib/dates";
import {
  buildMealRangeStatus,
  buildMealStatus,
  buildWorkoutRangeStatus,
  buildWorkoutStatus,
  clampRange,
  loadMealRows,
  loadWorkoutEntries,
  type MealStatus,
  type ProtocolPeriod,
  type WorkoutStatus,
} from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { StatusPeriodBar, type PeriodPreset } from "@/components/shared/status-period-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatusSearchParams = { treino?: string; alimentar?: string; de?: string; ate?: string };

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function formatShort(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function weekday(iso: string) {
  return WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()];
}

function periodLabel(period: ProtocolPeriod) {
  return `${formatShort(period.start_date)} a ${formatShort(period.end_date)}`;
}

function pick(periods: ProtocolPeriod[], requested: string | undefined) {
  return (
    periods.find((period) => period.id === requested) ??
    periods.find((period) => period.is_active) ??
    periods[0] ??
    null
  );
}

function PeriodChips({
  periods,
  selectedId,
  hrefFor,
}: {
  periods: ProtocolPeriod[];
  selectedId: string;
  hrefFor: (id: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <Link
          key={period.id}
          href={hrefFor(period.id)}
          scroll={false}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
            period.id === selectedId
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-muted"
          )}
        >
          {periodLabel(period)}
          {period.is_active && <span className="text-xs opacity-80">(atual)</span>}
        </Link>
      ))}
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
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

function WorkoutSection({
  period,
  status,
  today,
}: {
  period: ProtocolPeriod | null;
  status: WorkoutStatus;
  today: string;
}) {
  const trainedDates = [...status.entriesByDate.keys()].sort().reverse();
  const leadingBlanks = status.range.length
    ? new Date(`${status.range[0]}T00:00:00Z`).getUTCDay()
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Dias treinados" value={String(status.trainedCount)} tone="good" />
        <StatTile label="Dias no período" value={String(status.range.length)} />
        <StatTile
          label="Sem treino"
          value={String(Math.max(status.range.length - status.trainedCount, 0))}
        />
      </div>

      {status.range.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum dia com protocolo neste período.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground sm:max-w-md">
              {WEEKDAYS.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:max-w-md">
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <span key={`blank-${i}`} />
              ))}
              {status.range.map((date) => {
                const trained = status.entriesByDate.has(date);
                return (
                  <div
                    key={date}
                    title={`${formatDate(date)}${trained ? ": treinou" : ""}`}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center rounded-md text-xs font-medium",
                      trained
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground",
                      date === today && "ring-2 ring-ring"
                    )}
                  >
                    {Number(date.slice(8))}
                    {(date.endsWith("-01") || date === status.range[0]) && (
                      <span className="text-[9px] leading-none opacity-70">
                        {MONTHS[Number(date.slice(5, 7)) - 1]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Um dia conta como treinado quando há carga registrada nele.
            </p>
          </div>

          {trainedDates.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Dias treinados</p>
              {trainedDates.map((date) => (
                <div key={date} className="flex flex-col gap-1.5 rounded-lg border border-border px-3 py-2">
                  <p className="text-sm font-medium">
                    {weekday(date)}, {formatDate(date)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {status.entriesByDate.get(date)!.map((entry, index) => (
                      <Badge key={index} variant="secondary" className="font-normal">
                        {entry.exercise}: {entry.weight_kg} kg
                        {entry.reps_done ? ` x ${entry.reps_done}` : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <PeriodNote period={period} partial={status.partial} today={today} />
    </div>
  );
}

// Explica até onde a contagem vai: protocolo em andamento é parcial; protocolo
// ativo e vencido continua contando até hoje, porque a pessoa segue usando.
function PeriodNote({
  period,
  partial,
  today,
}: {
  period: ProtocolPeriod | null;
  partial: boolean;
  today: string;
}) {
  if (!period || !period.is_active) return null;
  if (partial) {
    return <p className="text-xs text-muted-foreground">Período em andamento: resultado parcial.</p>;
  }
  return (
    <p className="text-xs text-muted-foreground">
      Protocolo vencido em {formatDate(period.end_date)} e ainda em uso: a contagem vai até hoje (
      {formatDate(today)}).
    </p>
  );
}

function MealSection({
  period,
  status,
  today,
}: {
  period: ProtocolPeriod | null;
  status: MealStatus;
  today: string;
}) {
  const days = [...status.days].reverse();
  const hasInProgress = days.some((day) => day.inProgress);
  const noClosedDay = status.closedDays === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Refeições feitas"
          value={noClosedDay ? "-" : `${status.doneTotal} de ${status.expectedTotal}`}
          tone="good"
        />
        <StatTile label="Aproveitamento" value={noClosedDay ? "-" : `${status.percent}%`} tone="good" />
        <StatTile
          label="Não feitas"
          value={noClosedDay ? "-" : String(status.missedTotal)}
          tone={status.missedTotal ? "bad" : undefined}
        />
        <StatTile label="Sem registro" value={noClosedDay ? "-" : String(status.unmarkedTotal)} />
      </div>
      {hasInProgress && (
        <p className="text-xs text-muted-foreground">
          {noClosedDay
            ? "Ainda não há dia encerrado: o aproveitamento aparece quando o dia de hoje terminar."
            : "Hoje está em andamento e só entra nos totais e no aproveitamento quando o dia terminar."}
        </p>
      )}

      {days.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum dia com protocolo alimentar neste período.</p>
      ) : status.mealsPerDay === 0 ? (
        <p className="text-sm text-muted-foreground">Este protocolo não tem refeições cadastradas.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {days.map((day) => {
            const donePct = day.total ? (day.done / day.total) * 100 : 0;
            const missedPct = day.total ? (day.missed.length / day.total) * 100 : 0;
            return (
              <div key={day.date} className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2">
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
          })}
        </div>
      )}
      <PeriodNote period={period} partial={status.partial} today={today} />
    </div>
  );
}

// Status avaliativo de uma pessoa: dias treinados (a partir das cargas registradas) e
// refeições feitas por dia, protocolo por protocolo. A mesma tela serve ao profissional
// (aluno escolhido), ao aluno do time e ao Usuário Padrão; o acesso aos dados é
// restrito pelas políticas do banco.
export async function StatusReport({
  studentId,
  basePath,
  searchParams,
  showWorkout = true,
  showDiet = true,
}: {
  studentId: string;
  basePath: string;
  searchParams: StatusSearchParams;
  showWorkout?: boolean;
  showDiet?: boolean;
}) {
  const supabase = await createClient();
  const today = todayBR();

  const { data } = await supabase
    .from("protocols")
    .select("id, type, start_date, end_date, is_active")
    .eq("student_id", studentId)
    .order("start_date", { ascending: false });

  const periods = (data ?? []) as ProtocolPeriod[];
  const workoutPeriods = periods.filter((period) => period.type === "workout");
  const dietPeriods = periods.filter((period) => period.type === "diet");

  // Intervalo livre (?de=&ate=): vale para treino e alimentação e pode atravessar protocolos.
  const customRange =
    searchParams.de && searchParams.ate && isIsoDate(searchParams.de) && isIsoDate(searchParams.ate)
      ? clampRange(searchParams.de, searchParams.ate, today)
      : null;

  const workout = !customRange && showWorkout ? pick(workoutPeriods, searchParams.treino) : null;
  const diet = !customRange && showDiet ? pick(dietPeriods, searchParams.alimentar) : null;

  const workoutIds =
    customRange && showWorkout
      ? workoutPeriods.map((period) => period.id)
      : workout
        ? [workout.id]
        : [];
  const dietIds =
    customRange && showDiet ? dietPeriods.map((period) => period.id) : diet ? [diet.id] : [];

  const [workoutEntries, mealRows] = await Promise.all([
    loadWorkoutEntries(supabase, workoutIds),
    loadMealRows(supabase, dietIds),
  ]);

  const workoutStatus = customRange
    ? buildWorkoutRangeStatus(workoutPeriods, workoutEntries, customRange.from, customRange.to)
    : workout
      ? buildWorkoutStatus(workout, today, workoutEntries.get(workout.id) ?? [])
      : null;
  const mealStatus = customRange
    ? buildMealRangeStatus(dietPeriods, mealRows, customRange.from, customRange.to, today)
    : diet
      ? buildMealStatus(diet, today, mealRows.get(diet.id) ?? [])
      : null;

  const presets: PeriodPreset[] = [
    { label: "Protocolo atual", href: basePath, active: !customRange },
    ...[7, 14, 30].map((days) => {
      const from = addDays(today, -(days - 1));
      return {
        label: `Últimos ${days} dias`,
        href: `${basePath}?de=${from}&ate=${today}`,
        active: customRange?.from === from && customRange.to === today,
      };
    }),
  ];
  const customActive = !!customRange && !presets.some((preset) => preset.active);
  const rangeDescription = customRange
    ? `De ${formatDate(customRange.from)} até ${formatDate(customRange.to)}`
    : null;

  const hrefFor = (kind: "treino" | "alimentar") => (id: string) => {
    const params = new URLSearchParams();
    if (kind === "treino") {
      params.set("treino", id);
      if (diet) params.set("alimentar", diet.id);
    } else {
      params.set("alimentar", id);
      if (workout) params.set("treino", workout.id);
    }
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <StatusPeriodBar
        key={customRange ? `${customRange.from}|${customRange.to}` : "protocolo"}
        basePath={basePath}
        presets={presets}
        customActive={customActive}
        defaultFrom={customRange?.from ?? addDays(today, -29)}
        defaultTo={customRange?.to ?? today}
        today={today}
      />

      {showWorkout && (
        <Card>
          <CardHeader>
            <CardTitle>Protocolo de treino</CardTitle>
            <CardDescription>
              {rangeDescription ??
                (workout
                  ? `Período de ${formatDate(workout.start_date)} até ${formatDate(workout.end_date)}`
                  : "Nenhum protocolo de treino cadastrado.")}
            </CardDescription>
          </CardHeader>
          {workoutStatus && (customRange ? workoutPeriods.length > 0 : !!workout) && (
            <CardContent className="flex flex-col gap-4">
              {!customRange && workout && workoutPeriods.length > 1 && (
                <PeriodChips periods={workoutPeriods} selectedId={workout.id} hrefFor={hrefFor("treino")} />
              )}
              <WorkoutSection period={workout} status={workoutStatus} today={today} />
            </CardContent>
          )}
        </Card>
      )}

      {showDiet && (
        <Card>
          <CardHeader>
            <CardTitle>Protocolo alimentar</CardTitle>
            <CardDescription>
              {rangeDescription ??
                (diet
                  ? `Período de ${formatDate(diet.start_date)} até ${formatDate(diet.end_date)}`
                  : "Nenhum protocolo alimentar cadastrado.")}
            </CardDescription>
          </CardHeader>
          {mealStatus && (customRange ? dietPeriods.length > 0 : !!diet) && (
            <CardContent className="flex flex-col gap-4">
              {!customRange && diet && dietPeriods.length > 1 && (
                <PeriodChips periods={dietPeriods} selectedId={diet.id} hrefFor={hrefFor("alimentar")} />
              )}
              <MealSection period={diet} status={mealStatus} today={today} />
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
