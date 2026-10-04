"use client";

import { useState, useEffect, useCallback } from "react";
import { GastoPorCategoria } from "@/components/charts/GastoPorCategoria";
import { EvolucionMensual } from "@/components/charts/EvolucionMensual";
import { TopConceptos } from "@/components/charts/TopConceptos";
import { BalanceScatter } from "@/components/charts/BalanceScatter";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { getCurrentMesKey } from "@/lib/formatters";

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
  const [error, setError] = useState(false);

  const fetchResumen = useCallback(async (mesKey: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/resumen?mes=${mesKey}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResumen(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumen(mes);
  }, [mes, fetchResumen]);

  const egresosData = resumen?.porCategoria.filter((c) => c.tipo === "EGRESO") ?? [];
  const ingresosData = resumen?.porCategoria.filter((c) => c.tipo === "INGRESO") ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="Gráficas" actions={<MonthPicker value={mes} onChange={setMes} />} />

      {loading && !resumen ? (
        <div className="space-y-4" role="status" aria-label="Cargando gráficas">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorState message="No se pudieron cargar las gráficas." onRetry={() => fetchResumen(mes)} />
      ) : resumen ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GastoPorCategoria data={egresosData} />
            <GastoPorCategoria data={ingresosData} titulo="Ingresos por categoría" />
          </div>
          <TopConceptos data={resumen.topConceptos} />
          <EvolucionMensual data={resumen.evolucion} />
          <BalanceScatter data={resumen.evolucion} />
        </>
      ) : null}
    </div>
  );
}
