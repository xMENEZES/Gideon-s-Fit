import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GENERATOR_EXERCISES, type Equipment, type Joint, type Level, type MuscleGroup, type Pattern } from "./catalog";

const EQUIPMENT: Equipment[] = ["corpo", "halter", "barra", "maquina", "polia", "smith", "kettlebell", "estrutura", "acessorio"];
const PATTERNS: Pattern[] = ["agachar", "avanco", "dobrar_quadril", "empurrar_h", "empurrar_v", "puxar_h", "puxar_v", "core", "isolado", "corpo_todo"];
const LEVELS: Level[] = ["iniciante", "intermediario", "avancado"];
const JOINTS: Joint[] = ["joelho", "ombro", "coluna"];
const GROUPS: MuscleGroup[] = ["peito", "costas", "ombros", "biceps", "triceps", "antebraco", "abdomen", "gluteos", "coxas", "panturrilha", "corpo_todo"];

describe("classificação dos exercícios do gerador", () => {
  it("tem 152 exercícios do catálogo e 9 novos propostos", () => {
    expect(GENERATOR_EXERCISES).toHaveLength(161);
    expect(GENERATOR_EXERCISES.filter((e) => e.isNew)).toHaveLength(9);
  });

  it("não repete nomes (ignorando maiúsculas)", () => {
    const names = GENERATOR_EXERCISES.map((e) => e.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("usa só valores válidos em todos os campos", () => {
    for (const e of GENERATOR_EXERCISES) {
      expect(GROUPS, e.name).toContain(e.group);
      expect(EQUIPMENT, e.name).toContain(e.equipment);
      expect(PATTERNS, e.name).toContain(e.pattern);
      expect(LEVELS, e.name).toContain(e.minLevel);
      expect(["baixo", "alto"], e.name).toContain(e.impact);
      for (const joint of e.joints) expect(JOINTS, e.name).toContain(joint);
      expect(e.name.trim().length, e.name).toBeGreaterThan(1);
    }
  });

  it("os exercícios que não são novos existem no catálogo de sugestões do banco (nome idêntico)", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/0033_exercise_catalog.sql"), "utf8");
    const inCatalog = new Set([...sql.matchAll(/\('([^']+)',\s*'([a-z_]+)'\)/g)].map((m) => m[1]));
    const missing = GENERATOR_EXERCISES.filter((e) => !e.isNew && !inCatalog.has(e.name)).map((e) => e.name);
    expect(missing).toEqual([]);
  });

  it("os novos propostos ainda não existem no catálogo do banco (para não ficarem duplicados)", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/0033_exercise_catalog.sql"), "utf8");
    const inCatalog = new Set([...sql.matchAll(/\('([^']+)',\s*'([a-z_]+)'\)/g)].map((m) => m[1]));
    expect(GENERATOR_EXERCISES.filter((e) => e.isNew && inCatalog.has(e.name))).toEqual([]);
  });

  it("os exercícios de impacto alto são só os de salto", () => {
    expect(GENERATOR_EXERCISES.filter((e) => e.impact === "alto").map((e) => e.name).sort()).toEqual(
      ["Agachamento com salto", "Burpee", "Polichinelo", "Salto no caixote"].sort()
    );
  });

  it("os exercícios por tempo são os esperados", () => {
    expect(GENERATOR_EXERCISES.filter((e) => e.timed).map((e) => e.name).sort()).toEqual(
      ["Agachamento na parede", "Caminhada do fazendeiro", "Corda naval", "Prancha", "Prancha lateral"].sort()
    );
  });

  it("as articulações marcadas existem só em exercícios que as sobrecarregam de forma conhecida", () => {
    const withJoint = (joint: Joint) => GENERATOR_EXERCISES.filter((e) => e.joints.includes(joint)).map((e) => e.name);
    // Pontos de referência: agachamentos e avanços pesam no joelho; terra e stiff, na coluna;
    // desenvolvimento e supino, no ombro.
    expect(withJoint("joelho")).toEqual(expect.arrayContaining(["Agachamento livre com barra", "Avanço com halteres", "Leg press 45 graus"]));
    expect(withJoint("coluna")).toEqual(expect.arrayContaining(["Levantamento terra", "Stiff com barra", "Remada curvada com barra"]));
    expect(withJoint("ombro")).toEqual(expect.arrayContaining(["Desenvolvimento com barra", "Supino reto com barra", "Barra fixa"]));
  });
});

// Cobertura: quantas opções o gerador tem por tipo de movimento, por local e nível. Os números vêm
// da análise do rascunho (planilha de revisão) e protegem contra uma edição que deixe um local sem opção.
describe("cobertura da classificação", () => {
  const LOCATION_EQUIPMENT: Record<string, Equipment[]> = {
    academia: ["corpo", "halter", "barra", "maquina", "polia", "smith", "kettlebell", "estrutura", "acessorio"],
    casa_halteres: ["corpo", "halter", "kettlebell"],
    casa_sem_equipamento: ["corpo"],
  };

  function count(location: string, level: Level, filter: (e: (typeof GENERATOR_EXERCISES)[number]) => boolean): number {
    const bench = location === "academia";
    return GENERATOR_EXERCISES.filter(
      (e) =>
        LOCATION_EQUIPMENT[location].includes(e.equipment) &&
        (bench || !e.needsBench) &&
        LEVELS.indexOf(e.minLevel) <= LEVELS.indexOf(level) &&
        e.impact === "baixo" &&
        filter(e)
    ).length;
  }

  const patterns: [string, (e: (typeof GENERATOR_EXERCISES)[number]) => boolean][] = [
    ["agachar ou avanço", (e) => e.pattern === "agachar" || e.pattern === "avanco"],
    ["dobrar o quadril", (e) => e.pattern === "dobrar_quadril"],
    ["empurrar horizontal", (e) => e.pattern === "empurrar_h"],
    ["abdômen", (e) => e.pattern === "core"],
  ];

  it.each(LEVELS)("a academia tem ao menos 2 opções de cada movimento principal no nível %s", (level) => {
    for (const [name, filter] of patterns) expect(count("academia", level, filter), name).toBeGreaterThanOrEqual(2);
    expect(count("academia", level, (e) => e.pattern === "puxar_v" && e.group === "costas"), "puxar vertical").toBeGreaterThanOrEqual(2);
    expect(count("academia", level, (e) => e.pattern === "puxar_h" && e.group === "costas"), "puxar horizontal").toBeGreaterThanOrEqual(2);
    expect(count("academia", level, (e) => e.pattern === "empurrar_v" && e.group === "ombros"), "empurrar vertical").toBeGreaterThanOrEqual(2);
  });

  it.each(LEVELS)("em casa, com ou sem halteres, agachar, quadril, empurrar e abdômen têm opções no nível %s", (level) => {
    for (const location of ["casa_halteres", "casa_sem_equipamento"]) {
      for (const [name, filter] of patterns) expect(count(location, level, filter), `${location}: ${name}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("registra a limitação conhecida: sem equipamento não há exercício de puxar", () => {
    for (const level of LEVELS) {
      expect(count("casa_sem_equipamento", level, (e) => e.pattern === "puxar_h" || e.pattern === "puxar_v")).toBe(0);
    }
  });
});
