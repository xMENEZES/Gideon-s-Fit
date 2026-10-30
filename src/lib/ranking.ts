// Ranking mensal do time: posições, empate e textos. O banco devolve só nome de exibição e pontos
// (função team_leaderboard); a posição é calculada aqui para a regra ficar testada.

export type RankingRow = { display_name: string; total_points: number; is_me: boolean };
export type RankedRow = RankingRow & { position: number };

// Primeiro dia do mês de uma data "YYYY-MM-DD" (o banco usa só o mês, mas mandamos o dia 1).
export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
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
