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
  const tipo = searchParams.get("tipo");

  if (tipo !== "INGRESO" && tipo !== "EGRESO") {
    return NextResponse.json({ error: "Parámetro tipo inválido" }, { status: 400 });
  }
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: "Parámetro mes inválido (formato: YYYY-MM)" }, { status: 400 });
  }

  const [year, month] = mes.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  const userId = session.user.id;

  const [totalHistorico, periodo, porCategoria, topConceptos, movimientosMeses] =
    await Promise.all([
      prisma.movimiento.aggregate({
        where: { userId, tipo },
        _sum: { monto: true },
      }),
      prisma.movimiento.aggregate({
        where: { userId, tipo, fecha: { gte: startDate, lt: endDate } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.movimiento.groupBy({
        by: ["categoria"],
        where: { userId, tipo, fecha: { gte: startDate, lt: endDate } },
        _sum: { monto: true },
        orderBy: { _sum: { monto: "desc" } },
      }),
      prisma.movimiento.groupBy({
        by: ["concepto"],
        where: { userId, tipo, fecha: { gte: startDate, lt: endDate } },
        _sum: { monto: true },
        orderBy: { _sum: { monto: "desc" } },
        take: 5,
      }),
      prisma.movimiento.findMany({
        where: {
          userId,
          tipo,
          fecha: { gte: new Date(year, month - 13, 1), lt: endDate },
        },
        select: { fecha: true, monto: true },
      }),
    ]);

  const evolucionMap: Record<string, number> = {};
  for (const m of movimientosMeses) {
    const key = `${m.fecha.getFullYear()}-${String(m.fecha.getMonth() + 1).padStart(2, "0")}`;
    evolucionMap[key] = (evolucionMap[key] ?? 0) + Number(m.monto);
  }

  return NextResponse.json({
    mes,
    tipo,
    totalHistorico: Number(totalHistorico._sum.monto ?? 0),
    totalPeriodo: Number(periodo._sum.monto ?? 0),
    countPeriodo: periodo._count,
    porCategoria: porCategoria.map((c) => ({
      categoria: c.categoria,
      monto: Number(c._sum.monto ?? 0),
    })),
    topConceptos: topConceptos.map((c) => ({
      concepto: c.concepto,
      monto: Number(c._sum.monto ?? 0),
    })),
    evolucion: Object.entries(evolucionMap)
      .map(([mes, monto]) => ({ mes, monto }))
      .sort((a, b) => a.mes.localeCompare(b.mes)),
  });
}
