"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  WorkoutDayCard,
  type WorkoutDayWithExercises,
} from "@/components/shared/workout-day-card";

function shortLabel(name: string) {
  const [head] = name.split(/\s+[-–—]\s+/);
  return head.length <= 18 ? head : name;
}

export function WorkoutDaysTabs({
  days,
  studentId,
  editable,
  canLog,
  initialDayId,
  today,
}: {
  days: WorkoutDayWithExercises[];
  studentId: string;
  editable: boolean;
  canLog?: boolean;
  // Dia que já vem selecionado (padrão: o primeiro). Usado pela tela diária.
  initialDayId?: string;
  today?: string;
}) {
  const [selected, setSelected] = useState(initialDayId ?? days[0]?.id);
  const active = days.find((day) => day.id === selected) ?? days[0];
  if (!active) return null;

  return (
    <Tabs value={active.id} onValueChange={(value) => setSelected(value as string)}>
      <TabsList className="group-data-horizontal/tabs:h-10 w-full justify-start overflow-x-auto overflow-y-hidden">
        {days.map((day) => (
          <TabsTrigger
            key={day.id}
            value={day.id}
            className="flex-none px-4 data-active:font-semibold data-active:text-primary dark:data-active:text-primary"
          >
            {shortLabel(day.name)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={active.id}>
        <WorkoutDayCard
          day={active}
          studentId={studentId}
          editable={editable}
          canLog={canLog}
          today={today}
        />
      </TabsContent>
    </Tabs>
  );
}
