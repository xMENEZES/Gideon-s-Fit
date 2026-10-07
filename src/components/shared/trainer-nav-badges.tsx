import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";

// As bolinhas do menu do profissional são carregadas em segundo plano (dentro de um
// <Suspense>): a página não espera por essas contagens para aparecer, e elas surgem
// assim que ficam prontas.

export async function PendingRequestsBadge() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { count } = await supabase
    .from("team_join_requests")
    .select("id", { count: "exact", head: true })
    .eq("trainer_id", userId)
    .eq("status", "pending");

  return count ? <Badge variant="destructive">{count}</Badge> : null;
}

export async function AlertsBadge() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + 7);
  const cutoff = cutoffDate.toISOString().slice(0, 10);

  const supabase = await createClient();
  const { count } = await supabase
    .from("protocols")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .lte("end_date", cutoff);

  return count ? <Badge variant="destructive">{count}</Badge> : null;
}
