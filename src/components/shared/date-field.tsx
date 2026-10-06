"use client";

import { cn } from "@/lib/utils";

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 md:text-sm";

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Substitui <input type="date">: o seletor nativo do Android aparece cortado dentro
// do app instalado. Valor no formato "YYYY-MM-DD".
export function DateField({
  value,
  onChange,
  minYear,
  maxYear,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  minYear: number;
  maxYear: number;
  label: string;
  className?: string;
}) {
  const [year, month, day] = value.split("-").map(Number);

  function update(nextYear: number, nextMonth: number, nextDay: number) {
    const safeDay = Math.min(nextDay, daysInMonth(nextYear, nextMonth));
    onChange(
      `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`
    );
  }

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <select
        aria-label={`${label}: dia`}
        className={cn(selectClass, "w-16")}
        value={day}
        onChange={(e) => update(year, month, Number(e.target.value))}
      >
        {Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        aria-label={`${label}: mês`}
        className={cn(selectClass, "flex-1")}
        value={month}
        onChange={(e) => update(year, Number(e.target.value), day)}
      >
        {MONTHS.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        aria-label={`${label}: ano`}
        className={cn(selectClass, "w-[4.5rem]")}
        value={year}
        onChange={(e) => update(Number(e.target.value), month, day)}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
