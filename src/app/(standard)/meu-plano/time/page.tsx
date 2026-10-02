import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUserId } from "@/lib/auth/session";
import { JoinTeamForm, type PendingJoin } from "@/components/shared/join-team-form";

export default async function EntrarNoTimePage() {
  const userId = await getSessionUserId();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("team_join_requests")
    .select("id, trainer_id")
    .eq("user_id", userId!)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  // O usuário não pode ler o profile do profissional (RLS), então o nome vem
  // do servidor e só para as solicitações dele.
  let pending: PendingJoin[] = [];
  if (requests?.length) {
    const admin = createAdminClient();
    const { data: trainers } = await admin
      .from("profiles")
      .select("id, full_name")
      .in(
        "id",
        requests.map((request) => request.trainer_id)
      );
    const names = new Map((trainers ?? []).map((trainer) => [trainer.id, trainer.full_name]));
    pending = requests.map((request) => ({
      id: request.id,
      trainerName: names.get(request.trainer_id) ?? "profissional",
    }));
  }

  return <JoinTeamForm pending={pending} />;
}
