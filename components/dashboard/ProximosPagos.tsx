"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EstadoPagoBadge } from "@/components/deudas/EstadoPagoBadge";
import { estadoDeDeuda } from "@/lib/estadoDeuda";
import { prioridadPago } from "@/lib/fechasPago";
import { formatCOP } from "@/lib/formatters";
import { getTipoDeudaLabel } from "@/lib/tiposDeuda";
import type { DeudaOption } from "@/lib/types";

const DIAS_VISIBLES = 7;

// Pagos de deudas vencidos, de hoy o de la próxima semana
export function ProximosPagos({ deudas }: { deudas: DeudaOption[] }) {
  const items = useMemo(() => {
    return deudas
      .map((d) => ({ d, estado: estadoDeDeuda(d) }))
      .filter(({ estado }) => estado.tipo === "vencida" || estado.tipo === "hoy" || (estado.tipo === "proximo" && estado.dias <= DIAS_VISIBLES))
      .sort((a, b) => prioridadPago(a.estado) - prioridadPago(b.estado))
      .slice(0, 4);
  }, [deudas]);

  if (items.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <CalendarClock size={16} className="text-cyan-300" aria-hidden /> Próximos pagos
        </h2>
        <Link
          href="/deudas"
          className="inline-flex items-center gap-0.5 min-h-9 text-sm text-cyan-300 hover:text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md"
        >
          Deudas <ChevronRight size={16} aria-hidden />
        </Link>
      </div>
      <ul className="divide-y divide-slate-800/70">
        {items.map(({ d, estado }) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">
                {getTipoDeudaLabel(d.tipo)}
                {d.descripcion ? ` · ${d.descripcion}` : ""}
              </p>
              <div className="mt-1">
                <EstadoPagoBadge estado={estado} />
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-100 whitespace-nowrap">{formatCOP(Number(d.monto))}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
