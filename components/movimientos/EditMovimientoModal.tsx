"use client";

import { MovimientoForm } from "@/components/forms/MovimientoForm";
import { Modal } from "@/components/ui/Modal";
import { useFeedback } from "@/components/ui/Feedback";
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
  const { toast } = useFeedback();

  async function handleSubmit(data: MovimientoInput) {
    const res = await fetch(`/api/movimientos/${movimiento.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Error al guardar");
    }
    toast("Cambios guardados");
    onSaved();
    onClose();
  }

  return (
    <Modal title="Editar movimiento" onClose={onClose}>
      <MovimientoForm
        isEdit
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
    </Modal>
  );
}
