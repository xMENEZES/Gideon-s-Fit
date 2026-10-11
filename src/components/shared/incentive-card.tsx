"use client";

import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

// Mensagem de incentivo na tela diária. Fica visível enquanto o módulo estiver concluído e,
// na primeira vez que aparece em cada dia e evento, também sobe como aviso. A marca de "já
// avisei" fica no navegador (sessionStorage), então recarregar a página não repete o aviso.
export function IncentiveCard({ message, storageKey }: { message: string; storageKey: string }) {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Sem armazenamento disponível: o cartão continua na tela, só o aviso é pulado.
      return;
    }
    toast.success(message);
  }, [message, storageKey]);

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3"
    >
      <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
