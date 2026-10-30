"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BedDouble } from "lucide-react";
import { toast } from "sonner";
import { setRestDay } from "@/lib/actions/rest-days";
import { Button } from "@/components/ui/button";

// Marca ou desmarca o dia de descanso (só a própria pessoa vê este botão). Depois de gravar, a tela
// recarrega os dados do servidor: a seleção do calendário continua onde estava.
export function RestDayButton({
  studentId,
  date,
  rest,
}: {
  studentId: string;
  date: string;
  rest: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setRestDay(studentId, date, !rest);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={toggle} className="self-start">
      <BedDouble />
      {pending ? "Salvando..." : rest ? "Desmarcar descanso" : "Marcar como dia de descanso"}
    </Button>
  );
}
