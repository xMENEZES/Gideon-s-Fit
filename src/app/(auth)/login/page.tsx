"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";
import {
  INVALID_MESSAGE,
  LOCKED_MESSAGE,
  RATE_LIMITED_MESSAGE,
  formatWait,
  type LoginResponse,
} from "@/lib/login-throttle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { PasswordInput } from "@/components/shared/password-input";
import { GoogleButton } from "@/components/shared/google-button";
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

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  // Espera imposta pelo servidor: de quanto, para qual e-mail, e o que falta (atualizado a cada segundo).
  const [lock, setLock] = useState<{ seconds: number; email: string; id: number } | null>(null);
  const [remaining, setRemaining] = useState(0);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const emailValue = useWatch({ control, name: "email" });

  useEffect(() => {
    if (!lock) return;
    const deadline = Date.now() + lock.seconds * 1000;
    const timer = setInterval(() => {
      const left = Math.ceil((deadline - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(timer);
        setLock(null);
        setRemaining(0);
        setServerError(null);
      } else {
        setRemaining(left);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lock]);

  // Com outro e-mail no campo, o botão volta: o servidor decide de novo e responde com a espera certa.
  const locked = lock !== null && remaining > 0 && lock.email === emailValue;

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    let data: LoginResponse | null = null;
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      data = (await response.json()) as LoginResponse;
    } catch {
      setServerError("Não foi possível entrar. Verifique a conexão e tente novamente.");
      return;
    }

    if (data.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    if (data.error === "rate_limited") {
      setServerError(RATE_LIMITED_MESSAGE);
      return;
    }
    if (data.retryAfter) {
      const seconds = data.retryAfter;
      setLock((prev) => ({ seconds, email: values.email, id: (prev?.id ?? 0) + 1 }));
      setRemaining(seconds);
    }
    setServerError(data.error === "locked" ? LOCKED_MESSAGE : INVALID_MESSAGE);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta do Gideon&apos;s Fit</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>
                {serverError}
                {locked && (
                  <>
                    {" "}
                    Tente de novo em <strong className="tabular-nums">{formatWait(remaining)}</strong>.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link href="/esqueci-senha" className="text-xs text-primary-ink hover:underline">
                Esqueci minha senha
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting || locked}>
            {isSubmitting ? "Entrando..." : locked ? `Aguarde ${formatWait(remaining)}` : "Entrar"}
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton label="Entrar com Google" />
          <p className="text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-medium text-primary-ink hover:underline">
              Criar conta
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
