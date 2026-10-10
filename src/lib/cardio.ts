// Cardio: atividades, formatação de metas e de sessões. Funções puras (testadas em cardio.test.ts).

export const CARDIO_ACTIVITIES = [
  "Corrida",
  "Caminhada",
  "Bicicleta",
  "Esteira",
  "Elíptico",
  "Natação",
  "Remo",
  "Pular corda",
] as const;

// Valor interno do item "Outro" no menu de atividades (nunca é salvo).
export const OTHER_ACTIVITY = "__outro__";

export function isKnownActivity(name: string): boolean {
  return (CARDIO_ACTIVITIES as readonly string[]).includes(name);
}

// 45 -> "45 min"; 60 -> "1 h"; 90 -> "1 h 30 min"
export function formatMinutes(minutes: number): string {
  const total = Math.round(minutes);
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

// 5 -> "5 km"; 3.5 -> "3,5 km"
export function formatKm(km: number): string {
  return `${Number(km).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km`;
}

// Meta ou sessão: "30 min", "5 km", "30 min, 5 km". Vazio se não há nenhum dos dois.
export function formatCardioAmount(
  minutes: number | null | undefined,
  km: number | null | undefined
): string {
  const parts: string[] = [];
  if (minutes != null) parts.push(formatMinutes(minutes));
  if (km != null) parts.push(formatKm(km));
  return parts.join(", ");
}
