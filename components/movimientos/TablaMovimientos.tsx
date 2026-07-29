"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { formatCOP, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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
}

const TODAS_CATEGORIAS = Array.from(
  new Set([...CATEGORIAS_POR_TIPO.INGRESO, ...CATEGORIAS_POR_TIPO.EGRESO])
);

export function TablaMovimientos({ mes, miembros, deudas = [], fixedTipo, fixedCategoria }: TablaMovimientosProps) {
  const [data, setData] = useState<Movimiento[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const [filterTipo, setFilterTipo] = useState<"" | "INGRESO" | "EGRESO">("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterMiembro, setFilterMiembro] = useState("");
  const [orderBy, setOrderBy] = useState("fecha");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [editTarget, setEditTarget] = useState<Movimiento | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const stateRef = useRef({ page, orderBy, order, filterTipo, filterCategoria, filterMiembro });
  stateRef.current = { page, orderBy, order, filterTipo, filterCategoria, filterMiembro };

  const fetchData = useCallback(
    async (overrides?: {
      page?: number;
      orderBy?: string;
      order?: string;
      tipo?: string;
      categoria?: string;
      miembroId?: string;
    }) => {
      setLoading(true);
      const s = stateRef.current;
      const params = new URLSearchParams({
        page: String(overrides?.page ?? s.page),
        limit: "25",
        orderBy: overrides?.orderBy ?? s.orderBy,
        order: overrides?.order ?? s.order,
      });
      if (mes) params.set("mes", mes);
      const tipo = fixedTipo ?? (overrides?.tipo !== undefined ? overrides.tipo : s.filterTipo);
      const categoria = fixedCategoria ?? (overrides?.categoria !== undefined ? overrides.categoria : s.filterCategoria);
      const miembroId = overrides?.miembroId !== undefined ? overrides.miembroId : s.filterMiembro;
      if (tipo) params.set("tipo", tipo);
      if (categoria) params.set("categoria", categoria);
      if (miembroId) params.set("miembroId", miembroId);

      try {
        const res = await fetch(`/api/movimientos?${params}`);
        const json = await res.json();
        setData(json.data ?? []);
        setPagination(json.pagination);
      } finally {
        setLoading(false);
      }
    },
    [mes, fixedTipo, fixedCategoria]
  );

  useEffect(() => {
    setPage(1);
    setFilterTipo("");
    setFilterCategoria("");
    setFilterMiembro("");
    setOrderBy("fecha");
    setOrder("desc");
    fetchData({ page: 1, tipo: "", categoria: "", miembroId: "", orderBy: "fecha", order: "desc" });
  }, [mes, fetchData]);

  function handleFilter() {
    setPage(1);
    fetchData({ page: 1, tipo: filterTipo, categoria: filterCategoria, miembroId: filterMiembro });
  }

  function handleSort(field: string) {
    const newOrder = orderBy === field && order === "desc" ? "asc" : "desc";
    setOrderBy(field);
    setOrder(newOrder);
    fetchData({ orderBy: field, order: newOrder });
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    setDeleting(id);
    await fetch(`/api/movimientos/${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchData();
  }

  function SortIcon({ field }: { field: string }) {
    if (orderBy !== field) return <span className="text-slate-600 ml-1">↕</span>;
    return <span className="ml-1 text-cyan-400">{order === "desc" ? "↓" : "↑"}</span>;
  }

  const thClass =
    "px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap";

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-3">
        {!fixedTipo && (
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value as typeof filterTipo)}
            className="text-sm border border-slate-700 rounded-lg px-2 py-1.5 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="">Todos los tipos</option>
            <option value="INGRESO">Ingreso</option>
            <option value="EGRESO">Egreso</option>
          </select>
        )}

        {!fixedCategoria && (
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="text-sm border border-slate-700 rounded-lg px-2 py-1.5 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="">Todas las categorías</option>
            {TODAS_CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {miembros.length > 0 && (
          <select
            value={filterMiembro}
            onChange={(e) => setFilterMiembro(e.target.value)}
            className="text-sm border border-slate-700 rounded-lg px-2 py-1.5 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="">Todos los miembros</option>
            <option value="sin_asignar">Sin asignar</option>
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        )}

        <button
          onClick={handleFilter}
          className="px-3 py-1.5 bg-cyan-500 text-slate-950 text-sm font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
        >
          Filtrar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-800 scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-800">
                <tr>
                  <th className={`${thClass} cursor-pointer hover:text-slate-300`} onClick={() => handleSort("fecha")}>
                    Fecha <SortIcon field="fecha" />
                  </th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Categoría</th>
                  <th className={thClass}>Concepto</th>
                  {miembros.length > 0 && <th className={thClass}>Miembro</th>}
                  <th className={`${thClass} cursor-pointer hover:text-slate-300 text-right`} onClick={() => handleSort("monto")}>
                    Monto <SortIcon field="monto" />
                  </th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {data.length === 0 && (
                  <tr>
                    <td colSpan={miembros.length > 0 ? 7 : 6} className="px-4 py-8 text-center text-slate-500 text-sm">
                      Sin movimientos para los filtros seleccionados
                    </td>
                  </tr>
                )}
                {data.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                      {formatDate(m.fecha)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={m.tipo === "INGRESO" ? "ingreso" : "egreso"}>
                        {m.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden>{getCategoriaIcono(m.categoria)}</span>
                        {m.categoria}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-200 max-w-[160px] truncate">{m.concepto}</td>
                    {miembros.length > 0 && (
                      <td className="px-3 py-2.5 text-slate-500 text-xs">
                        {m.miembro?.nombre ?? <span className="text-slate-700">—</span>}
                      </td>
                    )}
                    <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${m.tipo === "INGRESO" ? "text-emerald-400" : "text-slate-200"}`}>
                      {formatCOP(Number(m.monto))}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditTarget(m)} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deleting === m.id}
                          className="text-xs text-rose-400 hover:text-rose-300 font-medium disabled:opacity-50"
                        >
                          {deleting === m.id ? "..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-slate-500">{pagination.total} movimientos</span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => { const p = page - 1; setPage(p); fetchData({ page: p }); }}
                  className="px-3 py-1 rounded-lg border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
                >←</button>
                <span className="px-3 py-1 text-slate-400">{page} / {pagination.totalPages}</span>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => { const p = page + 1; setPage(p); fetchData({ page: p }); }}
                  className="px-3 py-1 rounded-lg border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
                >→</button>
              </div>
            </div>
          )}
        </>
      )}

      {editTarget && (
        <EditMovimientoModal
          movimiento={editTarget}
          miembros={miembros}
          deudas={deudas}
          onClose={() => setEditTarget(null)}
          onSaved={() => fetchData()}
        />
      )}
    </div>
  );
}
