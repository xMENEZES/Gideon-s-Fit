import { describe, expect, it } from "vitest";
import { mealItemSchema } from "@/lib/validations/meal.schema";

const base = { foodName: "Frango", quantity: "200", unit: "g" };

describe("mealItemSchema: grupo de alternativas", () => {
  it("o grupo é opcional", () => {
    const result = mealItemSchema.safeParse(base);
    expect(result.success && result.data.choiceGroup).toBeUndefined();
  });

  it("aceita um grupo e tira os espaços das pontas", () => {
    const result = mealItemSchema.safeParse({ ...base, choiceGroup: "  Proteína " });
    expect(result.success && result.data.choiceGroup).toBe("Proteína");
  });

  it("recusa grupo com mais de 40 caracteres", () => {
    expect(mealItemSchema.safeParse({ ...base, choiceGroup: "a".repeat(41) }).success).toBe(false);
    expect(mealItemSchema.safeParse({ ...base, choiceGroup: "a".repeat(40) }).success).toBe(true);
  });
});
