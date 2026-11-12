import { Check, Circle } from "lucide-react";
import { passwordChecks } from "@/lib/password-rules";
import { cn } from "@/lib/utils";

// Lista as regras da senha e marca as que já foram cumpridas enquanto a pessoa digita.
export function PasswordRequirements({ value }: { value: string }) {
  const checks = passwordChecks(value);
  return (
    <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2" aria-label="Regras da senha">
      {checks.map((check) => (
        <li
          key={check.id}
          className={cn("flex items-center gap-1.5", check.ok ? "text-primary-ink" : "text-muted-foreground")}
        >
          {check.ok ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3.5" aria-hidden />}
          <span>
            {check.label}
            <span className="sr-only">{check.ok ? " (ok)" : " (falta)"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
