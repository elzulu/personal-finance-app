"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface NavbarProps {
  user: { name?: string | null; email: string };
}

const links = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/movimientos", label: "Movimientos", icon: "📋" },
  { href: "/familia", label: "Familia", icon: "👨‍👩‍👧" },
  { href: "/graficas", label: "Gráficas", icon: "📊" },
  { href: "/ahorro", label: "Ahorro", icon: "🐷" },
  { href: "/deudas", label: "Deudas", icon: "💳" },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    window.location.href = "/api/export";
    setOpen(false);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setMessage(null);
    try {
      const csv = await file.text();
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "Error al importar el archivo");
      } else {
        setMessage(
          `${json.imported} movimiento(s) importado(s)` +
            (json.skipped > 0 ? `, ${json.skipped} omitido(s)` : "")
        );
      }
    } catch {
      setMessage("Error al leer el archivo");
    } finally {
      setImporting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  return (
    <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="w-8 h-8 -ml-1 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span className={`block h-0.5 w-5 bg-slate-200 transition-transform ${open ? "translate-y-[6.5px] rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-slate-200 transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-slate-200 transition-transform ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
          </button>
          <span className="font-bold text-white text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-950 text-xs">
              $
            </span>
            Finanzas
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:block">
            {user.name ?? user.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 top-14 bg-black/50 z-30"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute top-full left-0 w-full sm:w-72 bg-slate-900 border-b sm:border border-slate-800 sm:rounded-b-2xl shadow-xl shadow-black/40 z-40 py-2">
            {links.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === href
                    ? "bg-cyan-400/10 text-cyan-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span aria-hidden>{icon}</span>
                {label}
              </Link>
            ))}

            <div className="my-2 border-t border-slate-800" />

            {message && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-cyan-400/10 text-cyan-300 text-xs">
                {message}
              </div>
            )}

            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <span aria-hidden>⬇️</span> Exportar CSV
            </button>
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
            >
              <span aria-hidden>⬆️</span> {importing ? "Importando..." : "Importar CSV"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </nav>
        </>
      )}
    </header>
  );
}
