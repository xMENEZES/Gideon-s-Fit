"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadChart, type LoadLogPoint } from "@/components/shared/load-chart";

const MAX_POINTS = 7;

export function LoadHistoryDialog({
  exerciseName,
  logs,
}: {
  exerciseName: string;
  logs: LoadLogPoint[];
}) {
  const sorted = [...logs].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
  const lastLog = sorted.at(-1);
  if (!lastLog) return null;
  const recent = sorted.slice(-MAX_POINTS);

  return (
    <Dialog>
      <DialogTrigger
        nativeButton={false}
        render={
          <Badge className="cursor-pointer hover:opacity-80" title="Ver histórico de carga" />
        }
      >
        {lastLog.weight_kg} kg atual
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Histórico de carga — {exerciseName}</DialogTitle>
        </DialogHeader>
        {sorted.length > 1 ? (
          <>
            <LoadChart logs={recent} />
            {sorted.length > MAX_POINTS && (
              <p className="text-xs text-muted-foreground">
                Mostrando os {MAX_POINTS} registros mais recentes de {sorted.length}.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Registre mais cargas para ver a evolução ao longo do tempo.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
