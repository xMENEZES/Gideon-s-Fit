import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import type { Database } from "@/lib/types/database.types";
import { msUntil, pushPayload } from "@/lib/rest-push";

type Client = SupabaseClient<Database>;

// As três variáveis vêm da Vercel (e do .env.local no ambiente de testes). A chave privada nunca
// vai para o código nem para o navegador; a pública também é lida pelo app (NEXT_PUBLIC_).
export function pushConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  );
}

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

// Espera até o fim do descanso e manda a notificação para os aparelhos inscritos da pessoa.
// Roda depois da resposta (`after`), com o cliente do próprio usuário (as regras de acesso valem).
// A "trava" é o update de pendente para enviado: se a pessoa pausou ou reiniciou o cronômetro, o
// aviso já está cancelado e nada é enviado; se dois processos chegarem juntos, só um leva a linha.
export async function sendRestAlarm(supabase: Client, alarmId: string, dueAt: string, label: string | null) {
  try {
    await new Promise((resolve) => setTimeout(resolve, msUntil(dueAt, Date.now())));

    const { data: claimed } = await supabase
      .from("rest_alarms")
      .update({ status: "sent" })
      .eq("id", alarmId)
      .eq("status", "pending")
      .select("id");
    if (!claimed?.length) return;

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");
    if (!subscriptions?.length) return;

    configure();
    const payload = JSON.stringify(pushPayload(label));
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          // TTL curto: um aviso de descanso que chega com minutos de atraso não serve mais.
          await webpush.sendNotification(
            { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
            payload,
            { TTL: 60, urgency: "high" }
          );
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            // Aparelho que desfez a inscrição: tira da lista.
            await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
          } else {
            console.error("sendRestAlarm: envio falhou, status", status ?? "desconhecido");
          }
        }
      })
    );
  } catch (error) {
    console.error("sendRestAlarm falhou:", error instanceof Error ? error.message : "erro desconhecido");
  }
}
