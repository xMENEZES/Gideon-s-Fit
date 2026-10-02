"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { updateStudentSettings } from "@/lib/actions/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function StudentSettingsDialog({
  studentId,
  nickname,
  hasWorkout,
  hasDiet,
}: {
  studentId: string;
  nickname: string | null;
  hasWorkout: boolean;
  hasDiet: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [nicknameValue, setNicknameValue] = useState(nickname ?? "");
  const [workout, setWorkout] = useState(hasWorkout);
  const [diet, setDiet] = useState(hasDiet);
  const [pending, setPending] = useState(false);

  async function handleSave() {
    if (!workout && !diet) {
      toast.error("Habilite pelo menos Protoc. Treino ou Protoc. Alimentar para o aluno");
      return;
    }
    setPending(true);
    const result = await updateStudentSettings(studentId, {
      nickname: nicknameValue,
      hasWorkout: workout,
      hasDiet: diet,
    });
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Aluno atualizado");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Settings />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar aluno</DialogTitle>
          <DialogDescription>
            O apelido só aparece pra você — útil pra diferenciar alunos com o mesmo nome.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nickname">Apelido (opcional)</Label>
            <Input
              id="nickname"
              value={nicknameValue}
              onChange={(e) => setNicknameValue(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label>Módulos habilitados</Label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={workout} onCheckedChange={(c) => setWorkout(c === true)} />
              Protoc. Treino
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={diet} onCheckedChange={(c) => setDiet(c === true)} />
              Protoc. Alimentar
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
