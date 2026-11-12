import { describe, expect, it } from "vitest";
import { equipmentLabel, isLoadEquipment, lastEquipment } from "@/lib/equipment";

describe("equipmentLabel", () => {
  it("traduz os quatro equipamentos", () => {
    expect(equipmentLabel("halter")).toBe("Halter");
    expect(equipmentLabel("maquina")).toBe("Máquina");
    expect(equipmentLabel("barra")).toBe("Barra");
    expect(equipmentLabel("cross")).toBe("Cross");
  });

  it("devolve vazio sem equipamento ou com valor desconhecido", () => {
    expect(equipmentLabel(null)).toBe("");
    expect(equipmentLabel(undefined)).toBe("");
    expect(equipmentLabel("polia")).toBe("");
  });
});

describe("isLoadEquipment", () => {
  it("aceita só os valores do app", () => {
    expect(isLoadEquipment("barra")).toBe(true);
    expect(isLoadEquipment("cross")).toBe(true);
    expect(isLoadEquipment("Barra")).toBe(false);
    expect(isLoadEquipment(3)).toBe(false);
  });
});

describe("lastEquipment", () => {
  it("é nulo sem registros ou sem nenhuma escolha", () => {
    expect(lastEquipment([])).toBeNull();
    expect(lastEquipment([{ logged_at: "2026-11-01", equipment: null }, { logged_at: "2026-11-02" }])).toBeNull();
  });

  it("usa o registro mais recente que tem equipamento, ignorando os sem escolha", () => {
    expect(
      lastEquipment([
        { logged_at: "2026-11-01", equipment: "halter" },
        { logged_at: "2026-11-03", equipment: "barra" },
        { logged_at: "2026-11-04", equipment: null },
      ])
    ).toBe("barra");
  });

  it("não depende da ordem em que os registros chegam", () => {
    expect(
      lastEquipment([
        { logged_at: "2026-11-03", equipment: "maquina" },
        { logged_at: "2026-11-01", equipment: "halter" },
      ])
    ).toBe("maquina");
  });

  it("no mesmo dia vale o registro feito por último", () => {
    expect(
      lastEquipment([
        { logged_at: "2026-11-03", created_at: "2026-11-03T13:00:00Z", equipment: "barra" },
        { logged_at: "2026-11-03", created_at: "2026-11-03T12:00:00Z", equipment: "halter" },
      ])
    ).toBe("barra");
  });

  it("ignora valores fora da lista", () => {
    expect(lastEquipment([{ logged_at: "2026-11-03", equipment: "polia" }])).toBeNull();
  });
});
