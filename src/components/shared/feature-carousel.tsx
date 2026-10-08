"use client";

import { useRef, useState } from "react";
import { Dumbbell, LineChart, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

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

// Um card por vez, com rolagem lateral (deslizar ou setas do teclado) e uma esfera por
// card na base indicando a posição. Cada card ocupa 100% da largura da faixa, então
// nunca aparece cortado.
export function FeatureCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div
      className="flex w-full max-w-md flex-col items-center gap-3 short:gap-1"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Recursos do app"
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        tabIndex={0}
        className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-xl outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-scrollbar]:hidden"
      >
        {features.map((feature) => (
          <div key={feature.title} className="w-full shrink-0 snap-center snap-always">
            <div className="flex h-full flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center short:gap-1 short:p-3">
              <feature.icon className="size-7 text-primary short:size-5" strokeWidth={1.75} />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center">
        {features.map((feature, index) => (
          <button
            key={feature.title}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Ver ${feature.title}`}
            aria-current={index === active}
            className="flex size-6 items-center justify-center"
          >
            <span
              className={cn(
                "size-2.5 rounded-full transition-colors",
                index === active ? "bg-primary" : "bg-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
