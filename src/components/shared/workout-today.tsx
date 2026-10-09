import { TodayHeader } from "@/components/shared/today-header";
import { WorkoutDaysTabs } from "@/components/shared/workout-days-tabs";
import type { WorkoutDayWithExercises } from "@/components/shared/workout-day-card";
import { shortDate, suggestWorkoutDay } from "@/lib/today";

// Tela diária de treino: o dia sugerido já vem selecionado (dá para trocar), sem botões de
// edição, só o registro de carga e o cronômetro de descanso.
export function WorkoutToday({
  studentId,
  protocol,
  days,
  today,
  actionHref,
  actionLabel,
}: {
  studentId: string;
  protocol: { end_date: string };
  days: WorkoutDayWithExercises[];
  today: string;
  actionHref: string;
  actionLabel: string;
}) {
  const suggestion = suggestWorkoutDay(days, today);
  const nameOf = (id: string | null) => days.find((day) => day.id === id)?.name;
  const suggested = nameOf(suggestion.dayId);
  const last = nameOf(suggestion.lastDayId);

  let hint: string | null = null;
  if (suggested) {
    if (suggestion.reason === "today") hint = `Treino de hoje: ${suggested}.`;
    else if (suggestion.reason === "next" && last && suggestion.lastDate) {
      hint = `Sugestão de hoje: ${suggested}. Último treino: ${last}, em ${shortDate(suggestion.lastDate)}.`;
    } else hint = `Sugestão de hoje: ${suggested}. Ainda não há treinos registrados neste protocolo.`;
  }

  return (
    <div className="flex flex-col gap-4">
      <TodayHeader
        title="Treino de hoje"
        today={today}
        endDate={protocol.end_date}
        actionHref={actionHref}
        actionLabel={actionLabel}
      >
        {hint && <p className="text-sm">{hint}</p>}
      </TodayHeader>

      <WorkoutDaysTabs
        days={days}
        studentId={studentId}
        editable={false}
        canLog
        initialDayId={suggestion.dayId ?? undefined}
        today={today}
      />
    </div>
  );
}
