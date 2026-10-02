"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Timer } from "lucide-react";
import { toast } from "sonner";
import {
  updateExerciseRestSchema,
  type UpdateExerciseRestInput,
  type UpdateExerciseRestFormInput,
} from "@/lib/validations/workout.schema";
import { updateExerciseRest } from "@/lib/actions/workouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditExerciseRestDialog({
  studentId,
  exerciseId,
  restSeconds,
}: {
  studentId: string;
  exerciseId: string;
  restSeconds: number;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateExerciseRestFormInput, unknown, UpdateExerciseRestInput>({
    resolver: zodResolver(updateExerciseRestSchema),
    defaultValues: { restSeconds },
  });

  function handleOpenChange(next: boolean) {
    if (next) reset({ restSeconds });
    setOpen(next);
  }

  async function onSubmit(values: UpdateExerciseRestInput) {
    const result = await updateExerciseRest(studentId, exerciseId, values);
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
            title="Editar descanso"
          />
        }
      >
        <Timer />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Descanso do exercício</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="restSeconds">Descanso (segundos)</Label>
            <Input id="restSeconds" type="number" min={5} max={3600} {...register("restSeconds")} />
            {errors.restSeconds && (
              <p className="text-sm text-destructive">{errors.restSeconds.message}</p>
            )}
          </div>
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
