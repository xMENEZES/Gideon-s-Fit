import { describe, expect, it } from "vitest";
import { cadastroSchema, definirSenhaSchema, loginSchema, redefinirSenhaSchema } from "@/lib/validations/auth.schema";

const STRONG = "Xk9!vT2#mQ7$";

describe("regras de senha nos formulários", () => {
  it("cadastro recusa senha sem as classes e aceita a forte", () => {
    const base = { role: "standard", fullName: "Ana Souza", email: "ana@example.com", acceptTerms: true } as const;
    const weak = cadastroSchema.safeParse({ ...base, password: "abcdefgh", confirmPassword: "abcdefgh" });
    expect(weak.success).toBe(false);
    expect(weak.error?.issues[0].message).toMatch(/precisa de/);
    expect(cadastroSchema.safeParse({ ...base, password: STRONG, confirmPassword: STRONG }).success).toBe(true);
  });

  it("redefinição e definição seguem a mesma regra e conferem a confirmação", () => {
    expect(redefinirSenhaSchema.safeParse({ password: "Senha@123", confirmPassword: "Senha@123" }).success).toBe(false);
    expect(redefinirSenhaSchema.safeParse({ password: STRONG, confirmPassword: STRONG }).success).toBe(true);
    expect(redefinirSenhaSchema.safeParse({ password: STRONG, confirmPassword: STRONG + "x" }).success).toBe(false);
    const named = { firstName: "Ana", lastName: "Souza" };
    expect(definirSenhaSchema.safeParse({ ...named, password: "abc12345", confirmPassword: "abc12345" }).success).toBe(false);
    expect(definirSenhaSchema.safeParse({ ...named, password: STRONG, confirmPassword: STRONG }).success).toBe(true);
  });

  it("o login continua aceitando senha antiga e fraca", () => {
    expect(loginSchema.safeParse({ email: "ana@example.com", password: "123456" }).success).toBe(true);
  });
});
