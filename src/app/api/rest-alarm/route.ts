import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";
import { quotaMessage } from "@/lib/quota";
import { parseAlarmRequest } from "@/lib/rest-push";
import { pushConfigured, sendRestAlarm } from "@/lib/push-server";

// Cada aviso mantém esta função viva até o fim do descanso (até 240 s). O limite de 300 s é o
// máximo do plano com o Fluid Compute da Vercel.
export const maxDuration = 300;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// O navegador manda o cabeçalho Origin nos pedidos de outro site; recusa se não for o nosso.
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

// Agenda o aviso do fim do descanso. Só agenda para quem tem aparelho inscrito.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });

  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = parseAlarmRequest(await request.json().catch(() => null));
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });

  if (!pushConfigured()) return Response.json({ scheduled: false, reason: "not_configured" });

  const supabase = await createClient();
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true });
  if (!count) return Response.json({ scheduled: false, reason: "no_subscription" });

  const dueAt = new Date(Date.now() + parsed.seconds * 1000).toISOString();
  const { data, error } = await supabase
    .from("rest_alarms")
    .insert({ user_id: userId, due_at: dueAt, body: parsed.label })
    .select("id")
    .single();
  if (error || !data) {
    const message = quotaMessage(error);
    return Response.json(
      { error: message ?? "Não foi possível agendar o aviso." },
      { status: message ? 429 : 500 }
    );
  }

  after(() => sendRestAlarm(supabase, data.id, dueAt, parsed.label));
  return Response.json({ scheduled: true, id: data.id });
}

// Cancela o aviso (a pessoa pausou ou reiniciou o cronômetro). Só muda um aviso ainda pendente.
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });

  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Não autenticado." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return Response.json({ error: "Aviso inválido." }, { status: 400 });

  const supabase = await createClient();
  await supabase.from("rest_alarms").update({ status: "cancelled" }).eq("id", id).eq("status", "pending");
  return Response.json({ ok: true });
}
