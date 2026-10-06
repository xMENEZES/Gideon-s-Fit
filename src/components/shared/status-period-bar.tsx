"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/shared/date-field";
import { cn } from "@/lib/utils";

export type PeriodPreset = { label: string; href: string; active: boolean };

const chipClass = "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors";
const chipActive = "border-primary bg-primary text-primary-foreground";
const chipIdle = "border-border hover:bg-muted";

// Barra de período da tela de status: atalhos (protocolo atual, últimos N dias)
// e um intervalo livre De/Até que vale para treino e alimentação juntos.
export function StatusPeriodBar({
  basePath,
  presets,
  customActive,
  defaultFrom,
  defaultTo,
  today,
}: {
  basePath: string;
  presets: PeriodPreset[];
  customActive: boolean;
  defaultFrom: string;
  defaultTo: string;
  today: string;
}) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(customActive);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const currentYear = Number(today.slice(0, 4));

  function apply() {
    if (from > to) {
      toast.error("A data inicial deve ser anterior ou igual à data final.");
      return;
    }
    const end = to > today ? today : to;
    router.push(`${basePath}?de=${from}&ate=${end}`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium">Período</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Link
            key={preset.label}
            href={preset.href}
            scroll={false}
            className={cn(chipClass, preset.active ? chipActive : chipIdle)}
          >
            {preset.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom((current) => !current)}
          className={cn(chipClass, customActive ? chipActive : chipIdle)}
          aria-expanded={showCustom}
        >
          Personalizado
        </button>
      </div>

      {showCustom && (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">De</span>
              <DateField
                label="De"
                value={from}
                onChange={setFrom}
                minYear={currentYear - 3}
                maxYear={currentYear}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Até</span>
              <DateField
                label="Até"
                value={to}
                onChange={setTo}
                minYear={currentYear - 3}
                maxYear={currentYear}
              />
            </div>
          </div>
          <Button type="button" size="sm" className="self-start" onClick={apply}>
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
