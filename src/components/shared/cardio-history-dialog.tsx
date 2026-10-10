"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCardioAmount } from "@/lib/cardio";

export type CardioLogPoint = {
  logged_at: string;
  duration_minutes: number | null;
  distance_km: number | null;
};

const MAX_ROWS = 30;

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

// Etiqueta com a última sessão; ao tocar, lista as sessões (as mais recentes primeiro).
export function CardioHistoryDialog({
  exerciseName,
  logs,
}: {
  exerciseName: string;
  logs: CardioLogPoint[];
}) {
  const sorted = [...logs].sort((a, b) => b.logged_at.localeCompare(a.logged_at));
  const last = sorted[0];
  if (!last) return null;
  const rows = sorted.slice(0, MAX_ROWS);

  return (
    <Dialog>
      <DialogTrigger
        nativeButton={false}
        render={<Badge className="cursor-pointer hover:opacity-80" title="Ver sessões de cardio" />}
      >
        Última: {formatCardioAmount(last.duration_minutes, last.distance_km)}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sessões de {exerciseName}</DialogTitle>
        </DialogHeader>
        <ul className="flex max-h-80 flex-col gap-1.5 overflow-y-auto text-sm">
          {rows.map((log, index) => (
            <li
              key={`${log.logged_at}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
            >
              <span className="text-muted-foreground">{formatDate(log.logged_at)}</span>
              <span className="font-medium">
                {formatCardioAmount(log.duration_minutes, log.distance_km)}
              </span>
            </li>
          ))}
        </ul>
        {sorted.length > MAX_ROWS && (
          <p className="text-xs text-muted-foreground">
            Mostrando as {MAX_ROWS} sessões mais recentes de {sorted.length}.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
