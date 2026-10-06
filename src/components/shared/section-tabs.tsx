"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// No celular cada aba ocupa o tamanho do próprio texto e a sobra da largura é dividida entre
// elas, com letra e espaçamento menores, para caber todas sem rolagem lateral nem sobreposição
// (dividir a largura por igual sobrepunha as abas de nome mais longo).
// `shortLabel` é o texto reduzido usado só no celular
// quando o nome completo não cabe (ex.: "Time" no lugar de "Entrar no Time").
export function SectionTabs({
  basePath,
  items,
}: {
  basePath: string;
  items: { href: string; label: string; shortLabel?: string }[];
}) {
  const pathname = usePathname();

  return (
    <div className="flex w-full items-center gap-1 overflow-x-auto overflow-y-hidden rounded-lg bg-muted p-1 text-muted-foreground sm:inline-flex sm:h-9 sm:w-fit sm:max-w-full">
      {items.map((item) => {
        const href = `${basePath}${item.href}`;
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex h-7 flex-auto shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-[13px] font-medium transition-colors sm:flex-none sm:px-4 sm:text-sm",
              active
                ? "bg-background text-foreground shadow-sm"
                : "hover:text-foreground"
            )}
          >
            {item.shortLabel ? (
              <>
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </>
            ) : (
              item.label
            )}
          </Link>
        );
      })}
    </div>
  );
}
