import { describe, expect, it } from "vitest";
import { loadLabel, parseLoadValue } from "@/lib/load-values";

describe("parseLoadValue (carga)", () => {
  it("um valor simples não tem texto", () => {
    expect(parseLoadValue("20", "weight")).toEqual({ first: 20, text: null });
    expect(parseLoadValue(" 7,5 ", "weight")).toEqual({ first: 7.5, text: null });
  });

  it("exercício conjugado guarda o primeiro valor e o texto padronizado", () => {
    expect(parseLoadValue("10 + 15", "weight")).toEqual({ first: 10, text: "10 + 15" });
    expect(parseLoadValue("10+15", "weight")).toEqual({ first: 10, text: "10 + 15" });
    expect(parseLoadValue("7,5 +10+ 12.5", "weight")).toEqual({ first: 7.5, text: "7.5 + 10 + 12.5" });
  });

  it("recusa texto, vazio, negativo e mais de quatro valores", () => {
    expect(parseLoadValue("", "weight")).toBeNull();
    expect(parseLoadValue("10 + abc", "weight")).toBeNull();
    expect(parseLoadValue("10 +", "weight")).toBeNull();
    expect(parseLoadValue("-5", "weight")).toBeNull();
    expect(parseLoadValue("1+2+3+4+5", "weight")).toBeNull();
    expect(parseLoadValue("1+2+3+4", "weight")).not.toBeNull();
  });
});

describe("parseLoadValue (repetições)", () => {
  it("aceita inteiros e conjugados", () => {
    expect(parseLoadValue("12", "reps")).toEqual({ first: 12, text: null });
    expect(parseLoadValue("12 + 10", "reps")).toEqual({ first: 12, text: "12 + 10" });
  });

  it("recusa decimais", () => {
    expect(parseLoadValue("12.5", "reps")).toBeNull();
    expect(parseLoadValue("12 + 7,5", "reps")).toBeNull();
  });
});

describe("loadLabel", () => {
  it("mostra o texto conjugado quando existe", () => {
    expect(loadLabel(10, "10 + 15")).toBe("10 + 15");
    expect(loadLabel(20, null)).toBe("20");
    expect(loadLabel(20, undefined)).toBe("20");
  });
});
