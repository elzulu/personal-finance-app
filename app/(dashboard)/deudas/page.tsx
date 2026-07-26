"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DeudaForm } from "@/components/forms/DeudaForm";
import { EditDeudaModal } from "@/components/deudas/EditDeudaModal";
import { DeudaInput } from "@/lib/validations";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatCOP, formatDate } from "@/lib/formatters";
import { getTipoDeudaIcono, getTipoDeudaLabel } from "@/lib/tiposDeuda";

interface Miembro {
  id: string;
  nombre: string;
}

interface Deuda {
  id: string;
  miembroId: string | null;
  miembro: Miembro | null;
  tipo: string;
  descripcion: string | null;
  monto: string;
  createdAt: string;
}

export default function DeudasPage() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [formSuccess, setFormSuccess] = useState(false);
  const [editTarget, setEditTarget] = useState<Deuda | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDeudas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deudas");
      const data = await res.json();
      setDeudas(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeudas();
    fetch("/api/miembros")
      .then((r) => r.json())
      .then(setMiembros)
      .catch(() => {});
  }, [fetchDeudas]);

  async function handleAdd(data: DeudaInput) {
    const res = await fetch("/api/deudas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Error al guardar");
    }
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 2500);
    fetchDeudas();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta deuda?")) return;
    setDeleting(id);
    await fetch(`/api/deudas/${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchDeudas();
  }

  const total = useMemo(() => deudas.reduce((sum, d) => sum + Number(d.monto), 0), [deudas]);

  const porMiembro = useMemo(() => {
    const map = new Map<string, { nombre: string; monto: number }>();
    for (const d of deudas) {
      const key = d.miembroId ?? "sin_asignar";
      const nombre = d.miembro?.nombre ?? "Sin asignar";
      const prev = map.get(key)?.monto ?? 0;
      map.set(key, { nombre, monto: prev + Number(d.monto) });
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.monto - a.monto);
  }, [deudas]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Deudas</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Registra cuánto debe cada integrante y a qué tipo de deuda corresponde.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <Card className="p-5 bg-gradient-to-br from-rose-500/15 via-slate-900/70 to-slate-900/70 border-rose-400/20">
            <p className="text-xs font-medium text-rose-300/80 uppercase tracking-wide">
              Deuda total
            </p>
            <p className="text-3xl font-bold text-white mt-1">{formatCOP(total)}</p>
          </Card>

          {porMiembro.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {porMiembro.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="w-9 h-9 rounded-xl bg-rose-400/10 text-rose-400 flex items-center justify-center text-base mb-2">
                    💳
                  </div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide truncate">
                    {p.nombre}
                  </p>
                  <p className="text-base font-bold text-rose-400 mt-0.5 break-words">
                    {formatCOP(p.monto)}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Registrar deuda</h2>
        {formSuccess && (
          <div className="mb-3 p-2.5 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 rounded-lg text-sm">
            Deuda registrada correctamente
          </div>
        )}
        <DeudaForm onSubmit={handleAdd} miembros={miembros} />
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Detalle de deudas</h2>
        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : deudas.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Aún no has registrado deudas</p>
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {deudas.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-rose-400/10 text-rose-400 flex items-center justify-center text-base shrink-0">
                    {getTipoDeudaIcono(d.tipo)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {getTipoDeudaLabel(d.tipo)}
                      {d.miembro && <span className="text-slate-500"> · {d.miembro.nombre}</span>}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {d.descripcion || formatDate(d.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-rose-400 whitespace-nowrap">
                    {formatCOP(Number(d.monto))}
                  </span>
                  <button
                    onClick={() => setEditTarget(d)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    disabled={deleting === d.id}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium disabled:opacity-50"
                  >
                    {deleting === d.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editTarget && (
        <EditDeudaModal
          deuda={editTarget}
          miembros={miembros}
          onClose={() => setEditTarget(null)}
          onSaved={fetchDeudas}
        />
      )}
    </div>
  );
}
