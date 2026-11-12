"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bodyDataSchema } from "@/lib/validations/body-data.schema";

// Mensagens do banco (gatilho body_data_guard, migração 0037) em português.
function friendlyError(message: string | undefined): string {
  if (message?.includes("body_data_underage")) return "Os dados de saúde são só para maiores de 18 anos.";
  if (message?.includes("body_data_birth_invalid")) return "Informe uma data de nascimento válida.";
  return "Não foi possível salvar os seus dados. Tente novamente.";
}

// Salva (ou atualiza) os dados da PRÓPRIA pessoa. A validação roda de novo aqui, e o banco repete as
// regras (idade, faixas) e só deixa cada pessoa gravar a própria linha (RLS). O aceite (`consent`) é
// exigido na primeira vez; quem decide o instante do aceite é o banco (consented_at).
export async function saveBodyData(input: unknown, consent: boolean) {
  const parsed = bodyDataSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: existing, error: readError } = await supabase
    .from("body_data")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (readError) return { error: friendlyError(readError.message) };
  if (!existing && consent !== true) {
    return { error: "Para salvar, aceite o uso dos seus dados de saúde." };
  }

  // Campo em branco limpa a coluna (altura e peso são opcionais).
  const values = {
    birth_date: parsed.data.birthDate,
    height_cm: parsed.data.heightCm ?? null,
    weight_kg: parsed.data.weightKg ?? null,
  };
  const { error } = existing
    ? await supabase.from("body_data").update(values).eq("profile_id", user.id)
    : await supabase.from("body_data").insert({ profile_id: user.id, ...values });
  if (error) return { error: friendlyError(error.message) };

  revalidatePath("/conta/dados");
  return { success: true };
}

// Apaga os dados da PRÓPRIA pessoa (é também a retirada do consentimento).
export async function deleteBodyData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.from("body_data").delete().eq("profile_id", user.id);
  if (error) return { error: "Não foi possível apagar os seus dados. Tente novamente." };

  revalidatePath("/conta/dados");
  return { success: true };
}
