import { addDays, isIsoDate } from "@/lib/dates";

// Mesmo limite da política do banco (0030): do dia de hoje até 400 dias atrás.
export const REST_DAY_WINDOW_DAYS = 400;

// Mensagem de erro se a data não pode ser marcada como dia de descanso; nulo se pode.
export function restDayError(date: string, today: string): string | null {
  if (!isIsoDate(date)) return "Data inválida.";
  if (date > today) return "Só dá para marcar hoje ou um dia que já passou.";
  if (date < addDays(today, -REST_DAY_WINDOW_DAYS)) return "Só dá para marcar os últimos 400 dias.";
  return null;
}
