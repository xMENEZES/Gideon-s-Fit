import { describe, expect, it } from "vitest";
import {
  buildMealRangeStatus,
  buildMealStatus,
  type MealRow,
  type ProtocolPeriod,
} from "@/lib/status";

const TODAY = "2026-10-10";

function meal(id: string, name: string, logs: Record<string, boolean | [boolean, string]>): MealRow {
  return {
    id,
    name,
    logs: new Map(
      Object.entries(logs).map(([date, value]) => {
        const [done, note] = Array.isArray(value) ? value : [value, null];
        return [date, { done, note }];
      })
    ),
  };
}

function period(partial: Partial<ProtocolPeriod> & { id?: string }): ProtocolPeriod {
  return {
    id: "p1",
    type: "diet",
    start_date: "2026-10-07",
    end_date: "2026-11-06",
    is_active: true,
    ...partial,
  };
}

describe("buildMealStatus (protocolo alimentar)", () => {
  // Protocolo ativo desde 07/10; hoje é 10/10. Dias encerrados: 07, 08 e 09. Hoje: em andamento.
  const meals = [
    meal("m1", "Café", { "2026-10-07": true, "2026-10-08": true, "2026-10-10": true }),
    meal("m2", "Almoço", { "2026-10-07": true, "2026-10-08": [false, "viagem"] }),
  ];

  it("só conta dias encerrados nos totais e na porcentagem", () => {
    const status = buildMealStatus(period({}), TODAY, meals);

    expect(status.closedDays).toBe(3);
    expect(status.expectedTotal).toBe(6); // 2 refeições x 3 dias encerrados
    expect(status.doneTotal).toBe(3);
    expect(status.missedTotal).toBe(1);
    expect(status.unmarkedTotal).toBe(2); // dia 09 sem nenhum registro
    expect(status.percent).toBe(50);
  });

  it("mostra hoje na lista como em andamento, sem entrar na conta", () => {
    const status = buildMealStatus(period({}), TODAY, meals);
    const today = status.days.find((day) => day.date === TODAY);

    expect(status.days).toHaveLength(4);
    expect(today?.inProgress).toBe(true);
    expect(today?.done).toBe(1);
    expect(today?.unmarked).toBe(1);
    expect(status.days.filter((day) => day.inProgress)).toHaveLength(1);
  });

  it("não muda a porcentagem quando hoje é todo marcado como feito", () => {
    const allDoneToday = [
      meal("m1", "Café", { "2026-10-07": true, "2026-10-08": true, "2026-10-10": true }),
      meal("m2", "Almoço", {
        "2026-10-07": true,
        "2026-10-08": [false, "viagem"],
        "2026-10-10": true,
      }),
    ];
    const status = buildMealStatus(period({}), TODAY, allDoneToday);

    expect(status.percent).toBe(50);
    expect(status.expectedTotal).toBe(6);
  });

  it("não derruba a porcentagem logo de manhã (hoje sem nenhum registro)", () => {
    const morning = [
      meal("m1", "Café", { "2026-10-07": true, "2026-10-08": true, "2026-10-09": true }),
      meal("m2", "Almoço", { "2026-10-07": true, "2026-10-08": true, "2026-10-09": true }),
    ];
    const status = buildMealStatus(period({}), TODAY, morning);

    expect(status.percent).toBe(100);
    expect(status.unmarkedTotal).toBe(0);
  });

  it("primeiro dia de um protocolo novo: nenhum dia encerrado, sem porcentagem", () => {
    const status = buildMealStatus(period({ start_date: TODAY }), TODAY, meals);

    expect(status.closedDays).toBe(0);
    expect(status.expectedTotal).toBe(0);
    expect(status.percent).toBe(0);
    expect(status.days).toHaveLength(1);
    expect(status.days[0].inProgress).toBe(true);
    expect(status.mealsPerDay).toBe(2);
  });

  it("protocolo encerrado no passado: todos os dias contam", () => {
    const finished = period({ is_active: false, start_date: "2026-09-01", end_date: "2026-09-03" });
    const rows = [meal("m1", "Café", { "2026-09-01": true, "2026-09-02": false, "2026-09-03": true })];
    const status = buildMealStatus(finished, TODAY, rows);

    expect(status.closedDays).toBe(3);
    expect(status.expectedTotal).toBe(3);
    expect(status.doneTotal).toBe(2);
    expect(status.missedTotal).toBe(1);
    expect(status.percent).toBe(67);
    expect(status.days.some((day) => day.inProgress)).toBe(false);
  });

  it("protocolo ativo e vencido continua contando até ontem, com hoje em andamento", () => {
    const overdue = period({ start_date: "2026-10-01", end_date: "2026-10-05" });
    const rows = [meal("m1", "Café", { "2026-10-01": true })];
    const status = buildMealStatus(overdue, TODAY, rows);

    expect(status.days[0].date).toBe("2026-10-01");
    expect(status.days.at(-1)?.date).toBe(TODAY);
    expect(status.closedDays).toBe(9); // 01 a 09
    expect(status.partial).toBe(false);
  });

  it("protocolo sem refeições não gera total esperado", () => {
    const status = buildMealStatus(period({}), TODAY, []);

    expect(status.mealsPerDay).toBe(0);
    expect(status.expectedTotal).toBe(0);
    expect(status.percent).toBe(0);
  });
});

describe("buildMealRangeStatus (intervalo livre)", () => {
  const first = period({ id: "a", start_date: "2026-10-01", end_date: "2026-10-05", is_active: false });
  const second = period({ id: "b", start_date: "2026-10-06", end_date: "2026-11-05" });
  const byProtocol = new Map<string, MealRow[]>([
    ["a", [meal("a1", "Café", { "2026-10-04": true, "2026-10-05": false })]],
    ["b", [meal("b1", "Café", { "2026-10-06": true, "2026-10-10": true }), meal("b2", "Jantar", {})]],
  ]);

  it("atravessa protocolos e deixa hoje de fora da porcentagem", () => {
    const status = buildMealRangeStatus([first, second], byProtocol, "2026-10-04", TODAY, TODAY);

    // 04 e 05 (1 refeição cada) + 06 a 09 (2 refeições cada) = 10 esperadas; 10 é hoje.
    expect(status.days).toHaveLength(7);
    expect(status.closedDays).toBe(6);
    expect(status.expectedTotal).toBe(10);
    expect(status.doneTotal).toBe(2); // 04 e 06
    expect(status.missedTotal).toBe(1); // 05
    expect(status.days.at(-1)?.inProgress).toBe(true);
  });

  it("intervalo que termina antes de hoje conta todos os dias", () => {
    const status = buildMealStatus(period({}), TODAY, []);
    const range = buildMealRangeStatus([first, second], byProtocol, "2026-10-04", "2026-10-06", TODAY);

    expect(status.expectedTotal).toBe(0);
    expect(range.closedDays).toBe(3);
    expect(range.days.some((day) => day.inProgress)).toBe(false);
  });

  it("intervalo só com hoje: nenhum dia encerrado", () => {
    const status = buildMealRangeStatus([second], byProtocol, TODAY, TODAY, TODAY);

    expect(status.closedDays).toBe(0);
    expect(status.expectedTotal).toBe(0);
    expect(status.days).toHaveLength(1);
  });
});
