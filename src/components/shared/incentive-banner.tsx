import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { loadDayProgress, loadEarnedSeals, loadIncentiveBodies } from "@/lib/data/incentive";
import { eventFor, fillMessage, firstName, pickMessage } from "@/lib/incentive";
import type { SealLine } from "@/lib/types/database.types";
import { IncentiveCard } from "@/components/shared/incentive-card";
import { SealCelebration } from "@/components/shared/seal-celebration";

// Mensagem de incentivo da tela diária (treino ou alimentação). Aparece quando o módulo do
// dia está concluído; com treino e alimentação ambos concluídos, mostra a de "dia completo".
// Um selo conquistado hoje aparece antes, em card com a mensagem de sequência (uma vez; depois
// fica só o ícone no topo da tela, em SealStrip).
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
  const [progress, earned] = await Promise.all([
    loadDayProgress(supabase, studentId, today),
    loadEarnedSeals(supabase, studentId),
  ]);
  const sealsToday = earned.filter((seal) => seal.earned_on === today);
  const event = eventFor(module, progress);
  // Cada tela mostra os selos da sua linha e os de treino + dieta.
  const lines: SealLine[] = module === "workout" ? ["workout", "both"] : ["diet", "both"];
  const seals = sealsToday.filter((seal) => lines.includes(seal.line));
  if (!event && seals.length === 0) return null;

  const [bodies, streakBodies, profile] = await Promise.all([
    event ? loadIncentiveBodies(supabase, event, trainerId) : Promise.resolve([]),
    seals.length > 0 ? loadIncentiveBodies(supabase, "streak", trainerId) : Promise.resolve([]),
    getProfile(),
  ]);
  const nome = firstName(profile?.full_name, nickname);

  const picked = event ? pickMessage(bodies, `${studentId}|${today}|${event}`) : null;
  const message = picked ? fillMessage(picked, { nome }) : "";

  return (
    <>
      {seals.map((seal) => {
        const streakMessage = pickMessage(streakBodies, `${studentId}|${today}|streak|${seal.line}|${seal.milestone}`);
        return (
          <SealCelebration
            key={`${seal.line}:${seal.milestone}`}
            line={seal.line}
            milestone={seal.milestone}
            message={
              streakMessage
                ? fillMessage(streakMessage, { nome, sequencia: seal.milestone })
                : `${seal.milestone} dias seguidos. Disciplina sempre.`
            }
            storageKey={`seal:${studentId}:${seal.line}:${seal.milestone}`}
          />
        );
      })}
      {message && <IncentiveCard message={message} storageKey={`incentive:${studentId}:${today}:${event}`} />}
    </>
  );
}
