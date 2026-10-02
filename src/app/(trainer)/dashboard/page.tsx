import Link from "next/link";
import { Plus, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, nickname, email, profiles!students_profile_id_fkey(full_name)")
    .order("full_name", { referencedTable: "profiles" });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Meus alunos</h1>
        <Button nativeButton={false} render={<Link href="/dashboard/alunos/novo" />}>
          <Plus className="size-4" />
          Novo aluno
        </Button>
      </div>

      {!students?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <User className="size-8" />
            <p>Você ainda não tem alunos cadastrados.</p>
            <Button
              variant="secondary"
              className="mt-2"
              nativeButton={false}
              render={<Link href="/dashboard/alunos/novo" />}
            >
              Cadastrar o primeiro aluno
            </Button>
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
