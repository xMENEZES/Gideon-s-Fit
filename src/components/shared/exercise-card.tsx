"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VideoEmbed } from "@/components/shared/video-embed";
import { LoadHistoryDialog } from "@/components/shared/load-history-dialog";
import { AddLoadLogDialog } from "@/components/shared/add-load-log-dialog";
import { AddCardioLogDialog } from "@/components/shared/add-cardio-log-dialog";
import { CardioHistoryDialog } from "@/components/shared/cardio-history-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { EditExerciseDialog } from "@/components/shared/edit-exercise-dialog";
import { RestTimer } from "@/components/shared/rest-timer";
import { deleteExercise } from "@/lib/actions/workouts";
import { formatCardioAmount } from "@/lib/cardio";
import type { ExerciseKind } from "@/lib/types/database.types";

export type ExerciseWithLogs = {
  id: string;
  name: string;
  kind: ExerciseKind;
  sets: number | null;
  reps: string | null;
  rest_seconds: number;
  recommended_load_kg: number | null;
  target_minutes: number | null;
  target_distance_km: number | null;
  video_url: string | null;
  notes: string | null;
  exercise_load_logs: {
    logged_at: string;
    weight_kg: number | null;
    duration_minutes: number | null;
    distance_km: number | null;
  }[];
};

export function ExerciseCard({
  exercise,
  studentId,
  editable,
  canLog,
  today,
}: {
  exercise: ExerciseWithLogs;
  studentId: string;
  editable: boolean;
  // Quem treina registra carga (ou a sessão de cardio) e usa o timer. Por padrão é quem NÃO
  // edita o plano (o aluno); no plano próprio a mesma pessoa edita e treina.
  canLog?: boolean;
  // Quando informado (telas diárias), mostra o selo "Registrado hoje" se houver registro nessa data.
  today?: string;
}) {
  const logging = canLog ?? !editable;
  const isCardio = exercise.kind === "cardio";
  const loggedToday = !!today && exercise.exercise_load_logs.some((log) => log.logged_at === today);

  const strengthLogs = exercise.exercise_load_logs.flatMap((log) =>
    log.weight_kg == null ? [] : [{ logged_at: log.logged_at, weight_kg: log.weight_kg }]
  );
  const cardioLogs = exercise.exercise_load_logs.filter((log) => log.weight_kg == null);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{exercise.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {isCardio ? (
              <>
                <Badge variant="outline">Cardio</Badge>
                <Badge variant="secondary">
                  {formatCardioAmount(exercise.target_minutes, exercise.target_distance_km)}
                </Badge>
              </>
            ) : (
              <>
                <Badge variant="secondary">{exercise.sets} séries</Badge>
                <Badge variant="secondary">{exercise.reps} reps</Badge>
                <Badge variant="secondary">{exercise.rest_seconds}s descanso</Badge>
                {exercise.recommended_load_kg != null && (
                  <Badge variant="secondary">{exercise.recommended_load_kg} kg recomendado</Badge>
                )}
              </>
            )}
            {loggedToday && (
              <Badge variant="outline" className="gap-1 border-primary text-primary">
                <Check className="size-3" />
                Registrado hoje
              </Badge>
            )}
            {isCardio ? (
              <CardioHistoryDialog exerciseName={exercise.name} logs={cardioLogs} />
            ) : (
              <LoadHistoryDialog exerciseName={exercise.name} logs={strengthLogs} />
            )}
          </div>
        </div>
        {editable && (
          <div className="flex shrink-0 items-center gap-1">
            <EditExerciseDialog studentId={studentId} exercise={exercise} />
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
          {isCardio ? (
            <AddCardioLogDialog studentId={studentId} exerciseId={exercise.id} />
          ) : (
            <>
              <RestTimer seconds={exercise.rest_seconds} />
              <AddLoadLogDialog studentId={studentId} exerciseId={exercise.id} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
