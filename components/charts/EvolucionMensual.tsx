"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCOP } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";

interface MesData {
  mes: string;
  ingresos: number;
  egresos: number;
}

function shortMes(mesKey: string) {
  const [year, month] = mesKey.split("-");
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Number(year), Number(month) - 1, 1));
}

export function EvolucionMensual({ data }: { data: MesData[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Evolución mensual
        </h2>
        <p className="text-sm text-slate-500 py-6 text-center">Sin datos disponibles</p>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: shortMes(d.mes),
  }));

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-slate-200 mb-4">
        Evolución últimos meses
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M`
                : v >= 1_000
                ? `${(v / 1_000).toFixed(0)}k`
                : String(v)
            }
            width={45}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 12,
              fontSize: 12,
            }}
            itemStyle={{ color: "#e2e8f0" }}
            labelStyle={{ color: "#94a3b8" }}
            cursor={{ fill: "rgba(148, 163, 184, 0.06)" }}
            formatter={(value, name) => [
              formatCOP(typeof value === "number" ? value : 0),
              name === "ingresos" ? "Ingresos" : "Egresos",
            ]}
          />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-slate-400">
                {value === "ingresos" ? "Ingresos" : "Egresos"}
              </span>
            )}
          />
          <Bar dataKey="ingresos" fill="#34d399" radius={[3, 3, 0, 0]} />
          <Bar dataKey="egresos" fill="#fb7185" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
