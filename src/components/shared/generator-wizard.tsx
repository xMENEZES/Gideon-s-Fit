"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { previewGeneratedWorkout, saveGeneratedWorkout } from "@/lib/actions/generated-workout";
import { EXPERIENCE_OPTIONS, MAX_SEED, PLAN_WEEKS, type ExperienceValue } from "@/lib/workout-generator/answers";
import type { GeneratedPlan } from "@/lib/workout-generator/generate";
import {
  JOINTS,
  MAX_DAYS,
  MIN_DAYS,
  type Goal,
  type Location,
} from "@/lib/workout-generator/rules";
import type { Joint } from "@/lib/workout-generator/catalog";
import { GeneratedPlanPreview } from "@/components/shared/generated-plan-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const GOAL_OPTIONS: { value: Goal; title: string; description: string }[] = [
  { value: "ganhar_massa", title: "Ganhar massa muscular", description: "Treino mais pesado, com menos repetições." },
  { value: "emagrecer", title: "Emagrecer", description: "Mais repetições e cardio 3 vezes por semana." },
  { value: "condicionamento", title: "Condicionamento", description: "Mais repetições e cardio 2 vezes por semana." },
];

const LOCATION_OPTIONS: { value: Location; title: string; description: string }[] = [
  { value: "academia", title: "Academia completa", description: "Máquinas, polias, barras e halteres." },
  {
    value: "casa_halteres",
    title: "Em casa com halteres",
    description: "Só halteres (e kettlebell), sem banco, máquinas nem barra.",
  },
  { value: "casa_sem_equipamento", title: "Em casa sem equipamento", description: "Só o peso do corpo." },
];

const JOINT_LABEL: Record<Joint, string> = { joelho: "Joelho", ombro: "Ombro", coluna: "Coluna" };

const STEPS = ["experiência", "dias", "objetivo", "local", "dores"] as const;

type Draft = {
  experience?: ExperienceValue;
  daysPerWeek?: number;
  goal?: Goal;
  location?: Location;
  limitations: Joint[];
};

// Botão de escolha (um por opção), marcado com aria-pressed.
function ChoiceCard({
  selected,
  onClick,
  title,
  description,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "border-primary-ink bg-primary/10" : "border-border hover:bg-muted/50",
        className
      )}
    >
      <span className="font-medium">{title}</span>
      {description && <span className="text-sm text-muted-foreground">{description}</span>}
    </button>
  );
}

