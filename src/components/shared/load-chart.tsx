"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toChartData, type LoadChartLog } from "@/lib/load-chart-data";

export type LoadLogPoint = LoadChartLog;

export function LoadChart({ logs }: { logs: LoadLogPoint[] }) {
  if (logs.length < 2) return null;

  const data = toChartData(logs);

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
          {/* `interval={0}` mostra a data de TODOS os dias treinados (por padrão o gráfico esconde
              os rótulos que "se sobrepõem", e as datas sumiam). O espaço nas bordas evita cortar o
              primeiro e o último ponto e deixa o rótulo da ponta inteiro. */}
          <XAxis
            dataKey="date"
            interval={0}
            padding={{ left: 16, right: 16 }}
            tickMargin={4}
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
            formatter={(value, _name, item) => [`${item?.payload?.texto ?? value} kg`, "Carga"]}
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
