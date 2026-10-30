import { Suspense } from "react";
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
  type ProtocolPeriod,
} from "@/lib/status";
import { formatDate, formatShort } from "@/lib/status-format";
import { AchievementsPanel } from "@/components/shared/achievements-panel";
import { type PeriodPreset } from "@/components/shared/status-calendar";
import { StatusExplorer, type DietPanel, type WorkoutPanel } from "@/components/shared/status-explorer";
import { cn } from "@/lib/utils";

export type StatusSearchParams = { treino?: string; alimentar?: string; de?: string; ate?: string };

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
              ? "border-primary-ink bg-primary text-primary-foreground"
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

// Status avaliativo de uma pessoa: dias treinados (a partir das cargas registradas) e
// refeições feitas por dia, protocolo por protocolo. A mesma tela serve ao profissional
// (aluno escolhido), ao aluno do time e ao Usuário Padrão; o acesso aos dados é
// restrito pelas políticas do banco. O servidor carrega o período; o calendário (dia ou
// período) e os cards que reagem a ele ficam no cliente (StatusExplorer).
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

  // Intervalo dos atalhos (?de=&ate=): vale para treino e alimentação e pode atravessar protocolos.
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

  const workoutPanel: WorkoutPanel | null = showWorkout
    ? {
        description:
          rangeDescription ??
          (workout
            ? `Período de ${formatDate(workout.start_date)} até ${formatDate(workout.end_date)}`
            : "Nenhum protocolo de treino cadastrado."),
        data:
          workoutStatus && (customRange ? workoutPeriods.length > 0 : !!workout)
            ? {
                range: workoutStatus.range,
                entries: Object.fromEntries(workoutStatus.entriesByDate),
              }
            : null,
        chips:
          !customRange && workout && workoutPeriods.length > 1 ? (
            <PeriodChips periods={workoutPeriods} selectedId={workout.id} hrefFor={hrefFor("treino")} />
          ) : null,
        note: workoutStatus ? (
          <PeriodNote period={workout} partial={workoutStatus.partial} today={today} />
        ) : null,
      }
    : null;

  const dietPanel: DietPanel | null = showDiet
    ? {
        description:
          rangeDescription ??
          (diet
            ? `Período de ${formatDate(diet.start_date)} até ${formatDate(diet.end_date)}`
            : "Nenhum protocolo alimentar cadastrado."),
        data:
          mealStatus && (customRange ? dietPeriods.length > 0 : !!diet)
            ? { days: mealStatus.days, mealsPerDay: mealStatus.mealsPerDay }
            : null,
        chips:
          !customRange && diet && dietPeriods.length > 1 ? (
            <PeriodChips periods={dietPeriods} selectedId={diet.id} hrefFor={hrefFor("alimentar")} />
          ) : null,
        note: mealStatus ? <PeriodNote period={diet} partial={mealStatus.partial} today={today} /> : null,
      }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <AchievementsPanel studentId={studentId} />
      </Suspense>

      <StatusExplorer
        // A seleção recomeça quando o período (atalho ou protocolo) muda.
        key={customRange ? `${customRange.from}|${customRange.to}` : `${workout?.id}|${diet?.id}`}
        today={today}
        presets={presets}
        workout={workoutPanel}
        diet={dietPanel}
      />
    </div>
  );
}
