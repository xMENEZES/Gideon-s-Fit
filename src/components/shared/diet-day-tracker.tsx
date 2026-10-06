"use client";

import { useState } from "react";
import { addDays } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { MealCard, type MealWithOptions } from "@/components/shared/meal-card";
import { MealLogControls, type MealLogValue } from "@/components/shared/meal-log-controls";

export type InitialMealLog = {
  meal_id: string;
  log_date: string;
  done: boolean;
  note: string | null;
};

const DAYS_BACK = 3;

function dayLabel(date: string, today: string) {
  if (date === today) return "Hoje";
  if (date === addDays(today, -1)) return "Ontem";
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

// Lista as refeições do protocolo com o registro do dia escolhido (hoje e até 3
// dias antes). Os registros dos 4 dias vêm do servidor de uma vez, então trocar
// de dia é instantâneo.
export function DietDayTracker({
  meals,
  studentId,
  startDate,
  today,
  initialLogs,
  editable,
}: {
  meals: MealWithOptions[];
  studentId: string;
  startDate: string;
  today: string;
  initialLogs: InitialMealLog[];
  editable: boolean;
}) {
  const [date, setDate] = useState(today);
  const [logs, setLogs] = useState<Record<string, MealLogValue>>(() =>
    Object.fromEntries(
      initialLogs.map((log) => [`${log.meal_id}|${log.log_date}`, { done: log.done, note: log.note }])
    )
  );

  const dates = Array.from({ length: DAYS_BACK + 1 }, (_, i) => addDays(today, -i)).filter(
    (d) => d >= startDate
  );
  const selected = dates.includes(date) ? date : today;

  const doneCount = meals.filter((meal) => logs[`${meal.id}|${selected}`]?.done === true).length;
  const missedCount = meals.filter((meal) => logs[`${meal.id}|${selected}`]?.done === false).length;

  function updateLog(mealId: string, value: MealLogValue | null) {
    setLogs((current) => {
      const next = { ...current };
      const key = `${mealId}|${selected}`;
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          {dates.map((d) => (
            <Button
              key={d}
              type="button"
              size="sm"
              variant={d === selected ? "default" : "outline"}
              onClick={() => setDate(d)}
            >
              {dayLabel(d, today)}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {doneCount} de {meals.length} {meals.length === 1 ? "refeição feita" : "refeições feitas"}
          {missedCount > 0 && `, ${missedCount} não ${missedCount === 1 ? "feita" : "feitas"}`}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            studentId={studentId}
            editable={editable}
            tracking={
              <MealLogControls
                key={`${meal.id}|${selected}`}
                mealId={meal.id}
                date={selected}
                value={logs[`${meal.id}|${selected}`] ?? null}
                onChange={(value) => updateLog(meal.id, value)}
              />
            }
          />
        ))}
      </div>
    </div>
  );
}
