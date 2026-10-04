import { BellRing, CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";
import type { EstadoPago } from "@/lib/fechasPago";

const ESTILOS = {
  vencida: "bg-rose-400/10 text-rose-300 ring-rose-400/25",
  hoy: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  urgente: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  proximo: "bg-slate-400/10 text-slate-300 ring-slate-400/20",
  pagada: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
} as const;

// Etiqueta con el estado del pago del mes (vencida, hoy, próximo, pagada)
export function EstadoPagoBadge({ estado }: { estado: EstadoPago }) {
  if (estado.tipo === "sin_fecha") return null;

  const clave =
    estado.tipo === "proximo" && estado.dias <= 3 ? "urgente" : (estado.tipo as keyof typeof ESTILOS);
  const Icono =
    estado.tipo === "vencida"
      ? AlertTriangle
      : estado.tipo === "hoy"
        ? BellRing
        : estado.tipo === "pagada"
          ? CheckCircle2
          : CalendarClock;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ESTILOS[clave]}`}
    >
      <Icono size={12} aria-hidden />
      {estado.etiqueta}
    </span>
  );
}
