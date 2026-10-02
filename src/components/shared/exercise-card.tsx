"use client";

import { Badge } from "@/components/ui/badge";
import { VideoEmbed } from "@/components/shared/video-embed";
import { LoadHistoryDialog } from "@/components/shared/load-history-dialog";
import { AddLoadLogDialog } from "@/components/shared/add-load-log-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { EditExerciseRestDialog } from "@/components/shared/edit-exercise-rest-dialog";
import { EditRecommendedLoadDialog } from "@/components/shared/edit-recommended-load-dialog";
import { RestTimer } from "@/components/shared/rest-timer";
import { deleteExercise } from "@/lib/actions/workouts";

export type ExerciseWithLogs = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  recommended_load_kg: number | null;
  video_url: string | null;
  notes: string | null;
  exercise_load_logs: { logged_at: string; weight_kg: number }[];
};

export function ExerciseCard({
  exercise,
  studentId,
  editable,
  canLog,
}: {
  exercise: ExerciseWithLogs;
  studentId: string;
  editable: boolean;
  // Quem treina registra carga e usa o timer. Por padrão é quem NÃO edita o plano
  // (o aluno); no plano próprio a mesma pessoa edita e treina.
  canLog?: boolean;
}) {
  const logging = canLog ?? !editable;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{exercise.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{exercise.sets} séries</Badge>
            <Badge variant="secondary">{exercise.reps} reps</Badge>
            <Badge variant="secondary">{exercise.rest_seconds}s descanso</Badge>
            {exercise.recommended_load_kg != null && (
              <Badge variant="secondary">{exercise.recommended_load_kg} kg recomendado</Badge>
            )}
            <LoadHistoryDialog exerciseName={exercise.name} logs={exercise.exercise_load_logs} />
          </div>
        </div>
        {editable && (
          <div className="flex items-center gap-1">
            <EditRecommendedLoadDialog
              studentId={studentId}
              exerciseId={exercise.id}
              recommendedLoadKg={exercise.recommended_load_kg}
            />
            <EditExerciseRestDialog
              studentId={studentId}
              exerciseId={exercise.id}
              restSeconds={exercise.rest_seconds}
            />
            <ConfirmDeleteButton
              confirmMessage={`Remover o exercício "${exercise.name}"?`}
              action={() => deleteExercise(studentId, exercise.id)}
            />
          </div>
        )}
      </div>

      {exercise.notes && <p className="text-sm text-muted-foreground">{exercise.notes}</p>}
      {exercise.video_url && <VideoEmbed url={exercise.video_url} />}

      {logging && (
        <div className="flex flex-col gap-2">
          <RestTimer seconds={exercise.rest_seconds} />
          <AddLoadLogDialog studentId={studentId} exerciseId={exercise.id} />
        </div>
      )}
    </div>
  );
}
