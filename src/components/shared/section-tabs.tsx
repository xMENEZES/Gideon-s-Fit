"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SectionTabs({
  basePath,
  items,
}: {
  basePath: string;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <div className="inline-flex h-9 w-fit items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground">
      {items.map((item) => {
        const href = `${basePath}${item.href}`;
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex h-7 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
