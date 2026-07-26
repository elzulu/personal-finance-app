"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { movimientoSchema, MovimientoInput } from "@/lib/validations";
import { CATEGORIAS_POR_TIPO } from "@/lib/categorias";
import { toInputDate } from "@/lib/formatters";

interface Miembro {
  id: string;
  nombre: string;
}

interface MovimientoFormProps {
  defaultValues?: Partial<MovimientoInput>;
  onSubmit: (data: MovimientoInput) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  miembros?: Miembro[];
}

export function MovimientoForm({
  defaultValues,
  onSubmit,
  submitLabel = "Guardar",
  isLoading = false,
  miembros = [],
}: MovimientoFormProps) {
  const today = toInputDate(new Date());

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovimientoInput>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      fecha: today,
      tipo: "EGRESO",
      categoria: "",
      concepto: "",
      monto: undefined,
      miembroId: null,
      ...defaultValues,
    },
  });

  const tipo = watch("tipo");
  const categorias = CATEGORIAS_POR_TIPO[tipo] ?? [];

  useEffect(() => {
    setValue("categoria", "");
  }, [tipo, setValue]);

  async function handleFormSubmit(data: MovimientoInput) {
    await onSubmit(data);
    reset({
      fecha: today,
      tipo: "EGRESO",
      categoria: "",
      concepto: "",
      monto: undefined,
      miembroId: null,
    });
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-slate-950/60 text-slate-100 [color-scheme:dark]";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";
  const errorClass = "text-rose-400 text-xs mt-1";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <div className="grid grid-cols-2 gap-3">
        {/* Fecha */}
        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Fecha</label>
          <input type="date" {...register("fecha")} className={inputClass} />
          {errors.fecha && <p className={errorClass}>{errors.fecha.message}</p>}
        </div>

        {/* Tipo */}
        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Tipo</label>
          <select {...register("tipo")} className={inputClass}>
            <option value="EGRESO">Egreso</option>
            <option value="INGRESO">Ingreso</option>
          </select>
        </div>

        {/* Categoría */}
        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Categoría</label>
          <select {...register("categoria")} className={inputClass}>
            <option value="">Seleccionar...</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.categoria && (
            <p className={errorClass}>{errors.categoria.message}</p>
          )}
        </div>

        {/* Monto */}
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
                  field.onChange(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            )}
          />
          {errors.monto && <p className={errorClass}>{errors.monto.message}</p>}
        </div>

        {/* Concepto */}
        <div className={miembros.length > 0 ? "col-span-2 sm:col-span-1" : "col-span-2"}>
          <label className={labelClass}>Concepto</label>
          <input
            type="text"
            {...register("concepto")}
            className={inputClass}
            placeholder="Ej: Arriendo, Gasolina, Rappi..."
            autoComplete="off"
          />
          {errors.concepto && (
            <p className={errorClass}>{errors.concepto.message}</p>
          )}
        </div>

        {/* Miembro (solo si hay miembros configurados) */}
        {miembros.length > 0 && (
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Miembro</label>
            <Controller
              name="miembroId"
              control={control}
              render={({ field }) => (
                <select
                  className={inputClass}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? null : e.target.value)
                  }
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
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="mt-4 w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:brightness-110 disabled:opacity-50 text-slate-950 rounded-xl text-sm font-semibold transition-all"
      >
        {isSubmitting || isLoading ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
