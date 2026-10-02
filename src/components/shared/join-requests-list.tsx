"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { decideJoinRequest } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type JoinRequestItem = {
  id: string;
  name: string;
  email: string;
};

export function JoinRequestsList({ requests }: { requests: JoinRequestItem[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(id: string, decision: "approve" | "reject") {
    setBusyId(id);
    const result = await decideJoinRequest(id, decision);
    setBusyId(null);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(decision === "approve" ? "Pessoa adicionada ao time." : "Solicitação recusada.");
  }

  if (!requests.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitações para entrar no time ({requests.length})</CardTitle>
        <CardDescription>Aprove para a pessoa passar a ser sua aluna.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{request.name || request.email}</p>
              <p className="truncate text-sm text-muted-foreground">{request.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={busyId === request.id}
                onClick={() => decide(request.id, "approve")}
              >
                <Check className="size-4" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === request.id}
                onClick={() => decide(request.id, "reject")}
              >
                <X className="size-4" />
                Recusar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
