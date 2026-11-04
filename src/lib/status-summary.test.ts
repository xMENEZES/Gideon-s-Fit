import { describe, expect, it } from "vitest";
import { dietSummaryText, workoutSummaryText } from "@/lib/status-summary";

describe("workoutSummaryText", () => {
  it("conta os dias treinados sobre os dias do protocolo", () => {
    expect(workoutSummaryText({ trainedCount: 3, range: new Array(8).fill("d") })).toBe("3 de 8 dias treinados");
    expect(workoutSummaryText({ trainedCount: 0, range: ["2026-11-04"] })).toBe("0 de 1 dias treinados");
  });

  it("sem protocolo ativo", () => {
    expect(workoutSummaryText(null)).toBe("Sem protocolo ativo");
  });
});

describe("dietSummaryText", () => {
  const base = { mealsPerDay: 3, closedDays: 4, percent: 75, doneTotal: 9, expectedTotal: 12 };

  it("mostra o aproveitamento quando já há dia encerrado", () => {
    expect(dietSummaryText(base)).toBe("75% (9 de 12 refeições)");
  });

  it("primeiro dia do protocolo: ainda em andamento", () => {
    expect(dietSummaryText({ ...base, closedDays: 0, percent: 0, doneTotal: 0, expectedTotal: 0 })).toBe(
      "Em andamento (1º dia)"
    );
  });

  it("protocolo sem refeições cadastradas", () => {
    expect(dietSummaryText({ ...base, mealsPerDay: 0 })).toBe("Sem refeições cadastradas");
  });

  it("sem protocolo ativo", () => {
    expect(dietSummaryText(null)).toBe("Sem protocolo ativo");
  });
});
