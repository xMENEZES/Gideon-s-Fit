import { createClient } from "@/lib/supabase/server";
import { AddMealDialog } from "@/components/shared/add-meal-dialog";
import { MealCard } from "@/components/shared/meal-card";
import { ProtocolHeader } from "@/components/shared/protocol-header";

export default async function DietaPage({
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
    .eq("type", "diet")
    .eq("is_active", true)
    .maybeSingle();

  const meals = protocol
    ? (
        await supabase
          .from("meals")
          .select(
            "id, name, suggested_time, meal_options(id, label, sort_order, meal_items(id, food_name, quantity, unit, notes, sort_order))"
          )
          .eq("protocol_id", protocol.id)
          .order("sort_order", { ascending: true })
          .order("sort_order", { referencedTable: "meal_options", ascending: true })
      ).data
    : null;

  return (
    <div className="flex flex-col gap-4">
      <ProtocolHeader
        studentId={studentId}
        type="diet"
        protocol={protocol}
        historyHref={`/dashboard/alunos/${studentId}/dieta/historico`}
        editable
      />

      {!protocol ? (
        <p className="py-12 text-center text-muted-foreground">
          Nenhum protocolo alimentar ativo. Inicie um para começar a montar o protocolo.
        </p>
      ) : (
        <>
          <div className="flex justify-end">
            <AddMealDialog studentId={studentId} protocolId={protocol.id} />
          </div>

          {!meals?.length ? (
            <p className="py-12 text-center text-muted-foreground">
              Nenhuma refeição cadastrada ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} studentId={studentId} editable />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
