"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { deleteCatalogName, listExerciseCatalog } from "@/lib/actions/exercise-catalog";
import {
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  cleanCatalogName,
  filterCatalog,
  isInCatalog,
  normalizeName,
  type CatalogItem,
} from "@/lib/exercise-catalog";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// O que fazer com o nome digitado quando ele não está no catálogo: guardar (ou não) e em que grupo.
export type CatalogChoice = { save: boolean; group: string };

// Campo "Nome do exercício" com sugestões do catálogo (migração 0033). O nome continua texto
// livre: dá para ignorar as sugestões e digitar qualquer coisa. Nome que não está no catálogo
// pode ser guardado para a próxima vez (caixa marcada por padrão); nomes guardados pela própria
// pessoa têm um "x" para remover.
export function ExerciseNameField({
  id,
  value,
  onChange,
  invalid,
  onChoiceChange,
  initialName,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  // Avisa o formulário do que guardar no envio (nulo = nada a guardar). Precisa ser estável.
  onChoiceChange?: (choice: CatalogChoice | null) => void;
  // Ao editar, o nome que já estava no exercício: não oferece guardar enquanto não for alterado.
  initialName?: string;
}) {
  const listId = useId();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [save, setSave] = useState(true);
  const [group, setGroup] = useState("");

  useEffect(() => {
    let alive = true;
    void listExerciseCatalog().then((list) => {
      if (!alive) return;
      setItems(list);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const suggestions = useMemo(() => filterCatalog(items, value), [items, value]);
  const showList = open && suggestions.length > 0;

  const typed = cleanCatalogName(value);
  const unchanged = !!initialName && !!typed && normalizeName(typed) === normalizeName(initialName);
  const offerSave = loaded && !!typed && !unchanged && !isInCatalog(items, typed);

  useEffect(() => {
    onChoiceChange?.(offerSave ? { save, group } : null);
  }, [offerSave, save, group, onChoiceChange]);

  function pick(item: CatalogItem) {
    onChange(item.name);
    setOpen(false);
    setActive(-1);
  }

  async function remove(item: CatalogItem) {
    const result = await deleteCatalogName(item.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setItems((current) => current.filter((candidate) => candidate.id !== item.id));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && active >= 0) {
      // Escolhe a sugestão marcada, em vez de enviar o formulário.
      event.preventDefault();
      pick(suggestions[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          id={id}
          value={value}
          placeholder="Supino reto"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || undefined}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {suggestions.map((item, index) => (
              <li key={item.id} role="presentation" className="flex items-center">
                <div
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  // Mantém o foco no campo: sem isso o clique fecharia a lista antes de escolher.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(item)}
                  className={cn(
                    "flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm",
                    index === active && "bg-accent text-accent-foreground"
                  )}
                >
                  <span className="truncate">{item.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {MUSCLE_GROUP_LABELS[item.group]}
                    {item.own ? " · meu" : ""}
                  </span>
                </div>
                {item.own && (
                  <button
                    type="button"
                    aria-label={`Remover ${item.name} do meu catálogo`}
                    title="Remover do meu catálogo"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void remove(item)}
                    className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {offerSave && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <Checkbox id={`${id}-save`} checked={save} onCheckedChange={(checked) => setSave(checked === true)} />
            <Label htmlFor={`${id}-save`} className="text-sm font-normal">
              Guardar este nome no meu catálogo
            </Label>
          </div>
          {save && (
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${id}-group`} className="text-xs text-muted-foreground">
                Grupo muscular
              </Label>
              <select
                id={`${id}-group`}
                value={group}
                onChange={(event) => setGroup(event.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              >
                <option value="">Escolha o grupo</option>
                {MUSCLE_GROUPS.map((value) => (
                  <option key={value} value={value}>
                    {MUSCLE_GROUP_LABELS[value]}
                  </option>
                ))}
              </select>
              {!group && (
                <p className="text-xs text-muted-foreground">
                  Escolha o grupo muscular para guardar, ou desmarque a opção.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
