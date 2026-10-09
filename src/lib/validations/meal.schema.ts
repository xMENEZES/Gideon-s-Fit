import { z } from "zod";

export const mealSchema = z.object({
  name: z.string().min(2, "Dê um nome para a refeição").max(120, "No máximo 120 caracteres"),
  suggestedTime: z.string().optional(),
});
export type MealInput = z.infer<typeof mealSchema>;

export const mealOptionSchema = z.object({
  label: z
    .string()
    .min(1, "Dê um rótulo para a opção (ex: Opção 2 líquida)")
    .max(80, "No máximo 80 caracteres"),
});
export type MealOptionInput = z.infer<typeof mealOptionSchema>;

export const mealItemSchema = z.object({
  foodName: z.string().min(1, "Informe o alimento ou líquido").max(120, "No máximo 120 caracteres"),
  quantity: z.coerce.number().min(0, "Informe a quantidade"),
  unit: z.string().trim().min(1, "Escolha a unidade").max(30, "No máximo 30 caracteres"),
  notes: z.string().max(500, "No máximo 500 caracteres").optional(),
});
export type MealItemInput = z.infer<typeof mealItemSchema>;
export type MealItemFormInput = z.input<typeof mealItemSchema>;
