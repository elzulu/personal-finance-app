export const CATEGORIA_ICONOS: Record<string, string> = {
  // Ingreso
  Sueldo: "💼",
  Negocio: "🏢",
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
  Deudas: "💳",
  Ahorro: "🐷",
  Tecnología: "💻",
  Familia: "👨‍👩‍👧",
  Otro: "✨",
};

export function getCategoriaIcono(categoria: string): string {
  return CATEGORIA_ICONOS[categoria] ?? "🔖";
}
