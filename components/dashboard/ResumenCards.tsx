import { formatCOP } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";

interface ResumenCardsProps {
  ingresos: number;
  egresos: number;
  saldo: number;
}

export function ResumenCards({ ingresos, egresos, saldo }: ResumenCardsProps) {
  const isPositive = saldo >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Ingresos
        </p>
        <p className="text-2xl font-bold text-green-600 mt-1">
          {formatCOP(ingresos)}
        </p>
      </Card>

      <Card className="p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Egresos
        </p>
        <p className="text-2xl font-bold text-red-500 mt-1">
          {formatCOP(egresos)}
        </p>
      </Card>

      <Card className={`p-4 border-2 ${isPositive ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Saldo
        </p>
        <p className={`text-2xl font-bold mt-1 ${isPositive ? "text-green-700" : "text-red-700"}`}>
          {formatCOP(saldo)}
        </p>
        <p className={`text-xs mt-1 font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? "Positivo" : "Negativo"}
        </p>
      </Card>
    </div>
  );
}
