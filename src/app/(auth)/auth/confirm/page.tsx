"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
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

// O link é lido direto da URL (useSearchParams), sem estado: o token só é validado quando a pessoa
// clica no botão. O Suspense é exigido pelo Next para ler a URL numa página estática.
export default function AuthConfirmPage() {
  return (
    <Suspense fallback={null}>
      <AuthConfirm />
    </Suspense>
  );
}

function AuthConfirm() {
  const search = useSearchParams();
  const tokenHash = search.get("token_hash");
  const type = search.get("type") as EmailOtpType | null;
  const params = tokenHash && type && VALID_TYPES.includes(type) ? { tokenHash, type } : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    window.location.assign(
      params.type === "recovery"
        ? "/redefinir-senha"
        : params.type === "invite"
          ? "/definir-senha"
          : "/"
    );
  }

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
