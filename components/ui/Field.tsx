import { forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, useId } from "react";

export const controlClass =
  "w-full min-h-11 px-3 py-2.5 border border-slate-700 rounded-lg text-sm bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent aria-[invalid=true]:border-rose-400 [color-scheme:dark]";

interface FieldShellProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}

// Envoltura común: etiqueta asociada (htmlFor), pista y error accesibles
export function FieldShell({ id, label, hint, error, className = "", children }: FieldShellProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-400 mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-rose-400 text-xs mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

interface CommonProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & CommonProps>(
  function Input({ label, hint, error, wrapperClassName, className = "", id, ...props }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <FieldShell id={fid} label={label} hint={hint} error={error} className={wrapperClassName}>
        <input
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          className={`${controlClass} ${className}`}
          {...props}
        />
      </FieldShell>
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & CommonProps>(
  function Select({ label, hint, error, wrapperClassName, className = "", id, children, ...props }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <FieldShell id={fid} label={label} hint={hint} error={error} className={wrapperClassName}>
        <select
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          className={`${controlClass} ${className}`}
          {...props}
        >
          {children}
        </select>
      </FieldShell>
    );
  }
);
