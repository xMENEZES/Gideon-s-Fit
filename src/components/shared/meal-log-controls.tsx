"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { clearMealLog, saveMealLog } from "@/lib/actions/meal-logs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type MealLogValue = { done: boolean; note: string | null };

// Marca se a refeição do dia foi feita. Quando não foi, abre um campo opcional
// para anotar o motivo. Tocar de novo no botão já marcado desfaz o registro.
export function MealLogControls({
  mealId,
  date,
  value,
  onChange,
}: {
  mealId: string;
  date: string;
  value: MealLogValue | null;
  onChange: (value: MealLogValue | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(value?.note ?? "");

  function toggle(done: boolean) {
    startTransition(async () => {
      if (value?.done === done) {
        const result = await clearMealLog(mealId, date);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        setDraft("");
        onChange(null);
        return;
      }
      const result = await saveMealLog(mealId, date, done);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setDraft("");
      onChange({ done, note: null });
    });
  }

  function saveNote() {
    startTransition(async () => {
      const result = await saveMealLog(mealId, date, false, draft);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      onChange({ done: false, note: result.note ?? null });
      toast.success("Anotação salva.");
    });
  }

  const noteChanged = (value?.note ?? "") !== draft.trim();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={value?.done === true ? "default" : "outline"}
          disabled={pending}
          onClick={() => toggle(true)}
          aria-pressed={value?.done === true}
        >
          <Check />
          Fiz
        </Button>
        <Button
          type="button"
          size="sm"
          variant={value?.done === false ? "destructive" : "outline"}
          disabled={pending}
          onClick={() => toggle(false)}
          aria-pressed={value?.done === false}
        >
          <X />
          Não fiz
        </Button>
      </div>

      {value?.done === false && (
        <div className="flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Por que não conseguiu seguir a refeição? (opcional)"
          />
          {noteChanged && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="self-end"
              disabled={pending}
              onClick={saveNote}
            >
              Salvar anotação
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
