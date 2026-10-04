// Configuración de Web Push (solo servidor). Devuelve null si faltan las llaves VAPID.
import webpush from "web-push";

let configurado = false;

export function getWebPush(): typeof webpush | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  if (!configurado) {
    // El "subject" identifica a la app ante los servicios de push: se usa la URL de la app, no un correo
    const subject = process.env.VAPID_SUBJECT || process.env.NEXTAUTH_URL || "https://localhost";
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configurado = true;
  }
  return webpush;
}
