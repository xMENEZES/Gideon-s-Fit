// Notificação push no aparelho (migração 0034): inscrever, desinscrever e agendar o aviso do fim
// do descanso. Só roda no navegador. As regras puras estão em `rest-push.ts`.
import { removePushSubscription, savePushSubscription } from "@/lib/actions/push";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

// Na primeira vez que a página agenda um aviso, reivindica o aparelho para quem está logado (se
// outra pessoa usou este aparelho antes, a inscrição ainda está no nome dela).
let claimed = false;

// "ask" = pode pedir permissão; "on" = este aparelho recebe; "blocked" = a pessoa bloqueou nas
// configurações do navegador; "unsupported" = o navegador não tem notificação push (ou o servidor
// ainda não tem as chaves).
export type PushState = "unsupported" | "ask" | "on" | "blocked";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!PUBLIC_KEY &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// A chave pública vem em base64 "seguro para URL"; o navegador quer os bytes.
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
}

async function thisDeviceSubscription(): Promise<PushSubscription | null> {
  const existing = await navigator.serviceWorker.getRegistration();
  return existing ? existing.pushManager.getSubscription() : null;
}

function keysOf(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return { endpoint: subscription.endpoint, p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" };
}

export async function readPushState(): Promise<PushState> {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission === "granted" && (await thisDeviceSubscription())) return "on";
  return "ask";
}

// Pede permissão e inscreve este aparelho. Precisa ser chamada de um toque da pessoa (o navegador
// só mostra o pedido de permissão nesse caso).
export async function enablePushOnThisDevice(): Promise<{ ok: true } | { ok: false; reason: "denied" | "unsupported" | "error"; message?: string }> {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, reason: "denied" };

    const current = await registration();
    await navigator.serviceWorker.ready;
    const subscription =
      (await current.pushManager.getSubscription()) ??
      (await current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      }));

    const saved = await savePushSubscription(keysOf(subscription));
    if (saved.error) return { ok: false, reason: "error", message: saved.error };
    claimed = true;
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function disablePushOnThisDevice(): Promise<void> {
  const subscription = pushSupported() ? await thisDeviceSubscription() : null;
  if (!subscription) return;
  await removePushSubscription(subscription.endpoint);
  await subscription.unsubscribe();
}

// Agenda o aviso do fim do descanso no servidor. Devolve o id do aviso, ou nulo se não houver
// aviso (sem permissão, sem inscrição, descanso longo demais, erro). Nunca derruba o cronômetro.
export async function scheduleRestAlarm(seconds: number, label: string): Promise<string | null> {
  try {
    if (!pushSupported() || Notification.permission !== "granted") return null;
    const subscription = await thisDeviceSubscription();
    if (!subscription) return null;

    if (!claimed) {
      claimed = true;
      await savePushSubscription(keysOf(subscription));
    }

    const response = await fetch("/api/rest-alarm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seconds, label }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { scheduled?: boolean; id?: string };
    return data.scheduled && data.id ? data.id : null;
  } catch {
    return null;
  }
}

// Cancela o aviso (a pessoa pausou ou reiniciou o cronômetro).
export async function cancelRestAlarm(id: string): Promise<void> {
  try {
    await fetch(`/api/rest-alarm?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch {
    // sem rede: o aviso chega mesmo assim, o que é aceitável
  }
}
