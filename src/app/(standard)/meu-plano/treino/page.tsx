import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/dates";
import { getSoloStudentId } from "@/lib/team/solo";
import { loadActiveWorkout } from "@/lib/data/protocols";
import { hasWorkoutContent } from "@/lib/today";
import { WorkoutToday } from "@/components/shared/workout-today";

// Com o protocolo de treino pronto, esta aba mostra o treino de hoje. Enquanto não houver
// protocolo com exercícios, a pessoa segue para a tela de montagem (/editar), que não troca
// sozinha no meio da montagem.
export default async function MeuTreinoPage() {
  const studentId = await getSoloStudentId();
  if (!studentId) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Não foi possível carregar o seu plano. Tente novamente.
      </p>
    );
  }

  const supabase = await createClient();
  const { protocol, days, failed } = await loadActiveWorkout(supabase, studentId);

  if (failed) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Não foi possível carregar o treino. Atualize a página para tentar de novo.
      </p>
    );
  }
  if (!protocol || !days || !hasWorkoutContent(days)) redirect("/meu-plano/treino/editar");

  return (
    <WorkoutToday
      studentId={studentId}
      protocol={protocol}
      days={days}
      today={todayBR()}
      actionHref="/meu-plano/treino/editar"
      actionLabel="Editar plano"
    />
  );
}
