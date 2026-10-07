"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { mealSchema, type MealInput } from "@/lib/validations/meal.schema";
import { updateMeal } from "@/lib/actions/meals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimeField } from "@/components/shared/time-field";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditMealDialog({
  studentId,
  mealId,
  name,
  suggestedTime,
}: {
  studentId: string;
  mealId: string;
  name: string;
  suggestedTime: string | null;
}) {
  const [open, setOpen] = useState(false);
  const current = { name, suggestedTime: suggestedTime?.slice(0, 5) ?? "" };
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MealInput>({ resolver: zodResolver(mealSchema), defaultValues: current });

  function handleOpenChange(next: boolean) {
    if (next) reset(current);
    setOpen(next);
  }

  async function onSubmit(values: MealInput) {
    const result = await updateMeal(studentId, mealId, values);
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
            title="Editar refeição"
          />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar refeição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="suggestedTime">Horário sugerido (opcional)</Label>
            <Controller
              control={control}
              name="suggestedTime"
              render={({ field }) => (
                <TimeField id="suggestedTime" value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
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
