// Notificação push do fim do descanso (migração 0034): regras puras, sem rede nem banco.
// O app avisa o servidor "o descanso termina em N segundos"; o servidor espera e, se o aviso
// continuar pendente, manda a notificação para os aparelhos inscritos da pessoa.

// Quanto tempo o servidor aceita esperar. Cada aviso mantém uma função do servidor viva até o
// fim do descanso; a rota tem tempo máximo de 300 s, então 240 s deixam margem. Descansos mais
// longos seguem só com o alerta do app aberto.
export const MIN_PUSH_REST_SECONDS = 5;
export const MAX_PUSH_REST_SECONDS = 240;
export const LABEL_MAX = 100;

export type AlarmRequest = { seconds: number; label: string | null };

// Confere o corpo do pedido: `seconds` inteiro entre 5 e 240 e `label` (nome do exercício)
// opcional, que é cortado em 100 caracteres.
export function parseAlarmRequest(input: unknown): AlarmRequest | { error: string } {
  if (typeof input !== "object" || input === null) return { error: "Pedido inválido." };
  const { seconds, label } = input as { seconds?: unknown; label?: unknown };

  if (typeof seconds !== "number" || !Number.isInteger(seconds)) {
    return { error: "Informe os segundos do descanso." };
  }
  if (seconds < MIN_PUSH_REST_SECONDS || seconds > MAX_PUSH_REST_SECONDS) {
    return { error: `O descanso do aviso vai de ${MIN_PUSH_REST_SECONDS} a ${MAX_PUSH_REST_SECONDS} segundos.` };
  }

  const cleaned = typeof label === "string" ? label.trim().replace(/\s+/g, " ").slice(0, LABEL_MAX) : "";
  return { seconds, label: cleaned || null };
}

// O descanso cabe no aviso por push?
export function canPush(seconds: number): boolean {
  return Number.isInteger(seconds) && seconds >= MIN_PUSH_REST_SECONDS && seconds <= MAX_PUSH_REST_SECONDS;
}

export type PushPayload = { title: string; body: string; url: string; tag: string };

// Conteúdo da notificação. A tag fixa faz um aviso novo substituir o anterior em vez de empilhar.
export function pushPayload(label: string | null): PushPayload {
  return {
    title: "Descanso terminou",
    body: label ? `Hora da próxima série: ${label}.` : "Hora da próxima série.",
    url: "/",
    tag: "rest-timer",
  };
}

// Milissegundos que faltam para o horário do aviso (nunca negativo).
export function msUntil(dueAtIso: string, nowMs: number): number {
  const due = Date.parse(dueAtIso);
  return Number.isNaN(due) ? 0 : Math.max(0, due - nowMs);
}
