"use client";

import { useState } from "react";
import { MovimientoForm } from "@/components/forms/MovimientoForm";
import { TablaMovimientos } from "@/components/movimientos/TablaMovimientos";
import { MovimientoInput } from "@/lib/validations";
import { Card } from "@/components/ui/Card";
import { getCurrentMesKey, getMesLabel } from "@/lib/formatters";

export default function MovimientosPage() {
  const [mes, setMes] = useState(getCurrentMesKey());
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tableKey, setTableKey] = useState(0);

  async function handleNuevoMovimiento(data: MovimientoInput) {
    setFormError(null);
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
    setTableKey((k) => k + 1); // fuerza re-render de la tabla
  }

  function handleExport() {
    window.location.href = `/api/export?mes=${mes}`;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Movimientos</h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">
            {getMesLabel(mes)}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
            title="Exportar a CSV"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabla */}
      <Card className="p-4">
        <TablaMovimientos key={`${mes}-${tableKey}`} mes={mes} />
      </Card>

      {/* Formulario */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Nuevo movimiento
        </h2>
        {formSuccess && (
          <div className="mb-3 p-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            Movimiento guardado correctamente
          </div>
        )}
        {formError && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {formError}
          </div>
        )}
        <MovimientoForm onSubmit={handleNuevoMovimiento} />
      </Card>
    </div>
  );
}
