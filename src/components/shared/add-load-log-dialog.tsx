"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  loadLogSchema,
  type LoadLogInput,
  type LoadLogFormInput,
} from "@/lib/validations/workout.schema";
import { createLoadLog } from "@/lib/actions/workouts";
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

export function AddLoadLogDialog({
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
  } = useForm<LoadLogFormInput, unknown, LoadLogInput>({
    resolver: zodResolver(loadLogSchema),
  });

  async function onSubmit(values: LoadLogInput) {
    const result = await createLoadLog(studentId, exerciseId, values);
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
        Registrar carga
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar carga</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="weightKg">Carga (kg)</Label>
              <Input
                id="weightKg"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="20 ou 10 + 15"
                {...register("weightKg")}
              />
              {errors.weightKg && (
                <p className="text-sm text-destructive">{errors.weightKg.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repsDone">Repetições feitas</Label>
              <Input
                id="repsDone"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="12 ou 12 + 10"
                {...register("repsDone")}
              />
              {errors.repsDone && (
                <p className="text-sm text-destructive">{errors.repsDone.message}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Exercício conjugado? Separe os valores com +, por exemplo 10 + 15.
          </p>
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
