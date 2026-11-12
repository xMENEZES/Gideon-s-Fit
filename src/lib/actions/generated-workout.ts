"use server";

import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/dates";
import { getSoloStudentId } from "@/lib/team/solo";
import { getMyBodyData } from "@/lib/data/body-data";
import { quotaMessage } from "@/lib/quota";
import { revalidateModule } from "@/lib/actions/revalidate";
import { generateWorkoutPlan, GeneratorInputError, type GeneratedPlan } from "@/lib/workout-generator";
import {
  generatorAnswersSchema,
  planDates,
  planNotes,
  toGeneratorInput,
  workoutPayload,
} from "@/lib/workout-generator/answers";

type Built =
  | { error: string; needsData?: true }
  | { plan: GeneratedPlan; studentId: string };

// Monta o treino. Tudo o que pesa vem do servidor: o plano próprio e a data de nascimento, a altura
// e o peso são lidos do banco (nunca do que o celular envia), e quem decide quem pode gerar é o perfil
// (só Usuário Padrão) e a idade (só maiores de 18 anos, conferida pelo próprio gerador).
async function buildPlan(rawAnswers: unknown): Promise<Built> {
  const parsed = generatorAnswersSchema.safeParse(rawAnswers);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Respostas inválidas." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "standard") return { error: "O gerador de treino é só para o Usuário Padrão." };

  const studentId = await getSoloStudentId();
  if (!studentId) return { error: "Não foi possível carregar o seu plano. Tente novamente." };

  const body = await getMyBodyData();
  if (!body || body.height_cm == null || body.weight_kg == null) {
    return { error: "Complete os seus dados (nascimento, altura e peso) para gerar o treino.", needsData: true };
  }

  try {
    const plan = generateWorkoutPlan(
      toGeneratorInput(parsed.data, { birthDate: body.birth_date, heightCm: body.height_cm, weightKg: body.weight_kg }),
      todayBR()
    );
    return { plan, studentId };
  } catch (error) {
    if (error instanceof GeneratorInputError) return { error: error.message };
    throw error;
  }
}

// Prévia do treino: não grava nada.
export async function previewGeneratedWorkout(rawAnswers: unknown) {
  const built = await buildPlan(rawAnswers);
  if ("error" in built) return built;
  return { success: true as const, plan: built.plan };
}

// Grava o treino como o protocolo ativo do plano próprio. O servidor refaz o treino a partir das
// respostas e da semente (o gerador é determinístico), então nunca grava um plano enviado pelo
// celular. A gravação é uma função do banco (0038) que faz tudo numa transação: o treino ativo
// anterior vai para o histórico, e se algo falhar nada muda.
export async function saveGeneratedWorkout(rawAnswers: unknown) {
  const built = await buildPlan(rawAnswers);
  if ("error" in built) return built;

  const { startDate, endDate } = planDates(todayBR());
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_generated_workout", {
    p_student_id: built.studentId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_notes: planNotes(built.plan),
    p_days: workoutPayload(built.plan),
  });
  if (error || !data) {
    if (error?.message?.includes("generated_workout_forbidden")) {
      return { error: "O gerador de treino é só para o Usuário Padrão." };
    }
    return { error: quotaMessage(error) ?? "Não foi possível salvar o treino. Tente novamente." };
  }

  revalidateModule(built.studentId, "treino");
  return { success: true as const };
}
