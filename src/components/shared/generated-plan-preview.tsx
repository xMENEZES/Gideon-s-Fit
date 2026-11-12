import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeneratedPlan } from "@/lib/workout-generator/generate";
import { GROUP_LABEL } from "@/lib/workout-generator/rules";
import { PLAN_WEEKS } from "@/lib/workout-generator/answers";

const LEVEL_LABEL = { iniciante: "Iniciante", intermediario: "Intermediário", avancado: "Avançado" } as const;

// Prévia do treino gerado: dias, exercícios com séries e repetições (ou minutos, no cardio) e os
// avisos. Não tem descanso: quem treina ajusta pelo que sentir.
export function GeneratedPlanPreview({ plan }: { plan: GeneratedPlan }) {
  const strengthDays = plan.days.length;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Seu treino</CardTitle>
          <CardDescription>
            Nível {LEVEL_LABEL[plan.level].toLowerCase()} · {strengthDays} {strengthDays === 1 ? "dia" : "dias"} de
            treino por semana · {PLAN_WEEKS} semanas
          </CardDescription>
        </CardHeader>
      </Card>

      {plan.days.map((day) => (
        <Card key={day.name}>
          <CardHeader>
            <CardTitle>{day.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-border">
              {day.exercises.map((exercise, index) => (
                <li key={`${exercise.name}-${index}`} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="min-w-0 font-medium">{exercise.name}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {exercise.kind === "strength" ? (
                        <>
                          <Badge variant="secondary">{exercise.sets} séries</Badge>
                          <Badge variant="secondary">{exercise.timed ? exercise.reps : `${exercise.reps} reps`}</Badge>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline">Cardio</Badge>
                          <Badge variant="secondary">{exercise.targetMinutes} min</Badge>
                        </>
                      )}
                    </span>
                  </div>
                  {exercise.kind === "strength" ? (
                    <span className="text-xs text-muted-foreground">{GROUP_LABEL[exercise.group]}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{exercise.notes}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Avisos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
            {plan.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
