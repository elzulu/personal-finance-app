"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md";
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Diálogo accesible: en móvil sube desde abajo (bottom sheet), en escritorio es centrado.
// Cierra con Escape, atrapa el foco y lo devuelve al cerrar.
export function Modal({ title, onClose, children, size = "md" }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Foco inicial: primer campo del formulario, o el primer elemento enfocable
    const first =
      panel?.querySelector<HTMLElement>("input,select,textarea") ??
      panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus({ preventScroll: true });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  // Portal al body: las tarjetas usan backdrop-blur, que convierte a `fixed` en relativo a la tarjeta
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative bg-slate-900 border border-slate-800 shadow-xl shadow-black/40 w-full ${
          size === "sm" ? "sm:max-w-sm" : "sm:max-w-md"
        } max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] animate-sheet-up`}
      >
        <div className="sticky -top-5 z-10 -mx-5 -mt-5 mb-4 px-5 pt-5 pb-2 bg-slate-900 flex justify-between items-center">
          <h2 id={titleId} className="text-base font-semibold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
