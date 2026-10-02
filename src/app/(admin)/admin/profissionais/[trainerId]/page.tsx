import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminStudentCard } from "@/components/shared/admin-student-card";

export default async function AdminTrainerStudentsPage({
  params,
}: {
  params: Promise<{ trainerId: string }>;
}) {
  const { trainerId } = await params;
  const admin = createAdminClient();

  const { data: trainer } = await admin
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", trainerId)
    .single();

  if (!trainer || trainer.role !== "trainer") notFound();

  const { data: students } = await admin
    .from("students")
    .select("id, email, profiles!students_profile_id_fkey(full_name)")
    .eq("trainer_id", trainerId)
    .order("full_name", { referencedTable: "profiles" });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Todos os profissionais
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{trainer.full_name}</h1>
        <p className="text-sm text-muted-foreground">{trainer.email}</p>
      </div>

      {!students?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Users className="size-8" />
            <p>Este profissional ainda não tem alunos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <AdminStudentCard key={s.id} student={s} />
          ))}
        </div>
      )}
    </div>
  );
}
