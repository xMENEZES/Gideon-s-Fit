import { describe, expect, it } from "vitest";
import {
  clampMonth,
  dayMarks,
  isInSelection,
  missedDaysNewestFirst,
  monthCells,
  monthLabel,
  nextSelection,
  selectionKind,
  selectionLabel,
  shiftMonth,
  summarizeMealSelection,
  summarizeWorkoutSelection,
} from "@/lib/status-select";
import { summarizeMeals, type MealDayStatus } from "@/lib/status";

const mealDay = (
  date: string,
  done: number,
  total = 2,
  missed: string[] = [],
  inProgress = false
): MealDayStatus => ({
  date,
  total,
  done,
  missed: missed.map((meal) => ({ meal, note: null })),
  unmarked: total - done - missed.length,
  meals: [],
  inProgress,
});

describe("nextSelection", () => {
  it("o primeiro toque seleciona o dia", () => {
    expect(nextSelection(null, "2026-10-09")).toEqual({ from: "2026-10-09", to: "2026-10-09" });
  });

  it("tocar de novo no mesmo dia limpa", () => {
    expect(nextSelection({ from: "2026-10-09", to: "2026-10-09" }, "2026-10-09")).toBeNull();
  });

  it("o segundo toque forma o período, em qualquer ordem", () => {
    const single = { from: "2026-10-09", to: "2026-10-09" };
    expect(nextSelection(single, "2026-10-12")).toEqual({ from: "2026-10-09", to: "2026-10-12" });
    expect(nextSelection(single, "2026-10-05")).toEqual({ from: "2026-10-05", to: "2026-10-09" });
  });

  it("com um período selecionado, o toque recomeça com um dia", () => {
    expect(nextSelection({ from: "2026-10-05", to: "2026-10-09" }, "2026-10-07")).toEqual({
      from: "2026-10-07",
      to: "2026-10-07",
    });
  });
});

describe("seleção: consultas", () => {
  const period = { from: "2026-10-05", to: "2026-10-09" };

  it("diz quais dias estão dentro (inclusive as pontas)", () => {
    expect(isInSelection("2026-10-05", period)).toBe(true);
    expect(isInSelection("2026-10-09", period)).toBe(true);
    expect(isInSelection("2026-10-04", period)).toBe(false);
    expect(isInSelection("2026-10-10", period)).toBe(false);
    expect(isInSelection("2026-10-05", null)).toBe(false);
  });

  it("classifica a seleção", () => {
    expect(selectionKind(null)).toBe("none");
    expect(selectionKind({ from: "2026-10-05", to: "2026-10-05" })).toBe("day");
    expect(selectionKind(period)).toBe("period");
  });

  it("descreve a seleção", () => {
    expect(selectionLabel({ from: "2026-10-09", to: "2026-10-09" })).toBe("sex, 09/10/2026");
    expect(selectionLabel(period)).toBe("05/10 a 09/10/2026 (5 dias)");
  });
});

describe("calendário do mês", () => {
  it("outubro de 2026 começa numa quinta-feira e tem 31 dias", () => {
    const cells = monthCells("2026-10");
    expect(cells.slice(0, 4)).toEqual([null, null, null, null]);
    expect(cells[4]).toBe("2026-10-01");
    expect(cells.at(-1)).toBe("2026-10-31");
    expect(cells.filter(Boolean)).toHaveLength(31);
  });

  it("um mês que começa no domingo não tem células vazias; fevereiro bissexto tem 29 dias", () => {
    expect(monthCells("2026-02")[0]).toBe("2026-02-01"); // 01/02/2026 é domingo
    expect(monthCells("2028-02").filter(Boolean)).toHaveLength(29);
  });

  it("troca de mês atravessando o ano", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-10", 0)).toBe("2026-10");
  });

  it("rotula e limita o mês aos dados", () => {
    expect(monthLabel("2026-10")).toBe("Outubro de 2026");
    expect(clampMonth("2026-12", "2026-10-02", "2026-11-06")).toBe("2026-11");
    expect(clampMonth("2026-08", "2026-10-02", "2026-11-06")).toBe("2026-10");
    expect(clampMonth("2026-10", "2026-10-02", "2026-11-06")).toBe("2026-10");
  });
});

