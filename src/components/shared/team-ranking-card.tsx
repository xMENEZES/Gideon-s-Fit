import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";
import { participantsLabel } from "@/lib/ranking";
import { TeamRankingToggle } from "@/components/shared/team-ranking-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Ranking mensal do time, na visão do profissional: liga e desliga, e mostra quantos alunos aceitaram.
export async function TeamRankingCard() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const supabase = await createClient();

  const [settings, participants, students] = await Promise.all([
    supabase.from("trainer_settings").select("ranking_enabled").eq("trainer_id", userId).maybeSingle(),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", userId)
      .neq("profile_id", userId)
      .eq("ranking_opt_in", true),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", userId)
      .neq("profile_id", userId),
  ]);
  const enabled = settings.data?.ranking_enabled ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Ranking do time
          <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Ligado" : "Desligado"}</Badge>
        </CardTitle>
        <CardDescription>
          Ranking mensal entre os seus alunos: 1 ponto por dia de treino completo e 1 por dia de alimentação
          completa. Cada aluno decide se participa, e quem não participa não vê o ranking. Quem participa
          aparece para os outros só com o apelido (ou primeiro nome) e os pontos do mês.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {enabled && (
          <p className="text-sm text-muted-foreground">
            {participantsLabel(participants.count ?? 0)}
            {students.count ? ` (de ${students.count} no time)` : ""}.
          </p>
        )}
        <TeamRankingToggle enabled={enabled} />
      </CardContent>
    </Card>
  );
}
