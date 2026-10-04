// Estado de pago de una deuda tal como llega de /api/deudas (cliente)
import { aDia, estadoPago, hoyEnZona, type Dia, type EstadoPago } from "./fechasPago";
import type { DeudaOption } from "./types";

export function estadoDeDeuda(
  d: Pick<DeudaOption, "diaPago" | "pagado" | "createdAt" | "movimientos">,
  hoy: Dia = hoyEnZona()
): EstadoPago {
  const ultimo = d.movimientos?.[0]?.fecha;
  return estadoPago({
    diaPago: d.diaPago,
    hoy,
    ultimoPago: ultimo ? aDia(ultimo) : null,
    // createdAt es un instante: se convierte a fecha en la zona de Colombia, igual que "hoy"
    creada: d.createdAt ? hoyEnZona(new Date(d.createdAt)) : null,
    saldada: d.pagado,
  });
}
