export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function toInputDate(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0];
}

// Fecha de hoy en hora local (YYYY-MM-DD); toISOString usa UTC y adelanta el día en la noche
export function todayInputDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMesLabel(mesKey: string): string {
  const [year, month] = mesKey.split("-");
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Number(year), Number(month) - 1, 1));
}

export function getCurrentMesKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
