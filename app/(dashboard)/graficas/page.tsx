"use client";

import { useState, useEffect, useCallback } from "react";
import { GastoPorCategoria } from "@/components/charts/GastoPorCategoria";
import { EvolucionMensual } from "@/components/charts/EvolucionMensual";
import { TopConceptos } from "@/components/charts/TopConceptos";
import { BalanceScatter } from "@/components/charts/BalanceScatter";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getCurrentMesKey, getMesLabel } from "@/lib/formatters";

interface Resumen {
  mes: string;
  ingresos: number;
  egresos: number;
  saldo: number;
  porCategoria: { tipo: string; categoria: string; monto: number }[];
  topConceptos: { concepto: string; monto: number }[];
  evolucion: { mes: string; ingresos: number; egresos: number }[];
}

export default function GraficasPage() {
  const [mes, setMes] = useState(getCurrentMesKey());
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResumen = useCallback(async (mesKey: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resumen?mes=${mesKey}`);
      const data = await res.json();
      setResumen(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumen(mes);
  }, [mes, fetchResumen]);

  const egresosData = resumen?.porCategoria.filter((c) => c.tipo === "EGRESO") ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Gráficas</h1>
          <p className="text-sm text-slate-400 capitalize mt-0.5">{getMesLabel(mes)}</p>
        </div>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="border border-slate-700 bg-slate-900 text-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 [color-scheme:dark]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : resumen ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GastoPorCategoria data={egresosData} />
            <TopConceptos data={resumen.topConceptos} />
          </div>
          <EvolucionMensual data={resumen.evolucion} />
          <BalanceScatter data={resumen.evolucion} />
        </>
      ) : null}
    </div>
  );
}
