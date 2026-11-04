import { describe, expect, it } from "vitest";
import {
  LABEL_MAX,
  MAX_PUSH_REST_SECONDS,
  MIN_PUSH_REST_SECONDS,
  canPush,
  msUntil,
  parseAlarmRequest,
  pushPayload,
} from "@/lib/rest-push";

describe("parseAlarmRequest", () => {
  it("aceita segundos inteiros dentro da faixa", () => {
    expect(parseAlarmRequest({ seconds: 90, label: "Supino reto" })).toEqual({ seconds: 90, label: "Supino reto" });
    expect(parseAlarmRequest({ seconds: MIN_PUSH_REST_SECONDS })).toEqual({ seconds: 5, label: null });
    expect(parseAlarmRequest({ seconds: MAX_PUSH_REST_SECONDS })).toEqual({ seconds: 240, label: null });
  });

  it("recusa segundos fora da faixa, decimais, texto ou ausentes", () => {
    for (const seconds of [0, 4, 241, 3600, -10, 12.5, "90", null, undefined, NaN]) {
      expect(parseAlarmRequest({ seconds })).toHaveProperty("error");
    }
  });

  it("recusa corpo que não é objeto", () => {
    for (const input of [null, undefined, "90", 90, []]) {
      expect(parseAlarmRequest(input)).toHaveProperty("error");
    }
  });

  it("ajusta o nome do exercício: espaços, vazio e tamanho", () => {
    expect(parseAlarmRequest({ seconds: 60, label: "  Supino   reto " })).toEqual({ seconds: 60, label: "Supino reto" });
    expect(parseAlarmRequest({ seconds: 60, label: "   " })).toEqual({ seconds: 60, label: null });
    expect(parseAlarmRequest({ seconds: 60, label: 42 })).toEqual({ seconds: 60, label: null });
    const long = parseAlarmRequest({ seconds: 60, label: "x".repeat(300) });
    expect("label" in long && long.label).toHaveLength(LABEL_MAX);
  });
});

describe("canPush", () => {
  it("vale só dentro da faixa e para inteiros", () => {
    expect(canPush(60)).toBe(true);
    expect(canPush(240)).toBe(true);
    expect(canPush(241)).toBe(false);
    expect(canPush(4)).toBe(false);
    expect(canPush(60.5)).toBe(false);
  });
});

describe("pushPayload", () => {
  it("usa o nome do exercício quando há", () => {
    expect(pushPayload("Supino reto")).toEqual({
      title: "Descanso terminou",
      body: "Hora da próxima série: Supino reto.",
      url: "/",
      tag: "rest-timer",
    });
  });

  it("tem texto padrão sem nome", () => {
    expect(pushPayload(null).body).toBe("Hora da próxima série.");
  });
});

describe("msUntil", () => {
  const now = Date.parse("2026-11-04T12:00:00.000Z");

  it("calcula quanto falta", () => {
    expect(msUntil("2026-11-04T12:01:30.000Z", now)).toBe(90_000);
  });

  it("nunca é negativo (horário já passou)", () => {
    expect(msUntil("2026-11-04T11:59:00.000Z", now)).toBe(0);
  });

  it("data inválida vale zero", () => {
    expect(msUntil("não é data", now)).toBe(0);
  });
});
