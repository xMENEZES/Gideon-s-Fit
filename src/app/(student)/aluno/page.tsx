import { redirect } from "next/navigation";
import { getOwnTeamStudent } from "@/lib/data/students";

export default async function AlunoPage() {
  const student = await getOwnTeamStudent();

  if (student?.has_diet && !student.has_workout) {
    redirect("/aluno/dieta");
  }
  redirect("/aluno/treino");
}
