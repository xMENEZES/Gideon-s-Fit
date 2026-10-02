import Link from "next/link";
import { Dumbbell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { signOut } from "@/lib/actions/auth";

export function TopBar({
  fullName,
  homeHref,
  children,
}: {
  fullName: string;
  homeHref: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-border">
      <div className="flex flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
        <div className="flex items-center justify-between sm:contents">
          <Link href={homeHref} className="flex items-center gap-2 text-brand">
            <Dumbbell className="size-6" strokeWidth={2.5} />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Gideon&apos;s Fit
            </span>
          </Link>
          <form action={signOut} className="sm:hidden">
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
          {children}
          <ThemeToggle />
          <span className="hidden text-sm text-muted-foreground sm:inline">{fullName}</span>
          <form action={signOut} className="hidden sm:block">
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
