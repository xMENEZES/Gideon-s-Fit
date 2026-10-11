"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { addDays } from "@/lib/dates";
import { nextPendingMealId } from "@/lib/meal-flow";
import { Button } from "@/components/ui/button";
import type { MealWithOptions } from "@/components/shared/meal-card";
import { TrackedMealCard, type MealLogValue } from "@/components/shared/meal-log-controls";

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

  // Refeições com registro ficam recolhidas na tela diária; as que a pessoa reabriu à mão ficam
  // aqui. Na edição do plano nada é recolhido.
  const [reopened, setReopened] = useState<Record<string, boolean>>({});
  // Pedido de rolagem depois de marcar uma refeição ("top" = voltar ao início da página).
  const [scrollRequest, setScrollRequest] = useState<{ id: string; seq: number } | null>(null);

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

  // Marcou "Fiz": mostra a próxima refeição pendente no topo (ou volta ao início se acabaram).
  // Marcou "Não fiz": mantém esta barra no topo, com a anotação do motivo à vista e a próxima
  // refeição logo abaixo.
  function handleChange(mealId: string, value: MealLogValue | null) {
    updateLog(mealId, value);
    if (!value) return;
    const key = `${mealId}|${selected}`;
    setReopened((current) => ({ ...current, [key]: false }));
    if (editable) return;
    const id = value.done ? `next:${mealId}` : mealId;
    setScrollRequest((current) => ({ id, seq: (current?.seq ?? 0) + 1 }));
  }

  const scrollTo = useEffectEvent((request: { id: string }) => {
    let targetId: string | null = request.id;
    if (request.id.startsWith("next:")) {
      const from = request.id.slice(5);
      targetId = nextPendingMealId(
        meals.map((meal) => meal.id),
        (id) => logs[`${id}|${selected}`] !== undefined,
        from
      );
    }
    const element = targetId ? document.getElementById(`meal-${targetId}`) : null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduceMotion ? "auto" : "smooth";
    if (element) element.scrollIntoView({ block: "start", behavior });
    else window.scrollTo({ top: 0, behavior });
  });

  useEffect(() => {
    if (!scrollRequest) return;
    // Espera o cartão encolher (layout novo) antes de rolar.
    const frame = requestAnimationFrame(() => scrollTo(scrollRequest));
    return () => cancelAnimationFrame(frame);
  }, [scrollRequest]);

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
          <TrackedMealCard
            // A chave inclui o dia: trocar de dia reinicia o rascunho da anotação.
            key={`${meal.id}|${selected}`}
            meal={meal}
            studentId={studentId}
            editable={editable}
            date={selected}
            value={logs[`${meal.id}|${selected}`] ?? null}
            onChange={(value) => handleChange(meal.id, value)}
            collapsed={!editable && !reopened[`${meal.id}|${selected}`]}
            onToggleCollapsed={
              editable
                ? undefined
                : () =>
                    setReopened((current) => ({
                      ...current,
                      [`${meal.id}|${selected}`]: !current[`${meal.id}|${selected}`],
                    }))
            }
          />
        ))}
      </div>
    </div>
  );
}
