// Shared types used by both client and server components.
// Keep this file free of Node.js-only imports.

export const TipoEnum = {
  INGRESO: "INGRESO",
  EGRESO: "EGRESO",
} as const;

export type Tipo = (typeof TipoEnum)[keyof typeof TipoEnum];

// Deuda tal como la devuelve /api/deudas (los Decimal llegan como string)
export interface DeudaOption {
  id: string;
  tipo: string;
  descripcion: string | null;
  monto: string;
  pagado: boolean;
  miembroId: string | null;
  miembro: { nombre: string } | null;
  tasaMensual?: string | null;
  cargoFijo?: string | null;
}
