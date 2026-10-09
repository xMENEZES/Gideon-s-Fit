import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/dates";
import { getOwnTeamStudent } from "@/lib/data/students";
import { loadActiveWorkout } from "@/lib/data/protocols";
import { hasWorkoutContent } from "@/lib/today";
import { WorkoutToday } from "@/components/shared/workout-today";

// Com o protocolo pronto, a aba mostra o treino de hoje. Enquanto o profissional não tiver
// montado o treino, segue para o plano completo, que explica o que falta.
export default async function AlunoTreinoPage() {
  const student = await getOwnTeamStudent();

  if (!student?.has_workout) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Seu profissional não habilitou o módulo de treino para você.
      </p>
    );
  }

  const supabase = await createClient();
  const { protocol, days, failed } = await loadActiveWorkout(supabase, student.id);

  if (failed) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Não foi possível carregar o treino. Atualize a página para tentar de novo.
      </p>
    );
  }
  if (!protocol || !days || !hasWorkoutContent(days)) redirect("/aluno/treino/plano");

  return (
    <WorkoutToday
      studentId={student.id}
      protocol={protocol}
      days={days}
      today={todayBR()}
      actionHref="/aluno/treino/plano"
      actionLabel="Ver plano completo"
    />
  );
}
