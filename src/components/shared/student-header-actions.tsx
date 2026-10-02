"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StudentSettingsDialog } from "@/components/shared/student-settings-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteStudent } from "@/lib/actions/students";

export function StudentHeaderActions({
  studentId,
  fullName,
  nickname,
  hasWorkout,
  hasDiet,
}: {
  studentId: string;
  fullName: string;
  nickname: string | null;
  hasWorkout: boolean;
  hasDiet: boolean;
}) {
  const router = useRouter();

  async function handleDelete() {
    const result = await deleteStudent(studentId);
    if (!result?.error) {
      toast.success("Aluno removido.");
      router.push("/dashboard");
    }
    return result;
  }

  return (
    <div className="flex items-center gap-1">
      <StudentSettingsDialog
        studentId={studentId}
        nickname={nickname}
        hasWorkout={hasWorkout}
        hasDiet={hasDiet}
      />
      <ConfirmDeleteButton
        confirmMessage={`Remover o aluno "${fullName}"? Essa ação não pode ser desfeita — todo o histórico de treino e dieta dele será apagado.`}
        action={handleDelete}
      />
    </div>
  );
}
