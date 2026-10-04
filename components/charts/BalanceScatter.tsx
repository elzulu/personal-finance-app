"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { formatCOP } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";
import { ChartFrame } from "@/components/charts/ChartFrame";

interface MesData {
  mes: string;
  ingresos: number;
  egresos: number;
}

function shortMes(mesKey: string) {
  const [year, month] = mesKey.split("-");
  return new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit", timeZone: "UTC" }).format(
    new Date(Number(year), Number(month) - 1, 1)
  );
}

function BalanceDot(props: { cx?: number; cy?: number; payload?: { saldo: number } }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  const positive = payload.saldo >= 0;
  const color = positive ? "#34d399" : "#fb7185";
  // Forma distinta además del color: círculo = positivo, rombo = negativo
  if (!positive) {
    return (
      <rect
        x={cx - 5}
        y={cy - 5}
        width={10}
        height={10}
        transform={`rotate(45 ${cx} ${cy})`}
        fill={color}
        stroke={color}
        strokeOpacity={0.3}
        strokeWidth={6}
      />
    );
  }
  return (
    <circle cx={cx} cy={cy} r={6} fill={color} stroke={color} strokeOpacity={0.3} strokeWidth={6} />
  );
}

export function BalanceScatter({ data }: { data: MesData[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">Balance por mes</h2>
        <p className="text-sm text-slate-400 py-6 text-center">Sin datos disponibles</p>
      </Card>
    );
  }

  const points = data.map((d) => ({
    label: shortMes(d.mes),
    saldo: d.ingresos - d.egresos,
  }));

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-slate-200 mb-1">Balance por mes</h2>
      <p className="text-xs text-slate-400 mb-4">Ingresos − Egresos de cada mes</p>
      <ChartFrame
        label="Balance por mes: ingresos menos egresos"
        columns={["Mes", "Balance"]}
        rows={points.map((pt) => [pt.label, formatCOP(pt.saldo)])}
      >
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={points} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
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
              Math.abs(v) >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M`
                : Math.abs(v) >= 1_000
                ? `${(v / 1_000).toFixed(0)}k`
                : String(v)
            }
            width={45}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "#334155" }}
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 12,
              fontSize: 12,
            }}
            itemStyle={{ color: "#e2e8f0" }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value) => [formatCOP(typeof value === "number" ? value : 0), "Saldo"]}
          />
          <Line
            dataKey="saldo"
            stroke="#475569"
            strokeWidth={2}
            dot={BalanceDot}
            activeDot={{ r: 7 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </ChartFrame>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" aria-hidden /> Positivo (círculo)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rotate-45 bg-rose-400" aria-hidden /> Negativo (rombo)
        </span>
      </div>
    </Card>
  );
}
