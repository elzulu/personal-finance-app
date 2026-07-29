/**
 * Tests de integración — DELETE /api/movimientos/[id]
 * Cubre la restauración del saldo de deuda al eliminar un pago vinculado.
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

import { DELETE } from "@/app/api/movimientos/[id]/route";
import { getServerSession } from "next-auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDeleteRequest() {
  return new NextRequest("http://localhost/api/movimientos/mov-1", {
    method: "DELETE",
  });
}

const SESSION_OK = { user: { id: "user-1" } };
const PARAMS = { params: { id: "mov-1" } };

function existingMov(deudaId: string | null, monto = 500000) {
  return {
    id: "mov-1",
    userId: "user-1",
    tipo: "EGRESO",
    categoria: "Deudas",
    concepto: "Pago",
    monto: String(monto),
    deudaId,
    miembroId: null,
  };
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
  mockPrisma.movimiento.delete.mockResolvedValue({ id: "mov-1" });
});

// ─── Sin deuda involucrada ────────────────────────────────────────────────────

describe("DELETE — sin deudaId", () => {
  it("elimina el movimiento directamente sin transacción", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(existingMov(null));

    const res = await DELETE(makeDeleteRequest(), PARAMS);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockPrisma.deuda.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.deuda.update).not.toHaveBeenCalled();
    expect(mockPrisma.movimiento.delete).toHaveBeenCalledWith({
      where: { id: "mov-1" },
    });
  });
});

// ─── Con deuda vinculada ──────────────────────────────────────────────────────

describe("DELETE — con deudaId (restauración de saldo)", () => {
  it("restaura el saldo de la deuda al eliminar el pago", async () => {
    // Deuda con 200.000, pago eliminado era 500.000 → restaurar a 700.000
    mockPrisma.movimiento.findFirst.mockResolvedValue(existingMov("deuda-1", 500000));
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda("deuda-1", 200000));

    const res = await DELETE(makeDeleteRequest(), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    expect(mockPrisma.deuda.findFirst).toHaveBeenCalledWith({
      where: { id: "deuda-1", userId: "user-1" },
    });
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 700000, pagado: false }, // 200.000 + 500.000
    });
    expect(mockPrisma.movimiento.delete).toHaveBeenCalledWith({
      where: { id: "mov-1" },
    });
  });

  it("restaura saldo y quita el estado 'pagada' al eliminar el último pago", async () => {
    // Deuda en 0 (pagada), eliminar el pago de 300.000 → restaura a 300.000
    mockPrisma.movimiento.findFirst.mockResolvedValue(existingMov("deuda-1", 300000));
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda("deuda-1", 0, true));

    const res = await DELETE(makeDeleteRequest(), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 300000, pagado: false }, // restaura y quita pagado=true
    });
  });

  it("elimina el movimiento sin actualizar deuda cuando ésta no existe para el usuario", async () => {
    // La deuda fue borrada externamente (onDelete:SetNull pondría deudaId=null,
    // pero si llegara como null, la rama sin deuda ya la cubre.
    // Este test verifica el guard de findFirst devolviendo null dentro de la tx).
    mockPrisma.movimiento.findFirst.mockResolvedValue(existingMov("deuda-1", 500000));
    mockPrisma.deuda.findFirst.mockResolvedValue(null);

    const res = await DELETE(makeDeleteRequest(), PARAMS);

    expect(res.status).toBe(200);
    expect(mockPrisma.deuda.update).not.toHaveBeenCalled();
    expect(mockPrisma.movimiento.delete).toHaveBeenCalled();
  });

  it("restaura el monto exacto sin redondeos", async () => {
    // Pago de 123.456 → deuda tenía 876.544 → restaurar a 1.000.000
    mockPrisma.movimiento.findFirst.mockResolvedValue(existingMov("deuda-1", 123456));
    mockPrisma.deuda.findFirst.mockResolvedValue(deuda("deuda-1", 876544));

    await DELETE(makeDeleteRequest(), PARAMS);

    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 1000000, pagado: false },
    });
  });
});

// ─── Autenticación y errores ──────────────────────────────────────────────────

describe("DELETE — autenticación y errores", () => {
  it("devuelve 401 sin sesión", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);
    const res = await DELETE(makeDeleteRequest(), PARAMS);
    expect(res.status).toBe(401);
    expect(mockPrisma.movimiento.findFirst).not.toHaveBeenCalled();
  });

  it("devuelve 404 cuando el movimiento no existe", async () => {
    mockPrisma.movimiento.findFirst.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest(), PARAMS);
    expect(res.status).toBe(404);
    expect(mockPrisma.movimiento.delete).not.toHaveBeenCalled();
  });

  it("no elimina ni toca la deuda si el movimiento no pertenece al usuario", async () => {
    // findFirst con where: {id, userId} → null si es de otro usuario
    mockPrisma.movimiento.findFirst.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest(), PARAMS);
    expect(res.status).toBe(404);
    expect(mockPrisma.deuda.update).not.toHaveBeenCalled();
  });
});
