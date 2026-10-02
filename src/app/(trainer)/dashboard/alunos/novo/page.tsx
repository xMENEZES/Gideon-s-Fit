"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  studentSchema,
  type StudentInput,
  type StudentFormInput,
} from "@/lib/validations/student.schema";
import { createStudentAndInvite } from "@/lib/actions/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NovoAlunoPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormInput, unknown, StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: { hasWorkout: true, hasDiet: true },
  });
  const hasWorkout = watch("hasWorkout");
  const hasDiet = watch("hasDiet");

  async function onSubmit(values: StudentInput) {
    setServerError(null);
    const result = await createStudentAndInvite(values);

    if (result?.error) {
      setServerError(result.error);
      return;
    }

    toast.success("Convite enviado! O aluno vai receber um email para criar a senha.");
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Novo aluno</CardTitle>
          <CardDescription>
            Ele receberá um email para criar o próprio nome e senha e acessar o treino e a dieta.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nickname">Apelido (opcional)</Label>
              <Input id="nickname" placeholder="Só você vê — útil pra diferenciar alunos com o mesmo nome" {...register("nickname")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="birthDate">Data de nascimento (opcional)</Label>
              <Input id="birthDate" type="date" {...register("birthDate")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea id="notes" rows={3} {...register("notes")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Módulos habilitados</Label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={hasWorkout}
                  onCheckedChange={(checked) => setValue("hasWorkout", checked === true)}
                />
                Treino
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={hasDiet}
                  onCheckedChange={(checked) => setValue("hasDiet", checked === true)}
                />
                Dieta
              </label>
              {errors.hasWorkout && (
                <p className="text-sm text-destructive">{errors.hasWorkout.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.push("/dashboard")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando convite..." : "Cadastrar e convidar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
