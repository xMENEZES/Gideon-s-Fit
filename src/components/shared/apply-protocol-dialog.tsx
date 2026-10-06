"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { applyToStudents } from "@/lib/actions/templates";
import { addDays, todayBR } from "@/lib/dates";
import type { ProtocolType } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export type StudentOption = { id: string; name: string };

const DURATION_PRESETS = [
  { label: "15 dias", days: 15 },
  { label: "1 mês", days: 30 },
  { label: "2 meses", days: 60 },
  { label: "3 meses", days: 90 },
];

// Aplica um modelo a vários alunos de uma vez. Cada aluno recebe uma cópia própria,
// que o profissional pode editar depois sem afetar o modelo nem os outros alunos.
export function ApplyProtocolDialog({
  sourceProtocolId,
  type,
  students,
  label = "Atribuir a alunos",
}: {
  sourceProtocolId: string;
  type: ProtocolType;
  students: StudentOption[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [endDate, setEndDate] = useState(() => addDays(todayBR(), 30));
  const [pending, setPending] = useState(false);
  const currentYear = Number(todayBR().slice(0, 4));

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleApply() {
    setPending(true);
    const result = await applyToStudents(sourceProtocolId, type, [...selected], endDate);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    const { applied = 0, failed = 0 } = result;
    toast.success(
      `Protocolo atribuído a ${applied} ${applied === 1 ? "aluno" : "alunos"}.` +
        (failed ? ` Não foi possível atribuir a ${failed}.` : "")
    );
    setSelected(new Set());
    setOpen(false);
  }

  const allSelected = students.length > 0 && selected.size === students.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Send />
        {label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir a alunos</DialogTitle>
          <DialogDescription>
            Cada aluno recebe uma cópia que você pode ajustar depois. O protocolo{" "}
            {type === "workout" ? "de treino" : "alimentar"} atual de quem for escolhido será encerrado
            e vai para o histórico.
          </DialogDescription>
        </DialogHeader>

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não tem alunos no seu time.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    setSelected(checked === true ? new Set(students.map((s) => s.id)) : new Set())
                  }
                />
                Selecionar todos
              </label>
              <div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-lg border border-border p-3">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selected.has(student.id)}
                      onCheckedChange={(checked) => toggle(student.id, checked === true)}
                    />
                    {student.name}
                  </label>
                ))}
              </div>
            </div>

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
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleApply} disabled={pending || selected.size === 0}>
            {pending
              ? "Atribuindo..."
              : `Atribuir${selected.size ? ` a ${selected.size} ${selected.size === 1 ? "aluno" : "alunos"}` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
