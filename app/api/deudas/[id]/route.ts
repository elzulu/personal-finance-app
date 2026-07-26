import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deudaUpdateSchema } from "@/lib/validations";
import { TipoDeuda } from "@prisma/client";
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
    const data = deudaUpdateSchema.parse(body);

    const existing = await prisma.deuda.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Deuda no encontrada" }, { status: 404 });
    }

    const deuda = await prisma.deuda.update({
      where: { id: params.id },
      data: {
        ...(data.tipo ? { tipo: data.tipo as TipoDeuda } : {}),
        ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
        ...(data.monto !== undefined ? { monto: data.monto } : {}),
        ...(data.miembroId !== undefined ? { miembroId: data.miembroId } : {}),
      },
      include: { miembro: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json(deuda);
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

  const existing = await prisma.deuda.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Deuda no encontrada" }, { status: 404 });
  }

  await prisma.deuda.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
