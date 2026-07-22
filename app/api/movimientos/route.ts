import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { movimientoSchema } from "@/lib/validations";
import { Prisma, Tipo } from "@prisma/client";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const mes = searchParams.get("mes"); // "2024-07"
  const tipo = searchParams.get("tipo") as Tipo | null;
  const categoria = searchParams.get("categoria");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const orderByField = searchParams.get("orderBy") ?? "fecha";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  const allowedOrderBy = ["fecha", "monto", "createdAt"];
  const safeOrderBy = allowedOrderBy.includes(orderByField) ? orderByField : "fecha";

  const where: Prisma.MovimientoWhereInput = {
    userId: session.user.id,
  };

  if (mes) {
    const [year, month] = mes.split("-").map(Number);
    if (!isNaN(year) && !isNaN(month)) {
      where.fecha = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }
  }

  if (tipo && (tipo === "INGRESO" || tipo === "EGRESO")) {
    where.tipo = tipo;
  }

  if (categoria) {
    where.categoria = categoria;
  }

  const [total, movimientos] = await Promise.all([
    prisma.movimiento.count({ where }),
    prisma.movimiento.findMany({
      where,
      orderBy: { [safeOrderBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: movimientos,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = movimientoSchema.parse(body);

    const movimiento = await prisma.movimiento.create({
      data: {
        userId: session.user.id,
        fecha: new Date(data.fecha),
        tipo: data.tipo,
        categoria: data.categoria,
        concepto: data.concepto,
        presupuesto: data.presupuesto ?? null,
        monto: data.monto,
      },
    });

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
