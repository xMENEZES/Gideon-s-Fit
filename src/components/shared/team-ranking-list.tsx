import { getSessionUserId } from "@/lib/auth/session";
import { getTrainerMonthRanking } from "@/lib/data/ranking";
import { todayBR } from "@/lib/dates";
import { monthLabel, monthOf } from "@/lib/status-select";
import { participantsLabel } from "@/lib/ranking";
import { RankingList } from "@/components/shared/ranking-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RULES = "1 ponto por dia de treino completo e 1 ponto por dia de alimentação completa, no mês atual.";

// Classificação do mês na visão do profissional: só quem aceitou participar aparece, como para os
// alunos. Não aparece com o ranking desligado nem sem nenhum participante (o cartão de cima já avisa).
export async function TeamRankingList() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const ranking = await getTrainerMonthRanking(userId);
  if (!ranking.enabled || ranking.participants === 0) return null;

  const month = monthLabel(monthOf(todayBR()));
  const hidden = ranking.total - ranking.participants;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classificação de {month.toLowerCase()}</CardTitle>
        <CardDescription>{participantsLabel(ranking.participants)}. Zera no dia 1 de cada mês.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <RankingList rows={ranking.rows} />
        <p className="text-xs text-muted-foreground">Pontuação: {RULES} Empate divide a posição.</p>
        {hidden > 0 && (
          <p className="text-xs text-muted-foreground">
            {hidden === 1
              ? "1 aluno do time não participa e por isso não aparece na lista."
              : `${hidden} alunos do time não participam e por isso não aparecem na lista.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
