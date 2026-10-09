import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BarChart3, BellRing, LayoutTemplate, Users } from "lucide-react";
import { getProfile } from "@/lib/auth/session";
import { ONBOARDING_PATH, roleHome } from "@/lib/auth/roles";
import { TopBar } from "@/components/shared/top-bar";
import { NavLink } from "@/components/shared/nav-link";
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
      <TopBar fullName={profile.full_name} homeHref="/dashboard">
        <NavLink href="/dashboard" exact alsoActiveFor={["/dashboard/alunos"]}>
          <Users className="hidden size-4 sm:block" />
          Meus Alunos
          <Suspense fallback={null}>
            <PendingRequestsBadge />
          </Suspense>
        </NavLink>
        <NavLink href="/dashboard/status">
          <BarChart3 className="hidden size-4 sm:block" />
          Status
        </NavLink>
        <NavLink href="/dashboard/modelos">
          <LayoutTemplate className="hidden size-4 sm:block" />
          Modelos
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
    </div>
  );
}
