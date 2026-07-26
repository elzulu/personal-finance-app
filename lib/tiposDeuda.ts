export const TIPOS_DEUDA = [
  { value: "TARJETA_CREDITO", label: "Tarjeta de crédito", icono: "💳" },
  { value: "ADDI", label: "Addi", icono: "🛍️" },
  { value: "SISTECREDITO", label: "Sistecredito", icono: "🧾" },
  { value: "PRESTAMO_BANCARIO", label: "Préstamo bancario", icono: "🏦" },
  { value: "OTRO", label: "Otro", icono: "📌" },
] as const;

export type TipoDeuda = (typeof TIPOS_DEUDA)[number]["value"];

export function getTipoDeudaLabel(tipo: string): string {
  return TIPOS_DEUDA.find((t) => t.value === tipo)?.label ?? tipo;
}

export function getTipoDeudaIcono(tipo: string): string {
  return TIPOS_DEUDA.find((t) => t.value === tipo)?.icono ?? "📌";
}
