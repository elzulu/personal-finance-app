export const CATEGORIA_ICONOS: Record<string, string> = {
  // Ingreso
  Sueldo: "💼",
  Negocio: "🏢",
  "Trabajo Extra": "🛵",
  Inversiones: "📈",
  Arriendo: "🏠",
  Bonificaciones: "🎁",
  // Egreso
  Vivienda: "🏠",
  Servicios: "🔌",
  Alimentación: "🍽️",
  Transporte: "🚗",
  Salud: "⚕️",
  Educación: "🎓",
  Entretenimiento: "🎬",
  Ropa: "👕",
  Compras: "🛍️",
  Deudas: "💳",
  Ahorro: "🐷",
  Tecnología: "💻",
  Familia: "👨‍👩‍👧",
  Otro: "✨",
};

export function getCategoriaIcono(categoria: string): string {
  return CATEGORIA_ICONOS[categoria] ?? "🔖";
}
