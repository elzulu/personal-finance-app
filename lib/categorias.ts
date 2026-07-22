import { Tipo } from "./types";

export const CATEGORIAS_POR_TIPO: Record<Tipo, string[]> = {
  INGRESO: ["Sueldo", "Negocio", "Inversiones", "Arriendo", "Bonificaciones", "Otro"],
  EGRESO: [
    "Vivienda",
    "Alimentación",
    "Transporte",
    "Salud",
    "Educación",
    "Entretenimiento",
    "Ropa",
    "Deudas",
    "Ahorro",
    "Tecnología",
    "Familia",
    "Otro",
  ],
};

export function getCategoriasParaTipo(tipo: Tipo): string[] {
  return CATEGORIAS_POR_TIPO[tipo] ?? [];
}

export function isCategoriaValida(categoria: string, tipo: Tipo): boolean {
  return CATEGORIAS_POR_TIPO[tipo]?.includes(categoria) ?? false;
}

export const TODAS_LAS_CATEGORIAS = [
  ...CATEGORIAS_POR_TIPO.INGRESO,
  ...CATEGORIAS_POR_TIPO.EGRESO,
];
