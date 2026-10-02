"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cancelJoinRequest, requestToJoinTeam } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type PendingJoin = { id: string; trainerName: string };

export function JoinTeamForm({ pending }: { pending: PendingJoin[] }) {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    const result = await requestToJoinTeam(code);
    setSending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Solicitação enviada para ${result.trainerName}. Aguarde a aprovação.`);
    setCode("");
  }

  async function handleCancel(id: string) {
    setBusyId(id);
    const result = await cancelJoinRequest(id);
    setBusyId(null);
    if (result?.error) toast.error(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Entrar no Time</CardTitle>
          <CardDescription>
            Digite o código que o seu profissional te enviou. Ele precisa aprovar a solicitação
            para você entrar no time. Depois disso, ele passa a montar os seus protocolos de treino e
            alimentar, e o seu plano próprio fica guardado e oculto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="team-code">Código do time</Label>
              <Input
                id="team-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                autoComplete="off"
                placeholder="ABCD2345"
                className="font-mono uppercase tracking-widest"
              />
            </div>
            <Button type="submit" disabled={sending || code.trim().length < 8}>
              {sending ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitações aguardando aprovação</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pending.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <p className="text-sm">
                  Time de <span className="font-medium">{item.trainerName}</span>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => handleCancel(item.id)}
                >
                  Cancelar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
