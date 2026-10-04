"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Download, LogOut, Upload, X } from "lucide-react";
import { useFeedback } from "@/components/ui/Feedback";
import { NAV_LINKS, isActive } from "./navLinks";

interface NavbarProps {
  user: { name?: string | null; email: string };
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}

export function Navbar({ user, menuOpen, onMenuOpenChange }: NavbarProps) {
  const pathname = usePathname();
  const { toast } = useFeedback();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cerrar el menú con Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onMenuOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, onMenuOpenChange]);

  function handleExport() {
    window.location.href = "/api/export";
    onMenuOpenChange(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const csv = await file.text();
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Error al importar el archivo", { kind: "error" });
      } else {
        toast(
          `${json.imported} movimiento(s) importado(s)` +
            (json.skipped > 0 ? `, ${json.skipped} omitido(s)` : "")
        );
      }
    } catch {
      toast("Error al leer el archivo", { kind: "error" });
    } finally {
      setImporting(false);
      onMenuOpenChange(false);
    }
  }

  const menuItem =
    "w-full min-h-12 flex items-center gap-3 px-4 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400";

  return (
    <>
    <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-white text-sm flex items-center gap-2 shrink-0 min-h-11 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-950 text-xs">
            $
          </span>
          Finanzas
        </Link>

        {/* Navegación en línea para pantallas anchas */}
        <nav aria-label="Secciones" className="hidden md:flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-thin">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 px-2.5 min-h-10 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  active ? "bg-cyan-400/10 text-cyan-300" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={16} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onMenuOpenChange(!menuOpen)}
            aria-label="Importar y exportar"
            aria-expanded={menuOpen}
            aria-controls="menu-mas"
            className="hidden md:flex w-10 h-10 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Download size={18} aria-hidden />
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label={`Cerrar sesión de ${user.name ?? user.email}`} title={user.name ?? user.email}
            className="flex items-center justify-center gap-1.5 px-2 min-w-11 min-h-11 md:min-h-10 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <LogOut size={18} aria-hidden />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

    </header>

    {/* Fuera del <header>: su backdrop-blur haría que `fixed` se calcule respecto a la cabecera */}
    {menuOpen && (
      <>
        <div className="fixed inset-0 top-14 bg-black/50 z-30" onClick={() => onMenuOpenChange(false)} aria-hidden />
        <div
          id="menu-mas"
          className="fixed z-[45] inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-auto md:inset-x-auto md:right-4 md:top-14 md:w-64 bg-slate-900 border-t md:border border-slate-800 md:rounded-b-2xl rounded-t-2xl shadow-xl shadow-black/40 py-2 max-h-[70dvh] overflow-y-auto animate-sheet-up"
        >
          <div className="md:hidden flex items-center justify-between px-4 pb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Más opciones</span>
            <button
              onClick={() => onMenuOpenChange(false)}
              aria-label="Cerrar menú"
              className="w-11 h-11 -mr-3 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          {/* En móvil se listan todas las secciones; en escritorio ya están en la barra */}
          <div className="md:hidden">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => onMenuOpenChange(false)}
                  aria-current={active ? "page" : undefined}
                  className={`${menuItem} ${active ? "bg-cyan-400/10 !text-cyan-300" : ""}`}
                >
                  <Icon size={18} aria-hidden />
                  {label}
                </Link>
              );
            })}
            <div className="my-2 border-t border-slate-800" />
          </div>

          <button onClick={handleExport} className={menuItem}>
            <Download size={18} aria-hidden /> Exportar CSV
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className={`${menuItem} disabled:opacity-50`}
          >
            <Upload size={18} aria-hidden /> {importing ? "Importando..." : "Importar CSV"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Archivo CSV a importar"
          />
        </div>
      </>
    )}
    </>
  );
}
