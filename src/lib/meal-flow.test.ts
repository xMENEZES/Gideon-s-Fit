import { describe, expect, it } from "vitest";
import { nextPendingMealId } from "@/lib/meal-flow";

const ids = ["cafe", "almoco", "lanche", "jantar"];
const marked = (...done: string[]) => (id: string) => done.includes(id);

describe("nextPendingMealId", () => {
  it("vai para a refeição seguinte quando ela está pendente", () => {
    expect(nextPendingMealId(ids, marked("cafe"), "cafe")).toBe("almoco");
  });

  it("pula as já marcadas", () => {
    expect(nextPendingMealId(ids, marked("cafe", "almoco"), "cafe")).toBe("lanche");
    expect(nextPendingMealId(ids, marked("cafe", "almoco", "lanche"), "cafe")).toBe("jantar");
  });

  it("depois da última, volta para uma anterior ainda pendente", () => {
    expect(nextPendingMealId(ids, marked("almoco", "lanche", "jantar"), "jantar")).toBe("cafe");
    expect(nextPendingMealId(ids, marked("cafe", "lanche", "jantar"), "jantar")).toBe("almoco");
  });

  it("devolve null quando todas estão marcadas", () => {
    expect(nextPendingMealId(ids, marked(...ids), "lanche")).toBeNull();
  });

  it("uma refeição só: não há próxima", () => {
    expect(nextPendingMealId(["unica"], marked("unica"), "unica")).toBeNull();
  });

  it("refeição desconhecida: começa do início", () => {
    expect(nextPendingMealId(ids, marked(), "x")).toBe("cafe");
  });
});
