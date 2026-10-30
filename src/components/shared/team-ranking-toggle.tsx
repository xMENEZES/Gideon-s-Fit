"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setTeamRanking } from "@/lib/actions/ranking";
import { Button } from "@/components/ui/button";

// Liga ou desliga o ranking do time (só o profissional vê este botão).
export function TeamRankingToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await setTeamRanking(!enabled);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(enabled ? "Ranking desligado." : "Ranking ligado.");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={enabled ? "outline" : "default"}
      size="sm"
      disabled={pending}
      onClick={handleClick}
      className="self-start"
    >
      {pending ? "Salvando..." : enabled ? "Desligar ranking" : "Ligar ranking"}
    </Button>
  );
}
