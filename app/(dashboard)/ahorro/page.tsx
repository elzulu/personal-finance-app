"use client";

import { useState, useEffect, useCallback } from "react";
import { AporteAhorroForm } from "@/components/forms/AporteAhorroForm";
import { TablaMovimientos } from "@/components/movimientos/TablaMovimientos";
import { AporteAhorroInput } from "@/lib/validations";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatCOP } from "@/lib/formatters";

interface Miembro {
  id: string;
  nombre: string;
}

interface ResumenAhorro {
  total: number;
  porMiembro: { miembroId: string | null; nombre: string; monto: number }[];
}

export default function AhorroPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [resumen, setResumen] = useState<ResumenAhorro | null>(null);
  const [loading, setLoading] = useState(true);
  const [formSuccess, setFormSuccess] = useState(false);
  const [tableKey, setTableKey] = useState(0);

  const fetchResumen = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ahorro/resumen");
      const data = await res.json();
      setResumen(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumen();
    fetch("/api/miembros")
      .then((r) => r.json())
      .then(setMiembros)
      .catch(() => {});
  }, [fetchResumen]);

  async function handleAporte(data: AporteAhorroInput) {
    const res = await fetch("/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, tipo: "EGRESO", categoria: "Ahorro" }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Error al guardar");
    }
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 2500);
    fetchResumen();
    setTableKey((k) => k + 1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Ahorro</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Registra cuánto destina cada integrante al ahorro familiar.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        resumen && (
          <>
            <Card className="p-5 bg-gradient-to-br from-emerald-500/15 via-slate-900/70 to-slate-900/70 border-emerald-400/20">
              <p className="text-xs font-medium text-emerald-300/80 uppercase tracking-wide">
                Ahorro total
              </p>
              <p className="text-3xl font-bold text-white mt-1">{formatCOP(resumen.total)}</p>
            </Card>

            {resumen.porMiembro.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {resumen.porMiembro.map((p) => (
                  <Card key={p.miembroId ?? "sin_asignar"} className="p-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center text-base mb-2">
                      🐷
                    </div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide truncate">
                      {p.nombre}
                    </p>
                    <p className="text-base font-bold text-emerald-400 mt-0.5 break-words">
                      {formatCOP(p.monto)}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </>
        )
      )}

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Registrar aporte a ahorro</h2>
        {formSuccess && (
          <div className="mb-3 p-2.5 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 rounded-lg text-sm">
            Aporte registrado correctamente
          </div>
        )}
        <AporteAhorroForm onSubmit={handleAporte} miembros={miembros} />
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Historial de aportes</h2>
        <TablaMovimientos
          key={tableKey}
          miembros={miembros}
          fixedTipo="EGRESO"
          fixedCategoria="Ahorro"
        />
      </Card>
    </div>
  );
}
