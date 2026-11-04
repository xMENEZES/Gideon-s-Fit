"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { enablePushOnThisDevice, readPushState, type PushState } from "@/lib/push-client";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "gf_push_optin_dismissed";

function dismissedBefore() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

// Convite, no topo do treino do dia, para receber o aviso do fim do descanso com a tela
// bloqueada. Só aparece quando dá para pedir (navegador com suporte, ainda sem escolha) e a pessoa
// não dispensou. A escolha também fica em "Minha conta".
export function PushOptIn() {
  const [state, setState] = useState<PushState | "hidden">("hidden");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void readPushState().then((next) => {
      if (alive) setState(next === "ask" && !dismissedBefore() ? "ask" : "hidden");
    });
    return () => {
      alive = false;
    };
  }, []);

  if (state !== "ask") return null;

  async function enable() {
    setBusy(true);
    const result = await enablePushOnThisDevice();
    setBusy(false);
    if (result.ok) {
      toast.success("Aviso ligado: você será avisado no fim do descanso, mesmo com a tela bloqueada.");
      setState("hidden");
    } else if (result.reason === "denied") {
      toast.error("O aviso foi bloqueado. Para ligar depois, libere as notificações deste app nas configurações do aparelho.");
      setState("hidden");
    } else {
      toast.error(result.message ?? "Não foi possível ligar o aviso neste aparelho.");
    }
  }

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // sem armazenamento: o convite volta na próxima visita
    }
    setState("hidden");
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex items-start gap-3">
        <BellRing className="mt-0.5 size-5 shrink-0 text-primary-ink" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Avisar o fim do descanso com a tela bloqueada?</p>
          <p className="text-xs text-muted-foreground">
            Você recebe uma notificação quando o cronômetro zerar, mesmo que o celular esteja bloqueado.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={() => void enable()} disabled={busy}>
          {busy ? "Ativando..." : "Ativar aviso"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={dismiss} disabled={busy}>
          Agora não
        </Button>
      </div>
    </div>
  );
}
