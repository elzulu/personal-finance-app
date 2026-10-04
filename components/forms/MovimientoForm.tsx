"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { movimientoSchema, MovimientoInput } from "@/lib/validations";
import { CATEGORIAS_POR_TIPO } from "@/lib/categorias";
import { getCategoriaIcono } from "@/lib/categoriaIcons";
import { todayInputDate, formatCOP } from "@/lib/formatters";
import { abonoCapital, interesSugerido } from "@/lib/deudas";
import { getTipoDeudaLabel } from "@/lib/tiposDeuda";
import { Button } from "@/components/ui/Button";
import { Input, Select, FieldShell } from "@/components/ui/Field";
import { MontoInput } from "@/components/ui/MontoInput";
import type { DeudaOption } from "@/lib/types";

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
  deudas?: DeudaOption[];
  // En edición el formulario se cierra al guardar; en alta se limpia y vuelve al monto
  isEdit?: boolean;
}

export function MovimientoForm({
  defaultValues,
  onSubmit,
  submitLabel = "Guardar",
  isLoading = false,
  miembros = [],
  deudas = [],
  isEdit = false,
}: MovimientoFormProps) {
  const today = todayInputDate();
  const uid = useId();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
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
      deudaId: null,
      interes: null,
      cargos: null,
      ...defaultValues,
    },
  });

  const tipo = watch("tipo");
  const categoria = watch("categoria");
  const miembroId = watch("miembroId");
  const deudaId = watch("deudaId");
  const monto = watch("monto");
  const interes = watch("interes");
  const cargos = watch("cargos");
  const categorias = CATEGORIAS_POR_TIPO[tipo] ?? [];

  // Al cambiar de tipo la categoría deja de ser válida
  function cambiarTipo(nuevo: "INGRESO" | "EGRESO") {
    if (nuevo === tipo) return;
    setValue("tipo", nuevo);
    setValue("categoria", "");
  }

  // Limpiar la deuda vinculada al cambiar de categoría
  useEffect(() => {
    if (categoria !== "Deudas") {
      setValue("deudaId", null);
      setValue("interes", null);
      setValue("cargos", null);
    }
  }, [categoria, setValue]);

  // Deudas disponibles: sin pagar y filtradas por miembro si se seleccionó uno
  const deudasDisponibles = useMemo(() => {
    return deudas.filter(
      (d) => !d.pagado && (!miembroId || d.miembroId === miembroId)
    );
  }, [deudas, miembroId]);

  const mostrarSelectorDeuda =
    tipo === "EGRESO" && categoria === "Deudas" && deudasDisponibles.length > 0;

  // Al elegir una deuda se sugiere el interés (saldo × tasa) y el cargo fijo; ambos son editables
  function elegirDeuda(id: string | null) {
    setValue("deudaId", id);
    const d = id ? deudas.find((x) => x.id === id) : undefined;
    const interesSug = d ? interesSugerido(d.monto, d.tasaMensual) : 0;
    const cargoSug = d?.cargoFijo != null ? Number(d.cargoFijo) : 0;
    setValue("interes", interesSug > 0 ? interesSug : null);
    setValue("cargos", cargoSug > 0 ? cargoSug : null);
  }

  const capital = abonoCapital(monto, interes, cargos);

  async function handleFormSubmit(data: MovimientoInput) {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "No se pudo guardar. Intenta de nuevo.");
      return;
    }
    // Se conserva el tipo para poder registrar varios seguidos del mismo tipo
    reset({
      fecha: today,
      tipo: data.tipo,
      categoria: "",
      concepto: "",
      monto: undefined,
      miembroId: null,
      deudaId: null,
      interes: null,
      cargos: null,
      ...(isEdit ? defaultValues : {}),
    });
    // El botón de envío se deshabilita mientras guarda y el navegador suelta el foco; se devuelve al monto
    if (!isEdit) setTimeout(() => setFocus("monto"), 0);
  }

  const segBase =
    "flex-1 min-h-11 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
      {/* Tipo */}
      <div
        role="radiogroup"
        aria-label="Tipo de movimiento"
        className="flex gap-1 p-1 rounded-xl bg-slate-950/60 border border-slate-800"
      >
        <button
          type="button"
          role="radio"
          aria-checked={tipo === "EGRESO"}
          onClick={() => cambiarTipo("EGRESO")}
          className={`${segBase} ${tipo === "EGRESO" ? "bg-rose-400/15 text-rose-300 ring-1 ring-inset ring-rose-400/30" : "text-slate-400 hover:text-slate-200"}`}
        >
          Egreso
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={tipo === "INGRESO"}
          onClick={() => cambiarTipo("INGRESO")}
          className={`${segBase} ${tipo === "INGRESO" ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30" : "text-slate-400 hover:text-slate-200"}`}
        >
          Ingreso
        </button>
      </div>

      {/* Monto */}
      <Controller
        name="monto"
        control={control}
        render={({ field }) => (
          <MontoInput
            large
            ref={field.ref}
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.monto?.message}
          />
        )}
      />

      {/* Categoría como chips */}
      <FieldShell id={`${uid}-cat`} error={errors.categoria?.message}>
        <span id={`${uid}-cat-label`} className="block text-sm font-medium text-slate-300 mb-1.5">
          Categoría
        </span>
        <div role="group" aria-labelledby={`${uid}-cat-label`} className="flex flex-wrap gap-2">
          {categorias.map((cat) => {
            const selected = categoria === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={selected}
                onClick={() => setValue("categoria", cat, { shouldValidate: true })}
                className={`min-h-11 px-3 inline-flex items-center gap-1.5 rounded-xl border text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  selected
                    ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200 font-medium"
                    : "border-slate-700 bg-slate-950/40 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span aria-hidden>{getCategoriaIcono(cat)}</span>
                {cat}
              </button>
            );
          })}
        </div>
      </FieldShell>

      {/* Concepto */}
      <Input
        label="Concepto"
        type="text"
        {...register("concepto")}
        placeholder="Ej: Arriendo, Gasolina, Rappi..."
        autoComplete="off"
        error={errors.concepto?.message}
      />

      <div className="grid grid-cols-2 gap-3">
        {/* Fecha */}
        <Input
          label="Fecha"
          type="date"
          {...register("fecha")}
          wrapperClassName={miembros.length > 0 ? "col-span-2 sm:col-span-1" : "col-span-2"}
          error={errors.fecha?.message}
        />

        {/* Miembro (solo si hay miembros configurados) */}
        {miembros.length > 0 && (
          <Controller
            name="miembroId"
            control={control}
            render={({ field }) => (
              <Select
                label="Miembro"
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

        {/* Deuda vinculada (solo cuando categoría = Deudas y hay deudas activas) */}
        {mostrarSelectorDeuda && (
          <Controller
            name="deudaId"
            control={control}
            render={({ field }) => (
              <Select
                label={
                  <>
                    Deuda vinculada <span className="text-slate-400 font-normal">(opcional)</span>
                  </>
                }
                wrapperClassName="col-span-2"
                hint="Al vincular, el saldo de la deuda se actualizará automáticamente."
                value={field.value ?? ""}
                onChange={(e) => elegirDeuda(e.target.value === "" ? null : e.target.value)}
              >
                <option value="">Sin vincular</option>
                {deudasDisponibles.map((d) => (
                  <option key={d.id} value={d.id}>
                    {getTipoDeudaLabel(d.tipo)}
                    {d.miembro ? ` · ${d.miembro.nombre}` : ""}
                    {" — "}
                    {formatCOP(Number(d.monto))} pendiente
                  </option>
                ))}
              </Select>
            )}
          />
        )}

        {/* Desglose del pago: solo el abono a capital baja el saldo de la deuda */}
        {mostrarSelectorDeuda && deudaId && (
          <fieldset className="col-span-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-3">
            <legend className="px-1 text-xs font-medium text-slate-400">Desglose del pago (opcional)</legend>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="interes"
                control={control}
                render={({ field }) => (
                  <MontoInput
                    label="Interés"
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? null)}
                    onBlur={field.onBlur}
                    error={errors.interes?.message}
                    wrapperClassName="col-span-2 sm:col-span-1"
                  />
                )}
              />
              <Controller
                name="cargos"
                control={control}
                render={({ field }) => (
                  <MontoInput
                    label="Cargos (seguro, manejo)"
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? null)}
                    onBlur={field.onBlur}
                    error={errors.cargos?.message}
                    wrapperClassName="col-span-2 sm:col-span-1"
                  />
                )}
              />
            </div>
            <p
              className={`text-sm flex items-center justify-between ${capital < 0 ? "text-rose-300" : "text-slate-300"}`}
              aria-live="polite"
            >
              <span>Abono a capital</span>
              <span className="font-semibold">{formatCOP(Math.max(0, capital))}</span>
            </p>
            {capital < 0 && (
              <p role="alert" className="text-xs text-rose-300">
                El interés y los cargos superan el monto pagado.
              </p>
            )}
            <p className="text-xs text-slate-400">
              Solo el abono a capital reduce el saldo de la deuda; el monto total cuenta como egreso del mes.
            </p>
          </fieldset>
        )}

        {/* Aviso cuando categoría = Deudas pero no hay deudas registradas */}
        {tipo === "EGRESO" && categoria === "Deudas" && deudas.length === 0 && (
          <div className="col-span-2">
            <p className="text-xs text-slate-400">
              Registra una deuda en el módulo{" "}
              <a href="/deudas" className="text-cyan-400 underline underline-offset-2">
                Deudas
              </a>{" "}
              para vincular este pago automáticamente.
            </p>
          </div>
        )}
      </div>

      {submitError && (
        <p role="alert" className="text-sm text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">
          {submitError}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={isSubmitting || isLoading}>
        {isSubmitting || isLoading ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
