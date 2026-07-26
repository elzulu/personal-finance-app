"use client";

import { useState, useEffect } from "react";
import { MovimientoForm } from "@/components/forms/MovimientoForm";
import { TablaMovimientos } from "@/components/movimientos/TablaMovimientos";
import { MovimientoInput } from "@/lib/validations";
import { Card } from "@/components/ui/Card";
import { getCurrentMesKey, getMesLabel } from "@/lib/formatters";

interface Miembro {
  id: string;
  nombre: string;
}

export default function MovimientosPage() {
  const [mes, setMes] = useState(getCurrentMesKey());
  const [formSuccess, setFormSuccess] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [miembros, setMiembros] = useState<Miembro[]>([]);

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
    setTableKey((k) => k + 1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Movimientos</h1>
          <p className="text-sm text-slate-400 capitalize mt-0.5">{getMesLabel(mes)}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="border border-slate-700 bg-slate-900 text-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 [color-scheme:dark]"
          />
          <button
            onClick={() => (window.location.href = `/api/export?mes=${mes}`)}
            className="px-3 py-1.5 text-sm border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <Card className="p-4">
        <TablaMovimientos key={`${mes}-${tableKey}`} mes={mes} miembros={miembros} />
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Nuevo movimiento</h2>
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
