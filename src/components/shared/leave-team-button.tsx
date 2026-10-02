"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { leaveTeam } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LeaveTeamButton() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleLeave() {
    setPending(true);
    const result = await leaveTeam();
    if (result?.error) {
      setPending(false);
      toast.error(result.error);
      return;
    }
    toast.success("Você saiu do time.");
    window.location.href = "/";
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <LogOut />
        Sair do time
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sair do time?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Os protocolos de treino e alimentar que o seu profissional montou para você, com o
          histórico, serão apagados e isso não pode ser desfeito. A sua conta continua e o seu plano
          próprio volta a ficar disponível.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleLeave} disabled={pending}>
            {pending ? "Saindo..." : "Sair do time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
