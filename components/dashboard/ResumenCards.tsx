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
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-br from-cyan-500/15 via-slate-900/70 to-slate-900/70 border-cyan-400/20">
        <p className="text-xs font-medium text-cyan-300/80 uppercase tracking-wide">
          Saldo del mes
        </p>
        <p className={`text-3xl font-bold mt-1 ${isPositive ? "text-white" : "text-rose-400"}`}>
          {formatCOP(saldo)}
        </p>
        <p className={`text-xs mt-1.5 font-medium ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
          {isPositive ? "▲ Balance positivo" : "▼ Balance negativo"}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center text-base shrink-0 mb-2">
            ↓
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Ingresos
          </p>
          <p className="text-base font-bold text-emerald-400 mt-0.5 break-words">
            {formatCOP(ingresos)}
          </p>
        </Card>

        <Card className="p-4">
          <div className="w-9 h-9 rounded-xl bg-rose-400/10 text-rose-400 flex items-center justify-center text-base shrink-0 mb-2">
            ↑
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Egresos
          </p>
          <p className="text-base font-bold text-rose-400 mt-0.5 break-words">
            {formatCOP(egresos)}
          </p>
        </Card>
      </div>
    </div>
  );
}
