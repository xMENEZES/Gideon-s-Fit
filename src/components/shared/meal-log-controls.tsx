"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { clearMealLog, saveMealLog } from "@/lib/actions/meal-logs";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MealCard, type MealWithOptions } from "@/components/shared/meal-card";

export type MealLogValue = { done: boolean; note: string | null };

// Estado e ações do registro de uma refeição em um dia. Tocar de novo no botão já marcado
// desfaz o registro.
function useMealLog({
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

  return { pending, draft, setDraft, toggle, saveNote, noteChanged: (value?.note ?? "") !== draft.trim() };
}

type MealLog = ReturnType<typeof useMealLog>;

// Botão redondo próprio (e não o Button "outline"): no tema escuro o outline força o próprio
// fundo e borda e apagaria o preenchimento do botão marcado.
const ROUND =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50";

// Dois botões redondos: ✓ (fiz) e ✕ (não fiz). Marcado = preenchido; tocar de novo desfaz.
function MealLogButtons({ log, value, mealName }: { log: MealLog; value: MealLogValue | null; mealName: string }) {
  return (
    <div role="group" aria-label={`Registro de ${mealName}`} className="flex items-center gap-2">
      <button
        type="button"
        className={cn(
          ROUND,
          value?.done === true
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:border-primary hover:text-primary"
        )}
        disabled={log.pending}
        onClick={() => log.toggle(true)}
        aria-pressed={value?.done === true}
        aria-label="Fiz"
        title={value?.done === true ? "Fiz (toque para desfazer)" : "Marcar como feita"}
      >
        <Check className="size-5" strokeWidth={3} />
      </button>
      <button
        type="button"
        className={cn(
          ROUND,
          value?.done === false
            ? "border-destructive bg-destructive text-white"
            : "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
        )}
        disabled={log.pending}
        onClick={() => log.toggle(false)}
        aria-pressed={value?.done === false}
        aria-label="Não fiz"
        title={value?.done === false ? "Não fiz (toque para desfazer)" : "Marcar como não feita"}
      >
        <X className="size-5" strokeWidth={3} />
      </button>
    </div>
  );
}

// Anotação opcional (por que não conseguiu seguir a refeição): só aparece com "Não fiz".
function MealLogNote({ log }: { log: MealLog }) {
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={log.draft}
        onChange={(e) => log.setDraft(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Por que não conseguiu seguir a refeição? (opcional)"
      />
      {log.noteChanged && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="self-end"
          disabled={log.pending}
          onClick={log.saveNote}
        >
          Salvar anotação
        </Button>
      )}
    </div>
  );
}

// Estado da refeição na barra recolhida.
function MealStatusBadge({ value }: { value: MealLogValue }) {
  return value.done ? (
    <Badge className="gap-1 bg-primary/15 font-normal text-primary">
      <Check className="size-3" strokeWidth={3} />
      Feita
    </Badge>
  ) : (
    <Badge className="gap-1 bg-destructive/15 font-normal text-destructive">
      <X className="size-3" strokeWidth={3} />
      Não feita
    </Badge>
  );
}

// Cartão da refeição com o registro do dia. Na tela diária (sem edição) os ícones ficam no
// canto do cabeçalho, junto ao nome da refeição, e com registro o cartão pode ficar recolhido
// (`collapsed`) para ocupar menos tela; na tela de edição o cabeçalho já tem os botões de
// editar, então os ícones ficam em uma linha própria no pé do cartão e nada é recolhido.
export function TrackedMealCard({
  meal,
  studentId,
  editable,
  date,
  value,
  onChange,
  collapsed = false,
  onToggleCollapsed,
}: {
  meal: MealWithOptions;
  studentId: string;
  editable: boolean;
  date: string;
  value: MealLogValue | null;
  onChange: (value: MealLogValue | null) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const log = useMealLog({ mealId: meal.id, date, value, onChange });
  const buttons = <MealLogButtons log={log} value={value} mealName={meal.name} />;
  const note = value?.done === false ? <MealLogNote log={log} /> : null;

  if (editable) {
    return (
      <MealCard
        meal={meal}
        studentId={studentId}
        editable
        tracking={
          <div className="flex flex-col gap-3">
            {buttons}
            {note}
          </div>
        }
      />
    );
  }
  // Só dá para recolher/expandir uma refeição que já tem registro.
  const collapsible =
    value && onToggleCollapsed
      ? { collapsed, onToggle: onToggleCollapsed, status: <MealStatusBadge value={value} /> }
      : undefined;
  return (
    <MealCard
      meal={meal}
      studentId={studentId}
      editable={false}
      headerAction={buttons}
      tracking={note}
      collapsible={collapsible}
    />
  );
}
