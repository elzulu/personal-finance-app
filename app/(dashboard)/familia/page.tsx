"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { miembroSchema, MiembroInput } from "@/lib/validations";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Miembro {
  id: string;
  nombre: string;
  createdAt: string;
}

export default function FamiliaPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MiembroInput>({ resolver: zodResolver(miembroSchema) });

  async function fetchMiembros() {
    setLoading(true);
    const res = await fetch("/api/miembros");
    const data = await res.json();
    setMiembros(data);
    setLoading(false);
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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      fetchMiembros();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este miembro? Sus movimientos quedarán sin asignar.")) return;
    setDeleting(id);
    await fetch(`/api/miembros/${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchMiembros();
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-white">Miembros del hogar</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Agrega los integrantes de tu familia para asignarles ingresos y egresos.
        </p>
      </div>

      {/* Agregar miembro */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Agregar miembro</h2>
        {success && (
          <div className="mb-3 p-2.5 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 rounded-lg text-sm">
            Miembro agregado correctamente
          </div>
        )}
        <form onSubmit={handleSubmit(handleAdd)} className="flex gap-2">
          <div className="flex-1">
            <input
              {...register("nombre")}
              type="text"
              placeholder="Nombre del miembro"
              className="w-full px-3 py-2.5 border border-slate-700 bg-slate-950/60 text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {errors.nombre && (
              <p className="text-rose-400 text-xs mt-1">{errors.nombre.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:brightness-110 disabled:opacity-50 text-slate-950 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
          >
            {isSubmitting ? "..." : "Agregar"}
          </button>
        </form>
      </Card>

      {/* Lista de miembros */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Miembros</h2>
        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : miembros.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            Aún no has agregado miembros
          </p>
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
                  onClick={() => handleDelete(m.id)}
                  disabled={deleting === m.id}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium disabled:opacity-50"
                >
                  {deleting === m.id ? "..." : "Eliminar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
