"use client";

import { deleteTemplate } from "@/lib/actions/templates";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";

export function DeleteTemplateButton({ templateId, name }: { templateId: string; name: string }) {
  return (
    <ConfirmDeleteButton
      confirmMessage={`Excluir o modelo "${name}"? Os alunos que já receberam este modelo continuam com as cópias deles.`}
      action={() => deleteTemplate(templateId)}
    />
  );
}
