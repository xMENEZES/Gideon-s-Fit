import { revalidatePath } from "next/cache";

// Um mesmo protocolo é exibido em até três áreas: a do profissional, a do aluno
// do time e a do Usuário Padrão (plano próprio). Revalidar um caminho que não
// existe para aquele usuário é inofensivo.
export function revalidateModule(studentId: string, module: "treino" | "dieta") {
  revalidatePath(`/dashboard/alunos/${studentId}/${module}`);
  revalidatePath(`/dashboard/alunos/${studentId}/${module}/historico`);
  revalidatePath(`/aluno/${module}`);
  revalidatePath(`/aluno/${module}/historico`);
  revalidatePath(`/aluno/${module}/plano`);
  revalidatePath(`/meu-plano/${module}`);
  revalidatePath(`/meu-plano/${module}/historico`);
  revalidatePath(`/meu-plano/${module}/editar`);
  // Na tela de edição de modelos, o id do modelo ocupa o lugar do id do aluno.
  revalidatePath(`/dashboard/modelos/${studentId}`);
}

// As telas diárias mostram a mensagem de incentivo, que depende do treino E da alimentação do
// dia: registrar um deles pode concluir o dia e mudar a tela do outro.
export function revalidateDaily() {
  for (const path of ["/aluno/treino", "/aluno/dieta", "/meu-plano/treino", "/meu-plano/dieta"]) {
    revalidatePath(path);
  }
}
