import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Cliente com service_role — bypassa RLS. Uso EXCLUSIVO em Server Actions e
// Route Handlers (arquivos com "use server" ou route.ts), nunca em código
// que possa ser bundlado para o client. A env var SUPABASE_SERVICE_ROLE_KEY
// não tem prefixo NEXT_PUBLIC_ justamente para nunca ser exposta ao browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
