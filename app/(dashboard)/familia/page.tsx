"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { miembroSchema, MiembroInput } from "@/lib/validations";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useFeedback } from "@/components/ui/Feedback";
import { Trash2, Users } from "lucide-react";

interface Miembro {
  id: string;
  nombre: string;
  createdAt: string;
}

export default function FamiliaPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const { toast, confirm } = useFeedback();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MiembroInput>({ resolver: zodResolver(miembroSchema) });

  async function fetchMiembros() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/miembros");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setMiembros(Array.isArray(d) ? d : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMiembros();
  }, []);

  async function handleAdd(data: MiembroInput) {
    const res = await fetch("/api/miembros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      reset();
      toast("Miembro agregado");
      fetchMiembros();
    } else {
      toast("No se pudo agregar el miembro", { kind: "error" });
    }
  }

  async function handleDelete(m: Miembro) {
    const ok = await confirm({
      title: `¿Eliminar a ${m.nombre}?`,
      message: "Sus movimientos y deudas quedarán sin asignar.",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    setDeleting(m.id);
    try {
      const res = await fetch(`/api/miembros/${m.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Miembro eliminado");
    } catch {
      toast("No se pudo eliminar el miembro", { kind: "error" });
    }
    setDeleting(null);
    fetchMiembros();
  }

  return (
    <div className="space-y-5 max-w-lg">
      <PageHeader
        title="Miembros del hogar"
        subtitle="Agrega los integrantes de tu familia para asignarles ingresos y egresos."
      />

      {/* Agregar miembro */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Agregar miembro</h2>
        <form onSubmit={handleSubmit(handleAdd)} className="flex items-start gap-2" noValidate>
          <Input
            {...register("nombre")}
            type="text"
            aria-label="Nombre del miembro"
            placeholder="Nombre del miembro"
            wrapperClassName="flex-1"
            error={errors.nombre?.message}
          />
          <Button type="submit" loading={isSubmitting}>
            Agregar
          </Button>
        </form>
      </Card>

      {/* Lista de miembros */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Miembros</h2>
        {loading && miembros.length === 0 ? (
          <ListSkeleton rows={3} />
        ) : error ? (
          <ErrorState message="No se pudieron cargar los miembros." onRetry={fetchMiembros} />
        ) : miembros.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="Aún no has agregado miembros"
            description="Agrégalos para repartir ingresos, egresos y deudas entre ellos."
          />
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {miembros.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 text-cyan-300 flex items-center justify-center text-sm font-bold ring-1 ring-inset ring-cyan-400/20">
                    {m.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{m.nombre}</span>
                </div>
                <button
                  onClick={() => handleDelete(m)}
                  disabled={deleting === m.id}
                  aria-label={`Eliminar a ${m.nombre}`}
                  className="w-11 h-11 flex items-center justify-center rounded-lg text-rose-300 hover:bg-rose-400/10 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
