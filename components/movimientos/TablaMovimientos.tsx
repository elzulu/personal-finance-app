"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { formatCOP, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EditMovimientoModal } from "./EditMovimientoModal";
import { CATEGORIAS_POR_TIPO } from "@/lib/categorias";

interface Miembro {
  id: string;
  nombre: string;
}

interface Movimiento {
  id: string;
  fecha: string;
  tipo: "INGRESO" | "EGRESO";
  categoria: string;
  concepto: string;
  monto: string;
  miembroId: string | null;
  miembro: Miembro | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TablaMovimientosProps {
  mes: string;
  miembros: Miembro[];
}

const TODAS_CATEGORIAS = [
  ...CATEGORIAS_POR_TIPO.INGRESO,
  ...CATEGORIAS_POR_TIPO.EGRESO,
];

export function TablaMovimientos({ mes, miembros }: TablaMovimientosProps) {
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
        mes,
        page: String(overrides?.page ?? s.page),
        limit: "25",
        orderBy: overrides?.orderBy ?? s.orderBy,
        order: overrides?.order ?? s.order,
      });
      const tipo = overrides?.tipo !== undefined ? overrides.tipo : s.filterTipo;
      const categoria = overrides?.categoria !== undefined ? overrides.categoria : s.filterCategoria;
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
    [mes]
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
    if (orderBy !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{order === "desc" ? "↓" : "↑"}</span>;
  }

  const thClass =
    "px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap";

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-3">
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value as typeof filterTipo)}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los tipos</option>
          <option value="INGRESO">Ingreso</option>
          <option value="EGRESO">Egreso</option>
        </select>

        <select
          value={filterCategoria}
          onChange={(e) => setFilterCategoria(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las categorías</option>
          {TODAS_CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {miembros.length > 0 && (
          <select
            value={filterMiembro}
            onChange={(e) => setFilterMiembro(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={`${thClass} cursor-pointer hover:text-gray-800`} onClick={() => handleSort("fecha")}>
                    Fecha <SortIcon field="fecha" />
                  </th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Categoría</th>
                  <th className={thClass}>Concepto</th>
                  {miembros.length > 0 && <th className={thClass}>Miembro</th>}
                  <th className={`${thClass} cursor-pointer hover:text-gray-800 text-right`} onClick={() => handleSort("monto")}>
                    Monto <SortIcon field="monto" />
                  </th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0 && (
                  <tr>
                    <td colSpan={miembros.length > 0 ? 7 : 6} className="px-4 py-8 text-center text-gray-400 text-sm">
                      Sin movimientos para los filtros seleccionados
                    </td>
                  </tr>
                )}
                {data.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                      {formatDate(m.fecha)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={m.tipo === "INGRESO" ? "ingreso" : "egreso"}>
                        {m.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{m.categoria}</td>
                    <td className="px-3 py-2.5 text-gray-800 max-w-[160px] truncate">{m.concepto}</td>
                    {miembros.length > 0 && (
                      <td className="px-3 py-2.5 text-gray-500 text-xs">
                        {m.miembro?.nombre ?? <span className="text-gray-300">—</span>}
                      </td>
                    )}
                    <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${m.tipo === "INGRESO" ? "text-green-600" : "text-gray-800"}`}>
                      {formatCOP(Number(m.monto))}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditTarget(m)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deleting === m.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
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
              <span className="text-gray-500">{pagination.total} movimientos</span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => { const p = page - 1; setPage(p); fetchData({ page: p }); }}
                  className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >←</button>
                <span className="px-3 py-1 text-gray-600">{page} / {pagination.totalPages}</span>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => { const p = page + 1; setPage(p); fetchData({ page: p }); }}
                  className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
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
          onClose={() => setEditTarget(null)}
          onSaved={() => fetchData()}
        />
      )}
    </div>
  );
}
