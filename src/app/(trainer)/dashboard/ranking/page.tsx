import { Suspense } from "react";
import { TeamRankingCard } from "@/components/shared/team-ranking-card";
import { TeamRankingList } from "@/components/shared/team-ranking-list";

export default function RankingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ranking</h1>
        <p className="text-sm text-muted-foreground">
          Ligue ou desligue o ranking mensal do seu time e acompanhe a classificação dos alunos que participam.
        </p>
      </div>

      <TeamRankingCard />
      <Suspense fallback={null}>
        <TeamRankingList />
      </Suspense>
    </div>
  );
}
