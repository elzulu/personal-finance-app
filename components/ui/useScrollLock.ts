"use client";

import { useEffect } from "react";

// Contador compartido: si hay un modal y el menú abiertos a la vez, el scroll se libera
// solo cuando se cierra el último.
let bloqueos = 0;
let previo: { html: string; body: string; paddingRight: string } | null = null;

function bloquear() {
  if (bloqueos++ > 0) return;
  const html = document.documentElement;
  const body = document.body;
  previo = { html: html.style.overflow, body: body.style.overflow, paddingRight: body.style.paddingRight };
  // En escritorio, al quitar la barra de scroll el contenido saltaría: se compensa con padding
  const anchoBarra = window.innerWidth - html.clientWidth;
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  if (anchoBarra > 0) body.style.paddingRight = `${anchoBarra}px`;
}

function liberar() {
  if (--bloqueos > 0 || !previo) return;
  document.documentElement.style.overflow = previo.html;
  document.body.style.overflow = previo.body;
  document.body.style.paddingRight = previo.paddingRight;
  previo = null;
}

// Bloquea el scroll de la página de fondo mientras `activo` sea true (menús y modales)
export function useScrollLock(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    bloquear();
    return liberar;
  }, [activo]);
}
