"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deudaSchema, DeudaInput } from "@/lib/validations";
import { TIPOS_DEUDA } from "@/lib/tiposDeuda";

interface Miembro {
  id: string;
  nombre: string;
}

interface DeudaFormProps {
  defaultValues?: Partial<DeudaInput>;
  onSubmit: (data: DeudaInput) => Promise<void>;
  submitLabel?: string;
  miembros: Miembro[];
}

export function DeudaForm({ defaultValues, onSubmit, submitLabel = "Registrar deuda", miembros }: DeudaFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeudaInput>({
    resolver: zodResolver(deudaSchema),
    defaultValues: {
      miembroId: null,
      tipo: "TARJETA_CREDITO",
      descripcion: "",
      monto: undefined,
      ...defaultValues,
    },
  });

  async function handleFormSubmit(data: DeudaInput) {
    await onSubmit(data);
    if (!defaultValues) {
      reset({ miembroId: null, tipo: "TARJETA_CREDITO", descripcion: "", monto: undefined });
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-slate-950/60 text-slate-100 [color-scheme:dark]";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";
  const errorClass = "text-rose-400 text-xs mt-1";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <div className="grid grid-cols-2 gap-3">
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
          <label className={labelClass}>Tipo de deuda</label>
          <select {...register("tipo")} className={inputClass}>
            {TIPOS_DEUDA.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.tipo && <p className={errorClass}>{errors.tipo.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Monto adeudado (COP)</label>
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

        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Descripción (opcional)</label>
          <input
            type="text"
            {...register("descripcion")}
            className={inputClass}
            placeholder="Ej: Compra de electrodoméstico"
            autoComplete="off"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full py-3 bg-gradient-to-r from-rose-500 to-orange-400 hover:brightness-110 disabled:opacity-50 text-slate-950 rounded-xl text-sm font-semibold transition-all"
      >
        {isSubmitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
