import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const GENERATE_WORKOUT_HREF = "/meu-plano/treino/gerar";

// Atalho para o assistente "Gerar meu treino" (Usuário Padrão), na tela de montagem do treino.
export function GenerateWorkoutButton({ variant = "outline" }: { variant?: "outline" | "default" }) {
  return (
    <Button variant={variant} nativeButton={false} render={<Link href={GENERATE_WORKOUT_HREF} />}>
      <Sparkles />
      Gerar meu treino
    </Button>
  );
}

// Convite mostrado quando ainda não há treino montado.
export function GenerateWorkoutCallout() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
      <div>
        <p className="font-medium">Quer ajuda para começar?</p>
        <p className="text-sm text-muted-foreground">
          Responda a algumas perguntas e receba uma sugestão de treino, que você pode editar depois.
        </p>
      </div>
      <GenerateWorkoutButton variant="default" />
    </div>
  );
}
