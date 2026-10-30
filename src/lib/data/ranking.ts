import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/dates";
import { monthStart, rankRows, type RankedRow } from "@/lib/ranking";

export type RankingState = { enabled: boolean; optedIn: boolean; participants: number };

// Situação do ranking para o aluno do time que está logado (null = não é aluno de um time, ou a
// migração do ranking ainda não existe). Memoizada: o menu e a página usam a mesma consulta.
export const getRankingState = cache(async (): Promise<RankingState | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_ranking_state");
  const row = error ? null : data?.[0];
  return row ? { enabled: row.enabled, optedIn: row.opted_in, participants: row.participants } : null;
});

// Ranking do mês atual (mês de Brasília). Vazio se o aluno não participa ou o ranking está desligado.
export async function getMonthRanking(): Promise<RankedRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("team_leaderboard", { p_month: monthStart(todayBR()) });
  return rankRows(data ?? []);
}
