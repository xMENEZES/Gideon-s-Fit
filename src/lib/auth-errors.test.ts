import { describe, expect, it } from "vitest";
import { CAPTCHA_MESSAGE, RATE_LIMIT_MESSAGE, passwordErrorMessage } from "@/lib/auth-errors";

const FALLBACK = "Não foi possível.";

describe("passwordErrorMessage", () => {
  it("usa a frase padrão quando não há erro conhecido", () => {
    expect(passwordErrorMessage(null, FALLBACK)).toBe(FALLBACK);
    expect(passwordErrorMessage({ status: 400, code: "validation_failed" }, FALLBACK)).toBe(FALLBACK);
  });

  it("explica o limite de tentativas", () => {
    expect(passwordErrorMessage({ status: 429 }, FALLBACK)).toBe(RATE_LIMIT_MESSAGE);
    expect(passwordErrorMessage({ code: "over_request_rate_limit" }, FALLBACK)).toBe(RATE_LIMIT_MESSAGE);
  });

  it("explica a falha da verificação de segurança (CAPTCHA)", () => {
    expect(passwordErrorMessage({ status: 400, code: "captcha_failed" }, FALLBACK)).toBe(CAPTCHA_MESSAGE);
  });

  it("explica senha fraca e senha repetida", () => {
    expect(passwordErrorMessage({ status: 422, code: "weak_password" }, FALLBACK)).toMatch(/regras de segurança/);
    expect(passwordErrorMessage({ status: 422, code: "same_password" }, FALLBACK)).toMatch(/diferente/);
  });
});
