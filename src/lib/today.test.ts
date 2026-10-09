import { describe, expect, it } from "vitest";
import {
  capitalize,
  daysUntil,
  fullDate,
  hasDietContent,
  hasWorkoutContent,
  shortDate,
  suggestWorkoutDay,
  weekdayName,
} from "@/lib/today";

const TODAY = "2026-10-09";

function day(id: string, ...logDates: string[]) {
  return { id, exercises: [{ exercise_load_logs: logDates.map((logged_at) => ({ logged_at })) }] };
}

describe("hasWorkoutContent / hasDietContent", () => {
  it("treino só está pronto com ao menos 1 exercício", () => {
    expect(hasWorkoutContent(null)).toBe(false);
    expect(hasWorkoutContent([])).toBe(false);
    expect(hasWorkoutContent([{ id: "a", exercises: [] }])).toBe(false);
    expect(hasWorkoutContent([{ id: "a", exercises: [] }, day("b")])).toBe(true);
  });

  it("alimentação só está pronta com ao menos 1 refeição", () => {
    expect(hasDietContent(null)).toBe(false);
    expect(hasDietContent([])).toBe(false);
    expect(hasDietContent([{ id: "m1" }])).toBe(true);
  });
});

describe("suggestWorkoutDay", () => {
  it("sem dias: nenhuma sugestão", () => {
    expect(suggestWorkoutDay([], TODAY)).toMatchObject({ dayId: null, reason: "none" });
  });

  it("sem nenhum registro: começa pelo primeiro dia", () => {
    const result = suggestWorkoutDay([day("A"), day("B"), day("C")], TODAY);
    expect(result).toMatchObject({ dayId: "A", reason: "first", lastDayId: null, lastDate: null });
  });

  it("sugere o dia seguinte ao último treinado", () => {
    const result = suggestWorkoutDay([day("A", "2026-10-07"), day("B"), day("C")], TODAY);
    expect(result).toMatchObject({ dayId: "B", reason: "next", lastDayId: "A", lastDate: "2026-10-07" });
  });

  it("usa o treino mais recente, e não o de maior posição", () => {
    const result = suggestWorkoutDay([day("A", "2026-10-08"), day("B", "2026-10-05"), day("C")], TODAY);
    expect(result).toMatchObject({ dayId: "B", reason: "next", lastDayId: "A" });
  });

  it("volta ao primeiro dia depois do último", () => {
    const result = suggestWorkoutDay([day("A"), day("B"), day("C", "2026-10-08")], TODAY);
    expect(result).toMatchObject({ dayId: "A", reason: "next", lastDayId: "C" });
  });

  it("se já treinou hoje, mantém o dia de hoje", () => {
    const result = suggestWorkoutDay([day("A", "2026-10-06"), day("B", TODAY), day("C")], TODAY);
    expect(result).toMatchObject({ dayId: "B", reason: "today", lastDate: TODAY });
  });

  it("treinou dois dias hoje: fica o mais adiante na ordem", () => {
    const result = suggestWorkoutDay([day("A", TODAY), day("B", TODAY), day("C")], TODAY);
    expect(result.dayId).toBe("B");
  });

  it("protocolo de um dia só: o próprio dia", () => {
    expect(suggestWorkoutDay([day("A", "2026-10-08")], TODAY)).toMatchObject({ dayId: "A", reason: "next" });
  });

  it("ignora registros com data futura", () => {
    const result = suggestWorkoutDay([day("A", "2026-10-07", "2026-10-20"), day("B"), day("C")], TODAY);
    expect(result).toMatchObject({ dayId: "B", reason: "next", lastDate: "2026-10-07" });
  });

  it("empate de datas entre dias: vale o mais adiante na ordem", () => {
    const result = suggestWorkoutDay([day("A", "2026-10-08"), day("B", "2026-10-08"), day("C")], TODAY);
    expect(result).toMatchObject({ dayId: "C", lastDayId: "B" });
  });

  it("dias sem exercícios não quebram a sugestão", () => {
    const result = suggestWorkoutDay([{ id: "A", exercises: [] }, day("B", "2026-10-08")], TODAY);
    expect(result).toMatchObject({ dayId: "A", lastDayId: "B" });
  });
});

describe("datas", () => {
  it("nome do dia da semana", () => {
    expect(weekdayName("2026-10-09")).toBe("sexta-feira");
    expect(weekdayName("2026-10-11")).toBe("domingo");
  });

  it("capitaliza só a primeira letra", () => {
    expect(capitalize("sexta-feira")).toBe("Sexta-feira");
    expect(capitalize("")).toBe("");
  });

  it("formata datas curtas e completas", () => {
    expect(shortDate("2026-10-09")).toBe("09/10");
    expect(fullDate("2026-10-09")).toBe("09/10/2026");
  });

  it("dias até uma data", () => {
    expect(daysUntil("2026-10-12", "2026-10-09")).toBe(3);
    expect(daysUntil("2026-10-09", "2026-10-09")).toBe(0);
    expect(daysUntil("2026-10-07", "2026-10-09")).toBe(-2);
    expect(daysUntil("2026-11-01", "2026-10-31")).toBe(1);
  });
});
