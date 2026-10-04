"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Inbox, Search, X } from "lucide-react";
import { formatCOP, formatDate, toInputDate } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useFeedback } from "@/components/ui/Feedback";
import { controlClass } from "@/components/ui/Field";
import { RowMenu } from "@/components/ui/RowMenu";
import { EditMovimientoModal } from "./EditMovimientoModal";
import { CATEGORIAS_POR_TIPO } from "@/lib/categorias";
import { getCategoriaIcono } from "@/lib/categoriaIcons";

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
  miembro: Miembro | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TablaMovimientosProps {
  mes?: string;
  miembros: Miembro[];
  deudas?: DeudaOption[];
  fixedTipo?: "INGRESO" | "EGRESO";
  fixedCategoria?: string;
  // Se llama tras editar, eliminar o deshacer (los saldos de deudas pueden haber cambiado)
  onChanged?: () => void;
}

const TODAS_CATEGORIAS = Array.from(
  new Set([...CATEGORIAS_POR_TIPO.INGRESO, ...CATEGORIAS_POR_TIPO.EGRESO])
);

const SORT_OPTIONS = [
  { value: "fecha:desc", label: "Más recientes" },
  { value: "fecha:asc", label: "Más antiguos" },
  { value: "monto:desc", label: "Mayor monto" },
  { value: "monto:asc", label: "Menor monto" },
];

const filterControl = `${controlClass} md:!w-auto`;

function Monto({ m }: { m: Movimiento }) {
  const esIngreso = m.tipo === "INGRESO";
  return (
    <span className={`font-semibold whitespace-nowrap ${esIngreso ? "text-emerald-400" : "text-slate-100"}`}>
      <span aria-hidden>{esIngreso ? "+" : "−"} </span>
      <span className="sr-only">{esIngreso ? "Ingreso de " : "Egreso de "}</span>
      {formatCOP(Number(m.monto))}
    </span>
  );
}

