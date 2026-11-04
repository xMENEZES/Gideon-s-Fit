import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";

// As bolinhas do menu do profissional são carregadas em segundo plano (dentro de um
// <Suspense>): a página não espera por essas contagens para aparecer, e elas surgem
// assim que ficam prontas. O menu aparece em dois lugares (topo e barra de baixo do celular),
// então cada contagem é feita uma vez só por visita (cache por requisição).

const getPendingRequestsCount = cache(async () => {
  const userId = await getSessionUserId();
  if (!userId) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("team_join_requests")
    .select("id", { count: "exact", head: true })
    .eq("trainer_id", userId)
    .eq("status", "pending");
  return count ?? 0;
});

const getAlertsCount = cache(async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + 7);
  const cutoff = cutoffDate.toISOString().slice(0, 10);

  const supabase = await createClient();
  const { count } = await supabase
    .from("protocols")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .lte("end_date", cutoff);
  return count ?? 0;
});

export async function PendingRequestsBadge() {
  const count = await getPendingRequestsCount();
  return count ? <Badge variant="destructive">{count}</Badge> : null;
}

export async function AlertsBadge() {
  const count = await getAlertsCount();
  return count ? <Badge variant="destructive">{count}</Badge> : null;
}
