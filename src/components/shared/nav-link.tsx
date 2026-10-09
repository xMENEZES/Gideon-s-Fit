"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

// Link do menu do topo que destaca (cor de destaque e negrito leve) a tela em que a pessoa está.
export function NavLink({
  href,
  exact,
  alsoActiveFor,
  children,
}: {
  href: string;
  exact?: boolean;
  alsoActiveFor?: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname, href, { exact, alsoActiveFor });

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium transition-colors",
        active ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
