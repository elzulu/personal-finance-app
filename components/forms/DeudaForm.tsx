"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deudaSchema, DeudaInput } from "@/lib/validations";
import { TIPOS_DEUDA } from "@/lib/tiposDeuda";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { MontoInput } from "@/components/ui/MontoInput";

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
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      tasaMensual: null,
      cargoFijo: null,
      diaPago: null,
      ...defaultValues,
    },
  });

  async function handleFormSubmit(data: DeudaInput) {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "No se pudo guardar. Intenta de nuevo.");
      return;
    }
    if (!defaultValues) {
      reset({ miembroId: null, tipo: "TARJETA_CREDITO", descripcion: "", monto: undefined, tasaMensual: null, cargoFijo: null, diaPago: null });
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <div className="grid grid-cols-2 gap-3">
        {miembros.length > 0 && (
          <Controller
            name="miembroId"
            control={control}
            render={({ field }) => (
              <Select
                label="Integrante"
                wrapperClassName="col-span-2 sm:col-span-1"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
              >
                <option value="">Sin asignar</option>
                {miembros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </Select>
            )}
          />
        )}

        <Select
          label="Tipo de deuda"
          {...register("tipo")}
          wrapperClassName={miembros.length > 0 ? "col-span-2 sm:col-span-1" : "col-span-2"}
          error={errors.tipo?.message}
        >
          {TIPOS_DEUDA.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>

        <Controller
          name="monto"
          control={control}
          render={({ field }) => (
            <MontoInput
              label="Monto adeudado (COP)"
              ref={field.ref}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.monto?.message}
              wrapperClassName="col-span-2 sm:col-span-1"
            />
          )}
        />

        <Input
          label="Descripción (opcional)"
          type="text"
          {...register("descripcion")}
          placeholder="Ej: Compra de electrodoméstico"
          autoComplete="off"
          wrapperClassName="col-span-2 sm:col-span-1"
        />

        <p className="col-span-2 text-xs text-slate-400 -mb-1">
          Opcional: con la tasa y el cargo, al registrar un pago se sugiere el interés del mes y solo el abono a
          capital baja el saldo.
        </p>

        <Controller
          name="diaPago"
          control={control}
          render={({ field }) => (
            <Input
              label="Día de pago del mes"
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              max="31"
              placeholder="Ej: 15"
              hint="Cuando se cumple el mes de interés; te recordamos ese día."
              wrapperClassName="col-span-2"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
              error={errors.diaPago?.message}
            />
          )}
        />

        <Controller
          name="tasaMensual"
          control={control}
          render={({ field }) => (
            <Input
              label="Interés mensual (%)"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max="100"
              placeholder="Ej: 2.5"
              wrapperClassName="col-span-2 sm:col-span-1"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
              error={errors.tasaMensual?.message}
            />
          )}
        />

        <Controller
          name="cargoFijo"
          control={control}
          render={({ field }) => (
            <MontoInput
              label="Cargo fijo mensual (seguro, manejo)"
              value={field.value}
              onChange={(v) => field.onChange(v ?? null)}
              onBlur={field.onBlur}
              error={errors.cargoFijo?.message}
              wrapperClassName="col-span-2 sm:col-span-1"
            />
          )}
        />
      </div>

      {submitError && (
        <p role="alert" className="mt-3 text-sm text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">
          {submitError}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-4">
        {isSubmitting ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
