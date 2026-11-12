import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/dates";
import { monthStart, nextMonthStart, rankRows, trainerRankingRows, type RankedRow } from "@/lib/ranking";

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

export type TrainerRanking = {
  enabled: boolean;
  rows: RankedRow[];
  // alunos do time que participam e total de alunos do time
  participants: number;
  total: number;
};

// Ranking do mês atual para o profissional: só quem aceitou participar, com os pontos do mês. Lê pelos
// acessos que o profissional já tem aos próprios alunos (alunos, nomes e resultado diário), sem função
// própria no banco. Desligado, devolve vazio.
export async function getTrainerMonthRanking(trainerId: string): Promise<TrainerRanking> {
  const supabase = await createClient();
  const [settings, students] = await Promise.all([
    supabase.from("trainer_settings").select("ranking_enabled").eq("trainer_id", trainerId).maybeSingle(),
    supabase
      .from("students")
      .select("id, nickname, ranking_opt_in, profiles!students_profile_id_fkey(full_name)")
      .eq("trainer_id", trainerId)
      .neq("profile_id", trainerId),
  ]);
  const enabled = settings.data?.ranking_enabled ?? false;
  const team = students.data ?? [];
  const joined = team.filter((student) => student.ranking_opt_in);
  if (!enabled || joined.length === 0) return { enabled, rows: [], participants: joined.length, total: team.length };

  const today = todayBR();
  const { data: scores } = await supabase
    .from("daily_scores")
    .select("student_id, workout_done, diet_done")
    .in("student_id", joined.map((student) => student.id))
    .gte("score_date", monthStart(today))
    .lt("score_date", nextMonthStart(today));

  const rows = rankRows(
    trainerRankingRows(
      joined.map((student) => ({
        id: student.id,
        nickname: student.nickname,
        full_name: student.profiles?.full_name ?? null,
      })),
      scores ?? []
    )
  );
  return { enabled, rows, participants: joined.length, total: team.length };
}
