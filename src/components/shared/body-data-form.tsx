"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ageOn, birthDateBounds, birthDateStatus, MIN_AGE } from "@/lib/body-data";
import { todayBR } from "@/lib/dates";
import {
  bodyDataRequiredSchema,
  bodyDataSchema,
  type BodyDataFormInput,
  type BodyDataInput,
} from "@/lib/validations/body-data.schema";
import { deleteBodyData, saveBodyData } from "@/lib/actions/body-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type BodyDataFormInitial = {
  birthDate: string;
  heightCm: number | null;
  weightKg: number | null;
  consentedAt: string;
};

// Quem pode ver os dados além da própria pessoa:
// - "student": o profissional do time dela;
// - "standard": ninguém agora, mas o profissional passa a ver se ela entrar num time;
// - "trainer": ninguém.
export type BodyDataAudience = "student" | "standard" | "trainer";

const SHARING_TEXT: Record<BodyDataAudience, string | null> = {
  student: "Seu profissional pode ver estes dados (somente leitura).",
  standard: "Se você entrar no time de um profissional, ele poderá ver estes dados (somente leitura).",
  trainer: null,
};

function consentedOn(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function BodyDataForm({
  initial,
  audience,
  requireMeasures = false,
}: {
  initial: BodyDataFormInitial | null;
  audience: BodyDataAudience;
  // Altura e peso obrigatórios (o gerador de treino precisa dos três dados).
  requireMeasures?: boolean;
}) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const today = todayBR();
  const bounds = birthDateBounds(today);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BodyDataFormInput, unknown, BodyDataInput>({
    resolver: zodResolver(requireMeasures ? bodyDataRequiredSchema : bodyDataSchema),
    defaultValues: {
      birthDate: initial?.birthDate ?? "",
      heightCm: initial?.heightCm != null ? String(initial.heightCm) : "",
      weightKg: initial?.weightKg != null ? String(initial.weightKg).replace(".", ",") : "",
    },
  });

  const birthDate = useWatch({ control, name: "birthDate" });
  const age = typeof birthDate === "string" && birthDateStatus(birthDate, today) === "ok" ? ageOn(birthDate, today) : null;
  const sharing = SHARING_TEXT[audience];
  const needsConsent = initial === null;

  async function onSubmit(values: BodyDataInput) {
    const result = await saveBodyData(values, consent);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Dados salvos.");
    router.refresh();
  }

  async function onDelete() {
    setDeleting(true);
    const result = await deleteBodyData();
    setDeleting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setConfirmOpen(false);
    setConsent(false);
    reset({ birthDate: "", heightCm: "", weightKg: "" });
    toast.success("Seus dados foram apagados.");
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Meus Dados</CardTitle>
          <CardDescription>
            {requireMeasures
              ? "Para gerar o seu treino, informe a data de nascimento, a altura e o peso."
              : "Data de nascimento, altura e peso. Só a data de nascimento é obrigatória."}{" "}
            O recurso é para maiores de {MIN_AGE} anos.
            {/* Antes do aceite, o aviso de quem pode ver já está no texto do aceite. */}
            {sharing && !needsConsent ? ` ${sharing}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                autoComplete="bday"
                min={bounds?.min}
                max={bounds?.max}
                {...register("birthDate")}
              />
              {errors.birthDate ? (
                <p className="text-sm text-destructive">{errors.birthDate.message}</p>
              ) : age !== null ? (
                <p className="text-xs text-muted-foreground">Idade: {age} anos</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="heightCm">Altura (cm)</Label>
                <Input
                  id="heightCm"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Ex.: 175"
                  {...register("heightCm")}
                />
                {errors.heightCm && <p className="text-sm text-destructive">{errors.heightCm.message}</p>}
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="weightKg">Peso (kg)</Label>
                <Input
                  id="weightKg"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Ex.: 72,5"
                  {...register("weightKg")}
                />
                {errors.weightKg && <p className="text-sm text-destructive">{errors.weightKg.message}</p>}
              </div>
            </div>

            {needsConsent ? (
              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3">
                <Checkbox
                  id="consent"
                  className="mt-0.5"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                />
                <Label htmlFor="consent" className="text-sm font-normal leading-snug">
                  <span>
                    Autorizo o Gideon&apos;s Fit a guardar minha data de nascimento, altura e peso, que são
                    dados de saúde, e a usá-los somente para personalizar o meu treino.
                    {sharing ? ` ${sharing}` : ""} Posso apagá-los quando quiser. Veja a{" "}
                    <Link href="/privacidade" className="underline underline-offset-2">
                      Política de Privacidade
                    </Link>
                    .
                  </span>
                </Label>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Aceite do uso dos dados registrado em {consentedOn(initial.consentedAt)}.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={isSubmitting || (needsConsent && !consent)}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
              {initial && (
                <Button type="button" variant="outline" onClick={() => setConfirmOpen(true)}>
                  <Trash2 />
                  Apagar meus dados
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apagar meus dados?</DialogTitle>
            <DialogDescription>
              A data de nascimento, a altura e o peso serão apagados e o seu aceite será retirado. Para
              informá-los de novo, será preciso aceitar outra vez.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? "Apagando..." : "Apagar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
