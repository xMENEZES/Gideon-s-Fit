import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BellRing, LayoutTemplate, MessageSquareQuote, Trophy, Users } from "lucide-react";
import { getProfile } from "@/lib/auth/session";
import { ONBOARDING_PATH, roleHome } from "@/lib/auth/roles";
import { TopBar } from "@/components/shared/top-bar";
import { NavLink } from "@/components/shared/nav-link";
import { BottomNav } from "@/components/shared/bottom-nav";
import { AlertsBadge, PendingRequestsBadge } from "@/components/shared/trainer-nav-badges";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  if (!profile.onboarded) redirect(ONBOARDING_PATH);
  if (profile.role !== "trainer") redirect(roleHome(profile.role));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* No celular o menu vai para a barra de baixo (BottomNav); aqui ficam os links das telas largas. */}
      <TopBar fullName={profile.full_name} homeHref="/dashboard">
        <NavLink href="/dashboard" exact alsoActiveFor={["/dashboard/alunos"]}>
          <Users className="hidden size-4 sm:block" />
          Alunos
          <Suspense fallback={null}>
            <PendingRequestsBadge />
          </Suspense>
        </NavLink>
        <NavLink href="/dashboard/modelos">
          <LayoutTemplate className="hidden size-4 sm:block" />
          Modelos
        </NavLink>
        <NavLink href="/dashboard/mensagens">
          <MessageSquareQuote className="hidden size-4 sm:block" />
          Mensagens
        </NavLink>
        <NavLink href="/dashboard/ranking">
          <Trophy className="hidden size-4 sm:block" />
          Ranking
        </NavLink>
        <NavLink href="/dashboard/alertas">
          <BellRing className="hidden size-4 sm:block" />
          Alertas
          <Suspense fallback={null}>
            <AlertsBadge />
          </Suspense>
        </NavLink>
      </TopBar>
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
      <BottomNav
        basePath=""
        items={[
          {
            href: "/dashboard",
            label: "Alunos",
            icon: "alunos",
            exact: true,
            alsoActiveFor: ["/dashboard/alunos"],
            badge: (
              <Suspense fallback={null}>
                <PendingRequestsBadge />
              </Suspense>
            ),
          },
          { href: "/dashboard/modelos", label: "Modelos", icon: "modelos" },
          { href: "/dashboard/mensagens", label: "Mensagens", icon: "mensagens" },
          { href: "/dashboard/ranking", label: "Ranking", icon: "ranking" },
          {
            href: "/dashboard/alertas",
            label: "Alertas",
            icon: "alertas",
            badge: (
              <Suspense fallback={null}>
                <AlertsBadge />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
}
