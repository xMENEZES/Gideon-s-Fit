import { describe, expect, it } from "vitest";
import { formatChartDate, toChartData } from "@/lib/load-chart-data";

describe("formatChartDate", () => {
  it("mostra dia e mês, sem perder um dia por causa do fuso", () => {
    expect(formatChartDate("2026-11-03")).toBe("03/11");
    expect(formatChartDate("2026-01-01")).toBe("01/01");
    expect(formatChartDate("2026-12-31")).toBe("31/12");
  });
});

describe("toChartData", () => {
  it("gera um ponto por registro, cada um com a sua data", () => {
    const data = toChartData([
      { logged_at: "2026-10-23", weight_kg: 30 },
      { logged_at: "2026-10-26", weight_kg: 32.5 },
      { logged_at: "2026-10-26", weight_kg: 35 },
    ]);
    expect(data.map((point) => point.date)).toEqual(["23/10", "26/10", "26/10"]);
    expect(data.map((point) => point.carga)).toEqual([30, 32.5, 35]);
  });

  it("usa o texto conjugado quando existe e o número nos demais", () => {
    const data = toChartData([
      { logged_at: "2026-11-01", weight_kg: 10, weight_text: "10 + 15" },
      { logged_at: "2026-11-02", weight_kg: 12.5, weight_text: null },
      { logged_at: "2026-11-03", weight_kg: 20 },
    ]);
    expect(data.map((point) => point.texto)).toEqual(["10 + 15", "12.5", "20"]);
  });

  it("devolve lista vazia sem registros", () => {
    expect(toChartData([])).toEqual([]);
  });
});
