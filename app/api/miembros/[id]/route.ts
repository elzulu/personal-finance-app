import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existing = await prisma.miembro.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  // Desasignar movimientos antes de eliminar
  await prisma.movimiento.updateMany({
    where: { miembroId: params.id, userId: session.user.id },
    data: { miembroId: null },
  });

  await prisma.miembro.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
