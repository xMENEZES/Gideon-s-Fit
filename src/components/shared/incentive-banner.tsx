import { getProfile } from "@/lib/auth/session";
import {
  getDietProgress,
  getEarnedSeals,
  getIncentiveMessages,
  getWorkoutProgress,
} from "@/lib/data/incentive";
import { bodiesFor, eventFor, fillMessage, firstName, pickMessage, type DayProgress } from "@/lib/incentive";
import type { SealLine } from "@/lib/types/database.types";
import { IncentiveCard } from "@/components/shared/incentive-card";
import { SealCelebration } from "@/components/shared/seal-celebration";

// Mensagem de incentivo da tela diária (treino ou alimentação). Aparece quando o módulo do
// dia está concluído; com treino e alimentação ambos concluídos, mostra a de "dia completo".
// Um selo conquistado hoje aparece antes, em card com a mensagem de sequência (uma vez; depois
// fica só o ícone no topo da tela, em SealStrip).
// `ownComplete`: o módulo da própria tela já concluído, calculado com os dados que a tela
// carregou (só o OUTRO módulo precisa de consulta). `trainerId` nulo = plano próprio.
export async function IncentiveBanner({
  studentId,
  trainerId,
  nickname,
  module,
  today,
  ownComplete,
}: {
  studentId: string;
  trainerId: string | null;
  nickname?: string | null;
  module: "workout" | "diet";
  today: string;
  ownComplete: boolean;
}) {
  // As consultas já foram disparadas pela tela (warmDailyScreen) e aqui só se espera o resultado.
  const [other, earned, messages, profile] = await Promise.all([
    module === "workout" ? getDietProgress(studentId, today) : getWorkoutProgress(studentId, today),
    getEarnedSeals(studentId),
    getIncentiveMessages(),
    getProfile(),
  ]);
  const progress: DayProgress =
    module === "workout" ? { workout: ownComplete, diet: other } : { workout: other, diet: ownComplete };

  const event = eventFor(module, progress);
  // Cada tela mostra os selos da sua linha e os de treino + dieta.
  const lines: SealLine[] = module === "workout" ? ["workout", "both"] : ["diet", "both"];
  const seals = earned.filter((seal) => seal.earned_on === today && lines.includes(seal.line));
  if (!event && seals.length === 0) return null;

  const nome = firstName(profile?.full_name, nickname);
  const picked = event ? pickMessage(bodiesFor(messages, event, trainerId), `${studentId}|${today}|${event}`) : null;
  const message = picked ? fillMessage(picked, { nome }) : "";
  const streakBodies = bodiesFor(messages, "streak", trainerId);

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
