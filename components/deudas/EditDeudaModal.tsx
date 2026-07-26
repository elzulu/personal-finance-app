"use client";

import { DeudaForm } from "@/components/forms/DeudaForm";
import { DeudaInput } from "@/lib/validations";

interface Miembro {
  id: string;
  nombre: string;
}

interface Deuda {
  id: string;
  miembroId: string | null;
  tipo: string;
  descripcion: string | null;
  monto: string;
}

interface EditDeudaModalProps {
  deuda: Deuda;
  miembros: Miembro[];
  onClose: () => void;
  onSaved: () => void;
}

export function EditDeudaModal({ deuda, miembros, onClose, onSaved }: EditDeudaModalProps) {
  async function handleSubmit(data: DeudaInput) {
    const res = await fetch(`/api/deudas/${deuda.id}`, {
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/40 w-full max-w-md p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-white">Editar deuda</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">
            &times;
          </button>
        </div>
        <DeudaForm
          defaultValues={{
            miembroId: deuda.miembroId,
            tipo: deuda.tipo as DeudaInput["tipo"],
            descripcion: deuda.descripcion ?? "",
            monto: Number(deuda.monto),
          }}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
          miembros={miembros}
        />
      </div>
    </div>
  );
}
