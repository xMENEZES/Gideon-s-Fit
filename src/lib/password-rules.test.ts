import { describe, expect, it } from "vitest";
import { PASSWORD_MAX, PASSWORD_MIN, isCommonPassword, passwordChecks, passwordProblem } from "@/lib/password-rules";

describe("passwordChecks", () => {
  it("marca cada regra separadamente", () => {
    const ok = (value: string) => Object.fromEntries(passwordChecks(value).map((c) => [c.id, c.ok]));
    expect(ok("abc")).toEqual({ length: false, lower: true, upper: false, digit: false, symbol: false });
    expect(ok("ABCDEFGH")).toMatchObject({ length: true, lower: false, upper: true });
    expect(ok("Abcdef1!")).toEqual({ length: true, lower: true, upper: true, digit: true, symbol: true });
  });

  it("só letras ASCII contam como maiúscula e minúscula (como o servidor)", () => {
    const ok = Object.fromEntries(passwordChecks("çççççççç").map((c) => [c.id, c.ok]));
    expect(ok.lower).toBe(false);
    expect(ok.upper).toBe(false);
  });

  it("aceita os símbolos do servidor e recusa espaço e acento como símbolo", () => {
    for (const symbol of "!@#$%^&*()_+-=[]{};':\"\\|<>?,./`~") {
      expect(passwordChecks(`a${symbol}`).find((c) => c.id === "symbol")?.ok).toBe(true);
    }
    expect(passwordChecks("a b").find((c) => c.id === "symbol")?.ok).toBe(false);
    expect(passwordChecks("aé").find((c) => c.id === "symbol")?.ok).toBe(false);
  });
});

describe("isCommonPassword", () => {
  it("pega a senha comum mesmo com número e símbolo", () => {
    for (const value of ["Senha@123", "Password1!", "Qwerty#2024", "MUDAR123!", "Gideons.Fit1"]) {
      expect(isCommonPassword(value)).toBe(true);
    }
  });

  it("pega uma letra só repetida", () => {
    expect(isCommonPassword("aaaaaaaa1!")).toBe(true);
  });

  it("não barra senha difícil nem sem letras", () => {
    expect(isCommonPassword("Xk9!vT2#mQ7$")).toBe(false);
    expect(isCommonPassword("12345678")).toBe(false);
    expect(isCommonPassword("")).toBe(false);
  });
});

describe("passwordProblem", () => {
  it("lista o que falta", () => {
    expect(passwordProblem("abc")).toBe("A senha precisa de: 8 caracteres, letra maiúscula, número, símbolo.");
    expect(passwordProblem("abcdefg1")).toBe("A senha precisa de: letra maiúscula, símbolo.");
  });

  it("avisa de senha comum quando as regras estão cumpridas", () => {
    expect(passwordProblem("Senha@123")).toMatch(/muito comum/);
  });

  it("recusa senha longa demais", () => {
    expect(passwordProblem("Aa1!".repeat(19))).toBe(`Use no máximo ${PASSWORD_MAX} caracteres.`);
  });

  it("aceita senha forte, inclusive no limite", () => {
    expect(passwordProblem("Xk9!vT2#mQ7$")).toBeNull();
    expect(passwordProblem("Xk9!vT2#".padEnd(PASSWORD_MIN, "z"))).toBeNull();
    expect(passwordProblem("Xk9!".repeat(18))).toBeNull(); // 72 caracteres
  });
});
