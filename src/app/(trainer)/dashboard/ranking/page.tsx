import { TeamRankingCard } from "@/components/shared/team-ranking-card";

export default function RankingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ranking</h1>
        <p className="text-sm text-muted-foreground">
          Ligue ou desligue o ranking mensal do seu time e veja quantos alunos já aceitaram participar.
        </p>
      </div>

      <TeamRankingCard />
    </div>
  );
}
