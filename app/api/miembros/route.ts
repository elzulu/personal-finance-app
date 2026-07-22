import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { miembroSchema } from "@/lib/validations";
import { ZodError } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const miembros = await prisma.miembro.findMany({
    where: { userId: session.user.id },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, createdAt: true },
  });

  return NextResponse.json(miembros);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { nombre } = miembroSchema.parse(body);

    const miembro = await prisma.miembro.create({
      data: { userId: session.user.id, nombre },
    });

    return NextResponse.json(miembro, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
