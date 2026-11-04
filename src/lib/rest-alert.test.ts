import { describe, expect, it } from "vitest";
import { flashSchedule, maxFlashesInOneSecond, MAX_FLASHES_PER_SECOND } from "@/lib/rest-alert";

describe("flashSchedule", () => {
  it("gera um acender e um apagar por piscada, em ordem", () => {
    expect(flashSchedule(2, 500, 300)).toEqual([
      { at: 0, on: true },
      { at: 300, on: false },
      { at: 500, on: true },
      { at: 800, on: false },
    ]);
  });

  it("não gera nada sem piscadas", () => {
    expect(flashSchedule(0, 500, 300)).toEqual([]);
  });

  it("alterna sempre acende, apaga, acende, apaga (nunca duas iguais seguidas)", () => {
    const events = flashSchedule(6, 500, 300);
    expect(events).toHaveLength(12);
    events.forEach((event, index) => expect(event.on).toBe(index % 2 === 0));
    const times = events.map((event) => event.at);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});

describe("maxFlashesInOneSecond", () => {
  it("o alarme de 6 piscadas a cada 0,5 s fica abaixo do limite de 3 por segundo", () => {
    const count = maxFlashesInOneSecond(flashSchedule(6, 500, 300));
    expect(count).toBe(2);
    expect(count).toBeLessThan(MAX_FLASHES_PER_SECOND + 1);
    expect(count).toBeLessThanOrEqual(MAX_FLASHES_PER_SECOND);
  });

  it("detecta um ritmo rápido demais", () => {
    expect(maxFlashesInOneSecond(flashSchedule(6, 200, 100))).toBe(5);
  });

  it("é zero sem piscadas", () => {
    expect(maxFlashesInOneSecond([])).toBe(0);
  });
});
