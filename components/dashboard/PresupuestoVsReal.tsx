import { formatCOP } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";

interface CategoriaData {
  tipo: string;
  categoria: string;
  monto: number;
  presupuesto: number;
}

export function PresupuestoVsReal({ data }: { data: CategoriaData[] }) {
  const egresos = data.filter((d) => d.tipo === "EGRESO" && d.presupuesto > 0);

  if (egresos.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Presupuesto vs. Real (Egresos)
      </h2>
      <div className="space-y-3">
        {egresos.map((item) => {
          const pct = Math.min((item.monto / item.presupuesto) * 100, 100);
          const over = item.monto > item.presupuesto;
          return (
            <div key={item.categoria}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700 font-medium">
                  {item.categoria}
                </span>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${over ? "text-red-600" : "text-gray-800"}`}>
                    {formatCOP(item.monto)}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    / {formatCOP(item.presupuesto)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    over ? "bg-red-500" : pct > 80 ? "bg-yellow-400" : "bg-green-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {over && (
                <p className="text-xs text-red-500 mt-0.5">
                  Excede en {formatCOP(item.monto - item.presupuesto)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
