/**
 * Tests de integración — POST /api/movimientos
 * Cubre la lógica de sincronización automática con el módulo de Deudas.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── vi.hoisted: deben existir ANTES de que vi.mock sea evaluado ───────────────
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

// ─── Importar handler después de los mocks ────────────────────────────────────
import { POST } from "@/app/api/movimientos/route";
import { getServerSession } from "next-auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/movimientos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const SESSION_OK = { user: { id: "user-1" } };

const MOV_BASE = {
  fecha: "2026-07-01",
  tipo: "EGRESO",
  categoria: "Deudas",
  concepto: "Pago tarjeta",
  monto: 500000,
  miembroId: null,
};

const DEUDA_BASE = {
  id: "deuda-1",
  userId: "user-1",
  monto: "1000000",
  pagado: false,
};

const MOV_CREADO = {
  id: "mov-1",
  ...MOV_BASE,
  monto: "500000",
  deudaId: null,
  miembro: null,
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(
    (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)
  );
  vi.mocked(getServerSession).mockResolvedValue(SESSION_OK as never);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/movimientos — sin deudaId", () => {
  it("crea el movimiento directamente sin transacción", async () => {
    mockPrisma.movimiento.create.mockResolvedValue(MOV_CREADO);

    const res = await POST(makeRequest({ ...MOV_BASE, deudaId: null }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.id).toBe("mov-1");
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockPrisma.deuda.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.deuda.update).not.toHaveBeenCalled();
  });

  it("crea el movimiento cuando no se envía deudaId", async () => {
    mockPrisma.movimiento.create.mockResolvedValue(MOV_CREADO);
    const { deudaId: _d, ...sinDeudaId } = { ...MOV_BASE, deudaId: undefined };

    const res = await POST(makeRequest(sinDeudaId));
    expect(res.status).toBe(201);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("crea movimiento INGRESO sin deudaId", async () => {
    mockPrisma.movimiento.create.mockResolvedValue({
      ...MOV_CREADO,
      tipo: "INGRESO",
      categoria: "Sueldo",
    });

    const res = await POST(
      makeRequest({ ...MOV_BASE, tipo: "INGRESO", categoria: "Sueldo" })
    );
    expect(res.status).toBe(201);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("POST /api/movimientos — con deudaId (sincronización)", () => {
  it("descuenta el monto del pago del saldo de la deuda", async () => {
    // Deuda: saldo=1.000.000 — Pago=500.000 → nuevo saldo=500.000
    mockPrisma.deuda.findFirst.mockResolvedValue(DEUDA_BASE);
    mockPrisma.movimiento.create.mockResolvedValue({
      ...MOV_CREADO,
      deudaId: "deuda-1",
    });

    const res = await POST(makeRequest({ ...MOV_BASE, deudaId: "deuda-1" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.deudaId).toBe("deuda-1");
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    expect(mockPrisma.deuda.findFirst).toHaveBeenCalledWith({
      where: { id: "deuda-1", userId: "user-1" },
    });
    // 1.000.000 - 500.000 = 500.000, no pagada
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 500000, pagado: false },
    });
  });

  it("marca la deuda como pagada cuando el saldo llega a cero exacto", async () => {
    // Deuda: saldo=500.000 — Pago=500.000 → nuevo saldo=0, pagado=true
    mockPrisma.deuda.findFirst.mockResolvedValue({
      ...DEUDA_BASE,
      monto: "500000",
    });
    mockPrisma.movimiento.create.mockResolvedValue({
      ...MOV_CREADO,
      deudaId: "deuda-1",
    });

    const res = await POST(
      makeRequest({ ...MOV_BASE, monto: 500000, deudaId: "deuda-1" })
    );

    expect(res.status).toBe(201);
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 0, pagado: true },
    });
  });

  it("clampea a cero (no permite saldo negativo) y marca como pagada", async () => {
    // Deuda: saldo=200.000 — Pago=800.000 → nuevo saldo=0 (no -600.000)
    mockPrisma.deuda.findFirst.mockResolvedValue({
      ...DEUDA_BASE,
      monto: "200000",
    });
    mockPrisma.movimiento.create.mockResolvedValue({
      ...MOV_CREADO,
      deudaId: "deuda-1",
    });

    const res = await POST(
      makeRequest({ ...MOV_BASE, monto: 800000, deudaId: "deuda-1" })
    );

    expect(res.status).toBe(201);
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "deuda-1" },
      data: { monto: 0, pagado: true },
    });
  });

  it("devuelve 404 cuando el deudaId no pertenece al usuario", async () => {
    mockPrisma.deuda.findFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({ ...MOV_BASE, deudaId: "deuda-ajena" }));

    expect(res.status).toBe(404);
    expect(mockPrisma.movimiento.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/movimientos — autenticación y validación", () => {
  it("devuelve 401 cuando no hay sesión", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);

    const res = await POST(makeRequest(MOV_BASE));
    expect(res.status).toBe(401);
    expect(mockPrisma.movimiento.create).not.toHaveBeenCalled();
  });

  it("devuelve 400 con body inválido (falta monto)", async () => {
    const { monto: _m, ...sinMonto } = MOV_BASE;
    const res = await POST(makeRequest(sinMonto));
    expect(res.status).toBe(400);
  });

  it("devuelve 400 con categoría inválida para el tipo", async () => {
    const res = await POST(
      makeRequest({ ...MOV_BASE, tipo: "INGRESO", categoria: "Deudas" })
    );
    expect(res.status).toBe(400);
  });
});
