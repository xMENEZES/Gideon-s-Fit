import { createClient } from "@/lib/supabase/server";
import { WorkoutDaysTabs } from "@/components/shared/workout-days-tabs";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export default async function TreinoHistoricoPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: protocols } = await supabase
    .from("protocols")
    .select("id, start_date, end_date")
    .eq("student_id", studentId)
    .eq("type", "workout")
    .eq("is_active", false)
    .order("start_date", { ascending: false });

  if (!protocols?.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Nenhum protocolo de treino anterior ainda.
      </p>
    );
  }

  const protocolsWithDays = await Promise.all(
    protocols.map(async (protocol) => {
      const { data: days } = await supabase
        .from("workout_days")
        .select(
          "id, name, exercises(id, name, sets, reps, rest_seconds, recommended_load_kg, video_url, notes, exercise_load_logs(logged_at, weight_kg))"
        )
        .eq("protocol_id", protocol.id)
        .order("sort_order", { ascending: true })
        .order("sort_order", { referencedTable: "exercises", ascending: true });
      return { ...protocol, days: days ?? [] };
    })
  );

  return (
    <div className="flex flex-col gap-8">
      {protocolsWithDays.map((protocol) => (
        <section key={protocol.id} className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            {formatDate(protocol.start_date)} até {formatDate(protocol.end_date)}
          </h2>
          {protocol.days.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dias de treino registrados.</p>
          ) : (
            <WorkoutDaysTabs days={protocol.days} studentId={studentId} editable={false} />
          )}
        </section>
      ))}
    </div>
  );
}
