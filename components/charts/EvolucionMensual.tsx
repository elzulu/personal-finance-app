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
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Evolución mensual
        </h2>
        <p className="text-sm text-gray-400 py-6 text-center">Sin datos disponibles</p>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: shortMes(d.mes),
  }));

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Evolución últimos meses
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b7280" }}
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
            formatter={(value, name) => [
              formatCOP(typeof value === "number" ? value : 0),
              name === "ingresos" ? "Ingresos" : "Egresos",
            ]}
          />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-gray-600">
                {value === "ingresos" ? "Ingresos" : "Egresos"}
              </span>
            )}
          />
          <Bar dataKey="ingresos" fill="#22c55e" radius={[3, 3, 0, 0]} />
          <Bar dataKey="egresos" fill="#ef4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
