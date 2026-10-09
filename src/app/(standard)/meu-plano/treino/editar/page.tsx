import { createClient } from "@/lib/supabase/server";
import { getSoloStudentId } from "@/lib/team/solo";
import { loadActiveWorkout } from "@/lib/data/protocols";
import { AddWorkoutDayDialog } from "@/components/shared/add-workout-day-dialog";
import { WorkoutDaysTabs } from "@/components/shared/workout-days-tabs";
import { ProtocolHeader } from "@/components/shared/protocol-header";
import { BackToTodayLink } from "@/components/shared/back-to-today-link";
import { hasWorkoutContent } from "@/lib/today";

export default async function MeuTreinoEditarPage() {
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

  return (
    <div className="flex flex-col gap-4">
      {protocol && hasWorkoutContent(days) && (
        <BackToTodayLink href="/meu-plano/treino" label="Ver treino de hoje" />
      )}
      <ProtocolHeader
        studentId={studentId}
        type="workout"
        protocol={protocol}
        historyHref="/meu-plano/treino/historico"
        statusHref="/meu-plano/status"
        editable
      />

      {!protocol ? (
        <p className="py-12 text-center text-muted-foreground">
          Nenhum protocolo de treino ativo. Inicie um para começar a montar o seu treino.
        </p>
      ) : (
        <>
          <div className="flex justify-end">
            <AddWorkoutDayDialog studentId={studentId} protocolId={protocol.id} />
          </div>

          {failed ? (
            <p className="py-12 text-center text-muted-foreground">
              Não foi possível carregar o treino. Atualize a página para tentar de novo.
            </p>
          ) : !days?.length ? (
            <p className="py-12 text-center text-muted-foreground">
              Nenhum dia de treino cadastrado ainda.
            </p>
          ) : (
            <WorkoutDaysTabs days={days} studentId={studentId} editable canLog />
          )}
        </>
      )}
    </div>
  );
}
