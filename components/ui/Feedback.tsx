"use client";

import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  kind: "success" | "error";
  action?: ToastAction;
}

interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}

interface FeedbackContextValue {
  toast: (message: string, opts?: { kind?: "success" | "error"; action?: ToastAction; duration?: number }) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback debe usarse dentro de <FeedbackProvider>");
  return ctx;
}

// Toasts (con acción opcional, p. ej. "Deshacer") y confirmaciones propias en lugar de confirm() nativo
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback<FeedbackContextValue["toast"]>(
    (message, opts) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { id, message, kind: opts?.kind ?? "success", action: opts?.action }]);
      setTimeout(() => dismiss(id), opts?.duration ?? (opts?.action ? 7000 : 3500));
    },
    [dismiss]
  );

  const confirm = useCallback<FeedbackContextValue["confirm"]>((opts) => {
    return new Promise<boolean>((resolve) => setPending({ ...opts, resolve }));
  }, []);

  function answer(value: boolean) {
    pending?.resolve(value);
    setPending(null);
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div
        className="fixed z-[60] left-0 right-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 flex flex-col items-center gap-2 px-4 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-center gap-3 max-w-md w-full sm:w-auto rounded-xl border px-4 py-3 text-sm shadow-lg shadow-black/40 backdrop-blur-md ${
              t.kind === "error"
                ? "bg-rose-950/90 border-rose-400/30 text-rose-200"
                : "bg-slate-900/95 border-emerald-400/30 text-slate-100"
            }`}
          >
            {t.kind === "error" ? (
              <AlertCircle size={18} className="text-rose-400 shrink-0" aria-hidden />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" aria-hidden />
            )}
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className="font-semibold text-cyan-300 hover:text-cyan-200 min-h-9 px-2 -mr-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {pending && (
        <Modal title={pending.title} size="sm" onClose={() => answer(false)}>
          {pending.message && <div className="text-sm text-slate-300 mb-5">{pending.message}</div>}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => answer(false)}>
              Cancelar
            </Button>
            <Button variant={pending.danger ? "danger" : "primary"} onClick={() => answer(true)}>
              {pending.confirmLabel ?? "Confirmar"}
            </Button>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}
