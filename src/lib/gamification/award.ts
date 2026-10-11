import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayBR } from "@/lib/dates";
import { computeStreaks, sealsToAward } from "@/lib/streaks";

// Concede os selos que a pessoa acabou de alcançar. Roda depois de cada registro de treino,
// cardio ou refeição. As sequências saem do resultado diário (gravado pelos gatilhos do
// banco), lido com a sessão da própria pessoa: o RLS só devolve os dias de um plano que ela
// pode ver, então um `studentId` alheio não rende nada. Só o servidor (service role) grava o
// selo; o cliente não tem permissão de escrita em `achievements`.
// Nunca derruba a ação que o chamou: o selo pode ser concedido no próximo registro.
export async function awardSeals(studentId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const [{ data: rows }, { data: existing }] = await Promise.all([
      supabase
        .from("daily_scores")
        .select("score_date, workout_done, diet_done")
        .eq("student_id", studentId),
      supabase.from("achievements").select("line, milestone").eq("student_id", studentId),
    ]);
    if (!rows?.length) return;

    const missing = sealsToAward(computeStreaks(rows, todayBR()), existing ?? []);
    if (missing.length === 0) return;

    await createAdminClient()
      .from("achievements")
      .upsert(
        missing.map((seal) => ({ student_id: studentId, ...seal })),
        { onConflict: "student_id,line,milestone", ignoreDuplicates: true }
      );
  } catch {
    // Sem selo agora; o próximo registro tenta de novo.
  }
}
