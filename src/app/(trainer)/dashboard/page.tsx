import Link from "next/link";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { TeamCodeCard } from "@/components/shared/team-code-card";
import { JoinRequestsList } from "@/components/shared/join-requests-list";

export default async function DashboardPage() {
  const supabase = await createClient();
  const userId = await getSessionUserId();

  const [{ data: students }, { data: team }, { data: requests }] = await Promise.all([
    supabase
      .from("students")
      .select("id, nickname, email, profiles!students_profile_id_fkey(full_name)")
      .order("full_name", { referencedTable: "profiles" }),
    supabase.from("team_codes").select("code").eq("trainer_id", userId!).maybeSingle(),
    supabase
      .from("team_join_requests")
      .select("id, profiles!team_join_requests_user_id_fkey(full_name, email)")
      .eq("trainer_id", userId!)
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const pendingRequests = (requests ?? []).map((request) => ({
    id: request.id,
    name: request.profiles?.full_name ?? "",
    email: request.profiles?.email ?? "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Meus alunos</h1>

      <TeamCodeCard code={team?.code ?? null} />
      <JoinRequestsList requests={pendingRequests} />

      {!students?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <User className="size-8" />
            <p>Você ainda não tem alunos no seu time.</p>
            <p className="text-sm">Envie o código do time para quem quiser entrar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <Link key={s.id} href={`/dashboard/alunos/${s.id}`}>
              <Card className="h-full transition-colors hover:border-primary/60">
                <CardContent className="flex items-center gap-3 py-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <User className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.nickname ?? s.profiles?.full_name}</p>
                    <p className="truncate text-sm text-muted-foreground">{s.email}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
