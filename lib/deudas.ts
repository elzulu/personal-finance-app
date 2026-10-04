// Cálculos de pagos a deudas (interés, cargos y abono a capital). Sin dependencias de Node: se usa en cliente y servidor.

// Acepta también el Decimal de Prisma (se convierte con Number)
type Numerico = number | string | null | undefined | { valueOf(): string | number };

function num(v: Numerico): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// Parte del pago que realmente reduce el saldo de la deuda
export function abonoCapital(monto: Numerico, interes?: Numerico, cargos?: Numerico): number {
  return num(monto) - num(interes) - num(cargos);
}

// Interés sugerido del mes: saldo × tasa mensual (%), redondeado a pesos. 0 si no hay tasa
export function interesSugerido(saldo: Numerico, tasaMensual: Numerico): number {
  const tasa = num(tasaMensual);
  if (tasa <= 0) return 0;
  return Math.round((num(saldo) * tasa) / 100);
}
