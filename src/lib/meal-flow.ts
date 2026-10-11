// Fluxo da tela diária de alimentação: qual refeição vem depois de marcar uma.
// Função pura, testada em meal-flow.test.ts.

// Próxima refeição ainda sem registro, depois de `afterId` e na ordem do protocolo; se não
// houver nenhuma adiante, volta ao início e procura entre as anteriores. null = todas marcadas.
export function nextPendingMealId(
  mealIds: string[],
  isMarked: (mealId: string) => boolean,
  afterId: string
): string | null {
  const start = mealIds.indexOf(afterId);
  for (let step = 1; step <= mealIds.length; step++) {
    const id = mealIds[(start + step + mealIds.length) % mealIds.length];
    if (id !== afterId && !isMarked(id)) return id;
  }
  return null;
}
