/**
 * Tests de integración — /api/cron/recordatorios y /api/push/subscribe
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  deuda: { findMany: vi.fn() },
  pushSubscription: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
  },
}));
const mockWebPush = vi.hoisted(() => ({ sendNotification: vi.fn() }));
const getWebPush = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/push", () => ({ getWebPush }));

import { GET as cron } from "@/app/api/cron/recordatorios/route";
import { POST as subscribe, DELETE as unsubscribe } from "@/app/api/push/subscribe/route";
import { GET as pushKey } from "@/app/api/push/key/route";
import { getServerSession } from "next-auth";

const SECRET = "secreto-de-prueba";

function cronReq(auth?: string) {
  return new NextRequest("http://localhost/api/cron/recordatorios", {
    headers: auth ? { authorization: auth } : {},
  });
}

function deudaBD(over: Record<string, unknown> = {}) {
  return {
    id: "d1",
    userId: "u1",
    tipo: "TARJETA_CREDITO",
    descripcion: "Visa",
    monto: "1000000",
    tasaMensual: "2.5",
    cargoFijo: null,
    diaPago: 15,
    pagado: false,
    createdAt: new Date("2026-01-10T12:00:00Z"),
    movimientos: [],
    ...over,
  };
}

const SUB = { id: "s1", userId: "u1", endpoint: "https://push.example/abc", p256dh: "pk", auth: "au" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  // 15 de octubre 2026, 9:00 a. m. en Bogotá (14:00 UTC)
  vi.setSystemTime(new Date("2026-10-15T14:00:00Z"));
  process.env.CRON_SECRET = SECRET;
  getWebPush.mockReturnValue(mockWebPush);
  mockWebPush.sendNotification.mockResolvedValue({});
  mockPrisma.deuda.findMany.mockResolvedValue([deudaBD()]);
  mockPrisma.pushSubscription.findMany.mockResolvedValue([SUB]);
  mockPrisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.CRON_SECRET;
});

describe("GET /api/cron/recordatorios", () => {
  it("rechaza sin el secreto o con uno incorrecto", async () => {
    expect((await cron(cronReq())).status).toBe(401);
    expect((await cron(cronReq("Bearer otro"))).status).toBe(401);
    expect(mockPrisma.deuda.findMany).not.toHaveBeenCalled();
  });

  it("rechaza si CRON_SECRET no está configurado (nunca queda abierto)", async () => {
    delete process.env.CRON_SECRET;
    expect((await cron(cronReq("Bearer "))).status).toBe(401);
    expect((await cron(cronReq("Bearer undefined"))).status).toBe(401);
  });

  it("responde 503 si faltan las llaves VAPID", async () => {
    getWebPush.mockReturnValue(null);
    expect((await cron(cronReq(`Bearer ${SECRET}`))).status).toBe(503);
  });

  it("envía la notificación del día con título, cuerpo y ruta", async () => {
    const res = await cron(cronReq(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fecha).toEqual({ y: 2026, m: 10, d: 15 });
    expect(body.enviados).toBe(1);
    expect(mockWebPush.sendNotification).toHaveBeenCalledOnce();
    const [sub, payload] = mockWebPush.sendNotification.mock.calls[0];
    expect(sub).toEqual({ endpoint: SUB.endpoint, keys: { p256dh: "pk", auth: "au" } });
    const data = JSON.parse(payload);
    expect(data.title).toBe("Hoy vence el pago de Tarjeta de crédito (Visa)");
    expect(data.url).toBe("/deudas");
  });

  it("usa el día en Bogotá aunque en UTC ya sea el siguiente", async () => {
    // 16 oct 03:00 UTC = 15 oct 22:00 en Bogotá → todavía es día 15
    vi.setSystemTime(new Date("2026-10-16T03:00:00Z"));
    const body = await (await cron(cronReq(`Bearer ${SECRET}`))).json();
    expect(body.fecha).toEqual({ y: 2026, m: 10, d: 15 });
    expect(body.enviados).toBe(1);
  });

  it("no envía nada si hoy no es día de pago", async () => {
    mockPrisma.deuda.findMany.mockResolvedValue([deudaBD({ diaPago: 20 })]);
    const body = await (await cron(cronReq(`Bearer ${SECRET}`))).json();
    expect(body.enviados).toBe(0);
    expect(mockWebPush.sendNotification).not.toHaveBeenCalled();
  });

  it("no envía si el pago de este vencimiento ya está registrado", async () => {
    mockPrisma.deuda.findMany.mockResolvedValue([
      deudaBD({ movimientos: [{ fecha: new Date("2026-10-14T00:00:00Z") }] }),
    ]);
    const body = await (await cron(cronReq(`Bearer ${SECRET}`))).json();
    expect(body.enviados).toBe(0);
  });

  it("envía a todos los dispositivos del usuario", async () => {
    mockPrisma.pushSubscription.findMany.mockResolvedValue([SUB, { ...SUB, id: "s2", endpoint: "https://push.example/def" }]);
    const body = await (await cron(cronReq(`Bearer ${SECRET}`))).json();
    expect(body.enviados).toBe(2);
  });

  it("elimina las suscripciones caducadas (410) y sigue con las demás", async () => {
    mockPrisma.pushSubscription.findMany.mockResolvedValue([SUB, { ...SUB, id: "s2", endpoint: "https://push.example/def" }]);
    mockWebPush.sendNotification
      .mockRejectedValueOnce(Object.assign(new Error("gone"), { statusCode: 410 }))
      .mockResolvedValueOnce({});

    const body = await (await cron(cronReq(`Bearer ${SECRET}`))).json();

    expect(body.enviados).toBe(1);
    expect(body.suscripcionesEliminadas).toBe(1);
    expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { endpoint: SUB.endpoint } });
  });

  it("un error temporal no elimina la suscripción", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockWebPush.sendNotification.mockRejectedValueOnce(Object.assign(new Error("boom"), { statusCode: 500 }));

    const body = await (await cron(cronReq(`Bearer ${SECRET}`))).json();

    expect(body.enviados).toBe(0);
    expect(mockPrisma.pushSubscription.deleteMany).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("/api/push/subscribe", () => {
  const SESSION_OK = { user: { id: "u1" } };
  const body = { endpoint: "https://push.example/abc", keys: { p256dh: "pk", auth: "au" } };
  const req = (method: string, b: unknown) =>
    new NextRequest("http://localhost/api/push/subscribe", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    });

  it("requiere sesión", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);
    expect((await subscribe(req("POST", body))).status).toBe(401);
    expect((await unsubscribe(req("DELETE", { endpoint: body.endpoint }))).status).toBe(401);
  });

  it("guarda (upsert) la suscripción del usuario", async () => {
    vi.mocked(getServerSession).mockResolvedValue(SESSION_OK as never);
    const res = await subscribe(req("POST", body));
    expect(res.status).toBe(201);
    expect(mockPrisma.pushSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { endpoint: body.endpoint },
        create: { userId: "u1", endpoint: body.endpoint, p256dh: "pk", auth: "au" },
      })
    );
  });

  it("rechaza suscripciones inválidas", async () => {
    vi.mocked(getServerSession).mockResolvedValue(SESSION_OK as never);
    expect((await subscribe(req("POST", { endpoint: "no-es-url", keys: {} }))).status).toBe(400);
    expect(mockPrisma.pushSubscription.upsert).not.toHaveBeenCalled();
  });

  it("borra solo la suscripción del propio usuario", async () => {
    vi.mocked(getServerSession).mockResolvedValue(SESSION_OK as never);
    const res = await unsubscribe(req("DELETE", { endpoint: body.endpoint }));
    expect(res.status).toBe(200);
    expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: body.endpoint, userId: "u1" },
    });
  });
});

describe("GET /api/push/key", () => {
  it("devuelve la llave pública si hay VAPID configurado y 503 si no", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "u1" } } as never);
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    expect((await pushKey()).status).toBe(503);

    process.env.VAPID_PUBLIC_KEY = "pub";
    process.env.VAPID_PRIVATE_KEY = "priv";
    const res = await pushKey();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ publicKey: "pub" });
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
  });
});
