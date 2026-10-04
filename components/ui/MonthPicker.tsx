"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentMesKey, getMesLabel } from "@/lib/formatters";

interface MonthPickerProps {
  value: string; // YYYY-MM
  onChange: (mes: string) => void;
}

function shiftMes(mes: string, delta: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Selector de mes con flechas: un toque por mes en lugar de abrir el calendario nativo
export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const esActual = value === getCurrentMesKey();
  const btn =
    "w-11 h-11 flex items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";

  return (
    <div
      className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/70 px-1"
      role="group"
      aria-label="Seleccionar mes"
    >
      <button className={btn} onClick={() => onChange(shiftMes(value, -1))} aria-label="Mes anterior">
        <ChevronLeft size={18} aria-hidden />
      </button>
      <button
        onClick={() => onChange(getCurrentMesKey())}
        disabled={esActual}
        aria-label={esActual ? `${getMesLabel(value)} (mes actual)` : `${getMesLabel(value)}, volver al mes actual`}
        className="min-w-28 h-11 px-1 text-sm font-medium text-slate-100 first-letter:uppercase text-center disabled:cursor-default enabled:hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md"
      >
        {getMesLabel(value)}
      </button>
      <button className={btn} onClick={() => onChange(shiftMes(value, 1))} aria-label="Mes siguiente">
        <ChevronRight size={18} aria-hidden />
      </button>
    </div>
  );
}
