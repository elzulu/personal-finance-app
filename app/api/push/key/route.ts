import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Llave pública VAPID para que el navegador pueda suscribirse; 503 si los recordatorios no están configurados
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "Recordatorios no configurados" }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}
