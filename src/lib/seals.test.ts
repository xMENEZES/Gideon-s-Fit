import { describe, expect, it } from "vitest";
import { bestSeals, sealDescription, sealName } from "@/lib/seals";

describe("bestSeals", () => {
  const seals = [
    { line: "workout" as const, milestone: 3 },
    { line: "workout" as const, milestone: 14 },
    { line: "workout" as const, milestone: 7 },
    { line: "diet" as const, milestone: 3 },
    { line: "both" as const, milestone: 7 },
  ];

  it("devolve só o maior selo de cada linha pedida, na ordem pedida", () => {
    expect(bestSeals(seals, ["workout", "both"])).toEqual([
      { line: "workout", milestone: 14 },
      { line: "both", milestone: 7 },
    ]);
    expect(bestSeals(seals, ["diet", "both"])).toEqual([
      { line: "diet", milestone: 3 },
      { line: "both", milestone: 7 },
    ]);
  });

  it("ignora linhas sem selo", () => {
    expect(bestSeals([{ line: "diet", milestone: 3 }], ["workout", "both"])).toEqual([]);
    expect(bestSeals([], ["workout"])).toEqual([]);
  });
});

describe("nomes dos selos", () => {
  it("usa o nome do marco e descreve a linha", () => {
    expect(sealName("workout", 3)).toBe("Primeiro Levante");
    expect(sealName("both", 200)).toBe("Lenda Absoluta");
    expect(sealDescription("diet", 7)).toBe("Uma Semana de Equilíbrio: 7 dias de dieta");
  });

  it("marco desconhecido não quebra", () => {
    expect(sealName("workout", 5)).toBe("5 dias");
  });
});
