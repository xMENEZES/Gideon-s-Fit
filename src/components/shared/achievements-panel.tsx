import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/dates";
import { MILESTONES, SEAL_LINES, computeStreaks } from "@/lib/streaks";
import { SEAL_THEME, sealName } from "@/lib/seals";
import type { SealLine } from "@/lib/types/database.types";
import { SealBadge } from "@/components/shared/seal-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function shortDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

// Sequências atuais e só os selos que a pessoa já conquistou (sem os bloqueados, para não
// poluir a tela). Vale para o dono do plano e para o profissional do time (o RLS limita os
// dados a quem pode ver aquele plano).
export async function AchievementsPanel({ studentId }: { studentId: string }) {
  const supabase = await createClient();
  const [{ data: rows }, { data: earned }] = await Promise.all([
    supabase.from("daily_scores").select("score_date, workout_done, diet_done").eq("student_id", studentId),
    supabase.from("achievements").select("line, milestone, earned_on").eq("student_id", studentId),
  ]);

  const streaks = computeStreaks(rows ?? [], todayBR());
  // O selo conquistado fica para sempre (registro no banco); a conta das sequências cobre o
  // que acabou de ser alcançado e ainda não foi gravado.
  const earnedOn = new Map<string, string>();
  for (const line of SEAL_LINES) {
    for (const milestone of MILESTONES) {
      const date = streaks[line].reached[milestone];
      if (date) earnedOn.set(`${line}:${milestone}`, date);
    }
  }
  for (const seal of earned ?? []) earnedOn.set(`${seal.line}:${seal.milestone}`, seal.earned_on);

  const seals = SEAL_LINES.flatMap((line) =>
    MILESTONES.filter((milestone) => earnedOn.has(`${line}:${milestone}`)).map((milestone) => ({
      line,
      milestone,
      date: earnedOn.get(`${line}:${milestone}`)!,
    }))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conquistas</CardTitle>
        <CardDescription>
          {seals.length === 0
            ? "Seu primeiro selo vem com 3 dias seguidos de treino ou de dieta."
            : `${seals.length} ${seals.length === 1 ? "selo conquistado" : "selos conquistados"}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          {SEAL_LINES.map((line: SealLine) => {
            const theme = SEAL_THEME[line];
            return (
              <div key={line} className="flex flex-col gap-0.5 rounded-lg border border-border px-2 py-2">
                <span className="text-xs text-muted-foreground">{theme.title}</span>
                <span className="text-lg font-semibold" style={{ color: theme.color }}>
                  {streaks[line].current} {streaks[line].current === 1 ? "dia" : "dias"}
                </span>
                <span className="text-xs text-muted-foreground">recorde {streaks[line].best}</span>
              </div>
            );
          })}
        </div>

        {seals.length > 0 && (
          <ul className="grid grid-cols-4 gap-x-2 gap-y-3" aria-label="Selos conquistados">
            {seals.map((seal) => (
              <li key={`${seal.line}:${seal.milestone}`} className="flex flex-col items-center gap-1 text-center">
                <SealBadge line={seal.line} milestone={seal.milestone} className="h-16 w-12" />
                <span className="font-serif text-sm leading-none">{seal.milestone} dias</span>
                <span
                  className="text-[9px] font-medium uppercase leading-tight tracking-wide"
                  style={{ color: SEAL_THEME[seal.line].color }}
                >
                  {sealName(seal.line, seal.milestone)}
                </span>
                <span className="text-[10px] text-muted-foreground">{shortDate(seal.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
