import type { SealLine } from "@/lib/types/database.types";
import { MILESTONES } from "@/lib/streaks";
import { SEAL_THEME, sealDescription } from "@/lib/seals";
import { cn } from "@/lib/utils";

// Selo de conquista em SVG (sem imagens externas). O escudo cresce a cada marco; a partir de
// 60 dias ganha louros e, a partir de 100, a coroa. Geometria e cores da arte do projeto,
// desenhadas em torno do centro do escudo.
const INK = "#d7e5ef";

function Glyph({ line, color }: { line: SealLine; color: string }) {
  if (line === "workout") {
    return (
      <g stroke={color} strokeWidth={5} strokeLinecap="round" fill="none">
        <path d="M-23 -2.5H23" />
        <path d="M-28 -13.5V8.5M-21 -17.5V12.5M21 -17.5V12.5M28 -13.5V8.5" />
      </g>
    );
  }
  if (line === "diet") {
    return (
      <g>
        <path d="M0 17.5Q-34 -5.5 0 -29.5Q34 -5.5 0 17.5Z" fill={color} />
        <path d="M0 17.5V-19.5M0 2.5l-13 -11M0 -6.5l12 -10" stroke="#e9f7d9" strokeWidth={2} fill="none" />
      </g>
    );
  }
  return (
    <g>
      <g stroke={color} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M-23 -7.5H-5M-20 -16.5V1.5M-14 -19.5V4.5M-8 -14.5V-0.5M5 -7.5H23M10 -19.5V4.5M17 -16.5V1.5" />
      </g>
      <path d="M0 21.5Q-15 0.5 0 -10.5Q15 0.5 0 21.5Z" fill="#5eae67" />
    </g>
  );
}

function Laurel({ color, side }: { color: string; side: 1 | -1 }) {
  const rotation = side === 1 ? -35 : 35;
  return (
    <g>
      <path d={`M${43 * side} 22.5Q${62 * side} -1.5 ${40 * side} -27.5`} fill="none" stroke={color} strokeWidth={3} />
      {[
        [43, 10.5],
        [45, -2.5],
        [47, -15.5],
      ].map(([x, y]) => (
        <ellipse
          key={y}
          cx={x * side}
          cy={y}
          rx={4}
          ry={8}
          transform={`rotate(${rotation} ${x * side} ${y})`}
          fill={color}
        />
      ))}
    </g>
  );
}

export function SealBadge({
  line,
  milestone,
  locked = false,
  className,
}: {
  line: SealLine;
  milestone: number;
  locked?: boolean;
  className?: string;
}) {
  const { color, fill } = SEAL_THEME[line];
  const tier = Math.max((MILESTONES as readonly number[]).indexOf(milestone), 0);
  const scale = 1 + 0.035 * tier;
  const strokeWidth = (2 + 0.35 * tier) / scale;
  const shieldTop = -63.5 * scale;

  return (
    <svg
      viewBox="-72 -96 144 192"
      role="img"
      aria-label={`${sealDescription(line, milestone)}${locked ? " (bloqueado)" : ""}`}
      className={cn(locked && "opacity-35 grayscale", className)}
    >
      <g transform={`scale(${scale})`}>
        <path
          d="M0 -63.5L49 -36.5L48 24.5L0 63.5L-48 24.5L-49 -36.5Z"
          fill={fill}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d="M0 -53.5L40 -31.5L39 20.5L0 52.5L-39 20.5L-40 -31.5Z"
          fill="none"
          stroke={INK}
          strokeOpacity={0.65}
          strokeWidth={1.5 / scale}
        />
        <path d="M0 -47.5l7 12l-7 8l-7 -8Z" fill={color} />
      </g>
      <Glyph line={line} color={color} />
      {tier >= 4 && (
        <>
          <Laurel color={color} side={-1} />
          <Laurel color={color} side={1} />
        </>
      )}
      {tier >= 5 && (
        <path
          d={`M-17 ${shieldTop}L-10 ${shieldTop - 15.3}L0 ${shieldTop - 3.5}L10 ${shieldTop - 15.3}L17 ${shieldTop}Z`}
          fill={color}
          stroke="#f7e9b7"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}
