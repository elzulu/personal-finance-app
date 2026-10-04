"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BarChart3, ChevronRight } from "lucide-react";
import { ResumenCards } from "@/components/dashboard/ResumenCards";
import { UltimosMovimientos, MovimientoReciente } from "@/components/dashboard/UltimosMovimientos";
import { ProximosPagos } from "@/components/dashboard/ProximosPagos";
import { NuevoMovimientoFab } from "@/components/movimientos/NuevoMovimientoFab";
import { MovimientoInput } from "@/lib/validations";
import { ResumenSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { getCurrentMesKey } from "@/lib/formatters";
import type { DeudaOption } from "@/lib/types";

interface Miembro {
  id: string;
  nombre: string;
}

interface Resumen {
  mes: string;
  ingresos: number;
  egresos: number;
  saldo: number;
}

export default function DashboardPage() {
  const [mes, setMes] = useState(getCurrentMesKey());
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [recientes, setRecientes] = useState<MovimientoReciente[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [deudas, setDeudas] = useState<DeudaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDatos = useCallback(async (mesKey: string) => {
    setLoading(true);
    setError(false);
    try {
      const [r, m] = await Promise.all([
        fetch(`/api/resumen?mes=${mesKey}`),
        fetch(`/api/movimientos?mes=${mesKey}&limit=5&orderBy=fecha&order=desc`),
      ]);
      if (!r.ok) throw new Error();
      setResumen(await r.json());
      setRecientes(m.ok ? (await m.json()).data ?? [] : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatos(mes);
  }, [mes, fetchDatos]);

  useEffect(() => {
    fetch("/api/miembros")
      .then((r) => r.json())
      .then((d) => setMiembros(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/deudas")
      .then((r) => r.json())
      .then((d) => setDeudas(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  function handleCreated(data: MovimientoInput) {
    // Solo hace falta refrescar si el movimiento cae en el mes mostrado
    if (data.fecha.slice(0, 7) === mes) fetchDatos(mes);
    // Refrescar saldos de deudas si se vinculó alguna
    if (data.deudaId) {
      fetch("/api/deudas").then((r) => r.json()).then((d) => setDeudas(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" actions={<MonthPicker value={mes} onChange={setMes} />} />

      {loading && !resumen ? (
        <ResumenSkeleton />
      ) : error ? (
        <ErrorState message="No se pudo cargar el resumen del mes." onRetry={() => fetchDatos(mes)} />
      ) : resumen ? (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <ResumenCards ingresos={resumen.ingresos} egresos={resumen.egresos} saldo={resumen.saldo} />
        </div>
      ) : null}

      <ProximosPagos deudas={deudas} />

      {!error && <UltimosMovimientos data={recientes} />}

      <Link
        href="/graficas"
        className="flex items-center justify-between min-h-12 px-4 rounded-2xl border border-slate-800 bg-slate-900/70 text-sm text-slate-300 hover:border-cyan-400/30 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        <span className="flex items-center gap-2">
          <BarChart3 size={18} aria-hidden /> Ver gráficas y balance mensual
        </span>
        <ChevronRight size={18} aria-hidden />
      </Link>

      <NuevoMovimientoFab miembros={miembros} deudas={deudas} onCreated={handleCreated} />
    </div>
  );
}
