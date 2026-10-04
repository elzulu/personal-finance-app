/**
 * Tests unitarios — lib/deudas.ts y validaciones del desglose de pagos
 */
import { describe, it, expect } from "vitest";
import { abonoCapital, interesSugerido } from "@/lib/deudas";
import { movimientoSchema, deudaSchema } from "@/lib/validations";

describe("abonoCapital", () => {
  it("sin desglose, todo el pago es capital", () => {
    expect(abonoCapital(500000)).toBe(500000);
    expect(abonoCapital(500000, null, null)).toBe(500000);
  });

  it("resta interés y cargos del pago", () => {
    expect(abonoCapital(200000, 25000, 9000)).toBe(166000);
  });

  it("acepta strings (Decimal serializado) y valores nulos", () => {
    expect(abonoCapital("200000", "25000", undefined)).toBe(175000);
  });

  it("devuelve negativo si el desglose supera el pago (el llamador valida)", () => {
    expect(abonoCapital(10000, 8000, 5000)).toBe(-3000);
  });
});

describe("interesSugerido", () => {
  it("calcula saldo × tasa mensual y redondea a pesos", () => {
    expect(interesSugerido(1000000, 2.5)).toBe(25000);
    expect(interesSugerido("333333", "2.5")).toBe(8333);
  });

  it("devuelve 0 sin tasa o con tasa 0", () => {
    expect(interesSugerido(1000000, null)).toBe(0);
    expect(interesSugerido(1000000, 0)).toBe(0);
    expect(interesSugerido(1000000, undefined)).toBe(0);
  });
});

describe("movimientoSchema — desglose", () => {
  const base = {
    fecha: "2026-10-04",
    tipo: "EGRESO" as const,
    categoria: "Deudas",
    concepto: "Pago tarjeta",
    monto: 200000,
  };

  it("acepta interés y cargos que suman menos que el monto", () => {
    expect(movimientoSchema.safeParse({ ...base, interes: 25000, cargos: 9000 }).success).toBe(true);
  });

  it("acepta que interés + cargos sean exactamente el monto", () => {
    expect(movimientoSchema.safeParse({ ...base, interes: 190000, cargos: 10000 }).success).toBe(true);
  });

  it("rechaza interés + cargos mayores al monto", () => {
    const r = movimientoSchema.safeParse({ ...base, interes: 190000, cargos: 20000 });
    expect(r.success).toBe(false);
  });

  it("rechaza valores negativos", () => {
    expect(movimientoSchema.safeParse({ ...base, interes: -1 }).success).toBe(false);
    expect(movimientoSchema.safeParse({ ...base, cargos: -5 }).success).toBe(false);
  });

  it("interés y cargos son opcionales y admiten null", () => {
    expect(movimientoSchema.safeParse({ ...base, interes: null, cargos: null }).success).toBe(true);
  });
});

describe("deudaSchema — condiciones", () => {
  const base = { tipo: "TARJETA_CREDITO", monto: 1000000 };

  it("acepta tasa mensual y cargo fijo", () => {
    expect(deudaSchema.safeParse({ ...base, tasaMensual: 2.5, cargoFijo: 9000 }).success).toBe(true);
  });

  it("son opcionales y admiten null", () => {
    expect(deudaSchema.safeParse(base).success).toBe(true);
    expect(deudaSchema.safeParse({ ...base, tasaMensual: null, cargoFijo: null }).success).toBe(true);
  });

  it("rechaza tasa negativa o mayor a 100 y cargo negativo", () => {
    expect(deudaSchema.safeParse({ ...base, tasaMensual: -1 }).success).toBe(false);
    expect(deudaSchema.safeParse({ ...base, tasaMensual: 101 }).success).toBe(false);
    expect(deudaSchema.safeParse({ ...base, cargoFijo: -10 }).success).toBe(false);
  });
});
