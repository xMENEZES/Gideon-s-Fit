"use client";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddExerciseDialog } from "@/components/shared/add-exercise-dialog";
import { CARD_ACTIONS_CLASS } from "@/components/shared/card-actions";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { EditWorkoutDayDialog } from "@/components/shared/edit-workout-day-dialog";
import { ExerciseCard, type ExerciseWithLogs } from "@/components/shared/exercise-card";
import { deleteWorkoutDay } from "@/lib/actions/workouts";

export type WorkoutDayWithExercises = {
  id: string;
  name: string;
  exercises: ExerciseWithLogs[];
};

export function WorkoutDayCard({
  day,
  studentId,
  editable,
  canLog,
  today,
}: {
  day: WorkoutDayWithExercises;
  studentId: string;
  editable: boolean;
  canLog?: boolean;
  today?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{day.name}</CardTitle>
        {editable && (
          <CardAction className={CARD_ACTIONS_CLASS}>
            <AddExerciseDialog studentId={studentId} workoutDayId={day.id} />
            <EditWorkoutDayDialog studentId={studentId} workoutDayId={day.id} name={day.name} />
            <ConfirmDeleteButton
              confirmMessage={`Remover o dia de treino "${day.name}" e todos os seus exercícios?`}
              action={() => deleteWorkoutDay(studentId, day.id)}
            />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {day.exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum exercício cadastrado ainda.</p>
        ) : (
          day.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              studentId={studentId}
              editable={editable}
              canLog={canLog}
              today={today}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
