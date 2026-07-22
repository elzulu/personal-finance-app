"use client";

import { MovimientoForm } from "@/components/forms/MovimientoForm";
import { MovimientoInput } from "@/lib/validations";
import { toInputDate } from "@/lib/formatters";

interface Movimiento {
  id: string;
  fecha: string;
  tipo: "INGRESO" | "EGRESO";
  categoria: string;
  concepto: string;
  presupuesto: string | null;
  monto: string;
}

interface EditModalProps {
  movimiento: Movimiento;
  onClose: () => void;
  onSaved: () => void;
}

export function EditMovimientoModal({ movimiento, onClose, onSaved }: EditModalProps) {
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Editar movimiento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
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
            presupuesto: movimiento.presupuesto ? Number(movimiento.presupuesto) : null,
            monto: Number(movimiento.monto),
          }}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}
