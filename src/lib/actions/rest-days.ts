"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/dates";
import { restDayError } from "@/lib/rest-day";

// Marca ou desmarca um dia de descanso. Quem decide o acesso é o banco (RLS): só o dono do plano
// grava e apaga; o profissional só lê. O banco também recusa o dia que já tem exercício registrado.
export async function setRestDay(studentId: string, date: string, rest: boolean) {
  const invalid = restDayError(date, todayBR());
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  if (rest) {
    const { error } = await supabase.from("rest_days").insert({ student_id: studentId, rest_date: date });
    if (error) {
      if (error.message.includes("rest_day_has_workout")) {
        return { error: "Este dia já tem treino registrado." };
      }
      // Já estava marcado: o resultado é o mesmo que o pedido.
      if (error.code !== "23505") return { error: "Não foi possível marcar o dia de descanso." };
    }
  } else {
    const { error } = await supabase
      .from("rest_days")
      .delete()
      .eq("student_id", studentId)
      .eq("rest_date", date);
    if (error) return { error: "Não foi possível desmarcar o dia de descanso." };
  }

  revalidatePath("/aluno/status");
  revalidatePath("/meu-plano/status");
  revalidatePath(`/dashboard/alunos/${studentId}/status`);
  return { success: true };
}
