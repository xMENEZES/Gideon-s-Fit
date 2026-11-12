// Ranking mensal do time: posições, empate e textos. O banco devolve só nome de exibição e pontos
// (função team_leaderboard); a posição é calculada aqui para a regra ficar testada.

export type RankingRow = { display_name: string; total_points: number; is_me: boolean };
export type RankedRow = RankingRow & { position: number };

// Primeiro dia do mês de uma data "YYYY-MM-DD" (o banco usa só o mês, mas mandamos o dia 1).
export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

// Primeiro dia do mês seguinte ("YYYY-MM-DD" -> "YYYY-MM-01"); o ranking do mês vai de monthStart
// (inclusive) até este dia (exclusive), como na função team_leaderboard do banco.
export function nextMonthStart(date: string): string {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

// Nome mostrado no ranking: o apelido do aluno ou, sem apelido, o primeiro nome (o mesmo critério da
// função team_leaderboard); "Aluno" quando não há nenhum dos dois.
export function rankingDisplayName(nickname: string | null | undefined, fullName: string | null | undefined): string {
  const nick = nickname?.trim();
  if (nick) return nick;
  const first = fullName?.trim().split(/\s+/)[0];
  return first || "Aluno";
}

type TrainerRankStudent = { id: string; nickname: string | null; full_name: string | null };
type TrainerRankScore = { student_id: string; workout_done: boolean; diet_done: boolean };

// Ranking do mês na visão do profissional: um ponto por dia de treino completo e um por dia de
// alimentação completa, só de quem participa (o profissional recebe a lista já filtrada).
export function trainerRankingRows(students: TrainerRankStudent[], scores: TrainerRankScore[]): RankingRow[] {
  const points = new Map<string, number>();
  for (const score of scores) {
    points.set(score.student_id, (points.get(score.student_id) ?? 0) + Number(score.workout_done) + Number(score.diet_done));
  }
  return students.map((student) => ({
    display_name: rankingDisplayName(student.nickname, student.full_name),
    total_points: points.get(student.id) ?? 0,
    is_me: false,
  }));
}

// Do mais pontuado para o menos; no empate, por nome (pt-BR), para a ordem ser estável.
// Empate divide a posição e o seguinte pula: 1º, 1º, 3º.
export function rankRows(rows: RankingRow[]): RankedRow[] {
  const sorted = [...rows].sort(
    (a, b) => b.total_points - a.total_points || a.display_name.localeCompare(b.display_name, "pt-BR")
  );
  // A posição é a do primeiro da lista com os mesmos pontos.
  return sorted.map((row) => ({
    ...row,
    position: sorted.findIndex((other) => other.total_points === row.total_points) + 1,
  }));
}

export function pointsLabel(points: number): string {
  return `${points} ${points === 1 ? "ponto" : "pontos"}`;
}

export function participantsLabel(count: number): string {
  if (count === 0) return "Nenhum aluno participa ainda";
  return count === 1 ? "1 aluno participa" : `${count} alunos participam`;
}
