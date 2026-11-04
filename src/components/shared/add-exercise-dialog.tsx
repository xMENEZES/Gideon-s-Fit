"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  exerciseSchema,
  type ExerciseInput,
  type ExerciseFormInput,
} from "@/lib/validations/workout.schema";
import type { ExerciseKind } from "@/lib/types/database.types";
import { createExercise } from "@/lib/actions/workouts";
import { saveCatalogName } from "@/lib/actions/exercise-catalog";
import type { CatalogChoice } from "@/components/shared/exercise-name-field";
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

const KINDS: { value: ExerciseKind; label: string }[] = [
  { value: "strength", label: "Musculação" },
  { value: "cardio", label: "Cardio" },
];

function defaultsFor(kind: ExerciseKind): ExerciseFormInput {
  return kind === "strength" ? { kind, name: "", restSeconds: 60 } : { kind, name: "" };
}

export function AddExerciseDialog({
  studentId,
  workoutDayId,
}: {
  studentId: string;
  workoutDayId: string;
}) {
  const [open, setOpen] = useState(false);
  // Remonta o menu de atividades (cardio) quando o formulário é reiniciado.
  const [activityKey, setActivityKey] = useState(0);
  // Nome novo que a pessoa quer guardar no catálogo (só musculação).
  const [catalogChoice, setCatalogChoice] = useState<CatalogChoice | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormInput, unknown, ExerciseInput>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: defaultsFor("strength"),
  });

  const watchedKind = useWatch({ control, name: "kind" });
  const kind: ExerciseKind = watchedKind ?? "strength";

  // Trocar o tipo reinicia os campos (nome e metas de um tipo não servem ao outro).
  function changeKind(next: ExerciseKind) {
    if (next === kind) return;
    reset(defaultsFor(next));
    setActivityKey((key) => key + 1);
    setCatalogChoice(null);
  }

  async function onSubmit(values: ExerciseInput) {
    const choice = values.kind === "strength" ? catalogChoice : null;
    if (choice?.save && !choice.group) {
      toast.error("Escolha o grupo muscular para guardar o nome no catálogo, ou desmarque a opção.");
      return;
    }
    const result = await createExercise(studentId, workoutDayId, values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    if (choice?.save) {
      const saved = await saveCatalogName(values.name, choice.group);
      if (saved?.error) toast.error(`Exercício adicionado. ${saved.error}`);
    }
    setCatalogChoice(null);
    reset(defaultsFor(values.kind));
    setActivityKey((key) => key + 1);
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
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de exercício">
            {KINDS.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={kind === item.value ? "default" : "outline"}
                aria-pressed={kind === item.value}
                onClick={() => changeKind(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <ExerciseFormFields
            kind={kind}
            register={register}
            control={control}
            errors={errors}
            activityKey={activityKey}
            onCatalogChoice={setCatalogChoice}
          />
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
