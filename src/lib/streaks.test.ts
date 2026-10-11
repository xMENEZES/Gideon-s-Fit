import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/dates";
import { computeStreaks, sealsToAward, type ScoreRow } from "@/lib/streaks";

const START = "2026-10-05"; // segunda-feira

// Monta os dias a partir de um desenho: T = só treino, D = só dieta, B = os dois, - = nada.
// A primeira letra é START; "hoje" é o último dia do desenho (ou START + extra).
function days(pattern: string): ScoreRow[] {
  return [...pattern].flatMap((char, index) => {
    if (char === "-") return [];
    return [
      {
        score_date: addDays(START, index),
        workout_done: char === "T" || char === "B",
        diet_done: char === "D" || char === "B",
      },
    ];
  });
}
const day = (index: number) => addDays(START, index);

describe("computeStreaks: sem dados", () => {
  it("tudo zerado", () => {
    const s = computeStreaks([], day(5));
    expect(s.workout).toEqual({ current: 0, best: 0, reached: {} });
    expect(s.diet.current).toBe(0);
    expect(s.both.best).toBe(0);
  });
});

describe("computeStreaks: treino", () => {
  it("conta os dias treinados seguidos", () => {
    const s = computeStreaks(days("TTT"), day(2));
    expect(s.workout.current).toBe(3);
    expect(s.workout.best).toBe(3);
    expect(s.workout.reached[3]).toBe(day(2));
  });

  it("dois dias sem treinar (fim de semana) não quebram, e só os dias treinados contam", () => {
    // sexta, sábado e domingo de folga, segunda
    const s = computeStreaks(days("T--T"), day(3));
    expect(s.workout.current).toBe(2);
  });

  it("três dias seguidos sem treinar quebram a sequência", () => {
    const s = computeStreaks(days("T---T"), day(4));
    expect(s.workout.current).toBe(1);
    expect(s.workout.best).toBe(1);
  });

  it("o dia de hoje em andamento não quebra", () => {
    // treinou na segunda; terça e quarta de folga; hoje é quinta (em andamento)
    expect(computeStreaks(days("T"), day(3)).workout.current).toBe(1);
    // com a sexta, terça, quarta e quinta já passaram: quebrou
    expect(computeStreaks(days("T"), day(4)).workout.current).toBe(0);
  });

  it("hoje já treinado soma", () => {
    expect(computeStreaks(days("T--T"), day(3)).workout.current).toBe(2);
  });

  it("o recorde fica depois da quebra", () => {
    const s = computeStreaks(days("TTTT----T"), day(8));
    expect(s.workout.best).toBe(4);
    expect(s.workout.current).toBe(1);
  });
});

describe("computeStreaks: dieta", () => {
  it("um dia isolado incompleto (refeição livre) não quebra", () => {
    const s = computeStreaks(days("D-D"), day(2));
    expect(s.diet.current).toBe(2);
  });

  it("dois dias seguidos incompletos quebram", () => {
    const s = computeStreaks(days("D--D"), day(3));
    expect(s.diet.current).toBe(1);
    expect(s.diet.best).toBe(1);
  });

  it("hoje em andamento não quebra a dieta", () => {
    // completo na segunda; terça incompleta; hoje é quarta (em andamento)
    expect(computeStreaks(days("D"), day(2)).diet.current).toBe(1);
    // quinta: terça e quarta já passaram sem completar
    expect(computeStreaks(days("D"), day(3)).diet.current).toBe(0);
  });
});

describe("computeStreaks: treino + dieta", () => {
  it("conta só os dias com os dois feitos", () => {
    const s = computeStreaks(days("BTB"), day(2));
    expect(s.both.current).toBe(2);
    expect(s.workout.current).toBe(3);
    expect(s.diet.current).toBe(2);
  });

  it("quebra quando a dieta quebra, mesmo treinando todo dia", () => {
    // dieta feita só na segunda; depois só treino
    const s = computeStreaks(days("BTTT"), day(3));
    expect(s.both.current).toBe(0);
    expect(s.workout.current).toBe(4);
  });

  it("quebra quando o treino quebra, mesmo com a dieta em dia", () => {
    const s = computeStreaks(days("BDDDB"), day(4));
    expect(s.both.current).toBe(1);
    expect(s.diet.current).toBe(5);
  });
});

describe("marcos e selos", () => {
  it("registra a data em que cada marco foi alcançado", () => {
    const s = computeStreaks(days("TTTTTTT"), day(6));
    expect(s.workout.reached[3]).toBe(day(2));
    expect(s.workout.reached[7]).toBe(day(6));
    expect(s.workout.reached[14]).toBeUndefined();
  });

  it("a primeira vez que o marco foi alcançado é a que vale", () => {
    // 3 dias, quebra, outros 3 dias
    const s = computeStreaks(days("TTT----TTT"), day(9));
    expect(s.workout.reached[3]).toBe(day(2));
  });

  it("só premia o que ainda não tem registro, com a data certa", () => {
    const s = computeStreaks(days("TTTTTTT"), day(6));
    expect(sealsToAward(s, [])).toEqual([
      { line: "workout", milestone: 3, earned_on: day(2) },
      { line: "workout", milestone: 7, earned_on: day(6) },
    ]);
    expect(sealsToAward(s, [{ line: "workout", milestone: 3 }])).toEqual([
      { line: "workout", milestone: 7, earned_on: day(6) },
    ]);
  });

  it("os selos dourados vêm dos dias com treino e dieta", () => {
    const s = computeStreaks(days("BBB"), day(2));
    const lines = sealsToAward(s, []).map((seal) => `${seal.line}:${seal.milestone}`);
    expect(lines).toEqual(["workout:3", "diet:3", "both:3"]);
  });

  it("nada a premiar sem sequência", () => {
    expect(sealsToAward(computeStreaks(days("T-T"), day(2)), [])).toEqual([]);
  });
});
