"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

// O Supabase confirma convites/magic links pelo endpoint hospedado dele
// (/auth/v1/verify), que redireciona de volta pra cá com os tokens no
// fragment da URL (#access_token=...), não como querystring — o fragment
// nunca chega ao servidor, então a sessão só pode ser estabelecida aqui,
// no navegador, lendo window.location.hash.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);

    const errorDescription = params.get("error_description");
    if (errorDescription) {
      setError(errorDescription.replace(/\+/g, " "));
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      router.replace("/login");
      return;
    }

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setError("Não foi possível concluir o login. Peça um novo convite.");
          return;
        }
        window.location.href = "/definir-senha";
      });
  }, [router]);

  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {error ?? "Entrando..."}
      </CardContent>
    </Card>
  );
}
