"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registro falhou (ex: navegador sem suporte) — o app continua funcionando normalmente sem SW.
      });
    }
  }, []);

  return null;
}
