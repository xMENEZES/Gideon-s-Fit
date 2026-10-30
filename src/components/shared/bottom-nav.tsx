"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesColumn, Dumbbell, Users, Utensils, type LucideIcon } from "lucide-react";
import { isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

export type BottomNavIcon = "treino" | "dieta" | "status" | "time";
export type BottomNavItem = { href: string; label: string; icon: BottomNavIcon };

// Ícones por nome: um componente não atravessa do servidor (layout) para o cliente.
const ICONS: Record<BottomNavIcon, LucideIcon> = {
  treino: Dumbbell,
  dieta: Utensils,
  status: ChartNoAxesColumn,
  time: Users,
};

// Quanto a tela precisa rolar de uma vez para a barra reagir (ignora tremidas do dedo).
const SCROLL_STEP = 8;

// Menu do celular, na parte de baixo da tela. Não é fixo à força: ao rolar para baixo some
// (para dar espaço ao conteúdo) e ao rolar para cima volta, e então fica à vista até a tela
// ser rolada para baixo de novo. No topo da página sempre aparece. Só existe no celular (sm:hidden).
export function BottomNav({ basePath, items }: { basePath: string; items: BottomNavItem[] }) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    function onScroll() {
      const y = Math.max(window.scrollY, 0);
      const delta = y - lastY.current;
      if (y < SCROLL_STEP) {
        setHidden(false);
        lastY.current = y;
      } else if (delta > SCROLL_STEP) {
        setHidden(true);
        lastY.current = y;
      } else if (delta < -SCROLL_STEP) {
        setHidden(false);
        lastY.current = y;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Reserva o espaço da barra no fim da página, para ela não cobrir o último conteúdo. */}
      <div aria-hidden="true" className="h-16 sm:hidden" />
      <nav
        aria-label="Menu principal"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-200 sm:hidden",
          hidden && "translate-y-full"
        )}
      >
        <ul className="flex items-stretch justify-around">
          {items.map((item) => {
            const href = `${basePath}${item.href}`;
            const active = isNavActive(pathname, href);
            const Icon = ICONS[item.icon];
            return (
              <li key={href} className="min-w-0 flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors",
                    active ? "font-semibold text-primary-ink" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