export function GeneratorWizard({
  summary,
  hasActiveWorkout,
}: {
  // Dados de Meus Dados que o gerador vai usar (só para mostrar).
  summary: { age: number; heightCm: number; weightKg: string };
  // Já existe um treino ativo com exercícios: ao usar o novo, o atual vai para o histórico.
  hasActiveWorkout: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({ limitations: [] });
  const [step, setStep] = useState(0);
  const [seed, setSeed] = useState(0);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [busy, setBusy] = useState<"preview" | "save" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const answered = [
    draft.experience !== undefined,
    draft.daysPerWeek !== undefined,
    draft.goal !== undefined,
    draft.location !== undefined,
    true, // dores ou lesões: pode ficar sem nenhuma
  ];

  function answers(forSeed: number) {
    return { ...draft, seed: forSeed };
  }

  async function generate(nextSeed: number) {
    setBusy("preview");
    const result = await previewGeneratedWorkout(answers(nextSeed));
    setBusy(null);
    if ("error" in result) {
      toast.error(result.error);
      // Os dados de Meus Dados mudaram ou sumiram: volta para o formulário.
      if ("needsData" in result && result.needsData) router.refresh();
      return;
    }
    setSeed(nextSeed);
    setPlan(result.plan);
  }

  async function save() {
    setBusy("save");
    const result = await saveGeneratedWorkout(answers(seed));
    if ("error" in result) {
      setBusy(null);
      setConfirmOpen(false);
      toast.error(result.error);
      return;
    }
    toast.success("Treino criado!");
    router.push("/meu-plano/treino");
    router.refresh();
  }

  function useThisWorkout() {
    if (hasActiveWorkout) setConfirmOpen(true);
    else void save();
  }

  function toggleJoint(joint: Joint) {
    setDraft((d) => ({
      ...d,
      limitations: d.limitations.includes(joint) ? d.limitations.filter((j) => j !== joint) : [...d.limitations, joint],
    }));
  }

  const summaryLine = (
    <p className="text-sm text-muted-foreground">
      Usando os seus dados: {summary.age} anos, {summary.heightCm} cm, {summary.weightKg} kg.{" "}
      <Link href="/conta/dados" className="font-medium text-primary-ink hover:underline">
        Alterar
      </Link>
    </p>
  );

  // ---------------------------------------------------------------- Prévia
  if (plan) {
    return (
      <div className="flex flex-col gap-4">
        <GeneratedPlanPreview plan={plan} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={useThisWorkout} disabled={busy !== null} className="sm:order-3">
            {busy === "save" ? "Salvando..." : "Usar este treino"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void generate((seed + 1) % (MAX_SEED + 1))}
          >
            <RefreshCw />
            {busy === "preview" ? "Gerando..." : "Gerar outra variação"}
          </Button>
          <Button type="button" variant="ghost" disabled={busy !== null} onClick={() => setPlan(null)}>
            <ArrowLeft />
            Voltar e ajustar
          </Button>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Trocar o seu treino atual?</DialogTitle>
              <DialogDescription>
                Você já tem um treino ativo. Ao usar este, o treino atual vai para o histórico (as cargas que você
                registrou ficam guardadas) e este passa a valer por {PLAN_WEEKS} semanas.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy !== null}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void save()} disabled={busy !== null}>
                {busy === "save" ? "Salvando..." : "Usar este treino"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ---------------------------------------------------------------- Perguntas
  const last = step === STEPS.length - 1;

  return (
    <div className="flex flex-col gap-5">
      {summaryLine}

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium">
          Pergunta {step + 1} de {STEPS.length}
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="presentation">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {step === 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="q-experience">
          <h2 id="q-experience" className="text-lg font-semibold">
            Você já treinou? Há quanto tempo?
          </h2>
          <div className="grid gap-2">
            {EXPERIENCE_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                title={option.label}
                selected={draft.experience === option.value}
                onClick={() => setDraft((d) => ({ ...d, experience: option.value }))}
              />
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-col gap-3" aria-labelledby="q-days">
          <h2 id="q-days" className="text-lg font-semibold">
            Quantos dias por semana você quer treinar?
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: MAX_DAYS - MIN_DAYS + 1 }, (_, i) => MIN_DAYS + i).map((days) => (
              <ChoiceCard
                key={days}
                title={String(days)}
                selected={draft.daysPerWeek === days}
                onClick={() => setDraft((d) => ({ ...d, daysPerWeek: days }))}
                className="items-center"
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Para quem está começando, o treino de força tem no máximo 4 dias por semana.
          </p>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-3" aria-labelledby="q-goal">
          <h2 id="q-goal" className="text-lg font-semibold">
            Qual é o seu objetivo?
          </h2>
          <div className="grid gap-2">
            {GOAL_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                title={option.title}
                description={option.description}
                selected={draft.goal === option.value}
                onClick={() => setDraft((d) => ({ ...d, goal: option.value }))}
              />
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-3" aria-labelledby="q-location">
          <h2 id="q-location" className="text-lg font-semibold">
            Onde você vai treinar?
          </h2>
          <div className="grid gap-2">
            {LOCATION_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                title={option.title}
                description={option.description}
                selected={draft.location === option.value}
                onClick={() => setDraft((d) => ({ ...d, location: option.value }))}
              />
            ))}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="flex flex-col gap-3" aria-labelledby="q-limits">
          <h2 id="q-limits" className="text-lg font-semibold">
            Você sente dor ou tem alguma lesão?
          </h2>
          <p className="text-sm text-muted-foreground">
            Marque as articulações com dor ou lesão. O treino evita os exercícios que mais as sobrecarregam. As
            respostas desta tela não ficam guardadas: só o treino gerado.
          </p>
          <div className="grid gap-2">
            <ChoiceCard
              title="Nenhuma"
              selected={draft.limitations.length === 0}
              onClick={() => setDraft((d) => ({ ...d, limitations: [] }))}
            />
            {JOINTS.map((joint) => (
              <ChoiceCard
                key={joint}
                title={JOINT_LABEL[joint]}
                selected={draft.limitations.includes(joint)}
                onClick={() => toggleJoint(joint)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || busy !== null}>
          <ArrowLeft />
          Voltar
        </Button>
        {last ? (
          <Button type="button" onClick={() => void generate(seed)} disabled={busy !== null}>
            {busy === "preview" ? "Gerando..." : "Gerar treino"}
          </Button>
        ) : (
          <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!answered[step]}>
            Continuar
            <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
