import { createClient } from "@/lib/supabase/server";
import { MealCard } from "@/components/shared/meal-card";
import { ProtocolHeader } from "@/components/shared/protocol-header";

export default async function AlunoDietaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: student } = await supabase
    .from("students")
    .select("id, has_diet")
    .eq("profile_id", user!.id)
    .single();

  if (!student?.has_diet) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Seu profissional não habilitou o módulo de dieta para você.
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
        studentId={student.id}
        type="diet"
        protocol={protocol}
        historyHref="/aluno/dieta/historico"
        editable={false}
      />

      {!protocol ? (
        <p className="py-12 text-center text-muted-foreground">
          Seu profissional ainda não cadastrou um protocolo de dieta.
        </p>
      ) : !meals?.length ? (
        <p className="py-12 text-center text-muted-foreground">
          Seu profissional ainda não cadastrou nenhuma refeição.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} studentId={student.id} editable={false} />
          ))}
        </div>
      )}
    </div>
  );
}
