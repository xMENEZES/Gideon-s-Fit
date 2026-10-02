"use client";

import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

const selectClass =
  "h-9 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 md:text-sm";

// Substitui <input type="time">: o seletor nativo do Android aparece cortado
// dentro do app instalado. Valor no formato "HH:MM", ou "" quando vazio.
export function TimeField({
  value,
  onChange,
  id,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}) {
  const [hour = "", minute = ""] = value ? value.split(":") : [];

  function update(nextHour: string, nextMinute: string) {
    if (!nextHour && !nextMinute) {
      onChange("");
      return;
    }
    onChange(`${nextHour || "00"}:${nextMinute || "00"}`);
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <select
        id={id}
        aria-label="Hora"
        className={selectClass}
        value={hour}
        onChange={(e) => update(e.target.value, minute)}
      >
        <option value="">--</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span aria-hidden="true">:</span>
      <select
        aria-label="Minuto"
        className={selectClass}
        value={minute}
        onChange={(e) => update(hour, e.target.value)}
      >
        <option value="">--</option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
