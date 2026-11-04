import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/dates";
import {
  buildMealStatus,
  buildWorkoutStatus,
  loadMealRows,
  loadWorkoutEntries,
  type MealStatus,
  type ProtocolPeriod,
  type WorkoutStatus,
} from "@/lib/status";

export type StudentStatusSummary = { workout: WorkoutStatus | null; diet: MealStatus | null };

type ProtocolRow = ProtocolPeriod & { student_id: string };

// Resumo do protocolo ativo de cada aluno do profissional. Memoizado por requisição: os cards da
// lista de alunos chamam esta função, mas as consultas ao banco rodam uma vez só. O RLS já limita os
// protocolos aos alunos deste profissional (modelos são inativos e ficam de fora).
export const getTeamStatusSummaries = cache(async (): Promise<Map<string, StudentStatusSummary>> => {
  const supabase = await createClient();
  const today = todayBR();

  const { data } = await supabase
    .from("protocols")
    .select("id, student_id, type, start_date, end_date, is_active")
    .eq("is_active", true)
    .not("student_id", "is", null);

  const protocols = (data ?? []) as ProtocolRow[];
  const workoutProtocols = protocols.filter((protocol) => protocol.type === "workout");
  const dietProtocols = protocols.filter((protocol) => protocol.type === "diet");

  const [workoutEntries, mealRows] = await Promise.all([
    loadWorkoutEntries(supabase, workoutProtocols.map((protocol) => protocol.id)),
    loadMealRows(supabase, dietProtocols.map((protocol) => protocol.id)),
  ]);

  const summaries = new Map<string, StudentStatusSummary>();
  const ensure = (studentId: string) => {
    const current = summaries.get(studentId) ?? { workout: null, diet: null };
    summaries.set(studentId, current);
    return current;
  };
  for (const protocol of workoutProtocols) {
    ensure(protocol.student_id).workout = buildWorkoutStatus(protocol, today, workoutEntries.get(protocol.id) ?? []);
  }
  for (const protocol of dietProtocols) {
    ensure(protocol.student_id).diet = buildMealStatus(protocol, today, mealRows.get(protocol.id) ?? []);
  }
  return summaries;
});
