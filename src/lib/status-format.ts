// Formatação de datas "YYYY-MM-DD" para a tela de Status (sem passar por fuso horário).
export const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

// "2026-10-09" -> "09/10/2026"
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

// "2026-10-09" -> "09/10"
export function formatShort(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

// "2026-10-09" -> "sex"
export function weekday(iso: string): string {
  return WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()];
}
