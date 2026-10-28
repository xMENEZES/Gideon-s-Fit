"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HOME_HINT_COOKIE } from "@/lib/auth/roles";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(HOME_HINT_COOKIE);
  redirect("/login");
}
