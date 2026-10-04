// Fechas de pago de deudas: día del mes recurrente, estado del ciclo y recordatorios.
// Sin dependencias de Node: se usa en cliente (UI) y servidor (cron). Las fechas se manejan como
// {y, m, d} (m = 1..12) para no depender de la zona horaria del servidor.

export interface Dia {
  y: number;
  m: number; // 1..12
  d: number;
}

export const ZONA_HORARIA = "America/Bogota";

const MS_DIA = 86_400_000;

export function diasEnMes(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// Fecha de pago de un mes concreto; si el mes es más corto (p. ej. día 31 en febrero) cae el último día
export function fechaDePago(y: number, m: number, diaPago: number): Dia {
  return { y, m, d: Math.min(diaPago, diasEnMes(y, m)) };
}

function sumarMeses(y: number, m: number, delta: number): { y: number; m: number } {
  const idx = y * 12 + (m - 1) + delta;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

function aUTC(f: Dia): number {
  return Date.UTC(f.y, f.m - 1, f.d);
}

// b − a en días enteros
export function diffDias(a: Dia, b: Dia): number {
  return Math.round((aUTC(b) - aUTC(a)) / MS_DIA);
}

export function sumarDias(f: Dia, n: number): Dia {
  const t = new Date(aUTC(f) + n * MS_DIA);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

// Fecha de hoy en una zona horaria (por defecto Colombia), independiente de la zona del servidor
export function hoyEnZona(ahora: Date = new Date(), zona: string = ZONA_HORARIA): Dia {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);
  const get = (t: string) => Number(partes.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

// Las fechas de movimientos se guardan a medianoche UTC: se leen en UTC para no correr un día
export function aDia(valor: Date | string): Dia {
  if (typeof valor === "string") {
    const [y, m, d] = valor.slice(0, 10).split("-").map(Number);
    return { y, m, d };
  }
  return { y: valor.getUTCFullYear(), m: valor.getUTCMonth() + 1, d: valor.getUTCDate() };
}

// Último vencimiento en o antes de `hoy`
export function vencimientoAnterior(diaPago: number, hoy: Dia): Dia {
  const esteMes = fechaDePago(hoy.y, hoy.m, diaPago);
  if (diffDias(esteMes, hoy) >= 0) return esteMes;
  const ant = sumarMeses(hoy.y, hoy.m, -1);
  return fechaDePago(ant.y, ant.m, diaPago);
}

// Primer vencimiento en o después de `hoy` (o estrictamente después si `estricto`)
export function vencimientoProximo(diaPago: number, hoy: Dia, estricto = false): Dia {
  const desde = estricto ? sumarDias(hoy, 1) : hoy;
  const esteMes = fechaDePago(desde.y, desde.m, diaPago);
  if (diffDias(desde, esteMes) >= 0) return esteMes;
  const sig = sumarMeses(desde.y, desde.m, 1);
  return fechaDePago(sig.y, sig.m, diaPago);
}

export type TipoEstadoPago = "sin_fecha" | "pagada" | "hoy" | "vencida" | "proximo";

export interface EstadoPago {
  tipo: TipoEstadoPago;
  // vencida: días desde el vencimiento · proximo/pagada: días hasta el siguiente vencimiento
  dias: number;
  vencimiento: Dia | null; // vencimiento al que se refiere el estado
  etiqueta: string;
}

interface EntradaEstado {
  diaPago: number | null | undefined;
  hoy: Dia;
  ultimoPago?: Dia | null; // fecha del último pago registrado a la deuda
  creada?: Dia | null; // fecha de creación de la deuda
  saldada?: boolean; // deuda ya pagada por completo
}

const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

// Un pago se asigna al vencimiento más cercano: pagar unos días antes o con un día de retraso cuenta
// para ese mes. Si hay empate gana el vencimiento anterior.
function vencimientoMasCercano(pago: Dia, candidatos: Dia[]): Dia {
  return candidatos.reduce((mejor, c) =>
    Math.abs(diffDias(pago, c)) < Math.abs(diffDias(pago, mejor)) ? c : mejor
  );
}

export function estadoPago({ diaPago, hoy, ultimoPago, creada, saldada }: EntradaEstado): EstadoPago {
  if (!diaPago || saldada) return { tipo: "sin_fecha", dias: 0, vencimiento: null, etiqueta: "" };

  const prev = vencimientoAnterior(diaPago, hoy); // último vencimiento (hoy o antes)
  const hoyEsDia = diffDias(prev, hoy) === 0;
  const siguiente = vencimientoProximo(diaPago, hoy, true); // primero estrictamente después de hoy
  const anterior = vencimientoAnterior(diaPago, sumarDias(prev, -1));

  const asignado = ultimoPago ? vencimientoMasCercano(ultimoPago, [anterior, prev, siguiente]) : null;
  const cubreSiguiente = asignado ? diffDias(asignado, siguiente) === 0 : false;
  const cubrePrev = asignado ? diffDias(asignado, prev) === 0 : false;

  // El pago de hoy (o el adelantado del próximo vencimiento) ya está hecho
  if (cubreSiguiente || (cubrePrev && hoyEsDia)) {
    const cubierto = cubreSiguiente ? siguiente : prev;
    const proximo = vencimientoProximo(diaPago, cubierto, true);
    return {
      tipo: "pagada",
      dias: diffDias(hoy, proximo),
      vencimiento: proximo,
      etiqueta: `Pagada · próximo pago el ${formatDia(proximo)}`,
    };
  }

  if (!cubrePrev) {
    if (hoyEsDia) return { tipo: "hoy", dias: 0, vencimiento: prev, etiqueta: "Vence hoy" };
    // Deuda creada después del último vencimiento: aún no le corresponde ese pago
    const creadaDespues = creada ? diffDias(prev, creada) > 0 : false;
    if (!creadaDespues) {
      const dias = diffDias(prev, hoy);
      return { tipo: "vencida", dias, vencimiento: prev, etiqueta: `Venció hace ${plural(dias, "día", "días")}` };
    }
  }

  const dias = diffDias(hoy, siguiente);
  return {
    tipo: "proximo",
    dias,
    vencimiento: siguiente,
    etiqueta: dias === 1 ? "Vence mañana" : `Vence en ${plural(dias, "día", "días")}`,
  };
}

// Prioridad para listar: vencidas, hoy y luego las más cercanas
export function prioridadPago(e: EstadoPago): number {
  if (e.tipo === "vencida") return -1000 + -e.dias;
  if (e.tipo === "hoy") return -500;
  if (e.tipo === "proximo") return e.dias;
  return Number.POSITIVE_INFINITY;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatDia(f: Dia): string {
  return `${f.d} de ${MESES[f.m - 1]}`;
}
