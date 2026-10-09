import { createClient } from "@/lib/supabase/server";
import { getOwnTeamStudent } from "@/lib/data/students";
import { loadActiveDiet } from "@/lib/data/protocols";
import { DietDayTracker } from "@/components/shared/diet-day-tracker";
import { addDays, todayBR } from "@/lib/dates";
import { ProtocolHeader } from "@/components/shared/protocol-header";
import { BackToTodayLink } from "@/components/shared/back-to-today-link";
import { hasDietContent } from "@/lib/today";

export default async function AlunoDietaPlanoPage() {
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

  return (
    <div className="flex flex-col gap-4">
      {protocol && hasDietContent(meals) && (
        <BackToTodayLink href="/aluno/dieta" label="Ver alimentação de hoje" />
      )}
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
      ) : failed ? (
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
          initialLogs={logs}
          editable={false}
        />
      )}
    </div>
  );
}
