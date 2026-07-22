import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const mes = searchParams.get("mes");

  const where: Prisma.MovimientoWhereInput = { userId: session.user.id };

  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [year, month] = mes.split("-").map(Number);
    where.fecha = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }

  const movimientos = await prisma.movimiento.findMany({
    where,
    orderBy: { fecha: "asc" },
  });

  const BOM = "\uFEFF"; // UTF-8 BOM para que Excel abra correctamente
  const headers = ["Fecha", "Tipo", "Categoria", "Concepto", "Presupuesto", "Monto"];
  const rows = movimientos.map((m) => [
    m.fecha.toISOString().split("T")[0],
    m.tipo,
    m.categoria,
    `"${m.concepto.replace(/"/g, '""')}"`,
    m.presupuesto?.toString() ?? "",
    m.monto.toString(),
  ]);

  const csv =
    BOM + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const filename = `movimientos${mes ? `-${mes}` : ""}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
