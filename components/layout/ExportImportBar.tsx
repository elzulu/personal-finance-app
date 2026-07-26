"use client";

import { useRef, useState } from "react";

export function ExportImportBar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleExport() {
    window.location.href = "/api/export";
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
    <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      {message && (
        <div className="px-4 py-1.5 text-center text-xs text-cyan-300 bg-cyan-400/10 border-b border-slate-800">
          {message}
        </div>
      )}
      <div className="max-w-5xl mx-auto flex items-stretch">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <span aria-hidden>⬇️</span> Exportar CSV
        </button>
        <div className="w-px bg-slate-800" />
        <button
          onClick={handleImportClick}
          disabled={importing}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
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
      </div>
    </div>
  );
}
