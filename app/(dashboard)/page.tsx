"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ResumenCards } from "@/components/dashboard/ResumenCards";
import { MovimientoForm } from "@/components/forms/MovimientoForm";
import { MovimientoInput } from "@/lib/validations";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { getCurrentMesKey, getMesLabel } from "@/lib/formatters";

interface Miembro {
  id: string;
  nombre: string;
}

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
  const [miembros, setMiembros] = useState<Miembro[]>([]);
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

  useEffect(() => {
    fetch("/api/miembros")
      .then((r) => r.json())
      .then(setMiembros)
      .catch(() => {});
  }, []);

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
    if (movMes === mes) fetchResumen(mes);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
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
          <ResumenCards ingresos={resumen.ingresos} egresos={resumen.egresos} saldo={resumen.saldo} />
          <Link
            href="/graficas"
            className="flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-800 bg-slate-900/70 text-sm text-slate-300 hover:border-cyan-400/30 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>📊</span> Ver gráficas y balance mensual
            </span>
            <span aria-hidden>→</span>
          </Link>
        </>
      ) : null}

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Registrar movimiento</h2>
        {formSuccess && (
          <div className="mb-3 p-2.5 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 rounded-lg text-sm">
            Movimiento guardado correctamente
          </div>
        )}
        <MovimientoForm onSubmit={handleNuevoMovimiento} miembros={miembros} />
      </Card>
    </div>
  );
}
