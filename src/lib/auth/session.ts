import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_JWKS } from "@/lib/supabase/jwks";

// Valida o JWT localmente (sem ida à API de Auth quando o projeto usa chaves
// assimétricas) e é memoizado por requisição: layout e página compartilham o
// mesmo resultado em vez de repetir a verificação.
export const getSessionUserId = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims(undefined, { jwks: SUPABASE_JWKS });
  return data?.claims?.sub ?? null;
});

export const getProfile = cache(async () => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role, full_name, onboarded")
    .eq("id", userId)
    .single();
  return data;
});
