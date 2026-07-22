"use client";

import { useState, useEffect, useCallback } from "react";
import { ResumenCards } from "@/components/dashboard/ResumenCards";
import { GastoPorCategoria } from "@/components/charts/GastoPorCategoria";
import { EvolucionMensual } from "@/components/charts/EvolucionMensual";
import { TopConceptos } from "@/components/charts/TopConceptos";
import { MovimientoForm } from "@/components/forms/MovimientoForm";
import { MovimientoInput } from "@/lib/validations";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
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

export default function DashboardPage() {
  const [mes, setMes] = useState(getCurrentMesKey());
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [formSuccess, setFormSuccess] = useState(false);

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

  async function handleNuevoMovimiento(data: MovimientoInput) {
    const res = await fetch("/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Error al guardar");
    }
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 2500);
    const movFecha = new Date(data.fecha);
    const movMes = `${movFecha.getFullYear()}-${String(movFecha.getMonth() + 1).padStart(2, "0")}`;
    if (movMes === mes) {
      fetchResumen(mes);
    }
  }

  const egresosData =
    resumen?.porCategoria.filter((c) => c.tipo === "EGRESO") ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">
            {getMesLabel(mes)}
          </p>
        </div>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : resumen ? (
        <>
          <ResumenCards
            ingresos={resumen.ingresos}
            egresos={resumen.egresos}
            saldo={resumen.saldo}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GastoPorCategoria data={egresosData} />
            <TopConceptos data={resumen.topConceptos} />
          </div>

          <EvolucionMensual data={resumen.evolucion} />
        </>
      ) : null}

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Registrar movimiento
        </h2>
        {formSuccess && (
          <div className="mb-3 p-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            Movimiento guardado correctamente
          </div>
        )}
        <MovimientoForm onSubmit={handleNuevoMovimiento} />
      </Card>
    </div>
  );
}
