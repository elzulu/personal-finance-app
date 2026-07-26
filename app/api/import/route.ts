import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/csv";
import { isCategoriaValida } from "@/lib/categorias";
import { Tipo } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const csv = body?.csv;
  if (typeof csv !== "string" || !csv.trim()) {
    return NextResponse.json({ error: "Archivo CSV vacío o inválido" }, { status: 400 });
  }

  const rows = parseCSV(csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: "El CSV no contiene filas" }, { status: 400 });
  }

  // Skip header row if present (first cell looks like "Fecha")
  const startIndex = rows[0][0]?.trim().toLowerCase() === "fecha" ? 1 : 0;

  const toCreate: {
    userId: string;
    fecha: Date;
    tipo: Tipo;
    categoria: string;
    concepto: string;
    monto: number;
  }[] = [];
  const errors: string[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const line = i + 1;
    const [fechaRaw, tipoRaw, categoria, concepto, montoRaw] = rows[i];

    const fecha = new Date(fechaRaw);
    const tipo = tipoRaw?.trim().toUpperCase();
    const monto = Number(montoRaw);

    if (isNaN(fecha.getTime())) {
      errors.push(`Línea ${line}: fecha inválida ("${fechaRaw}")`);
      continue;
    }
    if (tipo !== "INGRESO" && tipo !== "EGRESO") {
      errors.push(`Línea ${line}: tipo inválido ("${tipoRaw}")`);
      continue;
    }
    if (!categoria || !isCategoriaValida(categoria, tipo as Tipo)) {
      errors.push(`Línea ${line}: categoría inválida ("${categoria}") para tipo ${tipo}`);
      continue;
    }
    if (!concepto || !concepto.trim()) {
      errors.push(`Línea ${line}: concepto vacío`);
      continue;
    }
    if (!montoRaw || isNaN(monto) || monto <= 0) {
      errors.push(`Línea ${line}: monto inválido ("${montoRaw}")`);
      continue;
    }

    toCreate.push({
      userId: session.user.id,
      fecha,
      tipo: tipo as Tipo,
      categoria,
      concepto: concepto.trim(),
      monto,
    });
  }

  if (toCreate.length > 0) {
    await prisma.movimiento.createMany({ data: toCreate });
  }

  return NextResponse.json({
    imported: toCreate.length,
    skipped: errors.length,
    errors: errors.slice(0, 20),
  });
}
