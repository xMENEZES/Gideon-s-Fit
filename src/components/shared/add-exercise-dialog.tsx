"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  exerciseSchema,
  type ExerciseInput,
  type ExerciseFormInput,
} from "@/lib/validations/workout.schema";
import { createExercise } from "@/lib/actions/workouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddExerciseDialog({
  studentId,
  workoutDayId,
}: {
  studentId: string;
  workoutDayId: string;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormInput, unknown, ExerciseInput>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: { restSeconds: 60 },
  });

  async function onSubmit(values: ExerciseInput) {
    const result = await createExercise(studentId, workoutDayId, values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <Plus />
        Exercício
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo exercício</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome do exercício</Label>
            <Input id="name" placeholder="Supino reto" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sets">Séries</Label>
              <Input id="sets" type="number" min={1} {...register("sets")} />
              {errors.sets && <p className="text-sm text-destructive">{errors.sets.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reps">Repetições</Label>
              <Input id="reps" placeholder="8-12" {...register("reps")} />
              {errors.reps && <p className="text-sm text-destructive">{errors.reps.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="restSeconds">Descanso (segundos)</Label>
              <Input id="restSeconds" type="number" min={5} max={3600} {...register("restSeconds")} />
              {errors.restSeconds && (
                <p className="text-sm text-destructive">{errors.restSeconds.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="recommendedLoadKg">Carga recomendada (kg, opcional)</Label>
              <Input
                id="recommendedLoadKg"
                type="number"
                step="0.5"
                min={0}
                {...register("recommendedLoadKg")}
              />
              {errors.recommendedLoadKg && (
                <p className="text-sm text-destructive">{errors.recommendedLoadKg.message}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="videoUrl">Link do vídeo (opcional)</Label>
            <Input
              id="videoUrl"
              placeholder="https://youtube.com/..."
              {...register("videoUrl")}
            />
            {errors.videoUrl && (
              <p className="text-sm text-destructive">{errors.videoUrl.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea id="notes" rows={2} {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
