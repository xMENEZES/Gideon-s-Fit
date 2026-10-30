import { useId } from "react";

// Logo do Gideon's Fit: um G cuja haste termina no centro de um halter. Usa a cor do texto
// (currentColor) e um entalhe transparente por máscara, então serve em qualquer fundo.
// A mesma geometria gerou os ícones do app (public/icons, src/app/icon.png e apple-icon.png).
// Dimensione pela altura (ex.: className="h-7"): a largura acompanha a proporção.
export function BrandMark({ className }: { className?: string }) {
  const maskId = useId();
  return (
    <svg
      viewBox="13.38 22.5 93.25 75"
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Gideon's Fit"
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
        <rect width="120" height="120" fill="white" />
        <line x1="33.33" y1="42.45" x2="18.62" y2="27.75" stroke="black" strokeWidth="2.6" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path d="M73.4 41.38 A14 14 0 0 0 59.88 31 H35.88 A14 14 0 0 0 21.88 45 V75 A14 14 0 0 0 35.88 89 H59.88 A14 14 0 0 0 73.88 75 V63" fill="none" stroke="currentColor" strokeWidth="13" strokeLinejoin="round" />
        <path d="M55.88 63 H91.88" fill="none" stroke="currentColor" strokeWidth="12" />
        <path d="M60.38 68 L68.38 68 L68.38 76 L67.38 76 A7 7 0 0 0 60.38 69 Z" />
        <path d="M87.38 68 L79.38 68 L79.38 76 L80.38 76 A7 7 0 0 1 87.38 69 Z" />
        <rect x="53.43" y="49" width="6.5" height="28" rx="3" />
        <rect x="47.93" y="53" width="6.3" height="20" rx="2.6" />
        <rect x="43.13" y="58.5" width="3.5" height="9" rx="1.75" />
        <rect x="87.83" y="49" width="6.5" height="28" rx="3" />
        <rect x="93.53" y="53" width="6.3" height="20" rx="2.6" />
        <rect x="101.13" y="58.5" width="3.5" height="9" rx="1.75" />
      </g>
    </svg>
  );
}
