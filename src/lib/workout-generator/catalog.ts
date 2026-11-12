// Classificação dos exercícios que o gerador de treino pode escolher (Usuário Padrão, a partir de 18 anos).
//
// Cada exercício diz o que ele exige (equipamento, banco), que tipo de movimento é, a partir de que
// nível pode ser indicado, se tem impacto e quais articulações sobrecarrega (usado para excluir o
// exercício de quem informar dor ou lesão ali). É dado de código, e não do banco, de propósito: o
// gerador é determinístico, os testes de cobertura rodam em todo CI e corrigir a classificação é
// um deploy comum, sem migração. O treino gerado grava só o NOME do exercício (texto livre), então
// nada aqui depende do catálogo de sugestões do banco (`exercise_catalog`).
//
// STATUS: rascunho elaborado por mim (Claude) em 12/11/2026. Aguarda revisão de um profissional de
// educação física (planilha de revisão); ao voltar, ajustar este arquivo. Os exercícios com
// `isNew: true` foram propostos para fechar buracos de cobertura de quem treina em casa.

export type MuscleGroup =
  | "peito" | "costas" | "ombros" | "biceps" | "triceps" | "antebraco"
  | "abdomen" | "gluteos" | "coxas" | "panturrilha" | "corpo_todo";

// O que o exercício exige. "estrutura" = barra fixa, paralelas, caixote; "acessorio" = caneleira,
// roda abdominal, corda naval.
export type Equipment =
  | "corpo" | "halter" | "barra" | "maquina" | "polia" | "smith" | "kettlebell" | "estrutura" | "acessorio";

// Tipo de movimento. Usado para montar cada dia com equilíbrio (um de empurrar, um de puxar, etc.).
export type Pattern =
  | "agachar" | "avanco" | "dobrar_quadril"
  | "empurrar_h" | "empurrar_v" | "puxar_h" | "puxar_v"
  | "core" | "isolado" | "corpo_todo";

export type Level = "iniciante" | "intermediario" | "avancado";
export type Joint = "joelho" | "ombro" | "coluna";

export type GeneratorExercise = {
  name: string;
  group: MuscleGroup;
  equipment: Equipment;
  pattern: Pattern;
  // A partir de que nível o gerador pode indicar o exercício.
  minLevel: Level;
  // "alto" = saltos e impacto repetido.
  impact: "baixo" | "alto";
  // Articulações que o exercício sobrecarrega: some para quem informar dor ou lesão ali.
  joints: Joint[];
  // Feito por segundos (ex.: prancha) e não por repetições.
  timed?: true;
  // Exige um banco.
  needsBench?: true;
  // Proposto agora para fechar buraco de cobertura (ainda não existe no catálogo do banco).
  isNew?: true;
};

