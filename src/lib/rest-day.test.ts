import { describe, expect, it } from "vitest";
import { restDayError } from "@/lib/rest-day";

const TODAY = "2026-10-30";

describe("restDayError", () => {
  it("aceita hoje e dias anteriores", () => {
    expect(restDayError("2026-10-30", TODAY)).toBeNull();
    expect(restDayError("2026-10-29", TODAY)).toBeNull();
    expect(restDayError("2026-01-01", TODAY)).toBeNull();
  });

  it("recusa dia futuro", () => {
    expect(restDayError("2026-10-31", TODAY)).toMatch(/hoje ou um dia que já passou/);
  });

  it("recusa mais de 400 dias atrás, mas aceita o limite", () => {
    expect(restDayError("2025-09-25", TODAY)).toBeNull(); // 400 dias antes de 30/10/2026
    expect(restDayError("2025-09-24", TODAY)).toMatch(/400 dias/);
  });

  it("recusa data em formato inválido", () => {
    expect(restDayError("30/10/2026", TODAY)).toBe("Data inválida.");
    expect(restDayError("2026-13-40", TODAY)).toBe("Data inválida.");
    expect(restDayError("", TODAY)).toBe("Data inválida.");
  });
});
