"use client";

import { MovimientoForm } from "@/components/forms/MovimientoForm";
import { MovimientoInput } from "@/lib/validations";
import { toInputDate } from "@/lib/formatters";

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

interface Movimiento {
  id: string;
  fecha: string;
  tipo: "INGRESO" | "EGRESO";
  categoria: string;
  concepto: string;
  monto: string;
  miembroId: string | null;
  deudaId: string | null;
}

interface EditModalProps {
  movimiento: Movimiento;
  miembros: Miembro[];
  deudas?: DeudaOption[];
  onClose: () => void;
  onSaved: () => void;
}

export function EditMovimientoModal({ movimiento, miembros, deudas = [], onClose, onSaved }: EditModalProps) {
  async function handleSubmit(data: MovimientoInput) {
    const res = await fetch(`/api/movimientos/${movimiento.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al guardar");
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/40 w-full max-w-md p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-white">
            Editar movimiento
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <MovimientoForm
          defaultValues={{
            fecha: toInputDate(movimiento.fecha),
            tipo: movimiento.tipo,
            categoria: movimiento.categoria,
            concepto: movimiento.concepto,
            monto: Number(movimiento.monto),
            miembroId: movimiento.miembroId,
            deudaId: movimiento.deudaId,
          }}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
          miembros={miembros}
          deudas={deudas}
        />
      </div>
    </div>
  );
}
