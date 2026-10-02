"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ConfirmDeleteButton({
  action,
  confirmMessage,
  disabledReason,
}: {
  action: () => Promise<{ error?: string } | undefined>;
  confirmMessage: string;
  disabledReason?: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (disabledReason) {
      toast.error(disabledReason);
      return;
    }
    if (!window.confirm(confirmMessage)) return;
    setPending(true);
    const result = await action();
    setPending(false);
    if (result?.error) toast.error(result.error);
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-destructive"
      onClick={handleClick}
      disabled={pending}
      title={disabledReason}
      type="button"
    >
      <Trash2 />
    </Button>
  );
}
