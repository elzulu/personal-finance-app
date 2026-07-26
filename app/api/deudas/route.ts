import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deudaSchema } from "@/lib/validations";
import { TipoDeuda } from "@prisma/client";
import { ZodError } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const deudas = await prisma.deuda.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { miembro: { select: { id: true, nombre: true } } },
  });

  return NextResponse.json(deudas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = deudaSchema.parse(body);

    const deuda = await prisma.deuda.create({
      data: {
        userId: session.user.id,
        miembroId: data.miembroId ?? null,
        tipo: data.tipo as TipoDeuda,
        descripcion: data.descripcion ?? null,
        monto: data.monto,
      },
      include: { miembro: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json(deuda, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
