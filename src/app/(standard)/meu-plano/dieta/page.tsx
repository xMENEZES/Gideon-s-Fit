import { createClient } from "@/lib/supabase/server";
import { getSoloStudentId } from "@/lib/team/solo";
import { AddMealDialog } from "@/components/shared/add-meal-dialog";
import { DietDayTracker } from "@/components/shared/diet-day-tracker";
import { addDays, todayBR } from "@/lib/dates";
import { ProtocolHeader } from "@/components/shared/protocol-header";

export default async function MinhaDietaPage() {
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
        studentId={studentId}
        type="diet"
        protocol={protocol}
        historyHref="/meu-plano/dieta/historico"
        statusHref="/meu-plano/status"
        editable
      />

      {!protocol ? (
        <p className="py-12 text-center text-muted-foreground">
          Nenhum protocolo alimentar ativo. Inicie um para começar a montar o seu.
        </p>
      ) : (
        <>
          <div className="flex justify-end">
            <AddMealDialog studentId={studentId} protocolId={protocol.id} />
          </div>

          {mealsFailed ? (
        <p className="py-12 text-center text-muted-foreground">
          Não foi possível carregar as refeições. Atualize a página para tentar de novo.
        </p>
      ) : !meals?.length ? (
            <p className="py-12 text-center text-muted-foreground">
              Nenhuma refeição cadastrada ainda.
            </p>
          ) : (
            <DietDayTracker
              meals={meals}
              studentId={studentId}
              startDate={protocol.start_date}
              today={today}
              initialLogs={logs ?? []}
              editable
            />
          )}
        </>
      )}
    </div>
  );
}
