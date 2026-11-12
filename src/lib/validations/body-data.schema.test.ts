import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { bodyDataRequiredSchema, bodyDataSchema } from "@/lib/validations/body-data.schema";

// "Hoje" fixo (12/11/2026, meio-dia em Brasília) para a idade não depender do dia em que o teste roda.
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-12T15:00:00Z"));
});
afterAll(() => {
  vi.useRealTimers();
});

function ok(input: Record<string, unknown>) {
  const result = bodyDataSchema.safeParse(input);
  expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  return result.data!;
}

function messages(input: Record<string, unknown>): string[] {
  const result = bodyDataSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("bodyDataSchema", () => {
  it("aceita só a data de nascimento (altura e peso são opcionais)", () => {
    const data = ok({ birthDate: "1990-05-10" });
    expect(data.heightCm).toBeUndefined();
    expect(data.weightKg).toBeUndefined();
  });

  it("converte altura e peso escritos como texto, inclusive com vírgula", () => {
    const data = ok({ birthDate: "1990-05-10", heightCm: "175", weightKg: "72,5" });
    expect(data.heightCm).toBe(175);
    expect(data.weightKg).toBe(72.5);
  });

  it("campos em branco valem 'não informado'", () => {
    const data = ok({ birthDate: "1990-05-10", heightCm: "", weightKg: "  " });
    expect(data.heightCm).toBeUndefined();
    expect(data.weightKg).toBeUndefined();
  });

  describe("data de nascimento", () => {
    it("é obrigatória", () => {
      expect(messages({ birthDate: "" })).toContain("Informe a data de nascimento");
      expect(messages({})).toContain("Informe a data de nascimento");
    });

    it("aceita 18 anos hoje e recusa quem ainda não fez 18", () => {
      ok({ birthDate: "2008-11-12" });
      expect(messages({ birthDate: "2008-11-13" })).toContain("Os dados de saúde são só para maiores de 18 anos");
    });

    it("recusa data futura, muito antiga e inexistente", () => {
      expect(messages({ birthDate: "2027-01-01" })).toContain("Os dados de saúde são só para maiores de 18 anos");
      expect(messages({ birthDate: "1926-11-11" })).toContain("Informe uma data de nascimento válida");
      expect(messages({ birthDate: "1990-02-31" })).toContain("Informe uma data de nascimento válida");
    });
  });

  describe("altura (cm)", () => {
    it("aceita de 100 a 250", () => {
      ok({ birthDate: "1990-05-10", heightCm: 100 });
      ok({ birthDate: "1990-05-10", heightCm: 250 });
    });

    it("recusa 99, 251, decimais e texto", () => {
      const range = "Altura entre 100 e 250 cm";
      expect(messages({ birthDate: "1990-05-10", heightCm: 99 })).toContain(range);
      expect(messages({ birthDate: "1990-05-10", heightCm: 251 })).toContain(range);
      expect(messages({ birthDate: "1990-05-10", heightCm: "175.5" })).toContain("Altura: informe um número inteiro em cm");
      expect(messages({ birthDate: "1990-05-10", heightCm: "alto" })).toContain("Altura: informe um número inteiro em cm");
    });
  });

  describe("peso (kg)", () => {
    it("aceita de 30 a 300, com uma casa decimal", () => {
      ok({ birthDate: "1990-05-10", weightKg: 30 });
      ok({ birthDate: "1990-05-10", weightKg: 300 });
      expect(ok({ birthDate: "1990-05-10", weightKg: "72.5" }).weightKg).toBe(72.5);
    });

    it("recusa 29,9, 300,1, duas casas decimais e texto", () => {
      const range = "Peso entre 30 e 300 kg";
      expect(messages({ birthDate: "1990-05-10", weightKg: "29,9" })).toContain(range);
      expect(messages({ birthDate: "1990-05-10", weightKg: "300,1" })).toContain(range);
      expect(messages({ birthDate: "1990-05-10", weightKg: "72,55" })).toContain("Use no máximo uma casa decimal (ex.: 72,5)");
      expect(messages({ birthDate: "1990-05-10", weightKg: "pesado" })).toContain("Peso: informe um número em kg (ex.: 72,5)");
    });
  });
});

describe("bodyDataRequiredSchema (gerador de treino)", () => {
  const issues = (input: Record<string, unknown>) => {
    const result = bodyDataRequiredSchema.safeParse(input);
    return result.success ? [] : result.error.issues.map((issue) => issue.message);
  };

  it("exige altura e peso além da data de nascimento", () => {
    expect(issues({ birthDate: "1990-05-10" })).toEqual(["Informe a altura em cm", "Informe o peso em kg"]);
    expect(issues({ birthDate: "1990-05-10", heightCm: "", weightKg: "" })).toEqual([
      "Informe a altura em cm",
      "Informe o peso em kg",
    ]);
    expect(issues({ birthDate: "1990-05-10", heightCm: "175" })).toEqual(["Informe o peso em kg"]);
    expect(issues({ birthDate: "1990-05-10", weightKg: "72,5" })).toEqual(["Informe a altura em cm"]);
  });

  it("aceita os três e mantém as mesmas regras de faixa e idade", () => {
    expect(issues({ birthDate: "1990-05-10", heightCm: "175", weightKg: "72,5" })).toEqual([]);
    expect(issues({ birthDate: "2008-11-13", heightCm: "175", weightKg: "72,5" })).toContain(
      "Os dados de saúde são só para maiores de 18 anos"
    );
    expect(issues({ birthDate: "1990-05-10", heightCm: "99", weightKg: "72,5" })).toContain("Altura entre 100 e 250 cm");
  });
});

