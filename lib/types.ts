// Shared types used by both client and server components.
// Keep this file free of Node.js-only imports.

export const TipoEnum = {
  INGRESO: "INGRESO",
  EGRESO: "EGRESO",
} as const;

export type Tipo = (typeof TipoEnum)[keyof typeof TipoEnum];
