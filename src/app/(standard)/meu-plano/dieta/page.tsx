import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDays, todayBR } from "@/lib/dates";
import { getSoloStudentId } from "@/lib/team/solo";
import { loadActiveDiet } from "@/lib/data/protocols";
import { hasDietContent } from "@/lib/today";
import { DietToday } from "@/components/shared/diet-today";

// Com o protocolo alimentar pronto, esta aba mostra a alimentação de hoje. Enquanto não
// houver protocolo com refeições, a pessoa segue para a tela de montagem (/editar).
export default async function MinhaDietaPage() {
  const studentId = await getSoloStudentId();
  if (!studentId) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Não foi possível carregar o seu plano. Tente novamente.
      </p>
    );
  }

  // Protocolo, refeições, opções, alimentos e os registros dos últimos dias, numa só consulta.
  const supabase = await createClient();
  const today = todayBR();
  const { protocol, meals, logs, failed } = await loadActiveDiet(supabase, studentId, {
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
  if (!protocol || !meals || !hasDietContent(meals)) redirect("/meu-plano/dieta/editar");

  return (
    <DietToday
      studentId={studentId}
      protocol={protocol}
      meals={meals}
      logs={logs}
      today={today}
      actionHref="/meu-plano/dieta/editar"
      actionLabel="Editar plano"
    />
  );
}
