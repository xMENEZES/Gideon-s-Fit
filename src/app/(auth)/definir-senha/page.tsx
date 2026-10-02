"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  definirSenhaSchema,
  type DefinirSenhaInput,
} from "@/lib/validations/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DefinirSenhaPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DefinirSenhaInput>({ resolver: zodResolver(definirSenhaSchema) });

  async function onSubmit(values: DefinirSenhaInput) {
    setServerError(null);
    const supabase = createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setServerError("Sessão expirada. Peça um novo convite ao seu profissional.");
      return;
    }

    const fullName = `${values.firstName} ${values.lastName}`.trim();

    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError("Não foi possível definir a senha. Peça um novo convite ao seu profissional.");
      return;
    }

    await supabase.from("profiles").update({ full_name: fullName }).eq("id", userData.user.id);

    window.location.href = "/";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete seu cadastro</CardTitle>
        <CardDescription>
          Informe seu nome e crie uma senha para acessar seu treino e sua dieta
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
            <Label htmlFor="firstName">Nome</Label>
            <Input id="firstName" autoComplete="given-name" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input id="lastName" autoComplete="family-name" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirme a senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar senha e entrar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
