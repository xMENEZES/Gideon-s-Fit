"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  startProtocolSchema,
  type StartProtocolInput,
} from "@/lib/validations/protocol.schema";
import { startNewProtocol } from "@/lib/actions/protocols";
import type { ProtocolType } from "@/lib/types/database.types";
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

const DURATION_PRESETS = [
  { label: "15 dias", days: 15 },
  { label: "1 mês", days: 30 },
  { label: "2 meses", days: 60 },
  { label: "3 meses", days: 90 },
];

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function StartProtocolDialog({
  studentId,
  type,
  hasActiveProtocol,
}: {
  studentId: string;
  type: ProtocolType;
  hasActiveProtocol: boolean;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StartProtocolInput>({
    resolver: zodResolver(startProtocolSchema),
    defaultValues: { endDate: addDays(30), duplicate: hasActiveProtocol },
  });

  async function onSubmit(values: StartProtocolInput) {
    const result = await startNewProtocol(studentId, type, values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Novo protocolo iniciado!");
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <RefreshCw />
        Novo protocolo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasActiveProtocol ? "Novo protocolo" : "Iniciar protocolo"}</DialogTitle>
          <DialogDescription>
            {hasActiveProtocol
              ? "O protocolo atual será encerrado e vai para o histórico."
              : "Defina o período em que o aluno deve seguir este plano."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="endDate">Data de término</Label>
            <Input id="endDate" type="date" {...register("endDate")} />
            {errors.endDate && (
              <p className="text-sm text-destructive">{errors.endDate.message}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset.days}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setValue("endDate", addDays(preset.days))}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          {hasActiveProtocol && (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                defaultChecked
                onCheckedChange={(checked) => setValue("duplicate", checked === true)}
              />
              <span>
                Duplicar o conteúdo do protocolo atual (o profissional só ajusta o que mudou)
              </span>
            </label>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Iniciando..." : "Iniciar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
