import { PrismaClient, Tipo } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

async function main() {
  console.log("Limpiando base de datos...");
  await prisma.movimiento.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creando usuario de prueba...");
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.create({
    data: { email: "demo@finanzas.com", passwordHash, name: "Usuario Demo" },
  });

  const movimientos: Array<{
    userId: string;
    fecha: Date;
    tipo: Tipo;
    categoria: string;
    concepto: string;
    monto: number;
  }> = [];

  const meses = [
    { year: 2026, month: 3 },
    { year: 2026, month: 4 },
    { year: 2026, month: 5 },
    { year: 2026, month: 6 },
    { year: 2026, month: 7 },
  ];

  for (const { year, month } of meses) {
    // INGRESOS
    movimientos.push({ userId: user.id, fecha: d(year, month, 1), tipo: "INGRESO", categoria: "Sueldo", concepto: "Sueldo mensual", monto: 5000000 });
    if (month % 2 === 1) {
      movimientos.push({ userId: user.id, fecha: d(year, month, rand(10, 20)), tipo: "INGRESO", categoria: "Negocio", concepto: "Ventas freelance", monto: rand(600000, 1200000) });
    }
    if (month === 4 || month === 7) {
      movimientos.push({ userId: user.id, fecha: d(year, month, rand(5, 15)), tipo: "INGRESO", categoria: "Bonificaciones", concepto: "Bono trimestral", monto: rand(300000, 600000) });
    }

    // EGRESOS: Vivienda
    movimientos.push({ userId: user.id, fecha: d(year, month, 5), tipo: "EGRESO", categoria: "Vivienda", concepto: "Arriendo", monto: 1200000 });
    movimientos.push({ userId: user.id, fecha: d(year, month, 10), tipo: "EGRESO", categoria: "Vivienda", concepto: "Internet + TV", monto: 119900 });
    movimientos.push({ userId: user.id, fecha: d(year, month, 8), tipo: "EGRESO", categoria: "Vivienda", concepto: "Energía eléctrica", monto: rand(130000, 180000) });

    // EGRESOS: Alimentación
    movimientos.push({ userId: user.id, fecha: d(year, month, rand(2, 7)), tipo: "EGRESO", categoria: "Alimentación", concepto: "Mercado", monto: rand(350000, 500000) });
    movimientos.push({ userId: user.id, fecha: d(year, month, rand(12, 18)), tipo: "EGRESO", categoria: "Alimentación", concepto: "Rappi", monto: rand(60000, 140000) });
    movimientos.push({ userId: user.id, fecha: d(year, month, rand(15, 22)), tipo: "EGRESO", categoria: "Alimentación", concepto: "Restaurante", monto: rand(80000, 160000) });

    // EGRESOS: Transporte
    movimientos.push({ userId: user.id, fecha: d(year, month, rand(5, 15)), tipo: "EGRESO", categoria: "Transporte", concepto: "Gasolina", monto: rand(150000, 250000) });
    movimientos.push({ userId: user.id, fecha: d(year, month, 15), tipo: "EGRESO", categoria: "Transporte", concepto: "Celular", monto: rand(75000, 85000) });

    // EGRESOS: Salud
    movimientos.push({ userId: user.id, fecha: d(year, month, rand(5, 25)), tipo: "EGRESO", categoria: "Salud", concepto: "Farmacia", monto: rand(15000, 80000) });

    // EGRESOS: Entretenimiento
    movimientos.push({ userId: user.id, fecha: d(year, month, rand(10, 20)), tipo: "EGRESO", categoria: "Entretenimiento", concepto: "Netflix / Spotify", monto: rand(35000, 60000) });

    // EGRESOS: Deudas
    movimientos.push({ userId: user.id, fecha: d(year, month, 20), tipo: "EGRESO", categoria: "Deudas", concepto: "Cuota tarjeta Visa", monto: rand(250000, 350000) });

    // EGRESOS: Ahorro
    movimientos.push({ userId: user.id, fecha: d(year, month, 1), tipo: "EGRESO", categoria: "Ahorro", concepto: "Fondo de emergencia", monto: 500000 });
  }

  await prisma.movimiento.createMany({ data: movimientos });
  console.log(`${movimientos.length} movimientos creados.`);
  console.log("\nCredenciales: demo@finanzas.com / password123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
