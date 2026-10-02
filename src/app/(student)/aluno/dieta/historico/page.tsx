import { createClient } from "@/lib/supabase/server";
import { MealCard } from "@/components/shared/meal-card";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export default async function AlunoDietaHistoricoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user!.id)
    .single();

  if (!student) {
    return (
      <p className="py-12 text-center text-muted-foreground">Nenhum histórico disponível.</p>
    );
  }

  const { data: protocols } = await supabase
    .from("protocols")
    .select("id, start_date, end_date")
    .eq("student_id", student.id)
    .eq("type", "diet")
    .eq("is_active", false)
    .order("start_date", { ascending: false });

  if (!protocols?.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Nenhum protocolo de dieta anterior ainda.
      </p>
    );
  }

  const protocolsWithMeals = await Promise.all(
    protocols.map(async (protocol) => {
      const { data: meals } = await supabase
        .from("meals")
        .select(
          "id, name, suggested_time, meal_options(id, label, sort_order, meal_items(id, food_name, quantity, unit, notes, sort_order))"
        )
        .eq("protocol_id", protocol.id)
        .order("sort_order", { ascending: true })
        .order("sort_order", { referencedTable: "meal_options", ascending: true });
      return { ...protocol, meals: meals ?? [] };
    })
  );

  return (
    <div className="flex flex-col gap-8">
      {protocolsWithMeals.map((protocol) => (
        <section key={protocol.id} className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            {formatDate(protocol.start_date)} até {formatDate(protocol.end_date)}
          </h2>
          {protocol.meals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem refeições registradas.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {protocol.meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} studentId={student.id} editable={false} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
