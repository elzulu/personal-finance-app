"use client";

import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import { TablaMovimientos } from "@/components/movimientos/TablaMovimientos";
import { NuevoMovimientoFab } from "@/components/movimientos/NuevoMovimientoFab";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { getCurrentMesKey } from "@/lib/formatters";

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

export default function MovimientosPage() {
  const [mes, setMes] = useState(getCurrentMesKey());
  const [tableKey, setTableKey] = useState(0);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [deudas, setDeudas] = useState<DeudaOption[]>([]);

  const fetchDeudas = useCallback(async () => {
    try {
      const res = await fetch("/api/deudas");
      if (res.ok) {
        const d = await res.json();
        setDeudas(Array.isArray(d) ? d : []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/miembros")
      .then((r) => r.json())
      .then((d) => setMiembros(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetchDeudas();
  }, [fetchDeudas]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Movimientos"
        actions={
          <>
            <MonthPicker value={mes} onChange={setMes} />
            <Button
              variant="secondary"
              onClick={() => (window.location.href = `/api/export?mes=${mes}`)}
              aria-label="Exportar CSV del mes"
            >
              <Download size={16} aria-hidden />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <TablaMovimientos
          key={`${mes}-${tableKey}`}
          mes={mes}
          miembros={miembros}
          deudas={deudas}
          onChanged={fetchDeudas}
        />
      </Card>

      <NuevoMovimientoFab
        miembros={miembros}
        deudas={deudas}
        onCreated={(data) => {
          setTableKey((k) => k + 1);
          // Actualizar saldos de deudas si se vinculó alguna
          if (data.deudaId) fetchDeudas();
        }}
      />
    </div>
  );
}
