"use client";

import { forwardRef, ReactNode, useId } from "react";
import { FieldShell, controlClass } from "@/components/ui/Field";

const numberFormat = new Intl.NumberFormat("es-CO");

interface MontoInputProps {
  label?: ReactNode;
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  name?: string;
  error?: string;
  large?: boolean;
  wrapperClassName?: string;
}

// Campo de monto en COP: teclado numérico, separador de miles y solo dígitos (sin decimales)
export const MontoInput = forwardRef<HTMLInputElement, MontoInputProps>(function MontoInput(
  { label = "Monto (COP)", value, onChange, onBlur, name, error, large = false, wrapperClassName },
  ref
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} className={wrapperClassName}>
      <div className="relative">
        <span
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 ${large ? "text-xl" : "text-sm"}`}
          aria-hidden
        >
          $
        </span>
        <input
          id={id}
          ref={ref}
          name={name}
          onBlur={onBlur}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${controlClass} pl-8 ${large ? "text-2xl font-bold min-h-14" : ""}`}
          value={value === undefined || value === null ? "" : numberFormat.format(value)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            onChange(digits === "" ? undefined : Number(digits));
          }}
        />
      </div>
    </FieldShell>
  );
});
