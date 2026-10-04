"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

// Menú "⋯" por fila con Editar / Eliminar
export function RowMenu({
  label,
  onEdit,
  onDelete,
  busy,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "w-full min-h-11 flex items-center gap-2 px-3 text-sm text-left hover:bg-slate-800 focus:outline-none focus-visible:bg-slate-800";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-label={`Acciones para ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        <MoreVertical size={18} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/50 overflow-hidden"
        >
          <button
            role="menuitem"
            className={`${item} text-slate-200`}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil size={16} aria-hidden /> Editar
          </button>
          <button
            role="menuitem"
            className={`${item} text-rose-300`}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={16} aria-hidden /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
