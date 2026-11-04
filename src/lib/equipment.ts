// Equipamento com que a carga foi feita. Opcional no registro; os valores são os mesmos da
// restrição do banco (migração 0032).
export const LOAD_EQUIPMENT = ["halter", "maquina", "barra"] as const;
export type LoadEquipment = (typeof LOAD_EQUIPMENT)[number];

const LABELS: Record<LoadEquipment, string> = {
  halter: "Halter",
  maquina: "Máquina",
  barra: "Barra",
};

export function isLoadEquipment(value: unknown): value is LoadEquipment {
  return typeof value === "string" && (LOAD_EQUIPMENT as readonly string[]).includes(value);
}

// Texto para mostrar; vazio quando não há equipamento (ou o valor é desconhecido).
export function equipmentLabel(value: string | null | undefined): string {
  return isLoadEquipment(value) ? LABELS[value] : "";
}

export const EQUIPMENT_OPTIONS = LOAD_EQUIPMENT.map((value) => ({ value, label: LABELS[value] }));

// Última escolha de equipamento do exercício: o registro mais recente que tem equipamento
// (por data e, no mesmo dia, pela hora do registro). Sem nenhuma escolha, nulo.
export function lastEquipment(
  logs: { logged_at: string; created_at?: string | null; equipment?: string | null }[]
): LoadEquipment | null {
  let best: { key: string; value: LoadEquipment } | null = null;
  for (const log of logs) {
    if (!isLoadEquipment(log.equipment)) continue;
    const key = `${log.logged_at}|${log.created_at ?? ""}`;
    if (!best || key >= best.key) best = { key, value: log.equipment };
  }
  return best?.value ?? null;
}
