import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORIA_AHORRO = "Ahorro";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = session.user.id;

  const [total, porMiembro, miembros] = await Promise.all([
    prisma.movimiento.aggregate({
      where: { userId, tipo: "EGRESO", categoria: CATEGORIA_AHORRO },
      _sum: { monto: true },
    }),
    prisma.movimiento.groupBy({
      by: ["miembroId"],
      where: { userId, tipo: "EGRESO", categoria: CATEGORIA_AHORRO },
      _sum: { monto: true },
    }),
    prisma.miembro.findMany({
      where: { userId },
      select: { id: true, nombre: true },
    }),
  ]);

  const nombreById = new Map(miembros.map((m) => [m.id, m.nombre]));

  return NextResponse.json({
    total: Number(total._sum.monto ?? 0),
    porMiembro: porMiembro
      .map((p) => ({
        miembroId: p.miembroId,
        nombre: p.miembroId ? nombreById.get(p.miembroId) ?? "Sin nombre" : "Sin asignar",
        monto: Number(p._sum.monto ?? 0),
      }))
      .sort((a, b) => b.monto - a.monto),
  });
}
