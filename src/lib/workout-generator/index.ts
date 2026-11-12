// Gerador de treino (base): classificação dos exercícios, regras e motor. Sem tela e sem banco.
export * from "./catalog";
export * from "./rules";
export {
  generateWorkoutPlan,
  type GeneratedCardioExercise,
  type GeneratedDay,
  type GeneratedPlan,
  type GeneratedStrengthExercise,
} from "./generate";
