import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/dates";
import {
  buildMealStatus,
  buildWorkoutStatus,
  loadMealRows,
  loadWorkoutEntries,
  type ProtocolPeriod,
} from "@/lib/status";
import { Card, CardContent } from "@/components/ui/card";

type ProtocolRow = ProtocolPeriod & { student_id: string };

export default async function StatusOverviewPage() {
  const supabase = await createClient();
  const today = todayBR();

  // Alunos e protocolos ativos buscados ao mesmo tempo. O RLS já limita os protocolos aos
  // alunos deste profissional (modelos são inativos e ficam de fora).
  const [{ data: students }, { data: protocolRows }] = await Promise.all([
    supabase
      .from("students")
      .select("id, nickname, email, profiles!students_profile_id_fkey(full_name)")
      .order("full_name", { referencedTable: "profiles" }),
    supabase
      .from("protocols")
      .select("id, student_id, type, start_date, end_date, is_active")
      .eq("is_active", true)
      .not("student_id", "is", null),
  ]);

  const protocols = (protocolRows ?? []) as ProtocolRow[];
  const workoutProtocols = protocols.filter((protocol) => protocol.type === "workout");
  const dietProtocols = protocols.filter((protocol) => protocol.type === "diet");

  const [workoutEntries, mealRows] = await Promise.all([
    loadWorkoutEntries(supabase, workoutProtocols.map((protocol) => protocol.id)),
    loadMealRows(supabase, dietProtocols.map((protocol) => protocol.id)),
  ]);

  const rows = (students ?? []).map((student) => {
    const workout = workoutProtocols.find((protocol) => protocol.student_id === student.id);
    const diet = dietProtocols.find((protocol) => protocol.student_id === student.id);
    return {
      student,
      workout: workout
        ? buildWorkoutStatus(workout, today, workoutEntries.get(workout.id) ?? [])
        : null,
      diet: diet ? buildMealStatus(diet, today, mealRows.get(diet.id) ?? []) : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Status do time</h1>
        <p className="text-sm text-muted-foreground">
          Resumo do protocolo atual de cada aluno. Abra um aluno para escolher o período e ver o
          detalhe de cada dia.
        </p>
      </div>

      {!rows.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <User className="size-8" />
            <p>Você ainda não tem alunos no seu time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(({ student, workout, diet }) => (
            <Link key={student.id} href={`/dashboard/alunos/${student.id}/status`}>
              <Card className="transition-colors hover:border-primary/60">
                <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
                  <div className="flex min-w-48 flex-1 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <User className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {student.nickname ?? student.profiles?.full_name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex min-w-36 flex-col">
                    <span className="text-xs text-muted-foreground">Treino</span>
                    <span className="text-sm font-medium">
                      {workout
                        ? `${workout.trainedCount} de ${workout.range.length} dias treinados`
                        : "Sem protocolo ativo"}
                    </span>
                  </div>
                  <div className="flex min-w-36 flex-col">
                    <span className="text-xs text-muted-foreground">Alimentar</span>
                    <span className="text-sm font-medium">
                      {diet
                        ? diet.mealsPerDay === 0
                          ? "Sem refeições cadastradas"
                          : diet.closedDays === 0
                            ? "Em andamento (1º dia)"
                            : `${diet.percent}% (${diet.doneTotal} de ${diet.expectedTotal} refeições)`
                        : "Sem protocolo ativo"}
                    </span>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
