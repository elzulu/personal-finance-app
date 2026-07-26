"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCOP } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";

const COLORS = ["#2dd4bf", "#a3e635", "#fbbf24", "#fb923c", "#22d3ee", "#a78bfa", "#f472b6"];

interface CategoriaData {
  categoria: string;
  monto: number;
}

export function GastoPorCategoria({ data }: { data: CategoriaData[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Gastos por categoría
        </h2>
        <p className="text-sm text-slate-500 py-6 text-center">Sin datos este mes</p>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + d.monto, 0);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-200">
          Gastos por categoría
        </h2>
        <div className="text-right">
          <span className="block text-[10px] uppercase tracking-wide text-slate-500">Total</span>
          <span className="block text-base font-bold text-white">{formatCOP(total)}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="monto"
            nameKey="categoria"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 12,
              fontSize: 12,
            }}
            itemStyle={{ color: "#e2e8f0" }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value) => [
              formatCOP(typeof value === "number" ? value : 0),
              "Monto",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="mt-2 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.categoria} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 min-w-0 text-slate-400">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{d.categoria}</span>
            </span>
            <span className="text-slate-200 font-medium shrink-0 whitespace-nowrap">
              {formatCOP(d.monto)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