export function TablaMovimientos({
  mes,
  miembros,
  deudas = [],
  fixedTipo,
  fixedCategoria,
  onChanged,
}: TablaMovimientosProps) {
  const { toast, confirm } = useFeedback();

  const [data, setData] = useState<Movimiento[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [filterTipo, setFilterTipo] = useState<"" | "INGRESO" | "EGRESO">("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterMiembro, setFilterMiembro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filterConcepto, setFilterConcepto] = useState(""); // busqueda con debounce
  const [orderBy, setOrderBy] = useState("fecha");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [editTarget, setEditTarget] = useState<Movimiento | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const categoriaOptions = fixedTipo ? CATEGORIAS_POR_TIPO[fixedTipo] : TODAS_CATEGORIAS;
  const reqId = useRef(0);

  // Debounce de la búsqueda por concepto
  useEffect(() => {
    const t = setTimeout(() => {
      setFilterConcepto(busqueda.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Los filtros se aplican al cambiar; no hay botón "Filtrar"
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({
      page: String(page),
      limit: "25",
      orderBy,
      order,
    });
    if (mes) params.set("mes", mes);
    const tipo = fixedTipo ?? filterTipo;
    const categoria = fixedCategoria ?? filterCategoria;
    if (tipo) params.set("tipo", tipo);
    if (categoria) params.set("categoria", categoria);
    if (filterMiembro) params.set("miembroId", filterMiembro);
    if (filterConcepto) params.set("concepto", filterConcepto);

    fetch(`/api/movimientos?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json) => {
        if (id !== reqId.current) return; // respuesta obsoleta
        setData(json.data ?? []);
        setPagination(json.pagination);
      })
      .catch(() => {
        if (id === reqId.current) setError(true);
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [mes, fixedTipo, fixedCategoria, filterTipo, filterCategoria, filterMiembro, filterConcepto, orderBy, order, page, reloadKey]);

  const recargar = useCallback(() => {
    setReloadKey((k) => k + 1);
    onChanged?.();
  }, [onChanged]);

  function cambiarFiltro<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  function limpiarFiltros() {
    setFilterTipo("");
    setFilterCategoria("");
    setFilterMiembro("");
    setBusqueda("");
    setFilterConcepto("");
    setPage(1);
  }

  function handleSort(field: string) {
    const newOrder = orderBy === field && order === "desc" ? "asc" : "desc";
    setOrderBy(field);
    setOrder(newOrder);
    setPage(1);
  }

  async function handleDelete(m: Movimiento) {
    const ok = await confirm({
      title: "¿Eliminar este movimiento?",
      message: (
        <>
          <span className="font-medium text-white">{m.concepto}</span> · {formatCOP(Number(m.monto))}
          {m.deudaId && <p className="mt-2 text-slate-400">El saldo de la deuda vinculada se restaurará.</p>}
        </>
      ),
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;

    setDeleting(m.id);
    try {
      const res = await fetch(`/api/movimientos/${m.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setDeleting(null);
      toast("No se pudo eliminar el movimiento", { kind: "error" });
      return;
    }
    setDeleting(null);
    recargar();

    toast("Movimiento eliminado", {
      action: {
        label: "Deshacer",
        onClick: async () => {
          // Se vuelve a crear: el POST re-aplica la sincronización con la deuda si la había
          const res = await fetch("/api/movimientos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fecha: toInputDate(m.fecha),
              tipo: m.tipo,
              categoria: m.categoria,
              concepto: m.concepto,
              monto: Number(m.monto),
              miembroId: m.miembroId,
              deudaId: m.deudaId,
            }),
          });
          if (res.ok) {
            toast("Movimiento restaurado");
          } else {
            toast("No se pudo restaurar el movimiento", { kind: "error" });
          }
          recargar();
        },
      },
    });
  }

  const hayFiltros = Boolean(
    (!fixedTipo && filterTipo) || (!fixedCategoria && filterCategoria) || filterMiembro || filterConcepto
  );
  const nombreMiembro =
    filterMiembro === "sin_asignar"
      ? "Sin asignar"
      : miembros.find((m) => m.id === filterMiembro)?.nombre ?? "Miembro";

  function SortIcon({ field }: { field: string }) {
    if (orderBy !== field) return null;
    return order === "desc" ? (
      <ArrowDown size={12} className="ml-1 inline text-cyan-400" aria-hidden />
    ) : (
      <ArrowUp size={12} className="ml-1 inline text-cyan-400" aria-hidden />
    );
  }

  const thClass = "px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap";
  const chip =
    "inline-flex items-center gap-1 min-h-8 pl-3 pr-1.5 rounded-full bg-cyan-400/10 text-cyan-200 text-xs ring-1 ring-inset ring-cyan-400/20";

  return (
    <div>
      {/* Filtros */}
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar concepto..."
            aria-label="Buscar por concepto"
            className={`${controlClass} pl-9`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
          {!fixedTipo && (
            <select
              value={filterTipo}
              onChange={(e) => cambiarFiltro(setFilterTipo)(e.target.value as typeof filterTipo)}
              aria-label="Filtrar por tipo"
              className={filterControl}
            >
              <option value="">Todos los tipos</option>
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
            </select>
          )}

          {!fixedCategoria && (
            <select
              value={filterCategoria}
              onChange={(e) => cambiarFiltro(setFilterCategoria)(e.target.value)}
              aria-label="Filtrar por categoría"
              className={filterControl}
            >
              <option value="">Todas las categorías</option>
              {categoriaOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {miembros.length > 0 && (
            <select
              value={filterMiembro}
              onChange={(e) => cambiarFiltro(setFilterMiembro)(e.target.value)}
              aria-label="Filtrar por miembro"
              className={filterControl}
            >
              <option value="">Todos los miembros</option>
              <option value="sin_asignar">Sin asignar</option>
              {miembros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          )}

          {/* En móvil no hay encabezados clicables: el orden se elige aquí */}
          <select
            value={`${orderBy}:${order}`}
            onChange={(e) => {
              const [f, o] = e.target.value.split(":");
              setOrderBy(f);
              setOrder(o as "asc" | "desc");
              setPage(1);
            }}
            aria-label="Ordenar por"
            className={`${filterControl} md:hidden`}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {hayFiltros && (
          <div className="flex flex-wrap items-center gap-2" aria-label="Filtros activos">
            {!fixedTipo && filterTipo && (
              <span className={chip}>
                {filterTipo === "INGRESO" ? "Ingreso" : "Egreso"}
                <button onClick={() => cambiarFiltro(setFilterTipo)("")} aria-label="Quitar filtro de tipo" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cyan-400/20">
                  <X size={14} aria-hidden />
                </button>
              </span>
            )}
            {!fixedCategoria && filterCategoria && (
              <span className={chip}>
                {filterCategoria}
                <button onClick={() => cambiarFiltro(setFilterCategoria)("")} aria-label="Quitar filtro de categoría" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cyan-400/20">
                  <X size={14} aria-hidden />
                </button>
              </span>
            )}
            {filterMiembro && (
              <span className={chip}>
                {nombreMiembro}
                <button onClick={() => cambiarFiltro(setFilterMiembro)("")} aria-label="Quitar filtro de miembro" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cyan-400/20">
                  <X size={14} aria-hidden />
                </button>
              </span>
            )}
            {filterConcepto && (
              <span className={chip}>
                “{filterConcepto}”
                <button onClick={() => { setBusqueda(""); setFilterConcepto(""); setPage(1); }} aria-label="Quitar búsqueda" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cyan-400/20">
                  <X size={14} aria-hidden />
                </button>
              </span>
            )}
            <button onClick={limpiarFiltros} className="min-h-8 px-2 text-xs text-slate-300 underline underline-offset-2 hover:text-white">
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {error ? (
        <ErrorState message="No se pudieron cargar los movimientos." onRetry={() => setReloadKey((k) => k + 1)} />
      ) : loading && data.length === 0 ? (
        <ListSkeleton />
      ) : data.length === 0 ? (
        hayFiltros ? (
          <EmptyState
            icon={<Search size={22} />}
            title="Sin resultados"
            description="Ningún movimiento coincide con los filtros seleccionados."
            action={<Button variant="secondary" onClick={limpiarFiltros}>Limpiar filtros</Button>}
          />
        ) : (
          <EmptyState
            icon={<Inbox size={22} />}
            title="Aún no hay movimientos"
            description="Usa el botón + para registrar el primero."
          />
        )
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          {/* Móvil: lista de tarjetas */}
          <ul className="md:hidden divide-y divide-slate-800/70">
            {data.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    m.tipo === "INGRESO" ? "bg-emerald-400/10" : "bg-rose-400/10"
                  }`}
                  aria-hidden
                >
                  {getCategoriaIcono(m.categoria)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100 truncate">{m.concepto}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {m.categoria} · {formatDate(m.fecha)}
                    {m.miembro ? ` · ${m.miembro.nombre}` : ""}
                  </p>
                </div>
                <div className="text-sm text-right shrink-0">
                  <Monto m={m} />
                </div>
                <RowMenu
                  label={m.concepto}
                  busy={deleting === m.id}
                  onEdit={() => setEditTarget(m)}
                  onDelete={() => handleDelete(m)}
                />
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <div className="hidden md:block rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-800">
                <tr>
                  <th className={thClass} aria-sort={orderBy === "fecha" ? (order === "desc" ? "descending" : "ascending") : "none"}>
                    <button onClick={() => handleSort("fecha")} className="uppercase tracking-wide hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded">
                      Fecha <SortIcon field="fecha" />
                    </button>
                  </th>
                  <th className={thClass}>Categoría</th>
                  <th className={thClass}>Concepto</th>
                  {miembros.length > 0 && <th className={thClass}>Miembro</th>}
                  <th className={`${thClass} text-right`} aria-sort={orderBy === "monto" ? (order === "desc" ? "descending" : "ascending") : "none"}>
                    <button onClick={() => handleSort("monto")} className="uppercase tracking-wide hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded">
                      Monto <SortIcon field="monto" />
                    </button>
                  </th>
                  <th className={thClass}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {data.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-1.5 text-slate-400 whitespace-nowrap">{formatDate(m.fecha)}</td>
                    <td className="px-3 py-1.5 text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden>{getCategoriaIcono(m.categoria)}</span>
                        {m.categoria}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-100 max-w-[220px] truncate" title={m.concepto}>
                      {m.concepto}
                    </td>
                    {miembros.length > 0 && (
                      <td className="px-3 py-1.5 text-slate-400 text-xs">
                        {m.miembro?.nombre ?? <span aria-label="Sin asignar">—</span>}
                      </td>
                    )}
                    <td className="px-3 py-1.5 text-right">
                      <Monto m={m} />
                    </td>
                    <td className="px-1 py-1">
                      <div className="flex justify-end">
                        <RowMenu
                          label={m.concepto}
                          busy={deleting === m.id}
                          onEdit={() => setEditTarget(m)}
                          onDelete={() => handleDelete(m)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-slate-400">
                {pagination.total} movimiento{pagination.total === 1 ? "" : "s"}
              </span>
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    aria-label="Página anterior"
                    className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <ChevronLeft size={18} aria-hidden />
                  </button>
                  <span className="px-2 text-slate-300">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Página siguiente"
                    className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <ChevronRight size={18} aria-hidden />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {editTarget && (
        <EditMovimientoModal
          movimiento={editTarget}
          miembros={miembros}
          deudas={deudas}
          onClose={() => setEditTarget(null)}
          onSaved={recargar}
        />
      )}
    </div>
  );
}
