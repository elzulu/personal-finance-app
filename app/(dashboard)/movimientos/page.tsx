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
          <h1 className="text-xl font-bold text-gray-900">Movimientos</h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">{getMesLabel(mes)}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => (window.location.href = `/api/export?mes=${mes}`)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <Card className="p-4">
        <TablaMovimientos key={`${mes}-${tableKey}`} mes={mes} miembros={miembros} />
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Nuevo movimiento</h2>
        {formSuccess && (
          <div className="mb-3 p-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            Movimiento guardado correctamente
          </div>
        )}
        <MovimientoForm onSubmit={handleNuevoMovimiento} miembros={miembros} />
      </Card>
    </div>
  );
}
