import { PrismaClient, Tipo } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dateInMonth(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

async function main() {
  console.log("Limpiando base de datos...");
  await prisma.movimiento.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creando usuario de prueba...");
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.create({
    data: {
      email: "demo@finanzas.com",
      passwordHash,
      name: "Usuario Demo",
    },
  });

  console.log(`Usuario creado: ${user.email} / password123`);

  const movimientos: Array<{
    userId: string;
    fecha: Date;
    tipo: Tipo;
    categoria: string;
    concepto: string;
    presupuesto: number | null;
    monto: number;
  }> = [];

  // Generar 5 meses de datos (marzo a julio 2026)
  const meses = [
    { year: 2026, month: 3 },
    { year: 2026, month: 4 },
    { year: 2026, month: 5 },
    { year: 2026, month: 6 },
    { year: 2026, month: 7 },
  ];

  for (const { year, month } of meses) {
    // --- INGRESOS ---
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, 1),
      tipo: "INGRESO",
      categoria: "Sueldo",
      concepto: "Sueldo mensual",
      presupuesto: 5000000,
      monto: 5000000,
    });

    if (month % 2 === 1) {
      movimientos.push({
        userId: user.id,
        fecha: dateInMonth(year, month, randomBetween(10, 20)),
        tipo: "INGRESO",
        categoria: "Negocio",
        concepto: "Ventas freelance",
        presupuesto: 800000,
        monto: randomBetween(600000, 1200000),
      });
    }

    if (month === 4 || month === 7) {
      movimientos.push({
        userId: user.id,
        fecha: dateInMonth(year, month, randomBetween(5, 15)),
        tipo: "INGRESO",
        categoria: "Otro",
        concepto: "Transferencia familiar",
        presupuesto: null,
        monto: randomBetween(200000, 500000),
      });
    }

    // --- EGRESOS: Servicios ---
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, 5),
      tipo: "EGRESO",
      categoria: "Servicios",
      concepto: "Arriendo",
      presupuesto: 1200000,
      monto: 1200000,
    });
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, 10),
      tipo: "EGRESO",
      categoria: "Servicios",
      concepto: "Internet + TV",
      presupuesto: 120000,
      monto: 119900,
    });
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, 15),
      tipo: "EGRESO",
      categoria: "Servicios",
      concepto: "Celular",
      presupuesto: 80000,
      monto: randomBetween(75000, 85000),
    });
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, 8),
      tipo: "EGRESO",
      categoria: "Servicios",
      concepto: "Energia electrica",
      presupuesto: 150000,
      monto: randomBetween(130000, 180000),
    });

    // --- EGRESOS: Gastos ---
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, randomBetween(2, 7)),
      tipo: "EGRESO",
      categoria: "Gastos",
      concepto: "Mercado",
      presupuesto: 400000,
      monto: randomBetween(350000, 500000),
    });
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, randomBetween(8, 14)),
      tipo: "EGRESO",
      categoria: "Gastos",
      concepto: "Gasolina",
      presupuesto: 200000,
      monto: randomBetween(150000, 250000),
    });
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, randomBetween(12, 18)),
      tipo: "EGRESO",
      categoria: "Gastos",
      concepto: "Rappi Jose",
      presupuesto: 100000,
      monto: randomBetween(60000, 140000),
    });
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, randomBetween(15, 22)),
      tipo: "EGRESO",
      categoria: "Gastos",
      concepto: "Restaurante",
      presupuesto: 120000,
      monto: randomBetween(80000, 160000),
    });
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, randomBetween(5, 25)),
      tipo: "EGRESO",
      categoria: "Gastos",
      concepto: "Farmacia",
      presupuesto: null,
      monto: randomBetween(15000, 80000),
    });

    // --- EGRESOS: Deudas ---
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, 20),
      tipo: "EGRESO",
      categoria: "Deudas",
      concepto: "Cuota tarjeta Visa",
      presupuesto: 300000,
      monto: randomBetween(250000, 350000),
    });

    if (month <= 5) {
      movimientos.push({
        userId: user.id,
        fecha: dateInMonth(year, month, 25),
        tipo: "EGRESO",
        categoria: "Deudas",
        concepto: "Prestamo vehiculo",
        presupuesto: 450000,
        monto: 450000,
      });
    }

    // --- EGRESOS: Ahorro ---
    movimientos.push({
      userId: user.id,
      fecha: dateInMonth(year, month, 1),
      tipo: "EGRESO",
      categoria: "Ahorro",
      concepto: "Fondo de emergencia",
      presupuesto: 500000,
      monto: 500000,
    });
  }

  await prisma.movimiento.createMany({ data: movimientos });
  console.log(`${movimientos.length} movimientos creados.`);
  console.log("\nSeed completado. Credenciales de acceso:");
  console.log("  Email: demo@finanzas.com");
  console.log("  Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
