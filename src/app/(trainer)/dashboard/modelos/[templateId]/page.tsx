import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AddMealDialog } from "@/components/shared/add-meal-dialog";
import { AddWorkoutDayDialog } from "@/components/shared/add-workout-day-dialog";
import { ApplyProtocolDialog, type StudentOption } from "@/components/shared/apply-protocol-dialog";
import { EditProtocolNotesDialog } from "@/components/shared/edit-protocol-notes-dialog";
import { MealCard } from "@/components/shared/meal-card";
import { RenameTemplateDialog } from "@/components/shared/template-dialogs";
import { WorkoutDaysTabs } from "@/components/shared/workout-days-tabs";
import { Badge } from "@/components/ui/badge";

// O id do modelo ocupa o lugar do id do aluno nos componentes de edição: eles só o usam
// para atualizar a tela depois de cada alteração (veja revalidateModule).
export default async function ModeloPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("protocols")
    .select("id, type, template_name, notes")
    .eq("id", templateId)
    .not("owner_trainer_id", "is", null)
    .maybeSingle();
  if (!template) notFound();

  const [{ data: students }, content] = await Promise.all([
    supabase
      .from("students")
      .select("id, nickname, profiles!students_profile_id_fkey(full_name)")
      .order("full_name", { referencedTable: "profiles" }),
    template.type === "workout"
      ? supabase
          .from("workout_days")
          .select(
            "id, name, exercises(id, name, sets, reps, rest_seconds, recommended_load_kg, video_url, notes, exercise_load_logs(logged_at, weight_kg))"
          )
          .eq("protocol_id", template.id)
          .order("sort_order", { ascending: true })
          .order("sort_order", { referencedTable: "exercises", ascending: true })
      : supabase
          .from("meals")
          .select(
            "id, name, suggested_time, meal_options(id, label, sort_order, meal_items(id, food_name, quantity, unit, notes, sort_order))"
          )
          .eq("protocol_id", template.id)
          .order("sort_order", { ascending: true })
          .order("sort_order", { referencedTable: "meal_options", ascending: true }),
  ]);

  const studentOptions: StudentOption[] = (students ?? []).map((student) => ({
    id: student.id,
    name: student.nickname ?? student.profiles?.full_name ?? "Aluno",
  }));

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/modelos"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Modelos
      </Link>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight">{template.template_name}</h1>
            <RenameTemplateDialog templateId={template.id} currentName={template.template_name ?? ""} />
            <Badge variant="secondary" className="font-normal">
              {template.type === "workout" ? "Treino" : "Alimentar"}
            </Badge>
          </div>
          <ApplyProtocolDialog
            sourceProtocolId={template.id}
            type={template.type}
            students={studentOptions}
          />
        </div>
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Observações gerais</p>
            <EditProtocolNotesDialog
              studentId={template.id}
              protocolId={template.id}
              type={template.type}
              notes={template.notes ?? null}
            />
          </div>
          {template.notes ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{template.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma observação.</p>
          )}
        </div>
      </div>

      {template.type === "workout" ? (
        <>
          <div className="flex justify-end">
            <AddWorkoutDayDialog studentId={template.id} protocolId={template.id} />
          </div>
          {!content.data?.length ? (
            <p className="py-12 text-center text-muted-foreground">
              Nenhum dia de treino neste modelo ainda.
            </p>
          ) : (
            <WorkoutDaysTabs
              days={content.data as Parameters<typeof WorkoutDaysTabs>[0]["days"]}
              studentId={template.id}
              editable
            />
          )}
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <AddMealDialog studentId={template.id} protocolId={template.id} />
          </div>
          {!content.data?.length ? (
            <p className="py-12 text-center text-muted-foreground">
              Nenhuma refeição neste modelo ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {(content.data as Parameters<typeof MealCard>[0]["meal"][]).map((meal) => (
                <MealCard key={meal.id} meal={meal} studentId={template.id} editable />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
