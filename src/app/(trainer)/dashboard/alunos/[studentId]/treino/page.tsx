import { createClient } from "@/lib/supabase/server";
import { AddWorkoutDayDialog } from "@/components/shared/add-workout-day-dialog";
import { WorkoutDaysTabs } from "@/components/shared/workout-days-tabs";
import { ProtocolHeader } from "@/components/shared/protocol-header";
import { SaveAsTemplateDialog } from "@/components/shared/template-dialogs";
import { loadActiveWorkout } from "@/lib/data/protocols";
import { loadProtocolSources } from "@/lib/protocol-sources";

export default async function TreinoPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  // Protocolo com os dias e as opções de "novo protocolo" buscados ao mesmo tempo.
  const [{ protocol, days, failed }, sources] = await Promise.all([
    loadActiveWorkout(supabase, studentId),
    loadProtocolSources(supabase, studentId, "workout"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <ProtocolHeader
        studentId={studentId}
        type="workout"
        protocol={protocol}
        historyHref={`/dashboard/alunos/${studentId}/treino/historico`}
        statusHref={`/dashboard/alunos/${studentId}/status`}
        editable
        templates={sources.templates}
        sourceStudents={sources.sourceStudents}
        extraActions={protocol ? <SaveAsTemplateDialog protocolId={protocol.id} /> : null}
      />

      {!protocol ? (
        <p className="py-12 text-center text-muted-foreground">
          Nenhum protocolo de treino ativo. Inicie um para começar a montar o treino.
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
            <WorkoutDaysTabs days={days} studentId={studentId} editable />
          )}
        </>
      )}
    </div>
  );
}
