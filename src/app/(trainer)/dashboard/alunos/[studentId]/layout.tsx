import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SectionTabs } from "@/components/shared/section-tabs";
import { StudentHeaderActions } from "@/components/shared/student-header-actions";

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, nickname, email, has_workout, has_diet, profiles!students_profile_id_fkey(full_name)")
    .eq("id", studentId)
    .single();

  if (!student) notFound();

  const tabs = [
    student.has_workout && { href: "/treino", label: "Prot. Treino" },
    student.has_diet && { href: "/dieta", label: "Prot. Alimentar" },
    { href: "/status", label: "Status" },
  ].filter((tab): tab is { href: string; label: string } => Boolean(tab));

  return (
    <div className="flex flex-col gap-6">
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
      {children}
    </div>
  );
}
