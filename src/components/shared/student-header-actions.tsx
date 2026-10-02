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
        confirmMessage={`Remover "${fullName}" do seu time? Todo o histórico dos protocolos de treino e alimentar que você montou para essa pessoa será apagado e isso não pode ser desfeito. A conta dela continua existindo.`}
        action={handleDelete}
      />
    </div>
  );
}
