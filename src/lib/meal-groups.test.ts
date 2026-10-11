import { describe, expect, it } from "vitest";
import { existingGroups, groupMealItems } from "@/lib/meal-groups";

const item = (id: string, sort_order: number, choice_group?: string | null) => ({ id, sort_order, choice_group });
const ids = (blocks: ReturnType<typeof groupMealItems<ReturnType<typeof item>>>) =>
  blocks.map((b) => (b.kind === "single" ? b.item.id : `${b.label}:${b.items.map((i) => i.id).join(",")}`));

describe("groupMealItems", () => {
  it("itens sem grupo continuam comuns, na ordem", () => {
    expect(ids(groupMealItems([item("b", 1), item("a", 0), item("c", 2, null)]))).toEqual(["a", "b", "c"]);
  });

  it("junta as alternativas do mesmo grupo no lugar da primeira", () => {
    const blocks = groupMealItems([
      item("frango", 0, "Proteína"),
      item("arroz", 1, "Carboidrato"),
      item("peixe", 2, "Proteína"),
      item("macarrao", 3, "Carboidrato"),
      item("feijao", 4),
    ]);
    expect(ids(blocks)).toEqual(["Proteína:frango,peixe", "Carboidrato:arroz,macarrao", "feijao"]);
  });

  it("um grupo com um item só vira item comum", () => {
    expect(ids(groupMealItems([item("a", 0, "Leite"), item("b", 1)]))).toEqual(["a", "b"]);
  });

  it("não diferencia maiúsculas nem espaços nas pontas, e usa o rótulo do primeiro", () => {
    const blocks = groupMealItems([item("a", 0, "Proteína"), item("b", 1, "  proteína ")]);
    expect(ids(blocks)).toEqual(["Proteína:a,b"]);
  });

  it("grupo só de espaços conta como sem grupo", () => {
    expect(ids(groupMealItems([item("a", 0, "   "), item("b", 1, "")]))).toEqual(["a", "b"]);
  });

  it("lista vazia", () => {
    expect(groupMealItems([])).toEqual([]);
  });
});

describe("existingGroups", () => {
  it("lista cada grupo uma vez, na ordem em que aparecem", () => {
    expect(
      existingGroups([item("a", 2, "Carboidrato"), item("b", 0, "Proteína"), item("c", 1, "proteína"), item("d", 3)])
    ).toEqual(["Proteína", "Carboidrato"]);
  });
});
