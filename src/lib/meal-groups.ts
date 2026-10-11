// Grupos de alternativas dos alimentos ("2 ovos OU 60 g de frango OU 80 g de atum").
// Itens da mesma opção de refeição com o mesmo `choice_group` são alternativas entre si e
// aparecem juntos, em carrossel. Funções puras, testadas em meal-groups.test.ts.

export const CHOICE_GROUP_MAX = 40;

type GroupableItem = { choice_group?: string | null; sort_order: number };

export type MealBlock<T> =
  | { kind: "single"; item: T }
  | { kind: "group"; label: string; items: T[] };

// Comparação do grupo sem diferenciar maiúsculas de minúsculas nem espaços nas pontas.
function groupKey(group: string | null | undefined): string | null {
  const key = group?.trim().toLocaleLowerCase("pt-BR");
  return key ? key : null;
}

// Ordena pelos itens (sort_order) e junta os de mesmo grupo no lugar do primeiro deles.
// Um grupo com um item só não é alternativa de ninguém: vira item comum.
export function groupMealItems<T extends GroupableItem>(items: T[]): MealBlock<T>[] {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

  const blocks: ({ kind: "single"; item: T } | { kind: "group"; key: string; label: string; items: T[] })[] = [];
  const byKey = new Map<string, { kind: "group"; key: string; label: string; items: T[] }>();

  for (const item of sorted) {
    const key = groupKey(item.choice_group);
    if (!key) {
      blocks.push({ kind: "single", item });
      continue;
    }
    const existing = byKey.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      const block = { kind: "group" as const, key, label: item.choice_group!.trim(), items: [item] };
      byKey.set(key, block);
      blocks.push(block);
    }
  }

  return blocks.map((block) =>
    block.kind === "group" && block.items.length === 1
      ? { kind: "single" as const, item: block.items[0] }
      : block.kind === "group"
        ? { kind: "group" as const, label: block.label, items: block.items }
        : block
  );
}

// Grupos já usados na opção (sem repetir, na ordem em que aparecem): sugestão ao digitar.
export function existingGroups(items: GroupableItem[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const item of [...items].sort((a, b) => a.sort_order - b.sort_order)) {
    const key = groupKey(item.choice_group);
    if (key && !seen.has(key)) {
      seen.add(key);
      labels.push(item.choice_group!.trim());
    }
  }
  return labels;
}
