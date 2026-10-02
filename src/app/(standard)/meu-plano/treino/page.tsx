import { createClient } from "@/lib/supabase/server";
import { getSoloStudentId } from "@/lib/team/solo";
import { AddWorkoutDayDialog } from "@/components/shared/add-workout-day-dialog";
import { WorkoutDaysTabs } from "@/components/shared/workout-days-tabs";
import { ProtocolHeader } from "@/components/shared/protocol-header";

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
  const { data: protocol } = await supabase
    .from("protocols")
    .select("id, start_date, end_date, notes")
    .eq("student_id", studentId)
    .eq("type", "workout")
    .eq("is_active", true)
    .maybeSingle();

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
        historyHref="/meu-plano/treino/historico"
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

          {!days?.length ? (
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
