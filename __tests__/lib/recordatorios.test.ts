/**
 * Tests unitarios — lib/recordatorios.ts (qué deudas generan notificación hoy)
 */
import { describe, it, expect } from "vitest";
import { construirRecordatorios, type DeudaParaRecordar } from "@/lib/recordatorios";

const HOY = { y: 2026, m: 10, d: 15 };

function deuda(over: Partial<DeudaParaRecordar> = {}): DeudaParaRecordar {
  return {
    userId: "u1",
    tipo: "TARJETA_CREDITO",
    descripcion: "Visa",
    monto: "1000000",
    tasaMensual: "2.50",
    cargoFijo: null,
    diaPago: 15,
    pagado: false,
    createdAt: new Date("2026-01-10T12:00:00Z"),
    ultimoPago: null,
    ...over,
  };
}

describe("construirRecordatorios", () => {
  it("genera una notificación cuando hoy es el día de pago y no hay pago registrado", () => {
    const r = construirRecordatorios([deuda()], HOY);
    expect(r).toHaveLength(1);
    expect(r[0].userId).toBe("u1");
    expect(r[0].title).toBe("Hoy vence el pago de Tarjeta de crédito (Visa)");
    expect(r[0].url).toBe("/deudas");
    expect(r[0].tag).toBe("pago-deudas-2026-10-15");
  });

  it("incluye saldo, interés estimado y cargo fijo en el cuerpo", () => {
    const [r] = construirRecordatorios([deuda({ cargoFijo: "9000" })], HOY);
    expect(r.body).toContain("1.000.000");
    expect(r.body).toContain("interés ~");
    expect(r.body).toContain("25.000"); // 2,5% de 1.000.000
    expect(r.body).toContain("cargo");
    expect(r.body).toContain("9.000");
  });

  it("omite interés y cargo cuando la deuda no los tiene", () => {
    const [r] = construirRecordatorios([deuda({ tasaMensual: null, cargoFijo: null })], HOY);
    expect(r.body).not.toContain("interés");
    expect(r.body).not.toContain("cargo");
  });

  it("no notifica si hoy no es el día de pago", () => {
    expect(construirRecordatorios([deuda({ diaPago: 16 })], HOY)).toEqual([]);
    expect(construirRecordatorios([deuda({ diaPago: 14 })], HOY)).toEqual([]);
  });

  it("no notifica si la deuda no tiene día de pago o ya está saldada", () => {
    expect(construirRecordatorios([deuda({ diaPago: null })], HOY)).toEqual([]);
    expect(construirRecordatorios([deuda({ pagado: true })], HOY)).toEqual([]);
  });

  it("no notifica si el pago de este vencimiento ya se registró (también si se adelantó)", () => {
    expect(construirRecordatorios([deuda({ ultimoPago: new Date("2026-10-15T00:00:00Z") })], HOY)).toEqual([]);
    expect(construirRecordatorios([deuda({ ultimoPago: new Date("2026-10-13T00:00:00Z") })], HOY)).toEqual([]);
  });

  it("sí notifica si el último pago fue del mes anterior", () => {
    expect(construirRecordatorios([deuda({ ultimoPago: new Date("2026-09-15T00:00:00Z") })], HOY)).toHaveLength(1);
  });

  it("agrupa varias deudas del mismo usuario en una sola notificación", () => {
    const r = construirRecordatorios(
      [deuda(), deuda({ tipo: "OTRO", descripcion: "Nequi", monto: "500000", tasaMensual: "3", cargoFijo: "9000" })],
      HOY
    );
    expect(r).toHaveLength(1);
    expect(r[0].title).toBe("Hoy vencen 2 pagos de deudas");
    expect(r[0].body).toContain("Visa");
    expect(r[0].body).toContain("Nequi");
  });

  it("envía una notificación por usuario", () => {
    const r = construirRecordatorios([deuda({ userId: "u1" }), deuda({ userId: "u2" })], HOY);
    expect(r.map((x) => x.userId).sort()).toEqual(["u1", "u2"]);
  });

  it("día 31 notifica el último día de un mes corto", () => {
    const r = construirRecordatorios([deuda({ diaPago: 31 })], { y: 2026, m: 2, d: 28 });
    expect(r).toHaveLength(1);
  });
});
