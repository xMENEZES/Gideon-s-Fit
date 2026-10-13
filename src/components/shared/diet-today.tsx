import { Suspense } from "react";
import { IncentiveBanner } from "@/components/shared/incentive-banner";
import { SealStrip } from "@/components/shared/seal-strip";
import { DietDayTracker, type InitialMealLog } from "@/components/shared/diet-day-tracker";
import type { MealWithOptions } from "@/components/shared/meal-card";
import { TodayHeader } from "@/components/shared/today-header";
import { dietDayCompleteFromLogs } from "@/lib/incentive";

// Tela diária de alimentação: as refeições completas, com "Fiz" e "Não fiz" para hoje (e os
// 3 dias anteriores, para quem esqueceu de marcar), sem botões de edição.
export function DietToday({
  studentId,
  trainerId,
  nickname,
  protocol,
  meals,
  logs,
  today,
  actionHref,
  actionLabel,
}: {
  studentId: string;
  // Profissional do time (mensagens de incentivo dele); nulo no plano próprio.
  trainerId: string | null;
  nickname?: string | null;
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
      >
        <Suspense fallback={null}>
          <SealStrip studentId={studentId} lines={["diet", "both"]} />
        </Suspense>
      </TodayHeader>
      <Suspense fallback={null}>
        <IncentiveBanner
          studentId={studentId}
          trainerId={trainerId}
          nickname={nickname}
          module="diet"
          today={today}
          ownComplete={dietDayCompleteFromLogs(
            meals.map((meal) => meal.id),
            logs,
            today
          )}
        />
      </Suspense>
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
