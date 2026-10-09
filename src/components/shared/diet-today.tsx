import { DietDayTracker, type InitialMealLog } from "@/components/shared/diet-day-tracker";
import type { MealWithOptions } from "@/components/shared/meal-card";
import { TodayHeader } from "@/components/shared/today-header";

// Tela diária de alimentação: as refeições completas, com "Fiz" e "Não fiz" para hoje (e os
// 3 dias anteriores, para quem esqueceu de marcar), sem botões de edição.
export function DietToday({
  studentId,
  protocol,
  meals,
  logs,
  today,
  actionHref,
  actionLabel,
}: {
  studentId: string;
  protocol: { start_date: string; end_date: string };
  meals: MealWithOptions[];
  logs: InitialMealLog[];
  today: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <TodayHeader
        title="Alimentação de hoje"
        today={today}
        endDate={protocol.end_date}
        actionHref={actionHref}
        actionLabel={actionLabel}
      />
      <DietDayTracker
        meals={meals}
        studentId={studentId}
        startDate={protocol.start_date}
        today={today}
        initialLogs={logs}
        editable={false}
      />
    </div>
  );
}
