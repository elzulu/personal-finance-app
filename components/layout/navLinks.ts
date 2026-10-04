import {
  Home,
  TrendingUp,
  TrendingDown,
  ListChecks,
  Users,
  BarChart3,
  PiggyBank,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/ingresos", label: "Ingresos", icon: TrendingUp },
  { href: "/egresos", label: "Egresos", icon: TrendingDown },
  { href: "/movimientos", label: "Movimientos", icon: ListChecks },
  { href: "/deudas", label: "Deudas", icon: CreditCard },
  { href: "/ahorro", label: "Ahorro", icon: PiggyBank },
  { href: "/graficas", label: "Gráficas", icon: BarChart3 },
  { href: "/familia", label: "Familia", icon: Users },
];

// Destinos fijos de la barra inferior (móvil); el resto vive en "Más"
export const BOTTOM_HREFS = ["/", "/ingresos", "/egresos", "/deudas"];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
