import { revalidatePath } from "next/cache";

// Um mesmo protocolo é exibido em até três áreas: a do profissional, a do aluno
// do time e a do Usuário Padrão (plano próprio). Revalidar um caminho que não
// existe para aquele usuário é inofensivo.
export function revalidateModule(studentId: string, module: "treino" | "dieta") {
  revalidatePath(`/dashboard/alunos/${studentId}/${module}`);
  revalidatePath(`/dashboard/alunos/${studentId}/${module}/historico`);
  revalidatePath(`/aluno/${module}`);
  revalidatePath(`/aluno/${module}/historico`);
  revalidatePath(`/meu-plano/${module}`);
  revalidatePath(`/meu-plano/${module}/historico`);
}
