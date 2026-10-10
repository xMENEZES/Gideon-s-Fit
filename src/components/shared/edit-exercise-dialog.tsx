"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  exerciseSchema,
  type ExerciseInput,
  type ExerciseFormInput,
} from "@/lib/validations/workout.schema";
import type { ExerciseKind } from "@/lib/types/database.types";
import { updateExercise } from "@/lib/actions/workouts";
import { Button } from "@/components/ui/button";
import { ExerciseFormFields } from "@/components/shared/exercise-form-fields";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type EditableExercise = {
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
};

function toFormValues(exercise: EditableExercise): ExerciseFormInput {
  const common = {
    kind: exercise.kind,
    name: exercise.name,
    videoUrl: exercise.video_url ?? "",
    notes: exercise.notes ?? "",
  };
  if (exercise.kind === "cardio") {
    return {
      ...common,
      targetMinutes: exercise.target_minutes ?? "",
      targetDistanceKm: exercise.target_distance_km ?? "",
    };
  }
  return {
    ...common,
    sets: exercise.sets ?? "",
    reps: exercise.reps ?? "",
    restSeconds: exercise.rest_seconds,
    recommendedLoadKg: exercise.recommended_load_kg ?? "",
  };
}

// O tipo (musculação ou cardio) não muda depois de criado; só os dados do exercício.
export function EditExerciseDialog({
  studentId,
  exercise,
}: {
  studentId: string;
  exercise: EditableExercise;
}) {
  const [open, setOpen] = useState(false);
  // Remonta o menu de atividades a cada abertura, para ler o nome atual.
  const [activityKey, setActivityKey] = useState(0);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormInput, unknown, ExerciseInput>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: toFormValues(exercise),
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      reset(toFormValues(exercise));
      setActivityKey((key) => key + 1);
    }
    setOpen(next);
  }

  async function onSubmit(values: ExerciseInput) {
    const result = await updateExercise(studentId, exercise.id, values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            type="button"
            title="Editar exercício"
          />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {exercise.kind === "cardio" ? "Editar exercício de cardio" : "Editar exercício"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <ExerciseFormFields
            kind={exercise.kind}
            register={register}
            control={control}
            errors={errors}
            activityKey={activityKey}
          />
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
