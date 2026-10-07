import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, BellRing, LayoutTemplate, Users } from "lucide-react";
import { getProfile } from "@/lib/auth/session";
import { ONBOARDING_PATH, roleHome } from "@/lib/auth/roles";
import { TopBar } from "@/components/shared/top-bar";
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
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Users className="hidden size-4 sm:block" />
          Meus Alunos
          <Suspense fallback={null}>
            <PendingRequestsBadge />
          </Suspense>
        </Link>
        <Link
          href="/dashboard/status"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <BarChart3 className="hidden size-4 sm:block" />
          Status
        </Link>
        <Link
          href="/dashboard/modelos"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <LayoutTemplate className="hidden size-4 sm:block" />
          Modelos
        </Link>
        <Link
          href="/dashboard/alertas"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <BellRing className="hidden size-4 sm:block" />
          Alertas
          <Suspense fallback={null}>
            <AlertsBadge />
          </Suspense>
        </Link>
      </TopBar>
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
