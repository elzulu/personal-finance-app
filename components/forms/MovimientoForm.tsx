"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { movimientoSchema, MovimientoInput } from "@/lib/validations";
import { CATEGORIAS_POR_TIPO } from "@/lib/categorias";
import { toInputDate } from "@/lib/formatters";

interface MovimientoFormProps {
  defaultValues?: Partial<MovimientoInput>;
  onSubmit: (data: MovimientoInput) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

export function MovimientoForm({
  defaultValues,
  onSubmit,
  submitLabel = "Guardar",
  isLoading = false,
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
      presupuesto: null,
      monto: undefined,
      ...defaultValues,
    },
  });

  const tipo = watch("tipo");
  const categorias = CATEGORIAS_POR_TIPO[tipo] ?? [];

  // Reset categoría cuando cambia el tipo
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
      presupuesto: null,
      monto: undefined,
    });
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const errorClass = "text-red-500 text-xs mt-1";

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
          {errors.tipo && <p className={errorClass}>{errors.tipo.message}</p>}
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
        <div className="col-span-2">
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

        {/* Presupuesto */}
        <div className="col-span-2">
          <label className={labelClass}>
            Presupuesto (opcional)
          </label>
          <Controller
            name="presupuesto"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Monto presupuestado"
                className={inputClass}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            )}
          />
          {errors.presupuesto && (
            <p className={errorClass}>{errors.presupuesto.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        {isSubmitting || isLoading ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
