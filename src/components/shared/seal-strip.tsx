import { createClient } from "@/lib/supabase/server";
import { loadEarnedSeals } from "@/lib/data/incentive";
import { bestSeals, sealDescription } from "@/lib/seals";
import type { SealLine } from "@/lib/types/database.types";
import { SealBadge } from "@/components/shared/seal-badge";

// Ícones dos selos no topo da tela diária: só o maior selo conquistado de cada linha que vale
// para aquela tela (no máximo 2), pequenos, com o nome ao segurar ou passar o mouse.
export async function SealStrip({ studentId, lines }: { studentId: string; lines: SealLine[] }) {
  const supabase = await createClient();
  const seals = bestSeals(await loadEarnedSeals(supabase, studentId), lines);
  if (seals.length === 0) return null;

  return (
    <ul className="flex items-center gap-2" aria-label="Selos conquistados">
      {seals.map((seal) => (
        <li key={seal.line} title={sealDescription(seal.line, seal.milestone)}>
          <SealBadge line={seal.line} milestone={seal.milestone} className="h-12 w-9" />
        </li>
      ))}
    </ul>
  );
}
