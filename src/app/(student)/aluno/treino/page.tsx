import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";
import { WorkoutDaysTabs } from "@/components/shared/workout-days-tabs";
import { ProtocolHeader } from "@/components/shared/protocol-header";

export default async function AlunoTreinoPage() {
  const supabase = await createClient();
  const userId = await getSessionUserId();

  const { data: student } = await supabase
    .from("students")
    .select("id, has_workout")
    .eq("profile_id", userId!)
    .neq("trainer_id", userId!)
    .single();

  if (!student?.has_workout) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Seu profissional não habilitou o módulo de treino para você.
      </p>
    );
  }

  const { data: protocol } = await supabase
    .from("protocols")
    .select("id, start_date, end_date, notes")
    .eq("student_id", student.id)
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
