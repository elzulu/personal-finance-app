"use client";

import { useState, useEffect, useCallback } from "react";
import { TopConceptos } from "@/components/charts/TopConceptos";
import { EvolucionSerie } from "@/components/charts/EvolucionSerie";
import { GastoPorCategoria } from "@/components/charts/GastoPorCategoria";
import { TablaMovimientos } from "@/components/movimientos/TablaMovimientos";
import { StatsSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { NuevoMovimientoFab } from "@/components/movimientos/NuevoMovimientoFab";
import { TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCOP, getCurrentMesKey } from "@/lib/formatters";

interface Miembro {
  id: string;
  nombre: string;
}

interface DeudaOption {
  id: string;
  tipo: string;
  descripcion: string | null;
  monto: string;
  pagado: boolean;
  miembroId: string | null;
  miembro: { nombre: string } | null;
}

interface ResumenTipo {
  mes: string;
  tipo: "EGRESO";
  totalHistorico: number;
  totalPeriodo: number;
  countPeriodo: number;
  porCategoria: { categoria: string; monto: number }[];
  topConceptos: { concepto: string; monto: number }[];
  evolucion: { mes: string; monto: number }[];
}

export default function EgresosPage() {
  const [mes, setMes] = useState(getCurrentMesKey());
  const [resumen, setResumen] = useState<ResumenTipo | null>(null);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [deudas, setDeudas] = useState<DeudaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tableKey, setTableKey] = useState(0);

  const fetchResumen = useCallback(async (mesKey: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/resumen-tipo?tipo=EGRESO&mes=${mesKey}`);
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

  useEffect(() => {
    fetch("/api/miembros").then((r) => r.json()).then((d) => setMiembros(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/deudas").then((r) => r.json()).then((d) => setDeudas(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <>
            <TrendingDown size={22} className="text-rose-400" aria-hidden /> Egresos
          </>
        }
        actions={<MonthPicker value={mes} onChange={setMes} />}
      />

      {loading && !resumen ? (
        <StatsSkeleton />
      ) : error ? (
        <ErrorState message="No se pudo cargar el resumen." onRetry={() => fetchResumen(mes)} />
      ) : resumen ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Total histórico
              </p>
              <p className="text-lg font-bold text-rose-400 mt-1 break-words">
                {formatCOP(resumen.totalHistorico)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Egresos del período
              </p>
              <p className="text-lg font-bold text-rose-400 mt-1 break-words">
                {formatCOP(resumen.totalPeriodo)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Transacciones
              </p>
              <p className="text-lg font-bold text-white mt-1">{resumen.countPeriodo}</p>
            </Card>
          </div>

          <TopConceptos
            data={resumen.topConceptos}
            titulo="Top conceptos — Egresos"
            barColorClass="bg-rose-400"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EvolucionSerie
              data={resumen.evolucion}
              titulo="Evolución de egresos"
              color="#fb7185"
            />
            <GastoPorCategoria
              data={resumen.porCategoria}
              titulo="Egresos por categoría"
            />
          </div>
        </>
      ) : null}

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Transacciones</h2>
        <TablaMovimientos
          key={`${mes}-${tableKey}`}
          mes={mes}
          miembros={miembros}
          deudas={deudas}
          fixedTipo="EGRESO"
          onChanged={() => {
            fetchResumen(mes);
            fetch("/api/deudas").then((r) => r.json()).then((d) => setDeudas(Array.isArray(d) ? d : [])).catch(() => {});
          }}
        />
      </Card>

      <NuevoMovimientoFab
        miembros={miembros}
        deudas={deudas}
        defaultTipo="EGRESO"
        onCreated={() => {
          fetchResumen(mes);
          setTableKey((k) => k + 1);
          fetch("/api/deudas").then((r) => r.json()).then((d) => setDeudas(Array.isArray(d) ? d : [])).catch(() => {});
        }}
      />
    </div>
  );
}
