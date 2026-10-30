import { describe, expect, it } from "vitest";
import { monthStart, participantsLabel, pointsLabel, rankRows, type RankingRow } from "@/lib/ranking";

const row = (display_name: string, total_points: number, is_me = false): RankingRow => ({
  display_name,
  total_points,
  is_me,
});

describe("monthStart", () => {
  it("devolve o dia 1 do mês da data", () => {
    expect(monthStart("2026-10-30")).toBe("2026-10-01");
    expect(monthStart("2026-01-01")).toBe("2026-01-01");
    expect(monthStart("2026-12-31")).toBe("2026-12-01");
  });
});

describe("rankRows", () => {
  it("ordena do mais pontuado para o menos, com posições 1, 2, 3", () => {
    const ranked = rankRows([row("Bia", 4), row("Caio", 9), row("Ana", 6)]);
    expect(ranked.map((r) => [r.display_name, r.position])).toEqual([
      ["Caio", 1],
      ["Ana", 2],
      ["Bia", 3],
    ]);
  });

  it("empate divide a posição e o seguinte pula (1º, 1º, 3º)", () => {
    const ranked = rankRows([row("Bia", 5), row("Ana", 5), row("Caio", 2)]);
    expect(ranked.map((r) => r.position)).toEqual([1, 1, 3]);
  });

  it("empate no meio e no fim", () => {
    const ranked = rankRows([row("A", 9), row("B", 6), row("C", 6), row("D", 6), row("E", 0), row("F", 0)]);
    expect(ranked.map((r) => r.position)).toEqual([1, 2, 2, 2, 5, 5]);
  });

  it("no empate, ordena por nome (acentos e maiúsculas pt-BR)", () => {
    const ranked = rankRows([row("Érica", 3), row("Bruno", 3), row("Ana", 3)]);
    expect(ranked.map((r) => r.display_name)).toEqual(["Ana", "Bruno", "Érica"]);
    expect(ranked.every((r) => r.position === 1)).toBe(true);
  });

  it("mantém quem é o próprio usuário e não altera a lista original", () => {
    const rows = [row("Bia", 1), row("Ana", 3, true)];
    const ranked = rankRows(rows);
    expect(ranked[0]).toMatchObject({ display_name: "Ana", position: 1, is_me: true });
    expect(rows[0].display_name).toBe("Bia");
  });

  it("lista vazia e um participante só", () => {
    expect(rankRows([])).toEqual([]);
    expect(rankRows([row("Ana", 0, true)])).toEqual([{ display_name: "Ana", total_points: 0, is_me: true, position: 1 }]);
  });
});

describe("textos", () => {
  it("pontos no singular e no plural", () => {
    expect(pointsLabel(0)).toBe("0 pontos");
    expect(pointsLabel(1)).toBe("1 ponto");
    expect(pointsLabel(12)).toBe("12 pontos");
  });

  it("quantos alunos participam", () => {
    expect(participantsLabel(0)).toBe("Nenhum aluno participa ainda");
    expect(participantsLabel(1)).toBe("1 aluno participa");
    expect(participantsLabel(5)).toBe("5 alunos participam");
  });
});
