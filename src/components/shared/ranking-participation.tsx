"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Trophy } from "lucide-react";
import { toast } from "sonner";
import { setRankingParticipation } from "@/lib/actions/ranking";
import { Button } from "@/components/ui/button";

// O aluno aceita ou deixa de participar do ranking do time. Depois de gravar, a tela recarrega.
export function RankingParticipationButton({ join }: { join: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await setRankingParticipation(join);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(join ? "Você está participando do ranking." : "Você saiu do ranking.");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={join ? "default" : "outline"}
      size={join ? "default" : "sm"}
      disabled={pending}
      onClick={handleClick}
      className="self-start"
    >
      {join ? <Trophy /> : <LogOut />}
      {pending ? "Salvando..." : join ? "Participar do ranking" : "Sair do ranking"}
    </Button>
  );
}
