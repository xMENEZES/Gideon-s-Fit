import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ageOn, MIN_AGE } from "@/lib/body-data";
import { todayBR } from "@/lib/dates";
import { getMyBodyData } from "@/lib/data/body-data";
import { loadActiveWorkout } from "@/lib/data/protocols";
import { getSoloStudentId } from "@/lib/team/solo";
import { hasWorkoutContent } from "@/lib/today";
import { BodyDataForm } from "@/components/shared/body-data-form";
import { GeneratorWizard } from "@/components/shared/generator-wizard";

// "Gerar meu treino": só para o Usuário Padrão (a área /meu-plano já é só dele). Precisa dos três dados
// de Meus Dados (nascimento, altura e peso) e de maioridade; se faltar algo, mostra o formulário.
export default async function GerarTreinoPage() {
  const studentId = await getSoloStudentId();
  const body = await getMyBodyData();

  const header = (
    <>
      <Link
        href="/meu-plano/treino/editar"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gerar meu treino</h1>
        <p className="text-sm text-muted-foreground">
          Responda a algumas perguntas e o sistema monta uma sugestão de treino para você.
        </p>
      </div>
    </>
  );

  if (!studentId) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {header}
        <p className="py-12 text-center text-muted-foreground">
          Não foi possível carregar o seu plano. Tente novamente.
        </p>
      </div>
    );
  }

  // Falta nascimento, altura ou peso: o formulário de Meus Dados, com os três obrigatórios.
  if (!body || body.height_cm == null || body.weight_kg == null) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {header}
        <BodyDataForm
          key={body?.updated_at ?? "novo"}
          requireMeasures
          audience="standard"
          initial={
            body
              ? {
                  birthDate: body.birth_date,
                  heightCm: body.height_cm,
                  weightKg: body.weight_kg,
                  consentedAt: body.consented_at,
                }
              : null
          }
        />
      </div>
    );
  }

  const age = ageOn(body.birth_date, todayBR());
  if (age === null || age < MIN_AGE) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {header}
        <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          O gerador de treino é só para maiores de {MIN_AGE} anos.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { protocol, days } = await loadActiveWorkout(supabase, studentId);
  const hasActiveWorkout = !!protocol && !!days && hasWorkoutContent(days);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {header}
      <GeneratorWizard
        summary={{ age, heightCm: body.height_cm, weightKg: String(body.weight_kg).replace(".", ",") }}
        hasActiveWorkout={hasActiveWorkout}
      />
    </div>
  );
}
