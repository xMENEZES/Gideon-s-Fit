import { Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { InviteTrainerDialog } from "@/components/shared/invite-trainer-dialog";
import { TrainerCard } from "@/components/shared/trainer-card";

export default async function AdminPage() {
  const admin = createAdminClient();

  const { data: trainers } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "trainer")
    .order("full_name");

  const trainersWithCounts = await Promise.all(
    (trainers ?? []).map(async (trainer) => {
      const { count } = await admin
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("trainer_id", trainer.id);
      return { ...trainer, studentCount: count ?? 0 };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profissionais</h1>
        <InviteTrainerDialog />
      </div>

      {!trainersWithCounts.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Users className="size-8" />
            <p>Nenhum profissional cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainersWithCounts.map((t) => (
            <TrainerCard key={t.id} trainer={t} />
          ))}
        </div>
      )}
    </div>
  );
}
