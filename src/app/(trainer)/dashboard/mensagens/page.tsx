import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";
import { EDITABLE_EVENTS, EVENT_LABELS } from "@/lib/incentive";
import { IncentiveEventCard } from "@/components/shared/incentive-event-card";

export default async function MensagensPage() {
  const userId = await getSessionUserId();
  const supabase = await createClient();
  const { data } = await supabase
    .from("incentive_messages")
    .select("id, owner_id, event, body, active")
    .order("created_at", { ascending: true });
  const messages = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mensagens de incentivo</h1>
        <p className="text-sm text-muted-foreground">
          Textos que seus alunos veem ao concluir o treino, a alimentação ou o dia. Sem mensagens
          suas, eles recebem as padrão do sistema. Quem usa o plano próprio sempre vê as padrão.
        </p>
      </div>

      {EDITABLE_EVENTS.map((event) => (
        <IncentiveEventCard
          key={event}
          event={event}
          title={EVENT_LABELS[event].title}
          hint={EVENT_LABELS[event].hint}
          system={messages.filter((m) => m.event === event && m.owner_id === null)}
          own={messages.filter((m) => m.event === event && m.owner_id === userId)}
        />
      ))}
    </div>
  );
}
