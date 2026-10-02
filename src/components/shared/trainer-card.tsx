"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteTrainer } from "@/lib/actions/admin";

export function TrainerCard({
  trainer,
}: {
  trainer: { id: string; full_name: string; email: string; studentCount: number };
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <Link
          href={`/admin/profissionais/${trainer.id}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Users className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{trainer.full_name}</p>
            <p className="truncate text-sm text-muted-foreground">{trainer.email}</p>
            <Badge variant="secondary" className="mt-1">
              {trainer.studentCount} {trainer.studentCount === 1 ? "aluno" : "alunos"}
            </Badge>
          </div>
        </Link>
        <ConfirmDeleteButton
          confirmMessage={`Remover o profissional "${trainer.full_name}"? Essa ação não pode ser desfeita.`}
          action={() => deleteTrainer(trainer.id)}
          disabledReason={
            trainer.studentCount > 0
              ? "Remova os alunos deste profissional antes de excluí-lo."
              : undefined
          }
        />
      </CardContent>
    </Card>
  );
}
