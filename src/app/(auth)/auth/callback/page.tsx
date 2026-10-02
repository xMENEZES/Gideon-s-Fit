"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { chooseProfile } from "@/lib/actions/profile";
import { Card, CardContent } from "@/components/ui/card";

// Esta página recebe três tipos de retorno do Supabase:
//  - ?code=...        (PKCE): login com Google, confirmação de e-mail e link de
//                     redefinição de senha — a sessão é trocada aqui, no navegador.
//  - #access_token=.. (fragment): convites enviados pelo servidor. O fragment
//                     nunca chega ao servidor, então só dá pra ler aqui.
//  - ?error_description=.. : erro devolvido pelo Supabase.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function finish() {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      const errorDescription =
        url.searchParams.get("error_description") ?? hash.get("error_description");
      if (errorDescription) {
        setError(errorDescription.replace(/\+/g, " "));
        return;
      }

      const supabase = createClient();
      const code = url.searchParams.get("code");
      const next = url.searchParams.get("next");
      const perfil = url.searchParams.get("perfil");

      if (code) {
        // O cliente do navegador já troca o ?code= sozinho ao inicializar
        // (detectSessionInUrl) e getSession() espera essa troca terminar. Trocar
        // de novo falharia: o código é de uso único. Só tentamos manualmente se
        // a troca automática não tiver gerado sessão.
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setError(
              "Não foi possível concluir o login. Abra o link no mesmo navegador em que fez o pedido, ou peça um novo."
            );
            return;
          }
        }
      } else {
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        if (!accessToken || !refreshToken) {
          router.replace("/login");
          return;
        }
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setError("Não foi possível concluir o login. Peça um novo convite.");
          return;
        }
      }

      // Cadastro com Google: aplica o perfil escolhido antes de sair da página.
      // Falha silenciosa de propósito: se já havia perfil definido, segue normal.
      if (perfil === "trainer" || perfil === "standard") {
        await chooseProfile(perfil);
      }

      const destination = next && next.startsWith("/") ? next : code ? "/" : "/definir-senha";
      window.location.href = destination;
    }

    finish();
  }, [router]);

  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {error ?? "Entrando..."}
      </CardContent>
    </Card>
  );
}
