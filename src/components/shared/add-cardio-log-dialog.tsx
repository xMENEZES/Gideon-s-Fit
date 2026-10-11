"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  cardioLogSchema,
  type CardioLogInput,
  type CardioLogFormInput,
} from "@/lib/validations/workout.schema";
import { createCardioLog } from "@/lib/actions/workouts";
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

// Registro de uma sessão de cardio: duração e/ou distância realizadas (pelo menos uma).
export function AddCardioLogDialog({
  studentId,
  exerciseId,
}: {
  studentId: string;
  exerciseId: string;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CardioLogFormInput, unknown, CardioLogInput>({
    resolver: zodResolver(cardioLogSchema),
  });

  async function onSubmit(values: CardioLogInput) {
    const result = await createCardioLog(studentId, exerciseId, values);
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
        <TrendingUp />
        Registrar sessão
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar sessão de cardio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="durationMinutes">Duração (min)</Label>
              <Input id="durationMinutes" type="number" min={1} step={1} {...register("durationMinutes")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="distanceKm">Distância (km)</Label>
              <Input id="distanceKm" type="number" min={0} step="any" {...register("distanceKm")} />
            </div>
          </div>
          {errors.durationMinutes && (
            <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>
          )}
          {errors.distanceKm && (
            <p className="text-sm text-destructive">{errors.distanceKm.message}</p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input id="notes" {...register("notes")} />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
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
