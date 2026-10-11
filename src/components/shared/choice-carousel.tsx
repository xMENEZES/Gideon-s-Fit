"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Alternativas de um alimento ("escolha 1"), um card por vez, com rolagem lateral (deslizar
// ou setas do teclado) e uma esfera por card na base indicando a posição. Mesma mecânica do
// carrossel da tela inicial: cada card ocupa 100% da largura da faixa, então nunca aparece
// cortado.
export function ChoiceCarousel({
  label,
  slides,
}: {
  label: string;
  slides: { key: string; name: string; content: React.ReactNode }[];
}) {
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
      className="flex min-w-0 flex-col gap-1.5"
      role="region"
      aria-roledescription="carrossel"
      aria-label={`${label}: escolha 1`}
    >
      <p className="text-sm font-semibold">
        {label} <span className="font-normal text-muted-foreground">· escolha 1</span>
      </p>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        tabIndex={0}
        className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-lg outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <div
            key={slide.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${slides.length}`}
            className="flex w-full shrink-0 snap-center snap-always flex-col"
          >
            {slide.content}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center">
        {slides.map((slide, index) => (
          <button
            key={slide.key}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Ver ${slide.name}`}
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
