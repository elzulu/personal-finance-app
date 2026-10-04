// Construcción de los recordatorios de pago del día (lógica pura, sin I/O ni dependencias de Node)
import { aDia, estadoPago, type Dia } from "./fechasPago";
import { interesSugerido } from "./deudas";
import { formatCOP } from "./formatters";
import { getTipoDeudaLabel } from "./tiposDeuda";

type Numerico = number | string | { valueOf(): string | number };

export interface DeudaParaRecordar {
  userId: string;
  tipo: string;
  descripcion: string | null;
  monto: Numerico; // saldo actual
  tasaMensual: Numerico | null;
  cargoFijo: Numerico | null;
  diaPago: number | null;
  pagado: boolean;
  createdAt: Date;
  ultimoPago: Date | null;
}

export interface Recordatorio {
  userId: string;
  title: string;
  body: string;
  url: string;
  tag: string;
}

function nombre(d: DeudaParaRecordar): string {
  const base = getTipoDeudaLabel(d.tipo);
  return d.descripcion ? `${base} (${d.descripcion})` : base;
}

function detalle(d: DeudaParaRecordar): string {
  const saldo = Number(d.monto);
  const interes = interesSugerido(saldo, d.tasaMensual);
  const cargo = Number(d.cargoFijo ?? 0);
  const partes = [`saldo ${formatCOP(saldo)}`];
  if (interes > 0) partes.push(`interés ~${formatCOP(interes)}`);
  if (cargo > 0) partes.push(`cargo ${formatCOP(cargo)}`);
  return partes.join(" · ");
}

// Una notificación por usuario con las deudas que vencen hoy y aún no tienen pago registrado
export function construirRecordatorios(deudas: DeudaParaRecordar[], hoy: Dia): Recordatorio[] {
  const porUsuario = new Map<string, DeudaParaRecordar[]>();
  for (const d of deudas) {
    const estado = estadoPago({
      diaPago: d.diaPago,
      hoy,
      ultimoPago: d.ultimoPago ? aDia(d.ultimoPago) : null,
      creada: d.createdAt ? aDia(d.createdAt) : null,
      saldada: d.pagado,
    });
    if (estado.tipo !== "hoy") continue;
    porUsuario.set(d.userId, [...(porUsuario.get(d.userId) ?? []), d]);
  }

  const tag = `pago-deudas-${hoy.y}-${hoy.m}-${hoy.d}`;
  return Array.from(porUsuario.entries()).map(([userId, lista]) => {
    if (lista.length === 1) {
      return {
        userId,
        title: `Hoy vence el pago de ${nombre(lista[0])}`,
        body: detalle(lista[0]),
        url: "/deudas",
        tag,
      };
    }
    return {
      userId,
      title: `Hoy vencen ${lista.length} pagos de deudas`,
      body: lista.map((d) => `${nombre(d)}: ${detalle(d)}`).join("\n"),
      url: "/deudas",
      tag,
    };
  });
}
