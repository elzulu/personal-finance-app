"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/Feedback";

type Estado = "cargando" | "no_soportado" | "no_configurado" | "bloqueado" | "inactivo" | "activo";

// La llave VAPID llega en base64url; el navegador la necesita como bytes
function base64UrlABytes(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function soportado(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// Activa o desactiva los recordatorios de pago (notificaciones push) en este dispositivo
export function RecordatoriosCard() {
  const { toast } = useFeedback();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [trabajando, setTrabajando] = useState(false);

  const detectar = useCallback(async () => {
    if (!soportado()) return setEstado("no_soportado");
    try {
      const res = await fetch("/api/push/key");
      if (res.status === 503) return setEstado("no_configurado");
      if (!res.ok) throw new Error();
      if (Notification.permission === "denied") return setEstado("bloqueado");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setEstado(sub && Notification.permission === "granted" ? "activo" : "inactivo");
    } catch {
      setEstado("inactivo");
    }
  }, []);

  useEffect(() => {
    detectar();
  }, [detectar]);

  async function activar() {
    setTrabajando(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
        return;
      }
      const keyRes = await fetch("/api/push/key");
      if (!keyRes.ok) throw new Error("clave");
      const { publicKey } = await keyRes.json();
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlABytes(publicKey) as BufferSource,
        }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("guardar");
      setEstado("activo");
      toast("Recordatorios activados en este dispositivo");
    } catch {
      toast("No se pudieron activar los recordatorios", { kind: "error" });
    } finally {
      setTrabajando(false);
    }
  }

  async function desactivar() {
    setTrabajando(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEstado("inactivo");
      toast("Recordatorios desactivados");
    } catch {
      toast("No se pudieron desactivar los recordatorios", { kind: "error" });
    } finally {
      setTrabajando(false);
    }
  }

  // Notificación local para comprobar que el dispositivo las muestra (no pasa por el servidor)
  async function probar() {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification("Recordatorio de prueba", {
      body: "Así te avisaremos el día de pago de tus deudas.",
      tag: "prueba",
      data: { url: "/deudas" },
    });
  }

  const mensajes: Record<Exclude<Estado, "cargando" | "activo" | "inactivo">, string> = {
    no_soportado:
      "Este navegador no permite notificaciones. En iPhone instala la app en la pantalla de inicio (Compartir → Agregar a inicio).",
    no_configurado: "Los recordatorios aún no están configurados en el servidor.",
    bloqueado: "Bloqueaste las notificaciones de este sitio. Actívalas desde los permisos del navegador.",
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl bg-cyan-400/10 text-cyan-300 flex items-center justify-center shrink-0"
          aria-hidden
        >
          {estado === "activo" ? <Bell size={18} /> : <BellOff size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-200">Recordatorios de pago</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Te avisamos por notificación el día de pago de cada deuda que tenga día de pago, si aún no registraste el pago.
          </p>

          {estado === "cargando" && <p className="text-xs text-slate-400 mt-3">Comprobando...</p>}

          {(estado === "no_soportado" || estado === "no_configurado" || estado === "bloqueado") && (
            <p role="status" className="text-xs text-amber-300 mt-3">
              {mensajes[estado]}
            </p>
          )}

          {estado === "inactivo" && (
            <Button className="mt-3" size="sm" onClick={activar} loading={trabajando}>
              Activar en este dispositivo
            </Button>
          )}

          {estado === "activo" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-emerald-300">Activados en este dispositivo</span>
              <Button variant="secondary" size="sm" onClick={probar}>
                Enviar prueba
              </Button>
              <Button variant="ghost" size="sm" onClick={desactivar} loading={trabajando}>
                Desactivar
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
