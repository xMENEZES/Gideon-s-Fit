"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { SealLine } from "@/lib/types/database.types";
import { SEAL_THEME, sealName } from "@/lib/seals";
import { SealBadge } from "@/components/shared/seal-badge";
import { Button } from "@/components/ui/button";

// Selo recém-conquistado: o card com a mensagem de sequência aparece UMA vez (junto com o
// aviso) e pode ser fechado no ×. Depois só fica o ícone do selo no topo da tela. A marca de
// "já mostrei" fica no navegador (sessionStorage), então recarregar a página não repete.
export function SealCelebration({
  line,
  milestone,
  message,
  storageKey,
}: {
  line: SealLine;
  milestone: number;
  message: string;
  storageKey: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      return;
    }
    // O navegador só é consultado depois da hidratação, por isso o estado muda no efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    toast.success(`Novo selo: ${sealName(line, milestone)}`);
  }, [line, milestone, storageKey]);

  if (!visible) return null;

  const theme = SEAL_THEME[line];
  return (
    <div
      role="status"
      className="relative flex items-center gap-4 rounded-xl border px-4 py-3 pr-10"
      style={{ borderColor: `${theme.color}66`, backgroundColor: `${theme.color}14` }}
    >
      <SealBadge line={line} milestone={milestone} className="w-16 shrink-0" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: theme.color }}>
          Novo selo · {theme.title}
        </p>
        <p className="font-semibold">{sealName(line, milestone)}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute right-1.5 top-1.5 text-muted-foreground"
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Fechar"
      >
        <X />
      </Button>
    </div>
  );
}
