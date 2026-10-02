"use client";

import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { adminDeleteStudent } from "@/lib/actions/admin";

export function AdminStudentCard({
  student,
}: {
  student: { id: string; email: string; profiles: { full_name: string } | null };
}) {
  const fullName = student.profiles?.full_name ?? student.email;
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <User className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{fullName}</p>
          <p className="truncate text-sm text-muted-foreground">{student.email}</p>
        </div>
        <ConfirmDeleteButton
          confirmMessage={`Remover o aluno "${fullName}"? Essa ação não pode ser desfeita.`}
          action={() => adminDeleteStudent(student.id)}
        />
      </CardContent>
    </Card>
  );
}
