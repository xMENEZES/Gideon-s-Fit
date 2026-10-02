"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  mealItemSchema,
  type MealItemInput,
  type MealItemFormInput,
} from "@/lib/validations/meal.schema";
import { createMealItem } from "@/lib/actions/meals";
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

export function AddMealItemDialog({
  studentId,
  mealOptionId,
}: {
  studentId: string;
  mealOptionId: string;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MealItemFormInput, unknown, MealItemInput>({
    resolver: zodResolver(mealItemSchema),
  });

  async function onSubmit(values: MealItemInput) {
    const result = await createMealItem(studentId, mealOptionId, values);
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
        Alimento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo alimento/líquido</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="foodName">Alimento ou líquido</Label>
            <Input id="foodName" placeholder="Aveia" {...register("foodName")} />
            {errors.foodName && (
              <p className="text-sm text-destructive">{errors.foodName.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" type="number" step="0.1" min={0} {...register("quantity")} />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input id="unit" placeholder="g, ml, unidade..." {...register("unit")} />
              {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input id="notes" {...register("notes")} />
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
