"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMyAccount } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteAccountForm({ email }: { email: string }) {
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault();
    if (!matches) return;
    setPending(true);
    const result = await deleteMyAccount(typed);
    if (result?.error) {
      setPending(false);
      toast.error(result.error);
      return;
    }
    toast.success("Conta excluída.");
    window.location.href = "/";
  }

  return (
    <form onSubmit={handleDelete} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-email">
          Para confirmar, digite o e-mail da conta: <span className="font-medium">{email}</span>
        </Label>
        <Input
          id="confirm-email"
          type="email"
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={email}
        />
      </div>
      <Button type="submit" variant="destructive" disabled={!matches || pending} className="self-start">
        <Trash2 />
        {pending ? "Excluindo..." : "Excluir minha conta definitivamente"}
      </Button>
    </form>
  );
}
