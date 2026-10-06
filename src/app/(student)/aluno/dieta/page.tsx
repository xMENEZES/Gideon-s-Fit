import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";
import { DietDayTracker } from "@/components/shared/diet-day-tracker";
import { addDays, todayBR } from "@/lib/dates";
import { ProtocolHeader } from "@/components/shared/protocol-header";

export default async function AlunoDietaPage() {
  const supabase = await createClient();
  const userId = await getSessionUserId();

  const { data: student } = await supabase
    .from("students")
    .select("id, has_diet")
    .eq("profile_id", userId!)
    .neq("trainer_id", userId!)
    .single();

  if (!student?.has_diet) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Seu profissional não habilitou o protocolo alimentar para você.
      </p>
    );
  }

  const { data: protocol } = await supabase
    .from("protocols")
    .select("id, start_date, end_date, notes")
    .eq("student_id", student.id)
    .eq("type", "diet")
    .eq("is_active", true)
    .maybeSingle();

  const mealsResult = protocol
    ? await supabase
          .from("meals")
          .select(
            "id, name, suggested_time, meal_options(id, label, sort_order, meal_items(id, food_name, quantity, unit, notes, sort_order))"
          )
          .eq("protocol_id", protocol.id)
          .order("sort_order", { ascending: true })
          .order("sort_order", { referencedTable: "meal_options", ascending: true })
    : null;
  const meals = mealsResult?.data ?? null;
  const mealsFailed = !!mealsResult?.error;

  const today = todayBR();
  const { data: logs } =
    protocol && meals?.length
      ? await supabase
          .from("meal_logs")
          .select("meal_id, log_date, done, note")
          .in(
            "meal_id",
            meals.map((meal) => meal.id)
          )
          .gte("log_date", addDays(today, -3))
          .lte("log_date", today)
      : { data: [] };

  return (
    <div className="flex flex-col gap-4">
      <ProtocolHeader
        studentId={student.id}
        type="diet"
        protocol={protocol}
        historyHref="/aluno/dieta/historico"
        statusHref="/aluno/status"
        editable={false}
      />

      {!protocol ? (
        <p className="py-12 text-center text-muted-foreground">
          Seu profissional ainda não cadastrou um protocolo alimentar.
        </p>
      ) : mealsFailed ? (
        <p className="py-12 text-center text-muted-foreground">
          Não foi possível carregar as refeições. Atualize a página para tentar de novo.
        </p>
      ) : !meals?.length ? (
        <p className="py-12 text-center text-muted-foreground">
          Seu profissional ainda não cadastrou nenhuma refeição.
        </p>
      ) : (
        <DietDayTracker
          meals={meals}
          studentId={student.id}
          startDate={protocol.start_date}
          today={today}
          initialLogs={logs ?? []}
          editable={false}
        />
      )}
    </div>
  );
}
