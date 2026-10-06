import Link from "next/link";
import { Dumbbell, LayoutTemplate, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { ProtocolType } from "@/lib/types/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplyProtocolDialog, type StudentOption } from "@/components/shared/apply-protocol-dialog";
import { DeleteTemplateButton } from "@/components/shared/delete-template-button";
import { NewTemplateDialog } from "@/components/shared/template-dialogs";

export default async function ModelosPage() {
  const supabase = await createClient();

  const [{ data: templates }, { data: students }] = await Promise.all([
    supabase
      .from("protocols")
      .select("id, type, template_name, workout_days(id, exercises(id)), meals(id)")
      .not("owner_trainer_id", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("students")
      .select("id, nickname, profiles!students_profile_id_fkey(full_name)")
      .order("full_name", { referencedTable: "profiles" }),
  ]);

  const studentOptions: StudentOption[] = (students ?? []).map((student) => ({
    id: student.id,
    name: student.nickname ?? student.profiles?.full_name ?? "Aluno",
  }));

  const workoutTemplates = (templates ?? []).filter((template) => template.type === "workout");
  const dietTemplates = (templates ?? []).filter((template) => template.type === "diet");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modelos</h1>
          <p className="text-sm text-muted-foreground">
            Estruturas padrão de treino e de alimentação para atribuir aos seus alunos. Cada aluno
            recebe uma cópia que você pode ajustar.
          </p>
        </div>
        <NewTemplateDialog />
      </div>

      {!templates?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <LayoutTemplate className="size-8" />
            <p>Você ainda não tem modelos.</p>
            <p className="text-sm">
              Crie um do zero em &quot;Novo modelo&quot; ou salve o protocolo de um aluno como modelo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <TemplateSection
            title="Protocolos de treino"
            icon={<Dumbbell className="size-4" />}
            templates={workoutTemplates}
            students={studentOptions}
          />
          <TemplateSection
            title="Protocolos alimentares"
            icon={<UtensilsCrossed className="size-4" />}
            templates={dietTemplates}
            students={studentOptions}
          />
        </>
      )}
    </div>
  );
}

type TemplateRow = {
  id: string;
  type: ProtocolType;
  template_name: string | null;
  workout_days: { id: string; exercises: { id: string }[] }[];
  meals: { id: string }[];
};

function TemplateSection({
  title,
  icon,
  templates,
  students,
}: {
  title: string;
  icon: React.ReactNode;
  templates: TemplateRow[];
  students: StudentOption[];
}) {
  if (!templates.length) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const exerciseCount = (template.workout_days ?? []).reduce(
            (sum, day) => sum + (day.exercises?.length ?? 0),
            0
          );
          const summary =
            template.type === "workout"
              ? `${template.workout_days?.length ?? 0} dias, ${exerciseCount} exercícios`
              : `${template.meals?.length ?? 0} refeições`;

          return (
            <Card key={template.id}>
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/modelos/${template.id}`}
                    className="min-w-0 hover:underline"
                  >
                    <p className="truncate font-medium">{template.template_name}</p>
                    <Badge variant="secondary" className="mt-1 font-normal">
                      {summary}
                    </Badge>
                  </Link>
                  <DeleteTemplateButton
                    templateId={template.id}
                    name={template.template_name ?? "modelo"}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/modelos/${template.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Editar
                  </Link>
                  <ApplyProtocolDialog
                    sourceProtocolId={template.id}
                    type={template.type}
                    students={students}
                    label="Atribuir"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
