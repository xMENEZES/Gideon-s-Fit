import { createClient } from "@/lib/supabase/server";
import { getOwnTeamStudent } from "@/lib/data/students";
import { loadActiveWorkout } from "@/lib/data/protocols";
import { WorkoutDaysTabs } from "@/components/shared/workout-days-tabs";
import { ProtocolHeader } from "@/components/shared/protocol-header";

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

  return (
    <div className="flex flex-col gap-4">
      <ProtocolHeader
        studentId={student.id}
        type="workout"
        protocol={protocol}
        historyHref="/aluno/treino/historico"
        statusHref="/aluno/status"
        editable={false}
      />

      {!protocol ? (
        <p className="py-12 text-center text-muted-foreground">
          Seu personal ainda não cadastrou um protocolo de treino.
        </p>
      ) : failed ? (
        <p className="py-12 text-center text-muted-foreground">
          Não foi possível carregar o treino. Atualize a página para tentar de novo.
        </p>
      ) : !days?.length ? (
        <p className="py-12 text-center text-muted-foreground">
          Seu personal ainda não cadastrou nenhum dia de treino.
        </p>
      ) : (
        <WorkoutDaysTabs days={days} studentId={student.id} editable={false} />
      )}
    </div>
  );
}
