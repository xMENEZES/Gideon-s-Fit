import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { HOME_BY_KEY, type HomeKey } from "@/lib/auth/roles";
import { OpenApp } from "@/components/shared/open-app";

// Tela de abertura do app instalado: estática (responde na hora, mesmo com o servidor frio) e só
// leva a pessoa para a home dela. Quem abre "/" já logado cai aqui por rewrite no middleware.
export const metadata: Metadata = {
  title: "Abrindo | Gideon's Fit",
  robots: { index: false, follow: false },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(HOME_BY_KEY).map((destino) => ({ destino }));
}

export default async function Opening({ params }: { params: Promise<{ destino: string }> }) {
  const { destino } = await params;
  if (!(destino in HOME_BY_KEY)) notFound();
  const home = HOME_BY_KEY[destino as HomeKey];

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <div className="flex items-center gap-3 text-brand">
        <BrandMark className="h-12 w-auto" />
        <span className="text-3xl font-bold tracking-tight text-foreground">Gideon&apos;s Fit</span>
      </div>
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Abrindo...
      </p>
      <OpenApp home={home} />
    </main>
  );
}
