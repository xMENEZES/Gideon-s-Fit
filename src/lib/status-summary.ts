// Resumo do status de um aluno em uma linha por módulo, como aparece nos cards da lista de alunos
// do profissional. Funções puras (testadas em status-summary.test.ts).

type WorkoutSummaryInput = { trainedCount: number; range: string[] };
type DietSummaryInput = {
  mealsPerDay: number;
  closedDays: number;
  percent: number;
  doneTotal: number;
  expectedTotal: number;
};

// "3 de 8 dias treinados" ou "Sem protocolo ativo".
export function workoutSummaryText(workout: WorkoutSummaryInput | null): string {
  if (!workout) return "Sem protocolo ativo";
  return `${workout.trainedCount} de ${workout.range.length} dias treinados`;
}

// "75% (9 de 12 refeições)", "Em andamento (1º dia)", "Sem refeições cadastradas" ou "Sem protocolo ativo".
export function dietSummaryText(diet: DietSummaryInput | null): string {
  if (!diet) return "Sem protocolo ativo";
  if (diet.mealsPerDay === 0) return "Sem refeições cadastradas";
  if (diet.closedDays === 0) return "Em andamento (1º dia)";
  return `${diet.percent}% (${diet.doneTotal} de ${diet.expectedTotal} refeições)`;
}
