/**
 * Tests de integración — PATCH /api/movimientos/[id]
 * Cubre todos los escenarios de edición y resincronización con Deudas.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── vi.hoisted ───────────────────────────────────────────────────────────────
const mockPrisma = vi.hoisted(() => ({
  movimiento: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  deuda: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
}));

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { PATCH } from "@/app/api/movimientos/[id]/route";
import { getServerSession } from "next-auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/movimientos/mov-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const SESSION_OK = { user: { id: "user-1" } };
const PARAMS = { params: { id: "mov-1" } };

function existingMovSinDeuda(monto = 500000) {
  return {
    id: "mov-1",
    userId: "user-1",
    tipo: "EGRESO",
    categoria: "Deudas",
    concepto: "Pago",
    monto: String(monto),
    deudaId: null,
    miembroId: null,
  };
}

function existingMovConDeuda(montoMov = 500000, deudaId = "deuda-1") {
  return { ...existingMovSinDeuda(montoMov), deudaId };
}

function deuda(id: string, monto: number, pagado = false) {
  return { id, userId: "user-1", monto: String(monto), pagado };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(
    (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)
  );
  vi.mocked(getServerSession).mockResolvedValue(SESSION_OK as never);
  mockPrisma.movimiento.update.mockResolvedValue({ id: "mov-1", miembro: null });
});

// ─── Sin deuda involucrada ────────────────────────────────────────────────────

describe("PATCH — sin deuda involucrada", () => {
  it("actualiza concepto sin tocar deudas ni usar transacción", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(existingMovSinDeuda());

    const res = await PATCH(makeRequest({ concepto: "Nuevo concepto" }), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockPrisma.deuda.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.movimiento.update).toHaveBeenCalledOnce();
    expect(mockPrisma.movimiento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "mov-1" },
        data: expect.objectContaining({ concepto: "Nuevo concepto", deudaId: null }),
      })
    );
  });

  it("actualiza monto sin deuda → sin transacción", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(existingMovSinDeuda(300000));

    const res = await PATCH(makeRequest({ monto: 400000 }), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});

// ─── Mismo deudaId, solo cambia el monto ─────────────────────────────────────

describe("PATCH — mismo deudaId, cambia el monto", () => {
  it("restaura el monto anterior y aplica el nuevo (delta correcto)", async () => {
    // Mov previo: 500.000 vinculado a deuda-1
    // Deuda-1 post-pago: 200.000
    // Nuevo monto: 800.000
    // Restauración: 200.000 + 500.000 = 700.000
    // Aplicación: max(0, 700.000 - 800.000) = 0 → pagado=true
    mockPrisma.movimiento.findFirst.mockResolvedValue(
      existingMovConDeuda(500000, "deuda-1")
    );
    mockPrisma.deuda.findFirst
      .mockResolvedValueOnce(deuda("deuda-1", 200000)) // llamada de restauración
      .mockResolvedValueOnce(deuda("deuda-1", 700000)); // llamada de aplicación

    const res = await PATCH(makeRequest({ monto: 800000 }), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    expect(mockPrisma.deuda.update).toHaveBeenNthCalledWith(1, {
      where: { id: "deuda-1" },
      data: { monto: 700000, pagado: false }, // restauración
    });
    expect(mockPrisma.deuda.update).toHaveBeenNthCalledWith(2, {
      where: { id: "deuda-1" },
      data: { monto: 0, pagado: true }, // aplicación: 700k - 800k = 0
    });
  });

  it("monto baja → deuda recupera saldo y queda positiva", async () => {
    // Pago anterior: 500.000 → deuda tenía 100.000 post-pago
    // Nuevo pago: 200.000
    // Restauración: 100.000 + 500.000 = 600.000
    // Aplicación: max(0, 600.000 - 200.000) = 400.000 → pagado=false
    mockPrisma.movimiento.findFirst.mockResolvedValue(
      existingMovConDeuda(500000, "deuda-1")
    );
    mockPrisma.deuda.findFirst
      .mockResolvedValueOnce(deuda("deuda-1", 100000))
      .mockResolvedValueOnce(deuda("deuda-1", 600000));

    const res = await PATCH(makeRequest({ monto: 200000 }), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.deuda.update).toHaveBeenNthCalledWith(2, {
      where: { id: "deuda-1" },
      data: { monto: 400000, pagado: false },
    });
  });
});

// ─── Se elimina el vínculo (deudaId → null) ──────────────────────────────────

describe("PATCH — se elimina el vínculo con la deuda", () => {
  it("restaura el saldo y desvincula el movimiento", async () => {
    // Deuda tiene 300.000 — pago era 500.000 — al desvincular restaura a 800.000
    mockPrisma.movimiento.findFirst.mockResolvedValue(
      existingMovConDeuda(500000, "deuda-1")
    );
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda("deuda-1", 300000));

    const res = await PATCH(makeRequest({ deudaId: null }), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    // Solo una update (restauración), sin segunda aplicación
    expect(mockPrisma.deuda.update).toHaveBeenCalledOnce();
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 800000, pagado: false }, // 300.000 + 500.000
    });
    expect(mockPrisma.movimiento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deudaId: null }),
      })
    );
  });
});

// ─── Se agrega vínculo (null → deudaId) ──────────────────────────────────────

describe("PATCH — se agrega vínculo con la deuda", () => {
  it("aplica el pago a la deuda nueva sin restaurar nada", async () => {
    // Movimiento sin vínculo previo → ahora vinculado a deuda-1 (saldo=1M)
    mockPrisma.movimiento.findFirst.mockResolvedValue(existingMovSinDeuda(500000));
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda("deuda-1", 1000000));

    const res = await PATCH(makeRequest({ deudaId: "deuda-1" }), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    expect(mockPrisma.deuda.update).toHaveBeenCalledOnce();
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 500000, pagado: false }, // 1.000.000 - 500.000
    });
  });

  it("marca como pagada al vincular un pago que cubre el saldo completo", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(existingMovSinDeuda(300000));
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda("deuda-1", 300000));

    const res = await PATCH(makeRequest({ deudaId: "deuda-1" }), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 0, pagado: true },
    });
  });
});

// ─── Cambia de deuda A a deuda B ─────────────────────────────────────────────

describe("PATCH — cambia deudaId de A a B", () => {
  it("restaura deuda A y aplica pago a deuda B", async () => {
    // Pago 500.000 estaba en deuda-A (que tenía 100.000 post-pago)
    // Ahora se mueve a deuda-B (saldo=2M)
    // Restauración: deuda-A: 100.000 + 500.000 = 600.000
    // Aplicación: deuda-B: max(0, 2.000.000 - 500.000) = 1.500.000
    mockPrisma.movimiento.findFirst.mockResolvedValue(
      existingMovConDeuda(500000, "deuda-A")
    );
    mockPrisma.deuda.findFirst
      .mockResolvedValueOnce(deuda("deuda-A", 100000))
      .mockResolvedValueOnce(deuda("deuda-B", 2000000));

    const res = await PATCH(makeRequest({ deudaId: "deuda-B" }), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    expect(mockPrisma.deuda.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.deuda.update).toHaveBeenNthCalledWith(1, {
      where: { id: "deuda-A" },
      data: { monto: 600000, pagado: false },
    });
    expect(mockPrisma.deuda.update).toHaveBeenNthCalledWith(2, {
      where: { id: "deuda-B" },
      data: { monto: 1500000, pagado: false },
    });
    expect(mockPrisma.movimiento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deudaId: "deuda-B" }),
      })
    );
  });
});

// ─── Autenticación y errores ──────────────────────────────────────────────────

describe("PATCH — autenticación y errores", () => {
  it("devuelve 401 sin sesión", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);
    const res = await PATCH(makeRequest({ concepto: "X" }), PARAMS);
    expect(res.status).toBe(401);
    expect(mockPrisma.movimiento.findFirst).not.toHaveBeenCalled();
  });

  it("devuelve 404 cuando el movimiento no existe o no pertenece al usuario", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ concepto: "X" }), PARAMS);
    expect(res.status).toBe(404);
  });

  it("devuelve 400 con body inválido (monto negativo)", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(existingMovSinDeuda());
    const res = await PATCH(makeRequest({ monto: -1000 }), PARAMS);
    expect(res.status).toBe(400);
  });

  it("devuelve 404 cuando el nuevo deudaId no pertenece al usuario", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(existingMovSinDeuda(500000));
    mockPrisma.deuda.findFirst.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ deudaId: "deuda-ajena" }), PARAMS);
    expect(res.status).toBe(404);
    expect(mockPrisma.movimiento.update).not.toHaveBeenCalled();
  });
});
