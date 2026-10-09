import { createClient } from "@/lib/supabase/server";
import { getSoloStudentId } from "@/lib/team/solo";
import { loadActiveDiet } from "@/lib/data/protocols";
import { AddMealDialog } from "@/components/shared/add-meal-dialog";
import { DietDayTracker } from "@/components/shared/diet-day-tracker";
import { addDays, todayBR } from "@/lib/dates";
import { ProtocolHeader } from "@/components/shared/protocol-header";
import { BackToTodayLink } from "@/components/shared/back-to-today-link";
import { hasDietContent } from "@/lib/today";

export default async function MinhaDietaEditarPage() {
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

  return (
    <div className="flex flex-col gap-4">
      {protocol && hasDietContent(meals) && (
        <BackToTodayLink href="/meu-plano/dieta" label="Ver alimentação de hoje" />
      )}
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

          {failed ? (
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
              initialLogs={logs}
              editable
            />
          )}
        </>
      )}
    </div>
  );
}
