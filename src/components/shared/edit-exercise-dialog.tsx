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
  sets: number;
  reps: string;
  rest_seconds: number;
  recommended_load_kg: number | null;
  video_url: string | null;
  notes: string | null;
};

function toFormValues(exercise: EditableExercise): ExerciseFormInput {
  return {
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    restSeconds: exercise.rest_seconds,
    recommendedLoadKg: exercise.recommended_load_kg ?? "",
    videoUrl: exercise.video_url ?? "",
    notes: exercise.notes ?? "",
  };
}

export function EditExerciseDialog({
  studentId,
  exercise,
}: {
  studentId: string;
  exercise: EditableExercise;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormInput, unknown, ExerciseInput>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: toFormValues(exercise),
  });

  function handleOpenChange(next: boolean) {
    if (next) reset(toFormValues(exercise));
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
          <DialogTitle>Editar exercício</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <ExerciseFormFields register={register} errors={errors} />
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
