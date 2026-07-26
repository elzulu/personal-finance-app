"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aporteAhorroSchema, AporteAhorroInput } from "@/lib/validations";
import { toInputDate } from "@/lib/formatters";

interface Miembro {
  id: string;
  nombre: string;
}

interface AporteAhorroFormProps {
  onSubmit: (data: AporteAhorroInput) => Promise<void>;
  miembros: Miembro[];
}

export function AporteAhorroForm({ onSubmit, miembros }: AporteAhorroFormProps) {
  const today = toInputDate(new Date());

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AporteAhorroInput>({
    resolver: zodResolver(aporteAhorroSchema),
    defaultValues: { fecha: today, concepto: "Aporte a ahorro", monto: undefined, miembroId: null },
  });

  async function handleFormSubmit(data: AporteAhorroInput) {
    await onSubmit(data);
    reset({ fecha: today, concepto: "Aporte a ahorro", monto: undefined, miembroId: null });
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-950/60 text-slate-100 [color-scheme:dark]";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";
  const errorClass = "text-rose-400 text-xs mt-1";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Fecha</label>
          <input type="date" {...register("fecha")} className={inputClass} />
          {errors.fecha && <p className={errorClass}>{errors.fecha.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Monto (COP)</label>
          <Controller
            name="monto"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                className={inputClass}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                }
              />
            )}
          />
          {errors.monto && <p className={errorClass}>{errors.monto.message}</p>}
        </div>

        {miembros.length > 0 && (
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Integrante</label>
            <Controller
              name="miembroId"
              control={control}
              render={({ field }) => (
                <select
                  className={inputClass}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {miembros.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        )}

        <div className={miembros.length > 0 ? "col-span-2 sm:col-span-1" : "col-span-2"}>
          <label className={labelClass}>Concepto</label>
          <input
            type="text"
            {...register("concepto")}
            className={inputClass}
            placeholder="Ej: Aporte a ahorro"
            autoComplete="off"
          />
          {errors.concepto && <p className={errorClass}>{errors.concepto.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-400 hover:brightness-110 disabled:opacity-50 text-slate-950 rounded-xl text-sm font-semibold transition-all"
      >
        {isSubmitting ? "Guardando..." : "Registrar aporte"}
      </button>
    </form>
  );
}
