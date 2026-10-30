import { todayBR } from "@/lib/dates";
import { monthLabel, monthOf } from "@/lib/status-select";
import { participantsLabel, pointsLabel } from "@/lib/ranking";
import { getMonthRanking, getRankingState } from "@/lib/data/ranking";
import { RankingParticipationButton } from "@/components/shared/ranking-participation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const RULES = "1 ponto por dia de treino completo e 1 ponto por dia de alimentação completa, no mês atual.";

export default async function AlunoRankingPage() {
  const state = await getRankingState();

  if (!state || !state.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking do time</CardTitle>
          <CardDescription>O ranking não está ligado para o seu time.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Quando o seu profissional ligar o ranking, esta aba mostra a posição de cada aluno que participa.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!state.optedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking do time</CardTitle>
          <CardDescription>O seu profissional ligou um ranking mensal entre os alunos do time.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Pontuação: {RULES}</p>
          <div className="flex flex-col gap-1 rounded-lg bg-muted px-3 py-2 text-sm">
            <p className="font-medium">O que fica visível se você participar</p>
            <p className="text-muted-foreground">
              Os outros alunos que também participam veem o seu apelido (ou primeiro nome) e os seus pontos do mês.
              Ninguém vê treino, alimentação, sequência ou selos. Você pode sair a qualquer momento, e quem não
              participa não vê o ranking.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{participantsLabel(state.participants)}.</p>
          <RankingParticipationButton join />
        </CardContent>
      </Card>
    );
  }

  const rows = await getMonthRanking();
  const month = monthLabel(monthOf(todayBR()));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de {month.toLowerCase()}</CardTitle>
        <CardDescription>{participantsLabel(state.participants)}. Zera no dia 1 de cada mês.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há pontos neste mês.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {rows.map((row) => (
              <li
                key={`${row.position}-${row.display_name}-${row.is_me}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2",
                  row.is_me ? "border-primary-ink bg-primary/10" : "border-border"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    row.position === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                  aria-label={`${row.position}º lugar`}
                >
                  {row.position}º
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {row.display_name}
                  {row.is_me && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(você)</span>}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {pointsLabel(row.total_points)}
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="text-xs text-muted-foreground">Pontuação: {RULES} Empate divide a posição.</p>
        <RankingParticipationButton join={false} />
      </CardContent>
    </Card>
  );
}
