// Dados do gráfico de carga (histórico de um exercício). Regras puras, sem tela.

export type LoadChartLog = {
  logged_at: string;
  weight_kg: number;
  // Exercício conjugado: o texto completo ("10 + 15"); o gráfico usa o primeiro valor.
  weight_text?: string | null;
};

export type LoadChartPoint = {
  // Data do dia treinado, "dd/mm", mostrada embaixo de cada ponto.
  date: string;
  carga: number;
  texto: string;
};

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

// `logged_at` é uma data (sem horário). Formatar em UTC evita perder um dia quando o fuso do
// navegador fica atrás de UTC (ex.: Brasil).
export function formatChartDate(loggedAt: string): string {
  return DATE_FORMAT.format(new Date(loggedAt));
}

export function toChartData(logs: LoadChartLog[]): LoadChartPoint[] {
  return logs.map((log) => ({
    date: formatChartDate(log.logged_at),
    carga: log.weight_kg,
    texto: log.weight_text ?? String(log.weight_kg),
  }));
}
