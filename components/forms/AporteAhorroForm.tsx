"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aporteAhorroSchema, AporteAhorroInput } from "@/lib/validations";
import { todayInputDate } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { MontoInput } from "@/components/ui/MontoInput";

interface Miembro {
  id: string;
  nombre: string;
}

interface AporteAhorroFormProps {
  onSubmit: (data: AporteAhorroInput) => Promise<void>;
  miembros: Miembro[];
}

export function AporteAhorroForm({ onSubmit, miembros }: AporteAhorroFormProps) {
  const today = todayInputDate();
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "No se pudo guardar. Intenta de nuevo.");
      return;
    }
    reset({ fecha: today, concepto: "Aporte a ahorro", monto: undefined, miembroId: null });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Controller
          name="monto"
          control={control}
          render={({ field }) => (
            <MontoInput
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
          label="Fecha"
          type="date"
          {...register("fecha")}
          wrapperClassName="col-span-2 sm:col-span-1"
          error={errors.fecha?.message}
        />

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

        <Input
          label="Concepto"
          type="text"
          {...register("concepto")}
          placeholder="Ej: Aporte a ahorro"
          autoComplete="off"
          wrapperClassName={miembros.length > 0 ? "col-span-2 sm:col-span-1" : "col-span-2"}
          error={errors.concepto?.message}
        />
      </div>

      {submitError && (
        <p role="alert" className="mt-3 text-sm text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">
          {submitError}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-4">
        {isSubmitting ? "Guardando..." : "Registrar aporte"}
      </Button>
    </form>
  );
}
