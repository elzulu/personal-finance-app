import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      {icon && (
        <div
          className="w-12 h-12 rounded-2xl bg-slate-800/70 text-slate-400 flex items-center justify-center mb-3"
          aria-hidden
        >
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {description && <p className="text-sm text-slate-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4 text-center">
      <p className="text-sm text-rose-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 min-h-11 px-4 rounded-xl border border-slate-700 text-sm text-slate-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