describe("dayMarks", () => {
  it("treino: só marca quando houve registro", () => {
    expect(dayMarks(true, undefined).workout).toBe(true);
    expect(dayMarks(false, undefined)).toEqual({ workout: false, diet: null });
  });

  it("alimentação: completa, com 'não fez', pendente e em andamento", () => {
    expect(dayMarks(false, mealDay("2026-10-09", 2)).diet).toBe("complete");
    expect(dayMarks(false, mealDay("2026-10-09", 1, 2, ["Almoço"])).diet).toBe("missed");
    expect(dayMarks(false, mealDay("2026-10-09", 1)).diet).toBe("pending");
    expect(dayMarks(false, mealDay("2026-10-09", 0)).diet).toBe("pending");
    expect(dayMarks(false, mealDay("2026-10-13", 1, 2, [], true)).diet).toBe("progress");
    expect(dayMarks(false, mealDay("2026-10-13", 2, 2, [], true)).diet).toBe("complete");
  });

  it("dia sem refeições não tem marca", () => {
    expect(dayMarks(false, mealDay("2026-10-09", 0, 0)).diet).toBeNull();
  });
});

describe("resumo da alimentação na seleção", () => {
  const days = [
    mealDay("2026-10-08", 2),
    mealDay("2026-10-09", 1, 2, ["Almoço"]),
    mealDay("2026-10-10", 0),
    mealDay("2026-10-13", 1, 2, [], true), // hoje, em andamento
  ];

  it("sem seleção, bate com o resumo do período inteiro", () => {
    expect(summarizeMealSelection(days, null)).toEqual(summarizeMeals(days, 2, false));
  });

  it("um período conta só os dias encerrados dentro dele", () => {
    const s = summarizeMealSelection(days, { from: "2026-10-08", to: "2026-10-09" });
    expect(s.closedDays).toBe(2);
    expect(s.expectedTotal).toBe(4);
    expect(s.doneTotal).toBe(3);
    expect(s.missedTotal).toBe(1);
    expect(s.unmarkedTotal).toBe(0);
    expect(s.percent).toBe(75);
  });

  it("selecionar só hoje (em andamento) não entra na conta", () => {
    const s = summarizeMealSelection(days, { from: "2026-10-13", to: "2026-10-13" });
    expect(s.closedDays).toBe(0);
    expect(s.expectedTotal).toBe(0);
    expect(s.days).toHaveLength(1);
  });

  it("lista os dias com 'não fez', do mais novo para o mais antigo", () => {
    const all = [
      mealDay("2026-10-05", 0, 2, ["Café"]),
      mealDay("2026-10-09", 1, 2, ["Almoço"]),
      mealDay("2026-10-10", 2),
    ];
    expect(missedDaysNewestFirst(all).map((d) => d.date)).toEqual(["2026-10-09", "2026-10-05"]);
  });
});

describe("resumo do treino na seleção", () => {
  const range = ["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"];
  const entries = { "2026-10-08": [{}], "2026-10-10": [{}, {}] };

  it("sem seleção, conta o período todo", () => {
    expect(summarizeWorkoutSelection(range, entries, null)).toEqual({
      total: 4,
      trained: 2,
      trainedDatesNewestFirst: ["2026-10-10", "2026-10-08"],
    });
  });

  it("com período, só os dias dentro", () => {
    expect(summarizeWorkoutSelection(range, entries, { from: "2026-10-08", to: "2026-10-09" })).toEqual({
      total: 2,
      trained: 1,
      trainedDatesNewestFirst: ["2026-10-08"],
    });
  });

  it("um dia sem treino", () => {
    expect(summarizeWorkoutSelection(range, entries, { from: "2026-10-09", to: "2026-10-09" }).trained).toBe(0);
  });
});
