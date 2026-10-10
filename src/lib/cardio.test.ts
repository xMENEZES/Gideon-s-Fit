import { describe, expect, it } from "vitest";
import { formatCardioAmount, formatKm, formatMinutes, isKnownActivity } from "@/lib/cardio";

describe("formatMinutes", () => {
  it("abaixo de uma hora usa só minutos", () => {
    expect(formatMinutes(1)).toBe("1 min");
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(59)).toBe("59 min");
  });

  it("a partir de uma hora usa horas e minutos", () => {
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(90)).toBe("1 h 30 min");
    expect(formatMinutes(125)).toBe("2 h 5 min");
  });
});

describe("formatKm", () => {
  it("formata com vírgula e até 2 casas", () => {
    expect(formatKm(5)).toBe("5 km");
    expect(formatKm(3.5)).toBe("3,5 km");
    expect(formatKm(10.25)).toBe("10,25 km");
  });
});

describe("formatCardioAmount", () => {
  it("combina minutos e km conforme o que existe", () => {
    expect(formatCardioAmount(30, 5)).toBe("30 min, 5 km");
    expect(formatCardioAmount(30, null)).toBe("30 min");
    expect(formatCardioAmount(null, 5)).toBe("5 km");
    expect(formatCardioAmount(null, null)).toBe("");
    expect(formatCardioAmount(undefined, undefined)).toBe("");
  });
});

describe("isKnownActivity", () => {
  it("reconhece as atividades da lista", () => {
    expect(isKnownActivity("Corrida")).toBe(true);
    expect(isKnownActivity("Pular corda")).toBe(true);
    expect(isKnownActivity("Surf")).toBe(false);
    expect(isKnownActivity("")).toBe(false);
  });
});
