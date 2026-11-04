"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { quotaMessage } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";

// O que o navegador entrega ao inscrever um aparelho (a chave privada de envio nunca passa por aqui).
const subscriptionSchema = z.object({
  endpoint: z.string().max(2048).regex(/^https:\/\//, "Endereço de notificação inválido."),
  p256dh: z.string().min(20).max(200),
  auth: z.string().min(10).max(100),
});

// Inscreve (ou reivindica) este aparelho para a pessoa logada. Se outra pessoa entrou antes no
// mesmo aparelho, a inscrição passa para quem chamou.
export async function savePushSubscription(input: { endpoint: string; p256dh: string; auth: string }) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Não autenticado." };

  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const userAgent = (await headers()).get("user-agent") ?? undefined;
  const supabase = await createClient();
  const { error } = await supabase.rpc("register_push_subscription", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.p256dh,
    p_auth: parsed.data.auth,
    p_user_agent: userAgent,
  });
  if (error) return { error: quotaMessage(error) ?? "Não foi possível ativar o aviso neste aparelho." };
  return { success: true };
}

// Tira este aparelho da lista da pessoa (as regras de acesso só deixam apagar o dela).
export async function removePushSubscription(endpoint: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Não autenticado." };
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) return { error: "Endereço inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", userId);
  if (error) return { error: "Não foi possível desativar o aviso." };
  return { success: true };
}
