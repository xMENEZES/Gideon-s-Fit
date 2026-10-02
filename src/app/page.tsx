import Link from "next/link";
import { Dumbbell, LineChart, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Dumbbell,
    title: "Treinos organizados",
    description:
      "Estruture os dias de treino com séries, repetições, descanso e vídeo de execução de cada exercício.",
  },
  {
    icon: LineChart,
    title: "Progressão de carga",
    description:
      "Registre a carga de cada exercício e acompanhe a evolução em gráficos claros.",
  },
  {
    icon: UtensilsCrossed,
    title: "Protocolo alimentar",
    description:
      "Monte as refeições com opções e quantidades exatas de cada alimento.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2 text-brand">
          <Dumbbell className="size-6" strokeWidth={2.5} />
          <span className="text-xl font-bold tracking-tight text-foreground">Gideon&apos;s Fit</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" nativeButton={false} render={<Link href="/cadastro" />}>
            Criar conta
          </Button>
          <Button nativeButton={false} render={<Link href="/login" />}>
            Entrar
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-16 px-6 py-16 text-center">
        <div className="flex max-w-2xl flex-col items-center gap-5">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Protocolos de treino e alimentar{" "}
            <span className="text-primary">em um só lugar</span>
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            Organize a sua rotina de treino e alimentação ou acompanhe seus alunos
            com precisão. Tudo centralizado, sem planilhas e sem PDFs espalhados.
          </p>
          <div className="mt-2 flex gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/cadastro" />}>
              Criar conta
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
              Entrar
            </Button>
          </div>
        </div>

        <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center"
            >
              <feature.icon className="size-8 text-primary" strokeWidth={1.75} />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