export const GENERATOR_EXERCISES: readonly GeneratorExercise[] = [
  { name: "Supino reto com barra", group: "peito", equipment: "barra", pattern: "empurrar_h", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Supino reto com halteres", group: "peito", equipment: "halter", pattern: "empurrar_h", minLevel: "iniciante", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Supino inclinado com barra", group: "peito", equipment: "barra", pattern: "empurrar_h", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Supino inclinado com halteres", group: "peito", equipment: "halter", pattern: "empurrar_h", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Supino declinado com barra", group: "peito", equipment: "barra", pattern: "empurrar_h", minLevel: "avancado", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Supino declinado com halteres", group: "peito", equipment: "halter", pattern: "empurrar_h", minLevel: "avancado", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Supino reto na máquina", group: "peito", equipment: "maquina", pattern: "empurrar_h", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Supino inclinado na máquina", group: "peito", equipment: "maquina", pattern: "empurrar_h", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Crucifixo reto com halteres", group: "peito", equipment: "halter", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Crucifixo inclinado com halteres", group: "peito", equipment: "halter", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Crucifixo na máquina (peck deck)", group: "peito", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Crossover na polia alta", group: "peito", equipment: "polia", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [] },
  { name: "Crossover na polia baixa", group: "peito", equipment: "polia", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [] },
  { name: "Crucifixo na polia (cross over)", group: "peito", equipment: "polia", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [] },
  { name: "Flexão de braços", group: "peito", equipment: "corpo", pattern: "empurrar_h", minLevel: "intermediario", impact: "baixo", joints: ["ombro"] },
  { name: "Flexão de braços com joelhos apoiados", group: "peito", equipment: "corpo", pattern: "empurrar_h", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Flexão de braços inclinada", group: "peito", equipment: "corpo", pattern: "empurrar_h", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Pullover com halter", group: "peito", equipment: "halter", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Puxada frontal na polia", group: "costas", equipment: "polia", pattern: "puxar_v", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Puxada frontal aberta", group: "costas", equipment: "polia", pattern: "puxar_v", minLevel: "iniciante", impact: "baixo", joints: ["ombro"] },
  { name: "Puxada com triângulo", group: "costas", equipment: "polia", pattern: "puxar_v", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Puxada supinada", group: "costas", equipment: "polia", pattern: "puxar_v", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Puxada com pegada neutra", group: "costas", equipment: "polia", pattern: "puxar_v", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Barra fixa", group: "costas", equipment: "estrutura", pattern: "puxar_v", minLevel: "avancado", impact: "baixo", joints: ["ombro"] },
  { name: "Barra fixa supinada", group: "costas", equipment: "estrutura", pattern: "puxar_v", minLevel: "intermediario", impact: "baixo", joints: ["ombro"] },
  { name: "Remada curvada com barra", group: "costas", equipment: "barra", pattern: "puxar_h", minLevel: "intermediario", impact: "baixo", joints: ["coluna"] },
  { name: "Remada curvada com halteres", group: "costas", equipment: "halter", pattern: "puxar_h", minLevel: "intermediario", impact: "baixo", joints: ["coluna"] },
  { name: "Remada unilateral com halter (serrote)", group: "costas", equipment: "halter", pattern: "puxar_h", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Remada baixa na polia", group: "costas", equipment: "polia", pattern: "puxar_h", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Remada baixa com triângulo", group: "costas", equipment: "polia", pattern: "puxar_h", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Remada cavalinho", group: "costas", equipment: "barra", pattern: "puxar_h", minLevel: "intermediario", impact: "baixo", joints: ["coluna"] },
  { name: "Remada na máquina", group: "costas", equipment: "maquina", pattern: "puxar_h", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Remada unilateral na polia", group: "costas", equipment: "polia", pattern: "puxar_h", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Remada invertida", group: "costas", equipment: "estrutura", pattern: "puxar_h", minLevel: "intermediario", impact: "baixo", joints: [] },
  { name: "Pulldown com braços estendidos", group: "costas", equipment: "polia", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: ["ombro"] },
  { name: "Levantamento terra", group: "costas", equipment: "barra", pattern: "dobrar_quadril", minLevel: "avancado", impact: "baixo", joints: ["coluna"] },
  { name: "Extensão lombar", group: "costas", equipment: "maquina", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: ["coluna"] },
  { name: "Hiperextensão", group: "costas", equipment: "estrutura", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: ["coluna"] },
  { name: "Encolhimento com halteres", group: "costas", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Encolhimento com barra", group: "costas", equipment: "barra", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Superman (extensão lombar no solo)", group: "costas", equipment: "corpo", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: ["coluna"], isNew: true },
  { name: "Desenvolvimento com barra", group: "ombros", equipment: "barra", pattern: "empurrar_v", minLevel: "intermediario", impact: "baixo", joints: ["ombro", "coluna"] },
  { name: "Desenvolvimento com halteres", group: "ombros", equipment: "halter", pattern: "empurrar_v", minLevel: "iniciante", impact: "baixo", joints: ["ombro"] },
  { name: "Desenvolvimento com halteres sentado", group: "ombros", equipment: "halter", pattern: "empurrar_v", minLevel: "iniciante", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Desenvolvimento na máquina", group: "ombros", equipment: "maquina", pattern: "empurrar_v", minLevel: "iniciante", impact: "baixo", joints: ["ombro"] },
  { name: "Desenvolvimento Arnold", group: "ombros", equipment: "halter", pattern: "empurrar_v", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Elevação lateral com halteres", group: "ombros", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Elevação lateral na polia", group: "ombros", equipment: "polia", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [] },
  { name: "Elevação lateral na máquina", group: "ombros", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Elevação frontal com halteres", group: "ombros", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: ["ombro"] },
  { name: "Elevação frontal com barra", group: "ombros", equipment: "barra", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: ["ombro"] },
  { name: "Elevação frontal na polia", group: "ombros", equipment: "polia", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: ["ombro"] },
  { name: "Crucifixo inverso com halteres", group: "ombros", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Crucifixo inverso na máquina", group: "ombros", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Elevação posterior na polia", group: "ombros", equipment: "polia", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [] },
  { name: "Remada alta com barra", group: "ombros", equipment: "barra", pattern: "puxar_v", minLevel: "intermediario", impact: "baixo", joints: ["ombro"] },
  { name: "Face pull", group: "ombros", equipment: "polia", pattern: "puxar_h", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rotação externa com halter", group: "ombros", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Flexão pike (em V invertido)", group: "ombros", equipment: "corpo", pattern: "empurrar_v", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], isNew: true },
  { name: "Rosca direta com barra", group: "biceps", equipment: "barra", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rosca direta com barra W", group: "biceps", equipment: "barra", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rosca alternada com halteres", group: "biceps", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rosca simultânea com halteres", group: "biceps", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rosca martelo com halteres", group: "biceps", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rosca martelo na corda", group: "biceps", equipment: "polia", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rosca concentrada", group: "biceps", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [], needsBench: true },
  { name: "Rosca Scott com barra", group: "biceps", equipment: "barra", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [], needsBench: true },
  { name: "Rosca Scott com halteres", group: "biceps", equipment: "halter", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [], needsBench: true },
  { name: "Rosca Scott na máquina", group: "biceps", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rosca na polia baixa", group: "biceps", equipment: "polia", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rosca inclinada com halteres", group: "biceps", equipment: "halter", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Rosca 21", group: "biceps", equipment: "barra", pattern: "isolado", minLevel: "avancado", impact: "baixo", joints: [] },
  { name: "Tríceps na polia com barra", group: "triceps", equipment: "polia", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Tríceps na polia com corda", group: "triceps", equipment: "polia", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Tríceps pulley invertido", group: "triceps", equipment: "polia", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [] },
  { name: "Tríceps testa com barra", group: "triceps", equipment: "barra", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [], needsBench: true },
  { name: "Tríceps testa com halteres", group: "triceps", equipment: "halter", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [], needsBench: true },
  { name: "Tríceps francês com halter", group: "triceps", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Tríceps francês na polia", group: "triceps", equipment: "polia", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [] },
  { name: "Tríceps no banco", group: "triceps", equipment: "corpo", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Mergulho nas paralelas", group: "triceps", equipment: "estrutura", pattern: "empurrar_v", minLevel: "avancado", impact: "baixo", joints: ["ombro"] },
  { name: "Tríceps coice com halter", group: "triceps", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Tríceps na máquina", group: "triceps", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Tríceps unilateral na polia", group: "triceps", equipment: "polia", pattern: "isolado", minLevel: "intermediario", impact: "baixo", joints: [] },
  { name: "Supino fechado", group: "triceps", equipment: "barra", pattern: "empurrar_h", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], needsBench: true },
  { name: "Flexão diamante", group: "triceps", equipment: "corpo", pattern: "empurrar_h", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], isNew: true },
  { name: "Rosca de punho com barra", group: "antebraco", equipment: "barra", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rosca de punho com halteres", group: "antebraco", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rosca de punho inversa", group: "antebraco", equipment: "barra", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rosca inversa com barra", group: "antebraco", equipment: "barra", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Abdominal supra", group: "abdomen", equipment: "corpo", pattern: "core", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Abdominal infra", group: "abdomen", equipment: "corpo", pattern: "core", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Abdominal remador", group: "abdomen", equipment: "corpo", pattern: "core", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Abdominal oblíquo", group: "abdomen", equipment: "corpo", pattern: "core", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Abdominal canivete", group: "abdomen", equipment: "corpo", pattern: "core", minLevel: "intermediario", impact: "baixo", joints: ["coluna"] },
  { name: "Abdominal na máquina", group: "abdomen", equipment: "maquina", pattern: "core", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Abdominal na polia", group: "abdomen", equipment: "polia", pattern: "core", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Prancha", group: "abdomen", equipment: "corpo", pattern: "core", minLevel: "iniciante", impact: "baixo", joints: [], timed: true },
  { name: "Prancha lateral", group: "abdomen", equipment: "corpo", pattern: "core", minLevel: "iniciante", impact: "baixo", joints: [], timed: true },
  { name: "Elevação de pernas na barra fixa", group: "abdomen", equipment: "estrutura", pattern: "core", minLevel: "avancado", impact: "baixo", joints: ["ombro", "coluna"] },
  { name: "Elevação de pernas deitado", group: "abdomen", equipment: "corpo", pattern: "core", minLevel: "intermediario", impact: "baixo", joints: ["coluna"] },
  { name: "Elevação de joelhos na paralela", group: "abdomen", equipment: "estrutura", pattern: "core", minLevel: "intermediario", impact: "baixo", joints: ["ombro"] },
  { name: "Roda abdominal", group: "abdomen", equipment: "acessorio", pattern: "core", minLevel: "avancado", impact: "baixo", joints: ["ombro", "coluna"] },
  { name: "Abdominal bicicleta", group: "abdomen", equipment: "corpo", pattern: "core", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Rotação russa", group: "abdomen", equipment: "corpo", pattern: "core", minLevel: "intermediario", impact: "baixo", joints: ["coluna"] },
  { name: "Elevação pélvica com barra", group: "gluteos", equipment: "barra", pattern: "dobrar_quadril", minLevel: "intermediario", impact: "baixo", joints: [], needsBench: true },
  { name: "Elevação pélvica com halter", group: "gluteos", equipment: "halter", pattern: "dobrar_quadril", minLevel: "iniciante", impact: "baixo", joints: [], needsBench: true },
  { name: "Elevação pélvica na máquina", group: "gluteos", equipment: "maquina", pattern: "dobrar_quadril", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Ponte de glúteos", group: "gluteos", equipment: "corpo", pattern: "dobrar_quadril", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Glúteo na polia (coice)", group: "gluteos", equipment: "polia", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Coice com caneleira", group: "gluteos", equipment: "acessorio", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Glúteo na máquina", group: "gluteos", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Cadeira abdutora", group: "gluteos", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Abdução de quadril na polia", group: "gluteos", equipment: "polia", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Agachamento sumô", group: "gluteos", equipment: "halter", pattern: "agachar", minLevel: "iniciante", impact: "baixo", joints: ["joelho"] },
  { name: "Extensão de quadril", group: "gluteos", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Elevação pélvica unilateral (peso do corpo)", group: "gluteos", equipment: "corpo", pattern: "dobrar_quadril", minLevel: "iniciante", impact: "baixo", joints: [], isNew: true },
  { name: "Bom-dia (good morning) sem peso", group: "gluteos", equipment: "corpo", pattern: "dobrar_quadril", minLevel: "iniciante", impact: "baixo", joints: ["coluna"], isNew: true },
  { name: "Agachamento livre com barra", group: "coxas", equipment: "barra", pattern: "agachar", minLevel: "intermediario", impact: "baixo", joints: ["joelho", "coluna"] },
  { name: "Agachamento no Smith", group: "coxas", equipment: "smith", pattern: "agachar", minLevel: "iniciante", impact: "baixo", joints: ["joelho"] },
  { name: "Agachamento frontal", group: "coxas", equipment: "barra", pattern: "agachar", minLevel: "avancado", impact: "baixo", joints: ["joelho", "coluna"] },
  { name: "Agachamento com halter (goblet)", group: "coxas", equipment: "halter", pattern: "agachar", minLevel: "iniciante", impact: "baixo", joints: ["joelho"] },
  { name: "Agachamento búlgaro", group: "coxas", equipment: "halter", pattern: "avanco", minLevel: "intermediario", impact: "baixo", joints: ["joelho"], needsBench: true },
  { name: "Agachamento hack", group: "coxas", equipment: "maquina", pattern: "agachar", minLevel: "iniciante", impact: "baixo", joints: ["joelho"] },
  { name: "Agachamento na máquina", group: "coxas", equipment: "maquina", pattern: "agachar", minLevel: "iniciante", impact: "baixo", joints: ["joelho"] },
  { name: "Agachamento na parede", group: "coxas", equipment: "corpo", pattern: "agachar", minLevel: "iniciante", impact: "baixo", joints: ["joelho"], timed: true },
  { name: "Leg press 45 graus", group: "coxas", equipment: "maquina", pattern: "agachar", minLevel: "iniciante", impact: "baixo", joints: ["joelho"] },
  { name: "Leg press horizontal", group: "coxas", equipment: "maquina", pattern: "agachar", minLevel: "iniciante", impact: "baixo", joints: ["joelho"] },
  { name: "Cadeira extensora", group: "coxas", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: ["joelho"] },
  { name: "Mesa flexora", group: "coxas", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Cadeira flexora", group: "coxas", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Flexora em pé", group: "coxas", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Stiff com barra", group: "coxas", equipment: "barra", pattern: "dobrar_quadril", minLevel: "intermediario", impact: "baixo", joints: ["coluna"] },
  { name: "Stiff com halteres", group: "coxas", equipment: "halter", pattern: "dobrar_quadril", minLevel: "iniciante", impact: "baixo", joints: ["coluna"] },
  { name: "Levantamento terra romeno", group: "coxas", equipment: "barra", pattern: "dobrar_quadril", minLevel: "intermediario", impact: "baixo", joints: ["coluna"] },
  { name: "Avanço com halteres", group: "coxas", equipment: "halter", pattern: "avanco", minLevel: "iniciante", impact: "baixo", joints: ["joelho"] },
  { name: "Avanço com barra", group: "coxas", equipment: "barra", pattern: "avanco", minLevel: "intermediario", impact: "baixo", joints: ["joelho", "coluna"] },
  { name: "Passada com halteres", group: "coxas", equipment: "halter", pattern: "avanco", minLevel: "iniciante", impact: "baixo", joints: ["joelho"] },
  { name: "Afundo no Smith", group: "coxas", equipment: "smith", pattern: "avanco", minLevel: "iniciante", impact: "baixo", joints: ["joelho"] },
  { name: "Subida no banco (step-up) com halteres", group: "coxas", equipment: "halter", pattern: "avanco", minLevel: "iniciante", impact: "baixo", joints: ["joelho"], needsBench: true },
  { name: "Cadeira adutora", group: "coxas", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Agachamento livre (peso do corpo)", group: "coxas", equipment: "corpo", pattern: "agachar", minLevel: "iniciante", impact: "baixo", joints: ["joelho"], isNew: true },
  { name: "Avanço (peso do corpo)", group: "coxas", equipment: "corpo", pattern: "avanco", minLevel: "iniciante", impact: "baixo", joints: ["joelho"], isNew: true },
  { name: "Panturrilha em pé na máquina", group: "panturrilha", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Panturrilha sentado", group: "panturrilha", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Panturrilha no leg press", group: "panturrilha", equipment: "maquina", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Panturrilha no Smith", group: "panturrilha", equipment: "smith", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Panturrilha em pé com halter", group: "panturrilha", equipment: "halter", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [] },
  { name: "Elevação de panturrilha em pé (peso do corpo)", group: "panturrilha", equipment: "corpo", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [], isNew: true },
  { name: "Elevação de panturrilha unilateral (peso do corpo)", group: "panturrilha", equipment: "corpo", pattern: "isolado", minLevel: "iniciante", impact: "baixo", joints: [], isNew: true },
  { name: "Burpee", group: "corpo_todo", equipment: "corpo", pattern: "corpo_todo", minLevel: "intermediario", impact: "alto", joints: ["joelho", "ombro"] },
  { name: "Agachamento com salto", group: "corpo_todo", equipment: "corpo", pattern: "agachar", minLevel: "intermediario", impact: "alto", joints: ["joelho"] },
  { name: "Kettlebell swing", group: "corpo_todo", equipment: "kettlebell", pattern: "dobrar_quadril", minLevel: "intermediario", impact: "baixo", joints: ["coluna"] },
  { name: "Thruster com halteres", group: "corpo_todo", equipment: "halter", pattern: "corpo_todo", minLevel: "intermediario", impact: "baixo", joints: ["joelho", "ombro"] },
  { name: "Clean com barra", group: "corpo_todo", equipment: "barra", pattern: "corpo_todo", minLevel: "avancado", impact: "baixo", joints: ["coluna", "ombro"] },
  { name: "Arranco (snatch)", group: "corpo_todo", equipment: "barra", pattern: "corpo_todo", minLevel: "avancado", impact: "baixo", joints: ["ombro", "coluna"] },
  { name: "Salto no caixote", group: "corpo_todo", equipment: "estrutura", pattern: "corpo_todo", minLevel: "intermediario", impact: "alto", joints: ["joelho"] },
  { name: "Polichinelo", group: "corpo_todo", equipment: "corpo", pattern: "corpo_todo", minLevel: "iniciante", impact: "alto", joints: ["joelho"] },
  { name: "Corda naval", group: "corpo_todo", equipment: "acessorio", pattern: "corpo_todo", minLevel: "intermediario", impact: "baixo", joints: ["ombro"], timed: true },
  { name: "Caminhada do fazendeiro", group: "corpo_todo", equipment: "halter", pattern: "corpo_todo", minLevel: "iniciante", impact: "baixo", joints: [], timed: true },
  { name: "Levantamento turco (get-up)", group: "corpo_todo", equipment: "kettlebell", pattern: "corpo_todo", minLevel: "avancado", impact: "baixo", joints: ["ombro"] },
];
