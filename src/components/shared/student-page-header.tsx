import { notFound } from "next/navigation";
import { getTrainerStudent } from "@/lib/data/students";
import { SectionTabs } from "@/components/shared/section-tabs";
import { StudentHeaderActions } from "@/components/shared/student-header-actions";
import { Skeleton } from "@/components/ui/skeleton";

// Cabeçalho da ficha do aluno (nome, ações e abas). Fica dentro de um <Suspense> no
// layout para que o conteúdo da página comece a carregar ao mesmo tempo, em vez de
// esperar esta consulta terminar.
export async function StudentPageHeader({ studentId }: { studentId: string }) {
  const student = await getTrainerStudent(studentId);
  if (!student) notFound();

  const tabs = [
    student.has_workout && { href: "/treino", label: "Prot. Treino" },
    student.has_diet && { href: "/dieta", label: "Prot. Alimentar" },
    { href: "/status", label: "Status" },
  ].filter((tab): tab is { href: string; label: string } => Boolean(tab));

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{student.profiles?.full_name}</h1>
          {student.nickname && (
            <p className="text-sm text-muted-foreground">Apelido: {student.nickname}</p>
          )}
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>
        <StudentHeaderActions
          studentId={studentId}
          fullName={student.profiles?.full_name ?? student.email}
          nickname={student.nickname}
          hasWorkout={student.has_workout}
          hasDiet={student.has_diet}
        />
      </div>
      {tabs.length > 0 && (
        <SectionTabs basePath={`/dashboard/alunos/${studentId}`} items={tabs} />
      )}
    </>
  );
}

export function StudentPageHeaderSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-9 w-full sm:w-80" />
    </>
  );
}
