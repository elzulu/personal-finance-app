"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { BOTTOM_HREFS, NAV_LINKS, isActive } from "./navLinks";

interface BottomNavProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
}

// Barra de navegación inferior para móvil: 4 destinos principales + "Más"
export function BottomNav({ menuOpen, onToggleMenu }: BottomNavProps) {
  const pathname = usePathname();
  const principales = NAV_LINKS.filter((l) => BOTTOM_HREFS.includes(l.href));
  // "Más" se resalta cuando la página actual no está entre los destinos fijos
  const enOtraPagina = !principales.some((l) => isActive(pathname, l.href));

  const itemClass = (active: boolean) =>
    `flex-1 min-h-14 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400 ${
      active ? "text-cyan-300" : "text-slate-400 hover:text-slate-100"
    }`;

  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex pb-[env(safe-area-inset-bottom)]"
    >
      {principales.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={itemClass(active)}>
            <Icon size={22} aria-hidden />
            {label}
          </Link>
        );
      })}
      <button
        onClick={onToggleMenu}
        aria-expanded={menuOpen}
        aria-controls="menu-mas"
        className={itemClass(menuOpen || enOtraPagina)}
      >
        <Menu size={22} aria-hidden />
        Más
      </button>
    </nav>
  );
}
