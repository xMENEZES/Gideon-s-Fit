"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type LoadLogPoint = {
  logged_at: string;
  weight_kg: number;
};

export function LoadChart({ logs }: { logs: LoadLogPoint[] }) {
  if (logs.length < 2) return null;

  const data = logs.map((log) => ({
    // logged_at é uma data (sem horário); formatar em UTC evita perder um dia
    // quando o fuso do navegador fica atrás de UTC (ex: Brasil).
    date: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    }).format(new Date(log.logged_at)),
    carga: log.weight_kg,
  }));

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [`${value} kg`, "Carga"]}
          />
          <Line
            type="monotone"
            dataKey="carga"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--primary)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
