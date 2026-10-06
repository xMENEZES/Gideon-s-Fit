"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";
import { addDays, isIsoDate, todayBR } from "@/lib/dates";

// A pessoa pode marcar hoje e até 3 dias antes, nunca datas futuras.
const MAX_DAYS_BACK = 3;
const MAX_NOTE_LENGTH = 500;

async function validateTarget(mealId: string, date: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Não autenticado." };

  if (!isIsoDate(date)) return { error: "Data inválida." };
  const today = todayBR();
  if (date > today || date < addDays(today, -MAX_DAYS_BACK)) {
    return { error: "Só é possível registrar hoje e nos 3 dias anteriores." };
  }

  // RLS: a pessoa só enxerga refeições do próprio protocolo.
  const supabase = await createClient();
  const { data: meal } = await supabase
    .from("meals")
    .select("id, protocols(start_date, is_active)")
    .eq("id", mealId)
    .single();
  const protocol = Array.isArray(meal?.protocols) ? meal.protocols[0] : meal?.protocols;
  if (!meal || !protocol) return { error: "Refeição não encontrada." };
  if (!protocol.is_active) return { error: "Este protocolo não está mais ativo." };
  if (date < protocol.start_date) {
    return { error: "Essa data é anterior ao início do protocolo." };
  }

  return { userId, supabase };
}

export async function saveMealLog(mealId: string, date: string, done: boolean, note?: string) {
  const target = await validateTarget(mealId, date);
  if ("error" in target) return { error: target.error };

  const cleanNote = done ? null : note?.trim().slice(0, MAX_NOTE_LENGTH) || null;

  const { error } = await target.supabase.from("meal_logs").upsert(
    {
      meal_id: mealId,
      log_date: date,
      done,
      note: cleanNote,
      created_by: target.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "meal_id,log_date" }
  );
  if (error) return { error: "Não foi possível salvar o registro." };

  return { success: true, note: cleanNote };
}

export async function clearMealLog(mealId: string, date: string) {
  const target = await validateTarget(mealId, date);
  if ("error" in target) return { error: target.error };

  const { error } = await target.supabase
    .from("meal_logs")
    .delete()
    .eq("meal_id", mealId)
    .eq("log_date", date);
  if (error) return { error: "Não foi possível desfazer o registro." };

  return { success: true };
}
