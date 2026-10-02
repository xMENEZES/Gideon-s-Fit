import Link from "next/link";
import { redirect } from "next/navigation";
import { BellRing, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/shared/top-bar";
import { Badge } from "@/components/ui/badge";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role !== "trainer") redirect("/aluno");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + 7);
  const cutoff = cutoffDate.toISOString().slice(0, 10);

  const { count: alertsCount } = await supabase
    .from("protocols")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .lte("end_date", cutoff);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar fullName={profile.full_name} homeHref="/dashboard">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Users className="size-4" />
          Meus Alunos
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
