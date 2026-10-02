"use client";

import Link from "next/link";
import { AlertTriangle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StartProtocolDialog } from "@/components/shared/start-protocol-dialog";
import { EditProtocolNotesDialog } from "@/components/shared/edit-protocol-notes-dialog";
import type { ProtocolType } from "@/lib/types/database.types";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

function daysRemaining(endDate: string) {
  const end = new Date(`${endDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

export function ProtocolHeader({
  studentId,
  type,
  protocol,
  historyHref,
  editable,
}: {
  studentId: string;
  type: ProtocolType;
  protocol: { id: string; start_date: string; end_date: string; notes?: string | null } | null;
  historyHref: string;
  editable: boolean;
}) {
  const remaining = protocol ? daysRemaining(protocol.end_date) : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="size-5 shrink-0 text-muted-foreground" />
          {protocol ? (
            <div>
              <p className="text-sm font-medium">
                {formatDate(protocol.start_date)} até {formatDate(protocol.end_date)}
              </p>
              {remaining !== null &&
                (remaining < 0 ? (
                  <Badge variant="destructive" className="mt-1 gap-1">
                    <AlertTriangle />
                    Vencido há {Math.abs(remaining)} {Math.abs(remaining) === 1 ? "dia" : "dias"}
                  </Badge>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {remaining === 0
                      ? "Vence hoje"
                      : `${remaining} ${remaining === 1 ? "dia restante" : "dias restantes"}`}
                  </p>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum protocolo ativo</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href={historyHref} className="text-sm font-medium text-primary hover:underline">
            Ver histórico
          </Link>
          {editable && (
            <StartProtocolDialog
              studentId={studentId}
              type={type}
              hasActiveProtocol={!!protocol}
            />
          )}
        </div>
      </div>

      {protocol && (editable || protocol.notes) && (
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Observações gerais</p>
            {editable && (
              <EditProtocolNotesDialog
                studentId={studentId}
                protocolId={protocol.id}
                type={type}
                notes={protocol.notes ?? null}
              />
            )}
          </div>
          {protocol.notes && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{protocol.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
