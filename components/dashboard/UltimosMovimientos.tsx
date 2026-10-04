import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCOP, formatDate } from "@/lib/formatters";
import { getCategoriaIcono } from "@/lib/categoriaIcons";

export interface MovimientoReciente {
  id: string;
  fecha: string;
  tipo: "INGRESO" | "EGRESO";
  categoria: string;
  concepto: string;
  monto: string;
}

export function UltimosMovimientos({ data }: { data: MovimientoReciente[] }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-200">Últimos movimientos</h2>
        <Link
          href="/movimientos"
          className="inline-flex items-center gap-0.5 min-h-9 text-sm text-cyan-300 hover:text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md"
        >
          Ver todos <ChevronRight size={16} aria-hidden />
        </Link>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={<Inbox size={22} />}
          title="Sin movimientos este mes"
          description="Toca el botón + para registrar el primero."
        />
      ) : (
        <ul className="divide-y divide-slate-800/70">
          {data.map((m) => {
            const esIngreso = m.tipo === "INGRESO";
            return (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    esIngreso ? "bg-emerald-400/10" : "bg-rose-400/10"
                  }`}
                  aria-hidden
                >
                  {getCategoriaIcono(m.categoria)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100 truncate">{m.concepto}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {m.categoria} · {formatDate(m.fecha)}
                  </p>
                </div>
                <span className={`text-sm font-semibold whitespace-nowrap ${esIngreso ? "text-emerald-400" : "text-slate-100"}`}>
                  <span aria-hidden>{esIngreso ? "+" : "−"} </span>
                  <span className="sr-only">{esIngreso ? "Ingreso de " : "Egreso de "}</span>
                  {formatCOP(Number(m.monto))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
