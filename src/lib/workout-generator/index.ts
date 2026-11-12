// Gerador de treino: classificação dos exercícios, regras e motor (puro, sem banco). A tela e a gravação
// ficam em src/app/(standard)/meu-plano/treino/gerar e em src/lib/actions/generated-workout.ts.
export * from "./catalog";
export * from "./rules";
export {
  generateWorkoutPlan,
  type GeneratedCardioExercise,
  type GeneratedDay,
  type GeneratedPlan,
  type GeneratedStrengthExercise,
} from "./generate";
