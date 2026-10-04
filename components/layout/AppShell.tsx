"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  user: { name?: string | null; email: string };
  children: ReactNode;
}

// Cascarón de la app: cabecera, contenido y barra inferior comparten el estado del menú "Más"
export function AppShell({ user, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar el menú al navegar
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-slate-900 focus:text-cyan-300 focus:px-3 focus:py-2 focus:rounded-lg"
      >
        Saltar al contenido
      </a>
      <Navbar user={user} menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} />
      <main id="contenido" className="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-24">
        {children}
      </main>
      <BottomNav menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)} />
    </div>
  );
}
