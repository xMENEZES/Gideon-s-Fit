"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// Um clique alterna entre claro e escuro. O ícone mostra o modo para o qual vai
// trocar; a troca de ícone é feita só com CSS (variante dark), então não há
// diferença entre servidor e navegador na hora de renderizar.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="relative"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
      <Moon className="absolute scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
      <span className="sr-only">Alternar entre tema claro e escuro</span>
    </Button>
  );
}
