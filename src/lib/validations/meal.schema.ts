import { z } from "zod";

export const mealSchema = z.object({
  name: z.string().min(2, "Dê um nome para a refeição"),
  suggestedTime: z.string().optional(),
});
export type MealInput = z.infer<typeof mealSchema>;

export const mealOptionSchema = z.object({
  label: z.string().min(1, "Dê um rótulo para a opção (ex: Opção 2 líquida)"),
});
export type MealOptionInput = z.infer<typeof mealOptionSchema>;

export const mealItemSchema = z.object({
  foodName: z.string().min(1, "Informe o alimento ou líquido"),
  quantity: z.coerce.number().min(0, "Informe a quantidade"),
  unit: z.string().min(1, "Informe a unidade (g, ml, unidade...)"),
  notes: z.string().optional(),
});
export type MealItemInput = z.infer<typeof mealItemSchema>;
export type MealItemFormInput = z.input<typeof mealItemSchema>;
