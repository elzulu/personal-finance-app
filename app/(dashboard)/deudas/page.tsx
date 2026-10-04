"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DeudaForm } from "@/components/forms/DeudaForm";
import { EditDeudaModal } from "@/components/deudas/EditDeudaModal";
import { DeudaInput } from "@/lib/validations";
import { Card } from "@/components/ui/Card";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { RowMenu } from "@/components/ui/RowMenu";
import { useFeedback } from "@/components/ui/Feedback";
import { CreditCard } from "lucide-react";
import { RecordatoriosCard } from "@/components/deudas/RecordatoriosCard";
import { EstadoPagoBadge } from "@/components/deudas/EstadoPagoBadge";
import { estadoDeDeuda } from "@/lib/estadoDeuda";
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
  pagado: boolean;
  tasaMensual: string | null;
  cargoFijo: string | null;
  diaPago: number | null;
  createdAt: string;
  movimientos?: { fecha: string }[];
}

export default function DeudasPage() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const { toast, confirm } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editTarget, setEditTarget] = useState<Deuda | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDeudas = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/deudas");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDeudas(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeudas();
    fetch("/api/miembros")
      .then((r) => r.json())
      .then((d) => setMiembros(Array.isArray(d) ? d : []))
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
    toast("Deuda registrada");
    fetchDeudas();
  }

  async function handleDelete(d: Deuda) {
    const ok = await confirm({
      title: "¿Eliminar esta deuda?",
      message: (
        <>
          <span className="font-medium text-white">{getTipoDeudaLabel(d.tipo)}</span> · {formatCOP(Number(d.monto))}
          <p className="mt-2 text-slate-400">Los pagos ya registrados quedarán sin deuda vinculada.</p>
        </>
      ),
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    setDeleting(d.id);
    try {
      const res = await fetch(`/api/deudas/${d.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Deuda eliminada");
    } catch {
      toast("No se pudo eliminar la deuda", { kind: "error" });
    }
    setDeleting(null);
    fetchDeudas();
  }

  const total = useMemo(() => deudas.filter((d) => !d.pagado).reduce((sum, d) => sum + Number(d.monto), 0), [deudas]);

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
      <PageHeader
        title="Deudas"
        subtitle="Registra cuánto debe cada integrante y a qué tipo de deuda corresponde."
      />

      {loading && deudas.length === 0 ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : error ? (
        <ErrorState message="No se pudieron cargar las deudas." onRetry={fetchDeudas} />
      ) : (
        <>
          <Card className="p-5 bg-gradient-to-br from-rose-500/15 via-slate-900/70 to-slate-900/70 border-rose-400/20">
            <p className="text-xs font-medium text-rose-300/90 uppercase tracking-wide">
              Deuda total
            </p>
            <p className="text-3xl font-bold text-white mt-1">{formatCOP(total)}</p>
          </Card>

          {porMiembro.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {porMiembro.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="w-9 h-9 rounded-xl bg-rose-400/10 text-rose-400 flex items-center justify-center mb-2" aria-hidden>
                    <CreditCard size={18} />
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

      <RecordatoriosCard />

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Registrar deuda</h2>
        <DeudaForm onSubmit={handleAdd} miembros={miembros} />
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Detalle de deudas</h2>
        {loading && deudas.length === 0 ? (
          <ListSkeleton rows={3} />
        ) : deudas.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={22} />}
            title="Aún no has registrado deudas"
            description="Registra una arriba para llevar el saldo y vincular tus pagos."
          />
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {deudas.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${d.pagado ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"}`}>
                    {getTipoDeudaIcono(d.tipo)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate flex items-center gap-2">
                      {getTipoDeudaLabel(d.tipo)}
                      {d.miembro && <span className="text-slate-400"> · {d.miembro.nombre}</span>}
                      {d.pagado && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-400/15 text-emerald-400 uppercase tracking-wide">
                          Pagada
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {d.descripcion || formatDate(d.createdAt)}
                    </p>
                    {(d.tasaMensual != null || d.cargoFijo != null) && (
                      <p className="text-xs text-slate-400 truncate">
                        {d.tasaMensual != null && `${Number(d.tasaMensual).toLocaleString("es-CO")}% mensual`}
                        {d.tasaMensual != null && d.cargoFijo != null && " · "}
                        {d.cargoFijo != null && `Cargo ${formatCOP(Number(d.cargoFijo))}/mes`}
                      </p>
                    )}
                    {d.diaPago != null && !d.pagado && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs text-slate-400">Paga el día {d.diaPago}</span>
                        <EstadoPagoBadge estado={estadoDeDeuda(d)} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-semibold whitespace-nowrap ${d.pagado ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatCOP(Number(d.monto))}
                  </span>
                  <RowMenu
                    label={getTipoDeudaLabel(d.tipo)}
                    busy={deleting === d.id}
                    onEdit={() => setEditTarget(d)}
                    onDelete={() => handleDelete(d)}
                  />
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
