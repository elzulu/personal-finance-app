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

    const oldDeudaId = existing.deudaId;
    // Si data.deudaId viene explícito (incluso null) lo usamos; si no viene, mantenemos el actual
    const newDeudaId = data.deudaId !== undefined ? (data.deudaId ?? null) : oldDeudaId;
    const oldMonto = Number(existing.monto);
    const newMonto = data.monto !== undefined ? data.monto : oldMonto;

    const updateData = {
      ...(data.fecha ? { fecha: new Date(data.fecha) } : {}),
      ...(data.tipo ? { tipo: data.tipo } : {}),
      ...(data.categoria ? { categoria: data.categoria } : {}),
      ...(data.concepto ? { concepto: data.concepto } : {}),
      ...(data.monto !== undefined ? { monto: data.monto } : {}),
      ...(data.miembroId !== undefined ? { miembroId: data.miembroId } : {}),
      // Siempre persistir el deudaId efectivo para mantener consistencia
      deudaId: newDeudaId,
    };

    if (!oldDeudaId && !newDeudaId) {
      // Sin deuda involucrada — actualización simple
      const movimiento = await prisma.movimiento.update({
        where: { id: params.id },
        data: updateData,
        include: { miembro: { select: { id: true, nombre: true } } },
      });
      return NextResponse.json(movimiento);
    }

    // Transacción: revertir efecto en deuda anterior y aplicar en la nueva
    const movimiento = await prisma.$transaction(async (tx) => {
      // 1. Restaurar saldo de la deuda anterior si existía
      if (oldDeudaId) {
        const deudaAnterior = await tx.deuda.findFirst({
          where: { id: oldDeudaId, userId: session.user.id },
        });
        if (deudaAnterior) {
          const montoRestaurado = Number(deudaAnterior.monto) + oldMonto;
          await tx.deuda.update({
            where: { id: oldDeudaId },
            data: { monto: montoRestaurado, pagado: false },
          });
        }
      }

      // 2. Aplicar pago a la nueva deuda si existe
      // (se consulta aquí para leer el monto ya restaurado si es la misma deuda)
      if (newDeudaId) {
        const deudaNueva = await tx.deuda.findFirst({
          where: { id: newDeudaId, userId: session.user.id },
        });
        if (!deudaNueva) throw new Error("Deuda no encontrada");
        const nuevoMonto = Math.max(0, Number(deudaNueva.monto) - newMonto);
        await tx.deuda.update({
          where: { id: newDeudaId },
          data: { monto: nuevoMonto, pagado: nuevoMonto === 0 },
        });
      }

      // 3. Actualizar el movimiento
      return tx.movimiento.update({
        where: { id: params.id },
        data: updateData,
        include: { miembro: { select: { id: true, nombre: true } } },
      });
    });

    return NextResponse.json(movimiento);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Deuda no encontrada") {
      return NextResponse.json({ error: error.message }, { status: 404 });
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

  if (existing.deudaId) {
    // Transacción: restaurar saldo de la deuda al eliminar el pago
    await prisma.$transaction(async (tx) => {
      const deuda = await tx.deuda.findFirst({
        where: { id: existing.deudaId!, userId: session.user.id },
      });
      if (deuda) {
        const montoRestaurado = Number(deuda.monto) + Number(existing.monto);
        await tx.deuda.update({
          where: { id: existing.deudaId! },
          data: { monto: montoRestaurado, pagado: false },
        });
      }
      await tx.movimiento.delete({ where: { id: params.id } });
    });
  } else {
    await prisma.movimiento.delete({ where: { id: params.id } });
  }

  return NextResponse.json({ success: true });
}
