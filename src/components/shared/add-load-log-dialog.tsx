"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  loadLogSchema,
  type LoadLogInput,
  type LoadLogFormInput,
} from "@/lib/validations/workout.schema";
import { createLoadLog } from "@/lib/actions/workouts";
import { EQUIPMENT_OPTIONS, type LoadEquipment } from "@/lib/equipment";
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

// O teclado numérico do celular não tem o "+": este botão acrescenta " + " ao campo e mantém o foco.
function PlusButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Somar outro valor (exercício conjugado)"
      title="Somar outro valor (exercício conjugado)"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Plus />
    </Button>
  );
}

export function AddLoadLogDialog({
  studentId,
  exerciseId,
  plannedSets,
  defaultEquipment,
}: {
  studentId: string;
  exerciseId: string;
  // Séries definidas no exercício: valem quando o aluno deixa "Séries feitas" em branco.
  plannedSets?: number | null;
  // Última escolha de equipamento desse exercício: já vem marcada ao abrir.
  defaultEquipment?: LoadEquipment | null;
}) {
  const [open, setOpen] = useState(false);
  const [equipment, setEquipment] = useState<LoadEquipment | null>(defaultEquipment ?? null);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoadLogFormInput, unknown, LoadLogInput>({
    resolver: zodResolver(loadLogSchema),
  });

  function addValue(field: "weightKg" | "repsDone") {
    const current = String(getValues(field) ?? "").trim();
    if (!current || current.endsWith("+")) return;
    setValue(field, `${current} + `, { shouldDirty: true });
    setFocus(field);
  }

  async function onSubmit(values: LoadLogInput) {
    const result = await createLoadLog(studentId, exerciseId, { ...values, equipment: equipment ?? undefined });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setOpen(false);
  }

  function onOpenChange(next: boolean) {
    // Ao abrir, volta para a última escolha salva (a tela já foi atualizada com o último registro).
    if (next) setEquipment(defaultEquipment ?? null);
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <TrendingUp />
        Registrar carga
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar carga</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="setsDone">Séries feitas (opcional)</Label>
            <Input
              id="setsDone"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={plannedSets ? `${plannedSets} (definidas no treino)` : "Ex.: 4"}
              {...register("setsDone")}
            />
            {errors.setsDone && (
              <p className="text-sm text-destructive">{errors.setsDone.message}</p>
            )}
            {plannedSets ? (
              <p className="text-xs text-muted-foreground">
                Em branco, contamos as {plannedSets} séries definidas no treino.
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="weightKg">Carga (kg)</Label>
              <div className="flex gap-1.5">
                <Input
                  id="weightKg"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Ex.: 20"
                  className="min-w-0"
                  {...register("weightKg")}
                />
                <PlusButton onClick={() => addValue("weightKg")} />
              </div>
              {errors.weightKg && (
                <p className="text-sm text-destructive">{errors.weightKg.message}</p>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="repsDone">Repetições feitas</Label>
              <div className="flex gap-1.5">
                <Input
                  id="repsDone"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Ex.: 12"
                  className="min-w-0"
                  {...register("repsDone")}
                />
                <PlusButton onClick={() => addValue("repsDone")} />
              </div>
              {errors.repsDone && (
                <p className="text-sm text-destructive">{errors.repsDone.message}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Exercício conjugado? Toque em + para somar outro valor, por exemplo 10 + 15.
          </p>
          <div className="flex flex-col gap-2">
            <Label id="equipment-label">Feito com (opcional)</Label>
            <div role="group" aria-labelledby="equipment-label" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EQUIPMENT_OPTIONS.map((option) => {
                const selected = equipment === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    aria-pressed={selected}
                    // Tocar de novo na opção marcada desmarca (a escolha é opcional).
                    onClick={() => setEquipment(selected ? null : option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
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
