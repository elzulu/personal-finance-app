import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { movimientoUpdateSchema } from "@/lib/validations";
import { ZodError } from "zod";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = movimientoUpdateSchema.parse(body);

    const existing = await prisma.movimiento.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });
    }

    const movimiento = await prisma.movimiento.update({
      where: { id: params.id },
      data: {
        ...(data.fecha ? { fecha: new Date(data.fecha) } : {}),
        ...(data.tipo ? { tipo: data.tipo } : {}),
        ...(data.categoria ? { categoria: data.categoria } : {}),
        ...(data.concepto ? { concepto: data.concepto } : {}),
        ...(data.monto !== undefined ? { monto: data.monto } : {}),
      },
    });

    return NextResponse.json(movimiento);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existing = await prisma.movimiento.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });
  }

  await prisma.movimiento.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
