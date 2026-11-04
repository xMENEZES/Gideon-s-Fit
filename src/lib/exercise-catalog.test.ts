import { describe, expect, it } from "vitest";
import {
  cleanCatalogName,
  filterCatalog,
  isInCatalog,
  isMuscleGroup,
  normalizeName,
  type CatalogItem,
} from "@/lib/exercise-catalog";

const item = (name: string, group: CatalogItem["group"] = "peito", own = false): CatalogItem => ({
  id: `${own ? "own" : "sys"}-${name}`,
  name,
  group,
  own,
});

const CATALOG = [
  item("Supino reto com barra"),
  item("Supino inclinado com halteres"),
  item("Crucifixo reto com halteres"),
  item("Rosca direta com barra", "biceps"),
  item("Agachamento livre com barra", "coxas"),
  item("Elevação pélvica com barra", "gluteos"),
  item("Barra fixa", "costas"),
];

describe("normalizeName", () => {
  it("tira acento, maiúsculas e espaços repetidos", () => {
    expect(normalizeName("  Elevação   PÉLVICA ")).toBe("elevacao pelvica");
  });
});

describe("cleanCatalogName", () => {
  it("ajusta espaços e recusa nome curto ou longo demais", () => {
    expect(cleanCatalogName("  Supino   reto ")).toBe("Supino reto");
    expect(cleanCatalogName("a")).toBeNull();
    expect(cleanCatalogName("   ")).toBeNull();
    expect(cleanCatalogName("x".repeat(121))).toBeNull();
    expect(cleanCatalogName("x".repeat(120))).toHaveLength(120);
  });
});

describe("isMuscleGroup", () => {
  it("aceita só os grupos do banco", () => {
    expect(isMuscleGroup("peito")).toBe(true);
    expect(isMuscleGroup("corpo_todo")).toBe(true);
    expect(isMuscleGroup("Peito")).toBe(false);
    expect(isMuscleGroup("cabeca")).toBe(false);
  });
});

describe("isInCatalog", () => {
  it("compara sem acento nem maiúsculas", () => {
    expect(isInCatalog(CATALOG, "ELEVACAO pelvica com barra")).toBe(true);
    expect(isInCatalog(CATALOG, "Supino reto")).toBe(false);
    expect(isInCatalog(CATALOG, "")).toBe(false);
  });
});

describe("filterCatalog", () => {
  it("só sugere a partir de 2 letras", () => {
    expect(filterCatalog(CATALOG, "")).toEqual([]);
    expect(filterCatalog(CATALOG, "s")).toEqual([]);
    expect(filterCatalog(CATALOG, "su").map((i) => i.name)).toEqual([
      "Supino inclinado com halteres",
      "Supino reto com barra",
    ]);
  });

  it("não diferencia acento nem maiúsculas", () => {
    expect(filterCatalog(CATALOG, "ELEVACAO").map((i) => i.name)).toEqual(["Elevação pélvica com barra"]);
    expect(filterCatalog(CATALOG, "pelvica").map((i) => i.name)).toEqual(["Elevação pélvica com barra"]);
  });

  it("exige todas as palavras digitadas, em qualquer ordem", () => {
    expect(filterCatalog(CATALOG, "barra supino").map((i) => i.name)).toEqual(["Supino reto com barra"]);
    expect(filterCatalog(CATALOG, "supino agachamento")).toEqual([]);
  });

  it("põe primeiro os que começam pelo texto", () => {
    const names = filterCatalog(CATALOG, "barra").map((i) => i.name);
    expect(names[0]).toBe("Barra fixa");
    expect(names).toContain("Supino reto com barra");
  });

  it("respeita o limite de sugestões", () => {
    const many = Array.from({ length: 20 }, (_, i) => item(`Supino variação ${String(i).padStart(2, "0")}`));
    expect(filterCatalog(many, "supino")).toHaveLength(8);
    expect(filterCatalog(many, "supino", 3)).toHaveLength(3);
  });

  it("mostra os nomes da própria pessoa antes, e um nome repetido uma vez só (o da pessoa)", () => {
    const items = [
      item("Supino reto com barra"),
      item("Supino reto com barra", "peito", true),
      item("Supino alternado", "peito", true),
    ];
    const result = filterCatalog(items, "supino");
    expect(result.map((i) => i.name)).toEqual(["Supino alternado", "Supino reto com barra"]);
    expect(result.every((i) => i.own)).toBe(true);
  });

  it("não encontra o que não existe", () => {
    expect(filterCatalog(CATALOG, "zzz")).toEqual([]);
  });
});
