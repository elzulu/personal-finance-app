import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWebPush } from "@/lib/push";
import { hoyEnZona } from "@/lib/fechasPago";
import { construirRecordatorios } from "@/lib/recordatorios";

export const dynamic = "force-dynamic";

// Lo ejecuta Vercel Cron una vez al día (ver vercel.json). Vercel envía "Authorization: Bearer $CRON_SECRET".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const webpush = getWebPush();
  if (!webpush) {
    return NextResponse.json({ error: "Recordatorios no configurados (VAPID)" }, { status: 503 });
  }

  const hoy = hoyEnZona();

  // Solo deudas con día de pago, sin saldar y de usuarios con algún dispositivo suscrito
  const deudas = await prisma.deuda.findMany({
    where: { pagado: false, diaPago: { not: null }, user: { pushSubscriptions: { some: {} } } },
    include: { movimientos: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } } },
  });

  const recordatorios = construirRecordatorios(
    deudas.map((d) => ({
      userId: d.userId,
      tipo: d.tipo,
      descripcion: d.descripcion,
      monto: d.monto,
      tasaMensual: d.tasaMensual,
      cargoFijo: d.cargoFijo,
      diaPago: d.diaPago,
      pagado: d.pagado,
      createdAt: d.createdAt,
      ultimoPago: d.movimientos[0]?.fecha ?? null,
    })),
    hoy
  );

  let enviados = 0;
  let eliminados = 0;
  for (const r of recordatorios) {
    const suscripciones = await prisma.pushSubscription.findMany({ where: { userId: r.userId } });
    const payload = JSON.stringify({ title: r.title, body: r.body, url: r.url, tag: r.tag });
    for (const s of suscripciones) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        enviados++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410: el dispositivo ya no existe o revocó el permiso
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: s.endpoint } });
          eliminados++;
        } else {
          console.error("Error enviando push", status ?? err);
        }
      }
    }
  }

  return NextResponse.json({ fecha: hoy, usuarios: recordatorios.length, enviados, suscripcionesEliminadas: eliminados });
}
