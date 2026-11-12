import { describe, expect, it } from "vitest";
import {
  ageOn,
  birthDateBounds,
  birthDateStatus,
  formatBirthDate,
  parseDecimal,
  weightLabel,
} from "@/lib/body-data";

const TODAY = "2026-11-12";

describe("birthDateStatus", () => {
  it("aceita quem faz 18 anos hoje e recusa quem faz amanhã", () => {
    expect(birthDateStatus("2008-11-12", TODAY)).toBe("ok");
    expect(birthDateStatus("2008-11-13", TODAY)).toBe("underage");
    expect(birthDateStatus("2008-11-11", TODAY)).toBe("ok");
  });

  it("recusa data futura como menor de idade", () => {
    expect(birthDateStatus("2026-11-13", TODAY)).toBe("underage");
    expect(birthDateStatus("2030-01-01", TODAY)).toBe("underage");
  });

  it("aceita 100 anos exatos e recusa um dia a mais", () => {
    expect(birthDateStatus("1926-11-12", TODAY)).toBe("ok");
    expect(birthDateStatus("1926-11-11", TODAY)).toBe("too_old");
  });

  it("recusa texto que não é data e dias que não existem", () => {
    expect(birthDateStatus("", TODAY)).toBe("invalid");
    expect(birthDateStatus("abc", TODAY)).toBe("invalid");
    expect(birthDateStatus("12/11/1990", TODAY)).toBe("invalid");
    expect(birthDateStatus("1990-02-31", TODAY)).toBe("invalid");
    expect(birthDateStatus("1990-13-01", TODAY)).toBe("invalid");
    expect(birthDateStatus("1990-00-10", TODAY)).toBe("invalid");
    expect(birthDateStatus("1990-02-29", TODAY)).toBe("invalid"); // 1990 não é bissexto
    expect(birthDateStatus("1990-05-10", "hoje")).toBe("invalid");
  });

  it("trata 29/02 como o banco: em ano não bissexto vale 28/02", () => {
    // Hoje 28/02/2026: quem nasceu em 29/02/2008 ainda não fez 18 anos.
    expect(birthDateStatus("2008-02-28", "2026-02-28")).toBe("ok");
    expect(birthDateStatus("2008-02-29", "2026-02-28")).toBe("underage");
    expect(birthDateStatus("2008-02-29", "2026-03-01")).toBe("ok");
    // Hoje 29/02/2028 (bissexto): o limite cai em 28/02/2010.
    expect(birthDateStatus("2010-02-28", "2028-02-29")).toBe("ok");
    expect(birthDateStatus("2010-03-01", "2028-02-29")).toBe("underage");
  });
});

describe("ageOn", () => {
  it("conta a idade completa, mudando no aniversário", () => {
    expect(ageOn("2008-11-12", TODAY)).toBe(18);
    expect(ageOn("2008-11-13", TODAY)).toBe(17);
    expect(ageOn("1990-05-10", TODAY)).toBe(36);
    expect(ageOn("1990-12-31", TODAY)).toBe(35);
  });

  it("nascido em 29/02 faz aniversário em 01/03 nos anos não bissextos", () => {
    expect(ageOn("2000-02-29", "2026-02-28")).toBe(25);
    expect(ageOn("2000-02-29", "2026-03-01")).toBe(26);
  });

  it("devolve null para data inválida ou nascimento no futuro", () => {
    expect(ageOn("abc", TODAY)).toBeNull();
    expect(ageOn("1990-05-10", "hoje")).toBeNull();
    expect(ageOn("2030-01-01", TODAY)).toBeNull();
  });
});

describe("birthDateBounds", () => {
  it("devolve a data mais antiga e a mais recente aceitas", () => {
    expect(birthDateBounds(TODAY)).toEqual({ min: "1926-11-12", max: "2008-11-12" });
  });

  it("devolve null para 'hoje' inválido", () => {
    expect(birthDateBounds("x")).toBeNull();
  });
});

describe("parseDecimal", () => {
  it("aceita vírgula ou ponto", () => {
    expect(parseDecimal("72,5")).toBe(72.5);
    expect(parseDecimal("72.5")).toBe(72.5);
    expect(parseDecimal("72")).toBe(72);
    expect(parseDecimal("  72  ")).toBe(72);
  });

  it("recusa o que não é número simples", () => {
    for (const bad of ["", "abc", "72,5,1", "-5", "1e3", "7 2", ",5", "5,"]) {
      expect(parseDecimal(bad), bad).toBeNull();
    }
  });
});

describe("exibição", () => {
  it("mostra o peso com vírgula", () => {
    expect(weightLabel(72.5)).toBe("72,5 kg");
    expect(weightLabel("80.0")).toBe("80,0 kg");
    expect(weightLabel(80)).toBe("80 kg");
  });

  it("mostra a data em dia/mês/ano", () => {
    expect(formatBirthDate("1990-05-09")).toBe("09/05/1990");
    expect(formatBirthDate("lixo")).toBe("lixo");
  });
});
