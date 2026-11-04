// Catálogo de exercícios (migração 0033): sugestões de nome ao montar o treino. O nome do exercício
// continua texto livre; o catálogo só sugere. Aqui ficam as regras puras (sem banco nem tela).
export const MUSCLE_GROUPS = [
  "peito",
  "costas",
  "ombros",
  "biceps",
  "triceps",
  "antebraco",
  "abdomen",
  "gluteos",
  "coxas",
  "panturrilha",
  "corpo_todo",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  peito: "Peito",
  costas: "Costas",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebraco: "Antebraço",
  abdomen: "Abdômen",
  gluteos: "Glúteos",
  coxas: "Coxas",
  panturrilha: "Panturrilha",
  corpo_todo: "Corpo todo",
};

export const NAME_MIN = 2;
export const NAME_MAX = 120;
export const SUGGESTION_LIMIT = 8;

export type CatalogItem = {
  id: string;
  name: string;
  group: MuscleGroup;
  // Nome guardado pela própria pessoa (pode ser removido); os do sistema não saem.
  own: boolean;
};

export function isMuscleGroup(value: unknown): value is MuscleGroup {
  return typeof value === "string" && (MUSCLE_GROUPS as readonly string[]).includes(value);
}

// Para comparar e buscar: sem acento, sem maiúsculas e com um espaço só entre as palavras.
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Nome pronto para guardar (espaços ajustados), ou nulo se for curto ou longo demais.
export function cleanCatalogName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  return name.length >= NAME_MIN && name.length <= NAME_MAX ? name : null;
}

// O nome digitado já existe no catálogo (do sistema ou da pessoa)?
export function isInCatalog(items: CatalogItem[], name: string): boolean {
  const wanted = normalizeName(name);
  return wanted !== "" && items.some((item) => normalizeName(item.name) === wanted);
}

// Sugestões para o que a pessoa digitou: a partir de 2 letras, sem diferenciar acento nem
// maiúsculas, com todas as palavras digitadas presentes no nome. Primeiro os que começam pelo
// texto, depois os que têm uma palavra começando por ele, depois os demais; no mesmo grupo, os
// nomes da própria pessoa vêm antes. Nome repetido (do sistema e da pessoa) aparece uma vez só,
// o da pessoa, que ela pode remover.
export function filterCatalog(items: CatalogItem[], query: string, limit = SUGGESTION_LIMIT): CatalogItem[] {
  const q = normalizeName(query);
  if (q.length < NAME_MIN) return [];
  const tokens = q.split(" ");

  const ranked: { item: CatalogItem; norm: string; rank: number }[] = [];
  for (const item of items) {
    const norm = normalizeName(item.name);
    if (!tokens.every((token) => norm.includes(token))) continue;
    const words = norm.split(" ");
    const rank = norm.startsWith(q) ? 0 : words.some((word) => word.startsWith(tokens[0])) ? 1 : 2;
    ranked.push({ item, norm, rank });
  }

  ranked.sort(
    (a, b) =>
      a.rank - b.rank ||
      Number(b.item.own) - Number(a.item.own) ||
      a.norm.localeCompare(b.norm, "pt-BR")
  );

  const seen = new Set<string>();
  const result: CatalogItem[] = [];
  for (const { item, norm } of ranked) {
    if (seen.has(norm)) continue;
    seen.add(norm);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}
