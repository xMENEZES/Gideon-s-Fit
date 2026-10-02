"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Target } from "lucide-react";
import { toast } from "sonner";
import {
  updateRecommendedLoadSchema,
  type UpdateRecommendedLoadInput,
  type UpdateRecommendedLoadFormInput,
} from "@/lib/validations/workout.schema";
import { updateRecommendedLoad } from "@/lib/actions/workouts";
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

export function EditRecommendedLoadDialog({
  studentId,
  exerciseId,
  recommendedLoadKg,
}: {
  studentId: string;
  exerciseId: string;
  recommendedLoadKg: number | null;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateRecommendedLoadFormInput, unknown, UpdateRecommendedLoadInput>({
    resolver: zodResolver(updateRecommendedLoadSchema),
    defaultValues: { recommendedLoadKg: recommendedLoadKg ?? undefined },
  });

  function handleOpenChange(next: boolean) {
    if (next) reset({ recommendedLoadKg: recommendedLoadKg ?? undefined });
    setOpen(next);
  }

  async function onSubmit(values: UpdateRecommendedLoadInput) {
    const result = await updateRecommendedLoad(studentId, exerciseId, values);
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
            title="Editar carga recomendada"
          />
        }
      >
        <Target />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Carga recomendada</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="recommendedLoadKg">Carga recomendada (kg)</Label>
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
