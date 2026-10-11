// Identidade dos selos de conquista (arte do arquivo gideons_selos_conquistas.svg do projeto).
import type { SealLine } from "@/lib/types/database.types";
import { MILESTONES } from "@/lib/streaks";

export const SEAL_THEME: Record<
  SealLine,
  { title: string; tagline: string; color: string; fill: string; unit: string }
> = {
  workout: {
    title: "Treino",
    tagline: "Mais força para o seu próximo capítulo.",
    color: "#43a5ff",
    fill: "#0c2341",
    unit: "de treino",
  },
  diet: {
    title: "Dieta",
    tagline: "O combustível certo para grandes feitos.",
    color: "#78d86b",
    fill: "#102d20",
    unit: "de dieta",
  },
  both: {
    title: "Treino + Dieta",
    tagline: "Disciplina e nutrição juntas.",
    color: "#e8b85d",
    fill: "#342516",
    unit: "de treino e dieta",
  },
};

// Um nome por marco (3, 7, 14, 30, 60, 100 e 200 dias), na ordem de MILESTONES.
const NAMES: Record<SealLine, readonly string[]> = {
  workout: [
    "Primeiro Levante",
    "Uma Semana de Foco",
    "Disciplina em Ação",
    "Força Constante",
    "Inquebrável",
    "O Caminho do Forte",
    "Titã dos Treinos",
  ],
  diet: [
    "Primeira Escolha",
    "Uma Semana de Equilíbrio",
    "Nutrição em Dia",
    "Hábitos Fortes",
    "Corpo em Equilíbrio",
    "Nutrição de Elite",
    "Guardião dos Hábitos",
  ],
  both: [
    "Começo de Tudo",
    "Semana Perfeita",
    "Dupla Consistência",
    "Transformação em Curso",
    "Sincronia Total",
    "Lenda da Consistência",
    "Lenda Absoluta",
  ],
};

export function sealName(line: SealLine, milestone: number): string {
  const index = (MILESTONES as readonly number[]).indexOf(milestone);
  return index >= 0 ? NAMES[line][index] : `${milestone} dias`;
}

// "Primeiro Levante: 3 dias de treino"
export function sealDescription(line: SealLine, milestone: number): string {
  return `${sealName(line, milestone)}: ${milestone} dias ${SEAL_THEME[line].unit}`;
}

// O maior selo conquistado de cada uma das linhas pedidas (na ordem pedida; linha sem selo some).
export function bestSeals(
  seals: { line: SealLine; milestone: number }[],
  lines: SealLine[]
): { line: SealLine; milestone: number }[] {
  return lines.flatMap((line) => {
    const milestones = seals.filter((seal) => seal.line === line).map((seal) => seal.milestone);
    return milestones.length > 0 ? [{ line, milestone: Math.max(...milestones) }] : [];
  });
}
