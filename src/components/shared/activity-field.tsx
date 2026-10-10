"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARDIO_ACTIVITIES, OTHER_ACTIVITY, isKnownActivity } from "@/lib/cardio";

const ITEMS = [
  ...CARDIO_ACTIVITIES.map((activity) => ({ value: activity, label: activity })),
  { value: OTHER_ACTIVITY, label: "Outra" },
];

// Menu de atividades de cardio com a opção "Outra" (campo livre). O valor é o próprio nome do
// exercício. O estado do modo "Outra" nasce do valor inicial, então quem usa este campo deve
// remontá-lo (via `key`) quando o formulário for reiniciado.
export function ActivityField({
  id,
  value,
  onChange,
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const [custom, setCustom] = useState(() => value !== "" && !isKnownActivity(value));
  const selected = custom ? OTHER_ACTIVITY : value === "" ? null : value;

  function handleSelect(next: string | null) {
    if (next === null) return;
    if (next === OTHER_ACTIVITY) {
      setCustom(true);
      onChange("");
    } else {
      setCustom(false);
      onChange(next);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Select value={selected} onValueChange={handleSelect} items={ITEMS}>
        <SelectTrigger id={id} className="h-9 w-full" aria-invalid={invalid}>
          <SelectValue placeholder="Escolha a atividade" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {custom && (
        <Input
          aria-label="Outra atividade"
          placeholder="Digite a atividade"
          maxLength={120}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
