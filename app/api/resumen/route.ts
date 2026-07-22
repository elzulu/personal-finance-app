import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const mes = searchParams.get("mes");

  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: "Parámetro mes inválido (formato: YYYY-MM)" }, { status: 400 });
  }

  const [year, month] = mes.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  const userId = session.user.id;

  const [ingresos, egresos, porCategoria, topConceptos, movimientosMeses] =
    await Promise.all([
      prisma.movimiento.aggregate({
        where: { userId, tipo: "INGRESO", fecha: { gte: startDate, lt: endDate } },
        _sum: { monto: true },
      }),
      prisma.movimiento.aggregate({
        where: { userId, tipo: "EGRESO", fecha: { gte: startDate, lt: endDate } },
        _sum: { monto: true },
      }),
      prisma.movimiento.groupBy({
        by: ["tipo", "categoria"],
        where: { userId, fecha: { gte: startDate, lt: endDate } },
        _sum: { monto: true },
        orderBy: { _sum: { monto: "desc" } },
      }),
      prisma.movimiento.groupBy({
        by: ["concepto"],
        where: { userId, tipo: "EGRESO", fecha: { gte: startDate, lt: endDate } },
        _sum: { monto: true },
        orderBy: { _sum: { monto: "desc" } },
        take: 5,
      }),
      prisma.movimiento.findMany({
        where: {
          userId,
          fecha: { gte: new Date(year, month - 13, 1), lt: endDate },
        },
        select: { fecha: true, tipo: true, monto: true },
      }),
    ]);

  const evolucionMap: Record<string, { mes: string; ingresos: number; egresos: number }> = {};
  for (const m of movimientosMeses) {
    const key = `${m.fecha.getFullYear()}-${String(m.fecha.getMonth() + 1).padStart(2, "0")}`;
    if (!evolucionMap[key]) {
      evolucionMap[key] = { mes: key, ingresos: 0, egresos: 0 };
    }
    const amount = Number(m.monto);
    if (m.tipo === "INGRESO") {
      evolucionMap[key].ingresos += amount;
    } else {
      evolucionMap[key].egresos += amount;
    }
  }

  const totalIngresos = Number(ingresos._sum.monto ?? 0);
  const totalEgresos = Number(egresos._sum.monto ?? 0);

  return NextResponse.json({
    mes,
    ingresos: totalIngresos,
    egresos: totalEgresos,
    saldo: totalIngresos - totalEgresos,
    porCategoria: porCategoria.map((c) => ({
      tipo: c.tipo,
      categoria: c.categoria,
      monto: Number(c._sum.monto ?? 0),
    })),
    topConceptos: topConceptos.map((c) => ({
      concepto: c.concepto,
      monto: Number(c._sum.monto ?? 0),
    })),
    evolucion: Object.values(evolucionMap).sort((a, b) =>
      a.mes.localeCompare(b.mes)
    ),
  });
}
