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

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#f97316"];

interface CategoriaData {
  categoria: string;
  monto: number;
}

export function GastoPorCategoria({ data }: { data: CategoriaData[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Gastos por categoría
        </h2>
        <p className="text-sm text-gray-400 py-6 text-center">Sin datos este mes</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Gastos por categoría
      </h2>
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
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [
              formatCOP(typeof value === "number" ? value : 0),
              "Monto",
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
