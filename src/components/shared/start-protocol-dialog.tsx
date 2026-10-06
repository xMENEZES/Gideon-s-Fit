"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { startNewProtocol } from "@/lib/actions/protocols";
import { startFromSource } from "@/lib/actions/templates";
import { addDays, todayBR } from "@/lib/dates";
import type { ProtocolType } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateField } from "@/components/shared/date-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DURATION_PRESETS = [
  { label: "15 dias", days: 15 },
  { label: "1 mês", days: 30 },
  { label: "2 meses", days: 60 },
  { label: "3 meses", days: 90 },
];

export type SourceOption = { id: string; name: string };

// Origem do conteúdo do novo protocolo: duplicar o atual, começar em branco, usar um
// modelo ou copiar o protocolo ativo de outro aluno. Em todos os casos o profissional
// pode editar o resultado à vontade depois.
export function StartProtocolDialog({
  studentId,
  type,
  hasActiveProtocol,
  templates = [],
  sourceStudents = [],
}: {
  studentId: string;
  type: ProtocolType;
  hasActiveProtocol: boolean;
  templates?: SourceOption[];
  sourceStudents?: SourceOption[];
}) {
  const [open, setOpen] = useState(false);
  const [endDate, setEndDate] = useState(() => addDays(todayBR(), 30));
  const [source, setSource] = useState(hasActiveProtocol ? "duplicate" : "blank");
  const [pending, setPending] = useState(false);
  const currentYear = Number(todayBR().slice(0, 4));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);

    let result;
    if (source.startsWith("template:")) {
      result = await startFromSource(
        studentId,
        type,
        { kind: "template", id: source.slice("template:".length) },
        endDate
      );
    } else if (source.startsWith("student:")) {
      result = await startFromSource(
        studentId,
        type,
        { kind: "student", id: source.slice("student:".length) },
        endDate
      );
    } else {
      result = await startNewProtocol(studentId, type, {
        endDate,
        duplicate: source === "duplicate",
      });
    }

    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Novo protocolo iniciado!");
    setOpen(false);
  }

  const hasChoices = hasActiveProtocol || templates.length > 0 || sourceStudents.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="w-full sm:w-auto" />}>
        <RefreshCw />
        Novo protocolo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasActiveProtocol ? "Novo protocolo" : "Iniciar protocolo"}</DialogTitle>
          <DialogDescription>
            {hasActiveProtocol
              ? "O protocolo atual será encerrado e vai para o histórico."
              : "Defina o período em que a pessoa deve seguir este plano."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Data de término</span>
            <DateField
              label="Término"
              value={endDate}
              onChange={setEndDate}
              minYear={currentYear}
              maxYear={currentYear + 3}
            />
            <div className="flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset.days}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setEndDate(addDays(todayBR(), preset.days))}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {hasChoices && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="protocol-source">Conteúdo inicial</Label>
              <select
                id="protocol-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 md:text-sm"
              >
                {hasActiveProtocol && <option value="duplicate">Duplicar o protocolo atual</option>}
                <option value="blank">Começar em branco</option>
                {templates.length > 0 && (
                  <optgroup label="Usar um modelo">
                    {templates.map((template) => (
                      <option key={template.id} value={`template:${template.id}`}>
                        {template.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {sourceStudents.length > 0 && (
                  <optgroup label="Copiar de outro aluno">
                    {sourceStudents.map((student) => (
                      <option key={student.id} value={`student:${student.id}`}>
                        {student.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="text-xs text-muted-foreground">
                Depois de criado, você pode editar tudo, inclusive quantidades e cargas.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Iniciando..." : "Iniciar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
