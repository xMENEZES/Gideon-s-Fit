"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { ExerciseFormInput } from "@/lib/validations/workout.schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Campos do exercício, compartilhados entre "Novo exercício" e "Editar exercício".
export function ExerciseFormFields({
  register,
  errors,
}: {
  register: UseFormRegister<ExerciseFormInput>;
  errors: FieldErrors<ExerciseFormInput>;
}) {
  return (
    <>
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
        <Input id="videoUrl" placeholder="https://youtube.com/..." {...register("videoUrl")} />
        {errors.videoUrl && <p className="text-sm text-destructive">{errors.videoUrl.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea id="notes" rows={2} {...register("notes")} />
        {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
      </div>
    </>
  );
}
