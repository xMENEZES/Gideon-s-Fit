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
import { OTHER_UNIT, UNIT_OPTIONS, isKnownUnit } from "@/lib/units";

const ITEMS = [...UNIT_OPTIONS, { value: OTHER_UNIT, label: "Outro" }];

// Menu de unidades com a opção "Outro" (campo livre). Unidades antigas, digitadas à mão,
// abrem já em "Outro" com o texto preenchido. O estado do modo "Outro" nasce do valor
// inicial, então quem usa este campo deve remontá-lo (via `key`) quando o formulário for
// reiniciado.
export function UnitField({
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
  const [custom, setCustom] = useState(() => value !== "" && !isKnownUnit(value));
  const selected = custom ? OTHER_UNIT : value === "" ? null : value;

  function handleSelect(next: string | null) {
    if (next === null) return;
    if (next === OTHER_UNIT) {
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
          <SelectValue placeholder="Escolha a unidade" />
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
          aria-label="Outra unidade"
          placeholder="Digite a unidade"
          maxLength={30}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
