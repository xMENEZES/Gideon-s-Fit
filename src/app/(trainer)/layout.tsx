import Link from "next/link";
import { redirect } from "next/navigation";
import { BellRing, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUserId } from "@/lib/auth/session";
import { ONBOARDING_PATH, roleHome } from "@/lib/auth/roles";
import { TopBar } from "@/components/shared/top-bar";
import { Badge } from "@/components/ui/badge";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  if (!profile.onboarded) redirect(ONBOARDING_PATH);
  if (profile.role !== "trainer") redirect(roleHome(profile.role));

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + 7);
  const cutoff = cutoffDate.toISOString().slice(0, 10);

  const supabase = await createClient();
  const userId = await getSessionUserId();
  const [{ count: alertsCount }, { count: pendingRequests }] = await Promise.all([
    supabase
      .from("protocols")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .lte("end_date", cutoff),
    supabase
      .from("team_join_requests")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", userId!)
      .eq("status", "pending"),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar fullName={profile.full_name} homeHref="/dashboard">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Users className="size-4" />
          Meus Alunos
          {!!pendingRequests && <Badge variant="destructive">{pendingRequests}</Badge>}
        </Link>
        <Link
          href="/dashboard/alertas"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <BellRing className="size-4" />
          Alertas
          {!!alertsCount && <Badge variant="destructive">{alertsCount}</Badge>}
        </Link>
      </TopBar>
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
