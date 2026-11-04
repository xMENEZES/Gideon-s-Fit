// Service worker mínimo, escrito à mão (sem next-pwa/serwist: são baseados em
// plugins de webpack e este projeto builda com Turbopack, que os ignora).
//
// Escopo deliberado: só dá resiliência de rede para o app shell (assets
// estáticos/ícones) e mostra uma página de fallback amigável quando uma
// navegação falha por estar offline. NÃO tenta cachear dados dinâmicos/
// autenticados (treino, dieta, alunos) — isso exigiria uma sessão Supabase
// viva e ficaria incorreto/desatualizado sem conexão.

const STATIC_CACHE = "gideons-fit-static-v4";
const PRECACHE_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação de página inteira (load/reload): tenta a rede, cai para a
  // página de offline se não conseguir.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  // Assets estáticos e ícones: cache-first, atualizando em segundo plano.
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/icon.png" ||
    url.pathname === "/apple-icon.png";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }

  // Todo o resto (dados dinâmicos, Supabase, payloads de RSC) passa direto pra rede.
});

// Notificação push do fim do descanso. O servidor manda { title, body, url, tag }.
// Com o app à vista, ele mesmo já avisou (bipes e vibração), então não mostra a
// notificação; o navegador aceita isso quando há uma janela do app visível.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (windows.some((client) => client.visibilityState === "visible")) return;

      await self.registration.showNotification(data.title || "Descanso terminou", {
        body: data.body || "Hora da próxima série.",
        icon: "/icons/icon-192.png",
        // Uma tag fixa: um aviso novo substitui o anterior em vez de empilhar.
        tag: data.tag || "rest-timer",
        renotify: true,
        vibrate: [350, 180, 350, 180, 350],
        data: { url: data.url || "/" },
      });
    })()
  );
});

// Ao tocar na notificação: traz o app para a frente, ou abre se estiver fechado.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if ("focus" in client) {
          await client.focus();
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
