"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  disablePushOnThisDevice,
  enablePushOnThisDevice,
  readPushState,
  type PushState,
} from "@/lib/push-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TEXT: Record<PushState, string> = {
  on: "O aviso está ligado neste aparelho: você é notificado quando o descanso termina, mesmo com a tela bloqueada.",
  ask: "O aviso está desligado neste aparelho.",
  blocked:
    "As notificações deste app estão bloqueadas neste aparelho. Para ligar, libere-as nas configurações do aparelho (ou do navegador) e volte aqui.",
  unsupported:
    "Este navegador não oferece notificações push (no iPhone, só com o app adicionado à tela inicial).",
};

// Liga e desliga o aviso do fim do descanso neste aparelho (em "Minha conta").
export function PushSettingsCard() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void readPushState().then((next) => {
      if (alive) setState(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    const result = await enablePushOnThisDevice();
    setBusy(false);
    if (result.ok) {
      setState("on");
      toast.success("Aviso ligado neste aparelho.");
    } else if (result.reason === "denied") {
      setState("blocked");
    } else {
      toast.error(result.message ?? "Não foi possível ligar o aviso neste aparelho.");
    }
  }

  async function disable() {
    setBusy(true);
    await disablePushOnThisDevice();
    setBusy(false);
    setState("ask");
    toast.success("Aviso desligado neste aparelho.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aviso do fim do descanso</CardTitle>
        <CardDescription>
          Uma notificação quando o cronômetro de descanso zera, útil quando o celular está bloqueado entre
          as séries. A escolha vale para este aparelho.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {state === null ? (
          <p className="text-sm text-muted-foreground">Verificando...</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{TEXT[state]}</p>
            {state === "ask" && (
              <Button type="button" className="w-fit" onClick={() => void enable()} disabled={busy}>
                {busy ? "Ativando..." : "Ativar neste aparelho"}
              </Button>
            )}
            {state === "on" && (
              <Button type="button" variant="outline" className="w-fit" onClick={() => void disable()} disabled={busy}>
                {busy ? "Desativando..." : "Desativar neste aparelho"}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
