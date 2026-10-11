import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { loadDayProgress, loadIncentiveBodies } from "@/lib/data/incentive";
import { eventFor, fillMessage, firstName, pickMessage } from "@/lib/incentive";
import { IncentiveCard } from "@/components/shared/incentive-card";

// Mensagem de incentivo da tela diária (treino ou alimentação). Aparece quando o módulo do
// dia está concluído; com treino e alimentação ambos concluídos, mostra a de "dia completo".
// `trainerId` nulo = plano próprio (mensagens do sistema).
export async function IncentiveBanner({
  studentId,
  trainerId,
  nickname,
  module,
  today,
}: {
  studentId: string;
  trainerId: string | null;
  nickname?: string | null;
  module: "workout" | "diet";
  today: string;
}) {
  const supabase = await createClient();
  const progress = await loadDayProgress(supabase, studentId, today);
  const event = eventFor(module, progress);
  if (!event) return null;

  const [bodies, profile] = await Promise.all([
    loadIncentiveBodies(supabase, event, trainerId),
    getProfile(),
  ]);
  const picked = pickMessage(bodies, `${studentId}|${today}|${event}`);
  if (!picked) return null;

  const message = fillMessage(picked, { nome: firstName(profile?.full_name, nickname) });
  if (!message) return null;

  return <IncentiveCard message={message} storageKey={`incentive:${studentId}:${today}:${event}`} />;
}
