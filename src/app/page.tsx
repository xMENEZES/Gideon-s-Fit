import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureCarousel } from "@/components/shared/feature-carousel";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-between gap-6 bg-background px-6 py-6 text-center sm:py-8 short:gap-3 short:py-3 tiny:gap-2 tiny:py-2">
      <header className="flex items-center gap-3 text-brand">
        <Dumbbell className="size-9 sm:size-11 short:size-7 tiny:size-6" strokeWidth={2.5} />
        <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl short:text-2xl tiny:text-xl">
          Gideon&apos;s Fit
        </span>
      </header>

      <main className="flex w-full flex-col items-center gap-6 sm:gap-8 short:gap-3 tiny:gap-2">
        <div className="flex max-w-2xl flex-col items-center gap-4 short:gap-2 tiny:gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl short:text-2xl tiny:text-xl">
            Protocolos de treino e alimentar{" "}
            <span className="text-primary">em um só lugar</span>
          </h1>
          <p className="max-w-lg text-base text-muted-foreground sm:text-lg short:text-sm tiny:hidden">
            Organize a sua rotina de treino e alimentação ou acompanhe seus alunos
            com precisão. Tudo centralizado, sem planilhas e sem PDFs espalhados.
          </p>
          <div className="mt-1 flex gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/cadastro" />}>
              Criar conta
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
              Entrar
            </Button>
          </div>
        </div>

        <FeatureCarousel />
      </main>

      <div aria-hidden="true" />
    </div>
  );
}
