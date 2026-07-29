import { describe, it, expect } from "vitest";
import {
  movimientoSchema,
  movimientoUpdateSchema,
  movimientoBaseSchema,
  deudaSchema,
  deudaUpdateSchema,
  aporteAhorroSchema,
} from "@/lib/validations";

// ─── Datos base válidos ────────────────────────────────────────────────────────

const movimientoValido = {
  fecha: "2026-07-01",
  tipo: "EGRESO" as const,
  categoria: "Deudas",
  concepto: "Pago tarjeta",
  monto: 500000,
  miembroId: null,
  deudaId: null,
};

const deudaValida = {
  tipo: "TARJETA_CREDITO" as const,
  monto: 1000000,
  miembroId: null,
  descripcion: "Compra electrodoméstico",
};

// ─── movimientoSchema ─────────────────────────────────────────────────────────

describe("movimientoSchema", () => {
  it("acepta un movimiento EGRESO completo con deudaId", () => {
    const result = movimientoSchema.safeParse({
      ...movimientoValido,
      deudaId: "cuid-deuda-123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deudaId).toBe("cuid-deuda-123");
    }
  });

  it("acepta deudaId null explícito", () => {
    const result = movimientoSchema.safeParse({
      ...movimientoValido,
      deudaId: null,
    });
    expect(result.success).toBe(true);
  });

  it("acepta deudaId ausente (campo opcional)", () => {
    const { deudaId: _d, ...sinDeudaId } = movimientoValido;
    const result = movimientoSchema.safeParse(sinDeudaId);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deudaId).toBeUndefined();
    }
  });

  it("acepta movimiento INGRESO con categoría válida", () => {
    const result = movimientoSchema.safeParse({
      ...movimientoValido,
      tipo: "INGRESO",
      categoria: "Sueldo",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza categoría inválida para el tipo", () => {
    const result = movimientoSchema.safeParse({
      ...movimientoValido,
      tipo: "INGRESO",
      categoria: "Deudas", // solo existe en EGRESO
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain("categoria");
    }
  });

  it("rechaza monto negativo", () => {
    const result = movimientoSchema.safeParse({
      ...movimientoValido,
      monto: -1000,
    });
    expect(result.success).toBe(false);
  });

  it("rechaza monto cero", () => {
    const result = movimientoSchema.safeParse({
      ...movimientoValido,
      monto: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rechaza fecha vacía", () => {
    const result = movimientoSchema.safeParse({
      ...movimientoValido,
      fecha: "",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza concepto demasiado largo", () => {
    const result = movimientoSchema.safeParse({
      ...movimientoValido,
      concepto: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("acepta miembroId string", () => {
    const result = movimientoSchema.safeParse({
      ...movimientoValido,
      miembroId: "cuid-miembro-abc",
    });
    expect(result.success).toBe(true);
  });
});

// ─── movimientoUpdateSchema ───────────────────────────────────────────────────

describe("movimientoUpdateSchema", () => {
  it("acepta objeto vacío (todos los campos son parciales)", () => {
    const result = movimientoUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("acepta solo monto", () => {
    const result = movimientoUpdateSchema.safeParse({ monto: 800000 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.monto).toBe(800000);
      expect(result.data.deudaId).toBeUndefined();
    }
  });

  it("acepta deudaId null (desvinculación)", () => {
    const result = movimientoUpdateSchema.safeParse({ deudaId: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deudaId).toBeNull();
    }
  });

  it("acepta deudaId string (vinculación)", () => {
    const result = movimientoUpdateSchema.safeParse({ deudaId: "cuid-abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deudaId).toBe("cuid-abc");
    }
  });

  it("acepta actualización parcial (monto + concepto)", () => {
    const result = movimientoUpdateSchema.safeParse({
      monto: 300000,
      concepto: "Nuevo concepto",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza monto negativo incluso en actualización parcial", () => {
    const result = movimientoUpdateSchema.safeParse({ monto: -500 });
    expect(result.success).toBe(false);
  });
});

// ─── movimientoBaseSchema.partial ─────────────────────────────────────────────

describe("movimientoBaseSchema (base schema)", () => {
  it("incluye deudaId como campo opcional-nullable", () => {
    const partial = movimientoBaseSchema.partial();
    const result = partial.safeParse({ deudaId: "abc" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.deudaId).toBe("abc");
  });
});

// ─── deudaSchema ─────────────────────────────────────────────────────────────

describe("deudaSchema", () => {
  it("acepta una deuda válida con todos los campos", () => {
    const result = deudaSchema.safeParse(deudaValida);
    expect(result.success).toBe(true);
  });

  it("acepta deuda sin miembro ni descripción", () => {
    const result = deudaSchema.safeParse({ tipo: "OTRO", monto: 200000 });
    expect(result.success).toBe(true);
  });

  it("acepta todos los tipos de deuda válidos", () => {
    const tipos = [
      "TARJETA_CREDITO",
      "ADDI",
      "SISTECREDITO",
      "PRESTAMO_BANCARIO",
      "OTRO",
    ];
    for (const tipo of tipos) {
      const result = deudaSchema.safeParse({ tipo, monto: 100000 });
      expect(result.success).toBe(true);
    }
  });

  it("rechaza tipo de deuda inválido", () => {
    const result = deudaSchema.safeParse({ tipo: "TIPO_DESCONOCIDO", monto: 100000 });
    expect(result.success).toBe(false);
  });

  it("rechaza monto negativo", () => {
    const result = deudaSchema.safeParse({ tipo: "OTRO", monto: -1 });
    expect(result.success).toBe(false);
  });

  it("rechaza descripción demasiado larga", () => {
    const result = deudaSchema.safeParse({
      tipo: "OTRO",
      monto: 100000,
      descripcion: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

// ─── deudaUpdateSchema ────────────────────────────────────────────────────────

describe("deudaUpdateSchema", () => {
  it("acepta objeto vacío", () => {
    expect(deudaUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("acepta solo monto", () => {
    const result = deudaUpdateSchema.safeParse({ monto: 500000 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.monto).toBe(500000);
  });
});

// ─── aporteAhorroSchema ───────────────────────────────────────────────────────

describe("aporteAhorroSchema", () => {
  it("acepta un aporte válido (sin tipo ni categoría)", () => {
    const result = aporteAhorroSchema.safeParse({
      fecha: "2026-07-01",
      concepto: "Aporte mensual",
      monto: 200000,
      miembroId: null,
    });
    expect(result.success).toBe(true);
  });

  it("no requiere deudaId (campo opcional heredado)", () => {
    const result = aporteAhorroSchema.safeParse({
      fecha: "2026-07-01",
      concepto: "Aporte",
      monto: 100000,
    });
    expect(result.success).toBe(true);
  });
});
