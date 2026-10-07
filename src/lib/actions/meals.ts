"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateModule } from "@/lib/actions/revalidate";
import { quotaMessage } from "@/lib/quota";
import {
  mealSchema,
  mealOptionSchema,
  mealItemSchema,
  type MealInput,
  type MealOptionInput,
  type MealItemInput,
} from "@/lib/validations/meal.schema";

export async function createMeal(studentId: string, protocolId: string, input: MealInput) {
  const parsed = mealSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: meal, error } = await supabase
    .from("meals")
    .insert({
      protocol_id: protocolId,
      name: parsed.data.name,
      suggested_time: parsed.data.suggestedTime || null,
    })
    .select("id")
    .single();

  if (error || !meal) return { error: quotaMessage(error) ?? "Não foi possível criar a refeição." };

  // Toda refeição já nasce com 1 opção (sem rótulo) para poder receber
  // itens direto; vira "opções" de verdade só quando o trainer adicionar
  // uma 2ª com createMealOption.
  const { error: optionError } = await supabase
    .from("meal_options")
    .insert({ meal_id: meal.id, label: "" });

  if (optionError) return { error: "Não foi possível criar a refeição." };

  revalidateModule(studentId, "dieta");
  return { success: true };
}

export async function deleteMeal(studentId: string, mealId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meals").delete().eq("id", mealId);
  if (error) return { error: "Não foi possível remover a refeição." };

  revalidateModule(studentId, "dieta");
  return { success: true };
}

export async function createMealOption(studentId: string, mealId: string, input: MealOptionInput) {
  const parsed = mealOptionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("meal_options")
    .select("id", { count: "exact", head: true })
    .eq("meal_id", mealId);

  const { error } = await supabase.from("meal_options").insert({
    meal_id: mealId,
    label: parsed.data.label,
    sort_order: count ?? 0,
  });

  if (error) return { error: "Não foi possível adicionar a opção." };

  revalidateModule(studentId, "dieta");
  return { success: true };
}

export async function deleteMealOption(studentId: string, mealOptionId: string) {
  const supabase = await createClient();

  const { data: option } = await supabase
    .from("meal_options")
    .select("meal_id")
    .eq("id", mealOptionId)
    .single();

  if (!option) return { error: "Opção não encontrada." };

  const { count } = await supabase
    .from("meal_options")
    .select("id", { count: "exact", head: true })
    .eq("meal_id", option.meal_id);

  if ((count ?? 0) <= 1) {
    return { error: "A refeição precisa de pelo menos 1 opção." };
  }

  const { error } = await supabase.from("meal_options").delete().eq("id", mealOptionId);
  if (error) return { error: "Não foi possível remover a opção." };

  revalidateModule(studentId, "dieta");
  return { success: true };
}

export async function createMealItem(
  studentId: string,
  mealOptionId: string,
  input: MealItemInput
) {
  const parsed = mealItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("meal_items").insert({
    meal_option_id: mealOptionId,
    food_name: parsed.data.foodName,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    notes: parsed.data.notes || null,
  });

  if (error) return { error: quotaMessage(error) ?? "Não foi possível adicionar o item." };

  revalidateModule(studentId, "dieta");
  return { success: true };
}

export async function deleteMealItem(studentId: string, mealItemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meal_items").delete().eq("id", mealItemId);
  if (error) return { error: "Não foi possível remover o item." };

  revalidateModule(studentId, "dieta");
  return { success: true };
}
