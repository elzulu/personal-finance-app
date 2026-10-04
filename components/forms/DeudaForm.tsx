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
      reset({ miembroId: null, tipo: "TARJETA_CREDITO", descripcion: "", monto: undefined });
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
