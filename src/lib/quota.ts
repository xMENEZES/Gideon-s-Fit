// Traduz o erro dos gatilhos de cota do banco (migrações 0023 e 0025) em mensagem para a pessoa.
// Manter os números iguais aos de supabase/migrations/0023_quotas.sql e 0025_incentive_messages.sql.
const QUOTA_MESSAGES: Record<string, string> = {
  students: "Seu time chegou ao limite de 200 alunos.",
  templates: "Você chegou ao limite de 100 modelos. Exclua algum para criar outro.",
  workout_days: "Um protocolo de treino aceita no máximo 14 dias.",
  exercises: "Um dia de treino aceita no máximo 40 exercícios.",
  meals: "Um protocolo alimentar aceita no máximo 15 refeições.",
  meal_items: "Uma opção de refeição aceita no máximo 40 itens.",
  incentive_messages: "Cada tipo de mensagem aceita no máximo 10 mensagens.",
};

export function quotaMessage(error: { message?: string } | null | undefined): string | null {
  const key = error?.message?.match(/^quota_exceeded:(\w+)/)?.[1];
  if (!key) return null;
  return QUOTA_MESSAGES[key] ?? "Você atingiu o limite de uso permitido.";
}
