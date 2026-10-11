"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { quotaMessage } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUserId } from "@/lib/auth/session";
import { EDITABLE_EVENTS, MESSAGE_MAX, MESSAGE_MIN } from "@/lib/incentive";
import type { IncentiveEvent } from "@/lib/types/database.types";

const PATH = "/dashboard/mensagens";

const bodySchema = z
  .string()
  .trim()
  .min(MESSAGE_MIN, `Escreva ao menos ${MESSAGE_MIN} caracteres.`)
  .max(MESSAGE_MAX, `A mensagem pode ter no máximo ${MESSAGE_MAX} caracteres.`);

const eventSchema = z.enum(["workout", "diet", "day", "streak"]);

async function requireTrainer() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const profile = await getProfile();
  return profile?.role === "trainer" && profile.onboarded ? userId : null;
}

function parseEvent(raw: string): IncentiveEvent | null {
  const parsed = eventSchema.safeParse(raw);
  return parsed.success && EDITABLE_EVENTS.includes(parsed.data) ? parsed.data : null;
}

export async function addIncentiveMessage(rawEvent: string, rawBody: string) {
  const userId = await requireTrainer();
  if (!userId) return { error: "Apenas profissionais podem editar as mensagens." };
  const event = parseEvent(rawEvent);
  if (!event) return { error: "Tipo de mensagem inválido." };
  const body = bodySchema.safeParse(rawBody);
  if (!body.success) return { error: body.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("incentive_messages")
    .insert({ owner_id: userId, event, body: body.data });
  if (error) return { error: quotaMessage(error) ?? "Não foi possível salvar a mensagem." };

  revalidatePath(PATH);
  return { success: true };
}

export async function updateIncentiveMessage(id: string, patch: { body?: string; active?: boolean }) {
  const userId = await requireTrainer();
  if (!userId) return { error: "Apenas profissionais podem editar as mensagens." };

  const update: { body?: string; active?: boolean } = {};
  if (patch.body !== undefined) {
    const body = bodySchema.safeParse(patch.body);
    if (!body.success) return { error: body.error.issues[0].message };
    update.body = body.data;
  }
  if (patch.active !== undefined) update.active = !!patch.active;
  if (Object.keys(update).length === 0) return { success: true };

  const supabase = await createClient();
  const { error } = await supabase
    .from("incentive_messages")
    .update(update)
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) return { error: "Não foi possível salvar a mensagem." };

  revalidatePath(PATH);
  return { success: true };
}

export async function deleteIncentiveMessage(id: string) {
  const userId = await requireTrainer();
  if (!userId) return { error: "Apenas profissionais podem editar as mensagens." };

  const supabase = await createClient();
  const { error } = await supabase.from("incentive_messages").delete().eq("id", id).eq("owner_id", userId);
  if (error) return { error: "Não foi possível excluir a mensagem." };

  revalidatePath(PATH);
  return { success: true };
}

// Copia as mensagens padrão do sistema do evento para o conjunto do profissional (só quando
// ele ainda não tem nenhuma para esse evento), para ele editar a partir delas.
export async function customizeIncentiveEvent(rawEvent: string) {
  const userId = await requireTrainer();
  if (!userId) return { error: "Apenas profissionais podem editar as mensagens." };
  const event = parseEvent(rawEvent);
  if (!event) return { error: "Tipo de mensagem inválido." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("incentive_messages")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("event", event);
  if (count) return { error: "Você já tem mensagens para este tipo." };

  const { data: defaults } = await supabase
    .from("incentive_messages")
    .select("body")
    .is("owner_id", null)
    .eq("event", event)
    .eq("active", true);
  if (!defaults?.length) return { error: "Não há mensagem padrão para copiar." };

  const { error } = await supabase
    .from("incentive_messages")
    .insert(defaults.map((message) => ({ owner_id: userId, event, body: message.body })));
  if (error) return { error: quotaMessage(error) ?? "Não foi possível copiar as mensagens." };

  revalidatePath(PATH);
  return { success: true };
}

// Apaga as mensagens do profissional para o evento: os alunos voltam a ver as do sistema.
export async function resetIncentiveEvent(rawEvent: string) {
  const userId = await requireTrainer();
  if (!userId) return { error: "Apenas profissionais podem editar as mensagens." };
  const event = parseEvent(rawEvent);
  if (!event) return { error: "Tipo de mensagem inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("incentive_messages")
    .delete()
    .eq("owner_id", userId)
    .eq("event", event);
  if (error) return { error: "Não foi possível voltar ao padrão." };

  revalidatePath(PATH);
  return { success: true };
}
