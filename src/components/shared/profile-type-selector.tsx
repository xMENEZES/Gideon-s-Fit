"use client";

import { Dumbbell, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProfileType = "trainer" | "standard";

const OPTIONS: {
  value: ProfileType;
  title: string;
  description: string;
  icon: typeof User;
}[] = [
  {
    value: "trainer",
    title: "Profissional",
    description:
      "Personal trainer ou nutricionista. Monte protocolos e acompanhe os alunos do seu time.",
    icon: Dumbbell,
  },
  {
    value: "standard",
    title: "Usuário Padrão",
    description:
      "Treina por conta própria. Monte seus protocolos de treino e alimentar ou entre no time de um profissional.",
    icon: User,
  },
];

export function ProfileTypeSelector({
  value,
  onChange,
}: {
  value: ProfileType | undefined;
  onChange: (value: ProfileType) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Tipo de perfil" className="grid gap-3">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              selected
                ? "border-primary bg-accent"
                : "border-border hover:border-primary/60"
            )}
          >
            <option.icon className="mt-0.5 size-5 shrink-0 text-primary" />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{option.title}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
