"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { createTemplate, renameTemplate, saveAsTemplate } from "@/lib/actions/templates";
import type { ProtocolType } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TYPE_LABEL: Record<ProtocolType, string> = {
  workout: "Protocolo de treino",
  diet: "Protocolo alimentar",
};

// Cria um modelo em branco e abre o editor.
export function NewTemplateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ProtocolType>("workout");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await createTemplate(type, name);
    if (result?.error) {
      setPending(false);
      toast.error(result.error);
      return;
    }
    router.push(`/dashboard/modelos/${result.templateId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus />
        Novo modelo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo modelo</DialogTitle>
          <DialogDescription>
            Monte uma estrutura padrão uma vez e atribua a quantos alunos quiser.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="template-type">Tipo</Label>
            <select
              id="template-type"
              value={type}
              onChange={(e) => setType(e.target.value as ProtocolType)}
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 md:text-sm"
            >
              <option value="workout">{TYPE_LABEL.workout}</option>
              <option value="diet">{TYPE_LABEL.diet}</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="template-name">Nome do modelo</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Ex.: Hipertrofia iniciante ABC"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Criando..." : "Criar e editar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Guarda uma cópia do protocolo atual de um aluno como modelo.
export function SaveAsTemplateDialog({ protocolId }: { protocolId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await saveAsTemplate(protocolId, name);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Modelo salvo. Você o encontra em Modelos.");
    setName("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="w-full sm:w-auto" />}>
        <BookmarkPlus />
        Salvar como modelo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar como modelo</DialogTitle>
          <DialogDescription>
            Guarda uma cópia deste protocolo para você aplicar a outros alunos. Depois de salvo, o
            modelo é independente deste aluno.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="save-template-name">Nome do modelo</Label>
            <Input
              id="save-template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Ex.: Emagrecimento 1800 kcal"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Salvando..." : "Salvar modelo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RenameTemplateDialog({
  templateId,
  currentName,
}: {
  templateId: string;
  currentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [pending, setPending] = useState(false);

  async function handleRename(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await renameTemplate(templateId, name);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Pencil />
        <span className="sr-only">Renomear modelo</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear modelo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleRename} className="flex flex-col gap-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <DialogFooter>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
