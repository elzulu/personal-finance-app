"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MovimientoForm } from "@/components/forms/MovimientoForm";
import { Modal } from "@/components/ui/Modal";
import { useFeedback } from "@/components/ui/Feedback";
import { MovimientoInput } from "@/lib/validations";
import type { DeudaOption } from "@/lib/types";

interface Miembro {
  id: string;
  nombre: string;
}

interface NuevoMovimientoFabProps {
  miembros: Miembro[];
  deudas: DeudaOption[];
  defaultTipo?: "INGRESO" | "EGRESO";
  onCreated?: (data: MovimientoInput) => void;
}

// Botón flotante "+" que abre el registro de movimiento en una hoja inferior (modal en escritorio).
// La hoja queda abierta tras guardar para poder registrar varios seguidos.
export function NuevoMovimientoFab({ miembros, deudas, defaultTipo, onCreated }: NuevoMovimientoFabProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useFeedback();

  async function handleSubmit(data: MovimientoInput) {
    const res = await fetch("/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Error al guardar");
    }
    toast("Movimiento guardado");
    onCreated?.(data);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Registrar movimiento"
        className="fixed z-30 right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 md:right-6 h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:brightness-110 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        <Plus size={28} strokeWidth={2.5} aria-hidden />
      </button>

      {open && (
        <Modal title="Registrar movimiento" onClose={() => setOpen(false)}>
          <MovimientoForm
            defaultValues={defaultTipo ? { tipo: defaultTipo } : undefined}
            onSubmit={handleSubmit}
            submitLabel="Guardar movimiento"
            miembros={miembros}
            deudas={deudas}
          />
        </Modal>
      )}
    </>
  );
}
