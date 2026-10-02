"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NotebookPen } from "lucide-react";
import { toast } from "sonner";
import {
  updateProtocolNotesSchema,
  type UpdateProtocolNotesInput,
  type UpdateProtocolNotesFormInput,
} from "@/lib/validations/protocol.schema";
import { updateProtocolNotes } from "@/lib/actions/protocols";
import type { ProtocolType } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditProtocolNotesDialog({
  studentId,
  protocolId,
  type,
  notes,
}: {
  studentId: string;
  protocolId: string;
  type: ProtocolType;
  notes: string | null;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<UpdateProtocolNotesFormInput, unknown, UpdateProtocolNotesInput>({
    resolver: zodResolver(updateProtocolNotesSchema),
    defaultValues: { notes: notes ?? "" },
  });

  function handleOpenChange(next: boolean) {
    if (next) reset({ notes: notes ?? "" });
    setOpen(next);
  }

  async function onSubmit(values: UpdateProtocolNotesInput) {
    const result = await updateProtocolNotes(studentId, protocolId, type, values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" type="button" />}>
        <NotebookPen />
        {notes ? "Editar observações" : "Adicionar observações"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Observações gerais do protocolo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">
              Resumo técnico, conduta do período, recomendações essenciais...
            </Label>
            <Textarea id="notes" rows={8} {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
