/**
 * Tests de integración — desglose de pagos a deudas (interés y cargos).
 * Solo el abono a capital (monto − interés − cargos) debe mover el saldo de la deuda.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  movimiento: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  deuda: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { POST } from "@/app/api/movimientos/route";
import { PATCH, DELETE } from "@/app/api/movimientos/[id]/route";
import { getServerSession } from "next-auth";

const SESSION_OK = { user: { id: "user-1" } };
const PARAMS = { params: { id: "mov-1" } };

function req(method: string, body?: object) {
  return new NextRequest("http://localhost/api/movimientos", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const MOV = {
  fecha: "2026-10-04",
  tipo: "EGRESO",
  categoria: "Deudas",
  concepto: "Pago tarjeta",
  monto: 200000,
  miembroId: null,
  deudaId: "deuda-1",
};

const deuda = (monto: number) => ({ id: "deuda-1", userId: "user-1", monto: String(monto), pagado: false });

function movExistente(over: Record<string, unknown> = {}) {
  return {
    id: "mov-1",
    userId: "user-1",
    tipo: "EGRESO",
    categoria: "Deudas",
    concepto: "Pago",
    monto: "200000",
    deudaId: "deuda-1",
    miembroId: null,
    interes: null,
    cargos: null,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
  vi.mocked(getServerSession).mockResolvedValue(SESSION_OK as never);
  mockPrisma.movimiento.create.mockResolvedValue({ id: "mov-1", miembro: null });
  mockPrisma.movimiento.update.mockResolvedValue({ id: "mov-1", miembro: null });
  mockPrisma.movimiento.delete.mockResolvedValue({ id: "mov-1" });
});

describe("POST — desglose de pago", () => {
  it("descuenta solo el abono a capital del saldo", async () => {
    // Pago 200.000 = 25.000 interés + 9.000 seguro + 166.000 capital
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda(1000000));

    const res = await POST(req("POST", { ...MOV, interes: 25000, cargos: 9000 }));

    expect(res.status).toBe(201);
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 834000, pagado: false }, // 1.000.000 − 166.000
    });
  });

  it("guarda interés y cargos en el movimiento (monto total intacto)", async () => {
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda(1000000));

    await POST(req("POST", { ...MOV, interes: 25000, cargos: 9000 }));

    expect(mockPrisma.movimiento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ monto: 200000, interes: 25000, cargos: 9000, deudaId: "deuda-1" }),
      })
    );
  });

  it("sin desglose se comporta como antes (todo es capital)", async () => {
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda(1000000));

    await POST(req("POST", MOV));

    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 800000, pagado: false },
    });
  });

  it("marca pagada cuando el capital cubre el saldo", async () => {
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda(166000));

    await POST(req("POST", { ...MOV, interes: 25000, cargos: 9000 }));

    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 0, pagado: true },
    });
  });

  it("ignora el desglose si el movimiento no tiene deuda vinculada", async () => {
    await POST(req("POST", { ...MOV, deudaId: null, interes: 25000, cargos: 9000 }));

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockPrisma.movimiento.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ interes: null, cargos: null }) })
    );
  });

  it("responde 400 si interés + cargos superan el monto", async () => {
    const res = await POST(req("POST", { ...MOV, interes: 190000, cargos: 20000 }));

    expect(res.status).toBe(400);
    expect(mockPrisma.deuda.update).not.toHaveBeenCalled();
  });
});

describe("PATCH — desglose de pago", () => {
  it("restaura el capital anterior (no el monto total) y aplica el nuevo", async () => {
    // Pago previo: 200.000 con 25.000 + 9.000 → capital 166.000. Saldo actual 834.000.
    // Se edita a 300.000 con 30.000 de interés y 9.000 de cargos → capital 261.000.
    mockPrisma.movimiento.findFirst.mockResolvedValue(movExistente({ interes: "25000", cargos: "9000" }));
    mockPrisma.deuda.findFirst
      .mockResolvedValueOnce(deuda(834000)) // restauración
      .mockResolvedValueOnce(deuda(1000000)); // aplicación (ya restaurado)

    const res = await PATCH(req("PATCH", { monto: 300000, interes: 30000, cargos: 9000 }), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.deuda.update).toHaveBeenNthCalledWith(1, {
      where: { id: "deuda-1" },
      data: { monto: 1000000, pagado: false }, // 834.000 + 166.000
    });
    expect(mockPrisma.deuda.update).toHaveBeenNthCalledWith(2, {
      where: { id: "deuda-1" },
      data: { monto: 739000, pagado: false }, // 1.000.000 − 261.000
    });
    expect(mockPrisma.movimiento.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ interes: 30000, cargos: 9000 }) })
    );
  });

  it("conserva el desglose existente si solo cambia el concepto", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(movExistente({ interes: "25000", cargos: "9000" }));
    mockPrisma.deuda.findFirst
      .mockResolvedValueOnce(deuda(834000))
      .mockResolvedValueOnce(deuda(1000000));

    await PATCH(req("PATCH", { concepto: "Otro" }), PARAMS);

    expect(mockPrisma.deuda.update).toHaveBeenNthCalledWith(2, {
      where: { id: "deuda-1" },
      data: { monto: 834000, pagado: false }, // el saldo queda igual
    });
  });

  it("al desvincular la deuda restaura el capital y limpia el desglose", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(movExistente({ interes: "25000", cargos: "9000" }));
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda(834000));

    await PATCH(req("PATCH", { deudaId: null }), PARAMS);

    expect(mockPrisma.deuda.update).toHaveBeenCalledOnce();
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 1000000, pagado: false },
    });
    expect(mockPrisma.movimiento.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deudaId: null, interes: null, cargos: null }) })
    );
  });

  it("responde 400 si al bajar el monto el desglose lo supera", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(movExistente({ interes: "25000", cargos: "9000" }));

    const res = await PATCH(req("PATCH", { monto: 20000 }), PARAMS);

    expect(res.status).toBe(400);
    expect(mockPrisma.deuda.update).not.toHaveBeenCalled();
    expect(mockPrisma.movimiento.update).not.toHaveBeenCalled();
  });
});

describe("DELETE — desglose de pago", () => {
  it("restaura solo el capital al eliminar el pago", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(movExistente({ interes: "25000", cargos: "9000" }));
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda(834000));

    const res = await DELETE(req("DELETE"), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 1000000, pagado: false }, // 834.000 + 166.000
    });
    expect(mockPrisma.movimiento.delete).toHaveBeenCalledWith({ where: { id: "mov-1" } });
  });
});
