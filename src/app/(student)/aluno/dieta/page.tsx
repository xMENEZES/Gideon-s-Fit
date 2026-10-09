import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDays, todayBR } from "@/lib/dates";
import { getOwnTeamStudent } from "@/lib/data/students";
import { loadActiveDiet } from "@/lib/data/protocols";
import { hasDietContent } from "@/lib/today";
import { DietToday } from "@/components/shared/diet-today";

// Com o protocolo pronto, a aba mostra a alimentação de hoje. Enquanto o profissional não
// tiver montado o protocolo, segue para o plano completo, que explica o que falta.
export default async function AlunoDietaPage() {
  const student = await getOwnTeamStudent();

  if (!student?.has_diet) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Seu profissional não habilitou o protocolo alimentar para você.
      </p>
    );
  }

  // Protocolo, refeições, opções, alimentos e os registros dos últimos dias, numa só consulta.
  const supabase = await createClient();
  const today = todayBR();
  const { protocol, meals, logs, failed } = await loadActiveDiet(supabase, student.id, {
    from: addDays(today, -3),
    to: today,
  });

  if (failed) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Não foi possível carregar as refeições. Atualize a página para tentar de novo.
      </p>
    );
  }
  if (!protocol || !meals || !hasDietContent(meals)) redirect("/aluno/dieta/plano");

  return (
    <DietToday
      studentId={student.id}
      protocol={protocol}
      meals={meals}
      logs={logs}
      today={today}
      actionHref="/aluno/dieta/plano"
      actionLabel="Ver plano completo"
    />
  );
}
