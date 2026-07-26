"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
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
  return new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit", timeZone: "UTC" }).format(
    new Date(Number(year), Number(month) - 1, 1)
  );
}

function BalanceDot(props: { cx?: number; cy?: number; payload?: { saldo: number } }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  const positive = payload.saldo >= 0;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={positive ? "#34d399" : "#fb7185"}
      stroke={positive ? "#34d399" : "#fb7185"}
      strokeOpacity={0.3}
      strokeWidth={6}
    />
  );
}

export function BalanceScatter({ data }: { data: MesData[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">Balance por mes</h2>
        <p className="text-sm text-slate-500 py-6 text-center">Sin datos disponibles</p>
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
      <p className="text-xs text-slate-500 mb-4">Ingresos − Egresos de cada mes</p>
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="label"
            type="category"
            allowDuplicatedCategory={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="saldo"
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
          <ZAxis range={[80, 80]} />
          <ReferenceLine y={0} stroke="#334155" />
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
            formatter={(value) => [formatCOP(typeof value === "number" ? value : 0), "Balance"]}
          />
          <Scatter data={points} shape={BalanceDot} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Balance positivo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400" /> Balance negativo
        </span>
      </div>
    </Card>
  );
}
