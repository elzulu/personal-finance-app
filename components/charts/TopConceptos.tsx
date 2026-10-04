import { formatCOP } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";

interface ConceptoData {
  concepto: string;
  monto: number;
}

interface TopConceptosProps {
  data: ConceptoData[];
  titulo?: string;
  barColorClass?: string;
}

export function TopConceptos({
  data,
  titulo = "Top conceptos (egresos)",
  barColorClass = "bg-rose-400",
}: TopConceptosProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const max = data[0].monto;

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-slate-200 mb-4">
        {titulo}
      </h2>
      <div className="space-y-2.5">
        {data.map((item, i) => {
          const pct = (item.monto / max) * 100;
          return (
            <div key={item.concepto}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                  <span className="text-sm text-slate-300 truncate max-w-[160px]">
                    {item.concepto}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-200">
                  {formatCOP(item.monto)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5" aria-hidden>
                <div
                  className={`h-1.5 rounded-full ${barColorClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
