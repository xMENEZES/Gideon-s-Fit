import { createClient } from "@/lib/supabase/server";
import { AddMealDialog } from "@/components/shared/add-meal-dialog";
import { MealCard } from "@/components/shared/meal-card";
import { ProtocolHeader } from "@/components/shared/protocol-header";
import { SaveAsTemplateDialog } from "@/components/shared/template-dialogs";
import { loadActiveDiet } from "@/lib/data/protocols";
import { loadProtocolSources } from "@/lib/protocol-sources";

export default async function DietaPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  // Protocolo com as refeições e as opções de "novo protocolo" buscados ao mesmo tempo.
  const [{ protocol, meals, failed }, sources] = await Promise.all([
    loadActiveDiet(supabase, studentId),
    loadProtocolSources(supabase, studentId, "diet"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <ProtocolHeader
        studentId={studentId}
        type="diet"
        protocol={protocol}
        historyHref={`/dashboard/alunos/${studentId}/dieta/historico`}
        statusHref={`/dashboard/alunos/${studentId}/status`}
        editable
        templates={sources.templates}
        sourceStudents={sources.sourceStudents}
        extraActions={protocol ? <SaveAsTemplateDialog protocolId={protocol.id} /> : null}
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

          {failed ? (
            <p className="py-12 text-center text-muted-foreground">
              Não foi possível carregar as refeições. Atualize a página para tentar de novo.
            </p>
          ) : !meals?.length ? (
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
