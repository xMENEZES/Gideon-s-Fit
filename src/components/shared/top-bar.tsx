import Link from "next/link";
import { Dumbbell, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { signOut } from "@/lib/actions/auth";

// Com menu de navegação (profissional) a barra tem vários links, então só vira uma
// linha única em telas largas (lg); abaixo disso o menu desce para a 2ª linha e o
// tema e o "Sair" ficam sempre ao lado do logo. Sem menu (aluno, Usuário Padrão e
// admin) a linha única já cabe a partir de sm.
const LAYOUT = {
  withNav: {
    outer: "flex flex-col gap-3 px-6 py-3 lg:flex-row lg:items-center lg:justify-between lg:py-4",
    firstRow: "flex items-center justify-between lg:contents",
    compactControls: "flex items-center gap-1 lg:hidden",
    nav: "flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-4 lg:flex-nowrap lg:justify-end [&_a]:whitespace-nowrap",
    toggle: "hidden lg:block",
    name: "hidden text-sm text-muted-foreground xl:inline",
    signOut: "hidden lg:block",
  },
  withoutNav: {
    outer: "flex flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4",
    firstRow: "flex items-center justify-between sm:contents",
    compactControls: "flex items-center gap-1 sm:hidden",
    nav: "hidden items-center justify-end gap-3 sm:flex lg:gap-4",
    toggle: "hidden sm:block",
    name: "hidden text-sm text-muted-foreground lg:inline",
    signOut: "hidden sm:block",
  },
} as const;

function AccountLink() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      nativeButton={false}
      render={<Link href="/conta" />}
      title="Minha conta"
    >
      <UserRound />
      <span className="sr-only">Minha conta</span>
    </Button>
  );
}

export function TopBar({
  fullName,
  homeHref,
  children,
}: {
  fullName: string;
  homeHref: string;
  children?: React.ReactNode;
}) {
  const layout = children ? LAYOUT.withNav : LAYOUT.withoutNav;

  return (
    <header className="border-b border-border">
      <div className={layout.outer}>
        <div className={layout.firstRow}>
          <Link href={homeHref} className="flex items-center gap-2 text-brand">
            <Dumbbell className="size-6" strokeWidth={2.5} />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Gideon&apos;s Fit
            </span>
          </Link>
          <div className={layout.compactControls}>
            <ThemeToggle />
            <AccountLink />
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="size-4" />
                Sair
              </Button>
            </form>
          </div>
        </div>
        <div className={layout.nav}>
          {children}
          <div className={layout.toggle}>
            <ThemeToggle />
          </div>
          <div className={layout.toggle}>
            <AccountLink />
          </div>
          <span className={layout.name}>{fullName}</span>
          <form action={signOut} className={layout.signOut}>
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
