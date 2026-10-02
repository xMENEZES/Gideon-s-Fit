"use client";

import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Destino dos links de e-mail (confirmação de cadastro e redefinição de senha).
// O link do e-mail traz um token de uso único (?token_hash=) que só é validado
// quando a pessoa clica no botão. Scanners de e-mail só fazem GET e não clicam,
// então não consomem o token — o que acontecia com o link padrão do Supabase.
const VALID_TYPES: EmailOtpType[] = ["signup", "recovery", "invite", "email", "magiclink", "email_change"];

const COPY: Record<string, { title: string; description: string; button: string }> = {
  recovery: {
    title: "Redefinir senha",
    description: "Clique no botão para escolher uma nova senha.",
    button: "Continuar",
  },
  default: {
    title: "Confirmar e-mail",
    description: "Clique no botão para confirmar o seu e-mail e entrar.",
    button: "Confirmar meu e-mail",
  },
};

export default function AuthConfirmPage() {
  const [params, setParams] = useState<{ tokenHash: string; type: EmailOtpType } | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const tokenHash = search.get("token_hash");
    const type = search.get("type") as EmailOtpType | null;
    if (tokenHash && type && VALID_TYPES.includes(type)) setParams({ tokenHash, type });
    setReady(true);
  }, []);

  async function handleConfirm() {
    if (!params) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: params.type,
    });
    if (verifyError) {
      setBusy(false);
      setError("Este link é inválido ou expirou. Peça um novo link e abra-o só uma vez.");
      return;
    }
    window.location.href =
      params.type === "recovery"
        ? "/redefinir-senha"
        : params.type === "invite"
          ? "/definir-senha"
          : "/";
  }

  if (!ready) return null;

  if (!params) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Link inválido. Peça um novo link e tente novamente.
        </CardContent>
      </Card>
    );
  }

  const copy = COPY[params.type] ?? COPY.default;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleConfirm} disabled={busy}>
          {busy ? "Aguarde..." : copy.button}
        </Button>
      </CardFooter>
    </Card>
  );
}
