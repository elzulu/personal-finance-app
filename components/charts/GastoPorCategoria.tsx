"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="monto"
            nameKey="categoria"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
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
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value, entry) => {
              const monto = (entry as { payload?: { monto?: number } })?.payload?.monto;
              return (
                <span className="text-xs text-slate-400">
                  {value}
                  {typeof monto === "number" && (
                    <span className="text-slate-300 font-medium"> · {formatCOP(monto)}</span>
                  )}
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
