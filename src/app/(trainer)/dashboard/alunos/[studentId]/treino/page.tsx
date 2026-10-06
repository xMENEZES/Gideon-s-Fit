import { createClient } from "@/lib/supabase/server";
import { AddWorkoutDayDialog } from "@/components/shared/add-workout-day-dialog";
import { WorkoutDaysTabs } from "@/components/shared/workout-days-tabs";
import { ProtocolHeader } from "@/components/shared/protocol-header";
import { SaveAsTemplateDialog } from "@/components/shared/template-dialogs";
import { loadProtocolSources } from "@/lib/protocol-sources";

export default async function TreinoPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: protocol } = await supabase
    .from("protocols")
    .select("id, start_date, end_date, notes")
    .eq("student_id", studentId)
    .eq("type", "workout")
    .eq("is_active", true)
    .maybeSingle();

  const sources = await loadProtocolSources(supabase, studentId, "workout");

  const days = protocol
    ? (
        await supabase
          .from("workout_days")
          .select(
            "id, name, exercises(id, name, sets, reps, rest_seconds, recommended_load_kg, video_url, notes, exercise_load_logs(logged_at, weight_kg))"
          )
          .eq("protocol_id", protocol.id)
          .order("sort_order", { ascending: true })
          .order("sort_order", { referencedTable: "exercises", ascending: true })
      ).data
    : null;

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

          {!days?.length ? (
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
