"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateTeamCode } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TeamCodeCard({ code }: { code: string | null }) {
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (code && !window.confirm("Gerar um novo código? O código atual deixa de funcionar.")) return;
    setPending(true);
    const result = await generateTeamCode();
    setPending(false);
    if (result?.error) toast.error(result.error);
  }

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o código e copie manualmente.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Código do seu time</CardTitle>
        <CardDescription>
          Envie este código para quem quiser entrar no seu time. Cada pessoa só entra depois que
          você aprovar a solicitação.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        {code ? (
          <>
            <span className="rounded-lg border border-border bg-muted px-4 py-2 font-mono text-xl font-bold tracking-widest">
              {code}
            </span>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={pending}>
              <RefreshCw className="size-4" />
              {pending ? "Gerando..." : "Gerar novo código"}
            </Button>
          </>
        ) : (
          <Button onClick={handleGenerate} disabled={pending}>
            {pending ? "Gerando..." : "Gerar código do time"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
