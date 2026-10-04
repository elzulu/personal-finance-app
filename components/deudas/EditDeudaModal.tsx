"use client";

import { DeudaForm } from "@/components/forms/DeudaForm";
import { Modal } from "@/components/ui/Modal";
import { useFeedback } from "@/components/ui/Feedback";
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
  const { toast } = useFeedback();

  async function handleSubmit(data: DeudaInput) {
    const res = await fetch(`/api/deudas/${deuda.id}`, {
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
    <Modal title="Editar deuda" onClose={onClose}>
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
    </Modal>
  );
}
